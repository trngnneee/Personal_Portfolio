import { profileSchema } from "@portfolio/shared";
import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Switch } from "@astryxdesign/core/Switch";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { MediaPicker, type MediaRef } from "@/components/common/MediaPicker";
import { SettingsSection } from "@/components/common/SettingsSection";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApiError } from "@/lib/api";
import { fieldErrors, lines, orNull, statusFor } from "@/lib/validation";
import { useProfile, useSaveProfile, type Profile } from "./api";

export function ProfilePage() {
  const { t } = useTranslation();
  const profile = useProfile();
  return (
    <Page width="narrow">
      <PageHeader title={t("profile.title")} description={t("profile.description")} />
      {profile.isPending ? (
        <Center minHeight={320}>
          <Spinner label={t("common.loading")} />
        </Center>
      ) : profile.isError ? (
        <EmptyState
          title={t("common.loadFailed", { message: profile.error.message })}
          actions={<Button label={t("common.retry")} onClick={() => void profile.refetch()} />}
        />
      ) : (
        <ProfileForm profile={profile.data} />
      )}
    </Page>
  );
}

function ProfileForm({ profile }: { profile: Profile | null }) {
  const { t } = useTranslation();
  const toast = useToast();
  const save = useSaveProfile();
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [typewriter, setTypewriter] = useState(profile?.typewriterLines.join("\n") ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [showPhone, setShowPhone] = useState(profile?.showPhone ?? false);
  const [location, setLocation] = useState(profile?.location ?? "");
  const [openToWork, setOpenToWork] = useState(profile?.openToWork ?? false);
  const [avatar, setAvatar] = useState<MediaRef | null>(profile?.avatar ?? null);
  const [cv, setCv] = useState<MediaRef | null>(profile?.cv ?? null);
  const [showErrors, setShowErrors] = useState(false);

  const result = profileSchema.safeParse({
    fullName: fullName.trim(),
    handle: handle.trim(),
    headline: headline.trim(),
    typewriterLines: lines(typewriter),
    bio,
    location: orNull(location),
    email: email.trim(),
    phone: orNull(phone),
    showPhone,
    openToWork,
    avatarMediaId: avatar?.id ?? null,
    cvMediaId: cv?.id ?? null,
  });
  const errors = fieldErrors(result, t);

  const handleSave = () => {
    if (!result.success) {
      setShowErrors(true);
      return;
    }
    save.mutate(result.data, {
      onSuccess: () => toast({ body: t("profile.toastSaved") }),
      onError: (err) =>
        toast({
          body: t("common.saveFailed", {
            message: err instanceof ApiError ? err.message : String(err),
          }),
          type: "error",
        }),
    });
  };

  return (
    <VStack gap={6}>
      <SettingsSection title={t("profile.identity")} description={t("profile.identityDescription")}>
        <FormLayout>
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("profile.fullName")}
              value={fullName}
              onChange={setFullName}
              isRequired
              status={statusFor(showErrors, errors.fullName)}
            />
            <TextInput
              label={t("profile.handle")}
              value={handle}
              onChange={setHandle}
              isRequired
              status={statusFor(showErrors, errors.handle)}
            />
          </Grid>
          <TextInput
            label={t("profile.headline")}
            value={headline}
            onChange={setHeadline}
            isRequired
            status={statusFor(showErrors, errors.headline)}
          />
          <TextArea
            label={t("profile.typewriter")}
            description={t("profile.typewriterDescription")}
            value={typewriter}
            onChange={setTypewriter}
            rows={3}
            status={statusFor(showErrors, errors.typewriterLines)}
          />
          <MarkdownEditor
            label={t("profile.bio")}
            value={bio}
            onChange={setBio}
            rows={8}
            folder="profile"
            status={statusFor(showErrors, errors.bio)}
          />
        </FormLayout>
      </SettingsSection>
      <Divider />
      <SettingsSection title={t("profile.contact")} description={t("profile.contactDescription")}>
        <FormLayout>
          <TextInput
            label={t("profile.email")}
            type="email"
            value={email}
            onChange={setEmail}
            isRequired
            status={statusFor(showErrors, errors.email)}
          />
          <Grid gap={4} columns={2}>
            <TextInput
              label={t("profile.phone")}
              value={phone}
              onChange={setPhone}
              isOptional
              status={statusFor(showErrors, errors.phone)}
            />
            <TextInput
              label={t("profile.location")}
              value={location}
              onChange={setLocation}
              isOptional
              status={statusFor(showErrors, errors.location)}
            />
          </Grid>
          <Switch
            label={t("profile.showPhone")}
            value={showPhone}
            onChange={setShowPhone}
            labelSpacing="spread"
          />
          <Switch
            label={t("profile.openToWork")}
            value={openToWork}
            onChange={setOpenToWork}
            labelSpacing="spread"
          />
        </FormLayout>
      </SettingsSection>
      <Divider />
      <SettingsSection title={t("profile.files")} description={t("profile.filesDescription")}>
        <FormLayout>
          <MediaPicker
            label={t("profile.avatar")}
            value={avatar}
            onChange={setAvatar}
            folder="profile"
            isOptional
          />
          <MediaPicker
            label={t("profile.cv")}
            value={cv}
            onChange={setCv}
            kind="pdf"
            folder="profile"
            isOptional
          />
        </FormLayout>
      </SettingsSection>
      <HStack gap={2}>
        <Button
          label={t("common.saveChanges")}
          variant="primary"
          isLoading={save.isPending}
          onClick={handleSave}
        />
      </HStack>
    </VStack>
  );
}
