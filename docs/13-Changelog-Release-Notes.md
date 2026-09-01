# Change Log & Release Notes

**Repo:** github.com/Abdul-0708/imani-superdealer-app · branch `main`
Versioning: semantic-ish (feature releases bump minor). Update this file with every release.

---

## v1.56.0 — 2026-09-01 · A partner-served agent is the OM's to give, and a score you can see a year of

**Reported:** a BDO could overturn an agent the performance file had put down to the partner.

He could, and the app was built to let him: he tapped SERVE, was made to attach a receipt photo,
kept the credit, and a flag went up so the OM could rule on it **afterwards** — while the credit was
already counting towards his month and the commission settled on it.

That is the wrong way round. The office record says the partner served that agent, and overturning
the office record is a management decision, not a field one. Judging it after the money has started
moving means the OM is always arguing backwards.

**Now:** `kpi_mark` refuses a partner-served agent to anyone who is not management, and `kpi_unmark`
no longer lets a BDO reverse a `partners` **serving** mark to free the agent up first — that
two-step was the actual route, and closing only the front door would have left it open. Visits, APK
and activeness are untouched: none of them moves an agent between rounds or feeds the serving
figure the commission is settled on.

The BDO is not left at a wall. He is told the credit is not his to take and that his OM can award
it to him, and it counts in his month exactly the same.

**The OM's side.** A PARTNER agent now carries an **Award to a BDO** button on the agents list. It
takes the credit off the partner and gives it to the officer the OM names, in one click — behind
which it is still the honest two steps, reverse then re-write.

Three things had to move for that to work at all:

- `kpi_mark` required the `mybase` permission, which the OM **does not have** — he has no base of
  his own. Management now passes that gate on its own authority.
- the compulsory-receipt rule is the **field officer's** rule. Holding the OM to another man's
  compulsory photo would have blocked every award and told him it was "compulsory for you", which
  it is not. Management is exempt; his ruling is the evidence, and the audit trail records it.
- `agent_month_kpi.awarded_by` (**schema v21**) records who authorised the claim. Without it the
  next performance upload would raise the partner flag all over again against a credit the OM had
  just granted, and he would spend the month clearing his own decision.

**Also: a BDO's weighted score, month by month.** The app only ever showed the month it was standing
in, so "is this man getting better or worse" — the question an appraisal actually turns on — was
being argued from memory. `bdo_score_history` reads the same maths (`bdo_score`, so a KPI switched
off in a given month is still not scored in that month) back over every month the office has run.

It appears twice: on the BDO's own dashboard under his score, and on the OM's per-officer page. Both
show the average he has actually achieved, his best and lowest months, and the change from one month
to the next — the direction matters more than any single month.

A month with **no targets set** shows no score rather than 0, and is left out of the average. Nobody
scored zero; the OM simply never set a target, and a zero would punish a man for a month that was
never measured.

**On flags outnumbering serving.** Asked and answered rather than changed, because it is arithmetic,
not a bug. A flag is raised per **KPI**, and there are four; serving is one agent, once. An agent in
no performance file at all flags every KPI claimed on him in one go — and those are exactly the
agents contributing nothing to serving. The two numbers count different things over different
populations, so flags exceeding serving is expected. One real reduction did come out of this
release: an OM-awarded partner claim is no longer re-flagged at every upload.

---

## v1.55.0 — 2026-08-18 · Switching a KPI off now means everywhere

**Reported:** a KPI removed from this month's targets still appeared on the BDO's agent list.
Correct — and the fix in v1.45.0 was only half done.

That release taught the **office dashboard** to skip a KPI the OM had switched off, and stopped
there. Everything closer to the actual work carried on as though nothing had changed:

- the BDO still saw the chip on **every agent in his round**, and could still tap it;
- the **Agents** list drew it too;
- his **weighted score** still counted it — so a KPI nobody was asked to do could sit at 0% and drag
  his average down;
- his **score panel** still drew a bar for it;
- and the **API still accepted the mark**, which is the part hiding a button never fixes.

Switching a KPI off has to mean it did not exist that month — everywhere, not only on the board the
OM happens to be looking at. The month's set-up is written in office terms (*serving, visits, apk,
activeness*) while the ledger and the chips speak per-agent terms (*served, visit, apk, active*), so
the two are mapped in one place, `kpi_marks_active()`, and everything reads from that.

**Enforced on the server first.** `kpi_mark` refuses a KPI the month is not measuring —
*"That KPI is not being measured this month"* — because anyone can post straight to the endpoint;
the chip disappearing is presentation, not protection.

Verified by switching **Agent Visits** off for the month:

| | Before | After |
|---|---|---|
| KPIs in play | served, visit, apk, active | **served, apk, active** |
| Visit chips in My Agent Base | present | **0** |
| Visit chips on the Agents list | present | **0** |
| His score bars | serving, float, visits, apk, activeness | **serving, float, apk, activeness** |
| A visit mark posted directly to the API | accepted | **refused** |
| Other KPIs | — | still accepted |

And fully reversible: switching it back on restored the chips, the bar and the mark in one step.

- Assets `?v=72`, SW `imani-v72`. Schema unchanged.

---

## v1.54.0 — 2026-08-18 · One word for one person

The app called the same man a **BDO** 243 times and an **"officer"** 44 times. The second set was
newer — the officer window and everything built around it — so it was the odd one out. Everything
the user reads now says **BDO**.

**The reason this was flagged rather than done in Phase 10:** those strings are translation keys.
Renaming the English silently breaks the Swahili lookup — the UI keeps working, in English, and
nobody notices. So the check came first: extract every `t('…')` call site, extract every dictionary
entry, and count the keys with no Swahili.

That baseline turned up something larger. **170 of 666 keys already had no Swahili entry** — about a
quarter of the interface falls back to English for a Swahili user, mostly strings added in recent
releases. Not caused by this change, but now measured. This rename took it to **165**: every renamed
key kept its translation, and five that were missing gained one.

Changed together, key and translation in lockstep: the *BDOs* table header and heading, *All BDOs*,
*Every BDO's round…*, *Ordered by … the BDO at the top…*, *No BDOs with a round this month*, *across
every BDO*, *Open the BDO first*, *Proof rules for this BDO*, the spreadsheet's **BDO** column and
sheet name, and three server messages (*belongs to another BDO*, *Which BDO?*, *No such BDO*).

Verified: **zero occurrences of "officer" across all nine screens** in English; the drill-down, the
back button, the rules panel and the Excel export all read BDO; and in Swahili the renamed sentence
resolves properly — *"Imepangwa kwa wanaolipa zaidi ambao hawajafikiwa - BDO wa juu ndiye wa
kuzungumza naye leo"* — rather than falling back.

**Left deliberately:** the internal identifiers — the `officers` field in the `he_report` response
and the `officerRulesPanel` / `officerRulesSave` functions. Renaming an API field is a contract
change with no user-visible benefit, and code identifiers are not the terminology the business
reads.

- Assets `?v=71`, SW `imani-v71`. Schema unchanged.

---

## v1.53.0 — 2026-08-18 · Phase 10: final review — the dashboard promised a structure it did not have

Measured every screen's density rather than judging it by eye. The dashboard carries **10 panels,
15 cards, 6 tables and 423 words** — three to five times any other screen (flags: 3 panels, 67
words; commission: 2 panels, 86 words).

Reading the page top to bottom exposed the real fault, and it was mine: **"SECTION 1" appeared in
the middle of the page.** The month filter, the awaiting-file banner and the live board all sit
above it, so the numbering announced a structure the page did not actually have — a reader met
greeting → filters → live work → *"Section 1"*, which reads like a merge that was never finished.
(It was: I introduced it in v1.40.0.)

Fixed by naming the two answers instead of numbering the page — **"THE OFFICE RESULT — FROM THE
PERFORMANCE FILE"** and **"THE SAME MONTH — FILE PLUS FIELD"**. No functionality moved: the panels
above are page controls and live activity, and they no longer sit under a broken promise.

- Assets `?v=70`, SW `imani-v70`. Schema unchanged.

---

## v1.52.0 — 2026-08-18 · Phase 9: security regression — and one hole the first audit missed

Every original attack re-run against current code, under the **same preconditions** that made them
work — including handing the OM role `Admin: Edit`, the delegation that opened the whole C-1 chain.

| # | Finding | Original risk | Re-tested outcome |
|---|---|---|---|
| C-1a | Self-promote to super admin | 🔴 Full takeover | blocked |
| C-1b | Reset the super admin's password | 🔴 Account takeover | blocked — **and the hash still verifies** |
| C-1c | Grant every BDO the admin module | 🔴 Mass escalation | blocked |
| C-1d | Create a new super admin | 🔴 Escalation | blocked |
| C-1e/f | Delete or demote the super admin | 🔴 Lockout | blocked |
| C-1g | Deactivate own account | 🔵 Self-lockout | blocked |
| H-1 | Setup password still usable | 🟠 Impersonation | gated: agents, round, marking and the officer window all refused; only `change_password` allowed; unblocked immediately after |
| H-1b | Set the setup password back | 🟠 Bypass | blocked for a user **and** for an admin |
| H-2 | Cross-station data | 🟠 Exposure | Arusha officer: **14 Arusha / 0 Manyara**. Manyara officer: **4 Manyara / 0 Arusha** |
| M-1 | Another officer's receipts | 🟡 Disclosure | own proof served, colleague's refused, OM sees both |
| M-2 | No throttle | 🟡 Abuse | 12 allowed / 4 blocked |
| M-3 | Username oracle | 🟡 Enumeration | identical message for a real and an invented user |

**The surface added during this audit was attacked too.** As a plain BDO, all seven new endpoints
refuse: `bdos`, `bdo_detail`, `he_report`, `bdo_rules_save`, `kpi_config_save`, `flags_clear`,
`view_station_set`. The session `must_change` flag is not forgeable from a cookie. CSRF still dies
without the header. **SQL injection through the new KPI column mapping** leaves every table intact,
and **an XSS payload stored as a custom KPI label does not execute** — it comes back raw from the
database and is escaped on render, which is the right way round.

### 🟠 NEW — found by the regression, not by the original audit

**An agent with a blank activeness status could be "waked" with no evidence at all.** The proof gate
tested for `act_current === 'INACTIVE'` exactly. An agent whose activeness cell the performance file
has never carried — status blank, which is common and documented behaviour — fell through it: **no
photo, no note, no location, and the activeness credit was granted.** That credit feeds the
officer's weighted score and the office achievement the commission is settled on, so it was
evidence-free money.

The gate now covers anyone **not already ACTIVE**. Verified across all three states:

| Agent state | Result |
|---|---|
| Blank status, no proof | refused |
| Blank status, typed note only | refused (office rule is photo-only) |
| Blank status, real photo | **accepted** |
| Already ACTIVE, with or without proof | *"already Active this month - nothing to wake"* |

This is what a regression pass is for: the first audit read the code and judged the gate correct;
re-running it against a state the code did not anticipate is what exposed it.

- Assets `?v=69`, SW `imani-v69`. Schema unchanged.

---

## v1.51.0 — 2026-08-18 · Phase 8: performance — a bcrypt on every request

Measured against **realistic volume**, not the test fixtures: 3,000 agents, 36k base rows, 48k
ledger rows, 18k service rows, 12 months, 6 officers.

**Every endpoint was paying 134ms to answer a question that cannot change mid-session.** Splitting
the request path showed where the time went — a static file served in 4ms, `health` (database +
schema check) in 50ms, but `me` in **196ms**. The 146ms gap was not queries: it was the forced
password-change gate added in v1.47.0 calling `password_is_default()` on **every request**, and that
is a bcrypt comparison — deliberately slow by design. **Two thirds of every API call in the app was
one hash comparison.**

The answer is now decided **once at sign-in**, while the hash is already in hand, and carried in the
server-side session. Same protection, no weaker: the session is server-side, so the flag is no more
forgeable than the session itself. Changing the password clears it, and **the setup password can no
longer be set** — not by the user, not by an admin — so it cannot come back behind the flag.

| endpoint | before | after |
|---|---|---|
| `me` | 196 ms | **51 ms** |
| dashboard | 197 ms | **85 ms** |
| agents list (50) | 181 ms | **68 ms** |
| agents search | 187 ms | **75 ms** |
| officer window | 225 ms | **113 ms** |
| officer detail | 184 ms | **77 ms** |
| high-earner team report | 289 ms | **141 ms** |
| flags | 203 ms | **101 ms** |
| a BDO's round | 238 ms | **128 ms** |
| live board | 190 ms | **74 ms** |

**Roughly half the latency, on every screen, for every user.** Query counts are unchanged — this
was never a database problem, which is exactly why it needed measuring rather than guessing.

**The optimisation silently switched the protection off, and the verification caught it.** The new
check read `$_SESSION` *before* `current_user()` — and `current_user()` is what starts the session,
so the flag was always empty and the gate never fired. An account on the setup password sailed
straight through. Re-ordered, re-tested: blocked on the round, the agent list and marking a KPI;
allowed to change its password; unblocked immediately afterwards; other users unaffected.

**Nothing else was over threshold** (>400ms or >40 queries). `combined_performance` is now the
slowest screen at 250ms / 30 queries — the heaviest analytical page in the app, and still fine. The
per-officer N+1 in the officer window measures at 21 queries and 113ms; rewriting it as one
aggregate would add real complexity to save a few milliseconds, so it stays.

- Assets `?v=68`, SW `imani-v68`. Schema unchanged.

---

## v1.50.0 — 2026-08-18 · Phase 7: responsive & accessibility

**The touch-target fix had a hole.** v1.49.0 keyed on `pointer: coarse` — but a tablet, and any
touch laptop, can report a **fine** pointer and still be tapped. Measured at 768px: **ten controls
back under size**. The rule now fires on a coarse pointer **or** a screen ≤860px, so the device no
longer has to declare itself correctly to get thumb-sized controls. **10 → 0** at 768px.

**A header cell now says what it heads.** This app is mostly tables — the round, the officer window,
the flags — and **0 of 38 `<th>` carried a `scope`**. Without it a screen reader reads a cell as a
bare value with no column name, which in a table of numbers is no information at all. Added by the
same observer that links the labels, so it covers panels rendered later too. **38 of 38.**

**The dialog had no name.** It already had `role="dialog"`, `aria-modal`, focus moved into the first
field and Escape closed it — genuinely good. But it announced itself as just *"dialog"*. It now
takes its name from its own heading (*"Change password"*). **And Tab no longer walks out of it** —
focus could previously leave an open dialog for the page behind, where a keyboard user was typing
into a screen he could not see.

**`aria-current="page"` on the active tab** — the active state was a colour only, so a screen reader
had no way to tell which section was open. Now set on both the sidebar and the phone bar.

**A skip link.** Without one, a keyboard user tabs through the entire navigation on every page
change before reaching what he came for. Invisible until focused, then lands top-left.

**Verified at 375px and 768px, across all nine OM screens:** no horizontal scrolling anywhere, zero
undersized controls, all headers scoped, `aria-current` present. Desktop density unchanged.

*Two limits worth stating.* An automation window never matches `:focus`, so the skip link's reveal
was verified structurally (the rule is in the stylesheet) and geometrically (applying the same
declaration puts it at `left: 0`, 156px wide) rather than by tabbing. And genuine screen-reader and
keyboard-order testing needs assistive tech I cannot drive — what is claimed here is what was
measured.

- Assets `?v=67`, SW `imani-v67`. Schema unchanged.

---

## v1.49.0 — 2026-08-18 · Phase 6: thumbs, not cursors

Audited by **measuring** the running app at 375px and 1280px rather than looking at it. Three things
were true and two were not.

**Touch targets — the real finding.** A BDO works this app one-handed, standing in front of an
agent, often in sunlight. Measured on a phone, **twelve controls came in under the 44px WCAG/HIG
minimum** — the compact *mini* and *tiny* buttons were 24px tall, about half a fingertip. Worse, the
**KPI marking chips** — the single most-tapped control in the whole app — were **30px**.

Raised only where the pointer is **coarse**, so a mouse keeps the dense layout that lets an OM read
a whole table at once. Same markup, same classes; the device decides.

| | Before | After |
|---|---|---|
| Undersized controls, OM dashboard (375px) | 12 | **0** |
| Undersized controls, all six BDO screens | 148 | **0** |
| Button heights on desktop (1280px) | 24–32px | **24–32px, unchanged** |

*A trap worth recording:* the first attempt placed the rule near the top of the stylesheet, where
the later `.kchip.todo{min-height:30px}` beat it on equal specificity — the fix measured as working
on the OM's screens and did nothing at all for the BDO's chips. It only counts once it is measured
where it matters.

**Labels a screen reader can also see.** Every field is written as `.field > label + input`, which
looks labelled and reads correctly to a sighted user — but the label was never *tied* to its
control, so a screen reader announced nine of them on the dashboard alone as bare "edit text".
Rather than hand-editing a hundred render sites and every future one, the pairs are now tied
together wherever they appear — views, modals, panels loaded later — by a small observer.
**9 unlinked → 0**, and **11 linked inside a modal** that renders long after load.

**Two things I expected to find and did not.**

- **Contrast passes.** A first pass flagged 27 failing text nodes; every one was a measurement
  artifact — the script was not compositing `rgba` pill backgrounds, so orange-on-orange read as a
  ratio of 1.00. Composited properly: **27 → 3**, and those three are gradient backgrounds that
  `backgroundColor` cannot report (dark text on orange, high contrast). No contrast fix was needed
  and none was made.
- **Keyboard focus is already handled.** A programmatic `.focus()` showed no ring, but that is
  correct browser behaviour — `:focus-visible` is styled and only fires for keyboard users.

**No horizontal scrolling anywhere**, at either size, on any screen: wide tables already scroll
inside their own wrappers.

- Assets `?v=66`, SW `imani-v66`. Schema unchanged.

---

## v1.48.0 — 2026-08-17 · Phase 5: API & database architecture — schema v20

**🟡 M-1 — a receipt now belongs to the officer who took it.** Any signed-in officer could walk
`wake_proof?agent=1,2,3…` and pull **every receipt photo in the company, in any station** — the one
place the app handed out another officer's evidence. Management still sees everything, because
judging a claim is the entire point of the flag panel; an officer now sees only what he took.
Verified: an officer read **her own** proof (`image/jpeg` served) and was refused a colleague's
(*"That proof belongs to another officer"*); the OM read **both**.

**🟡 M-2 — a throttle for everything that is not the login.** The login has had a lockout for a long
time; nothing else had anything, so a signed-in account could call imports, whole-team reports and
exports in a loop and flatten a shared-hosting database for everyone. `rate_limit()` is a fixed
window per user per action — one upsert and one read, no cache server to install, forgets by itself.
Applied to the heavy endpoints: imports 12 / 5 min, team reports and KPI dry-runs 40 / 5 min.
Verified by scripting 18 uploads back to back: **12 allowed, blocked from the 13th**.
It is a brake, not a wall — the limits sit far above anything a person working normally reaches.

**🟡 M-3 — the login no longer says whether a username exists.** A failed sign-in returned
*"Invalid username or password (4 attempts left)"* — but only for an account that **existed**, which
turned the login into a free "is this a real account?" oracle. Both branches now return the same
sentence. Verified: identical message for a real and an invented username. The **brute-force lockout
is untouched** — five wrong attempts still block the account, and the correct password is refused
after that.

**Schema v20 — an index for the app's most common question.** *"What is in this officer's round?"*
runs on almost every screen, but the only key on `base` was `(month, agent_id)` — which answers
*"who holds this agent"*, the opposite question. Measured at realistic scale (50,405 rows, 12 months
× 6 officers):

| | rows examined | time per query |
|---|---|---|
| Before (fell back to the `month` prefix) | 4,200 | 6.20 ms |
| After `idx_base_owner_round (month, bdo)` | **700** | **1.47 ms** |

**4.2× faster, 6× fewer rows read.** (The audit called this a full table scan; it was actually a
month-prefix scan — still every agent in the month, but not the whole table.)

- Schema **v20**. Assets `?v=65`, SW `imani-v65`

---

## v1.47.0 — 2026-08-17 · SECURITY: the setup password, and real station segregation

**🟠 HIGH — fixed: auto-created officer accounts shared one password written into the source.**
A performance file naming an unknown officer created his login *for* him — **active**, with
`password_hash('imani123')`, a constant anyone reading the code could see. That account could mark
KPIs, claim agents and answer flags as him.

- **New accounts are born locked** — `active = 0` and a 24-byte random password nobody holds, not
  even the server operator. The OM activates the officer and sets his credentials from Admin.
  Verified: an upload naming *"Brand New Officer"* created `brandnewofficer` with `active=0`, and
  signing in with the old default was refused.
- **Accounts already carrying the default are not locked out** — that would strand the field team
  mid-month. They may do **exactly one thing**: set a new password. Every other request, by any
  route, is refused with *"Set your own password before using the app."*
  Verified on an account still holding `imani123`: the agent list, his round and marking a KPI were
  all refused; `change_password` was allowed; after setting his own password the app unblocked
  immediately, and the old shared password stopped working.
- The dialog offers **no Cancel** when it is forced — a way out would only produce a dead app.

**🟠 HIGH — fixed: field users had no station segregation at all.**
`station_scope()` returned the single **global** `home_station` for every officer, so the station on
his account was decoration: a Manyara officer read Arusha's agent list — names, phones, physical
locations, high-earner bands — and Arusha read his.

Now a field user is pinned to **his own** station. Uppercased on the way out, because agent stations
are stored uppercase while the account column is typed by hand (*"Arusha"*), and comparing the two
raw matched nothing — the fix would have silently emptied every officer's list.
Verified with two officers on the same data: the Arusha officer saw **14 Arusha agents, 0 Manyara**;
the Manyara officer saw **4 Manyara, 0 Arusha**. An officer with no station set still falls back to
the office default rather than being shown an empty app.

*Note:* agents whose SA STATION cell is blank (15 in the test data) stay visible to everyone. That
is the existing deliberate rule — a missing cell must not hide an agent from the man who has to
serve him — and is unchanged here.

- Assets `?v=64`, SW `imani-v64`. Schema unchanged.

---

## v1.46.0 — 2026-08-17 · SECURITY: the privilege boundary

**🔴 CRITICAL — fixed: one delegated permission was a path to total takeover.**

A permission says *what* you may do. It must never say *who* you may do it to — and until now the
two were the same thing. `admin_user_add` refused to CREATE a super admin unless you already were
one, but `admin_user_update` had no equivalent guard. The super-admin protection blocked demoting
and disabling that account and said nothing about its **password**.

Verified by running the attack, not by reading the code. Precondition: an admin ticks
*Admin: Edit* for the OM role — which the Access Control matrix exists to allow. Signed in as `om`,
three API calls, no UI involved:

| Attack | Before |
|---|---|
| `admin_user_update {id:self, role:"superadmin"}` | **role became `superadmin`, every permission true** |
| `admin_user_update {id:1, password:"…"}` | **logged in as the real super admin** |
| `admin_perms_save {bdo:{admin:{v,e,d}}}` | **every BDO gained admin rights** |

**The rule now lives in one place** (`require_can_manage_user`, `require_can_grant_role`,
`require_not_self_privilege`) and is applied at every door — create, update, delete and the
permission matrix:

- You may not act on an account **above your own level**, and that covers the password.
- You may not **grant a level you do not hold**.
- **Nobody edits their own role or active flag** — not even a super admin, who would otherwise be
  one request away from locking himself out.
- Only a super admin may change **who holds Admin access**. The screen posts the whole matrix on
  every save, so an unchanged Admin cell passes quietly; a cell that actually differs is refused
  **out loud** — silently dropping it would tell the admin his change was saved when it was not.

**Re-verified after the fix, same scenario, same requests:**

| Attack | After |
|---|---|
| Self-promote to super admin | *You cannot change your own role* |
| Reset the super admin's password | *Only a Super Admin can change a Super Admin account* |
| Grant BDO the admin module | *Only a Super Admin can change who holds Admin access* |
| Create a new super admin | *Only a Super Admin can grant the Super Admin role* |
| Delete / demote the super admin | *Only a Super Admin can change a Super Admin account* |
| Deactivate myself | *You cannot deactivate your own account* |

Database state confirms nothing was written: roles unchanged, super-admin password untouched, no
admin rows created. **And a real super admin still has full control** — granting Admin, creating
super admins, resetting passwords and changing roles all still work; only self-demotion is refused.
A normal permission save by a non-super-admin is unaffected.

- Assets `?v=63`, SW `imani-v63`. Schema unchanged.

---

## v1.45.0 — 2026-08-17 · "The month sets up its own KPIs"

**The performance file is not the same file every month** — a column gets renamed, a KPI stops being
measured, a new one arrives — and until now every one of those was a code change. The OM would
upload a perfectly good file and watch a KPI read zero with nothing to tell him why.

**Monthly Targets gained "What this month measures".** For each KPI the OM now controls:

- **Whether it counts this month.** A KPI switched off is not read, not scored and not shown — it
  did not exist that month, rather than sitting on the board reading 0%.
- **Which column it is read from** — a list of names tried in order, so the new header can go first
  and the old one stay behind it: the file that arrives before the rename still reads, and so does
  the one after. The app's own built-in names always remain as a safety net.
- **How to read it** — a number to sum, a YES/NO flag to count, a word to match, a version to
  compare against the minimum, or the SERVED status column.

**And KPIs the OM adds himself.** Name it, point it at a column, say how to read it, give it a
target and a weight, and **it joins the weighted average like any other** — read from the file into
the office snapshot, shown as a dashboard card and an attainment bar. (Custom target and weight are
office-wide, not per station.)

**Test it before you trust a month to it.** *Read it and show me* takes the real Excel file and
reports, per KPI, which column it matched, how many rows carried a value, an example cell and the
figure this file would produce — so a mapping that reads nothing is visible before it becomes a
month's score, not after.

**The set-up carries forward** like the targets do: a new month inherits the last one rather than
starting blank, and is saved against its own month — changing September never rewrites what August
was scored on. A closed month cannot be changed at all.

Verified end to end on a file whose visit column had been renamed to *ODK Visit Done* and which
carried a brand-new *Deposit Volume*: the dry run first reported **Agent Visits: matched 0/3** — the
exact diagnosis — then after remapping, switching APK and Withdraw off and adding the new KPI, the
same upload produced **visits 2**, no APK or Withdraw on the board at all, and **Deposit Volume
875,000 / 1,000,000 = 88%** weighted into the achievement. September then inherited the whole set-up.

**Also fixed:** switching a KPI off exposed dashboard cards that assumed every KPI was always
present — `att[k].actual` threw and blanked the page. Cards are now built only for KPIs actually in
play.

- Assets `?v=62`, SW `imani-v62`

---

## v1.44.0 — 2026-08-17 · "Three lists, three downloads"

**Each of an officer's three lists downloads on its own, from its own panel.** They are three
different jobs — the untouched list is a route to walk, the served list is a month to check, the
whole round is his territory — so each panel heading in the BDOs window now carries its own
**Excel** button:

- **High earners NOT served** → `<bdo>_not_served_<month>.xlsx`
- **High earners served** → `<bdo>_served_<month>.xlsx`
- **His whole round** → `<bdo>_round_<month>.xlsx`

**Laid out, not dumped.** Each sheet opens with a title block — the officer, the month and station,
what the list is for, the generation time — then a count with the band tally
(*LIST A: 2  LIST B: 2  LIST C: 1  LIST D: 1  LIST E: 1  not listed: 3*), then the agents **grouped
under a heading per band, LIST A through E** (and *NOT ON THE HIGH-EARNER LIST* for the whole
round), **alphabetical by name inside each band**, with a running number so a printed page can be
ticked off door by door. Column widths are set and the title rows are merged across the table.

Columns: **# · LIST · Agent name · Account · Phone · Branch · Physical location · SA station**, and
a last column that reads *SERVED* (with the timestamp) on the served and whole-round sheets, or
*Agent status* on the untouched sheet — where what matters is whether he is active, not when he was
served. The officer detail endpoint now carries the agent's **phone**, because these sheets are call
lists.

Verified across a full A–F round: ordering came out *Amina, Zainabu* under LIST A, *Baraka, Yusuf*
under B, and *Orphan, Salma, Tatu* under the unlisted block — alphabetical within every band, bands
in order, running numbers 1–10 unbroken.

- Assets `?v=61`, SW `imani-v61`

---

## v1.43.0 — 2026-08-13 · "No location, not his agent" — schema v19

**An agent nobody has pinned to a place is in nobody's round.** A round is the list of doors an
officer can walk to; an agent with no physical location is a name on a spreadsheet, not a call he
can make. Counting him inflated every round, every coverage percentage and every high-earner total
with agents no one could actually go and serve.

The rule is enforced in three places at once, because there were three ways in:

- **`base_assign()`** refuses an agent whose location is blank, so no file can place him.
- **The month carry** brings forward only served agents whose location is known.
- **The round list itself** no longer counts a bare served credit — a file can credit a serve
  without anybody ever capturing where the man is.

**Schema v19 clears the ones already sitting there** — but only in the **open and future** months.
Closed and awaiting months are left exactly as they were: their numbers have been reported and, in
the awaiting case, are about to settle a commission, so rewriting history under a new rule would
change figures somebody has already been paid against. Every removal is audited.

**Nothing disappears.** An agent dropped this way lands in **NEW — not yet mine**, where any officer
can see him — including the case that would otherwise have made him invisible: served by a file yet
never located, so in no round *and* previously excluded from the unclaimed list. He is listed until
somebody goes out, finds him and pins the place.
Verified end to end: a round of six (three located, three not, one of the three credited SERVED by a
file) → migration left the three located ones → all three dropped agents appeared under *NEW*, none
in both lists → an officer served one with his location and he came straight back into her round.

- Schema **v19**. Assets `?v=60`, SW `imani-v60`

---

## v1.42.0 — 2026-08-13 · "Serving is the only way into a round" — schema v18

**Fix: ticking a visit, an APK or an activeness wake used to claim the agent.** Every live mark
quietly wrote the agent into the ticker's round, so an officer ended up "holding" agents he had
never served — just visited, or upgraded, or woken. **Only serving, with the physical location
captured, puts an agent in a round now.** A visit or an APK tick is work done on somebody else's
agent, not a claim on him.
Verified: one officer ticked a visit, an APK and an activeness wake on three different agents — all
three marks recorded, her round stayed at **zero**. She then served a fourth with his location and
he appeared, alone.

The same rule reaches the uploaded file. A row that merely names an officer beside an agent no
longer hands the agent over — **only `Served Status = SERVED` does**. Verified with a file naming one
officer against four agents, one SERVED: his round grew by exactly one. And a file row claiming an
agent another officer had **served in the field failed to take him** — the field serve is the
strongest claim there is.

**The database seed hands out no rounds at all.** A monthly baseline refreshes the agent record and
stops; who holds an agent is decided by who serves him, not by whose name a spreadsheet put beside
him — otherwise an officer opens the month already holding hundreds of agents he has never been to.
Unclaimed agents stay visible to everyone under **NEW — not yet mine**, and the first man to serve
one takes him. Next month he carries to whoever served him.

**Proof strictness per officer (schema v18).** "Everyone attaches a photo" is a blunt instrument:
one officer has been caught claiming work he did not do and should have to prove every serve;
another has never been questioned and is only slowed down by it. The OM can now set **serving
receipt** and **waking proof** on the man, from his page in the BDOs window. Empty means *follow the
office rule*, which is where every officer starts and where clearing an override returns him — not
frozen at whatever the office setting happened to be that day.
Verified: with the office rule at *optional*, the OM made it compulsory for one officer only — she
was refused a serve without a photo (*"the OM has made it compulsory for you"*) while a colleague on
the office rule served without one. Each officer's serve dialog shows **his own** rule. Clearing the
override put her straight back under the office rule.

**Also fixed:** `base_assign()` was declared `($month, $agentId, $bdo, …)` but called
`($month, $bdo, $agentId, …)` — the swapped arguments meant uploads wrote a row with `agent_id = 0`
instead of assigning anybody. Caught in verification, argument order now follows the table itself,
and the function refuses a non-positive agent id or a blank officer outright.

- Schema **v18**. Assets `?v=59`, SW `imani-v59`

---

## v1.41.0 — 2026-08-13 · "One agent, one owner, one row" — schema v17

**Fix: the same agent could sit in a round twice.** The base was keyed on
`(month, bdo, agent_id, KIND)` — and because the *kind* was part of the key, one agent could occupy
the very same officer's round twice: once as **priority** (carried from last month) and once as
**uploaded** (a file listed him again). Everything built on the base then counted him twice — round
size, coverage percent, high-earner totals, and the untouched list the OM works from. That is the
duplicate account number in the screenshot.

Worse, nothing stopped the same agent appearing in **two officers' rounds at once**, so two men
could both be sent to the same door.

The key is now `(month, agent_id)`: **one owner per agent per month.** Existing rows are collapsed
before the key is applied, keeping the row that best represents the truth — in order of authority:
the officer who actually **served** him (the work is done and the credit is already his), then a
real officer over the `partners`/`unassigned` placeholders, then a carried **priority** row over one
a file added, then the oldest. Every collapse is written to the audit log.
Verified by reproducing all three duplicate shapes on the old key and running the migration: agent
held twice by one officer → collapsed to the carried row; agent held by two officers → collapsed to
one; agent held by a placeholder *and* by the officer who served him → **the officer who served him
won**. Duplicates remaining: 0.

**Serving takes ownership, immediately.** The officer who went to the door, served the agent and
captured his physical location has earned him. The agent moves into **his** round the moment the
mark lands and leaves whoever held him before — no waiting for month end — and the credit already
follows the same rule. Only *serving* transfers; a visit or an APK tick is work on somebody else's
agent, not a claim on him. An uploaded file may **never** take an agent off the officer who served
him; a placeholder holder, or one who has not served, yields to the file.
Verified: john served an agent mary was holding → *"agent 13 moved from mary to john — john served
him"* in the audit, credit to john, location captured, mary's round down one. Rolled forward to the
next month: the agent lands in **john's** round, not mary's.

**High earners as a document the OM can hand over.** Four new downloads on the BDOs window — **Excel
or Word, for one officer or for the whole team**:

- **Excel** — a Summary sheet (who is sitting on the most untouched money) plus one sheet per
  officer, untouched rows first, then served.
- **Word** — a formatted A4 landscape document: title, month, station, generation time, then a
  section per officer with his counts, his **still untouched** table (the money left in his round)
  and his served table. Produced entirely in the browser, so it prints the way it looks.

- Schema **v17**. Assets `?v=58`, SW `imani-v58`

---

## v1.40.0 — 2026-08-13 · "One dashboard, two sections"

**Real Performance is now section two of the Dashboard — two labelled sections, never one number.**
The OM was opening two tabs to hold one thought, so both now live on one page under the same month
and the same station picker:

- **SECTION 1 — FROM THE PERFORMANCE FILE.** *"The office result exactly as the uploaded file
  reports it. This is the number the commission is settled on."*
- **SECTION 2 — THE FILE PLUS THE FIELD.** The same month counted the other way: the file's credits
  plus the field work it does not yet contain, with the no-double-count rule stated on the panel.

They are deliberately **not** blended. Section one is the auditable office result the commission is
settled on; section two adds what the team has done since the file landed. Which number came from
where is the entire reason for having both, so each gets its own heading and a rule above it.
Verified on one screen with a real upload: Section 1 read **Serving 2 / 1,700**, Section 2 read
**2 from file + 5 from field = 7 combined** — the same month, correctly disagreeing.

The Real Performance tab, its duplicate month and station pickers and its separate load button are
gone; the dashboard's controls drive both sections, and the Excel download stays with section two.

**OM: 10 tabs → 9.** Also fixed a note that collapsed to one word per line on a phone (a `flex:1`
label sharing a row with a button — the same shape as the gap-note fixed in v1.37.0).

- Assets `?v=57`, SW `imani-v57`

---

## v1.39.0 — 2026-08-13 · "Reports & Ranks folds into BDOs; sending joins reading"

**Reports & Ranks is gone — it was the officer window seen from the other side.** The leaderboard,
who sent his daily report, whose route needs approving, who is short of float: all of it is about
these officers, so all of it now sits under the list of them. The **BDOs** tab carries six panels in
reading order — *Officers · Download BDO Report · Top performing · Daily reports · Daily route plans
· Float shortages* — and nothing was dropped on the way.

**The team leader keeps every approval he had.** The officer window absorbed a screen he depended
on, and approving route plans and float shortages is his job — but he is not a *manager* by this
app's definition (he cannot overturn a colleague's work), so a plain `require_manager` would have
locked him out of his own workflow. A new `require_officer_view` gate: management, **or** anyone
with `reports` view who is not a field user. Verified as `leader1` — the BDOs tab appears, and
**Approve route · Assign route · Approve shortage** all still work. Verified as a BDO — *"Management
access only"* on both endpoints, because a BDO has no business browsing his colleagues' rounds.

**Sending a message joined reading them.** Management composed announcements on Reports and read the
replies in Messages: two screens for one conversation. *Messages to members* — recipient picker,
the sent list, edit and delete — now sits at the top of the **Messages** tab. Verified end to end by
sending one and watching it appear in the sent list.

**OM: 11 tabs → 10. Team leader: 7 → 6.** Both roles walked end to end, every screen renders, every
request 200.

- Assets `?v=56`, SW `imani-v56`

---

## v1.38.0 — 2026-08-13 · "The officer window, and four fewer places to look"

**Fix: the month took the targets with it.** The base carried into the new month, activeness
carried, the round carried — **the targets did not**. So on the 1st the office and every officer
woke up with no target at all, and a weighted average has no denominator without one: the team went
out and served, every tap was recorded, and the score stayed blank because there was nothing to
weigh it against. It read exactly like the app had stopped counting the work.
Verified on the live database: August had **0 office targets and 0 officer targets** while July had
them; `office_attainment` returned `achievement = NULL, targetsFrom = none`. Last month's targets
are now carried forward on the roll — from the most recent month that *has* them, so a gap month
cannot break the chain, and **only when the new month has none of its own**, so it can never
overwrite what somebody has already typed. After the carry: `targetsFrom = office`, and four served
agents moved that officer's weighted score from 0% to 28%.
And when there genuinely are no targets, the dashboard now **says so** — *"The team's work IS being
recorded… but a weighted average needs a target to measure against"* — with a button to set them,
instead of a silently blank screen.

**The OM and MD no longer carry My Agent Base or Daily Report.** They manage the round; they do not
walk it. Hidden **by role**, the same rule the server uses for office powers — verified by ticking
`mybase` for the OM role in Access Control and confirming the tab still does not appear.

**Officer reporting left the target-setting screen.** *Download BDO Report (Excel)* moved to the
**BDOs** window, and the *BDO Performance* table — a **fourth** copy of the same ranking — is gone;
the only thing it showed that the officer list does not, his per-KPI breakdown, now opens with the
officer himself. **Monthly Targets is now only about setting targets.**


**The OM can now open any officer.** A new **BDOs** tab: one row per officer showing the round he
was given, how much of it he has covered, his weighted score and his standing flags — and, because
that is where the money is, **how many of the high earners in his round he has served and how many
he has not reached**. The untouched ones are broken down by list (*A:1 · B:1 · C:1 · D:1*), and the
table is **ordered by untouched earners**, so the officer the OM needs to speak to today sits at
the top. An officer with an empty round still appears as a row reading zero rather than vanishing.

Tap a name and his high earners open **untouched first** — the list he has to act on — with branch,
location and status, biggest list first; then the ones he has served with the time and who served
them; then his flags; then his whole round. Downloads as a workbook.

**Four fewer places to look.** The app had grown three separate rankings of the same people and two
tabs that led nowhere new:

- **Field Activity is gone.** Recruiting an agent and waking a sleeping one were never a different
  job from working your round — they now sit under **My Agent Base**, where the BDO is already
  standing, as *"Grow my round"*.
- **Team is gone.** Its two unique panels — *High earners I served* and the whole-team live board —
  moved onto his **Dashboard**, which already carried his score and his standing. His weighted
  score was being rendered on both screens; now it exists once.
- **The duplicated leaderboard** (written out separately in Team and in Reports, which is exactly
  how the two drifted apart) is now a single `weightedBoard()` renderer called from both places.
- **The raw-count "BDO Ranking"** table in Reports is removed — the weighted board answers the same
  question, and the per-officer detail it half-showed is what the BDOs window is for.

**BDO: 8 tabs → 6.** *Home · My Base · Report · Agents · Flags · Messages.*

**Fix: the sleeping-agent list has been coming back empty.** `inactive_agents` prepared a statement
with no placeholder and then passed one, so PDO threw *invalid parameter number* on every single
call; the router turned that into a generic database error and the panel swallowed it silently.
Nobody could see it was broken — the list just looked like there were no sleeping agents. Verified
after the fix: **5 sleeping agents with working Wake buttons** where the panel had been blank.

- Assets `?v=55`, SW `imani-v55`

---

## v1.37.0 — 2026-08-12 · "What the flags cost, and what the base is worth"

The rest of the ten-item batch. Schema unchanged (v16 already carried the columns).

**Commission is settled per SA station (item 7).** Two stations do not earn the same weighted
average, so they cannot share one release percentage. The commission file now carries **SA STATION**
per row; the Commission panel gained a station switcher, and each station keeps its own served
rows, its own 30/70 pools, its own achievement and its own saved settlement.
Verified end to end: Arusha 6 served → 60,000,000 at 95% (release 100%); Manyara 4 served →
11,600,000 at 62% (release 40%) — **both stored side by side**, where before the second calculation
overwrote the first. Uploading Manyara's file no longer wipes Arusha's rows: only the stations
present in the file being imported are replaced. A legacy file with **no** SA STATION column lands
on the station the OM is viewing rather than on a blank station that no settlement could ever see.

**One button forgives the month (item 2).** The OM clears every flag — or one officer's flags —
from the Flags panel. **The agents keep exactly the status the BDO gave them**; only the accusation
goes. Forgiven is not forgotten: each cleared flag is copied to `flags_cleared` with who cleared it
and when, and if the next performance file still disagrees the flag comes back wearing
**"forgiven 1×"**. It can be cleared again, and the count keeps climbing — so an officer whose flags
are wiped every single month is visible instead of invisible.
Verified: 5 flags → cleared (all 5 recorded against `om`, all 5 BDO marks intact) → same file
re-uploaded → the same 5 returned marked *forgiven 1×*, alongside a brand-new one showing 0.

**His score, twice, on his own dashboard (item 6).** *As I claimed* beside *If every flag stands*,
with the gap between them stated in red — **-18%** on the verified case (50% → 32% under 5 flags) —
and a button straight to his flags. A clean month says so: both numbers match and nothing is being
questioned.

**Where he stands, and how far he is from the biggest base (item 10).** Base size with his rank
among his peers, coverage percent with its own rank, and the distance to the largest base in the
office: *"The biggest base holds 12 agents — you are 6 short of it."* The officer holding the
biggest base is told to keep it covered and keep it growing.

**A receipt photo can come from the gallery.** `capture="environment"` does not mean *prefer the
camera* on a phone — it means **camera only**, and the gallery is never offered. So a receipt
photographed at the counter an hour earlier, or one a colleague sent on WhatsApp, could not be
attached at all. Both photo dialogs (serving receipt and wake-up proof) now offer **Take photo** and
**Choose from gallery** side by side, camera first. Verified: a gallery pick previews, downscales,
uploads and is stored against the mark exactly like a fresh photo.

- Assets `?v=54`, SW `imani-v54`

---

## v1.36.0 — 2026-08-11 · "Database Upload, and the file that judges nobody" — schema v16

**One door for every office file, and only one of them scores anybody.** "Weekly Upload" is now
**Database Upload**, with the kind of file chosen up front: *Weekly performance · Monthly database
(fixed) · Physical locations · Commission file · High-earner list*. The performance chip is marked
**scores** in red and its panel says *"This file scores and flags"*; every other kind says *"Updates
the database only — never scores, never flags"*. Five half-remembered rules became one visible one.

**The monthly baseline (item 1).** Every agent with his standing status — nobody served, no visits,
no float, activeness as it is (active, inactive, or no status at all), APK version where the file
carries it. It refreshes the agent database and the activeness/APK baseline and touches nothing
else.
**Verified on exactly the case you described**: John had already served and visited 3 carried agents
this week, *then* the baseline landed — **0 flags raised**, his 3 credits intact, office totals
untouched (`fromUpload` still false), and activeness set correctly per agent (a blank activeness
column leaves the agent as he was rather than wiping him).

**New agents get somewhere to be claimed (item 9).** The baseline reports how many agents it had
never seen, and My Agent Base gained a **NEW — not yet mine** toggle beside **My round**, listing
every agent in the database that no BDO owns this month. He serves one and the agent joins his
round. No new tab, so the phone bar stays at five.

**The region choice is now a decision, not a page setting (item 4).** The OM picks a station once
and it is stored: the agent list, flags, live board, targets, exports and Real Performance all obey
it. Verified — with ARUSHA chosen the agent list showed only the Arusha agent; switching to MANYARA
showed only the Manyara one. Previously the picker moved the dashboard alone while the agent list
still showed regions the office had stopped working. Region is also read from **SA STATION only** —
a stray "Region"/"Mkoa" column used to override it whenever SA STATION was blank.

**The dialog that would not close (item 3).** Saves that rebuilt the page but forgot to shut their
own box left it hanging over the fresh screen. Rebuilding the view now closes any open dialog — one
rule, whole class of bug, rather than chasing each save. The upload result also gained a **Clear
result** button and is replaced by a live "Importing N rows…" the moment a new import starts.

**Clock renamed to Dar es Salaam (item 5)** — `Africa/Dar_es_Salaam`. It is the same clock as the
previous `Africa/Nairobi` (East Africa Time, UTC+3, no daylight saving), so **no displayed time
moves**; it simply now reads as the country the business is in.

Schema v16 also lays the groundwork for the rest of the batch: `uploads.kind`, station columns on
`commission_rows`/`commission_calc` (re-keyed to month + station), `agents.apk_version`, and a
`flags_cleared` table.

- Assets `?v=53`, SW `imani-v53`

---

## v1.35.0 — 2026-08-05 · "Bottom navigation for phones"

A BDO works this app one-handed, standing in front of an agent. On a phone the sidebar collapsed
into a **top** bar, which put every tab at the far end of his thumb. The tab list now sits along the
bottom, where the thumb already rests.

- **Four tabs plus More**, chosen from what his role can actually see — a BDO gets
  *Home · My Base · Report · Agents*, an OM gets *Home · Agents · Upload · Targets*. Everything else
  lives behind **More**, which opens a sheet of the remaining sections.
- **Nothing waits unseen.** The unread-message and pending-flag counts ride the icons as dots, and
  any badge belonging to a section hidden behind More **rolls up onto the More button** in red.
  Verified: 1 flag + 1 unread → **More [2]**.
- **The bar always shows where you are.** Open a section from More and it swaps into the last slot
  with the active state, rather than leaving the bar looking as if you were somewhere else.
- **Short labels for the bar only.** "My Agent Base" truncated to "My Agent B..." at 375px, so the
  bar carries its own wording — same destination, fewer letters. Verified: no label truncates for
  either role.
- The top bar keeps the brand and the account buttons, so nothing is duplicated; `.main` gains
  bottom padding and modals clear the bar, both respecting `safe-area-inset-bottom` for the iPhone
  home indicator.

**Desktop is untouched** — verified at 1440×900: bar hidden, all 8 sidebar tabs and their badges
present, padding unchanged.

- Assets `?v=52`, SW `imani-v52`

---

## v1.34.0 — 2026-08-03 · "Idle alert for the BDO, base coverage for the OM"

**A red alert when a BDO goes a day without recording anything.** It is the first thing on his
dashboard — before his cards, before his feed — naming exactly how long it has been and offering
one tap through to his round:

> **NO KPI RECORDED IN OVER 24 HOURS** — Your last KPI was 2026-07-31 06:47, that is **75 hours ago**.
> Your OM sees this too. Serve an agent, tick a visit or wake a dormant one today.

Counted in **his own working days**, not raw clock hours, so a rest day never accuses him. Today
counts as missed only **from midday**, so a man who worked late on Saturday is not confronted at 8am
on Monday before he has had a chance to start.

Verified across every clock position: worked 2h ago → quiet · 33h idle at 08:00 → quiet (morning
grace) · Saturday 17:00 → Monday 08:00 → quiet (rest day) · the same at 14:00 → **ALERT** · 3 days
idle → **ALERT** · 53h since the last tap but working today → quiet.

**Base coverage for the OM.** "He served 40 agents" means nothing on its own — 40 of 45 is a month
nearly finished, 40 of 400 is barely started. Real Performance gained a panel pairing the round each
BDO was given with how much of it he has actually served:

| BDO | His round | Served | Still to serve | Covered |
|---|---|---|---|---|
| John | 10 | 8 | 2 | 80% |
| Peter | 5 | 0 | 5 | 0% |

Green at 80%+, gold from 50%, red below — so the officer running out of work and the one falling
behind are both obvious at a glance. It follows the month/station scope of the window and is added
to the Excel export as its own **Base coverage** sheet.

- Assets `?v=51`, SW `imani-v51`

---

## v1.33.1 — 2026-08-03 · "Show where the work is filed, and why a photo will not open"

**A panel that answers "he served agents but the app says zero" with evidence.** Settings & Data now
carries **Where each BDO's work is filed**: serving credits per BDO per month with the open month in
bold, so it is immediately visible whether an officer's taps are sitting in the previous column or
whether he genuinely has none. When rows are misfiled it also lists them — *filed under 2026-07,
actually done in 2026-08, 3 rows* — and a **Re-file work by its own timestamp** button re-runs the
repair on demand. The last run is shown with its exact result.

Verified: 3 August taps filed under July were caught and moved (`3 KPI marks`), the count dropped to
**0 remaining**, and the same BDO's 11 genuine July credits correctly stayed in July.

**The proof viewer stopped lying.** A failed photo was hidden by `onerror`, leaving a blank black
box identical to a slow load — no way to tell a missing file from a broken one. It now shows a
loading state, then either the photo or **the server's own reason**, plus an *Open the photo in a new
tab* link. A mark whose file is gone reads *"No proof photo for this agent — the mark is still valid,
only the picture is missing"* instead of silence. The month is also passed explicitly, so a photo
attached to a mark in another month still resolves.

Verified both paths: a mark pointing at a deleted file shows the explanation, and a real photo
renders (100×100 loaded).

- Assets `?v=50`, SW `imani-v50`

---

## v1.33.0 — 2026-08-02 · "Recover the work filed under the wrong month + the team's day"

### The work was never lost — it was filed under the old month

BDOs reported serving agents this month and finding the work gone. **Nothing was deleted.** Before
the month began rolling itself over (v1.29), the app sat on whatever month was last opened by hand,
and `kpi_mark` files against `open_month()`. So every tap made on the 1st and 2nd of August was
stamped **2026-07**. His live feed still showed it — that reads by DATE — but his served count, his
base and the agent list are all month-filtered, so to him the day's work had vanished.

Reproduced exactly before fixing: 4 agents served with August timestamps but filed under July read
as **0 served, 0 in base, 0 KPIs on every agent**.

The `at` timestamp records when the tap actually happened, so it — not the month column — is the
truth, and rows are re-filed into the month their own timestamp names. A tap can only ever be filed
against the open month, so a mismatch is by definition a misfile, never a deliberate back-date. The
same correction is applied to the serve rows and typed daily reports, and every recovered agent is
put back into his BDO base. Collisions are **skipped, not forced**: if the agent already holds that
KPI in the correct month the existing credit stands.

**Verified: 0 → 4 served, 4 back in his base, both KPIs credited to him on all four agents.** The
repair runs once per month, automatically, on the next request after deploying.

### The team's day, next to his own

His live dashboard now shows what the whole team has done today beside his own tally — a number
climbing next to yours does more than any reminder:

> **TEAM TODAY** — 8 KPIs done by the team *(you 2 · 3 BDOs out today)* — Served 1 · Visit 1 · APK 4
> · Activeness 2 — **#2 of 3 · Mary (BDO) 5**

Top of the board swaps the rank pill for **"You are leading today 🔥"**. Counts only — no money, and
no other BDO's agent names. Both states verified, and the dashboard still fits one screen.

- Assets `?v=49`, SW `imani-v49`

---

## v1.32.0 — 2026-08-02 · "A BDO's dashboard is his day, and nothing else"

**A permission tick was handing a BDO the whole office board.** `viewDashboard` chose the personal
dashboard only when a user *lacked* `dashboard: View`. Tick that box for the BDO role in Access
Control and he received the full OM screen: **Total Agents 2,881, office-wide Withdraw Volume, the
whole team's live feed and its Download button, and the SA-station picker.**

A field user now gets his own dashboard **by role**, never by which boxes happen to be ticked —
the same rule that already protects `is_manager()` and `is_field_user()`. Verified with
`dashboard: View` deliberately switched ON for the BDO role: no Total Agents card, no Withdraw
Volume, no "office-wide" text, **0** download buttons and **0** station pickers.

**And his dashboard is now only his day.** It carries his four KPI cards and "My day so far" —
today's Served / Visits / APK / Activeness plus his timestamped feed. Nothing else. The
month-long panels moved one tap away to **Team**, which is his "where do I stand" page and now
reads *"Your month so far, and where you stand against the rest"*: his weighted **My Performance**,
the **High earners I served** day/week/month table, the read-only team board and the ranking.

Verified: the BDO dashboard renders exactly one panel ("My day so far") with 8 cards — his four
month counters and his four today counters — and **fits one screen with no scrolling** at 1826×810.
The OM's dashboard is untouched: office cards, withdraw volume, station picker and download all
still present.

- Assets `?v=48`, SW `imani-v48`

---

## v1.31.0 — 2026-08-02 · "A BDO's round follows him into the new month"

**Counters reset on the 1st; a BDO's agents do not.** He was opening the new month looking at an
empty My Agent Base with nothing to work from, having to rediscover his own round on the Agents tab.
The men he served last month are now seeded into the new month as his **priority round** — listed on
day one, all at **zero KPIs**.

Two things were wrong and both are fixed: nothing was carried at rollover, and the base list ignored
the `base` table entirely (it only ever showed agents served *this* month, so even a carry would not
have appeared). My Agent Base is now his whole round — carried agents, anyone he serves now, and
anyone an upload or a recruitment put under him — with a `N carried from last month` badge.

The carry is **deliberately separate from the rollover and has its own marker**, so a month that
already opened under an older build still gets its agents the next time anyone opens the app,
instead of staying empty until the month ends.
**Verified**: 5 agents served in July → August opens with all 5 present, `level=priority`, **0 KPIs
each**, counts reading `priority 5 / total 5 / served 0`.

**Every practical search switch on My Agent Base.** Search now has a **Search in** selector (all
fields, or just agent / acc / phone / branch / location) beside the existing KPI filter, plus
**Served** (not served yet · already served), **Location** (missing · captured), **Branch** (only
the branches actually in his round), and **Sort by** (high-earner list · agent · branch · most still
to do). Clear resets all of them. Each was exercised: location-missing, branch, sort-by-name,
already-served and not-served-yet all returned the right rows.

**The work now fits on one screen.** The layout was tuned for a spacious desktop and pushed the
actual agent table below the fold behind a wall of stat cards. Chrome is tightened throughout —
cards (168px → 85px tall, more per row), panel padding, table rows, and the filter bank — **without
shrinking anything below comfortable reading size**: body copy stays 12.5–13px and no contrast ratio
changed. Only empty space was removed.
**Verified at both 1280×720 and 1826×810: no vertical scrolling and no horizontal overflow** on My
Agent Base, with the table fully visible.

- Assets `?v=47`, SW `imani-v47`

---

## v1.30.1 — 2026-08-01 · "Activeness stops depending on a date stamp"

Two reports — active agents all reading as "wake up", and the Active/Inactive search filter
returning nothing — turned out to be **one root cause**: every read of activeness was gated on
`act_month = the current month`. The moment the month turned, that stamp named the old month, so the
status resolved to blank (→ "Inactive, wake up" for the entire base) and the filter matched no rows
at all.

v1.30.0's carry-forward did not rescue it, because that ran **only at the moment of rollover** and
production had already rolled under v1.29 — the one-shot marker was set, so the carry never
executed and never would.

The fix removes the dependency instead of patching around it: **`act_current` IS the latest known
state**, so it is read directly, with no date gate, everywhere status is displayed, filtered or
listed. This is self-healing — it gives the right answer whether or not any rollover ran, and
whichever version performed it. `act_month` is now only ever *written* (recording when a status was
last set) and read for one genuinely month-scoped figure: how many agents fell asleep *this* month.

Corrected in six places: the Inactive-agents panel, the Active/Inactive search filter, the status on
both agent lists, the "already awake, cannot wake again" guard, and reversing a wake (which silently
did nothing once the month had turned).

**Verified against production's exact state** — month already open, rollover marker already set,
every agent still stamped with the old month:
- active-by-file and active-by-BDO both read **ACTIVE**; never-woken and fell-asleep both read
  **INACTIVE** and appear on the wake list;
- the **Active filter** returned exactly the two active agents and the **Inactive filter** exactly
  the two inactive — both previously returned nothing;
- a BDO waking an agent still flips him to ACTIVE, and a file still moves an agent **either way**
  (one active agent turned INACTIVE and one inactive agent turned ACTIVE by the same upload).

- Assets `?v=46`, SW `imani-v46`

---

## v1.30.0 — 2026-08-01 · "Activeness carries across the month, KPI counters do not"

v1.29 reset everything on the 1st — including the thing that should not reset. KPI counters are
counters and start at zero; an agent's activeness is a **state**, and someone woken in the month
that just ended is an active agent on the 1st. Because the activeness stamp still pointed at the old
month, every agent read blank and **the entire base turned up as needing a wake**.

- **The status the agent ended on carries into the new month.** Woken by a BDO's tap, or reported
  active by the office file — either way he starts the month ACTIVE and off the wake-up list. Only
  the agents who finished the month still dormant appear as wake-up candidates.
- **Current *and* previous readings both carry**, so the Inactive panel's ordering and the
  waked-minus-slept deviation compare against the right baseline. An agent who fell asleep in July is
  not counted as sleeping again in August.
- **The first performance file of the new month takes over completely** and becomes the base for the
  rest of it — its current/previous activeness columns overwrite the carried state, whichever way
  they point.
- **The chip says which of the two it is.** "Active — carried from last month; no file has covered
  him yet this month" (with a small `CARRIED` tag) versus "Active — confirmed by this month's
  performance file". Those are different facts and the OM should not have to guess.

**Verified across all four end-of-month states.** After the roll: agent woken by a BDO → ACTIVE, no
wake needed; woken by the file → ACTIVE; never woken → needs waking; fell asleep mid-month → needs
waking. The wake-up list contained exactly the latter two, and the month's `slept` count was **0**.
Then the first August file was uploaded deliberately contradicting the carried state — the
BDO-woken agent flipped to INACTIVE and the never-woken one to ACTIVE, every agent switching to
`from file`, proving the file becomes the new base.

- Assets `?v=45`, SW `imani-v45`

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
