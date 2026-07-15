import Image from "next/image";

type BannerProps = {
  url?: string | null;
  className?: string;
};

export function Banner({ url, className = "" }: BannerProps) {
  return (
    <div
      className={`relative aspect-[3/1] w-full overflow-hidden bg-surface ${className}`}
    >
      {url ? (
        <Image src={url} alt="" fill className="object-cover" sizes="1200px" priority />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#1a1a1d_0%,#0e0e10_100%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
    </div>
  );
}
