import { ACHIEVEMENT_TYPES, achievementSchema, type AchievementInput } from "@portfolio/shared";
import { Button } from "@astryxdesign/core/Button";
import { DateInput } from "@astryxdesign/core/DateInput";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MediaPicker, type MediaRef } from "@/components/common/MediaPicker";
import { enumOptions } from "@/i18n";
import { fieldErrors, orNull, statusFor } from "@/lib/validation";
import type { Achievement } from "./types";

export type AchievementFormValues = AchievementInput;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  achievement?: Achievement | null;
  onSubmit: (values: AchievementFormValues) => Promise<void>;
}

function AchievementFormDialogBody({ onOpenChange, achievement, onSubmit }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<string>(achievement?.type ?? "certification");
  const [title, setTitle] = useState(achievement?.title ?? "");
  const [issuer, setIssuer] = useState(achievement?.issuer ?? "");
  const [periodLabel, setPeriodLabel] = useState(achievement?.periodLabel ?? "");
  const [date, setDate] = useState<string | undefined>(
    achievement?.date
      ? achievement.date.length === 7
        ? `${achievement.date}-01`
        : achievement.date
      : undefined,
  );
  const [description, setDescription] = useState(achievement?.description ?? "");
  const [accentColor, setAccentColor] = useState(achievement?.accentColor ?? "");
  const [credentialUrl, setCredentialUrl] = useState(achievement?.credentialUrl ?? "");
  const [media, setMedia] = useState<MediaRef | null>(achievement?.media ?? null);
  const [published, setPublished] = useState(achievement?.published ?? true);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const result = achievementSchema.safeParse({
    type,
    title: title.trim(),
    issuer: orNull(issuer),
    periodLabel: orNull(periodLabel),
    date: date ?? null,
    description: orNull(description),
    accentColor: orNull(accentColor),
    credentialUrl: orNull(credentialUrl),
    mediaId: media?.id ?? null,
    published,
  });
  const errors = fieldErrors(result, t);

  const handleSubmit = async () => {
    if (!result.success) {
      setShowErrors(true);
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit(result.data);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <VStack gap={4}>
        <DialogHeader
          title={
            achievement ? t("achievements.form.editTitle") : t("achievements.form.createTitle")
          }
          subtitle={achievement ? achievement.title : t("achievements.form.createSubtitle")}
          onOpenChange={onOpenChange}
        />
        <FormLayout>
          <Selector
            label={t("achievements.form.type")}
            options={enumOptions("achievementType", ACHIEVEMENT_TYPES)}
            value={type}
            onChange={setType}
            isRequired
          />
          <TextInput
            label={t("achievements.form.title")}
            value={title}
            onChange={setTitle}
            isRequired
            status={statusFor(showErrors, errors.title)}
          />
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("achievements.form.issuer")}
              value={issuer}
              onChange={setIssuer}
              isOptional
            />
            <TextInput
              label={t("achievements.form.periodLabel")}
              description={t("achievements.form.periodLabelDescription")}
              value={periodLabel}
              onChange={setPeriodLabel}
              isOptional
              status={statusFor(showErrors, errors.periodLabel)}
            />
          </Grid>
          <Grid gap={4} columns={2}>
            <DateInput
              label={t("achievements.form.date")}
              value={date as never}
              onChange={(v) => setDate(v)}
              hasClear
              isOptional
            />
            <TextInput
              label={t("achievements.form.accentColor")}
              description={t("achievements.form.accentColorDescription")}
              value={accentColor}
              onChange={setAccentColor}
              placeholder="#FF9900"
              isOptional
              status={statusFor(showErrors, errors.accentColor)}
            />
          </Grid>
          <TextArea
            label={t("achievements.form.description")}
            value={description}
            onChange={setDescription}
            rows={3}
            isOptional
            status={statusFor(showErrors, errors.description)}
          />
          <TextInput
            label={t("achievements.form.credentialUrl")}
            value={credentialUrl}
            onChange={setCredentialUrl}
            isOptional
            status={statusFor(showErrors, errors.credentialUrl)}
          />
          <MediaPicker
            label={t("achievements.form.image")}
            value={media}
            onChange={setMedia}
            folder="achievements"
            isOptional
          />
          <Switch
            label={t("achievements.form.published")}
            value={published}
            onChange={setPublished}
            labelSpacing="spread"
          />
        </FormLayout>
        <HStack gap={2} hAlign="end">
          <Button label={t("common.cancel")} variant="ghost" onClick={() => onOpenChange(false)} />
          <Button
            label={achievement ? t("common.saveChanges") : t("achievements.form.submitCreate")}
            variant="primary"
            isLoading={isSaving}
            onClick={() => void handleSubmit()}
          />
        </HStack>
      </VStack>
    </>
  );
}

/** Remounts the form on every open, so fields start from `achievement` without a reset effect. */
export function AchievementFormDialog(props: Props) {
  return (
    <Dialog
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      purpose="form"
      width={560}
      maxHeight="90dvh"
    >
      {props.isOpen && (
        <AchievementFormDialogBody key={props.achievement?.id ?? "new"} {...props} />
      )}
    </Dialog>
  );
}
