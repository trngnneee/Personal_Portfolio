# Findings — Portfolio Security Assessment (2026-10-14)

Targets: **T1** `https://portfolio-api-5hvt.onrender.com` · **T2** `https://trngnneee.io.vn` · **T3** `https://admin.trngnneee.io.vn`
Evidence: `./evidence/` (live probe transcripts, header dumps, deployed bundles). Source: `~/trngnneee/portfolio` @ `158dd52`.

Severity summary: **0 Critical · 0 High · 1 Medium · 2 Low · 2 Informational**

---

## [F-01] IP rate limiting is keyed on transient proxy egress IPs, not the real client — login/contact throttles are bypassable and can misfire across users

- **Severity:** Medium
- **Confidence:** Confirmed (behavior observed directly via `RateLimit` response headers)
- **Target:** T1 (affects the abuse model of T2's contact form and T3's login)
- **Affected component:** `backend/src/middleware/rate-limit.ts` via `app.set("trust proxy", 1)` in `backend/src/app.ts`, deployed behind Cloudflare → Render
- **CVE / CWE / OWASP category:** CWE-307 (improper restriction of excessive authentication attempts), CWE-770; WSTG-ATHN-02 / OTG-SESSION-001-adjacent, API-OTG:ATH
- **CVSS score and vector:** 5.3 · `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L` (integrity of the control is N; availability impact = spam/self-DoS potential)
- **Status:** Confirmed

**Description**
Two per-IP limiters are intended to bound abuse: login (10/15 min) and contact POST (5/15 min). The `RateLimit` headers show `pk=` (bucket key) values that **change between consecutive requests from the same client** — 4–6 distinct buckets were observed across 6 requests, each counting independently. The app therefore throttles per *Cloudflare egress IP as seen by the origin* (which rotates across Cloudflare's large shared pool and is shared by unrelated visitors), not per real client. `trust proxy` is set to `1`, trusting only the immediately-connecting hop, while the request path is client → Cloudflare → Render → Express (two proxy hops).

**Evidence**
`evidence/live_probes_T1.txt` (contact honeypot #1–#6: `r=3,4,2,4,1,3` across ≥3 distinct `pk` values) and `evidence/live_probes_round2.txt` (6 validation POSTs to `/auth/login` → `r=5,6,7,7,8,8` — strictly impossible for a single 10-request bucket). Source: `backend/src/app.ts:21` (`app.set("trust proxy", 1)`), `backend/src/middleware/rate-limit.ts`.

**Reproduction**
1. From one workstation, send 6 rapid `POST /api/v1/admin/auth/login` requests with an invalid body.
2. Record the `RateLimit: "10-in-15min"; r=…; pk=:…:` response header each time.
3. More than one distinct `pk` value ⇒ bucketing is not per-client.

**Impact**
- **Bypass:** an anonymous attacker spreading requests across Cloudflare egress IPs can post to `/api/v1/public/contact` far beyond 5/15 min — unbounded (Render-paid) email notifications via Resend and `contact_messages` rows.
- **Cross-user interference:** two visitors behind the same egress IP share the small 5-request contact window (a benign user can be 429'd by a stranger).
- **Login:** the 10/15 min IP limiter is weak as brute-force control, **but** the account-level DB lockout (5 failures → 15 min) still holds regardless of source IP — that is the effective control. Residual risk: any anonymous user can lock the single admin account out for 15 min at will (minor availability nuisance; `423` responses disclose `lockedUntil`).

**Remediation**
Trust the full proxy chain and/or key explicitly on the authenticated client IP Cloudflare provides:
```ts
// backend/src/app.ts — behind Cloudflare → Render, Express must trust 2 hops
app.set("trust proxy", 2);
// or, in each limiter (express-rate-limit v8):
rateLimit({ keyGenerator: (req) => (req.headers["cf-connecting-ip"] as string) ?? req.ip })
```
Prefer the `cf-connecting-ip` keyGenerator if Cloudflare's IP allowlists aren't also enforced at Render — it is unspoofable because Cloudflare overwrites the header. Consider exempting honeypot-flagged contact POSTs from counting, and optionally a per-account lockout notice in `/healthz`-adjacent admin docs.

**References**
- OWASP WSTG v4.1 — WSTG-ATHN-02 (Testing for Password/Passphrase Attacks) & rate-limit guidance
- express-rate-limit docs: "Trust proxy" / `keyGenerator` (v8)
- Cloudflare: `CF-Connecting-IP` header semantics

**Retest criteria**
Send ≥5 rapid POSTs from one client; the `RateLimit` header must show a **single** `pk` and monotonically decreasing `r`; repeat with a VPN exit to see an independent counter; spoofing `X-Forwarded-For` from the client must not reset/steal another client's bucket.

---

## [F-02] CORS allowlist retains `https://portfolio-admin.onrender.com` — a shared-domain hostname currently suspended and re-claimable on Render

- **Severity:** Low
- **Confidence:** Confirmed (present in `render.yaml`; ACAO echoed live; hostname serves Render's "Service Suspended" 503)
- **Target:** T1
- **Affected component:** `envVars.CORS_ORIGINS` in `render.yaml` → `cors` middleware allowlist in `backend/src/app.ts`
- **CVE / CWE / OWASP category:** CWE-942 (permissive cross-domain policy); OWASP API1 (BOLA-adjacent exposure surface)
- **CVSS score and vector:** 2.7 · `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N`
- **Status:** Confirmed

**Description**
The API's CORS allowlist includes the Render default hostname `https://portfolio-admin.onrender.com` (the admin service's former default URL). A preflight from that origin is accepted today. The hostname currently serves Render's *Service Suspended* page, meaning it still resolves to a (paused) Render resource. Render default `*.onrender.com` subdomains derive from service names and are **globally claimable** once a name is released — the API service itself hit this (`portfolio-api` was taken → `-5hvt` suffix). If the admin service is ever deleted/released, any Render customer could serve attacker JS from exactly that allowlisted origin.

**Evidence**
`render.yaml` (`CORS_ORIGINS` value); `evidence/live_probes_round2.txt` — OPTIONS with that `Origin` returns `access-control-allow-origin: https://portfolio-admin.onrender.com`; GET returns 503 `x-render-routing: suspend`.

**Reproduction**
`curl -X OPTIONS -H 'Origin: https://portfolio-admin.onrender.com' -H 'Access-Control-Request-Method: GET' https://portfolio-api-5hvt.onrender.com/api/v1/admin/dashboard -D -`

**Impact**
Today: none demonstrated (a suspended page cannot run script). Conditional: if the name is reclaimed by a third party, that origin gains cross-origin *request* capability against the API — but authentication is a sessionStorage-held Bearer token, **not cookies**, so the attacker's page has no ambient credential to ride; it could only poll the public endpoints or mount a targeted attack on a victim self-hosting the admin UI on that hostname. Hence Low.

**Remediation**
Remove `https://portfolio-admin.onrender.com` from `CORS_ORIGINS` (the custom domain `https://admin.trngnneee.io.vn` is the live origin). If a Render preview/default-hostname entry is ever needed, pin it to a name guaranteed to remain owned.

**References** — `render.yaml` comment at `# No custom domain…`; Render docs on service default domains.
**Retest criteria**
Preflight with the removed origin no longer returns `Access-Control-Allow-Origin`; admin from `https://admin.trngnneee.io.vn` still works end-to-end.

---

## [F-03] Database connection TLS is encrypted but not server-certificate-verified by default

- **Severity:** Low
- **Confidence:** Likely (code + blueprint default verified; the actual deployed value of the optional `DATABASE_CA_CERT` dashboard secret could not be inspected)
- **Target:** T1
- **Affected component:** `backend/src/db/client.ts`, `render.yaml` (`DATABASE_SSL=true`, `DATABASE_CA_CERT` optional)
- **CVE / CWE / OWASP category:** CWE-295 (improper certificate validation); WSTG-CRYP-01
- **CVSS score and vector:** 2.4 · `CVSS:3.1/AV:A/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N`
- **Status:** Likely (deployment-dependent)

**Description**
`createDb` enables TLS with `{ rejectUnauthorized: false }` unless `DATABASE_CA_CERT` is provided (logger even warns about this). In production the connection carries the admin's full dataset to/from Supabase with encryption but without authentication of the peer, so an on-path adversary between Render and Supabase could impersonate the pooler. Realistically a defense-in-depth gap (both hops are provider backbones), and the repo comments acknowledge it — hence Low/Likely rather than a misconfiguration callout.

**Evidence**
`backend/src/db/client.ts:41-53`; `render.yaml` (`DATABASE_SSL: "true"`, `DATABASE_CA_CERT` `sync: false` with comment "Without it TLS is encrypted but unverified").

**Reproduction / Impact / Remediation**
Set `DATABASE_CA_CERT` to Supabase's published CA PEM (env schema already supports full verification). Retest: app starts with the var set and a deliberate wrong-CA connection fails; runtime log no longer contains the "certificate is not verified" warning.

**References** — Supabase "Connect → SSL certificate" docs; node-postgres `ssl.rejectUnauthorized`.

---

## [F-04] `/healthz` discloses database up/down state to anonymous callers

- **Severity:** Informational
- **Confidence:** Confirmed
- **Target:** T1 — `backend/src/app.ts` (`/healthz`)
- **CWE:** CWE-200 · **CVSS:** n/a (not scored — conventional status endpoint)
- **Status:** Confirmed

**Description / Evidence**
`GET /healthz` → `{"ok":true,"db":"up"}` with `Cache-Control: no-store` (correct). Exposes only liveness of the DB tier; no versions, paths, or timings of note. Standard and acceptable for Render health checks; documented for completeness. If preferred, return `{"ok":true}` and keep `db` state in Render's health-check metric only.

---

## [F-05] Header hardening gaps: no HSTS `preload`, no COOP/CORP/CRT on T2

- **Severity:** Informational
- **Confidence:** Confirmed
- **Targets:** T2 (missing `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `permissions` values fine); all three (HSTS lacks `preload`)
- **CWE:** CWE-693 (defense-in-depth) · **CVSS:** n/a
- **Status:** Confirmed

**Description**
Both SPAs ship a strict CSP (`script-src 'self'`), HSTS, `nosniff`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, referrer policy, and `Permissions-Policy` — a strong set. T3 additionally sends COOP `same-origin`. Remaining nit-level items: HSTS without `preload` (io.vn is preload-list-eligible; note `includeSubDomains` on the apex is the maintainer's call for the whole domain), and T2 lacks COOP/CORP headers (low impact given no cookies exist anywhere). No action strictly required.

---

## Positive observations (verified)

- **Auth boundary fail-closed by construction:** `requireAuth` is mounted once in front of the admin router (`backend/src/modules/admin.router.ts`), verified live — even *unknown* `/api/v1/admin/*` paths 401 before route matching, so new routes cannot be added unprotected, and admin route existence is not enumerable anonymously.
- **JWT hygiene:** HS256 pinned via `jose` (`algorithms:["HS256"]`), `sub`/`tv` shape-checked, token-version DB revocation (logout-all), 8 h TTL; `alg:none`, wrong-secret, HS512-confusion, and malformed-header cases are rejected in the owner's own suite and garbage/`alg:none` rejected live.
- **No cookie surface:** zero `Set-Cookie` on any target; CSRF is structurally not applicable to the API; sessionStorage token limits XSS blast radius to the session (cleared on tab close).
- **Input layer:** zod at every boundary (`shared/src/schemas/*`), `.partial()`/strip semantics → mass-assignment resistant (owner's tests + `prepare()` overrides); id params regex-validated digits-only; LIKE wildcards escaped for media search; all queries parameterized via Drizzle; `statement_timeout` 10 s and bounded pool cap DB-level DoS backstops; `express.json` 1 MB cap (413 confirmed live).
- **Uploads:** magic-byte sniffing only (jpg/png/webp/avif/pdf), per-type size caps, server-controlled filenames/folders (regex `[a-z0-9-]`), Cloudinary-backed in prod.
- **Output:** React escapes the public SPA; blog markdown rendered through `react-markdown + rehype-sanitize` (+ Mermaid `strict`); RSS XML-escaped; JSON-LD `<` escaped; public payloads are explicit allowlist DTOs (no hashes/versions/ipHash/usage internals; private repo URLs suppressed; phone shown only because `showPhone` is on — intentional PII for a portfolio).
- **Sections gating:** disabled public routes 404 rather than 500/200-empty (live).
- **Process:** CI runs `npm audit --omit=dev --audit-level=moderate` + lint + typecheck + a dedicated `backend/test/security.test.ts` regression suite; RLS is enabled on every table as a second enforcement layer if the Supabase data plane is ever exposed.
- **Privacy:** contact IPs stored only as salted SHA-256 (`IP_HASH_SALT`), UA truncated to 300 chars, admin DTO strips `ipHash`.

## Explicitly unverified (limitations)

- Behavior *with a valid session* (no credentials were in scope): live token-expiry rejection, `/auth/me`, logout-all revocation, and write-path tests (upload, CRUD create/update) — covered by source + the owner's local test suite instead.
- BOLA/BFLA horizontal-privilege testing is N/A by design: single-account admin, no user data rows.
- Exact deployed commit provenance: deployed asset hashes ≠ local build output (see `evidence/NOTES.md` item 11); live responses match local source structure in every probed detail.
- Render/Cloudflare platform CVEs: no version evidence available from outside; not claimed.
- Node.js runtime patch level on Render (≥22 per `engines`); `x-powered-by` suppressed so Express version is not disclosed.
- Cloudflare-managed TLS cipher suite policy (out-of-scope infrastructure).
