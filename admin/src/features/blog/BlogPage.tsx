import { BLOG_STATUSES } from "@portfolio/shared";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Selector } from "@astryxdesign/core/Selector";
import { pixel, proportional, useTableSortable, type TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DataTable } from "@/components/common/DataTable";
import { StatusLabel } from "@/components/common/StatusLabel";
import { TableToolbar } from "@/components/common/TableToolbar";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { blogEditPath, publicUrl, ROUTES } from "@/config/app";
import { useSections } from "@/features/sections/api";
import { enumLabel, enumOptions } from "@/i18n";
import { formatDate } from "@/lib/format";
import { sortRows, useListActions } from "@/lib/list-actions";
import { blogApi, useSetPublished } from "./api";
import type { BlogPost } from "./types";

type SortKey = "title" | "status" | "readingMinutes" | "updatedAt";

export function BlogPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const list = blogApi.useList();
  const sections = useSections();
  const setPublished = useSetPublished();
  const posts = useMemo(() => list.data ?? [], [list.data]);
  const blogOff = sections.data?.some((s) => s.key === "blog" && !s.enabled) ?? false;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<{ sortKey: SortKey; direction: "ascending" | "descending" }[]>([
    { sortKey: "updatedAt", direction: "descending" },
  ]);
  const actions = useListActions(blogApi, posts, {
    deleteTitle: t("blog.deleteTitle"),
    deleteDescription: (name) => t("blog.deleteDescription", { name }),
    deleteAction: t("blog.deleteAction"),
    toastDeleted: t("blog.toastDeleted"),
  });

  const allTags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags))].sort(), [posts]);
  const hasFilters = search !== "" || statusFilter !== null || tagFilter !== null;
  const visiblePosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      posts.filter(
        (p) =>
          (!q || `${p.title} ${p.excerpt ?? ""} ${p.slug}`.toLowerCase().includes(q)) &&
          (!statusFilter || p.status === statusFilter) &&
          (!tagFilter || p.tags.includes(tagFilter)),
      ),
      sort,
    );
  }, [posts, search, statusFilter, tagFilter, sort]);
  const sortPlugin = useTableSortable<BlogPost, SortKey>({ sort, onSortChange: setSort });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(null);
    setTagFilter(null);
  };
  const togglePublished = (p: BlogPost) =>
    setPublished.mutate(
      { id: p.id, published: p.status !== "published" },
      {
        onSuccess: () =>
          toast({
            body: p.status === "published" ? t("blog.toastUnpublished") : t("blog.toastPublished"),
          }),
        onError: actions.fail,
      },
    );

  const columns: TableColumn<BlogPost>[] = [
    {
      key: "title",
      header: t("blog.columns.title"),
      width: proportional(3),
      sortable: true,
      renderCell: (p) => (
        <VStack gap={0}>
          <HStack gap={2} vAlign="center">
            <Text weight="medium" maxLines={1}>
              {p.title}
            </Text>
            {p.featured && <Badge label="★" variant="warning" />}
          </HStack>
          <Text type="supporting" color="secondary" maxLines={1}>
            /blog/{p.slug}
          </Text>
        </VStack>
      ),
    },
    {
      key: "status",
      header: t("blog.columns.status"),
      width: pixel(130),
      sortable: true,
      renderCell: (p) => (
        <StatusLabel
          variant={p.status === "published" ? "success" : "neutral"}
          label={enumLabel("blogStatus", p.status)}
        />
      ),
    },
    {
      key: "tags",
      header: t("blog.columns.tags"),
      width: proportional(2),
      renderCell: (p) => (
        <HStack gap={1} wrap="wrap">
          {p.tags.map((tag) => (
            <Badge key={tag} label={`#${tag}`} />
          ))}
        </HStack>
      ),
    },
    {
      key: "readingMinutes",
      header: t("blog.columns.reading"),
      width: pixel(90),
      align: "end",
      sortable: true,
      renderCell: (p) => t("blog.minutes", { count: p.readingMinutes }),
    },
    {
      key: "updatedAt",
      header: t("blog.columns.updated"),
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
            ...(p.status === "published"
              ? [
                  {
                    label: t("common.viewOnSite"),
                    icon: ArrowTopRightOnSquareIcon,
                    href: publicUrl(`/blog/${p.slug}`),
                    target: "_blank" as const,
                  },
                ]
              : []),
            {
              label: t("common.edit"),
              icon: PencilSquareIcon,
              onClick: () => navigate(blogEditPath(p.id)),
            },
            {
              label:
                p.status === "published" ? t("blog.editor.unpublish") : t("blog.editor.publish"),
              icon: p.status === "published" ? ArrowUturnLeftIcon : CheckCircleIcon,
              onClick: () => togglePublished(p),
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
        title={t("blog.title")}
        description={t("blog.description")}
        actions={
          <Button
            label={t("blog.newItem")}
            variant="primary"
            icon={<PlusIcon />}
            href={ROUTES.blogNew}
          />
        }
      />
      {blogOff && (
        <Banner
          status="warning"
          title={t("blog.sectionOffTitle")}
          description={t("blog.sectionOffDescription")}
          collapsible={false}
          endContent={
            <Button label={t("blog.sectionOffAction")} size="sm" href={ROUTES.sections} />
          }
        />
      )}
      <DataTable
        data={visiblePosts}
        columns={columns}
        idKey="id"
        plugins={{ sortable: sortPlugin }}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        emptyTitle={hasFilters ? t("blog.emptyMatchTitle") : t("blog.emptyTitle")}
        emptyDescription={hasFilters ? t("common.noMatchDescription") : t("blog.emptyDescription")}
        emptyActions={
          hasFilters ? (
            <Button label={t("common.clearFilters")} onClick={clearFilters} />
          ) : (
            <Button label={t("blog.newItem")} variant="primary" href={ROUTES.blogNew} />
          )
        }
        toolbar={
          <TableToolbar
            label={t("common.filters", { name: t("blog.title") })}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("blog.searchPlaceholder")}
            filters={
              <>
                <Selector
                  label={t("blog.filterStatus")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("blog.filterStatus")}
                  options={enumOptions("blogStatus", BLOG_STATUSES)}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <Selector
                  label={t("blog.filterTag")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("blog.filterTag")}
                  options={allTags.map((tag) => ({ value: tag, label: `#${tag}` }))}
                  value={tagFilter}
                  onChange={setTagFilter}
                />
              </>
            }
          />
        }
      />
      {actions.confirmElement}
    </Page>
  );
}
