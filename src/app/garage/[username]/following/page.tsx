import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserList } from "@/features/garage/components/user-list";
import { getGarageByUsername } from "@/lib/garage/queries";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `Following · @${username}` };
}

export default async function FollowingPage({ params }: PageProps) {
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
      <h1 className="mt-6 font-[family-name:var(--font-instrument)] text-4xl tracking-tight">
        Following
      </h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Garages @{garage.profile.username} follows
      </p>
      <div className="mt-8">
        <UserList users={garage.following} emptyLabel="Not following anyone yet." />
      </div>
    </main>
  );
}
