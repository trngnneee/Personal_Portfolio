import { Section } from "@astryxdesign/core/Section";
import { VStack } from "@astryxdesign/core/VStack";
import type { ReactNode } from "react";

/** Root of every in-shell page: owns page padding and block rhythm. */
export function Page({
  children,
  width = "full",
}: {
  children: ReactNode;
  width?: "full" | "narrow";
}) {
  return (
    <Section variant="transparent" padding={6}>
      <VStack gap={6} maxWidth={width === "narrow" ? 720 : undefined}>
        {children}
      </VStack>
    </Section>
  );
}
