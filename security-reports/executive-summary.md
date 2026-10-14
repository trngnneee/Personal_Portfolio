# Executive Summary — Portfolio Security Assessment

**Date:** 2026-10-14 · **Methodology:** OWASP WSTG / API Security Top 10, evidence-driven, non-destructive
**Scope:** T1 `portfolio-api-5hvt.onrender.com` (Express 5 API on Render) · T2 `trngnneee.io.vn` (public SPA) · T3 `admin.trngnneee.io.vn` (admin SPA); source & dependency analysis from the local monorepo (`~/trngnneee/portfolio`, `158dd52`). Hosting/CDN (Render, Cloudflare, Supabase, Cloudinary, Resend) treated as out of scope.

## Overall posture

**Good to strong.** The system is a single-operator portfolio with a small, modern attack surface, and it is defended at the right layers: authentication is enforced server-side on every admin route (verified live: 14/14 endpoints unauthenticated → 401, including unknown paths), the token design is sound (short-TTL HS256, pinned algorithm, DB-side revocation), input validation is schema-first at every boundary, uploads are content-sniffed, output rendering is sanitized, security headers/CSP are strict on both SPAs, there are **zero production dependency vulnerabilities** (`npm audit --omit=dev`: 0; CI gates on this), and RLS plus connection caps exist as database-side backstops. No exploitable vulnerability was found in T2/T3 client code or in cross-application trust boundaries (CORS is exact-origin, no cookies ⇒ no CSRF surface).

## Findings by severity

| Severity | Count | IDs |
|---|---|---|
| Critical / High | 0 | — |
| Medium | 1 | F-01 |
| Low | 2 | F-02, F-03 |
| Informational | 2 | F-04, F-05 |
| CVE/advisory affecting **runtime** | 0 | (1 dev-tool advisory: esbuild GHSA-67mh-4wv8-2f99, not reachable in deployment) |

## Most important risks

1. **F-01 (Medium) — Rate limiters key on rotating Cloudflare egress IPs, not real clients.** Proven from `RateLimit` headers (one client → 4–6 parallel buckets). Effect: the contact-form throttle is bypassable (mail/DB spam the owner pays for) and can misfire across visitors; login brute-forcing is held only by the account-level 5-failure/15-min lockout — which also lets any anonymous user lock the admin out at will for 15 min. **One-line fix: `trust proxy: 2` or a `cf-connecting-ip` keyGenerator.**
2. **F-02 (Low) — CORS allowlist retains the suspended, globally re-claimable `portfolio-admin.onrender.com`.** Harmless today (no ambient credentials), becomes a third-party origin if the name is ever released. **Fix: drop the entry.**
3. **F-03 (Low) — DB TLS without certificate verification by default.** Encrypted, unauthenticated channel between Render and Supabase unless `DATABASE_CA_CERT` is set in the dashboard. **Fix: set the Supabase CA PEM.**

## Immediate remediation priorities

1. Fix limiter keying (F-01) — smallest, highest-value change.
2. Remove the stale CORS origin (F-02) — one env-var edit.
3. Set `DATABASE_CA_CERT` (F-03) if not already set in the Render dashboard.
4. Optional: HSTS `preload` + publish the T1 `RateLimit` fix note (F-05/F-04).

## Testing limitations & unverified areas

- **No privileged session** was used (out of scope): authenticated behaviors (token expiry live, logout-all, write paths, uploads) are assessed from source and the repository's own security regression suite rather than live PoCs.
- Exact **deployed-commit provenance** not attested (asset hashes differ from a local build); all probed live behavior matches the reviewed source.
- Authorization testing (BOLA/BFLA) is structurally N/A: single-account admin; no multi-tenant data.
- Platform CVEs (Render/Cloudflare/Supabase managed services): no version evidence obtainable externally; nothing claimed.
- Intrusive classes excluded per scope: no brute-force campaigns (2 failed logins total), no load/DoS tests, no data mutation (honeypot-only contact POSTs, which store nothing), no uploads.

Full detail: `findings.md` · machine-readable CVE data: `cve-inventory.json` · coverage: `target-matrix.md` · raw evidence: `evidence/`.
