import Image from "next/image";
import { CreamCard } from "@/components/woodland/CreamCard";
import { formatCents } from "@/lib/money";

/** A listing on the storefront. Booking (and its detail page) arrives in Phase 7. */
export function ListingCard({
  listing,
}: {
  listing: { title: string; description: string; priceCents: number; photos: { url: string }[] };
}) {
  const photo = listing.photos[0];
  return (
    <CreamCard as="article" className="flex flex-col overflow-hidden p-0">
      <div className="relative aspect-[4/3] bg-almond">
        {photo && (
          <Image
            src={photo.url}
            alt=""
            fill
            sizes="(min-width: 768px) 320px, 100vw"
            className="object-cover"
          />
        )}
        {listing.photos.length > 1 && (
          <span className="absolute right-2 bottom-2 rounded-full bg-cream/95 px-2 py-0.5 text-xs font-bold">
            {listing.photos.length} photos
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-snug font-bold text-bark">{listing.title}</h3>
          <p className="shrink-0 text-lg font-bold">{formatCents(listing.priceCents)}</p>
        </div>
        <p className="line-clamp-3 text-sm text-walnut/85">{listing.description}</p>
      </div>
    </CreamCard>
  );
}
