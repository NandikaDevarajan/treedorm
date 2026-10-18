// Browser-safe types for Ask Tree Dorm (the search itself is in lib/ai/matchmaker.ts).

export type ChatTurn = { role: "user" | "assistant"; text: string };

export interface Match {
  reason: string;
  shop: {
    slug: string;
    name: string;
    category: string;
    stats: { aiVerified: number; reviewCount: number; ratingAvg: number };
  };
  listing: { id: string; title: string; priceCents: number; photo?: string };
}

export interface MatchResult {
  reply: string;
  matches: Match[];
  clarify: boolean;
}
