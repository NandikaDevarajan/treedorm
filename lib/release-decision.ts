/**
 * Payment release rules (SPEC §8.5). Pure functions: no I/O, no clock, fully unit-tested.
 *
 * The photo check can RELEASE money (auto-capture a clear pass) but can never take it away: a
 * mismatch or unsure result never refunds or cancels on its own — the buyer always decides.
 */

export const AUTO_CAPTURE_MIN_CONFIDENCE = 0.8;

/** Statuses in which a proof photo may be checked. */
export const CHECKABLE_STATUSES = ["authorized", "service_done", "checking"] as const;

export interface CheckForDecision {
  verdict: "pass" | "mismatch" | "unsure";
  confidence: number;
  /** Only set when custom text was expected: whether the photo's text matched it. */
  textMatched?: boolean;
}

export interface OrderForDecision {
  status: string;
  amountCents: number;
  /** The words the buyer asked for (order.customText). */
  customText?: string;
  /** How many photo checkpoints the listing has. */
  checkpointCount: number;
}

export type Decision =
  | { action: "auto_capture"; captureCents: number; why: string }
  | { action: "ask_buyer"; why: string }
  | { action: "invalid"; why: string };

/** What the photo check result means for the money. */
export function decide(check: CheckForDecision, order: OrderForDecision): Decision {
  if (!(CHECKABLE_STATUSES as readonly string[]).includes(order.status)) {
    return { action: "invalid", why: `order is ${order.status}; photo checks only run on held payments` };
  }
  if (!Number.isInteger(order.amountCents) || order.amountCents <= 0) {
    return { action: "invalid", why: "order has no authorized amount" };
  }
  if (check.verdict !== "pass") {
    return {
      action: "ask_buyer",
      why: check.verdict === "mismatch" ? "photo didn't match the listing" : "photo check wasn't sure",
    };
  }
  if (!(check.confidence >= AUTO_CAPTURE_MIN_CONFIDENCE)) {
    return {
      action: "ask_buyer",
      why: `confidence ${check.confidence.toFixed(2)} is below ${AUTO_CAPTURE_MIN_CONFIDENCE}`,
    };
  }
  if (order.customText && check.textMatched !== true) {
    return { action: "ask_buyer", why: "the requested text didn't match" };
  }
  if (order.checkpointCount < 1) {
    return { action: "ask_buyer", why: "listing has no photo checkpoints to verify against" };
  }
  return { action: "auto_capture", captureCents: order.amountCents, why: "pass with high confidence" };
}

export type BuyerChoice =
  { action: "accept" } | { action: "partial"; partialCents: number } | { action: "cancel" };

export type Resolution =
  | { ok: true; stripe: "capture"; captureCents: number; status: "captured" | "partially_refunded" }
  | { ok: true; stripe: "cancel"; captureCents: 0; status: "canceled" }
  | { ok: false; why: string };

/** Statuses in which the buyer may choose (after a mismatch or unsure check). */
export const RESOLVABLE_STATUSES = ["mismatch"] as const;

/**
 * Turns the buyer's choice into exact Stripe instructions. Never captures more than authorized;
 * a partial amount must be a whole number of cents, more than $0 and less than the total.
 */
export function resolveChoice(
  choice: BuyerChoice,
  order: { status: string; amountCents: number },
): Resolution {
  if (!(RESOLVABLE_STATUSES as readonly string[]).includes(order.status)) {
    return { ok: false, why: `order is ${order.status}; only orders waiting on the buyer can be resolved` };
  }
  if (!Number.isInteger(order.amountCents) || order.amountCents <= 0)
    return { ok: false, why: "order has no authorized amount" };
  switch (choice.action) {
    case "accept":
      return { ok: true, stripe: "capture", captureCents: order.amountCents, status: "captured" };
    case "cancel":
      return { ok: true, stripe: "cancel", captureCents: 0, status: "canceled" };
    case "partial": {
      const p = choice.partialCents;
      if (!Number.isInteger(p)) return { ok: false, why: "partial amount must be whole cents" };
      if (p <= 0) return { ok: false, why: "partial amount must be more than $0" };
      if (p >= order.amountCents) return { ok: false, why: "partial amount must be less than the total" };
      return { ok: true, stripe: "capture", captureCents: p, status: "partially_refunded" };
    }
  }
}
