import { ObjectId, type WithId } from "mongodb";
import { collections, type OrderDoc, type Photo } from "@/lib/collections";
import { deletePhotos, isOwnUpload, proofFolder } from "@/lib/cloudinary";
import { formatCents } from "@/lib/money";
import { systemMessage } from "@/lib/orders";
import { decide, resolveChoice, type BuyerChoice } from "@/lib/release-decision";
import { stripe } from "@/lib/stripe";
import { runPhotoCheck } from "@/lib/vision";

export class SettleError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function audit(
  orderId: ObjectId,
  actor: "ai" | "buyer" | "system",
  action: string,
  inputs: Record<string, unknown>,
  outcome: string,
) {
  const { auditLog } = await collections();
  await auditLog.insertOne({ _id: new ObjectId(), orderId, actor, action, inputs, outcome, at: new Date() });
}

/**
 * After money moves (capture, partial capture or cancel): delete the proof photo from Cloudinary,
 * set settledAt and record the decision in audit_log.
 */
async function settle(
  order: WithId<OrderDoc>,
  outcome: {
    status: "captured" | "partially_refunded" | "canceled";
    capturedCents: number;
    action: "auto_capture" | "accept" | "partial" | "cancel";
    byUserId: ObjectId | null;
  },
) {
  const { orders } = await collections();
  const now = new Date();
  await orders.updateOne(
    { _id: order._id },
    {
      $set: {
        status: outcome.status,
        "stripe.capturedCents": outcome.capturedCents,
        resolution: { action: outcome.action, byUserId: outcome.byUserId, at: now },
        settledAt: now,
      },
      $unset: { settling: "", proofPhoto: "", ...(outcome.status === "canceled" ? { slotKey: "" } : {}) },
    },
  );
  if (order.proofPhoto) {
    await deletePhotos([order.proofPhoto.publicId]).catch((err) =>
      console.error("[settle] couldn't delete proof photo:", err),
    );
  }
  await audit(
    order._id,
    outcome.action === "auto_capture" ? "ai" : "buyer",
    outcome.action,
    {
      provider: order.check?.provider ?? null,
      verdict: order.check?.verdict ?? null,
      confidence: order.check?.confidence ?? null,
      textMatched: order.check?.textMatched ?? null,
      authorizedCents: order.amountCents,
      capturedCents: outcome.capturedCents,
      paymentIntentId: order.stripe.paymentIntentId,
    },
    `${outcome.status}; captured ${outcome.capturedCents} of ${order.amountCents}; proof photo deleted`,
  );
}

/**
 * Buyer submits a proof photo (SPEC §7 POST /api/orders/[id]/check). Runs the photo check,
 * applies lib/release-decision.ts, and auto-captures only on a confident pass; otherwise the order
 * waits for the buyer's choice. The check can release money but never refunds or cancels.
 */
export async function checkProofPhoto(orderId: string, buyerId: string, photo: Photo) {
  if (!ObjectId.isValid(orderId)) throw new SettleError(404, "not_found", "Order not found.");
  if (!isOwnUpload(photo, proofFolder(orderId)))
    throw new SettleError(400, "bad_photo", "That photo wasn't uploaded for this order.");
  const { orders, listings, shops } = await collections();
  // Claim the order: only one check at a time, and only on a held payment.
  const order = await orders.findOneAndUpdate(
    {
      _id: new ObjectId(orderId),
      buyerId: new ObjectId(buyerId),
      status: { $in: ["authorized", "service_done"] },
    },
    { $set: { status: "checking", proofPhoto: photo } },
    { returnDocument: "before" },
  );
  if (!order) throw new SettleError(409, "not_checkable", "This order can't be checked right now.");
  const previousStatus = order.status;
  const replacedPhoto =
    order.proofPhoto && order.proofPhoto.publicId !== photo.publicId ? order.proofPhoto : null;
  if (replacedPhoto) await deletePhotos([replacedPhoto.publicId]).catch(() => {});

  try {
    const listing = await listings.findOne({ _id: order.listingId });
    const shop = await shops.findOne({ _id: order.shopId }, { projection: { name: 1 } });
    const check = await runPhotoCheck({
      listingPhotoUrls: (listing?.photos ?? []).slice(0, 3).map((p) => p.url),
      proofPhotoUrl: photo.url,
      checkpoints: listing?.checkpoints ?? [],
      expectedText: order.customText,
      listingTitle: listing?.title,
    });
    const storedCheck = {
      provider: check.provider,
      verdict: check.verdict,
      confidence: check.confidence,
      reasons: check.reasons,
      ...(check.ocrText ? { ocrText: check.ocrText } : {}),
      ...(check.textMatched !== undefined ? { textMatched: check.textMatched } : {}),
      ...(check.fallbackReason ? { fallbackReason: check.fallbackReason } : {}),
      checkedAt: new Date(),
    };
    const decision = decide(check, {
      status: "checking",
      amountCents: order.amountCents,
      customText: order.customText,
      checkpointCount: listing?.checkpoints.length ?? 0,
    });
    await audit(
      order._id,
      "ai",
      "photo_check",
      {
        provider: check.provider,
        fallbackReason: check.fallbackReason ?? null,
        verdict: check.verdict,
        confidence: check.confidence,
        textMatched: check.textMatched ?? null,
        expectedText: order.customText ?? null,
        ocrText: check.ocrText ?? null,
      },
      `${decision.action}: ${decision.why}`,
    );

    if (decision.action === "auto_capture") {
      const fresh = { ...order, status: "checking" as const, proofPhoto: photo, check: storedCheck };
      await orders.updateOne(
        { _id: order._id },
        { $set: { check: storedCheck, status: "passed", settling: true } },
      );
      await stripe().paymentIntents.capture(
        order.stripe.paymentIntentId,
        { amount_to_capture: Math.min(decision.captureCents, order.amountCents) }, // never more than authorized
        { idempotencyKey: `capture-${order._id.toHexString()}` },
      );
      await settle(fresh, {
        status: "captured",
        capturedCents: order.amountCents,
        action: "auto_capture",
        byUserId: null,
      });
      await shops.updateOne({ _id: order.shopId }, { $inc: { "stats.aiVerified": 1 } });
      if (order.threadId)
        await systemMessage(
          order.threadId,
          `Photo check passed — Verified! ${formatCents(order.amountCents)} sent to ${shop?.name ?? "the seller"}.`,
        );
    } else {
      await orders.updateOne({ _id: order._id }, { $set: { check: storedCheck, status: "mismatch" } });
      if (order.threadId) {
        await systemMessage(
          order.threadId,
          "The photo check couldn't confirm a match, so the buyer is choosing what happens. The payment is still held.",
        );
      }
    }
    return { decision: decision.action, check: storedCheck };
  } catch (err) {
    // Put the order back so the buyer can try again; the hold is untouched.
    await orders.updateOne(
      { _id: order._id, status: { $in: ["checking", "passed"] } },
      { $set: { status: previousStatus }, $unset: { settling: "" } },
    );
    console.error("[settle] photo check failed:", err);
    throw new SettleError(
      502,
      "check_failed",
      "We couldn't finish the photo check. Your payment is still held — try again.",
    );
  }
}

/**
 * Buyer's choice after a mismatch/unsure check (SPEC §7 POST /api/orders/[id]/resolve):
 * accept (capture full), partial (capture only that amount; Stripe releases the rest) or cancel
 * (release the hold). Amount rules come from lib/release-decision.ts.
 */
export async function resolveOrder(orderId: string, buyerId: string, choice: BuyerChoice) {
  if (!ObjectId.isValid(orderId)) throw new SettleError(404, "not_found", "Order not found.");
  const { orders, shops } = await collections();
  const current = await orders.findOne({ _id: new ObjectId(orderId), buyerId: new ObjectId(buyerId) });
  if (!current) throw new SettleError(404, "not_found", "Order not found.");
  const plan = resolveChoice(choice, current);
  if (!plan.ok) throw new SettleError(400, "invalid_choice", plan.why);

  // Lock so a double tap can't capture or cancel twice.
  const order = await orders.findOneAndUpdate(
    { _id: current._id, status: "mismatch", settling: { $ne: true } },
    { $set: { settling: true } },
    { returnDocument: "after" },
  );
  if (!order) throw new SettleError(409, "busy", "This order is already being settled.");

  try {
    if (plan.stripe === "capture") {
      await stripe().paymentIntents.capture(
        order.stripe.paymentIntentId,
        { amount_to_capture: Math.min(plan.captureCents, order.amountCents) },
        { idempotencyKey: `capture-${order._id.toHexString()}` },
      );
    } else {
      await stripe().paymentIntents.cancel(
        order.stripe.paymentIntentId,
        {},
        { idempotencyKey: `cancel-${order._id.toHexString()}` },
      );
    }
    const action = choice.action;
    await settle(order, {
      status: plan.status,
      capturedCents: plan.captureCents,
      action,
      byUserId: order.buyerId,
    });
    const shop = await shops.findOne({ _id: order.shopId }, { projection: { name: 1 } });
    const note =
      action === "accept"
        ? `The buyer accepted the order. ${formatCents(plan.captureCents)} sent to ${shop?.name ?? "the seller"}.`
        : action === "partial"
          ? `The buyer chose a partial refund: ${formatCents(plan.captureCents)} sent to ${shop?.name ?? "the seller"}, ${formatCents(order.amountCents - plan.captureCents)} released back to the buyer.`
          : "The buyer canceled the order. The hold was released and nothing was charged.";
    if (order.threadId) await systemMessage(order.threadId, note);
    return { status: plan.status, capturedCents: plan.captureCents };
  } catch (err) {
    await orders.updateOne({ _id: order._id }, { $unset: { settling: "" } });
    console.error("[settle] resolve failed:", err);
    throw new SettleError(
      502,
      "stripe_failed",
      "Stripe couldn't complete that. Your payment is still held — try again.",
    );
  }
}

/** One review per settled order, by its buyer (SPEC §7 POST /api/reviews). Updates the shop's rating. */
export async function addReview(orderId: string, buyerId: string, rating: 1 | 2 | 3 | 4 | 5, body: string) {
  if (!ObjectId.isValid(orderId)) throw new SettleError(404, "not_found", "Order not found.");
  const { orders, reviews, shops } = await collections();
  const order = await orders.findOne({ _id: new ObjectId(orderId), buyerId: new ObjectId(buyerId) });
  if (!order) throw new SettleError(404, "not_found", "Order not found.");
  if (!["captured", "partially_refunded"].includes(order.status)) {
    throw new SettleError(409, "not_settled", "You can review an order once it's paid.");
  }
  try {
    await reviews.insertOne({
      _id: new ObjectId(),
      orderId: order._id,
      shopId: order.shopId,
      buyerId: order.buyerId,
      rating,
      body,
      createdAt: new Date(),
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000)
      throw new SettleError(409, "already_reviewed", "You've already reviewed this order.");
    throw err;
  }
  // New average from the old one, in one atomic update.
  await shops.updateOne({ _id: order.shopId }, [
    {
      $set: {
        "stats.ratingAvg": {
          $round: [
            {
              $divide: [
                { $add: [{ $multiply: ["$stats.ratingAvg", "$stats.reviewCount"] }, rating] },
                { $add: ["$stats.reviewCount", 1] },
              ],
            },
            2,
          ],
        },
        "stats.reviewCount": { $add: ["$stats.reviewCount", 1] },
      },
    },
  ]);
}
