import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GarageExperience } from "@/components/garage/GarageExperience";

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GarageExperience>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[900px] flex-1 px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <nav className="flex gap-4 font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
            <Link href="/journal" className="hover:text-text">
              Timeline
            </Link>
            <Link href="/builds" className="hover:text-text">
              Builds
            </Link>
            <Link href="/community" className="hover:text-text">
              Community
            </Link>
          </nav>
        </div>
        {children}
      </main>
      <SiteFooter />
    </GarageExperience>
  );
}
