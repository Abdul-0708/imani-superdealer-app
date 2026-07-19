# Change Log & Release Notes

**Repo:** github.com/Abdul-0708/imani-superdealer-app · branch `main`
Versioning: semantic-ish (feature releases bump minor). Update this file with every release.

---

## v1.16.1 — 2026-07-19 · "Serving UX + orphan-mark take-over"

Four field-reported fixes:
- **Members can take over ORPHAN marks** (owned by `unassigned` / `partners`) on the agent list and
  serve the agent themselves — but they still CANNOT touch a fellow BDO's personal mark (server:
  403 "belongs to <bdo>"). The chip shows a × titled "Take over / clear this <owner> mark".
  Verified: Mary cleared a `partners` mark and served the agent; John's mark stayed protected.
- **Activeness chip fixed**: an unknown/blank status no longer shows a misleading orange "Active"
  button. Only a real ACTIVE status from the file shows the green **Active ✓**; everything else
  reads **Inactive (wake up)**.
- **No more page reset when serving**: marking/reversing a KPI now swaps only that chip in place
  and shows a small "Status updated" toast — the BDO keeps his scroll position and carries on
  (verified: scrollY unchanged after serving mid-list).
- **Search no longer sticks**: navigating away from the agent list and back starts clean (search
  box + KPI filters reset on tab change).

### Changes
- `api.php` `kpi_unmark`: orphan owners (`unassigned`,`partners`) reversible by any BDO; fellow-BDO
  marks blocked; own live-mark 6h window unchanged
- `app.js`: activeness chip collapses unknown→Inactive; `kpiMark` swaps in place only (no reload);
  `kpiUnmark` swaps the chip back to its todo label in place; tab switch clears agent search/filters;
  orphan × on chips. Assets `?v=22`, SW `imani-v22`

---

## v1.16.0 — 2026-07-19 · "Team leader, routes, two-way messages, EAT" — schema v10

### Release notes
- **EAT everywhere**: the whole server runs on Africa/Nairobi (+3); every date, cutoff and
  greeting uses the business clock.
- **Greetings**: "GOOD MORNING, ALEX — WELCOME 👋" (time-of-day, EAT) tops the dashboards.
- **Agent search filters**: pick WHICH column to search (Account / Name / Phone / Branch /
  Physical Location) + one-tap KPI filters (Served/Not Served, Visit YES/NO, APK YES/NO,
  Active/Inactive). Chips now read **Not Served / Visit NO / APK NO / Inactive (wake up)**.
- **BDO's Reports & Ranks**: he sees ONLY his own report days (server-enforced) plus one list —
  **Top performing by weighted score** (everyone ranked).
- **Messages 2.0**: new **Messages tab** for every member — newest first, **Reply** to the sender,
  **Delete for me** (per-user; sender's copy stays). BDOs get a **Market feedback** composer
  (complaints/opinions/suggestions) that lands only in the team leader's and OM's box (verified:
  invisible to other BDOs).
- **TEAM LEADER role** (assign in Admin): sees every BDO's reports/activities, messages all BDOs,
  **approves float shortages before top management sees them** (verified: MD saw 0 until approval),
  and runs **daily route plans**: BDOs write their route before **10:00 EAT** (server-enforced —
  late submissions are rejected), the leader approves/rejects or **assigns** a route himself.

### Changes
- **Schema v10**: messages.kind/reply_to, msg_hidden, route_plans, float_shortages.status/
  approved_by, `teamleader` role + permissions
- `api.php`: agents field+KPI filters; daily_reports_get scoped; bdo_rank_public; messages_get
  rework + message_dismiss/message_reply/feedback_send; shortages_get role-filtered +
  shortage_approve; route_plan_save/get/review + route_assign
- `app.js`: greetingLine (EAT), filter bar, chip labels, BDO reports branch, weighted-rank panel,
  leader route+shortage panels, Messages tab, route panel on Daily. Assets `?v=21`, SW `imani-v21`

---

## v1.15.0 — 2026-07-19 · "SA stations, APK = upgraders, specialist station panels"

### Release notes
**SA-station dashboard.** The upload now reads the **SA STATION** column (Arusha / Manyara / …),
stores it on every agent, and builds a per-station breakdown inside the month snapshot. The OM's
dashboard gained an **SA Station picker**: choose a station and every KPI card retitles and shows
that station's numbers — including the **withdraw-volume sum for that station only** (verified:
ARUSHA 700,000 vs MANYARA 300,000, exact per-row sums). Target attainment stays office-wide.

**APK now counts UPGRADERS only.** The dashboard APK number counts agents who were **below the
required version (or unknown) last month and at/above it this month** — mirroring how "waked"
works for activeness. An agent already on 2.0 last month no longer inflates the card (verified:
3 agents on 2.0+, only 2 upgraded → card reads 2). The card reads "APK upgraded to 2.0+ · was
below 2.0 last month". Upload ledger APK credits to BDOs follow the same rule.

**Specialist station panels.** The Inactive Agents panel (now also on the activeness specialist's
My Base) is **grouped by SA station**, with the two lists he works: **were ACTIVE last month → now
inactive** (first) and **all inactive**. Each agent row has **Wake** (receipt proof + location
confirm flow) and **Won't return** right there.

### Changes
- `lib/helpers.php`: parse_weekly_row picks SA STATION (uppercased)
- `api.php`: upload builds `_stations` breakdown in the snapshot (rides through upload_erase
  fallback automatically), saves agent.station, `apk_up` rule for stats + ledger;
  `dashboard` accepts `station` (stations list + stationStats + filtered agent count);
  `inactive_agents` returns station, ordered by station
- `app.js`: dashboard SA Station select + per-station cards, APK card relabel; inactivePanelLoad
  grouped by station with Wake / Won't-return actions; panel added to specialist My Base.
  Assets `?v=20`, SW `imani-v20`
- Note: station numbers appear after the next upload (existing snapshots have no breakdown)

---

## v1.14.1 — 2026-07-19 · "BDO erase = truly zero + OM overturns file ticks"

### Release notes
Two fixes from the field. **(1) Erasing a BDO now takes him to ZERO.** Before, the eraser removed
only his live taps — the credits the uploaded Excel gave him (served/visit/apk/active by him, his
float rows) and his saved base survived, so his dashboard still read numbers. Now `erase_bdo_data`
removes **everything attributed to him**: all ledger marks regardless of source, all his service
rows, his entire saved base, plus the previous items. Verified: upload gave Mary base 6 / score
22% / float 150,000 → erase → base 0 / score 0 / float 0, and no chip anywhere still says "by
mary". Office month totals (the dashboard snapshot) are separate and stay until uploads are erased
in the Data Manager. **(2) OM overturns ANY tick** on the agent list — including served / visits /
APK / activeness that came from the uploaded file (chips titled "from file" now show the × for the
OM). Overturning a file-served also removes the file's service rows for that agent+BDO so his
float drops (verified served 2→1, float 150,000→60,000). BDOs remain restricted to their own live
marks within the 6-hour window.

### Changes
- `lib/helpers.php` `erase_bdo_data()`: deletes ledger marks (all sources), service_history (all
  sources), `base` rows; proof cleanup covers upload-attributed marks
- `api.php` `kpi_unmark`: OM may reverse `source='upload'`; file-served reversal deletes the
  file's service rows for that agent+BDO; `bdo_data_summary` counts all attributed marks
- `app.js`: × shown to OM on file-sourced chips; Data Manager notes updated. Assets `?v=19`,
  SW `imani-v19`

---

## v1.14.0 — 2026-07-19 · "Data Manager tab + upload registry" — schema v9

### Release notes
Why "erased BDO data but reports still read": the remaining numbers were **Excel-attributed** —
the uploaded file credits work to BDOs, and that is office data the BDO-eraser deliberately keeps.
Now there is a dedicated **Data Manager tab** (OM + super admin) with every eraser in one place:

- **Uploaded Excel files registry** — every upload is now saved with its exact **date & time**,
  a **label** (typed at upload or auto), who uploaded it and how many rows. Buttons per upload:
  **Rename** and **Erase** (removes its rows + the credits it created; the month's office numbers
  fall back to the latest remaining upload). Verified: John read served 2 / float 200,000 from a
  test upload → erase that upload → 0 / 0.
- **Erase ALL Excel data** — one button: every upload, office snapshot and file status gone;
  agents (the roster) and BDO live work stay.
- **One BDO — inspect & erase** (moved here from Reports): counts, per-report deletes, erase
  month/all with type-his-username confirm.
- **Tick members or take everyone** — checkbox list + scope (month/everything) + **Erase ticked**
  / **Erase ALL BDO data at once**. Verified multi (mary+john) and ALL (all three).

Every big eraser demands typing **ERASE**; everything is audit-logged; BDOs get 403 on all of it;
performance and reports recalculate instantly.

### Changes
- **Schema v9** (self-upgrading): `uploads` table (month, week, label, by_user, rows_count,
  stats snapshot, at); `service_history.upload_id` + `agent_month_kpi.upload_id`
- `api.php`: upload_weekly registers the upload + tags all rows/credits; `uploads_list`,
  `upload_label`, `upload_erase` (snapshot fallback), `excel_erase_all`; `bdo_data_erase` now
  takes a ticked list or ALL. `lib/helpers.php`: `erase_bdo_data()`, `setting_del()`
- `app.js`: Data Manager tab (agents.e), upload Label field, dmConfirm type-ERASE pattern;
  danger panel removed from Reports. Assets `?v=18`, SW `imani-v18`
- Deploy: cPanel Git pull + Deploy HEAD Commit

---

## v1.13.0 — 2026-07-18 · "BDO data control for OM/admin"

### Release notes
Reports tab gained a **"BDO data (danger zone)"** panel for the OM and super admin. Pick a BDO →
**Load his data** → see counts (marks, typed reports, won't-return, forms, shortages) and his
typed daily reports with a **Delete** per row (the day reads as missed again). Two red buttons:
**Erase THIS MONTH** and **Erase EVERYTHING** — both demand typing his username to confirm.
Erasing removes everything HE filled (live agent marks + their proof photos, typed reports,
won't-return marks, pipeline forms, shortages); agents he waked go back to INACTIVE; **uploaded
Excel data always stays** (it is office data). Performance and every report recalculate instantly —
verified live: Mary 43% → 15% the moment her month was erased. Single agent marks are still
reversed with the × on chips (OM has no time limit). Guards: BDOs get 403, you cannot erase
yourself or a super admin, every erase is audit-logged with counts.

### Changes
- `api.php`: `bdo_data_summary`, `daily_report_delete`, `bdo_data_erase` (scope month/all,
  proof-file cleanup, act_current reset, per-table counts in the audit trail)
- `app.js`: danger-zone panel + bdLoad/bdErase confirm-by-username flow. Assets `?v=17`,
  SW `imani-v17`
- Deploy: cPanel Git pull + Deploy HEAD Commit (`api.php`, `app.js`, `index.html`, `sw.js`)

---

## v1.12.1 — 2026-07-18 · "Specialist field work auto-counts as his report"

Any real field action the activeness specialist takes (wake, won't-return, pipeline form/stage,
recruit) stamps that day's daily report as SENT automatically (same-day, never LATE, note
"auto: activeness field work"). Days with no field work still read as missed. Verified: one
won't-return mark → OM range report shows him reported 1 / missed 0. No-op for other BDOs.
Server-only (`api.php`, `lib/helpers.php`).

---

## v1.12.0 — 2026-07-18 · "Personal BDO dashboards + specialist workflow complete"

### Release notes
**Every BDO now lands on "My Dashboard"** — his own performance only (score pill, weighted KPI
bars, his base counts). No office KPIs, no office targets, nothing that isn't his. The OM/MD
office dashboard is untouched.

**The activeness specialist is now fully self-contained:**
- **Scored on activeness ONLY** — waked + recruited vs his activeness target (verified 20%=2/10);
  the OM's ranked table uses the same rule for him. Other KPIs don't exist in his world.
- **His Daily Report types NOTHING** — it is computed live from what he actually did, so it always
  matches his agent list and forms: *Inactive visited* (waked + won't-return), *Waked up*,
  *Confirmed won't return*, *Forms submitted* (+ how many became agents). No float-shortage button.
- **New-agent flow starts with a choice:** "Agent recruited ALREADY" (name, acc, branch, phone,
  location — done) or "Form TO BE SUBMITTED" (the staged pipeline).
- **Waking now also confirms the agent's physical location** for the follow-up team: the wake modal
  asks for it (prefilled when known), the server refuses a wake without one, and the typed location
  is saved on the agent. Verified: words-without-location blocked, words+location → waked + stored.

### Changes
- `lib/helpers.php`: `bdo_score_specialist()` (activeness-only, weight 100), `user_specialty()`
- `api.php`: `base` + `bdo_performance` branch on specialty; new `specialist_summary` (computed
  counts; recruits excluded from "waked"); kpi_mark wake requires location (typed or known),
  saves it, echoes `agentLoc` for prefill
- `app.js`: Dashboard tab visible to `mybase` viewers → `personalDashboard()`; specialist Daily
  = computed cards + pipeline; recruit chooser modal; proofModal location field with combined
  enable logic; EN/SW strings. Assets `?v=16`, SW `imani-v16`
- Deploy: cPanel Git pull + Deploy HEAD Commit (`api.php`, `app.js`, `index.html`, `sw.js`,
  `lib/helpers.php`)

---

## v1.11.0 — 2026-07-18 · "Activeness specialist, recruitment pipeline, message manager" — schema v8

### Release notes
**Activeness specialist.** Admin marks one BDO's *Specialty* as **Activeness (wake + recruit
only)**. His agent lists then show ONLY the Wake chip (Served/Visit/APK hidden), and every agent
carries an info line: **last transaction date (+days ago), last month's status, current status**.
Waking still demands proof — now a receipt photo **or a typed commitment** (min 10 chars, e.g.
"Nimeona float statement yake tawini leo"); the eye icon shows whichever was given.

**Recruitment pipeline (his Daily Report tab).** Stage flow exactly as the business runs it:
**1** form submitted at a branch, held by the named **BANK CHAMPION** → **2** passed bank audit →
**3** approved → **4** paid + POS assigned → **5** acc + physical location filled → the recruit
becomes a real **NEW + ACTIVE** agent and the activeness credit lands on the BDO. Each stage is
timestamped; finishing without acc/location is rejected; a done recruit can't be advanced again.
**OM downloads the whole pipeline by stages** (Excel, one row per recruit with all stage dates).

**Won't-return list.** The specialist marks inactive agents he contacted who **confirmed they
won't return** (with a note of what they said). They show a red WON'T RETURN pill and land on a
list the **OM downloads** for the deletion discussion.

**OM message manager.** Send to **everyone or one chosen member** (verified: a message to peter was
invisible to mary), and **edit or delete** anything you sent, any time.

### Changes
- **Schema v8** (self-upgrading): `users.specialty`, `messages.to_user`,
  `agent_month_kpi.proof_note`, tables `recruits` + `wont_return`
- `api.php`: specialty in auth payloads + admin update; `message_send(to)` / `messages_sent` /
  `message_update` / `message_delete` / `members_list`; kpi_mark proof-or-note; kpi maps expose
  note; agents/base add `lastTx` / `actPrev` / `wontReturn`; `recruit_pipe_add/advance/list`;
  `wont_return_toggle/list`
- `app.js`: specialist mode (wake-only chips, info line, won't-return flow), pipeline panel +
  stage modals, proof-by-words input, OM message manager, pipeline + won't-return Excel buttons,
  Admin specialty dropdown; EN/SW strings. Assets `?v=14`, SW `imani-v14`
- Deploy: cPanel Git pull + Deploy HEAD Commit (`api.php`, `app.js`, `index.html`, `sw.js`,
  `lib/db.php`, `lib/helpers.php`)

---

## v1.10.1 — 2026-07-18 · "Modal fix, 6-hour correction window, report discipline"

### Release notes
**Modal fix** (live-site bug): modal title icons rendered full-screen and pushed the save button
off the page — icons are now 18 px, modals scroll (max 92 vh), the receipt preview is capped, and
the Save button is always reachable. **Correction window:** a BDO can reverse his OWN wrong tap
only within **6 hours** of making it (server-enforced, measured on the DB clock so PHP/DB timezone
differences can't shift it — verified: 4 h-old mark reversible, 10 h-old blocked with "ask your
OM"). Uploaded-Excel statuses stay untouchable for BDOs as before. **The OM has NO time limit** —
he can return an agent's status any time, and the reversal updates that BDO's score against his
targets immediately. **Report discipline in the range report:** the OM's "Download BDO Report"
gained a *Daily reports (sent/missed)* option — per BDO it adds **Reports sent**, **Reports
missed** (working days in the range with no report, future days excluded) and **Late reports**
(sent after midnight). Verified: Mon–Sat range with 1 report → sent 1 / missed 5.

### Changes
- `styles.css`: `.modalbox` max-height + scroll, `h2 svg` 18 px, img cap. Assets `?v=13`
- `api.php`: kpi_unmark 6-h window via `TIMESTAMPDIFF` (OM exempt); `bdo_range_report` +
  `reports` option (working_days_for per BDO, late = created after report date)
- `app.js`: report checkbox + Reports sent/missed/Late columns, smaller proof preview
- Deploy: pull + Deploy HEAD Commit in cPanel Git (`api.php`, `app.js`, `styles.css`,
  `index.html`, `sw.js`)

---

## v1.10.0 — 2026-07-18 · "Wake proof, field recruitment, range reports" — schema v7

### Release notes
**Waking needs proof.** Turning an INACTIVE agent Active now forces the BDO to photograph the
agent's **transaction receipts**: the Wake tap opens a camera prompt, the photo is downscaled on
the phone (max 1280 px JPEG — fast even on slow networks), checked server-side (real image, ≤4 MB)
and stored under a random name that only the API can serve (auth-checked; direct URL access is
denied). Everyone sees a small **eye icon** on the waked chip — management opens the receipt in one
tap. No photo → no wake → no credit.

**Recruiting counts as Activeness.** The BDO taps **"+ Recruit new agent"** on My Base and fills
acc name, acc number, branch, phone and physical location (all required; duplicate acc numbers are
caught — 409 points him to the agent list). The agent joins his base as **NEW + ACTIVE** and the
activeness credit lands in HIS performance instantly (verified 3→4 on recruit), reversible like any
live mark.

**OM downloads any date range.** New "Download BDO Report (Excel)" panel on Targets: pick From/To
dates and tick the KPIs you want (Served, Float, Visits, APK, Activeness) — one row per BDO.
Served/Visits/Activeness count dated agent marks; Float/APK come from dated daily reports (APK uses
the same max-of-marks-or-typed rule as the monthly score). BDOs cannot pull it (403).

### Changes
- **Schema v7** (self-upgrading): `agent_month_kpi.proof`
- `lib/helpers.php`: `save_proof_image()` (data-URL decode, magic-byte + size check, random name)
- `api.php`: kpi_mark proof gate on INACTIVE wakes; `wake_proof` (auth-checked image serve);
  `agent_recruit`; `bdo_range_report`; kpi maps expose `proof`; recruits classify as NEW
- `app.js`: proofModal (camera capture + canvas downscale), viewProof modal, recruitModal,
  rangeReportPanel + Excel writer, eye icon on proven chips, EN/SW strings
- NEW `uploads/.htaccess` (deny all - photos only via API). Assets `?v=12`, SW cache `imani-v12`
- Deploy: upload `api.php`, `app.js`, `styles.css`, `index.html`, `sw.js`, `lib/helpers.php`,
  `lib/db.php`, and the `uploads/` folder (with its `.htaccess`)

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
