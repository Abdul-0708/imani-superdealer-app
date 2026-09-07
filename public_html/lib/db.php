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
    /*
     * THE DATABASE KEEPS ITS OWN CLOCK, AND IT IS NOT OURS.
     *
     * PHP is on Africa/Dar_es_Salaam (helpers.php). MySQL is on whatever the
     * hosting server runs in - UTC on most cPanel boxes - and 17 columns
     * DEFAULT to CURRENT_TIMESTAMP while every NOW() reads the same clock. So
     * one action wrote two different times: service_history got the EAT date
     * from PHP, agent_month_kpi.at got the UTC stamp from MySQL, three hours
     * behind. Work done at 01:00 was filed on yesterday, and the 6-hour
     * correction window in kpi_unmark measured against the wrong now.
     *
     * A numeric offset, not 'Africa/Dar_es_Salaam': named zones need MySQL's
     * timezone tables loaded, which shared hosting usually does not have.
     * East Africa Time is UTC+3 with no daylight saving, so +03:00 IS the
     * zone, permanently.
     */
    $pdo->exec("SET time_zone = '+03:00'");
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
    totp_secret VARCHAR(64) NOT NULL DEFAULT '',
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
    /* transaction-acceleration campaign: his own target, and what he did */
    wd_target BIGINT NOT NULL DEFAULT 0,
    wd_txn BIGINT NOT NULL DEFAULT 0,
    campaign VARCHAR(32) NOT NULL DEFAULT '',
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
    /* ONE OWNER PER AGENT PER MONTH. The kind column used to sit in this key,
       so the same agent could occupy the same round twice - once carried
       (priority) and once added by a file (uploaded) - and every count built
       on the base double-counted him. */
    UNIQUE KEY uq_base_owner (month, agent_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS targets (
    month CHAR(7) NOT NULL,
    station VARCHAR(32) NOT NULL DEFAULT '',
    serving_target BIGINT NOT NULL DEFAULT 0,
    float_target BIGINT NOT NULL DEFAULT 0,
    visits_target BIGINT NOT NULL DEFAULT 0,
    apk_target BIGINT NOT NULL DEFAULT 0,
    activeness_target BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (month, station)
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
  schema_v4_apply($pdo);
  try { $pdo->exec('ALTER TABLE agent_month_kpi ADD COLUMN source VARCHAR(8) NOT NULL DEFAULT "upload"'); } catch (Exception $e) { /* exists */ }
  try { $pdo->exec('ALTER TABLE users ADD COLUMN totp_secret VARCHAR(64) NOT NULL DEFAULT ""'); } catch (Exception $e) { /* exists */ }
  try { $pdo->exec('ALTER TABLE agent_month_kpi ADD COLUMN proof VARCHAR(80) NOT NULL DEFAULT ""'); } catch (Exception $e) { /* exists */ }
  schema_v8_apply($pdo);
  schema_v9_apply($pdo);
  schema_v10_apply($pdo);
  schema_v11_apply($pdo);
  schema_v12_apply($pdo);
  schema_v13_apply($pdo);
  seed($pdo);
}

/*
 * v4: office KPI weights + withdraw-volume target, per-agent activeness
 * transition snapshot (current vs previous month), search indexes, and the
 * OM-configurable required APK version + dashboard KPI visibility.
 */
function schema_v4_apply($pdo) {
  $alters = array(
    'ALTER TABLE targets ADD COLUMN withdraw_target BIGINT NOT NULL DEFAULT 0',
    'ALTER TABLE targets ADD COLUMN serving_w INT NOT NULL DEFAULT 0',
    'ALTER TABLE targets ADD COLUMN float_w INT NOT NULL DEFAULT 0',
    'ALTER TABLE targets ADD COLUMN visits_w INT NOT NULL DEFAULT 0',
    'ALTER TABLE targets ADD COLUMN apk_w INT NOT NULL DEFAULT 0',
    'ALTER TABLE targets ADD COLUMN activeness_w INT NOT NULL DEFAULT 0',
    'ALTER TABLE targets ADD COLUMN withdraw_w INT NOT NULL DEFAULT 0',
    'ALTER TABLE agents ADD COLUMN act_current VARCHAR(12) NOT NULL DEFAULT ""',
    'ALTER TABLE agents ADD COLUMN act_prev VARCHAR(12) NOT NULL DEFAULT ""',
    'ALTER TABLE agents ADD COLUMN act_month CHAR(7) NOT NULL DEFAULT ""',
    'ALTER TABLE agents ADD INDEX idx_agents_name (name)',
    'ALTER TABLE agents ADD INDEX idx_agents_phone (phone)',
  );
  foreach ($alters as $sql) { try { $pdo->exec($sql); } catch (Exception $e) { /* exists */ } }
  $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("apk_required_version","2.0")')->execute();
  $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("dashboard_kpis","serving,float,visits,apk,activeness,withdraw")')->execute();
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
    proof VARCHAR(80) NOT NULL DEFAULT '',
    awarded_by VARCHAR(64) NOT NULL DEFAULT '',
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
    base_start INT NOT NULL DEFAULT 0,
    base_target INT NOT NULL DEFAULT 0,
    base_w INT NOT NULL DEFAULT 0,
    accel_target INT NOT NULL DEFAULT 0,
    accel_w INT NOT NULL DEFAULT 0,
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
    $ver = 3;
  }
  if ($ver < 4) {
    schema_v4_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "4" WHERE name = "schema_version"')->execute();
    $ver = 4;
  }
  if ($ver < 5) {
    /* who caused each KPI credit: 'upload' (from the file) or 'bdo' (live mark).
     * Only 'bdo' marks can be reversed by the BDO; OM can reverse anything. */
    try { $pdo->exec('ALTER TABLE agent_month_kpi ADD COLUMN source VARCHAR(8) NOT NULL DEFAULT "upload"'); } catch (Exception $e) { /* exists */ }
    $pdo->prepare('UPDATE app_settings SET value = "5" WHERE name = "schema_version"')->execute();
    $ver = 5;
  }
  if ($ver < 6) {
    /* TOTP 2FA (authenticator app) - empty secret = 2FA off */
    try { $pdo->exec('ALTER TABLE users ADD COLUMN totp_secret VARCHAR(64) NOT NULL DEFAULT ""'); } catch (Exception $e) { /* exists */ }
    $pdo->prepare('UPDATE app_settings SET value = "6" WHERE name = "schema_version"')->execute();
    $ver = 6;
  }
  if ($ver < 7) {
    /* receipt-photo proof for waking an inactive agent */
    try { $pdo->exec('ALTER TABLE agent_month_kpi ADD COLUMN proof VARCHAR(80) NOT NULL DEFAULT ""'); } catch (Exception $e) { /* exists */ }
    $pdo->prepare('UPDATE app_settings SET value = "7" WHERE name = "schema_version"')->execute();
    $ver = 7;
  }
  if ($ver < 8) {
    schema_v8_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "8" WHERE name = "schema_version"')->execute();
    $ver = 8;
  }
  if ($ver < 9) {
    schema_v9_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "9" WHERE name = "schema_version"')->execute();
    $ver = 9;
  }
  if ($ver < 10) {
    schema_v10_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "10" WHERE name = "schema_version"')->execute();
    $ver = 10;
  }
  if ($ver < 11) {
    schema_v11_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "11" WHERE name = "schema_version"')->execute();
    $ver = 11;
  }
  if ($ver < 12) {
    schema_v12_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "12" WHERE name = "schema_version"')->execute();
    $ver = 12;
  }
  if ($ver < 13) {
    schema_v13_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "13" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 14) {
    schema_v14_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "14" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 15) {
    schema_v15_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "15" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 16) {
    schema_v16_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "16" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 17) {
    schema_v17_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "17" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 18) {
    schema_v18_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "18" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 19) {
    schema_v19_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "19" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 20) {
    schema_v20_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "20" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 21) {
    schema_v21_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "21" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 22) {
    schema_v22_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "22" WHERE name = "schema_version"')->execute();
  }
  if ($ver < 23) {
    schema_v23_apply($pdo);
    $pdo->prepare('UPDATE app_settings SET value = "23" WHERE name = "schema_version"')->execute();
  }
}

/*
 * v23: TRANSACTION ACCELERATION - all or nothing, per agent.
 *
 * The campaign asks an agent for a number of withdraw transactions. He
 * either got there or he did not: an agent on 3 of 35 and an agent on 0 of
 * 30 have both failed the campaign, and counting them as 8% and 0% would
 * quietly pay for work the campaign does not recognise. So the agent is
 * worth 1 when he reaches his target and 0 until he does, and the BDO's
 * score is the count of agents who got there.
 *
 * The target is PER AGENT and comes from the file (67, 87, 30, 35 in the
 * same sheet), so it is stored per agent alongside the transactions, and
 * recomputed rather than remembered - a corrected file corrects the score.
 */
function schema_v23_apply($pdo) {
  $alters = array(
    'ALTER TABLE service_history ADD COLUMN wd_target BIGINT NOT NULL DEFAULT 0',
    'ALTER TABLE service_history ADD COLUMN wd_txn BIGINT NOT NULL DEFAULT 0',
    'ALTER TABLE service_history ADD COLUMN campaign VARCHAR(32) NOT NULL DEFAULT \'\'',
    'ALTER TABLE bdo_targets ADD COLUMN accel_target INT NOT NULL DEFAULT 0',
    'ALTER TABLE bdo_targets ADD COLUMN accel_w INT NOT NULL DEFAULT 0',
  );
  foreach ($alters as $sql) { try { $pdo->exec($sql); } catch (Exception $e) { /* exists */ } }
}

/*
 * v22: THE WEEK, and GROWING THE BASE.
 *
 * Two things the month could not express.
 *
 * 1. A WEEK. Fuel is issued weekly, so it has to be earned weekly, and a
 *    month-shaped target could not say what a man had to do by Friday. A
 *    week here is whatever dates the OM says it is - not a calendar week -
 *    because the office does not always run Monday to Sunday and a rule that
 *    pretends otherwise gets worked around rather than followed.
 *
 * 2. GROWING THE BASE. Every other KPI measures work done from nothing:
 *    served this month, visited this month. Base is not like that - a man
 *    does not start each month with no agents, he starts with the round he
 *    ended on. Asking him to 'reach 350' scores him on 279 agents he
 *    already had. base_start is where he ended, and only what he adds
 *    beyond it counts, so 279 -> 350 is a target of 71 new agents and the
 *    280th is the first one that pays.
 */
function schema_v22_apply($pdo) {
  $pdo->exec("
  CREATE TABLE IF NOT EXISTS weeks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(40) NOT NULL DEFAULT '',
    month CHAR(7) NOT NULL DEFAULT '',
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_week_span (date_from, date_to),
    INDEX idx_week_month (month)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS weekly_targets (
    week_id INT NOT NULL,
    bdo VARCHAR(64) NOT NULL,
    visits_target INT NOT NULL DEFAULT 0,
    serving_target INT NOT NULL DEFAULT 0,
    activeness_target INT NOT NULL DEFAULT 0,
    visits_w INT NOT NULL DEFAULT 0,
    serving_w INT NOT NULL DEFAULT 0,
    activeness_w INT NOT NULL DEFAULT 0,
    PRIMARY KEY (week_id, bdo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ");
  /* base growth joins the monthly weighted average like any other KPI */
  $alters = array(
    'ALTER TABLE bdo_targets ADD COLUMN base_start INT NOT NULL DEFAULT 0',
    'ALTER TABLE bdo_targets ADD COLUMN base_target INT NOT NULL DEFAULT 0',
    'ALTER TABLE bdo_targets ADD COLUMN base_w INT NOT NULL DEFAULT 0',
  );
  foreach ($alters as $sql) { try { $pdo->exec($sql); } catch (Exception $e) { /* exists */ } }
}

/*
 * v21: an agent the file gave to the PARTNER is not a BDO's to take.
 *
 * Claiming one used to be an ordinary tap with a compulsory receipt, and the
 * OM found out afterwards from a flag. The decision belongs to the OM before
 * the credit moves, not after, so kpi_mark now refuses a BDO outright and the
 * OM awards the agent to the officer he judges did the work.
 *
 * awarded_by records WHO authorised such a claim. Without it the next
 * performance upload would raise the partner flag all over again against a
 * credit the OM had already ruled on, and the OM would spend every month
 * clearing the same accusation he himself created.
 */
function schema_v21_apply($pdo) {
  try { $pdo->exec('ALTER TABLE agent_month_kpi ADD COLUMN awarded_by VARCHAR(64) NOT NULL DEFAULT ""'); } catch (Exception $e) { /* exists */ }
}

/*
 * v20: two things the architecture was missing rather than two features.
 *
 * 1. AN INDEX FOR THE APP'S MOST COMMON QUESTION. "What is in this officer's
 *    round?" runs on almost every screen, but the only key on `base` was
 *    (month, agent_id) - which answers "who holds this agent", the opposite
 *    question. Every lookup by officer was a full table scan. Invisible on a
 *    handful of test rows; a real cost once a station carries thousands of
 *    agents across a year of months.
 *
 * 2. SOMEWHERE TO COUNT REQUESTS. Only the login had any throttle; every other
 *    endpoint could be called in a loop. This is the smallest thing that can
 *    hold a counter - no cache server to install on shared hosting.
 */
function schema_v20_apply($pdo) {
  try { $pdo->exec('ALTER TABLE base ADD INDEX idx_base_owner_round (month, bdo)'); } catch (Exception $e) { /* exists */ }
  try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limit (
      bucket VARCHAR(160) NOT NULL PRIMARY KEY,
      window_start INT NOT NULL DEFAULT 0,
      hits INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  } catch (Exception $e) { /* exists */ }
}

/*
 * v19: NO LOCATION, NOT HIS AGENT.
 *
 * A round is the list of doors an officer can walk to. An agent nobody has
 * pinned to a place is not one of them - he is a name on a spreadsheet, and
 * counting him inflated every round, every coverage percentage and every
 * high-earner total with agents no one could actually go and serve.
 *
 * Rows for agents with no physical location are cleared out of the OPEN and
 * future months. Closed and awaiting months are left exactly as they were:
 * their numbers have already been reported and, in the awaiting case, are
 * about to settle a commission - rewriting history under a new rule would
 * change figures somebody has already been paid against.
 */
function schema_v19_apply($pdo) {
  $keep = $pdo->query("SELECT month FROM months WHERE status IN ('CLOSED','AWAITING')")->fetchAll(PDO::FETCH_COLUMN);
  $sql = "DELETE b FROM base b JOIN agents a ON a.id = b.agent_id
          WHERE TRIM(a.physical_location) = ''";
  $vals = array();
  if ($keep) {
    $sql .= ' AND b.month NOT IN (' . implode(',', array_fill(0, count($keep), '?')) . ')';
    $vals = $keep;
  }
  $st = $pdo->prepare($sql);
  $st->execute($vals);
  $gone = $st->rowCount();
  if ($gone) {
    $pdo->prepare('INSERT INTO audit (user_id, action, detail) VALUES (NULL, "base_no_location", ?)')
        ->execute(array($gone . ' base rows removed - the agent had no physical location, so he was nobody\'s agent'));
  }
}

/*
 * v18: PROOF STRICTNESS PER OFFICER.
 *
 * "Everyone must attach a photo" is the wrong tool. One officer has been
 * caught claiming visits he did not make and should have to prove every
 * serve; another has never been questioned and only gets slowed down by it.
 * The OM can now set the rule on the man rather than on the whole team.
 *
 * Empty means FOLLOW THE OFFICE RULE - so nothing changes for anybody until
 * the OM deliberately singles someone out, and clearing the override puts him
 * back under the office setting rather than under some remembered value.
 */
function schema_v18_apply($pdo) {
  foreach (array(
    'ALTER TABLE users ADD COLUMN serve_receipt VARCHAR(16) NOT NULL DEFAULT ""',
    'ALTER TABLE users ADD COLUMN wake_receipt VARCHAR(16) NOT NULL DEFAULT ""',
  ) as $sql) {
    try { $pdo->exec($sql); } catch (Exception $e) { /* already there */ }
  }
}

/*
 * v17: ONE AGENT, ONE OWNER, ONE ROW.
 *
 * The base key was (month, bdo, agent_id, KIND). Because the kind was part of
 * it, the very same agent could sit in the very same officer's round twice -
 * once as "priority" (carried from last month) and once as "uploaded" (a file
 * listed him again) - and everything built on the base counted him twice: the
 * round size, the coverage percentage, the high-earner totals, the untouched
 * list the OM works from. The screenshot that started this showed one agent
 * printed twice under the same account number.
 *
 * Worse, nothing stopped the same agent appearing in TWO officers' rounds at
 * once, so two men could both be told to go and serve him.
 *
 * The key becomes (month, agent_id): one owner per agent per month, full stop.
 * Existing rows are collapsed before the key is applied, keeping the row that
 * best represents the truth - see keep_one_base_row().
 */
function schema_v17_apply($pdo) {
  /* 1. collapse duplicates so the new key can be created at all */
  dedupe_base_rows($pdo);

  /* 2. swap the key. Dropping by name is wrapped because an install that was
   *    created fresh on v17 already has the new one. */
  foreach (array('ALTER TABLE base DROP INDEX uq_base',
                 'ALTER TABLE base ADD UNIQUE KEY uq_base_owner (month, agent_id)') as $sql) {
    try { $pdo->exec($sql); } catch (Exception $e) { /* already in the wanted shape */ }
  }
}

/*
 * WHICH DUPLICATE SURVIVES.
 *
 * In order of authority:
 *   1. the officer who actually SERVED him this month - the work is done and
 *      the credit is already his, so the round must agree with the ledger;
 *   2. a real officer over the 'partners' / 'unassigned' placeholders;
 *   3. a carried "priority" row over one a file added, because carried means
 *      he was earned last month;
 *   4. failing all that, the oldest row.
 */
function dedupe_base_rows($pdo) {
  $rows = $pdo->query('SELECT id, month, bdo, agent_id, kind FROM base ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
  if (!$rows) return 0;

  /* who served whom, so the ledger can win the argument */
  $served = array();
  foreach ($pdo->query("SELECT month, agent_id, bdo FROM agent_month_kpi WHERE kpi = 'served'")->fetchAll(PDO::FETCH_ASSOC) as $k) {
    $served[$k['month'] . '|' . $k['agent_id']] = $k['bdo'];
  }

  $best = array(); $drop = array();
  foreach ($rows as $r) {
    $key = $r['month'] . '|' . $r['agent_id'];
    if (!isset($best[$key])) { $best[$key] = $r; continue; }
    $keep = base_row_rank($r, $served, $key) > base_row_rank($best[$key], $served, $key) ? $r : $best[$key];
    $lose = ($keep === $r) ? $best[$key] : $r;
    $drop[] = (int)$lose['id'];
    $best[$key] = $keep;
  }
  if ($drop) {
    foreach (array_chunk($drop, 500) as $chunk) {
      $pdo->exec('DELETE FROM base WHERE id IN (' . implode(',', array_map('intval', $chunk)) . ')');
    }
    $pdo->prepare('INSERT INTO audit (user_id, action, detail) VALUES (NULL, "base_dedupe", ?)')
        ->execute(array(count($drop) . ' duplicate base rows removed - one owner per agent per month'));
  }
  return count($drop);
}
function base_row_rank($r, $served, $key) {
  $rank = 0;
  if (isset($served[$key]) && $served[$key] === $r['bdo']) $rank += 100;   /* he did the work */
  if ($r['bdo'] !== 'partners' && $r['bdo'] !== 'unassigned') $rank += 10; /* a real officer */
  if ($r['kind'] === 'priority') $rank += 1;                               /* earned last month */
  return $rank;
}

/*
 * v16: the upload screen becomes DATABASE UPLOAD with several kinds of file
 * behind one door, and only the weekly PERFORMANCE file is allowed to judge
 * anybody. Each upload records which kind it was, so an import can be read back
 * (and erased) knowing whether it ever counted.
 *
 * Commission also gains a station: two SA stations earn different achievements
 * and cannot share one release percentage.
 *
 * flags_cleared remembers every clearance the OM makes - who, when, and how
 * many times the same claim has been forgiven - so a pattern stays visible
 * instead of the history being wiped.
 */
function schema_v16_apply($pdo) {
  $alters = array(
    'ALTER TABLE uploads ADD COLUMN kind VARCHAR(16) NOT NULL DEFAULT "performance"',
    'ALTER TABLE commission_rows ADD COLUMN station VARCHAR(32) NOT NULL DEFAULT ""',
    'ALTER TABLE commission_calc ADD COLUMN station VARCHAR(32) NOT NULL DEFAULT ""',
    /* the APK version the baseline file reported for this agent, so the list
       can show "on 1.8" rather than only a yes/no against the required one */
    'ALTER TABLE agents ADD COLUMN apk_version VARCHAR(16) NOT NULL DEFAULT ""',
    'ALTER TABLE agents ADD COLUMN apk_month CHAR(7) NOT NULL DEFAULT ""',
  );
  foreach ($alters as $sql) { try { $pdo->exec($sql); } catch (Exception $e) { /* exists */ } }
  /* commission is settled per (month, station) now, not per month */
  try { $pdo->exec('ALTER TABLE commission_calc DROP PRIMARY KEY, ADD PRIMARY KEY (month, station)'); } catch (Exception $e) { /* done */ }
  $pdo->exec('
  CREATE TABLE IF NOT EXISTS flags_cleared (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month CHAR(7) NOT NULL,
    agent_id INT NOT NULL,
    bdo VARCHAR(64) NOT NULL,
    kpi VARCHAR(12) NOT NULL,
    detail VARCHAR(255) NOT NULL DEFAULT "",
    cleared_by VARCHAR(64) NOT NULL DEFAULT "",
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fc_month (month),
    INDEX idx_fc_claim (agent_id, bdo, kpi)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ');
}

/*
 * v15: recruitment that happened OUTSIDE the app. A BDO's new-agent forms live
 * in `recruits`, but the real month also contains files walked straight to the
 * bank that never passed through the pipeline. The OM types that count per BDO
 * per month so the monthly picture is the true one, and it is kept apart from
 * the pipeline figure so the two can never be confused for each other.
 */
function schema_v15_apply($pdo) {
  $pdo->exec('
  CREATE TABLE IF NOT EXISTS bank_recruits (
    month CHAR(7) NOT NULL,
    bdo VARCHAR(64) NOT NULL,
    submitted INT NOT NULL DEFAULT 0,
    note VARCHAR(255) NOT NULL DEFAULT "",
    by_user VARCHAR(64) NOT NULL DEFAULT "",
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (month, bdo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ');
}

/*
 * v14: office targets become PER SA STATION, so Target Attainment can read for
 * Arusha alone instead of rolling every region together. The station column is
 * added and the primary key widened to (month, station); every existing row
 * keeps station = '' which now means "All stations" - the office-wide roll-up.
 * Nothing the OM already typed is lost or reassigned.
 *
 * Also: per-user message read marks, so the Messages tab can carry an unread
 * badge now that messages no longer sit on the dashboard.
 */
function schema_v14_apply($pdo) {
  try { $pdo->exec('ALTER TABLE targets ADD COLUMN station VARCHAR(32) NOT NULL DEFAULT ""'); } catch (Exception $e) { /* exists */ }
  /* widen the key: month alone -> (month, station) */
  try { $pdo->exec('ALTER TABLE targets DROP PRIMARY KEY, ADD PRIMARY KEY (month, station)'); } catch (Exception $e) { /* already widened */ }
  try { $pdo->exec('ALTER TABLE users ADD COLUMN msgs_seen_at DATETIME NULL'); } catch (Exception $e) { /* exists */ }
}

/*
 * v13: a flagged BDO answers for himself. He confirms the flag or disputes it
 * with a reason, and the OM sees that answer next to the flag.
 */
function schema_v13_apply($pdo) {
  $alters = array(
    'ALTER TABLE flags ADD COLUMN bdo_response VARCHAR(12) NOT NULL DEFAULT ""',
    'ALTER TABLE flags ADD COLUMN bdo_note VARCHAR(255) NOT NULL DEFAULT ""',
    'ALTER TABLE flags ADD COLUMN responded_at DATETIME NULL',
  );
  foreach ($alters as $sql) { try { $pdo->exec($sql); } catch (Exception $e) { /* exists */ } }
  /* waking demands a real PHOTO by default - no typed excuse */
  $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("wake_receipt","photo")')->execute();
}

/*
 * v12: a BDO's re-usable VISIT PLACES. He saves the spots he works, then picks
 * one or several from a dropdown when writing the day's route - no retyping.
 */
function schema_v12_apply($pdo) {
  $pdo->exec('
  CREATE TABLE IF NOT EXISTS bdo_places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bdo VARCHAR(64) NOT NULL,
    place VARCHAR(160) NOT NULL,
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_place (bdo, place)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ');
  $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("home_station","ARUSHA")')->execute();
}

/*
 * v11: HIGH-EARNER priority list. The OM uploads agents ranked by commission;
 * whoever is still NOT served shows on every BDO's priority list in bands
 * A >2M, B >1M, C >500k, D >100k, E >50k - matched live against the ledger.
 */
function schema_v11_apply($pdo) {
  $pdo->exec('
  CREATE TABLE IF NOT EXISTS high_earners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    acc VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(191) NOT NULL DEFAULT "",
    commission BIGINT NOT NULL DEFAULT 0,
    station VARCHAR(64) NOT NULL DEFAULT "",
    by_user VARCHAR(64) NOT NULL DEFAULT "",
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_he_station (station)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ');
}

/*
 * v10: two-way messages (replies, per-user dismiss, BDO market feedback),
 * TEAM LEADER role, float-shortage approval chain, daily route plans (EAT).
 */
function schema_v10_apply($pdo) {
  $alters = array(
    'ALTER TABLE messages ADD COLUMN kind VARCHAR(12) NOT NULL DEFAULT "msg"',
    'ALTER TABLE messages ADD COLUMN reply_to INT NOT NULL DEFAULT 0',
    'ALTER TABLE float_shortages ADD COLUMN status VARCHAR(12) NOT NULL DEFAULT "PENDING"',
    'ALTER TABLE float_shortages ADD COLUMN approved_by VARCHAR(64) NOT NULL DEFAULT ""',
  );
  foreach ($alters as $sql) { try { $pdo->exec($sql); } catch (Exception $e) { /* exists */ } }
  $pdo->exec('
  CREATE TABLE IF NOT EXISTS msg_hidden (
    message_id INT NOT NULL,
    username VARCHAR(64) NOT NULL,
    PRIMARY KEY (message_id, username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS route_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bdo VARCHAR(64) NOT NULL,
    date DATE NOT NULL,
    plan VARCHAR(2000) NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT "PENDING",
    by_leader VARCHAR(64) NOT NULL DEFAULT "",
    note VARCHAR(255) NOT NULL DEFAULT "",
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_route (bdo, date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ');
  /* TEAM LEADER: sees every BDO report/activity, messages all BDOs, approves
   * shortages and route plans. */
  $pdo->prepare('INSERT IGNORE INTO roles (name, builtin) VALUES ("teamleader", 1)')->execute();
  $perms = array(
    array('teamleader','dashboard',1,0,0), array('teamleader','agents',1,0,0),
    array('teamleader','targets',1,0,0), array('teamleader','reports',1,1,0),
  );
  $ins = $pdo->prepare('INSERT IGNORE INTO permissions (role, module, v, e, d) VALUES (?,?,?,?,?)');
  foreach ($perms as $p) $ins->execute($p);
}

/*
 * v9: every Excel upload becomes a registered, labelled, dated record whose
 * rows/credits are tagged with its id - so single uploads can be erased.
 */
function schema_v9_apply($pdo) {
  $pdo->exec('
  CREATE TABLE IF NOT EXISTS uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month CHAR(7) NOT NULL,
    week VARCHAR(12) NOT NULL DEFAULT "",
    label VARCHAR(160) NOT NULL DEFAULT "",
    by_user VARCHAR(64) NOT NULL,
    rows_count INT NOT NULL DEFAULT 0,
    stats MEDIUMTEXT NOT NULL,
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ');
  $alters = array(
    'ALTER TABLE service_history ADD COLUMN upload_id INT NOT NULL DEFAULT 0',
    'ALTER TABLE agent_month_kpi ADD COLUMN upload_id INT NOT NULL DEFAULT 0',
    'ALTER TABLE service_history ADD INDEX idx_svc_upload (upload_id)',
  );
  foreach ($alters as $sql) { try { $pdo->exec($sql); } catch (Exception $e) { /* exists */ } }
}

/*
 * v8: activeness-specialist BDO (wake-only window + recruitment pipeline +
 * won't-return list), targeted/editable OM messages, wake proof by words.
 */
function schema_v8_apply($pdo) {
  $alters = array(
    'ALTER TABLE users ADD COLUMN specialty VARCHAR(16) NOT NULL DEFAULT ""',
    'ALTER TABLE messages ADD COLUMN to_user VARCHAR(64) NOT NULL DEFAULT ""',
    'ALTER TABLE agent_month_kpi ADD COLUMN proof_note VARCHAR(255) NOT NULL DEFAULT ""',
  );
  foreach ($alters as $sql) { try { $pdo->exec($sql); } catch (Exception $e) { /* exists */ } }
  $pdo->exec('
  CREATE TABLE IF NOT EXISTS recruits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bdo VARCHAR(64) NOT NULL,
    name VARCHAR(191) NOT NULL,
    branch VARCHAR(128) NOT NULL,
    champion VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NOT NULL DEFAULT "",
    stage TINYINT NOT NULL DEFAULT 1,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    audit_at DATETIME NULL,
    approved_at DATETIME NULL,
    paid_at DATETIME NULL,
    done_at DATETIME NULL,
    acc VARCHAR(64) NOT NULL DEFAULT "",
    location VARCHAR(255) NOT NULL DEFAULT "",
    agent_id INT NOT NULL DEFAULT 0,
    INDEX idx_recruits_bdo (bdo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS wont_return (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL UNIQUE,
    bdo VARCHAR(64) NOT NULL,
    note VARCHAR(255) NOT NULL DEFAULT "",
    at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ');
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
  $pdo->prepare('INSERT IGNORE INTO app_settings (name, value) VALUES ("schema_version","13")')->execute();
}
