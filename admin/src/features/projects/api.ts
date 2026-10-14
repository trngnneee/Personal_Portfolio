import type { ProjectInput } from "@portfolio/shared";
import { createResourceApi } from "@/lib/resource";
import type { Project } from "./types";

export const projectsApi = createResourceApi<Project, ProjectInput>("/projects");
