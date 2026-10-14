import { useImperativeAlertDialog } from "@astryxdesign/core/AlertDialog";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Section } from "@astryxdesign/core/Section";
import { Selector } from "@astryxdesign/core/Selector";
import { Spinner } from "@astryxdesign/core/Spinner";
import { StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Thumbnail } from "@astryxdesign/core/Thumbnail";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import {
  ArrowUpTrayIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TableToolbar } from "@/components/common/TableToolbar";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApiError } from "@/lib/api";
import { thumb } from "@/lib/cloudinary";
import { formatBytes } from "@/lib/format";
import { useDeleteMedia, useMediaList, useUpdateMediaAlt } from "./api";
import { MEDIA_FOLDERS, type MediaItem } from "./types";
import { UploadForm } from "./UploadForm";

const fileName = (m: MediaItem) => m.url.split("/").pop() ?? String(m.id);

export function MediaPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useImperativeAlertDialog();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingAlt, setEditingAlt] = useState<MediaItem | null>(null);
  const list = useMediaList({ page, q: search.trim() || undefined, folder: folder ?? undefined });
  const remove = useDeleteMedia();

  const items = (list.data?.items ?? []).filter(
    (m) => !typeFilter || m.resourceType === typeFilter,
  );
  const hasFilters = search !== "" || folder !== null || typeFilter !== null;
  const fail = (err: unknown) =>
    toast({
      body: t("common.saveFailed", {
        message: err instanceof ApiError ? err.message : String(err),
      }),
      type: "error",
    });

  const clearFilters = () => {
    setSearch("");
    setFolder(null);
    setTypeFilter(null);
    setPage(1);
  };
  const handleDelete = (m: MediaItem) =>
    confirm.show({
      title: t("media.deleteTitle"),
      description: t("media.deleteDescription", { name: m.alt || fileName(m) }),
      actionLabel: t("media.deleteAction"),
      onAction: () => {
        confirm.hide();
        remove.mutate(m.id, {
          onSuccess: () => toast({ body: t("media.toastDeleted") }),
          onError: fail,
        });
      },
    });
  const copyUrl = (m: MediaItem) =>
    void navigator.clipboard
      .writeText(m.url)
      .then(() => toast({ body: t("common.toastCopied") }), fail);

  return (
    <Page>
      <PageHeader
        title={t("media.title")}
        description={t("media.description")}
        actions={
          <Button
            label={t("media.upload")}
            variant="primary"
            icon={<ArrowUpTrayIcon />}
            onClick={() => setIsUploadOpen(true)}
          />
        }
      />
      <Card padding={0}>
        <TableToolbar
          label={t("common.filters", { name: t("media.title") })}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder={t("media.searchPlaceholder")}
          filters={
            <>
              <Selector
                label={t("media.filterFolder")}
                isLabelHidden
                size="sm"
                hasClear
                placeholder={t("media.filterFolder")}
                options={MEDIA_FOLDERS.map((f) => ({ value: f, label: f }))}
                value={folder}
                onChange={(v) => {
                  setFolder(v);
                  setPage(1);
                }}
              />
              <Selector
                label={t("media.filterType")}
                isLabelHidden
                size="sm"
                hasClear
                placeholder={t("media.filterType")}
                options={[
                  { value: "image", label: t("enums.resourceType.image") },
                  { value: "raw", label: t("enums.resourceType.raw") },
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
              />
            </>
          }
        />
        {list.isPending ? (
          <Center minHeight={240}>
            <Spinner label={t("common.loading")} />
          </Center>
        ) : list.isError ? (
          <Section variant="transparent" paddingBlock={10}>
            <EmptyState
              title={t("common.loadFailed", { message: list.error.message })}
              actions={<Button label={t("common.retry")} onClick={() => void list.refetch()} />}
            />
          </Section>
        ) : items.length === 0 ? (
          <Section variant="transparent" paddingBlock={10}>
            <EmptyState
              title={hasFilters ? t("media.emptyMatchTitle") : t("media.emptyTitle")}
              description={
                hasFilters ? t("common.noMatchDescription") : t("media.emptyDescription")
              }
              actions={
                hasFilters ? (
                  <Button label={t("common.clearFilters")} onClick={clearFilters} />
                ) : (
                  <Button
                    label={t("media.upload")}
                    variant="primary"
                    onClick={() => setIsUploadOpen(true)}
                  />
                )
              }
            />
          </Section>
        ) : (
          <Section variant="transparent" padding={4}>
            <Grid gap={4} columns={{ minWidth: 180, repeat: "fill" }}>
              {items.map((m) => {
                const used = m.usageCount ?? 0;
                return (
                  <VStack key={m.id} gap={2}>
                    {m.resourceType === "image" ? (
                      <Thumbnail src={thumb(m.url, 320)} alt={m.alt} label={m.alt || fileName(m)} />
                    ) : (
                      <Center height={96}>
                        <Icon icon={DocumentTextIcon} size="lg" color="secondary" />
                      </Center>
                    )}
                    <HStack gap={1} vAlign="start">
                      <StackItem size="fill">
                        <VStack gap={0}>
                          <Text weight="medium" maxLines={1}>
                            {m.alt || fileName(m)}
                          </Text>
                          <Text type="supporting" color="secondary" maxLines={1}>
                            {[m.folder, m.format?.toUpperCase(), formatBytes(m.bytes)]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                          <HStack>
                            <Badge
                              label={
                                used > 0 ? t("media.inUse", { count: used }) : t("media.unused")
                              }
                              variant={used > 0 ? "success" : "neutral"}
                            />
                          </HStack>
                        </VStack>
                      </StackItem>
                      <MoreMenu
                        size="sm"
                        label={t("common.actionsFor", { name: m.alt || fileName(m) })}
                        alignment="end"
                        items={[
                          {
                            label: t("common.copyUrl"),
                            icon: ClipboardDocumentIcon,
                            onClick: () => copyUrl(m),
                          },
                          {
                            label: t("media.editAlt"),
                            icon: PencilSquareIcon,
                            onClick: () => setEditingAlt(m),
                          },
                          { type: "divider" },
                          {
                            label: t("common.delete"),
                            icon: TrashIcon,
                            variant: "destructive",
                            isDisabled: used > 0,
                            description: used > 0 ? t("media.deleteBlocked") : undefined,
                            onClick: () => handleDelete(m),
                          },
                        ]}
                      />
                    </HStack>
                  </VStack>
                );
              })}
            </Grid>
          </Section>
        )}
        {list.data && list.data.total > list.data.pageSize && (
          <Section variant="transparent" paddingBlock={2}>
            <Pagination
              page={page}
              onChange={setPage}
              totalItems={list.data.total}
              pageSize={list.data.pageSize}
              variant="count"
              size="sm"
            />
          </Section>
        )}
      </Card>

      <Dialog isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} purpose="form" width={480}>
        <VStack gap={4}>
          <DialogHeader title={t("media.uploadDialog.title")} onOpenChange={setIsUploadOpen} />
          <UploadForm
            onUploaded={() => setIsUploadOpen(false)}
            onCancel={() => setIsUploadOpen(false)}
          />
        </VStack>
      </Dialog>
      <AltDialog item={editingAlt} onClose={() => setEditingAlt(null)} />
      {confirm.element}
    </Page>
  );
}

function AltDialog({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const update = useUpdateMediaAlt();
  const [alt, setAlt] = useState("");
  const [lastId, setLastId] = useState<number | null>(null);
  // Reset the field when a different item opens (state adjusted during render).
  if (item && item.id !== lastId) {
    setLastId(item.id);
    setAlt(item.alt);
  }

  const handleSave = () => {
    if (!item) return;
    update.mutate(
      { id: item.id, alt: alt.trim() },
      {
        onSuccess: () => {
          toast({ body: t("media.toastUpdated") });
          onClose();
        },
        onError: (err) =>
          toast({ body: t("common.saveFailed", { message: err.message }), type: "error" }),
      },
    );
  };

  return (
    <Dialog
      isOpen={item !== null}
      onOpenChange={(open) => !open && onClose()}
      purpose="form"
      width={440}
    >
      <VStack gap={4}>
        <DialogHeader
          title={t("media.altDialog.title")}
          subtitle={item ? fileName(item) : undefined}
          onOpenChange={() => onClose()}
        />
        <TextInput
          label={t("media.altDialog.alt")}
          value={alt}
          onChange={setAlt}
          onEnter={handleSave}
          hasAutoFocus
        />
        <HStack gap={2} hAlign="end">
          <Button label={t("common.cancel")} variant="ghost" onClick={onClose} />
          <Button
            label={t("common.saveChanges")}
            variant="primary"
            isLoading={update.isPending}
            onClick={handleSave}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
