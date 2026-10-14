import { Rss } from "lucide-react";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { api } from "@/lib/api";
import { useSite } from "@/lib/queries";

export function Footer() {
  const { data } = useSite();
  const blogOn = data?.sections.some((s) => s.key === "blog");
  const name = data?.profile?.fullName ?? "Dang Truong Nguyen";

  return (
    <footer className="mt-24 border-t border-neutral-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <p className="font-mono text-sm text-neutral-400">
          © {new Date().getFullYear()} {name}
        </p>
        <ul className="flex items-center gap-1" aria-label="Social links">
          {data?.socialLinks.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded p-2 text-neutral-300 hover:bg-bg-elevated hover:text-primary-400"
                aria-label={s.label}
              >
                <BrandIcon platform={s.platform} />
              </a>
            </li>
          ))}
          {blogOn && (
            <li>
              <a
                href={api.rssUrl}
                className="block rounded p-2 text-neutral-300 hover:bg-bg-elevated hover:text-primary-400"
                aria-label="Blog RSS feed"
              >
                <Rss className="size-5" aria-hidden="true" />
              </a>
            </li>
          )}
        </ul>
      </div>
    </footer>
  );
}
