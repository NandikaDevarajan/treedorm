import { jwtVerify, SignJWT } from "jose";
import type { AccountType, Role } from "@/lib/collections";

// Edge-safe: imported by middleware, so no Node-only APIs and no database here.

export const SESSION_COOKIE = "td_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface Session {
  userId: string;
  email: string;
  schoolDomain: string;
  accountType: AccountType | null;
  roles: Role[];
}

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters (see .env.example).");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

/** Returns the session for a token, or null if it is missing, expired or tampered with. */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const { userId, email, schoolDomain, accountType, roles } = payload as unknown as Session;
    if (typeof userId !== "string" || typeof email !== "string") return null;
    return { userId, email, schoolDomain, accountType: accountType ?? null, roles: roles ?? [] };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

/** Where a signed-in user belongs next. */
export const homeFor = (session: Pick<Session, "accountType">) =>
  session.accountType ? "/market" : "/onboarding/account-type";
