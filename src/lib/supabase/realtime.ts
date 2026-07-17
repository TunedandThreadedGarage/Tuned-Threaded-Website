import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Push the current access token into the realtime socket.
 * Required after login when channels were previously subscribed as anon.
 */
export async function ensureRealtimeAuth(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;
  // setAuth exists on realtime client; keep optional for type flexibility.
  const realtime = supabase.realtime as {
    setAuth?: (token: string | null) => Promise<void> | void;
  };
  if (typeof realtime.setAuth === "function") {
    await realtime.setAuth(token);
  }
  return token;
}
