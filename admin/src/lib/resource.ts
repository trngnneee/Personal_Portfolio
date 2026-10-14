import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "./api";

/**
 * Standard admin resource hooks (list / create / update / delete / reorder) for one
 * REST collection. Each feature's api.ts instantiates this — components never call fetch.
 */
export function createResourceApi<TItem extends { id: number }, TInput>(path: string) {
  const key = ["admin", path] as const;

  return {
    key,
    useList() {
      return useQuery({
        queryKey: key,
        queryFn: () => request<{ items: TItem[] }>(path).then((r) => r.items),
      });
    },
    useCreate() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (input: TInput) => request<TItem>(path, { method: "POST", body: input }),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
      });
    },
    useUpdate() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: ({ id, input }: { id: number; input: Partial<TInput> }) =>
          request<TItem>(`${path}/${id}`, { method: "PATCH", body: input }),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
      });
    },
    useDelete() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: number) => request<void>(`${path}/${id}`, { method: "DELETE" }),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: key });
          // Deleting can orphan media.
          void qc.invalidateQueries({ queryKey: ["admin", "/media"] });
        },
      });
    },
    useReorder() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (ids: number[]) =>
          request<void>(`${path}/reorder`, { method: "PATCH", body: { ids } }),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
      });
    },
  };
}

/** New id order after moving `id` one step up (-1) or down (+1). */
export function moveId(ids: number[], id: number, delta: -1 | 1): number[] | null {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return null;
  const next = [...ids];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}
