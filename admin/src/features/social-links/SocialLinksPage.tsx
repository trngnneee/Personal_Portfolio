import { SOCIAL_PLATFORMS } from "@portfolio/shared";
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
import { socialLinksApi } from "./api";
import { SocialLinkFormDialog, type SocialLinkFormValues } from "./SocialLinkFormDialog";
import type { SocialLink } from "./types";

type SortKey = "sortOrder" | "label" | "platform";

export function SocialLinksPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const list = socialLinksApi.useList();
  const create = socialLinksApi.useCreate();
  const update = socialLinksApi.useUpdate();
  const links = useMemo(() => list.data ?? [], [list.data]);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [sort, setSort] = useSortState<SortKey>();
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const actions = useListActions(socialLinksApi, links, {
    deleteTitle: t("socialLinks.deleteTitle"),
    deleteDescription: (name) => t("socialLinks.deleteDescription", { name }),
    deleteAction: t("socialLinks.deleteAction"),
    toastDeleted: t("socialLinks.toastDeleted"),
  });

  const hasFilters = search !== "" || platformFilter !== null;
  const canReorder = isManualOrder(sort, hasFilters);
  const visibleLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = links.filter(
      (l) =>
        (!q || `${l.label} ${l.url}`.toLowerCase().includes(q)) &&
        (!platformFilter || l.platform === platformFilter),
    );
    return sortRows(filtered, sort);
  }, [links, search, platformFilter, sort]);
  const sortPlugin = useTableSortable<SocialLink, SortKey>({ sort, onSortChange: setSort });

  const clearFilters = () => {
    setSearch("");
    setPlatformFilter(null);
  };
  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const handleSubmit = async (values: SocialLinkFormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
        toast({ body: t("socialLinks.toastUpdated") });
      } else {
        await create.mutateAsync(values);
        toast({ body: t("socialLinks.toastCreated") });
      }
    } catch (err) {
      actions.fail(err);
      throw err;
    }
  };

  const columns: TableColumn<SocialLink>[] = [
    {
      key: "label",
      header: t("socialLinks.columns.label"),
      width: proportional(2),
      sortable: true,
      renderCell: (l) => (
        <VStack gap={0}>
          <Text weight="medium">{l.label}</Text>
          <Text type="supporting" color="secondary" maxLines={1}>
            {l.url}
          </Text>
        </VStack>
      ),
    },
    {
      key: "platform",
      header: t("socialLinks.columns.platform"),
      width: pixel(140),
      sortable: true,
      renderCell: (l) => enumLabel("platform", l.platform),
    },
    {
      key: "visible",
      header: t("socialLinks.columns.visible"),
      width: pixel(140),
      renderCell: (l) => (
        <StatusLabel
          variant={publishedVariant(l.visible)}
          label={l.visible ? t("common.published") : t("common.hidden")}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      width: pixel(56),
      renderCell: (l) => (
        <MoreMenu
          size="sm"
          label={t("common.actionsFor", { name: l.label })}
          items={[
            {
              label: t("common.edit"),
              icon: PencilSquareIcon,
              onClick: () => {
                setEditing(l);
                setIsFormOpen(true);
              },
            },
            {
              label: l.visible ? t("common.hide") : t("common.publish"),
              icon: l.visible ? EyeSlashIcon : EyeIcon,
              onClick: () => actions.setPublished(l.id, !l.visible, "visible"),
            },
            {
              label: t("common.moveUp"),
              icon: ArrowUpIcon,
              isDisabled: !canReorder || !actions.canMove(l.id, -1),
              onClick: () => actions.move(l.id, -1),
            },
            {
              label: t("common.moveDown"),
              icon: ArrowDownIcon,
              isDisabled: !canReorder || !actions.canMove(l.id, 1),
              onClick: () => actions.move(l.id, 1),
            },
            { type: "divider" },
            {
              label: t("common.delete"),
              icon: TrashIcon,
              variant: "destructive",
              onClick: () => actions.remove(l.id, l.label),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t("socialLinks.title")}
        description={t("socialLinks.description")}
        actions={
          <Button
            label={t("socialLinks.newItem")}
            variant="primary"
            icon={<PlusIcon />}
            onClick={openCreate}
          />
        }
      />
      <DataTable
        data={visibleLinks}
        columns={columns}
        idKey="id"
        plugins={{ sortable: sortPlugin }}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        emptyTitle={hasFilters ? t("socialLinks.emptyMatchTitle") : t("socialLinks.emptyTitle")}
        emptyDescription={
          hasFilters ? t("common.noMatchDescription") : t("socialLinks.emptyDescription")
        }
        emptyActions={
          hasFilters ? (
            <Button label={t("common.clearFilters")} onClick={clearFilters} />
          ) : (
            <Button label={t("socialLinks.newItem")} variant="primary" onClick={openCreate} />
          )
        }
        toolbar={
          <TableToolbar
            label={t("common.filters", { name: t("socialLinks.title") })}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("socialLinks.searchPlaceholder")}
            filters={
              <Selector
                label={t("socialLinks.filterPlatform")}
                isLabelHidden
                size="sm"
                hasClear
                placeholder={t("socialLinks.filterPlatform")}
                options={enumOptions("platform", SOCIAL_PLATFORMS)}
                value={platformFilter}
                onChange={setPlatformFilter}
              />
            }
          />
        }
      />
      <SocialLinkFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        link={editing}
        onSubmit={handleSubmit}
      />
      {actions.confirmElement}
    </Page>
  );
}
