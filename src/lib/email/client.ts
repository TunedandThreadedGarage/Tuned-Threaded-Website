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
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email:skipped] ${input.subject} → ${Array.isArray(input.to) ? input.to.join(",") : input.to}`,
      );
    }
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
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Email send failed.",
    };
  }
}
