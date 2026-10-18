import { Type, type Schema } from "@google/genai";
import { z } from "zod";
import { generateJson } from "@/lib/ai/gemini";
import { visionPrompt } from "@/lib/vision/prompt";
import type { VisionChecker, VisionInput, VisionResult } from "@/lib/vision/types";

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ["pass", "mismatch", "unsure"] },
    confidence: { type: Type.NUMBER },
    reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
    ocrText: { type: Type.STRING },
  },
  required: ["verdict", "confidence", "reasons", "ocrText"],
};

const validator = z.object({
  verdict: z.enum(["pass", "mismatch", "unsure"]),
  confidence: z.number(),
  reasons: z.array(z.string()),
  ocrText: z.string(),
});

/** Downloads an image for Gemini's inline input (Gemini can't fetch arbitrary URLs itself). */
async function inline(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`couldn't load image (${res.status})`);
  const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return { inlineData: { mimeType, data: Buffer.from(await res.arrayBuffer()).toString("base64") } };
}

/** Gemini multimodal: the same contract, used when Perceptron is missing or fails (SPEC §8.4). */
export const geminiChecker: VisionChecker = {
  name: "gemini",
  async check(input: VisionInput): Promise<VisionResult> {
    const images = await Promise.all([...input.listingPhotoUrls, input.proofPhotoUrl].map(inline));
    const result = await generateJson({
      system: "You check photos for a student marketplace. Answer only with the requested JSON.",
      parts: [...images, { text: visionPrompt(input) }],
      schema,
      validator,
      fallback: { verdict: "unsure", confidence: 0, reasons: [], ocrText: "" },
    });
    if (!result.ok)
      throw new Error(
        result.reason === "blocked"
          ? "photo was blocked by the safety filter"
          : "Gemini couldn't check the photo",
      );
    return result.data;
  },
};
