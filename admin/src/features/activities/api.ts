import type { ActivityInput } from "@portfolio/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { createResourceApi } from "@/lib/resource";
import type { Activity } from "./types";

export const activitiesApi = createResourceApi<Activity, ActivityInput>("/activities");

function useGalleryMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: activitiesApi.key });
      void qc.invalidateQueries({ queryKey: ["admin", "/media"] });
    },
  });
}

export const useAttachImage = () =>
  useGalleryMutation(({ id, mediaId }: { id: number; mediaId: number }) =>
    request<Activity>(`/activities/${id}/images`, { method: "POST", body: { mediaId } }),
  );

export const useDetachImage = () =>
  useGalleryMutation(({ id, mediaId }: { id: number; mediaId: number }) =>
    request<void>(`/activities/${id}/images/${mediaId}`, { method: "DELETE" }),
  );

export const useReorderImages = () =>
  useGalleryMutation(({ id, ids }: { id: number; ids: number[] }) =>
    request<Activity>(`/activities/${id}/images`, { method: "PATCH", body: { ids } }),
  );
