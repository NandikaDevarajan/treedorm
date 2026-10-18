import { ObjectId, type WithId } from "mongodb";
import type Stripe from "stripe";
import { checkoutSessionParams } from "@/lib/checkout";
import {
  collections,
  type ListingDoc,
  type OrderDoc,
  type OrderStatus,
  type ShopDoc,
} from "@/lib/collections";
import { formatCents } from "@/lib/money";
import { buildSlots, formatSlot, type Slot } from "@/lib/slots";
import { stripe } from "@/lib/stripe";

/** Unpaid checkouts give their slot back after this long (same as the Checkout Session lifetime). */
export const PENDING_TTL_MS = 30 * 60 * 1000;

/** Orders that occupy their time slot. */
export const SLOT_HOLDING: OrderStatus[] = [
  "pending_payment",
  "authorized",
  "service_done",
  "checking",
  "passed",
  "mismatch",
  "captured",
  "partially_refunded",
];

export const slotKey = (shopId: ObjectId, start: Date) => `${shopId.toHexString()}|${start.toISOString()}`;

/** Expires unpaid checkouts older than PENDING_TTL_MS: frees the slot and closes the Checkout Session. */
export async function expireStalePending(filter: { shopId?: ObjectId } = {}) {
  const { orders } = await collections();
  const stale = await orders
    .find({ ...filter, status: "pending_payment", createdAt: { $lt: new Date(Date.now() - PENDING_TTL_MS) } })
    .toArray();
  for (const o of stale) {
    const res = await orders.updateOne(
      { _id: o._id, status: "pending_payment" },
      { $set: { status: "expired", settledAt: new Date() }, $unset: { slotKey: "" } },
    );
    if (res.modifiedCount && o.stripe.checkoutSessionId) {
      await stripe()
        .checkout.sessions.expire(o.stripe.checkoutSessionId)
        .catch(() => {}); // may already be expired
    }
  }
}

/** Slots for a listing with booked ones marked unavailable. */
export async function slotsFor(
  shop: WithId<ShopDoc>,
  listing: WithId<ListingDoc>,
  now = new Date(),
): Promise<Slot[]> {
  await expireStalePending({ shopId: shop._id });
  const { orders } = await collections();
  const booked = await orders
    .find(
      { shopId: shop._id, status: { $in: SLOT_HOLDING }, "slot.end": { $gt: now } },
      { projection: { slot: 1 } },
    )
    .toArray();
  return buildSlots({
    availability: shop.availability,
    durationMin: listing.durationMin,
    booked: booked.map((b) => b.slot),
    now,
  });
}

/**
 * Keeps a pending order in step with its Checkout Session. The webhook does this normally; this also
 * runs when the buyer lands back on the order, so a missed or delayed webhook can't leave it stuck.
 */
export async function syncOrderWithStripe(order: WithId<OrderDoc>): Promise<WithId<OrderDoc>> {
  if (order.status !== "pending_payment" || !order.stripe.checkoutSessionId) return order;
  try {
    const session = await stripe().checkout.sessions.retrieve(order.stripe.checkoutSessionId);
    if (session.status === "complete") return (await authorizeFromCheckout(session)) ?? order;
    if (session.status === "expired") return (await expireCheckout(session.id)) ?? order;
  } catch (err) {
    console.error("[orders] couldn't sync with Stripe:", err);
  }
  return order;
}

/**
 * Checkout finished (webhook `checkout.session.completed`, or a sync). With manual capture the card is
 * authorized, not charged: confirm the PaymentIntent is `requires_capture`, save its id for capturing
 * after the photo check, mark the order authorized and open the private chat. Idempotent.
 */
export async function authorizeFromCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  const piId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!orderId || !ObjectId.isValid(orderId) || !piId) return null;
  const pi = await stripe().paymentIntents.retrieve(piId);
  if (pi.status !== "requires_capture") {
    console.warn(
      `[orders] checkout ${session.id} completed but its PaymentIntent is ${pi.status}; not authorizing`,
    );
    return null;
  }
  const { orders } = await collections();
  const order = await orders.findOneAndUpdate(
    { _id: new ObjectId(orderId), status: "pending_payment", "stripe.checkoutSessionId": session.id },
    { $set: { status: "authorized", "stripe.paymentIntentId": pi.id } },
    { returnDocument: "after" },
  );
  if (order) await openThread(order); // only the call that flipped the status gets here
  return order;
}

/** Checkout expired unpaid (webhook `checkout.session.expired`, or a sync). Frees the slot. Idempotent. */
export async function expireCheckout(sessionId: string) {
  const { orders } = await collections();
  return orders.findOneAndUpdate(
    { "stripe.checkoutSessionId": sessionId, status: "pending_payment" },
    { $set: { status: "expired", settledAt: new Date() }, $unset: { slotKey: "" } },
    { returnDocument: "after" },
  );
}

/** Buyer backed out on Stripe's page (cancel_url): cancel the order, free the slot, close the session. */
export async function cancelPendingOrder(orderId: string, buyerId: string) {
  if (!ObjectId.isValid(orderId) || !ObjectId.isValid(buyerId)) return null;
  const { orders } = await collections();
  const order = await orders.findOneAndUpdate(
    { _id: new ObjectId(orderId), buyerId: new ObjectId(buyerId), status: "pending_payment" },
    { $set: { status: "canceled", settledAt: new Date() }, $unset: { slotKey: "" } },
    { returnDocument: "after" },
  );
  if (order?.stripe.checkoutSessionId) {
    await stripe()
      .checkout.sessions.expire(order.stripe.checkoutSessionId)
      .catch(() => {});
  }
  return order;
}

/** Hold canceled at Stripe after authorization (webhook `payment_intent.canceled`). Frees the slot. Idempotent. */
export async function markCanceled(paymentIntentId: string) {
  const { orders } = await collections();
  return orders.findOneAndUpdate(
    {
      "stripe.paymentIntentId": paymentIntentId,
      status: { $in: ["pending_payment", "authorized", "service_done"] },
    },
    [
      {
        $set: {
          status: { $cond: [{ $eq: ["$status", "pending_payment"] }, "expired", "canceled"] },
          settledAt: "$$NOW",
        },
      },
      { $unset: "slotKey" },
    ],
    { returnDocument: "after" },
  );
}

export async function systemMessage(threadId: ObjectId, body: string) {
  const { threads, messages } = await collections();
  const now = new Date();
  await messages.insertOne({ _id: new ObjectId(), threadId, senderId: null, body, createdAt: now });
  await threads.updateOne({ _id: threadId }, { $set: { lastMessageAt: now, lastMessage: body } });
}

/** The private buyer–seller chat for an order, with the booking note (SPEC §3.2 step 7). */
async function openThread(order: WithId<OrderDoc>) {
  if (order.threadId) return;
  const { threads, orders, listings } = await collections();
  const listing = await listings.findOne({ _id: order.listingId });
  const thread = await threads.insertOne({
    _id: new ObjectId(),
    orderId: order._id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    lastMessageAt: new Date(),
    createdAt: new Date(),
  });
  await orders.updateOne({ _id: order._id }, { $set: { threadId: thread.insertedId } });
  await systemMessage(
    thread.insertedId,
    `New booking: ${listing?.title ?? "listing"} (${formatCents(order.amountCents)}) for ${formatSlot(order.slot.start)}.` +
      (order.customText ? ` It should say: “${order.customText}”.` : "") +
      " The card is held, not charged, until the order is verified. Use this chat for the exact place, room number and any details — only the two of you can see it.",
  );
}

export class BookingError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Books a slot (SPEC §7 POST /api/orders): checks the slot is still free, creates the order (holding
 * the slot), then a Stripe-hosted Checkout Session with manual capture. Returns the Checkout URL; the
 * buyer is sent there in the same tab. The chat opens once the card is authorized.
 */
export async function createBooking(opts: {
  buyerId: string;
  buyerSchool: string;
  buyerEmail: string;
  listingId: string;
  slotStart: string;
  customText?: string;
  origin: string;
}) {
  const { listings, shops, orders } = await collections();
  if (!ObjectId.isValid(opts.listingId))
    throw new BookingError(404, "not_found", "That listing doesn't exist.");
  const listing = await listings.findOne({ _id: new ObjectId(opts.listingId), active: true });
  if (!listing) throw new BookingError(404, "not_found", "That listing isn't available any more.");
  const shop = await shops.findOne({ _id: listing.shopId });
  if (!shop) throw new BookingError(404, "not_found", "That treehouse doesn't exist.");
  const buyerId = new ObjectId(opts.buyerId);
  if (shop.ownerId.equals(buyerId))
    throw new BookingError(400, "own_shop", "You can't book your own treehouse.");
  if (shop.schoolDomain !== opts.buyerSchool) {
    throw new BookingError(403, "other_school", "You can only book treehouses at your school.");
  }

  const slot = (await slotsFor(shop, listing)).find(
    (s) => s.start === new Date(opts.slotStart).toISOString(),
  );
  if (!slot) throw new BookingError(400, "bad_slot", "That time isn't one of this treehouse's slots.");
  if (!slot.available)
    throw new BookingError(409, "slot_taken", "Someone just booked that time. Pick another one.");

  const customText = listing.customTextAllowed ? opts.customText?.trim() || undefined : undefined;
  const orderId = new ObjectId();
  const start = new Date(slot.start);
  const order: OrderDoc = {
    _id: orderId,
    buyerId,
    sellerId: shop.ownerId,
    shopId: shop._id,
    listingId: listing._id,
    slot: { start, end: new Date(slot.end) },
    ...(customText ? { customText } : {}),
    amountCents: listing.priceCents,
    status: "pending_payment",
    stripe: { paymentIntentId: "" },
    slotKey: slotKey(shop._id, start),
    createdAt: new Date(),
  };
  try {
    await orders.insertOne(order); // the unique slotKey stops two buyers taking the same slot
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new BookingError(409, "slot_taken", "Someone just booked that time. Pick another one.");
    }
    throw err;
  }

  try {
    const session = await stripe().checkout.sessions.create(
      checkoutSessionParams({
        orderId: orderId.toHexString(),
        listingTitle: listing.title,
        shopName: shop.name,
        slotLabel: formatSlot(start),
        customText,
        amountCents: listing.priceCents,
        buyerEmail: opts.buyerEmail,
        origin: opts.origin,
        listingPath: `/t/${shop.slug}/${listing._id.toHexString()}`,
      }),
      { idempotencyKey: `checkout-${orderId.toHexString()}` },
    );
    await orders.updateOne({ _id: orderId }, { $set: { "stripe.checkoutSessionId": session.id } });
    return { orderId: orderId.toHexString(), url: session.url! };
  } catch (err) {
    // Don't leave a slot held by an order that can't be paid.
    await orders.updateOne(
      { _id: orderId },
      { $set: { status: "canceled", settledAt: new Date() }, $unset: { slotKey: "" } },
    );
    console.error("[orders] booking failed:", err);
    throw new BookingError(
      502,
      "payment_setup_failed",
      "We couldn't set up the payment. Try again in a moment.",
    );
  }
}
