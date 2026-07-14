# API Specification

**Base URL:** `https://<host>/api.php?action=<name>` · **Format:** JSON in/out · **Version:** 1.2.0
Machine-readable spec: [openapi.yaml](openapi.yaml) (paths `/actions/<name>` map to `api.php?action=<name>`).

---

## 1. Conventions

- **Transport:** GET for reads (query params), POST with `Content-Type: application/json` for writes.
- **Auth:** PHP session cookie `IMANISESS` (HttpOnly, SameSite=Lax, Secure on HTTPS), set by `login`.
- **Authorization:** every action checks the RBAC matrix server-side (module + View/Edit/Delete).
- **Errors:** non-2xx with `{"error": "<human message>"}`. Codes: 400 validation · 401 not signed in
  · 403 no permission · 404 not found · 409 conflict (KPI already done / duplicate username)
  · 429 locked out · 500 generic (no internals leaked).
- **Months** are strings `YYYY-MM`.

## 2. Action index

| Action | Method | Permission | Purpose |
|---|---|---|---|
| `health` | GET | public | Liveness + PHP version (also triggers schema create/upgrade) |
| `login` | POST | public | Authenticate → session + user + effective perms |
| `logout` | POST | session | Destroy session |
| `me` | GET | session | Current user + effective perms |
| `change_password` | POST | session | Self password change (min 8) |
| `dashboard` | GET | dashboard.v | Month KPIs, attainment vs office targets, achievement |
| `agents` | GET | agents.v **or** mybase.v | Master list; **restricted columns for mybase-only callers**; includes month KPI map |
| `base` | GET | mybase.v (own) / agents.v (any bdo) | BDO working base: levels, KPI state, counts, weighted performance |
| `kpi_mark` | POST | mybase.e | Mark served/visit/apk/active on an agent in the OPEN month (first-wins) |
| `upload_weekly` | POST | upload.e | Ingest browser-parsed Excel rows |
| `targets_get` / `targets_save` | GET / POST | targets.v / targets.e | Office monthly targets (typed) |
| `bdo_targets_get` / `bdo_targets_save` | GET / POST | targets.v / targets.e | Per-BDO targets + KPI weights (Σ=100) |
| `bdo_performance` | GET | targets.v | All BDOs' weighted scores + flags for a month |
| `months` | GET | session | Month list + statuses + current OPEN |
| `month_open` | POST | commission.e | Open next month; current OPEN → AWAITING |
| `month_close` | POST | commission.e | Close month (needs saved calc); carry-forward priority base |
| `commission_upload` | POST | commission.e | Store final-file rows for a month (replaces) |
| `commission_get` | GET | commission.v | Row counts, saved calc, suggested achievement |
| `commission_calc` | POST | commission.e | Compute + save (30/70, release table) |
| `admin_meta` / `admin_perms` / `admin_perms_save` | GET/GET/POST | admin.v / admin.e | Modules+roles / matrix / save matrix |
| `admin_role_add` | POST | admin.e | Create custom role |
| `admin_users` / `admin_user_add` / `admin_user_update` / `admin_user_delete` | GET/POST/POST/POST | admin.v / admin.e / admin.e / admin.d | Member management |
| `admin_audit` | GET | admin.v | Last 100 audit entries |

## 3. Selected contracts

### login
```json
POST api.php?action=login
{"username": "mary", "password": "…"}
→ 200 {"user": {"id":5,"username":"mary","role":"bdo","name":"Mary (BDO)"},
        "perms": {"mybase": {"v":true,"e":true,"d":false}, …}}
→ 401 {"error":"Invalid username or password"}
→ 429 {"error":"Account temporarily locked after too many failed attempts. Try again later."}
```

### kpi_mark — the anti-duplication contract
```json
POST api.php?action=kpi_mark
{"agentId": 12, "kpi": "visit"}          // kpi ∈ served|visit|apk|active
→ 200 {"ok":true,"kpi":"visit","month":"2026-08","by":"mary"}
→ 409 {"error":"Already done by john on 2026-08-03 10:41 - no need to repeat"}
→ 400 {"error":"Unknown KPI"}
```

### agents (restricted vs full)
```json
GET api.php?action=agents&page=1&search=demo
→ 200 {"items":[{"id":3,"acc":"01527100003","name":"Demo Agent 3","phone":"07…",
        "branch":"Njiro","physical_location":"-",
        "kpi":{"served":"mary","visit":"john"}          // who did what this month
        /* +"partner" only when caller has agents.v */}],
       "total":12,"page":1,"pages":1,
       "restricted":true,                                 // true for BDO callers
       "month":"2026-08","monthStatus":"OPEN"}
```

### upload_weekly
```json
POST api.php?action=upload_weekly
{"month":"2026-08","week":"W1","bdo":"",                  // bdo optional (row column wins)
 "rows":[{"Agent Account":"0152…","Agent Name":"…","BDO":"John","Float Served":50000,
          "Agent Visit":"YES","APK Update":"NO","Agent Activeness":"Active",
          "SA Commission":12500000,"Served Status":"SERVED","Physical Location":"Shop 5"}]}
→ 200 {"ok":true,"month":"2026-08","rows":12,"served":8,
       "bdos":["john","mary"],"createdBdos":["zawadi"]}
→ 400 {"error":"Month 2026-07 is closed"}
```

### bdo_targets_save
```json
POST api.php?action=bdo_targets_save
{"month":"2026-08","bdo":"mary","serving":4,"float":100000,"visits":4,"apk":4,"activeness":4,
 "serving_w":30,"float_w":20,"visits_w":20,"apk_w":15,"activeness_w":15}
→ 200 {"ok":true}
→ 400 {"error":"KPI weights must add up to 100% (currently 120%)"}
```

### bdo_performance
```json
GET api.php?action=bdo_performance&month=2026-08
→ 200 {"month":"2026-08","rows":[
        {"bdo":"mary","name":"Mary (BDO)","score":28,"flag":"red",
         "kpis":{"serving":{"actual":2,"target":4,"weight":30,"pct":50}, …}}]}
```

### commission_calc / month_close
```json
POST api.php?action=commission_calc  {"month":"2026-07","achievement":82}
→ 200 {"ok":true,"calc":{"servedCount":8,"total":100000000,"fixedPool":30000000,
       "variablePool":70000000,"achievement":82,"releasePct":0.8,
       "variablePaid":56000000,"final":86000000}}

POST api.php?action=month_close  {"month":"2026-07"}
→ 200 {"ok":true,"closed":"2026-07","carried":8,"next":"2026-08"}
→ 400 {"error":"Upload the final commission file and Calculate & Save before closing 2026-07"}
```

## 4. Versioning & compatibility

The API is consumed only by the bundled SPA (same deploy unit), so no URL versioning is used.
Backwards-incompatible changes require bumping the asset cache-buster (`app.js?v=N`) and a note
in [Release Notes](13-Changelog-Release-Notes.md).
