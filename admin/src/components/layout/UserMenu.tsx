import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import {
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { APP_CONFIG, ROUTES } from "@/config/app";
import { useAuth } from "@/features/auth/AuthContext";

export function UserMenu() {
  const { t } = useTranslation();
  const { email, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <DropdownMenu
      button={{
        label: t("topnav.account"),
        variant: "ghost",
        isIconOnly: true,
        icon: <UserCircleIcon />,
      }}
      hasChevron={false}
      menuWidth={220}
      alignment="end"
      items={[
        {
          type: "section",
          title: t("auth.signedInAs"),
          items: [{ label: email ?? "—", isDisabled: true }],
        },
        { label: t("nav.settings"), icon: Cog6ToothIcon, onClick: () => navigate(ROUTES.settings) },
        ...(APP_CONFIG.publicSiteUrl
          ? [
              {
                label: t("common.viewSite"),
                icon: GlobeAltIcon,
                href: APP_CONFIG.publicSiteUrl,
                target: "_blank" as const,
                rel: "noopener noreferrer",
              },
            ]
          : []),
        { type: "divider" },
        {
          label: t("auth.signOut"),
          icon: ArrowRightStartOnRectangleIcon,
          onClick: () => void signOut(),
        },
      ]}
    />
  );
}
