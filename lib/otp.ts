import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { collections } from "@/lib/collections";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const generateCode = () => randomInt(0, 1_000_000).toString().padStart(6, "0");

/** Keyed hash so a leaked otp_codes collection can't be brute-forced offline. */
export function hashCode(email: string, code: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(`${email}:${code}`)
    .digest("hex");
}

/** Creates (or replaces) the pending code for an email and returns it in plain text for sending. */
export async function issueCode(email: string): Promise<string> {
  const { otpCodes } = await collections();
  const code = generateCode();
  await otpCodes.updateOne(
    { email },
    { $set: { codeHash: hashCode(email, code), attempts: 0, expiresAt: new Date(Date.now() + OTP_TTL_MS) } },
    { upsert: true },
  );
  return code;
}

export type VerifyResult = "ok" | "invalid" | "expired" | "too_many_attempts";

/** Checks a code. Success consumes it; failures count toward OTP_MAX_ATTEMPTS. */
export async function verifyCode(email: string, code: string): Promise<VerifyResult> {
  const { otpCodes } = await collections();
  // Count the attempt up front, atomically, so parallel guesses can't exceed the limit.
  const doc = await otpCodes.findOneAndUpdate(
    { email },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );
  if (!doc) return "invalid";
  if (doc.expiresAt.getTime() < Date.now()) {
    await otpCodes.deleteOne({ email });
    return "expired";
  }
  if (doc.attempts > OTP_MAX_ATTEMPTS) return "too_many_attempts";

  const expected = Buffer.from(doc.codeHash, "hex");
  const actual = Buffer.from(hashCode(email, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return "invalid";

  await otpCodes.deleteOne({ email });
  return "ok";
}
