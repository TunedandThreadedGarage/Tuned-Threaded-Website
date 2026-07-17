import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadGarageProfileBundle } from "@/lib/garage-profile-data";
import { GarageProfileView } from "@/components/garage-profile/GarageProfileView";
import { FollowButton } from "@/features/social/components/FollowButton";
import { MessageButton } from "@/features/messages/components/MessageButton";
import { ReportButton } from "@/features/moderation/components/ReportButton";
import { GARAGE_RESERVED } from "@/lib/garage-routes";

export default async function PublicGaragePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (GARAGE_RESERVED.has(username)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile?.username) notFound();

  const isOwner = user?.id === profile.id;

  const [{ data: followRow }, data] = await Promise.all([
    user && !isOwner
      ? supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    loadGarageProfileBundle(supabase, profile, {
      includeJournalCount: isOwner,
    }),
  ]);

  return (
    <GarageProfileView
      data={data}
      isOwner={isOwner}
      username={profile.username}
      actions={
        !isOwner && user ? (
          <div className="flex flex-wrap items-center gap-3">
            <FollowButton
              followingId={profile.id}
              initiallyFollowing={Boolean(followRow)}
            />
            <MessageButton peerUserId={profile.id} />
            <ReportButton
              targetType="profile"
              targetId={profile.id}
              targetUserId={profile.id}
            />
          </div>
        ) : null
      }
    />
  );
}
