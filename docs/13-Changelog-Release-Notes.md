# Change Log & Release Notes

**Repo:** github.com/Abdul-0708/imani-superdealer-app · branch `main`
Versioning: semantic-ish (feature releases bump minor). Update this file with every release.

---

## v1.3.0 — 2026-07-14 · "Field operations pack"

### Release notes
Seventeen field-requested upgrades. BDOs now file a **typed daily report** (date, float served,
agents visited, inactive waked, APK updated) — float feeds their weighted score directly, and the
per-agent marks stay the proof for the rest. Reports are due **before midnight**: late ones show
LATE, and a missed **working day** shows a red MISS — with OM-configurable working days (default
Mon–Sat, per-BDO override e.g. Sunday-instead-of-Saturday). A new **Reports & Ranks** tab (visible
to everyone) adds daily/weekly/monthly **BDO rankings** (unique served, visits, activeness, APK when
present) and the **flag ranking**: when a released performance file says NOT SERVED for an agent a
BDO had marked served, that BDO is flagged for all to see. Serving now **requires the agent's
physical location** (typed once, remembered for future months); the OM can **download all agents
with known locations** as Excel any time and can upload a **priority base list** per BDO. Rows in a
performance file that are positive but carry no BDO are now credited to **PARTNERS** (not
"unassigned"), and partner-served agents appear to every BDO as **special agents** to adopt and
locate. Plus: OM **broadcast messages** shown on BDO screens, **float-shortage reporting**
(amount/reason/recovery, management-only visibility), live **search from the first letter** with
20/50/100 page sizes, in-place (faster) KPI marking, a **show-password** eye, and lockout now after
**5 attempts** with "contact your admin" guidance. The parser also picks the **current month's**
activeness column (e.g. "June Activeness" over "May") and reads Serving Status / Agent Visits
header variants.

### Changes
- **Schema v3** (self-upgrading): `daily_reports`, `flags`, `messages`, `float_shortages`,
  `users.working_days`, `working_days` setting, `reports` module permissions (om VE, md V, bdo V)
- New APIs: `daily_report_save/daily_reports_get`, `working_days_save`, `message_send/messages_get`,
  `shortage_save/shortages_get`, `flags_get`, `rank_get`, `agent_location_set`,
  `agents_location_export`; `kpi_mark` gains location enforcement; `upload_weekly` gains partner
  attribution, flag cross-check and `mode=priority`; `agents` gains `per` page size
- Deploy: upload `api.php`, `app.js`, `styles.css`, `index.html`, `lib/db.php`, `lib/helpers.php`;
  schema upgrades itself on first load

## v1.2.0 — 2026-07-14 · "Agent list for everyone" (commit `c1b41bc`)

### Release notes
Every BDO now sees the **whole uploaded agent list** (start-of-month or weekly) on a new
**All Agents** tab — with only Account, Name, Phone, Branch, **Physical Location** and live KPI
status. Confidential columns (commission, float, partner) are stripped **server-side**. KPI chips
on this list show who already attended each agent and allow marking open KPIs directly, so field
officers check the list before travelling and never repeat a colleague's work.

### Changes
- `agents` API: access widened to `mybase.v` callers with `restricted:true` column stripping; month KPI map included for all callers
- Front-end: `visibleModules()` gives BDOs the Agents tab; shared `kpiChips()` component; Physical Location column
- Docs: full documentation suite added under `docs/` (PRD, BRD, design, DB, API/OpenAPI, security, NFR, tests, deployment, manuals, risks, changelog)
- No schema change (stays v2) · Deploy: upload `api.php`, `app.js`, `index.html`

## v1.1.0 — 2026-07-13 · "KPI ledger & weighted scoring" (commit `a5c3c50`)

### Release notes
BDOs can now update an agent's monthly status themselves — **Served, Visit, APK, Active** — from
their base. Each action credits the BDO who did it, and an agent KPI done by *any* BDO locks for
everyone else ("Already done by X — no need to repeat"). The OM sets each BDO's monthly targets
for all five KPIs **with weight percentages** (must total 100); BDOs see their weighted score
live — **red below 50%, EXCELLENT at 80%+** — and the OM gets a ranked performance table.

### Changes
- **Schema v2** (self-upgrading): `agent_month_kpi` ledger (UNIQUE month+agent+kpi, first-wins, backfilled from history) and `bdo_targets` (targets + weights)
- New APIs: `kpi_mark`, `bdo_targets_get/save`, `bdo_performance`; `dashboard`/commission suggestion now read the ledger; weekly upload feeds the ledger
- UI: KPI chips (done/mine/todo/off), My Performance panel, BDO Targets & Weights editor with live 100% counter, ranked flag table, red/green bar variants
- Replaced the old single "Serve" action/modal

## v1.0.0 — 2026-07-13 · "PHP rewrite for shared hosting" (commit `c0b2a82`)

### Release notes
Complete rewrite from Node.js to **plain PHP + MySQL** because production hosting (cPanel) cannot
run Node. Deploy = upload one folder + one config file; the database creates and seeds itself.
New **fire orange/yellow** design with sidebar navigation. Simplified module set per owner request.

### Changes
- PHP 7.4+/8.x, PDO, PHP sessions, bcrypt, per-username lockout; `.htaccess` hardening
- Modules: Dashboard, My Agent Base, Agents, Weekly Upload, Monthly **typed** Targets, Commission & Months (OPEN→AWAITING→CLOSED lifecycle, 30/70 + release-table calculator, priority carry-forward), Admin (members incl. **custom roles** + redesigned View/Edit/Delete permission toggles, audit)
- Excel parsed in the browser (SheetJS) — server receives JSON only
- CI replaced: `php -l` lint + MySQL 8 API smoke test
- **Removed** vs Node version: MFA, Prometheus metrics, AI insights, clawback, analytics charts, verification/data-quality screens
- Node.js implementation preserved on branch **`node-legacy`** (16d4af0)

## v0.x — 2026-07-10 → 2026-07-12 · Node.js era (branch `node-legacy`)

- `ced1d45` Initial platform: Node/Express + MySQL/file-driver, RBAC + superadmin matrix, agent lifecycle, verification & false-claim dashboards, commission + clawback intelligence, executive dashboard, AI insights (local), MFA (TOTP), Docker, CI, monitoring (Prometheus), migrations; 103-assertion smoke suite
- `16d4af0` Deployment handoff guide

---

### Upgrade compatibility matrix

| From → To | Data | Action |
|---|---|---|
| v1.1 → v1.2 | No schema change | Upload 3 changed files |
| v1.0 → v1.1/1.2 | Schema v1 → v2 auto-upgrades on first load; ledger backfilled from service history | Upload files; verify with a `health` call |
| node-legacy → v1.x | **No automatic data migration** (different schema) | Fresh install; re-upload source Excels |
