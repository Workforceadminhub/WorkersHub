import { sendEmailThroughBrevo } from "../utils/brevo";

/** Public web origin for links in password-reset emails (no trailing slash). */
export function publicAppUrl(): string {
  const raw = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || "";
  return raw.replace(/\/$/, "");
}

const BRAND = "Harvesters Hub";
const BG = "#f0f2f5";
const CARD = "#ffffff";
const TEXT = "#1a1a1a";
const MUTED = "#5c6370";
const ACCENT = "#1e5a96";
const ACCENT_BG = "#e8f1fa";

/** Minimal table layout + inline styles for broad email client support. */
function wrapAuthEmail(title: string, innerRows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:${BG};">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BG};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background:${CARD};border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
<tr><td style="padding:28px 32px 8px 32px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;">
<p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${ACCENT};">${escapeHtml(BRAND)}</p>
<h1 style="margin:0;font-size:22px;font-weight:600;color:${TEXT};line-height:1.3;">${escapeHtml(title)}</h1>
</td></tr>
${innerRows}
<tr><td style="padding:16px 32px 28px 32px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;font-size:12px;color:${MUTED};line-height:1.5;border-top:1px solid #e8eaed;">
If you did not request this, you can ignore this message.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendAuthHtmlEmail(to: string, subject: string, html: string): Promise<void> {
  const sender = (process.env.BREVO_SENDER_EMAIL ?? "workforceadmin@hiccgbagada.com").trim();
  if (!sender) {
    throw new Error(
      "BREVO_SENDER_EMAIL is not set. In Brevo: Settings → Senders → add and verify the address (or authenticate the domain), then set BREVO_SENDER_EMAIL to that exact address in your Lambda env / SST secrets.",
    );
  }
  await sendEmailThroughBrevo({
    to,
    subject,
    htmlContent: html,
    email: sender,
    name: process.env.BREVO_SENDER_NAME || BRAND,
  });
}

const OTP_TTL_MINUTES = 15;

export async function sendVerificationEmail(to: string, otp: string): Promise<void> {
  const code = escapeHtml(otp);
  const inner = `
<tr><td style="padding:8px 32px 0 32px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;font-size:15px;color:${TEXT};line-height:1.6;">
<p style="margin:0 0 16px 0;">Thanks for signing up. Use this code in the app to verify your email address:</p>
</td></tr>
<tr><td align="center" style="padding:12px 32px 8px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="background:${ACCENT_BG};border-radius:12px;border:1px solid #c5d9ed;">
<tr><td style="padding:20px 40px;font-family:ui-monospace,Consolas,Monaco,monospace;font-size:28px;font-weight:700;letter-spacing:0.35em;color:${ACCENT};">${code}</td></tr>
</table>
</td></tr>
<tr><td style="padding:8px 32px 24px 32px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;font-size:14px;color:${MUTED};line-height:1.6;">
This code expires in <strong style="color:${TEXT};">${OTP_TTL_MINUTES} minutes</strong>. Do not share it with anyone.
</td></tr>`;
  const html = wrapAuthEmail("Verify your email", inner);
  await sendAuthHtmlEmail(to, `Your ${BRAND} verification code`, html);
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const base = publicAppUrl();
  const href = base ? `${base}/reset-password?token=${encodeURIComponent(token)}` : "";
  const linkBlock = href
    ? `<tr><td align="center" style="padding:8px 32px 24px 32px;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;background:${ACCENT};color:#ffffff;text-decoration:none;border-radius:10px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;font-size:15px;font-weight:600;">Set a new password</a>
</td></tr>
<tr><td style="padding:0 32px 16px 32px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;font-size:12px;color:${MUTED};word-break:break-all;">If the button does not work, copy this link:<br/><span style="color:${ACCENT};">${escapeHtml(href)}</span></td></tr>`
    : `<tr><td style="padding:8px 32px 24px 32px;font-family:ui-monospace,Consolas,Monaco,monospace;font-size:14px;color:${TEXT};word-break:break-all;">${escapeHtml(token)}</td></tr>`;

  const inner = `
<tr><td style="padding:8px 32px 0 32px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;font-size:15px;color:${TEXT};line-height:1.6;">
<p style="margin:0 0 8px 0;">We received a request to reset your password.</p>
<p style="margin:0;color:${MUTED};font-size:14px;">This link expires in <strong style="color:${TEXT};">1 hour</strong>.</p>
</td></tr>
${linkBlock}`;

  const html = wrapAuthEmail("Reset your password", inner);
  await sendAuthHtmlEmail(to, `Reset your ${BRAND} password`, html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
