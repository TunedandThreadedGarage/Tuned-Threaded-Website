"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/garage/BrandLogo";
import { useGarage } from "@/components/garage/GarageExperience";
import { siteNavLinks } from "@/lib/site";

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.5 16.5L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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

function IconCart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M9 7V5.8A3 3 0 0 1 12 3a3 3 0 0 1 3 2.8V7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SiteHeader() {
  const { logoInNav, phase } = useGarage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isMenuOpen = phase === "open" && menuOpen;

  useEffect(() => {
    if (phase !== "open") return;
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, phase]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[75] transition-[background-color,backdrop-filter,border-color] duration-500 ${
        scrolled || isMenuOpen
          ? "border-b border-border bg-bg/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:h-[4.25rem] md:px-8 lg:px-10">
        <div className="relative z-10 flex min-h-[1.5rem] min-w-[9.5rem] items-center md:min-w-[10.5rem]">
          {logoInNav ? <BrandLogo size="nav" /> : null}
        </div>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex"
          aria-label="Primary"
        >
          {siteNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium tracking-wide text-text-muted transition-colors duration-300 hover:text-text"
              tabIndex={phase === "open" ? undefined : -1}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label="Search"
            className="grid h-10 w-10 place-items-center text-text-muted transition-colors hover:text-text"
            tabIndex={phase === "open" ? undefined : -1}
          >
            <IconSearch className="h-[18px] w-[18px]" />
          </button>
          <Link
            href="/garage"
            aria-label="Garage Profile"
            className="hidden h-10 w-10 place-items-center text-text-muted transition-colors hover:text-text sm:grid"
            tabIndex={phase === "open" ? undefined : -1}
          >
            <IconAccount className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/garage/cart"
            aria-label="Cart"
            className="grid h-10 w-10 place-items-center text-text-muted transition-colors hover:text-text"
            tabIndex={phase === "open" ? undefined : -1}
          >
            <IconCart className="h-[18px] w-[18px]" />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="ml-1 grid h-10 w-10 place-items-center text-text lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            tabIndex={phase === "open" ? undefined : -1}
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-5 flex-col gap-1.5" aria-hidden>
              <span
                className={`h-px w-full bg-current transition-transform duration-300 ${isMenuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
              />
              <span
                className={`h-px w-full bg-current transition-opacity duration-300 ${isMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`h-px w-full bg-current transition-transform duration-300 ${isMenuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-border bg-bg/95 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col px-5 py-6" aria-label="Mobile">
            {siteNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="border-b border-border py-4 font-[family-name:var(--font-display)] text-lg tracking-tight text-text"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex gap-6 pt-2 text-sm text-text-muted">
              <Link href="/garage" onClick={() => setMenuOpen(false)}>
                Garage Profile
              </Link>
              <Link href="/garage/cart" onClick={() => setMenuOpen(false)}>
                Cart
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
