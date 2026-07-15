import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GARAGE_RESERVED } from "@/lib/garage-routes";
import { Avatar } from "@/components/garage-profile/Avatar";

export default async function FollowersPage({
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

  const { data: follows } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", profile.id);

  const ids = (follows ?? []).map((f) => f.follower_id);
  const { data: members } =
    ids.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, skill_level")
          .in("id", ids)
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
          Followers
        </h1>
      </div>
      <ul className="divide-y divide-border border border-border">
        {(members ?? []).map((m) => (
          <li key={m.id}>
            <Link
              href={m.username ? `/garage/${m.username}` : "/garage"}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface"
            >
              <Avatar
                url={m.avatar_url}
                name={m.display_name ?? m.username}
                size="sm"
              />
              <div>
                <p className="text-sm text-text">
                  {m.display_name ?? m.username}
                </p>
                <p className="text-xs text-text-muted">@{m.username}</p>
              </div>
            </Link>
          </li>
        ))}
        {(members ?? []).length === 0 ? (
          <li className="px-4 py-6 text-sm text-text-muted">No followers yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
