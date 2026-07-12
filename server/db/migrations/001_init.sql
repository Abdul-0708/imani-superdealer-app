-- 001_init: baseline schema for IMANI SUPERDEALER.
-- Managed by the migration runner (server/db/migrate.js). Do not edit an applied
-- migration; add a new NNN_*.sql file for further changes.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS app_settings (
  name  VARCHAR(64) PRIMARY KEY,
  value JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL UNIQUE,
  role          ENUM('superadmin','md','om','bdo') NOT NULL,
  name          VARCHAR(128) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  station       VARCHAR(64)  DEFAULT '',
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  mfa_secret    VARCHAR(64)  NOT NULL DEFAULT '',
  mfa_enabled   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agents (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  acc               VARCHAR(64)  NOT NULL UNIQUE,
  name              VARCHAR(191) NOT NULL DEFAULT '',
  phone             VARCHAR(32)  NOT NULL DEFAULT '',
  branch            VARCHAR(128) NOT NULL DEFAULT '',
  station           VARCHAR(64)  NOT NULL DEFAULT '',
  physical_location VARCHAR(255) NOT NULL DEFAULT '',
  gps_lat           DECIMAL(10,7) NULL,
  gps_lng           DECIMAL(10,7) NULL,
  partner           TINYINT(1)   NOT NULL DEFAULT 0,
  source            VARCHAR(32)  NOT NULL DEFAULT 'upload',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agents_station (station),
  INDEX idx_agents_branch (branch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_history (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  agent_id            INT NOT NULL,
  bdo                 VARCHAR(64)  NOT NULL,
  month               CHAR(7)      NOT NULL,
  week                VARCHAR(12)  NOT NULL DEFAULT '',
  date                VARCHAR(10)  NOT NULL DEFAULT '',
  time                VARCHAR(8)   NOT NULL DEFAULT '',
  gps_lat             DECIMAL(10,7) NULL,
  gps_lng             DECIMAL(10,7) NULL,
  odk                 ENUM('YES','NO') NOT NULL DEFAULT 'NO',
  apk                 ENUM('YES','NO') NOT NULL DEFAULT 'NO',
  float_served        BIGINT NOT NULL DEFAULT 0,
  activeness          VARCHAR(32) NOT NULL DEFAULT '',
  sa_commission       BIGINT NOT NULL DEFAULT 0,
  served_status       ENUM('SERVED','NOT_SERVED') NOT NULL DEFAULT 'NOT_SERVED',
  verification_status ENUM('PENDING','VERIFIED','FALSE') NOT NULL DEFAULT 'PENDING',
  source              VARCHAR(32) NOT NULL DEFAULT 'weekly',
  INDEX idx_svc_month_bdo (month, bdo),
  INDEX idx_svc_agent (agent_id),
  CONSTRAINT fk_svc_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS base (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  month     CHAR(7)     NOT NULL,
  bdo       VARCHAR(64) NOT NULL,
  agent_id  INT NOT NULL,
  kind      ENUM('priority','uploaded') NOT NULL,
  UNIQUE KEY uq_base (month, bdo, agent_id, kind),
  INDEX idx_base_month_bdo (month, bdo),
  CONSTRAINT fk_base_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS weekly_uploads (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  filename   VARCHAR(255) NOT NULL DEFAULT '',
  month      CHAR(7)     NOT NULL,
  week       VARCHAR(12) NOT NULL DEFAULT '',
  bdo        VARCHAR(64) NOT NULL,
  uploaded_by INT NULL,
  row_count  INT NOT NULL DEFAULT 0,
  at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS monthly_targets (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  month         CHAR(7)     NOT NULL,
  station       VARCHAR(64) NOT NULL DEFAULT 'Office',
  agents_target INT    NOT NULL DEFAULT 0,
  float_target  BIGINT NOT NULL DEFAULT 0,
  served_target INT    NOT NULL DEFAULT 0,
  visits_target INT    NOT NULL DEFAULT 0,
  INDEX idx_targets_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS commission_final (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  month    CHAR(7) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL DEFAULT '',
  `rows`   JSON NOT NULL,
  at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS commission_calc (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  month         CHAR(7) NOT NULL UNIQUE,
  served_count  INT NOT NULL DEFAULT 0,
  total         DOUBLE NOT NULL DEFAULT 0,
  fixed_pool    DOUBLE NOT NULL DEFAULT 0,
  variable_pool DOUBLE NOT NULL DEFAULT 0,
  achievement   DOUBLE NOT NULL DEFAULT 0,
  release_pct   DOUBLE NOT NULL DEFAULT 0,
  variable_paid DOUBLE NOT NULL DEFAULT 0,
  final_amount  DOUBLE NOT NULL DEFAULT 0,
  at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clawback (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  month     CHAR(7) NOT NULL UNIQUE,
  earned    DOUBLE NOT NULL DEFAULT 0,
  potential DOUBLE NOT NULL DEFAULT 0,
  recovered DOUBLE NOT NULL DEFAULT 0,
  net       DOUBLE NOT NULL DEFAULT 0,
  reasons   JSON NULL,
  at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bank_uploads (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  month  CHAR(7) NOT NULL,
  acc    VARCHAR(64) NOT NULL,
  visit  ENUM('YES','NO') NOT NULL DEFAULT 'NO',
  apk    ENUM('YES','NO') NOT NULL DEFAULT 'NO',
  served ENUM('SERVED','NOT_SERVED') NOT NULL DEFAULT 'NOT_SERVED',
  INDEX idx_bank_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  action  VARCHAR(64) NOT NULL,
  detail  VARCHAR(512) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
