import type { BadgeDefinition, BadgeId } from "@/types/garage";

export const BADGE_CATALOG: Record<BadgeId, BadgeDefinition> = {
  first_build: {
    id: "first_build",
    label: "First Build",
    emoji: "🏁",
    description: "Logged the first vehicle build in the garage.",
  },
  weekend_wrench: {
    id: "weekend_wrench",
    label: "Weekend Wrench",
    emoji: "🔧",
    description: "Consistent weekend wrenching and journal updates.",
  },
  engine_builder: {
    id: "engine_builder",
    label: "Engine Builder",
    emoji: "🔥",
    description: "Documented a full engine build or swap.",
  },
  forced_induction: {
    id: "forced_induction",
    label: "Forced Induction",
    emoji: "⚡",
    description: "Completed a turbo or supercharger install.",
  },
  community_favorite: {
    id: "community_favorite",
    label: "Community Favorite",
    emoji: "👑",
    description: "High engagement across builds and updates.",
  },
  top_contributor: {
    id: "top_contributor",
    label: "Top Contributor",
    emoji: "🏆",
    description: "Top-tier contributions to the community feed.",
  },
  photographer: {
    id: "photographer",
    label: "Photographer",
    emoji: "📸",
    description: "Published a standout garage photo gallery.",
  },
  helpful_member: {
    id: "helpful_member",
    label: "Helpful Member",
    emoji: "💯",
    description: "Recognized for useful comments and advice.",
  },
};

export function getBadges(ids: BadgeId[]): BadgeDefinition[] {
  return ids.map((id) => BADGE_CATALOG[id]);
}
