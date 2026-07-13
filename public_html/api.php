<?php
/* IMANI SUPERDEALER - JSON API (single router). All requests: api.php?action=... */
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/helpers.php';

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
      if ($u && (int)$u['locked_until'] > time()) fail('Account temporarily locked after too many failed attempts. Try again later.', 429);
      if (!$u || !(int)$u['active'] || !password_verify($password, $u['password_hash'])) {
        if ($u) {
          $f = (int)$u['failed'] + 1;
          $lock = $f >= 6 ? time() + 900 : 0;
          db()->prepare('UPDATE users SET failed = ?, locked_until = ? WHERE id = ?')->execute(array($f, $lock, $u['id']));
        }
        fail('Invalid username or password', 401);
      }
      db()->prepare('UPDATE users SET failed = 0, locked_until = 0 WHERE id = ?')->execute(array($u['id']));
      session_regenerate_id(true);
      $_SESSION['uid'] = (int)$u['id'];
      audit($u['id'], 'login', $u['username']);
      respond(array(
        'user' => array('id'=>(int)$u['id'], 'username'=>$u['username'], 'role'=>$u['role'], 'name'=>$u['name']),
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
        'user' => array('id'=>(int)$u['id'], 'username'=>$u['username'], 'role'=>$u['role'], 'name'=>$u['name']),
        'perms' => perms_for_role($u['role']),
      ));
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
      $rows = db()->query('SELECT id, username, role, name, station, active FROM users ORDER BY id')->fetchAll();
      respond($rows);
    }

    case 'admin_user_add': {
      $u = require_auth(); require_perm($u, 'admin', 'e');
      $username = strtolower(trim((string)bval('username')));
      $name = trim((string)bval('name'));
      $role = trim((string)bval('role'));
      $password = (string)bval('password');
      if ($username === '' || $name === '') fail('Username and full name are required');
      if (strlen($password) < 6) fail('Password must be at least 6 characters');
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
      if (!empty($b['password'])) {
        if (strlen((string)$b['password']) < 6) fail('Password must be at least 6 characters');
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
      $st = db()->prepare('SELECT
          COUNT(DISTINCT CASE WHEN served_status="SERVED" THEN agent_id END) served,
          COALESCE(SUM(float_served),0) float_sum,
          SUM(odk="YES") visits,
          SUM(apk="YES") apk,
          COUNT(DISTINCT CASE WHEN activeness LIKE "Active%" THEN agent_id END) active
        FROM service_history WHERE month = ?');
      $st->execute(array($month));
      $a = $st->fetch();

      $tg = db()->prepare('SELECT * FROM targets WHERE month = ?');
      $tg->execute(array($month));
      $t = $tg->fetch();

      $att = array(); $sum = 0; $nn = 0;
      $pairs = array(
        'serving' => array((int)$a['served'], $t ? (int)$t['serving_target'] : 0),
        'float' => array((float)$a['float_sum'], $t ? (int)$t['float_target'] : 0),
        'visits' => array((int)$a['visits'], $t ? (int)$t['visits_target'] : 0),
        'apk' => array((int)$a['apk'], $t ? (int)$t['apk_target'] : 0),
        'activeness' => array((int)$a['active'], $t ? (int)$t['activeness_target'] : 0),
      );
      foreach ($pairs as $k => $p) {
        $pct = $p[1] > 0 ? min(100, round($p[0] / $p[1] * 100)) : null;
        $att[$k] = array('actual' => $p[0], 'target' => $p[1], 'pct' => $pct);
        if ($pct !== null) { $sum += $pct; $nn++; }
      }
      $achievement = $nn ? round($sum / $nn) : null;

      respond(array(
        'month' => $month, 'status' => month_status($month), 'openMonth' => open_month(),
        'totalAgents' => $tot, 'attainment' => $att, 'achievement' => $achievement,
      ));
    }

    /* ================= AGENTS ================= */

    case 'agents': {
      $u = require_auth(); require_perm($u, 'agents', 'v');
      $search = trim((string)($_GET['search'] ?? ''));
      $page = max(1, (int)($_GET['page'] ?? 1));
      $limit = 50; $off = ($page - 1) * $limit;
      $where = ''; $vals = array();
      if ($search !== '') {
        $where = 'WHERE name LIKE ? OR acc LIKE ? OR phone LIKE ? OR branch LIKE ?';
        $s = '%' . $search . '%'; $vals = array($s,$s,$s,$s);
      }
      $tot = db()->prepare("SELECT COUNT(*) c FROM agents $where");
      $tot->execute($vals);
      $total = (int)$tot->fetch()['c'];
      $st = db()->prepare("SELECT * FROM agents $where ORDER BY name LIMIT $limit OFFSET $off");
      $st->execute($vals);
      respond(array('items' => $st->fetchAll(), 'total' => $total, 'page' => $page, 'pages' => max(1, (int)ceil($total / $limit))));
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
        $q = db()->prepare("SELECT id, acc, name, phone, branch, physical_location FROM agents WHERE id IN ($in)");
        $q->execute($ids);
        $agents = $q->fetchAll();
      }
      $ever = array();
      foreach (db()->query('SELECT DISTINCT agent_id FROM service_history WHERE served_status = "SERVED"')->fetchAll() as $r) $ever[$r['agent_id']] = true;
      $sv = db()->prepare('SELECT DISTINCT agent_id FROM service_history WHERE month = ? AND bdo = ? AND served_status = "SERVED"');
      $sv->execute(array($month, $bdo));
      $servedNow = array();
      foreach ($sv->fetchAll() as $r) $servedNow[$r['agent_id']] = true;

      foreach ($agents as &$a) {
        $id = (int)$a['id'];
        $a['level'] = isset($prio[$id]) ? 'priority' : (isset($ever[$id]) ? 'new' : 'never');
        $a['servedThisMonth'] = isset($servedNow[$id]);
      }
      unset($a);
      $order = array('priority'=>0,'new'=>1,'never'=>2);
      usort($agents, function ($x, $y) use ($order) {
        if ($order[$x['level']] !== $order[$y['level']]) return $order[$x['level']] - $order[$y['level']];
        return strcmp($x['name'], $y['name']);
      });

      respond(array(
        'bdo' => $bdo, 'month' => $month, 'monthStatus' => month_status($month),
        'counts' => array('priority' => count($prio), 'newAgents' => count(array_diff_key($uploaded, $prio)), 'total' => count($ids), 'served' => count($servedNow)),
        'agents' => $agents,
      ));
    }

    case 'serve': {
      $u = require_auth(); require_perm($u, 'mybase', 'e');
      $agentId = (int)bval('agentId');
      $month = open_month(); // serving always goes into the currently OPEN month
      $ag = db()->prepare('SELECT * FROM agents WHERE id = ?');
      $ag->execute(array($agentId));
      if (!$ag->fetch()) fail('Agent not found', 404);
      $bdo = $u['username'];
      db()->prepare('INSERT INTO service_history (agent_id, bdo, month, date, time, odk, apk, activeness, served_status, source)
                     VALUES (?,?,?,?,?,?,?,?, "SERVED", "bdo")')
          ->execute(array($agentId, $bdo, $month, date('Y-m-d'), date('H:i'),
                          bval('odk') === 'YES' ? 'YES' : 'NO', bval('apk') === 'YES' ? 'YES' : 'NO', 'Active'));
      db()->prepare('INSERT IGNORE INTO base (month, bdo, agent_id, kind) VALUES (?,?,?, "uploaded")')->execute(array($month, $bdo, $agentId));
      audit($u['id'], 'serve', $bdo . ' agent=' . $agentId . ' ' . $month);
      respond(array('ok' => true, 'month' => $month));
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
      $insBase = db()->prepare('INSERT IGNORE INTO base (month, bdo, agent_id, kind) VALUES (?,?,?, "uploaded")');
      $insUser = db()->prepare('INSERT INTO users (username, role, name, password_hash) VALUES (?, "bdo", ?, ?)');

      foreach ($rows as $raw) {
        $r = parse_weekly_row($raw);
        if (!$r) continue;

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
        $agents++;
        if ($r['served'] === 'SERVED') $served++;
        $insSvc->execute(array($id, $key, $month, $week, date('Y-m-d'), date('H:i'),
                               $r['visit'], $r['apk'], $r['float'], $r['activeness'], $r['sa'], $r['served']));
        $insBase->execute(array($month, $key, $id));
      }
      audit($u['id'], 'weekly_upload', $month . ' rows=' . $agents . ' bdos=' . implode('/', array_keys($bdos)));
      respond(array('ok' => true, 'month' => $month, 'rows' => $agents, 'served' => $served,
                    'bdos' => array_keys($bdos), 'createdBdos' => $created));
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
      db()->prepare('INSERT INTO targets (month, serving_target, float_target, visits_target, apk_target, activeness_target)
                     VALUES (?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE serving_target=VALUES(serving_target), float_target=VALUES(float_target),
                       visits_target=VALUES(visits_target), apk_target=VALUES(apk_target), activeness_target=VALUES(activeness_target)')
          ->execute(array($month, (int)num(bval('serving')), (int)num(bval('float')), (int)num(bval('visits')),
                          (int)num(bval('apk')), (int)num(bval('activeness'))));
      audit($u['id'], 'targets_save', $month);
      respond(array('ok' => true, 'month' => $month));
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

      // suggested achievement from typed targets vs actuals (same math as dashboard)
      $ach = null;
      $tg = db()->prepare('SELECT * FROM targets WHERE month = ?');
      $tg->execute(array($month));
      if ($t = $tg->fetch()) {
        $st = db()->prepare('SELECT
            COUNT(DISTINCT CASE WHEN served_status="SERVED" THEN agent_id END) served,
            COALESCE(SUM(float_served),0) f, SUM(odk="YES") v, SUM(apk="YES") ap,
            COUNT(DISTINCT CASE WHEN activeness LIKE "Active%" THEN agent_id END) act
          FROM service_history WHERE month = ?');
        $st->execute(array($month));
        $a = $st->fetch();
        $sum = 0; $nn = 0;
        foreach (array(array($a['served'],$t['serving_target']), array($a['f'],$t['float_target']),
                       array($a['v'],$t['visits_target']), array($a['ap'],$t['apk_target']),
                       array($a['act'],$t['activeness_target'])) as $p) {
          if ((int)$p[1] > 0) { $sum += min(100, round($p[0] / $p[1] * 100)); $nn++; }
        }
        if ($nn) $ach = round($sum / $nn);
      }

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
