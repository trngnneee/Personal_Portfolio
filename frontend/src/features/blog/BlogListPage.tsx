import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { useBlogList, useSite } from "@/lib/queries";
import { Seo } from "@/lib/seo";
import { BlogCardItem } from "./BlogCardItem";

export function BlogListPage() {
  const { data: site } = useSite();
  const section = site?.sections.find((s) => s.key === "blog");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const tag = params.get("tag") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(q);
  const searchId = useId();

  const set = (patch: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        return next;
      },
      { replace: true },
    );

  // Debounce typing → URL.
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => set({ q: search.trim() || null, page: null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `set` is recreated each render
  }, [search, q]);

  const { data, isPending, isError, error, refetch, isFetching } = useBlogList({ q, tag, page });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Seo
        title={section?.heading ?? "Blog"}
        description="Notes on backend, cloud and DevOps."
        path="/blog"
      />
      <TerminalHeader
        command={section?.subheading || "ls ~/blog"}
        title={section?.heading ?? "Blog"}
      />

      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <label htmlFor={searchId} className="sr-only">
            Search posts
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="grep -i …"
            className="w-full rounded-md border border-neutral-700 bg-bg-surface py-2 pr-3 pl-9 font-mono text-sm text-neutral-50 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
          />
        </div>
        {isPending && (
          // Same height as the tag row, so results don't jump when it appears.
          <div className="flex gap-2" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[26px] w-20" />
            ))}
          </div>
        )}
        {data && data.tags.length > 0 && (
          <div role="group" aria-label="Filter by tag" className="flex flex-wrap gap-2">
            {[{ name: "", count: 0 }, ...data.tags].map((t) => (
              <button
                key={t.name || "all"}
                type="button"
                aria-pressed={tag === t.name}
                onClick={() => set({ tag: t.name || null, page: null })}
                className={cn(
                  "rounded border px-2.5 py-1 font-mono text-xs transition-colors",
                  tag === t.name
                    ? "border-primary-500 bg-primary-500/10 text-primary-300"
                    : "border-neutral-800 text-neutral-300 hover:text-neutral-50",
                )}
              >
                {t.name ? `#${t.name} (${t.count})` : "all"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div aria-live="polite" aria-busy={isFetching}>
        {isPending ? (
          <div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Loading posts"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        ) : data.items.length === 0 ? (
          <p className="font-mono text-neutral-300">
            <span className="text-neutral-400">$ </span>
            {q || tag ? "grep: no matches found" : "ls: ~/blog is empty — first post coming soon."}
          </p>
        ) : (
          <>
            <p className="mb-4 font-mono text-sm text-neutral-400">total {data.total}</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((post, i) => (
                <div
                  key={post.slug}
                  className={cn(
                    page === 1 &&
                      !q &&
                      !tag &&
                      i === 0 &&
                      post.featured &&
                      "md:col-span-2 lg:col-span-3",
                  )}
                >
                  <BlogCardItem
                    post={post}
                    headingLevel="h2"
                    wide={page === 1 && !q && !tag && i === 0 && post.featured}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex items-center justify-center gap-4 font-mono text-sm"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => set({ page: page - 1 > 1 ? String(page - 1) : null })}
            className="inline-flex items-center gap-1 rounded border border-neutral-700 px-3 py-1.5 text-neutral-200 hover:border-primary-500 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" /> Prev
          </button>
          <span className="text-neutral-300" aria-current="page">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => set({ page: String(page + 1) })}
            className="inline-flex items-center gap-1 rounded border border-neutral-700 px-3 py-1.5 text-neutral-200 hover:border-primary-500 disabled:opacity-40"
          >
            Next <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
