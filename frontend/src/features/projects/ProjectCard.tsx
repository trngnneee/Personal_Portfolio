import type { PublicProject } from "@portfolio/shared";
import { ExternalLink, Lock } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { Badge } from "@/components/ui/Badge";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Image } from "@/components/ui/Image";
import { ROUTES } from "@/config/routes";
import { humanize } from "@/lib/format";

const MAX_TECH = 6;

function repoPlatform(url: string) {
  return url.includes("gitlab.com") ? "gitlab" : url.includes("github.com") ? "github" : "other";
}

/** Shown when a project has no cover image. */
function CoverFallback({ project }: { project: PublicProject }) {
  return (
    <div
      className="aspect-video overflow-hidden p-4 font-mono text-xs leading-relaxed"
      aria-hidden="true"
    >
      <p className="text-primary-500">$ tree {project.slug}</p>
      <p className="text-neutral-300">{project.slug}/</p>
      {project.techStack.slice(0, 5).map((t, i, arr) => (
        <p key={t} className="truncate text-neutral-400">
          {i === arr.length - 1 ? "└── " : "├── "}
          <span className="text-neutral-200">{t}</span>
        </p>
      ))}
    </div>
  );
}

export function ProjectCard({
  project,
  headingLevel = "h3",
}: {
  project: PublicProject;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const extra = project.techStack.length - MAX_TECH;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-bg-surface transition-colors hover:border-primary-700 has-[a:focus-visible]:border-primary-500 has-[a:focus-visible]:shadow-glow"
    >
      <TerminalWindow
        title={`~/projects/${project.slug}`}
        className="rounded-none border-0 border-b"
      >
        {project.cover ? (
          <Image
            media={project.cover}
            width={640}
            aspect={16 / 9}
            sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <CoverFallback project={project} />
        )}
      </TerminalWindow>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{humanize(project.category)}</Badge>
          {project.role && (
            <span className="font-mono text-xs text-neutral-400">{project.role}</span>
          )}
        </div>
        <Heading className="mt-3 font-mono text-lg font-bold text-neutral-50">
          <Link
            to={`${ROUTES.projects}?p=${project.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
            aria-label={`${project.title} — details`}
          >
            {project.title}
          </Link>
        </Heading>
        {project.subtitle && <p className="mt-1 text-sm text-accent-500">{project.subtitle}</p>}
        <p className="mt-3 line-clamp-4 text-sm text-neutral-300">{project.summary}</p>

        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {project.techStack.slice(0, MAX_TECH).map((t) => (
            <li key={t}>
              <Badge>{t}</Badge>
            </li>
          ))}
          {extra > 0 && (
            <li>
              <Badge>+{extra}</Badge>
            </li>
          )}
        </ul>

        <ProjectLinks project={project} className="relative z-10 mt-auto pt-5" />
      </div>
    </motion.article>
  );
}

export function ProjectLinks({
  project,
  className,
}: {
  project: PublicProject;
  className?: string;
}) {
  if (!project.repoUrl && !project.demoUrl && project.repoVisibility !== "private") return null;
  return (
    <div className={`flex flex-wrap items-center gap-3 font-mono text-sm ${className ?? ""}`}>
      {project.repoUrl ? (
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-neutral-200 hover:text-primary-400"
        >
          <BrandIcon platform={repoPlatform(project.repoUrl)} className="size-4" /> Source
        </a>
      ) : (
        project.repoVisibility === "private" && (
          <Badge>
            <Lock className="size-3" aria-hidden="true" /> private repo
          </Badge>
        )
      )}
      {project.demoUrl && (
        <a
          href={project.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-neutral-200 hover:text-primary-400"
        >
          <ExternalLink className="size-4" aria-hidden="true" /> Live
        </a>
      )}
    </div>
  );
}
