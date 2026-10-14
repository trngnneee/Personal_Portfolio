import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { HStack } from "@astryxdesign/core/HStack";
import { Section } from "@astryxdesign/core/Section";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useTranslation } from "react-i18next";
import { StatusLabel } from "@/components/common/StatusLabel";
import { enumLabel } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { STATUS_VARIANT } from "./MessagesPage.constants";
import type { Message } from "./types";

/** Read-only detail view. Opening it marks a new message as read (handled by the page). */
export function MessageDialog({
  message,
  onOpenChange,
  onArchive,
}: {
  message: Message | null;
  onOpenChange: (open: boolean) => void;
  onArchive: (m: Message) => void;
}) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <Dialog isOpen onOpenChange={onOpenChange} width={560}>
      <VStack gap={4}>
        <DialogHeader
          title={message.subject}
          subtitle={`${message.name} <${message.email}>`}
          onOpenChange={onOpenChange}
          endContent={
            <StatusLabel
              variant={STATUS_VARIANT[message.status]}
              label={enumLabel("messageStatus", message.status)}
            />
          }
        />
        <VStack gap={1}>
          <Text type="supporting" color="secondary">
            {t("messages.dialog.receivedAt", { date: formatDateTime(message.createdAt) })}
          </Text>
          <Text type="supporting" color="secondary">
            {t("messages.dialog.service", {
              service: enumLabel("contactService", message.service),
            })}
          </Text>
        </VStack>
        <Section variant="muted" padding={4}>
          <Text as="p" textWrap="pretty">
            {message.message}
          </Text>
        </Section>
        <HStack gap={2} hAlign="end">
          {message.status !== "archived" && (
            <Button
              label={t("messages.archive")}
              variant="ghost"
              onClick={() => onArchive(message)}
            />
          )}
          <Button
            label={t("messages.reply")}
            variant="primary"
            href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
