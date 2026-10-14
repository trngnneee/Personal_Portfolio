import type { BlogPostInput } from "@portfolio/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { createResourceApi } from "@/lib/resource";
import type { BlogPost } from "./types";

export const blogApi = createResourceApi<BlogPost, BlogPostInput>("/blog");

export const usePost = (id: number | null) =>
  useQuery({
    queryKey: [...blogApi.key, id],
    queryFn: () => request<BlogPost>(`/blog/${id}`),
    enabled: id !== null,
  });

export function useSetPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      request<BlogPost>(`/blog/${id}/${published ? "publish" : "unpublish"}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: blogApi.key }),
  });
}
