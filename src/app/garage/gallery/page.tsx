import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GalleryManager } from "@/features/gallery/components/GalleryManager";

export default async function OwnerGalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const [{ data: albums }, { data: photos }] = await Promise.all([
    supabase
      .from("garage_albums")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("garage_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
          Gallery
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Organize albums — builds, rolling shots, dyno sheets, garage photos.
        </p>
      </div>
      <GalleryManager
        albums={albums ?? []}
        photos={photos ?? []}
        userId={user.id}
      />
    </div>
  );
}
