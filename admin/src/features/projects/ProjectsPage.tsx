import { PROJECT_CATEGORIES } from "@portfolio/shared";
import { Badge } from "@astryxdesign/core/Badge";
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
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  PlusIcon,
  StarIcon,
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
import { publicUrl } from "@/config/app";
import { enumLabel, enumOptions } from "@/i18n";
import { thumb } from "@/lib/cloudinary";
import { formatDate } from "@/lib/format";
import { isManualOrder, sortRows, useListActions, useSortState } from "@/lib/list-actions";
import { projectsApi } from "./api";
import { ProjectFormDialog, type ProjectFormValues } from "./ProjectFormDialog";
import type { Project } from "./types";

type SortKey = "sortOrder" | "title" | "category" | "updatedAt";

const CATEGORY_BADGE = {
  homelab: "purple",
  cloud: "blue",
  bot: "teal",
  iot: "orange",
  fullstack: "green",
  ai: "pink",
  game: "yellow",
  other: "neutral",
} as const;

export function ProjectsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const list = projectsApi.useList();
  const create = projectsApi.useCreate();
  const update = projectsApi.useUpdate();
  const projects = useMemo(() => list.data ?? [], [list.data]);
  const techSuggestions = useMemo(() => projects.flatMap((p) => p.techStack), [projects]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useSortState<SortKey>();
  const [editing, setEditing] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const actions = useListActions(projectsApi, projects, {
    deleteTitle: t("projects.deleteTitle"),
    deleteDescription: (name) => t("projects.deleteDescription", { name }),
    deleteAction: t("projects.deleteAction"),
    toastDeleted: t("projects.toastDeleted"),
  });

  const hasFilters = search !== "" || categoryFilter !== null || statusFilter !== null;
  const canReorder = isManualOrder(sort, hasFilters);
  const visibleProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      projects.filter(
        (p) =>
          (!q || `${p.title} ${p.summary} ${p.techStack.join(" ")}`.toLowerCase().includes(q)) &&
          (!categoryFilter || p.category === categoryFilter) &&
          (!statusFilter || String(p.published) === statusFilter),
      ),
      sort,
    );
  }, [projects, search, categoryFilter, statusFilter, sort]);
  const sortPlugin = useTableSortable<Project, SortKey>({ sort, onSortChange: setSort });

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter(null);
    setStatusFilter(null);
  };
  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
        toast({ body: t("projects.toastUpdated") });
      } else {
        await create.mutateAsync(values);
        toast({ body: t("projects.toastCreated") });
      }
    } catch (err) {
      actions.fail(err);
      throw err;
    }
  };

  const columns: TableColumn<Project>[] = [
    {
      key: "title",
      header: t("projects.columns.title"),
      width: proportional(3),
      sortable: true,
      renderCell: (p) => (
        <HStack gap={3} vAlign="center">
          {p.cover && <Thumbnail src={thumb(p.cover.url, 96)} alt={p.cover.alt} />}
          <VStack gap={0}>
            <Text weight="medium" maxLines={1}>
              {p.title}
            </Text>
            <Text type="supporting" color="secondary" maxLines={1}>
              {p.slug}
            </Text>
          </VStack>
        </HStack>
      ),
    },
    {
      key: "category",
      header: t("projects.columns.category"),
      width: pixel(130),
      sortable: true,
      renderCell: (p) => (
        <Badge
          label={enumLabel("projectCategory", p.category)}
          variant={CATEGORY_BADGE[p.category]}
        />
      ),
    },
    {
      key: "featured",
      header: t("projects.columns.featured"),
      width: pixel(110),
      renderCell: (p) =>
        p.featured ? <Badge label={t("projects.featured")} variant="warning" /> : t("common.none"),
    },
    {
      key: "published",
      header: t("projects.columns.status"),
      width: pixel(140),
      renderCell: (p) => (
        <StatusLabel
          variant={publishedVariant(p.published)}
          label={p.published ? t("common.published") : t("common.hidden")}
        />
      ),
    },
    {
      key: "updatedAt",
      header: t("projects.columns.updated"),
      width: pixel(130),
      sortable: true,
      renderCell: (p) => formatDate(p.updatedAt),
    },
    {
      key: "actions",
      header: "",
      width: pixel(56),
      renderCell: (p) => (
        <MoreMenu
          size="sm"
          label={t("common.actionsFor", { name: p.title })}
          items={[
            ...(p.published
              ? [
                  {
                    label: t("common.viewOnSite"),
                    icon: ArrowTopRightOnSquareIcon,
                    href: publicUrl(`/projects?p=${p.slug}`),
                    target: "_blank" as const,
                  },
                ]
              : []),
            {
              label: t("common.edit"),
              icon: PencilSquareIcon,
              onClick: () => {
                setEditing(p);
                setIsFormOpen(true);
              },
            },
            {
              label: p.published ? t("common.hide") : t("common.publish"),
              icon: p.published ? EyeSlashIcon : EyeIcon,
              onClick: () => actions.setPublished(p.id, !p.published),
            },
            {
              label: t("projects.featured"),
              icon: StarIcon,
              onClick: () => actions.setPublished(p.id, !p.featured, "featured"),
            },
            {
              label: t("common.moveUp"),
              icon: ArrowUpIcon,
              isDisabled: !canReorder || !actions.canMove(p.id, -1),
              onClick: () => actions.move(p.id, -1),
            },
            {
              label: t("common.moveDown"),
              icon: ArrowDownIcon,
              isDisabled: !canReorder || !actions.canMove(p.id, 1),
              onClick: () => actions.move(p.id, 1),
            },
            { type: "divider" },
            {
              label: t("common.delete"),
              icon: TrashIcon,
              variant: "destructive",
              onClick: () => actions.remove(p.id, p.title),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t("projects.title")}
        description={t("projects.description")}
        actions={
          <Button
            label={t("projects.newItem")}
            variant="primary"
            icon={<PlusIcon />}
            onClick={openCreate}
          />
        }
      />
      <DataTable
        data={visibleProjects}
        columns={columns}
        idKey="id"
        plugins={{ sortable: sortPlugin }}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        emptyTitle={hasFilters ? t("projects.emptyMatchTitle") : t("projects.emptyTitle")}
        emptyDescription={
          hasFilters ? t("common.noMatchDescription") : t("projects.emptyDescription")
        }
        emptyActions={
          hasFilters ? (
            <Button label={t("common.clearFilters")} onClick={clearFilters} />
          ) : (
            <Button label={t("projects.newItem")} variant="primary" onClick={openCreate} />
          )
        }
        toolbar={
          <TableToolbar
            label={t("common.filters", { name: t("projects.title") })}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("projects.searchPlaceholder")}
            filters={
              <>
                <Selector
                  label={t("projects.filterCategory")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("projects.filterCategory")}
                  options={enumOptions("projectCategory", PROJECT_CATEGORIES)}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
                <Selector
                  label={t("projects.filterStatus")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("projects.filterStatus")}
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
      <ProjectFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        project={editing}
        onSubmit={handleSubmit}
        techSuggestions={techSuggestions}
      />
      {actions.confirmElement}
    </Page>
  );
}
