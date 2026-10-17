"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { PREVIEW_CROP, TreehousePreview } from "@/components/woodland/TreehousePreview";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { coverForEntrance, prefersReducedMotion } from "@/lib/entrance";
import type { ShopTileData } from "@/lib/shop-query";
import { doorOrigin } from "@/lib/treehouse-scene";

const door = doorOrigin(PREVIEW_CROP);

/**
 * A treehouse in the village (SPEC §9.10): its category treehouse, name, category, tagline,
 * 🌳 Verified · ⭐ rating and an Enter link. The whole card is clickable (stretched link). Entering
 * zooms the little treehouse into its door before the storefront opens — a lighter version of the
 * homepage entrance; reduced motion gets a short fade.
 */
export function TreehouseTile({ shop, priority }: { shop: ShopTileData; priority?: boolean }) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const href = `/t/${shop.slug}`;
  const category = CATEGORIES.find((c) => c.id === shop.category)?.label ?? "Other";
  const rating = shop.stats.reviewCount ? `${shop.stats.ratingAvg.toFixed(1)}` : "New";

  const enter = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let cmd/ctrl/shift-click open a new tab as usual.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (entering) return router.push(href); // second tap skips
    if (prefersReducedMotion()) {
      coverForEntrance();
      setTimeout(() => router.push(href), 250);
      return;
    }
    setEntering(true);
    setTimeout(coverForEntrance, 280);
    setTimeout(() => router.push(href), 560);
  };

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-card border border-bark/15 bg-cream shadow-soft",
        "transition-[transform,box-shadow] duration-200 ease-organic",
        "md:hover:-translate-y-1 md:hover:shadow-[0_14px_28px_-14px_rgb(62_43_32/0.5)]",
        "focus-within:ring-3 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-almond",
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            "transition-transform duration-[550ms] ease-[cubic-bezier(0.5,0,0.6,1)]",
            entering && "scale-[6]",
          )}
          style={{ transformOrigin: `${door.x} ${door.y}` }}
        >
          <TreehousePreview
            variant={shop.treehouseVariant}
            label={`${shop.name}'s treehouse`}
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw"
            priority={priority}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl leading-tight text-bark">{shop.name}</h3>
          <span className="mt-1 shrink-0 rounded-full bg-almond px-2.5 py-0.5 text-xs font-bold">
            {category}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-walnut/85">{shop.tagline}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <p className="text-sm font-semibold">
            <span aria-hidden>🌳</span> {shop.stats.aiVerified} Verified <span aria-hidden>·</span>{" "}
            <span aria-hidden>⭐</span> {rating}
            {shop.stats.reviewCount > 0 && (
              <span className="sr-only"> out of 5 from {shop.stats.reviewCount} reviews</span>
            )}
          </p>
          <Link
            href={href}
            onClick={enter}
            aria-label={`Enter ${shop.name}`}
            // Stretched link: its ::after covers the whole card. The link itself must never be
            // transformed (a transform would shrink the ::after mid-click), so the pressed look
            // lives on the inner span.
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
      </div>
    </article>
  );
}
