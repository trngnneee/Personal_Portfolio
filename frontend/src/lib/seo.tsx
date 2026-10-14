import { SITE_URL } from "@/config/routes";

interface SeoProps {
  title: string;
  description?: string;
  /** Path for canonical / og:url, e.g. "/blog/hello". */
  path: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  jsonLd?: Record<string, unknown>;
  noindex?: boolean;
}

const SITE_NAME = "trngnneee";

/** React 19 hoists <title>/<meta>/<link> into <head>. */
export function Seo({
  title,
  description,
  path,
  image,
  type = "website",
  jsonLd,
  noindex,
}: SeoProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;
  const img = image ?? `${SITE_URL}/og.png`;
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={img} />
      {jsonLd && <JsonLd data={jsonLd} />}
    </>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape "<" so content can never close the script tag.
  const json = JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
    /</g,
    "\\u003c",
  );
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
