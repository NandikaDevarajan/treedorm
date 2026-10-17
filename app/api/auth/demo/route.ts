import { DEFAULT_AVATAR } from "@/lib/avatar";
import { apiError, parseBody } from "@/lib/api";
import { rolesFor, sessionFromUser, setSessionCookie } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { DEMO_USERS, demoLoginEnabled } from "@/lib/demo";
import { homeFor } from "@/lib/session";
import { demoLoginBody } from "@/lib/validators";
import { ObjectId } from "mongodb";

/** Dev-only: sign in as a demo account without an email code (SPEC §12). Absent in production. */
export async function POST(req: Request) {
  if (!demoLoginEnabled()) return apiError(404, "not_found", "Not found.");

  const parsed = await parseBody(req, demoLoginBody);
  if ("response" in parsed) return parsed.response;
  const demo = DEMO_USERS[parsed.data.as];

  // Upsert so the shortcut works before `npm run seed`; the seed adds avatars, shops and orders.
  const { users } = await collections();
  const user = await users.findOneAndUpdate(
    { email: demo.email },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        email: demo.email,
        schoolDomain: "uw.edu",
        name: demo.name,
        accountType: demo.accountType,
        roles: rolesFor(demo.accountType),
        avatar: DEFAULT_AVATAR,
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const session = sessionFromUser(user!);
  await setSessionCookie(session);
  return Response.json({ user: session, next: homeFor(session) });
}
