"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { OnlinePresenceProvider } from "@/features/messages/hooks";

function cancelPendingMessageEmails() {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    return;
  }
  void fetch("/api/notifications/cancel-messages", {
    method: "POST",
    keepalive: true,
  }).catch(() => {});
}

export function MessagesShell({
  userId,
  sidebar,
  children,
}: {
  userId: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isThread =
    pathname.startsWith("/messages/") &&
    pathname !== "/messages/requests";

  // Opening Messages (inbox or thread) cancels queued DM emails.
  useEffect(() => {
    cancelPendingMessageEmails();
    function onVisible() {
      if (document.visibilityState === "visible") {
        cancelPendingMessageEmails();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pathname]);

  return (
    <OnlinePresenceProvider userId={userId}>
      <div className="mx-auto w-full max-w-[1200px] px-0 pb-0 pt-20 md:px-5 md:pb-8 md:pt-24">
        <div className="flex h-[calc(100dvh-5rem)] overflow-hidden border-border bg-[#0a0a0c] md:h-[min(780px,calc(100dvh-7rem))] md:border">
          <aside
            className={`flex w-full flex-col border-border md:w-[340px] md:shrink-0 md:border-r lg:w-[380px] ${
              isThread ? "hidden md:flex" : "flex"
            }`}
          >
            {sidebar}
          </aside>
          <main
            className={`min-w-0 flex-1 flex-col ${
              isThread ? "flex" : "hidden md:flex"
            }`}
          >
            {children}
          </main>
        </div>
        {!isThread ? (
          <p className="mt-3 hidden px-5 text-center text-xs text-text-muted md:block">
            Select a conversation to start chatting.
          </p>
        ) : null}
      </div>
    </OnlinePresenceProvider>
  );
}
