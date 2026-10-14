import { useImperativeAlertDialog } from "@astryxdesign/core/AlertDialog";
import { useToast } from "@astryxdesign/core/Toast";
import type { TableSortState } from "@astryxdesign/core/Table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "./api";
import { moveId, type createResourceApi } from "./resource";

type ResourceApi<T extends { id: number }, I> = ReturnType<typeof createResourceApi<T, I>>;

interface Copy {
  deleteTitle: string;
  deleteDescription: (name: string) => string;
  deleteAction: string;
  toastDeleted: string;
}

/**
 * Shared row actions for ordered content lists: move up/down, publish toggle, delete
 * (always through the imperative alert dialog), each with a toast.
 */
export function useListActions<T extends { id: number }, I>(
  api: ResourceApi<T, I>,
  items: T[],
  copy: Copy,
) {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useImperativeAlertDialog();
  const reorder = api.useReorder();
  const update = api.useUpdate();
  const remove = api.useDelete();

  const fail = (err: unknown) =>
    toast({
      body: t("common.saveFailed", {
        message: err instanceof ApiError ? err.message : String(err),
      }),
      type: "error",
    });

  return {
    confirmElement: confirm.element,
    canMove: (id: number, delta: -1 | 1) =>
      moveId(
        ordered(items).map((i) => i.id),
        id,
        delta,
      ) !== null,
    move(id: number, delta: -1 | 1) {
      const next = moveId(
        ordered(items).map((i) => i.id),
        id,
        delta,
      );
      if (!next) return;
      reorder.mutate(next, {
        onSuccess: () => toast({ body: t("common.toastReordered") }),
        onError: fail,
      });
    },
    setPublished(id: number, published: boolean, field = "published") {
      update.mutate(
        { id, input: { [field]: published } as Partial<I> },
        {
          onSuccess: () =>
            toast({ body: published ? t("common.toastPublished") : t("common.toastHidden") }),
          onError: fail,
        },
      );
    },
    remove(id: number, name: string) {
      confirm.show({
        title: copy.deleteTitle,
        description: copy.deleteDescription(name),
        actionLabel: copy.deleteAction,
        onAction: () => {
          confirm.hide();
          remove.mutate(id, { onSuccess: () => toast({ body: copy.toastDeleted }), onError: fail });
        },
      });
    },
    fail,
  };
}

const ordered = <T extends { id: number }>(items: T[]) =>
  [...items].sort(
    (a, b) =>
      Number((a as Record<string, unknown>).sortOrder ?? 0) -
      Number((b as Record<string, unknown>).sortOrder ?? 0),
  );

/** Sort rows by the current table sort (first key only), copying the array. */
export function sortRows<T extends Record<string, unknown>, K extends string>(
  rows: T[],
  sort: TableSortState<K>,
): T[] {
  const first = sort[0];
  if (!first) return rows;
  const factor = first.direction === "ascending" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[first.sortKey];
    const bv = b[first.sortKey];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
    return String(av ?? "").localeCompare(String(bv ?? "")) * factor;
  });
}

/** Manual reordering only makes sense on the unfiltered list sorted by display order. */
export const isManualOrder = <K extends string>(sort: TableSortState<K>, hasFilters: boolean) =>
  !hasFilters && sort[0]?.sortKey === "sortOrder" && sort[0].direction === "ascending";

export function useSortState<K extends string>(initial: K = "sortOrder" as K) {
  return useState<TableSortState<K>>([{ sortKey: initial, direction: "ascending" }]);
}
