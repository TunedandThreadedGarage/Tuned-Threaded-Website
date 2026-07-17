import { describe, expect, it } from "vitest";
import {
  decideChannels,
  eventKeyForNotificationType,
} from "@/lib/email/channelDecision";
import { TYPE_TO_EVENT_KEY } from "@/features/settings/constants";

describe("decideChannels", () => {
  it("keeps email and in-app independent when master is on", () => {
    expect(
      decideChannels({
        masterEnabled: true,
        emailFrequency: "instant",
        emailEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
      }),
    ).toEqual({
      inApp: true,
      email: false,
      push: false,
      frequency: "instant",
    });

    expect(
      decideChannels({
        masterEnabled: true,
        emailFrequency: "instant",
        emailEnabled: true,
        inAppEnabled: false,
        pushEnabled: false,
      }),
    ).toEqual({
      inApp: false,
      email: true,
      push: false,
      frequency: "instant",
    });
  });

  it("sends email immediately only when enabled and frequency is instant", () => {
    expect(
      decideChannels({
        masterEnabled: true,
        emailFrequency: "instant",
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
      }).email,
    ).toBe(true);

    expect(
      decideChannels({
        masterEnabled: true,
        emailFrequency: "daily",
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
      }).email,
    ).toBe(false);

    expect(
      decideChannels({
        masterEnabled: true,
        emailFrequency: "never",
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
      }).email,
    ).toBe(false);
  });

  it("blocks all optional channels when master is off", () => {
    expect(
      decideChannels({
        masterEnabled: false,
        emailFrequency: "instant",
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: true,
      }),
    ).toEqual({
      inApp: false,
      email: false,
      push: false,
      frequency: "never",
    });
  });

  it("force bypasses preference checks (security / auth mail)", () => {
    expect(
      decideChannels({
        force: true,
        masterEnabled: false,
        emailFrequency: "never",
        emailEnabled: false,
        inAppEnabled: false,
        pushEnabled: false,
      }),
    ).toEqual({
      inApp: true,
      email: true,
      push: false,
      frequency: "instant",
    });
  });

  it("defaults missing channel toggles to enabled for email/in-app", () => {
    expect(
      decideChannels({
        masterEnabled: true,
        emailFrequency: "instant",
        emailEnabled: undefined,
        inAppEnabled: undefined,
        pushEnabled: undefined,
      }),
    ).toEqual({
      inApp: true,
      email: true,
      push: false,
      frequency: "instant",
    });
  });
});

describe("eventKeyForNotificationType", () => {
  const requiredMappings: Array<[string, string]> = [
    ["garage_follow", "followers"],
    ["follow", "followers"],
    ["message", "messages"],
    ["message_request", "messages"],
    ["build_like", "likes"],
    ["post_like", "likes"],
    ["comment", "comments"],
    ["reply", "replies"],
    ["mention", "mentions"],
    ["journal_like", "journal"],
    ["journal_comment", "journal"],
    ["gallery_like", "gallery"],
    ["gallery_comment", "gallery"],
    ["build_follow", "build_follows"],
    ["order_confirmation", "orders"],
    ["order_shipped", "orders"],
    ["shipping_update", "orders"],
  ];

  it("maps every required notification type to a preference event key", () => {
    for (const [type, key] of requiredMappings) {
      expect(TYPE_TO_EVENT_KEY[type]).toBe(key);
      expect(eventKeyForNotificationType(type)).toBe(key);
    }
  });

  it("falls back to the raw type when unmapped", () => {
    expect(eventKeyForNotificationType("custom_future_type")).toBe(
      "custom_future_type",
    );
  });
});

describe("preference respect matrix", () => {
  const categories = [
    "followers",
    "messages",
    "likes",
    "comments",
    "replies",
    "mentions",
    "journal",
    "gallery",
    "orders",
  ] as const;

  it("disabling email for a category never allows email for that category", () => {
    for (const _ of categories) {
      const decision = decideChannels({
        masterEnabled: true,
        emailFrequency: "instant",
        emailEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
      });
      expect(decision.email).toBe(false);
      expect(decision.inApp).toBe(true);
    }
  });

  it("enabling email with instant frequency allows immediate email", () => {
    for (const _ of categories) {
      const decision = decideChannels({
        masterEnabled: true,
        emailFrequency: "instant",
        emailEnabled: true,
        inAppEnabled: false,
        pushEnabled: false,
      });
      expect(decision.email).toBe(true);
      expect(decision.inApp).toBe(false);
    }
  });
});
