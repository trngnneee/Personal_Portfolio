import type { BlogCard } from "@portfolio/shared";
import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Image } from "@/components/ui/Image";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

export function BlogCardItem({
  post,
  wide,
  headingLevel: Heading = "h3",
}: {
  post: BlogCard;
  wide?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-bg-surface transition-colors hover:border-primary-700",
        wide && "md:flex-row",
      )}
    >
      {post.cover && (
        <Image
          media={post.cover}
          width={640}
          aspect={16 / 9}
          sizes={wide ? "(min-width: 768px) 40vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
          className={cn("aspect-video w-full object-cover", wide && "md:w-2/5")}
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="flex flex-wrap items-center gap-3 font-mono text-xs text-neutral-400">
          {post.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" /> {post.readingMinutes} min read
          </span>
          {post.featured && <Badge tone="accent">featured</Badge>}
        </p>
        <Heading className="mt-2 font-mono text-lg font-bold text-neutral-50 group-hover:text-primary-300">
          <Link to={ROUTES.blogPost(post.slug)} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm text-neutral-300">{post.excerpt}</p>
        )}
        {post.tags.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-4" aria-label="Tags">
            {post.tags.map((t) => (
              <li key={t}>
                <Badge>#{t}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
