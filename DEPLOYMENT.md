# IMANI SUPERDEALER — Deployment & Handoff Guide

For the engineer helping with **server, domain, database, and email**. This app is a
Node.js + Express + MySQL web application (single service). It serves both the API and the
front-end from one process on one port.

> TL;DR: provision a small Linux server, install Docker, set `JWT_SECRET` + DB password, run
> `docker compose up -d --build`, point a domain at it, and put HTTPS in front with Caddy/nginx.

---

## 1. What you're deploying

- **One Node process** (Express) that serves the SPA (`/`) and the JSON API (`/api/*`) on a port
  (default **3000**).
- **MySQL 8** database. Schema is created automatically on boot by the migration runner
  (`server/db/migrations/*.sql`) — no manual SQL import needed.
- Stateless app (no local file writes in production) → easy to run behind a load balancer / restart.

**Requirements:** Node.js 18+ (or just Docker), MySQL 8 (or MariaDB 10.5+), a reverse proxy for TLS.
Sizing: a 1 vCPU / 1 GB VPS is plenty to start.

---

## 2. Fastest path — Docker Compose (recommended)

The repo ships a `Dockerfile` and `docker-compose.yml` (app + MySQL).

```bash
git clone https://github.com/Abdul-0708/imani-superdealer-app.git
cd imani-superdealer-app

# generate a strong JWT secret and a DB password
export JWT_SECRET=$(openssl rand -hex 32)
export MYSQL_PASSWORD=$(openssl rand -hex 16)
export MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)

docker compose up -d --build
```

App is now on `http://SERVER_IP:3000`. Data persists in the `db_data` volume. Migrations run
automatically on boot. Update later with `git pull && docker compose up -d --build`.

---

## 3. Manual path — Node + MySQL (no Docker)

```bash
# 1) create the database
mysql -u root -p -e "CREATE DATABASE imani_superdealer CHARACTER SET utf8mb4;
  CREATE USER 'imani'@'%' IDENTIFIED BY 'STRONG_PASSWORD';
  GRANT ALL ON imani_superdealer.* TO 'imani'@'%'; FLUSH PRIVILEGES;"

# 2) configure env
cp .env.example .env      # then edit (see section 4)

# 3) install + run (migrations auto-run on boot)
npm ci --omit=dev
NODE_ENV=production node server/index.js
```

Run it under a process manager: **pm2** (`pm2 start server/index.js --name imani`) or a **systemd**
unit. Set `Restart=always`.

---

## 4. Environment variables (`.env`)

| Var | Required | Notes |
|---|---|---|
| `NODE_ENV` | prod | set to `production` (the app refuses to boot without a real `JWT_SECRET` in prod) |
| `JWT_SECRET` | **yes** | long random string, e.g. `openssl rand -hex 32`. Keep secret; rotating it logs everyone out |
| `PORT` | no | default `3000` |
| `DB_DRIVER` | **yes** | `mysql` for production |
| `MYSQL_HOST` / `MYSQL_PORT` | yes | DB host/port |
| `MYSQL_USER` / `MYSQL_PASSWORD` | yes | DB credentials |
| `MYSQL_DATABASE` | yes | `imani_superdealer` |
| `SEED_*_PASS` | no | initial passwords for the seeded superadmin/om/md accounts (changed on first login anyway) |
| `METRICS_TOKEN` | recommended | if set, `/api/metrics` requires this token (see section 8) |
| `LOG_LEVEL` | no | `info` default (`error|warn|info|debug`) |

Never commit `.env` (it's gitignored).

---

## 5. Domain + HTTPS

The app speaks plain HTTP and expects a reverse proxy to terminate TLS. It already sets
`trust proxy` and HSTS, so just proxy to it.

1. Point an **A record** for your domain (e.g. `app.yourdomain.com`) at the server's public IP.
2. Put **Caddy** (simplest — automatic Let's Encrypt) or **nginx + certbot** in front.

**Caddy example** (`/etc/caddy/Caddyfile`):
```
app.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
}
```

**nginx example** (then run certbot):
```nginx
server {
  server_name app.yourdomain.com;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme; }
}
```

Open firewall ports **80/443** only; keep **3000** and **3306** internal.

---

## 6. Database notes

- **Migrations** are the source of truth (`server/db/migrations/`). They run automatically on boot;
  to run manually: `DB_DRIVER=mysql npm run migrate`.
- Charset is **utf8mb4** (required — agent names/locations can be non-ASCII).
- **Backups:** schedule `mysqldump imani_superdealer` (e.g. nightly cron) and store off-server. With
  Docker, `docker exec` into the `db` service or dump the `db_data` volume.
- The MySQL driver + full flow are proven by `node scripts/validate-mysql.js` (also runs in CI).

---

## 7. Email — please read

**The application does not send email yet.** There is no SMTP/transactional-email integration.
Two separate things people mean by "email":

- **Domain email / mailboxes (MX records)** — standard infrastructure you can set up independently of
  this app (Google Workspace, Zoho Mail, etc.). Nothing in the app depends on it.
- **Transactional email from the app** (e.g. password-reset links, notifications) — **not built.**
  Today, password resets are done in-app by the **Super Admin** (Admin panel → Members → Reset pwd),
  and MFA covers account security. If you want the app to send email, it needs a small addition
  (e.g. `nodemailer` + SMTP creds, or an API like SendGrid/SES) — ask the owner; it's a quick add.

So for now: no SMTP env vars are required to run the app.

---

## 8. Monitoring & health

- **Health probe:** `GET /api/health` → `{ ok, db: "up"/"down", uptime, version }`, returns `503`
  if the DB is down. Point your uptime monitor / load-balancer health check here.
- **Metrics:** `GET /api/metrics` → Prometheus text (request counts, latency histogram, memory).
  Set `METRICS_TOKEN` and scrape with `?token=…` or a `Bearer` header.
- **Logs:** structured JSON per request/error on stdout/stderr — pipe to your log aggregator.

---

## 9. First run & production checklist

- [ ] `JWT_SECRET` set to a strong random value; `NODE_ENV=production`.
- [ ] MySQL reachable; app booted; `GET /api/health` returns `ok:true, db:"up"`.
- [ ] HTTPS working; port 3000/3306 not publicly exposed.
- [ ] Log in as `superadmin` / `om` / `md` (initial password from `SEED_*_PASS`, default `imani123`)
      — each is **forced to set a new password on first login**. Do this immediately.
- [ ] (Recommended) Super Admin enables **MFA** on privileged accounts (Account → Security).
- [ ] `METRICS_TOKEN` set; uptime monitor pointed at `/api/health`.
- [ ] Nightly DB backup scheduled.
- [ ] CI (GitHub Actions) is green on the repo.

---

## 10. Handy commands

```bash
npm test                 # validate + 103 smoke assertions (no DB needed)
npm run migrate          # apply pending DB migrations (DB_DRIVER=mysql)
node scripts/validate-mysql.js   # end-to-end check against a real MySQL
docker compose logs -f app       # tail app logs
docker compose logs -f db        # tail db logs
```

Questions on the app itself (business rules, roles, commission math) are in `README.md`.
