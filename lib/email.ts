/**
 * Sends the sign-in code. Uses Resend when RESEND_API_KEY is set; otherwise logs the code to the
 * server console (SPEC §5). Returns `devCode` only outside production so the UI can show it in a toast.
 */
export async function sendCodeEmail(email: string, code: string): Promise<{ devCode?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // SPEC-NOTE: without Resend, production also logs the code (visible in Vercel logs only),
    // so a deploy without email still works for the team. It is never returned to the browser there.
    console.info(`[auth] sign-in code for ${email}: ${code}`);
    return process.env.NODE_ENV === "production" ? {} : { devCode: code };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Tree Dorm <onboarding@resend.dev>",
      to: email,
      subject: `${code} is your Tree Dorm code`,
      text: `Your Tree Dorm sign-in code is ${code}. It expires in 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  return {};
}
