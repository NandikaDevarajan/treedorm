import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { ListingCard } from "@/components/shop/ListingCard";
import { ShopStats } from "@/components/shop/ShopStats";
import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState } from "@/components/woodland/EmptyState";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";
import { getSession } from "@/lib/auth";
import { formatAvailability } from "@/lib/availability";
import { CATEGORIES } from "@/lib/categories";
import { collections } from "@/lib/collections";
import { formatCents } from "@/lib/money";

type Props = { params: Promise<{ shopSlug: string }> };

async function load(slug: string) {
  const { shops, listings } = await collections();
  const shop = await shops.findOne({ slug: slug.toLowerCase() });
  if (!shop) return null;
  const items = await listings.find({ shopId: shop._id, active: true }).sort({ publishedAt: -1 }).toArray();
  return { shop, items };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).shopSlug);
  return { title: data ? `${data.shop.name} · Tree Dorm` : "Treehouse not found · Tree Dorm" };
}

/** Storefront (SPEC §3.1 step 7, §9.10): shop name and info, listings with photos, about, availability. */
export default async function StorefrontPage({ params }: Props) {
  const data = await load((await params).shopSlug);
  if (!data) notFound();
  const { shop, items } = data;
  const session = await getSession();
  const isOwner = session?.userId === shop.ownerId.toHexString();
  const category = CATEGORIES.find((c) => c.id === shop.category)?.label ?? "Other";

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 pt-6 pb-12 md:px-8 md:pt-8">
        {/* Shop name and info first (SPEC §9.10): no treehouse picture on storefronts. */}
        <CreamCard
          as="section"
          aria-labelledby="shop-name"
          className="mx-4 flex flex-col gap-3 p-6 sm:p-8 md:mx-0"
        >
          <h1 id="shop-name" className="font-display text-5xl leading-none text-bark">
            {shop.name}
          </h1>
          <p className="text-lg text-walnut/90">{shop.tagline}</p>
          <ShopStats stats={shop.stats} />
          <p className="text-sm text-walnut/80">
            {category} · {shop.area} · {formatCents(shop.priceRange.min * 100)}–
            {formatCents(shop.priceRange.max * 100)}
          </p>
          {isOwner && (
            <div className="flex flex-wrap gap-2 pt-1">
              <WoodButton href="/seller/listings/new">Add a listing</WoodButton>
              <WoodButton href="/seller" variant="secondary">
                Seller dashboard
              </WoodButton>
            </div>
          )}
        </CreamCard>

        <section aria-labelledby="listings" className="flex flex-col gap-4 px-safe md:px-0">
          <h2 id="listings" className="font-display text-3xl text-bark">
            Listings
          </h2>
          {items.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((l) => (
                <li key={l._id.toHexString()} className="flex">
                  <ListingCard listing={l} href={`/t/${shop.slug}/${l._id.toHexString()}`} />
                </li>
              ))}
            </ul>
          ) : (
            <CreamCard>
              <EmptyState title="Nothing listed yet">
                {isOwner ? "Add your first listing so buyers can book you." : "Check back soon."}
              </EmptyState>
            </CreamCard>
          )}
        </section>

        <div className="grid gap-4 px-safe md:grid-cols-2 md:px-0">
          <CreamCard as="section" aria-labelledby="about" className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h2 id="about" className="font-display text-3xl text-bark">
                About
              </h2>
            </div>
            <p>{shop.bio}</p>
            {shop.tags.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Tags">
                {shop.tags.map((t) => (
                  <li key={t} className="rounded-full bg-almond px-2.5 py-0.5 text-sm">
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </CreamCard>
          <CreamCard as="section" aria-labelledby="when" className="flex flex-col gap-2">
            <h2 id="when" className="font-display text-3xl text-bark">
              When &amp; where
            </h2>
            <p>
              <span className="font-semibold">Usually free:</span> {formatAvailability(shop.availability)}
            </p>
            <p>
              <span className="font-semibold">Area:</span> {shop.area}
            </p>
            <p className="text-sm text-walnut/75">
              Exact place and time are sorted out in private chat after you book.
            </p>
          </CreamCard>
        </div>
      </main>
    </LeafyBackground>
  );
}
