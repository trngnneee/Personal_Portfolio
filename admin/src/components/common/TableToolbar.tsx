import { HStack } from "@astryxdesign/core/HStack";
import { StackItem } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface TableToolbarProps {
  /** Accessible name of the toolbar (translated). */
  label: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function TableToolbar({
  label,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
}: TableToolbarProps) {
  const { t } = useTranslation();
  return (
    <Toolbar
      label={label}
      size="sm"
      dividers={["bottom"]}
      startContent={
        <HStack gap={2} vAlign="center" wrap="wrap">
          <StackItem size="fill">
            <TextInput
              label={t("common.search")}
              isLabelHidden
              size="sm"
              value={search}
              onChange={onSearchChange}
              placeholder={searchPlaceholder ?? t("common.search")}
              startIcon={MagnifyingGlassIcon}
              hasClear
            />
          </StackItem>
          {filters}
        </HStack>
      }
      endContent={actions}
    />
  );
}
