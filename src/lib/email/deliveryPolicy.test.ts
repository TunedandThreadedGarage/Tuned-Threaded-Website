import { describe, expect, it } from "vitest";
import {
  emailDelaySeconds,
  resolvePresence,
  EMAIL_DELAY_SECONDS,
} from "./deliveryPolicy";

const NOW = Date.parse("2026-07-17T12:00:00Z");
const iso = (secondsAgo: number) =>
  new Date(NOW - secondsAgo * 1000).toISOString();

describe("resolvePresence", () => {
  it("is offline with no presence row", () => {
    expect(resolvePresence(null, NOW)).toBe("offline");
    expect(resolvePresence(undefined, NOW)).toBe("offline");
    expect(resolvePresence({}, NOW)).toBe("offline");
  });

  it("is online when status online and seen within 2 minutes", () => {
    expect(
      resolvePresence({ status: "online", last_seen_at: iso(30) }, NOW),
    ).toBe("online");
  });

  it("degrades stale online rows to away (crashed browser)", () => {
    expect(
      resolvePresence({ status: "online", last_seen_at: iso(5 * 60) }, NOW),
    ).toBe("away");
  });

  it("is away when the user reported away recently", () => {
    expect(
      resolvePresence({ status: "away", last_seen_at: iso(60) }, NOW),
    ).toBe("away");
  });

  it("is offline when last seen more than 10 minutes ago", () => {
    expect(
      resolvePresence({ status: "away", last_seen_at: iso(11 * 60) }, NOW),
    ).toBe("offline");
    expect(
      resolvePresence({ status: "online", last_seen_at: iso(30 * 60) }, NOW),
    ).toBe("offline");
  });

  it("is offline when the user reported offline", () => {
    expect(
      resolvePresence({ status: "offline", last_seen_at: iso(10) }, NOW),
    ).toBe("offline");
  });
});

describe("emailDelaySeconds", () => {
  it("never emails online users", () => {
    expect(emailDelaySeconds("message", "online")).toBeNull();
    expect(emailDelaySeconds("follow", "online")).toBeNull();
    expect(emailDelaySeconds("journal_like", "online")).toBeNull();
  });

  it("delays DMs 5 minutes when away, 2 minutes when offline", () => {
    expect(emailDelaySeconds("message", "away")).toBe(
      EMAIL_DELAY_SECONDS.message.away,
    );
    expect(emailDelaySeconds("message", "offline")).toBe(
      EMAIL_DELAY_SECONDS.message.offline,
    );
    expect(emailDelaySeconds("message_request", "away")).toBe(300);
    expect(emailDelaySeconds("message_request", "offline")).toBe(120);
  });

  it("delays social activity 10 minutes when away, 5 minutes when offline", () => {
    for (const type of ["follow", "journal_like", "build_comment", "mention"]) {
      expect(emailDelaySeconds(type, "away")).toBe(600);
      expect(emailDelaySeconds(type, "offline")).toBe(300);
    }
  });

  it("covers the full presence x category matrix", () => {
    const matrix: Array<[string, "online" | "away" | "offline", number | null]> =
      [
        ["message", "online", null],
        ["message", "away", 300],
        ["message", "offline", 120],
        ["message_request", "online", null],
        ["message_request", "away", 300],
        ["message_request", "offline", 120],
        ["garage_follow", "online", null],
        ["garage_follow", "away", 600],
        ["garage_follow", "offline", 300],
        ["build_like", "online", null],
        ["build_like", "away", 600],
        ["build_like", "offline", 300],
        ["comment", "away", 600],
        ["reply", "offline", 300],
        ["gallery_like", "away", 600],
        ["journal_comment", "offline", 300],
      ];
    for (const [type, presence, expected] of matrix) {
      expect(emailDelaySeconds(type, presence)).toBe(expected);
    }
  });
});
