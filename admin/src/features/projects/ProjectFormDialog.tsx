import {
  PROJECT_CATEGORIES,
  projectSchema,
  REPO_VISIBILITIES,
  slugify,
  type ProjectInput,
} from "@portfolio/shared";
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
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { MediaPicker, type MediaRef } from "@/components/common/MediaPicker";
import { TagsInput } from "@/components/common/TagsInput";
import { enumOptions } from "@/i18n";
import { fieldErrors, lines, orNull, statusFor } from "@/lib/validation";
import type { Project } from "./types";

export type ProjectFormValues = ProjectInput;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  techSuggestions: string[];
}

/** DateInput works in YYYY-MM-DD; stored values may be YYYY-MM. */
const toIso = (d: string | null) => (d ? (d.length === 7 ? `${d}-01` : d) : undefined);

function ProjectFormDialogBody({ onOpenChange, project, onSubmit, techSuggestions }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [isSlugTouched, setIsSlugTouched] = useState(Boolean(project));
  const [subtitle, setSubtitle] = useState(project?.subtitle ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [highlights, setHighlights] = useState(project?.highlights.join("\n") ?? "");
  const [role, setRole] = useState(project?.role ?? "");
  const [category, setCategory] = useState<string>(project?.category ?? "fullstack");
  const [techStack, setTechStack] = useState<string[]>(project?.techStack ?? []);
  const [repoUrl, setRepoUrl] = useState(project?.repoUrl ?? "");
  const [repoVisibility, setRepoVisibility] = useState<string>(project?.repoVisibility ?? "public");
  const [demoUrl, setDemoUrl] = useState(project?.demoUrl ?? "");
  const [cover, setCover] = useState<MediaRef | null>(project?.cover ?? null);
  const [startDate, setStartDate] = useState<string | undefined>(toIso(project?.startDate ?? null));
  const [endDate, setEndDate] = useState<string | undefined>(toIso(project?.endDate ?? null));
  const [featured, setFeatured] = useState(project?.featured ?? false);
  const [published, setPublished] = useState(project?.published ?? true);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const result = projectSchema.safeParse({
    title: title.trim(),
    slug,
    subtitle: orNull(subtitle),
    summary: summary.trim(),
    description,
    highlights: lines(highlights),
    role: orNull(role),
    category,
    techStack,
    repoUrl: orNull(repoUrl),
    repoVisibility,
    demoUrl: orNull(demoUrl),
    coverMediaId: cover?.id ?? null,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
    featured,
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
          title={project ? t("projects.form.editTitle") : t("projects.form.createTitle")}
          subtitle={project ? project.title : t("projects.form.createSubtitle")}
          onOpenChange={onOpenChange}
        />
        <FormLayout>
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("projects.form.title")}
              value={title}
              onChange={(v) => {
                setTitle(v);
                if (!isSlugTouched) setSlug(slugify(v));
              }}
              isRequired
              status={statusFor(showErrors, errors.title)}
            />
            <TextInput
              label={t("projects.form.slug")}
              description={t("projects.form.slugDescription")}
              value={slug}
              onChange={(v) => {
                setIsSlugTouched(true);
                setSlug(slugify(v));
              }}
              isRequired
              status={statusFor(showErrors, errors.slug)}
            />
          </Grid>
          <TextInput
            label={t("projects.form.subtitle")}
            value={subtitle}
            onChange={setSubtitle}
            isOptional
            status={statusFor(showErrors, errors.subtitle)}
          />
          <TextArea
            label={t("projects.form.summary")}
            value={summary}
            onChange={setSummary}
            rows={3}
            maxLength={600}
            isRequired
            status={statusFor(showErrors, errors.summary)}
          />
          <Grid gap={4} columns={2}>
            <Selector
              label={t("projects.form.category")}
              options={enumOptions("projectCategory", PROJECT_CATEGORIES)}
              value={category}
              onChange={setCategory}
              isRequired
            />
            <TextInput label={t("projects.form.role")} value={role} onChange={setRole} isOptional />
          </Grid>
          <TagsInput
            label={t("projects.form.techStack")}
            description={t("common.commaSeparated")}
            value={techStack}
            onChange={setTechStack}
            suggestions={techSuggestions}
            isOptional
          />
          <TextArea
            label={t("projects.form.highlights")}
            description={t("common.oneItemPerLine")}
            value={highlights}
            onChange={setHighlights}
            rows={4}
            isOptional
            status={statusFor(showErrors, errors.highlights)}
          />
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("projects.form.repoUrl")}
              value={repoUrl}
              onChange={setRepoUrl}
              isOptional
              status={statusFor(showErrors, errors.repoUrl)}
            />
            <Selector
              label={t("projects.form.repoVisibility")}
              description={t("projects.form.repoVisibilityDescription")}
              options={enumOptions("repoVisibility", REPO_VISIBILITIES)}
              value={repoVisibility}
              onChange={setRepoVisibility}
            />
          </Grid>
          <TextInput
            label={t("projects.form.demoUrl")}
            value={demoUrl}
            onChange={setDemoUrl}
            isOptional
            status={statusFor(showErrors, errors.demoUrl)}
          />
          <Grid gap={4} columns={2}>
            <DateInput
              label={t("projects.form.startDate")}
              value={startDate as never}
              onChange={(v) => setStartDate(v)}
              hasClear
              isOptional
            />
            <DateInput
              label={t("projects.form.endDate")}
              value={endDate as never}
              onChange={(v) => setEndDate(v)}
              hasClear
              isOptional
            />
          </Grid>
          <MediaPicker
            label={t("projects.form.cover")}
            value={cover}
            onChange={setCover}
            folder="projects"
            isOptional
          />
          <MarkdownEditor
            label={t("projects.form.description")}
            value={description}
            onChange={setDescription}
            rows={12}
            folder="projects"
          />
          <Switch
            label={t("projects.form.featured")}
            value={featured}
            onChange={setFeatured}
            labelSpacing="spread"
          />
          <Switch
            label={t("projects.form.published")}
            value={published}
            onChange={setPublished}
            labelSpacing="spread"
          />
        </FormLayout>
        <HStack gap={2} hAlign="end">
          <Button label={t("common.cancel")} variant="ghost" onClick={() => onOpenChange(false)} />
          <Button
            label={project ? t("common.saveChanges") : t("projects.form.submitCreate")}
            variant="primary"
            isLoading={isSaving}
            onClick={() => void handleSubmit()}
          />
        </HStack>
      </VStack>
    </>
  );
}

/** Remounts the form on every open, so fields start from `project` without a reset effect. */
export function ProjectFormDialog(props: Props) {
  return (
    <Dialog
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      purpose="form"
      width={720}
      maxHeight="90dvh"
    >
      {props.isOpen && <ProjectFormDialogBody key={props.project?.id ?? "new"} {...props} />}
    </Dialog>
  );
}
