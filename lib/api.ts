import { NextResponse } from "next/server";
import type { z } from "zod";

/** Error shape for every API route (SPEC §7). */
export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Parses a JSON body against a schema; returns the data or a 400 response. */
export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { response: apiError(400, "bad_json", "Request body must be JSON.") };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return { response: apiError(400, "invalid", result.error.issues[0]?.message ?? "Invalid request.") };
  }
  return { data: result.data };
}

/** Best-effort client IP for rate limiting (Vercel sets x-forwarded-for). */
export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
