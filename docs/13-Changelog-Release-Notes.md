# Change Log & Release Notes

**Repo:** github.com/Abdul-0708/imani-superdealer-app · branch `main`
Versioning: semantic-ish (feature releases bump minor). Update this file with every release.

---

## v1.9.0 — 2026-07-17 · "2FA for super admin" — schema v6

### Release notes
**Two-step verification (TOTP)** for super admin accounts, zero dependencies (pure-PHP RFC 6238 —
verified byte-exact against the RFC test vector, so Google Authenticator / Authy / Microsoft
Authenticator all work). Flow: Admin tab → **"Two-step verification (2FA)" panel → Enable** → scan
the QR (or type the manual key) → confirm with the current 6-digit code (the secret is only saved
after a correct code proves the scan worked). From then on sign-in = password → 6-digit code
screen. Protections: password alone grants **nothing** (pending state, verified 401), wrong codes
rejected, **6 wrong codes** kills the attempt, pending expires after 5 min, ±30 s clock-drift
tolerance, session only issued after the code. Disabling requires the current code. **Rescue** if
the phone is lost: phpMyAdmin → `users` table → clear `totp_secret` for the account → 2FA off.

### Changes
- **Schema v6** (self-upgrading): `users.totp_secret`
- `lib/helpers.php`: `totp_secret_new/b32_decode/totp_code/totp_verify` (RFC 6238, hash_equals)
- `api.php`: login parks 2FA users as pending (`need2fa`); new `login_2fa` (5-min window, 6-try
  cap), `totp_setup` / `totp_enable` / `totp_disable`; `me` returns `totp_on`
- `app.js`: 2FA code screen (one-time-code autocomplete), Admin security panel, QR enrol modal
  (qrcodejs from cdnjs — already CSP-allowed; manual key fallback); EN/SW strings. Assets `?v=11`,
  SW cache `imani-v11`
- Deploy: upload `api.php`, `app.js`, `index.html`, `sw.js`, `lib/helpers.php`, `lib/db.php`

---

## v1.8.0 — 2026-07-17 · "Security hardening + PWA"

### Release notes
Security pass to production grade. **CSRF**: every POST now requires a custom `X-Requested-With:
imani` header on top of the existing SameSite=Lax cookies — no cross-site page can forge a request
(verified: header-less POST → 403, with header → 200; CI asserts both). **Sessions** die 12 h after
sign-in (absolute lifetime), on top of regenerate-on-login and the 5-strike lockout already there.
**Transport**: `.htaccess` now forces HTTPS (proxy-safe), sends 180-day HSTS, a strict
**Content-Security-Policy** (only own code + the SheetJS CDN may run; nothing may frame the app),
X-Frame-Options DENY and a Permissions-Policy that switches off camera/mic/geolocation. Member
**passwords now need 8+ characters** everywhere (was 6 for admin-set ones).

The app is now an installable **PWA**: manifest + icon + a network-first service worker — BDOs add
it to the home screen and it opens full-screen like a native app; while online they always get the
newest version (nothing is pinned), offline the shell still opens and data calls fail with an
honest, translated "No connection" message. Tabs show **skeleton loaders** the instant they open.
Accessibility: global reduced-motion support, aria-labels on the reverse (×) buttons.

### Changes
- `api.php`: POST CSRF-header gate; `auth_at` stamp; password min 8 (admin_user_add/update)
- `lib/helpers.php`: 12 h absolute session lifetime in `current_user()`
- `.htaccess`: HTTPS redirect, HSTS, CSP, XFO DENY, Permissions-Policy
- `app.js`: api() always sends the CSRF header; friendly offline error (EN/SW); SW registration;
  aria-labels. `styles.css`: `.skel` shimmer, prefers-reduced-motion kill-switch
- NEW `sw.js` (network-first, never caches api.php), `manifest.webmanifest`, `icon.svg`
- CI: asserts the 403-without-header case, sends the header on login. Assets `?v=10`
- Deploy: upload `api.php`, `app.js`, `styles.css`, `index.html`, `.htaccess`, `lib/helpers.php`,
  `sw.js`, `manifest.webmanifest`, `icon.svg`

---

## v1.7.1 — 2026-07-17 · "Agent cards on phones"

### Release notes
On phones (≤640px) every agent table becomes **one card per agent**: bold name up top, a small
labelled meta line (acc · phone · branch · location), and the KPI chips on their own row under a
dashed divider — no more squinting at a dense table. The same markup still renders as a normal
table on desktop (pure CSS switch, zero behaviour change). **Phone numbers are now tap-to-call
links** everywhere (`tel:`), so a field BDO dials an agent in one tap. Applied to: Agents list,
My Base "mark KPIs", Priority-to-serve, Special (partner-served) and Inactive Agents tables.
Verified in light + dark themes at 375px — no horizontal scroll.

### Changes
- `app.js`: semantic cell classes (`c-name` / `c-meta` + `data-l` / `c-kpis` / `c-level`),
  `telHtml()` tap-to-call helper, `cardable`/`cardwrap` classes on the five agent tables
- `styles.css`: `@media (max-width:640px)` card transformation (flex rows, hidden thead,
  `::before` labels), `a.tel` styling. Assets `?v=9`
- Deploy: upload `app.js`, `styles.css`, `index.html`

---

## v1.7.0 — 2026-07-17 · "Agent-list-only KPIs, tap-and-confirm, modern buttons"

### Release notes
**Serving, visits and activeness now count ONLY from per-agent taps on the agent list** — typing
totals in the daily report no longer moves them (verified: typed visited/waked 99 changed nothing;
one agent tap moved visits 1→2). The daily report form keeps just **FLOAT + APK** (the two typed
KPIs), with an "Open agent list" shortcut for the rest. This way management always knows **which
agent was handled by which BDO**, and the next upload can flag mismatches. Chips read their state
plainly: **"Visit NO" → tap → "Confirm?" → tap → "Visit YES ✓ you"**; an inactive agent shows
**Wake** the same way. The two-tap confirm arms for 4 s then quietly reverts, so accidental clicks
die on their own. **All buttons were modernized** to one compact scale (primary 32px, outline 31px,
sidebar 22px) with press feedback, focus rings and faster taps (`touch-action: manipulation`);
tables use tabular numerals so columns stop wiggling.

### Changes
- `lib/helpers.php` `bdo_actuals()`: daily reports feed only float + APK; visit/active = ledger only
- `api.php` `daily_report_save`: still accepts old fields (stored 0) — backward compatible, no schema change
- `app.js`: Visit NO/YES chip states, two-tap confirm (`data-armed` + 4s auto-revert, translated
  "Thibitisha?"), daily form/history reduced to Float + APK, swapChip label parity
- `styles.css`: unified compact button system, `.kchip.arm` pulse (respects reduced-motion),
  focus-visible rings, tabular-nums. Assets `?v=8`
- Deploy: upload `app.js`, `styles.css`, `index.html`, `api.php`, `lib/helpers.php`

---

## v1.6.0 — 2026-07-17 · "Daily report in the trend, Swahili/English, UI polish"

### Release notes
A BDO's typed daily report moved his weighted score live (18% → 52% on submit) — **superseded in
v1.7.0**, where typed numbers count only for float + APK. **Swahili/English system languages**:
SW/EN toggle in the sidebar and login (persisted per device); interface wording translated
(Mawakala, Base ya Wakala Wangu, Ripoti ya Siku, Nenosiri, Toka…) while technical terms stay as
they are (KPI, acc, name, phone, branch, Served/Visit/APK/Active, float). **Partner column removed**
from the agents list. Sidebar action buttons reduced to a compact "tiny" row.

### Changes
- `app.js`: `LANG`/`SW` dictionary/`t()` + `toggleLang` (localStorage `imani_lang`); Daily Report
  tab gained the Performance-trend panel + cumulative totals; Partner column removed
- `styles.css`: `.tiny` button class. Assets `?v=7`
- Deploy: upload `app.js`, `styles.css`, `index.html`, `lib/helpers.php`

---

## v1.5.0 — 2026-07-16 · "Real status, reversals & mobile"

### Release notes
Agent chips now show the **real status straight from the uploaded file**: an agent Active in the
current month shows a locked "Active ✓" and **cannot be waked again** (server 409 "Agent is already
Active this month"); an Inactive agent shows a **Wake** button. Waking updates his real status and
counts only in that BDO's personal score — the office dashboard keeps the NET activeness
(waked − lost) from the Excel, now with a **robust month-column detector** (Activeness/APK columns
ordered by the month named in the header, so May/July files parse correctly whatever the working
month). **Reversals:** every live mark records its source; a BDO can reverse his own accidental
click (× on the chip, visible to everyone), the **OM can reverse any live mark**, and file-sourced
statuses are protected ("re-upload to change it"). The daily KPI report moved to its own **Daily
Report tab** (form + this month's history with OK/LATE). **BDO Performance lists every BDO
top-to-bottom** (no-target BDOs at the bottom). The agents panel fills the page (74vh) with a small
"Locations" download button, and the **mobile layout was overhauled** — no more merged/overlapping
items.

### Changes
- **Schema v5** (self-upgrading): `agent_month_kpi.source` ('upload'|'bdo')
- API: `kpi_mark` active-guard + act_current update; new `kpi_unmark` (own bdo-marks; OM any);
  `agents`/`base` return kpi as {by, src} + per-agent `actStatus`; `bdo_performance` lists all BDOs
- Parser: `pick_kpi_cols()` month-ordered current/previous detection for Activeness + APK
- Deploy: upload `api.php`, `app.js`, `styles.css`, `index.html`, `lib/db.php`, `lib/helpers.php`

## v1.4.x — 2026-07-14/15 · "Precise KPI rules + polish" (commits `d5e2d6e`, `0786c82`)

- Office KPIs come from the uploaded Excel snapshot (not BDO marks): weighted achievement with
  OM-set KPI weights incl. **Withdraw Volume** (office-wide, unattached); **APK counts at required
  version 2.0**; activeness = NET (waked − lost); Inactive Agents panel (all / previously-active);
  dashboard KPI visibility picker; exact bank-file headers (AGENT ACC, AgentName, " Servicing ",
  BranchName, Activeness_status_May/July, APK June/July, Withdraw Volume, Agent visit)
- In-place chip marking (no page reset) + search clears after serving; **light theme** toggle;
  today's date chip; daily report back-dating up to 2 days

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
