import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { CheckResult } from "@/components/check/CheckResult";
import { ProofPhotoPanel } from "@/components/check/ProofPhotoPanel";
import { ResolveChoices } from "@/components/check/ResolveChoices";
import { ServiceDoneButton } from "@/components/orders/ServiceDoneButton";
import { Creature } from "@/components/woodland/Creature";
import { CreamCard } from "@/components/woodland/CreamCard";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { CREATURE_FOR } from "@/lib/creatures";
import { formatCents } from "@/lib/money";
import { orderForUser } from "@/lib/order-access";
import { STATUS_LABEL } from "@/lib/order-views";
import { syncOrderWithStripe } from "@/lib/orders";
import { formatSlot } from "@/lib/slots";

export const metadata: Metadata = { title: "Order · Tree Dorm" };

/** Order detail (SPEC §4) for its buyer or seller only. */
export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const access = await orderForUser(id, session.userId);
  if (!access) notFound();
  const order = await syncOrderWithStripe(access.order);
  const { role } = access;
  const { paid } = await searchParams;
  const { shops, listings, reviews } = await collections();
  const [shop, listing, review] = await Promise.all([
    shops.findOne({ _id: order.shopId }),
    listings.findOne({ _id: order.listingId }),
    reviews.findOne({ orderId: order._id }),
  ]);
  const shopName = shop?.name ?? "the seller";
  const captured = order.stripe.capturedCents ?? order.amountCents;
  const autoVerified = order.status === "captured" && order.resolution?.action === "auto_capture";
  const canReview =
    role === "buyer" && !review && (order.status === "captured" || order.status === "partially_refunded");

  const explain: Partial<Record<typeof order.status, string>> = {
    pending_payment: "Finish checkout to hold your spot. Unpaid bookings are released after 30 minutes.",
    authorized:
      role === "buyer"
        ? "Your card is held, not charged. After the service, you'll snap a photo of the result; if it matches, the payment goes through."
        : "The buyer's card is held. After the service, mark it done — the buyer then snaps a proof photo and the payment is released when it matches.",
    service_done:
      role === "buyer"
        ? "The seller marked this done. Next, snap a photo of the result so the payment can be released."
        : "Waiting for the buyer's proof photo. The payment is released when it matches the listing.",
    checking: "Checking the proof photo…",
    mismatch:
      role === "buyer"
        ? "The Photo check couldn't confirm a match. Your card is still held — choose what happens below."
        : "The Photo check couldn't confirm a match. The payment is still held while the buyer decides.",
    captured:
      order.resolution?.action === "auto_capture"
        ? `Verified by the Photo check. ${formatCents(captured)} sent to ${shopName}.`
        : `Paid: ${formatCents(captured)} sent to ${shopName}.`,
    partially_refunded: `Partly refunded: ${formatCents(captured)} sent to ${shopName}, ${formatCents(order.amountCents - captured)} released back to the buyer.`,
    canceled: "This order was canceled and the hold was released. Nothing was charged.",
    expired: "This booking expired before payment. Nothing was charged.",
  };

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-safe pt-6 pb-12">
        <Link
          href={role === "buyer" ? "/orders" : "/seller"}
          className="flex min-h-11 w-fit items-center gap-1.5 font-semibold text-bark underline-offset-4 hover:underline"
        >
          <span aria-hidden>←</span> {role === "buyer" ? "Your orders" : "Seller dashboard"}
        </Link>
        {paid && role === "buyer" && order.status === "authorized" && (
          <div role="status" className="rounded-card border-2 border-leaf/50 bg-sage/40 p-4">
            <p className="font-bold">You&apos;re booked!</p>
            <p className="text-sm">
              Your card is held, not charged, until your order is verified. Say hi to the seller in your chat.
            </p>
          </div>
        )}
        {autoVerified && role === "buyer" && (
          <section
            role="status"
            className="flex items-center gap-4 rounded-card border-2 border-leaf/50 bg-sage/40 p-5"
          >
            <Creature name={CREATURE_FOR.checkPassed} size={84} />
            <div className="flex flex-col gap-1">
              <p className="font-display text-3xl leading-tight text-bark">Verified!</p>
              <p className="font-semibold">Payment sent to {shopName}.</p>
              <p className="text-sm">Your proof photo matched the listing, so the payment went through.</p>
            </div>
          </section>
        )}
        <CreamCard className="flex flex-col gap-4 overflow-hidden p-0">
          {listing?.photos[0] && (
            <div className="relative aspect-[16/9] bg-almond">
              <Image src={listing.photos[0].url} alt="" fill sizes="576px" className="object-cover" />
            </div>
          )}
          <div className="flex flex-col gap-2 px-5 pb-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-4xl leading-tight text-bark">{listing?.title ?? "Order"}</h1>
              <span className="mt-1 text-2xl font-bold">{formatCents(order.amountCents)}</span>
            </div>
            <p className="text-walnut/85">
              {shop ? (
                <Link href={`/t/${shop.slug}`} className="font-semibold underline underline-offset-2">
                  {shop.name}
                </Link>
              ) : (
                "Treehouse"
              )}{" "}
              · {shop?.area}
            </p>
            <p className="font-semibold">{formatSlot(order.slot.start)}</p>
            {order.customText && (
              <p>
                It should say: <strong>“{order.customText}”</strong>
              </p>
            )}
            <p className="w-fit rounded-full bg-gold/35 px-3 py-1 text-sm font-bold">
              {STATUS_LABEL[order.status]}
            </p>
            {explain[order.status] && <p className="text-walnut/90">{explain[order.status]}</p>}
          </div>
        </CreamCard>

        <div className="flex flex-col gap-3">
          {paid && role === "buyer" && order.status === "pending_payment" && (
            <p role="status" className="rounded-2xl bg-almond px-4 py-3 text-sm">
              Confirming your payment with Stripe… refresh in a moment.
            </p>
          )}
          {role === "buyer" && order.status === "pending_payment" && (
            <WoodButton href={`/checkout/${id}`} size="lg">
              Finish payment
            </WoodButton>
          )}
          {role === "seller" && order.status === "authorized" && <ServiceDoneButton orderId={id} size="lg" />}
          {role === "buyer" && (order.status === "service_done" || order.status === "authorized") && (
            <ProofPhotoPanel orderId={id} />
          )}
          {order.status === "checking" && (
            <p role="status" className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 font-semibold">
              <Creature name={CREATURE_FOR.loading} size={40} /> Checking the proof photo…
            </p>
          )}
          {order.check && order.status !== "captured" && <CheckResult check={order.check} />}
          {order.status === "mismatch" && role === "buyer" && (
            <ResolveChoices orderId={id} amountCents={order.amountCents} shopName={shopName} />
          )}
          {canReview && (
            <CreamCard className="flex flex-col gap-2">
              <h2 className="font-display text-3xl text-bark">How was it?</h2>
              <p className="text-walnut/85">
                Leave {shopName} a quick review — it helps other students choose.
              </p>
              <WoodButton href={`/orders/${id}/review`} size="lg">
                Leave a review
              </WoodButton>
            </CreamCard>
          )}
          {review && (
            <p className="rounded-2xl bg-cream px-4 py-3">
              Your review: {"★".repeat(review.rating)}
              <span className="text-walnut/40">{"★".repeat(5 - review.rating)}</span>
              {review.body && <span className="block text-sm text-walnut/85">“{review.body}”</span>}
            </p>
          )}
          {order.threadId && (
            <WoodButton href={`/messages/${order.threadId.toHexString()}`} variant="secondary" size="lg">
              Open chat
            </WoodButton>
          )}
        </div>
      </main>
    </LeafyBackground>
  );
}
