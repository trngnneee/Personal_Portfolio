import { CONTACT_SERVICES, MESSAGE_STATUSES, type MessageStatus } from "@portfolio/shared";
import { useImperativeAlertDialog } from "@astryxdesign/core/AlertDialog";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Selector } from "@astryxdesign/core/Selector";
import { pixel, proportional, useTableSortable, type TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import { Button } from "@astryxdesign/core/Button";
import {
  ArchiveBoxIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/common/DataTable";
import { StatusLabel } from "@/components/common/StatusLabel";
import { TableToolbar } from "@/components/common/TableToolbar";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { enumLabel, enumOptions } from "@/i18n";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { sortRows } from "@/lib/list-actions";
import { useDeleteMessage, useMessages, useSetMessageStatus } from "./api";
import { MessageDialog } from "./MessageDialog";
import { STATUS_VARIANT } from "./MessagesPage.constants";
import type { Message } from "./types";

type SortKey = "name" | "subject" | "status" | "createdAt";

export function MessagesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useImperativeAlertDialog();
  const list = useMessages();
  const setStatus = useSetMessageStatus();
  const remove = useDeleteMessage();
  const messages = useMemo(() => list.data ?? [], [list.data]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<{ sortKey: SortKey; direction: "ascending" | "descending" }[]>([
    { sortKey: "createdAt", direction: "descending" },
  ]);
  const [openId, setOpenId] = useState<number | null>(null);
  const open = messages.find((m) => m.id === openId) ?? null;

  const hasFilters = search !== "" || statusFilter !== null || serviceFilter !== null;
  const visibleMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      messages.filter(
        (m) =>
          (!q || `${m.name} ${m.email} ${m.subject}`.toLowerCase().includes(q)) &&
          (!statusFilter || m.status === statusFilter) &&
          (!serviceFilter || m.service === serviceFilter),
      ),
      sort,
    );
  }, [messages, search, statusFilter, serviceFilter, sort]);
  const sortPlugin = useTableSortable<Message, SortKey>({ sort, onSortChange: setSort });

  const fail = (err: unknown) =>
    toast({
      body: t("common.saveFailed", {
        message: err instanceof ApiError ? err.message : String(err),
      }),
      type: "error",
    });
  const changeStatus = (m: Message, status: MessageStatus, silent = false) =>
    setStatus.mutate(
      { id: m.id, status },
      { onSuccess: () => !silent && toast({ body: t("messages.toastUpdated") }), onError: fail },
    );

  const openMessage = (m: Message) => {
    setOpenId(m.id);
    if (m.status === "new") changeStatus(m, "read", true);
  };
  const handleDelete = (m: Message) =>
    confirm.show({
      title: t("messages.deleteTitle"),
      description: t("messages.deleteDescription", { name: m.name }),
      actionLabel: t("messages.deleteAction"),
      onAction: () => {
        confirm.hide();
        setOpenId(null);
        remove.mutate(m.id, {
          onSuccess: () => toast({ body: t("messages.toastDeleted") }),
          onError: fail,
        });
      },
    });
  const clearFilters = () => {
    setSearch("");
    setStatusFilter(null);
    setServiceFilter(null);
  };

  const columns: TableColumn<Message>[] = [
    {
      key: "name",
      header: t("messages.columns.from"),
      width: proportional(2),
      sortable: true,
      renderCell: (m) => (
        <VStack gap={0}>
          <Text weight={m.status === "new" ? "bold" : "medium"}>{m.name}</Text>
          <Text type="supporting" color="secondary" maxLines={1}>
            {m.email}
          </Text>
        </VStack>
      ),
    },
    {
      key: "subject",
      header: t("messages.columns.subject"),
      width: proportional(3),
      sortable: true,
      renderCell: (m) => (
        <VStack gap={0}>
          <Text weight={m.status === "new" ? "bold" : "normal"} maxLines={1}>
            {m.subject}
          </Text>
          <Text type="supporting" color="secondary" maxLines={1}>
            {m.message}
          </Text>
        </VStack>
      ),
    },
    {
      key: "service",
      header: t("messages.columns.service"),
      width: pixel(170),
      renderCell: (m) => enumLabel("contactService", m.service),
    },
    {
      key: "status",
      header: t("messages.columns.status"),
      width: pixel(120),
      sortable: true,
      renderCell: (m) => (
        <StatusLabel
          variant={STATUS_VARIANT[m.status]}
          label={enumLabel("messageStatus", m.status)}
          isPulsing={m.status === "new"}
        />
      ),
    },
    {
      key: "createdAt",
      header: t("messages.columns.received"),
      width: pixel(170),
      sortable: true,
      renderCell: (m) => formatDateTime(m.createdAt),
    },
    {
      key: "actions",
      header: "",
      width: pixel(56),
      renderCell: (m) => (
        <MoreMenu
          size="sm"
          label={t("common.actionsFor", { name: m.name })}
          items={[
            { label: t("common.view"), icon: EyeIcon, onClick: () => openMessage(m) },
            m.status === "new"
              ? {
                  label: t("messages.markRead"),
                  icon: EnvelopeOpenIcon,
                  onClick: () => changeStatus(m, "read"),
                }
              : {
                  label: t("messages.markNew"),
                  icon: EnvelopeIcon,
                  onClick: () => changeStatus(m, "new"),
                },
            {
              label: t("messages.archive"),
              icon: ArchiveBoxIcon,
              isDisabled: m.status === "archived",
              onClick: () => changeStatus(m, "archived"),
            },
            { type: "divider" },
            {
              label: t("common.delete"),
              icon: TrashIcon,
              variant: "destructive",
              onClick: () => handleDelete(m),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Page>
      <PageHeader title={t("messages.title")} description={t("messages.description")} />
      <DataTable
        data={visibleMessages}
        columns={columns}
        idKey="id"
        plugins={{ sortable: sortPlugin }}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        emptyTitle={hasFilters ? t("messages.emptyMatchTitle") : t("messages.emptyTitle")}
        emptyDescription={
          hasFilters ? t("common.noMatchDescription") : t("messages.emptyDescription")
        }
        emptyActions={
          hasFilters ? (
            <Button label={t("common.clearFilters")} onClick={clearFilters} />
          ) : undefined
        }
        toolbar={
          <TableToolbar
            label={t("common.filters", { name: t("messages.title") })}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("messages.searchPlaceholder")}
            filters={
              <>
                <Selector
                  label={t("messages.filterStatus")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("messages.filterStatus")}
                  options={enumOptions("messageStatus", MESSAGE_STATUSES)}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <Selector
                  label={t("messages.filterService")}
                  isLabelHidden
                  size="sm"
                  hasClear
                  placeholder={t("messages.filterService")}
                  options={enumOptions("contactService", CONTACT_SERVICES)}
                  value={serviceFilter}
                  onChange={setServiceFilter}
                />
              </>
            }
          />
        }
      />
      <MessageDialog
        message={open}
        onOpenChange={(o) => !o && setOpenId(null)}
        onArchive={(m) => changeStatus(m, "archived")}
      />
      {confirm.element}
    </Page>
  );
}
