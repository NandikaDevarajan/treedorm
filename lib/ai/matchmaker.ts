import { Type, type Schema } from "@google/genai";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { cosine, embedTexts } from "@/lib/ai/embeddings";
import { generateJson } from "@/lib/ai/gemini";
import { MATCHMAKER_SYSTEM, matchmakerPrompt } from "@/lib/ai/prompts";
import { formatAvailability } from "@/lib/availability";
import { CATEGORIES } from "@/lib/categories";
import { collections, type ListingDoc, type ShopDoc } from "@/lib/collections";
import { refreshListingEmbeddings } from "@/lib/listing-embeddings";
import { formatCents } from "@/lib/money";
import type { ChatTurn, Match, MatchResult } from "@/lib/ai/match-types";

export type { ChatTurn, Match, MatchResult } from "@/lib/ai/match-types";

const CANDIDATES = 15;
const LIKED_BOOST = 0.03; // SPEC §8.3 step 5: slightly prefer shops the buyer rated well

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    clarify: { type: Type.BOOLEAN },
    matches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { ref: { type: Type.STRING }, reason: { type: Type.STRING } },
        required: ["ref", "reason"],
      },
    },
  },
  required: ["reply", "clarify", "matches"],
};

const validator = z.object({
  reply: z.string().trim().min(1).max(200),
  clarify: z.boolean(),
  matches: z.array(z.object({ ref: z.string().trim(), reason: z.string().trim().min(1).max(200) })).max(6),
});

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** Keyword overlap, used only for listings that couldn't be embedded. */
function keywordScore(query: string, text: string): number {
  const q = new Set(words(query).filter((w) => w.length > 2));
  if (!q.size) return 0;
  const t = new Set(words(text));
  let hit = 0;
  for (const w of q) if (t.has(w)) hit++;
  return (hit / q.size) * 0.5;
}

/**
 * Ask Tree Dorm (SPEC §8.3): embed the request, take the ~15 closest live listings at the buyer's
 * school, and let Gemini pick up to 3 from different shops with a one-line reason each — or ask one
 * clarifying question when the request is vague. Falls back to the closest listings if Gemini fails.
 */
export async function findMatches(opts: {
  schoolDomain: string;
  buyerId: string;
  conversation: ChatTurn[];
  now?: Date;
}): Promise<MatchResult> {
  const { shops, listings, reviews } = await collections();
  const schoolShops = await shops.find({ schoolDomain: opts.schoolDomain }).toArray();
  if (!schoolShops.length) {
    return {
      reply: "There aren't any treehouses at your school yet — maybe you could open the first one?",
      matches: [],
      clarify: false,
    };
  }
  const shopById = new Map(schoolShops.map((s) => [s._id.toHexString(), s]));
  let live = await listings.find({ shopId: { $in: schoolShops.map((s) => s._id) }, active: true }).toArray();

  // Backfill any listing that was published before embeddings existed.
  const missing = live.filter((l) => !l.embedding?.length);
  if (missing.length) {
    const n = await refreshListingEmbeddings(
      missing.map((listing) => ({ listing, shop: shopById.get(listing.shopId.toHexString())! })),
    );
    if (n)
      live = await listings.find({ shopId: { $in: schoolShops.map((s) => s._id) }, active: true }).toArray();
  }

  // The request = the student's recent messages (so "Saturday" after "grad photos" still makes sense).
  const userTurns = opts.conversation.filter((t) => t.role === "user").slice(-3);
  const query = userTurns.map((t) => t.text).join("\n");

  let queryVector: number[] | null = null;
  try {
    [queryVector] = await embedTexts([query], "query");
  } catch (err) {
    console.error("[matchmaker] query embedding failed; using keywords:", err);
  }

  const liked = new Set(
    (await reviews.find({ buyerId: new ObjectId(opts.buyerId), rating: { $gte: 4 } }).toArray()).map((r) =>
      r.shopId.toHexString(),
    ),
  );

  const scored = live
    .map((l) => {
      const shop = shopById.get(l.shopId.toHexString())!;
      const base =
        queryVector && l.embedding?.length
          ? cosine(queryVector, l.embedding)
          : keywordScore(query, `${l.title} ${l.description} ${l.tags.join(" ")} ${shop.name}`);
      return { l, shop, score: base + (liked.has(shop._id.toHexString()) ? LIKED_BOOST : 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, CANDIDATES);

  const refs = new Map(scored.map((s, i) => [`L${i + 1}`, s]));
  const candidates = scored.map((s, i) => ({
    ref: `L${i + 1}`,
    shop: s.shop.name,
    category: CATEGORIES.find((c) => c.id === s.shop.category)?.label ?? "Other",
    title: s.l.title,
    description: s.l.description,
    tags: s.l.tags,
    price: formatCents(s.l.priceCents),
    verified: s.shop.stats.aiVerified,
    rating: s.shop.stats.reviewCount
      ? `${s.shop.stats.ratingAvg.toFixed(1)} (${s.shop.stats.reviewCount})`
      : "new",
    availability: formatAvailability(s.shop.availability),
    area: s.shop.area,
    likedBefore: liked.has(s.shop._id.toHexString()),
  }));

  const toMatch = (s: { l: ListingDoc; shop: ShopDoc }, reason: string): Match => ({
    reason: reason.slice(0, 160),
    shop: {
      slug: s.shop.slug,
      name: s.shop.name,
      category: CATEGORIES.find((c) => c.id === s.shop.category)?.label ?? "Other",
      stats: s.shop.stats,
    },
    listing: {
      id: s.l._id.toHexString(),
      title: s.l.title,
      priceCents: s.l.priceCents,
      photo: s.l.photos[0]?.url,
    },
  });

  // Fallback: the three closest listings from different shops.
  const closest = () => {
    const seen = new Set<string>();
    return scored
      .filter((s) => (seen.has(s.shop.slug) ? false : (seen.add(s.shop.slug), true)))
      .slice(0, 3)
      .map((s) =>
        toMatch(s, `${s.l.title} · ${formatCents(s.l.priceCents)} · ${s.shop.stats.aiVerified} Verified`),
      );
  };

  const now = opts.now ?? new Date();
  const today = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
  const result = await generateJson({
    system: MATCHMAKER_SYSTEM,
    parts: [{ text: matchmakerPrompt({ today, conversation: opts.conversation, candidates }) }],
    schema: responseSchema,
    validator,
    fallback: { reply: "Here are the closest treehouses I found:", clarify: false, matches: [] },
  });

  if (!result.ok) {
    if (result.reason === "blocked")
      return {
        reply: "I can't help with that one. Try describing a service or item you need.",
        matches: [],
        clarify: true,
      };
    return { reply: "Here are the closest treehouses I found:", matches: closest(), clarify: false };
  }

  const { reply, clarify, matches } = result.data;
  // A clarifying turn must actually ask something; otherwise treat it as "nothing fits".
  if (clarify && reply.trim().endsWith("?")) return { reply, matches: [], clarify: true };
  const seen = new Set<string>();
  const picked = matches
    .map((m) => ({ s: refs.get(m.ref.toUpperCase()), reason: m.reason }))
    .filter((m): m is { s: NonNullable<typeof m.s>; reason: string } => !!m.s)
    .filter((m) => (seen.has(m.s.shop.slug) ? false : (seen.add(m.s.shop.slug), true)))
    .slice(0, 3)
    .map((m) => toMatch(m.s, m.reason));
  return { reply, matches: picked, clarify: false };
}
