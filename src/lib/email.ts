import { Resend } from "resend";

// Sending email through Resend. With no RESEND_API_KEY set, nothing is sent (a
// no-op) — which keeps local, CI and build environments safe and makes the key a
// production-only requirement.

const apiKey = process.env.RESEND_API_KEY;
// "onboarding@resend.dev" works for a Resend test send; in production pass your
// own verified domain through ALERT_EMAIL_FROM.
const from = process.env.ALERT_EMAIL_FROM ?? "Çiftlik Pro <onboarding@resend.dev>";

export type SendResult =
  | { skipped: true; reason: string }
  | { skipped: false; id: string | null };

export async function sendEmail(
  to: string[],
  subject: string,
  html: string
): Promise<SendResult> {
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set; email sending skipped.");
    return { skipped: true, reason: "no-api-key" };
  }
  if (to.length === 0) {
    return { skipped: true, reason: "no-recipients" };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Resend hatasi: ${error.message}`);
  }
  return { skipped: false, id: data?.id ?? null };
}
