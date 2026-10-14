import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Field } from "@astryxdesign/core/Field";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Thumbnail } from "@astryxdesign/core/Thumbnail";
import { VStack } from "@astryxdesign/core/VStack";
import { DocumentTextIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMediaList } from "@/features/media/api";
import type { MediaItem } from "@/features/media/types";
import { UploadForm } from "@/features/media/UploadForm";
import { thumb } from "@/lib/cloudinary";
import { DialogFrame } from "@/components/common/DialogFrame";

export type MediaRef = Pick<MediaItem, "id" | "url" | "alt" | "resourceType">;

interface MediaPickerProps {
  label: string;
  value: MediaRef | null;
  onChange: (value: MediaRef | null) => void;
  /** "pdf" restricts to raw files (CV); default images. */
  kind?: "image" | "pdf";
  folder?: string;
  isOptional?: boolean;
  description?: string;
}

/**
 * Pick a file from the media library or upload a new one.
 * Not in Astryx: composed from Field + Thumbnail + Dialog + TabList + FileInput (see DEVIATIONS.md).
 */
export function MediaPicker({
  label,
  value,
  onChange,
  kind = "image",
  folder = "library",
  isOptional,
  description,
}: MediaPickerProps) {
  const { t } = useTranslation();
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Field label={label} inputID={id} isOptional={isOptional} description={description}>
      <HStack gap={3} vAlign="center" wrap="wrap">
        {value ? (
          value.resourceType === "image" ? (
            <Thumbnail src={thumb(value.url, 160)} alt={value.alt} label={value.alt || label} />
          ) : (
            <HStack gap={1} vAlign="center">
              <Icon icon={DocumentTextIcon} size="sm" color="secondary" />
              <Text maxLines={1}>{value.url.split("/").pop()}</Text>
            </HStack>
          )
        ) : (
          <Text type="supporting" color="secondary">
            {t("mediaPicker.none")}
          </Text>
        )}
        <HStack gap={2}>
          <Button
            label={value ? t("mediaPicker.replace") : t("mediaPicker.choose")}
            size="sm"
            onClick={() => setIsOpen(true)}
          />
          {value && (
            <Button
              label={t("mediaPicker.remove")}
              size="sm"
              variant="ghost"
              onClick={() => onChange(null)}
            />
          )}
        </HStack>
      </HStack>
      <MediaPickerDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={t("mediaPicker.dialogTitle", { label: label.toLowerCase() })}
        kind={kind}
        folder={folder}
        onSelect={(m) => {
          onChange({ id: m.id, url: m.url, alt: m.alt, resourceType: m.resourceType });
          setIsOpen(false);
        }}
      />
    </Field>
  );
}

/** Library/upload dialog — also used to insert images into markdown and add gallery photos. */
export function MediaPickerDialog({
  isOpen,
  onOpenChange,
  title,
  kind = "image",
  folder = "library",
  onSelect,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  kind?: "image" | "pdf";
  folder?: string;
  onSelect: (item: MediaItem) => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("library");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const list = useMediaList({ page, q: q.trim() || undefined });
  const wanted = kind === "pdf" ? "raw" : "image";
  const items = (list.data?.items ?? []).filter((m) => m.resourceType === wanted);

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={720}>
      <DialogFrame header={<DialogHeader title={title} onOpenChange={onOpenChange} />}>
        <TabList value={tab} onChange={setTab} hasDivider>
          <Tab value="library" label={t("mediaPicker.library")} />
          <Tab value="upload" label={t("mediaPicker.upload")} />
        </TabList>
        {tab === "library" ? (
          <VStack gap={4}>
            <TextInput
              label={t("common.search")}
              isLabelHidden
              size="sm"
              startIcon={MagnifyingGlassIcon}
              placeholder={t("media.searchPlaceholder")}
              value={q}
              onChange={(v) => {
                setQ(v);
                setPage(1);
              }}
              hasClear
            />
            {items.length === 0 ? (
              <EmptyState isCompact title={t("mediaPicker.empty")} />
            ) : (
              <Grid gap={3} columns={{ minWidth: 112, repeat: "fill" }}>
                {items.map((m) =>
                  m.resourceType === "image" ? (
                    <Thumbnail
                      key={m.id}
                      src={thumb(m.url)}
                      alt={m.alt}
                      label={m.alt || m.url.split("/").pop()}
                      onClick={() => onSelect(m)}
                    />
                  ) : (
                    <Button
                      key={m.id}
                      label={m.url.split("/").pop() ?? String(m.id)}
                      onClick={() => onSelect(m)}
                    />
                  ),
                )}
              </Grid>
            )}
            {list.data && list.data.total > list.data.pageSize && (
              <Pagination
                page={page}
                onChange={setPage}
                totalItems={list.data.total}
                pageSize={list.data.pageSize}
                variant="count"
                size="sm"
              />
            )}
          </VStack>
        ) : (
          <UploadForm
            accept={kind}
            defaultFolder={folder}
            onUploaded={(item) => {
              setTab("library");
              onSelect(item);
            }}
          />
        )}
      </DialogFrame>
    </Dialog>
  );
}
