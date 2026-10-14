# PROMPT.md — Rebuild portfolio (Public site + Admin dashboard + API)

> Prompt này dành cho coding agent (Claude Code) thực thi trong repo `portfolio/`. Đọc hết trước khi viết dòng code đầu tiên. Làm theo **Phase** ở §9, xong phase nào thì báo cáo + chờ user review rồi mới sang phase tiếp theo.

---

## 0. Bối cảnh & mục tiêu

- Chủ portfolio: **Đặng Trường Nguyên** (handle `trngnneee`) — sinh viên CNTT (Software Engineering) tại VNU-HCMUS, AWS SAA-C03, hướng Backend / Cloud / DevOps.
- Repo `portfolio/` hiện đã xoá toàn bộ code cũ (Vite + React JSX, nội dung hardcode). Code cũ vẫn còn ở commit `HEAD` → dùng làm nguồn **seed data** (xem §8 và Phụ lục A).
- Nguồn seed thứ hai: workspace `../` (`/Users/trngnneee/trngnneee`) chứa các project homelab/DevOps và bot của user, chưa có trên portfolio cũ. Agent phải **quét read-only** để sinh project + skill mới (xem §8.3 và Phụ lục B). Đây là phần thể hiện năng lực DevOps rõ nhất nên cần viết kỹ.
- Viết lại thành **monorepo 3 app + 1 package dùng chung**:
  - **`frontend/`** — portfolio public, phong cách **"Cyber Terminal"** theo `../system_design_template/SYSTEM_DESIGN_PORTFOLIO.md`.
  - **`admin/`** — **admin dashboard tách riêng** (URL public riêng, có đăng nhập), xây theo `../system_design_template/SYSTEM_DESIGN_ADMIN_DASHBOARD.md` (React + Astryx design system). Cho phép **bật/tắt từng section**, chỉnh nội dung, upload ảnh, viết blog.
  - **`backend/`** — REST API: dữ liệu public + CRUD cho admin + auth.
  - **`shared/`** — zod schemas, types, enum section dùng chung.
  - **DB**: PostgreSQL (local: Docker Compose; prod: **Supabase** — user tự quản lý, không deploy DB trên Render). **Ảnh/file**: Cloudinary. **Deploy**: Render (API + 2 static site).
- **Chỉ có 1 người dùng admin** (chính user). Không làm multi-user, không RBAC. Phân quyền = tách bạch rõ public vs admin và khoá chặt mọi route admin (§5.3).

### Cách dùng 2 tài liệu thiết kế

**`SYSTEM_DESIGN_PORTFOLIO.md` → cho `frontend/`**
- **Lấy**: visual language (§1, §8 — palette `#00FF41`, mono font, `$ command` header, `TerminalHeader`, `Typewriter`, grid background, skills-terminal tương tác, motion), cấu trúc page, các pattern UI. Blog: lấy ý tưởng search/filter/tag/reader, **không** lấy parser markdown tự viết.
- **Không lấy**: "content là TS constants" (§6) — thay bằng API. Web3Forms — thay bằng BE. Vercel — thay bằng Render. Case Studies — ngoài scope.
- **Bắt buộc sửa** toàn bộ điểm yếu ở §10 và §13 của doc đó (tóm tắt ở §7.3). Không copy lại bug.

**`SYSTEM_DESIGN_ADMIN_DASHBOARD.md` → cho `admin/`**
- Doc này là **luật** của app admin: shell (§4), routing với `ROUTES` (§5), navigation từ `NAV_SECTIONS` (§6), 4 page pattern A/B/C/D (§7), token (§8–11), form validation contract (§13), `DataTable` (§14), confirm-delete (§16), state (§18), naming (§22), **Hard UI Constraints (§23)** và playbook thêm page (§24). Tuân thủ y nguyên.
- Doc mô tả bản `@astryxdesign/*` **0.1.4**; npm hiện có **0.7.0**. Dùng bản mới nhất, pin version chính xác, và **dùng `npx astryx component --list` / `npx astryx component <Name>` / `npx astryx docs tokens` làm nguồn sự thật** về API component khi lệch với doc. Ghi các chỗ lệch vào `admin/DEVIATIONS.md`.
- Component doc liệt kê là "không có" (textarea, file upload, date input…) → tìm bằng `npx astryx search` trước; chỉ khi Astryx thật sự không có mới tự viết, đặt trong `admin/src/components/common/` và ghi lý do vào `DEVIATIONS.md`.
- **Được phép lệch doc** (đã chốt, ghi vào `DEVIATIONS.md`): thay mock data bằng API thật qua **TanStack Query** (giữ nguyên quy tắc §23.19: data đi qua `features/*/api.ts` + hook, component không gọi `fetch`); validation dùng zod schema từ `shared/` **nhưng** vẫn theo đúng contract hiển thị lỗi ở §13 (lỗi derived, chỉ hiện sau submit thất bại); auth thật thay mock (§5.3); thêm test (vitest).
- i18n `en` + `vi` giữ như doc, mặc định `vi`.

---

## 1. Ràng buộc bắt buộc với agent

1. Tuân thủ global rule của user: **không** `git commit`/`push`, **không** deploy Render, **không** chạy seed/upload lên Cloudinary thật, **không** gọi API mutating ra ngoài máy local. Viết file thì được; thao tác ngoài local → in lệnh ra cho user tự chạy.
2. Không commit secret. Mọi secret qua env, có `.env.example` đầy đủ cho `backend/`, `frontend/`, `admin/`.
3. TypeScript `strict: true` ở mọi package. Không `any` trừ khi có comment giải thích.
4. Commit lockfile (`package-lock.json`). Không ignore lockfile, không ignore `**/lib/`.
5. Mọi thứ chạy được local: `npm run db:up` (Postgres trong Docker Compose) rồi `npm run dev` ở root khởi động cả 3 app.
6. Nội dung site public: **tiếng Anh**. Admin: i18n en/vi. Comment code: tiếng Anh, ngắn.
7. Khi quét workspace `../` (§8.3): **chỉ đọc**. Tuyệt đối **không mở** `../secret/`, mọi `.env*` (trừ `.env.example`), `*.key`, `*.pem`, kubeconfig, `firmware/include/config.h`, file chứa token/recovery key. Không chạy `make`/`npm`/`terraform`/`ansible`/`kubectl` hay bất kỳ lệnh nào trong các repo đó. Không đưa vào seed: IP nội bộ/NetBird (`100.x.x.x`), hostname nội bộ, project ID, tên secret path, số tài khoản/chat ID.
8. Không over-engineer: 1 admin, không bảng users, không role/permission, không 2FA, không refresh-token rotation.

---

## 2. Tech stack (đã chốt — không tự đổi)

| Layer | Lựa chọn |
|---|---|
| Monorepo | npm workspaces: `shared/`, `backend/`, `frontend/`, `admin/` |
| Node | 22 LTS (`"engines"` + `.nvmrc`) |
| Shared | zod schemas + TS types + `SECTION_KEYS` dùng chung |
| BE | Express 5 + TypeScript, `tsx` (dev), `tsc` (build) |
| DB | **PostgreSQL 17** qua `pg` (node-postgres, `Pool`), **Drizzle** (`drizzle-orm` + `drizzle-kit` migrations). `timestamptz`, `jsonb` cho mảng, identity PK. Local: `docker-compose.yml` (`postgres:17-alpine`). Prod: **Supabase** (session pooler, TLS, RLS bật trên mọi bảng) |
| Upload | `multer` (memoryStorage, giới hạn size/mime) → `cloudinary` v2 `upload_stream` |
| Auth | Password hash **argon2id** (`@node-rs/argon2`, có prebuilt binary). JWT HS256 (`jose`) |
| Bảo mật BE | `helmet`, `cors` allowlist (`CORS_ORIGINS`), `express-rate-limit`, body limit |
| Logging | `pino` + `pino-http` (pretty ở dev; redact `authorization`, `password`) |
| Public FE | Vite + React 19 + TS, react-router v7, **TanStack Query**, Tailwind CSS v4 (`@theme` tokens), `motion`, `lucide-react`, `react-hook-form` + zod, `sonner`, `react-markdown` + `remark-gfm` + `rehype-sanitize` + `rehype-highlight` |
| Admin | Vite + React 19 + TS, `@astryxdesign/core` + `@astryxdesign/theme-neutral` + `@astryxdesign/cli` (pin version), react-router v7, `@heroicons/react`, `i18next` + `react-i18next`, `recharts` (dashboard), Tailwind v4 chỉ làm escape hatch (không preflight), **TanStack Query**. Markdown editor: textarea của Astryx (nếu có) + tab preview dùng cùng renderer với public FE |
| Test | `vitest` ở mọi package; BE dùng `supertest` + Postgres thật (`TEST_DATABASE_URL`): mỗi file test tạo 1 database tạm, `TRUNCATE` trước mỗi test, drop khi xong. CI dùng service container `postgres:17-alpine` |
| Lint/format | ESLint 9 flat config (`typescript-eslint`, react-hooks, react-refresh) + Prettier, khai báo đủ devDependencies |
| CI | `.github/workflows/ci.yml`: `npm ci` → lint → typecheck → test → build (chỉ viết file, không trigger) |
| Deploy | Render Blueprint `render.yaml` (§6) |

---

## 3. Cấu trúc thư mục

```
portfolio/
├── package.json              # workspaces + scripts: dev (concurrently 3 app), build, lint, typecheck, test
├── .nvmrc  .gitignore  .editorconfig  .prettierrc
├── render.yaml
├── docker-compose.yml        # Postgres cho dev local
├── PROMPT.md  README.md      # README: setup local, env, seed, deploy (lệnh để user tự chạy)
├── docs/SYSTEM_DESIGN.md     # viết SAU khi build xong, mô tả hệ thống mới
├── .github/workflows/ci.yml
├── shared/src/{schemas/*.ts, sections.ts, types.ts, index.ts}
├── markdown/src/            # @portfolio/markdown — renderer dùng chung cho public FE + admin preview (source-only)
├── backend/
│   ├── src/
│   │   ├── index.ts          # bootstrap: env → db → migrate → listen
│   │   ├── app.ts            # express app (export để test)
│   │   ├── env.ts            # zod parse env, fail fast
│   │   ├── db/{client.ts, schema.ts, migrate.ts}
│   │   ├── modules/<resource>/{public.router.ts?, admin.router.ts, service.ts}
│   │   │     # auth, profile, sections, projects, experiences, achievements,
│   │   │     # activities, skills, social-links, blog, media, messages, system
│   │   ├── middleware/{require-auth.ts, require-section.ts, error.ts, validate.ts, rate-limit.ts}
│   │   └── lib/{cloudinary.ts, jwt.ts, password.ts, slug.ts, logger.ts}
│   ├── scripts/set-admin-password.ts
│   ├── drizzle/              # migrations (commit vào repo)
│   ├── seed/{assets/, scanned/, data.ts, seed.ts}
│   └── test/
├── frontend/                 # public site
│   ├── index.html  public/{favicon.svg, og.png, robots.txt}
│   └── src/{main.tsx, App.tsx, router.tsx, styles/index.css,
│            lib/{api.ts, cloudinary.ts, query-client.ts, markdown.tsx},
│            config/routes.ts, components/{layout,terminal,ui}/,
│            features/{home,about,skills,projects,activities,blog,contact}/, pages/NotFound.tsx}
└── admin/                    # admin dashboard — cấu trúc theo §3 doc admin
    ├── DEVIATIONS.md
    └── src/{main.tsx, App.tsx, app/, config/{app.ts,navigation.ts}, components/{layout,common}/,
             features/{auth,dashboard,sections,profile,projects,experiences,achievements,
                       activities,skills,social-links,blog,media,messages,settings,misc}/,
             i18n/, lib/{api.ts, format.ts, router-link.tsx, cloudinary.ts}, styles/tailwind.css}
```

---

## 4. Data model (PostgreSQL / Drizzle)

Quy ước: `id integer GENERATED ALWAYS AS IDENTITY`, `created_at`/`updated_at` (`timestamptz`, API trả ISO string), `sort_order integer` cho list sắp xếp được, `published boolean DEFAULT true` cho nội dung public. Mảng nhỏ lưu `jsonb`, validate bằng zod. Enum lưu `text` (zod chặn giá trị).

| Bảng | Cột chính |
|---|---|
| `admin_account` *(singleton id=1)* | `email`, `password_hash` (argon2id), `token_version` (int, tăng để thu hồi mọi phiên), `failed_attempts`, `locked_until`, `last_login_at`, `password_changed_at` |
| `site_sections` | `key` (PK, enum cố định — xem dưới), `enabled`, `nav_label`, `heading`, `subheading`, `sort_order` (thứ tự trên nav + home), `updated_at` |
| `media` | `public_id` (nullable), `url`, `resource_type` (`image`/`raw`), `format`, `width`, `height`, `bytes`, `alt`, `folder` |
| `profile` *(singleton id=1)* | `full_name`, `handle`, `headline`, `typewriter_lines` (JSON), `bio` (md), `location`, `email`, `phone`, `show_phone`, `open_to_work`, `avatar_media_id`, `cv_media_id` |
| `social_links` | `platform` (`github`/`gitlab`/`linkedin`/`facebook`/`instagram`/`x`/`email`/`other`), `label`, `url`, `sort_order`, `visible` |
| `skills` | `name`, `category` (`languages`/`frontend`/`backend`/`database`/`cloud_devops`/`infrastructure`/`other`), `icon_url`, `level` (0–100, nullable), `sort_order`, `published` |
| `projects` | `slug` (unique), `title`, `subtitle`, `summary`, `description` (md), `highlights` (JSON), `role`, `category` (`homelab`/`cloud`/`bot`/`iot`/`fullstack`/`ai`/`game`/`other`), `tech_stack` (JSON), `repo_url`, `repo_visibility` (`public`/`private`), `demo_url`, `cover_media_id`, `featured`, `start_date`, `end_date`, `sort_order`, `published` |
| `experiences` | `company`, `company_url`, `logo_media_id`, `position`, `employment_type` (`full_time`/`part_time`/`internship`/`freelance`/`contract`), `location`, `start_date`, `end_date` (null = present), `description` (md), `highlights` (JSON), `tech_stack` (JSON), `sort_order`, `published` |
| `achievements` | `type` (`education`/`certification`/`award`), `title`, `issuer`, `period_label`, `date`, `description`, `accent_color`, `credential_url`, `media_id`, `sort_order`, `published` |
| `activities` + `activity_images` | `title`, `organization`, `location`, `role`, `description`, `period_label`, `date`, `sort_order`, `published`; ảnh: `activity_id` (cascade), `media_id`, `sort_order` |
| `blog_posts` | `slug` (unique), `title`, `excerpt`, `content` (md), `cover_media_id`, `tags` (JSON), `status` (`draft`/`published`), `published_at`, `reading_minutes` (tính khi lưu), `featured` |
| `contact_messages` | `name`, `email`, `subject`, `service`, `message`, `status` (`new`/`read`/`archived`), `ip_hash` (sha256 + salt), `user_agent`, `created_at` |

### Sections (cố định — không thêm/xoá qua admin)

`SECTION_KEYS` trong `shared/sections.ts` — admin chỉ bật/tắt, đổi nhãn/tiêu đề, sắp thứ tự:

| key | Route public | Mặc định | Ghi chú |
|---|---|---|---|
| `hero` | `/` | bật, **khoá** (không tắt được) | |
| `about` | `/about` | bật | bio |
| `experience` | `/about` (block) | bật | tự ẩn nếu không có bản ghi published |
| `achievements` | `/about` (block) | bật | education / certification / award |
| `skills` | `/skills` | bật | |
| `projects` | `/projects` | bật | |
| `activities` | `/activities` | bật | |
| `blog` | `/blog`, `/blog/:slug` | **tắt** | option mới |
| `contact` | `/contact` | bật | tắt → form contact cũng bị BE từ chối |

Route `/about` hiển thị khi ít nhất 1 trong `about`/`experience`/`achievements` bật.

Quy tắc media: khi entity đổi/xoá ảnh → xoá `media` mồ côi **và** `cloudinary.uploader.destroy(public_id)` (bỏ qua nếu `public_id` null). Ảnh chèn trong markdown blog được track bằng cách parse URL Cloudinary trong `content` khi lưu. Có test với Cloudinary client được mock.

---

## 5. API

Prefix `/api/v1`. Lỗi thống nhất: `{ error: { code, message, details? } }`. Validate mọi input bằng zod (`400`). `404` cho id không tồn tại.

### 5.1 Public (không auth)
| Method | Path | Ghi chú |
|---|---|---|
| GET | `/healthz` (không prefix) | `{ ok, db: 'up' }` cho Render health check |
| GET | `/api/v1/public/site` | 1 call: `sections` (chỉ bản enabled, đã sort, kèm label/heading), `profile`, `socialLinks`, và data của **section đang bật** (`skills`, `projects`, `experiences`, `achievements`, `activities` kèm `images`, `blog.latest` 3 bài nếu blog bật). Section tắt → **không trả data** của nó. `stats` derive từ data (không hardcode). `Cache-Control: public, max-age=60, stale-while-revalidate=600` + `ETag` |
| GET | `/api/v1/public/blog?tag=&q=&page=` | chỉ `status=published`, phân trang 10; `404` nếu section blog tắt |
| GET | `/api/v1/public/blog/:slug` | `404` nếu bài là draft hoặc blog tắt |
| GET | `/api/v1/public/blog/rss.xml` | RSS 2.0; `404` nếu blog tắt |
| POST | `/api/v1/public/contact` | zod (name 2–60, email, subject 3–120, service enum, message 10–2000) + honeypot `website` rỗng + rate limit 5 req/15 phút/IP. `404` nếu section contact tắt. Lưu DB; nếu có `RESEND_API_KEY` thì gửi email báo về `profile.email` |

Middleware `requireSection(key)` dùng chung cho các route public gắn với section.

### 5.2 Admin (tất cả qua `requireAuth`)
| Method | Path |
|---|---|
| POST | `/api/v1/admin/auth/login` · POST `/auth/logout` · GET `/auth/me` · POST `/auth/change-password` · POST `/auth/logout-all` |
| GET/PATCH | `/api/v1/admin/sections` (PATCH 1 section: `enabled`, `nav_label`, `heading`, `subheading`) · PATCH `/sections/reorder` |
| GET/PUT | `/api/v1/admin/profile` |
| GET/POST, GET/PATCH/DELETE `/:id` | `/api/v1/admin/{projects,experiences,achievements,activities,skills,social-links,blog}` (thấy cả bản chưa publish) |
| PATCH | `/api/v1/admin/<resource>/reorder` body `{ ids: number[] }` (1 transaction) |
| POST | `/api/v1/admin/blog/:id/publish` · `/unpublish` |
| POST/DELETE/PATCH | `/api/v1/admin/activities/:id/images[/:mediaId]` (gắn, gỡ, reorder) |
| GET/POST | `/api/v1/admin/media` (list có phân trang; upload multipart `file`, `alt`, `folder`) — ảnh jpg/png/webp/avif ≤ 8MB; CV pdf ≤ 10MB với `resource_type: 'raw'` *(Cloudinary chặn delivery PDF dạng image trên account mới)*. Kiểm tra magic bytes, không tin `Content-Type` |
| PATCH/DELETE | `/api/v1/admin/media/:id` (sửa `alt`; xoá → `409` nếu đang được tham chiếu) |
| GET/PATCH/DELETE | `/api/v1/admin/messages[?status=]`, `/:id` |
| GET | `/api/v1/admin/dashboard` (số liệu cho trang Overview: đếm theo resource, tin nhắn mới, bài draft, section đang tắt) |
| GET | `/api/v1/admin/export` → dump JSON toàn bộ DB (trừ `admin_account`) |

### 5.3 Auth & phân quyền (1 admin — đủ dùng, không hơn)
- **Tài khoản**: không có đăng ký. Tạo/đặt lại bằng CLI chạy trên server: `npm run admin:set-password -w backend -- --email <email>` (prompt ẩn nhập password, min 12 ký tự, upsert `admin_account` id=1, tăng `token_version`). Không để password trong env.
- **Login**: `POST /auth/login` → so khớp argon2 (luôn hash dummy khi email sai để thời gian phản hồi đều) → trả `{ token, expiresAt }`. Thông báo lỗi chung chung `Invalid credentials`.
- **Chống brute force**: rate limit 10 req/15 phút/IP cho login; sau 5 lần sai liên tiếp → khoá `locked_until = now + 15 phút` (`423`); login đúng → reset bộ đếm.
- **Token**: JWT HS256 (`JWT_SECRET` ≥ 32 byte), claims `{ sub: 'admin', tv: token_version, iat, exp }`, hạn **8 giờ**, gửi qua `Authorization: Bearer`. Admin lưu token trong `sessionStorage`. *(Không dùng cookie vì admin và API khác site trên `*.onrender.com` → không cần xử lý CSRF.)*
- **`requireAuth` middleware**: verify chữ ký + `exp` + `tv === admin_account.token_version` → `401` nếu sai. Mount **một lần** trên router `/api/v1/admin` (trừ `/auth/login`), không gắn lẻ từng route để tránh quên.
- **Thu hồi phiên**: `logout-all` và `change-password` (yêu cầu password cũ) đều tăng `token_version` → mọi token cũ chết ngay. `logout` chỉ xoá token phía client.
- **Phân quyền** = hai vùng tách bạch:
  1. `/public/*` chỉ đọc dữ liệu `published` + section bật, không bao giờ trả field nội bộ (`ip_hash`, draft, media chưa dùng…). Dùng **DTO mapper riêng cho public**, không trả thẳng row DB.
  2. `/admin/*` toàn quyền nhưng bắt buộc qua `requireAuth`.
- **Test bắt buộc**: duyệt toàn bộ route table của router admin, gọi mỗi route không token → phải `401` (test tự sinh từ danh sách route để route mới không lọt). Thêm test: token sai chữ ký, token hết hạn, token cũ sau `logout-all`, lockout sau 5 lần sai.
- **Admin FE**: `ProtectedRoute` như doc §5 (redirect `/login` + nhớ `from`); interceptor: response `401` → xoá token, toast "Session expired", về `/login`. Trang Settings: đổi mật khẩu, "Đăng xuất mọi thiết bị".

---

## 6. Hạ tầng & deploy (Render)

`render.yaml` gồm 3 service (DB là Supabase, ngoài blueprint):
1. **Database: Supabase** (không nằm trong blueprint). API kết nối bằng **Session pooler** URI (IPv4 — Render không có IPv6 egress, direct connection của Supabase chỉ có IPv6), `DATABASE_SSL=true`, tùy chọn `DATABASE_CA_CERT` (PEM CA của Supabase) để verify TLS. Bắt buộc **bật RLS trên mọi bảng `public`** (migration `0001_enable_rls` + test) vì Supabase Data API (PostgREST) phơi schema `public` cho anon key; API dùng role owner nên bypass RLS.
2. **`portfolio-api`** — Web Service, runtime `node`, plan **starter** (free plan bị sleep khi idle).
   - `buildCommand: npm ci --include=dev && npm run build -w shared -w backend` (`--include=dev` vì `NODE_ENV=production` sẽ bỏ qua `typescript`)
   - `startCommand: npm run start -w backend` (chạy migrations rồi listen `PORT`)
   - `healthCheckPath: /healthz`
   - `DATABASE_URL` (`sync: false`, Supabase session pooler URI), `DATABASE_SSL=true`, `DATABASE_CA_CERT` (`sync: false`, optional), `DATABASE_POOL_MAX=5`
   - envVars: `NODE_ENV=production`, `DATABASE_URL`, `CORS_ORIGINS` (URL của web + admin), `JWT_SECRET` (`generateValue: true`), `IP_HASH_SALT` (`generateValue: true`); `sync: false`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (mặc định `portfolio`), `RESEND_API_KEY` (optional).
3. **`portfolio-web`** — Static Site (`frontend/dist`).
   - `buildCommand: npm ci && npm run build -w shared -w frontend`
   - rewrite `/*` → `/index.html`; headers: `/assets/*` cache 1 năm immutable; `/*` → `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, CSP (`connect-src` API, `img-src` `res.cloudinary.com`).
   - envVars: `VITE_API_URL`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_SITE_URL`.
4. **`portfolio-admin`** — Static Site (`admin/dist`), URL riêng (vd. `admin.<domain>`).
   - `buildCommand: npm ci && npm run build -w shared -w admin`
   - rewrite `/*` → `/index.html`; headers như trên + `X-Robots-Tag: noindex, nofollow`; CSP chặt hơn (`frame-ancestors 'none'`).
   - envVars: `VITE_API_URL`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_PUBLIC_SITE_URL` (nút "View on site").

**Lưu ý phải ghi vào README:**
- API không còn disk → **có zero-downtime deploy** và có thể scale ngang (rate limit đang in-memory theo instance — ghi chú nếu scale > 1).
- Supabase **free project bị pause sau 7 ngày không hoạt động** → ghi rõ trong README (traffic thật hoặc plan Pro).
- Backup: Supabase daily backup theo plan (PITR ở Pro) + nút Export JSON trong admin + lệnh `pg_dump` (in ra cho user tự chạy).
- Migration chạy tự động khi API khởi động (drizzle migrator, idempotent).
- Tạo tài khoản admin lần đầu: mở **Render Shell** của `portfolio-api` → `npm run admin:set-password -w backend -- --email <email>`.
- Sitemap: BE sinh `GET /sitemap.xml` (gồm bài blog published + route của section đang bật); static site rewrite `/sitemap.xml` → API.
- Mọi bước deploy **in ra cho user tự làm**, agent không thực hiện.

---

## 7. Frontend

### 7.1 Public site (`frontend/`)
Nav, route và thứ tự đều **sinh từ `sections`** trả về từ API. Section tắt → không có trên nav, route trả trang NotFound.

| Route | Nội dung |
|---|---|
| `/` | Hero `$ whoami` + Typewriter (`profile.typewriter_lines`), avatar, headline, CTA (View projects / Contact / Download CV — CTA nào trỏ tới section tắt thì ẩn), stats derive từ API, featured projects, top skills, 3 bài blog mới nhất (nếu blog bật) |
| `/about` | Bio (md), **Work Experience** timeline, **Education & Certifications & Awards** timeline (giữ `accent_color` + ảnh mở rộng như site cũ) — từng block theo section tương ứng |
| `/skills` | Skill cards theo category + **skills-terminal** (`help`, `ls`, `cat <category>`, `whoami`, `clear`) — build từ data |
| `/projects` | Grid lọc theo category (tab sinh từ data); card: cover Cloudinary, title/subtitle, role, tech badges, highlights, Repo/Live (ẩn nếu rỗng; `private` → badge `private repo`, không link). Không có cover → fallback terminal (`$ tree <slug>` + tech stack). Click → modal/panel hiển thị `description` md |
| `/activities` | Activities + gallery ảnh (lightbox có focus trap + Esc) |
| `/blog` | List: search, lọc tag, phân trang, featured; style terminal (`$ ls ~/blog`) |
| `/blog/:slug` | Bài viết: markdown render chuẩn (code block nhiều dòng + syntax highlight, bảng, ảnh Cloudinary responsive), mục lục từ heading, reading time, tag, bài trước/sau. `<title>`/OG riêng mỗi bài |
| `/contact` | Form (react-hook-form + zod `shared/`) → POST BE; honeypot; email copy, phone nếu `show_phone`, social links |
| `*` | NotFound kiểu terminal (`command not found`) |

### 7.2 Admin dashboard (`admin/`)
Tuân thủ doc admin. Route map (mọi path trong `ROUTES`, mọi nav item trong `NAV_SECTIONS`):

| Nav section | Route | Page pattern (doc §7) | Nội dung |
|---|---|---|---|
| — | `/login` | D | Email + password; hiển thị lỗi lockout |
| Overview | `/dashboard` | B | `StatCard`: số project/bài viết/tin nhắn mới/section đang tắt; danh sách tin nhắn mới nhất; bài draft; nút "View site" |
| Site | `/sections` | C (narrow) | Mỗi section 1 `SettingsSection`: `Switch` bật/tắt (hero bị khoá), `nav_label`, `heading`, `subheading`; nút lên/xuống đổi thứ tự. Lưu từng section, toast |
| Site | `/profile` | C | Form profile + upload avatar + upload CV + typewriter lines |
| Site | `/social-links` | A | |
| Content | `/projects`, `/experiences`, `/achievements`, `/activities`, `/skills` | A | List + `<X>FormDialog`; cột published dùng `StatusLabel`; reorder; activities có quản lý nhiều ảnh |
| Content | `/blog` + `/blog/new` + `/blog/:id` | A (list) + trang editor | Editor: title, slug (auto từ title, sửa được), excerpt, tags, cover, nội dung md với tab Write/Preview (preview dùng cùng renderer với public FE — đặt renderer ở `shared/` hoặc package con), nút chèn ảnh (upload → chèn `![alt](url)` tại con trỏ), Save draft / Publish / Unpublish, cảnh báo khi rời trang chưa lưu. Nếu section blog đang tắt → banner nhắc bật ở `/sections` |
| Library | `/media` | A | Thư viện ảnh: lưới thumbnail, sửa alt, xoá (bị chặn nếu đang dùng), copy URL |
| Inbox | `/messages` | A | Lọc status, xem chi tiết (Dialog), mark read/archive/xoá; badge số tin `new` ở nav |
| System | `/settings` | C | Đổi mật khẩu, đăng xuất mọi thiết bị, Export JSON, theme, ngôn ngữ |

- Component dùng chung tự viết (nếu Astryx không có): `MediaPicker` (chọn từ thư viện hoặc upload mới, preview, alt), `MarkdownEditor`. Đặt ở `components/common/`, ghi `DEVIATIONS.md`.
- Mỗi mutation: toast (doc §23.12) + `invalidateQueries` key admin tương ứng. Xoá luôn qua `useImperativeAlertDialog` (doc §23.11).

### 7.3 Yêu cầu chất lượng public site (sửa điểm yếu §10/§13 doc portfolio)
- **1 hệ token duy nhất** trong `@theme` (`primary` 50–900 đủ cả 400; `accent`; `neutral`; `bg-page/surface/elevated`; shadow `glow`). Không dùng raw palette `green-400`/`gray-800`.
- Contrast text đạt WCAG AA trên nền đen.
- Route-level `React.lazy` + `Suspense`; skeleton loading **thật** khi fetch; error state có retry.
- `<MotionConfig reducedMotion="user">`; Typewriter tôn trọng `prefers-reduced-motion`.
- ErrorBoundary: fallback thân thiện ở prod, stack chỉ ở dev.
- A11y: `htmlFor`/`id`, `aria-invalid` + `aria-describedby`, `aria-live` cho terminal output và trạng thái form, dialog có `role="dialog"` + focus trap + Esc, skip link, `aria-current` trên nav.
- Ảnh: helper `cld(publicId | url, { w, h })` → `f_auto,q_auto,w_…` + `srcset`; mọi `<img>` có `alt`, `width`/`height`, `loading="lazy"` (trừ hero), `decoding="async"`.
- SEO: `<title>`/`<meta>` native React 19 mỗi route (và mỗi bài blog); OG/Twitter card; `robots.txt`; sitemap từ BE; JSON-LD `Person` (+ `BlogPosting` cho bài viết).
- Fonts: `preconnect` + `<link>` trong `index.html`.
- Internal link dùng `<Link>`; Navbar mobile dùng `AnimatePresence`.
- Không dependency thừa, không code chết.

---

## 8. Seed data

### 8.1 Khôi phục ảnh cũ (chạy local, an toàn)
Ảnh/CV của site cũ đã bị xoá khỏi working tree nhưng còn trong commit `HEAD`. Lấy ra **không** cần restore `public/`:
```bash
mkdir -p backend/seed/assets
git archive HEAD public | tar -x -C backend/seed/assets --strip-components=1
```
Danh sách file: `tn.jpg` (avatar), `cv.pdf`, `aws_serverless.png`, `airforce.png`, `mario.jpg`, `aws.png`, `ielts.jpg`, `degree.JPG`, `hbkk.png`, `vng.jpg`, `datastorm.JPG`, `BCYT.JPG`, `BCYT2026-1037.JPG`, `BenTre.jpg`, `BenTre2.jpg`, `serverless_task_dashboard.png`, `touristbooking.png` (2 file cuối chưa được dùng — upload vào media library để admin dùng sau).

> Lưu ý mapping: code cũ tham chiếu `/BCYT2.JPG` nhưng file thật là `BCYT2026-1037.JPG`; `airforce.png` và `hbkk.png` bị thiếu `/` ở đầu. Seed dùng tên file thật.

Có nên commit `backend/seed/assets/` không? **Có** (≈ vài MB, là nguồn seed duy nhất ngoài git history). Thêm vào README.

### 8.2 Script `npm run seed -w backend`
- Idempotent: nếu DB đã có dữ liệu thì dừng, trừ khi có `--force` (xoá nội dung rồi seed lại; không động vào `contact_messages` và `admin_account`).
- Luôn upsert đủ 9 dòng `site_sections` theo bảng §4 (blog `enabled = false`). Không seed bài blog nào.
- Seed **không** tạo tài khoản admin. Dev local: `npm run admin:set-password -w backend -- --email dev@local` (agent được chạy trên DB local).
- Ảnh local → upload Cloudinary với `public_id` cố định `${CLOUDINARY_FOLDER}/seed/<tên-file-không-đuôi>`, `overwrite: false` → chạy lại không tạo bản trùng. CV upload `resource_type: 'raw'`.
- Ảnh đang là URL Cloudinary/remote trong code cũ → upload từ URL (Cloudinary hỗ trợ remote URL) để mọi media nằm chung folder.
- Flag `--no-upload` (dùng cho dev local và cho agent kiểm thử): không gọi Cloudinary; `media.url` trỏ tới `http://localhost:<PORT>/seed-assets/<file>` (BE chỉ serve thư mục này khi `NODE_ENV !== 'production'`), `public_id = null`.
- **Agent chỉ được chạy `--no-upload` trên Postgres local (Docker).** Chạy seed thật (upload lên Cloudinary của user) hoặc seed vào Supabase → in lệnh cho user tự chạy.

### 8.3 Quét workspace `../` để sinh project homelab + bot

Mục tiêu: biến các repo homelab/bot của user thành project + skill trên portfolio. Danh sách repo và gợi ý gom nhóm ở **Phụ lục B**.

**Nguồn được đọc** (theo thứ tự ưu tiên, dừng khi đủ thông tin):
`README.md`, `SYSTEM_DESIGN.md`, `BOOTSTRAP.md`, `PROMPT.md`, `docs/**/*.md`, sơ đồ trong `docs/` (`*.png`/`*.svg`/`*.mmd`/`*.drawio`), file manifest dependency (`package.json`, `pyproject.toml`, `go.mod`, `platformio.ini`), `Dockerfile`, `.gitlab-ci.yml`, `Chart.yaml`/`values.yaml`/`kustomization.yaml`, `*.tf` (chỉ khai báo provider/resource type, không lấy giá trị). Ràng buộc ở §1 mục 7 áp dụng tuyệt đối.

**Trích xuất cho mỗi project:**
- `title`, `summary` (1–2 câu, ngôn ngữ tuyển dụng, tiếng Anh), `description` (markdown: Problem → Architecture → How it works → What I learned; được dùng sơ đồ mermaid dạng code block), `highlights` (3–6 ý định lượng/cụ thể, vd. "42 MCP tools", "zero-touch deploy: push → build → bump tag → Argo CD rollout").
- `tech_stack` (chỉ công nghệ thật sự có trong code/manifest, kèm version chính nếu có).
- `repo_url`: lấy từ `git -C <repo> remote get-url origin` (đổi SSH → HTTPS `https://gitlab.com/...`), `repo_visibility` mặc định `private` cho đến khi user xác nhận.
- `category`, `role` (mặc định `Solo — design, build, operate`), `start_date`/`end_date` ước lượng từ `git -C <repo> log --reverse --format=%ad --date=short | head -1` và commit cuối (git log là read-only, được phép).
- Cover: nếu repo có sơ đồ/ảnh trong `docs/` thì đề xuất làm cover (copy vào `backend/seed/assets/scanned/<slug>/`); không có thì để `null` (FE dùng fallback terminal).
- Skill mới phát hiện được (Kubernetes, Argo CD, Terraform, Ansible…) → thêm vào `skills` với category phù hợp, không trùng tên với skill đã có.

**Output trước khi seed (bắt buộc dừng chờ review):**
1. `backend/seed/scanned/REVIEW.md` — bảng từng project: nguồn đã đọc, nội dung đề xuất, các chỗ **không chắc chắn**, các chi tiết đã cố ý loại bỏ vì nhạy cảm.
2. `backend/seed/scanned/projects.ts` + `skills.ts` — dữ liệu typed theo zod schema ở `shared/`, `published: false` cho mọi project quét được.
3. `seed.ts` nạp thêm 2 file trên. Sau khi user duyệt `REVIEW.md`, user (hoặc agent theo yêu cầu rõ ràng) đổi `published: true` / sửa nội dung, rồi chạy lại seed.

---

## 9. Kế hoạch thực thi (theo phase)

Mỗi phase kết thúc bằng: `npm run lint && npm run typecheck && npm test` xanh + tóm tắt thay đổi + **dừng chờ user review**.

| Phase | Việc | Definition of done |
|---|---|---|
| 1. Scaffold | Root workspaces, `shared/`, `backend/`, `frontend/`, `admin/` skeleton (admin cài Astryx, chạy `npx astryx component --list` để nắm vocabulary), ESLint/Prettier/TS config, `.env.example`, `.gitignore`, `.nvmrc`, `docker-compose.yml` (Postgres), CI workflow | `npm run db:up && npm run dev` lên được web (5173) + admin (5174) + API (4000) trống |
| 2. Backend core | Drizzle schema + migration, env, error/validate middleware, **auth §5.3**, `requireSection`, toàn bộ route §5, Cloudinary wrapper (mock được), `admin:set-password` | Test supertest: mọi route admin không token → 401 (tự sinh), lockout, token cũ sau `logout-all` → 401; public site ẩn data section tắt; blog draft → 404; contact (validate + honeypot + rate limit + section tắt → 404); CRUD 1 resource; reorder; xoá media đang dùng → 409 |
| 3a. Seed cũ | Khôi phục assets (§8.1), `seed/data.ts` từ Phụ lục A, `seed.ts` | Trên Postgres local (Docker): `npm run seed -w backend -- --no-upload` → `GET /public/site` trả đúng dữ liệu cũ |
| 3b. Quét workspace | Quét read-only theo §8.3 + Phụ lục B, sinh `REVIEW.md`, `projects.ts`, `skills.ts` | `REVIEW.md` đủ mọi repo trong Phụ lục B; `grep -rE '100\.[0-9]+\.[0-9]+\.[0-9]+\|token\|password\|secret' backend/seed/scanned` không ra giá trị nhạy cảm; **dừng chờ user duyệt** |
| 4. Public FE | Tokens, layout, terminal components, các route §7.1 sinh từ `sections`, blog list + reader, NotFound | Nội dung site cũ hiển thị từ API; tắt 1 section trong DB → biến mất khỏi nav và route 404; bài blog có code block nhiều dòng render đúng; Lighthouse local a11y ≥ 95, SEO ≥ 95; không lỗi console |
| 5. Admin dashboard | Shell + i18n + auth theo doc admin, toàn bộ route §7.2, `MediaPicker`, `MarkdownEditor`, `DEVIATIONS.md` | Đăng nhập → bật section blog → viết + publish 1 bài có ảnh → bài xuất hiện ở public `/blog`; tắt `activities` → public ẩn; đổi mật khẩu → token cũ bị đá ra `/login`; checklist §24 Step 10 của doc admin pass cho mọi page |
| 6. Deploy config & docs | `render.yaml` (3 service), headers/CSP, sitemap, README (setup, env, seed, tạo admin, deploy step-by-step cho user), `docs/SYSTEM_DESIGN.md` mới | `npm run build` ở root pass; README đủ lệnh để user tự deploy |

---

## 10. Những điểm agent phải hỏi user thay vì tự đoán

- Nội dung **Work Experience**: site cũ không có dữ liệu này → seed rỗng, FE ẩn section; hỏi user có muốn bổ sung không.
- Có hiển thị số điện thoại công khai không (seed `show_phone = true` như site cũ).
- Domain custom (ảnh hưởng `CORS_ORIGINS`, `sitemap.xml`, OG URL).
- Có dùng Resend để nhận email khi có contact message không.
- Với project quét từ workspace: repo GitLab nào public, project nào được publish, có được nhắc domain `*.trngnneee.io.vn` (vd. trang camera nhà `cam.trngnneee.io.vn`) hay chỉ mô tả chung.
- Có nên đặt project homelab làm project nổi bật đầu tiên (featured #1) thay cho AWS Serverless không.
- Có dùng custom domain cho admin/API không (vd. `admin.trngnneee.io.vn`, `api.trngnneee.io.vn`) hay giữ `*.onrender.com`.

---

## Phụ lục A — Seed data (trích từ code cũ ở `HEAD`)

### Profile
- `full_name`: Dang Truong Nguyen · `handle`: trngnneee · `location`: Ho Chi Minh City, Vietnam
- `headline`: Backend · Cloud · DevOps Engineer
- `typewriter_lines`: `["Hey there! 👋", "I'm Dang Truong Nguyen 💻"]`
- `bio`: "Information Technology student majoring in Software Engineering at VNU - University of Science, Ho Chi Minh City. AWS Certified Solutions Architect – Associate (SAA-C03) with a GPA of 8.92/10 and IELTS 6.5. Interested in Backend Engineering, Cloud Architecture, DevOps, and AI-powered Applications. Currently learning advanced System Design, AWS Cloud, and CI/CD."
- `email`: dtn06052005@gmail.com · `phone`: 0911398029 (`show_phone: true`) · avatar `tn.jpg` · CV `cv.pdf`

### Social links
| platform | url |
|---|---|
| linkedin | https://www.linkedin.com/in/nguy%C3%AAn-tr%C6%B0%E1%BB%9Dng-8a075934b/ |
| github | https://github.com/trngnneee |
| facebook | https://www.facebook.com/trngn.neee |
| instagram | https://www.instagram.com/trngn.neee/ |

### Skills (level để `null`)
- languages: C++, JavaScript, TypeScript, Python, SQL
- frontend: React, Next.js, Tailwind CSS, HTML5, CSS3, Sass
- backend: Node.js, Express.js, FastAPI, Flask
- database: MongoDB, PostgreSQL, MySQL, Redis
- cloud_devops: AWS (SAA-C03), Docker, Jenkins, GitHub Actions

Icon: dùng devicon qua jsDelivr với version cố định (vd. `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/<name>/<name>-original.svg`), không dùng `raw.githubusercontent.com`.

### Projects (theo thứ tự hiển thị)
| # | title / subtitle | category | role | tech_stack | github | demo | cover |
|---|---|---|---|---|---|---|---|
| 1 | Task Management System with AWS Serverless Architecture | cloud | Cloud Engineer, Solution Architect | AWS Lambda, API Gateway, DynamoDB, S3, CloudFront, IAM, VPC, CloudWatch | https://github.com/trngnneee/AWS_Serverless_Application | https://d14g6okcs1rawz.cloudfront.net/index.html | `aws_serverless.png` |
| 2 | Retail Analytics & Demand Forecasting Platform / *DataStorm 2025 — Encouragement Prize* | fullstack | Full-Stack Developer | Next.js, Tailwind CSS, shadcn/ui, FastAPI, PostgreSQL, Redis, Google Gemini, AWS EC2, Render, Vercel | https://github.com/trngnneee/Datastorm | https://datastorm-frontend.vercel.app/ | https://res.cloudinary.com/dnqinxiwo/image/upload/v1768743522/Screenshot_2026-01-18_203707_xvt4jm.png |
| 3 | AQI Forecasting Platform / *NASA Space Apps Challenge 2025 — Top 11 HCMC* | ai | Frontend Developer | React, Tailwind CSS, Node.js, Express.js, Flask, LSTM, Geospatial UI | https://github.com/DanielNguyen-05/AirForce | https://airforceclient.vercel.app | `airforce.png` |
| 4 | 5Pets | fullstack | End-to-end Developer | Next.js, Tailwind CSS, shadcn/ui, Flask, MongoDB, Cloudinary, RAG, Gemini AI, MoMo, ZaloPay | https://github.com/trngnneee/5Pets | — | https://res.cloudinary.com/dnqinxiwo/image/upload/v1768743874/Screenshot_2025-12-29_105140_e8iybr.png |
| 5 | MusicApp | fullstack | End-to-end Developer | Next.js, Tailwind CSS, Node.js, Express.js, MongoDB, Cloudinary | https://github.com/trngnneee/MusicApp | https://musicapp.io.vn | https://res.cloudinary.com/dnqinxiwo/image/upload/v1759441969/songs/1759441967325-49359A08-7639-434B-8F29-1EA4E4DE1065.jpeg.jpg |
| 6 | Clone of Super Mario Bros | game | End-to-end Developer | C++, SFML, OOP | https://github.com/trngnneee/MarioGame | — | `mario.jpg` |

*(Cột github ở bảng trên = `repo_url`, `repo_visibility: public`.)*

Summary/description:
1. "A scalable serverless task management platform built using AWS Lambda, API Gateway, DynamoDB, S3, and CloudFront. Implemented IAM roles, VPC configurations, secured API architecture, and configured CloudWatch monitoring and AWS Budgets for cost control."
2. "A full-stack analytics platform for FMCG demand forecasting. Built RESTful APIs with FastAPI and PostgreSQL, optimized API performance using Redis caching, integrated LLM-powered recommendations using Google Gemini, and deployed services on AWS EC2, Render, and Vercel."
3. "An air quality monitoring and forecasting platform. Integrated satellite and environmental datasets, built geospatial visualization UI and forecasting pipelines, and applied LSTM models for AQI prediction."
4. "An ultimate platform for pet lovers to connect, share, and find their perfect furry companions."
5. "The ultimate platform to discover, stream, and personalize your music effortlessly."
6. "A modern remake of Super Mario Bros, blending nostalgia with cutting-edge technology."

`featured = true` cho #1–#3.

### Achievements (sắp mới → cũ)
| type | period | title | issuer | color | media | description |
|---|---|---|---|---|---|---|
| certification | 2025 | AWS Certified Solutions Architect – Associate (SAA-C03) — 763/1000 | Amazon Web Services (AWS) | #FF9900 | `aws.png` | Earned the AWS Certified Solutions Architect – Associate certification, validating expertise in designing distributed systems on AWS. |
| award | 2025 | Encouragement Prize — Vietnam Datathon DataStorm 2025 | DataStorm 2025 | #E11D48 | `datastorm.JPG` | Developed a full-stack retail analytics and demand forecasting platform, securing the Encouragement Prize overall. |
| award | 2025 | Top 11 — NASA Space Apps Challenge 2025 (Ho Chi Minh City) | NASA Space Apps Challenge | #E11D48 | `vng.jpg` | Collaborated with a team to build an AQI monitoring and forecasting platform using satellite and environmental datasets, reaching the Top 11 finalists in Ho Chi Minh City. |
| award | 2023 | University's Study Encouragement Scholarship – Semester 2 | University of Science, VNU-HCM (HCMUS) | #FFD700 | `hbkk.png` | Awarded for being among the top students with outstanding academic results in the semester. |
| education | 2023-2024 | Higher Secondary School Graduation — GPA 9.23/10.0 | Da Lat High School for the Gifted | #3F8E00 | `degree.JPG` | Graduated with excellent academic performance from a highly competitive high school. |
| certification | 2022-2023 | IELTS 6.5 | IDP IELTS Viet Nam | #3F8E00 | `ielts.jpg` | I achieved an overall band score of 6.5, demonstrating a solid command of the English language. |

### Activities
| period | title | organization / location | images | description |
|---|---|---|---|---|
| 2026 | Buoc Chan Yeu Thuong 2026 | Phu Khanh Lower Secondary School, Ben Tre Province | `BCYT.JPG`, `BCYT2026-1037.JPG` | Provide student counseling and support, organize extracurricular activities, and foster a positive school environment. |
| 2025 | Buoc Chan Yeu Thuong 2025 | Phu Khanh Lower Secondary School, Ben Tre Province | `BenTre.jpg`, `BenTre2.jpg` | Provide student counseling and support, organize extracurricular activities, and foster a positive school environment. |

### Experiences
| company | position | employment_type | start | end | location | tech_stack |
|---|---|---|---|---|---|---|
| NewEra Inc | Fresher DevOps | full_time | 2026-07 | present | On-site | Google Cloud Platform (GCP), System Deployment |

*(Nguồn: LinkedIn của user. LinkedIn ghi "+2 skills" chưa rõ — hỏi user để bổ sung; không tự bịa mô tả.)*

### Contact form `service` enum
`frontend_development`, `backend_development`, `cloud_devops`, `consulting`, `other`.

---

## Phụ lục B — Repo cần quét trong `../` (gợi ý gom nhóm)

Gom theo **project hiển thị trên portfolio**, không phải 1 repo = 1 project. Ngữ cảnh dưới đây lấy từ README, agent phải xác minh lại khi quét.

| # | Project đề xuất | category | Repo / thư mục nguồn | Ngữ cảnh đã biết |
|---|---|---|---|---|
| B1 | **Self-hosted Kubernetes Homelab — GitOps auto-deploy** *(flagship)* | homelab | `iac/terraform/kvm-vm`, `iac/ansible/{ansible-master-node,ansible-worker-node,ansible-openbao}`, `iac/argocd-manager`, `iac/routes`, `iac/routes-esp32cam`, `app/workloads`, `gitlab_cicd_template/gitlab-ci-template`, `gitlab_cicd_template/gitlab_ci_test_build_bump_workloads` | KVM VM bằng Terraform → kubeadm qua Ansible; node chỉ có IP overlay NetBird; Argo CD app-of-apps + ApplicationSet (infra / routes / apps, git dir generator `deploy/*/*`); APISIX Gateway API (hostNetwork), cert-manager wildcard DNS-01 Cloudflare; OpenBao + External Secrets; local-path-provisioner; Rancher. CI GitLab: test → buildah build image tag `production_DDMMYY_hhmmss` → bot bump tag trong repo workloads → Argo CD rollout; job CI join NetBird netstack mode qua SOCKS5 để Ansible SSH tới host. Có `docs/` (kiến trúc, sơ đồ, nhật ký sự cố) trong `argocd-manager` |
| B2 | **Spidey Bot** — AI assistant bot cá nhân với MCP connectors | bot | `app/spidey_bot/core_bot`, `app/spidey_bot/mcp_connector/{mail_digest,k8s,reminder,expense_management,news_digest,kit}` | Có `SYSTEM_DESIGN.md`; chạy trên cụm (ns `spidey`), deploy qua pipeline B1 |
| B3 | **Family Bot** | bot | `app/family_bot/core_bot`, `app/family_bot/mcp_connector/{calendar,reminder,news_digest,kit}` | Có `SYSTEM_DESIGN.md`; ns `family`. Xem có dùng chung `kit` với Spidey không → nêu trong description |
| B4 | **PC Control** — điều khiển PC qua bot | bot | `app/pc_control/{pc_control_agent,pc_control_bot}` | Đọc README để xác định |
| B5 | **MCP Server monorepo** — infrastructure control planes cho AI agent | homelab *(hoặc `ai`)* | `app/mcp-server` | 6 server (KVM 42 tools, OpenBao 37, Outline 13, K8s 38, GitLab 14, GitOps 12) + gateway; Python 3.12, `mypy --strict`, policy: không shell tuỳ ý, write dry-run-first, không trả secret |
| B6 | **ESP32-CAM home camera** — live view + ghi hình 24/7 trên k8s | iot | `app/esp32_cam` | Firmware PlatformIO (MJPEG), recorder ffmpeg segment 10 phút, web Go + React, bot Telegram; deploy qua pipeline B1 |
| B7 | Landing page | fullstack | `app/landing_page` | Vite + Docker/nginx; có `SYSTEM_DESIGN.md`. Có thể gộp vào B1 như một workload ví dụ — hỏi user |

Thứ tự ưu tiên user yêu cầu: **B1 (homelab auto deploy) và B2–B4 (bot)**. B5–B7 vẫn quét và đưa vào `REVIEW.md`, nhưng đánh dấu "candidate — chờ user quyết định".

Skill dự kiến phát hiện (xác minh khi quét): Kubernetes (kubeadm), Argo CD, Kustomize, Helm, Terraform, Ansible, KVM/libvirt, APISIX / Gateway API, cert-manager, OpenBao, External Secrets Operator, NetBird / WireGuard, GitLab CI, Buildah, Rancher, MCP (Model Context Protocol), Go, PlatformIO / ESP32, ffmpeg.
