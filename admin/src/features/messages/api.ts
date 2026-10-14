import type { MessageStatus } from "@portfolio/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import type { Message } from "./types";

const key = ["admin", "/messages"] as const;

export const useMessages = () =>
  useQuery({
    queryKey: key,
    queryFn: () => request<{ items: Message[] }>("/messages").then((r) => r.items),
  });

/** Unread count for the side-nav badge (shares the list cache). */
export function useUnreadCount(): number {
  const { data } = useQuery({
    queryKey: key,
    queryFn: () => request<{ items: Message[] }>("/messages").then((r) => r.items),
    refetchInterval: 60_000,
  });
  return data?.filter((m) => m.status === "new").length ?? 0;
}

export function useSetMessageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: MessageStatus }) =>
      request<Message>(`/messages/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<void>(`/messages/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
