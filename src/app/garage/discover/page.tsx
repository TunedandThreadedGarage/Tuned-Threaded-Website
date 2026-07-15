import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/garage-profile/Avatar";
import { BuildCard } from "@/components/garage-profile/BuildCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { SkillBadge } from "@/components/garage-profile/SkillBadge";
import type { Build, Profile } from "@/types/database";

type BuildAuthor = Pick<Profile, "username" | "display_name" | "avatar_url">;
type BuildRow = Build & { profiles: BuildAuthor | null };

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: builds }, { data: members }] = await Promise.all([
    supabase
      .from("builds")
      .select(
        "*, profiles!builds_user_id_fkey(username, display_name, avatar_url)",
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, skill_level, bio")
      .eq("onboarding_completed", true)
      .not("username", "is", null)
      .order("created_at", { ascending: false })
      .limit(18),
  ]);

  const buildIds = (builds ?? []).map((b) => b.id);
  const { data: photos } =
    buildIds.length > 0
      ? await supabase
          .from("build_photos")
          .select("*")
          .in("build_id", buildIds)
          .order("sort_order", { ascending: true })
      : { data: [] as { build_id: string; url: string }[] };

  const photoByBuild = new Map<string, { url: string }>();
  for (const photo of photos ?? []) {
    if (!photoByBuild.has(photo.build_id)) {
      photoByBuild.set(photo.build_id, { url: photo.url });
    }
  }

  const buildRows = (builds ?? []) as BuildRow[];

  return (
    <div className="space-y-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Community
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Discover the Garage
          </h2>
          <p className="mt-2 max-w-xl text-sm text-text-muted">
            Public builds and members from the Tuned &amp; Threaded community.
          </p>
        </div>
        {!user ? (
          <Button href="/garage/sign-up" variant="primary">
            Join the Garage
          </Button>
        ) : null}
      </header>

      <section>
        <h3 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Latest builds
        </h3>
        {buildRows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildRows.map((build) => (
              <div key={build.id} className="space-y-2">
                <BuildCard
                  build={build}
                  photo={photoByBuild.get(build.id)}
                  href={`/garage/builds/${build.id}`}
                />
                {build.profiles?.username ? (
                  <Link
                    href={`/garage/${build.profiles.username}`}
                    className="flex items-center gap-2 px-1 text-sm text-text-muted transition-colors hover:text-text"
                  >
                    <Avatar
                      url={build.profiles.avatar_url}
                      name={build.profiles.display_name ?? build.profiles.username}
                      size="sm"
                    />
                    <span>
                      {build.profiles.display_name ?? `@${build.profiles.username}`}
                    </span>
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No public builds yet"
            description="Be the first to document a project for the community."
            action={
              <Button href="/garage/builds/new" variant="secondary">
                Start a build
              </Button>
            }
          />
        )}
      </section>

      <section>
        <h3 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Members
        </h3>
        {members && members.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/garage/${member.username}`}
                className="flex items-start gap-3 border border-border bg-surface p-4 transition-colors hover:border-metal/30"
              >
                <Avatar
                  url={member.avatar_url}
                  name={member.display_name ?? member.username}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[family-name:var(--font-display)] font-medium text-text">
                    {member.display_name ?? member.username}
                  </p>
                  <p className="text-sm text-text-muted">@{member.username}</p>
                  <div className="mt-2">
                    <SkillBadge level={member.skill_level} />
                  </div>
                  {member.bio ? (
                    <p className="mt-2 line-clamp-2 text-xs text-text-muted">
                      {member.bio}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No members yet"
            description="Create a Garage Profile to show up here."
          />
        )}
      </section>
    </div>
  );
}
