import { Markdown } from "@portfolio/markdown";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HStack } from "@astryxdesign/core/HStack";
import { StackItem } from "@astryxdesign/core/Stack";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { TextArea } from "@astryxdesign/core/TextArea";
import { VStack } from "@astryxdesign/core/VStack";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "@/app/theme";
import { MediaPickerDialog } from "./MediaPicker";

interface MarkdownEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  description?: string;
  isRequired?: boolean;
  status?: { type: "error"; message: string };
  /** Upload folder for inserted images. */
  folder?: string;
}

/**
 * Write/Preview markdown editor. Preview uses @portfolio/markdown — the exact renderer of
 * the public site. Not in Astryx (see DEVIATIONS.md).
 */
export function MarkdownEditor({
  label,
  value,
  onChange,
  rows = 16,
  description,
  isRequired,
  status,
  folder = "blog",
}: MarkdownEditorProps) {
  const { t } = useTranslation();
  const { resolvedMode } = useThemeMode();
  const [tab, setTab] = useState("write");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Remember the caret so the image lands where the author was typing.
  const caret = useRef<{ start: number; end: number } | null>(null);

  const insert = (snippet: string) => {
    const pos = caret.current ?? { start: value.length, end: value.length };
    const before = value.slice(0, pos.start);
    const after = value.slice(pos.end);
    const pad = before && !before.endsWith("\n") ? "\n\n" : "";
    const next = `${before}${pad}${snippet}\n\n${after.replace(/^\n+/, "")}`;
    onChange(next);
    setTab("write");
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const at = before.length + pad.length + snippet.length;
      el.focus();
      el.setSelectionRange(at, at);
    });
  };

  return (
    <VStack gap={2}>
      <HStack gap={2} vAlign="center">
        <StackItem size="fill">
          <TabList value={tab} onChange={setTab} size="sm">
            <Tab value="write" label={t("markdown.write")} />
            <Tab value="preview" label={t("markdown.preview")} />
          </TabList>
        </StackItem>
        <Button
          label={t("markdown.insertImage")}
          size="sm"
          variant="ghost"
          icon={<PhotoIcon />}
          onClick={() => {
            const el = textareaRef.current;
            caret.current = el ? { start: el.selectionStart, end: el.selectionEnd } : null;
            setIsPickerOpen(true);
          }}
        />
      </HStack>
      {tab === "write" ? (
        <TextArea
          ref={textareaRef}
          label={label}
          description={description}
          value={value}
          onChange={onChange}
          rows={rows}
          isRequired={isRequired}
          status={status}
          hasSpellCheck={false}
        />
      ) : (
        <Card padding={4}>
          {value.trim() ? (
            <Markdown
              className="md-preview"
              mermaidTheme={resolvedMode === "dark" ? "dark" : "default"}
            >
              {value}
            </Markdown>
          ) : (
            <EmptyState isCompact title={t("markdown.emptyPreview")} />
          )}
        </Card>
      )}
      <MediaPickerDialog
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        title={t("markdown.insertImage")}
        folder={folder}
        onSelect={(m) => {
          setIsPickerOpen(false);
          insert(`![${m.alt.replace(/[[\]]/g, "")}](${m.url})`);
        }}
      />
    </VStack>
  );
}
