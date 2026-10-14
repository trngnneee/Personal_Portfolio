import { AppShell } from "@astryxdesign/core/AppShell";
import { Badge } from "@astryxdesign/core/Badge";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { NavIcon } from "@astryxdesign/core/NavIcon";
import { Section } from "@astryxdesign/core/Section";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { Text } from "@astryxdesign/core/Text";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { VStack } from "@astryxdesign/core/VStack";
import { CommandLineIcon } from "@heroicons/react/24/solid";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { APP_CONFIG, ROUTES } from "@/config/app";
import { NAV_SECTIONS } from "@/config/navigation";
import { useUnreadCount } from "@/features/messages/api";
import { formatNumber } from "@/lib/format";
import { LanguageMenu } from "./LanguageMenu";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

//   > 768px   top nav | side nav | content
//   <= 768px  side nav collapses into the mobile drawer automatically (AppShell)

function isPathSelected(pathname: string, itemPath: string): boolean {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const unread = useUnreadCount();

  return (
    <AppShell
      contentPadding={0}
      topNav={
        <TopNav
          label={t("nav.mainNavigation")}
          heading={
            <TopNavHeading
              heading={APP_CONFIG.name}
              headingHref={ROUTES.dashboard}
              logo={<NavIcon icon={<Icon icon={CommandLineIcon} size="sm" />} />}
            />
          }
          endContent={
            <HStack gap={1} vAlign="center">
              <LanguageMenu />
              <ThemeToggle />
              <UserMenu />
            </HStack>
          }
        />
      }
      sideNav={
        <SideNav
          collapsible={{ isCollapsed: isNavCollapsed, onCollapsedChange: setIsNavCollapsed }}
          footer={
            isNavCollapsed ? undefined : (
              <Section variant="transparent" padding={3}>
                <VStack hAlign="center">
                  <Text type="supporting" color="secondary">
                    {t("app.version", { name: APP_CONFIG.name, version: APP_CONFIG.version })}
                  </Text>
                </VStack>
              </Section>
            )
          }
        >
          {NAV_SECTIONS.map((section) => (
            <SideNavSection
              key={section.titleKey}
              title={t(`nav.sections.${section.titleKey}`)}
              isHeaderHidden={section.isHeaderHidden}
            >
              {section.items.map((item) => (
                <SideNavItem
                  key={item.path}
                  label={t(`nav.${item.labelKey}`)}
                  href={item.path}
                  icon={item.icon}
                  selectedIcon={item.iconSelected}
                  isSelected={isPathSelected(pathname, item.path)}
                  endContent={
                    item.hasInboxBadge && unread > 0 ? (
                      <Badge variant="info" label={formatNumber(unread)} />
                    ) : undefined
                  }
                />
              ))}
            </SideNavSection>
          ))}
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
