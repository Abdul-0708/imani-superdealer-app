<?php
/* Database: PDO connection + one-time schema creation + seed. */

function cfg() {
  static $cfg = null;
  if ($cfg === null) {
    $local = __DIR__ . '/config.local.php';
    $cfg = file_exists($local) ? require $local : require __DIR__ . '/config.sample.php';
    // Environment variables override (useful for local testing / CI)
    foreach (array('db_host'=>'DB_HOST','db_port'=>'DB_PORT','db_name'=>'DB_NAME','db_user'=>'DB_USER','db_pass'=>'DB_PASS') as $k=>$env) {
      $v = getenv($env);
      if ($v !== false && $v !== '') $cfg[$k] = $v;
    }
  }
  return $cfg;
}

function db() {
  static $pdo = null;
  if ($pdo === null) {
    $c = cfg();
    $dsn = 'mysql:host=' . $c['db_host'] . ';port=' . $c['db_port'] . ';dbname=' . $c['db_name'] . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], array(
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ));
    ensure_schema($pdo);
  }
  return $pdo;
}

function ensure_schema($pdo) {
  try {
    $pdo->query('SELECT 1 FROM app_settings LIMIT 1');
    upgrade_schema($pdo); // schema exists - apply any pending upgrades
    return;
  } catch (Exception $e) { /* create below */ }

  $pdo->exec("
  CREATE TABLE IF NOT EXISTS app_settings (
    name VARCHAR(64) PRIMARY KEY,
    value MEDIUMTEXT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(32) PRIMARY KEY,
    builtin TINYINT(1) NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    station VARCHAR(64) NOT NULL DEFAULT '',
    active TINYINT(1) NOT NULL DEFAULT 1,
    failed INT NOT NULL DEFAULT 0,
    locked_until INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS permissions (
    role VARCHAR(32) NOT NULL,
    module VARCHAR(32) NOT NULL,
    v TINYINT(1) NOT NULL DEFAULT 0,
    e TINYINT(1) NOT NULL DEFAULT 0,
    d TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (role, module)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    acc VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(191) NOT NULL DEFAULT '',
    phone VARCHAR(32) NOT NULL DEFAULT '',
    branch VARCHAR(128) NOT NULL DEFAULT '',
    station VARCHAR(64) NOT NULL DEFAULT '',
    physical_location VARCHAR(255) NOT NULL DEFAULT '',
    partner TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS service_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    bdo VARCHAR(64) NOT NULL,
    month CHAR(7) NOT NULL,
    week VARCHAR(12) NOT NULL DEFAULT '',
    date VARCHAR(10) NOT NULL DEFAULT '',
    time VARCHAR(8) NOT NULL DEFAULT '',
    odk VARCHAR(3) NOT NULL DEFAULT 'NO',
    apk VARCHAR(3) NOT NULL DEFAULT 'NO',
    float_served BIGINT NOT NULL DEFAULT 0,
    activeness VARCHAR(32) NOT NULL DEFAULT '',
    sa_commission BIGINT NOT NULL DEFAULT 0,
    served_status VARCHAR(12) NOT NULL DEFAULT 'NOT_SERVED',
    source VARCHAR(16) NOT NULL DEFAULT 'weekly',
    INDEX idx_svc_month_bdo (month, bdo),
    INDEX idx_svc_agent (agent_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS base (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month CHAR(7) NOT NULL,
    bdo VARCHAR(64) NOT NULL,
    agent_id INT NOT NULL,
    kind VARCHAR(10) NOT NULL,
    UNIQUE KEY uq_base (month, bdo, agent_id, kind)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS targets (
    month CHAR(7) PRIMARY KEY,
    serving_target BIGINT NOT NULL DEFAULT 0,
    float_target BIGINT NOT NULL DEFAULT 0,
    visits_target BIGINT NOT NULL DEFAULT 0,
    apk_target BIGINT NOT NULL DEFAULT 0,
    activeness_target BIGINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS months (
    month CHAR(7) PRIMARY KEY,
    status VARCHAR(12) NOT NULL DEFAULT 'OPEN',
    opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS commission_rows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month CHAR(7) NOT NULL,
    acc VARCHAR(64) NOT NULL DEFAULT '',
    name VARCHAR(191) NOT NULL DEFAULT '',
    sa_commission BIGINT NOT NULL DEFAULT 0,
    served_status VARCHAR(12) NOT NULL DEFAULT 'NOT_SERVED',
    INDEX idx_cr_month (month)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS commission_calc (
    month CHAR(7) PRIMARY KEY,
    served_count INT NOT NULL DEFAULT 0,
    total DOUBLE NOT NULL DEFAULT 0,
    fixed_pool DOUBLE NOT NULL DEFAULT 0,
    variable_pool DOUBLE NOT NULL DEFAULT 0,
    achievement DOUBLE NOT NULL DEFAULT 0,
    release_pct DOUBLE NOT NULL DEFAULT 0,
    variable_paid DOUBLE NOT NULL DEFAULT 0,
    final_amount DOUBLE NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NULL,
    action VARCHAR(64) NOT NULL,
    detail VARCHAR(512) NOT NULL DEFAULT ''
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ");

  $pdo->exec(schema_v2_ddl());
  $pdo->exec(schema_v3_ddl());
  try { $pdo->exec('ALTER TABLE users ADD COLUMN working_days VARCHAR(16) NOT NULL DEFAULT ""'); } catch (Exception $e) { /* exists */ }
  seed($pdo);
}

/*
 * Agent-month KPI ledger + per-BDO weighted targets (schema v2).
 * agent_month_kpi: ONE row per agent+KPI+month - the first BDO to do a KPI owns
 * the credit, and the unique key blocks every other BDO from repeating it.
 */
function schema_v2_ddl() {
  return "
  CREATE TABLE IF NOT EXISTS agent_month_kpi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month CHAR(7) NOT NULL,
    agent_id INT NOT NULL,
    kpi VARCHAR(12) NOT NULL,
    bdo VARCHAR(64) NOT NULL,
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_amk (month, agent_id, kpi),
    INDEX idx_amk_bdo (month, bdo, kpi)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS bdo_targets (
    month CHAR(7) NOT NULL,
    bdo VARCHAR(64) NOT NULL,
    serving_target BIGINT NOT NULL DEFAULT 0,
    float_target BIGINT NOT NULL DEFAULT 0,
    visits_target BIGINT NOT NULL DEFAULT 0,
    apk_target BIGINT NOT NULL DEFAULT 0,
    activeness_target BIGINT NOT NULL DEFAULT 0,
    serving_w INT NOT NULL DEFAULT 0,
    float_w INT NOT NULL DEFAULT 0,
    visits_w INT NOT NULL DEFAULT 0,
    apk_w INT NOT NULL DEFAULT 0,
    activeness_w INT NOT NULL DEFAULT 0,
    PRIMARY KEY (month, bdo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ";
}

/*
 * v3: daily BDO reports, upload-vs-ledger flags, OM broadcast messages,
 * confidential float shortages, working days, per-user working-day override.
 */
function schema_v3_ddl() {
  return "
  CREATE TABLE IF NOT EXISTS daily_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bdo VARCHAR(64) NOT NULL,
    report_date DATE NOT NULL,
    month CHAR(7) NOT NULL,
    float_served BIGINT NOT NULL DEFAULT 0,
    visited INT NOT NULL DEFAULT 0,
    waked INT NOT NULL DEFAULT 0,
    apk INT NOT NULL DEFAULT 0,
    note VARCHAR(255) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_daily (bdo, report_date),
    INDEX idx_daily_month (month)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month CHAR(7) NOT NULL,
    agent_id INT NOT NULL,
    bdo VARCHAR(64) NOT NULL,
    kpi VARCHAR(12) NOT NULL DEFAULT 'served',
    detail VARCHAR(255) NOT NULL DEFAULT '',
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_flag (month, agent_id, bdo, kpi),
    INDEX idx_flags_month (month)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user VARCHAR(64) NOT NULL,
    body VARCHAR(500) NOT NULL,
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS float_shortages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bdo VARCHAR(64) NOT NULL,
    month CHAR(7) NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    reason VARCHAR(255) NOT NULL DEFAULT '',
    recover_by VARCHAR(64) NOT NULL DEFAULT '',
    notified TINYINT(1) NOT NULL DEFAULT 0,
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_short_month (month)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ";
}

function upgrade_schema($pdo) {
  $r = $pdo->query('SELECT value FROM app_settings WHERE name = "schema_version"')->fetch();
  $ver = $r ? (int)$r['value'] : 1;
  if ($ver < 2) {
    $pdo->exec(schema_v2_ddl());
    /* Back-fill the KPI ledger from existing service history (first event wins). */
    $pdo->exec('INSERT IGNORE INTO agent_month_kpi (month, agent_id, kpi, bdo)
                SELECT month, agent_id, "served", bdo FROM service_history WHERE served_status = "SERVED"');
    $pdo->exec('INSERT IGNORE INTO agent_month_kpi (month, agent_id, kpi, bdo)
                SELECT month, agent_id, "visit", bdo FROM service_history WHERE odk = "YES"');
    $pdo->exec('INSERT IGNORE INTO agent_month_kpi (month, agent_id, kpi, bdo)
                SELECT month, agent_id, "apk", bdo FROM service_history WHERE apk = "YES"');
    $pdo->exec('INSERT IGNORE INTO agent_month_kpi (month, agent_id, kpi, bdo)
                SELECT month, agent_id, "active", bdo FROM service_history WHERE activeness LIKE "Active%"');
    $pdo->prepare('UPDATE app_settings SET value = "2" WHERE name = "schema_version"')->execute();
    $ver = 2;
  }
  if ($ver < 3) {
    $pdo->exec(schema_v3_ddl());
    try { $pdo->exec('ALTER TABLE users ADD COLUMN working_days VARCHAR(16) NOT NULL DEFAULT ""'); } catch (Exception $e) { /* exists */ }
    /* new module: reports (visible to everyone; om edits) */
    $pins = $pdo->prepare('INSERT IGNORE INTO permissions (role, module, v, e, d) VALUES (?,?,?,?,?)');
    $pins->execute(array('om', 'reports', 1, 1, 0));
    $pins->execute(array('md', 'reports', 1, 0, 0));
    $pins->execute(array('bdo', 'reports', 1, 0, 0));
    $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("working_days","1,2,3,4,5,6")')->execute();
    $pdo->prepare('UPDATE app_settings SET value = "3" WHERE name = "schema_version"')->execute();
  }
}

function seed($pdo) {
  $c = cfg();
  $pw = password_hash($c['seed_password'], PASSWORD_BCRYPT);

  foreach (array('superadmin','md','om','bdo') as $r) {
    $pdo->prepare('INSERT IGNORE INTO roles (name, builtin) VALUES (?,1)')->execute(array($r));
  }

  $users = array(
    array('superadmin','superadmin','Super Administrator',''),
    array('om','om','Operational Manager',''),
    array('md','md','Managing Director',''),
    array('john','bdo','John (BDO)','Arusha'),
    array('mary','bdo','Mary (BDO)','Arusha'),
    array('peter','bdo','Peter (BDO)','Manyara'),
  );
  $ins = $pdo->prepare('INSERT IGNORE INTO users (username, role, name, station, password_hash) VALUES (?,?,?,?,?)');
  foreach ($users as $u) $ins->execute(array($u[0],$u[1],$u[2],$u[3],$pw));

  // Default permission matrix (module => [role => [v,e,d]])
  $defaults = array(
    'dashboard'  => array('om'=>array(1,1,0), 'md'=>array(1,0,0), 'bdo'=>array(0,0,0)),
    'agents'     => array('om'=>array(1,1,1), 'md'=>array(1,0,0), 'bdo'=>array(0,0,0)),
    'mybase'     => array('om'=>array(0,0,0), 'md'=>array(0,0,0), 'bdo'=>array(1,1,0)),
    'upload'     => array('om'=>array(1,1,0), 'md'=>array(0,0,0), 'bdo'=>array(0,0,0)),
    'targets'    => array('om'=>array(1,1,0), 'md'=>array(1,0,0), 'bdo'=>array(0,0,0)),
    'commission' => array('om'=>array(1,1,0), 'md'=>array(1,0,0), 'bdo'=>array(0,0,0)),
    'reports'    => array('om'=>array(1,1,0), 'md'=>array(1,0,0), 'bdo'=>array(1,0,0)),
    'admin'      => array('om'=>array(0,0,0), 'md'=>array(0,0,0), 'bdo'=>array(0,0,0)),
  );
  $pins = $pdo->prepare('INSERT IGNORE INTO permissions (role, module, v, e, d) VALUES (?,?,?,?,?)');
  foreach ($defaults as $module => $roles) {
    foreach ($roles as $role => $lvl) $pins->execute(array($role, $module, $lvl[0], $lvl[1], $lvl[2]));
  }

  // Current calendar month starts OPEN.
  $pdo->prepare('INSERT IGNORE INTO months (month, status) VALUES (?, "OPEN")')->execute(array(date('Y-m')));
  $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("working_days","1,2,3,4,5,6")')->execute();
  $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("schema_version","3")')->execute();
}
