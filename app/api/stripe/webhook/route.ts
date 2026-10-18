import type Stripe from "stripe";
import { authorizeFromCheckout, expireCheckout, markCanceled } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

/**
 * Stripe webhook (SPEC §7). No session: the request proves itself with Stripe's signature, checked
 * against STRIPE_WEBHOOK_SECRET on the raw body before anything is processed.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set; refusing webhook");
    return new Response("Webhook not configured", { status: 500 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch (err) {
    console.warn("[stripe] bad webhook signature:", (err as Error).message);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        // Manual capture: the card is authorized (payment_status stays "unpaid" until capture).
        // authorizeFromCheckout checks the PaymentIntent is requires_capture and saves its id.
        await authorizeFromCheckout(event.data.object);
        break;
      case "checkout.session.expired":
        await expireCheckout(event.data.object.id);
        break;
      case "payment_intent.canceled":
        // A held payment was released later (e.g. the buyer cancels after a mismatch, Phase 8).
        await markCanceled(event.data.object.id);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] webhook handling failed:", err);
    return new Response("Handler error", { status: 500 }); // Stripe retries
  }
  return Response.json({ received: true });
}
