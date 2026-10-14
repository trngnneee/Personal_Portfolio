import { HStack } from "@astryxdesign/core/HStack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";

export type StatusVariant = "success" | "warning" | "error" | "accent" | "neutral";

/** The only way to render a status: dot + visible text. */
export function StatusLabel({
  variant,
  label,
  isPulsing,
}: {
  variant: StatusVariant;
  label: string;
  isPulsing?: boolean;
}) {
  return (
    <HStack gap={2} vAlign="center">
      <StatusDot variant={variant} label={label} isPulsing={isPulsing} />
      <Text>{label}</Text>
    </HStack>
  );
}
