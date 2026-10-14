import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { CheckIcon, LanguageIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n";

export function LanguageMenu() {
  const { t, i18n } = useTranslation();
  return (
    <DropdownMenu
      button={{
        label: t("topnav.language"),
        variant: "ghost",
        isIconOnly: true,
        icon: <LanguageIcon style={{ width: 16, height: 16 }} />,
      }}
      hasChevron={false}
      menuWidth={180}
      alignment="end"
      items={SUPPORTED_LANGUAGES.map((lng) => ({
        label: t(`languages.${lng}`),
        icon: i18n.language === lng ? CheckIcon : undefined,
        onClick: () => void i18n.changeLanguage(lng),
      }))}
    />
  );
}
