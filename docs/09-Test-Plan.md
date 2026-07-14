# Test Plan & Acceptance Criteria

**System:** IMANI SUPERDEALER · **Version:** 1.2.0

---

## 1. Strategy

| Layer | What | How |
|---|---|---|
| Static | Every PHP file parses | `php -l` on all files — runs in CI on every push |
| Integration | API against a real MySQL 8 | CI job: boot `php -S`, curl `health` (schema create + seed), `login`, authenticated `months` |
| Functional | The scenarios below | Manual/scripted against a fresh DB (demo buttons make this fast) |
| UAT | Owner + OM walk the month lifecycle end-to-end on staging/live | Checklist §4 |

CI: `.github/workflows/ci.yml` (jobs `php-lint`, `mysql-integration`) — must be green before deploy.

## 2. Functional test cases

Seed accounts (fresh DB): `superadmin/om/md/john/mary/peter`, password `imani123`.

### Auth & accounts
| ID | Steps | Expected |
|---|---|---|
| T-A1 | Login with wrong password ×6, then correct password | Attempts 1–5: 401 generic; attempt 6 locks; correct password during lock → 429; after 15 min → 200 |
| T-A2 | Login `om`, change password (<8 chars, wrong current, valid) | 400, 400, 200; old password now 401 |
| T-A3 | Superadmin disables `john`; john's next request | 401 "Account is no longer active" path (session invalidated) |

### RBAC & admin
| ID | Steps | Expected |
|---|---|---|
| T-R1 | `mary` (bdo) calls `admin_users`, `upload_weekly`, `commission_get` | 403 on all |
| T-R2 | Superadmin unticks OM targets.View, OM reloads | Targets tab gone from sidebar; direct API call → 403 |
| T-R3 | Create custom role `teamleader`, grant dashboard.V, create user `amina` with it + password | Amina logs in, sees only Dashboard |
| T-R4 | Try to delete/demote/disable a superadmin; delete own account | All rejected 400 |
| T-R5 | Save permissions with weights… (non-admin) | 403 |

### Uploads & agent visibility
| ID | Steps | Expected |
|---|---|---|
| T-U1 | OM uploads 12-row demo weekly file (BDO column John/Mary/Peter) | 200; rows=12; agents upserted; bases populated; ledger fed; unknown BDO name auto-creates account (reported in response) |
| T-U2 | Same upload again | No duplicate agents (upsert by account); ledger unchanged (first credit kept) |
| T-U3 | Upload into a CLOSED month | 400 "Month … is closed" |
| T-U4 | `john` opens Agents tab | `restricted:true`; exactly id/acc/name/phone/branch/physical_location/kpi per item; **no partner, no commission fields in the JSON**; 12 rows visible |
| T-U5 | OM opens Agents tab | `restricted:false`; Partner column present |

### KPI ledger (anti-duplication) — core business rules
| ID | Steps | Expected |
|---|---|---|
| T-K1 | `mary` marks served on agent X (OPEN month) | 200; chip becomes "Served ✓ mary"; service_history row written; X joins mary's base |
| T-K2 | `mary` marks served on X again | 409 "Already done by mary on … — no need to repeat" |
| T-K3 | `john` marks visit on X after mary did visit | 409 names **mary** |
| T-K4 | `john` marks apk on X (untouched KPI) | 200 — different KPI on same agent is allowed |
| T-K5 | Mark when month is AWAITING/CLOSED (no OPEN month bug-check) | Marks always target the newest OPEN month; UI hides chips when not OPEN |
| T-K6 | Two simultaneous marks of the same KPI (race) | Exactly one ledger row (unique key); loser gets 409 |

### Targets, weights & performance
| ID | Steps | Expected |
|---|---|---|
| T-T1 | OM types office targets (5 KPIs) and saves | Dashboard bars show actual/target and %; achievement = avg of set KPIs |
| T-T2 | OM saves BDO targets with weights totalling 120 | 400 "KPI weights must add up to 100% (currently 120%)" |
| T-T3 | OM saves mary: serving 4/w30, float 100000/w20, visits 4/w20, apk 4/w15, active 4/w15; mary has served 2, visited 1, apk 1, active 1, float 0 | Score = 30·50%+20·0%+20·25%+15·25%+15·25% /100 = **28**, flag **red**, "28% — BELOW 50" pill on mary's My Base and OM's table |
| T-T4 | Raise mary's actuals until score ≥ 80 | Flag flips to **EXCELLENT** (green) |
| T-T5 | BDO without targets opens My Base | "OM has not set your targets yet" note; no score pill |

### Months & commission
| ID | Steps | Expected |
|---|---|---|
| T-M1 | OM opens next month | New month OPEN; previous → AWAITING; BDO marks now land in the new month |
| T-M2 | Close month without a saved calc | 400 "Upload the final commission file and Calculate & Save…" |
| T-M3 | Upload commission demo (8×12.5M SERVED + 2 NOT_SERVED), calc at 82% | total 100,000,000; fixed 30,000,000; variable 70,000,000; release 0.8; variablePaid 56,000,000; **final 86,000,000** |
| T-M4 | Release table boundaries: 49/50/59/60/79/80/89/90 | 0/.2/.2/.4/.6/.8/.8/1.0 |
| T-M5 | Close the month | Status CLOSED; every (bdo, served agent) becomes `priority` in next month's base; counts reported; re-close → 400 |
| T-M6 | Re-upload commission file for an AWAITING month | Replaces previous rows (row count matches new file) |

## 3. Regression pack (run before every release)
T-A1, T-R1, T-R2, T-U1, T-U4, T-K1–K4, T-T2, T-T3, T-M2, T-M3, T-M5 — ~20 minutes with demo buttons.

## 4. UAT / Go-live acceptance checklist

- [ ] Fresh production DB creates schema + seeds on first load (`health` returns ok)
- [ ] All seed passwords changed; real BDO accounts created with real names
- [ ] OM completes one real weekly upload; BDOs confirm they see All Agents (restricted) on phones
- [ ] Two BDOs confirm the duplicate block message names the right colleague
- [ ] OM sets office + per-BDO targets; scores/flags visually correct on both sides
- [ ] One full month cycle on staging data: open next month → upload commission → calc → close → priority base carried
- [ ] HTTPS forced; `lib/config.local.php` not downloadable (browser test)
- [ ] Backup job exists and a restore has been rehearsed once
