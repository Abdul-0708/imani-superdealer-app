# UI/UX Specification

**System:** IMANI SUPERDEALER · **Version:** 1.2.0 · **Theme:** "Fire" (owner-requested)

---

## 1. Design language

Dark-ember interface with fire-orange → yellow gradients ("dark fire oranges mixed with
mesmerising yellow fire" — owner brief). One consistent icon set (inline stroke SVG, no emoji).
Sidebar navigation with glow effects. Mobile-first responsiveness (BDOs work on phones).

### 1.1 Design tokens (`styles.css :root`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#120a04` | Page background (plus radial fire glows) |
| `--panel` / `--panel2` | `#20120a` / `#2b180c` | Card/panel gradient stops |
| `--line` | `#43260f` | Borders, dividers |
| `--ink` | `#ffeeda` | Primary text |
| `--muted` | `#d8a878` | Secondary text |
| `--fire` / `--fire2` | `#ff7300` / `#ff9a1f` | Accents, icons |
| `--gold` / `--yellow` | `#ffc93c` / `#ffd84a` | Highlights, OPEN month, mid flags |
| `--grad` | 135° `#ff5400 → #ff9a1f → #ffd84a` | Primary buttons, active nav, avatars |
| `--ok` / `--bad` | `#8fd14f` / `#ff6b5e` | Success/green flags · errors/red flags |
| `--glow` / `--glow-strong` | orange box-shadows | Hover/active emphasis |
| Radius `--r` | 14px | Panels, cards |
| Motion `--ease` | cubic-bezier(.2,.7,.2,1), 120–600ms | All transitions; `prefers-reduced-motion` disables |

### 1.2 Typography & numbers

System font stack; base 15px/1.5. Page titles 22px/800. Data cells use `tabular-nums` so figures
align. Card KPI numerals 26px/800.

## 2. Layout

- **Desktop (>860px):** fixed 240px left **sidebar** (brand mark with flame pulse, nav items,
  user card + Password/Sign out at bottom) + max-1120px main column.
- **Mobile (≤860px):** sidebar collapses into a wrapping top bar; nav items become pills.
- Nav item states: hover = soft gradient + `translateX(4px)` + gold text; active = full fire
  gradient, dark text, glowing left bar indicator.

## 3. Screens

| Screen | Module | Content |
|---|---|---|
| Login | — | Centered card, flame brandmark, radial glow backdrop, inline error line |
| Dashboard | dashboard | Month picker · 6 KPI cards (icon chips) · Target Attainment panel: 5 fire progress bars with actual/target and % |
| My Agent Base | mybase | Status pill (OPEN/…) · counts cards (Priority/New/Total/My Served) · **My Performance** panel (weighted score pill + per-KPI weighted bars) · agents table with **KPI chips** |
| All Agents / Agents | agents | Search + pagination (50) · restricted columns for BDOs (Account, Name, Phone, Branch, Physical Location, KPIs); + Partner for OM/MD · same KPI chips |
| Weekly Upload | upload | Month/Week + file input (browser-parsed) · demo loader · result summary incl. auto-created BDOs |
| Monthly Targets | targets | Office targets form (5 typed fields) · **BDO Targets & KPI Weights** (BDO select, target+weight per KPI, live weight-sum turning green at 100) · **BDO Performance** ranked table (flag pills + per-KPI mini-pills) · saved office targets table |
| Commission & Months | commission | Month strip (status-coloured chips: OPEN gold / AWAITING orange / CLOSED dim) · Open-next-month · commission file upload + demo · achievement input (suggested from targets) · calc result cards · danger Close-month button |
| Admin | admin | Members (add form; role dropdown per user; Set password / Disable / Delete) · **Access Control** (role chips → per-module rows with View/Edit/Delete toggle switches; + New role) · Recent Activity table |

## 4. Key components

- **KPI chip** (`.kchip`): the core field-work control.
  - `todo` — outlined, fire text; hover fills with gradient; click marks the KPI.
  - `done` — green tint, shows `✓` + the username who did it (tooltip includes it); **locked**.
  - `done mine` — fire gradient version when the current user owns the credit.
  - `off` — dimmed (month not OPEN / no edit permission).
- **Flag pill** (`flagPill`): `NN% — BELOW 50` red · `NN%` amber · `NN% — EXCELLENT` green ·
  `no targets yet` dim.
- **Progress bar** (`.bar > i`): fire gradient; `.red` / `.green` variants for per-KPI attainment.
- **Permission toggle** (`.tgl`): pill switch; ON = fire gradient (Delete ON = red gradient).
- **Toast**: bottom-right, colour-coded left border, auto-dismiss 3.4s, `aria-live="polite"`.
- **Modal**: centered, dark scrim, Esc / backdrop click closes, focus moved to first field.

## 5. UX rules

1. Destructive/irreversible actions (close month, delete member) use a confirm modal; Close month
   is a red **danger** button and disabled until a calculation is saved.
2. Duplicate KPI attempts never fail silently — toast explains *who* already did it and *when*.
3. Weight inputs show a live total; the Save is rejected server-side unless it equals 100.
4. Empty states explain the next step ("The OM uploads the agent performance file").
5. Skeleton shimmer placeholders during loads; no layout jumps.
6. Every icon is decorative SVG (`aria-hidden`); interactive elements are real buttons/inputs;
   `:focus-visible` outlines; reduced-motion respected.
7. Sensitive figures (commission, float) simply never render for BDOs — enforced by the API, not CSS.

## 6. Accessibility checklist

- [x] Keyboard: all actions reachable; Esc closes modals; visible focus rings
- [x] Screen readers: labels on inputs, `role="dialog"`/`aria-modal`, `aria-live` toasts
- [x] Colour is never the only signal (flags include text: "BELOW 50", "EXCELLENT"; chips include ✓ + name)
- [x] Contrast: ink on panels ≥ 4.5:1; muted text reserved for secondary info
- [x] Touch targets ≥ 40px on mobile nav and chips
