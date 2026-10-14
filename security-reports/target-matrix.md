# Target Coverage Matrix

Legend: ✅ tested/verified · ⚠️ partially tested (note) · ➖ not applicable · ❓ unverified (limitation) · F-xx findings, GHSA advisory in `cve-inventory.json`

| Check category | T1 API `portfolio-api-5hvt.onrender.com` | T2 Frontend `trngnneee.io.vn` | T3 Admin `admin.trngnneee.io.vn` |
|---|---|---|---|
| Reachability / redirect behavior | ✅ HTTPS 200/404 JSON, HTTP→301 | ✅ 200, HTTP→301, www→301 apex | ✅ 200, HTTP→301 |
| TLS config & cert validity | ✅ GTS-issued, unexpired | ✅ ✅ | ✅ ✅ |
| Security headers (HSTS, CSP, XFO, nosniff, referrer, perms) | ✅ helmet set; F-05 (no preload) | ✅ strict CSP; F-05 (no COOP/CORP) | ✅ strict CSP + COOP + noindex |
| Cookie attributes | ➖ no cookies | ➖ none | ➖ none (sessionStorage token, source-verified; deployed lazy chunk ❓) |
| API discovery / route inventory | ✅ full surface from source + live sweep (`/healthz`, `/sitemap.xml`, `/api/v1/public/*`, `/api/v1/admin/*`) | ✅ bundles/chunks inspected | ✅ shell inspected; lazy chunks not enumerated |
| Auth enforcement unauthenticated (all admin GET/POST) | ✅ 14/14 → 401, incl. unknown paths; garbage/`alg:none` token → 401 | ➖ | ✅ via T1 (dashboard guard is UX-only, server gate verified) |
| Token validation (alg pinning, revocation, expiry) | ⚠️ alg pinning live-verified; expiry/revocation ❓ (source + owner tests only — no valid session) | ➖ | ➖ |
| Authorization BOLA/BFLA/privilege split | ➖ single-account design | ➖ | ➖ |
| CORS (allowlist, preflight, credentials) | ✅ exact-origin echo, evil origin rejected, ACAH/max-age verified; **F-02** stale entry | ✅ CSP `connect-src` pins API origin | ✅ same |
| Input validation / injection (SQLi, XSS, NoSQLi, traversal, mass assignment) | ⚠️ live: 400/404/413 behaviors, opaque payloads; ✅ source+owner suite for traversal/upload/mass-assignment; SSRF ➖ (no server-side fetch of user URLs) | ✅ React-escaped; markdown `rehype-sanitize`; JSON-LD `<`-escaped | ✅ same stack |
| Error/info leakage (stack traces, versions, paths, `x-powered-by`) | ✅ clean JSON errors; no version headers | ✅ | ✅ |
| Caching on sensitive responses | ✅ `no-store` /site `public,60` | ✅ immutable assets, html revalidated | ✅ `index.html` no-store configured |
| Rate limiting & lockout | ⚠️ present live, but mis-keyed — **F-01 (Medium)** | ⚠️ inherits F-01 for contact form | ⚠️ inherits F-01 for login; DB lockout effective |
| XSS in API-rendered content | ✅ payloads not reflected as HTML (JSON API) | ✅ | ✅ |
| Open redirect / unsafe URL handling | ✅ no redirects; optUrl schema http(s)-only | ✅ router-driven only | ✅ |
| Secrets in JS/source maps | ✅ bundles grepped clean; no `sourceMappingURL`; `.map` URLs fall through to HTML | ✅ | ✅ |
| Dependency CVEs | ✅ prod tree: 0 vulns (`npm audit`, GHSA feed); dev advisory GHSA-67mh-4wv8-2f99 (esbuild, local dev-tool only) | ✅ covered by same lockfile audit | ✅ |
| Cross-app trust boundaries (Phase 5) | ✅ T2/T3 → T1 only; no token sharing (cookie-free); consistent header policy; 1 inconsistency: F-02 | ✅ | ✅ |

## Findings per target

- **T1:** F-01 (Medium), F-02 (Low), F-03 (Low), F-04 (Info)
- **T2:** F-05 (Info)
- **T3:** F-05 (Info) — strongest component; no findings beyond hardening nits.

## Recommended next steps

1. **T1:** fix limiter keying (`trust proxy: 2` / `cf-connecting-ip` keyGenerator) → retest per F-01 criteria.
2. **T1 config:** drop stale CORS origin; confirm `DATABASE_CA_CERT` set in the Render dashboard.
3. **Privileged session test (needs owner credentials):** live token-expiry rejection, `logout-all` revocation, an upload with an SVG/exe payload, one CRUD roundtrip on a synthetic record.
4. **Optional:** HSTS `preload` (all three) after reviewing `includeSubDomains` implications for the whole `io.vn` domain; add Render deploy-log attestation to release notes so future pentests can pin the deployed commit.
