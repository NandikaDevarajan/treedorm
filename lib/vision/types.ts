/** A photo check's answer (SPEC §8.4). */
export interface VisionResult {
  verdict: "pass" | "mismatch" | "unsure";
  /** 0..1 */
  confidence: number;
  /** Plain-language reasons, e.g. "Cake text reads 'Happy Birthday Maya' ✓". */
  reasons: string[];
  /** All text read from the proof photo, if any. */
  ocrText?: string;
}

export interface VisionInput {
  listingPhotoUrls: string[];
  proofPhotoUrl: string;
  checkpoints: string[];
  /** order.customText — the words that should appear in the photo. */
  expectedText?: string;
  /** Listing title, for context in the prompt. */
  listingTitle?: string;
}

export interface VisionChecker {
  name: "perceptron" | "gemini";
  check(input: VisionInput): Promise<VisionResult>;
}

/** JSON Schema both checkers are constrained to. */
export const VISION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "confidence", "reasons", "ocrText"],
  properties: {
    verdict: { type: "string", enum: ["pass", "mismatch", "unsure"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasons: { type: "array", items: { type: "string" }, maxItems: 6 },
    ocrText: { type: "string" },
  },
} as const;
