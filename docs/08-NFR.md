# Non-Functional Requirements (NFR)

**System:** IMANI SUPERDEALER · **Version:** 1.2.0

| ID | Category | Requirement | Target / Verification |
|---|---|---|---|
| NFR-1 | Compatibility | Runs on commodity shared hosting | PHP 7.4+ (8.x recommended) + `pdo_mysql`; MySQL 5.7+/MariaDB 10.4+; no composer, no shell access, no daemons. Verified on cPanel + local PHP 8.3/MariaDB 10.11 |
| NFR-2 | Performance (server) | API actions p95 < 500 ms at current scale (≤ ~5k agents, ≤ 10 concurrent users) | Hot paths indexed: `idx_svc_month_bdo`, `idx_amk_bdo`, `uq_amk`, agents pagination LIMIT 50. Local measurements: 7–150 ms/action |
| NFR-3 | Performance (client) | First meaningful paint < 3 s on 3G-class mobile | No frameworks; 3 static files (~60 KB total) + one CDN script (SheetJS, cached); skeleton loaders |
| NFR-4 | Scalability | 10× data growth without redesign | Dominant tables grow ~10k rows/month at 1k agents (§3 of DB doc); pagination everywhere; queries keyed by month |
| NFR-5 | Availability | Business hours availability tied to host SLA; graceful DB-down behaviour | Generic 500 with readable message; no partial writes (single-statement or idempotent INSERT IGNORE flows) |
| NFR-6 | Data integrity | A KPI can never be credited twice in a month | DB unique key (race-safe), not application logic alone. Verified by concurrent-duplicate test |
| NFR-7 | Security | See [07-Security-RBAC.md](07-Security-RBAC.md) | bcrypt, lockout, server-side RBAC, prepared statements, column stripping, audit |
| NFR-8 | Usability | Field-usable on a phone by non-technical BDOs | ≤ 2 taps from login to marking a KPI; chips show state + owner; mobile layout ≤ 860 px |
| NFR-9 | Accessibility | Keyboard + screen-reader operable; colour never sole signal | Focus rings, aria-live toasts, dialog semantics, text on flags ("BELOW 50" / "EXCELLENT"), reduced-motion respected |
| NFR-10 | Maintainability | New module/role addable without schema redesign | Module = permission rows + API case + view fn; role = data row. Single-purpose files; ~2.5k LOC total |
| NFR-11 | Deployability | Full deploy or update ≤ 5 minutes by a non-developer | Upload folder + edit one config; schema self-creates/self-upgrades (`schema_version`); update = re-upload changed files |
| NFR-12 | Recoverability | RPO ≤ 24 h, RTO ≤ 1 h | Nightly `mysqldump` + code on GitHub; restore = import dump, upload code, restore config |
| NFR-13 | Auditability | Every state-changing action attributable | `audit` table (who/when/action/detail); admin-visible; 100-row API window, full history in DB |
| NFR-14 | Localisation | English UI; UTF-8 data end-to-end | utf8mb4 everywhere (Swahili agent names/locations safe). Swahili UI = future item |
| NFR-15 | Browser support | Last 2 versions of Chrome/Edge/Firefox/Safari + Android WebView | ES5-compatible patterns except fetch/Promise (universal since 2017); no build/transpile step |
| NFR-16 | Observability | Errors diagnosable on shared hosting | PHP error log (cPanel "Errors"), audit trail, `health` action for uptime monitoring |

## Capacity assumptions

Current: ~10–20 users (1 SA, 1 OM, 1 MD, 5–15 BDOs), ~1–5k agents, 4–6 uploads/month.
Design headroom: 100 concurrent sessions and 50k agents remain within shared-hosting limits;
beyond that, move to a VPS (same codebase) and add an object cache — no rewrite required.
