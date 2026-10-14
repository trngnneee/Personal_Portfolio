import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useRouteError,
  type RouteObject,
} from "react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { ROUTES } from "@/config/app";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { NotFoundPage } from "@/features/misc/NotFoundPage";
import { ServerErrorPage } from "@/features/misc/ServerErrorPage";
import { RouterProviders } from "./providers";

// Every page is lazy — keeps recharts, markdown and mermaid out of the initial bundle.
const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const SectionsPage = lazy(() =>
  import("@/features/sections/SectionsPage").then((m) => ({ default: m.SectionsPage })),
);
const ProfilePage = lazy(() =>
  import("@/features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SocialLinksPage = lazy(() =>
  import("@/features/social-links/SocialLinksPage").then((m) => ({ default: m.SocialLinksPage })),
);
const ProjectsPage = lazy(() =>
  import("@/features/projects/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
);
const ExperiencesPage = lazy(() =>
  import("@/features/experiences/ExperiencesPage").then((m) => ({ default: m.ExperiencesPage })),
);
const AchievementsPage = lazy(() =>
  import("@/features/achievements/AchievementsPage").then((m) => ({ default: m.AchievementsPage })),
);
const ActivitiesPage = lazy(() =>
  import("@/features/activities/ActivitiesPage").then((m) => ({ default: m.ActivitiesPage })),
);
const SkillsPage = lazy(() =>
  import("@/features/skills/SkillsPage").then((m) => ({ default: m.SkillsPage })),
);
const BlogPage = lazy(() =>
  import("@/features/blog/BlogPage").then((m) => ({ default: m.BlogPage })),
);
const BlogEditorPage = lazy(() =>
  import("@/features/blog/BlogEditorPage").then((m) => ({ default: m.BlogEditorPage })),
);
const MediaPage = lazy(() =>
  import("@/features/media/MediaPage").then((m) => ({ default: m.MediaPage })),
);
const MessagesPage = lazy(() =>
  import("@/features/messages/MessagesPage").then((m) => ({ default: m.MessagesPage })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

function PageFallback() {
  const { t } = useTranslation();
  return (
    <Center height="100%" minHeight={320}>
      <Spinner label={t("common.loadingPage")} />
    </Center>
  );
}

function RootLayout() {
  return (
    <RouterProviders>
      <Outlet />
    </RouterProviders>
  );
}

function AdminLayout() {
  return (
    <AdminShell>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
}

function RouteError() {
  const error = useRouteError();
  return (
    <ServerErrorPage
      detail={import.meta.env.DEV && error instanceof Error ? error.message : undefined}
    />
  );
}

const bare = (node: React.ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>;

// Data router (needed for useBlocker); same tree as the doc's declarative routes.
const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: ROUTES.login, element: bare(<LoginPage />) },
      { path: ROUTES.serverError, element: <ServerErrorPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
              { path: ROUTES.dashboard, element: <DashboardPage /> },
              { path: ROUTES.sections, element: <SectionsPage /> },
              { path: ROUTES.profile, element: <ProfilePage /> },
              { path: ROUTES.socialLinks, element: <SocialLinksPage /> },
              { path: ROUTES.projects, element: <ProjectsPage /> },
              { path: ROUTES.experiences, element: <ExperiencesPage /> },
              { path: ROUTES.achievements, element: <AchievementsPage /> },
              { path: ROUTES.activities, element: <ActivitiesPage /> },
              { path: ROUTES.skills, element: <SkillsPage /> },
              { path: ROUTES.blog, element: <BlogPage /> },
              { path: ROUTES.blogNew, element: <BlogEditorPage /> },
              { path: ROUTES.blogEdit, element: <BlogEditorPage /> },
              { path: ROUTES.media, element: <MediaPage /> },
              { path: ROUTES.messages, element: <MessagesPage /> },
              { path: ROUTES.settings, element: <SettingsPage /> },
              // 404 inside the shell keeps the navigation.
              { path: "*", element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
];

export function AppRouter() {
  // Created on mount (not at import) so it reads the URL current at render time.
  const [router] = useState(() => createBrowserRouter(routes));
  return <RouterProvider router={router} />;
}
