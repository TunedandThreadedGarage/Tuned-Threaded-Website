import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  /** Bypass preference checks — use for security / mandatory order email paths that already validated. */
  force?: boolean;
  /** Resend idempotency key to prevent duplicate sends on retries. */
  idempotencyKey?: string;
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
      JSON.stringify({
        scope: "email",
        event: "skipped_no_key",
        subject: input.subject,
        to: Array.isArray(input.to) ? input.to.join(",") : input.to,
      }),
    );
    // Not a successful send — callers that need delivery must retry.
    return { ok: false, error: "missing_RESEND_API_KEY" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send(
      {
        from: fromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.html,
      },
      input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey }
        : undefined,
    );
    if (error) {
      console.error(
        JSON.stringify({
          scope: "email",
          event: "fail",
          subject: input.subject,
          to: Array.isArray(input.to) ? input.to.join(",") : input.to,
          error: error.message,
        }),
      );
      return { ok: false, error: error.message };
    }
    console.info(
      JSON.stringify({
        scope: "email",
        event: "sent",
        subject: input.subject,
        to: Array.isArray(input.to) ? input.to.join(",") : input.to,
        resendId: data?.id ?? null,
      }),
    );
    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email send failed.";
    console.error(
      JSON.stringify({
        scope: "email",
        event: "exception",
        subject: input.subject,
        error: message,
      }),
    );
    return { ok: false, error: message };
  }
}
