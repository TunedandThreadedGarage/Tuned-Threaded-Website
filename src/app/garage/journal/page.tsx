import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { createJournalEntry, deleteJournalEntry } from "@/features/builds/actions";
import { JournalForm } from "@/features/builds/components/JournalForm";
import { DeleteButton } from "@/components/ui/DeleteButton";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Garage Journal
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Private notes from the bay — progress, failures, and wins.
        </p>
      </div>

      <JournalForm action={createJournalEntry} />

      {entries && entries.length > 0 ? (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
                    {entry.entry_date}
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-text">
                    {entry.title}
                  </h3>
                  {entry.body ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-text-muted">
                      {entry.body}
                    </p>
                  ) : null}
                </div>
                <DeleteButton
                  label="Delete"
                  onDelete={deleteJournalEntry.bind(null, entry.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No journal entries"
          description="Start documenting nights in the garage."
        />
      )}

      <Link href="/garage" className="text-sm text-text-muted hover:text-text">
        ← Back to profile
      </Link>
      <span className="hidden">
        <Button href="/garage">Home</Button>
      </span>
    </div>
  );
}
