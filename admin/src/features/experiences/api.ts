import type { ExperienceInput } from "@portfolio/shared";
import { createResourceApi } from "@/lib/resource";
import type { Experience } from "./types";

export const experiencesApi = createResourceApi<Experience, ExperienceInput>("/experiences");
