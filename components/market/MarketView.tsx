"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BottomSheet } from "@/components/app/BottomSheet";
import { TreehouseTile } from "@/components/market/TreehouseTile";
import { Creature } from "@/components/woodland/Creature";
import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState } from "@/components/woodland/EmptyState";
import { LeafChip } from "@/components/woodland/LeafChip";
import { WoodButton } from "@/components/woodland/WoodButton";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { CREATURE_FOR } from "@/lib/creatures";
import { SORTS, type ShopQuery, type ShopTileData, type SortId } from "@/lib/shop-query";

interface Props {
  initial: ShopTileData[];
  initialQuery: ShopQuery;
  schoolShort: string;
  /** Whether the school has any treehouses at all (for the "no filters" empty state). */
  schoolHasShops: boolean;
  isSeller: boolean;
}

const toParams = ({ q, category, sort }: ShopQuery) => {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (category) p.set("category", category);
  if (sort && sort !== "verified") p.set("sort", sort);
  return p.toString();
};

/**
 * Marketplace search & filter (SPEC §9.10). Filters live in the URL (so Back from a shop restores
 * them) and update in place — no entrance animation, no page reload.
 */
export function MarketView({ initial, initialQuery, schoolShort, schoolHasShops, isSeller }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState<ShopQuery>(initialQuery);
  const [text, setText] = useState(initialQuery.q ?? "");
  const [shops, setShops] = useState(initial);
  const [searching, setSearching] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstRun = useRef(true);

  // Fetch whenever the query changes (debounced for typing); skip the server-rendered first pass.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const qs = toParams(query);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shops?${qs}`, { signal: ctrl.signal });
        const json = await res.json();
        if (res.ok) setShops(json.shops);
      } catch {
        /* aborted by a newer search */
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, pathname, router]);

  // Typing searches as you go, a moment after you pause.
  useEffect(() => {
    const t = setTimeout(
      () => setQuery((q) => ((q.q ?? "") === text.trim() ? q : { ...q, q: text.trim() || undefined })),
      300,
    );
    return () => clearTimeout(t);
  }, [text]);

  const setCategory = (category?: CategoryId) => setQuery((q) => ({ ...q, category }));
  const setSort = (sort: SortId) => setQuery((q) => ({ ...q, sort }));
  const clear = () => {
    setText("");
    setQuery({});
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setQuery((q) => ({ ...q, q: text.trim() || undefined }));
  };

  const filtered = !!(query.q || query.category);
  const categoryLabel = CATEGORIES.find((c) => c.id === query.category)?.label;
  const summary = searching
    ? "Searching…"
    : `${shops.length} treehouse${shops.length === 1 ? "" : "s"}${categoryLabel ? ` in ${categoryLabel}` : ""}${query.q ? ` for “${query.q}”` : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <form role="search" onSubmit={submit} className="relative">
        <label htmlFor="market-search" className="sr-only">
          Search treehouses
        </label>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 left-5 size-6 -translate-y-1/2 fill-none stroke-bark stroke-2"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" strokeLinecap="round" />
        </svg>
        <input
          id="market-search"
          type="search"
          enterKeyHint="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Haircuts, cakes, grad photos…"
          className="min-h-14 w-full rounded-full border-2 border-bark/25 bg-cream pr-28 pl-14 text-lg text-walnut shadow-soft placeholder:text-walnut/55 focus:border-accent focus:outline-none sm:min-h-16"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-2 min-h-11 -translate-y-1/2 rounded-full bg-accent px-5 font-bold text-on-accent sm:min-h-12"
        >
          Search
        </button>
      </form>

      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Categories"
          className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
        >
          <LeafChip selected={!query.category} onClick={() => setCategory(undefined)}>
            All
          </LeafChip>
          {CATEGORIES.map((c) => (
            <LeafChip
              key={c.id}
              selected={query.category === c.id}
              onClick={() => setCategory(query.category === c.id ? undefined : c.id)}
            >
              {c.label}
            </LeafChip>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-bark/30 bg-cream px-4 font-bold text-bark md:hidden"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          Filters
        </button>
        <label className="hidden shrink-0 items-center gap-2 text-sm font-semibold md:flex">
          Sort
          <select
            value={query.sort ?? "verified"}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="min-h-11 rounded-full border-2 border-bark/25 bg-cream px-3 font-semibold text-walnut focus:border-accent focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex min-h-11 items-center justify-between gap-3">
        <p aria-live="polite" className="flex items-center gap-2 font-semibold text-walnut/85">
          {searching && <Creature name={CREATURE_FOR.loading} size={34} />}
          {summary}
        </p>
        {filtered && !searching && (
          <button
            type="button"
            onClick={clear}
            className="min-h-11 font-semibold text-bark underline underline-offset-4"
          >
            Clear
          </button>
        )}
      </div>

      {searching ? (
        <ul aria-hidden className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.max(3, Math.min(shops.length, 6)) }, (_, i) => (
            <li key={i} className="overflow-hidden rounded-card border border-bark/10 bg-cream">
              <div className="aspect-[420/300] animate-pulse bg-almond" />
              <div className="flex flex-col gap-2 p-4">
                <div className="h-7 w-2/3 animate-pulse rounded-lg bg-almond" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-almond" />
                <div className="h-11 w-1/3 self-end animate-pulse rounded-2xl bg-almond" />
              </div>
            </li>
          ))}
        </ul>
      ) : shops.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((s, i) => (
            <li key={s.slug}>
              <TreehouseTile shop={s} priority={i < 3} />
            </li>
          ))}
        </ul>
      ) : !schoolHasShops ? (
        <CreamCard>
          <EmptyState
            title={`No treehouses at ${schoolShort} yet`}
            creature="squirrel-soft"
            action={!isSeller && <WoodButton href="/onboarding/business">Open the first one</WoodButton>}
          >
            Your campus village is still being built. Be the first student to open a shop here.
          </EmptyState>
        </CreamCard>
      ) : (
        <CreamCard>
          <EmptyState
            title="No treehouses match"
            action={
              <WoodButton variant="secondary" onClick={clear}>
                Clear search and filters
              </WoodButton>
            }
          >
            Try fewer words, or a different category.
          </EmptyState>
        </CreamCard>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters">
        <fieldset>
          <legend className="mb-2 font-semibold">Category</legend>
          <div className="flex flex-wrap gap-2">
            <LeafChip selected={!query.category} onClick={() => setCategory(undefined)}>
              All
            </LeafChip>
            {CATEGORIES.map((c) => (
              <LeafChip key={c.id} selected={query.category === c.id} onClick={() => setCategory(c.id)}>
                {c.label}
              </LeafChip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 font-semibold">Sort by</legend>
          <div role="radiogroup" className="flex flex-col gap-1">
            {SORTS.map((s) => (
              <label
                key={s.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3",
                  (query.sort ?? "verified") === s.id && "bg-almond",
                )}
              >
                <input
                  type="radio"
                  name="sort"
                  checked={(query.sort ?? "verified") === s.id}
                  onChange={() => setSort(s.id)}
                  className="size-5 accent-[var(--leaf)]"
                />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>
        <WoodButton onClick={() => setSheetOpen(false)}>
          {searching ? "Show treehouses" : `Show ${shops.length} treehouse${shops.length === 1 ? "" : "s"}`}
        </WoodButton>
      </BottomSheet>
    </div>
  );
}
