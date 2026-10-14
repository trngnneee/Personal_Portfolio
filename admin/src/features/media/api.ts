import type { Paginated } from "@portfolio/shared";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import type { MediaItem } from "./types";

const key = ["admin", "/media"] as const;

export interface MediaQuery {
  page?: number;
  q?: string;
  folder?: string;
}

export function useMediaList({ page = 1, q, folder }: MediaQuery) {
  const params = new URLSearchParams({ page: String(page) });
  if (q) params.set("q", q);
  if (folder) params.set("folder", folder);
  return useQuery({
    queryKey: [...key, { page, q, folder }],
    queryFn: () => request<Paginated<MediaItem>>(`/media?${params}`),
    placeholderData: keepPreviousData,
  });
}

export interface UploadInput {
  file: File;
  alt: string;
  folder: string;
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, alt, folder }: UploadInput) => {
      const form = new FormData();
      form.set("alt", alt);
      form.set("folder", folder);
      form.set("file", file);
      return request<MediaItem>("/media", { method: "POST", body: form });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateMediaAlt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alt }: { id: number; alt: string }) =>
      request<MediaItem>(`/media/${id}`, { method: "PATCH", body: { alt } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<void>(`/media/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
