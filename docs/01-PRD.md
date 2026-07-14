# Product Requirements Document (PRD)

**Product:** IMANI SUPERDEALER Business Management Platform
**Version:** 1.2.0 · **Date:** 2026-07-14 · **Status:** Live at https://hardwaresupermarkets.co.tz/

---

## 1. Purpose

IMANI SUPERDEALER operates a super-dealer agent network (Arusha, Manyara and future stations).
Field officers (BDOs) serve agents; the Operational Manager (OM) uploads performance files,
sets targets and closes months; the Managing Director (MD) monitors results; commissions are
computed from a bank-issued final file. Before this product, all of this lived in disconnected
Excel sheets: duplicated field visits, no live view of who attended which agent, manual
commission math, and no per-BDO accountability.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Eliminate duplicated field work | KPI repeats blocked by the shared ledger | 0 duplicate credits |
| Live performance visibility | Time from upload to dashboards | < 1 minute |
| Accurate commission | Manual Excel steps at month close | 0 (calculator only) |
| BDO accountability | BDOs with weighted score visible | 100% of BDOs with targets |
| Run on existing hosting | Infrastructure cost above current cPanel plan | 0 |

## 3. Users & Personas

| Persona | Role key | Needs |
|---|---|---|
| **Super Admin** (owner) | `superadmin` | Create members, assign roles & passwords, control per-module access, see audit trail |
| **Operational Manager** | `om` | Upload weekly/monthly agent files, type monthly targets, set per-BDO targets & KPI weights, upload final commission Excel, open/close months |
| **Managing Director** | `md` | View dashboards, targets attainment, commission results |
| **BDO (field officer)** | `bdo` | See own agent base (priority-first) on a phone, see ALL uploaded agents (restricted columns), mark agent KPIs, see own weighted score |
| **Custom roles** | any | Whatever the Super Admin grants (e.g. `teamleader`) |

## 4. Functional Requirements

### FR-1 Authentication & Accounts
- FR-1.1 Username/password login (bcrypt); PHP session; logout.
- FR-1.2 Per-username lockout after 6 failed attempts for 15 minutes.
- FR-1.3 Users can change their own password (min 8 chars).
- FR-1.4 Super Admin creates members with any role and sets/resets their passwords (min 6 chars).

### FR-2 RBAC
- FR-2.1 Permission matrix: role × module × {View, Edit, Delete}, editable by Super Admin.
- FR-2.2 Modules: dashboard, mybase, agents, upload, targets, commission, admin.
- FR-2.3 Custom roles can be created (lowercase slug); Super Admin always retains full access.
- FR-2.4 All checks enforced server-side; navigation reflects View permissions.

### FR-3 Agent Data & Uploads
- FR-3.1 Weekly/monthly Excel parsed **in the browser** (SheetJS) and sent as JSON rows.
- FR-3.2 Flexible headers; recognized fields: Agent Account (required), Agent Name, Phone, Branch,
  Float Served, Agent Visit (YES/NO), APK Update (YES/NO), Agent Activeness, SA Commission,
  Served Status, Physical Location, Partner, BDO/Officer.
- FR-3.3 A BDO column links each row to that BDO; unknown BDO names auto-create accounts
  (default password `imani123`); rows without a BDO go to `unassigned`.
- FR-3.4 Upload feeds the KPI ledger (first credit wins) and each BDO's base.
- FR-3.5 Uploads are blocked into CLOSED months.

### FR-4 Shared KPI Ledger (anti-duplication)
- FR-4.1 One row per (month, agent, KPI); KPI ∈ {served, visit, apk, active}.
- FR-4.2 First BDO to perform a KPI owns the credit; any later attempt returns
  "Already done by *X* on *date* — no need to repeat" (HTTP 409).
- FR-4.3 KPI status (and who did it) is visible to every BDO before travelling.
- FR-4.4 Marking allowed only while the month is OPEN, via My Agent Base or All Agents.

### FR-5 Agent Visibility
- FR-5.1 BDOs see the **entire uploaded agent list** with a restricted column set only:
  Account, Name, Phone, Branch, Physical Location, KPI status. Stripping is server-side.
- FR-5.2 OM/MD see full agent details (adds Partner, plus KPI status), searchable, paginated (50/page).

### FR-6 Targets & Performance
- FR-6.1 OM **types** office monthly targets: Serving, Float, Agent Visits, Agent APK, Agent Activeness.
- FR-6.2 OM sets per-BDO monthly targets for the same 5 KPIs **plus a weight %** per KPI; weights must total 100.
- FR-6.3 BDO weighted score = Σ(min(100, actual/target×100) × weight) / Σweights (unset KPIs skipped, renormalized).
- FR-6.4 Flags: score < 50 → **red**; 50–79 → amber; ≥ 80 → **excellent (green)**.
- FR-6.5 BDO sees own score + per-KPI bars on My Agent Base; OM sees a ranked table of all BDOs.

### FR-7 Month Lifecycle & Commission
- FR-7.1 Statuses: OPEN → AWAITING → CLOSED. Exactly the newest OPEN month receives live serving.
- FR-7.2 OM may open the next month (BDOs continue working) while the previous month AWAITS its final commission.
- FR-7.3 OM uploads the special commission Excel (SA Commission, Served Status per row) for an
  OPEN/AWAITING month; re-upload replaces the month's rows.
- FR-7.4 Calculator: total = Σ SA Commission where Served Status = SERVED; Fixed = 30%; Variable pool = 70%;
  release by achievement: <50→0%, 50–59→20%, 60–69→40%, 70–79→60%, 80–89→80%, ≥90→100%.
  Achievement is suggested from office targets and can be overridden.
- FR-7.5 Closing requires a saved calculation; closing carries every served agent forward as
  next month's PRIORITY base per BDO, and locks the month.

### FR-8 Dashboard & Audit
- FR-8.1 Dashboard: month selector, KPI cards, attainment bars vs typed targets, overall achievement.
- FR-8.2 Audit trail records login, uploads, permission changes, user admin, KPI marks, month events.

## 5. Out of Scope (v1.x)

Email sending (password resets are done by the Super Admin), MFA, offline mode/PWA, GPS capture,
push notifications, multi-language (English only), analytics charts beyond dashboard bars,
API access for third parties.

## 6. Release Criteria

- All FRs demonstrably working on the live host (PHP 7.4+/8.x + MySQL, cPanel).
- Documentation suite published (this docs/ folder).
- Seed passwords changed on production.
