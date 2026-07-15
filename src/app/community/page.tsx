import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getUserVehiclesForPost,
  loadCommunityFeed,
  loadPostById,
  loadTrendingBundle,
} from "@/features/community/actions";
import { CommunityFeed } from "@/features/community/components/CommunityFeed";
import { CreatePostButton } from "@/features/community/components/CreatePostModal";
import { PostCard } from "@/features/community/components/PostCard";
import { TrendingAside } from "@/features/community/components/TrendingAside";
import { Button } from "@/components/ui/Button";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>;
}) {
  const { post: postId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ posts, nextCursor, error }, trending, vehicles, deep] =
    await Promise.all([
      loadCommunityFeed({ tab: "newest" }),
      loadTrendingBundle(),
      user ? getUserVehiclesForPost() : Promise.resolve([]),
      postId ? loadPostById(postId) : Promise.resolve({ post: null }),
    ]);

  let unread = 0;
  if (user) {
    const { count } = await supabase
      .from("community_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unread = count ?? 0;
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Community
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            The garage feed
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            Build updates, dyno sheets, questions, and discussions from Tuned
            &amp; Threaded members — designed for people who stay after dark.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user && unread > 0 ? (
            <Link
              href="/community/notifications"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent"
            >
              {unread} new
            </Link>
          ) : null}
          {!user ? (
            <Button href="/garage/sign-up" variant="primary">
              Join the Garage
            </Button>
          ) : (
            <Button href="/community/search" variant="secondary">
              Search
            </Button>
          )}
        </div>
      </header>

      {deep.post ? (
        <section className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
            Shared post
          </p>
          <PostCard post={deep.post} signedIn={Boolean(user)} />
        </section>
      ) : null}

      {error && !error.includes("community_posts") ? (
        <p className="text-sm text-accent">{error}</p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <CommunityFeed
          initialPosts={posts}
          initialCursor={nextCursor}
          signedIn={Boolean(user)}
          initialTab="newest"
        />
        <div className="lg:block">
          <div className="lg:sticky lg:top-28">
            <TrendingAside
              topPosts={trending.topPosts}
              mostCommented={trending.mostCommented}
              popularGarages={trending.popularGarages}
              newestBuilds={trending.newestBuilds}
              popularVehicles={trending.popularVehicles}
            />
          </div>
        </div>
      </div>

      <CreatePostButton signedIn={Boolean(user)} vehicles={vehicles} />
    </div>
  );
}
