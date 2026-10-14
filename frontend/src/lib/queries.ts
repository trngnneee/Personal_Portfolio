import type { SectionKey } from "@portfolio/shared";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { api, type BlogQuery } from "./api";

export const queryKeys = {
  site: ["site"] as const,
  blogList: (q: BlogQuery) => ["blog", "list", q] as const,
  blogPost: (slug: string) => ["blog", "post", slug] as const,
};

export const useSite = () => useQuery({ queryKey: queryKeys.site, queryFn: api.site });

export const useBlogList = (q: BlogQuery) =>
  useQuery({
    queryKey: queryKeys.blogList(q),
    queryFn: () => api.blogList(q),
    placeholderData: keepPreviousData,
  });

export const useBlogPost = (slug: string) =>
  useQuery({ queryKey: queryKeys.blogPost(slug), queryFn: () => api.blogPost(slug) });

export const useSendContact = () => useMutation({ mutationFn: api.contact });

/** Enabled section keys (empty while loading). */
export function useEnabledSections(): Set<SectionKey> {
  const { data } = useSite();
  return new Set(data?.sections.map((s) => s.key) ?? []);
}
