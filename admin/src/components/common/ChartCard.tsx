import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { ReactNode } from "react";

export function ChartCard({
  title,
  description,
  actions,
  height = 280,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  height?: number;
  children: ReactNode;
}) {
  return (
    <Card padding={4}>
      <VStack gap={4}>
        <HStack gap={4} vAlign="center">
          <StackItem size="fill">
            <VStack gap={1}>
              <Heading level={4}>{title}</Heading>
              {description && (
                <Text type="supporting" color="secondary">
                  {description}
                </Text>
              )}
            </VStack>
          </StackItem>
          {actions}
        </HStack>
        <VStack height={height}>{children}</VStack>
      </VStack>
    </Card>
  );
}
