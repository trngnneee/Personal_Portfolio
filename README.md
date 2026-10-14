# trngnneee — portfolio

Personal portfolio of **Dang Truong Nguyen** (Backend · Cloud · DevOps) with its own admin dashboard and API.

| App             | Path                   | Stack                                                   | Production URL                          |
| --------------- | ---------------------- | ------------------------------------------------------- | --------------------------------------- |
| Public site     | `frontend/`            | Vite · React 19 · Tailwind v4 · TanStack Query · motion | https://trngnneee.io.vn                 |
| Admin dashboard | `admin/`               | Vite · React 19 · Astryx design system · i18n (vi/en)   | https://portfolio-admin.onrender.com    |
| API             | `backend/`             | Express 5 · Drizzle · PostgreSQL · Cloudinary · JWT     | https://portfolio-api-5hvt.onrender.com |
| Shared code     | `shared/`, `markdown/` | zod schemas, API types, enums · markdown renderer       | —                                       |

Database: **Supabase Postgres** in production, Docker Postgres locally. Hosting: **Render** (`render.yaml`).
Architecture and design decisions: [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md).

---

## 1. Local development

Requirements: **Node 22** (`nvm use`), **Docker** (for Postgres).

```bash
npm ci                       # install all workspaces
npm run db:up                # Postgres 17 on localhost:5432 (docker compose)

# per-app env files (defaults work for local dev)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env

# seed the old portfolio content without touching Cloudinary (images served by the API)
npm run seed -w backend -- --no-upload

# create the admin account (prompts for a password, min 12 chars)
npm run build -w shared -w backend
npm run admin:set-password -w backend -- --email you@example.com

npm run dev                  # API :4000 · site :5173 · admin :5174 (migrations run on API start)
```

Without Cloudinary credentials the API stores uploads in `backend/data/uploads` (dev only — production refuses
to start without Cloudinary).

### Scripts (root)

| Script                              | What it does                                                |
| ----------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                       | shared (watch) + API + site + admin                         |
| `npm run build`                     | builds every package                                        |
| `npm run lint` / `npm run format`   | ESLint 9 flat config / Prettier                             |
| `npm run typecheck`                 | `tsc --noEmit` everywhere                                   |
| `npm test`                          | vitest in every package (backend needs Postgres, see below) |
| `npm run db:up` / `npm run db:down` | local Postgres via Docker Compose                           |

### Tests

Backend tests run against a real Postgres: each test file creates and drops its own database.

```bash
npm run db:up
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/postgres npm test
```

Suites: auth guard (every admin route → 401, generated from the router), lockout, token revocation, public
visibility rules, CRUD/reorder/media lifecycle, a security suite (SQL injection, path traversal, JWT forgery,
mass assignment, malicious uploads, CORS, headers), RLS on every table, plus frontend/admin UI tests.
CI (`.github/workflows/ci.yml`) runs audit → lint → typecheck → tests (Postgres service) → build.

---

## 2. Environment variables

### `backend/`

| Variable                                             | Required | Notes                                                                                                               |
| ---------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                       | ✅       | Local: `postgres://portfolio:portfolio@localhost:5432/portfolio`. Production: Supabase **Session pooler** URI       |
| `DATABASE_SSL`                                       |          | `true` for Supabase                                                                                                 |
| `DATABASE_CA_CERT`                                   |          | Supabase CA (PEM, `\n` escapes allowed) → verified TLS. Without it TLS is encrypted but unverified (warning logged) |
| `DATABASE_POOL_MAX`                                  |          | Default 10; use 5 on Supabase                                                                                       |
| `JWT_SECRET`                                         | ✅       | ≥ 32 bytes. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`                        |
| `IP_HASH_SALT`                                       | ✅       | Salt for hashing contact-form IPs                                                                                   |
| `CORS_ORIGINS`                                       | ✅       | Comma-separated: site + admin origins                                                                               |
| `PUBLIC_SITE_URL` / `PUBLIC_API_URL`                 |          | Sitemap/RSS links; dev upload URLs                                                                                  |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | prod ✅  | Media storage                                                                                                       |
| `CLOUDINARY_FOLDER`                                  |          | Default `portfolio`                                                                                                 |
| `RESEND_API_KEY` / `RESEND_FROM`                     |          | Email on new contact messages (optional)                                                                            |

### `frontend/` and `admin/` (build-time, public)

| Variable                     | App   | Notes                                       |
| ---------------------------- | ----- | ------------------------------------------- |
| `VITE_API_URL`               | both  | API origin, no trailing slash               |
| `VITE_SITE_URL`              | site  | Canonical URL (OG tags, robots.txt sitemap) |
| `VITE_PUBLIC_SITE_URL`       | admin | "View on site" links                        |
| `VITE_CLOUDINARY_CLOUD_NAME` | both  | Responsive image URLs                       |

`VITE_*` values are compiled into the JS bundle — never put secrets there.

---

## 3. Content & seed data

- `backend/seed/data.ts` — content recovered from the previous site (profile, links, skills, projects, achievements,
  activities, NewEra experience). Assets live in `backend/seed/assets/` (committed, ~8 MB; camera photos were
  downscaled to 2400 px — originals are in git history).
- `backend/seed/scanned/` — projects/skills from a read-only scan of the homelab/bot repos. **All unpublished.**
  Review [`backend/seed/scanned/REVIEW.md`](backend/seed/scanned/REVIEW.md), then publish from the admin
  (or edit the files and re-seed).
- The seed is idempotent: it stops if content exists; `--force` replaces content (keeps messages + admin account).
- With Cloudinary configured, assets upload under `<CLOUDINARY_FOLDER>/seed/<name>` with `overwrite: false`,
  so re-running never creates duplicates.

---

## 4. Production setup (you run these — nothing here is automated)

### 4.1 Supabase (database)

1. Create a project in **Southeast Asia (Singapore)** — same region as the Render services.
2. **Project Settings → Database → Connection string → Session pooler** (port 5432). Copy the URI:
   `postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
   - Use the **session** pooler: Render has no IPv6 egress and Supabase's direct host is IPv6-only.
   - Don't add `?sslmode=...`; TLS is controlled by `DATABASE_SSL` / `DATABASE_CA_CERT`.
3. _(Recommended)_ **Database settings → SSL Configuration → Download certificate**, paste the PEM into
   `DATABASE_CA_CERT` for verified TLS.
4. _(Recommended)_ **Settings → API → Data API**: disable it, or remove `public` from "Exposed schemas".
   The app never uses it. Either way, migration `0001_enable_rls` turns on RLS for every table, so the anon key
   can read nothing (`backend/test/rls.test.ts` keeps it that way for new tables).
5. Notes: free projects **pause after 7 days without activity**; daily backups depend on plan (PITR on Pro).

Migrations run automatically when the API starts (drizzle migrator, forward-only, stored in `drizzle.__drizzle_migrations`).

### 4.2 Cloudinary

Dashboard → API Keys: copy cloud name, API key and secret. Uploads go to `portfolio/<folder>`.
CV PDFs are uploaded as `raw`. **New Cloudinary accounts block PDF/ZIP delivery (HTTP 401)** — enable
Cloudinary Console → Settings → Security → **"Allow delivery of PDF and ZIP files"**, otherwise "Download CV" fails.

### 4.3 Resend (optional)

Verify the sending domain (`trngnneee.io.vn`) in Resend, create an API key, and set `RESEND_API_KEY`.
Contact messages are always stored in the DB; email is best-effort.

### 4.4 Commit and push

The rebuild replaces the old Vite app at the repo root. Review, then commit and push yourself:

```bash
git status
git add -A
git commit -m "Rebuild portfolio: API, public site and admin dashboard"
git push origin main
```

### 4.5 Render (Blueprint)

1. Render Dashboard → **New → Blueprint** → select this repo → it reads `render.yaml`
   (`portfolio-api`, `portfolio-web`, `portfolio-admin`, region Singapore — **all on the free plan**).
2. Fill the `sync: false` secrets when prompted:
   - `portfolio-api`: `DATABASE_URL` (Supabase session pooler URI), `DATABASE_CA_CERT` (optional),
     `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY` (optional).
     `JWT_SECRET` and `IP_HASH_SALT` are generated by Render.
   - `portfolio-web` and `portfolio-admin`: `VITE_CLOUDINARY_CLOUD_NAME`.
3. **Apply**. The API build runs `npm ci --include=dev` (TypeScript is a dev dependency) and starts with
   migrations; health check is `GET /healthz` (pings the DB).
4. **DNS** for `trngnneee.io.vn` (Render → each service → Settings → Custom Domains shows the exact targets):

   | Name       | Type | Value                                                                   |
   | ---------- | ---- | ----------------------------------------------------------------------- |
   | `@` (apex) | `A`  | `216.24.57.1` (or ALIAS/flattened CNAME → `portfolio-web.onrender.com`) |

   If DNS is on Cloudflare, use **DNS only** (grey cloud) until Render has issued certificates. Explicit records
   override the homelab's `*.trngnneee.io.vn` wildcard — make sure nothing else claims `@` (Render also adds `www`).
   Only the public site has a custom domain: Render allows 2 custom domains without a payment method, and the apex
   plus its automatic `www` redirect use both. The API (`https://portfolio-api-5hvt.onrender.com` — Render added the `-5hvt` suffix) and the admin
   (`https://portfolio-admin.onrender.com`) keep their Render URLs — if Render added a suffix to either hostname,
   replace it in `render.yaml` (API: `VITE_API_URL`, `PUBLIC_API_URL`, CSP, sitemap rewrite; admin: `CORS_ORIGINS`).

5. **Create the admin account and seed content — from your machine.** The free plan has no Render Shell, so these
   one-off commands connect to Supabase directly. `read -rs` keeps the secrets out of your shell history; values
   passed this way override `backend/.env`.

   ```bash
   npm ci && npm run build -w shared -w backend

   read -rs DATABASE_URL            # paste the Supabase session pooler URI, Enter
   export DATABASE_URL DATABASE_SSL=true

   # admin account (prompts for the password; also creates the tables if the API hasn't started yet)
   npm run admin:set-password -w backend -- --email <your-email>

   # content + upload of seed images to Cloudinary
   read -rs CLOUDINARY_API_SECRET   # paste, Enter
   export CLOUDINARY_CLOUD_NAME=<cloud-name> CLOUDINARY_API_KEY=<api-key> CLOUDINARY_API_SECRET
   npm run seed -w backend

   unset DATABASE_URL CLOUDINARY_API_SECRET
   ```

6. Verify:

   ```bash
   curl -s https://portfolio-api-5hvt.onrender.com/healthz          # {"ok":true,"db":"up"}
   curl -sI https://trngnneee.io.vn | grep -i content-security-policy
   curl -s https://trngnneee.io.vn/sitemap.xml | head
   ```

   Then sign in at https://portfolio-admin.onrender.com, review the scanned projects, and enable the blog if wanted.

---

## 5. Operations

| Task                     | How                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backup (JSON)            | Admin → Settings → **Export JSON** (all content, no admin account)                                                                                                       |
| Backup (SQL)             | `pg_dump "$DATABASE_URL" --no-owner --no-privileges -Fc -f portfolio-$(date +%F).dump` (session pooler URI)                                                              |
| Restore (SQL)            | `pg_restore --no-owner --clean -d "$DATABASE_URL" portfolio-YYYY-MM-DD.dump`                                                                                             |
| Roll back a deploy       | Render → service → Events → **Rollback** (migrations are forward-only: write a new migration to undo schema changes)                                                     |
| Sign out everywhere      | Admin → Settings → "Sign out of all devices" (bumps `token_version`)                                                                                                     |
| Reset the admin password | From your machine with `DATABASE_URL`/`DATABASE_SSL=true` exported (see §4.5 step 5): `npm run admin:set-password -w backend -- --email <email>` (also revokes sessions) |
| Rotate `JWT_SECRET`      | Change it in Render → redeploy; every session ends                                                                                                                       |
| Logs                     | Render → `portfolio-api` → Logs (pino JSON; `authorization`/passwords redacted)                                                                                          |

### Limits & trade-offs

- Rate limits (login 10/15 min, contact 5/15 min per IP) are **in memory per instance** — fine for one API
  instance; use a shared store if you ever scale out.
- The public site is a client-rendered SPA: link previews use the static tags in `frontend/index.html`;
  per-page `<title>`/OG tags are applied after JS runs.
- **Everything runs on free tiers.** The Render free web service sleeps after ~15 minutes without traffic; the next
  visitor waits ~30–60 s while it wakes (the site shows loading skeletons meanwhile). Free instances get ~750
  hours/month — enough for this one service. Upgrade `portfolio-api` to `plan: starter` in `render.yaml` to keep it awake.
- Supabase free projects pause after 7 days without activity (a sleeping API means fewer DB hits) — resume it from
  the Supabase dashboard, or upgrade.
