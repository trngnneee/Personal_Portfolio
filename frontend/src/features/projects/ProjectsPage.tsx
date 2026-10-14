import type { ProjectCategory } from "@portfolio/shared";
import { LayoutGroup } from "motion/react";
import { useSearchParams } from "react-router";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { cn } from "@/lib/cn";
import { humanize } from "@/lib/format";
import { useSite } from "@/lib/queries";
import { Seo } from "@/lib/seo";
import { ProjectCard } from "./ProjectCard";
import { ProjectDialog } from "./ProjectDialog";

export function ProjectsPage() {
  const { data } = useSite();
  const [params, setParams] = useSearchParams();
  if (!data) return null;
  const section = data.sections.find((s) => s.key === "projects");

  // Filter tabs come from the data — no hardcoded categories.
  const categories = [...new Set(data.projects.map((p) => p.category))];
  const active = params.get("category") as ProjectCategory | null;
  const visible = active ? data.projects.filter((p) => p.category === active) : data.projects;
  const open = data.projects.find((p) => p.slug === params.get("p")) ?? null;

  const update = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: key === "category", preventScrollReset: true },
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Seo
        title={section?.heading ?? "Projects"}
        description={`Projects by ${data.profile?.fullName ?? "trngnneee"}: ${categories.map(humanize).join(", ")}.`}
        path="/projects"
      />
      <TerminalHeader
        command={section?.subheading ?? "ls ~/projects"}
        title={section?.heading ?? "Projects"}
        description={`${data.projects.length} projects`}
      />

      {categories.length > 1 && (
        <div role="group" aria-label="Filter by category" className="mb-8 flex flex-wrap gap-2">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={active === c}
              onClick={() => update("category", c)}
              className={cn(
                "rounded-md border px-3 py-1.5 font-mono text-sm transition-colors",
                active === c
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-neutral-50",
              )}
            >
              {c ? humanize(c) : "All"}
            </button>
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} projects
      </p>
      <LayoutGroup>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.slug} project={p} headingLevel="h2" />
          ))}
        </div>
      </LayoutGroup>

      <ProjectDialog project={open} onClose={() => update("p", null)} />
    </div>
  );
}
