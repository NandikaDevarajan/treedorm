import { GoogleGenAI, HarmBlockThreshold, HarmCategory, type Part, type Schema } from "@google/genai";
import type { z } from "zod";

// SPEC-NOTE: SPEC §5 names gemini-2.5-flash, which Google no longer serves to new API keys
// (404 "no longer available to new users"). gemini-3.8-flash with low thinking answers in ~5s.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * Tried in order when a model is overloaded (503/429/500), so a busy model never blocks a seller.
 * Override with a comma-separated GEMINI_FALLBACK_MODELS.
 */
export const GEMINI_MODELS = [
  ...new Set([
    GEMINI_MODEL,
    ...(process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.5-flash,gemini-3.5-flash-lite")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  ]),
];

const statusOf = (err: unknown): number | undefined => {
  const s = (err as { status?: number })?.status;
  if (typeof s === "number") return s;
  const m = String((err as Error)?.message ?? "").match(/"code":\s*(\d{3})/);
  return m ? Number(m[1]) : undefined;
};
const isBusy = (err: unknown) => [429, 500, 503].includes(statusOf(err) ?? 0);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let client: GoogleGenAI | undefined;
const gemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return (client ??= new GoogleGenAI({ apiKey }));
};

// SPEC §11: safety settings on.
const SAFETY = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({ category, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }));

export type AiResult<T> = { ok: true; data: T } | { ok: false; reason: "blocked" | "failed"; data: T };

/**
 * Asks Gemini for JSON matching `schema` and validates it with `validator` (SPEC §8). Bad JSON is
 * retried once; an overloaded model gets one short wait, then the next model in GEMINI_MODELS.
 * Falls back to `fallback` if nothing works. "blocked" means the safety filter refused the content.
 */
export async function generateJson<T>(opts: {
  system: string;
  parts: Part[];
  schema: Schema;
  validator: z.ZodType<T>;
  fallback: T;
}): Promise<AiResult<T>> {
  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await gemini().models.generateContent({
          model,
          contents: [{ role: "user", parts: opts.parts }],
          config: {
            systemInstruction: opts.system,
            responseMimeType: "application/json",
            responseSchema: opts.schema,
            safetySettings: SAFETY,
            thinkingConfig: { thinkingLevel: "low" as never },
            temperature: 0.7,
          },
        });
        const blocked =
          res.promptFeedback?.blockReason || res.candidates?.some((c) => c.finishReason === "SAFETY");
        if (blocked) return { ok: false, reason: "blocked", data: opts.fallback };

        const parsed = opts.validator.safeParse(JSON.parse(res.text ?? ""));
        if (parsed.success) return { ok: true, data: parsed.data };
        lastError = parsed.error; // bad shape: retry the same model once
      } catch (err) {
        lastError = err;
        if (!isBusy(err) && !(err instanceof SyntaxError)) break; // e.g. 400: this model won't work
        if (isBusy(err) && attempt === 0) await sleep(700);
      }
    }
    console.warn(
      `[ai] ${model} didn't work, trying the next model:`,
      String((lastError as Error)?.message ?? lastError).slice(0, 160),
    );
  }
  console.error("[ai] all models failed; using the fallback draft:", lastError);
  return { ok: false, reason: "failed", data: opts.fallback };
}
