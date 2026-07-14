# User Manual & Admin Manual

**System:** IMANI SUPERDEALER · **Version:** 1.2.0 · Written for non-technical users.

---

# PART A — Everyone

## Signing in
Open the website, enter your username and password. Six wrong tries locks the account for
15 minutes. To change your own password: bottom-left **Password** button (needs your current one).
Forgot it? The Super Admin sets you a new one.

## Finding your way
The **orange sidebar** on the left (top bar on phones) shows only what your role can access.
The flame logo pulses; your initials and role sit at the bottom.

---

# PART B — BDO (field officer) manual

You have two tabs: **My Agent Base** and **All Agents**.

## My Agent Base
- Top cards: **Priority** (agents you served last month — visit them first), **New**, **Total**,
  **My Served** this month.
- **My Performance**: your weighted score for the month with a colour flag —
  🔴 **below 50%** = needs urgent improvement · 🟡 50–79% · 🟢 **80%+ = EXCELLENT**.
  Each KPI bar shows your progress against the target your OM set, with its weight in brackets.
  If it says "no targets yet", ask your OM.

## Marking work (the KPI chips)
Every agent row shows four chips: **Served · Visit · APK · Active**.
- **Orange outline chip** = not done yet → **tap it** when you complete that work. It locks in
  with your name and counts toward *your* score.
- **Green chip "✓ name"** = already done this month **by that person** — do **not** repeat it;
  the system will refuse and tell you who did it and when.
- Chips are only tappable while the month is **OPEN**.

## All Agents
The full uploaded agent list — account, name, phone, branch, **physical location**, and the same
KPI chips. **Check here before travelling**: if an agent's KPI is already green, someone attended
it. You can also mark KPIs straight from this list.

---

# PART C — Operational Manager (OM) manual

## Weekly Upload
Upload the Excel (start-of-month or weekly). Needs an **Agent Account** column; recognised extras:
Agent Name, Phone, Branch, Float Served, Agent Visit, APK Update, Agent Activeness, SA Commission,
Served Status, **Physical Location**, Partner, **BDO**. If the file has a BDO column, each row is
credited to that officer automatically (unknown names get accounts created — tell them password
`imani123` and to change it). Uploading also fills the KPI chips for everyone.

## Monthly Targets
1. **Office targets** — type the month's targets for Serving, Float, Agent Visits, Agent APK,
   Agent Activeness. These drive the Dashboard bars and suggest the commission achievement.
2. **BDO Targets & KPI Weights** — pick a BDO, type his 5 targets **and the weight %** of each KPI
   (the total must be exactly **100** — the counter turns green). Save per BDO.
3. **BDO Performance** — live ranked table: each BDO's weighted score with the red/amber/green
   flag and per-KPI mini-pills. 🔴 below 50 needs your attention.

## Commission & Months (month-end routine)
1. During the month, everyone works in the **OPEN** month.
2. Ready to start a new month but the bank's final file isn't in yet? Click
   **Open next month** — BDOs continue in the new month; the old one shows **AWAITING**.
3. When the final commission Excel arrives: select the awaiting month → **Upload file**.
4. Check the suggested **Achievement %** (from your office targets), adjust if needed →
   **Calculate & Save**. You'll see: total (SERVED rows only), Fixed 30%, Variable 70%,
   release % from achievement, and the **Final Commission**.
5. **Close month** (red button — needs a saved calculation, cannot be undone). Every agent served
   in that month automatically becomes a **Priority** agent of the same BDO next month.

---

# PART D — Managing Director (MD) manual

Dashboard (pick any month): KPI cards, target attainment bars, overall achievement.
Monthly Targets tab: office targets and every BDO's weighted score. Commission & Months:
uploaded rows, saved calculations and month statuses. Everything is view-only.

---

# PART E — Super Admin manual

## Members
Add a member: username, full name, **role** (BDO / OM / MD / Super Admin / custom), station,
and **their password** (you give it to them; minimum 6 characters). Per member you can:
change role (dropdown), **Set password**, **Disable/Enable**, **Delete** (confirmed; Super Admins
are protected and you cannot delete yourself).

## Access Control
1. Click a **role chip** (BDO, OM, MD, or a custom role).
2. For each module, toggle **View / Edit / Delete** (Edit/Delete auto-enable View).
3. **Save permissions.** Members see changes on their next page load.
4. **+ New role** creates a custom role (lowercase, e.g. `teamleader`) — then assign its toggles
   and add members with that role.

## Recent Activity
The audit trail: who logged in, uploaded, marked KPIs, changed permissions, opened/closed months.

## Rules to remember
- There is no "forgot password" email — **you** reset passwords.
- Change all seed passwords (`imani123`) immediately after installation.
- The Super Admin account always has full access and cannot be locked out by permission edits.
