import type { SectionKey, SectionPatchInput } from "@portfolio/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";

export interface SiteSection {
  key: SectionKey;
  enabled: boolean;
  navLabel: string;
  heading: string;
  subheading: string;
  sortOrder: number;
  updatedAt: string;
}

const key = ["admin", "/sections"] as const;

export const useSections = () =>
  useQuery({
    queryKey: key,
    queryFn: () => request<{ items: SiteSection[] }>("/sections").then((r) => r.items),
  });

export function usePatchSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionKey, input }: { sectionKey: SectionKey; input: SectionPatchInput }) =>
      request<SiteSection>(`/sections/${sectionKey}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useReorderSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keys: SectionKey[]) =>
      request<{ items: SiteSection[] }>("/sections/reorder", { method: "PATCH", body: { keys } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
