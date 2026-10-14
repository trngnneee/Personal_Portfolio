-- Supabase exposes the `public` schema through its Data API (PostgREST) to anyone holding the
-- project's anon key. With RLS on and no policies, the anon/authenticated roles see nothing.
-- The API connects as the table owner, which bypasses RLS (no FORCE), so the app is unaffected.
-- Harmless on plain Postgres. Every new table must get the same line (enforced by test/rls.test.ts).
ALTER TABLE "achievements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blog_post_media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "experiences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "social_links" ENABLE ROW LEVEL SECURITY;
