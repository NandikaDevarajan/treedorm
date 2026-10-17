import { readFile } from "node:fs/promises";
import path from "node:path";
import { codeEmail, HEDGEHOG_CID } from "@/lib/email/code-email";

const HEDGEHOG_FILE = path.join(process.cwd(), "public/assets/characters/hedgehog-email.png");
let hedgehogBase64: Promise<string> | undefined;

export interface SendResult {
  /** Set only outside production, when no email could be sent, so the UI can show the code. */
  devCode?: string;
  /** Why the email didn't go out (dev only), shown with the dev code. */
  devReason?: string;
}

const isProd = () => process.env.NODE_ENV === "production";

/**
 * Emails the sign-in code with Resend (SPEC §5). Without RESEND_API_KEY the code is logged to the
 * server console instead. Outside production a failed send falls back to the on-screen dev code so
 * local testing never gets stuck; in production a failed send is an error.
 */
export async function sendCodeEmail(email: string, code: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[auth] RESEND_API_KEY not set — sign-in code for ${email}: ${code}`);
    return isProd() ? {} : { devCode: code, devReason: "No email service set up" };
  }

  try {
    const { subject, html, text } = codeEmail(code);
    hedgehogBase64 ??= readFile(HEDGEHOG_FILE).then((b) => b.toString("base64"));
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Tree Dorm <onboarding@resend.dev>",
        to: email,
        subject,
        html,
        text,
        attachments: [
          {
            filename: "hedgehog.png",
            content: await hedgehogBase64,
            content_type: "image/png",
            content_id: HEDGEHOG_CID,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return {};
  } catch (err) {
    if (isProd()) throw err;
    console.error(`[auth] email to ${email} failed, showing dev code instead:`, err);
    return { devCode: code, devReason: "The email didn't send (see server log)" };
  }
}
