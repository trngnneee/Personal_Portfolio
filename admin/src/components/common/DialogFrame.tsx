import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { VStack } from "@astryxdesign/core/VStack";
import type { ReactNode } from "react";

/**
 * Dialog body with a fixed header/footer and a scrolling middle (Astryx `DialogScrollingContent`
 * pattern). Long forms scroll inside the dialog while the title and actions stay visible.
 */
export function DialogFrame({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Layout
      header={header}
      content={
        <LayoutContent>
          <VStack gap={4}>{children}</VStack>
        </LayoutContent>
      }
      footer={footer ? <LayoutFooter hasDivider>{footer}</LayoutFooter> : undefined}
    />
  );
}
