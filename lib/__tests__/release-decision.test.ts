// @vitest-environment node
import { describe, expect, it } from "vitest";
import { decide, resolveChoice, type OrderForDecision } from "@/lib/release-decision";

const order = (over: Partial<OrderForDecision> = {}): OrderForDecision => ({
  status: "service_done",
  amountCents: 4000,
  checkpointCount: 3,
  ...over,
});

describe("decide (SPEC §8.5)", () => {
  it("auto-captures the full amount on a confident pass", () => {
    expect(decide({ verdict: "pass", confidence: 0.92 }, order())).toEqual({
      action: "auto_capture",
      captureCents: 4000,
      why: "pass with high confidence",
    });
    expect(decide({ verdict: "pass", confidence: 0.8 }, order({ status: "authorized" })).action).toBe(
      "auto_capture",
    );
  });

  it("asks the buyer when confidence is low", () => {
    expect(decide({ verdict: "pass", confidence: 0.79 }, order()).action).toBe("ask_buyer");
    expect(decide({ verdict: "pass", confidence: Number.NaN }, order()).action).toBe("ask_buyer");
  });

  it("never acts on its own after a mismatch or unsure result", () => {
    expect(decide({ verdict: "mismatch", confidence: 0.99 }, order()).action).toBe("ask_buyer");
    expect(decide({ verdict: "unsure", confidence: 0.99 }, order()).action).toBe("ask_buyer");
  });

  it("asks the buyer when the requested text didn't match", () => {
    const o = order({ customText: "Happy Birthday Maya" });
    expect(decide({ verdict: "pass", confidence: 0.95, textMatched: false }, o).action).toBe("ask_buyer");
    expect(decide({ verdict: "pass", confidence: 0.95 }, o).action).toBe("ask_buyer"); // text never checked
    expect(decide({ verdict: "pass", confidence: 0.95, textMatched: true }, o).action).toBe("auto_capture");
  });

  it("asks the buyer when the listing has no checkpoints", () => {
    expect(decide({ verdict: "pass", confidence: 0.95 }, order({ checkpointCount: 0 })).action).toBe(
      "ask_buyer",
    );
  });

  it("refuses orders that aren't holding a payment", () => {
    for (const status of [
      "pending_payment",
      "captured",
      "canceled",
      "mismatch",
      "expired",
      "partially_refunded",
    ]) {
      expect(decide({ verdict: "pass", confidence: 0.99 }, order({ status })).action).toBe("invalid");
    }
    expect(decide({ verdict: "pass", confidence: 0.99 }, order({ amountCents: 0 })).action).toBe("invalid");
  });
});

describe("resolveChoice (buyer decides after a mismatch)", () => {
  const held = { status: "mismatch", amountCents: 4000 };

  it("accept captures exactly the authorized amount", () => {
    expect(resolveChoice({ action: "accept" }, held)).toEqual({
      ok: true,
      stripe: "capture",
      captureCents: 4000,
      status: "captured",
    });
  });

  it("cancel releases the hold and captures nothing", () => {
    expect(resolveChoice({ action: "cancel" }, held)).toEqual({
      ok: true,
      stripe: "cancel",
      captureCents: 0,
      status: "canceled",
    });
  });

  it("partial must be more than $0 and less than the total", () => {
    expect(resolveChoice({ action: "partial", partialCents: 2500 }, held)).toEqual({
      ok: true,
      stripe: "capture",
      captureCents: 2500,
      status: "partially_refunded",
    });
    expect(resolveChoice({ action: "partial", partialCents: 1 }, held).ok).toBe(true);
    expect(resolveChoice({ action: "partial", partialCents: 3999 }, held).ok).toBe(true);
    for (const bad of [0, -100, 4000, 4001, 25.5])
      expect(resolveChoice({ action: "partial", partialCents: bad }, held).ok).toBe(false);
  });

  it("never resolves an order that isn't waiting on the buyer", () => {
    for (const status of ["authorized", "service_done", "captured", "canceled"]) {
      expect(resolveChoice({ action: "accept" }, { status, amountCents: 4000 }).ok).toBe(false);
    }
  });
});
