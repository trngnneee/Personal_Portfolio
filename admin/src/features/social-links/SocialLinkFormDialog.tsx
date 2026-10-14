import { SOCIAL_PLATFORMS, socialLinkSchema, type SocialLinkInput } from "@portfolio/shared";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { enumOptions } from "@/i18n";
import { fieldErrors, statusFor } from "@/lib/validation";
import type { SocialLink } from "./types";
import { DialogFrame } from "@/components/common/DialogFrame";

export type SocialLinkFormValues = SocialLinkInput;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  link?: SocialLink | null;
  onSubmit: (values: SocialLinkFormValues) => Promise<void>;
}

function SocialLinkFormDialogBody({ onOpenChange, link, onSubmit }: Props) {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<string>(link?.platform ?? "github");
  const [label, setLabel] = useState(link?.label ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [visible, setVisible] = useState(link?.visible ?? true);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const values = { platform, label: label.trim(), url: url.trim(), visible };
  const result = socialLinkSchema.safeParse(values);
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
            title={link ? t("socialLinks.form.editTitle") : t("socialLinks.form.createTitle")}
            subtitle={link ? link.label : t("socialLinks.form.createSubtitle")}
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
              label={link ? t("common.saveChanges") : t("socialLinks.form.submitCreate")}
              variant="primary"
              isLoading={isSaving}
              onClick={() => void handleSubmit()}
            />
          </HStack>
        }
      >
        <FormLayout>
          <Selector
            label={t("socialLinks.form.platform")}
            options={enumOptions("platform", SOCIAL_PLATFORMS)}
            value={platform}
            onChange={setPlatform}
            isRequired
            status={statusFor(showErrors, errors.platform)}
          />
          <TextInput
            label={t("socialLinks.form.label")}
            value={label}
            onChange={setLabel}
            isRequired
            status={statusFor(showErrors, errors.label)}
          />
          <TextInput
            label={t("socialLinks.form.url")}
            placeholder={t("socialLinks.form.urlPlaceholder")}
            value={url}
            onChange={setUrl}
            isRequired
            status={statusFor(showErrors, errors.url)}
          />
          <Switch
            label={t("socialLinks.form.visible")}
            value={visible}
            onChange={setVisible}
            labelSpacing="spread"
          />
        </FormLayout>
      </DialogFrame>
    </>
  );
}

/** Remounts the form on every open, so fields start from `link` without a reset effect. */
export function SocialLinkFormDialog(props: Props) {
  return (
    <Dialog isOpen={props.isOpen} onOpenChange={props.onOpenChange} purpose="form" width={440}>
      {props.isOpen && <SocialLinkFormDialogBody key={props.link?.id ?? "new"} {...props} />}
    </Dialog>
  );
}
