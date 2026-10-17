import { collections } from "@/lib/collections";

/**
 * Fixed-window counter stored in Mongo, so limits hold across serverless instances.
 * Returns true when the call is allowed.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const { rateLimits } = await collections();
  const now = Date.now();
  const windowStart = now - (now % windowMs);
  const doc = await rateLimits.findOneAndUpdate(
    { key: `${key}:${windowStart}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
    { upsert: true, returnDocument: "after" },
  );
  return (doc?.count ?? 1) <= limit;
}

export const HOUR = 60 * 60 * 1000;
