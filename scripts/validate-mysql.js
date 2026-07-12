'use strict';
/*
 * Live MySQL validation. Points the app at a real MySQL/MariaDB server, runs the
 * migrations, seeds, then exercises the API end-to-end and proves data actually
 * persisted in SQL tables. Configure via MYSQL_* env (defaults below).
 *
 *   MYSQL_HOST=127.0.0.1 MYSQL_PORT=3307 MYSQL_USER=root MYSQL_PASSWORD= \
 *   node scripts/validate-mysql.js
 */
process.env.DB_DRIVER = 'mysql';
process.env.MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
process.env.MYSQL_PORT = process.env.MYSQL_PORT || '3307';
process.env.MYSQL_USER = process.env.MYSQL_USER || 'root';
process.env.MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
process.env.MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'imani_superdealer';
process.env.JWT_SECRET = 'mysql-validation-secret';
process.env.SEED_OM_PASS = 'imani123';

var path = require('path');
var ROOT = path.join(__dirname, '..');
var mysql = require('mysql2/promise');
var config = require(path.join(ROOT, 'server/config'));

var pass = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ok - ' + name); } else { throw new Error('FAILED: ' + name); } }

async function ensureDatabase() {
  var c = await mysql.createConnection({ host: config.mysql.host, port: config.mysql.port, user: config.mysql.user, password: config.mysql.password });
  await c.query('CREATE DATABASE IF NOT EXISTS `' + config.mysql.database + '` CHARACTER SET utf8mb4');
  await c.end();
}

(async function () {
  try {
    console.log('Connecting to MySQL at ' + config.mysql.host + ':' + config.mysql.port + ' ...');
    await ensureDatabase();

    var migrate = require(path.join(ROOT, 'server/db/migrate'));
    var applied = await migrate.migrate(config.mysql);
    console.log('Migrations applied: ' + (applied.length ? applied.join(', ') : '(already up to date)'));
    ok('migration runner records schema_migrations', true);

    /* re-run to prove idempotency */
    var again = await migrate.migrate(config.mysql);
    ok('migrations are idempotent (no re-apply)', again.length === 0);

    var db = require(path.join(ROOT, 'server/db'));
    var seed = require(path.join(ROOT, 'server/seed'));
    var srv = require(path.join(ROOT, 'server'));
    var repo = db.get();
    await repo.init();
    ok('db driver is mysql', repo.driver === 'mysql');
    await repo.ping();
    ok('mysql ping works', true);
    await seed.seed(repo);

    var server = srv.app.listen(0);
    var port = server.address().port;
    var base = 'http://localhost:' + port;
    async function jf(pathname, opts) {
      opts = opts || {};
      var headers = Object.assign({}, opts.headers || {});
      if (opts.token) headers.Authorization = 'Bearer ' + opts.token;
      if (opts.body) headers['Content-Type'] = 'application/json';
      var r = await fetch(base + pathname, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
      var data = await r.json().catch(function () { return {}; });
      return { status: r.status, data: data };
    }

    try {
      var health = await jf('/api/health');
      ok('health reports mysql driver + db up', health.status === 200 && health.data.driver === 'mysql' && health.data.db === 'up');

      var login = await jf('/api/auth/login', { method: 'POST', body: { username: 'om', password: 'imani123' } });
      ok('login works against mysql', login.status === 200 && !!login.data.token);
      var token = login.data.token;

      var rows = [];
      for (var i = 1; i <= 6; i++) {
        var served = i % 2 === 0;
        rows.push({ 'Agent Account': 'MQ' + i, 'Agent Name': 'MySQL Agent ' + i, 'BDO': 'John', 'Agent Visit': served ? 'YES' : 'NO', 'APK Update': 'YES', 'SA Commission': served ? 12500000 : 0, 'Served Status': served ? 'SERVED' : 'NOT_SERVED' });
      }
      var up = await jf('/api/uploads/weekly', { method: 'POST', token: token, body: { month: '2026-07', week: 'W1', rows: rows } });
      ok('weekly upload persists to mysql', up.status === 200 && up.data.rows === 6 && up.data.served === 3);

      var b = await jf('/api/base/john/2026-07', { token: token });
      ok('base reads back from mysql', b.status === 200 && b.data.counts.total === 6);

      var roll = await jf('/api/base/rollover', { method: 'POST', token: token, body: { fromMonth: '2026-07' } });
      ok('carry-forward writes priority rows in mysql', roll.status === 200 && roll.data.toMonth === '2026-08');
      var b2 = await jf('/api/base/john/2026-08', { token: token });
      ok('carried priority agents persisted', b2.data.counts.priority === 3);

      await jf('/api/commission/final', { method: 'POST', token: token, body: { month: '2026-07', rows: [{ 'SA Commission': 12500000, 'Served Status': 'SERVED' }, { 'SA Commission': 12500000, 'Served Status': 'SERVED' }] } });
      var calc = await jf('/api/commission/calc', { method: 'POST', token: token, body: { month: '2026-07', achievement: 82 } });
      ok('commission calc persists (JSON columns work)', calc.status === 200 && calc.data.calc.total === 25000000 && calc.data.calc.releasePct === 0.8);

      /* Direct SQL proof that rows really landed in MySQL tables. */
      var c = await mysql.createConnection(config.mysql);
      var agentCount = (await c.query('SELECT COUNT(*) n FROM agents'))[0][0].n;
      var svcCount = (await c.query('SELECT COUNT(*) n FROM service_history'))[0][0].n;
      var calcRow = (await c.query('SELECT final_amount FROM commission_calc WHERE month=?', ['2026-07']))[0][0];
      await c.end();
      ok('agents table has rows (' + agentCount + ')', agentCount >= 6);
      ok('service_history has rows (' + svcCount + ')', svcCount >= 6);
      ok('commission_calc row stored final = 21,500,000', Math.round(calcRow.final_amount) === 21500000);
    } finally {
      server.close();
      await repo.close();
    }

    console.log('\nMYSQL VALIDATION OK - ' + pass + ' checks passed.');
    process.exit(0);
  } catch (e) {
    console.error('\nMYSQL VALIDATION FAILED: ' + e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
