'use strict';
/*
 * Forward-only SQL migration runner for MySQL.
 * Applies unapplied server/db/migrations/*.sql in filename order and records each
 * in a `schema_migrations` table. Idempotent and safe to run on every boot.
 */
var fs = require('fs');
var path = require('path');
var mysql = require('mysql2/promise');

async function migrate(cfg) {
  var dir = path.join(__dirname, 'migrations');
  var files = fs.readdirSync(dir).filter(function (f) { return /\.sql$/i.test(f); }).sort();

  var conn = await mysql.createConnection({
    host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password,
    database: cfg.database, multipleStatements: true
  });
  try {
    await conn.query('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(191) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    var rows = (await conn.query('SELECT version FROM schema_migrations'))[0];
    var done = {}; rows.forEach(function (r) { done[r.version] = true; });

    var applied = [];
    for (var i = 0; i < files.length; i++) {
      if (done[files[i]]) continue;
      var sql = fs.readFileSync(path.join(dir, files[i]), 'utf8');
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (version) VALUES (?)', [files[i]]);
      applied.push(files[i]);
    }
    return applied;
  } finally {
    await conn.end();
  }
}

module.exports = { migrate: migrate };
