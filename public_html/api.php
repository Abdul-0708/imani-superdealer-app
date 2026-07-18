<?php
/* IMANI SUPERDEALER - JSON API (single router). All requests: api.php?action=... */
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/helpers.php';

/* CSRF defence-in-depth: cookies are already SameSite=Lax; on top of that every
 * POST must carry a custom header that no cross-site form or "simple" request
 * can attach. The front-end api() helper always sends it. */
if ($_SERVER['REQUEST_METHOD'] === 'POST' &&
    (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || $_SERVER['HTTP_X_REQUESTED_WITH'] !== 'imani')) {
  fail('Bad request origin', 403);
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
  switch ($action) {

    /* ================= AUTH ================= */

    case 'login': {
      start_session();
      $username = strtolower(trim((string)bval('username')));
      $password = (string)bval('password');
      $st = db()->prepare('SELECT * FROM users WHERE username = ?');
      $st->execute(array($username));
      $u = $st->fetch();
      if ($u && (int)$u['locked_until'] > time()) fail('Account blocked after 5 failed attempts. Contact your admin for a new password.', 429);
      if (!$u || !(int)$u['active'] || !password_verify($password, $u['password_hash'])) {
        if ($u) {
          $f = (int)$u['failed'] + 1;
          /* 5 strikes -> blocked until an admin sets a new password (which clears the lock) */
          $lock = $f >= 5 ? time() + 86400 * 3650 : 0;
          db()->prepare('UPDATE users SET failed = ?, locked_until = ? WHERE id = ?')->execute(array($f, $lock, $u['id']));
          if ($lock) fail('Account blocked after 5 failed attempts. Contact your admin for a new password.', 429);
          fail('Invalid username or password (' . (5 - $f) . ' attempts left)', 401);
        }
        fail('Invalid username or password', 401);
      }
      db()->prepare('UPDATE users SET failed = 0, locked_until = 0 WHERE id = ?')->execute(array($u['id']));
      session_regenerate_id(true);
      /* 2FA: password OK but a TOTP secret is set -> park as PENDING, no access
       * until login_2fa verifies the 6-digit code. */
      if (isset($u['totp_secret']) && $u['totp_secret'] !== '') {
        $_SESSION['pending_uid'] = (int)$u['id'];
        $_SESSION['pending_at'] = time();
        $_SESSION['pending_tries'] = 0;
        respond(array('need2fa' => true));
      }
      $_SESSION['uid'] = (int)$u['id'];
      $_SESSION['auth_at'] = time(); /* absolute 12h session lifetime */
      audit($u['id'], 'login', $u['username']);
      respond(array(
        'user' => array('id'=>(int)$u['id'], 'username'=>$u['username'], 'role'=>$u['role'], 'name'=>$u['name'], 'specialty'=>isset($u['specialty'])?$u['specialty']:'', 'specialty'=>isset($u['specialty'])?$u['specialty']:''),
        'perms' => perms_for_role($u['role']),
      ));
    }

    /* Second login step when 2FA is on: 6-digit authenticator code. */
    case 'login_2fa': {
      start_session();
      if (empty($_SESSION['pending_uid']) || time() - (int)$_SESSION['pending_at'] > 300) {
        fail('Sign in again', 401);
      }
      if ((int)$_SESSION['pending_tries'] >= 6) {
        unset($_SESSION['pending_uid'], $_SESSION['pending_at'], $_SESSION['pending_tries']);
        fail('Too many wrong codes - sign in again', 429);
      }
      $st = db()->prepare('SELECT * FROM users WHERE id = ? AND active = 1');
      $st->execute(array($_SESSION['pending_uid']));
      $u = $st->fetch();
      if (!$u) fail('Sign in again', 401);
      if (!totp_verify($u['totp_secret'], bval('code'))) {
        $_SESSION['pending_tries'] = (int)$_SESSION['pending_tries'] + 1;
        fail('Wrong code - open your authenticator app and try again', 401);
      }
      unset($_SESSION['pending_uid'], $_SESSION['pending_at'], $_SESSION['pending_tries']);
      session_regenerate_id(true);
      $_SESSION['uid'] = (int)$u['id'];
      $_SESSION['auth_at'] = time();
      audit($u['id'], 'login_2fa', $u['username']);
      respond(array(
        'user' => array('id'=>(int)$u['id'], 'username'=>$u['username'], 'role'=>$u['role'], 'name'=>$u['name'], 'specialty'=>isset($u['specialty'])?$u['specialty']:'', 'specialty'=>isset($u['specialty'])?$u['specialty']:''),
        'perms' => perms_for_role($u['role']),
      ));
    }

    case 'logout': {
      start_session();
      $_SESSION = array();
      session_destroy();
      respond(array('ok' => true));
    }

    case 'me': {
      $u = require_auth();
      respond(array(
        'user' => array('id'=>(int)$u['id'], 'username'=>$u['username'], 'role'=>$u['role'], 'name'=>$u['name'], 'specialty'=>isset($u['specialty'])?$u['specialty']:'',
                        'totp_on' => (isset($u['totp_secret']) && $u['totp_secret'] !== '')),
        'perms' => perms_for_role($u['role']),
      ));
    }

    /* ---- TOTP 2FA management (superadmin secures his own account) ---- */

    case 'totp_setup': {
      $u = require_auth();
      if ($u['role'] !== 'superadmin') fail('2FA is for super admin accounts', 403);
      $secret = totp_secret_new();
      $_SESSION['totp_new'] = $secret; /* not saved until a code proves the scan worked */
      $uri = 'otpauth://totp/IMANI:' . rawurlencode($u['username']) .
             '?secret=' . $secret . '&issuer=IMANI%20SUPERDEALER&digits=6&period=30';
      respond(array('secret' => $secret, 'uri' => $uri));
    }

    case 'totp_enable': {
      $u = require_auth();
      if ($u['role'] !== 'superadmin') fail('2FA is for super admin accounts', 403);
      if (empty($_SESSION['totp_new'])) fail('Start setup again');
      if (!totp_verify($_SESSION['totp_new'], bval('code'))) fail('Wrong code - scan the QR and type the current 6 digits');
      db()->prepare('UPDATE users SET totp_secret = ? WHERE id = ?')->execute(array($_SESSION['totp_new'], $u['id']));
      unset($_SESSION['totp_new']);
      audit($u['id'], 'totp_enable', $u['username']);
      respond(array('ok' => true));
    }

    case 'totp_disable': {
      $u = require_auth();
      if ($u['role'] !== 'superadmin') fail('2FA is for super admin accounts', 403);
      if (!totp_verify($u['totp_secret'], bval('code'))) fail('Wrong code - 2FA stays on');
      db()->prepare('UPDATE users SET totp_secret = "" WHERE id = ?')->execute(array($u['id']));
      audit($u['id'], 'totp_disable', $u['username']);
      respond(array('ok' => true));
    }

    case 'change_password': {
      $u = require_auth();
      if (!password_verify((string)bval('current'), $u['password_hash'])) fail('Current password is incorrect');
      $new = (string)bval('new');
      if (strlen($new) < 8) fail('New password must be at least 8 characters');
      db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute(array(password_hash($new, PASSWORD_BCRYPT), $u['id']));
      audit($u['id'], 'password_change', $u['username']);
      respond(array('ok' => true));
    }

    /* ================= ADMIN: roles, users, permissions ================= */

    case 'admin_meta': {
      $u = require_auth(); require_perm($u, 'admin', 'v');
      $roles = db()->query('SELECT name, builtin FROM roles ORDER BY builtin DESC, name')->fetchAll();
      respond(array('modules' => modules_meta(), 'roles' => $roles));
    }

    case 'admin_perms': {
      $u = require_auth(); require_perm($u, 'admin', 'v');
      $out = array();
      foreach (db()->query('SELECT name FROM roles')->fetchAll() as $r) {
        if ($r['name'] === 'superadmin') continue;
        $out[$r['name']] = perms_for_role($r['name']);
      }
      respond($out);
    }

    case 'admin_perms_save': {
      $u = require_auth(); require_perm($u, 'admin', 'e');
      $matrix = bval('matrix', array());
      if (!is_array($matrix)) fail('matrix required');
      $up = db()->prepare('INSERT INTO permissions (role, module, v, e, d) VALUES (?,?,?,?,?)
                           ON DUPLICATE KEY UPDATE v=VALUES(v), e=VALUES(e), d=VALUES(d)');
      $moduleKeys = array_map(function ($m) { return $m['key']; }, modules_meta());
      foreach ($matrix as $role => $mods) {
        if ($role === 'superadmin' || !is_array($mods)) continue;
        foreach ($mods as $mod => $lvl) {
          if (!in_array($mod, $moduleKeys, true)) continue;
          $up->execute(array($role, $mod, !empty($lvl['v'])?1:0, !empty($lvl['e'])?1:0, !empty($lvl['d'])?1:0));
        }
      }
      audit($u['id'], 'permissions_update', 'matrix saved');
      respond(array('ok' => true));
    }

    case 'admin_role_add': {
      $u = require_auth(); require_perm($u, 'admin', 'e');
      $name = preg_replace('/[^a-z0-9_]/', '', strtolower(trim((string)bval('name'))));
      if ($name === '' || strlen($name) > 32) fail('Role name: lowercase letters/numbers, max 32 chars');
      if (in_array($name, array('superadmin'), true)) fail('Reserved role name');
      db()->prepare('INSERT IGNORE INTO roles (name, builtin) VALUES (?,0)')->execute(array($name));
      audit($u['id'], 'role_add', $name);
      respond(array('ok' => true, 'name' => $name));
    }

    case 'admin_users': {
      $u = require_auth(); require_perm($u, 'admin', 'v');
      $rows = db()->query('SELECT id, username, role, name, station, active, specialty FROM users ORDER BY id')->fetchAll();
      respond($rows);
    }

    case 'admin_user_add': {
      $u = require_auth(); require_perm($u, 'admin', 'e');
      $username = strtolower(trim((string)bval('username')));
      $name = trim((string)bval('name'));
      $role = trim((string)bval('role'));
      $password = (string)bval('password');
      if ($username === '' || $name === '') fail('Username and full name are required');
      if (strlen($password) < 8) fail('Password must be at least 8 characters');
      $roleOk = db()->prepare('SELECT 1 FROM roles WHERE name = ?');
      $roleOk->execute(array($role));
      if (!$roleOk->fetch()) fail('Unknown role: ' . $role);
      if ($role === 'superadmin' && $u['role'] !== 'superadmin') fail('Only a super admin can create another super admin', 403);
      try {
        db()->prepare('INSERT INTO users (username, role, name, station, password_hash) VALUES (?,?,?,?,?)')
            ->execute(array($username, $role, $name, trim((string)bval('station')), password_hash($password, PASSWORD_BCRYPT)));
      } catch (Exception $e) { fail('That username already exists', 409); }
      audit($u['id'], 'user_add', $username . ' (' . $role . ')');
      respond(array('ok' => true));
    }

    case 'admin_user_update': {
      $u = require_auth(); require_perm($u, 'admin', 'e');
      $id = (int)bval('id');
      $st = db()->prepare('SELECT * FROM users WHERE id = ?');
      $st->execute(array($id));
      $target = $st->fetch();
      if (!$target) fail('User not found', 404);
      $b = body();
      if ($target['role'] === 'superadmin') {
        if ((isset($b['active']) && !$b['active']) || (isset($b['role']) && $b['role'] !== 'superadmin')) fail('Cannot demote or disable a Super Admin');
      }
      $sets = array(); $vals = array();
      foreach (array('name','station') as $f) if (isset($b[$f]) && $b[$f] !== '') { $sets[] = "$f = ?"; $vals[] = trim((string)$b[$f]); }
      if (isset($b['role']) && $b['role'] !== '') {
        $rk = db()->prepare('SELECT 1 FROM roles WHERE name = ?'); $rk->execute(array($b['role']));
        if (!$rk->fetch()) fail('Unknown role');
        $sets[] = 'role = ?'; $vals[] = $b['role'];
      }
      if (isset($b['active'])) { $sets[] = 'active = ?'; $vals[] = $b['active'] ? 1 : 0; }
      if (isset($b['specialty'])) {
        if (!in_array($b['specialty'], array('', 'activeness'), true)) fail('Unknown specialty');
        $sets[] = 'specialty = ?'; $vals[] = $b['specialty'];
      }
      if (!empty($b['password'])) {
        if (strlen((string)$b['password']) < 8) fail('Password must be at least 8 characters');
        $sets[] = 'password_hash = ?'; $vals[] = password_hash((string)$b['password'], PASSWORD_BCRYPT);
        $sets[] = 'failed = 0'; $sets[] = 'locked_until = 0';
      }
      if ($sets) {
        $vals[] = $id;
        db()->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
      }
      audit($u['id'], 'user_update', $target['username']);
      respond(array('ok' => true));
    }

    case 'admin_user_delete': {
      $u = require_auth(); require_perm($u, 'admin', 'd');
      $id = (int)bval('id');
      $st = db()->prepare('SELECT * FROM users WHERE id = ?');
      $st->execute(array($id));
      $target = $st->fetch();
      if (!$target) fail('User not found', 404);
      if ($target['role'] === 'superadmin') fail('Cannot delete a Super Admin account');
      if ((int)$target['id'] === (int)$u['id']) fail('You cannot delete your own account');
      db()->prepare('DELETE FROM users WHERE id = ?')->execute(array($id));
      audit($u['id'], 'user_delete', $target['username']);
      respond(array('ok' => true));
    }

    case 'admin_audit': {
      $u = require_auth(); require_perm($u, 'admin', 'v');
      $rows = db()->query('SELECT a.at, a.action, a.detail, u.username AS who
                           FROM audit a LEFT JOIN users u ON u.id = a.user_id
                           ORDER BY a.id DESC LIMIT 100')->fetchAll();
      respond($rows);
    }

    /* ================= MONTHS ================= */

    case 'months': {
      $u = require_auth();
      $rows = db()->query('SELECT month, status FROM months ORDER BY month DESC LIMIT 18')->fetchAll();
      respond(array('open' => open_month(), 'months' => array_reverse($rows)));
    }

    case 'month_open': {
      $u = require_auth(); require_perm($u, 'commission', 'e');
      $cur = open_month();
      $next = next_month($cur);
      db()->prepare('UPDATE months SET status = "AWAITING" WHERE month = ? AND status = "OPEN"')->execute(array($cur));
      db()->prepare('INSERT INTO months (month, status) VALUES (?, "OPEN")
                     ON DUPLICATE KEY UPDATE status = "OPEN"')->execute(array($next));
      audit($u['id'], 'month_open', $next . ' (prev ' . $cur . ' awaiting commission)');
      respond(array('ok' => true, 'opened' => $next, 'awaiting' => $cur));
    }

    case 'month_close': {
      $u = require_auth(); require_perm($u, 'commission', 'e');
      $month = (string)bval('month');
      if (!preg_match('/^\d{4}-\d{2}$/', $month)) fail('Provide month as YYYY-MM');
      $status = month_status($month);
      if ($status === 'CLOSED') fail('Month is already closed');
      $ck = db()->prepare('SELECT 1 FROM commission_calc WHERE month = ?');
      $ck->execute(array($month));
      if (!$ck->fetch()) fail('Upload the final commission file and Calculate & Save before closing ' . $month);

      db()->prepare('INSERT INTO months (month, status, closed_at) VALUES (?, "CLOSED", NOW())
                     ON DUPLICATE KEY UPDATE status = "CLOSED", closed_at = NOW()')->execute(array($month));

      /* Carry-forward: served agents become next month's PRIORITY base per BDO. */
      $next = next_month($month);
      db()->prepare('INSERT IGNORE INTO months (month, status) VALUES (?, "OPEN")')->execute(array($next));
      $served = db()->prepare('SELECT DISTINCT bdo, agent_id FROM service_history WHERE month = ? AND served_status = "SERVED"');
      $served->execute(array($month));
      $ins = db()->prepare('INSERT IGNORE INTO base (month, bdo, agent_id, kind) VALUES (?,?,?, "priority")');
      $n = 0;
      foreach ($served->fetchAll() as $r) { $ins->execute(array($next, $r['bdo'], $r['agent_id'])); $n++; }
      audit($u['id'], 'month_close', $month . ' closed; ' . $n . ' priority agents -> ' . $next);
      respond(array('ok' => true, 'closed' => $month, 'carried' => $n, 'next' => $next));
    }

    /* ================= DASHBOARD ================= */

    case 'dashboard': {
      $u = require_auth(); require_perm($u, 'dashboard', 'v');
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();

      $tot = (int)db()->query('SELECT COUNT(*) c FROM agents')->fetch()['c'];
      $oa = office_attainment($month);
      $visible = setting_get('dashboard_kpis', 'serving,float,visits,apk,activeness,withdraw');

      respond(array(
        'month' => $month, 'status' => month_status($month), 'openMonth' => open_month(),
        'totalAgents' => $tot, 'attainment' => $oa['attainment'], 'achievement' => $oa['achievement'],
        'weighted' => $oa['weighted'], 'fromUpload' => $oa['fromUpload'],
        'waked' => $oa['waked'], 'lost' => $oa['lost'],
        'visibleKpis' => $visible, 'apkRequired' => setting_get('apk_required_version', '2.0'),
      ));
    }

    /* OM chooses which KPIs show on everyone's dashboard + the required APK version. */
    case 'dashboard_settings_save': {
      $u = require_auth(); require_perm($u, 'dashboard', 'e');
      $kpis = bval('kpis', array());
      $valid = array_keys(office_kpi_defs());
      $chosen = array();
      foreach ((array)$kpis as $k) if (in_array($k, $valid, true)) $chosen[] = $k;
      if (!count($chosen)) fail('Choose at least one KPI to display');
      setting_set('dashboard_kpis', implode(',', $chosen));
      $apkV = trim((string)bval('apkVersion'));
      if ($apkV !== '') {
        if (!preg_match('/^\d+(\.\d+)?$/', $apkV)) fail('APK version must be a number like 2.0');
        setting_set('apk_required_version', $apkV);
      }
      audit($u['id'], 'dashboard_settings', implode(',', $chosen) . ' apk>=' . $apkV);
      respond(array('ok' => true));
    }

    /*
     * Inactive agents panel (visible to every BDO and management):
     *   all  = every agent reading INACTIVE in the current month's file
     *   lost = the subset who were ACTIVE the previous month (rescue first!)
     */
    case 'inactive_agents': {
      $u = require_auth();
      if (!can($u, 'agents', 'v') && !can($u, 'mybase', 'v')) fail('No access', 403);
      $month = open_month();
      $st = db()->prepare('SELECT id, acc, name, phone, branch, physical_location, act_prev
                           FROM agents WHERE act_month = ? AND act_current = "INACTIVE"
                           ORDER BY (act_prev = "ACTIVE") DESC, name LIMIT 500');
      $st->execute(array($month));
      $all = $st->fetchAll();
      $lost = array_values(array_filter($all, function ($a) { return $a['act_prev'] === 'ACTIVE'; }));
      respond(array('month' => $month, 'all' => $all, 'lost' => $lost,
                    'counts' => array('all' => count($all), 'lost' => count($lost))));
    }

    /* ================= AGENTS ================= */

    /*
     * Agent list. Full details for roles with the `agents` permission (OM/MD).
     * BDOs (mybase permission) also get the WHOLE uploaded list - but with a
     * restricted column set: account, name, phone, branch, physical location
     * and the month's KPI status. Everything else is stripped server-side.
     */
    case 'agents': {
      $u = require_auth();
      $full = can($u, 'agents', 'v');
      if (!$full && !can($u, 'mybase', 'v')) fail('No access', 403);
      $search = trim((string)($_GET['search'] ?? ''));
      $page = max(1, (int)($_GET['page'] ?? 1));
      $limit = (int)($_GET['per'] ?? 50);
      if (!in_array($limit, array(20, 50, 100), true)) $limit = 50;
      $off = ($page - 1) * $limit;
      $where = ''; $vals = array();
      if ($search !== '') {
        if (preg_match('/^\d+$/', $search)) {
          /* digits = account/phone lookup; prefix match uses the indexes (fast) */
          $where = 'WHERE acc LIKE ? OR phone LIKE ?';
          $vals = array($search . '%', $search . '%');
        } else {
          /* text: names/branches anywhere + account prefix (accounts can be alphanumeric) */
          $where = 'WHERE name LIKE ? OR branch LIKE ? OR acc LIKE ?';
          $s = '%' . $search . '%'; $vals = array($s, $s, $search . '%');
        }
      }
      $tot = db()->prepare("SELECT COUNT(*) c FROM agents $where");
      $tot->execute($vals);
      $total = (int)$tot->fetch()['c'];
      $st = db()->prepare("SELECT * FROM agents $where ORDER BY name LIMIT $limit OFFSET $off");
      $st->execute($vals);
      $rows = $st->fetchAll();

      /* Current-month KPI status for the page's agents (who did what + source). */
      $month = open_month();
      $kpiMap = array(); $lastTx = array(); $wr = array();
      if ($rows) {
        $ids = array_map(function ($r) { return (int)$r['id']; }, $rows);
        $in = implode(',', array_fill(0, count($ids), '?'));
        $kq = db()->prepare("SELECT agent_id, kpi, bdo, source, proof, proof_note FROM agent_month_kpi WHERE month = ? AND agent_id IN ($in)");
        $kq->execute(array_merge(array($month), $ids));
        foreach ($kq->fetchAll() as $r) $kpiMap[$r['agent_id']][$r['kpi']] = array('by' => $r['bdo'], 'src' => $r['source'], 'proof' => ($r['proof'] !== '' || $r['proof_note'] !== ''), 'note' => $r['proof_note']);
        $tq2 = db()->prepare("SELECT agent_id, MAX(NULLIF(date,'')) d FROM service_history WHERE agent_id IN ($in) GROUP BY agent_id");
        $tq2->execute($ids);
        foreach ($tq2->fetchAll() as $r) $lastTx[$r['agent_id']] = (string)$r['d'];
        $wq = db()->prepare("SELECT agent_id, bdo FROM wont_return WHERE agent_id IN ($in)");
        $wq->execute($ids);
        foreach ($wq->fetchAll() as $r) $wr[$r['agent_id']] = $r['bdo'];
      }

      $items = array();
      foreach ($rows as $r) {
        $id = (int)$r['id'];
        $base = array(
          'id' => $id, 'acc' => $r['acc'], 'name' => $r['name'], 'phone' => $r['phone'],
          'branch' => $r['branch'], 'physical_location' => $r['physical_location'],
          'kpi' => isset($kpiMap[$id]) ? $kpiMap[$id] : new stdClass(),
          'actStatus' => ($r['act_month'] === $month ? strtoupper($r['act_current']) : ''),
          'actPrev' => strtoupper((string)$r['act_prev']),
          'lastTx' => isset($lastTx[$id]) ? $lastTx[$id] : '',
          'wontReturn' => isset($wr[$id]),
        );
        if ($full) $base['partner'] = (int)$r['partner'];
        $items[] = $base;
      }
      respond(array('items' => $items, 'total' => $total, 'page' => $page,
                    'pages' => max(1, (int)ceil($total / $limit)),
                    'restricted' => !$full, 'month' => $month, 'monthStatus' => month_status($month)));
    }

    /* ================= BDO BASE + SERVE ================= */

    case 'base': {
      $u = require_auth();
      $bdo = strtolower(trim((string)($_GET['bdo'] ?? '')));
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();
      if (can($u, 'mybase', 'v') && !can($u, 'agents', 'v')) $bdo = $u['username']; // BDO: own base only
      elseif (!can($u, 'agents', 'v')) fail('No access', 403);
      if ($bdo === '') $bdo = $u['username'];

      $st = db()->prepare('SELECT b.agent_id, b.kind FROM base b WHERE b.month = ? AND b.bdo = ?');
      $st->execute(array($month, $bdo));
      $prio = array(); $uploaded = array();
      foreach ($st->fetchAll() as $r) { if ($r['kind'] === 'priority') $prio[$r['agent_id']] = true; else $uploaded[$r['agent_id']] = true; }
      $ids = array_keys($prio + $uploaded);
      $agents = array();
      if ($ids) {
        $in = implode(',', array_fill(0, count($ids), '?'));
        $q = db()->prepare("SELECT id, acc, name, phone, branch, physical_location, act_current, act_month FROM agents WHERE id IN ($in)");
        $q->execute($ids);
        $agents = $q->fetchAll();
      }
      $ever = array();
      foreach (db()->query('SELECT DISTINCT agent_id FROM service_history WHERE served_status = "SERVED"')->fetchAll() as $r) $ever[$r['agent_id']] = true;
      /* field-recruited agents (base kind='new') read as NEW, not never-served */
      $rq = db()->prepare('SELECT agent_id FROM base WHERE month = ? AND kind = "new"');
      $rq->execute(array($month));
      foreach ($rq->fetchAll() as $r) $ever[$r['agent_id']] = true;

      /* Shared KPI state for these agents this month: kpi => {by, src} - visible
       * to every BDO so nobody repeats work already done by a colleague. */
      $kpiMap = array(); $servedNow = 0;
      if ($ids) {
        $in = implode(',', array_fill(0, count($ids), '?'));
        $kq = db()->prepare("SELECT agent_id, kpi, bdo, source, proof, proof_note FROM agent_month_kpi WHERE month = ? AND agent_id IN ($in)");
        $kq->execute(array_merge(array($month), $ids));
        foreach ($kq->fetchAll() as $r) {
          if (!isset($kpiMap[$r['agent_id']])) $kpiMap[$r['agent_id']] = array();
          $kpiMap[$r['agent_id']][$r['kpi']] = array('by' => $r['bdo'], 'src' => $r['source'], 'proof' => ($r['proof'] !== '' || $r['proof_note'] !== ''), 'note' => $r['proof_note']);
          if ($r['kpi'] === 'served' && $r['bdo'] === $bdo) $servedNow++;
        }
      }

      /* activeness-specialist extras: last transaction date + won't-return marks */
      $lastTx = array(); $wr = array();
      if ($ids) {
        $in2 = implode(',', array_fill(0, count($ids), '?'));
        $tq2 = db()->prepare("SELECT agent_id, MAX(NULLIF(date,'')) d FROM service_history WHERE agent_id IN ($in2) GROUP BY agent_id");
        $tq2->execute($ids);
        foreach ($tq2->fetchAll() as $r) $lastTx[$r['agent_id']] = (string)$r['d'];
        $wq = db()->prepare("SELECT agent_id, bdo FROM wont_return WHERE agent_id IN ($in2)");
        $wq->execute($ids);
        foreach ($wq->fetchAll() as $r) $wr[$r['agent_id']] = $r['bdo'];
      }

      foreach ($agents as &$a) {
        $id = (int)$a['id'];
        $a['level'] = isset($prio[$id]) ? 'priority' : (isset($ever[$id]) ? 'new' : 'never');
        $a['kpi'] = isset($kpiMap[$id]) ? $kpiMap[$id] : new stdClass();
        $a['actStatus'] = ($a['act_month'] === $month ? strtoupper($a['act_current']) : '');
        $a['actPrev'] = strtoupper((string)$a['act_prev']);
        $a['lastTx'] = isset($lastTx[$id]) ? $lastTx[$id] : '';
        $a['wontReturn'] = isset($wr[$id]);
        unset($a['act_current'], $a['act_month'], $a['act_prev']);
      }
      unset($a);
      $order = array('priority'=>0,'new'=>1,'never'=>2);
      usort($agents, function ($x, $y) use ($order) {
        if ($order[$x['level']] !== $order[$y['level']]) return $order[$x['level']] - $order[$y['level']];
        return strcmp($x['name'], $y['name']);
      });

      /* This BDO's weighted performance for the month (if OM set his targets). */
      $perf = null;
      $tq = db()->prepare('SELECT * FROM bdo_targets WHERE month = ? AND bdo = ?');
      $tq->execute(array($month, $bdo));
      if ($t = $tq->fetch()) {
        $perf = user_specialty($bdo) === 'activeness'
          ? bdo_score_specialist(bdo_actuals($month, $bdo), $t)
          : bdo_score(bdo_actuals($month, $bdo), $t);
      }

      /* SPECIAL agents: served by partners this month - every BDO should build
       * the relationship and capture the physical location. */
      $sp = db()->prepare('SELECT a.id, a.acc, a.name, a.phone, a.branch, a.physical_location
                           FROM agent_month_kpi k JOIN agents a ON a.id = k.agent_id
                           WHERE k.month = ? AND k.kpi = "served" AND k.bdo = "partners"
                           ORDER BY (a.physical_location = "") DESC, a.name LIMIT 100');
      $sp->execute(array($month));
      $special = $sp->fetchAll();

      respond(array(
        'bdo' => $bdo, 'month' => $month, 'monthStatus' => month_status($month),
        'counts' => array('priority' => count($prio), 'newAgents' => count(array_diff_key($uploaded, $prio)), 'total' => count($ids), 'served' => $servedNow),
        'agents' => $agents, 'performance' => $perf, 'special' => $special,
      ));
    }

    /*
     * BDO marks ONE KPI on an agent for the currently OPEN month:
     *   served (NOT_SERVED -> SERVED), visit (NO -> YES), apk (NO -> YES),
     *   active (Inactive -> Active).
     * The unique ledger row means the FIRST BDO gets the credit; anyone else is
     * blocked and told who already did it.
     */
    case 'kpi_mark': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $agentId = (int)bval('agentId');
      $kpi = (string)bval('kpi');
      if (!in_array($kpi, array('served', 'visit', 'apk', 'active'), true)) fail('Unknown KPI');
      $month = open_month();
      $ag = db()->prepare('SELECT * FROM agents WHERE id = ?');
      $ag->execute(array($agentId));
      $agent = $ag->fetch();
      if (!$agent) fail('Agent not found', 404);
      $bdo = $u['username'];

      /* Serving requires the agent's physical location (typed now or already known). */
      if ($kpi === 'served') {
        $loc = trim((string)bval('location'));
        if ($loc !== '') {
          db()->prepare('UPDATE agents SET physical_location = ? WHERE id = ?')->execute(array($loc, $agentId));
        } elseif (trim((string)$agent['physical_location']) === '') {
          fail('Physical location required before marking served', 400, array('needLocation' => true));
        }
      }

      /* Real-status guard: an agent already ACTIVE (from the file) cannot be
       * "waked" again. (served/visit/apk are guarded by the ledger below.) */
      if ($kpi === 'active' && $agent['act_month'] === $month && strtoupper($agent['act_current']) === 'ACTIVE') {
        fail('Agent is already Active this month - nothing to wake', 409);
      }

      /* WAKING an INACTIVE agent needs proof: a photo of the agent's transaction
       * receipts, OR a typed commitment that the BDO is sure the agent
       * transacted. He must also CONFIRM the agent's physical location so the
       * follow-up team knows where to find him. */
      $proofFile = ''; $proofNote = '';
      if ($kpi === 'active' && strtoupper((string)$agent['act_current']) === 'INACTIVE') {
        $img = (string)bval('proof');
        $proofNote = mb_substr(trim((string)bval('proofNote')), 0, 255);
        $wakeLoc = trim((string)bval('location'));
        if ($img === '' && mb_strlen($proofNote) < 10) {
          fail('Attach a receipt photo OR write how you are sure the agent transacted (at least 10 characters)', 400,
               array('needProof' => true, 'agentLoc' => (string)$agent['physical_location']));
        }
        if ($wakeLoc === '' && trim((string)$agent['physical_location']) === '') {
          fail('Confirm the agent\'s physical location for the follow-up', 400,
               array('needProof' => true, 'agentLoc' => ''));
        }
        if ($img !== '') $proofFile = save_proof_image($img);
        if ($wakeLoc !== '') {
          db()->prepare('UPDATE agents SET physical_location = ? WHERE id = ?')->execute(array($wakeLoc, $agentId));
        }
      }

      /* already done by someone? */
      $chk = db()->prepare('SELECT bdo, at FROM agent_month_kpi WHERE month = ? AND agent_id = ? AND kpi = ?');
      $chk->execute(array($month, $agentId, $kpi));
      if ($done = $chk->fetch()) {
        fail('Already done by ' . $done['bdo'] . ' on ' . substr($done['at'], 0, 16) . ' - no need to repeat', 409);
      }
      db()->prepare('INSERT INTO agent_month_kpi (month, agent_id, kpi, bdo, source, proof, proof_note) VALUES (?,?,?,?, "bdo", ?, ?)')
          ->execute(array($month, $agentId, $kpi, $bdo, $proofFile, $proofNote));
      if ($kpi === 'served') {
        db()->prepare('INSERT INTO service_history (agent_id, bdo, month, date, time, served_status, source)
                       VALUES (?,?,?,?,?, "SERVED", "bdo")')
            ->execute(array($agentId, $bdo, $month, date('Y-m-d'), date('H:i')));
      }
      /* Waking an agent updates his real status so the chip locks and he cannot
       * be waked again (counts in this BDO's performance, not the office file). */
      if ($kpi === 'active') {
        db()->prepare('UPDATE agents SET act_current = "ACTIVE", act_month = ? WHERE id = ?')->execute(array($month, $agentId));
      }
      db()->prepare('INSERT IGNORE INTO base (month, bdo, agent_id, kind) VALUES (?,?,?, "uploaded")')->execute(array($month, $bdo, $agentId));
      specialist_touch_report($u);
      audit($u['id'], 'kpi_mark', $bdo . ' ' . $kpi . ' agent=' . $agentId . ' ' . $month);
      respond(array('ok' => true, 'kpi' => $kpi, 'month' => $month, 'by' => $bdo));
    }

    /* Serve a wake-proof photo (auth-checked; files are blocked from direct URL access). */
    case 'wake_proof': {
      $u = require_auth();
      if (!can($u, 'agents', 'v') && !can($u, 'mybase', 'v')) fail('No access', 403);
      $agentId = (int)($_GET['agent'] ?? 0);
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();
      $st = db()->prepare('SELECT proof FROM agent_month_kpi WHERE month = ? AND agent_id = ? AND kpi = "active"');
      $st->execute(array($month, $agentId));
      $r = $st->fetch();
      /* filename came from bin2hex() - sanitize anyway so no path can sneak in */
      $file = $r ? preg_replace('/[^a-z0-9.]/', '', (string)$r['proof']) : '';
      $path = __DIR__ . '/uploads/proofs/' . $file;
      if ($file === '' || !is_file($path)) fail('No proof photo for this agent', 404);
      $ext = pathinfo($file, PATHINFO_EXTENSION);
      header('Content-Type: ' . ($ext === 'png' ? 'image/png' : ($ext === 'webp' ? 'image/webp' : 'image/jpeg')));
      header('X-Content-Type-Options: nosniff');
      header('Cache-Control: private, max-age=3600');
      readfile($path);
      exit;
    }

    /*
     * BDO recruits a BRAND-NEW agent in the field: acc name, acc number, branch,
     * phone and physical location - all required. The agent joins his base as
     * NEW + ACTIVE, and the activeness credit counts in HIS performance
     * (recruiting = activeness work, same as waking).
     */
    case 'agent_recruit': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $month = open_month();
      if (month_status($month) !== 'OPEN') fail('Month is not open');
      $name = trim((string)bval('name'));
      $acc = trim((string)bval('acc'));
      $phone = trim((string)bval('phone'));
      $branch = trim((string)bval('branch'));
      $loc = trim((string)bval('location'));
      if ($name === '' || $acc === '' || $phone === '' || $branch === '' || $loc === '') {
        fail('Fill everything: acc name, acc number, branch, phone and physical location');
      }
      if (strlen($acc) > 64 || !preg_match('/^[A-Za-z0-9\-\/]+$/', $acc)) fail('Acc number: letters and digits only');
      $chk = db()->prepare('SELECT id FROM agents WHERE acc = ?');
      $chk->execute(array($acc));
      if ($chk->fetch()) fail('An agent with acc ' . $acc . ' already exists - find him on the agent list', 409);
      db()->prepare('INSERT INTO agents (acc, name, phone, branch, station, physical_location, act_current, act_month)
                     VALUES (?,?,?,?,?,?, "ACTIVE", ?)')
          ->execute(array($acc, $name, $phone, $branch, (string)$u['station'], $loc, $month));
      $agentId = (int)db()->lastInsertId();
      db()->prepare('INSERT IGNORE INTO base (month, bdo, agent_id, kind) VALUES (?,?,?, "new")')
          ->execute(array($month, $u['username'], $agentId));
      /* the recruit counts as HIS activeness credit (reversible like any live mark) */
      db()->prepare('INSERT INTO agent_month_kpi (month, agent_id, kpi, bdo, source) VALUES (?,?, "active", ?, "bdo")')
          ->execute(array($month, $agentId, $u['username']));
      specialist_touch_report($u);
      audit($u['id'], 'agent_recruit', $u['username'] . ' recruited ' . $acc . ' (' . $name . ') ' . $month);
      respond(array('ok' => true, 'agentId' => $agentId));
    }

    /* ============ RECRUITMENT PIPELINE (activeness specialist) ============
     * Stages: 1 form submitted at a branch, held by the BANK CHAMPION
     *         2 passed the bank audit
     *         3 approved
     *         4 paid + POS assigned
     *         5 acc + physical location filled -> REAL agent created,
     *           activeness credit lands on the recruiting BDO.
     */
    case 'recruit_pipe_add': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $name = trim((string)bval('name'));
      $branch = trim((string)bval('branch'));
      $champ = trim((string)bval('champion'));
      $phone = trim((string)bval('phone'));
      if ($name === '' || $branch === '' || $champ === '') fail('Fill agent name, branch and the bank champion holding the form');
      db()->prepare('INSERT INTO recruits (bdo, name, branch, champion, phone) VALUES (?,?,?,?,?)')
          ->execute(array($u['username'], $name, $branch, $champ, $phone));
      specialist_touch_report($u);
      audit($u['id'], 'recruit_form', $name . ' @ ' . $branch . ' (champion ' . $champ . ')');
      respond(array('ok' => true, 'id' => (int)db()->lastInsertId()));
    }

    case 'recruit_pipe_advance': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $id = (int)bval('id');
      $st = db()->prepare('SELECT * FROM recruits WHERE id = ?');
      $st->execute(array($id));
      $rec = $st->fetch();
      if (!$rec) fail('Recruit not found', 404);
      $isOM = can($u, 'agents', 'e');
      if (!$isOM && $rec['bdo'] !== $u['username']) fail('Not your recruit', 403);
      $stage = (int)$rec['stage'];
      if ($stage >= 5) fail('This recruit is already a full agent');
      if ($stage === 1) {
        db()->prepare('UPDATE recruits SET stage = 2, audit_at = NOW() WHERE id = ?')->execute(array($id));
      } elseif ($stage === 2) {
        db()->prepare('UPDATE recruits SET stage = 3, approved_at = NOW() WHERE id = ?')->execute(array($id));
      } elseif ($stage === 3) {
        db()->prepare('UPDATE recruits SET stage = 4, paid_at = NOW() WHERE id = ?')->execute(array($id));
      } else {
        /* final: acc + location -> becomes a REAL agent, credited to the BDO */
        $acc = trim((string)bval('acc'));
        $loc = trim((string)bval('location'));
        if ($acc === '' || $loc === '') fail('Fill the agent acc number and physical location to finish');
        if (strlen($acc) > 64 || !preg_match('/^[A-Za-z0-9\-\/]+$/', $acc)) fail('Acc number: letters and digits only');
        $ck = db()->prepare('SELECT id FROM agents WHERE acc = ?');
        $ck->execute(array($acc));
        if ($ck->fetch()) fail('An agent with acc ' . $acc . ' already exists', 409);
        $month = open_month();
        db()->prepare('INSERT INTO agents (acc, name, phone, branch, station, physical_location, act_current, act_month)
                       VALUES (?,?,?,?,?,?, "ACTIVE", ?)')
            ->execute(array($acc, $rec['name'], $rec['phone'], $rec['branch'], (string)$u['station'], $loc, $month));
        $agentId = (int)db()->lastInsertId();
        db()->prepare('INSERT IGNORE INTO base (month, bdo, agent_id, kind) VALUES (?,?,?, "new")')
            ->execute(array($month, $rec['bdo'], $agentId));
        db()->prepare('INSERT INTO agent_month_kpi (month, agent_id, kpi, bdo, source) VALUES (?,?, "active", ?, "bdo")')
            ->execute(array($month, $agentId, $rec['bdo']));
        db()->prepare('UPDATE recruits SET stage = 5, done_at = NOW(), acc = ?, location = ?, agent_id = ? WHERE id = ?')
            ->execute(array($acc, $loc, $agentId, $id));
      }
      specialist_touch_report($u);
      audit($u['id'], 'recruit_stage', 'id=' . $id . ' -> stage ' . ($stage + 1));
      respond(array('ok' => true, 'stage' => $stage + 1));
    }

    /* BDO sees his own pipeline; OM/MD (targets.v) see everyone's. */
    case 'recruit_pipe_list': {
      $u = require_auth();
      $all = can($u, 'targets', 'v');
      if (!$all && !can($u, 'mybase', 'v')) fail('No access', 403);
      if ($all) {
        $rows = db()->query('SELECT * FROM recruits ORDER BY id DESC LIMIT 300')->fetchAll();
      } else {
        $st = db()->prepare('SELECT * FROM recruits WHERE bdo = ? ORDER BY id DESC LIMIT 100');
        $st->execute(array($u['username']));
        $rows = $st->fetchAll();
      }
      respond(array('rows' => $rows));
    }

    /*
     * Activeness specialist's daily numbers - COMPUTED from what he actually
     * did (agent taps + forms), so the report always matches his agent list:
     *   inactiveVisited = waked + confirmed won't-return (agents he handled)
     *   waked           = wake credits on existing agents (recruits excluded)
     *   wontReturn      = agents who confirmed they will not return
     *   formsSubmitted  = new-agent forms opened in the pipeline this month
     *   recruited       = recruits that became REAL agents this month
     */
    case 'specialist_summary': {
      $u = require_auth();
      $bdo = strtolower(trim((string)($_GET['bdo'] ?? '')));
      if ($bdo === '' || !can($u, 'targets', 'v')) $bdo = $u['username'];
      if (!can($u, 'mybase', 'v') && !can($u, 'targets', 'v')) fail('No access', 403);
      $month = open_month();
      $nq = db()->prepare('SELECT agent_id FROM base WHERE month = ? AND bdo = ? AND kind = "new"');
      $nq->execute(array($month, $bdo));
      $newIds = array_map(function ($r) { return (int)$r['agent_id']; }, $nq->fetchAll());
      $recruited = count($newIds);
      $sql = 'SELECT COUNT(*) c FROM agent_month_kpi WHERE month = ? AND bdo = ? AND kpi = "active" AND source = "bdo"';
      $vals = array($month, $bdo);
      if ($newIds) {
        $sql .= ' AND agent_id NOT IN (' . implode(',', array_fill(0, count($newIds), '?')) . ')';
        $vals = array_merge($vals, $newIds);
      }
      $wq = db()->prepare($sql); $wq->execute($vals);
      $waked = (int)$wq->fetch()['c'];
      $wr = db()->prepare('SELECT COUNT(*) c FROM wont_return WHERE bdo = ? AND at LIKE ?');
      $wr->execute(array($bdo, $month . '%'));
      $wont = (int)$wr->fetch()['c'];
      $fq = db()->prepare('SELECT COUNT(*) c FROM recruits WHERE bdo = ? AND submitted_at LIKE ?');
      $fq->execute(array($bdo, $month . '%'));
      $forms = (int)$fq->fetch()['c'];
      respond(array('month' => $month, 'bdo' => $bdo, 'waked' => $waked, 'wontReturn' => $wont,
                    'inactiveVisited' => $waked + $wont, 'formsSubmitted' => $forms, 'recruited' => $recruited));
    }

    /* ============ WON'T-RETURN list (deletion candidates) ============
     * The specialist contacted the agent and the agent CONFIRMED he will not
     * return to work. Marked agents feed the OM's deletion-discussion report.
     */
    case 'wont_return_toggle': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $agentId = (int)bval('agentId');
      $ag = db()->prepare('SELECT id, name FROM agents WHERE id = ?');
      $ag->execute(array($agentId));
      if (!($agent = $ag->fetch())) fail('Agent not found', 404);
      $ex = db()->prepare('SELECT bdo FROM wont_return WHERE agent_id = ?');
      $ex->execute(array($agentId));
      if ($row = $ex->fetch()) {
        if ($row['bdo'] !== $u['username'] && !can($u, 'agents', 'e')) fail('Marked by ' . $row['bdo'] . ' - only he or the OM can remove it', 403);
        db()->prepare('DELETE FROM wont_return WHERE agent_id = ?')->execute(array($agentId));
        specialist_touch_report($u);
        audit($u['id'], 'wont_return_unmark', $agent['name']);
        respond(array('ok' => true, 'marked' => false));
      }
      $note = mb_substr(trim((string)bval('note')), 0, 255);
      db()->prepare('INSERT INTO wont_return (agent_id, bdo, note) VALUES (?,?,?)')->execute(array($agentId, $u['username'], $note));
      specialist_touch_report($u);
      audit($u['id'], 'wont_return_mark', $agent['name'] . ($note !== '' ? ' - ' . $note : ''));
      respond(array('ok' => true, 'marked' => true));
    }

    case 'wont_return_list': {
      $u = require_auth();
      if (!can($u, 'targets', 'v') && !can($u, 'mybase', 'v')) fail('No access', 403);
      $rows = db()->query('SELECT w.agent_id, w.bdo, w.note, w.at, a.acc, a.name, a.phone, a.branch,
                                  a.physical_location, a.act_current, a.act_prev
                           FROM wont_return w JOIN agents a ON a.id = w.agent_id
                           ORDER BY w.id DESC LIMIT 500')->fetchAll();
      respond(array('rows' => $rows));
    }

    /*
     * OM downloads BDO performance for ANY date range with the KPIs he picks.
     * Dated sources: KPI marks (ledger `at`) + typed daily reports (float/APK).
     * APK applies the same max(marks, typed) rule as the monthly score.
     */
    case 'bdo_range_report': {
      $u = require_auth(); require_perm($u, 'targets', 'v');
      $from = (string)($_GET['from'] ?? '');
      $to = (string)($_GET['to'] ?? '');
      if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) || $from > $to) {
        fail('Pick a valid date range');
      }
      $want = array();
      foreach (explode(',', (string)($_GET['kpis'] ?? '')) as $k) {
        $k = trim($k);
        if (in_array($k, array('served', 'float', 'visits', 'apk', 'activeness', 'reports'), true)) $want[$k] = true;
      }
      if (!$want) fail('Pick at least one KPI');
      $rows = array(); $bdoUsers = array();
      $bq = db()->query('SELECT username, name, working_days FROM users WHERE active = 1 AND role NOT IN ("superadmin","md","om") ORDER BY username');
      foreach ($bq->fetchAll() as $b) {
        $bdoUsers[$b['username']] = $b;
        $rows[$b['username']] = array('bdo' => $b['username'], 'name' => $b['name'],
          'served' => 0, 'float' => 0, 'visits' => 0, 'apkMarks' => 0, 'apkTyped' => 0, 'activeness' => 0,
          'reported' => 0, 'missed' => 0, 'late' => 0);
      }
      $lq = db()->prepare('SELECT bdo, kpi, COUNT(*) n FROM agent_month_kpi
                           WHERE DATE(at) BETWEEN ? AND ? GROUP BY bdo, kpi');
      $lq->execute(array($from, $to));
      $map = array('served' => 'served', 'visit' => 'visits', 'apk' => 'apkMarks', 'active' => 'activeness');
      foreach ($lq->fetchAll() as $r) {
        if (isset($rows[$r['bdo']], $map[$r['kpi']])) $rows[$r['bdo']][$map[$r['kpi']]] = (int)$r['n'];
      }
      $dq = db()->prepare('SELECT bdo, COALESCE(SUM(float_served),0) f, COALESCE(SUM(apk),0) a
                           FROM daily_reports WHERE report_date BETWEEN ? AND ? GROUP BY bdo');
      $dq->execute(array($from, $to));
      foreach ($dq->fetchAll() as $r) {
        if (!isset($rows[$r['bdo']])) continue;
        $rows[$r['bdo']]['float'] = (float)$r['f'];
        $rows[$r['bdo']]['apkTyped'] = (int)$r['a'];
      }
      $sq = db()->prepare('SELECT bdo, COALESCE(SUM(float_served),0) f FROM service_history
                           WHERE date <> "" AND date BETWEEN ? AND ? GROUP BY bdo');
      $sq->execute(array($from, $to));
      foreach ($sq->fetchAll() as $r) {
        if (isset($rows[$r['bdo']])) $rows[$r['bdo']]['float'] += (float)$r['f'];
      }

      /* Daily-report discipline: which working days he SENT a report and which
       * he MISSED (per his working-days config), plus how many arrived late. */
      if (isset($want['reports'])) {
        $sent = array(); /* bdo => set of report dates */
        $rq = db()->prepare('SELECT bdo, report_date, created_at FROM daily_reports WHERE report_date BETWEEN ? AND ?');
        $rq->execute(array($from, $to));
        foreach ($rq->fetchAll() as $r) {
          if (!isset($rows[$r['bdo']])) continue;
          $sent[$r['bdo']][$r['report_date']] = true;
          if (substr($r['created_at'], 0, 10) > $r['report_date']) $rows[$r['bdo']]['late']++;
        }
        $lastDay = min($to, date('Y-m-d')); /* no "missed" for days that have not happened */
        foreach ($bdoUsers as $uname => $bu) {
          $wd = working_days_for($bu);
          $reported = 0; $missed = 0;
          for ($d = strtotime($from); $d <= strtotime($lastDay); $d += 86400) {
            $day = date('Y-m-d', $d);
            $has = isset($sent[$uname][$day]);
            if ($has) $reported++;
            elseif (isset($wd[(int)date('N', $d)])) $missed++;
          }
          $rows[$uname]['reported'] = $reported;
          $rows[$uname]['missed'] = $missed;
        }
      }
      $out = array();
      foreach ($rows as $r) {
        $line = array('bdo' => $r['bdo'], 'name' => $r['name']);
        if (isset($want['served'])) $line['served'] = $r['served'];
        if (isset($want['float'])) $line['float'] = $r['float'];
        if (isset($want['visits'])) $line['visits'] = $r['visits'];
        if (isset($want['apk'])) $line['apk'] = max($r['apkMarks'], $r['apkTyped']);
        if (isset($want['activeness'])) $line['activeness'] = $r['activeness'];
        if (isset($want['reports'])) {
          $line['reported'] = $r['reported'];
          $line['missed'] = $r['missed'];
          $line['late'] = $r['late'];
        }
        $out[] = $line;
      }
      audit($u['id'], 'range_report', $from . '..' . $to . ' ' . implode(',', array_keys($want)));
      respond(array('from' => $from, 'to' => $to, 'kpis' => array_keys($want), 'rows' => $out));
    }

    /*
     * Reverse a KPI mark. A BDO may undo his OWN live mark (accidental click);
     * the OM (agents.edit) may reverse ANY mark. Only 'bdo'-source marks are
     * reversible - statuses that came from the uploaded file are changed by
     * re-uploading. The reversal is visible to everyone.
     */
    case 'kpi_unmark': {
      $u = require_auth();
      $isOM = can($u, 'agents', 'e');
      if (!$isOM && !can($u, 'mybase', 'e')) fail('No access', 403);
      $agentId = (int)bval('agentId');
      $kpi = (string)bval('kpi');
      if (!in_array($kpi, array('served', 'visit', 'apk', 'active'), true)) fail('Unknown KPI');
      $month = open_month();
      /* age computed IN SQL so the PHP and DB clocks can never disagree */
      $chk = db()->prepare('SELECT bdo, source, TIMESTAMPDIFF(SECOND, at, NOW()) AS age
                            FROM agent_month_kpi WHERE month = ? AND agent_id = ? AND kpi = ?');
      $chk->execute(array($month, $agentId, $kpi));
      $row = $chk->fetch();
      if (!$row) fail('Nothing to reverse', 404);
      if ($row['source'] !== 'bdo') fail('This status came from the uploaded file - re-upload to change it', 400);
      if (!$isOM && $row['bdo'] !== $u['username']) fail('You can only reverse your own marks', 403);
      /* A BDO gets a 6-HOUR window to correct his own wrong tap. After that only
       * the OM can return the agent's status (no time limit for the OM - the
       * reversal updates the BDO's score against his targets immediately). */
      if (!$isOM && (int)$row['age'] > 6 * 3600) {
        fail('Your 6-hour correction window has passed - ask your OM to reverse it', 403);
      }

      db()->prepare('DELETE FROM agent_month_kpi WHERE month = ? AND agent_id = ? AND kpi = ?')->execute(array($month, $agentId, $kpi));
      if ($kpi === 'served') {
        db()->prepare('DELETE FROM service_history WHERE month = ? AND agent_id = ? AND bdo = ? AND source = "bdo"')->execute(array($month, $agentId, $row['bdo']));
      }
      if ($kpi === 'active') {
        db()->prepare('UPDATE agents SET act_current = "INACTIVE" WHERE id = ? AND act_month = ?')->execute(array($agentId, $month));
      }
      audit($u['id'], 'kpi_unmark', $u['username'] . ' reversed ' . $kpi . ' agent=' . $agentId . ' (was ' . $row['bdo'] . ')');
      respond(array('ok' => true, 'kpi' => $kpi, 'reversedFrom' => $row['bdo']));
    }

    /* ================= WEEKLY UPLOAD (rows parsed in the browser) ================= */

    case 'upload_weekly': {
      $u = require_auth(); require_perm($u, 'upload', 'e');
      $rows = bval('rows', array());
      if (!is_array($rows) || !count($rows)) fail('No rows provided');
      $month = preg_match('/^\d{4}-\d{2}$/', (string)bval('month')) ? bval('month') : open_month();
      if (month_status($month) === 'CLOSED') fail('Month ' . $month . ' is closed');
      $week = trim((string)bval('week'));
      $globalBdo = strtolower(trim((string)bval('bdo')));

      $userByName = array(); $userByKey = array();
      foreach (db()->query('SELECT username, name, role FROM users')->fetchAll() as $r) {
        $userByKey[$r['username']] = $r;
        $userByName[strtolower($r['name'])] = $r['username'];
      }
      $created = array(); $bdos = array(); $served = 0; $agents = 0;

      $findAgent = db()->prepare('SELECT id FROM agents WHERE acc = ?');
      $insAgent = db()->prepare('INSERT INTO agents (acc, name, phone, branch, physical_location, partner) VALUES (?,?,?,?,?,?)');
      $updAgent = db()->prepare('UPDATE agents SET
          name = IF(? = "", name, ?), phone = IF(? = "", phone, ?), branch = IF(? = "", branch, ?),
          physical_location = IF(? = "", physical_location, ?), partner = ? WHERE id = ?');
      $insSvc = db()->prepare('INSERT INTO service_history
          (agent_id, bdo, month, week, date, time, odk, apk, float_served, activeness, sa_commission, served_status, source)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?, "weekly")');
      $priorityMode = bval('mode') === 'priority'; // OM seeding priority bases (agents + locations + BDO names)
      $kind = $priorityMode ? 'priority' : 'uploaded';
      $insBase = db()->prepare('INSERT IGNORE INTO base (month, bdo, agent_id, kind) VALUES (?,?,?,?)');
      $insUser = db()->prepare('INSERT INTO users (username, role, name, password_hash) VALUES (?, "bdo", ?, ?)');
      $insKpi = db()->prepare("INSERT IGNORE INTO agent_month_kpi (month, agent_id, kpi, bdo, source) VALUES (?,?,?,?, 'upload')");
      $getKpiOwner = db()->prepare('SELECT bdo FROM agent_month_kpi WHERE month = ? AND agent_id = ? AND kpi = "served"');
      $insFlag = db()->prepare('INSERT IGNORE INTO flags (month, agent_id, bdo, kpi, detail) VALUES (?,?,?,?,?)');
      $updAct = db()->prepare('UPDATE agents SET act_current = ?, act_prev = ?, act_month = ? WHERE id = ?');
      $flagged = 0;

      /* PASS 1: parse everything (needed for office snapshot totals). */
      $apkRequired = setting_get('apk_required_version', '2.0');
      $parsed = array();
      $stats = array('serving' => 0, 'float' => 0, 'visits' => 0, 'apk' => 0, 'waked' => 0, 'lost' => 0, 'withdraw' => 0);
      foreach ($rows as $raw) {
        $r = parse_weekly_row($raw, $month);
        if (!$r) continue;
        $r['act_cur'] = act_norm($r['activeness']);
        $r['act_prev'] = act_norm($r['activeness_prev']);
        $r['apk_yes'] = apk_is_yes($r['apk_raw'], $apkRequired);
        /* activeness credit = truly WAKED: inactive last month, active now */
        $r['waked'] = ($r['act_cur'] === 'ACTIVE' && $r['act_prev'] === 'INACTIVE');
        $r['lost'] = ($r['act_cur'] === 'INACTIVE' && $r['act_prev'] === 'ACTIVE');
        $parsed[] = $r;
        if ($r['served'] === 'SERVED') { $stats['serving']++; $stats['float'] += $r['float']; }
        if ($r['visit'] === 'YES') $stats['visits']++;
        if ($r['apk_yes']) $stats['apk']++;
        if ($r['waked']) $stats['waked']++;
        if ($r['lost']) $stats['lost']++;
        $stats['withdraw'] += $r['withdraw'];
      }
      if (!count($parsed)) fail('No valid agent rows found (need at least an Agent Account column)');
      $stats['net_active'] = $stats['waked'] - $stats['lost'];

      /* PASS 2: write agents, history, bases, ledger, flags. */
      foreach ($parsed as $r) {
        // resolve BDO: row column -> global choice -> unassigned; auto-create unknown
        $key = 'unassigned';
        $label = $r['bdo'] !== '' ? $r['bdo'] : $globalBdo;
        if ($label !== '') {
          $lk = strtolower($label);
          if (isset($userByName[$lk])) $key = $userByName[$lk];
          else {
            $slug = substr(preg_replace('/[^a-z0-9]/', '', $lk), 0, 40);
            if ($slug !== '') {
              if (!isset($userByKey[$slug])) {
                $insUser->execute(array($slug, $label, password_hash('imani123', PASSWORD_BCRYPT)));
                $userByKey[$slug] = array('username' => $slug);
                $created[] = $slug;
              }
              $key = $slug;
            }
          }
        }
        /* Positive results with no BDO named = the partner did it -> "partners". */
        $positive = ($r['served'] === 'SERVED' || $r['visit'] === 'YES' || $r['apk_yes'] || $r['waked']);
        if ($key === 'unassigned' && $positive) $key = 'partners';
        $bdos[$key] = true;

        $findAgent->execute(array($r['acc']));
        $found = $findAgent->fetch();
        if ($found) {
          $id = (int)$found['id'];
          $updAgent->execute(array($r['name'],$r['name'],$r['phone'],$r['phone'],$r['branch'],$r['branch'],$r['location'],$r['location'],$r['partner'],$id));
        } else {
          $insAgent->execute(array($r['acc'],$r['name'],$r['phone'],$r['branch'],$r['location'],$r['partner']));
          $id = (int)db()->lastInsertId();
        }
        /* activeness transition snapshot - drives the Inactive Agents panel */
        if ($r['act_cur'] !== '' || $r['act_prev'] !== '') $updAct->execute(array($r['act_cur'], $r['act_prev'], $month, $id));

        $agents++;
        if ($r['served'] === 'SERVED') $served++;
        $insSvc->execute(array($id, $key, $month, $week, date('Y-m-d'), date('H:i'),
                               $r['visit'], $r['apk_yes'] ? 'YES' : 'NO', $r['float'], $r['activeness'], $r['sa'], $r['served']));
        $insBase->execute(array($month, $key, $id, $kind));
        /* Ledger credits (BDO personal scores; first credit wins). */
        if ($r['served'] === 'SERVED') $insKpi->execute(array($month, $id, 'served', $key));
        if ($r['visit'] === 'YES') $insKpi->execute(array($month, $id, 'visit', $key));
        if ($r['apk_yes']) $insKpi->execute(array($month, $id, 'apk', $key));
        if ($r['waked']) $insKpi->execute(array($month, $id, 'active', $key));

        /* Cross-check: claimed served but the released file says NOT_SERVED. */
        if ($r['served'] === 'NOT_SERVED') {
          $getKpiOwner->execute(array($month, $id));
          $owner = $getKpiOwner->fetch();
          if ($owner && $owner['bdo'] !== 'partners' && $owner['bdo'] !== 'unassigned') {
            $insFlag->execute(array($month, $id, $owner['bdo'], 'served',
              'Marked served by ' . $owner['bdo'] . ' but performance file says NOT_SERVED (' . $r['acc'] . ')'));
            $flagged++;
          }
        }
      }

      /* OFFICE snapshot for the dashboard: main KPIs come from this file, not
       * from BDO manual marks. Re-uploading replaces the month's snapshot. */
      setting_set('month_stats_' . $month, json_encode($stats));

      audit($u['id'], 'weekly_upload', $month . ' rows=' . $agents . ' bdos=' . implode('/', array_keys($bdos)) . ($priorityMode ? ' [priority]' : '') . ' flags=' . $flagged);
      respond(array('ok' => true, 'month' => $month, 'rows' => $agents, 'served' => $served,
                    'bdos' => array_keys($bdos), 'createdBdos' => $created, 'flagged' => $flagged,
                    'priorityMode' => $priorityMode, 'stats' => $stats));
    }

    /* ================= TARGETS (typed by OM) ================= */

    case 'targets_get': {
      $u = require_auth(); require_perm($u, 'targets', 'v');
      $rows = db()->query('SELECT * FROM targets ORDER BY month DESC LIMIT 12')->fetchAll();
      respond($rows);
    }

    case 'targets_save': {
      $u = require_auth(); require_perm($u, 'targets', 'e');
      $month = (string)bval('month');
      if (!preg_match('/^\d{4}-\d{2}$/', $month)) fail('Provide month as YYYY-MM');
      /* weights: either all zero (plain average) or they must total 100 */
      $wsum = 0; $w = array();
      foreach (array_keys(office_kpi_defs()) as $col) { $w[$col] = (int)num(bval($col . '_w')); $wsum += $w[$col]; }
      if ($wsum !== 0 && $wsum !== 100) fail('KPI weights must add up to 100% (currently ' . $wsum . '%) - or leave all at 0 for a plain average');
      db()->prepare('INSERT INTO targets (month, serving_target, float_target, visits_target, apk_target, activeness_target, withdraw_target,
                       serving_w, float_w, visits_w, apk_w, activeness_w, withdraw_w)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE serving_target=VALUES(serving_target), float_target=VALUES(float_target),
                       visits_target=VALUES(visits_target), apk_target=VALUES(apk_target), activeness_target=VALUES(activeness_target),
                       withdraw_target=VALUES(withdraw_target), serving_w=VALUES(serving_w), float_w=VALUES(float_w),
                       visits_w=VALUES(visits_w), apk_w=VALUES(apk_w), activeness_w=VALUES(activeness_w), withdraw_w=VALUES(withdraw_w)')
          ->execute(array($month, (int)num(bval('serving')), (int)num(bval('float')), (int)num(bval('visits')),
                          (int)num(bval('apk')), (int)num(bval('activeness')), (int)num(bval('withdraw')),
                          $w['serving'], $w['float'], $w['visits'], $w['apk'], $w['activeness'], $w['withdraw']));
      audit($u['id'], 'targets_save', $month . ($wsum ? ' weighted' : ''));
      respond(array('ok' => true, 'month' => $month));
    }

    /* ================= PER-BDO TARGETS + WEIGHTED PERFORMANCE ================= */

    case 'bdo_targets_get': {
      $u = require_auth(); require_perm($u, 'targets', 'v');
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();
      $st = db()->prepare('SELECT * FROM bdo_targets WHERE month = ?');
      $st->execute(array($month));
      $rows = $st->fetchAll();
      $bdos = db()->query('SELECT username, name FROM users WHERE role = "bdo" AND active = 1 ORDER BY username')->fetchAll();
      respond(array('month' => $month, 'targets' => $rows, 'bdos' => $bdos));
    }

    /*
     * OM sets ONE BDO's monthly targets for every KPI plus the weight % of each.
     * Weights must add up to 100.
     */
    case 'bdo_targets_save': {
      $u = require_auth(); require_perm($u, 'targets', 'e');
      $month = (string)bval('month');
      if (!preg_match('/^\d{4}-\d{2}$/', $month)) fail('Provide month as YYYY-MM');
      $bdo = strtolower(trim((string)bval('bdo')));
      $bq = db()->prepare('SELECT 1 FROM users WHERE username = ?');
      $bq->execute(array($bdo));
      if ($bdo === '' || !$bq->fetch()) fail('Choose a BDO');
      $vals = array(); $wsum = 0;
      foreach (array_keys(kpi_defs()) as $col) {
        $vals[$col . '_target'] = (int)num(bval($col));
        $w = (int)num(bval($col . '_w'));
        $vals[$col . '_w'] = $w; $wsum += $w;
      }
      if ($wsum !== 100) fail('KPI weights must add up to 100% (currently ' . $wsum . '%)');
      db()->prepare('INSERT INTO bdo_targets (month, bdo, serving_target, float_target, visits_target, apk_target, activeness_target,
                       serving_w, float_w, visits_w, apk_w, activeness_w)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE serving_target=VALUES(serving_target), float_target=VALUES(float_target),
                       visits_target=VALUES(visits_target), apk_target=VALUES(apk_target), activeness_target=VALUES(activeness_target),
                       serving_w=VALUES(serving_w), float_w=VALUES(float_w), visits_w=VALUES(visits_w),
                       apk_w=VALUES(apk_w), activeness_w=VALUES(activeness_w)')
          ->execute(array($month, $bdo, $vals['serving_target'], $vals['float_target'], $vals['visits_target'],
                          $vals['apk_target'], $vals['activeness_target'], $vals['serving_w'], $vals['float_w'],
                          $vals['visits_w'], $vals['apk_w'], $vals['activeness_w']));
      audit($u['id'], 'bdo_targets_save', $month . ' ' . $bdo);
      respond(array('ok' => true));
    }

    /* Weighted scores for every BDO with targets in the month (OM/MD view). */
    case 'bdo_performance': {
      $u = require_auth(); require_perm($u, 'targets', 'v');
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();
      /* every active BDO, whether or not the OM has set his targets yet */
      $tq = db()->prepare('SELECT * FROM bdo_targets WHERE month = ?');
      $tq->execute(array($month));
      $targets = array();
      foreach ($tq->fetchAll() as $t) $targets[$t['bdo']] = $t;
      $bdos = db()->query('SELECT username, name, specialty FROM users WHERE role = "bdo" AND active = 1 ORDER BY username')->fetchAll();
      $out = array();
      foreach ($bdos as $b) {
        if (isset($targets[$b['username']])) {
          /* the activeness specialist is scored on activeness ONLY (waked + recruited) */
          $s = $b['specialty'] === 'activeness'
            ? bdo_score_specialist(bdo_actuals($month, $b['username']), $targets[$b['username']])
            : bdo_score(bdo_actuals($month, $b['username']), $targets[$b['username']]);
          $out[] = array('bdo' => $b['username'], 'name' => $b['name'], 'score' => $s['score'], 'flag' => $s['flag'], 'kpis' => $s['kpis'], 'hasTargets' => true);
        } else {
          $out[] = array('bdo' => $b['username'], 'name' => $b['name'], 'score' => null, 'flag' => 'none', 'kpis' => new stdClass(), 'hasTargets' => false);
        }
      }
      usort($out, function ($a, $b) {
        $as = $a['score'] === null ? -1 : $a['score'];
        $bs = $b['score'] === null ? -1 : $b['score'];
        if ($as !== $bs) return $bs - $as;
        return strcmp($a['name'], $b['name']);
      });
      respond(array('month' => $month, 'rows' => $out));
    }

    /* ================= DAILY BDO REPORTS ================= */

    /*
     * BDO types ONLY float + APK totals here. Serving, visits and activeness are
     * marked per-agent on the agent list (kpi_mark) - the ledger is the proof of
     * WHICH agent was handled by WHOM, and the next upload can flag mismatches.
     * (visited/waked columns stay for old rows; new saves store 0.)
     */
    case 'daily_report_save': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $date = (string)bval('date');
      if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) fail('Choose the date of the day');
      if ($date > date('Y-m-d')) fail('Cannot report a future date');
      if ($date < date('Y-m-d', strtotime('-2 days'))) fail('You can only report today or up to 2 days back');
      $month = substr($date, 0, 7);
      if (month_status($month) === 'CLOSED') fail('Month ' . $month . ' is closed');
      db()->prepare('INSERT INTO daily_reports (bdo, report_date, month, float_served, visited, waked, apk, note)
                     VALUES (?,?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE float_served=VALUES(float_served), visited=VALUES(visited),
                       waked=VALUES(waked), apk=VALUES(apk), note=VALUES(note)')
          ->execute(array($u['username'], $date, $month, (int)num(bval('float')), (int)num(bval('visited')),
                          (int)num(bval('waked')), (int)num(bval('apk')), trim((string)bval('note'))));
      audit($u['id'], 'daily_report', $u['username'] . ' ' . $date);
      respond(array('ok' => true, 'date' => $date));
    }

    /* Everyone sees all BDOs' daily reports + late/missing status per working day. */
    case 'daily_reports_get': {
      $u = require_auth();
      if (!can($u, 'reports', 'v') && !can($u, 'mybase', 'v')) fail('No access', 403);
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();
      $st = db()->prepare('SELECT * FROM daily_reports WHERE month = ? ORDER BY report_date, bdo');
      $st->execute(array($month));
      $reports = array();
      foreach ($st->fetchAll() as $r) {
        $late = substr($r['created_at'], 0, 10) > $r['report_date']; // after 00:00 next day = LATE
        $reports[] = array('bdo' => $r['bdo'], 'date' => $r['report_date'], 'float' => (float)$r['float_served'],
                           'visited' => (int)$r['visited'], 'waked' => (int)$r['waked'], 'apk' => (int)$r['apk'],
                           'note' => $r['note'], 'late' => $late);
      }
      $bdoRows = db()->query('SELECT username, name, working_days FROM users WHERE role = "bdo" AND active = 1 ORDER BY username')->fetchAll();
      $bdos = array();
      foreach ($bdoRows as $b) {
        $wd = working_days_for($b);
        $bdos[] = array('username' => $b['username'], 'name' => $b['name'], 'workingDays' => array_keys($wd));
      }
      respond(array('month' => $month, 'today' => date('Y-m-d'), 'reports' => $reports, 'bdos' => $bdos,
                    'globalWorkingDays' => setting_get('working_days', '1,2,3,4,5,6')));
    }

    /* OM: default working days (Mon..Sat) + per-BDO override (e.g. Sunday man). */
    case 'working_days_save': {
      $u = require_auth(); require_perm($u, 'reports', 'e');
      $global = trim((string)bval('global'));
      if ($global !== '') {
        $days = array_filter(array_map('intval', explode(',', $global)), function ($d) { return $d >= 1 && $d <= 7; });
        if (!count($days)) fail('Pick at least one working day');
        setting_set('working_days', implode(',', $days));
      }
      $per = bval('perBdo', array());
      if (is_array($per)) {
        $up = db()->prepare('UPDATE users SET working_days = ? WHERE username = ? AND role = "bdo"');
        foreach ($per as $bdo => $csv) {
          $days = array_filter(array_map('intval', explode(',', (string)$csv)), function ($d) { return $d >= 1 && $d <= 7; });
          $up->execute(array(implode(',', $days), strtolower((string)$bdo)));
        }
      }
      audit($u['id'], 'working_days', 'updated');
      respond(array('ok' => true));
    }

    /* ================= OM BROADCAST MESSAGES ================= */

    case 'message_send': {
      $u = require_auth(); require_perm($u, 'reports', 'e');
      $body = trim((string)bval('body'));
      if ($body === '' || mb_strlen($body) > 500) fail('Message must be 1-500 characters');
      /* empty to = everyone; a username = only that member sees it */
      $to = strtolower(trim((string)bval('to')));
      if ($to !== '') {
        $ck = db()->prepare('SELECT 1 FROM users WHERE username = ? AND active = 1');
        $ck->execute(array($to));
        if (!$ck->fetch()) fail('Unknown member: ' . $to);
      }
      db()->prepare('INSERT INTO messages (from_user, to_user, body) VALUES (?,?,?)')->execute(array($u['username'], $to, $body));
      audit($u['id'], 'message_send', ($to !== '' ? 'to ' . $to . ': ' : '') . mb_substr($body, 0, 80));
      respond(array('ok' => true));
    }

    /* Sender manages his own messages: list with ids, edit, delete. */
    case 'messages_sent': {
      $u = require_auth(); require_perm($u, 'reports', 'e');
      $st = db()->prepare('SELECT id, to_user, body, at FROM messages WHERE from_user = ? ORDER BY id DESC LIMIT 20');
      $st->execute(array($u['username']));
      respond($st->fetchAll());
    }

    case 'message_update': {
      $u = require_auth(); require_perm($u, 'reports', 'e');
      $id = (int)bval('id');
      $body = trim((string)bval('body'));
      if ($body === '' || mb_strlen($body) > 500) fail('Message must be 1-500 characters');
      $st = db()->prepare('SELECT from_user FROM messages WHERE id = ?');
      $st->execute(array($id));
      $m = $st->fetch();
      if (!$m) fail('Message not found', 404);
      if ($m['from_user'] !== $u['username'] && $u['role'] !== 'superadmin') fail('You can only edit your own messages', 403);
      db()->prepare('UPDATE messages SET body = ? WHERE id = ?')->execute(array($body, $id));
      audit($u['id'], 'message_edit', 'id=' . $id);
      respond(array('ok' => true));
    }

    case 'message_delete': {
      $u = require_auth(); require_perm($u, 'reports', 'e');
      $id = (int)bval('id');
      $st = db()->prepare('SELECT from_user FROM messages WHERE id = ?');
      $st->execute(array($id));
      $m = $st->fetch();
      if (!$m) fail('Message not found', 404);
      if ($m['from_user'] !== $u['username'] && $u['role'] !== 'superadmin') fail('You can only delete your own messages', 403);
      db()->prepare('DELETE FROM messages WHERE id = ?')->execute(array($id));
      audit($u['id'], 'message_delete', 'id=' . $id);
      respond(array('ok' => true));
    }

    /* Lightweight member list so the OM can pick a message recipient. */
    case 'members_list': {
      $u = require_auth(); require_perm($u, 'reports', 'e');
      $rows = db()->query('SELECT username, name FROM users WHERE active = 1 ORDER BY username')->fetchAll();
      respond($rows);
    }

    case 'messages_get': {
      $u = require_auth();
      $st = db()->prepare('SELECT from_user, body, at FROM messages WHERE to_user = "" OR to_user = ? ORDER BY id DESC LIMIT 10');
      $st->execute(array($u['username']));
      $rows = $st->fetchAll();
      respond($rows);
    }

    /* ================= FLOAT SHORTAGE (management-only visibility) ================= */

    case 'shortage_save': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $amount = (int)num(bval('amount'));
      $reason = trim((string)bval('reason'));
      if ($amount <= 0 || $reason === '') fail('Enter the amount and the reason');
      db()->prepare('INSERT INTO float_shortages (bdo, month, amount, reason, recover_by, notified)
                     VALUES (?,?,?,?,?,?)')
          ->execute(array($u['username'], open_month(), $amount, $reason,
                          trim((string)bval('recoverBy')), bval('notified') ? 1 : 0));
      audit($u['id'], 'float_shortage', $u['username'] . ' ' . $amount);
      respond(array('ok' => true));
    }

    case 'shortages_get': {
      $u = require_auth(); require_perm($u, 'targets', 'v'); // management only (om/md/superadmin)
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();
      $st = db()->prepare('SELECT bdo, amount, reason, recover_by, notified, at FROM float_shortages WHERE month = ? ORDER BY id DESC');
      $st->execute(array($month));
      respond($st->fetchAll());
    }

    /* ================= FLAGS (upload cross-check) & RANKINGS ================= */

    /* Visible to ALL members; ranked most-flagged first. */
    case 'flags_get': {
      $u = require_auth();
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();
      $st = db()->prepare('SELECT f.bdo, COUNT(*) n FROM flags f WHERE f.month = ? GROUP BY f.bdo ORDER BY n DESC');
      $st->execute(array($month));
      $rank = $st->fetchAll();
      $det = db()->prepare('SELECT f.bdo, f.detail, f.at, a.name agent_name, a.acc FROM flags f
                            LEFT JOIN agents a ON a.id = f.agent_id WHERE f.month = ? ORDER BY f.id DESC LIMIT 100');
      $det->execute(array($month));
      respond(array('month' => $month, 'rank' => $rank, 'flags' => $det->fetchAll()));
    }

    /* BDO ranking for a day / ISO week / month: unique served, visits, activeness, APK. */
    case 'rank_get': {
      $u = require_auth();
      $period = (string)($_GET['period'] ?? 'daily');
      $date = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($_GET['date'] ?? '')) ? $_GET['date'] : date('Y-m-d');
      if ($period === 'weekly') {
        $ts = strtotime($date);
        $from = date('Y-m-d', strtotime('monday this week', $ts));
        $to = date('Y-m-d', strtotime('sunday this week', $ts));
      } elseif ($period === 'monthly') {
        $from = substr($date, 0, 7) . '-01';
        $to = date('Y-m-t', strtotime($from));
      } else { $from = $date; $to = $date; }
      $st = db()->prepare('SELECT bdo, kpi, COUNT(*) n FROM agent_month_kpi
                           WHERE DATE(at) BETWEEN ? AND ? AND bdo NOT IN ("partners","unassigned")
                           GROUP BY bdo, kpi');
      $st->execute(array($from, $to));
      $byBdo = array(); $hasApk = false;
      foreach ($st->fetchAll() as $r) {
        if (!isset($byBdo[$r['bdo']])) $byBdo[$r['bdo']] = array('bdo' => $r['bdo'], 'served' => 0, 'visit' => 0, 'active' => 0, 'apk' => 0);
        $byBdo[$r['bdo']][$r['kpi']] = (int)$r['n'];
        if ($r['kpi'] === 'apk') $hasApk = true;
      }
      $names = array();
      foreach (db()->query('SELECT username, name FROM users')->fetchAll() as $n) $names[$n['username']] = $n['name'];
      $rows = array_values($byBdo);
      foreach ($rows as &$r2) { $r2['name'] = isset($names[$r2['bdo']]) ? $names[$r2['bdo']] : $r2['bdo']; }
      unset($r2);
      usort($rows, function ($a, $b) { return ($b['served'] - $a['served']) ?: ($b['visit'] - $a['visit']); });
      respond(array('period' => $period, 'from' => $from, 'to' => $to, 'hasApk' => $hasApk, 'rows' => $rows));
    }

    /* ================= PHYSICAL LOCATION TOOLS ================= */

    case 'agent_location_set': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $agentId = (int)bval('agentId');
      $loc = trim((string)bval('location'));
      if ($loc === '') fail('Type the physical location');
      $r = db()->prepare('UPDATE agents SET physical_location = ? WHERE id = ?');
      $r->execute(array($loc, $agentId));
      audit($u['id'], 'location_set', 'agent=' . $agentId);
      respond(array('ok' => true));
    }

    /* OM/MD: every agent with a known physical location (any time, all history). */
    case 'agents_location_export': {
      $u = require_auth(); require_perm($u, 'agents', 'v');
      $rows = db()->query('SELECT a.acc, a.name, a.phone, a.branch, a.station, a.physical_location,
                             (SELECT k.bdo FROM agent_month_kpi k WHERE k.agent_id = a.id AND k.kpi = "served"
                              ORDER BY k.at DESC LIMIT 1) last_served_by,
                             (SELECT MAX(k.at) FROM agent_month_kpi k WHERE k.agent_id = a.id AND k.kpi = "served") last_served_at
                           FROM agents a WHERE a.physical_location <> "" ORDER BY a.branch, a.name')->fetchAll();
      respond(array('count' => count($rows), 'items' => $rows));
    }

    /* ================= COMMISSION ================= */

    case 'commission_upload': {
      $u = require_auth(); require_perm($u, 'commission', 'e');
      $month = (string)bval('month');
      if (!preg_match('/^\d{4}-\d{2}$/', $month)) fail('Provide month as YYYY-MM');
      if (month_status($month) === 'CLOSED') fail('Month ' . $month . ' is already closed');
      $rows = bval('rows', array());
      $parsed = array();
      foreach ((array)$rows as $raw) { $p = parse_commission_row($raw); if ($p) $parsed[] = $p; }
      if (!count($parsed)) fail('No valid rows (need SA Commission and/or Served Status columns)');
      db()->prepare('DELETE FROM commission_rows WHERE month = ?')->execute(array($month));
      $ins = db()->prepare('INSERT INTO commission_rows (month, acc, name, sa_commission, served_status) VALUES (?,?,?,?,?)');
      foreach ($parsed as $p) $ins->execute(array($month, $p['acc'], $p['name'], $p['sa'], $p['served']));
      audit($u['id'], 'commission_upload', $month . ' rows=' . count($parsed));
      respond(array('ok' => true, 'month' => $month, 'rows' => count($parsed)));
    }

    case 'commission_get': {
      $u = require_auth(); require_perm($u, 'commission', 'v');
      $month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? $_GET['month'] : open_month();
      $cnt = db()->prepare('SELECT COUNT(*) c, SUM(served_status="SERVED") s FROM commission_rows WHERE month = ?');
      $cnt->execute(array($month));
      $c = $cnt->fetch();
      $calc = db()->prepare('SELECT * FROM commission_calc WHERE month = ?');
      $calc->execute(array($month));
      $saved = $calc->fetch() ?: null;

      // suggested achievement = the office's REAL (weighted) attainment
      $oa = office_attainment($month);
      $ach = $oa['achievement'];

      respond(array('month' => $month, 'status' => month_status($month),
                    'uploadedRows' => (int)$c['c'], 'servedRows' => (int)$c['s'],
                    'suggestedAchievement' => $ach, 'saved' => $saved));
    }

    case 'commission_calc': {
      $u = require_auth(); require_perm($u, 'commission', 'e');
      $month = (string)bval('month');
      if (!preg_match('/^\d{4}-\d{2}$/', $month)) fail('Provide month as YYYY-MM');
      $st = db()->prepare('SELECT COUNT(*) c, COALESCE(SUM(sa_commission),0) t FROM commission_rows WHERE month = ? AND served_status = "SERVED"');
      $st->execute(array($month));
      $r = $st->fetch();
      if (!(int)$r['c']) fail('Upload the commission file for ' . $month . ' first');
      $achIn = bval('achievement', null);
      $ach = ($achIn !== null && $achIn !== '') ? (float)$achIn : 0.0;
      $total = (float)$r['t'];
      $fixed = $total * 0.30;
      $variablePool = $total * 0.70;
      $release = release_for($ach);
      $variablePaid = $variablePool * $release;
      $final = $fixed + $variablePaid;
      db()->prepare('INSERT INTO commission_calc (month, served_count, total, fixed_pool, variable_pool, achievement, release_pct, variable_paid, final_amount)
                     VALUES (?,?,?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE served_count=VALUES(served_count), total=VALUES(total), fixed_pool=VALUES(fixed_pool),
                       variable_pool=VALUES(variable_pool), achievement=VALUES(achievement), release_pct=VALUES(release_pct),
                       variable_paid=VALUES(variable_paid), final_amount=VALUES(final_amount)')
          ->execute(array($month, (int)$r['c'], $total, $fixed, $variablePool, $ach, $release, $variablePaid, $final));
      audit($u['id'], 'commission_calc', $month . ' ach=' . $ach . ' final=' . round($final));
      respond(array('ok' => true, 'month' => $month, 'calc' => array(
        'servedCount' => (int)$r['c'], 'total' => $total, 'fixedPool' => $fixed, 'variablePool' => $variablePool,
        'achievement' => $ach, 'releasePct' => $release, 'variablePaid' => $variablePaid, 'final' => $final,
      )));
    }

    case 'health': {
      db();
      respond(array('ok' => true, 'driver' => 'mysql', 'php' => PHP_VERSION));
    }

    default:
      fail('Unknown action', 404);
  }
} catch (PDOException $e) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(array('error' => 'Database error. Check config.local.php and that the database exists.'));
} catch (Exception $e) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(array('error' => 'Server error. Please try again.'));
}
