import { SKILL_CATEGORIES } from "@portfolio/shared";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Selector } from "@astryxdesign/core/Selector";
import { pixel, proportional, useTableSortable, type TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
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
import { skillsApi } from "./api";
import { SkillFormDialog, type SkillFormValues } from "./SkillFormDialog";
import type { Skill } from "./types";

type SortKey = "sortOrder" | "name" | "category" | "level";

export function SkillsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const list = skillsApi.useList();
  const create = skillsApi.useCreate();
  const update = skillsApi.useUpdate();
  const skills = useMemo(() => list.data ?? [], [list.data]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useSortState<SortKey>();
  const [editing, setEditing] = useState<Skill | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const actions = useListActions(skillsApi, skills, {
    deleteTitle: t("skills.deleteTitle"),
    deleteDescription: (name) => t("skills.deleteDescription", { name }),
    deleteAction: t("skills.deleteAction"),
    toastDeleted: t("skills.toastDeleted"),
  });

  const hasFilters = search !== "" || categoryFilter !== null || statusFilter !== null;
  const canReorder = isManualOrder(sort, hasFilters);
  const visibleSkills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      skills.filter(
        (s) =>
          (!q || s.name.toLowerCase().includes(q)) &&
          (!categoryFilter || s.category === categoryFilter) &&
          (!statusFilter || String(s.published) === statusFilter),
      ),
      sort,
    );
  }, [skills, search, categoryFilter, statusFilter, sort]);
  const sortPlugin = useTableSortable<Skill, SortKey>({ sort, onSortChange: setSort });

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter(null);
    setStatusFilter(null);
  };
  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const handleSubmit = async (values: SkillFormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
        toast({ body: t("skills.toastUpdated") });
      } else {
        await create.mutateAsync(values);
        toast({ body: t("skills.toastCreated") });
      }
    } catch (err) {
      actions.fail(err);
      throw err;
    }
  };

  const columns: TableColumn<Skill>[] = [
    {
      key: "name",
      header: t("skills.columns.name"),
      width: proportional(2),
      sortable: true,
      renderCell: (s) => (
        <HStack gap={3} vAlign="center">
          <Avatar
            src={s.iconUrl ?? undefined}
            name={s.name}
            size="sm"
            shape="rounded"
            tooltip={false}
          />
          <Text weight="medium">{s.name}</Text>
        </HStack>
      ),
    },
    {
      key: "category",
      header: t("skills.columns.category"),
      width: pixel(160),
      sortable: true,
      renderCell: (s) => enumLabel("skillCategory", s.category),
    },
    {
      key: "level",
      header: t("skills.columns.level"),
      width: pixel(100),
      align: "end",
      sortable: true,
      renderCell: (s) => (s.level == null ? t("common.none") : `${s.level}%`),
    },
    {
      key: "published",
      header: t("skills.columns.status"),
      width: pixel(140),
      renderCell: (s) => (
        <StatusLabel
          variant={publishedVariant(s.published)}
          label={s.published ? t("common.published") : t("common.hidden")}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      width: pixel(56),
      renderCell: (s) => (
        <MoreMenu
          size="sm"
          label={t("common.actionsFor", { name: s.name })}
          items={[
            {
              label: t("common.edit"),
              icon: PencilSquareIcon,
              onClick: () => {
                setEditing(s);
                setIsFormOpen(true);
              },
            },
            {
              label: s.published ? t("common.hide") : t("common.publish"),
              icon: s.published ? EyeSlashIcon : EyeIcon,
              onClick: () => actions.setPublished(s.id, !s.published),
            },
            {
              label: t("common.moveUp"),
              icon: ArrowUpIcon,
              isDisabled: !canReorder || !actions.canMove(s.id, -1),
              onClick: () => actions.move(s.id, -1),
            },
            {
              label: t("common.moveDown"),
              icon: ArrowDownIcon,
              isDisabled: !canReorder || !actions.canMove(s.id, 1),
              onClick: () => actions.move(s.id, 1),
            },
            { type: "divider" },
            {
              label: t("common.delete"),
              icon: TrashIcon,
              variant: "destructive",
              onClick: () => actions.remove(s.id, s.name),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t("skills.title")}
        description={t("skills.description")}
        actions={
          <Button
            label={t("skills.newItem")}
            variant="primary"
            icon={<PlusIcon />}
            onClick={openCreate}
          />
        }
      />
      <DataTable
        data={visibleSkills}
        columns={columns}
        idKey="id"
        pageSize={20}
        plugins={{ sortable: sortPlugin }}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        emptyTitle={hasFilters ? t("skills.emptyMatchTitle") : t("skills.emptyTitle")}
        emptyDescription={
          hasFilters ? t("common.noMatchDescription") : t("skills.emptyDescription")
        }
        emptyActions={
          hasFilters ? (
            <Button label={t("common.clearFilters")} onClick={clearFilters} />
          ) : (
            <Button label={t("skills.newItem")} variant="primary" onClick={openCreate} />
          )
        }
        toolbar={
          <TableToolbar
            label={t("common.filters", { name: t("skills.title") })}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("skills.searchPlaceholder")}
            filters={
              <>
                <Selector
                  label={t("skills.filterCategory")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("skills.filterCategory")}
                  options={enumOptions("skillCategory", SKILL_CATEGORIES)}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
                <Selector
                  label={t("skills.filterStatus")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("skills.filterStatus")}
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
      <SkillFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        skill={editing}
        onSubmit={handleSubmit}
      />
      {actions.confirmElement}
    </Page>
  );
}
