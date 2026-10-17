import { Type, type Part, type Schema } from "@google/genai";
import { z } from "zod";
import { generateJson } from "@/lib/ai/gemini";
import { LISTING_WRITER_SYSTEM, listingWriterPrompt } from "@/lib/ai/prompts";

export const listingDraftSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(520),
  suggestedPriceCents: z.number().int().min(0).max(100_000),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(8),
  checkpoints: z.array(z.string().trim().min(1).max(90)).max(6),
  customTextAllowed: z.boolean(),
});
export type ListingDraft = z.infer<typeof listingDraftSchema>;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    suggestedPriceCents: { type: Type.INTEGER },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    checkpoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    customTextAllowed: { type: Type.BOOLEAN },
  },
  required: ["title", "description", "suggestedPriceCents", "tags", "checkpoints", "customTextAllowed"],
};

/**
 * Gemini Listing Writer (SPEC §8.2), multimodal: photos are sent as inline images.
 * `blocked` = the safety filter refused the photos or notes; the listing can't be published (§11).
 */
export async function writeListingDraft(input: {
  images: { mimeType: string; data: string }[];
  category: string;
  shopName: string;
  priceMin?: number;
  priceMax?: number;
  notes?: string;
}) {
  const fallback: ListingDraft = {
    title: input.notes?.slice(0, 60) || "",
    description: input.notes?.slice(0, 500) || "",
    suggestedPriceCents: input.priceMin != null ? input.priceMin * 100 : 0,
    tags: [input.category.toLowerCase()],
    checkpoints: [],
    customTextAllowed: false,
  };
  const parts: Part[] = [
    ...input.images.map((img) => ({ inlineData: img })),
    { text: listingWriterPrompt({ ...input, photoCount: input.images.length }) },
  ];
  const result = await generateJson({
    system: LISTING_WRITER_SYSTEM,
    parts,
    schema: responseSchema,
    validator: listingDraftSchema,
    fallback,
  });
  return { draft: result.data, ai: result.ok, blocked: !result.ok && result.reason === "blocked" };
}
