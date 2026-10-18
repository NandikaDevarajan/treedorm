import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { orderForUser } from "@/lib/order-access";
import { syncOrderWithStripe } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

/**
 * "Finish payment": sends the buyer back to their open Stripe Checkout page, or to the order if it's
 * already paid, expired or canceled. (Checkout itself is Stripe-hosted; there's no payment form here.)
 */
export default async function CheckoutRedirect({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { orderId } = await params;
  const access = await orderForUser(orderId, session.userId);
  if (!access || access.role !== "buyer") notFound();
  const order = await syncOrderWithStripe(access.order);
  if (order.status === "pending_payment" && order.stripe.checkoutSessionId) {
    const checkout = await stripe().checkout.sessions.retrieve(order.stripe.checkoutSessionId);
    if (checkout.status === "open" && checkout.url) redirect(checkout.url);
  }
  redirect(`/orders/${orderId}`);
}
