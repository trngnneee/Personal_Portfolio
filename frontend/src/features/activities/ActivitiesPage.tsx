import type { PublicActivity } from "@portfolio/shared";
import { MapPin, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { Image } from "@/components/ui/Image";
import { useSite } from "@/lib/queries";
import { Seo } from "@/lib/seo";
import { Lightbox } from "./Lightbox";

export function ActivitiesPage() {
  const { data } = useSite();
  if (!data) return null;
  const section = data.sections.find((s) => s.key === "activities");
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Seo
        title={section?.heading ?? "Activities"}
        description="Volunteering and community activities."
        path="/activities"
      />
      <TerminalHeader
        command={section?.subheading ?? "ls ~/activities"}
        title={section?.heading ?? "Activities"}
      />
      <div className="space-y-10">
        {data.activities.map((a) => (
          <ActivityCard key={a.title} activity={a} />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: PublicActivity }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid gap-6 rounded-lg border border-neutral-800 bg-bg-surface p-5 md:grid-cols-[1fr_1.2fr]"
    >
      <div>
        {activity.periodLabel && (
          <p className="font-mono text-xs text-primary-400">{activity.periodLabel}</p>
        )}
        <h2 className="mt-1 font-mono text-xl font-bold text-neutral-50">{activity.title}</h2>
        <div className="mt-2 space-y-1 text-sm text-neutral-300">
          {activity.organization && (
            <p className="flex items-center gap-2">
              <Users className="size-4" aria-hidden="true" /> {activity.organization}
            </p>
          )}
          {activity.location && (
            <p className="flex items-center gap-2">
              <MapPin className="size-4" aria-hidden="true" /> {activity.location}
            </p>
          )}
          {activity.role && <p className="font-mono text-accent-500">{activity.role}</p>}
        </div>
        {activity.description && <p className="mt-4 text-neutral-200">{activity.description}</p>}
      </div>

      {activity.images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3" aria-label={`${activity.title} photos`}>
          {activity.images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="block w-full overflow-hidden rounded-md border border-neutral-800 hover:border-primary-600"
                aria-label={`Open photo ${i + 1}: ${img.alt}`}
              >
                <Image
                  media={img}
                  width={480}
                  aspect={4 / 3}
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Lightbox
        title={activity.title}
        images={activity.images}
        index={index}
        onIndexChange={setIndex}
      />
    </motion.article>
  );
}
