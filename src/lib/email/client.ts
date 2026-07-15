import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  /** Bypass preference checks — use for security / mandatory order email paths that already validated. */
  force?: boolean;
};

export type SendEmailResult =
  | { ok: true; id?: string; skipped?: boolean }
  | { ok: false; error: string };

function fromAddress() {
  return (
    process.env.EMAIL_FROM ||
    "Tuned & Threaded <onboarding@resend.dev>"
  );
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[email:skipped:no-key] ${input.subject} → ${Array.isArray(input.to) ? input.to.join(",") : input.to}`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) {
      console.error(
        `[email:fail] ${input.subject} → ${Array.isArray(input.to) ? input.to.join(",") : input.to}: ${error.message}`,
      );
      return { ok: false, error: error.message };
    }
    console.info(
      `[email:sent] ${input.subject} → ${Array.isArray(input.to) ? input.to.join(",") : input.to} id=${data?.id}`,
    );
    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email send failed.";
    console.error(`[email:exception] ${input.subject}: ${message}`);
    return { ok: false, error: message };
  }
}
