import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GARAGE_RESERVED } from "@/lib/garage-routes";
import { PhotoGallery } from "@/components/garage-profile/PhotoGallery";

export default async function PublicGalleryPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (GARAGE_RESERVED.has(username)) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  const { data: albums } = await supabase
    .from("garage_albums")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const albumIds = (albums ?? []).map((a) => a.id);
  const { data: photos } =
    albumIds.length > 0
      ? await supabase
          .from("garage_photos")
          .select("*")
          .in("album_id", albumIds)
          .order("sort_order")
      : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/garage/${username}`}
          className="text-sm text-text-muted hover:text-text"
        >
          ← @{username}
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
          {profile.display_name ?? username} · Gallery
        </h1>
      </div>
      <PhotoGallery
        albums={albums ?? []}
        photos={photos ?? []}
        ownerUserId={profile.id}
      />
    </div>
  );
}
