import { ObjectId } from "mongodb";
import { apiError, parseBody } from "@/lib/api";
import { getSession, rolesFor, sessionFromUser, setSessionCookie } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { accountTypeBody } from "@/lib/validators";

/** Saves Personal vs Business (SPEC §9.7) and refreshes the session so routing sees it. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");

  const parsed = await parseBody(req, accountTypeBody);
  if ("response" in parsed) return parsed.response;
  const { accountType } = parsed.data;

  const { users } = await collections();
  const current = await users.findOne({ _id: new ObjectId(session.userId) });
  if (!current) return apiError(401, "unauthenticated", "Sign in again.");
  // SPEC-NOTE: a business with a treehouse keeps seller access; switching away would orphan the shop.
  if (current.shopId && accountType === "personal") {
    return apiError(409, "has_shop", "Your treehouse is open, so this account stays a business account.");
  }

  const user = await users.findOneAndUpdate(
    { _id: current._id },
    { $set: { accountType, roles: rolesFor(accountType) } },
    { returnDocument: "after" },
  );
  await setSessionCookie(sessionFromUser(user!));
  return Response.json({
    next: accountType === "business" ? "/onboarding/business" : "/onboarding/personal",
  });
}
