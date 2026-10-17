import { ObjectId } from "mongodb";
import { apiError, parseBody } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { avatarBody } from "@/lib/validators";

/** Saves the signed-in user's avatar. The schema only accepts the hedgehog base (SPEC §9.9). */
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");

  const parsed = await parseBody(req, avatarBody);
  if ("response" in parsed) return parsed.response;

  const { users } = await collections();
  const result = await users.updateOne(
    { _id: new ObjectId(session.userId) },
    { $set: { avatar: parsed.data.avatar } },
  );
  if (!result.matchedCount) return apiError(401, "unauthenticated", "Sign in again.");
  return Response.json({ avatar: parsed.data.avatar });
}
