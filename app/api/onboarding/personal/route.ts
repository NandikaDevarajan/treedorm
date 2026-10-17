import { ObjectId } from "mongodb";
import { apiError, parseBody } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { collections } from "@/lib/collections";
import { personalSurveyBody } from "@/lib/validators";

/** Saves the personal survey (SPEC §3.2 step 3), then the optional avatar step follows. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");

  const parsed = await parseBody(req, personalSurveyBody);
  if ("response" in parsed) return parsed.response;
  const { name, lookingFor } = parsed.data;

  // Stored as readable text (SPEC §6 users.lookingFor), in category order.
  const labels = CATEGORIES.filter((c) => lookingFor.includes(c.id)).map((c) => c.label);
  const { users } = await collections();
  const result = await users.updateOne(
    { _id: new ObjectId(session.userId) },
    { $set: { name, lookingFor: labels.join(", ") } },
  );
  if (!result.matchedCount) return apiError(401, "unauthenticated", "Sign in again.");
  return Response.json({ next: "/onboarding/avatar" });
}
