import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { List, ListItem } from "@astryxdesign/core/List";
import { Spinner } from "@astryxdesign/core/Spinner";
import { StackItem } from "@astryxdesign/core/Stack";
import { pixel, proportional, Table, type TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusLabel } from "@/components/common/StatusLabel";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { APP_CONFIG, blogEditPath, ROUTES } from "@/config/app";
import { STATUS_VARIANT } from "@/features/messages/MessagesPage.constants";
import { enumLabel } from "@/i18n";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { useDashboard, type DashboardData } from "./api";

type LatestMessage = DashboardData["latestMessages"][number] & Record<string, unknown>;

// recharts can't take component props; colours come from Astryx tokens (fallbacks are light-mode only).
const SERIES = "var(--color-data-categorical-blue, #0171E3)";
const AXIS = { fill: "var(--color-text-secondary, #56606B)", fontSize: 12 };

export function DashboardPage() {
  const { t } = useTranslation();
  const dashboard = useDashboard();

  if (dashboard.isPending) {
    return (
      <Center height="100%" minHeight={320}>
        <Spinner label={t("common.loadingPage")} />
      </Center>
    );
  }
  if (dashboard.isError) {
    return (
      <Page>
        <EmptyState
          title={t("common.loadFailed", { message: dashboard.error.message })}
          actions={<Button label={t("common.retry")} onClick={() => void dashboard.refetch()} />}
        />
      </Page>
    );
  }

  const { counts, disabledSections, latestMessages, drafts, messagesPerDay } = dashboard.data;
  const chartData = messagesPerDay.map((d) => ({ ...d, label: formatDate(`${d.day}T00:00:00Z`) }));

  const messageColumns: TableColumn<LatestMessage>[] = [
    {
      key: "name",
      header: t("dashboard.columns.from"),
      width: proportional(2),
      renderCell: (m) => (
        <VStack gap={0}>
          <Text weight="medium">{m.name}</Text>
          <Text type="supporting" color="secondary" maxLines={1}>
            {m.subject}
          </Text>
        </VStack>
      ),
    },
    {
      key: "status",
      header: t("dashboard.columns.status"),
      width: pixel(110),
      renderCell: (m) => (
        <StatusLabel
          variant={STATUS_VARIANT[m.status]}
          label={enumLabel("messageStatus", m.status)}
        />
      ),
    },
    {
      key: "createdAt",
      header: t("dashboard.columns.date"),
      width: pixel(170),
      renderCell: (m) => formatDateTime(m.createdAt),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        actions={
          APP_CONFIG.publicSiteUrl ? (
            <Button
              label={t("common.viewSite")}
              icon={<ArrowTopRightOnSquareIcon />}
              href={APP_CONFIG.publicSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          ) : undefined
        }
      />
      <Grid gap={4} columns={{ minWidth: 220, repeat: "fit" }}>
        <StatCard label={t("dashboard.stats.projects")} value={formatNumber(counts.projects)} />
        <StatCard
          label={t("dashboard.stats.posts")}
          value={formatNumber(counts.blogPosts)}
          hint={t("dashboard.draftsHint", { count: counts.blogDrafts })}
        />
        <StatCard
          label={t("dashboard.stats.newMessages")}
          value={formatNumber(counts.messagesNew)}
        />
        <StatCard
          label={t("dashboard.stats.disabledSections")}
          value={formatNumber(disabledSections.length)}
          hint={disabledSections.map((k) => enumLabel("section", k)).join(", ") || undefined}
        />
      </Grid>
      <ChartCard
        title={t("dashboard.messagesChart")}
        description={t("dashboard.messagesChartDescription")}
        height={260}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border-default, #E5E8EB)"
            />
            <XAxis
              dataKey="label"
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "var(--color-background-muted, #F3F4F6)" }}
              contentStyle={{
                background: "var(--color-background-popover, #fff)",
                border: "1px solid var(--color-border-default, #E5E8EB)",
                borderRadius: "var(--radius-md, 8px)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" name={t("nav.messages")} fill={SERIES} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <Grid gap={4} columns={{ minWidth: 360, repeat: "fit" }}>
        <Card padding={4}>
          <VStack gap={4}>
            <HStack gap={4} vAlign="center">
              <StackItem size="fill">
                <Heading level={4}>{t("dashboard.latestMessages")}</Heading>
              </StackItem>
              <Button
                label={t("dashboard.viewAll")}
                variant="ghost"
                size="sm"
                href={ROUTES.messages}
              />
            </HStack>
            {latestMessages.length === 0 ? (
              <EmptyState isCompact title={t("dashboard.noMessages")} />
            ) : (
              <Table
                data={latestMessages as LatestMessage[]}
                columns={messageColumns}
                idKey="id"
                density="compact"
                hasHover
              />
            )}
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={4}>
            <HStack gap={4} vAlign="center">
              <StackItem size="fill">
                <Heading level={4}>{t("dashboard.drafts")}</Heading>
              </StackItem>
              <Button label={t("dashboard.viewAll")} variant="ghost" size="sm" href={ROUTES.blog} />
            </HStack>
            {drafts.length === 0 ? (
              <EmptyState isCompact title={t("dashboard.noDrafts")} />
            ) : (
              <List density="compact" hasDividers>
                {drafts.map((d) => (
                  <ListItem
                    key={d.id}
                    label={d.title}
                    description={formatDate(d.updatedAt)}
                    href={blogEditPath(d.id)}
                  />
                ))}
              </List>
            )}
          </VStack>
        </Card>
      </Grid>
    </Page>
  );
}
