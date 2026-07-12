'use strict';
/* Smoke tests: pure business services (unit) + HTTP API flow against the file
 * driver (integration). Run with the portable node. Exits non-zero on failure. */

/* Use an in-memory file store so tests never touch real data. Must be set
 * BEFORE any server module is required (config reads env at load time). */
process.env.DB_DRIVER = 'file';
process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.SEED_OM_PASS = 'imani123';

var assert = require('assert');
var path = require('path');
var ROOT = path.join(__dirname, '..');

var pass = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ok - ' + name); } else { throw new Error('FAILED: ' + name); } }
function near(a, b) { return Math.abs(a - b) < 0.001; }

var priority = require(path.join(ROOT, 'server/services/priority'));
var commission = require(path.join(ROOT, 'server/services/commission'));
var clawback = require(path.join(ROOT, 'server/services/clawback'));
var verify = require(path.join(ROOT, 'server/services/verify'));
var weekly = require(path.join(ROOT, 'server/services/weekly'));
var mfa = require(path.join(ROOT, 'server/mfa'));

function unitTests() {
  console.log('Unit: priority');
  ok('nextMonth rolls year', priority.nextMonth('2026-07') === '2026-08' && priority.nextMonth('2026-12') === '2027-01');
  var sets = { priority: { 1: true }, everServed: { 1: true, 2: true } };
  ok('classify priority', priority.classify(1, sets) === 'priority');
  ok('classify new (served before, not carried)', priority.classify(2, sets) === 'new');
  ok('classify never', priority.classify(3, sets) === 'never');
  var counts = priority.baseCounts({ priority: [1, 2], uploaded: [2, 3, 4] });
  ok('baseCounts priority=2 new=2 total=4', counts.priority === 2 && counts.newAgents === 2 && counts.total === 4);
  var roll = priority.rollover('2026-07', { john: [1, 1, 2], mary: [5] });
  ok('rollover target + dedup', roll.month === '2026-08' && roll.byBdo.john.length === 2 && roll.byBdo.mary.length === 1);

  console.log('Unit: commission (spec section 11, revised release table)');
  ok('release 49% -> 0 (NA below 50)', commission.releaseFor(49) === 0);
  ok('release 50% -> 0.2', near(commission.releaseFor(50), 0.2));
  ok('release 60% -> 0.4', near(commission.releaseFor(60), 0.4));
  ok('release 70% -> 0.6', near(commission.releaseFor(70), 0.6));
  ok('release 82% -> 0.8', near(commission.releaseFor(82), 0.8));
  ok('release 89% -> 0.8', near(commission.releaseFor(89), 0.8));
  ok('release 90% -> 1.0', near(commission.releaseFor(90), 1.0));
  var cc = commission.calc([{ saCommission: 100, servedStatus: 'SERVED' }, { saCommission: 50, servedStatus: 'NOT_SERVED' }], 82);
  ok('SERVED-only total = 100', cc.total === 100);
  ok('fixed 30 / variablePool 70', near(cc.fixedPool, 30) && near(cc.variablePool, 70));
  ok('variablePaid 56 / final 86', near(cc.variablePaid, 56) && near(cc.final, 86));

  console.log('Unit: clawback (spec section 12)');
  var cb = clawback.calc({ earned: 125, recovered: 4.2, reasons: [{ label: 'Dormant', amount: 9.4 }] });
  ok('potential=9.4 net=115.6', near(cb.potential, 9.4) && near(cb.net, 115.6));

  console.log('Unit: verify (spec sections 5/10)');
  var vr = verify.verify(
    [{ agentId: 1, acc: 'A', bdo: 'john', odk: 'YES', apk: 'NO', servedStatus: 'SERVED' }],
    [{ acc: 'A', visit: 'NO', apk: 'NO', served: 'SERVED' }]
  );
  ok('visit claim flagged FALSE', vr.rows.some(function (r) { return r.field === 'visit' && r.result === 'FALSE'; }));
  ok('unique claim VERIFIED', vr.rows.some(function (r) { return r.field === 'unique' && r.result === 'VERIFIED'; }));
  ok('integrity 50%', vr.byBdo.john.integrity === 50);

  console.log('Unit: MFA (TOTP)');
  var mSecret = mfa.generateSecret();
  var mCode = mfa.totp(mSecret);
  ok('TOTP secret is base32', /^[A-Z2-7]+$/.test(mSecret));
  ok('TOTP verifies its own current code', mfa.verify(mSecret, mCode) === true);
  var wrong = (((Number(mCode) + 500000) % 1000000)).toString().padStart(6, '0');
  ok('TOTP rejects a wrong code', mfa.verify(mSecret, wrong) === false);

  console.log('Unit: weekly parser (spec section 6)');
  var parsed = weekly.parse([{ 'Agent Account': '123', 'Agent Name': 'X', 'Agent Visit': 'yes', 'APK Update': 'no', 'Served Status': 'served', 'SA Commission': '1,000' }]);
  ok('parse maps 11-col format', parsed.length === 1 && parsed[0].acc === '123' && parsed[0].agentVisit === 'YES' && parsed[0].apkUpdate === 'NO' && parsed[0].servedStatus === 'SERVED' && parsed[0].saCommission === 1000);
}

async function integrationTests() {
  console.log('Integration: API (file driver)');
  var db = require(path.join(ROOT, 'server/db'));
  var seed = require(path.join(ROOT, 'server/seed'));
  var srv = require(path.join(ROOT, 'server'));
  var repo = db.get();
  await repo.init();
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
    ok('health uses file driver', health.status === 200 && health.data.driver === 'file');

    var badLogin = await jf('/api/auth/login', { method: 'POST', body: { username: 'om', password: 'wrong' } });
    ok('wrong password rejected', badLogin.status === 401);

    var login = await jf('/api/auth/login', { method: 'POST', body: { username: 'om', password: 'imani123' } });
    ok('om login returns token', login.status === 200 && !!login.data.token);
    var token = login.data.token;

    var noAuth = await jf('/api/dashboard/summary');
    ok('protected route needs auth', noAuth.status === 401);

    var rows = [];
    for (var i = 1; i <= 6; i++) {
      var served = i % 2 === 0;
      rows.push({ 'Agent Account': 'ACC' + i, 'Agent Name': 'Agent ' + i, 'Phone': '070000000' + i, 'Branch': 'Njiro', 'Agent Visit': served ? 'YES' : 'NO', 'APK Update': 'YES', 'SA Commission': served ? 1000 : 0, 'Served Status': served ? 'SERVED' : 'NOT_SERVED' });
    }
    var up = await jf('/api/uploads/weekly', { method: 'POST', token: token, body: { bdo: 'john', month: '2026-07', week: 'W1', rows: rows } });
    ok('weekly upload imports rows', up.status === 200 && up.data.rows === 6 && up.data.served === 3);

    var b1 = await jf('/api/base/john/2026-07', { token: token });
    ok('base has 6 uploaded agents', b1.status === 200 && b1.data.counts.total === 6);
    ok('no priority before rollover', b1.data.counts.priority === 0);

    var roll = await jf('/api/base/rollover', { method: 'POST', token: token, body: { fromMonth: '2026-07' } });
    ok('rollover -> 2026-08', roll.status === 200 && roll.data.toMonth === '2026-08');

    var b2 = await jf('/api/base/john/2026-08', { token: token });
    ok('served agents carried as priority', b2.data.counts.priority === 3);
    ok('carried agents tagged green', b2.data.agents.filter(function (a) { return a.level === 'priority'; }).length === 3);

    var xlsx = await fetch(base + '/api/agents/served.xlsx?bdo=john&month=2026-07', { headers: { Authorization: 'Bearer ' + token } });
    ok('served export returns xlsx', xlsx.status === 200 && (xlsx.headers.get('content-type') || '').indexOf('spreadsheet') >= 0);

    var dash = await jf('/api/dashboard/summary?month=2026-07', { token: token });
    ok('dashboard summary computes served rate', dash.status === 200 && dash.data.servedThisMonth === 3);

    /* ---- Phase 2: verification + data quality ---- */
    var verNoBank = await jf('/api/verification/2026-07', { token: token });
    ok('verification reports no bank yet', verNoBank.status === 200 && verNoBank.data.hasBank === false);

    var runNoBank = await jf('/api/verification/run', { method: 'POST', token: token, body: { month: '2026-07' } });
    ok('run rejected without bank file', runNoBank.status === 400);

    /* Agent ACC2 was served+visited YES by BDO; bank says visit NO -> false claim. */
    var bankRows = [
      { 'Agent Account': 'ACC2', 'Agent Visit': 'NO', 'APK Update': 'YES', 'Served Status': 'SERVED' },
      { 'Agent Account': 'ACC4', 'Agent Visit': 'YES', 'APK Update': 'YES', 'Served Status': 'SERVED' },
      { 'Agent Account': 'ACC6', 'Agent Visit': 'YES', 'APK Update': 'YES', 'Served Status': 'SERVED' }
    ];
    var bankUp = await jf('/api/uploads/bank', { method: 'POST', token: token, body: { month: '2026-07', rows: bankRows } });
    ok('bank upload accepted', bankUp.status === 200 && bankUp.data.rows === 3);

    var ver = await jf('/api/verification/2026-07', { token: token });
    ok('verification finds a false claim', ver.status === 200 && ver.data.hasBank === true && ver.data.falseCount >= 1);
    var john = ver.data.byBdo.filter(function (b) { return b.bdo === 'john'; })[0];
    ok('john visitFalse >=1 and integrity < 100', john && john.visitFalse >= 1 && john.integrity < 100);

    var run = await jf('/api/verification/run', { method: 'POST', token: token, body: { month: '2026-07' } });
    ok('verification run back-fills statuses', run.status === 200 && run.data.updated === 6);

    var qual = await jf('/api/quality', { token: token });
    ok('data quality returns counts', qual.status === 200 && typeof qual.data.counts.missingPhone === 'number');
    ok('quality flags missing GPS for all demo agents', qual.data.counts.missingGps === 6);

    var xlsxUnknown = await fetch(base + '/api/quality/unknown-locations.xlsx', { headers: { Authorization: 'Bearer ' + token } });
    ok('unknown-locations export returns xlsx', xlsxUnknown.status === 200);

    /* ---- Upload without attaching a BDO: link via file column + auto-create ---- */
    var noBdoRows = [
      { 'Agent Account': 'M1', 'Agent Name': 'Multi 1', 'BDO': 'Mary', 'Agent Visit': 'YES', 'Served Status': 'SERVED' },
      { 'Agent Account': 'M2', 'Agent Name': 'Multi 2', 'BDO': 'Zawadi', 'Agent Visit': 'YES', 'Served Status': 'SERVED' },
      { 'Agent Account': 'M3', 'Agent Name': 'Multi 3', 'Agent Visit': 'NO', 'Served Status': 'NOT_SERVED' }
    ];
    var upNoBdo = await jf('/api/uploads/weekly', { method: 'POST', token: token, body: { month: '2026-09', week: 'W1', rows: noBdoRows } });
    ok('weekly upload works with no BDO attached', upNoBdo.status === 200 && upNoBdo.data.rows === 3);
    ok('rows link to file BDO + unassigned bucket', upNoBdo.data.bdos.indexOf('mary') >= 0 && upNoBdo.data.bdos.indexOf('unassigned') >= 0);
    ok('unknown file BDO auto-created', upNoBdo.data.createdBdos.indexOf('zawadi') >= 0);

    var bdosNow = await jf('/api/users/bdos', { token: token });
    ok('auto-created BDO appears in BDO list', bdosNow.data.some(function (b) { return b.username === 'zawadi'; }));

    var maryBase = await jf('/api/base/mary/2026-09', { token: token });
    ok('file-linked agent lands in that BDO base', maryBase.data.counts.total === 1);

    /* ---- Monthly targets ---- */
    var tgtRows = [
      { 'Station': 'Arusha', 'Target Agents': 500, 'Target Float': 200000000, 'Target Served': 420, 'Target Visits': 100 },
      { 'Station': 'Manyara', 'Target Agents': 100, 'Target Float': 30000000, 'Target Served': 80, 'Target Visits': 40 }
    ];
    var tgtUp = await jf('/api/uploads/targets', { method: 'POST', token: token, body: { month: '2026-07', rows: tgtRows } });
    ok('monthly targets upload accepted', tgtUp.status === 200 && tgtUp.data.rows === 2);
    var tgtGet = await jf('/api/uploads/targets/2026-07', { token: token });
    ok('targets read back per month', tgtGet.status === 200 && tgtGet.data.length === 2 && tgtGet.data[0].agentsTarget === 500);

    /* ---- Phase 3: commission, clawback, analytics, executive ---- */
    var mdLogin = await jf('/api/auth/login', { method: 'POST', body: { username: 'md', password: 'imani123' } });
    var mdToken = mdLogin.data.token;

    var finalRows = [];
    for (var f = 1; f <= 10; f++) finalRows.push({ 'SA Commission': 12500000, 'Served Status': (f <= 8 ? 'SERVED' : 'NOT_SERVED'), 'Float': 1000000, 'Unique': 'Unique' });
    var finalUp = await jf('/api/commission/final', { method: 'POST', token: token, body: { month: '2026-10', rows: finalRows } });
    ok('final performance upload accepted', finalUp.status === 200 && finalUp.data.rows === 10);

    var calc = await jf('/api/commission/calc', { method: 'POST', token: token, body: { month: '2026-10', achievement: 82 } });
    ok('commission: SERVED-only total = 100M', calc.status === 200 && calc.data.calc.total === 100000000);
    ok('commission: fixed 30M / variable pool 70M', calc.data.calc.fixedPool === 30000000 && calc.data.calc.variablePool === 70000000);
    ok('commission: 82% releases 80% -> variablePaid 56M, final 86M', calc.data.calc.variablePaid === 56000000 && calc.data.calc.final === 86000000);

    var commGet = await jf('/api/commission/2026-10', { token: token });
    ok('saved commission reads back', commGet.data.saved && commGet.data.saved.final === 86000000);

    var claw = await jf('/api/clawback/2026-10', { method: 'POST', token: token, body: { earned: 125000000, recovered: 4200000, reasons: [{ label: 'Dormant Agents', amount: 9400000 }] } });
    ok('clawback: net = earned - potential', claw.status === 200 && claw.data.clawback.potential === 9400000 && claw.data.clawback.net === 115600000);

    var hist = await jf('/api/commission/history', { token: mdToken });
    ok('analytics history includes the month with clawback', hist.status === 200 && hist.data.some(function (m) { return m.month === '2026-10' && m.clawback === 9400000; }));

    var exec = await jf('/api/executive/2026-10', { token: mdToken });
    ok('executive: commission 86M, clawback 9.4M, net 76.6M', exec.status === 200 && exec.data.commission === 86000000 && exec.data.potentialClawback === 9400000 && exec.data.net === 76600000);

    var bdoBlocked = await jf('/api/commission/2026-10', { token: token });
    ok('commission endpoint allows OM', bdoBlocked.status === 200);

    /* ---- Phase 4: BDO login + live serve + AI insights ---- */
    var johnLogin = await jf('/api/auth/login', { method: 'POST', body: { username: 'john', password: 'imani123' } });
    ok('BDO can log in', johnLogin.status === 200 && johnLogin.data.user.role === 'bdo');
    var johnToken = johnLogin.data.token;

    var johnCommission = await jf('/api/commission/2026-10', { token: johnToken });
    ok('BDO blocked from commission', johnCommission.status === 403);

    var othersBase = await jf('/api/base/mary/2026-09', { token: johnToken });
    ok('BDO cannot view another BDO base', othersBase.status === 403);

    /* Seed one uploaded (not served) agent in john's Sep base, then serve it live. */
    await jf('/api/uploads/weekly', { method: 'POST', token: token, body: { bdo: 'john', month: '2026-11', rows: [{ 'Agent Account': 'S1', 'Agent Name': 'Serve Me', 'Agent Visit': 'NO', 'Served Status': 'NOT_SERVED' }] } });
    var preBase = await jf('/api/base/john/2026-11', { token: johnToken });
    var serveTarget = preBase.data.agents[0];
    ok('agent starts not-served in base', serveTarget && serveTarget.servedThisMonth === false);

    var serveRes = await jf('/api/serve', { method: 'POST', token: johnToken, body: { agentId: serveTarget.id, month: '2026-11', odk: 'YES', apk: 'YES', gps: { lat: -3.386, lng: 36.68 } } });
    ok('BDO serve records a visit', serveRes.status === 200 && serveRes.data.gps === true);
    var postBase = await jf('/api/base/john/2026-11', { token: johnToken });
    ok('agent now shows served', postBase.data.agents[0].servedThisMonth === true);

    var questions = await jf('/api/insights/questions', { token: mdToken });
    ok('insights presets listed', questions.status === 200 && questions.data.length >= 6);
    var askClaw = await jf('/api/insights/ask', { method: 'POST', token: mdToken, body: { q: 'top-clawback', month: '2026-10' } });
    ok('insight: top clawback answered from data', askClaw.status === 200 && /clawback/i.test(askClaw.data.answer));
    var askFree = await jf('/api/insights/ask', { method: 'POST', token: mdToken, body: { q: 'which agents are missing a location?', month: '2026-07' } });
    ok('insight: free-text maps to an intent', askFree.status === 200 && askFree.data.intent === 'partner-missing-location');
    var askUnknown = await jf('/api/insights/ask', { method: 'POST', token: mdToken, body: { q: 'hello there', month: '2026-07' } });
    ok('insight: unknown question returns suggestions', askUnknown.status === 200 && Array.isArray(askUnknown.data.suggestions));

    /* ---- Super Admin + RBAC ---- */
    var sa = await jf('/api/auth/login', { method: 'POST', body: { username: 'superadmin', password: 'imani123' } });
    ok('super admin can log in', sa.status === 200 && sa.data.user.role === 'superadmin');
    var saToken = sa.data.token;

    var omToAdmin = await jf('/api/admin/permissions', { token: token });
    ok('non-superadmin blocked from admin panel', omToAdmin.status === 403);

    var permsGet = await jf('/api/admin/permissions', { token: saToken });
    ok('super admin reads the permission matrix', permsGet.status === 200 && permsGet.data.superadmin.admin.view === true);

    var mdUp = await jf('/api/uploads/weekly', { method: 'POST', token: mdToken, body: { bdo: 'john', month: '2026-07', rows: [{ 'Agent Account': 'Z1', 'Agent Name': 'Z' }] } });
    ok('MD blocked from upload (no permission)', mdUp.status === 403);

    var matrix = permsGet.data;
    matrix.md.upload = { view: true, edit: true, delete: false };
    var putRes = await jf('/api/admin/permissions', { method: 'PUT', token: saToken, body: { matrix: matrix } });
    ok('super admin saves a permission change', putRes.status === 200);

    var mdMe = await jf('/api/auth/permissions', { token: mdToken });
    ok('MD now sees upload permission', mdMe.data.modules.upload.edit === true);
    var mdUp2 = await jf('/api/uploads/weekly', { method: 'POST', token: mdToken, body: { bdo: 'john', month: '2026-07', rows: [{ 'Agent Account': 'Z1', 'Agent Name': 'Z', 'Served Status': 'SERVED', 'Agent Visit': 'YES' }] } });
    ok('MD can upload after being granted', mdUp2.status === 200);

    var newU = await jf('/api/admin/users', { method: 'POST', token: saToken, body: { username: 'auditor', name: 'Auditor', role: 'md', password: 'pw123' } });
    ok('super admin creates a member', newU.status === 200 && newU.data.username === 'auditor');
    var disable = await jf('/api/admin/users/' + newU.data.id, { method: 'PATCH', token: saToken, body: { active: false } });
    ok('super admin disables a member', disable.status === 200 && disable.data.active === false);
    var disabledLogin = await jf('/api/auth/login', { method: 'POST', body: { username: 'auditor', password: 'pw123' } });
    ok('disabled member cannot log in', disabledLogin.status === 401);
    var del = await jf('/api/admin/users/' + newU.data.id, { method: 'DELETE', token: saToken });
    ok('super admin deletes a member', del.status === 200);

    var saSelf = (await jf('/api/admin/users', { token: saToken })).data.filter(function (u) { return u.role === 'superadmin'; })[0];
    var delSa = await jf('/api/admin/users/' + saSelf.id, { method: 'DELETE', token: saToken });
    ok('super admin account is protected from deletion', delSa.status === 400);

    /* ---- Hardening: forced password change, lockout, pagination, audit ---- */
    ok('login flags mustChangePassword for seeded accounts', sa.data.user.mustChangePassword === true);
    var cpBad = await jf('/api/auth/change-password', { method: 'POST', token: saToken, body: { currentPassword: 'wrong', newPassword: 'LongEnough1' } });
    ok('change-password rejects a wrong current password', cpBad.status === 400);
    var cpShort = await jf('/api/auth/change-password', { method: 'POST', token: saToken, body: { currentPassword: 'imani123', newPassword: 'short' } });
    ok('change-password enforces minimum length', cpShort.status === 400);
    var cpOk = await jf('/api/auth/change-password', { method: 'POST', token: saToken, body: { currentPassword: 'imani123', newPassword: 'NewStrongPass1' } });
    ok('change-password succeeds', cpOk.status === 200);
    var meAfter = await jf('/api/auth/me', { token: saToken });
    ok('mustChangePassword cleared after change', meAfter.data.user.mustChangePassword === false);
    var oldPw = await jf('/api/auth/login', { method: 'POST', body: { username: 'superadmin', password: 'imani123' } });
    ok('old password rejected after change', oldPw.status === 401);
    var newPw = await jf('/api/auth/login', { method: 'POST', body: { username: 'superadmin', password: 'NewStrongPass1' } });
    ok('new password works', newPw.status === 200);

    var agPage = await jf('/api/agents?page=1&limit=5', { token: token });
    ok('agents endpoint is paginated', agPage.status === 200 && Array.isArray(agPage.data.items) && typeof agPage.data.total === 'number');

    var auditLog = await jf('/api/admin/audit', { token: newPw.data.token });
    ok('super admin can read the audit trail', auditLog.status === 200 && Array.isArray(auditLog.data) && auditLog.data.length > 0);

    var lockRes = null;
    for (var L = 0; L < 7; L++) lockRes = await jf('/api/auth/login', { method: 'POST', body: { username: 'lockme', password: 'x' } });
    ok('account locks after repeated failures (429)', lockRes.status === 429);

    /* ---- MFA end-to-end (enable, login gate, disable) ---- */
    var omTok = (await jf('/api/auth/login', { method: 'POST', body: { username: 'om', password: 'imani123' } })).data.token;
    var setup = await jf('/api/auth/mfa/setup', { method: 'POST', token: omTok });
    ok('MFA setup returns a secret + QR', setup.status === 200 && !!setup.data.secret && /<svg/.test(setup.data.qrSvg));
    var confirmBad = await jf('/api/auth/mfa/confirm', { method: 'POST', token: omTok, body: { code: '000000' } });
    ok('MFA confirm rejects a wrong code', confirmBad.status === 400);
    var confirmOk = await jf('/api/auth/mfa/confirm', { method: 'POST', token: omTok, body: { code: mfa.totp(setup.data.secret) } });
    ok('MFA confirm enables with a valid code', confirmOk.status === 200);

    var loginNoCode = await jf('/api/auth/login', { method: 'POST', body: { username: 'om', password: 'imani123' } });
    ok('login now demands a second factor', loginNoCode.status === 200 && loginNoCode.data.mfaRequired === true && !loginNoCode.data.token);
    var loginWrong = await jf('/api/auth/login', { method: 'POST', body: { username: 'om', password: 'imani123', code: '111111' } });
    ok('login rejects a wrong 2FA code', loginWrong.status === 401);
    var loginOk = await jf('/api/auth/login', { method: 'POST', body: { username: 'om', password: 'imani123', code: mfa.totp(setup.data.secret) } });
    ok('login succeeds with a valid 2FA code', loginOk.status === 200 && !!loginOk.data.token);

    var disable = await jf('/api/auth/mfa/disable', { method: 'POST', token: omTok, body: { code: mfa.totp(setup.data.secret) } });
    ok('MFA can be disabled with a valid code', disable.status === 200);
    var loginAfter = await jf('/api/auth/login', { method: 'POST', body: { username: 'om', password: 'imani123' } });
    ok('login no longer needs 2FA after disable', loginAfter.status === 200 && !!loginAfter.data.token);

    /* ---- Monitoring: health + Prometheus metrics ---- */
    var health = await jf('/api/health');
    ok('health reports db up, uptime and version', health.status === 200 && health.data.db === 'up' && typeof health.data.uptime === 'number' && !!health.data.version);
    var mres = await fetch(base + '/api/metrics');
    var mtext = await mres.text();
    ok('metrics endpoint serves Prometheus text', mres.status === 200 && /imani_http_requests_total/.test(mtext) && /imani_http_request_duration_seconds_bucket/.test(mtext));
  } finally {
    server.close();
  }
}

(async function () {
  try {
    unitTests();
    await integrationTests();
    console.log('\nSMOKE OK - ' + pass + ' assertions passed.');
    process.exit(0);
  } catch (e) {
    console.error('\nSMOKE FAILED: ' + e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
