"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/realtime";
import { useAuth, type PresenceStatus } from "@/components/auth/AuthProvider";

const PIN_KEY = "tt:dm-pinned";

export function usePinnedConversations() {
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PIN_KEY);
      if (raw) setPinned(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [id, ...prev];
      localStorage.setItem(PIN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isPinned = useCallback(
    (id: string) => pinned.includes(id),
    [pinned],
  );

  return { pinned, togglePin, isPinned };
}

type PresenceCtx = {
  getStatus: (id: string) => PresenceStatus;
  isOnline: (id: string) => boolean;
};

const OnlinePresenceContext = createContext<PresenceCtx>({
  getStatus: () => "offline",
  isOnline: () => false,
});

/**
 * Messages-scoped presence bridge — prefers global AuthProvider presence
 * so status works across the site, not only on /messages.
 */
export function OnlinePresenceProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const { getPresence, realtimeEpoch } = useAuth();
  const [fallbackOnline, setFallbackOnline] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const supabase = createClient();

    void (async () => {
      await ensureRealtimeAuth(supabase);
      if (!alive) return;

      const channel = supabase.channel("presence:messages", {
        config: { presence: { key: userId } },
      });
      channelRef.current = channel;

      const sync = () => {
        const state = channel.presenceState();
        setFallbackOnline(new Set(Object.keys(state)));
      };

      channel
        .on("presence", { event: "sync" }, sync)
        .on("presence", { event: "join" }, sync)
        .on("presence", { event: "leave" }, sync)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && alive) {
            await channel.track({
              status: "online",
              at: new Date().toISOString(),
            });
          }
        });
    })();

    return () => {
      alive = false;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, realtimeEpoch]);

  const value = useMemo<PresenceCtx>(
    () => ({
      getStatus: (id: string) => {
        const global = getPresence(id);
        if (global !== "offline") return global;
        return fallbackOnline.has(id) ? "online" : "offline";
      },
      isOnline: (id: string) => {
        const status = getPresence(id);
        if (status === "online" || status === "away") return true;
        return fallbackOnline.has(id);
      },
    }),
    [getPresence, fallbackOnline],
  );

  return (
    <OnlinePresenceContext.Provider value={value}>
      {children}
    </OnlinePresenceContext.Provider>
  );
}

export function useOnlinePresence() {
  return useContext(OnlinePresenceContext);
}

export function formatMessageTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function presenceLabel(status: PresenceStatus): string {
  if (status === "online") return "Online";
  if (status === "away") return "Away";
  return "Offline";
}

export function presenceDotClass(status: PresenceStatus): string {
  if (status === "online") return "bg-emerald-400";
  if (status === "away") return "bg-amber-400";
  return "bg-zinc-600";
}
