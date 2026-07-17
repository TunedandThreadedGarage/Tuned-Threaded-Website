import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const from = vi.fn();
const sendEmail = vi.fn();
const createAdminClient = vi.fn();
const isSupabaseConfigured = vi.fn(() => true);
const isEmailConfigured = vi.fn(() => true);
const renderNotificationEmail = vi.fn(
  (_input?: unknown) => ({
    subject: "Test",
    html: "<p>hi</p>",
  }),
);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));
vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => isSupabaseConfigured(),
}));
vi.mock("@/lib/email/client", () => ({
  isEmailConfigured: () => isEmailConfigured(),
  sendEmail: (input: unknown) => sendEmail(input),
}));
vi.mock("@/lib/email/dispatch", () => ({
  renderNotificationEmail: (input: unknown) => renderNotificationEmail(input),
}));

describe("processNotificationEmailQueue", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    isSupabaseConfigured.mockReturnValue(true);
    isEmailConfigured.mockReturnValue(true);
    createAdminClient.mockReturnValue({
      rpc,
      from,
    });
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { status: "away", last_seen_at: new Date().toISOString() },
          }),
        }),
      }),
    });
  });

  it("skips when Resend is not configured (does not claim)", async () => {
    isEmailConfigured.mockReturnValue(false);
    const { processNotificationEmailQueue } = await import("./queueProcessor");
    const result = await processNotificationEmailQueue();
    expect(result).toEqual({
      claimed: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("skips when service role is missing", async () => {
    createAdminClient.mockReturnValue(null);
    const { processNotificationEmailQueue } = await import("./queueProcessor");
    const result = await processNotificationEmailQueue();
    expect(result.claimed).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sends claimed rows and finalizes with provider id", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "claim_due_notification_emails") {
        return {
          data: [
            {
              id: "q1",
              user_id: "u1",
              type: "message",
              event_key: "messages",
              payload: { message: "hi", href: "/messages/1", actorName: "A" },
              email: "a@example.com",
              idempotency_key: "idem-1",
              attempts: 1,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });
    sendEmail.mockResolvedValue({ ok: true, id: "re_123" });

    const { processNotificationEmailQueue } = await import("./queueProcessor");
    const result = await processNotificationEmailQueue(10);

    expect(result).toEqual({
      claimed: 1,
      sent: 1,
      failed: 0,
      cancelled: 0,
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "a@example.com",
        idempotencyKey: "idem-1",
      }),
    );
    expect(rpc).toHaveBeenCalledWith(
      "finalize_notification_email",
      expect.objectContaining({
        p_id: "q1",
        p_status: "sent",
        p_provider_message_id: "re_123",
      }),
    );
  });

  it("finalizes failed sends for retry", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "claim_due_notification_emails") {
        return {
          data: [
            {
              id: "q2",
              user_id: "u1",
              type: "follow",
              event_key: "followers",
              payload: { message: "followed" },
              email: "a@example.com",
              idempotency_key: "idem-2",
              attempts: 2,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });
    sendEmail.mockResolvedValue({ ok: false, error: "provider_down" });

    const { processNotificationEmailQueue } = await import("./queueProcessor");
    const result = await processNotificationEmailQueue();

    expect(result.failed).toBe(1);
    expect(rpc).toHaveBeenCalledWith(
      "finalize_notification_email",
      expect.objectContaining({
        p_id: "q2",
        p_status: "failed",
        p_error: "provider_down",
      }),
    );
  });

  it("cancels when recipient is online before send", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "claim_due_notification_emails") {
        return {
          data: [
            {
              id: "q3",
              user_id: "u1",
              type: "message",
              event_key: "messages",
              payload: {},
              email: "a@example.com",
              idempotency_key: "idem-3",
              attempts: 1,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              status: "online",
              last_seen_at: new Date().toISOString(),
            },
          }),
        }),
      }),
    });

    const { processNotificationEmailQueue } = await import("./queueProcessor");
    const result = await processNotificationEmailQueue();

    expect(result.cancelled).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      "finalize_notification_email",
      expect.objectContaining({
        p_id: "q3",
        p_status: "cancelled",
      }),
    );
  });

  it("fails rows with no recipient email", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "claim_due_notification_emails") {
        return {
          data: [
            {
              id: "q4",
              user_id: "u1",
              type: "message",
              event_key: "messages",
              payload: {},
              email: null,
              idempotency_key: "idem-4",
              attempts: 1,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const { processNotificationEmailQueue } = await import("./queueProcessor");
    const result = await processNotificationEmailQueue();
    expect(result.failed).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
