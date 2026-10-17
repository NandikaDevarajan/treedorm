import { apiError, parseBody } from "@/lib/api";
import { findOrCreateUser, sessionFromUser, setSessionCookie } from "@/lib/auth";
import { verifyCode } from "@/lib/otp";
import { homeFor } from "@/lib/session";
import { authVerifyBody } from "@/lib/validators";

const FAILURES = {
  invalid: [400, "That code isn't right. Check it and try again."],
  expired: [400, "That code has expired. Send a new one."],
  too_many_attempts: [429, "Too many tries. Send a new code."],
} as const;

export async function POST(req: Request) {
  const parsed = await parseBody(req, authVerifyBody);
  if ("response" in parsed) return parsed.response;
  const { email, code } = parsed.data;

  const result = await verifyCode(email, code);
  if (result !== "ok") {
    const [status, message] = FAILURES[result];
    return apiError(status, result, message);
  }

  const { user, isNew } = await findOrCreateUser(email);
  const session = sessionFromUser(user);
  await setSessionCookie(session);
  return Response.json({ user: session, isNew, next: homeFor(session) });
}
