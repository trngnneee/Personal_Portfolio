import type { PublicSite } from "@portfolio/shared";
import { ArrowRight, Download, Mail, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { Typewriter } from "@/components/terminal/Typewriter";
import { ButtonAnchor, ButtonLink } from "@/components/ui/Button";
import { Image } from "@/components/ui/Image";
import { ROUTES } from "@/config/routes";
import { BlogCardItem } from "@/features/blog/BlogCardItem";
import { ProjectCard } from "@/features/projects/ProjectCard";
import { SkillChip } from "@/features/skills/SkillChip";
import { useSite } from "@/lib/queries";
import { Seo } from "@/lib/seo";

export function HomePage() {
  const { data } = useSite();
  if (!data) return null;
  const { profile, stats } = data;
  const on = new Set(data.sections.map((s) => s.key));
  const hero = data.sections.find((s) => s.key === "hero");

  const featured = data.projects.filter((p) => p.featured).slice(0, 3);
  const statItems = [
    { label: "Projects", value: stats.projects },
    { label: "Technologies", value: stats.technologies },
    { label: "Certifications", value: stats.certifications },
    { label: "Awards", value: stats.awards },
  ].filter((s) => s.value > 0);

  return (
    <>
      <Seo
        title={profile ? `${profile.fullName} — ${profile.headline}` : "trngnneee"}
        description={profile?.bio.slice(0, 160)}
        path="/"
        image={profile?.avatar?.url}
        type="profile"
      />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-12 md:grid-cols-[1.4fr_1fr] md:pt-24">
        <div>
          <p className="font-mono text-sm text-primary-500">
            <span className="text-neutral-400" aria-hidden="true">
              trngnneee@portfolio:~${" "}
            </span>
            {hero?.heading || "whoami"}
          </p>
          <h1 className="mt-4 font-mono text-4xl leading-tight font-bold text-neutral-50 sm:text-5xl">
            <Typewriter
              lines={
                profile?.typewriterLines.length
                  ? profile.typewriterLines
                  : [profile?.fullName ?? ""]
              }
            />
          </h1>
          {profile && (
            <>
              <p className="mt-4 text-xl text-primary-400">{profile.headline}</p>
              {profile.location && (
                <p className="mt-2 flex items-center gap-2 text-neutral-300">
                  <MapPin className="size-4" aria-hidden="true" /> {profile.location}
                </p>
              )}
              {profile.openToWork && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary-800 px-3 py-1 font-mono text-xs text-primary-300">
                  <span className="size-2 rounded-full bg-primary-500" aria-hidden="true" /> Open to
                  opportunities
                </p>
              )}
            </>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {on.has("projects") && (
              <ButtonLink
                to={ROUTES.projects}
                icon={<ArrowRight className="size-4" aria-hidden="true" />}
              >
                View projects
              </ButtonLink>
            )}
            {on.has("contact") && (
              <ButtonLink
                to={ROUTES.contact}
                variant="outline"
                icon={<Mail className="size-4" aria-hidden="true" />}
              >
                Contact
              </ButtonLink>
            )}
            {profile?.cv && (
              <ButtonAnchor
                href={profile.cv.url}
                variant="ghost"
                icon={<Download className="size-4" aria-hidden="true" />}
              >
                Download CV
              </ButtonAnchor>
            )}
          </div>
        </div>

        {profile?.avatar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <TerminalWindow title="~/avatar.jpg" className="mx-auto max-w-sm shadow-glow">
              <Image
                media={profile.avatar}
                alt={`Portrait of ${profile.fullName}`}
                width={480}
                aspect={1}
                sizes="(min-width: 768px) 384px, 90vw"
                priority
                className="aspect-square w-full object-cover"
              />
            </TerminalWindow>
          </motion.div>
        )}
      </section>

      {statItems.length > 0 && (
        <section aria-label="Stats" className="mx-auto max-w-6xl px-4">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statItems.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-neutral-800 bg-bg-surface p-4 text-center"
              >
                <dt className="font-mono text-xs tracking-wider text-neutral-400 uppercase">
                  {s.label}
                </dt>
                <dd className="mt-1 font-mono text-3xl font-bold text-primary-400">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {on.has("projects") && featured.length > 0 && (
        <HomeSection
          title="Featured projects"
          command="ls ~/projects --featured"
          to={ROUTES.projects}
          more="All projects"
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </HomeSection>
      )}

      {on.has("skills") && data.skills.length > 0 && (
        <HomeSection
          title="Toolbox"
          command="cat ~/skills | head"
          to={ROUTES.skills}
          more="All skills"
        >
          <TopSkills data={data} />
        </HomeSection>
      )}

      {data.blog && data.blog.latest.length > 0 && (
        <HomeSection
          title="Latest posts"
          command="ls -t ~/blog | head -3"
          to={ROUTES.blog}
          more="All posts"
        >
          <div className="grid gap-6 md:grid-cols-3">
            {data.blog.latest.map((post) => (
              <BlogCardItem key={post.slug} post={post} />
            ))}
          </div>
        </HomeSection>
      )}
    </>
  );
}

function TopSkills({ data }: { data: PublicSite }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {data.skills.slice(0, 12).map((s) => (
        <li key={s.name}>
          <SkillChip skill={s} />
        </li>
      ))}
    </ul>
  );
}

function HomeSection({
  title,
  command,
  to,
  more,
  children,
}: {
  title: string;
  command: string;
  to: string;
  more: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-primary-500">$ {command}</p>
          <h2 className="mt-1 font-mono text-2xl font-bold text-neutral-50">{title}</h2>
        </div>
        <Link to={to} className="font-mono text-sm text-primary-400 hover:text-primary-300">
          {more} →
        </Link>
      </div>
      {children}
    </section>
  );
}
