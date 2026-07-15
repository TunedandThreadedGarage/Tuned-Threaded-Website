import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadBuildShowcase } from "@/features/builds-hub/actions";
import { BuildJournal } from "@/features/builds-hub/components/BuildJournal";

export default async function BuildShowcasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { bundle, error } = await loadBuildShowcase(id);
  if (!bundle) {
    if (error) {
      // Soft schema miss should not 500 the whole site
      notFound();
    }
    notFound();
  }

  return <BuildJournal initial={bundle} signedIn={Boolean(user)} />;
}
