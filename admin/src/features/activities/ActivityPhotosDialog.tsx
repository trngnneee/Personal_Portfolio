import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Thumbnail } from "@astryxdesign/core/Thumbnail";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MediaPickerDialog } from "@/components/common/MediaPicker";
import { ApiError } from "@/lib/api";
import { thumb } from "@/lib/cloudinary";
import { moveId } from "@/lib/resource";
import { useAttachImage, useDetachImage, useReorderImages } from "./api";
import type { Activity } from "./types";

export function ActivityPhotosDialog({
  activity,
  onOpenChange,
}: {
  activity: Activity | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const attach = useAttachImage();
  const detach = useDetachImage();
  const reorder = useReorderImages();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const fail = (err: unknown) =>
    toast({
      body: t("common.saveFailed", {
        message: err instanceof ApiError ? err.message : String(err),
      }),
      type: "error",
    });

  if (!activity) return null;
  const ids = activity.images.map((i) => i.id);

  const move = (mediaId: number, delta: -1 | 1) => {
    const next = moveId(ids, mediaId, delta);
    if (next)
      reorder.mutate(
        { id: activity.id, ids: next },
        { onSuccess: () => toast({ body: t("common.toastReordered") }), onError: fail },
      );
  };

  return (
    <Dialog isOpen onOpenChange={onOpenChange} purpose="form" width={720}>
      <VStack gap={4}>
        <DialogHeader
          title={t("activities.photos.title")}
          subtitle={t("activities.photos.subtitle", { name: activity.title })}
          onOpenChange={onOpenChange}
          endContent={
            <Button
              label={t("activities.photos.add")}
              size="sm"
              icon={<PlusIcon />}
              onClick={() => setIsPickerOpen(true)}
            />
          }
        />
        {activity.images.length === 0 ? (
          <EmptyState
            isCompact
            title={t("activities.photos.empty")}
            description={t("activities.photos.emptyDescription")}
          />
        ) : (
          <Grid gap={4} columns={{ minWidth: 140, repeat: "fill" }}>
            {activity.images.map((img, i) => (
              <VStack key={img.id} gap={2} hAlign="center">
                <Thumbnail
                  src={thumb(img.url)}
                  alt={img.alt}
                  label={img.alt || t("activities.photos.title")}
                  onRemove={() =>
                    detach.mutate(
                      { id: activity.id, mediaId: img.id },
                      {
                        onSuccess: () => toast({ body: t("activities.photos.toastRemoved") }),
                        onError: fail,
                      },
                    )
                  }
                  showRemoveOn="always"
                />
                <HStack gap={1}>
                  <IconButton
                    label={t("activities.photos.moveLeft")}
                    size="sm"
                    variant="ghost"
                    icon={<ArrowLeftIcon />}
                    isDisabled={i === 0}
                    onClick={() => move(img.id, -1)}
                  />
                  <IconButton
                    label={t("activities.photos.moveRight")}
                    size="sm"
                    variant="ghost"
                    icon={<ArrowRightIcon />}
                    isDisabled={i === activity.images.length - 1}
                    onClick={() => move(img.id, 1)}
                  />
                </HStack>
              </VStack>
            ))}
          </Grid>
        )}
        <HStack gap={2} hAlign="end">
          <Button
            label={t("activities.photos.done")}
            variant="primary"
            onClick={() => onOpenChange(false)}
          />
        </HStack>
      </VStack>
      <MediaPickerDialog
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        title={t("activities.photos.add")}
        folder="activities"
        onSelect={(m) => {
          setIsPickerOpen(false);
          attach.mutate(
            { id: activity.id, mediaId: m.id },
            { onSuccess: () => toast({ body: t("activities.photos.toastAdded") }), onError: fail },
          );
        }}
      />
    </Dialog>
  );
}
