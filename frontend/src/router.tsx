import { lazy } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "@/components/layout/Layout";
import { RouteGate } from "@/components/layout/RouteGate";
import { ROUTES } from "@/config/routes";
import { NotFound } from "@/pages/NotFound";

// Route-level code splitting: each page is its own chunk.
const HomePage = lazy(() =>
  import("@/features/home/HomePage").then((m) => ({ default: m.HomePage })),
);
const AboutPage = lazy(() =>
  import("@/features/about/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const SkillsPage = lazy(() =>
  import("@/features/skills/SkillsPage").then((m) => ({ default: m.SkillsPage })),
);
const ProjectsPage = lazy(() =>
  import("@/features/projects/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
);
const ActivitiesPage = lazy(() =>
  import("@/features/activities/ActivitiesPage").then((m) => ({ default: m.ActivitiesPage })),
);
const BlogListPage = lazy(() =>
  import("@/features/blog/BlogListPage").then((m) => ({ default: m.BlogListPage })),
);
const BlogPostPage = lazy(() =>
  import("@/features/blog/BlogPostPage").then((m) => ({ default: m.BlogPostPage })),
);
const ContactPage = lazy(() =>
  import("@/features/contact/ContactPage").then((m) => ({ default: m.ContactPage })),
);

const gated = (route: string, page: React.ReactNode) => <RouteGate route={route}>{page}</RouteGate>;

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path={ROUTES.about} element={gated(ROUTES.about, <AboutPage />)} />
        <Route path={ROUTES.skills} element={gated(ROUTES.skills, <SkillsPage />)} />
        <Route path={ROUTES.projects} element={gated(ROUTES.projects, <ProjectsPage />)} />
        <Route path={ROUTES.activities} element={gated(ROUTES.activities, <ActivitiesPage />)} />
        <Route path={ROUTES.blog} element={gated(ROUTES.blog, <BlogListPage />)} />
        <Route path="/blog/:slug" element={gated(ROUTES.blog, <BlogPostPage />)} />
        <Route path={ROUTES.contact} element={gated(ROUTES.contact, <ContactPage />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
