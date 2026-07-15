export function FeedSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse border border-border bg-surface/20 p-5"
        >
          <div className="flex gap-3">
            <div className="h-14 w-14 rounded-full bg-surface-elevated" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-40 bg-surface-elevated" />
              <div className="h-3 w-24 bg-surface-elevated" />
              <div className="h-20 w-full bg-surface-elevated" />
              <div className="aspect-[16/9] w-full bg-surface-elevated" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
