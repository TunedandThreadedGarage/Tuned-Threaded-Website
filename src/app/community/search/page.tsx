import { createClient } from "@/lib/supabase/server";
import { CommunitySearch } from "@/features/community/components/CommunitySearch";

export default async function CommunitySearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <CommunitySearch signedIn={Boolean(user)} />;
}
