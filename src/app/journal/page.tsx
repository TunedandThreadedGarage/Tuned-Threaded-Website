import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadJournalFeed } from "@/features/journal/actions";
import { JOURNAL_CATEGORIES } from "@/features/journal/constants";
import { JournalComposer } from "@/features/journal/components/JournalComposer";
import { JournalTimeline } from "@/features/journal/components/JournalTimeline";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  scope?: string;
}>;

export default async function JournalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const scopeRaw = params.scope ?? "public";
  const scope =
    scopeRaw === "mine" || scopeRaw === "drafts" ? scopeRaw : "public";
  const q = params.q?.trim() || undefined;
  const category = params.category?.trim() || undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ items, error }, buildsRes] = await Promise.all([
    loadJournalFeed({ q, category, scope }),
    user
      ? supabase
          .from("builds")
          .select("id, title")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const builds = buildsRes.data ?? [];

  const scopes = [
    { key: "public", label: "Public" },
    { key: "mine", label: "My entries" },
    { key: "drafts", label: "Drafts" },
  ] as const;

  function hrefFor(next: {
    scope?: string;
    category?: string | null;
    q?: string | null;
  }) {
    const sp = new URLSearchParams();
    const s = next.scope ?? scope;
    if (s !== "public") sp.set("scope", s);
    const c = next.category === null ? undefined : (next.category ?? category);
    if (c) sp.set("category", c);
    const query = next.q === null ? undefined : (next.q ?? q);
    if (query) sp.set("q", query);
    const qs = sp.toString();
    return qs ? `/journal?${qs}` : "/journal";
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          Journal
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text md:text-4xl">
          Nights in the bay.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Build logs, photos, videos, and notes — public or private — on a
          timeline built for the garage.
        </p>
      </div>

      {user ? (
        <JournalComposer userId={user.id} builds={builds} />
      ) : (
        <p className="border border-border bg-surface/20 px-5 py-4 text-sm text-text-muted">
          <Link href="/garage/sign-in?next=/journal" className="text-text underline">
            Sign in
          </Link>{" "}
          to create journal entries, like, and comment.
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {scopes.map((s) => {
            const active = scope === s.key;
            const locked = s.key !== "public" && !user;
            return locked ? (
              <Link
                key={s.key}
                href={`/garage/sign-in?next=/journal?scope=${s.key}`}
                className="border border-border px-3 py-1.5 text-xs text-text-muted"
              >
                {s.label}
              </Link>
            ) : (
              <Link
                key={s.key}
                href={hrefFor({ scope: s.key })}
                className={`border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-text text-text"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        <form className="flex gap-2" action="/journal" method="get">
          {scope !== "public" ? (
            <input type="hidden" name="scope" value={scope} />
          ) : null}
          {category ? (
            <input type="hidden" name="category" value={category} />
          ) : null}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search entries…"
            className="w-full min-w-[180px] border border-border bg-surface px-3 py-2 text-sm text-text sm:w-56"
          />
          <button
            type="submit"
            className="border border-border px-3 py-2 text-xs text-text-muted hover:text-text"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={hrefFor({ category: null })}
          className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
            !category ? "text-text" : "text-metal hover:text-text"
          }`}
        >
          All
        </Link>
        {JOURNAL_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={hrefFor({ category: c })}
            className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
              category === c ? "text-text" : "text-metal hover:text-text"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <JournalTimeline
        items={items}
        currentUserId={user?.id ?? null}
        signedIn={Boolean(user)}
      />
    </div>
  );
}
