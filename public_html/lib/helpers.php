<?php
/* Shared helpers: JSON I/O, session auth, permissions, normalizers. */

error_reporting(E_ALL & ~E_DEPRECATED);
/* The business clock: Dar es Salaam. Identical to the old Africa/Nairobi
 * setting - both are East Africa Time, UTC+3, no daylight saving - so no
 * displayed time moves. Named for the country the business is in. */
date_default_timezone_set('Africa/Dar_es_Salaam');

/* Bumped with every release. The browser compares it against its own copy and
 * warns loudly if only SOME files were uploaded (the classic half-deploy that
 * makes buttons mysteriously stop working). */
define('APP_VERSION', '1.37.0');
ini_set('display_errors', '0');

function respond($data, $status = 200) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data);
  exit;
}
function fail($msg, $status = 400, $extra = null) {
  $out = array('error' => $msg);
  if (is_array($extra)) foreach ($extra as $k => $v) $out[$k] = $v;
  respond($out, $status);
}

function setting_get($name, $default = '') {
  $st = db()->prepare('SELECT value FROM app_settings WHERE name = ?');
  $st->execute(array($name));
  $r = $st->fetch();
  return $r ? $r['value'] : $default;
}
function setting_set($name, $value) {
  db()->prepare('INSERT INTO app_settings (name, value) VALUES (?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)')
      ->execute(array($name, $value));
}

function body() {
  static $b = null;
  if ($b === null) {
    $raw = file_get_contents('php://input');
    $b = $raw ? json_decode($raw, true) : array();
    if (!is_array($b)) $b = array();
  }
  return $b;
}
function bval($key, $default = '') { $b = body(); return isset($b[$key]) ? $b[$key] : $default; }

/* ---------- session / auth ---------- */

function start_session() {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  session_name('IMANISESS');
  session_set_cookie_params(array(
    'lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
  ));
  session_start();
}

function current_user() {
  static $u = false;
  if ($u === false) {
    start_session();
    $u = null;
    /* absolute session lifetime: 12h after sign-in the session dies, even if
     * the phone stayed unlocked all day. Stolen/forgotten sessions expire. */
    if (!empty($_SESSION['uid']) && !empty($_SESSION['auth_at']) &&
        time() - (int)$_SESSION['auth_at'] > 43200) {
      $_SESSION = array();
      session_destroy();
    } elseif (!empty($_SESSION['uid'])) {
      $st = db()->prepare('SELECT * FROM users WHERE id = ? AND active = 1');
      $st->execute(array($_SESSION['uid']));
      $u = $st->fetch() ?: null;
    }
  }
  return $u;
}

function require_auth() {
  $u = current_user();
  if (!$u) fail('Not signed in', 401);
  return $u;
}

/* ---------- permissions ---------- */

function modules_meta() {
  return array(
    array('key'=>'dashboard',  'label'=>'Dashboard'),
    array('key'=>'agents',     'label'=>'Agents'),
    array('key'=>'mybase',     'label'=>'My Agent Base (BDO)'),
    array('key'=>'upload',     'label'=>'Database Upload'),
    array('key'=>'targets',    'label'=>'Monthly Targets'),
    array('key'=>'commission', 'label'=>'Commission & Months'),
    array('key'=>'reports',    'label'=>'Reports & Ranks'),
    array('key'=>'admin',      'label'=>'Admin & Permissions'),
  );
}

/* Working days: '1,2,...,7' (Mon=1..Sun=7). Per-user override falls back to global. */
function working_days_for($user) {
  $own = isset($user['working_days']) ? trim((string)$user['working_days']) : '';
  $csv = $own !== '' ? $own : setting_get('working_days', '1,2,3,4,5,6');
  $out = array();
  foreach (explode(',', $csv) as $d) { $d = (int)$d; if ($d >= 1 && $d <= 7) $out[$d] = true; }
  return $out;
}

function perms_for_role($role) {
  $out = array();
  foreach (modules_meta() as $m) $out[$m['key']] = array('v'=>false,'e'=>false,'d'=>false);
  if ($role === 'superadmin') {
    foreach ($out as $k => $x) $out[$k] = array('v'=>true,'e'=>true,'d'=>true);
    return $out;
  }
  $st = db()->prepare('SELECT module, v, e, d FROM permissions WHERE role = ?');
  $st->execute(array($role));
  foreach ($st->fetchAll() as $r) {
    if (isset($out[$r['module']])) $out[$r['module']] = array('v'=>(bool)$r['v'],'e'=>(bool)$r['e'],'d'=>(bool)$r['d']);
  }
  return $out;
}

/*
 * FIELD user = someone who marks KPIs on his own agent base (a BDO).
 * MANAGER = OM / super-admin level, the only ones who may overturn a colleague's
 * work or reach the Data Manager erasers.
 *
 * These are deliberately NOT plain permission checks: if an admin ever ticks
 * "agents: Edit" for the BDO role in Access Control, a BDO must still NOT gain
 * management override powers. Being a field user always wins.
 */
/* Roles that run the office. Their standing NEVER depends on which permission
 * boxes happen to be ticked - an OM who was also given a "my base" tick is
 * still the OM, and must not be demoted into a field user (which would hide
 * the Flags panel, pin him to one station and strip commission figures). */
function is_office_role($user) {
  return in_array($user['role'], array('superadmin', 'md', 'om'), true);
}
function is_field_user($user) {
  if (is_office_role($user)) return false;
  return can($user, 'mybase', 'e');
}
function is_manager($user) {
  if (is_office_role($user)) return true;
  if (is_field_user($user)) return false;   /* a BDO never gains office powers */
  return can($user, 'agents', 'e');         /* team leaders: by permission */
}
function require_manager($user) {
  if (!is_manager($user)) fail('Management access only', 403);
}

function can($user, $module, $level) {
  if ($user['role'] === 'superadmin') return true;
  $p = perms_for_role($user['role']);
  return !empty($p[$module][$level]);
}
function require_perm($user, $module, $level) {
  if (!can($user, $module, $level)) fail('Your role does not have ' . $level . ' access to ' . $module, 403);
}

function audit($userId, $action, $detail = '') {
  db()->prepare('INSERT INTO audit (user_id, action, detail) VALUES (?,?,?)')
      ->execute(array($userId, $action, mb_substr($detail, 0, 500)));
}

/* ---------- months ---------- */

function next_month($ym) {
  $y = (int)substr($ym, 0, 4); $m = (int)substr($ym, 5, 2);
  $m++; if ($m > 12) { $m = 1; $y++; }
  return sprintf('%04d-%02d', $y, $m);
}
function open_month() {
  maybe_roll_month();
  $r = db()->query("SELECT month FROM months WHERE status='OPEN' ORDER BY month DESC LIMIT 1")->fetch();
  if ($r) return $r['month'];
  $cur = date('Y-m');
  db()->prepare('INSERT IGNORE INTO months (month, status) VALUES (?, "OPEN")')->execute(array($cur));
  return $cur;
}

/*
 * THE MONTH TURNS ITSELF OVER (EAT).
 *
 * On the 1st the team must start clean: every agent reads 0 on every KPI. That
 * falls out for free because the ledger, the history and the flags are all
 * keyed by month - what was missing was anybody OPENING the new month, so the
 * app sat on the old one until the OM remembered to press a button.
 *
 * COUNTERS reset; a BDO's ROSTER and an agent's STATE do not. His agents are
 * carried by ensure_base_carry() and activeness is carried below, so he opens
 * the 1st with his own round in front of him at zero KPIs.
 *
 * The month that just ended goes to AWAITING, not CLOSED: its final performance
 * file has not arrived yet, and the OM still has to upload it and settle the
 * final achievement and commission. AWAITING months stay fully uploadable.
 *
 * There is no cron on shared hosting, so this runs lazily on the first request
 * of the new month. A one-shot marker row claims the work, so of two requests
 * arriving together only one performs the roll.
 */
/*
 * RECOVER FIELD WORK THAT WAS FILED UNDER THE WRONG MONTH.
 *
 * Before the month rolled itself over, the app stayed on whatever month was
 * last opened by hand. So a BDO working on the 1st and 2nd had every tap
 * stamped with the OLD month, because kpi_mark files against open_month(). His
 * live feed still showed the taps (that reads by DATE), but his served count,
 * his base and the agent list all read empty - to him his work had vanished.
 *
 * Nothing was ever deleted. The `at` timestamp records the moment the tap
 * actually happened, so it - not the month column - is the truth, and the rows
 * are re-filed into the month their own timestamp names. A tap can only ever be
 * filed against the open month, so a mismatch is by definition a misfile and
 * never a deliberate back-date.
 *
 * Collisions are skipped rather than forced: if the agent already holds that
 * KPI in the correct month, the older credit stands and the stray row is left
 * alone for the OM to see.
 */
function repair_misfiled_marks($cur) {
  $lock = db()->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES (?, ?)');
  $lock->execute(array('repairmarks_' . $cur, date('Y-m-d H:i:s')));
  if ($lock->rowCount() !== 1) return;

  $moved = 0; $clashed = 0;
  $q = db()->query("SELECT id, DATE_FORMAT(at, '%Y-%m') AS real_month
                    FROM agent_month_kpi
                    WHERE source = 'bdo' AND at IS NOT NULL
                      AND month <> DATE_FORMAT(at, '%Y-%m')");
  $upd = db()->prepare('UPDATE agent_month_kpi SET month = ? WHERE id = ?');
  foreach ($q->fetchAll() as $r) {
    try { $upd->execute(array($r['real_month'], (int)$r['id'])); $moved++; }
    catch (Exception $e) { $clashed++; }      /* already credited that month */
  }

  /* the serve rows and the typed reports carry the same stamp problem */
  $s = db()->prepare("UPDATE service_history SET month = SUBSTRING(date, 1, 7)
                      WHERE source = 'bdo' AND date <> '' AND month <> SUBSTRING(date, 1, 7)");
  $s->execute();
  $svc = $s->rowCount();
  $d = db()->prepare("UPDATE daily_reports SET month = SUBSTRING(report_date, 1, 7)
                      WHERE report_date <> '' AND month <> SUBSTRING(report_date, 1, 7)");
  $d->execute();
  $rep = $d->rowCount();

  /* put every recovered agent back into the BDO base of the right month */
  db()->exec("INSERT IGNORE INTO base (month, bdo, agent_id, kind)
              SELECT month, bdo, agent_id, 'uploaded' FROM agent_month_kpi
              WHERE source = 'bdo' AND kpi = 'served' AND bdo NOT IN ('partners','unassigned')");

  $note = date('Y-m-d H:i') . ' - re-filed by timestamp: ' . $moved . ' KPI marks, ' . $svc .
          ' serve rows, ' . $rep . ' daily reports' .
          ($clashed ? ', ' . $clashed . ' skipped (already credited that month)' : '');
  setting_set('lastrepair_note', $note);
  if ($moved || $svc || $rep || $clashed) {
    db()->prepare('INSERT INTO audit (user_id, action, detail) VALUES (NULL, "repair_misfiled", ?)')
        ->execute(array($note));
  }
}

/*
 * A BDO'S ROSTER FOLLOWS HIM INTO THE NEW MONTH.
 *
 * KPI counters reset - his agents do not. The men he served last month are the
 * men he works first this month, so they are seeded into the new month's base
 * as PRIORITY. Without this he opened the 1st looking at an empty list with
 * nothing to work from and had to rediscover his own round on the Agents tab.
 *
 * Deliberately separate from the rollover and guarded by its own marker: a
 * month that already rolled under an older build still gets its carry the next
 * time anybody opens the app, instead of staying empty until the month ends.
 */
function ensure_base_carry($cur) {
  $lock = db()->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES (?, ?)');
  $lock->execute(array('basecarry_' . $cur, date('Y-m-d H:i:s')));
  if ($lock->rowCount() !== 1) return;          /* already carried for this month */

  $y = (int)substr($cur, 0, 4); $m = (int)substr($cur, 5, 2);
  $m--; if ($m < 1) { $m = 12; $y--; }
  $prev = sprintf('%04d-%02d', $y, $m);

  /* whoever he served last month becomes his priority round this month */
  $ins = db()->prepare("INSERT IGNORE INTO base (month, bdo, agent_id, kind)
                        SELECT ?, k.bdo, k.agent_id, 'priority'
                        FROM agent_month_kpi k
                        WHERE k.month = ? AND k.kpi = 'served'
                          AND k.bdo NOT IN ('partners','unassigned')");
  $ins->execute(array($cur, $prev));
  $n = $ins->rowCount();
  db()->prepare('INSERT INTO audit (user_id, action, detail) VALUES (NULL, "base_carry", ?)')
      ->execute(array($prev . ' -> ' . $cur . ': ' . $n . ' agents carried into their BDO base'));
}

function maybe_roll_month() {
  static $checked = false;
  if ($checked) return;
  $checked = true;

  $cur = date('Y-m');
  $r = db()->query("SELECT month FROM months WHERE status='OPEN' ORDER BY month DESC LIMIT 1")->fetch();
  /* Already on this month - but it may have been opened by an older build that
   * did not carry the bases, so make sure that has happened before leaving. */
  if (!$r || $r['month'] >= $cur) { repair_misfiled_marks($cur); ensure_base_carry($cur); return; }
  $ended = $r['month'];

  $lock = db()->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES (?, ?)');
  $lock->execute(array('rolled_' . $cur, date('Y-m-d H:i:s')));
  if ($lock->rowCount() !== 1) return;         /* another request is doing it */

  /* everything still open and older than today becomes AWAITING its final file */
  db()->prepare('UPDATE months SET status = "AWAITING" WHERE status = "OPEN" AND month < ?')->execute(array($cur));
  db()->prepare('INSERT INTO months (month, status) VALUES (?, "OPEN")
                 ON DUPLICATE KEY UPDATE status = "OPEN"')->execute(array($cur));

  /*
   * ACTIVENESS CARRIES ACROSS THE BOUNDARY.
   *
   * KPI counters reset - that is the point of a new month - but an agent's
   * STATE is not a counter. Someone woken in the month that just ended (by a
   * BDO's tap or by the office file) is an ACTIVE agent on the 1st; only the
   * ones who finished the month still dormant belong on the "wake up" list.
   * Without this the stamp still pointed at the old month, so every agent read
   * blank and the whole base turned up as needing a wake.
   *
   * The status the agent ENDED on becomes both his standing now and his
   * "previous month" reading, which is what the Inactive panel and the
   * waked/slept deviation compare against. The first performance file of the
   * new month overwrites all three from its own current/previous columns and
   * takes over as the base for the rest of the month.
   */
  db()->prepare('UPDATE agents SET act_prev = act_current, act_month = ?
                 WHERE act_current <> "" AND act_month <> ?')->execute(array($cur, $cur));

  repair_misfiled_marks($cur);
  month_start_messages($ended, $cur);
  ensure_base_carry($cur);

  /* user_id NULL: nobody pressed anything, the calendar did it */
  db()->prepare('INSERT INTO audit (user_id, action, detail) VALUES (NULL, "month_auto_roll", ?)')
      ->execute(array($ended . ' -> AWAITING, ' . $cur . ' opened automatically'));
}

/*
 * First morning of the month: tell every BDO which HIGH EARNERS he served last
 * month so he re-serves them in week one. Only lists A-D - the money bands the
 * OM asked to chase - and names a few accounts before falling back to counts,
 * because a message is 500 characters and a wall of numbers is not read.
 */
function month_start_messages($ended, $cur) {
  $bands = he_band_map();
  if (!$bands) return;                          /* no high-earner list uploaded */

  $q = db()->prepare("SELECT k.bdo, a.acc, a.name
                      FROM agent_month_kpi k JOIN agents a ON a.id = k.agent_id
                      WHERE k.month = ? AND k.kpi = 'served'
                        AND k.bdo NOT IN ('partners','unassigned')
                      ORDER BY k.bdo, a.name");
  $q->execute(array($ended));

  $perBdo = array();
  foreach ($q->fetchAll() as $row) {
    $b = isset($bands[$row['acc']]) ? $bands[$row['acc']] : 'F';
    if (!in_array($b, array('A', 'B', 'C', 'D'), true)) continue;
    if (!isset($perBdo[$row['bdo']])) $perBdo[$row['bdo']] = array('A' => array(), 'B' => array(), 'C' => array(), 'D' => array());
    $perBdo[$row['bdo']][$b][] = $row['acc'];
  }
  if (!$perBdo) return;

  $ins = db()->prepare('INSERT INTO messages (from_user, to_user, kind, body) VALUES ("system", ?, "", ?)');
  foreach ($perBdo as $bdo => $byBand) {
    $total = 0; $parts = array();
    foreach (array('A', 'B', 'C', 'D') as $b) {
      $n = count($byBand[$b]);
      if (!$n) continue;
      $total += $n;
      $show = array_slice($byBand[$b], 0, 3);
      $parts[] = 'LIST ' . $b . ': ' . $n . ' (' . implode(', ', $show) . ($n > count($show) ? ', +' . ($n - count($show)) . ' more' : '') . ')';
    }
    if (!$total) continue;
    $body = 'NEW MONTH ' . $cur . '. Last month you served ' . $total . ' high earners on lists A-D. '
          . 'Serve them again in the FIRST WEEK so they are not lost: ' . implode(' | ', $parts)
          . '. Open My Agent Base to work through them.';
    $ins->execute(array($bdo, mb_substr($body, 0, 500)));
  }
}
function month_status($ym) {
  $st = db()->prepare('SELECT status FROM months WHERE month = ?');
  $st->execute(array($ym));
  $r = $st->fetch();
  return $r ? $r['status'] : null;
}

/* ---------- spreadsheet row normalizers (rows come as JSON from the browser) ---------- */

function norm_key($k) { return preg_replace('/[^a-z0-9]/', '', strtolower((string)$k)); }
function row_index($row) {
  $idx = array();
  foreach ($row as $k => $v) $idx[norm_key($k)] = $v;
  return $idx;
}
function pick($idx, $names) {
  foreach ($names as $n) {
    $k = norm_key($n);
    if (isset($idx[$k]) && trim((string)$idx[$k]) !== '') return $idx[$k];
  }
  return '';
}
function yesno($v) {
  $s = strtolower(trim((string)$v));
  return in_array($s, array('yes','y','true','1','served'), true) ? 'YES' : 'NO';
}
function served_status($v) {
  $s = preg_replace('/[^a-z]/', '', strtolower((string)$v));
  return in_array($s, array('served','yes','active','done'), true) ? 'SERVED' : 'NOT_SERVED';
}
function num($v) {
  $n = preg_replace('/[^0-9.\-]/', '', (string)$v);
  return $n === '' ? 0 : (float)$n;
}

/*
 * Month-suffixed columns: performance files carry one column per month
 * (e.g. "Activeness_status_May" / "Activeness_status_July", "APK June" / "APK July").
 * Pick the CURRENT upload month's column when present; otherwise the right-most
 * non-empty candidate (the latest month in the file).
 */
function pick_month_col($row, $month, $needle) {
  $monthNames = array('','january','february','march','april','may','june','july','august','september','october','november','december');
  $m = (int)substr((string)$month, 5, 2);
  $wantFull = $m >= 1 && $m <= 12 ? $monthNames[$m] : '';
  $want3 = substr($wantFull, 0, 3);
  $candidates = array(); $preferred = '';
  foreach ($row as $k => $v) {
    $nk = norm_key($k);
    if (strpos($nk, $needle) === false) continue;
    if (trim((string)$v) === '') continue;
    $candidates[] = $v;
    if ($wantFull !== '' && (strpos($nk, $wantFull) !== false || strpos($nk, $want3) !== false)) $preferred = $v;
  }
  if ($preferred !== '') return $preferred;
  return count($candidates) ? $candidates[count($candidates) - 1] : '';
}

function parse_weekly_row($row, $month = '') {
  $idx = row_index($row);
  $acc = trim((string)pick($idx, array('AGENT ACC','Agent Account','account','accountnumber','acc','agentacc')));
  if ($acc === '') return null;
  $served = served_status(pick($idx, array('Served Status','Serving Status','served','servedstatus','servingstatus','status')));
  /* " Servicing " is the float column; it only counts when the agent is SERVED. */
  $float = num(pick($idx, array('Servicing','Float Served','float','floatserved','serving')));
  if ($served !== 'SERVED') $float = 0;
  return array(
    'acc' => $acc,
    'name' => trim((string)pick($idx, array('AgentName','Agent Name','name'))),
    'phone' => trim((string)pick($idx, array('Phone','phonenumber','mobile','simu'))),
    'branch' => trim((string)pick($idx, array('BranchName','Branch','tawi'))),
    'float' => $float,
    'visit' => yesno(pick($idx, array('Agent visit','Agent Visit','Agent Visits','visit','odk','agentvisitodk'))),
    'apk_raw' => (function () use ($row, $month) { $c = pick_kpi_cols($row, $month, 'apk'); return $c['cur']; })(),
    'apk_prev_raw' => (function () use ($row, $month) { $c = pick_kpi_cols($row, $month, 'apk'); return $c['prev']; })(),
    'activeness' => (function () use ($row, $month) { $c = pick_kpi_cols($row, $month, 'activ'); return $c['cur']; })(),
    'activeness_prev' => (function () use ($row, $month) { $c = pick_kpi_cols($row, $month, 'activ'); return $c['prev']; })(),
    'sa' => num(pick($idx, array('SA Commission','sacommission','commission'))),
    'served' => $served,
    'withdraw' => num(pick($idx, array('Withdraw Volume','withdrawvolume'))),
    'location' => trim((string)pick($idx, array('Physical Location','location','shop','sehemu'))),
    'partner' => yesno(pick($idx, array('Partner','partnerserved','ispartner'))) === 'YES' ? 1 : 0,
    'bdo' => trim((string)pick($idx, array('BDO','Officer','Assigned BDO','bdoname','fieldofficer','bdoassigned'))),
    /* The region IS the SA station - read it from that column only. A stray
     * "Region"/"Mkoa" column in some files carried a different geography and
     * quietly overrode the station whenever SA STATION was blank. */
    'station' => strtoupper(trim((string)pick($idx, array('SA STATION','SA Station','Station','StationName','kituo')))),
  );
}

/*
 * APK columns hold a version number (e.g. 1.8, 2.0), not YES/NO. An agent
 * counts as "APK updated" ONLY when he runs at least the REQUIRED version the
 * OM has set (setting apk_required_version, e.g. 2.0 - older 1.8/1.6 do not
 * count). Plain YES/NO text files still work.
 */
function apk_is_yes($raw, $requiredVersion) {
  $s = strtolower(trim((string)$raw));
  if ($s === '') return false;
  if (in_array($s, array('yes','y','true','updated'), true)) return true;
  if (in_array($s, array('no','n','false'), true)) return false;
  $v = num($raw);
  $req = (float)$requiredVersion;
  return $req > 0 && $v > 0 && ($v + 0.0001) >= $req;
}

/* Normalize an activeness cell: ' Active ' -> ACTIVE, 'Inactive' -> INACTIVE. */
function act_norm($s) {
  $s = strtolower(trim((string)$s));
  if ($s === '') return '';
  if (strpos($s, 'inact') === 0 || strpos($s, 'dormant') === 0) return 'INACTIVE';
  if (strpos($s, 'activ') === 0) return 'ACTIVE';
  return '';
}

/* Detect which calendar month (1-12) a header refers to, else 0. */
function month_in_header($nk) {
  $names = array('january','february','march','april','may','june','july','august','september','october','november','december');
  for ($i = 0; $i < 12; $i++) { if (strpos($nk, $names[$i]) !== false) return $i + 1; }
  for ($i = 0; $i < 12; $i++) { if (strpos($nk, substr($names[$i], 0, 3)) !== false) return $i + 1; }
  return 0;
}

/*
 * For KPIs that carry one month-suffixed column per period (Activeness_status_May
 * / _July, APK June / July), return the CURRENT and PREVIOUS values robustly:
 * order the matching columns by the month named in their header; current = the
 * column matching the working month, else the latest; previous = the one before.
 * This is correct even when the working month has no column in the file.
 */
function pick_kpi_cols($row, $month, $needle) {
  $cols = array();
  foreach ($row as $k => $v) {
    $nk = norm_key($k);
    if (strpos($nk, $needle) === false) continue;
    $cols[] = array('m' => month_in_header($nk), 'v' => trim((string)$v));
  }
  if (!count($cols)) return array('cur' => '', 'prev' => '');
  usort($cols, function ($a, $b) { return $a['m'] - $b['m']; });
  $curNum = (int)substr((string)$month, 5, 2);
  $curIdx = -1;
  for ($i = 0; $i < count($cols); $i++) { if ($cols[$i]['m'] === $curNum) $curIdx = $i; }
  if ($curIdx < 0) $curIdx = count($cols) - 1;
  return array('cur' => $cols[$curIdx]['v'], 'prev' => $curIdx > 0 ? $cols[$curIdx - 1]['v'] : '');
}

/* The PREVIOUS activeness column: right-most activeness-like column that is
 * NOT the current month's (e.g. Activeness_status_May when uploading July). */
function pick_month_col_prev($row, $month, $needle) {
  $monthNames = array('','january','february','march','april','may','june','july','august','september','october','november','december');
  $m = (int)substr((string)$month, 5, 2);
  $wantFull = $m >= 1 && $m <= 12 ? $monthNames[$m] : '';
  $want3 = substr($wantFull, 0, 3);
  $prev = '';
  foreach ($row as $k => $v) {
    $nk = norm_key($k);
    if (strpos($nk, $needle) === false) continue;
    if (trim((string)$v) === '') continue;
    if ($wantFull !== '' && (strpos($nk, $wantFull) !== false || strpos($nk, $want3) !== false)) continue; // current month
    $prev = $v; // keep the right-most earlier column
  }
  return $prev;
}

function parse_commission_row($row) {
  $idx = row_index($row);
  $sa = pick($idx, array('SA Commission','sacommission','commission','sacomm'));
  $sv = pick($idx, array('Served Status','served','servedstatus','status'));
  if ($sa === '' && $sv === '') return null;
  return array(
    'acc' => trim((string)pick($idx, array('Agent Account','account','acc'))),
    'name' => trim((string)pick($idx, array('Agent Name','name','agent'))),
    'sa' => num($sa),
    'served' => served_status($sv),
    /* Same rule as the performance file: the SA STATION column IS the region. */
    'station' => strtoupper(trim((string)pick($idx, array('SA STATION','SA Station','Station','StationName','kituo')))),
  );
}

/* ---------- KPI actuals + weighted BDO scoring ---------- */

/*
 * OFFICE actuals for a month: taken straight from the latest uploaded
 * performance Excel (snapshot saved at upload time) - NOT from BDO manual
 * marks, which only count in each BDO's personal score. Activeness is the
 * NET movement: (inactive -> active) MINUS (active -> inactive).
 * Falls back to the ledger for months with no upload yet.
 */
/*
 * The month's office actuals. Pass a station to read THAT region alone - the
 * per-station breakdown is written into the snapshot by every upload, so
 * Target Attainment can answer for Arusha instead of rolling every region
 * together. An unknown station reads as zeros, never as the office total.
 */
function month_actuals($month, $station = '') {
  $snap = setting_get('month_stats_' . $month, '');
  if ($snap !== '') {
    $s = json_decode($snap, true);
    if (is_array($s)) {
      if ($station !== '') {
        $per = isset($s['_stations']) && is_array($s['_stations']) ? $s['_stations'] : array();
        $s = isset($per[$station]) ? $per[$station] : array();
      }
      return array(
        'served' => (int)($s['serving'] ?? 0),
        'float' => (float)($s['float'] ?? 0),
        'visit' => (int)($s['visits'] ?? 0),
        'apk' => (int)($s['apk'] ?? 0),
        'active' => (int)($s['net_active'] ?? 0),
        'waked' => (int)($s['waked'] ?? 0),
        'lost' => (int)($s['lost'] ?? 0),
        'withdraw' => (float)($s['withdraw'] ?? 0),
        'fromUpload' => true,
      );
    }
  }
  /* fallback: ledger + float sums (no performance file uploaded yet). The
   * station filter rides on the AGENT record, which is where the region lives
   * before any snapshot exists. Typed daily reports carry no agent, so they
   * only join the office-wide roll-up. */
  $stFilter = $station !== '' ? ' AND a.station = ?' : '';
  $stVals = $station !== '' ? array($station) : array();
  $st = db()->prepare('SELECT k.kpi, COUNT(*) n FROM agent_month_kpi k JOIN agents a ON a.id = k.agent_id
                       WHERE k.month = ?' . $stFilter . ' GROUP BY k.kpi');
  $st->execute(array_merge(array($month), $stVals));
  $k = array('served' => 0, 'visit' => 0, 'apk' => 0, 'active' => 0, 'waked' => 0, 'lost' => 0, 'withdraw' => 0, 'fromUpload' => false);
  foreach ($st->fetchAll() as $r) $k[$r['kpi']] = (int)$r['n'];
  $f = db()->prepare('SELECT COALESCE(SUM(s.float_served),0) f FROM service_history s JOIN agents a ON a.id = s.agent_id
                      WHERE s.month = ?' . $stFilter);
  $f->execute(array_merge(array($month), $stVals));
  $k['float'] = (float)$f->fetch()['f'];
  if ($station === '') {
    $d = db()->prepare('SELECT COALESCE(SUM(float_served),0) f FROM daily_reports WHERE month = ?');
    $d->execute(array($month));
    $k['float'] += (float)$d->fetch()['f'];
  }
  return $k;
}

/*
 * Where a KPI mark came from, in a shape the agent list can display.
 *
 * The field asked for this after a BDO saw an agent go ACTIVE "by partners"
 * and had no way to tell whether a file had really said so. Every mark now
 * carries WHEN it was made and, for file marks, WHICH upload produced it -
 * "partners" is never a person, it is simply a positive row with no BDO named
 * in that file, and the BDO can now see exactly which file that was.
 */
function mark_provenance($r) {
  return array(
    'by'    => $r['bdo'],
    'src'   => $r['source'],
    'at'    => substr((string)$r['at'], 0, 16),
    'file'  => (string)($r['up_label'] ?? ''),
    'fileAt' => substr((string)($r['up_at'] ?? ''), 0, 16),
    'proof' => ($r['proof'] !== '' || $r['proof_note'] !== ''),
    'note'  => $r['proof_note'],
  );
}

/* KPI catalogue for OFFICE targets/weights (6 KPIs incl. withdraw volume). */
function office_kpi_defs() {
  return array(
    'serving' => 'served',
    'float' => 'float',
    'visits' => 'visit',
    'apk' => 'apk',
    'activeness' => 'active',
    'withdraw' => 'withdraw',
  );
}

/*
 * Office attainment + REAL weighted achievement. When the OM has set weights
 * (summing 100) the achievement is the weighted average; otherwise the plain
 * average of KPIs that have targets.
 */
/*
 * Office attainment for a month, optionally for ONE SA station. Targets are
 * stored per (month, station); station '' is the office-wide row. If the OM has
 * not typed targets for the chosen station yet we fall back to the office row
 * and say so via targetsFrom, so a station never silently reads 0% against
 * targets that were never set for it.
 */
function office_attainment($month, $station = '') {
  $a = month_actuals($month, $station);
  $tg = db()->prepare('SELECT * FROM targets WHERE month = ? AND station = ?');
  $tg->execute(array($month, $station));
  $t = $tg->fetch();
  $targetsFrom = $t ? ($station === '' ? 'office' : 'station') : 'none';
  if (!$t && $station !== '') {
    $tg2 = db()->prepare('SELECT * FROM targets WHERE month = ? AND station = ""');
    $tg2->execute(array($month));
    $t = $tg2->fetch();
    if ($t) $targetsFrom = 'office-fallback';
  }
  $att = array(); $wsum = 0; $wacc = 0; $sum = 0; $nn = 0;
  foreach (office_kpi_defs() as $col => $ak) {
    $target = $t ? (float)($t[$col . '_target'] ?? 0) : 0;
    $w = $t ? (int)($t[$col . '_w'] ?? 0) : 0;
    $actual = (float)($a[$ak] ?? 0);
    $pct = $target > 0 ? min(100, (int)round($actual / $target * 100)) : null;
    $att[$col] = array('actual' => $actual, 'target' => $target, 'weight' => $w, 'pct' => $pct);
    if ($pct !== null) { $sum += $pct; $nn++; if ($w > 0) { $wacc += $pct * $w; $wsum += $w; } }
  }
  $achievement = $wsum > 0 ? (int)round($wacc / $wsum) : ($nn ? (int)round($sum / $nn) : null);
  return array('attainment' => $att, 'achievement' => $achievement, 'weighted' => $wsum > 0,
               'fromUpload' => !empty($a['fromUpload']), 'waked' => $a['waked'], 'lost' => $a['lost'],
               'station' => $station, 'targetsFrom' => $targetsFrom);
}

/* One BDO's actuals for a month: ledger credits + float (uploads + his typed daily reports). */
function bdo_actuals($month, $bdo) {
  $st = db()->prepare('SELECT kpi, COUNT(*) n FROM agent_month_kpi WHERE month = ? AND bdo = ? GROUP BY kpi');
  $st->execute(array($month, $bdo));
  $k = array('served' => 0, 'visit' => 0, 'apk' => 0, 'active' => 0);
  foreach ($st->fetchAll() as $r) $k[$r['kpi']] = (int)$r['n'];

  /* Typed DAILY REPORTS feed ONLY float + APK. Serving, visits and activeness
   * count EXCLUSIVELY from per-agent taps on the agent list (kpi_mark ledger),
   * so we always know WHICH agent got it and by WHOM - and the next upload can
   * flag mismatches. */
  $d = db()->prepare('SELECT COALESCE(SUM(float_served),0) f, COALESCE(SUM(apk),0) a
                      FROM daily_reports WHERE month = ? AND bdo = ?');
  $d->execute(array($month, $bdo));
  $dr = $d->fetch();
  $k['apk'] = max($k['apk'], (int)$dr['a']);

  $f = db()->prepare('SELECT COALESCE(SUM(float_served),0) f FROM service_history WHERE month = ? AND bdo = ?');
  $f->execute(array($month, $bdo));
  $k['float'] = (float)$f->fetch()['f'] + (float)$dr['f'];
  return $k;
}

/*
 * The same actuals, but WITHOUT the claims that currently carry a flag.
 *
 * This is not a punishment - the BDO keeps his credits until the OM rules. It
 * exists so he can see, side by side, the score he is showing and the score he
 * would be left with if every flag against him were upheld. The gap between the
 * two is exactly what he stands to lose by ignoring them, which is a far better
 * motivator than a red number he cannot interpret.
 */
function bdo_actuals_unflagged($month, $bdo) {
  $st = db()->prepare("SELECT k.kpi, COUNT(*) n
                       FROM agent_month_kpi k
                       WHERE k.month = ? AND k.bdo = ?
                         AND NOT EXISTS (SELECT 1 FROM flags f
                                         WHERE f.month = k.month AND f.agent_id = k.agent_id
                                           AND f.bdo = k.bdo AND f.kpi = k.kpi)
                       GROUP BY k.kpi");
  $st->execute(array($month, $bdo));
  $k = array('served' => 0, 'visit' => 0, 'apk' => 0, 'active' => 0);
  foreach ($st->fetchAll() as $r) $k[$r['kpi']] = (int)$r['n'];

  /* float and typed APK are not per-agent claims, so nothing there is flagged */
  $d = db()->prepare('SELECT COALESCE(SUM(float_served),0) f, COALESCE(SUM(apk),0) a
                      FROM daily_reports WHERE month = ? AND bdo = ?');
  $d->execute(array($month, $bdo));
  $dr = $d->fetch();
  $k['apk'] = max($k['apk'], (int)$dr['a']);
  $f = db()->prepare('SELECT COALESCE(SUM(float_served),0) f FROM service_history WHERE month = ? AND bdo = ?');
  $f->execute(array($month, $bdo));
  $k['float'] = (float)$f->fetch()['f'] + (float)$dr['f'];
  return $k;
}

/* KPI key mapping: target/weight column prefix => actuals key */
function kpi_defs() {
  return array(
    'serving' => 'served',
    'float' => 'float',
    'visits' => 'visit',
    'apk' => 'apk',
    'activeness' => 'active',
  );
}

/*
 * Weighted score for one BDO: per-KPI attainment (capped 100) weighted by the
 * OM-assigned percentages. KPIs with no weight or no target are skipped and the
 * remaining weights are renormalized. Flag: red < 50, excellent >= 80.
 */
function bdo_score($actuals, $t) {
  $kpis = array(); $wsum = 0; $acc = 0;
  foreach (kpi_defs() as $col => $ak) {
    $target = (float)$t[$col . '_target'];
    $w = (int)$t[$col . '_w'];
    $actual = (float)$actuals[$ak];
    $pct = $target > 0 ? min(100, round($actual / $target * 100)) : null;
    $kpis[$col] = array('actual' => $actual, 'target' => $target, 'weight' => $w, 'pct' => $pct);
    if ($w > 0 && $target > 0) { $acc += $pct * $w; $wsum += $w; }
  }
  $score = $wsum > 0 ? round($acc / $wsum) : null;
  $flag = $score === null ? 'none' : ($score < 50 ? 'red' : ($score >= 80 ? 'excellent' : 'mid'));
  return array('kpis' => $kpis, 'score' => $score, 'flag' => $flag);
}

/* ---------- commission math (30% fixed / 70% variable; release table) ---------- */

function release_for($achievement) {
  $a = (float)$achievement;
  if ($a >= 90) return 1.0;
  if ($a >= 80) return 0.8;
  if ($a >= 70) return 0.6;
  if ($a >= 60) return 0.4;
  if ($a >= 50) return 0.2;
  return 0.0;
}

/* ---------- TOTP 2FA (RFC 6238, authenticator apps) - no dependencies ---------- */

function totp_secret_new() {
  $map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  $s = '';
  for ($i = 0; $i < 32; $i++) $s .= $map[random_int(0, 31)];
  return $s;
}
function b32_decode($s) {
  $map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  $s = strtoupper(preg_replace('/[^A-Za-z2-7]/', '', (string)$s));
  $bits = ''; $out = '';
  for ($i = 0; $i < strlen($s); $i++) {
    $v = strpos($map, $s[$i]);
    if ($v === false) continue;
    $bits .= str_pad(decbin($v), 5, '0', STR_PAD_LEFT);
  }
  for ($i = 0; $i + 8 <= strlen($bits); $i += 8) $out .= chr(bindec(substr($bits, $i, 8)));
  return $out;
}
function totp_code($secret, $slice = 0) {
  $t = pack('N', 0) . pack('N', (int)floor(time() / 30) + $slice);
  $h = hash_hmac('sha1', $t, b32_decode($secret), true);
  $o = ord($h[19]) & 0xf;
  $c = ((ord($h[$o]) & 0x7f) << 24 | ord($h[$o + 1]) << 16 | ord($h[$o + 2]) << 8 | ord($h[$o + 3])) % 1000000;
  return str_pad((string)$c, 6, '0', STR_PAD_LEFT);
}
/* accepts the previous/current/next 30s window (clock drift on phones) */
function totp_verify($secret, $code) {
  $code = preg_replace('/\D/', '', (string)$code);
  if (strlen($code) !== 6 || $secret === '') return false;
  for ($s = -1; $s <= 1; $s++) if (hash_equals(totp_code($secret, $s), $code)) return true;
  return false;
}

/* ---------- wake-proof photos (receipt pictures) ---------- */

/* Decodes a data-URL image (jpeg/png/webp), verifies magic bytes, caps size,
 * saves under uploads/proofs with a random name. Returns the filename. */
function save_proof_image($dataUrl) {
  if (!preg_match('#^data:image/(jpeg|png|webp);base64,#', (string)$dataUrl, $m)) {
    fail('Take a photo of the agent\'s transaction receipts to wake him', 400, array('needProof' => true));
  }
  $raw = base64_decode(substr($dataUrl, strpos($dataUrl, ',') + 1), true);
  if ($raw === false || strlen($raw) < 100) fail('Photo unreadable - try again', 400, array('needProof' => true));
  if (strlen($raw) > 4 * 1024 * 1024) fail('Photo too large - try again', 400, array('needProof' => true));
  $magicOk = (substr($raw, 0, 3) === "\xFF\xD8\xFF") ||                  /* jpeg */
             (substr($raw, 0, 8) === "\x89PNG\r\n\x1a\n") ||             /* png  */
             (substr($raw, 0, 4) === 'RIFF' && substr($raw, 8, 4) === 'WEBP');
  if (!$magicOk) fail('That file is not a photo', 400, array('needProof' => true));
  $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
  $dir = dirname(__DIR__) . '/uploads/proofs';
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $name = bin2hex(random_bytes(16)) . '.' . $ext;
  if (file_put_contents($dir . '/' . $name, $raw) === false) fail('Could not store the photo - contact admin', 500);
  return $name;
}

/* Activeness specialist: his ONLY KPI is activeness = waked + recruited. */
function bdo_score_specialist($actuals, $t) {
  $target = (float)$t['activeness_target'];
  $actual = (float)$actuals['active'];
  $pct = $target > 0 ? min(100, round($actual / $target * 100)) : null;
  $flag = $pct === null ? 'none' : ($pct < 50 ? 'red' : ($pct >= 80 ? 'excellent' : 'mid'));
  return array('kpis' => array('activeness' => array('actual' => $actual, 'target' => $target, 'weight' => 100, 'pct' => $pct)),
               'score' => $pct, 'flag' => $flag);
}
function user_specialty($username) {
  $st = db()->prepare('SELECT specialty FROM users WHERE username = ?');
  $st->execute(array($username));
  $r = $st->fetch();
  return $r ? (string)$r['specialty'] : '';
}

/* The activeness specialist never types a daily report - any REAL field action
 * he takes today (wake, won't-return, form, recruit) counts as his report sent
 * for the day. Sent same-day, so it can never be LATE. */
function specialist_touch_report($user) {
  if (!isset($user['specialty']) || $user['specialty'] !== 'activeness') return;
  db()->prepare('INSERT IGNORE INTO daily_reports (bdo, report_date, month, float_served, visited, waked, apk, note)
                 VALUES (?,?,?,0,0,0,0, "auto: activeness field work")')
      ->execute(array($user['username'], date('Y-m-d'), date('Y-m')));
}

function setting_del($name) {
  db()->prepare('DELETE FROM app_settings WHERE name = ?')->execute(array($name));
}

/* Erase EVERYTHING attributed to one BDO: his live taps AND the credits the
 * uploaded file gave him (served/visit/apk/active by him, his float rows) AND
 * his saved base. His performance reads zero after this; the office month
 * totals (dashboard snapshot) are separate and stay until uploads are erased.
 * scope 'month' = open month only, 'all' = his entire history. Returns counts. */
function erase_bdo_data($bdo, $scope) {
  $month = open_month();
  $mw = $scope === 'month' ? ' AND month = ?' : '';
  $mv = $scope === 'month' ? array($bdo, $month) : array($bdo);
  $pq = db()->prepare("SELECT proof FROM agent_month_kpi WHERE bdo = ? AND proof <> ''" . $mw);
  $pq->execute($mv);
  foreach ($pq->fetchAll() as $r) {
    $f = preg_replace('/[^a-z0-9.]/', '', (string)$r['proof']);
    if ($f !== '') @unlink(dirname(__DIR__) . '/uploads/proofs/' . $f);
  }
  db()->prepare('UPDATE agents a JOIN agent_month_kpi k ON k.agent_id = a.id
                 SET a.act_current = "INACTIVE"
                 WHERE k.month = ? AND k.kpi = "active" AND k.bdo = ? AND k.source = "bdo" AND a.act_month = ?')
      ->execute(array($month, $bdo, $month));
  $n = array();
  $d = db()->prepare("DELETE FROM agent_month_kpi WHERE bdo = ?" . $mw);
  $d->execute($mv); $n['marks'] = $d->rowCount();
  $d = db()->prepare("DELETE FROM service_history WHERE bdo = ?" . $mw);
  $d->execute($mv); $n['services'] = $d->rowCount();
  $d = db()->prepare("DELETE FROM base WHERE bdo = ?" . $mw);
  $d->execute($mv); $n['base'] = $d->rowCount();
  $d = db()->prepare("DELETE FROM daily_reports WHERE bdo = ?" . $mw);
  $d->execute($mv); $n['reports'] = $d->rowCount();
  $d = db()->prepare("DELETE FROM float_shortages WHERE bdo = ?" . $mw);
  $d->execute($mv); $n['shortages'] = $d->rowCount();
  if ($scope === 'month') {
    $d = db()->prepare('DELETE FROM wont_return WHERE bdo = ? AND at LIKE ?');
    $d->execute(array($bdo, $month . '%')); $n['wontReturn'] = $d->rowCount();
    $d = db()->prepare('DELETE FROM recruits WHERE bdo = ? AND submitted_at LIKE ?');
    $d->execute(array($bdo, $month . '%')); $n['recruits'] = $d->rowCount();
  } else {
    $d = db()->prepare('DELETE FROM wont_return WHERE bdo = ?');
    $d->execute(array($bdo)); $n['wontReturn'] = $d->rowCount();
    $d = db()->prepare('DELETE FROM recruits WHERE bdo = ?');
    $d->execute(array($bdo)); $n['recruits'] = $d->rowCount();
  }
  return $n;
}

/* ---------- high-earner bands (A..E, else F) ----------
 * The OM's commission list drives priority. Every agent list shows which band
 * an agent belongs to so a BDO instantly sees who is worth the trip. Agents
 * that are not on the list at all read LIST F. */
function he_band_map() {
  static $map = null;
  if ($map !== null) return $map;
  $map = array();
  try {
    foreach (db()->query('SELECT acc, commission FROM high_earners')->fetchAll() as $r) {
      $c = (float)$r['commission'];
      $map[$r['acc']] = $c > 2000000 ? 'A' : ($c > 1000000 ? 'B' : ($c > 500000 ? 'C' : ($c > 100000 ? 'D' : 'E')));
    }
  } catch (Exception $e) { /* table not created yet */ }
  return $map;
}
function he_band($acc) {
  $m = he_band_map();
  return isset($m[$acc]) ? $m[$acc] : 'F';
}

/* Field users (BDOs) work ONE region. The OM may still inspect any station. */
/*
 * WHICH REGION AM I LOOKING AT?
 *
 * A field user is pinned to the home station and can never see another - that
 * is his patch. Management follows `view_station`, a single choice the OM makes
 * once and which then governs EVERY screen: agent list, flags, live board,
 * targets, commission. Before this, the picker on the dashboard changed the
 * dashboard only, so the agent list still showed regions the office had stopped
 * working. Empty means "all stations".
 */
function station_scope($user) {
  if (is_manager($user)) return strtoupper(trim(setting_get('view_station', setting_get('home_station', 'ARUSHA'))));
  return setting_get('home_station', 'ARUSHA');
}
