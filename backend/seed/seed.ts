/**
 * Seed the database with the recovered portfolio content.
 *
 *   npm run seed -w backend                 # upload assets to Cloudinary, then seed
 *   npm run seed -w backend -- --no-upload  # dev: serve assets from the API, no Cloudinary
 *   npm run seed -w backend -- --force      # wipe content first (keeps messages + admin account)
 */
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import {
  achievementSchema,
  activitySchema,
  experienceSchema,
  profileSchema,
  projectSchema,
  SECTION_DEFAULTS,
  skillSchema,
  socialLinkSchema,
} from "@portfolio/shared";
import { count, sql } from "drizzle-orm";
import { createDb, type Executor } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import * as t from "../src/db/schema.js";
import { hasCloudinary, loadEnv } from "../src/env.js";
import { createCloudinaryStorage } from "../src/lib/cloudinary.js";
import { imageSize } from "../src/lib/file-type.js";
import { ensureSections } from "../src/modules/sections/service.js";
import * as data from "./data.js";
import { scannedProjects } from "./scanned/projects.js";
import { scannedSkills } from "./scanned/skills.js";
import { describeError } from "../src/lib/errors.js";

const ASSETS = fileURLToPath(new URL("./assets", import.meta.url));

const { values: args } = parseArgs({
  options: {
    force: { type: "boolean", default: false },
    "no-upload": { type: "boolean", default: false },
  },
});

const env = loadEnv();
const db = createDb({
  url: env.DATABASE_URL,
  ssl: env.DATABASE_SSL,
  caCert: env.DATABASE_CA_CERT || undefined,
  max: 2,
});

const CONTENT_TABLES = [
  "blog_post_media",
  "blog_posts",
  "activity_images",
  "activities",
  "achievements",
  "experiences",
  "projects",
  "skills",
  "social_links",
  "profile",
  "media",
] as const;

function extensionOf(m: data.SeedMedia): string {
  const raw = extname(m.file ?? new URL(m.remoteUrl!).pathname)
    .slice(1)
    .toLowerCase();
  return raw === "jpeg" ? "jpg" : raw;
}

const baseName = (m: data.SeedMedia) => (m.file ? m.file.replace(/\.[^.]+$/, "") : m.key);

/** Upload (or, with --no-upload, point at the local file) and return media rows to insert. */
async function resolveMedia(): Promise<(typeof t.media.$inferInsert & { key: string })[]> {
  const noUpload = args["no-upload"];
  if (!noUpload && !hasCloudinary(env)) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_* or pass --no-upload.");
  }
  const storage = noUpload
    ? null
    : createCloudinaryStorage({
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
      });

  const rows = [];
  for (const m of data.media) {
    const ext = extensionOf(m);
    const resourceType = ext === "pdf" ? ("raw" as const) : ("image" as const);
    const buf = m.file ? await readFile(join(ASSETS, m.file)) : null;
    const size = buf && resourceType === "image" ? imageSize(buf) : null;
    const base = { key: m.key, alt: m.alt, folder: m.folder, resourceType, format: ext };

    if (!storage) {
      rows.push({
        ...base,
        publicId: null,
        url: m.file
          ? `${env.PUBLIC_API_URL}/seed-assets/${encodeURIComponent(m.file)}`
          : m.remoteUrl!,
        width: size?.width ?? null,
        height: size?.height ?? null,
        bytes: buf?.length ?? null,
      });
      continue;
    }

    // Fixed public id + overwrite:false → re-running never creates duplicates.
    const stored = await storage.upload(buf ?? m.remoteUrl!, {
      folder: `${env.CLOUDINARY_FOLDER}/seed`,
      publicId: `${env.CLOUDINARY_FOLDER}/seed/${baseName(m)}`,
      resourceType,
      extension: ext,
    });
    console.log(`  uploaded ${m.key} → ${stored.url}`);
    rows.push({ ...base, ...stored });
  }
  return rows;
}

async function hasContent(): Promise<boolean> {
  const [p] = await db.select({ n: count() }).from(t.projects);
  const [m] = await db.select({ n: count() }).from(t.media);
  const [pr] = await db.select({ n: count() }).from(t.profile);
  return (p?.n ?? 0) + (m?.n ?? 0) + (pr?.n ?? 0) > 0;
}

async function resetSections(tx: Executor) {
  for (const [index, s] of SECTION_DEFAULTS.entries()) {
    await tx
      .insert(t.siteSections)
      .values({ ...s, sortOrder: index })
      .onConflictDoUpdate({
        target: t.siteSections.key,
        set: { ...s, sortOrder: index, updatedAt: new Date() },
      });
  }
}

/** Legacy skills win on name clashes; scanned ones are appended, unpublished like their projects. */
function mergeSkills() {
  const seen = new Set(data.skills.map((s) => s.name.toLowerCase()));
  const extra = scannedSkills.filter((s) => !seen.has(s.name.toLowerCase()));
  return [...data.skills, ...extra];
}

async function main() {
  await runMigrations(db);

  if ((await hasContent()) && !args.force) {
    console.log("Database already has content — nothing to do. Re-run with --force to replace it.");
    return;
  }

  console.log(
    args["no-upload"] ? "Resolving media (no upload)…" : "Uploading media to Cloudinary…",
  );
  const mediaRows = await resolveMedia();

  await db.transaction(async (tx) => {
    if (args.force) {
      await tx.execute(sql.raw(`TRUNCATE ${CONTENT_TABLES.join(", ")} RESTART IDENTITY CASCADE`));
      await resetSections(tx);
    } else {
      await ensureSections(tx);
    }

    const ids = new Map<string, number>();
    for (const { key, ...row } of mediaRows) {
      const [inserted] = await tx.insert(t.media).values(row).returning({ id: t.media.id });
      ids.set(key, inserted!.id);
    }
    const id = (key: string | undefined) => {
      if (!key) return null;
      const v = ids.get(key);
      if (v == null) throw new Error(`Unknown media key "${key}"`);
      return v;
    };

    const { avatarKey, cvKey, ...profile } = data.profile;
    await tx.insert(t.profile).values({
      id: 1,
      ...profileSchema.parse({ ...profile, avatarMediaId: id(avatarKey), cvMediaId: id(cvKey) }),
    });

    await tx
      .insert(t.socialLinks)
      .values(data.socialLinks.map((s, i) => ({ ...socialLinkSchema.parse(s), sortOrder: i })));

    await tx
      .insert(t.skills)
      .values(mergeSkills().map((s, i) => ({ ...skillSchema.parse(s), sortOrder: i })));

    // Scanned (homelab/bot) projects first — the homelab is the flagship.
    const projects = [...scannedProjects, ...data.projects];
    await tx.insert(t.projects).values(
      projects.map(({ coverKey, ...p }, i) => ({
        ...projectSchema.parse({ ...p, coverMediaId: id(coverKey) }),
        sortOrder: i,
      })),
    );

    await tx
      .insert(t.experiences)
      .values(data.experiences.map((e, i) => ({ ...experienceSchema.parse(e), sortOrder: i })));

    await tx.insert(t.achievements).values(
      data.achievements.map(({ mediaKey, ...a }, i) => ({
        ...achievementSchema.parse({ ...a, mediaId: id(mediaKey) }),
        sortOrder: i,
      })),
    );

    for (const [i, { imageKeys, ...a }] of data.activities.entries()) {
      const [activity] = await tx
        .insert(t.activities)
        .values({ ...activitySchema.parse(a), sortOrder: i })
        .returning({ id: t.activities.id });
      await tx
        .insert(t.activityImages)
        .values(
          imageKeys.map((k, j) => ({ activityId: activity!.id, mediaId: id(k)!, sortOrder: j })),
        );
    }
  });

  console.log(
    `Seeded: ${mediaRows.length} media, ${data.socialLinks.length} links, ${mergeSkills().length} skills, ` +
      `${scannedProjects.length + data.projects.length} projects, ${data.experiences.length} experiences, ` +
      `${data.achievements.length} achievements, ${data.activities.length} activities.`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(describeError(err));
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
