import { extractToc } from "@portfolio/markdown";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { Image } from "@/components/ui/Image";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ROUTES, SITE_URL } from "@/config/routes";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { SiteMarkdown } from "@/lib/markdown";
import { useBlogPost, useSite } from "@/lib/queries";
import { Seo } from "@/lib/seo";
import { NotFound } from "@/pages/NotFound";

export function BlogPostPage() {
  const { slug = "" } = useParams();
  const { data: site } = useSite();
  const { data: post, isPending, isError, error, refetch } = useBlogPost(slug);
  const toc = useMemo(() => (post ? extractToc(post.content) : []), [post]);

  if (isPending) return <PageSkeleton />;
  if (isError) {
    if (error instanceof ApiError && error.status === 404) return <NotFound />;
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  }

  const path = ROUTES.blogPost(post.slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Seo
        title={post.title}
        description={post.excerpt ?? undefined}
        path={path}
        image={post.cover?.url}
        type="article"
        jsonLd={{
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt ?? undefined,
          image: post.cover?.url,
          datePublished: post.publishedAt ?? undefined,
          dateModified: post.updatedAt,
          keywords: post.tags.join(", "),
          mainEntityOfPage: `${SITE_URL}${path}`,
          author: {
            "@type": "Person",
            name: site?.profile?.fullName ?? "Dang Truong Nguyen",
            url: SITE_URL || undefined,
          },
        }}
      />
      {post.publishedAt && <meta property="article:published_time" content={post.publishedAt} />}

      <Link to={ROUTES.blog} className="font-mono text-sm text-primary-400 hover:text-primary-300">
        ← cd ~/blog
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <article>
          <header>
            <p className="flex flex-wrap items-center gap-4 font-mono text-sm text-neutral-400">
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden="true" />
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" /> {post.readingMinutes} min read
              </span>
            </p>
            <h1 className="mt-3 font-mono text-3xl leading-tight font-bold text-neutral-50 sm:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && <p className="mt-4 text-lg text-neutral-300">{post.excerpt}</p>}
            {post.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link to={`${ROUTES.blog}?tag=${encodeURIComponent(t)}`}>
                      <Badge tone="primary">#{t}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </header>

          {post.cover && (
            <Image
              media={post.cover}
              width={1024}
              sizes="(min-width: 1024px) 768px, 100vw"
              priority
              className="mt-8 w-full rounded-lg border border-neutral-800"
            />
          )}

          <SiteMarkdown className="prose-terminal mt-10">{post.content}</SiteMarkdown>

          {(post.newer || post.older) && (
            <nav
              aria-label="More posts"
              className="mt-16 grid gap-4 border-t border-neutral-800 pt-8 sm:grid-cols-2"
            >
              {post.older ? (
                <Link
                  to={ROUTES.blogPost(post.older.slug)}
                  className="rounded-lg border border-neutral-800 p-4 hover:border-primary-700"
                >
                  <span className="flex items-center gap-1 font-mono text-xs text-neutral-400">
                    <ArrowLeft className="size-3.5" aria-hidden="true" /> Older
                  </span>
                  <span className="mt-1 block text-neutral-100">{post.older.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {post.newer && (
                <Link
                  to={ROUTES.blogPost(post.newer.slug)}
                  className="rounded-lg border border-neutral-800 p-4 text-right hover:border-primary-700"
                >
                  <span className="flex items-center justify-end gap-1 font-mono text-xs text-neutral-400">
                    Newer <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-neutral-100">{post.newer.title}</span>
                </Link>
              )}
            </nav>
          )}
        </article>

        {toc.length > 1 && (
          <aside className="hidden lg:block">
            <nav aria-label="Table of contents" className="sticky top-24 font-mono text-sm">
              <p className="mb-3 text-neutral-400">$ cat toc</p>
              <ul className="space-y-2 border-l border-neutral-800">
                {toc.map((item) => (
                  <li key={item.id} className={item.depth === 3 ? "pl-6" : "pl-3"}>
                    <a href={`#${item.id}`} className="text-neutral-300 hover:text-primary-400">
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
