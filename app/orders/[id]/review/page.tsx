import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { ReviewForm } from "@/components/check/ReviewForm";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { orderForUser } from "@/lib/order-access";

export const metadata: Metadata = { title: "Leave a review · Tree Dorm" };

/** Review a paid order (SPEC §4 /orders/[id]/review): buyer only, once. */
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const access = await orderForUser(id, session.userId);
  if (!access || access.role !== "buyer") notFound();
  const { reviews, shops, listings } = await collections();
  if (
    !["captured", "partially_refunded"].includes(access.order.status) ||
    (await reviews.findOne({ orderId: access.order._id }))
  ) {
    redirect(`/orders/${id}`);
  }
  const [shop, listing] = await Promise.all([
    shops.findOne({ _id: access.order.shopId }),
    listings.findOne({ _id: access.order.listingId }),
  ]);
  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-safe pt-6 pb-12">
        <Link
          href={`/orders/${id}`}
          className="flex min-h-11 w-fit items-center gap-1.5 font-semibold text-bark underline-offset-4 hover:underline"
        >
          <span aria-hidden>←</span> Back to the order
        </Link>
        <h1 className="font-display text-5xl leading-none text-bark">
          Review {shop?.name ?? "this treehouse"}
        </h1>
        <p className="text-walnut/85">{listing?.title}</p>
        <ReviewForm orderId={id} />
      </main>
    </LeafyBackground>
  );
}
