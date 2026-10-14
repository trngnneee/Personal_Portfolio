import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Selector } from "@astryxdesign/core/Selector";
import { pixel, proportional, useTableSortable, type TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { Thumbnail } from "@astryxdesign/core/Thumbnail";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/common/DataTable";
import { StatusLabel } from "@/components/common/StatusLabel";
import { publishedVariant } from "@/lib/status";
import { TableToolbar } from "@/components/common/TableToolbar";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { thumb } from "@/lib/cloudinary";
import { formatNumber } from "@/lib/format";
import { isManualOrder, sortRows, useListActions, useSortState } from "@/lib/list-actions";
import { ActivityFormDialog, type ActivityFormValues } from "./ActivityFormDialog";
import { ActivityPhotosDialog } from "./ActivityPhotosDialog";
import { activitiesApi } from "./api";
import type { Activity } from "./types";

type SortKey = "sortOrder" | "title" | "periodLabel";

export function ActivitiesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const list = activitiesApi.useList();
  const create = activitiesApi.useCreate();
  const update = activitiesApi.useUpdate();
  const items = useMemo(() => list.data ?? [], [list.data]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [photosFilter, setPhotosFilter] = useState<string | null>(null);
  const [sort, setSort] = useSortState<SortKey>();
  const [editing, setEditing] = useState<Activity | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [photosFor, setPhotosFor] = useState<number | null>(null);
  const actions = useListActions(activitiesApi, items, {
    deleteTitle: t("activities.deleteTitle"),
    deleteDescription: (name) => t("activities.deleteDescription", { name }),
    deleteAction: t("activities.deleteAction"),
    toastDeleted: t("activities.toastDeleted"),
  });

  const hasFilters = search !== "" || statusFilter !== null || photosFilter !== null;
  const canReorder = isManualOrder(sort, hasFilters);
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      items.filter(
        (a) =>
          (!q ||
            `${a.title} ${a.organization ?? ""} ${a.location ?? ""}`.toLowerCase().includes(q)) &&
          (!statusFilter || String(a.published) === statusFilter) &&
          (!photosFilter || String(a.images.length > 0) === photosFilter),
      ),
      sort,
    );
  }, [items, search, statusFilter, photosFilter, sort]);
  const sortPlugin = useTableSortable<Activity, SortKey>({ sort, onSortChange: setSort });
  // Read the live row so the photos dialog reflects mutations immediately.
  const photosActivity = items.find((a) => a.id === photosFor) ?? null;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(null);
    setPhotosFilter(null);
  };
  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const handleSubmit = async (values: ActivityFormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
        toast({ body: t("activities.toastUpdated") });
      } else {
        const created = await create.mutateAsync(values);
        toast({ body: t("activities.toastCreated") });
        setPhotosFor(created.id);
      }
    } catch (err) {
      actions.fail(err);
      throw err;
    }
  };

  const columns: TableColumn<Activity>[] = [
    {
      key: "title",
      header: t("activities.columns.title"),
      width: proportional(3),
      sortable: true,
      renderCell: (a) => (
        <HStack gap={3} vAlign="center">
          {a.images[0] && <Thumbnail src={thumb(a.images[0].url, 96)} alt={a.images[0].alt} />}
          <VStack gap={0}>
            <Text weight="medium">{a.title}</Text>
            <Text type="supporting" color="secondary" maxLines={1}>
              {[a.organization, a.location].filter(Boolean).join(" · ") || t("common.none")}
            </Text>
          </VStack>
        </HStack>
      ),
    },
    {
      key: "periodLabel",
      header: t("activities.columns.period"),
      width: pixel(110),
      sortable: true,
      renderCell: (a) => a.periodLabel ?? t("common.none"),
    },
    {
      key: "photos",
      header: t("activities.columns.photos"),
      width: pixel(90),
      align: "end",
      renderCell: (a) => formatNumber(a.images.length),
    },
    {
      key: "published",
      header: t("activities.columns.status"),
      width: pixel(140),
      renderCell: (a) => (
        <StatusLabel
          variant={publishedVariant(a.published)}
          label={a.published ? t("common.published") : t("common.hidden")}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      width: pixel(56),
      renderCell: (a) => (
        <MoreMenu
          size="sm"
          label={t("common.actionsFor", { name: a.title })}
          items={[
            {
              label: t("activities.managePhotos"),
              icon: PhotoIcon,
              onClick: () => setPhotosFor(a.id),
            },
            {
              label: t("common.edit"),
              icon: PencilSquareIcon,
              onClick: () => {
                setEditing(a);
                setIsFormOpen(true);
              },
            },
            {
              label: a.published ? t("common.hide") : t("common.publish"),
              icon: a.published ? EyeSlashIcon : EyeIcon,
              onClick: () => actions.setPublished(a.id, !a.published),
            },
            {
              label: t("common.moveUp"),
              icon: ArrowUpIcon,
              isDisabled: !canReorder || !actions.canMove(a.id, -1),
              onClick: () => actions.move(a.id, -1),
            },
            {
              label: t("common.moveDown"),
              icon: ArrowDownIcon,
              isDisabled: !canReorder || !actions.canMove(a.id, 1),
              onClick: () => actions.move(a.id, 1),
            },
            { type: "divider" },
            {
              label: t("common.delete"),
              icon: TrashIcon,
              variant: "destructive",
              onClick: () => actions.remove(a.id, a.title),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t("activities.title")}
        description={t("activities.description")}
        actions={
          <Button
            label={t("activities.newItem")}
            variant="primary"
            icon={<PlusIcon />}
            onClick={openCreate}
          />
        }
      />
      <DataTable
        data={visibleItems}
        columns={columns}
        idKey="id"
        plugins={{ sortable: sortPlugin }}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        emptyTitle={hasFilters ? t("activities.emptyMatchTitle") : t("activities.emptyTitle")}
        emptyDescription={
          hasFilters ? t("common.noMatchDescription") : t("activities.emptyDescription")
        }
        emptyActions={
          hasFilters ? (
            <Button label={t("common.clearFilters")} onClick={clearFilters} />
          ) : (
            <Button label={t("activities.newItem")} variant="primary" onClick={openCreate} />
          )
        }
        toolbar={
          <TableToolbar
            label={t("common.filters", { name: t("activities.title") })}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("activities.searchPlaceholder")}
            filters={
              <>
                <Selector
                  label={t("activities.filterStatus")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("activities.filterStatus")}
                  options={[
                    { value: "true", label: t("common.published") },
                    { value: "false", label: t("common.hidden") },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <Selector
                  label={t("activities.filterPhotos")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("activities.filterPhotos")}
                  options={[
                    { value: "true", label: t("activities.withPhotos") },
                    { value: "false", label: t("activities.withoutPhotos") },
                  ]}
                  value={photosFilter}
                  onChange={setPhotosFilter}
                />
              </>
            }
          />
        }
      />
      <ActivityFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        activity={editing}
        onSubmit={handleSubmit}
      />
      <ActivityPhotosDialog
        activity={photosActivity}
        onOpenChange={(open) => !open && setPhotosFor(null)}
      />
      {actions.confirmElement}
    </Page>
  );
}
