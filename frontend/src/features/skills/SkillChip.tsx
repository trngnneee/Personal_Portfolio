import type { PublicSkill } from "@portfolio/shared";

export function SkillChip({ skill }: { skill: PublicSkill }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-bg-surface px-3 py-2 font-mono text-sm text-neutral-200">
      {skill.iconUrl ? (
        <img
          src={skill.iconUrl}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          decoding="async"
          className="size-5"
        />
      ) : (
        <span
          className="grid size-5 place-items-center rounded bg-bg-elevated text-[10px] font-bold text-primary-400"
          aria-hidden="true"
        >
          {skill.name.slice(0, 2)}
        </span>
      )}
      {skill.name}
    </span>
  );
}
