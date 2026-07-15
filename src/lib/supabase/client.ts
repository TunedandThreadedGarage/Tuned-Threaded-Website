import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/config";

export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}

export { isSupabaseConfigured } from "@/lib/supabase/config";
