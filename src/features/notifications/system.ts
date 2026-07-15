"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notify";
import { NOTIFICATION_ACTION_LABEL } from "@/features/notifications/constants";

/** System: build entered a trending surface. Safe to call from jobs/admin later. */
export async function notifyBuildTrending(buildId: string): Promise<void> {
  const supabase = await createClient();
  const { data: build } = await supabase
    .from("builds")
    .select("id, user_id, title, cover_photo_url")
    .eq("id", buildId)
    .maybeSingle();
  if (!build) return;
  await createNotification(supabase, {
    userId: build.user_id,
    actorId: null,
    type: "build_trending",
    entityType: "build",
    entityId: build.id,
    action: NOTIFICATION_ACTION_LABEL.build_trending,
    message: `Your build “${build.title}” reached Trending.`,
    href: `/builds/${build.id}`,
    thumbnailUrl: build.cover_photo_url ?? null,
  });
}

/** System: garage featured (admin/jobs). */
export async function notifyGarageFeatured(profileId: string): Promise<void> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return;
  await createNotification(supabase, {
    userId: profile.id,
    actorId: null,
    type: "garage_featured",
    entityType: "profile",
    entityId: profile.id,
    action: NOTIFICATION_ACTION_LABEL.garage_featured,
    message: "Your Garage was Featured.",
    href: profile.username ? `/garage/${profile.username}` : "/garage",
  });
}

/** Future Marketplace inquiry hook. */
export async function notifyMarketplaceInquiry(input: {
  sellerId: string;
  buyerId: string;
  listingId: string;
  message?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { actorLabel } = await import("@/lib/notify");
  const who = await actorLabel(supabase, input.buyerId);
  await createNotification(supabase, {
    userId: input.sellerId,
    actorId: input.buyerId,
    type: "marketplace_inquiry",
    entityType: "marketplace_listing",
    entityId: input.listingId,
    action: NOTIFICATION_ACTION_LABEL.marketplace_inquiry,
    message: input.message ?? `${who} sent a Marketplace inquiry.`,
    href: "/garage",
  });
}

/** Someone tagged a vehicle owned by another member. */
export async function notifyVehicleTagged(input: {
  ownerId: string;
  actorId: string;
  vehicleId: string;
  href?: string;
  thumbnailUrl?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { actorLabel } = await import("@/lib/notify");
  const who = await actorLabel(supabase, input.actorId);
  await createNotification(supabase, {
    userId: input.ownerId,
    actorId: input.actorId,
    type: "vehicle_tag",
    entityType: "vehicle",
    entityId: input.vehicleId,
    action: NOTIFICATION_ACTION_LABEL.vehicle_tag,
    message: `${who} tagged your vehicle.`,
    href: input.href ?? "/garage",
    thumbnailUrl: input.thumbnailUrl ?? null,
  });
}

/** Someone shared a community post. */
export async function notifyPostShared(input: {
  authorId: string;
  actorId: string;
  postId: string;
  thumbnailUrl?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { actorLabel } = await import("@/lib/notify");
  const who = await actorLabel(supabase, input.actorId);
  await createNotification(supabase, {
    userId: input.authorId,
    actorId: input.actorId,
    type: "post_share",
    entityType: "community_post",
    entityId: input.postId,
    action: NOTIFICATION_ACTION_LABEL.post_share,
    message: `${who} shared your post.`,
    href: `/community?post=${input.postId}`,
    thumbnailUrl: input.thumbnailUrl ?? null,
  });
}

/** Event invite (future events calendar). */
export async function notifyEventInvite(input: {
  inviteeId: string;
  actorId: string;
  eventId: string;
  eventTitle?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { actorLabel } = await import("@/lib/notify");
  const who = await actorLabel(supabase, input.actorId);
  const title = input.eventTitle ? ` “${input.eventTitle}”` : "";
  await createNotification(supabase, {
    userId: input.inviteeId,
    actorId: input.actorId,
    type: "event_invite",
    entityType: "event",
    entityId: input.eventId,
    action: NOTIFICATION_ACTION_LABEL.event_invite,
    message: `${who} invited you to an event${title}.`,
    href: "/community",
  });
}
