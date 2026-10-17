import { mix } from "@/lib/color";
import { TOKENS } from "@/lib/tokens";

export const HEDGEHOG_CID = "tree-dorm-hedgehog";
export const CODE_EMAIL_SUBJECT = "Your Tree Dorm code";

const { almond, cream, bark, walnut, leaf } = TOKENS;
const cardBorder = mix(bark, cream, 0.2);
const divider = mix(bark, cream, 0.12);
// Email clients can't load our web fonts, so headings fall back to friendly system faces.
const DISPLAY = `'Trebuchet MS', 'Segoe UI', Verdana, sans-serif`;
const BODY = `Verdana, 'Segoe UI', Arial, sans-serif`;

/**
 * The sign-in code email: woodland style on cream with the hedgehog and a big, clear code.
 * Table layout and inline styles because many inboxes ignore <style> blocks.
 */
export function codeEmail(code: string): { subject: string; html: string; text: string } {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${CODE_EMAIL_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:${almond};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your code is ${code}. It expires in 10 minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${almond};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:${cream};border:1px solid ${cardBorder};border-radius:24px;">
      <tr><td align="center" style="padding:32px 28px 8px;">
        <img src="cid:${HEDGEHOG_CID}" width="120" alt="Tree Dorm hedgehog" style="display:block;width:120px;height:auto;border:0;">
      </td></tr>
      <tr><td align="center" style="padding:8px 28px 0;font-family:${DISPLAY};font-size:28px;line-height:1.2;color:${bark};font-weight:bold;">
        Your sign-in code
      </td></tr>
      <tr><td align="center" style="padding:10px 28px 0;font-family:${BODY};font-size:16px;line-height:1.6;color:${walnut};">
        Enter this code in Tree Dorm to finish signing in.
      </td></tr>
      <tr><td align="center" style="padding:22px 28px;">
        <div style="display:inline-block;background:${almond};border:2px dashed ${bark};border-radius:18px;padding:14px 14px 14px 22px;font-family:${BODY};font-size:34px;line-height:1;font-weight:bold;letter-spacing:8px;white-space:nowrap;color:${walnut};">${code}</div>
      </td></tr>
      <tr><td align="center" style="padding:0 28px 28px;font-family:${BODY};font-size:14px;line-height:1.6;color:${walnut};">
        It expires in 10 minutes. If you didn't ask for it, you can ignore this email.
      </td></tr>
      <tr><td align="center" style="padding:16px 28px 26px;border-top:1px solid ${divider};font-family:${BODY};font-size:12px;line-height:1.6;color:${leaf};">
        Tree Dorm &middot; little shops run by students.<br>An independent student marketplace, not affiliated with any university.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `Your Tree Dorm sign-in code is ${code}.

It expires in 10 minutes. If you didn't ask for it, you can ignore this email.

Tree Dorm, little shops run by students. Not affiliated with any university.`;

  return { subject: CODE_EMAIL_SUBJECT, html, text };
}
