import { LOCKED_SECTIONS, SECTION_ROUTES, sectionPatchSchema } from "@portfolio/shared";
import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack } from "@astryxdesign/core/HStack";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Switch } from "@astryxdesign/core/Switch";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "@/components/common/SettingsSection";
import { StatusLabel } from "@/components/common/StatusLabel";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { enumLabel } from "@/i18n";
import { ApiError } from "@/lib/api";
import { fieldErrors, statusFor } from "@/lib/validation";
import { usePatchSection, useReorderSections, useSections, type SiteSection } from "./api";

export function SectionsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const sections = useSections();
  const reorder = useReorderSections();

  const move = (index: number, delta: -1 | 1) => {
    const keys = (sections.data ?? []).map((s) => s.key);
    const target = index + delta;
    if (target < 0 || target >= keys.length) return;
    [keys[index], keys[target]] = [keys[target]!, keys[index]!];
    reorder.mutate(keys, {
      onSuccess: () => toast({ body: t("common.toastReordered") }),
      onError: (err) =>
        toast({ body: t("common.saveFailed", { message: err.message }), type: "error" }),
    });
  };

  return (
    <Page width="narrow">
      <PageHeader title={t("sectionsPage.title")} description={t("sectionsPage.description")} />
      {sections.isPending ? (
        <Center minHeight={320}>
          <Spinner label={t("common.loading")} />
        </Center>
      ) : sections.isError ? (
        <EmptyState
          title={t("common.loadFailed", { message: sections.error.message })}
          actions={<Button label={t("common.retry")} onClick={() => void sections.refetch()} />}
        />
      ) : (
        <VStack gap={6}>
          {sections.data.map((s, i) => (
            <Fragment key={s.key}>
              {i > 0 && <Divider />}
              <SectionForm
                section={s}
                isFirst={i === 0}
                isLast={i === sections.data.length - 1}
                onMove={(delta) => move(i, delta)}
                isReordering={reorder.isPending}
              />
            </Fragment>
          ))}
        </VStack>
      )}
    </Page>
  );
}

function SectionForm({
  section,
  isFirst,
  isLast,
  onMove,
  isReordering,
}: {
  section: SiteSection;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
  isReordering: boolean;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const patch = usePatchSection();
  const [enabled, setEnabled] = useState(section.enabled);
  const [navLabel, setNavLabel] = useState(section.navLabel);
  const [heading, setHeading] = useState(section.heading);
  const [subheading, setSubheading] = useState(section.subheading);
  const [showErrors, setShowErrors] = useState(false);
  const isLocked = LOCKED_SECTIONS.includes(section.key);
  const name = enumLabel("section", section.key);

  const values = {
    enabled,
    navLabel: navLabel.trim(),
    heading: heading.trim(),
    subheading: subheading.trim(),
  };
  const result = sectionPatchSchema.safeParse(values);
  const errors = fieldErrors(result, t);
  const isDirty =
    enabled !== section.enabled ||
    values.navLabel !== section.navLabel ||
    values.heading !== section.heading ||
    values.subheading !== section.subheading;

  const handleSave = () => {
    if (!result.success) {
      setShowErrors(true);
      return;
    }
    patch.mutate(
      { sectionKey: section.key, input: result.data },
      {
        onSuccess: () => toast({ body: t("sectionsPage.toastSaved", { name }) }),
        onError: (err) =>
          toast({
            body: t("common.saveFailed", {
              message: err instanceof ApiError ? err.message : String(err),
            }),
            type: "error",
          }),
      },
    );
  };

  return (
    <SettingsSection
      title={name}
      description={t("sectionsPage.route", { route: SECTION_ROUTES[section.key] })}
      endContent={
        <VStack gap={2}>
          <StatusLabel
            variant={section.enabled ? "success" : "neutral"}
            label={section.enabled ? t("common.published") : t("common.hidden")}
          />
          <HStack gap={1}>
            <IconButton
              label={t("common.moveUp")}
              tooltip={t("common.moveUp")}
              size="sm"
              variant="ghost"
              icon={<ArrowUpIcon />}
              isDisabled={isFirst || isReordering}
              onClick={() => onMove(-1)}
            />
            <IconButton
              label={t("common.moveDown")}
              tooltip={t("common.moveDown")}
              size="sm"
              variant="ghost"
              icon={<ArrowDownIcon />}
              isDisabled={isLast || isReordering}
              onClick={() => onMove(1)}
            />
          </HStack>
        </VStack>
      }
    >
      <FormLayout>
        <Switch
          label={t("sectionsPage.enabled")}
          description={t("sectionsPage.enabledDescription")}
          value={enabled}
          onChange={setEnabled}
          isDisabled={isLocked}
          disabledMessage={isLocked ? t("sectionsPage.locked") : undefined}
          labelSpacing="spread"
        />
        <TextInput
          label={t("sectionsPage.navLabel")}
          value={navLabel}
          onChange={setNavLabel}
          isRequired
          status={statusFor(showErrors, errors.navLabel)}
        />
        <TextInput
          label={t("sectionsPage.heading")}
          value={heading}
          onChange={setHeading}
          isRequired
          status={statusFor(showErrors, errors.heading)}
        />
        <TextInput
          label={t("sectionsPage.subheading")}
          value={subheading}
          onChange={setSubheading}
          isOptional
          status={statusFor(showErrors, errors.subheading)}
        />
        <HStack gap={2}>
          <Button
            label={t("common.save")}
            variant="primary"
            isLoading={patch.isPending}
            isDisabled={!isDirty}
            onClick={handleSave}
          />
        </HStack>
      </FormLayout>
    </SettingsSection>
  );
}
