# Test Log & Evidence Notes

Assessment date: 2026-10-14 (requests executed ≈13:45–14:50 UTC).
Method: read-only / bounded HTTP probes (`curl`, low rate, 0.15–0.2 s spacing, ≤ ~70 requests per target in total) + local source & lockfile review of `~/trngnneee/portfolio` @ `158dd52` (branch `main`, dirty-free tracked tree at review time).

## Raw evidence files (sanitized)

| File | Content |
|---|---|
| `t1_root_headers.txt` | T1 root 404 — full response headers (helmet set, no Set-Cookie) |
| `t2_root_headers.txt`, `t2_root_body.html` | T2 SPA shell + headers (CSP, HSTS, caching) |
| `t3_root_headers.txt`, `t3_root_body.html` | T3 admin shell + headers (X-Robots-Tag, COOP) |
| `live_probes_T1.txt` | Round 1: /healthz, /sitemap.xml, 14× unauthenticated admin GETs, POST /admin/projects, CORS preflights, TRACE/DELETE, 4× login variants, 7× contact POSTs (honeypot), 1.2 MB body, blog query probes |
| `live_probes_round2.txt` | Round 2: stale CORS host probe, suspended onrender hostname, garbage/`alg:none` JWT, robots.txt ×2, www redirect, bundle fetches, rate-limit bucket stability (6×) |
| `t2_index_bundle.js`, `t2_queries_chunk.js`, `t3_index_bundle.js` | Deployed production JS, fetched for secret/endpoint grep (no `sourceMappingURL`, no secret-like matches) |

## Key observations (timestamps ≈ from `date:` headers)

1. **All 3 targets** — HTTP/2, TLS 1.3 (issuer Google Trust Services WE1, Cloudflare-managed), valid certs; HTTP→HTTPS `301`; HSTS `max-age=31536000; includeSubDomains` everywhere; **no `Set-Cookie` anywhere** (stateless Bearer auth).
2. **T1**: helmet default header set incl. CSP, `x-content-type-options`, `x-frame-options: SAMEORIGIN`; `x-powered-by` absent; custom JSON 404 `{"error":{"code":"not_found",…}}` — no stack/paths leaked.
3. **Auth enforcement (confirmed):** unauthenticated GET on `/api/v1/admin/{auth/me,dashboard,projects,skills,experiences,achievements,social-links,activities,blog,media,messages,sections,profile,export}` → **401** for all 14; unknown admin path → 401 (auth before routing → no unauthenticated route enumeration); POST /admin/projects → 401. Garbage token and `alg:none` JWT → 401.
4. **CORS (confirmed):** preflight from `https://evil.example` → 204 **without** `Access-Control-Allow-Origin`; from `https://trngnneee.io.vn` / `https://admin.trngnneee.io.vn` → ACAO echoed, `Access-Control-Allow-Headers: authorization,content-type`, `Access-Control-Max-Age: 600`; **no** `Access-Control-Allow-Credentials`. Allowlist (`render.yaml`): T2, T3, plus `https://portfolio-admin.onrender.com` — that hostname is currently **Render "Service Suspended"** (503, `x-render-routing: suspend`) yet still CORS-echoed.
5. **Login endpoint:** malformed / bad-format bodies → 400 `validation_error` (field-level zod details); wrong-email vs correct-email-wrong-password → byte-identical `401 {"code":"unauthorized","message":"Invalid credentials"}`; timing consistent (0.52 s vs 0.69 s, argon2 dummy-verify). Only **2 failed credential attempts** were made (account had 3 attempts of margin before its 5-attempt/15-min DB lockout).
6. **Rate-limit header evidence (`RateLimit: "N-in-15min"; r=…; pk=:<b64>`):** consecutive requests from the *same* curl client produced **4–6 distinct bucket keys (`pk`)** with independent remaining counts (login: r=5,6,7,7,8,8 across 6 requests; contact: r=3,4,2,4,1,3 across 6). ⇒ limiter keys on a per-request-changing upstream (Cloudflare egress) IP, not the real client.
7. **Contact:** invalid body → 400 with field paths; valid honeypot POSTs (`website` set) → 201 and are **not stored** (no production data written); 1.2 MB body → 413.
8. **Blog routes → 404** while the `blog` section is disabled (`requireSection`) — consistent fail-closed behavior; SQLi/XSS payloads in `q` treated as opaque data (400/404/200, no 5xx).
9. **T2/T3:** strict CSP (`script-src 'self'`, no unsafe-eval/inline scripts); admin sends `X-Robots-Tag: noindex, nofollow`; deployed `/*` rewrite returns `index.html` for `/assets/*.js.map` → **no source-map exposure**; no `sourceMappingURL` comments in production bundles; bundles contain only the intended public API base URL (`https://portfolio-api-5hvt.onrender.com`) and schema.org/w3.org constants — no secret-like strings (`sk-`, `AIza`, `ghp_`, `AKIA`, PEM headers) found.
10. **T2 robots.txt:** served (`User-agent: * / Allow: / / Sitemap: …`). **T3 robots.txt:** 404 (noindex header present instead). `www.trngnneee.io.vn` → 301 → apex.
11. **Provenance caveat:** deployed bundle hashes (`index-DNDKsQxM.js` / `index-DAq4IIlU.js`) differ from this local checkout's build (`index-DFGal02x.js` / `index-w0thLpv0.js`) → source-based findings reflect local HEAD; live behavior (error shapes, header set, limiter strings, route surface) is fully consistent with this source tree, but an exact deployed-commit attestation would need the Render deploy log.
12. **TLS/infra note:** `rndr-id`, `x-render-origin-server`, `cf-ray` headers expose Render/Cloudflare routing only; hosting providers treated as out of scope.
