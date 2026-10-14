import type { PublicAchievement, PublicExperience } from "@portfolio/shared";
import {
  Award,
  BadgeCheck,
  Briefcase,
  ExternalLink,
  GraduationCap,
  Image as ImageIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, type CSSProperties } from "react";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Image } from "@/components/ui/Image";
import { formatRange, humanize } from "@/lib/format";
import { SiteMarkdown } from "@/lib/markdown";
import { useSite } from "@/lib/queries";
import { Seo } from "@/lib/seo";

const ACHIEVEMENT_ICON = {
  education: GraduationCap,
  certification: BadgeCheck,
  award: Award,
} as const;

export function AboutPage() {
  const { data } = useSite();
  if (!data) return null;
  const sec = (k: string) => data.sections.find((s) => s.key === k);
  const about = sec("about");
  const experience = sec("experience");
  const achievements = sec("achievements");
  const first = about ?? experience ?? achievements;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Seo
        title={first?.heading ?? "About"}
        description={data.profile?.bio.slice(0, 160)}
        path="/about"
        type="profile"
      />

      {about && data.profile ? (
        <section>
          <TerminalHeader command={about.subheading || "cat about.md"} title={about.heading} />
          <SiteMarkdown>{data.profile.bio}</SiteMarkdown>
        </section>
      ) : (
        <h1 className="sr-only">{first?.heading ?? "About"}</h1>
      )}

      {experience && data.experiences.length > 0 && (
        <section className="mt-20" aria-labelledby="experience-heading">
          <SectionTitle
            id="experience-heading"
            command={experience.subheading}
            title={experience.heading}
          />
          <ol className="relative space-y-8 border-l border-neutral-800 pl-6">
            {data.experiences.map((e) => (
              <ExperienceItem key={`${e.company}-${e.startDate}`} item={e} />
            ))}
          </ol>
        </section>
      )}

      {achievements && data.achievements.length > 0 && (
        <section className="mt-20" aria-labelledby="achievements-heading">
          <SectionTitle
            id="achievements-heading"
            command={achievements.subheading}
            title={achievements.heading}
          />
          <ol className="relative space-y-8 border-l border-neutral-800 pl-6">
            {data.achievements.map((a) => (
              <AchievementItem key={a.title} item={a} />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ id, command, title }: { id: string; command: string; title: string }) {
  return (
    <div className="mb-8">
      {command && <p className="font-mono text-sm text-primary-500">$ {command}</p>}
      <h2 id={id} className="mt-1 font-mono text-2xl font-bold text-neutral-50">
        {title}
      </h2>
    </div>
  );
}

const reveal = {
  initial: { opacity: 0, x: -12 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-40px" },
} as const;

function ExperienceItem({ item }: { item: PublicExperience }) {
  return (
    <motion.li {...reveal} className="relative">
      <span
        className="absolute top-1.5 -left-[31px] grid size-4 place-items-center rounded-full border-2 border-primary-500 bg-bg-page"
        aria-hidden="true"
      />
      <p className="font-mono text-xs text-primary-400">
        {formatRange(item.startDate, item.endDate)}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-neutral-50">
        {item.position}{" "}
        <span className="text-neutral-300">
          @{" "}
          {item.companyUrl ? (
            <a
              href={item.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:underline"
            >
              {item.company}
            </a>
          ) : (
            item.company
          )}
        </span>
      </h3>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
        <Briefcase className="size-4" aria-hidden="true" /> {humanize(item.employmentType)}
        {item.location && <span>· {item.location}</span>}
      </p>
      {item.description && (
        <SiteMarkdown className="prose-terminal mt-3 text-sm">{item.description}</SiteMarkdown>
      )}
      {item.highlights.length > 0 && (
        <ul className="mt-3 list-[square] space-y-1 pl-5 text-sm text-neutral-200 marker:text-primary-500">
          {item.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {item.techStack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Technologies">
          {item.techStack.map((t) => (
            <li key={t}>
              <Badge>{t}</Badge>
            </li>
          ))}
        </ul>
      )}
    </motion.li>
  );
}

function AchievementItem({ item }: { item: PublicAchievement }) {
  const [open, setOpen] = useState(false);
  const Icon = ACHIEVEMENT_ICON[item.type];
  // Per-item accent colour from the CMS, applied through a CSS variable.
  const style = { "--accent": item.accentColor ?? "var(--color-primary-500)" } as CSSProperties;

  return (
    <motion.li {...reveal} className="relative" style={style}>
      <span
        className="absolute top-0.5 -left-[35px] grid size-6 place-items-center rounded-full border-2 border-[var(--accent)] bg-bg-page text-[var(--accent)]"
        aria-hidden="true"
      >
        <Icon className="size-3.5" />
      </span>
      <div className="rounded-lg border border-neutral-800 border-l-[var(--accent)] border-l-4 bg-bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          {item.periodLabel && (
            <span className="font-mono text-xs text-neutral-300">{item.periodLabel}</span>
          )}
          <Badge>{humanize(item.type)}</Badge>
        </div>
        <h3 className="mt-2 font-semibold text-neutral-50">{item.title}</h3>
        {item.issuer && <p className="text-sm text-neutral-300">{item.issuer}</p>}
        {item.description && <p className="mt-2 text-sm text-neutral-300">{item.description}</p>}
        <div className="mt-3 flex flex-wrap gap-4 font-mono text-sm">
          {item.media && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300"
            >
              <ImageIcon className="size-4" aria-hidden="true" /> View image
            </button>
          )}
          {item.credentialUrl && (
            <a
              href={item.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300"
            >
              <ExternalLink className="size-4" aria-hidden="true" /> Credential
            </a>
          )}
        </div>
      </div>
      {item.media && (
        <Dialog open={open} onClose={() => setOpen(false)} title={item.title}>
          <Image
            media={item.media}
            width={1280}
            sizes="(min-width: 960px) 896px, 100vw"
            className="w-full rounded-md"
          />
        </Dialog>
      )}
    </motion.li>
  );
}
