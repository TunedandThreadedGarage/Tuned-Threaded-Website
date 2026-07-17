"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth, type PresenceStatus } from "@/components/auth/AuthProvider";

const PIN_KEY = "tt:dm-pinned";

export function usePinnedConversations() {
  const [pinned, setPinned] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(PIN_KEY);
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      /* ignore */
    }
    return [];
  });

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
 * Messages-scoped presence bridge — uses global AuthProvider presence only.
 * Does not track a separate channel that could override away/offline.
 */
export function OnlinePresenceProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const { getPresence } = useAuth();

  const value = useMemo<PresenceCtx>(
    () => ({
      getStatus: (id: string) => getPresence(id),
      isOnline: (id: string) => {
        const status = getPresence(id);
        return status === "online" || status === "away";
      },
    }),
    [getPresence],
  );

  // Keep prop for API compatibility with MessagesShell.
  void userId;

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
