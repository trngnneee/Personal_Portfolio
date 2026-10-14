import { SKILL_CATEGORIES, skillSchema, type SkillInput } from "@portfolio/shared";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { enumOptions } from "@/i18n";
import { fieldErrors, orNull, statusFor } from "@/lib/validation";
import type { Skill } from "./types";

export type SkillFormValues = SkillInput;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: Skill | null;
  onSubmit: (values: SkillFormValues) => Promise<void>;
}

function SkillFormDialogBody({ onOpenChange, skill, onSubmit }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(skill?.name ?? "");
  const [category, setCategory] = useState<string>(skill?.category ?? "languages");
  const [iconUrl, setIconUrl] = useState(skill?.iconUrl ?? "");
  const [level, setLevel] = useState<number | null>(skill?.level ?? null);
  const [published, setPublished] = useState(skill?.published ?? true);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const result = skillSchema.safeParse({
    name: name.trim(),
    category,
    iconUrl: orNull(iconUrl),
    level,
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
          title={skill ? t("skills.form.editTitle") : t("skills.form.createTitle")}
          subtitle={skill ? skill.name : t("skills.form.createSubtitle")}
          onOpenChange={onOpenChange}
        />
        <FormLayout>
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("skills.form.name")}
              value={name}
              onChange={setName}
              isRequired
              status={statusFor(showErrors, errors.name)}
            />
            <Selector
              label={t("skills.form.category")}
              options={enumOptions("skillCategory", SKILL_CATEGORIES)}
              value={category}
              onChange={setCategory}
              isRequired
            />
          </Grid>
          <TextInput
            label={t("skills.form.iconUrl")}
            description={t("skills.form.iconUrlDescription")}
            value={iconUrl}
            onChange={setIconUrl}
            isOptional
            status={statusFor(showErrors, errors.iconUrl)}
          />
          <NumberInput
            label={t("skills.form.level")}
            value={level}
            onChange={(v) => setLevel(v ?? null)}
            min={0}
            max={100}
            isIntegerOnly
            hasClear
            isOptional
            units="%"
            status={statusFor(showErrors, errors.level)}
          />
          <Switch
            label={t("skills.form.published")}
            value={published}
            onChange={setPublished}
            labelSpacing="spread"
          />
        </FormLayout>
        <HStack gap={2} hAlign="end">
          <Button label={t("common.cancel")} variant="ghost" onClick={() => onOpenChange(false)} />
          <Button
            label={skill ? t("common.saveChanges") : t("skills.form.submitCreate")}
            variant="primary"
            isLoading={isSaving}
            onClick={() => void handleSubmit()}
          />
        </HStack>
      </VStack>
    </>
  );
}

/** Remounts the form on every open, so fields start from `skill` without a reset effect. */
export function SkillFormDialog(props: Props) {
  return (
    <Dialog isOpen={props.isOpen} onOpenChange={props.onOpenChange} purpose="form" width={480}>
      {props.isOpen && <SkillFormDialogBody key={props.skill?.id ?? "new"} {...props} />}
    </Dialog>
  );
}
