import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { CheckoutForm } from "@/components/booking/CheckoutForm";
import { CreamCard } from "@/components/woodland/CreamCard";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { formatCents } from "@/lib/money";
import { orderForUser } from "@/lib/order-access";
import { syncOrderWithStripe } from "@/lib/orders";
import { formatSlot } from "@/lib/slots";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Checkout · Tree Dorm" };

/** Checkout (SPEC §4): Stripe Payment Element in test mode; the card is authorized, not charged. */
export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { orderId } = await params;
  const access = await orderForUser(orderId, session.userId);
  if (!access || access.role !== "buyer") notFound();
  const order = await syncOrderWithStripe(access.order);
  if (order.status !== "pending_payment") redirect(`/orders/${orderId}`);

  const { shops, listings } = await collections();
  const [shop, listing] = await Promise.all([
    shops.findOne({ _id: order.shopId }),
    listings.findOne({ _id: order.listingId }),
  ]);
  const pi = await stripe().paymentIntents.retrieve(order.stripe.paymentIntentId);

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-safe pt-6 pb-12">
        <h1 className="font-display text-5xl leading-none text-bark">Hold your spot</h1>
        <CreamCard className="flex flex-col gap-1">
          <p className="text-lg font-bold text-bark">{listing?.title}</p>
          <p className="text-walnut/85">{shop?.name}</p>
          <p className="font-semibold">{formatSlot(order.slot.start)}</p>
          {order.customText && <p className="text-sm">It should say: “{order.customText}”</p>}
          <p className="mt-2 text-2xl font-bold">{formatCents(order.amountCents)}</p>
        </CreamCard>
        <div className="rounded-card border-2 border-leaf/40 bg-sage/30 p-4">
          <p className="font-bold">Your card is held, not charged, until your order is verified.</p>
          <p className="mt-1 text-sm text-walnut/90">
            After the service you snap a photo of the result. If it matches the listing, the payment goes
            through. If it doesn&apos;t, you choose what happens — nothing is charged without that.
          </p>
        </div>
        <CheckoutForm
          orderId={orderId}
          clientSecret={pi.client_secret!}
          publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""}
          amountLabel={formatCents(order.amountCents)}
        />
        <p className="text-center text-sm text-walnut/70">
          Test mode: use card 4242 4242 4242 4242, any future date, any CVC and ZIP.
        </p>
      </main>
    </LeafyBackground>
  );
}
