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
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/realtime";

export type PresenceStatus = "online" | "away" | "offline";

type AuthContextValue = {
  user: User | null;
  userId: string | null;
  ready: boolean;
  /** Bumps when auth/realtime should resubscribe. */
  realtimeEpoch: number;
  presenceStatus: PresenceStatus;
  getPresence: (userId: string) => PresenceStatus;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userId: null,
  ready: false,
  realtimeEpoch: 0,
  presenceStatus: "offline",
  getPresence: () => "offline",
});

const AWAY_MS = 10 * 60 * 1000;
const HEARTBEAT_MS = 60 * 1000;
const PRESENCE_CHANNEL = "presence:garage";
const CONNECTION_KEY = "tt:presence-connection-id";

function getTabConnectionId(): string {
  try {
    let id = sessionStorage.getItem(CONNECTION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(CONNECTION_KEY, id);
    }
    return id;
  } catch {
    return `tab-${Date.now()}`;
  }
}

/**
 * Server-side presence heartbeat. Keeps per-tab connections fresh so the
 * notification service can decide whether to queue emails. Aggregate
 * "online" also cancels any pending queued emails for this user.
 */
function sendPresenceHeartbeat(status: PresenceStatus, connectionId: string) {
  try {
    const body = JSON.stringify({ status, connectionId });
    if (status === "offline" && "sendBeacon" in navigator) {
      navigator.sendBeacon(
        "/api/presence",
        new Blob([body], { type: "application/json" }),
      );
      return;
    }
    void fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: status === "offline",
    }).catch(() => {});
  } catch {
    // Presence is best-effort; never break the UI over it.
  }
}

function bestPeerStatus(metas: { status?: PresenceStatus }[]): PresenceStatus {
  let best: PresenceStatus = "offline";
  for (const meta of metas) {
    if (meta?.status === "online") return "online";
    if (meta?.status === "away") best = "away";
  }
  return best;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [realtimeEpoch, setRealtimeEpoch] = useState(0);
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>("offline");
  const [peerPresence, setPeerPresence] = useState<Map<string, PresenceStatus>>(
    () => new Map(),
  );
  const prevUserId = useRef<string | null>(null);
  const awayTimer = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const statusRef = useRef<PresenceStatus>("offline");
  const connectionIdRef = useRef<string>("");

  const bumpRealtime = useCallback(() => {
    setRealtimeEpoch((n) => n + 1);
  }, []);

  const trackPresence = useCallback(async (status: PresenceStatus) => {
    const changed = statusRef.current !== status;
    statusRef.current = status;
    setPresenceStatus(status);
    const connectionId = connectionIdRef.current || getTabConnectionId();
    connectionIdRef.current = connectionId;
    if (prevUserId.current && (changed || status !== "offline")) {
      // Heartbeat on change; offline always sent so this tab disconnects.
      if (changed || status === "offline") {
        sendPresenceHeartbeat(status, connectionId);
      }
    }
    const channel = channelRef.current;
    if (!channel) return;
    if (status === "offline") {
      await channel.untrack();
      return;
    }
    await channel.track({
      status,
      at: new Date().toISOString(),
      connectionId,
    });
  }, []);

  const scheduleAway = useCallback(() => {
    if (awayTimer.current) window.clearTimeout(awayTimer.current);
    awayTimer.current = window.setTimeout(() => {
      if (statusRef.current === "online") {
        void trackPresence("away");
      }
    }, AWAY_MS);
  }, [trackPresence]);

  const markActive = useCallback(() => {
    if (!prevUserId.current) return;
    if (document.visibilityState !== "visible") return;
    if (statusRef.current !== "online") {
      void trackPresence("online");
    }
    scheduleAway();
  }, [scheduleAway, trackPresence]);

  // Keep browser session + RSC tree in sync after cookie/server auth changes.
  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    async function sync(fromEvent?: string) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await ensureRealtimeAuth(supabase);
      if (!alive) return;

      const next = session?.user ?? null;
      const nextId = next?.id ?? null;
      const prevId = prevUserId.current;
      setUser(next);
      setReady(true);

      if (prevId !== nextId) {
        prevUserId.current = nextId;
        bumpRealtime();
        if (
          fromEvent === "SIGNED_IN" ||
          fromEvent === "SIGNED_OUT" ||
          (prevId === null && nextId) ||
          (prevId && !nextId)
        ) {
          router.refresh();
        }
      } else if (fromEvent === "TOKEN_REFRESHED") {
        bumpRealtime();
      }
    }

    void sync("INITIAL");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      void sync(event);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [bumpRealtime, router]);

  // Re-read cookies after soft navigations (server-action login does not emit SIGNED_IN).
  useEffect(() => {
    if (!ready) return;
    const supabase = createClient();
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await ensureRealtimeAuth(supabase);
      const next = session?.user ?? null;
      const nextId = next?.id ?? null;
      if (nextId !== prevUserId.current) {
        prevUserId.current = nextId;
        setUser(next);
        bumpRealtime();
        router.refresh();
      }
    })();
  }, [pathname, ready, bumpRealtime, router]);

  // Global presence channel for signed-in users.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      if (channelRef.current) {
        const supabase = createClient();
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      statusRef.current = "offline";
      // Defer React state resets so we don't cascade-render inside the effect.
      queueMicrotask(() => {
        setPeerPresence(new Map());
        setPresenceStatus("offline");
      });
      return;
    }

    connectionIdRef.current = getTabConnectionId();
    let alive = true;
    const supabase = createClient();

    void (async () => {
      await ensureRealtimeAuth(supabase);
      if (!alive) return;

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Key by connection so multiple tabs from the same user do not overwrite.
      const channel = supabase.channel(PRESENCE_CHANNEL, {
        config: { presence: { key: `${userId}:${connectionIdRef.current}` } },
      });
      channelRef.current = channel;

      const syncPeers = () => {
        const state = channel.presenceState<{ status?: PresenceStatus }>();
        const next = new Map<string, PresenceStatus>();
        for (const [key, metas] of Object.entries(state)) {
          const userKey = key.includes(":") ? key.split(":")[0] : key;
          const status = bestPeerStatus(metas);
          const current = next.get(userKey) ?? "offline";
          if (status === "online") next.set(userKey, "online");
          else if (status === "away" && current !== "online") {
            next.set(userKey, "away");
          } else if (!next.has(userKey)) {
            next.set(userKey, status);
          }
        }
        setPeerPresence(next);
      };

      channel
        .on("presence", { event: "sync" }, syncPeers)
        .on("presence", { event: "join" }, syncPeers)
        .on("presence", { event: "leave" }, syncPeers);

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED" && alive) {
          await trackPresence(
            document.visibilityState === "visible" ? "online" : "away",
          );
          scheduleAway();
        }
      });
    })();

    return () => {
      alive = false;
      // Mark this tab offline so other tabs keep the aggregate correct.
      if (connectionIdRef.current) {
        sendPresenceHeartbeat("offline", connectionIdRef.current);
      }
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, realtimeEpoch, scheduleAway, trackPresence]);

  // Keep-alive heartbeat so server-side presence never goes stale while
  // the user is online or away (a stale row reads as "offline").
  useEffect(() => {
    if (!user?.id) return;
    const connectionId = connectionIdRef.current || getTabConnectionId();
    connectionIdRef.current = connectionId;
    sendPresenceHeartbeat(
      statusRef.current === "offline" ? "away" : statusRef.current,
      connectionId,
    );
    const interval = window.setInterval(() => {
      if (statusRef.current !== "offline") {
        sendPresenceHeartbeat(statusRef.current, connectionId);
      }
    }, HEARTBEAT_MS);
    return () => window.clearInterval(interval);
  }, [user?.id]);

  // Visibility + activity → online / away / offline
  useEffect(() => {
    if (!user?.id) return;

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        void trackPresence("away");
      } else {
        markActive();
      }
    }

    function onPageHide() {
      void trackPresence("offline");
    }

    function onPageShow() {
      // Recover from BFCache / reopen: restore online if visible.
      if (document.visibilityState === "visible") {
        markActive();
      }
    }

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;

    for (const ev of activityEvents) {
      window.addEventListener(ev, markActive, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      for (const ev of activityEvents) {
        window.removeEventListener(ev, markActive);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      if (awayTimer.current) window.clearTimeout(awayTimer.current);
    };
  }, [user?.id, markActive, trackPresence]);

  const getPresence = useCallback(
    (id: string): PresenceStatus => {
      if (user?.id === id) return presenceStatus;
      return peerPresence.get(id) ?? "offline";
    },
    [peerPresence, presenceStatus, user?.id],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId: user?.id ?? null,
      ready,
      realtimeEpoch,
      presenceStatus,
      getPresence,
    }),
    [user, ready, realtimeEpoch, presenceStatus, getPresence],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
