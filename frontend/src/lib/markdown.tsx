import { Markdown } from "@portfolio/markdown";
import { Link } from "react-router";
import { cld, cldSrcSet } from "./cloudinary";

const WIDTHS = [480, 768, 1024, 1440];

/** Shared renderer + site behaviour: responsive Cloudinary images, client-side internal links. */
export function SiteMarkdown({
  children,
  className = "prose-terminal",
}: {
  children: string;
  className?: string;
}) {
  return (
    <Markdown
      className={className}
      components={{
        img: ({ src, alt, node: _node, ...rest }) =>
          typeof src === "string" ? (
            <img
              {...rest}
              src={cld(src, { w: 1024 })}
              srcSet={cldSrcSet(src, WIDTHS)}
              sizes="(min-width: 1024px) 768px, 100vw"
              alt={alt ?? ""}
              loading="lazy"
              decoding="async"
            />
          ) : null,
        a: ({ href, children, node: _node, ...rest }) =>
          href?.startsWith("/") ? (
            <Link to={href} {...rest}>
              {children}
            </Link>
          ) : (
            <a
              href={href}
              {...rest}
              {...(href && /^https?:/.test(href)
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {children}
            </a>
          ),
      }}
    >
      {children}
    </Markdown>
  );
}
