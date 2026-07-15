import Image from "next/image";

type AvatarProps = {
  url?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-24 w-24 text-2xl",
  xl: "h-32 w-32 text-3xl sm:h-36 sm:w-36",
};

const imageSizes = {
  sm: "36px",
  md: "56px",
  lg: "96px",
  xl: "144px",
};

export function Avatar({ url, name, size = "md" }: AvatarProps) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase();

  return (
    <div
      className={`${sizes[size]} relative overflow-hidden rounded-full border border-border bg-surface-elevated`}
    >
      {url ? (
        <Image
          src={url}
          alt=""
          fill
          className="object-cover"
          sizes={imageSizes[size]}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-medium text-text-muted">
          {initials}
        </span>
      )}
    </div>
  );
}
