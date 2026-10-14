import { Button } from "@astryxdesign/core/Button";
import { FileInput } from "@astryxdesign/core/FileInput";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/lib/api";
import { useUploadMedia } from "./api";
import { MEDIA_FOLDERS, type MediaItem } from "./types";

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/avif",
  pdf: "application/pdf",
  any: "image/jpeg,image/png,image/webp,image/avif,application/pdf",
};
const MAX = 10 * 1024 * 1024;

/** Upload a file to the media library. Used by MediaPage and MediaPicker. */
export function UploadForm({
  accept = "any",
  defaultFolder = "library",
  onUploaded,
  onCancel,
}: {
  accept?: keyof typeof ACCEPT;
  defaultFolder?: string;
  onUploaded: (item: MediaItem) => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const upload = useUploadMedia();
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [folder, setFolder] = useState(defaultFolder);
  const [showErrors, setShowErrors] = useState(false);

  const fileError = file ? null : t("validation.required");

  const handleSubmit = async () => {
    if (fileError || !file) {
      setShowErrors(true);
      return;
    }
    try {
      const item = await upload.mutateAsync({ file, alt: alt.trim(), folder });
      toast({ body: t("media.toastUploaded") });
      setFile(null);
      setAlt("");
      setShowErrors(false);
      onUploaded(item);
    } catch (err) {
      toast({
        body: t("common.saveFailed", {
          message: err instanceof ApiError ? err.message : String(err),
        }),
        type: "error",
      });
    }
  };

  return (
    <FormLayout>
      <FileInput
        label={t("media.uploadDialog.file")}
        description={t("media.uploadDialog.subtitle")}
        mode="dropzone"
        accept={ACCEPT[accept]}
        maxSize={MAX}
        value={file}
        onChange={(f) => setFile(Array.isArray(f) ? (f[0] ?? null) : f)}
        isRequired
        status={showErrors && fileError ? { type: "error", message: fileError } : undefined}
      />
      <TextInput
        label={t("media.uploadDialog.alt")}
        description={t("media.uploadDialog.altDescription")}
        value={alt}
        onChange={setAlt}
        isOptional
      />
      <Selector
        label={t("media.uploadDialog.folder")}
        options={MEDIA_FOLDERS.map((f) => ({ value: f, label: f }))}
        value={folder}
        onChange={setFolder}
      />
      <HStack gap={2} hAlign="end">
        {onCancel && <Button label={t("common.cancel")} variant="ghost" onClick={onCancel} />}
        <Button
          label={t("media.uploadDialog.submit")}
          variant="primary"
          isLoading={upload.isPending}
          onClick={() => void handleSubmit()}
        />
      </HStack>
    </FormLayout>
  );
}
