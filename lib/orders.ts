import { ObjectId, type WithId } from "mongodb";
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

/** Unpaid checkouts give their slot back after this long. */
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

/** Expires unpaid checkouts older than PENDING_TTL_MS: frees the slot and cancels the Stripe hold. */
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
    if (res.modifiedCount && o.stripe.paymentIntentId) {
      await stripe()
        .paymentIntents.cancel(o.stripe.paymentIntentId)
        .catch(() => {}); // may already be canceled
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
 * Keeps an order in step with its PaymentIntent. The webhook does this normally; this also runs when
 * a buyer opens the order, so a missed or delayed webhook can't leave it stuck as "pending".
 */
export async function syncOrderWithStripe(order: WithId<OrderDoc>): Promise<WithId<OrderDoc>> {
  if (order.status !== "pending_payment" || !order.stripe.paymentIntentId) return order;
  try {
    const pi = await stripe().paymentIntents.retrieve(order.stripe.paymentIntentId);
    if (pi.status === "requires_capture") return (await markAuthorized(pi.id)) ?? order;
    if (pi.status === "canceled") return (await markCanceled(pi.id)) ?? order;
  } catch (err) {
    console.error("[orders] couldn't sync with Stripe:", err);
  }
  return order;
}

/** Hold succeeded (webhook `payment_intent.amount_capturable_updated`, or a sync). Idempotent. */
export async function markAuthorized(paymentIntentId: string) {
  const { orders } = await collections();
  const order = await orders.findOneAndUpdate(
    { "stripe.paymentIntentId": paymentIntentId, status: "pending_payment" },
    { $set: { status: "authorized" } },
    { returnDocument: "after" },
  );
  if (order?.threadId) {
    await systemMessage(
      order.threadId,
      "Payment held — the card is authorized, not charged. It's only charged once the order is verified.",
    );
  }
  return order;
}

/** Hold canceled or expired at Stripe (webhook `payment_intent.canceled`). Frees the slot. Idempotent. */
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
 * Books a slot (SPEC §7 POST /api/orders): checks the slot is still free, creates the order and a
 * Stripe PaymentIntent with manual capture (authorize now, capture after the photo check), and opens
 * the private chat with a booking note. Returns the order id and the PaymentIntent client secret.
 */
export async function createBooking(opts: {
  buyerId: string;
  buyerSchool: string;
  listingId: string;
  slotStart: string;
  customText?: string;
}) {
  const { listings, shops, orders, threads } = await collections();
  if (!ObjectId.isValid(opts.listingId))
    throw new BookingError(404, "not_found", "That listing doesn't exist.");
  const listing = await listings.findOne({ _id: new ObjectId(opts.listingId), active: true });
  if (!listing) throw new BookingError(404, "not_found", "That listing isn't available any more.");
  const shop = await shops.findOne({ _id: listing.shopId });
  if (!shop) throw new BookingError(404, "not_found", "That treehouse doesn't exist.");
  const buyerId = new ObjectId(opts.buyerId);
  if (shop.ownerId.equals(buyerId))
    throw new BookingError(400, "own_shop", "You can't book your own treehouse.");
  if (shop.schoolDomain !== opts.buyerSchool)
    throw new BookingError(403, "other_school", "You can only book treehouses at your school.");

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
    if ((err as { code?: number }).code === 11000)
      throw new BookingError(409, "slot_taken", "Someone just booked that time. Pick another one.");
    throw err;
  }

  try {
    const pi = await stripe().paymentIntents.create(
      {
        amount: listing.priceCents,
        currency: "usd",
        capture_method: "manual", // hold only; captured after the proof-photo check (SPEC §8.5)
        description: `${shop.name} — ${listing.title}`,
        metadata: {
          orderId: orderId.toHexString(),
          shopId: shop._id.toHexString(),
          listingId: listing._id.toHexString(),
        },
      },
      { idempotencyKey: `order-${orderId.toHexString()}` },
    );
    const thread = await threads.insertOne({
      _id: new ObjectId(),
      orderId,
      buyerId,
      sellerId: shop.ownerId,
      lastMessageAt: new Date(),
      createdAt: new Date(),
    });
    await orders.updateOne(
      { _id: orderId },
      { $set: { "stripe.paymentIntentId": pi.id, threadId: thread.insertedId } },
    );
    await systemMessage(
      thread.insertedId,
      `New booking: ${listing.title} (${formatCents(listing.priceCents)}) for ${formatSlot(start)}.` +
        (customText ? ` It should say: “${customText}”.` : "") +
        " Use this chat for the exact place, room number and any details — only the two of you can see it.",
    );
    return { orderId: orderId.toHexString(), clientSecret: pi.client_secret! };
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
