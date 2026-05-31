import { Resend } from "resend";

// Resend uzerinden e-posta gonderimi. RESEND_API_KEY tanimli degilse
// gonderim YAPILMAZ (no-op) — boylece yerel/CI/build ortamlari guvenli kalir
// ve anahtar yalnizca uretimde gereklidir.

const apiKey = process.env.RESEND_API_KEY;
// Resend test gonderimi icin "onboarding@resend.dev" kullanilabilir;
// uretimde dogrulanmis kendi alan adinizi ALERT_EMAIL_FROM ile verin.
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
    console.warn("RESEND_API_KEY tanimli degil; e-posta gonderimi atlandi.");
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
