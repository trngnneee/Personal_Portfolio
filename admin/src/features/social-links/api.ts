import type { SocialLinkInput } from "@portfolio/shared";
import { createResourceApi } from "@/lib/resource";
import type { SocialLink } from "./types";

export const socialLinksApi = createResourceApi<SocialLink, SocialLinkInput>("/social-links");
