import { ACHIEVEMENT_TYPES } from "@portfolio/shared";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Selector } from "@astryxdesign/core/Selector";
import { pixel, proportional, useTableSortable, type TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
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
import { enumLabel, enumOptions } from "@/i18n";
import { isManualOrder, sortRows, useListActions, useSortState } from "@/lib/list-actions";
import { AchievementFormDialog, type AchievementFormValues } from "./AchievementFormDialog";
import { achievementsApi } from "./api";
import type { Achievement } from "./types";

type SortKey = "sortOrder" | "title" | "type" | "periodLabel";
const TYPE_BADGE = { education: "green", certification: "blue", award: "orange" } as const;

export function AchievementsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const list = achievementsApi.useList();
  const create = achievementsApi.useCreate();
  const update = achievementsApi.useUpdate();
  const items = useMemo(() => list.data ?? [], [list.data]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useSortState<SortKey>();
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const actions = useListActions(achievementsApi, items, {
    deleteTitle: t("achievements.deleteTitle"),
    deleteDescription: (name) => t("achievements.deleteDescription", { name }),
    deleteAction: t("achievements.deleteAction"),
    toastDeleted: t("achievements.toastDeleted"),
  });

  const hasFilters = search !== "" || typeFilter !== null || statusFilter !== null;
  const canReorder = isManualOrder(sort, hasFilters);
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      items.filter(
        (a) =>
          (!q || `${a.title} ${a.issuer ?? ""}`.toLowerCase().includes(q)) &&
          (!typeFilter || a.type === typeFilter) &&
          (!statusFilter || String(a.published) === statusFilter),
      ),
      sort,
    );
  }, [items, search, typeFilter, statusFilter, sort]);
  const sortPlugin = useTableSortable<Achievement, SortKey>({ sort, onSortChange: setSort });

  const clearFilters = () => {
    setSearch("");
    setTypeFilter(null);
    setStatusFilter(null);
  };
  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const handleSubmit = async (values: AchievementFormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
        toast({ body: t("achievements.toastUpdated") });
      } else {
        await create.mutateAsync(values);
        toast({ body: t("achievements.toastCreated") });
      }
    } catch (err) {
      actions.fail(err);
      throw err;
    }
  };

  const columns: TableColumn<Achievement>[] = [
    {
      key: "title",
      header: t("achievements.columns.title"),
      width: proportional(3),
      sortable: true,
      renderCell: (a) => (
        <VStack gap={0}>
          <Text weight="medium" maxLines={2}>
            {a.title}
          </Text>
          <Text type="supporting" color="secondary">
            {a.issuer ?? t("common.none")}
          </Text>
        </VStack>
      ),
    },
    {
      key: "type",
      header: t("achievements.columns.type"),
      width: pixel(140),
      sortable: true,
      renderCell: (a) => (
        <Badge label={enumLabel("achievementType", a.type)} variant={TYPE_BADGE[a.type]} />
      ),
    },
    {
      key: "periodLabel",
      header: t("achievements.columns.period"),
      width: pixel(120),
      sortable: true,
      renderCell: (a) => a.periodLabel ?? t("common.none"),
    },
    {
      key: "published",
      header: t("achievements.columns.status"),
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
        title={t("achievements.title")}
        description={t("achievements.description")}
        actions={
          <Button
            label={t("achievements.newItem")}
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
        emptyTitle={hasFilters ? t("achievements.emptyMatchTitle") : t("achievements.emptyTitle")}
        emptyDescription={
          hasFilters ? t("common.noMatchDescription") : t("achievements.emptyDescription")
        }
        emptyActions={
          hasFilters ? (
            <Button label={t("common.clearFilters")} onClick={clearFilters} />
          ) : (
            <Button label={t("achievements.newItem")} variant="primary" onClick={openCreate} />
          )
        }
        toolbar={
          <TableToolbar
            label={t("common.filters", { name: t("achievements.title") })}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("achievements.searchPlaceholder")}
            filters={
              <>
                <Selector
                  label={t("achievements.filterType")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("achievements.filterType")}
                  options={enumOptions("achievementType", ACHIEVEMENT_TYPES)}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />
                <Selector
                  label={t("achievements.filterStatus")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("achievements.filterStatus")}
                  options={[
                    { value: "true", label: t("common.published") },
                    { value: "false", label: t("common.hidden") },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </>
            }
          />
        }
      />
      <AchievementFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        achievement={editing}
        onSubmit={handleSubmit}
      />
      {actions.confirmElement}
    </Page>
  );
}
