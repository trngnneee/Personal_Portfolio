import { EMPLOYMENT_TYPES, experienceSchema, type ExperienceInput } from "@portfolio/shared";
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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { MediaPicker, type MediaRef } from "@/components/common/MediaPicker";
import { TagsInput } from "@/components/common/TagsInput";
import { enumOptions } from "@/i18n";
import { fieldErrors, lines, orNull, statusFor } from "@/lib/validation";
import type { Experience } from "./types";
import { DialogFrame } from "@/components/common/DialogFrame";

export type ExperienceFormValues = ExperienceInput;

const toIso = (d: string | null | undefined) => (d ? (d.length === 7 ? `${d}-01` : d) : undefined);

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience | null;
  onSubmit: (values: ExperienceFormValues) => Promise<void>;
}

function ExperienceFormDialogBody({ onOpenChange, experience, onSubmit }: Props) {
  const { t } = useTranslation();
  const [company, setCompany] = useState(experience?.company ?? "");
  const [companyUrl, setCompanyUrl] = useState(experience?.companyUrl ?? "");
  const [position, setPosition] = useState(experience?.position ?? "");
  const [employmentType, setEmploymentType] = useState<string>(
    experience?.employmentType ?? "full_time",
  );
  const [location, setLocation] = useState(experience?.location ?? "");
  const [startDate, setStartDate] = useState<string | undefined>(toIso(experience?.startDate));
  const [endDate, setEndDate] = useState<string | undefined>(toIso(experience?.endDate));
  const [description, setDescription] = useState(experience?.description ?? "");
  const [highlights, setHighlights] = useState(experience?.highlights.join("\n") ?? "");
  const [techStack, setTechStack] = useState<string[]>(experience?.techStack ?? []);
  const [logo, setLogo] = useState<MediaRef | null>(experience?.logo ?? null);
  const [published, setPublished] = useState(experience?.published ?? true);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const result = experienceSchema.safeParse({
    company: company.trim(),
    companyUrl: orNull(companyUrl),
    position: position.trim(),
    employmentType,
    location: orNull(location),
    startDate: startDate ?? "",
    endDate: endDate ?? null,
    description,
    highlights: lines(highlights),
    techStack,
    logoMediaId: logo?.id ?? null,
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
            title={experience ? t("experiences.form.editTitle") : t("experiences.form.createTitle")}
            subtitle={
              experience
                ? `${experience.position} @ ${experience.company}`
                : t("experiences.form.createSubtitle")
            }
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
              label={experience ? t("common.saveChanges") : t("experiences.form.submitCreate")}
              variant="primary"
              isLoading={isSaving}
              onClick={() => void handleSubmit()}
            />
          </HStack>
        }
      >
        <FormLayout>
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("experiences.form.position")}
              value={position}
              onChange={setPosition}
              isRequired
              status={statusFor(showErrors, errors.position)}
            />
            <TextInput
              label={t("experiences.form.company")}
              value={company}
              onChange={setCompany}
              isRequired
              status={statusFor(showErrors, errors.company)}
            />
          </Grid>
          <Grid gap={4} columns={2}>
            <Selector
              label={t("experiences.form.employmentType")}
              options={enumOptions("employmentType", EMPLOYMENT_TYPES)}
              value={employmentType}
              onChange={setEmploymentType}
              isRequired
            />
            <TextInput
              label={t("experiences.form.location")}
              value={location}
              onChange={setLocation}
              isOptional
            />
          </Grid>
          <TextInput
            label={t("experiences.form.companyUrl")}
            value={companyUrl}
            onChange={setCompanyUrl}
            isOptional
            status={statusFor(showErrors, errors.companyUrl)}
          />
          <Grid gap={4} columns={2}>
            <DateInput
              label={t("experiences.form.startDate")}
              value={startDate as never}
              onChange={(v) => setStartDate(v)}
              isRequired
              status={statusFor(showErrors, errors.startDate)}
            />
            <DateInput
              label={t("experiences.form.endDate")}
              description={t("experiences.form.endDateDescription")}
              value={endDate as never}
              onChange={(v) => setEndDate(v)}
              hasClear
              isOptional
            />
          </Grid>
          <TagsInput
            label={t("experiences.form.techStack")}
            description={t("common.commaSeparated")}
            value={techStack}
            onChange={setTechStack}
            isOptional
          />
          <TextArea
            label={t("experiences.form.highlights")}
            description={t("common.oneItemPerLine")}
            value={highlights}
            onChange={setHighlights}
            rows={4}
            isOptional
          />
          <MarkdownEditor
            label={t("experiences.form.description")}
            value={description}
            onChange={setDescription}
            rows={8}
            folder="experiences"
          />
          <MediaPicker
            label={t("experiences.form.logo")}
            value={logo}
            onChange={setLogo}
            folder="experiences"
            isOptional
          />
          <Switch
            label={t("experiences.form.published")}
            value={published}
            onChange={setPublished}
            labelSpacing="spread"
          />
        </FormLayout>
      </DialogFrame>
    </>
  );
}

/** Remounts the form on every open, so fields start from `experience` without a reset effect. */
export function ExperienceFormDialog(props: Props) {
  return (
    <Dialog
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      purpose="form"
      width={720}
      maxHeight="90dvh"
    >
      {props.isOpen && <ExperienceFormDialogBody key={props.experience?.id ?? "new"} {...props} />}
    </Dialog>
  );
}
