import { IconButton } from "@astryxdesign/core/IconButton";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "@/app/theme";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { resolvedMode, toggle } = useThemeMode();
  const label = resolvedMode === "dark" ? t("topnav.themeLight") : t("topnav.themeDark");
  return (
    <IconButton
      label={label}
      tooltip={label}
      variant="ghost"
      icon={resolvedMode === "dark" ? <SunIcon /> : <MoonIcon />}
      onClick={toggle}
    />
  );
}
