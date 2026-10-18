import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import type { ListingDoc, ShopDoc } from "@/lib/collections";
import { CATEGORIES } from "@/lib/categories";

// SPEC-NOTE: SPEC §8.3 names text-embedding-004, which this API key doesn't offer;
// gemini-embedding-001 is the current Gemini embedding model (768 dims, batched).
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
export const EMBEDDING_DIMS = 768;

let client: GoogleGenAI | undefined;
const gemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return (client ??= new GoogleGenAI({ apiKey }));
};

/** Unit-length copy (truncated Gemini embeddings must be normalised before cosine similarity). */
export function normalize(v: number[]): number[] {
  const len = Math.hypot(...v) || 1;
  return v.map((x) => x / len);
}

/** Cosine similarity of two unit vectors. */
export const cosine = (a: number[], b: number[]) => {
  let dot = 0;
  for (let i = 0; i < a.length && i < b.length; i++) dot += a[i] * b[i];
  return dot;
};

/** Embeds up to 100 texts in one call. "document" for listings, "query" for buyer requests. */
export async function embedTexts(texts: string[], kind: "document" | "query"): Promise<number[][]> {
  if (!texts.length) return [];
  const res = await gemini().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
    config: {
      taskType: kind === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
      outputDimensionality: EMBEDDING_DIMS,
    },
  });
  const out = (res.embeddings ?? []).map((e) => normalize(e.values ?? []));
  if (out.length !== texts.length) throw new Error(`expected ${texts.length} embeddings, got ${out.length}`);
  return out;
}

/** The text a listing is searched by (SPEC §6: title + description + tags), plus shop context. */
export function listingEmbeddingText(
  listing: Pick<ListingDoc, "title" | "description" | "tags">,
  shop: Pick<ShopDoc, "name" | "category" | "tags">,
): string {
  const category = CATEGORIES.find((c) => c.id === shop.category)?.label ?? "Other";
  return [
    listing.title,
    listing.description,
    `Tags: ${[...listing.tags, ...shop.tags].join(", ")}`,
    `Shop: ${shop.name} (${category})`,
  ].join("\n");
}

/** Changes whenever the listing text or the embedding model changes, so stale vectors get redone. */
export const embeddingKey = (text: string) =>
  createHash("sha256").update(`${EMBEDDING_MODEL}:${EMBEDDING_DIMS}:${text}`).digest("hex").slice(0, 24);
