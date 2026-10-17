import { cn } from "@/lib/cn";

/** 🌳 Verified (orders that passed the photo check; `stats.aiVerified` internally) and ⭐ review counts. */
export function ShopStats({
  stats,
  className,
}: {
  stats: { aiVerified: number; reviewCount: number; ratingAvg: number };
  className?: string;
}) {
  const reviews = stats.reviewCount
    ? `${stats.ratingAvg.toFixed(1)} · ${stats.reviewCount} review${stats.reviewCount === 1 ? "" : "s"}`
    : "No reviews yet";
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      <li className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sage/45 px-3 text-sm font-semibold">
        <span aria-hidden>🌳</span>
        {stats.aiVerified} Verified
      </li>
      <li className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-gold/35 px-3 text-sm font-semibold">
        <span aria-hidden>⭐</span>
        {reviews}
      </li>
    </ul>
  );
}
