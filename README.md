# IMANI SUPERDEALER — Business Management Platform (PHP)

KPI, agent-management and commission-intelligence platform for a super-dealer network.
**Plain PHP + MySQL** — built to run on ordinary shared hosting (cPanel) with nothing to install.

> ⚠️ **Deploying? Use the `main` branch — it is the PHP app.** Download ZIP with `main` selected
> and upload the **contents of `public_html/`**. The `node-legacy` branch is the OLD Node.js
> version kept for history only — do **not** deploy it. (GitHub's language bar says "JavaScript"
> because `public_html/app.js` is the browser front-end; the server code is 100% PHP.)

> 📚 **Full documentation suite** (PRD, BRD, system design, database, API/OpenAPI, security & RBAC,
> NFR, test plan, deployment, user/admin manuals, risks & decisions, changelog): **[docs/](docs/)**

---

## Features

| Area | What it does |
|---|---|
| **Roles & access** | Super Admin creates members, assigns roles (BDO / OM / MD / **custom roles**) and sets their passwords. Clean access-control screen: pick a role, toggle **View / Edit / Delete** per module. Enforced server-side. |
| **Monthly targets (typed)** | OM types the month's targets — **Serving, Float, Agent Visits, Agent APK, Agent Activeness**. No file needed. Targets drive the dashboard bars and the commission achievement %. |
| **Weekly upload** | Excel parsed in the browser; a BDO/Officer column links each row automatically (new BDOs get accounts); rows without one go to Unassigned. |
| **Month lifecycle** | OM can **open a new month for BDOs while the previous month waits for its final commission**. Statuses: OPEN → AWAITING → CLOSED. |
| **Commission** | OM uploads the special commission Excel before closing the month → Calculate (SERVED-only total, 30% fixed / 70% variable, achievement release table) → **Close month** (served agents carry forward as next month's PRIORITY base). |
| **BDO KPI marking** | BDOs see their priority-ordered base and mark each agent's KPIs for the OPEN month: **Served, Visit, APK, Active**. Each mark credits the BDO who did it. A KPI already done by ANY BDO shows who did it and is locked — nobody can repeat it. |
| **BDO targets & weighted scores** | OM sets each BDO's monthly target per KPI **plus a weight %** (must total 100). The BDO sees his weighted score live; OM sees a ranked table. Flags: **red below 50%**, amber 50–79%, **green "excellent" at 80%+**. |
| **Design** | Dark fire-orange + yellow theme, sidebar navigation with glow effects, responsive for phone + desktop. |

**Variable release table:** `<50% → 0 · 50–59 → 20% · 60–69 → 40% · 70–79 → 60% · 80–89 → 80% · ≥90 → 100%`

---

## Structure

```
public_html/          <- upload the CONTENTS of this folder to your host's public_html
  index.html          front-end (single page)
  app.js              front-end logic (parses Excel in the browser)
  styles.css          fire theme
  api.php             the whole JSON API
  .htaccess           blocks config downloads, security headers
  lib/
    db.php            PDO + automatic schema creation + seed on first run
    helpers.php       session auth, permissions, parsers, commission math
    config.sample.php copy to config.local.php with your DB details
```

No composer, no build step. The database tables are **created automatically** the first time
the app runs.

---

## Deploy (cPanel) — 5 minutes

1. In cPanel → **MySQL Databases**: create a database + user, grant ALL on the database.
2. Upload the **contents of `public_html/`** into your site's `public_html` (File Manager or FTP).
3. Copy `lib/config.sample.php` → `lib/config.local.php` and fill in the DB name/user/password.
4. Open your domain. Log in: `superadmin` / `imani123` (also seeded: `om`, `md`, `john`, `mary`, `peter`).
5. **Immediately change the passwords** (bottom-left "Password" button, and Admin → Set password for others).

See `DEPLOYMENT.md` for details, updates and troubleshooting.

---

## Local development

Requires PHP 8+ with `pdo_mysql` and any MySQL/MariaDB:

```bash
# create lib/config.local.php pointing at your local DB, then:
php -S 127.0.0.1:3000 -t public_html
```

CI (GitHub Actions) lints every PHP file and smoke-tests the API against MySQL 8 on each push.
