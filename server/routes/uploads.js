'use strict';
var express = require('express');
var multer = require('multer');
var XLSX = require('xlsx');
var auth = require('../auth');
var db = require('../db');
var weekly = require('../services/weekly');
var bank = require('../services/bank');
var targets = require('../services/targets');
var perms = require('../permissions');

var router = express.Router();
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function todayParts() {
  var d = new Date();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  var hh = String(d.getHours()).padStart(2, '0');
  var mi = String(d.getMinutes()).padStart(2, '0');
  return { date: d.getFullYear() + '-' + mm + '-' + dd, time: hh + ':' + mi, month: d.getFullYear() + '-' + mm };
}
function rowsFromBuffer(buf) {
  var wb = XLSX.read(buf, { type: 'buffer' });
  var ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40); }
function isIsoDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s); }

/*
 * POST /api/uploads/weekly  (OM/MD)
 * Weekly / dated performance upload. NO BDO needs to be attached when uploading:
 *  - each row's BDO is taken from an optional BDO / Officer column in the file
 *  - a row with no BDO falls back to the optional form "bdo", else "unassigned"
 *  - a BDO named in the file that has no account yet is auto-created
 * multipart: field "file" + optional fields bdo, month, date, week
 * OR JSON: { bdo?, month?, date?, week?, rows:[...] }
 */
router.post('/weekly', auth.requireAuth, perms.requirePerm('upload', 'edit'), upload.single('file'), async function (req, res) {
  try {
    var repo = db.get();
    var body = req.body || {};
    var tp = todayParts();
    var globalBdo = String(body.bdo || '').trim();
    var formDate = String(body.date || '').trim();
    var month = String(body.month || (isIsoDate(formDate) ? formDate.slice(0, 7) : tp.month));
    var week = String(body.week || '');
    var svcDate = isIsoDate(formDate) ? formDate : tp.date;

    var rawRows;
    if (req.file && req.file.buffer) rawRows = rowsFromBuffer(req.file.buffer);
    else if (Array.isArray(body.rows)) rawRows = body.rows;
    else return res.status(400).json({ error: 'No file or rows provided' });

    var records = weekly.parse(rawRows);
    if (!records.length) return res.status(400).json({ error: 'No valid agent rows found (need at least an Agent Account column)' });

    /* Resolve a raw BDO label to a user key, auto-creating a BDO account if new. */
    var users = await repo.listUsers();
    var byKey = {}, byName = {};
    users.forEach(function (u) { byKey[u.username] = u; if (u.role === 'bdo') byName[u.name.toLowerCase()] = u.username; });
    var created = [];
    async function resolveBdo(raw) {
      raw = String(raw || '').trim();
      if (!raw) return 'unassigned';
      if (byName[raw.toLowerCase()]) return byName[raw.toLowerCase()];
      var k = slug(raw);
      if (!k) return 'unassigned';
      if (byKey[k]) return k;
      var u = await repo.createUser({ username: k, role: 'bdo', name: raw, station: '', passwordHash: auth.hashPassword('imani123'), active: true });
      byKey[k] = u; created.push(k);
      return k;
    }

    var uploadedByBdo = {};
    var serviceRows = [];
    var servedCount = 0;
    var agentSet = {};
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var key = await resolveBdo(r.bdo || globalBdo);
      var bdoUser = byKey[key];
      var agent = await repo.upsertAgentByAcc({
        acc: r.acc, name: r.name, phone: r.phone, branch: r.branch,
        station: bdoUser ? (bdoUser.station || '') : '', physicalLocation: r.physicalLocation, partner: r.partner, source: 'weekly'
      });
      agentSet[agent.id] = true;
      if (r.servedStatus === 'SERVED') servedCount++;
      serviceRows.push({
        agentId: agent.id, bdo: key, month: month, week: week, date: (isIsoDate(r.date) ? r.date : svcDate), time: tp.time,
        odk: r.agentVisit, apk: r.apkUpdate, floatServed: r.floatServed, activeness: r.activeness,
        saCommission: r.saCommission, servedStatus: r.servedStatus, source: 'weekly'
      });
      (uploadedByBdo[key] = uploadedByBdo[key] || []).push(agent.id);
    }
    await repo.addServiceRows(serviceRows);
    var keys = Object.keys(uploadedByBdo);
    for (var j = 0; j < keys.length; j++) await repo.addUploaded(month, keys[j], uploadedByBdo[keys[j]]);
    await repo.addWeeklyUpload({ filename: (req.file && req.file.originalname) || 'inline', month: month, week: week, bdo: globalBdo || '(from file)', uploadedBy: req.user.uid, rowCount: records.length });
    await repo.addAudit({ userId: req.user.uid, action: 'weekly_upload', detail: month + ' rows=' + records.length + ' bdos=' + keys.join('/') });

    res.json({ ok: true, month: month, week: week, agents: Object.keys(agentSet).length, served: servedCount, rows: records.length, bdos: keys, createdBdos: created });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/*
 * POST /api/uploads/bank  (OM/MD) - official monthly bank file (verification source).
 * multipart: field "file" + field month   OR   JSON: { month, rows:[...] }
 */
router.post('/bank', auth.requireAuth, perms.requirePerm('verification', 'edit'), upload.single('file'), async function (req, res) {
  try {
    var repo = db.get();
    var body = req.body || {};
    var month = String(body.month || todayParts().month);
    var rawRows;
    if (req.file && req.file.buffer) rawRows = rowsFromBuffer(req.file.buffer);
    else if (Array.isArray(body.rows)) rawRows = body.rows;
    else return res.status(400).json({ error: 'No file or rows provided' });

    var rows = bank.parse(rawRows);
    if (!rows.length) return res.status(400).json({ error: 'No valid bank rows found (need an Agent Account column)' });
    await repo.addBankRows(month, rows);
    await repo.addAudit({ userId: req.user.uid, action: 'bank_upload', detail: month + ' rows=' + rows.length });
    res.json({ ok: true, month: month, rows: rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/*
 * POST /api/uploads/targets  (OM/MD) - monthly office/station KPI targets.
 * multipart: field "file" + field month   OR   JSON: { month, rows:[...] }
 */
router.post('/targets', auth.requireAuth, perms.requirePerm('upload', 'edit'), upload.single('file'), async function (req, res) {
  try {
    var repo = db.get();
    var body = req.body || {};
    var month = String(body.month || todayParts().month);
    var rawRows;
    if (req.file && req.file.buffer) rawRows = rowsFromBuffer(req.file.buffer);
    else if (Array.isArray(body.rows)) rawRows = body.rows;
    else return res.status(400).json({ error: 'No file or rows provided' });

    var rows = targets.parse(rawRows);
    if (!rows.length) return res.status(400).json({ error: 'No valid target rows found (need a target column with a value)' });
    await repo.setTargets(month, rows);
    await repo.addAudit({ userId: req.user.uid, action: 'targets_upload', detail: month + ' rows=' + rows.length });
    res.json({ ok: true, month: month, rows: rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/uploads/targets/:month -> the saved targets for a month */
router.get('/targets/:month', auth.requireAuth, async function (req, res) {
  try { res.json(await db.get().getTargets(req.params.month)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/uploads -> recent upload history */
router.get('/', auth.requireAuth, async function (req, res) {
  try { res.json(await db.get().listWeeklyUploads()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
