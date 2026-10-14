import type { BlogStatus, MessageStatus, SectionKey } from "@portfolio/shared";
import { useQuery } from "@tanstack/react-query";
import { download, request } from "@/lib/api";

export interface DashboardData {
  counts: {
    projects: number;
    skills: number;
    experiences: number;
    achievements: number;
    activities: number;
    socialLinks: number;
    media: number;
    blogPosts: number;
    blogDrafts: number;
    messagesNew: number;
  };
  disabledSections: SectionKey[];
  latestMessages: {
    id: number;
    name: string;
    subject: string;
    status: MessageStatus;
    createdAt: string;
  }[];
  drafts: { id: number; title: string; updatedAt: string; status?: BlogStatus }[];
  messagesPerDay: { day: string; count: number }[];
}

export const useDashboard = () =>
  useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => request<DashboardData>("/dashboard"),
  });

export const exportJson = () =>
  download("/export", `portfolio-export-${new Date().toISOString().slice(0, 10)}.json`);
