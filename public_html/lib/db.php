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
    return; // schema exists
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

  seed($pdo);
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
    'admin'      => array('om'=>array(0,0,0), 'md'=>array(0,0,0), 'bdo'=>array(0,0,0)),
  );
  $pins = $pdo->prepare('INSERT IGNORE INTO permissions (role, module, v, e, d) VALUES (?,?,?,?,?)');
  foreach ($defaults as $module => $roles) {
    foreach ($roles as $role => $lvl) $pins->execute(array($role, $module, $lvl[0], $lvl[1], $lvl[2]));
  }

  // Current calendar month starts OPEN.
  $pdo->prepare('INSERT IGNORE INTO months (month, status) VALUES (?, "OPEN")')->execute(array(date('Y-m')));
  $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("schema_version","1")')->execute();
}
