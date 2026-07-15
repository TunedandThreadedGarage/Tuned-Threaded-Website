import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileCustomizeForm } from "@/features/garage/components/profile-customize-form";
import { getGarageByUsername } from "@/lib/garage/queries";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `Customize @${username}` };
}

export default async function CustomizeGaragePage({ params }: PageProps) {
  const { username } = await params;
  const garage = await getGarageByUsername(username);
  if (!garage) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 md:px-8 md:py-16">
      <Link
        href={`/garage/${username}`}
        className="text-xs uppercase tracking-[0.16em] text-foreground-muted hover:text-foreground"
      >
        Back to garage
      </Link>
      <h1 className="mt-6 font-[family-name:var(--font-instrument)] text-4xl tracking-tight md:text-5xl">
        Customize garage
      </h1>
      <p className="mt-3 text-sm text-foreground-muted md:text-base">
        Banner, avatar, accent color, bio, favorites, and social links.
      </p>
      <div className="mt-10">
        <ProfileCustomizeForm profile={garage.profile} />
      </div>
    </main>
  );
}
