import Image from "next/image";
import Link from "next/link";
import type { PublicUserSummary } from "@/types/garage";

export function UserList({
  users,
  emptyLabel,
}: {
  users: PublicUserSummary[];
  emptyLabel: string;
}) {
  if (!users.length) {
    return <p className="text-sm text-foreground-subtle">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-[1.25rem] border border-border">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            href={`/garage/${user.username}`}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
              <Image
                src={user.avatarUrl}
                alt={user.displayName}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{user.displayName}</p>
              <p className="truncate text-xs text-foreground-muted">
                @{user.username}
                {user.location ? ` · ${user.location}` : ""}
              </p>
            </div>
            <span className="ml-auto rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
              {user.garageRank}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
