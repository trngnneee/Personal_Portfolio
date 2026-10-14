import type { SkillCategory } from "@portfolio/shared";
import { motion } from "motion/react";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { humanize } from "@/lib/format";
import { useSite } from "@/lib/queries";
import { Seo } from "@/lib/seo";
import { SkillChip } from "./SkillChip";
import { SkillsTerminal } from "./SkillsTerminal";

const LABELS: Partial<Record<SkillCategory, string>> = { cloud_devops: "Cloud & DevOps" };

export function SkillsPage() {
  const { data } = useSite();
  if (!data) return null;
  const section = data.sections.find((s) => s.key === "skills");
  const groups = new Map<SkillCategory, typeof data.skills>();
  for (const s of data.skills) groups.set(s.category, [...(groups.get(s.category) ?? []), s]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Seo
        title={section?.heading ?? "Skills"}
        description={`Technologies: ${data.skills.map((s) => s.name).join(", ")}.`}
        path="/skills"
      />
      <TerminalHeader
        command={section?.subheading ?? "ls ~/skills"}
        title={section?.heading ?? "Skills"}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {[...groups].map(([category, skills], i) => (
          <motion.section
            key={category}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-neutral-800 bg-bg-surface p-5"
            aria-labelledby={`skills-${category}`}
          >
            <h2 id={`skills-${category}`} className="font-mono text-lg font-bold text-neutral-50">
              <span className="text-primary-500" aria-hidden="true">
                ./
              </span>
              {LABELS[category] ?? humanize(category)}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {skills.map((s) => (
                <li key={s.name}>
                  <SkillChip skill={s} />
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>

      <section className="mt-16" aria-labelledby="skills-terminal-heading">
        <h2
          id="skills-terminal-heading"
          className="mb-4 font-mono text-xl font-bold text-neutral-50"
        >
          Explore from the terminal
        </h2>
        <SkillsTerminal skills={data.skills} profile={data.profile} />
      </section>
    </div>
  );
}
