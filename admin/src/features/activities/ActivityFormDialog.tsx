import { activitySchema, type ActivityInput } from "@portfolio/shared";
import { Button } from "@astryxdesign/core/Button";
import { DateInput } from "@astryxdesign/core/DateInput";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Switch } from "@astryxdesign/core/Switch";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { fieldErrors, orNull, statusFor } from "@/lib/validation";
import type { Activity } from "./types";
import { DialogFrame } from "@/components/common/DialogFrame";

export type ActivityFormValues = ActivityInput;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  onSubmit: (values: ActivityFormValues) => Promise<void>;
}

function ActivityFormDialogBody({ onOpenChange, activity, onSubmit }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(activity?.title ?? "");
  const [organization, setOrganization] = useState(activity?.organization ?? "");
  const [location, setLocation] = useState(activity?.location ?? "");
  const [role, setRole] = useState(activity?.role ?? "");
  const [periodLabel, setPeriodLabel] = useState(activity?.periodLabel ?? "");
  const [date, setDate] = useState<string | undefined>(
    activity?.date
      ? activity.date.length === 7
        ? `${activity.date}-01`
        : activity.date
      : undefined,
  );
  const [description, setDescription] = useState(activity?.description ?? "");
  const [published, setPublished] = useState(activity?.published ?? true);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const result = activitySchema.safeParse({
    title: title.trim(),
    organization: orNull(organization),
    location: orNull(location),
    role: orNull(role),
    periodLabel: orNull(periodLabel),
    date: date ?? null,
    description: orNull(description),
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
      <DialogFrame
        header={
          <DialogHeader
            title={activity ? t("activities.form.editTitle") : t("activities.form.createTitle")}
            subtitle={activity ? activity.title : t("activities.form.createSubtitle")}
            onOpenChange={onOpenChange}
          />
        }
        footer={
          <HStack gap={2} hAlign="end">
            <Button
              label={t("common.cancel")}
              variant="ghost"
              onClick={() => onOpenChange(false)}
            />
            <Button
              label={activity ? t("common.saveChanges") : t("activities.form.submitCreate")}
              variant="primary"
              isLoading={isSaving}
              onClick={() => void handleSubmit()}
            />
          </HStack>
        }
      >
        <FormLayout>
          <TextInput
            label={t("activities.form.title")}
            value={title}
            onChange={setTitle}
            isRequired
            status={statusFor(showErrors, errors.title)}
          />
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("activities.form.organization")}
              value={organization}
              onChange={setOrganization}
              isOptional
            />
            <TextInput
              label={t("activities.form.location")}
              value={location}
              onChange={setLocation}
              isOptional
            />
          </Grid>
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("activities.form.role")}
              value={role}
              onChange={setRole}
              isOptional
            />
            <TextInput
              label={t("activities.form.periodLabel")}
              value={periodLabel}
              onChange={setPeriodLabel}
              isOptional
            />
          </Grid>
          <DateInput
            label={t("activities.form.date")}
            value={date as never}
            onChange={(v) => setDate(v)}
            hasClear
            isOptional
          />
          <TextArea
            label={t("activities.form.description")}
            value={description}
            onChange={setDescription}
            rows={4}
            isOptional
            status={statusFor(showErrors, errors.description)}
          />
          <Switch
            label={t("activities.form.published")}
            value={published}
            onChange={setPublished}
            labelSpacing="spread"
          />
        </FormLayout>
      </DialogFrame>
    </>
  );
}

/** Remounts the form on every open, so fields start from `activity` without a reset effect. */
export function ActivityFormDialog(props: Props) {
  return (
    <Dialog isOpen={props.isOpen} onOpenChange={props.onOpenChange} purpose="form" width={480}>
      {props.isOpen && <ActivityFormDialogBody key={props.activity?.id ?? "new"} {...props} />}
    </Dialog>
  );
}
