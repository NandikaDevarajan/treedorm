import type Stripe from "stripe";
import { markAuthorized, markCanceled } from "@/lib/orders";
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
      case "payment_intent.amount_capturable_updated":
        // Manual capture: the card is authorized and the money is held.
        await markAuthorized(event.data.object.id);
        break;
      case "payment_intent.canceled":
        await markCanceled(event.data.object.id);
        break;
      case "payment_intent.payment_failed":
        // The buyer stays on checkout and can try another card; nothing to change.
        console.info(
          "[stripe] payment failed for",
          event.data.object.id,
          event.data.object.last_payment_error?.code,
        );
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
