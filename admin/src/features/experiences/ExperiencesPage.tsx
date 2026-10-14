import { EMPLOYMENT_TYPES } from "@portfolio/shared";
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
import { formatMonth } from "@/lib/format";
import { isManualOrder, sortRows, useListActions, useSortState } from "@/lib/list-actions";
import { experiencesApi } from "./api";
import { ExperienceFormDialog, type ExperienceFormValues } from "./ExperienceFormDialog";
import type { Experience } from "./types";

type SortKey = "sortOrder" | "position" | "employmentType" | "startDate";

export function ExperiencesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const list = experiencesApi.useList();
  const create = experiencesApi.useCreate();
  const update = experiencesApi.useUpdate();
  const items = useMemo(() => list.data ?? [], [list.data]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useSortState<SortKey>();
  const [editing, setEditing] = useState<Experience | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const actions = useListActions(experiencesApi, items, {
    deleteTitle: t("experiences.deleteTitle"),
    deleteDescription: (name) => t("experiences.deleteDescription", { name }),
    deleteAction: t("experiences.deleteAction"),
    toastDeleted: t("experiences.toastDeleted"),
  });

  const hasFilters = search !== "" || typeFilter !== null || statusFilter !== null;
  const canReorder = isManualOrder(sort, hasFilters);
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      items.filter(
        (e) =>
          (!q || `${e.position} ${e.company}`.toLowerCase().includes(q)) &&
          (!typeFilter || e.employmentType === typeFilter) &&
          (!statusFilter || String(e.published) === statusFilter),
      ),
      sort,
    );
  }, [items, search, typeFilter, statusFilter, sort]);
  const sortPlugin = useTableSortable<Experience, SortKey>({ sort, onSortChange: setSort });

  const clearFilters = () => {
    setSearch("");
    setTypeFilter(null);
    setStatusFilter(null);
  };
  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const handleSubmit = async (values: ExperienceFormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
        toast({ body: t("experiences.toastUpdated") });
      } else {
        await create.mutateAsync(values);
        toast({ body: t("experiences.toastCreated") });
      }
    } catch (err) {
      actions.fail(err);
      throw err;
    }
  };

  const columns: TableColumn<Experience>[] = [
    {
      key: "position",
      header: t("experiences.columns.position"),
      width: proportional(3),
      sortable: true,
      renderCell: (e) => (
        <VStack gap={0}>
          <Text weight="medium">{e.position}</Text>
          <Text type="supporting" color="secondary">
            {e.company}
          </Text>
        </VStack>
      ),
    },
    {
      key: "employmentType",
      header: t("experiences.columns.type"),
      width: pixel(150),
      sortable: true,
      renderCell: (e) => enumLabel("employmentType", e.employmentType),
    },
    {
      key: "startDate",
      header: t("experiences.columns.period"),
      width: pixel(200),
      sortable: true,
      renderCell: (e) =>
        `${formatMonth(e.startDate)} — ${e.endDate ? formatMonth(e.endDate) : t("experiences.present")}`,
    },
    {
      key: "published",
      header: t("experiences.columns.status"),
      width: pixel(140),
      renderCell: (e) => (
        <StatusLabel
          variant={publishedVariant(e.published)}
          label={e.published ? t("common.published") : t("common.hidden")}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      width: pixel(56),
      renderCell: (e) => (
        <MoreMenu
          size="sm"
          label={t("common.actionsFor", { name: e.position })}
          items={[
            {
              label: t("common.edit"),
              icon: PencilSquareIcon,
              onClick: () => {
                setEditing(e);
                setIsFormOpen(true);
              },
            },
            {
              label: e.published ? t("common.hide") : t("common.publish"),
              icon: e.published ? EyeSlashIcon : EyeIcon,
              onClick: () => actions.setPublished(e.id, !e.published),
            },
            {
              label: t("common.moveUp"),
              icon: ArrowUpIcon,
              isDisabled: !canReorder || !actions.canMove(e.id, -1),
              onClick: () => actions.move(e.id, -1),
            },
            {
              label: t("common.moveDown"),
              icon: ArrowDownIcon,
              isDisabled: !canReorder || !actions.canMove(e.id, 1),
              onClick: () => actions.move(e.id, 1),
            },
            { type: "divider" },
            {
              label: t("common.delete"),
              icon: TrashIcon,
              variant: "destructive",
              onClick: () => actions.remove(e.id, `${e.position} @ ${e.company}`),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t("experiences.title")}
        description={t("experiences.description")}
        actions={
          <Button
            label={t("experiences.newItem")}
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
        emptyTitle={hasFilters ? t("experiences.emptyMatchTitle") : t("experiences.emptyTitle")}
        emptyDescription={
          hasFilters ? t("common.noMatchDescription") : t("experiences.emptyDescription")
        }
        emptyActions={
          hasFilters ? (
            <Button label={t("common.clearFilters")} onClick={clearFilters} />
          ) : (
            <Button label={t("experiences.newItem")} variant="primary" onClick={openCreate} />
          )
        }
        toolbar={
          <TableToolbar
            label={t("common.filters", { name: t("experiences.title") })}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("experiences.searchPlaceholder")}
            filters={
              <>
                <Selector
                  label={t("experiences.filterType")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("experiences.filterType")}
                  options={enumOptions("employmentType", EMPLOYMENT_TYPES)}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />
                <Selector
                  label={t("experiences.filterStatus")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("experiences.filterStatus")}
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
      <ExperienceFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        experience={editing}
        onSubmit={handleSubmit}
      />
      {actions.confirmElement}
    </Page>
  );
}
