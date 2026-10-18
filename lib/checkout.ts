import { randomBytes } from "node:crypto";
import type Stripe from "stripe";

/** Checkout Sessions must live at least 30 minutes; this matches the unpaid-booking timeout. */
export const CHECKOUT_TTL_SECONDS = 30 * 60;

/** Tags sessions in the Stripe Dashboard: a label plus 8 random letters (Stripe guidance). */
const integrationId = () =>
  `treedorm-booking-${Array.from(randomBytes(8), (b) => String.fromCharCode(97 + (b % 26))).join("")}`;

/**
 * Stripe-hosted Checkout for one booking (SPEC §7): one line item (listing name, price, shop name),
 * the buyer's email pre-filled, and `capture_method: "manual"` so the card is only authorized — it's
 * captured after the proof-photo check. Stripe's default look; no custom branding.
 * No `payment_method_types`: Stripe shows the methods enabled in the Dashboard.
 */
export function checkoutSessionParams(opts: {
  orderId: string;
  listingTitle: string;
  shopName: string;
  slotLabel: string;
  customText?: string;
  amountCents: number;
  buyerEmail: string;
  origin: string;
  listingPath: string;
  now?: Date;
}): Stripe.Checkout.SessionCreateParams {
  const { orderId, origin } = opts;
  return {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: opts.amountCents,
          product_data: {
            name: opts.listingTitle,
            description: [
              `${opts.shopName} · ${opts.slotLabel}`,
              opts.customText ? `Says: “${opts.customText}”` : "",
            ]
              .filter(Boolean)
              .join(" — "),
          },
        },
      },
    ],
    customer_email: opts.buyerEmail,
    client_reference_id: orderId,
    metadata: { orderId },
    payment_intent_data: {
      capture_method: "manual",
      description: `${opts.shopName} — ${opts.listingTitle}`,
      metadata: { orderId },
    },
    success_url: `${origin}/orders/${orderId}?paid=1`,
    cancel_url: `${origin}/checkout/${orderId}/cancel?back=${encodeURIComponent(opts.listingPath)}`,
    expires_at: Math.floor((opts.now ?? new Date()).getTime() / 1000) + CHECKOUT_TTL_SECONDS,
    integration_identifier: integrationId(),
  };
}
