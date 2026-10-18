import { z } from "zod";
import { textMatches } from "@/lib/text-match";
import { geminiChecker } from "@/lib/vision/gemini";
import { perceptronChecker } from "@/lib/vision/perceptron";
import type { VisionInput, VisionResult } from "@/lib/vision/types";

export type { VisionChecker, VisionInput, VisionResult } from "@/lib/vision/types";

const resultSchema = z.object({
  verdict: z.enum(["pass", "mismatch", "unsure"]),
  confidence: z.number().transform((n) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0))),
  reasons: z.array(z.string().trim().min(1).max(200)).max(8),
  ocrText: z.string().max(500).optional(),
});

export interface PhotoCheck extends VisionResult {
  provider: "perceptron" | "gemini" | "none";
  /** Only when custom text was expected: did the photo's text match it (fuzzy)? */
  textMatched?: boolean;
  /** Why Perceptron wasn't used, when it wasn't (logged in audit_log). */
  fallbackReason?: string;
}

/**
 * Runs the photo check (SPEC §8.4): Perceptron first whenever PERCEPTRON_API_KEY is set; Gemini only
 * if the key is missing or Perceptron errors/times out. If both fail, the result is "unsure" so the
 * buyer decides. Custom text is matched here, deterministically, from the text the checker read.
 */
export async function runPhotoCheck(input: VisionInput): Promise<PhotoCheck> {
  let fallbackReason: string | undefined;
  const attempts = process.env.PERCEPTRON_API_KEY ? [perceptronChecker, geminiChecker] : [geminiChecker];
  if (!process.env.PERCEPTRON_API_KEY) fallbackReason = "PERCEPTRON_API_KEY not set";

  for (const checker of attempts) {
    try {
      const raw = resultSchema.parse(await checker.check(input));
      return finish(raw, checker.name, input.expectedText, fallbackReason);
    } catch (err) {
      const why = (err as Error).message?.slice(0, 200) || "unknown error";
      console.warn(`[photo-check] ${checker.name} failed: ${why}`);
      if (checker.name === "perceptron") fallbackReason = `Perceptron error: ${why}`;
    }
  }
  return {
    verdict: "unsure",
    confidence: 0,
    reasons: ["We couldn't check this photo automatically, so it's your call."],
    provider: "none",
    fallbackReason,
    ...(input.expectedText ? { textMatched: false } : {}),
  };
}

function finish(
  raw: z.infer<typeof resultSchema>,
  provider: "perceptron" | "gemini",
  expectedText?: string,
  fallbackReason?: string,
): PhotoCheck {
  const ocrText = raw.ocrText?.trim() || undefined;
  if (!expectedText) return { ...raw, ocrText, provider, fallbackReason };

  const textMatched = textMatches(expectedText, ocrText);
  // Our own text line replaces the checker's, so the wording is exact and consistent.
  const others = raw.reasons.filter((r) => !/\btext\b|\breads\b|\bsays\b|\bwriting\b|\bmessage\b/i.test(r));
  const textReason = textMatched
    ? `Text reads “${ocrText}” ✓`
    : ocrText
      ? `Expected the text “${expectedText}”, photo reads “${ocrText}” ✗`
      : `Expected the text “${expectedText}”, but no text could be read in the photo ✗`;
  return {
    ...raw,
    ocrText,
    reasons: [textReason, ...others].slice(0, 6),
    provider,
    textMatched,
    fallbackReason,
  };
}
