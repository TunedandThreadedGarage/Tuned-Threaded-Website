"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/realtime";

/** Client sign-out so the browser session + realtime drop immediately. */
export async function clientSignOut() {
  const supabase = createClient();
  // Mark this tab offline while the session cookie is still valid.
  try {
    let connectionId = "default";
    try {
      connectionId =
        sessionStorage.getItem("tt:presence-connection-id") ?? "default";
    } catch {
      /* ignore */
    }
    await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "offline", connectionId }),
    });
  } catch {
    // Best-effort; sign-out proceeds regardless.
  }
  await supabase.auth.signOut();
  await ensureRealtimeAuth(supabase);
}

export function SignOutButton({
  className,
  children = "Sign Out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await clientSignOut();
        router.refresh();
        router.replace("/");
      }}
    >
      {children}
    </button>
  );
}
