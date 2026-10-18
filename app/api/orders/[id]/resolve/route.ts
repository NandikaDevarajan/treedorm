import { apiError, parseBody } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { resolveOrder, SettleError } from "@/lib/settle";
import { resolveBody } from "@/lib/validators";

/** Buyer decides after a mismatch: accept, partial refund or cancel (SPEC §7). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const parsed = await parseBody(req, resolveBody);
  if ("response" in parsed) return parsed.response;
  try {
    return Response.json(await resolveOrder((await params).id, session.userId, parsed.data));
  } catch (err) {
    if (err instanceof SettleError) return apiError(err.status, err.code, err.message);
    console.error("[resolve]", err);
    return apiError(500, "resolve_failed", "Something went wrong. Your payment is still held.");
  }
}
