# Business Requirements Document (BRD)

**Project:** IMANI SUPERDEALER Business Management Platform
**Sponsor:** Business owner (Super Admin) · **Date:** 2026-07-14 · **Version:** 1.2.0

---

## 1. Background

The business manages a network of banking agents across stations (Arusha, Manyara, expandable).
Revenue depends on a monthly **SA Commission** paid on served agents, with a fixed/variable split
released according to office KPI achievement. Field work is done by BDOs who must serve agents,
visit them, keep their APK app updated and keep them active.

Historic pain points:
1. **Duplicate field effort** — two BDOs visiting the same agent in the same month.
2. **No live accountability** — BDO performance only visible after month-end Excel work.
3. **Manual commission** — error-prone spreadsheet math on the bank's final file.
4. **Hosting constraints** — existing cPanel hosting cannot run Node.js; solution must be plain PHP + MySQL.

## 2. Business Objectives

| ID | Objective | Measure |
|---|---|---|
| BO-1 | Zero duplicated agent attention within a month | KPI ledger blocks; 0 repeat credits |
| BO-2 | Commission computed in-system before month close | 100% of months closed via calculator |
| BO-3 | Continuous operations across month boundaries | New month opens while previous awaits commission |
| BO-4 | Per-BDO accountability with weighted KPIs | Every active BDO has targets + weights and a visible score |
| BO-5 | Data confidentiality by role | BDOs cannot see commission/float amounts of the master list |
| BO-6 | No new infrastructure cost | Runs on existing shared hosting |

## 3. Stakeholders

| Stakeholder | Interest | Involvement |
|---|---|---|
| Business owner | Control, oversight, access management | Super Admin |
| Operational Manager | Daily operations, uploads, targets, month close | Primary operator |
| Managing Director | Results, commission outcome | Viewer |
| BDOs (field force) | Clear task list, no wasted trips, fair scoring | Daily field users (mobile) |
| Deployment helper | Hosting, domain, database, updates | DevOps (GitHub collaborator) |
| Bank / super-dealer principal | Issues the final commission file | External input (Excel) |

## 4. Business Rules (authoritative)

| ID | Rule |
|---|---|
| BR-1 | Only rows with `Served Status = SERVED` count toward SA Commission. |
| BR-2 | Commission pool split: **30% fixed, 70% variable**. |
| BR-3 | Variable release by achievement: <50% → 0 (NA); 50–59 → 20%; 60–69 → 40%; 70–79 → 60%; 80–89 → 80%; ≥90 → 100%. |
| BR-4 | A KPI performed on an agent in a month is performed **once**, by exactly one BDO — first action wins the credit. |
| BR-5 | The five managed KPIs are: Serving, Float, Agent Visits (ODK), Agent APK, Agent Activeness. |
| BR-6 | Per-BDO KPI weights must total exactly 100%. |
| BR-7 | BDO score flags: red < 50%, amber 50–79%, excellent ≥ 80%. |
| BR-8 | A month is closed only after its final commission file is uploaded and calculated. |
| BR-9 | On close, every agent served in that month becomes a PRIORITY agent of the serving BDO for the next month (relationship continuity). |
| BR-10 | Field serving is only recorded into the currently OPEN month. |
| BR-11 | BDOs may see of the master list only: Account, Name, Phone, Branch, Physical Location, KPI status. |

## 5. Current Scope (delivered) vs Future

**Delivered (v1.2):** all of section 4; role/permission administration incl. custom roles; browser-side
Excel intake; dashboards; audit trail.

**Candidate future items (not committed):** transactional email (password reset links), MFA for
privileged accounts, GPS capture on field marks, station-level roll-ups, export of BDO scorecards
to Excel/PDF, Swahili localization.

## 6. Assumptions & Constraints

- Hosting is shared cPanel: PHP 7.4+ with `pdo_mysql`, one MySQL database, HTTPS via AutoSSL.
- Excel files come in varying column spellings — header matching must stay tolerant.
- Internet on the field side can be slow: pages must stay lightweight (no heavy frameworks).
- The bank's final commission file format: one row per agent with SA Commission and Served Status.

## 7. Cost / Benefit Summary

Costs: development (done), existing hosting plan, ~1 hour/month OM admin time.
Benefits: eliminated duplicate visits (fuel/time), commission accuracy, same-day performance
visibility, enforceable data confidentiality, audit trail for disputes.
