import { ExternalLink, Globe } from "lucide-react";
import type { ComponentType } from "react";
import type { SocialLinks } from "@/types/garage";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.75 15.5v-7l6.5 3.5-6.5 3.5Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.21a8.16 8.16 0 0 0 4.76 1.52V7.28a4.85 4.85 0 0 1-1-.59Z" />
    </svg>
  );
}

export function SocialLinksRow({ links }: { links: SocialLinks }) {
  const items = [
    links.youtube
      ? { href: links.youtube, label: "YouTube", icon: YouTubeIcon }
      : null,
    links.instagram
      ? { href: links.instagram, label: "Instagram", icon: InstagramIcon }
      : null,
    links.tiktok
      ? { href: links.tiktok, label: "TikTok", icon: TikTokIcon }
      : null,
    links.website
      ? { href: links.website, label: "Website", icon: Globe }
      : null,
  ].filter(Boolean) as {
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }[];

  if (!items.length) return null;

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            <ExternalLink className="sr-only" />
          </a>
        );
      })}
    </div>
  );
}
