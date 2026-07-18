# Deployment & DevOps Guide

**System:** IMANI SUPERDEALER · **Target:** cPanel shared hosting (production: hardwaresupermarkets.co.tz)
**Repo:** github.com/Abdul-0708/imani-superdealer-app (private) · branch `main` (Node legacy: `node-legacy`)

---

## 1. Environments

| Env | Where | DB | Notes |
|---|---|---|---|
| Local dev | `php -S 127.0.0.1:3000 -t public_html` | Any MySQL/MariaDB (e.g. portable MariaDB on :3307) | `lib/config.local.php` points at local DB |
| CI | GitHub Actions | `mysql:8` service container | Lint + API smoke on every push/PR |
| Production | cPanel `public_html/` | cPanel MySQL | HTTPS via AutoSSL |

## 2. First-time production deployment

1. **Database (cPanel → MySQL Databases):** create DB (e.g. `user_imani`), create DB user with a
   strong password, add user to DB with ALL PRIVILEGES.
2. **Files:** upload the **contents** of the repo's `public_html/` into the site's `public_html/`
   (File Manager zip-upload-extract, or FTP). Subfolder deployments also work (paths are relative).
3. **Config:** copy `lib/config.sample.php` → `lib/config.local.php`; set `db_host` (usually
   `localhost`), `db_name`, `db_user`, `db_pass`. Optionally change `seed_password` **before** first load.
4. **First load:** open `https://domain/api.php?action=health` → `{"ok":true,…}`. This creates all
   tables (schema v2) and seeds `superadmin/om/md` + demo BDOs.
5. **Secure:** log in as `superadmin`, change every seed password (Admin → Set password), create
   real members, delete demo BDOs if unwanted.
6. **HTTPS:** cPanel → SSL/TLS Status (AutoSSL) → force HTTPS redirect.

## 3. Updates (releases)

```text
1. Merge to main (CI must be green: php-lint + mysql-integration)
2. Bump asset cache-busters in index.html when app.js/styles.css changed (?v=N)
3. Upload ONLY changed files (typically api.php, app.js, styles.css, index.html, lib/*.php)
   - NEVER overwrite lib/config.local.php
4. Load the site once — upgrade_schema() applies any pending schema version automatically
5. Smoke: health → login → dashboard → (if schema changed) the feature's test cases
```

Rollback: re-upload the previous release's files (tag releases in git: `git tag v1.2.0`).
Schema upgrades are additive (new tables/backfills), so old code keeps working against a newer schema.

## 4. CI pipeline (.github/workflows/ci.yml)

| Job | Steps | Gate |
|---|---|---|
| `php-lint` | `php -l` every file under `public_html/` | Any parse error fails the push |
| `mysql-integration` | Start `mysql:8` service → `php -S` → curl `health` (schema+seed) → `login` superadmin → authenticated `months` | Proves the app boots against a clean real MySQL |

## 5. Operations

### Monitoring
- **Uptime:** point any monitor (UptimeRobot etc.) at `/api.php?action=health` — expect 200 + `"ok":true`.
- **Errors:** cPanel → *Errors* (PHP error log). App returns generic 500s; details land here.
- **Business audit:** Admin tab → Recent Activity (logins, uploads, marks, month events).

### Backups (operator responsibility)
- Nightly `mysqldump` of the app database (cPanel Backup or cron:
  `mysqldump -u USER -p'PASS' DBNAME | gzip > backup-$(date +%F).sql.gz`).
- Keep 30 daily + 12 monthly, stored off-server. **The DB is the only state.**
- Restore drill: import dump into a fresh DB → point a copy of the code at it → verify login + dashboard.

### Routine tasks
| When | Task |
|---|---|
| Monthly (OM) | Open next month; upload final commission; calc; close previous month |
| Monthly (helper) | Confirm backup ran; glance at PHP error log |
| Quarterly | PHP version check in cPanel (stay on supported 8.x); change privileged passwords |

## 6. Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| `{"error":"Database error…"}` | Wrong credentials in `config.local.php`, or DB user not added to DB with privileges |
| Blank page | PHP fatal — check cPanel Errors; usually missing `config.local.php` |
| Login loops | Host blocking cookies/sessions (rare) — confirm PHP sessions enabled |
| Old UI after update | Bump `?v=N` cache-busters in `index.html` |
| Excel not importing | Check header names (flexible but must include Agent Account); file parsed in browser — try another browser if SheetJS CDN is blocked |
| 409 on every KPI | Working as designed — that KPI is already credited this month (message names who) |

## 7. Local development quickstart

```bash
git clone git@github.com:Abdul-0708/imani-superdealer-app.git
cd imani-superdealer-app
# create public_html/lib/config.local.php -> local MySQL/MariaDB
php -S 127.0.0.1:3000 -t public_html   # PHP 8.x with pdo_mysql
# open http://127.0.0.1:3000 — schema auto-creates; superadmin/imani123
```

---

## Deploying with cPanel Git Version Control (recommended since v1.10)

The repo root has a **`.cpanel.yml`** that copies `public_html/` (the app) into the live
site root `$HOME/public_html` when you click **Deploy HEAD Commit**. `lib/config.local.php`
is not in the repo and is never touched.

**One-time setup**
1. cPanel -> **SSH Access -> Manage SSH Keys -> Generate a New Key** (no passphrase) ->
   back in Manage SSH Keys click **Manage -> Authorize**, then **View/Download** the PUBLIC key.
2. GitHub repo -> **Settings -> Deploy keys -> Add deploy key** -> paste the public key
   (read-only is enough).
3. cPanel -> **Git Version Control -> Create**: clone URL
   `git@github.com:Abdul-0708/imani-superdealer-app.git`, repository path e.g.
   `repositories/imani` (NOT public_html), branch `main`.

**Every release**
1. Git Version Control -> **Manage** (on the repo) -> **Pull or Deploy** tab
2. **Update from Remote**  (fetches the new commits)
3. **Deploy HEAD Commit**  (runs .cpanel.yml -> copies files into public_html)
4. Open the site; the database self-upgrades on first request.

**Common failures**
- *Pull works but the site never changes*: you skipped **Deploy HEAD Commit** - Pull only
  updates the clone in `repositories/imani`.
- *"Deploy failed: .cpanel.yml missing"*: repo older than v1.10 - pull first, then deploy.
- *Clone/pull "Access denied / could not read from remote"*: the deploy key is missing on
  GitHub or the clone URL is https - use the SSH URL above.
- *"Path already exists and is not empty"* on Create: pick a fresh repository path such as
  `repositories/imani2`.
