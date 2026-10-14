import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/config/app";

/** Rendered outside the router's link context, so links are plain hrefs. */
export function ServerErrorPage({ detail }: { detail?: string }) {
  const { t } = useTranslation();
  return (
    <Center height="100dvh" padding={6}>
      <EmptyState
        icon={<Icon icon={ExclamationTriangleIcon} size="lg" color="error" />}
        title={t("misc.serverErrorTitle")}
        description={
          detail
            ? `${t("misc.serverErrorDescription")} (${detail})`
            : t("misc.serverErrorDescription")
        }
        actions={
          <>
            <Button
              label={t("misc.reload")}
              variant="primary"
              onClick={() => window.location.reload()}
            />
            <Button
              label={t("misc.backToDashboard")}
              onClick={() => window.location.assign(ROUTES.dashboard)}
            />
          </>
        }
      />
    </Center>
  );
}
