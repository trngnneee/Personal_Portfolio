# Workspace scan — review before publishing

Generated in Phase 3b by a **read-only** scan of `../` (PROMPT.md §8.3, Appendix B), on 2026-10-14.
Seed data: [`projects.ts`](./projects.ts), [`skills.ts`](./skills.ts), and descriptions in [`descriptions/`](./descriptions).

**Default state:** every scanned project and skill is `published: false`, and every repo is `repoVisibility: "private"` (the public API hides private repo URLs). Nothing appears on the public site until you approve it.

## How the scan was done

- **What was read:** README / SYSTEM_DESIGN / BOOTSTRAP / PROMPT files, `docs/`, dependency manifests, Dockerfiles, CI files, Helm/Kustomize manifests, `*.tf` (provider and resource *types* only), Ansible task names, and a light skim of the source trees to count tools, tests and commands.
- **Git commands:** read-only only (`remote get-url`, `log` dates, `rev-list --count`).
- **Never opened:** `../secret/`, `.env*`, `*.key`/`*.pem`, kubeconfigs, `firmware/include/config.h`, real `config.yaml`/`agent.yaml`/`connectors.json`, `*.tfstate`, `terraform.tfvars`, Ansible inventories/host_vars, sops files.
- **Nothing was executed:** no make, npm, terraform, ansible or kubectl.
- **Leak check** (§9, Phase 3b), on everything under `seed/scanned/`:
  - `grep -rE '100\.[0-9]+…|token|password|secret'` matches only prose such as "External Secrets" or "Bearer token compared in constant time". It finds no values.
  - An extra grep for private IPs (10.x, 172.16–31.x, 192.168.x), `*.trngnneee.io.vn`, email addresses and chat IDs returns **nothing**.

## Decisions needed from you

| # | Question | Default in seed |
|---|---|---|
| D1 | Which projects to publish? | none |
| D2 | Which GitLab repos are public? Every repo is currently private on GitLab. | all `private` (badge "private repo", no link) |
| D3 | May the site mention any `*.trngnneee.io.vn` domain (list below)? | none mentioned |
| D4 | Landing page (B7): merge into the homelab project as its live demo (`homepage.trngnneee.io.vn`) or leave it out? | merged conceptually, `demoUrl: null` |
| D5 | Covers: no repo has diagrams or screenshots. Options: render the mermaid diagrams to PNG, take screenshots (landing page, ESP32 web UI, Spidey Mini App), or use the terminal fallback. | `null` → terminal fallback |
| D6 | ESP32-CAM: is it running 24/7? Its manifests are on a `feat/esp32cam` branch of `workloads`, not on main. | text says "on self-hosted Kubernetes" |
| D7 | Spidey and Family dates: git history starts 2026-10-11/12, but the READMEs mention migrating older bots. Use an earlier start date? | git dates |
| D8 | MCP platform: present it as "designed and specified by me, built with an AI coding agent"? Many files look agent-generated from the spec. | the "What I learned" section mentions spec-driven development |
| D9 | Add the 2 "+2 skills" from LinkedIn for NewEra? | not added |

## Projects

Sorted as seeded. The homelab project is first and `featured`, per your answer in §10.

### 1. `k8s-homelab-gitops` — Self-hosted Kubernetes Homelab with GitOps Auto-Deploy *(flagship, B1)*

| | |
|---|---|
| Sources | `iac/argocd-manager` (README, BOOTSTRAP, bootstrap/, applicationsets/, projects/, platform/*/values.yaml), `iac/routes` (+ `routes-esp32cam`, a worktree of the same repo), `app/workloads` (README, deploy/ structure), `iac/ansible/{master,worker,openbao}` (READMEs, playbooks, role task names, version keys only), `iac/terraform/kvm-vm` (versions.tf, resource types, variable names), `gitlab_cicd_template/*` (READMEs, templates) |
| Repos | `iac/argocd-manager` (used as `repoUrl`), `iac/routes`, `iac/terraform`, `iac/ansible/{ansible-master-node,ansible-worker-node,ansible-openbao}`, `app/workloads`, `gitlab_cicd_template/{gitlab-ci-template,gitlab_ci_test_build_bump_workloads}`, all at `https://gitlab.com/trngnneee/…` |
| Dates | 2026-09-02 → ongoing (last commit 2026-10-12). Commits: workloads 151, argocd-manager 48, routes 43, ansible-master 19, … |
| Verified | Terraform libvirt provider · kubeadm 1.36 via Ansible · Calico VXLAN · nodes only on NetBird `wt0` · Argo CD app-of-apps, 3 AppProjects, 5 ApplicationSets (git directory generator `deploy/*/*`) · APISIX Gateway API, hostNetwork DaemonSet · cert-manager wildcard via Cloudflare DNS-01 · OpenBao (AWS KMS auto-unseal) + External Secrets · local-path-provisioner · CI: test → buildah `production_DDMMYY_hhmmss` → bot bumps tag → Argo CD · CI joins NetBird netstack mode over SOCKS5 · kube-prometheus-stack + Grafana |
| **Corrected** | **Rancher has been removed** (commit "Remove Rancher from infra ApplicationSet"), so it is not in the tech stack. The README and BOOTSTRAP still mention it. The README also links `docs/architecture.md` and `docs/troubleshooting.md` ("13 incidents"), but **those files don't exist**, so no incident log was used. The README's "SSO/monitoring not yet" is outdated: both exist now. |
| Uncertain | Node count: the inventory wasn't opened, so no number is stated. Whether Terraform created every node: the module creates one VM per apply. |
| Excluded | NetBird IPs (master/workers/OpenBao), API endpoint, pod/service CIDRs, OpenBao KV paths, policies and roles, KMS alias and region, GitLab project ID, bot account name, kube-context and hostnames |

### 2. `mcp-infrastructure-platform` — Infrastructure MCP Platform *(B5 — candidate)*

| | |
|---|---|
| Sources | README, PROMPT.md (head), Makefile, root and per-package `pyproject.toml`, `docs/architecture.md`, `docs/gateway.md`, `docs/deployment.md`, `docs/*/tools.md` headers, gateway `main.py`/`registry.py`, `mcp_core/policy.py`, tool modules (grep) |
| Repo | `https://gitlab.com/trngnneee/app/mcp-server` — 2026-09-08 → 2026-10-12, 32 commits |
| Verified | **Tool counts recounted from code** (`grep name="…"` in `tools/`, matches the generated docs): KVM 42, K8s 38, OpenBao 37, GitLab 14, Outline 13, GitOps 12 = **156**. Python ≥ 3.12, `mypy --strict`, no arbitrary shell, K8s writes default to dry-run, GitOps only on `ai/` branches, Secret values stripped. 72 test files, 881 `def test_` functions. |
| Uncertain | Those counts are the full surface. The default OpenBao and K8s configs register fewer tools (admin and write tools are off). Versions are pyproject constraints, since there is no lockfile. The README mentions a `.github/workflows/ci.yml` that doesn't exist. The README and `docs/deployment.md` disagree on which servers are deployed. OpenBao `read_secret`/`create_token` return credentials **by design** (it can be turned off), so the description says "Secret values never leave the server" only for K8s. |
| Excluded | KVM host SSH user and paths, libvirt URIs, OpenBao address, mounts and roles, CI variables, NetBird URLs |

### 3. `spidey-bot` — Spidey, Personal AI Assistant on Telegram *(B2)*

| | |
|---|---|
| Sources | `core_bot` (README, package.json, Dockerfile, connectors.example.json, .gitlab-ci.yml, TELEGRAM_MESSAGE_STANDARD.md, src/ tree), `mcp_connector/kit` (README, ARCHITECTURE.md), each connector's README, package.json and `src/tools.ts` |
| Repos | `app/spidey_bot/core_bot` (`repoUrl`), `mcp_connector/{kit,reminder,mail_digest,k8s,expense_management,news_digest}` — 2026-10-11 → 2026-10-12 (see D7) |
| Verified | 5 connectors, **91 declared tools** (including hidden/button tools; about 90 are user-facing), 15 slash commands. MCP SDK 1.32, grammY, Gemini (`@google/genai`) + OpenRouter, React 19 Mini App, `node:sqlite`, OpenBao for AI settings, GitLab CI → Argo CD. |
| Note | `SYSTEM_DESIGN.md` in this repo **does not describe the bot**. It is a copy of the Astryx admin-template design doc, identical in family_bot, esp32_cam and landing_page. The real architecture is in `kit/ARCHITECTURE.md`. |
| Excluded | Internal service URLs, a private VPN IP of the PC hub, kit registry project IDs, OpenBao paths and roles, Prometheus hostname, service-account names |

### 4. `esp32-cam-home-camera` — ESP32-CAM Home Camera *(B6 — candidate)*

| | |
|---|---|
| Sources | README, TELEGRAM_MESSAGE_STANDARD.md, `firmware/platformio.ini` + README + `app.h` (version only), `esp32cam/` (README, Dockerfile, `bin/record.sh`), `web/` (README, go.mod, Dockerfile, ui/package.json, telegram.go command switch), `cam-test/` (README, compose images), .gitlab-ci.yml |
| Repo | `https://gitlab.com/trngnneee/app/esp32cam` — 2026-10-04 → 2026-10-10, 15 commits |
| Verified | MJPEG single-client firmware (~1,150 lines of C++, v1.2.0), go2rtc, ffmpeg 8 recorder writing 10-minute fMP4 segments, Go 1.26 + React 19 single binary (~18 MB distroless image), Telegram bot, GitLab CI → workloads bump → Argo CD, 33 Go tests |
| Uncertain | Deployment state (D6). I removed a "$10 camera" claim because no source states a price. |
| Excluded | Camera LAN IP and subnet, Wi-Fi details (`config.h` was never opened), stream-key mechanism, host/VM names, OpenBao paths, CI token variable. `cam-test/out/capture.jpg` is a real frame from inside the house and was **not** used as a cover. |

### 5. `pc-control` — PC Control, Telegram-operated Home Server *(B4)*

| | |
|---|---|
| Sources | `pc_control_agent` (README, pyproject, agent.example.yaml, .gitlab-ci.yml, systemd units), `pc_control_bot` (README, pyproject, requirements, Dockerfile, config.example.yaml, TELEGRAM_MESSAGE_STANDARD.md, `bot/handlers.py` command registration, deploy compose structure) |
| Repos | `app/pc_control/pc_control_bot` (`repoUrl`), `app/pc_control/pc_control_agent` — 2026-10-07 → 2026-10-12 |
| Verified | 15 commands plus `/pc_help`, a Tuya plug with a wattage threshold, a FastAPI agent with a fixed endpoint set and a sudoers whitelist, a monitor every 60 s, release/rollback deploys, 95 test functions |
| **Warning** | Both repos' **READMEs contain many private-network IPs**. Scrub them before making either repo public (D2). `deploy/vps/config.yaml` was not opened. |
| Excluded | VPS, PC, OpenBao and k8s IPs, hostnames, deploy user, AppRole policy, firewall/ACL details |

### 6. `family-bot` — Family Bot, AI Family Assistant on Zalo *(B3)*

| | |
|---|---|
| Sources | `core_bot` (README, package.json, Dockerfile, connectors.example.json, ZALO_MESSAGE_STANDARD.md, src/ tree), kit (README, ARCHITECTURE.md), connectors' READMEs and `tools.ts` |
| Repos | `app/family_bot/core_bot` (`repoUrl`), `mcp_connector/{kit,reminder,news_digest,calendar}` — all commits on 2026-10-12 |
| Shared code with Spidey | **Forked, not shared.** `family-kit` is a renamed copy of `spidey-kit`, published separately (`tz.ts` identical, `server.ts` about 20% changed, `_meta` prefix and message types reworked). The core is forked and heavily modified: it adds Zalo, a poller and provider fallback, and drops grammY, `@google/genai` and OpenBao. `reminder` and `news_digest` are forks, and `calendar` exists only here. Both use the same CI template `gitlab_ci_test_build_bump_workloads@v1.0.0`. |
| Verified | 3 connectors, 43 declared tools, 9 commands, Gemini (OpenAI-compatible) → Groq fallback, ~131 tests |
| Excluded | Zalo chat-ID fragments, **family members' names** used as examples in the README and message standard, internal URLs |

### B7 — Landing page (`app/landing_page`) — **not a separate entry**

A one-page React 19 + Astryx site about the homelab itself ("trngnneee · Homelab Infrastructure"). It is served by nginx-unprivileged on the cluster through an HTTPRoute.
- It has **no git repo or CI**, and its image is a Docker Hub tag (`1.1.0`), probably pushed by hand. On its own it would be a thin entry.
- **Recommendation:** use it as the homelab project's live demo and cover (D4/D5). A follow-up idea: move it onto the GitLab CI → Argo CD pipeline.
- **Exposure:** the deployed page already shows host and VM names, VM sizing, and the subdomains listed below. Please confirm that is intended.

## Domains found (not used anywhere in the seed — approve individually, D3)

| Domain | Seen in | Recommendation |
|---|---|---|
| `homepage.trngnneee.io.vn` | landing page route | OK as the homelab demo URL if you want |
| `argocd.`, `grafana.`, `uptime.`, `outline.`, `graylog.` | routes, landing page, mcp-server docs | Don't publish: admin UIs |
| `openbao.trngnneee.io.vn` | homelab, pc_control | **Don't publish** |
| `spidey.`, `family.`, `hub.` | bot READMEs | Don't publish unless the bot UIs are meant to be public |
| `cam.trngnneee.io.vn` | esp32_cam README | **Don't publish** (private camera; VPN-only) |

The routes README notes that public A records point to private overlay IPs. Listing these names on the site would map your internal services for anyone who reads it.

## Skills (`skills.ts`, all unpublished)

26 new skills, all checked against code or manifests:
- **languages:** Go
- **backend:** MCP, LLM tool calling
- **cloud_devops:** Kubernetes, Argo CD, Helm, Kustomize, GitLab CI, Buildah, Prometheus, Grafana, Google Cloud Platform (from your LinkedIn, not the scan)
- **infrastructure:** Terraform, Ansible, KVM/libvirt, Linux & systemd, Calico, NetBird/WireGuard, APISIX (Gateway API), cert-manager, OpenBao, External Secrets Operator, Cloudflare, nginx
- **other:** ESP32/PlatformIO, ffmpeg

Not added:
- Rancher, which has been removed.
- Smaller tools that already appear in project tech stacks: Hadolint, uv, Ruff, Tuya, go2rtc.

Some skills have no devicon icon (Kustomize, Buildah, Calico, NetBird, cert-manager, ESO, KVM, MCP, ffmpeg). Their `iconUrl` is `null`, and the frontend renders a text badge instead.

## After review

1. Edit `projects.ts`, `skills.ts` and `descriptions/*.md`: set `published: true` and fix wording, visibility and URLs.
2. Re-seed locally: `npm run seed -w backend -- --no-upload --force`. In production, run it without `--no-upload` yourself. Alternatively, toggle `published` and edit content in the admin dashboard once Phase 5 is done.
