# Risk Register & Decision Log

**System:** IMANI SUPERDEALER · **Updated:** 2026-07-14

---

## 1. Risk register

Scoring: Likelihood × Impact (1–5 each). ≥15 red, 8–14 amber, <8 green.

| ID | Risk | L | I | Score | Mitigation / Owner | Status |
|---|---|---|---|---|---|---|
| R-1 | Seed passwords (`imani123`) left unchanged in production | 3 | 5 | 15 🔴 | Manual step in go-live checklist; Super Admin owns. Future: forced first-login change | Open — operator action |
| R-2 | No email reset → Super Admin account lockout means DB-level recovery | 2 | 4 | 8 🟡 | Keep 2 superadmin accounts or store password in a manager; recovery = UPDATE users SET password_hash via phpMyAdmin | Accepted |
| R-3 | Shared-hosting outage or host suspends account | 2 | 4 | 8 🟡 | Nightly DB dumps off-server + code on GitHub → restore anywhere in <1h | Mitigated |
| R-4 | No backups configured | 2 | 5 | 10 🟡 | Deployment guide §5 makes it explicit; helper owns the cron | Open — operator action |
| R-5 | Excel format drift from the bank (new headers) | 3 | 3 | 9 🟡 | Tolerant header matching (case/spacing/synonyms); worst case: 1-line parser addition | Mitigated |
| R-6 | Wrong upload into the wrong month | 2 | 3 | 6 🟢 | CLOSED months rejected; month shown in confirm summary; ledger INSERT IGNORE limits damage; commission re-upload replaces | Mitigated |
| R-7 | BDO disputes "who did the KPI first" | 2 | 2 | 4 🟢 | Ledger stores owner + timestamp; audit trail; message names the owner | Mitigated |
| R-8 | SheetJS CDN unreachable in the field | 2 | 2 | 4 🟢 | Only affects *uploads* (OM office task), not BDO marking; fallback: vendor the JS locally | Accepted |
| R-9 | Concurrent month close / double click | 1 | 3 | 3 🟢 | Close is idempotent-guarded (CLOSED re-close → 400); carry-forward INSERT IGNORE | Mitigated |
| R-10 | Custom role granted admin by mistake | 2 | 4 | 8 🟡 | Only Super Admin can edit matrix; audit logs permission saves; review quarterly | Accepted |
| R-11 | PHP version downgraded/misconfigured by host | 1 | 3 | 3 🟢 | Works on 7.4+; health check surfaces PHP version | Mitigated |
| R-12 | Personal data (agent phones/locations) leakage | 2 | 4 | 8 🟡 | Role-based column stripping; HTTPS; no public endpoints beyond login/health | Mitigated |

## 2. Decision log (ADR-style)

| ID | Date | Decision | Context & alternatives | Consequence |
|---|---|---|---|---|
| D-1 | 2026-07-10 | Build custom platform (Node.js originally) | Off-the-shelf CRM vs custom; spec had bespoke commission/KPI rules | Full fit to business rules |
| D-2 | 2026-07-13 | **Rewrite in plain PHP + MySQL** | Production host (cPanel) cannot run Node; alternatives: VPS (cost/ops) or serverless (complexity). Owner: "turn this into PHP… I don't want many things" | Zero-install deploys; Node preserved on `node-legacy`; dropped MFA/metrics/insights for leanness |
| D-3 | 2026-07-13 | Excel parsed **in the browser** (SheetJS), server receives JSON | Server-side parsing needs composer/PhpSpreadsheet (unavailable/heavy on shared hosting) | No upload size/PHP-ext issues; CDN dependency (R-8) |
| D-4 | 2026-07-13 | Schema **self-creates and self-upgrades** (`schema_version`) | Migration CLIs unusable on shared hosting without SSH | Deploy = file upload; upgrades run on first page load (v1→v2 backfilled ledger) |
| D-5 | 2026-07-13 | PHP **sessions** instead of JWT | Same-origin SPA; sessions are simpler and revocable instantly (active=0) | SameSite=Lax covers CSRF baseline; no token expiry management |
| D-6 | 2026-07-13 | RPC-style single `api.php?action=` router | REST paths need .htaccess rewrites (fragile across hosts) | One file to review; documented via mapping rule in OpenAPI |
| D-7 | 2026-07-13 | Month lifecycle OPEN→AWAITING→CLOSED with parallel months | Owner: new month must open for BDOs while previous waits for the bank's final file | Serving always targets newest OPEN; close carries priority base |
| D-8 | 2026-07-13 | **DB unique key** enforces once-per-month KPI (first-wins) | App-level checks alone lose races | Duplicate work is impossible, not just discouraged (R-7) |
| D-9 | 2026-07-13 | Per-BDO weighted scoring with OM-set weights summing to 100 | Fixed equal weights vs configurable | OM tunes emphasis per month; red<50 / excellent≥80 flags |
| D-10 | 2026-07-14 | BDOs see the whole uploaded list with server-side column stripping | Alternative: per-BDO visibility only — rejected because field teams share territory awareness | Confidential columns never leave the server (R-12) |
| D-11 | 2026-07-13 | Fire orange/yellow theme + sidebar navigation | Owner's explicit design brief | Distinct brand look; tokens centralised in styles.css |
| D-12 | 2026-07-13 | Passwords are admin-managed; no email subsystem | Email needs SMTP setup and adds failure modes; team is small | R-2 accepted; revisit if team grows |
