<?php
/* Shared helpers: JSON I/O, session auth, permissions, normalizers. */

error_reporting(E_ALL & ~E_DEPRECATED);
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
    array('key'=>'upload',     'label'=>'Weekly Upload'),
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
  $r = db()->query("SELECT month FROM months WHERE status='OPEN' ORDER BY month DESC LIMIT 1")->fetch();
  if ($r) return $r['month'];
  $cur = date('Y-m');
  db()->prepare('INSERT IGNORE INTO months (month, status) VALUES (?, "OPEN")')->execute(array($cur));
  return $cur;
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
function month_actuals($month) {
  $snap = setting_get('month_stats_' . $month, '');
  if ($snap !== '') {
    $s = json_decode($snap, true);
    if (is_array($s)) {
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
  /* fallback: ledger + float sums (no performance file uploaded yet) */
  $st = db()->prepare('SELECT kpi, COUNT(*) n FROM agent_month_kpi WHERE month = ? GROUP BY kpi');
  $st->execute(array($month));
  $k = array('served' => 0, 'visit' => 0, 'apk' => 0, 'active' => 0, 'waked' => 0, 'lost' => 0, 'withdraw' => 0, 'fromUpload' => false);
  foreach ($st->fetchAll() as $r) $k[$r['kpi']] = (int)$r['n'];
  $f = db()->prepare('SELECT COALESCE(SUM(float_served),0) f FROM service_history WHERE month = ?');
  $f->execute(array($month));
  $d = db()->prepare('SELECT COALESCE(SUM(float_served),0) f FROM daily_reports WHERE month = ?');
  $d->execute(array($month));
  $k['float'] = (float)$f->fetch()['f'] + (float)$d->fetch()['f'];
  return $k;
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
function office_attainment($month) {
  $a = month_actuals($month);
  $tg = db()->prepare('SELECT * FROM targets WHERE month = ?');
  $tg->execute(array($month));
  $t = $tg->fetch();
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
               'fromUpload' => !empty($a['fromUpload']), 'waked' => $a['waked'], 'lost' => $a['lost']);
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

/* Erase everything ONE BDO filled (live work only - Excel/office data stays).
 * scope 'month' = open month only, 'all' = his entire history. Returns counts. */
function erase_bdo_data($bdo, $scope) {
  $month = open_month();
  $mw = $scope === 'month' ? ' AND month = ?' : '';
  $mv = $scope === 'month' ? array($bdo, $month) : array($bdo);
  $pq = db()->prepare("SELECT proof FROM agent_month_kpi WHERE bdo = ? AND source = 'bdo' AND proof <> ''" . $mw);
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
  $d = db()->prepare("DELETE FROM agent_month_kpi WHERE bdo = ? AND source = 'bdo'" . $mw);
  $d->execute($mv); $n['marks'] = $d->rowCount();
  $d = db()->prepare("DELETE FROM service_history WHERE bdo = ? AND source = 'bdo'" . $mw);
  $d->execute($mv); $n['services'] = $d->rowCount();
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
