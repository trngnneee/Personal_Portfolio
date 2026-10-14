// Quick-start prompts on the welcome screen. Sent as normal user messages.
import { FolderGit2, Layers, Server, UserRound, type LucideIcon } from "lucide-react";

export interface Suggestion {
  title: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
}

export const SUGGESTIONS: readonly Suggestion[] = [
  {
    title: "About me",
    description: "Background and experience",
    prompt: "Tell me about Nguyen — his background and experience.",
    icon: UserRound,
  },
  {
    title: "Tech stack",
    description: "Technologies and tools",
    prompt: "What technologies and tools does Nguyen work with?",
    icon: Layers,
  },
  {
    title: "Homelab",
    description: "Self-hosted infrastructure",
    prompt: "Tell me about Nguyen's homelab and self-hosted infrastructure.",
    icon: Server,
  },
  {
    title: "Projects",
    description: "Engineering projects",
    prompt: "What engineering projects has Nguyen built?",
    icon: FolderGit2,
  },
];
