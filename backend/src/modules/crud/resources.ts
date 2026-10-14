import {
  achievementSchema,
  experienceSchema,
  projectSchema,
  skillSchema,
  socialLinkSchema,
} from "@portfolio/shared";
import type { AppContext } from "../../context.js";
import { achievements, experiences, projects, skills, socialLinks } from "../../db/schema.js";
import { createCrud } from "./crud.js";

// Plain list resources: everything is handled by the generic factory.
export function createSimpleResources(ctx: AppContext) {
  return {
    projects: createCrud(ctx, {
      path: "/projects",
      table: projects,
      columns: { id: projects.id, sortOrder: projects.sortOrder },
      schema: projectSchema,
      mediaFields: { coverMediaId: "cover" },
    }),
    experiences: createCrud(ctx, {
      path: "/experiences",
      table: experiences,
      columns: { id: experiences.id, sortOrder: experiences.sortOrder },
      schema: experienceSchema,
      mediaFields: { logoMediaId: "logo" },
    }),
    achievements: createCrud(ctx, {
      path: "/achievements",
      table: achievements,
      columns: { id: achievements.id, sortOrder: achievements.sortOrder },
      schema: achievementSchema,
      mediaFields: { mediaId: "media" },
    }),
    skills: createCrud(ctx, {
      path: "/skills",
      table: skills,
      columns: { id: skills.id, sortOrder: skills.sortOrder },
      schema: skillSchema,
    }),
    socialLinks: createCrud(ctx, {
      path: "/social-links",
      table: socialLinks,
      columns: { id: socialLinks.id, sortOrder: socialLinks.sortOrder },
      schema: socialLinkSchema,
    }),
  };
}
