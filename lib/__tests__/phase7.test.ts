// @vitest-environment node
import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { groupBuyerOrders, type OrderCardData } from "@/lib/order-views";
import { buildSlots, formatSlot, zonedTime } from "@/lib/slots";
import { orderCreateBody } from "@/lib/validators";

describe("slots (Pacific time)", () => {
  // Saturday Oct 17 2026, 9:00 PDT = 16:00 UTC.
  const now = new Date("2026-10-17T16:00:00Z");
  const saturday4to8 = [{ day: 6 as const, start: "16:00", end: "20:00" }];

  it("converts shop wall-clock times to UTC, across DST", () => {
    expect(zonedTime(2026, 10, 17, "16:00").toISOString()).toBe("2026-10-17T23:00:00.000Z"); // PDT
    expect(zonedTime(2026, 12, 5, "16:00").toISOString()).toBe("2026-12-06T00:00:00.000Z"); // PST
  });

  it("splits the shop's hours into slots of the listing length", () => {
    const slots = buildSlots({ availability: saturday4to8, durationMin: 60, booked: [], now, days: 1 });
    expect(slots.map((s) => formatSlot(s.start))).toEqual([
      "Sat, Oct 17 · 4:00 PM",
      "Sat, Oct 17 · 5:00 PM",
      "Sat, Oct 17 · 6:00 PM",
      "Sat, Oct 17 · 7:00 PM",
    ]);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("greys out booked times and times inside the 2-hour lead", () => {
    const booked = [{ start: new Date("2026-10-18T00:00:00Z"), end: new Date("2026-10-18T01:00:00Z") }]; // 5pm PDT
    const at3pm = new Date("2026-10-17T22:00:00Z"); // 3pm PDT → 4pm is inside the lead time
    const slots = buildSlots({ availability: saturday4to8, durationMin: 60, booked, now: at3pm, days: 1 });
    expect(slots.map((s) => s.available)).toEqual([false, false, true, true]);
  });

  it("keeps start times on the half-hour grid for odd durations", () => {
    const slots = buildSlots({ availability: saturday4to8, durationMin: 40, booked: [], now, days: 1 });
    expect(slots.map((s) => formatSlot(s.start).split(" · ")[1])).toEqual([
      "4:00 PM",
      "5:00 PM",
      "6:00 PM",
      "7:00 PM",
    ]);
  });

  it("uses 30-minute pickup slots when a listing has no duration", () => {
    expect(buildSlots({ availability: saturday4to8, booked: [], now, days: 1 })).toHaveLength(8);
  });
});

describe("buyer order groups", () => {
  const base = (over: Partial<OrderCardData>): OrderCardData => ({
    id: Math.random().toString(36),
    status: "authorized",
    slotStart: "2026-10-20T00:00:00Z",
    slotEnd: "2026-10-20T01:00:00Z",
    amountCents: 2000,
    shop: { name: "Fade Lab", slug: "fade-lab" },
    listing: { title: "Skin fade" },
    other: { name: "Fade Lab", avatar: { base: "hedgehog", hat: null, sunglasses: null } },
    ...over,
  });
  it("sorts into upcoming, needs photo and settled", () => {
    const now = new Date("2026-10-18T00:00:00Z");
    const g = groupBuyerOrders(
      [
        base({ status: "authorized" }), // future → upcoming
        base({ status: "authorized", slotStart: "2026-10-17T00:00:00Z" }), // past → needs photo
        base({ status: "service_done" }),
        base({ status: "captured" }),
        base({ status: "expired" }),
      ],
      now,
    );
    expect([g.upcoming.length, g.needsPhoto.length, g.settled.length]).toEqual([1, 2, 2]);
  });
});

describe("booking request", () => {
  it("needs a real ISO time and caps custom text", () => {
    expect(orderCreateBody.safeParse({ listingId: "x", slotStart: "2026-10-18T00:00:00.000Z" }).success).toBe(
      true,
    );
    expect(orderCreateBody.safeParse({ listingId: "x", slotStart: "tomorrow" }).success).toBe(false);
    expect(
      orderCreateBody.safeParse({
        listingId: "x",
        slotStart: "2026-10-18T00:00:00Z",
        customText: "x".repeat(81),
      }).success,
    ).toBe(false);
  });
});

describe("Stripe webhook signature (SPEC §7)", () => {
  const secret = "whsec_test_secret";
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
  });
  const payload = JSON.stringify({
    id: "evt_1",
    object: "event",
    type: "customer.created",
    data: { object: {} },
  });
  const call = async (signature?: string) => {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    return POST(
      new Request("http://x/api/stripe/webhook", {
        method: "POST",
        body: payload,
        headers: signature ? { "stripe-signature": signature } : {},
      }),
    );
  };

  it("rejects missing and forged signatures", async () => {
    expect((await call()).status).toBe(400);
    expect((await call("t=1,v1=deadbeef")).status).toBe(400);
  });

  it("accepts a correctly signed event", async () => {
    const header = new Stripe("sk_test_dummy").webhooks.generateTestHeaderString({ payload, secret });
    expect((await call(header)).status).toBe(200);
  });
});

import { checkoutSessionParams } from "@/lib/checkout";

describe("Stripe Checkout Session (SPEC §7)", () => {
  const now = new Date("2026-10-17T16:00:00Z");
  const params = checkoutSessionParams({
    orderId: "abc123",
    listingTitle: "Custom birthday cake",
    shopName: "Sweet Dorm Bakes",
    slotLabel: "Fri, Oct 23 · 4:00 PM",
    customText: "Happy Birthday Maya",
    amountCents: 4000,
    buyerEmail: "demo.buyer@uw.edu",
    origin: "http://localhost:3000",
    listingPath: "/t/sweet-dorm-bakes/l1",
    now,
  });

  it("only authorizes the card (manual capture), with no payment_method_types", () => {
    expect(params.payment_intent_data?.capture_method).toBe("manual");
    expect(params.mode).toBe("payment");
    expect(params).not.toHaveProperty("payment_method_types");
  });

  it("has one line item with the listing name, price and shop, and pre-fills the email", () => {
    expect(params.line_items).toHaveLength(1);
    const item = params.line_items![0].price_data!;
    expect(item.unit_amount).toBe(4000);
    expect(item.product_data?.name).toBe("Custom birthday cake");
    expect(item.product_data?.description).toContain("Sweet Dorm Bakes");
    expect(params.customer_email).toBe("demo.buyer@uw.edu");
    expect(params.metadata?.orderId).toBe("abc123");
  });

  it("returns to the order on success and cancels back to the listing", () => {
    expect(params.success_url).toBe("http://localhost:3000/orders/abc123?paid=1");
    expect(params.cancel_url).toBe(
      "http://localhost:3000/checkout/abc123/cancel?back=%2Ft%2Fsweet-dorm-bakes%2Fl1",
    );
    expect(params.expires_at).toBe(Math.floor(now.getTime() / 1000) + 30 * 60);
    expect(params.integration_identifier).toMatch(/^treedorm-booking-[a-z]{8}$/);
  });
});
