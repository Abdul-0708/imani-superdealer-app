# Change Log & Release Notes

**Repo:** github.com/Abdul-0708/imani-superdealer-app · branch `main`
Versioning: semantic-ish (feature releases bump minor). Update this file with every release.

---

## v1.29.0 — 2026-08-01 · "The month turns itself over"

**The new month opens by itself.** Everything is already keyed by month — the KPI ledger, the bases,
the history, the flags — so a fresh month reads zero for free. What was missing was anybody *opening*
it, so the app sat on the old month until the OM remembered to press a button. On the first request
of a new calendar month (EAT) the app now rolls itself: every agent reads **0 on every KPI**, every
**BDO base is empty**, and the team starts clean.

The ended month goes to **AWAITING, not CLOSED** — its final performance file has not arrived, and
the OM still has to upload it to settle the achievement and commission. AWAITING months stay fully
uploadable, and the dashboard now carries a banner naming every month still owing its final file
with a jump straight to Weekly Upload.

There is no cron on shared hosting, so the roll runs lazily on the first request. A one-shot marker
row claims the work so two simultaneous requests cannot both perform it.
**Verified**: app parked on 2026-06 with a calendar of 2026-08 → one request produced
`2026-06 AWAITING · 2026-08 OPEN`; all six test agents read **0 KPIs** with blank activeness; My
Agent Base **0** on every count; and six further requests produced **no duplicate** work.

**Every BDO is told what to chase on day one.** As the month opens, each BDO is messaged the high
earners he served last month on **lists A–D** so he re-serves them inside the first week:
*"NEW MONTH 2026-08. Last month you served 4 high earners on lists A-D. Serve them again in the FIRST
WEEK so they are not lost: LIST A: 1 (…) | LIST B: 1 (…) …"*. Lists E and F are deliberately left
out, and the message lands with the unread badge from v1.24. Verified E and F were excluded.

**Targets for every BDO in one entry.** Typing the same five figures officer by officer was the
slowest job of the month. The BDO Targets panel gained **"Apply these to ALL BDOs"** (confirms first,
since it overwrites) and **"Only fill BDOs with no targets yet"**, which leaves anything already
tailored by hand alone. Individual officers are still adjusted in their own card afterwards.
Verified: one call set all 3 BDOs; after hand-tailoring John to 99, the *only-missing* run reported
`set 0, kept 3` and John's 99 survived.

**A first-request ordering bug, found in testing:** rolling lazily inside `open_month()` was not
enough — a handler that reads month data *before* calling it (the months list did exactly that)
answered from the old month on the very first request of a new one. The roll now runs at the top of
the API router, so every handler in the request sees the same already-rolled state.

**And the `t` shadowing trap, disarmed for good.** Adding translated strings to the BDO Targets panel
blanked the tab with *"t is not a function"* — the panel declared `var t` for its target row,
shadowing the global translator. This is the third time this trap has fired in this codebase, so
rather than fix only the one site, all remaining shadows were renamed (`toast`, `defaultTab`, the
attainment filter, the per-KPI mini-pills). A sweep now reports **0 shadowing sites** in `app.js`.

- Assets `?v=44`, SW `imani-v44`

---

## v1.28.0 — 2026-07-31 · "One rule for a partner-served agent a BDO also claims"

An agent the file credits to the **PARTNER** and a BDO also marks was resolved by **timing**, not by
a rule, and the two outcomes were opposites:

- **BDO tapped first** → the upload's `INSERT IGNORE` was dropped, he kept the credit, and because
  the flag check only asked *"was this agent served at all?"* the partner's own row **vindicated
  him**. No flag, no receipt, no record of the dispute.
- **File landed first** → his tap was refused outright with *"Already done by partners"*.

Both now follow the decision the OM made: **the BDO keeps the credit, and the OM is told.**

- **Serving is only "backed" when the file names an officer.** A row the file attributes to the
  partner no longer vindicates a BDO who claims the same agent — he is flagged:
  *"Marked SERVED by john but the performance file credits the PARTNER with serving this agent."*
  This applies to **serving only**, which is where the partner concept lives; visits/APK/activeness
  are unchanged, so there is no flag storm.
- **The flag is raised the moment he claims**, not at the next upload, so the dispute reaches the OM
  while the visit is fresh.
- **The receipt photo is compulsory for this claim** whatever the global Serving-receipt setting
  says — this is the one case where evidence is the whole argument. The serve dialog warns him
  before he types anything: *"The file says the PARTNER served this agent… your OM is told so he can
  decide."*
- **Once claimed, the agent leaves the "Special agents — served by PARTNERS" list** and appears in
  that BDO's My Agent Base. (Both already followed the ledger, so this fell out correctly.)

**Verified both orderings produce the identical result** — same credit holder, same flag text:
file-first (take over → refused without photo → accepted with photo → flag + moved off the partner
list) and BDO-first (tap → upload credits partner → same flag). A control agent whose file row
**names** the BDO is still backed with **no flag**.

**Bug found while building this:** taking over a partner mark deleted the file's own
`service_history` row, erasing the evidence that the partner had served the agent — which silently
disabled both the receipt requirement and the flag. Only an **OM overturning** may now delete a file
row; a BDO claiming an unnamed one leaves the office record intact.

- Assets `?v=43`, SW `imani-v43`

---

## v1.27.0 — 2026-07-30 · "Activeness is a net, and a losing month costs the score"

Activeness in Real Performance was a **tally of wakes**, so it could only ever go up. The agents who
fell asleep during the same month were never subtracted, and a month that woke 4 while losing 9 still
read as positive progress.

- **Activeness = waked − slept.** The window now subtracts the agents whose status went ACTIVE →
  INACTIVE this month, and shows the arithmetic on the row (`4 waked − 9 slept`) so a bad month is
  explained rather than merely reported. "Slept" is read from the agents' own transition snapshot,
  not the upload blob, so it still respects the v1.25 rule that an agent a BDO woke stays awake.
- **A negative deviation now SUBTRACTS from the total weighted KPI.** Per-KPI percentages are capped
  at 100 above (as before) but deliberately **not floored at 0**, so a real loss pulls the weighted
  average down instead of merely failing to add to it.
  **Verified**: 4 waked − 9 slept = **−5** against a target of 5 = **−100%**, which at a weight of 10
  took the weighted average from what would have been 90% down to **72%** — an 18-point cost.
  Hand-calculation `(100×30 + 100×20 + 100×20 + 40×10 + (−100)×10 + 80×10) / 100 = 72` matched the
  server exactly.
- **A negative KPI renders as an empty red track** with a `GOING BACKWARDS` pill, and the combined
  figure turns red. (A negative bar width is invalid CSS and browsers paint it *full*, which would
  have read as "target smashed" when the truth was the opposite — the same trap fixed on the
  dashboard in v1.19.)
- The Excel export gained a **Slept (subtracted)** column so the arithmetic survives the download.

- Assets `?v=42`, SW `imani-v42`

---

## v1.26.1 — 2026-07-30 · "Real Performance shows the weighted average"

Real Performance listed each KPI's own attainment but never rolled them up, so there was no single
weighted score for the station — only individual KPI percentages.

- **All six weighted office KPIs** are now in the table (serving, float, visits, APK, activeness,
  withdraw), each with its **Weight %** column, so it is visible how each one feeds the score.
  Withdraw volume has no field half — no BDO taps a withdraw — so its "from field" is always 0.
- **A WEIGHTED AVERAGE row** closes the table, and three headline cards sit above it:
  **Weighted achievement** (file + field), **Office score**, and the **Difference** between them.
  Percentages are capped at 100 per KPI exactly as `office_attainment` does, and weights renormalise
  over the KPIs that actually have a target — with no weights set it degrades to a plain average.
- **Verified against a hand calculation**: (50×30 + 0×20 + 30×20 + 40×10 + 40×10 + 0×10) / 100 =
  **29%**, matching the server exactly, with the file-only share at 3%.
- **The two screens are now provably consistent**: the Office score is taken from
  `office_attainment` itself rather than recomputed, so it cannot drift from the dashboard. Verified
  with a real uploaded file: dashboard **33%**, Office score **33%**, combined **62%**.

Two fixes found while building it:

- **The station picker was empty before the month's first upload.** It was populated only from the
  uploaded snapshot, so the OM could not scope the window at all early in the month — even with
  per-station targets typed and BDOs already working. It now offers the union of the snapshot, the
  agents' own regions, the month's target rows and the home station.
- **A mislabelled comparison.** The card read "From the file alone — what the dashboard shows", but
  that figure is the file's *share of the combined credits*, which is not the same number once a
  snapshot exists. The card now shows the dashboard's actual figure and says plainly whether it came
  from an uploaded file or from the live-marks fallback.

- Assets `?v=41`, SW `imani-v41`

---

## v1.26.0 — 2026-07-30 · "Real Performance: file + field, counted once" — schema v15

### Release notes
**A new OM window that answers "what did we actually do".** The dashboard answers "what did the
office file say" — main KPIs come from the uploaded Excel and always will. **Real Performance** adds
the work the BDOs did in the field on top of it and shows the combined result against target, per
KPI and per BDO, with an Excel export.

**Nothing is counted twice, and that is structural rather than arithmetic.** The ledger
`agent_month_kpi` carries `UNIQUE(month, agent_id, kpi)`, so an agent can hold exactly **one** credit
for a KPI in a month no matter how many uploads mention him or how many times he is tapped — the
first credit wins, the rest are ignored. So "From file" and "From field" are disjoint sets by
construction and their sum is the true figure, not an estimate. The window states this rule on
screen so it can be trusted rather than taken on faith.
**Verified** on a deliberate overlap: an agent claimed by *both* a BDO's field tap and the uploaded
file holds **1** served credit, and across the test set `from file (1) + from field (3) = 4` exactly
equalled the 4 distinct agents holding that KPI — no repetition.

Each row also shows what the file alone reached, so the OM can see how much the field work adds:
*Served — file 4, field +14, combined 18, target 1,700 → 1% (file alone 0%)*.

**Recruitment now reflects the real month.** The app only ever saw the new-agent forms a BDO opened
inside it; files walked straight to the bank were invisible, so the month always under-read. The OM
can now type **Submitted to bank** per BDO per month with an optional note. It is kept in its own
column beside the pipeline figure — one is evidence the app holds, the other is the OM's own count —
and the two are added only in the Total column, so they can never be mistaken for each other.
Verified: John 2 forms in app / 1 became an agent / 6 to the bank → total 8.

The window is month- and **SA-station-scoped** like the dashboard, and reads the same per-station
targets, so the two screens never disagree. Both new endpoints are management-only — verified a BDO
gets 403 on each.

- Assets `?v=40`, SW `imani-v40`

---

## v1.25.0 — 2026-07-30 · "A BDO's work survives the next upload"

### Release notes
**The flag answers a BDO writes are no longer thrown away.** Every performance upload clears the
month's flags before recomputing them — and it was clearing the BDO's *answers* with them. He would
explain himself on four flags, the next weekly file would land, and all four came back as "no answer
yet" with his written note gone. He had to re-type the same explanation after every upload, and the
OM saw a wall of unanswered flags that had in fact been answered.
Answers are now remembered and re-attached to the same accusation when it is raised again; the
upload reports how many it kept. **Verified**: BDO answers 4 flags → next upload → `answersKept: 4`,
pending stayed **0**, notes intact (before the fix: pending went 0 → 4 and every note was lost).

**A wake is no longer undone by a file cut before it happened.** When a BDO woke a dormant agent and
a later file still showed that agent Inactive, the import wrote him back to INACTIVE — he reappeared
on the "Inactive – wake up" list and read as though nothing had ever been done. An agent with a BDO
wake credit for the month now keeps his ACTIVE status. The **office numbers are untouched** (they
are still exactly what the file said), and if the file genuinely disagrees the reconciliation still
raises the flag for the OM to judge. Verified: `actStatus` stays `ACTIVE` across the re-upload.

**A flagged KPI is queried, not erased.** The tick stays on the agent list with the BDO's name; the
chip now wears a small marker — red `!` awaiting his answer, green when he says he did it, gold when
he agrees with the file — and a dashed border. A queried agent can no longer be misread as "no KPI
was done here".

**Every tick now says where it came from.** A BDO reported seeing an agent go ACTIVE "by partners"
with no upload he knew of. `partners` is created in exactly one place — an upload row that reported a
positive result with **no BDO named on it** — so it always comes from a file, but nothing on screen
said *which* file. Each chip now carries its provenance in the tooltip: for file marks the upload's
label and the minute it was imported, for field marks who ticked it and when. A small `FILE` tag
marks anything that came from a spreadsheet rather than the field.
Example now shown: *From the performance file "W5 file - 28 July" uploaded 2026-07-30 10:50 - no BDO
was named on that row*.

**And a BDO can claim work the file left unnamed.** `partners` and `unassigned` both mean "nobody was
named on that row" — neither is a colleague, so neither is anyone's work to protect. A BDO who
actually made that visit was previously locked out with "that belongs to the partners". He can now
take it over (client *and* server — they disagreed before, so the button appeared but the API
refused). His claim still goes through the normal reconciliation, so he cannot take credit the file
denies.

**"Won't return" is for every BDO.** Any BDO can walk up to a dormant agent and be told he has closed
shop; that is worth recording whoever hears it. The button was hidden from everyone except the
activeness specialist — the server had always allowed it (`wont_return_toggle` only asks for
`mybase: Edit`). The WON'T RETURN badge is now visible to every BDO too, so two of them don't walk to
the same closed shop.

- Assets `?v=39`, SW `imani-v39`

---

## v1.24.0 — 2026-07-26 · "Attainment per SA station, calmer dashboards" — schema v14

### Release notes
**Target Attainment reads one station.** Picking ARUSHA on the dashboard now scopes the attainment
bars and the weighted achievement to Arusha, not just the KPI cards. Office targets became
**per (month, SA station)**: the OM picks a region in Monthly Targets and types its numbers, and the
dashboard reads exactly those. Everything already typed was kept as the **All stations** row, so
nothing was lost or reassigned. A station with no targets of its own falls back to the office row
and says so — `using office-wide targets` with a one-click jump to set them — instead of silently
reporting 0%.
Verified with a two-station file: ALL = 6 served against target 1,700; ARUSHA = 4 against its own
900 (`targetsFrom: station`); MANYARA = 2 against the office row (`targetsFrom: office-fallback`).

**A blank SA STATION no longer creates a phantom region.** Rows with an empty station cell used to
land in an `UNSPECIFIED` bucket and vanish from Arusha's attainment. They are now counted into the
home station, and the upload reports how many — `2 rows had no SA STATION · counted as ARUSHA` — so
the file can be corrected at source without losing numbers in the meantime.

**Messages live only in Messages.** The "Messages from administration" panel is gone from the BDO
dashboard. In its place the Messages tab carries an **unread count badge**; opening the tab marks
everything read (new `msgs_seen_at` per user). Verified: 2 unread → badge `2` → open tab → badge
cleared and the server agrees.

**The dashboards were emptied of things that belong elsewhere.** The BDO dashboard went from **nine
panels to three** — his day so far, his KPI cards and weighted performance, and the high earners he
served. Everything else moved to where it belongs:
- **Team** (new tab) — the live whole-team board and the ranking. Still read-only: no download
  button is rendered for a field user.
- **Flags** (now his own tab) — the per-KPI tabs and totals from v1.23, with a **red nav badge**
  while any flag is unanswered.
- **My report days** — moved beside the Daily Report he actually writes.
- **OM:** the "Dashboard settings" block (KPI visibility, required APK version, serving-receipt and
  waking-proof rules) left the dashboard for the management area. It went to **Settings & Data**
  (the renamed Data Manager) rather than Admin, because the OM's role has no Admin access and would
  have lost the settings entirely. Verified saving from the new location.

**Fixed while in there:** the Targets station picker listed stations straight from `agents.station`
in whatever case was typed ("Arusha") while the dashboard scopes by the snapshot's upper case
("ARUSHA"), so the picker never matched and always fell back to All stations. Station names are now
normalised and de-duplicated. Also removed two more `t` shadowings (`viewTargets` declared a local
`var t`, which is the translator) — the recurring cause of blank pages in this codebase.

- Assets `?v=38`, SW `imani-v38`

---

## v1.23.0 — 2026-07-26 · "Flags judged across the whole month + dark mode everywhere"

### Release notes
**Flags stopped accusing honest work.** The month is uploaded as several weekly files, but each
upload used to judge the BDOs against *that one file only* — so an agent covered in week 1 was
reported as "NOT in the performance file at all" by a week-4 file that never mentioned him, and an
agent genuinely woken in week 1 was flagged the moment he went dormant again later in the month.
Flag calculation now runs **once, after the whole file is written, against everything the office has
reported for the month**: a KPI counts as backed if **any** upload that month confirms it, and
activeness follows the same rule so a later relapse is no longer treated as a false claim. Claims
with no support anywhere in the month are still flagged, exactly as before.
Verified on a seeded two-upload month (week-1 file + partial week-4 file): the old rules produced
**4 flags, 3 of them false**; the new rules produce **1** — the single genuinely unsupported claim.

**"When?" now means when the BDO did the work.** The flag tables and the Excel export used to show
the moment the *upload* raised the flag. They now show `agent_month_kpi.at` — the moment he tapped
the KPI in the field — with the flag time underneath. The workbook carries both as
"When BDO did the KPI" and "When flagged".

**Flags against me, split per KPI.** The BDO's flag panel gained tabs — **All KPI / Served / Visit /
APK / Activeness** — each with its own count, plus a running **total** in the heading. An empty tab
opens and says so rather than bouncing back to All.

**Office roles are managers by role, not by checkbox.** `is_manager()` / `is_field_user()` used to
depend on which permission boxes a role happened to have, so an MD (no `agents: Edit`) was not a
manager, and any office user given a "my base" tick would have been demoted to a field user and
lost the Flags panel, the station picker and commission figures. `superadmin` / `md` / `om` are now
management by role. A BDO still can never gain office powers, whatever is ticked for him.

**Every BDO can watch the live board.** His dashboard gained **"Live work today — whole team"**: the
same feed, time-window presets and per-BDO tally the OM sees. `live_today` now accepts `mybase.v`.
**Downloading stays management-only** — no export button is rendered for him and `liveDownload()`
refuses.

**Serving always offers the receipt photo.** The serve dialog only opened when the agent's location
was *missing*, so an agent with a known location could never have a receipt attached — the complaint
that "serving proof is just physical locations". Serving now always goes through the dialog
(location prefilled, receipt box present); the client marks it with `confirmed`, and the photo stays
optional unless the OM set Serving receipt to Compulsory.

**Dark mode for all four palettes.** Green, yellow and blue existed only on the white base. Each now
has a full dark skin, and the colour choice is independent of light/dark. Gradient-filled surfaces
(buttons, avatar, active nav, "mine" chips) carry dark text in the dark palettes because all three
gradients end on a light stop. Verified with a compositing contrast sweep over all
**4 palettes × 2 modes**: worst reading **4.4:1** (a pre-existing light palette), the new dark
palettes **5.5:1 – 17.4:1**; no console errors.

- Assets `?v=37`, SW `imani-v37`

---

## v1.20.1 — 2026-07-21 · "Flags workbook + commission hidden from BDOs"

- **Flags Excel, one sheet per BDO**: the Flags tab gained a Download button. The workbook opens
  with a **Summary** sheet (per-BDO matched/flagged counts for every KPI), then **one sheet per
  BDO** listing each flag he collected across all KPIs (agent, acc, branch, station, detail, when),
  with his matched claims underneath for context. Sheet names are sanitised + deduplicated.
- **Commission is management-only**: `high_earners_get` now strips the commission figure
  server-side for field users — the amount never leaves the server for a BDO (verified: no
  `commission` key in his payload). He sees just LIST A/B/C/D/E; the OM keeps full figures and
  the band ranges.
- Assets `?v=32`, SW `imani-v32`

---

## v1.20.0 — 2026-07-21 · "High-earner priority bands, serving receipts, BDO day feed" — schema v11

### Release notes
**High-earner priority list.** The OM uploads a commission-ranked agent list (Weekly Upload tab →
"High-earner priority list"; columns Agent Account, Agent Name, SA Commission, SA Station;
uploading replaces the previous list; rows ≤50,000 are skipped). Every BDO's My Base gained a
**"High earners — PRIORITY to serve"** panel: he picks his **SA station first**, then sees ONLY the
**not-served** high earners in bands **A >2M · B >1M · C >500k · D >100k · E >50k**, each with
commission, tap-to-call phone, branch, location and a **Serve** chip. The match is **live** against
the ledger: every weekly upload and every BDO tap updates it (verified: serving an agent removed
him from LIST A instantly; agents not in the roster yet show "not in system"). 

**Serving receipts.** Dashboard settings gained **Serving receipt: Optional / Compulsory**. When
compulsory, marking SERVED without a receipt photo is rejected server-side; the serve modal now
collects location + receipt photo (downscaled on the phone). Receipts open from the eye icon on the
served chip — completely separate from the wake-up receipt.

**BDO's day feed.** His dashboard now opens with **"My day so far"** — read-only: today's
Served / Visits / APK / Activeness counts plus a timestamped feed of every tick he made
(no edit controls, pure motivation).

### Changes
- **Schema v11** (self-upgrading): `high_earners` table
- `api.php`: `high_earners_upload` (manager, replace-all), `high_earners_get` (station filter,
  live not-served bands), `my_live_today`; kpi_mark served accepts receipt photo + enforces the
  `serve_receipt` setting; `wake_proof` takes `&kpi=served|active`; dashboard echoes the setting
- `app.js`: OM upload panel + settings select; My Base bands panel (station-gated); serve modal
  with receipt field; served-chip proof eye; "My day so far" panel; EN/SW strings.
  Assets `?v=31`, SW `imani-v31`

---

## v1.18.0 — 2026-07-20 · "Live work, Field Tasks tab, cleaner My Base + palette contrast"

- **LIVE WORK TODAY** on the OM dashboard: every KPI a BDO tapped today with the exact time
  (EAT), per-KPI totals, per-BDO leaderboard, today's new-agent forms and won't-return calls.
  One tap → **Download day (Excel)**.
- **New Field Tasks tab** for BDOs: partner-served agents (claim + capture location) and the
  station-grouped inactive list (wake with receipt + location). These are things to CLAIM, so
  they no longer clutter My Agent Base and only touch performance once acted on.
- **My Agent Base cleaned up**: partner-served, inactive and the Recruit button are all gone;
  a short hint sends BDOs to Field Tasks when partner work is waiting.
- **Activeness section on Daily Report**: recruit-new-agent lives here now; note explains that
  recruits AND wake-ups count in the same Activeness KPI this month.
- **Palette contrast fixed**: "mine" chips (Served ✓ you) get solid accent + white text in every
  palette; colleague chips darkened. Real-panel verify: mine 5–7:1, colleague 7–8:1 (WCAG AA/AAA).
- **Deploy guard**: server + client stamp `APP_VERSION`; a mismatch shows a loud banner instead
  of silent broken buttons, and explains WHY marking is off when the mybase-edit permission is
  missing.

Server: `api.php` `live_today`. Client: `viewField()`, `liveTodayLoad()`/`liveDownload()`,
activenessPanel, `deployWarning()`/`markingOffNote()`. Assets `?v=28`, SW `imani-v28`,
`APP_VERSION 1.18.0`.

---

## v1.17.0 — 2026-07-20 · "Field users can never gain management powers + 4 colour themes"

### ROOT CAUSE of "BDOs can still overturn other BDOs"
The BDO role in the live database had been granted **agents: Edit** in Access Control. Every
management check in the app was a plain `can(agents,'e')`, so those BDOs were being treated as
managers: they could overturn any mark **and** the Data Manager tab (erase-everything buttons) was
visible to them. Permission toggles alone could silently hand out admin power.

**Fix — a field user can never be a manager.** New `is_field_user()` / `is_manager()` /
`require_manager()` (server) and `isFieldUser()` / `isManager()` (client): anyone who can mark his
own base (a BDO) is a FIELD user, and a field user never gets management override — regardless of
what permissions are ticked. Only OM / super-admin qualify. Verified with `bdo.agents.edit = 1`
deliberately granted:
- overturn a colleague's mark → **403** "That belongs to john"
- `bdo_data_erase` / `excel_erase_all` → **403** "Management access only"
- Data Manager tab **hidden** from the BDO sidebar

Also fixed: after an "already done by <colleague>" error the chip was redrawn as **"Done by you"
with a working ×**. It now renders locked with the real owner's name and no ×.

### Four colour themes
Theme button opens a picker with 4 palettes, saved per device: **Fire orange** (the original,
with its Dark/Light switch), **Fire green & white**, **Fire yellow & white**, **Fire blue & white**.
The three "& white" palettes ride on the light base with neutral white surfaces and accessible
accent colours; gradient-filled surfaces keep readable text in every palette.

### Changes
- `lib/helpers.php`: `is_field_user()`, `is_manager()`, `require_manager()`
- `api.php`: `kpi_unmark` uses `is_manager()`; all six Data Manager actions use `require_manager()`;
  `uploads_list` tightened
- `app.js`: `isFieldUser()`/`isManager()`, data tab + chip `isOM` routed through it, `chipDoneHtml`
  ownership fix, palette system (`PALETTES`, `applyTheme`, `setPalette`, `themePicker`)
- `styles.css`: `.pal-green` / `.pal-yellow` / `.pal-blue` palettes + picker swatches.
  Assets `?v=25`, SW `imani-v25`

---

## v1.19.0 — 2026-07-21 · "Flags — dedicated tab, all KPI, all BDO, live search"

The old Reports "Flagged BDOs" list is replaced by a proper **Flags** tab (OM / super admin only)
that shows the complete cross-check between BDO live marks and the uploaded performance file for
every KPI:

- **Per BDO x KPI grid**: for each BDO, green pill = matched claims, red pill = flagged claims,
  per KPI (Served / Visit / APK / Active) plus row totals.
- **Every claim table**: one row per live mark with `MATCHED` or `MISMATCH` status. Instant
  client-side filtering by search (BDO / agent name / acc / branch / station), by BDO, by KPI, and
  by status. A running "shown" counter shows the current selection size.

Server side: `flags_get` now also returns the `matched` list + a per-BDO×KPI grid and is
locked to `is_manager()` (BDOs get 403 — they should not see who else was flagged). Reports keeps
its ranking; the old flags panel is gone with a small pointer button "Open Flags" instead.

### Changes
- `api.php` `flags_get`: `is_manager()` gate; response now includes `matched` (bdo marks the file
  confirmed) and `grid` (per-BDO×KPI matched vs flagged tallies)
- `app.js`: new module `flags` + `viewFlags()` (grid + filterable table), `flApply()` live filter,
  `flLoad/flClear` handlers, `flBdo/flKpi/flStatus` change handlers; `viewReports` no longer
  renders the flags list and only calls `flags_get` for managers. Assets `?v=30`, SW `imani-v30`

Verified live with 1 seeded mismatch + 2 seeded matches: grid tallies exact
(john served 0/1, mary served 1/0), status filter narrows to 1, KPI "visit" filter → 0,
search "mismatch agent" → 1, Clear → 3. BDO sees no tab; `flags_get` returns 403 for a BDO.

---

## v1.18.0 — 2026-07-21 · "Live Work — pick any EAT time window"

The OM dashboard's Live Work panel gained an **EAT time window**: two time inputs (From / To,
defaulting to 00:00 – 23:59) plus four one-tap presets — **All day / Morning (06:00–12:00) /
Afternoon (12:00–17:00) / Evening (17:00–23:59)**. Pick any custom range and the KPI-tick feed,
per-BDO totals, top-line cards, new-agent forms and won't-return calls all narrow to that slice.
The Excel download becomes **"Download window"** and its filename encodes the window
(`live_work_2026-07-21_0800-1200.xlsx`). The typed daily reports stream stays full-day (those land
once per day). Verified live with three ticks seeded at 08:15 / 14:30 / 20:05:
Morning → 08:15 only, Afternoon → 14:30 only, Evening → 20:05 only, custom 14:00–15:00 → 14:30
only. Reversed ranges self-correct on the server; garbage times fall back to defaults.

### Changes
- `api.php` `live_today`: accepts `from` + `to` (HH:MM regex-validated), uses `at BETWEEN ? AND ?`
  on ticks/recruits/won't-return, echoes the window back for the UI
- `app.js`: liveFrom/liveTo inputs, four preset buttons, window pill in the results header,
  filename carries the window. EN/SW strings. Assets `?v=29`, SW `imani-v29`

---

## v1.16.2 — 2026-07-19 · "Unmark restricted to unassigned only"

A BDO can now overturn ONLY his own live mark (within 6h) or an **unassigned** orphan mark. Marks
owned by a fellow BDO **or by partners** are no longer reversible by a BDO — only the OM can
(v1.16.1 had wrongly allowed partners too). Verified: Mary → John's served = 403, Mary → partners
APK = 403, neither chip shows the × for her; the OM still sees the × on every mark.

### Changes
- `api.php` `kpi_unmark`: orphan = `unassigned` only (removed `partners`); clearer 403 message
- `app.js` `doneChip`: take-over × shows for `unassigned` only. Assets `?v=23`, SW `imani-v23`

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
