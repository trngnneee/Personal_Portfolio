import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Section } from "@astryxdesign/core/Section";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Table, type TableColumn, type TablePlugin } from "@astryxdesign/core/Table";
import { Button } from "@astryxdesign/core/Button";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface DataTableProps<T extends Record<string, unknown>> {
  /** Already filtered + sorted by the page. */
  data: T[];
  columns: TableColumn<T>[];
  idKey: (keyof T & string) | ((item: T) => string | number);
  toolbar?: ReactNode;
  plugins?: Record<string, TablePlugin<T>>;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActions?: ReactNode;
  density?: "compact" | "balanced" | "spacious";
  /** Loading / error states (new vs. doc: data comes from the API). */
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

/**
 * Toolbar + Table + client-side pagination + empty state.
 * The page owns filtering/sorting; this owns presentation.
 */
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  idKey,
  toolbar,
  plugins,
  pageSize = 10,
  emptyTitle,
  emptyDescription,
  emptyActions,
  density = "balanced",
  isLoading,
  error,
  onRetry,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  // Clamp instead of resetting in an effect when filters shrink the data.
  const safePage = Math.min(page, totalPages);
  const rows = data.slice((safePage - 1) * pageSize, safePage * pageSize);

  let body: ReactNode;
  if (isLoading) {
    body = (
      <Center minHeight={240}>
        <Spinner label={t("common.loading")} />
      </Center>
    );
  } else if (error) {
    body = (
      <Section variant="transparent" paddingBlock={10}>
        <EmptyState
          title={t("common.loadFailed", { message: error.message })}
          actions={onRetry && <Button label={t("common.retry")} onClick={onRetry} />}
        />
      </Section>
    );
  } else if (data.length === 0) {
    body = (
      <Section variant="transparent" paddingBlock={10}>
        <EmptyState
          title={emptyTitle ?? t("common.noResults")}
          description={emptyDescription ?? t("common.noMatchDescription")}
          actions={emptyActions}
        />
      </Section>
    );
  } else {
    body = (
      <>
        <Table
          data={rows}
          columns={columns}
          idKey={idKey}
          plugins={plugins}
          density={density}
          hasHover
        />
        {data.length > pageSize && (
          <Section variant="transparent" paddingBlock={2}>
            <Pagination
              page={safePage}
              onChange={setPage}
              totalItems={data.length}
              pageSize={pageSize}
              variant="count"
              size="sm"
            />
          </Section>
        )}
      </>
    );
  }

  return (
    <Card padding={0}>
      {toolbar}
      {body}
    </Card>
  );
}
