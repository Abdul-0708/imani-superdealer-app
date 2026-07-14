# Change Log & Release Notes

**Repo:** github.com/Abdul-0708/imani-superdealer-app · branch `main`
Versioning: semantic-ish (feature releases bump minor). Update this file with every release.

---

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
