import type { PublicProject } from "@portfolio/shared";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Image } from "@/components/ui/Image";
import { formatRange, humanize } from "@/lib/format";
import { SiteMarkdown } from "@/lib/markdown";
import { ProjectLinks } from "./ProjectCard";

export function ProjectDialog({
  project,
  onClose,
}: {
  project: PublicProject | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={project !== null} onClose={onClose} title={project?.title ?? ""}>
      {project && (
        <article>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-neutral-400">
            <Badge tone="primary">{humanize(project.category)}</Badge>
            {project.role && <span>{project.role}</span>}
            {project.startDate && <span>· {formatRange(project.startDate, project.endDate)}</span>}
          </div>
          {project.subtitle && <p className="mt-2 text-accent-500">{project.subtitle}</p>}
          <ProjectLinks project={project} className="mt-4" />

          {project.cover && (
            <Image
              media={project.cover}
              width={896}
              sizes="(min-width: 960px) 896px, 100vw"
              className="mt-6 w-full rounded-md border border-neutral-800"
            />
          )}

          <p className="mt-6 text-neutral-200">{project.summary}</p>

          {project.highlights.length > 0 && (
            <section className="mt-6">
              <h3 className="font-mono text-sm font-bold text-primary-400">## Highlights</h3>
              <ul className="mt-2 list-[square] space-y-1.5 pl-5 text-neutral-200 marker:text-primary-500">
                {project.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>
          )}

          {project.description && (
            <SiteMarkdown className="prose-terminal mt-6">{project.description}</SiteMarkdown>
          )}

          <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Tech stack">
            {project.techStack.map((t) => (
              <li key={t}>
                <Badge>{t}</Badge>
              </li>
            ))}
          </ul>
        </article>
      )}
    </Dialog>
  );
}
