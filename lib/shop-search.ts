import type { Filter } from "mongodb";
import { collections, type ShopDoc } from "@/lib/collections";
import type { ShopQuery, ShopTileData, SortId } from "@/lib/shop-query";

export { parseShopQuery, type ShopQuery, type ShopTileData } from "@/lib/shop-query";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Keyword browse within one school (SPEC §7 GET /api/shops, §9.10): matches shop name, tagline,
 * bio and tags, plus the titles and tags of its live listings. Every word must match somewhere.
 */
export async function searchShops(
  schoolDomain: string,
  { q, category, sort = "verified" }: ShopQuery,
): Promise<ShopTileData[]> {
  const { shops, listings } = await collections();
  const filter: Filter<ShopDoc> = { schoolDomain };
  if (category) filter.category = category;

  const words = (q ?? "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length) {
    const schoolShops = await shops.find({ schoolDomain }, { projection: { _id: 1 } }).toArray();
    const ids = schoolShops.map((s) => s._id);
    const perWord = await Promise.all(
      words.map(async (w) => {
        const re = new RegExp(escape(w), "i");
        const fromListings = await listings.distinct("shopId", {
          shopId: { $in: ids },
          active: true,
          $or: [{ title: re }, { tags: re }],
        });
        return { re, fromListings };
      }),
    );
    filter.$and = perWord.map(({ re, fromListings }) => ({
      $or: [
        { name: re },
        { tagline: re },
        { bio: re },
        { tags: re },
        { category: re },
        { _id: { $in: fromListings } },
      ],
    }));
  }

  const order: Record<SortId, Record<string, 1 | -1>> = {
    verified: { "stats.aiVerified": -1, "stats.ratingAvg": -1 },
    rating: { "stats.ratingAvg": -1, "stats.reviewCount": -1 },
    newest: { createdAt: -1 },
  };
  const rows = await shops
    .find(filter, {
      projection: { slug: 1, name: 1, category: 1, treehouseVariant: 1, tagline: 1, stats: 1 },
    })
    .sort(order[sort])
    .limit(60)
    .toArray();
  return rows.map(({ slug, name, category, treehouseVariant, tagline, stats }) => ({
    slug,
    name,
    category,
    treehouseVariant,
    tagline,
    stats,
  }));
}
