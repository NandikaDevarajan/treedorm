import { apiError, parseBody } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { addReview, SettleError } from "@/lib/settle";
import { reviewBody } from "@/lib/validators";

/** Review a settled order: buyer only, once (SPEC §7). */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const parsed = await parseBody(req, reviewBody);
  if ("response" in parsed) return parsed.response;
  const { orderId, rating, body } = parsed.data;
  try {
    await addReview(orderId, session.userId, rating as 1 | 2 | 3 | 4 | 5, body);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof SettleError) return apiError(err.status, err.code, err.message);
    console.error("[reviews]", err);
    return apiError(500, "review_failed", "Couldn't save your review. Try again.");
  }
}
