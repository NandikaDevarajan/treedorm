import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { ListingEditor } from "@/components/seller/ListingEditor";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getSellerContext } from "@/lib/seller";

export const metadata: Metadata = { title: "New listing · Tree Dorm" };

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const ctx = await getSellerContext();
  if (!ctx) redirect("/onboarding/account-type");
  if (!ctx.shop) redirect("/onboarding/business");
  const { first } = await searchParams;
  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-safe py-8">
        <div className="rounded-[2rem] bg-cream p-6 shadow-soft sm:p-8">
          <ListingEditor shopSlug={ctx.shop.slug} first={first === "1"} />
        </div>
      </main>
    </LeafyBackground>
  );
}
