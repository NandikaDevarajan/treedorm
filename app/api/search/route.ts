import { apiError, parseBody } from "@/lib/api";
import { findMatches } from "@/lib/ai/matchmaker";
import { getSession } from "@/lib/auth";
import { HOUR, rateLimit } from "@/lib/rate-limit";
import { searchBody } from "@/lib/validators";

/**
 * Ask Tree Dorm (SPEC §7 POST /api/search, §8.3). Always searches the signed-in student's own school.
 * Returns { reply, matches: [{ reason, shop, listing }], clarify }.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const parsed = await parseBody(req, searchBody);
  if ("response" in parsed) return parsed.response;
  if (!(await rateLimit(`ai:search:${session.userId}`, 60, HOUR))) {
    return apiError(429, "rate_limited", "That's a lot of questions — try again in a little while.");
  }
  try {
    const result = await findMatches({
      schoolDomain: session.schoolDomain,
      buyerId: session.userId,
      conversation: parsed.data.messages,
    });
    return Response.json(result);
  } catch (err) {
    console.error("[search]", err);
    return apiError(500, "search_failed", "Something went wrong looking around the village. Try again.");
  }
}
