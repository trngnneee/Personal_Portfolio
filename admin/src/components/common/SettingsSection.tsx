import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { ReactNode } from "react";

/**
 * 220px explainer + filling controls, wrapping on narrow screens.
 * Promoted from SettingsPage (doc §21) because Sections, Profile and Settings all use it.
 */
export function SettingsSection({
  title,
  description,
  endContent,
  children,
}: {
  title: string;
  description?: string;
  endContent?: ReactNode;
  children: ReactNode;
}) {
  return (
    <HStack gap={8} wrap="wrap">
      <VStack gap={1} width={220}>
        <Heading level={5}>{title}</Heading>
        {description && (
          <Text type="supporting" color="secondary">
            {description}
          </Text>
        )}
        {endContent}
      </VStack>
      <StackItem size="fill">{children}</StackItem>
    </HStack>
  );
}
