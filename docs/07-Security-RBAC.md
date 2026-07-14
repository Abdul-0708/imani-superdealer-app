# Security & RBAC Design

**System:** IMANI SUPERDEALER · **Version:** 1.2.0

---

## 1. Authentication

| Control | Implementation |
|---|---|
| Password storage | bcrypt via PHP `password_hash`/`password_verify` (cost 10) |
| Session | PHP native session, cookie `IMANISESS`: **HttpOnly**, **SameSite=Lax**, **Secure** when HTTPS; `session_regenerate_id(true)` on login (fixation defence) |
| Brute force | Per-username counter: 6 failures → 15-minute lock (`users.failed`, `users.locked_until`); generic "Invalid username or password" (no user enumeration) |
| Self password change | Requires current password; min 8 chars |
| Admin password set | Super Admin sets/resets member passwords (min 6); resets clear lockout |
| Deactivation | `active=0` blocks login immediately; session checks re-read the user row per request |

## 2. RBAC model

```
role (superadmin | md | om | bdo | custom…) ── permissions(role, module) ── {v, e, d}
modules: dashboard · agents · mybase · upload · targets · commission · admin
```

- **Superadmin bypass:** always full access; cannot be demoted, disabled or deleted via API.
- **Enforcement point:** `require_perm($user, $module, $level)` inside every API action — the UI
  merely mirrors permissions for navigation; hiding is never the security boundary.
- **Custom roles:** rows in `roles`; start with zero permissions until granted.
- **Special rule:** the `agents` action also admits `mybase.v` callers but strips columns
  (see §4) — by design, not a bypass.

### Default matrix (seeded; editable by Super Admin)

| Module | om | md | bdo |
|---|---|---|---|
| dashboard | V E | V | – |
| agents | V E D | V | (restricted via mybase) |
| mybase | – | – | V E |
| upload | V E | – | – |
| targets | V E | V | – |
| commission | V E | V | – |
| admin | – | – | – |

## 3. Threat model (STRIDE) & mitigations

| Threat | Vector | Mitigation |
|---|---|---|
| Spoofing | Credential stuffing | Lockout, bcrypt, generic errors; HTTPS (host AutoSSL) |
| Tampering | SQL injection | 100% PDO prepared statements; no string-built SQL with user input |
| Tampering | Duplicate KPI race | DB unique key `uq_amk` — concurrent marks collapse to one row |
| Repudiation | "I never did that" | `audit` table: who/when/what for logins, uploads, marks, admin & month events |
| Information disclosure | BDO reading commission/float | Server-side column stripping in `agents`; commission/targets actions permission-gated |
| Information disclosure | Config download | `.htaccess` denies `*.local.php` / `*.sample.php`; directory listing off |
| Information disclosure | Error leakage | Generic 500s; `display_errors=0`; details only in server logs |
| DoS | Login floods | Per-username lockout (IP limits: host/Apache level) |
| Elevation | Forged role/permission | Session stores only user id; role & perms re-read from DB per request; superadmin-only admin actions; self-deletion and superadmin-demotion blocked |
| CSRF | Cross-site POST | SameSite=Lax cookie + JSON bodies (no CORS headers issued; cross-origin reads blocked by SOP) |
| XSS | Injected agent/user names | Front-end escapes ALL dynamic text via `esc()` before `innerHTML`; API returns JSON only |

## 4. Data classification & visibility

| Data | Class | superadmin | om | md | bdo |
|---|---|---|---|---|---|
| Agent account/name/phone/branch/physical location | Internal | ✔ | ✔ | ✔ | ✔ |
| Agent KPI status + who did it | Internal | ✔ | ✔ | ✔ | ✔ |
| Partner flag | Sensitive | ✔ | ✔ | ✔ | ✘ (stripped) |
| SA Commission, float amounts, calc results | Confidential | ✔ | ✔ | ✔ | ✘ |
| Targets & weights, BDO scores | Internal | ✔ | ✔ | ✔ | own score only |
| Member list, permission matrix, audit | Restricted | ✔ | ✘ | ✘ | ✘ |
| Password hashes | Secret | never returned by any API |

## 5. Hosting hardening checklist (cPanel)

- [x] `.htaccess`: deny config downloads, `Options -Indexes`, nosniff/frame/referrer headers
- [x] `lib/config.local.php` outside git; unique DB user limited to the one database
- [ ] Force HTTPS redirect (host setting) — operator action
- [ ] Change all seed passwords on first production login — operator action
- [ ] PHP version ≥ 8.0 in cPanel "Select PHP Version" — operator action
- [ ] Nightly DB backup schedule — operator action

## 6. Known gaps / future work

MFA for privileged accounts; CSRF tokens (defence-in-depth beyond SameSite); rate limiting at
application level for non-login endpoints; password-reset email flow (currently admin-mediated,
which is acceptable for this team size); session idle timeout policy.
