import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-bg-elevated", className)} aria-hidden="true" />
  );
}

/** Generic page placeholder while route data loads. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16" role="status" aria-label="Loading">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-4 h-10 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}
