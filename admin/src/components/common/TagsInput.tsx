import { Tokenizer } from "@astryxdesign/core/Tokenizer";
import { useMemo } from "react";

interface TagsInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  /** Known values offered as suggestions. */
  suggestions?: string[];
  description?: string;
  placeholder?: string;
  isOptional?: boolean;
  status?: { type: "error"; message: string };
}

/** Free-text list (tags, tech stack) on top of Astryx Tokenizer with hasCreate. */
export function TagsInput({
  label,
  value,
  onChange,
  suggestions = [],
  description,
  placeholder,
  isOptional,
  status,
}: TagsInputProps) {
  const items = value.map((v) => ({ id: v, label: v }));
  const source = useMemo(() => {
    const all = [...new Set(suggestions)].map((s) => ({ id: s, label: s }));
    return {
      search: (q: string) => all.filter((s) => s.label.toLowerCase().includes(q.toLowerCase())),
      bootstrap: () => all,
    };
  }, [suggestions]);

  return (
    <Tokenizer
      label={label}
      description={description}
      placeholder={placeholder}
      isOptional={isOptional}
      status={status}
      value={items}
      searchSource={source}
      hasCreate
      debounceMs={0}
      onChange={(next) => onChange([...new Set(next.map((i) => i.label.trim()).filter(Boolean))])}
    />
  );
}
