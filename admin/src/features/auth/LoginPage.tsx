import { loginSchema } from "@portfolio/shared";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { CommandLineIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, type Location } from "react-router";
import { APP_CONFIG, ROUTES } from "@/config/app";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { fieldErrors, statusFor } from "@/lib/validation";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { t } = useTranslation();
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? ROUTES.dashboard;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = fieldErrors(loginSchema.safeParse({ email, password }), t);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleLogin = async () => {
    if (Object.keys(errors).length) {
      setShowErrors(true);
      return;
    }
    setIsLoading(true);
    setServerError(null);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(loginErrorMessage(err, t));
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center height="100dvh" axis="both" padding={6}>
      <VStack width="100%" maxWidth={400} hAlign="stretch" gap={4}>
        <Card padding={8} width="100%">
          <VStack gap={6}>
            <VStack gap={2} hAlign="center">
              <Icon icon={CommandLineIcon} size="lg" color="accent" />
              <Heading level={2}>{t("auth.title")}</Heading>
              <Text type="supporting">{t("auth.subtitle")}</Text>
            </VStack>
            {serverError && <Banner status="error" title={serverError} collapsible={false} />}
            <FormLayout>
              <TextInput
                label={t("auth.email")}
                type="email"
                size="lg"
                value={email}
                onChange={setEmail}
                autoComplete="username"
                hasAutoFocus
                isRequired
                status={statusFor(showErrors, errors.email)}
              />
              <TextInput
                label={t("auth.password")}
                type="password"
                size="lg"
                value={password}
                onChange={setPassword}
                onEnter={() => void handleLogin()}
                autoComplete="current-password"
                isRequired
                status={statusFor(showErrors, errors.password)}
              />
              <Button
                label={t("auth.submit")}
                variant="primary"
                size="lg"
                width="100%"
                isLoading={isLoading}
                onClick={() => void handleLogin()}
              />
            </FormLayout>
          </VStack>
        </Card>
        <HStack hAlign="center">
          <Text type="supporting">
            {t("app.version", { name: APP_CONFIG.name, version: APP_CONFIG.version })}
          </Text>
        </HStack>
      </VStack>
    </Center>
  );
}

function loginErrorMessage(err: unknown, t: ReturnType<typeof useTranslation>["t"]): string {
  if (!(err instanceof ApiError)) return t("auth.invalidCredentials");
  if (err.status === 0) return t("auth.networkError");
  if (err.status === 423) {
    const until = (err.details as { lockedUntil?: string } | undefined)?.lockedUntil;
    return t("auth.locked", { time: formatDateTime(until) });
  }
  if (err.status === 429) return t("auth.rateLimited");
  return t("auth.invalidCredentials");
}
