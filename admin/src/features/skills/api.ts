import type { SkillInput } from "@portfolio/shared";
import { createResourceApi } from "@/lib/resource";
import type { Skill } from "./types";

export const skillsApi = createResourceApi<Skill, SkillInput>("/skills");
