"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { useGarage } from "@/components/garage/GarageExperience";
import { useAuth } from "@/components/auth/AuthProvider";
import { SignOutButton } from "@/features/auth/components/SignOutButton";

const MENU_ITEMS = [
  { href: "/garage", label: "My Profile" },
  { href: "/messages", label: "Messages" },
  { href: "/garage/orders", label: "Orders" },
  { href: "/garage/wishlist", label: "Wishlist" },
  { href: "/notifications", label: "Notifications" },
  { href: "/garage/settings", label: "Settings" },
] as const;

function IconAccount({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 19.25c1.6-2.7 4-4 6.5-4s4.9 1.3 6.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserAccountMenu() {
  const { phase } = useGarage();
  const { userId, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (ready && !userId) {
    return (
      <Link
        href="/garage/sign-in"
        aria-label="Sign in"
        className="grid h-10 w-10 place-items-center text-text-muted transition-colors hover:text-text"
        tabIndex={phase === "open" ? undefined : -1}
      >
        <IconAccount className="h-[18px] w-[18px]" />
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="grid h-10 w-10 place-items-center text-text-muted transition-colors hover:text-text"
        tabIndex={phase === "open" ? undefined : -1}
        onClick={() => setOpen((v) => !v)}
        disabled={!ready}
      >
        <IconAccount className="h-[18px] w-[18px]" />
      </button>

      <AnimatePresence>
        {open && userId ? (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-56 origin-top-right overflow-hidden border border-border bg-[#0c0c0e]/95 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
                Account
              </p>
            </div>
            <ul className="py-1">
              {MENU_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    role="menuitem"
                    href={item.href}
                    className="block px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-1">
              <SignOutButton
                className="w-full px-3 py-2.5 text-left text-sm text-text-muted transition-colors hover:bg-white/[0.04] hover:text-accent"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
