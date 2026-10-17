import { Type, type Schema } from "@google/genai";
import { z } from "zod";
import { generateJson } from "@/lib/ai/gemini";
import { SHOP_BUILDER_SYSTEM, shopBuilderPrompt } from "@/lib/ai/prompts";

export const shopDraftSchema = z.object({
  tagline: z.string().trim().min(1).max(80),
  bio: z.string().trim().min(1).max(320),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).min(1).max(8),
  suggestedListings: z
    .array(
      z.object({ title: z.string().trim().min(1).max(80), priceCents: z.number().int().min(0).max(100_000) }),
    )
    .max(4)
    .default([]),
  accentEmoji: z.string().max(8).default("🌳"),
});
export type ShopDraft = z.infer<typeof shopDraftSchema>;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tagline: { type: Type.STRING },
    bio: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedListings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { title: { type: Type.STRING }, priceCents: { type: Type.INTEGER } },
        required: ["title", "priceCents"],
      },
    },
    accentEmoji: { type: Type.STRING },
  },
  required: ["tagline", "bio", "tags", "suggestedListings", "accentEmoji"],
};

export type ShopSurveyForAi = Parameters<typeof shopBuilderPrompt>[0];

/** Gemini Shop Builder (SPEC §8.1). Always returns a usable draft; `ai: false` when it fell back. */
export async function buildShopDraft(survey: ShopSurveyForAi) {
  const fallback: ShopDraft = {
    tagline: `${survey.category} by a fellow student`.slice(0, 80),
    bio: survey.offer.slice(0, 300),
    tags: [survey.category.toLowerCase()],
    suggestedListings: [],
    accentEmoji: "🌳",
  };
  const result = await generateJson({
    system: SHOP_BUILDER_SYSTEM,
    parts: [{ text: shopBuilderPrompt(survey) }],
    schema: responseSchema,
    validator: shopDraftSchema,
    fallback,
  });
  return { draft: result.data, ai: result.ok, blocked: !result.ok && result.reason === "blocked" };
}
