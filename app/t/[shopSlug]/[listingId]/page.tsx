import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { BookingPanel } from "@/components/booking/BookingPanel";
import { ShopStats } from "@/components/shop/ShopStats";
import { CreamCard } from "@/components/woodland/CreamCard";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getSession } from "@/lib/auth";
import { formatAvailability } from "@/lib/availability";
import { collections } from "@/lib/collections";
import { formatCents } from "@/lib/money";
import { slotsFor } from "@/lib/orders";

type Props = { params: Promise<{ shopSlug: string; listingId: string }> };

async function load({ shopSlug, listingId }: { shopSlug: string; listingId: string }) {
  if (!ObjectId.isValid(listingId)) return null;
  const { shops, listings } = await collections();
  const shop = await shops.findOne({ slug: shopSlug.toLowerCase() });
  if (!shop) return null;
  const listing = await listings.findOne({ _id: new ObjectId(listingId), shopId: shop._id, active: true });
  return listing ? { shop, listing } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(await params);
  return { title: data ? `${data.listing.title} · ${data.shop.name}` : "Listing not found · Tree Dorm" };
}

/** Listing page (SPEC §4): photos, details, and booking with a slot picker. */
export default async function ListingPage({ params }: Props) {
  const data = await load(await params);
  if (!data) notFound();
  const { shop, listing } = data;
  const session = await getSession();
  const isOwner = session?.userId === shop.ownerId.toHexString();
  const sameSchool = session?.schoolDomain === shop.schoolDomain;
  const slots = await slotsFor(shop, listing);

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto grid max-w-5xl gap-6 px-safe pt-6 pb-32 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-start md:px-8 md:pb-12">
        <div className="flex flex-col gap-4">
          <Link
            href={`/t/${shop.slug}`}
            className="flex min-h-11 w-fit items-center gap-1.5 font-semibold text-bark underline-offset-4 hover:underline"
          >
            <span aria-hidden>←</span> {shop.name}
          </Link>
          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
            {listing.photos.map((p, i) => (
              <li
                key={p.publicId}
                className="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden rounded-card bg-almond shadow-soft"
              >
                <Image
                  src={p.url}
                  alt={`${listing.title}, photo ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 560px, 100vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
          <CreamCard className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-4xl leading-tight text-bark">{listing.title}</h1>
              <p className="mt-1 shrink-0 text-2xl font-bold">{formatCents(listing.priceCents)}</p>
            </div>
            {listing.durationMin && (
              <p className="text-sm font-semibold text-walnut/80">About {listing.durationMin} minutes</p>
            )}
            <p className="leading-relaxed">{listing.description}</p>
            <div className="flex flex-col gap-2 border-t border-bark/10 pt-3">
              <p className="font-semibold">{shop.name}</p>
              <ShopStats stats={shop.stats} />
              <p className="text-sm text-walnut/80">
                {shop.area} · usually free {formatAvailability(shop.availability)}
              </p>
            </div>
          </CreamCard>
        </div>

        <BookingPanel
          listingId={listing._id.toHexString()}
          priceCents={listing.priceCents}
          customTextAllowed={listing.customTextAllowed}
          slots={slots}
          blocked={
            isOwner
              ? "This is your own listing."
              : !sameSchool
                ? "Only students at this treehouse's school can book it."
                : null
          }
        />
      </main>
    </LeafyBackground>
  );
}
