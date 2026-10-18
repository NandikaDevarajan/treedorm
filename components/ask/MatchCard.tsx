import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Match } from "@/lib/ai/match-types";
import { formatCents } from "@/lib/money";

/** One suggested shop (SPEC §8.3): a clean cream card with the listing photo, shop, price and the reason. */
export function MatchCard({ match, rank }: { match: Match; rank: number }) {
  const { shop, listing } = match;
  const rating = shop.stats.reviewCount ? shop.stats.ratingAvg.toFixed(1) : "New";
  return (
    <article
      className={cn(
        "relative flex gap-3 rounded-card border border-bark/15 bg-cream p-3 shadow-soft sm:gap-4 sm:p-4",
        "transition-[translate,box-shadow] duration-200 md:hover:-translate-y-0.5",
        "focus-within:ring-3 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-almond",
      )}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-almond sm:size-28">
        {listing.photo && <Image src={listing.photo} alt="" fill sizes="112px" className="object-cover" />}
        <span className="absolute top-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-cream/95 text-sm font-bold text-bark">
          {rank}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-2xl leading-tight text-bark">{shop.name}</h3>
          <span className="mt-1 shrink-0 font-bold">{formatCents(listing.priceCents)}</span>
        </div>
        <p className="text-sm font-semibold text-walnut/90">
          {listing.title} · <span className="font-normal">{shop.category}</span>
        </p>
        <p className="text-sm text-walnut/85">{match.reason}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-sm font-semibold whitespace-nowrap">
            <span aria-hidden>🌳</span> {shop.stats.aiVerified} Verified <span aria-hidden>·</span>{" "}
            <span aria-hidden>⭐</span> {rating}
          </p>
          <Link
            href={`/t/${shop.slug}`}
            aria-label={`Enter ${shop.name}`}
            className="group/enter ml-auto rounded-2xl after:absolute after:inset-0 after:content-['']"
          >
            <span className="inline-flex min-h-11 items-center gap-1 rounded-2xl border-2 border-walnut/70 bg-accent px-4 font-bold text-on-accent shadow-[0_3px_0_var(--walnut)] transition-transform group-active/enter:translate-y-[2px] group-active/enter:shadow-[0_1px_0_var(--walnut)]">
              Enter <span aria-hidden>→</span>
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
