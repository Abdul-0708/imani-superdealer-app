# IMANI SUPERDEALER — Business Management Platform

Real-time KPI, agent-management, verification and commission-intelligence platform for a
super-dealer network (Arusha, Manyara and future stations). Node.js + Express + MySQL, with a
responsive web front-end that works on desktop and mobile.

---

## 1. Features

| Area | What it does |
|---|---|
| **Roles & access** | Super Admin, Managing Director, Operational Manager, BDO. Super Admin sets per-role, per-module **View / Edit / Delete** permissions from an Admin panel. |
| **Agent lifecycle** | Weekly upload (no BDO attach needed), permanent BDO base, priority levels (green/yellow/red), automatic month-end carry-forward. |
| **Field serving** | BDOs log in on their phones and serve agents with optional GPS + ODK/APK (YES/NO). |
| **Integrity** | Bank-upload verification (claim vs bank → Verified/False), False-Claim & Integrity dashboard, Data-Quality dashboard, Unknown-Location report. |
| **Money** | Commission Intelligence (SERVED-only, 30/70 pool split, achievement release table), Clawback Intelligence, Analytics, Executive dashboard. |
| **AI Insights** | Local decision-support answers (no external service). |
| **Security** | bcrypt password hashing, JWT sessions, forced first-login password change, login rate-limiting + lockout, security headers, audit trail. |

---

## 2. Architecture

```
server/
  index.js            Express app: security middleware + static + /api
  config.js           Env config + JWT secret resolution
  auth.js             bcrypt + JWT + role guards
  permissions.js      RBAC matrix (role x module x view/edit/delete) + requirePerm
  seed.js             First-run users + default permissions
  db/
    index.js          Driver selector (DB_DRIVER)
    filestore.js      JSON file driver (local dev / tests)
    mysql.js          MySQL driver (production)
    schema.sql        MySQL DDL — source of truth
  services/           Pure business logic (unit-tested): priority, weekly, bank,
                      targets, final, commission, clawback, verify
  routes/             auth, users, admin, uploads, agents, base, dashboard,
                      verification, quality, commission, clawback, executive,
                      serve, insights
public/               Front-end SPA: index.html, app.js, styles.css
scripts/              validate.js (structure) + smoke.js (unit + API tests)
```

The database sits behind a **repository interface** with two interchangeable drivers, so the same
code runs on the local file store and on production MySQL.

---

## 3. Running locally

Node.js 18+ required. No MySQL needed for local dev (uses the file store).

```bash
npm install
npm test        # validate + 90 smoke assertions
npm start       # http://localhost:3000
```

Seeded accounts (all password `imani123`, and **all must set a new password on first login**):

| Username | Role |
|---|---|
| `superadmin` | Super Admin |
| `md` | Managing Director |
| `om` | Operational Manager |
| `john`, `mary`, `peter` | BDO |

---

## 4. Production deployment (Node + MySQL)

1. **Create the database** (tables are created automatically by migrations on boot):
   ```bash
   mysql -u root -p -e "CREATE DATABASE imani_superdealer CHARACTER SET utf8mb4;"
   ```
   The app runs pending migrations (`server/db/migrations/*.sql`) at startup. To run them
   manually: `DB_DRIVER=mysql npm run migrate`. Add schema changes as new numbered files
   (e.g. `002_add_column.sql`) — never edit an applied migration.
2. **Configure environment** — copy `.env.example` to `.env` and set:
   - `NODE_ENV=production`
   - `JWT_SECRET=` a long random string (the app **refuses to start** in production without one)
   - `DB_DRIVER=mysql` and the `MYSQL_*` connection values
   - Change the `SEED_*` passwords
3. **Install and run:**
   ```bash
   npm install --omit=dev
   NODE_ENV=production node server/index.js
   ```
   Use a process manager (pm2/systemd) and run behind a reverse proxy (nginx/Caddy) that
   **terminates HTTPS**. The app already sets `trust proxy` and security headers.
4. **First login:** sign in with each seeded account and set a strong password.

### Run with Docker (app + MySQL together)

```bash
export JWT_SECRET=$(openssl rand -hex 32)
docker compose up --build
```
The schema is auto-applied to MySQL on first boot; the app waits for the DB healthcheck. App on
`http://localhost:3000`. Override `MYSQL_PASSWORD`, `SEED_*` etc. via env or a `.env` file.

### Continuous integration

`.github/workflows/ci.yml` runs on every push/PR: `npm ci` + `npm test` (validate + smoke against the
file driver — no MySQL needed) and a `docker build` of the production image.

---

## 5. Two-factor authentication (MFA)

Any user can enable TOTP 2FA from **Account → Two-factor authentication**: scan the QR with Google
Authenticator / Authy / Microsoft Authenticator (or enter the key manually), then confirm a 6-digit
code. Once enabled, login requires the code as a second step. Disable it by entering a current code.
Implemented with pure Node crypto (RFC 6238); no secrets ever leave the server.

---

## 6. Excel file formats

**Weekly / dated performance** (a BDO/Officer column is optional — rows auto-link, unknown BDOs are
created; rows without one go to *Unassigned*):

`Agent Account, Agent Name, Phone, Branch, Unique Serving Status, Float Served, Agent Visit (YES/NO),
APK Update (YES/NO), Agent Activeness, SA Commission, Served Status` — optional: `BDO, Physical
Location, Partner, Date`.

**Bank file** (verification source): `Agent Account, Agent Visit, APK Update, Served Status`.

**Monthly targets:** `Station, Target Agents, Target Float, Target Served, Target Visits`.

**Final performance** (commission): `SA Commission, Served Status, Float, Unique`.

Header matching is flexible (case/spacing/synonyms). Every screen has a "Load demo" button to try
flows without a file.

---

## 7. Commission rules

- Only `Served Status = SERVED` rows count toward SA Commission.
- Pool split: **Fixed 30% / Variable 70%.**
- Variable release by office achievement: `<50% → 0`, `50–59% → 20%`, `60–69% → 40%`,
  `70–79% → 60%`, `80–89% → 80%`, `≥90% → 100%`.
- Clawback: **Net = Earned − Potential** (reasons: Dormant, APK Missing, Inactive, Float Reduction).

---

## 8. Monitoring

- **`GET /api/health`** — liveness + DB reachability: `{ ok, driver, db: "up"|"down", uptime, version }`.
  Returns `503` if the database is unreachable. Point your load balancer / uptime monitor here.
- **`GET /api/metrics`** — Prometheus text format: request counts by status class, a latency
  histogram, uptime, and memory. Protect it in production by setting `METRICS_TOKEN` (then scrape
  with `?token=…` or a `Bearer` header).
- **Logs** — structured one-line JSON per request (`method, path, status, ms, uid`) and per error, to
  stdout/stderr for aggregation (`LOG_LEVEL` = error|warn|info|debug).

The MySQL driver, migrations, and full API flow are validated against a real server by
`scripts/validate-mysql.js` (`MYSQL_* node scripts/validate-mysql.js`).

---

## 9. Security notes

- Passwords hashed with bcrypt; sessions are JWTs (12h).
- All seeded/privileged accounts are forced to change their password on first login.
- Login is rate-limited per IP and locks a username after repeated failures.
- Security headers via Helmet (CSP allows only self + the Chart.js CDN); responses gzip-compressed.
- Every sensitive action is written to an audit trail (viewable by Super Admin).
- Access is enforced **server-side** by the permission matrix, not just hidden in the UI.
- Put the app behind HTTPS in production and set a strong `JWT_SECRET`.

---

## 10. Testing

```bash
npm run validate   # ASCII/brace/duplicate checks on the front-end + all server files load
npm run smoke      # unit tests for pure services + full API integration (90 assertions)
npm test           # both
```
