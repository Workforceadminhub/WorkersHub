import { sendEmailThroughBrevo } from "../utils/brevo";

/** Public web origin for links in auth emails (no trailing slash). */
export function publicAppUrl(): string {
  const raw = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || "";
  return raw.replace(/\/$/, "");
}

export async function sendAuthHtmlEmail(to: string, subject: string, html: string): Promise<void> {
  const sender = process.env.BREVO_SENDER_EMAIL || "noreply@hiccgbagada.com";
  await sendEmailThroughBrevo({
    to,
    subject,
    htmlContent: html,
    email: sender,
    name: process.env.BREVO_SENDER_NAME || "Harvesters Hub",
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const base = publicAppUrl();
  const href = base ? `${base}/verify-email?token=${encodeURIComponent(token)}` : "";
  const html = `
<p>Welcome to Harvesters Hub.</p>
<p>Please verify your email address${href ? " by clicking the link below" : ""} (link valid 48 hours).</p>
${href ? `<p><a href="${href}">Verify email</a></p>` : `<p>Use this token in the app: <code>${escapeHtml(token)}</code></p>`}
<p>If you did not create an account, you can ignore this message.</p>
`.trim();
  await sendAuthHtmlEmail(to, "Verify your Harvesters Hub email", html);
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const base = publicAppUrl();
  const href = base ? `${base}/reset-password?token=${encodeURIComponent(token)}` : "";
  const html = `
<p>We received a request to reset your Harvesters Hub password.</p>
${href ? `<p><a href="${href}">Set a new password</a></p>` : `<p>Use this token: <code>${escapeHtml(token)}</code></p>`}
<p>This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
`.trim();
  await sendAuthHtmlEmail(to, "Reset your Harvesters Hub password", html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
