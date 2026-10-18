import { visionPrompt } from "@/lib/vision/prompt";
import {
  VISION_JSON_SCHEMA,
  type VisionChecker,
  type VisionInput,
  type VisionResult,
} from "@/lib/vision/types";

const ENDPOINT = "https://api.perceptron.inc/v1/chat/completions";
export const PERCEPTRON_MODEL = "perceptron-mk1.5";
const TIMEOUT_MS = 45_000;

export class PerceptronError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

/**
 * Perceptron Mk1.5 (docs.perceptron.inc): one user message with the listing photos and the proof
 * photo as `image_url` parts (asset order = listing photos first, proof photo last) plus the prompt,
 * with the final answer constrained by `response_format: json_schema` (strict). Server-only.
 */
export const perceptronChecker: VisionChecker = {
  name: "perceptron",
  async check(input: VisionInput): Promise<VisionResult> {
    const key = process.env.PERCEPTRON_API_KEY;
    if (!key) throw new PerceptronError("PERCEPTRON_API_KEY is not set");

    const content = [
      ...input.listingPhotoUrls.flatMap((url, i) => [
        { type: "text", text: `Listing photo ${i + 1} (asset ${i}):` },
        { type: "image_url", image_url: { url } },
      ]),
      { type: "text", text: `Proof photo (asset ${input.listingPhotoUrls.length}):` },
      { type: "image_url", image_url: { url: input.proofPhotoUrl } },
      { type: "text", text: visionPrompt(input) },
    ];

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: PERCEPTRON_MODEL,
          messages: [{ role: "user", content }],
          max_completion_tokens: 1024,
          response_format: {
            type: "json_schema",
            json_schema: { name: "photo_check", strict: true, schema: VISION_JSON_SCHEMA },
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new PerceptronError(
        `request failed: ${(err as Error).name === "TimeoutError" ? "timed out" : (err as Error).message}`,
      );
    }

    const body = await res.text();
    if (!res.ok) {
      let detail = body.slice(0, 200);
      try {
        detail = JSON.parse(body)?.error?.message ?? detail;
      } catch {
        /* not JSON */
      }
      throw new PerceptronError(`HTTP ${res.status}: ${detail}`, res.status);
    }
    const json = JSON.parse(body);
    const choice = json?.choices?.[0];
    // Per the structured-output guide: only a "stop" finish is a complete answer.
    if (choice?.finish_reason !== "stop")
      throw new PerceptronError(`incomplete answer (finish_reason ${choice?.finish_reason})`);
    const text: string = choice?.message?.content ?? "";
    return JSON.parse(text) as VisionResult; // validated by the caller
  },
};
