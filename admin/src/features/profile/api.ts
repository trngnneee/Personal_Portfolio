import type { ProfileInput } from "@portfolio/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, request } from "@/lib/api";
import type { MediaItem } from "@/features/media/types";

export interface Profile extends ProfileInput {
  avatar: MediaItem | null;
  cv: MediaItem | null;
}

const key = ["admin", "/profile"] as const;

/** null when no profile row exists yet (fresh database). */
export const useProfile = () =>
  useQuery({
    queryKey: key,
    queryFn: () =>
      request<Profile>("/profile").catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
  });

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) =>
      request<Profile>("/profile", { method: "PUT", body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["admin", "/media"] });
    },
  });
}
