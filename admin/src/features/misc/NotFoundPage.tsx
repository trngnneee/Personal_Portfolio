import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { MapIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/config/app";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Center minHeight={400}>
      <EmptyState
        icon={<Icon icon={MapIcon} size="lg" color="secondary" />}
        title={t("misc.notFoundTitle")}
        description={t("misc.notFoundDescription")}
        actions={
          <Button label={t("misc.backToDashboard")} variant="primary" href={ROUTES.dashboard} />
        }
      />
    </Center>
  );
}
