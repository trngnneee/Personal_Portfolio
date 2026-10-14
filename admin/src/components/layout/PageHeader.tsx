import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <HStack gap={4} vAlign="center" wrap="wrap">
      <StackItem size="fill">
        <VStack gap={1}>
          <Heading level={2}>{title}</Heading>
          {description && (
            <Text type="supporting" color="secondary">
              {description}
            </Text>
          )}
        </VStack>
      </StackItem>
      {actions && (
        <HStack gap={2} vAlign="center">
          {actions}
        </HStack>
      )}
    </HStack>
  );
}
