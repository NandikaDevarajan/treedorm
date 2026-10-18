import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { ShopStats } from "@/components/shop/ShopStats";
import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState } from "@/components/woodland/EmptyState";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";
import { collections } from "@/lib/collections";
import { formatCents } from "@/lib/money";
import { getSellerContext } from "@/lib/seller";

export const metadata: Metadata = { title: "Seller dashboard · Tree Dorm" };

/** Seller dashboard (SPEC §4): the treehouse at a glance and its listings. Bookings arrive in Phase 7. */
export default async function SellerPage() {
  const ctx = await getSellerContext();
  if (!ctx) redirect("/onboarding/account-type");
  if (!ctx.shop) redirect("/onboarding/business");
  const shop = ctx.shop;
  const { listings } = await collections();
  const items = await listings.find({ shopId: shop._id }).sort({ createdAt: -1 }).toArray();

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-safe py-8">
        <CreamCard className="p-0">
          <div className="flex flex-col gap-2 p-5 sm:p-6">
            <h1 className="font-display text-4xl leading-tight text-bark">{shop.name}</h1>
            <p className="text-walnut/85">{shop.tagline}</p>
            <ShopStats stats={shop.stats} />
            <div className="flex flex-wrap gap-2 pt-2">
              <WoodButton href={`/t/${shop.slug}`}>View treehouse</WoodButton>
              <WoodButton href="/seller/listings/new" variant="secondary">
                Add a listing
              </WoodButton>
            </div>
          </div>
        </CreamCard>

        <section aria-labelledby="your-listings" className="flex flex-col gap-3">
          <h2 id="your-listings" className="font-display text-3xl text-bark">
            Your listings
          </h2>
          {items.length ? (
            <CreamCard className="p-0">
              <ul className="divide-y divide-bark/10">
                {items.map((l) => (
                  <li key={l._id.toHexString()}>
                    <Link
                      href={`/seller/listings/${l._id.toHexString()}`}
                      className="flex min-h-14 items-center justify-between gap-3 px-5 py-3 hover:bg-almond/60"
                    >
                      <span className="font-semibold">{l.title || "Untitled draft"}</span>
                      <span className="flex shrink-0 items-center gap-3 text-sm">
                        {formatCents(l.priceCents)}
                        <span
                          className={
                            l.active
                              ? "rounded-full bg-sage/50 px-2.5 py-0.5 font-bold"
                              : "rounded-full bg-almond px-2.5 py-0.5 font-bold"
                          }
                        >
                          {l.active ? "Live" : "Draft"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CreamCard>
          ) : (
            <CreamCard>
              <EmptyState
                title="No listings yet"
                action={<WoodButton href="/seller/listings/new">Add your first listing</WoodButton>}
              >
                Add photos of your work to create your first listing.
              </EmptyState>
            </CreamCard>
          )}
        </section>
      </main>
    </LeafyBackground>
  );
}
