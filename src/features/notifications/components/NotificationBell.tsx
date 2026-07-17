"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/realtime";
import { getUnreadNotificationCount } from "@/features/notifications/actions";
import { useGarage } from "@/components/garage/GarageExperience";
import { useAuth } from "@/components/auth/AuthProvider";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 3.2.8 4.6 1.4 5.5H5.1c.6-.9 1.4-2.3 1.4-5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.2a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NotificationBell() {
  const { phase } = useGarage();
  const { userId, ready: authReady, realtimeEpoch } = useAuth();
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  const refresh = useCallback(async () => {
    const { count: next } = await getUnreadNotificationCount();
    setCount(next);
  }, []);

  useEffect(() => {
    if (!authReady || !userId) {
      setCount(0);
      return;
    }

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let alive = true;

    function onCleared() {
      setCount(0);
    }
    window.addEventListener("tt:notifications-read", onCleared);

    void (async () => {
      await ensureRealtimeAuth(supabase);
      if (!alive) return;
      await refresh();
      if (!alive) return;

      channel = supabase
        .channel(`nav-notifications:${userId}:${realtimeEpoch}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            setCount((c) => c + 1);
            setPulse(true);
            window.setTimeout(() => setPulse(false), 900);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void refresh();
          },
        )
        .subscribe();
    })();

    return () => {
      alive = false;
      window.removeEventListener("tt:notifications-read", onCleared);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [authReady, userId, realtimeEpoch, refresh]);

  if (!authReady || !userId) {
    return (
      <Link
        href="/garage/sign-in?next=/notifications"
        aria-label="Notifications"
        className="grid h-10 w-10 place-items-center text-text-muted transition-colors hover:text-text"
        tabIndex={phase === "open" ? undefined : -1}
      >
        <BellIcon className="h-[18px] w-[18px]" />
      </Link>
    );
  }

  const label =
    count > 0
      ? `Notifications, ${count} unread`
      : "Notifications";

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className={`relative grid h-10 w-10 place-items-center text-text-muted transition-colors hover:text-text ${
        pulse ? "text-accent" : ""
      }`}
      tabIndex={phase === "open" ? undefined : -1}
    >
      <BellIcon className="h-[18px] w-[18px]" />
      {count > 0 ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[9px] font-medium text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
