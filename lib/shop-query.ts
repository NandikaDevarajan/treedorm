import { CATEGORY_IDS, type CategoryId } from "@/lib/categories";

// Browser-safe marketplace query types and parsing; the database search is in lib/shop-search.ts.

export const SORTS = [
  { id: "verified", label: "Most verified" },
  { id: "rating", label: "Top rated" },
  { id: "newest", label: "Newest" },
] as const;
export type SortId = (typeof SORTS)[number]["id"];

export interface ShopQuery {
  q?: string;
  category?: CategoryId;
  sort?: SortId;
}

/** What a marketplace tile needs (no owner ids or private fields). */
export interface ShopTileData {
  slug: string;
  name: string;
  category: CategoryId;
  treehouseVariant: string;
  tagline: string;
  stats: { aiVerified: number; reviewCount: number; ratingAvg: number };
}

/** Reads ?q=&category=&sort= from URL params, ignoring anything invalid. */
export function parseShopQuery(params: {
  q?: string | null;
  category?: string | null;
  sort?: string | null;
}): ShopQuery {
  const q = params.q?.trim().slice(0, 80) || undefined;
  const category = CATEGORY_IDS.includes(params.category as CategoryId)
    ? (params.category as CategoryId)
    : undefined;
  const sort = SORTS.some((s) => s.id === params.sort) ? (params.sort as SortId) : undefined;
  return { q, category, sort };
}
