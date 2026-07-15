import Image from "next/image";
import Link from "next/link";
import type { Build, BuildPhoto } from "@/types/database";

type BuildCardProps = {
  build: Build;
  photo?: Pick<BuildPhoto, "url"> | null;
  href: string;
};

export function BuildCard({ build, photo, href }: BuildCardProps) {
  return (
    <Link href={href} className="group block border border-border bg-surface transition-colors hover:border-metal/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        {photo?.url ? (
          <Image
            src={photo.url}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            No photo
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-[family-name:var(--font-display)] text-base font-medium text-text">
          {build.title}
        </h3>
        {build.body ? (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{build.body}</p>
        ) : null}
      </div>
    </Link>
  );
}
