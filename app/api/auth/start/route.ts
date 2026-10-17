import { apiError, clientIp, parseBody } from "@/lib/api";
import { sendCodeEmail } from "@/lib/email/send";
import { issueCode } from "@/lib/otp";
import { HOUR, rateLimit } from "@/lib/rate-limit";
import { domainMatches, emailDomain } from "@/lib/schools";
import { authStartBody } from "@/lib/validators";

export async function POST(req: Request) {
  const parsed = await parseBody(req, authStartBody);
  if ("response" in parsed) return parsed.response;
  const { email, schoolDomain } = parsed.data;

  if (schoolDomain && !domainMatches(emailDomain(email)!, schoolDomain)) {
    return apiError(400, "school_mismatch", `That email isn't a ${schoolDomain} address.`);
  }

  // SPEC §11: 5/hour per email, 20/hour per IP.
  const [emailOk, ipOk] = await Promise.all([
    rateLimit(`otp:email:${email}`, 5, HOUR),
    rateLimit(`otp:ip:${clientIp(req)}`, 20, HOUR),
  ]);
  if (!emailOk || !ipOk) {
    return apiError(429, "rate_limited", "Too many codes requested. Try again in an hour.");
  }

  try {
    const code = await issueCode(email);
    const { devCode, devReason } = await sendCodeEmail(email, code);
    return Response.json({ ok: true, ...(devCode && { devCode, devReason }) });
  } catch (err) {
    console.error("auth/start", err);
    return apiError(502, "send_failed", "We couldn't send your code. Try again in a moment.");
  }
}
