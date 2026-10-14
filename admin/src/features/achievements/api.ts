import type { AchievementInput } from "@portfolio/shared";
import { createResourceApi } from "@/lib/resource";
import type { Achievement } from "./types";

export const achievementsApi = createResourceApi<Achievement, AchievementInput>("/achievements");
