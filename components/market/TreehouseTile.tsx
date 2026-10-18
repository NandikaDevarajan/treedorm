import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/cn";
import type { ShopTileData } from "@/lib/shop-query";

/**
 * A shop in the village (SPEC §9.10): a clean cream card with the shop name, category, short
 * description, 🌳 Verified · ⭐ rating and an Enter button — no treehouse picture, easy to scan.
 * The whole card is one link (stretched); hover lifts it on desktop.
 */
export function TreehouseTile({ shop }: { shop: ShopTileData }) {
  const category = CATEGORIES.find((c) => c.id === shop.category)?.label ?? "Other";
  const rating = shop.stats.reviewCount ? shop.stats.ratingAvg.toFixed(1) : "New";

  return (
    <article
      className={cn(
        "relative flex h-full flex-col gap-3 rounded-card border border-bark/15 bg-cream p-5 shadow-soft",
        "transition-[translate,box-shadow] duration-200 ease-organic",
        "md:hover:-translate-y-1 md:hover:shadow-[0_14px_28px_-14px_rgb(62_43_32/0.5)]",
        "focus-within:ring-3 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-almond",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-3xl leading-tight text-bark">{shop.name}</h3>
        <span className="mt-1.5 shrink-0 rounded-full bg-almond px-2.5 py-0.5 text-xs font-bold">
          {category}
        </span>
      </div>
      <p className="line-clamp-2 text-walnut/85">{shop.tagline}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <p className="text-sm font-semibold">
          <span aria-hidden>🌳</span> {shop.stats.aiVerified} Verified <span aria-hidden>·</span>{" "}
          <span aria-hidden>⭐</span> {rating}
          {shop.stats.reviewCount > 0 && (
            <span className="sr-only"> out of 5 from {shop.stats.reviewCount} reviews</span>
          )}
        </p>
        <Link
          href={`/t/${shop.slug}`}
          aria-label={`Enter ${shop.name}`}
          // Stretched link: its ::after covers the card. The link itself is never transformed (that
          // would shrink the ::after mid-click), so the pressed look lives on the inner span.
          className="group/enter rounded-2xl after:absolute after:inset-0 after:content-['']"
        >
          <span
            className={cn(
              "inline-flex min-h-11 items-center gap-1 rounded-2xl border-2 border-walnut/70 bg-accent px-4 font-bold text-on-accent",
              "shadow-[0_3px_0_var(--walnut)] transition-transform",
              "group-active/enter:translate-y-[2px] group-active/enter:shadow-[0_1px_0_var(--walnut)]",
            )}
          >
            Enter <span aria-hidden>→</span>
          </span>
        </Link>
      </div>
    </article>
  );
}
