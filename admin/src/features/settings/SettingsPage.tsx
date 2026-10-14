import { PASSWORD_MIN_LENGTH } from "@portfolio/shared";
import { useImperativeAlertDialog } from "@astryxdesign/core/AlertDialog";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode, type ThemeMode } from "@/app/theme";
import { SettingsSection } from "@/components/common/SettingsSection";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { useChangePassword, useLogoutAll } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthContext";
import { exportJson } from "@/features/dashboard/api";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { statusFor } from "@/lib/validation";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const confirm = useImperativeAlertDialog();
  const { endSession, lastLoginAt } = useAuth();
  const { mode, setMode } = useThemeMode();
  const changePassword = useChangePassword();
  const logoutAll = useLogoutAll();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentError = currentPassword === "" ? t("validation.required") : undefined;
  const newError =
    newPassword.length < PASSWORD_MIN_LENGTH
      ? t("validation.tooShort", { min: PASSWORD_MIN_LENGTH })
      : undefined;
  const confirmError = confirmPassword !== newPassword ? t("settings.passwordMismatch") : undefined;

  const handleChangePassword = () => {
    if (currentError || newError || confirmError) {
      setShowErrors(true);
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          // Every token was revoked server-side, including ours.
          toast({ body: t("settings.toastPasswordChanged") });
          endSession();
        },
        onError: (err) =>
          toast({
            body:
              err instanceof ApiError && err.status === 400
                ? t("settings.wrongPassword")
                : t("common.saveFailed", { message: err.message }),
            type: "error",
          }),
      },
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportJson();
      toast({ body: t("settings.toastExported") });
    } catch (err) {
      toast({
        body: t("common.saveFailed", { message: err instanceof Error ? err.message : String(err) }),
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogoutAll = () =>
    confirm.show({
      title: t("settings.signOutAllTitle"),
      description: `${t("settings.signOutAllDescription")} ${t("common.cannotBeUndone")}`,
      actionLabel: t("settings.signOutAll"),
      onAction: () => {
        confirm.hide();
        logoutAll.mutate(undefined, { onSettled: () => endSession() });
      },
    });

  return (
    <Page width="narrow">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <VStack gap={6}>
        <SettingsSection
          title={t("settings.password")}
          description={t("settings.passwordDescription")}
          endContent={
            lastLoginAt ? (
              <Text type="supporting" color="secondary">
                {t("settings.lastLogin", { date: formatDateTime(lastLoginAt) })}
              </Text>
            ) : undefined
          }
        >
          <FormLayout>
            <TextInput
              label={t("settings.currentPassword")}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
              status={statusFor(showErrors, currentError)}
            />
            <TextInput
              label={t("settings.newPassword")}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={setNewPassword}
              status={statusFor(showErrors, newError)}
            />
            <TextInput
              label={t("settings.confirmPassword")}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              status={statusFor(showErrors, confirmError)}
            />
            <HStack>
              <Button
                label={t("settings.updatePassword")}
                variant="primary"
                isLoading={changePassword.isPending}
                isDisabled={currentPassword === "" || newPassword.length < PASSWORD_MIN_LENGTH}
                onClick={handleChangePassword}
              />
            </HStack>
          </FormLayout>
        </SettingsSection>
        <Divider />
        <SettingsSection title={t("settings.backup")} description={t("settings.backupDescription")}>
          <HStack>
            <Button
              label={t("settings.exportJson")}
              icon={<ArrowDownTrayIcon />}
              isLoading={isExporting}
              onClick={() => void handleExport()}
            />
          </HStack>
        </SettingsSection>
        <Divider />
        <SettingsSection
          title={t("settings.preferences")}
          description={t("settings.preferencesDescription")}
        >
          <FormLayout>
            <Selector
              label={t("settings.theme")}
              options={(["system", "light", "dark"] as const).map((m) => ({
                value: m,
                label: t(`settings.themeOptions.${m}`),
              }))}
              value={mode}
              onChange={(v) => setMode(v as ThemeMode)}
            />
            <Selector
              label={t("settings.language")}
              options={SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: t(`languages.${l}`) }))}
              value={i18n.language}
              onChange={(v) => void i18n.changeLanguage(v)}
            />
          </FormLayout>
        </SettingsSection>
        <Card variant="red" padding={4}>
          <HStack gap={4} vAlign="center" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={1}>
                <Heading level={5}>{t("settings.dangerZone")}</Heading>
                <Text type="supporting" color="secondary">
                  {t("settings.dangerDescription")}
                </Text>
              </VStack>
            </StackItem>
            <Button
              label={t("settings.signOutAll")}
              variant="destructive"
              isLoading={logoutAll.isPending}
              onClick={handleLogoutAll}
            />
          </HStack>
        </Card>
      </VStack>
      {confirm.element}
    </Page>
  );
}
