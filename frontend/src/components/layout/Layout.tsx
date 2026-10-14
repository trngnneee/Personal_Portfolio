import { Suspense } from "react";
import { Outlet } from "react-router";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { JsonLd } from "@/lib/seo";
import { useSite } from "@/lib/queries";
import { SITE_URL } from "@/config/routes";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function Layout() {
  const { data, isPending, isError, error, refetch } = useSite();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-primary-500 focus:px-4 focus:py-2 focus:font-mono focus:text-bg-page"
      >
        Skip to content
      </a>
      <div className="grid-bg pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <Navbar />
      <main id="content" tabIndex={-1} className="flex-1 outline-none">
        {isPending ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        ) : (
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      <Footer />
      {data?.profile && (
        <JsonLd
          data={{
            "@type": "Person",
            name: data.profile.fullName,
            alternateName: data.profile.handle,
            jobTitle: data.profile.headline,
            url: SITE_URL || undefined,
            image: data.profile.avatar?.url,
            email: `mailto:${data.profile.email}`,
            address: data.profile.location ?? undefined,
            sameAs: data.socialLinks.map((s) => s.url),
          }}
        />
      )}
    </div>
  );
}
