import { apiError, parseBody } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { HOUR, rateLimit } from "@/lib/rate-limit";
import { checkProofPhoto, SettleError } from "@/lib/settle";
import { checkBody } from "@/lib/validators";

/** Photo check (SPEC §7, §8.4–8.5): buyer only, while the payment is held. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const parsed = await parseBody(req, checkBody);
  if ("response" in parsed) return parsed.response;
  if (!(await rateLimit(`check:${session.userId}`, 20, HOUR)))
    return apiError(429, "rate_limited", "Too many photo checks. Try again later.");
  try {
    return Response.json(await checkProofPhoto((await params).id, session.userId, parsed.data.proofPhoto));
  } catch (err) {
    if (err instanceof SettleError) return apiError(err.status, err.code, err.message);
    console.error("[check]", err);
    return apiError(500, "check_failed", "Something went wrong. Your payment is still held.");
  }
}
