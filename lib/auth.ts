import { DEFAULT_AVATAR } from "@/lib/avatar";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { collections, type AccountType, type Role, type UserDoc } from "@/lib/collections";
import { emailDomain, schoolForEmail } from "@/lib/schools";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifySession,
  type Session,
} from "@/lib/session";

export const rolesFor = (accountType: AccountType | null): Role[] =>
  accountType === "business" ? ["buyer", "seller"] : ["buyer"];

export function sessionFromUser(user: UserDoc): Session {
  return {
    userId: user._id.toHexString(),
    email: user.email,
    schoolDomain: user.schoolDomain,
    accountType: user.accountType,
    roles: user.roles,
  };
}

/** Finds the user for a verified email, creating them on first sign-in. */
export async function findOrCreateUser(email: string): Promise<{ user: UserDoc; isNew: boolean }> {
  const { users } = await collections();
  const normalized = email.trim().toLowerCase();
  const existing = await users.findOne({ email: normalized });
  if (existing) return { user: existing, isNew: false };

  const user: UserDoc = {
    _id: new ObjectId(),
    email: normalized,
    // Students on a department subdomain (cs.uw.edu) belong to the parent school.
    schoolDomain: schoolForEmail(normalized)?.domain ?? emailDomain(normalized)!,
    name: "",
    accountType: null,
    roles: ["buyer"],
    avatar: DEFAULT_AVATAR,
    createdAt: new Date(),
  };
  try {
    await users.insertOne(user);
    return { user, isNew: true };
  } catch (err) {
    // Two verify requests raced; the other one created the user.
    if ((err as { code?: number }).code === 11000) {
      return { user: (await users.findOne({ email: normalized }))!, isNew: false };
    }
    throw err;
  }
}

export async function setSessionCookie(session: Session): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await signSession(session), sessionCookieOptions);
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The current session from the request cookie (server components and route handlers). */
export async function getSession(): Promise<Session | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}
