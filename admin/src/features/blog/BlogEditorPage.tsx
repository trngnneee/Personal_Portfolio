import { blogPostSchema, slugify } from "@portfolio/shared";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Grid } from "@astryxdesign/core/Grid";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Switch } from "@astryxdesign/core/Switch";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker, useNavigate, useParams } from "react-router";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { MediaPicker, type MediaRef } from "@/components/common/MediaPicker";
import { SettingsSection } from "@/components/common/SettingsSection";
import { StatusLabel } from "@/components/common/StatusLabel";
import { TagsInput } from "@/components/common/TagsInput";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { blogEditPath, publicUrl, ROUTES } from "@/config/app";
import { useSections } from "@/features/sections/api";
import { enumLabel } from "@/i18n";
import { ApiError } from "@/lib/api";
import { fieldErrors, orNull, statusFor } from "@/lib/validation";
import { blogApi, usePost, useSetPublished } from "./api";
import type { BlogPost } from "./types";

interface Draft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  cover: MediaRef | null;
  featured: boolean;
}

const EMPTY: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  tags: [],
  cover: null,
  featured: false,
};
const fromPost = (p: BlogPost): Draft => ({
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt ?? "",
  content: p.content,
  tags: p.tags,
  cover: p.cover,
  featured: p.featured,
});

export function BlogEditorPage() {
  const { id: idParam } = useParams();
  const id = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null;
  const post = usePost(id);

  if (id !== null && post.isPending) {
    return (
      <Center minHeight={320}>
        <Spinner />
      </Center>
    );
  }
  if (id !== null && (post.isError || !post.data)) {
    return <EditorNotFound />;
  }
  // Remount when switching posts so local state resets.
  return <Editor key={id ?? "new"} post={post.data ?? null} />;
}

function EditorNotFound() {
  const { t } = useTranslation();
  return (
    <Page>
      <Center minHeight={400}>
        <EmptyState
          title={t("blog.editor.notFound")}
          actions={<Button label={t("nav.blog")} href={ROUTES.blog} />}
        />
      </Center>
    </Page>
  );
}

function Editor({ post }: { post: BlogPost | null }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const create = blogApi.useCreate();
  const update = blogApi.useUpdate();
  const setPublished = useSetPublished();
  const sections = useSections();
  const blogOff = sections.data?.some((s) => s.key === "blog" && !s.enabled) ?? false;

  const initial = useMemo(() => (post ? fromPost(post) : EMPTY), [post]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [saved, setSaved] = useState<Draft>(initial);
  const [isSlugTouched, setIsSlugTouched] = useState(Boolean(post));
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "publish">(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const isDirty =
    JSON.stringify({ ...draft, cover: draft.cover?.id ?? null }) !==
    JSON.stringify({ ...saved, cover: saved.cover?.id ?? null });

  const result = blogPostSchema.safeParse({
    title: draft.title.trim(),
    slug: draft.slug,
    excerpt: orNull(draft.excerpt),
    content: draft.content,
    tags: draft.tags,
    coverMediaId: draft.cover?.id ?? null,
    featured: draft.featured,
  });
  const errors = fieldErrors(result, t);

  // In-app navigation guard (data router) + tab close guard.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const fail = (err: unknown) =>
    toast({
      body: t("common.saveFailed", {
        message: err instanceof ApiError ? err.message : String(err),
      }),
      type: "error",
    });

  /** Save; returns the post id (creating it if needed). */
  const save = async (): Promise<number | null> => {
    if (!result.success) {
      setShowErrors(true);
      return null;
    }
    try {
      if (post) {
        await update.mutateAsync({ id: post.id, input: result.data });
        setSaved(draft);
        toast({ body: t("blog.editor.toastSaved") });
        return post.id;
      }
      const created = await create.mutateAsync(result.data);
      setSaved(draft);
      toast({ body: t("blog.editor.toastCreated") });
      return created.id;
    } catch (err) {
      fail(err);
      return null;
    }
  };

  const handleSave = async () => {
    setBusy("save");
    const savedId = await save();
    setBusy(null);
    if (savedId && !post) navigate(blogEditPath(savedId), { replace: true });
  };

  const handlePublishToggle = async () => {
    setBusy("publish");
    const isPublished = post?.status === "published";
    const savedId = isDirty || !post ? await save() : post.id;
    if (savedId) {
      try {
        await setPublished.mutateAsync({ id: savedId, published: !isPublished });
        toast({ body: isPublished ? t("blog.toastUnpublished") : t("blog.toastPublished") });
        if (!post) navigate(blogEditPath(savedId), { replace: true });
      } catch (err) {
        fail(err);
      }
    }
    setBusy(null);
  };

  const isPublished = post?.status === "published";

  return (
    <Page>
      <PageHeader
        title={post ? t("blog.editor.editTitle") : t("blog.editor.newTitle")}
        description={t("blog.editor.description")}
        actions={
          <>
            {post && (
              <StatusLabel
                variant={isPublished ? "success" : "neutral"}
                label={enumLabel("blogStatus", post.status)}
              />
            )}
            {isPublished && post && (
              <Button
                label={t("common.viewOnSite")}
                variant="ghost"
                href={publicUrl(`/blog/${post.slug}`)}
                target="_blank"
              />
            )}
            <Button
              label={isPublished ? t("blog.editor.save") : t("blog.editor.saveDraft")}
              isLoading={busy === "save"}
              isDisabled={busy !== null || (Boolean(post) && !isDirty)}
              onClick={() => void handleSave()}
            />
            <Button
              label={isPublished ? t("blog.editor.unpublish") : t("blog.editor.publish")}
              variant="primary"
              isLoading={busy === "publish"}
              isDisabled={busy !== null}
              onClick={() => void handlePublishToggle()}
            />
          </>
        }
      />
      {blogOff && (
        <Banner
          status="warning"
          title={t("blog.sectionOffTitle")}
          description={t("blog.sectionOffDescription")}
          collapsible={false}
          endContent={
            <Button label={t("blog.sectionOffAction")} size="sm" href={ROUTES.sections} />
          }
        />
      )}
      <Card padding={4}>
        <SettingsSection
          title={t("blog.editor.details")}
          description={t("blog.editor.detailsDescription")}
        >
          <FormLayout>
            <TextInput
              label={t("blog.editor.title")}
              value={draft.title}
              onChange={(v) => {
                setDraft((d) => ({ ...d, title: v, slug: isSlugTouched ? d.slug : slugify(v) }));
              }}
              isRequired
              status={statusFor(showErrors, errors.title)}
            />
            <TextInput
              label={t("blog.editor.slug")}
              description={t("blog.editor.slugDescription", { slug: draft.slug || "…" })}
              value={draft.slug}
              onChange={(v) => {
                setIsSlugTouched(true);
                set("slug", slugify(v));
              }}
              isRequired
              status={statusFor(showErrors, errors.slug)}
            />
            <TextArea
              label={t("blog.editor.excerpt")}
              description={t("blog.editor.excerptDescription")}
              value={draft.excerpt}
              onChange={(v) => set("excerpt", v)}
              rows={2}
              maxLength={500}
              isOptional
              status={statusFor(showErrors, errors.excerpt)}
            />
            <Grid gap={4} columns={{ minWidth: 260, repeat: "fit" }}>
              <TagsInput
                label={t("blog.editor.tags")}
                description={t("common.commaSeparated")}
                value={draft.tags}
                onChange={(v) => set("tags", v)}
                isOptional
              />
              <MediaPicker
                label={t("blog.editor.cover")}
                value={draft.cover}
                onChange={(v) => set("cover", v)}
                folder="blog"
                isOptional
              />
            </Grid>
            <Switch
              label={t("blog.editor.featured")}
              value={draft.featured}
              onChange={(v) => set("featured", v)}
              labelSpacing="spread"
            />
          </FormLayout>
        </SettingsSection>
      </Card>
      <MarkdownEditor
        label={t("blog.editor.content")}
        value={draft.content}
        onChange={(v) => set("content", v)}
        rows={24}
        folder="blog"
        status={statusFor(showErrors, errors.content)}
      />
      <AlertDialog
        isOpen={blocker.state === "blocked"}
        onOpenChange={(open) => {
          if (!open && blocker.state === "blocked") blocker.reset();
        }}
        title={t("common.unsavedTitle")}
        description={t("common.unsavedDescription")}
        actionLabel={t("common.unsavedAction")}
        onAction={() => blocker.proceed?.()}
      />
    </Page>
  );
}
