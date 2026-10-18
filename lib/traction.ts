import { collections } from "@/lib/collections";

/** The /about traction strip (demo data): shops, verified orders, and the review-weighted average rating. */
export async function getTraction() {
  const { shops } = await collections();
  const [row] = await shops
    .aggregate<{ shops: number; verified: number; reviews: number; ratingSum: number }>([
      {
        $group: {
          _id: null,
          shops: { $sum: 1 },
          verified: { $sum: "$stats.aiVerified" },
          reviews: { $sum: "$stats.reviewCount" },
          ratingSum: { $sum: { $multiply: ["$stats.ratingAvg", "$stats.reviewCount"] } },
        },
      },
    ])
    .toArray();
  if (!row) return { shops: 0, verifiedOrders: 0, averageRating: null };
  return {
    shops: row.shops,
    verifiedOrders: row.verified,
    averageRating: row.reviews ? Math.round((row.ratingSum / row.reviews) * 10) / 10 : null,
  };
}
