import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBuild } from "@/features/builds/actions";
import { BuildCreateForm } from "@/features/builds/components/BuildCreateForm";

export default async function NewBuildPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          New build
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Share what you&apos;re working on — authenticity over polish.
        </p>
      </div>
      <BuildCreateForm action={createBuild} vehicles={vehicles ?? []} />
    </div>
  );
}
