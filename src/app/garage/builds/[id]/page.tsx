import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/garage-profile/Avatar";
import { ProgressBar } from "@/components/garage-profile/ProgressBar";
import { BuildPhotoUpload } from "@/features/builds/components/BuildPhotoUpload";
import { LikeButton } from "@/features/social/components/LikeButton";
import { CommentForm } from "@/features/social/components/CommentForm";
import { ShareButton } from "@/features/social/components/ShareButton";
import { SaveBuildButton } from "@/features/social/components/SaveBuildButton";
import { deleteBuild } from "@/features/builds/actions";
import { DeleteButton } from "@/components/ui/DeleteButton";

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: build } = await supabase
    .from("builds")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!build) notFound();
  if (!build.is_public && build.user_id !== user?.id) notFound();

  const [
    { data: profile },
    { data: photos },
    { data: likes },
    { data: comments },
    savedResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url, accent_color")
      .eq("id", build.user_id)
      .single(),
    supabase
      .from("build_photos")
      .select("*")
      .eq("build_id", id)
      .order("sort_order"),
    supabase.from("build_likes").select("user_id").eq("build_id", id),
    supabase
      .from("build_comments")
      .select("*")
      .eq("build_id", id)
      .order("created_at", { ascending: true }),
    user
      ? supabase
          .from("saved_builds")
          .select("*")
          .eq("build_id", id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const commentUserIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: commentProfiles } =
    commentUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", commentUserIds)
      : { data: [] };

  const profileById = new Map(
    (commentProfiles ?? []).map((p) => [p.id, p] as const),
  );

  const liked = Boolean(user && likes?.some((l) => l.user_id === user.id));
  const isOwner = user?.id === build.user_id;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shareUrl = `${siteUrl}/garage/builds/${build.id}`;

  return (
    <article
      className="mx-auto max-w-3xl space-y-8"
      style={
        {
          ["--garage-accent" as string]: profile?.accent_color || "#c4121a",
        } as React.CSSProperties
      }
    >
      <div className="flex items-center gap-3">
        <Avatar
          url={profile?.avatar_url}
          name={profile?.display_name ?? profile?.username}
          size="sm"
        />
        <div>
          <Link
            href={profile?.username ? `/garage/${profile.username}` : "/garage"}
            className="text-sm font-medium text-text hover:underline"
          >
            {profile?.display_name ?? "Member"}
          </Link>
          {profile?.username ? (
            <p className="text-xs text-text-muted">@{profile.username}</p>
          ) : null}
        </div>
      </div>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
          {build.title}
        </h1>
        {build.body ? (
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-text-muted">
            {build.body}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 border border-border bg-surface/40 p-5">
        <ProgressBar
          value={build.progress_pct ?? 0}
          label="Build progress"
        />
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
              Current stage
            </p>
            <p className="mt-1 text-text">{build.current_stage ?? "—"}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
              Upcoming
            </p>
            <p className="mt-1 text-text">{build.upcoming_stage ?? "—"}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
              Est. completion
            </p>
            <p className="mt-1 text-text">
              {build.estimated_completion ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {photos && photos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] overflow-hidden bg-surface"
            >
              <Image
                src={photo.url}
                alt=""
                fill
                className="object-cover"
                sizes="50vw"
              />
            </div>
          ))}
        </div>
      ) : null}

      {isOwner ? (
        <BuildPhotoUpload buildId={build.id} userId={build.user_id} />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <LikeButton
          buildId={build.id}
          liked={liked}
          count={likes?.length ?? 0}
          disabled={!user}
        />
        <span className="text-sm text-text-muted">
          {comments?.length ?? 0} comments
        </span>
        {user ? (
          <SaveBuildButton
            buildId={build.id}
            initiallySaved={Boolean(savedResult.data)}
          />
        ) : null}
        <ShareButton title={build.title} url={shareUrl} />
        {isOwner ? (
          <DeleteButton
            label="Delete build"
            onDelete={deleteBuild.bind(null, build.id)}
          />
        ) : null}
      </div>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
          Comments
        </h2>
        <ul className="space-y-4">
          {(comments ?? []).map((comment) => {
            const author = profileById.get(comment.user_id);
            return (
              <li
                key={comment.id}
                className="border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    url={author?.avatar_url}
                    name={author?.display_name ?? author?.username}
                    size="sm"
                  />
                  <p className="text-sm font-medium text-text">
                    {author?.display_name ?? "Member"}
                  </p>
                </div>
                <p className="mt-2 text-sm text-text-muted">{comment.body}</p>
              </li>
            );
          })}
        </ul>
        {user ? (
          <CommentForm buildId={build.id} />
        ) : (
          <p className="text-sm text-text-muted">
            <Link href="/garage/sign-in" className="underline">
              Sign in
            </Link>{" "}
            to comment.
          </p>
        )}
      </section>
    </article>
  );
}
