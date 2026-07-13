# Deployment Guide — IMANI SUPERDEALER (PHP / cPanel)

For whoever manages the hosting at e.g. `hardwaresupermarkets.co.tz`. The app is plain
**PHP 7.4+/8.x + MySQL** — standard shared hosting is all it needs. No Node, no composer, no build.

---

## 1. One-time setup

1. **Database** — cPanel → *MySQL Databases*:
   - Create a database (e.g. `youruser_imani`), a user, a strong password.
   - Add the user to the database with **ALL PRIVILEGES**.
2. **Files** — upload the **contents** of the repo's `public_html/` folder into the site's
   `public_html/` (File Manager → Upload, or FTP). You can also deploy into a subfolder
   (e.g. `public_html/app/`) — everything is relative.
3. **Config** — in `lib/`, copy `config.sample.php` to **`config.local.php`** and edit:
   ```php
   'db_host' => 'localhost',
   'db_name' => 'youruser_imani',
   'db_user' => 'youruser_imani',
   'db_pass' => 'THE_PASSWORD',
   ```
4. **First load** — open the site. The app creates all tables and seed accounts automatically.
   - Check: `https://yourdomain/api.php?action=health` should return `{"ok":true,...}`.
5. **Log in and secure it**:
   - `superadmin` / `imani123` → change this password immediately (bottom-left **Password**).
   - Admin → set real passwords for `om`, `md` and the BDOs (or delete the demo BDOs).

## 2. HTTPS

Use the host's free SSL (cPanel → *SSL/TLS Status* → AutoSSL / Let's Encrypt). Then force HTTPS
(cPanel → *Domains* → Force HTTPS Redirect, or via .htaccess).

## 3. Updates

Re-upload the changed files (`app.js`, `styles.css`, `api.php`, `lib/*.php`) — **never overwrite
`lib/config.local.php`**. Schema changes apply automatically on next load.

## 4. Backups

cPanel → *Backup* → download the MySQL database regularly (or schedule with the host's backup
tool). The database is the only state — files are just code.

## 5. Requirements & troubleshooting

- PHP 7.4+ (8.x recommended) with `pdo_mysql` — enabled by default on virtually all cPanel hosts
  (check *Select PHP Version* if needed).
- **"Database error. Check config.local.php..."** → wrong DB credentials, or the DB user isn't
  added to the database.
- **Blank page** → check *Errors* in cPanel; usually a missing `config.local.php`.
- **Login loops / instantly signed out** → the host must allow PHP sessions (default on).
- Excel parsing happens **in the browser** (SheetJS from a CDN) — the server never receives the
  file, only JSON rows; large files are fine.

## 6. Email

The app does not send email (password resets are done by the Super Admin in the Admin panel).
Domain mailboxes (MX / Google Workspace / Zoho) can be set up independently — nothing in the app
depends on them.
