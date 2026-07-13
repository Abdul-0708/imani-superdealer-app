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
function fail($msg, $status = 400) { respond(array('error' => $msg), $status); }

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
    if (!empty($_SESSION['uid'])) {
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
    array('key'=>'admin',      'label'=>'Admin & Permissions'),
  );
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

function parse_weekly_row($row) {
  $idx = row_index($row);
  $acc = trim((string)pick($idx, array('Agent Account','account','accountnumber','acc','agentacc')));
  if ($acc === '') return null;
  return array(
    'acc' => $acc,
    'name' => trim((string)pick($idx, array('Agent Name','name','agent'))),
    'phone' => trim((string)pick($idx, array('Phone','phonenumber','mobile','simu'))),
    'branch' => trim((string)pick($idx, array('Branch','tawi'))),
    'float' => num(pick($idx, array('Float Served','float','floatserved'))),
    'visit' => yesno(pick($idx, array('Agent Visit','visit','odk','agentvisitodk'))),
    'apk' => yesno(pick($idx, array('APK Update','apk','apkupdate'))),
    'activeness' => trim((string)pick($idx, array('Agent Activeness','activeness','active'))),
    'sa' => num(pick($idx, array('SA Commission','sacommission','commission'))),
    'served' => served_status(pick($idx, array('Served Status','served','servedstatus','status'))),
    'location' => trim((string)pick($idx, array('Physical Location','location','shop','sehemu'))),
    'partner' => yesno(pick($idx, array('Partner','partnerserved','ispartner'))) === 'YES' ? 1 : 0,
    'bdo' => trim((string)pick($idx, array('BDO','Officer','Assigned BDO','bdoname','fieldofficer','bdoassigned'))),
  );
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

/* Office-wide actuals for a month. Flag KPIs come from the shared agent_month_kpi
 * ledger (deduplicated across BDOs); float is the sum from service history. */
function month_actuals($month) {
  $st = db()->prepare('SELECT kpi, COUNT(*) n FROM agent_month_kpi WHERE month = ? GROUP BY kpi');
  $st->execute(array($month));
  $k = array('served' => 0, 'visit' => 0, 'apk' => 0, 'active' => 0);
  foreach ($st->fetchAll() as $r) $k[$r['kpi']] = (int)$r['n'];
  $f = db()->prepare('SELECT COALESCE(SUM(float_served),0) f FROM service_history WHERE month = ?');
  $f->execute(array($month));
  $k['float'] = (float)$f->fetch()['f'];
  return $k;
}

/* One BDO's actuals for a month (only KPIs credited to him in the ledger). */
function bdo_actuals($month, $bdo) {
  $st = db()->prepare('SELECT kpi, COUNT(*) n FROM agent_month_kpi WHERE month = ? AND bdo = ? GROUP BY kpi');
  $st->execute(array($month, $bdo));
  $k = array('served' => 0, 'visit' => 0, 'apk' => 0, 'active' => 0);
  foreach ($st->fetchAll() as $r) $k[$r['kpi']] = (int)$r['n'];
  $f = db()->prepare('SELECT COALESCE(SUM(float_served),0) f FROM service_history WHERE month = ? AND bdo = ?');
  $f->execute(array($month, $bdo));
  $k['float'] = (float)$f->fetch()['f'];
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
