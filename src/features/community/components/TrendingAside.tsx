import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/garage-profile/Avatar";
import { SkillBadge } from "@/components/garage-profile/SkillBadge";
import type {
  FeedAuthor,
  FeedPost,
  FeedBuildRef,
  FeedVehicleCard,
} from "@/features/community/actions";
import { reputationBand } from "@/features/community/constants";
import { FadeIn } from "@/components/ui/FadeIn";

function PostTeaser({ posts, empty }: { posts: FeedPost[]; empty: string }) {
  if (posts.length === 0) {
    return <li className="text-sm text-text-muted">{empty}</li>;
  }
  return (
    <>
      {posts.map((p) => (
        <li key={p.id} className="border-b border-border pb-3 last:border-0">
          <p className="line-clamp-2 text-sm text-text">
            {p.title || p.body || "Untitled post"}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
            {p.like_count} likes · {p.comment_count} comments
          </p>
        </li>
      ))}
    </>
  );
}

export function TrendingAside({
  topPosts,
  mostCommented,
  popularGarages,
  newestBuilds,
  popularVehicles,
}: {
  topPosts: FeedPost[];
  mostCommented: FeedPost[];
  popularGarages: FeedAuthor[];
  newestBuilds: FeedBuildRef[];
  popularVehicles: FeedVehicleCard[];
}) {
  return (
    <aside className="space-y-8">
      <FadeIn>
        <section className="border border-border bg-surface/20 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Trending
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-text">
            Most liked
          </h3>
          <ul className="mt-4 space-y-4">
            <PostTeaser posts={topPosts} empty="No trending posts yet." />
          </ul>
        </section>
      </FadeIn>

      <FadeIn delay={0.05}>
        <section className="border border-border bg-surface/20 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Hot threads
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-text">
            Most commented
          </h3>
          <ul className="mt-4 space-y-4">
            <PostTeaser
              posts={mostCommented}
              empty="No discussions yet."
            />
          </ul>
        </section>
      </FadeIn>

      <FadeIn delay={0.08}>
        <section className="border border-border bg-surface/20 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Popular garages
          </p>
          <ul className="mt-4 space-y-3">
            {popularGarages.length === 0 ? (
              <li className="text-sm text-text-muted">No garages yet.</li>
            ) : (
              popularGarages.map((g) => (
                <li key={g.id}>
                  <Link
                    href={g.username ? `/garage/${g.username}` : "#"}
                    className="flex items-center gap-3 transition-opacity hover:opacity-90"
                  >
                    <Avatar
                      url={g.avatar_url}
                      name={g.display_name ?? g.username}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">
                        {g.display_name ?? g.username}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <SkillBadge level={g.skill_level} />
                        <span className="font-mono text-[10px] text-metal">
                          {reputationBand(g.reputation_cached)} ·{" "}
                          {g.reputation_cached} rep
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="border border-border bg-surface/20 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Popular vehicles
          </p>
          <ul className="mt-4 space-y-3">
            {popularVehicles.length === 0 ? (
              <li className="text-sm text-text-muted">No vehicles yet.</li>
            ) : (
              popularVehicles.map((v) => {
                const href =
                  v.username && v.id
                    ? `/garage/${v.username}/vehicles/${v.id}`
                    : v.username
                      ? `/garage/${v.username}`
                      : "#";
                const label = [v.year, v.make, v.model]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <li key={v.id}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 transition-opacity hover:opacity-90"
                    >
                      <div className="relative h-10 w-14 shrink-0 overflow-hidden border border-border bg-surface-elevated">
                        {v.photo_url ? (
                          <Image
                            src={v.photo_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-text">{label}</p>
                        {v.username ? (
                          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                            @{v.username}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </FadeIn>

      <FadeIn delay={0.12}>
        <section className="border border-border bg-surface/20 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Newest builds
          </p>
          <ul className="mt-4 space-y-3">
            {newestBuilds.length === 0 ? (
              <li className="text-sm text-text-muted">No builds yet.</li>
            ) : (
              newestBuilds.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/garage/builds/${b.id}`}
                    className="text-sm text-text hover:underline"
                  >
                    {b.title}
                  </Link>
                  {b.username ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                      @{b.username}
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </FadeIn>
    </aside>
  );
}
