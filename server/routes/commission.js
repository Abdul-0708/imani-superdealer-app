'use strict';
var express = require('express');
var multer = require('multer');
var XLSX = require('xlsx');
var auth = require('../auth');
var db = require('../db');
var commission = require('../services/commission');
var finalParser = require('../services/final');
var perms = require('../permissions');

var router = express.Router();
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
function rowsFromBuffer(buf) { var wb = XLSX.read(buf, { type: 'buffer' }); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }); }

/* Actual served agents this month (from service history). */
async function actualServed(repo, month) {
  var svc = await repo.listService({ month: month });
  var set = {};
  svc.forEach(function (s) { if (s.servedStatus === 'SERVED') set[s.agentId] = true; });
  return { count: Object.keys(set).length, svc: svc };
}
/* Suggested office achievement % from targets (served) vs actuals; null if no target. */
async function suggestAchievement(repo, month) {
  var targets = await repo.getTargets(month);
  var totalServedTarget = targets.reduce(function (s, t) { return s + (Number(t.servedTarget) || 0); }, 0);
  if (!totalServedTarget) return null;
  var a = await actualServed(repo, month);
  return Math.round((a.count / totalServedTarget) * 100);
}
/* Commission source rows: the uploaded Final file if present, else derive from weekly service data. */
async function sourceRows(repo, month) {
  var final = await repo.getCommissionFinal(month);
  if (final && final.rows && final.rows.length) return { rows: final.rows, from: 'final' };
  var a = await actualServed(repo, month);
  var rows = a.svc.map(function (s) { return { saCommission: s.saCommission, servedStatus: s.servedStatus }; });
  return { rows: rows, from: 'weekly' };
}

/* GET /api/commission/history -> saved calcs joined with clawback, for analytics. */
router.get('/history', auth.requireAuth, perms.requirePerm('commission', 'view'), async function (req, res) {
  try {
    var repo = db.get();
    var calcs = await repo.listCommissionCalc();
    var claws = await repo.listClawback();
    var clawByMonth = {};
    claws.forEach(function (c) { clawByMonth[c.month] = c; });
    var out = calcs.map(function (c) {
      var cb = clawByMonth[c.month];
      return { month: c.month, total: c.total, fixed: c.fixedPool, variable: c.variablePaid,
        variablePool: c.variablePool, final: c.final, achievement: c.achievement,
        clawback: cb ? cb.potential : 0, net: cb ? (c.final - cb.potential) : c.final };
    }).sort(function (a, b) { return a.month < b.month ? -1 : 1; });
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/commission/final  (OM/MD) - upload the Month_Final.xlsx. */
router.post('/final', auth.requireAuth, perms.requirePerm('commission', 'edit'), upload.single('file'), async function (req, res) {
  try {
    var repo = db.get();
    var body = req.body || {};
    var month = String(body.month || new Date().toISOString().slice(0, 7));
    var rawRows;
    if (req.file && req.file.buffer) rawRows = rowsFromBuffer(req.file.buffer);
    else if (Array.isArray(body.rows)) rawRows = body.rows;
    else return res.status(400).json({ error: 'No file or rows provided' });
    var rows = finalParser.parse(rawRows);
    if (!rows.length) return res.status(400).json({ error: 'No valid rows (need SA Commission and/or Served Status)' });
    await repo.setCommissionFinal(month, { filename: (req.file && req.file.originalname) || 'inline', rows: rows });
    await repo.addAudit({ userId: req.user.uid, action: 'commission_final', detail: month + ' rows=' + rows.length });
    res.json({ ok: true, month: month, rows: rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/commission/:month -> saved calc + live preview + achievement suggestion. */
router.get('/:month', auth.requireAuth, perms.requirePerm('commission', 'view'), async function (req, res) {
  try {
    var repo = db.get();
    var month = req.params.month;
    var final = await repo.getCommissionFinal(month);
    var saved = await repo.getCommissionCalc(month);
    var suggestion = await suggestAchievement(repo, month);
    var src = await sourceRows(repo, month);
    var ach = (saved && saved.achievement != null) ? saved.achievement : (suggestion != null ? suggestion : 0);
    var preview = commission.calc(src.rows, ach);
    res.json({ month: month, source: src.from, hasFinal: !!final, finalRows: final ? final.rows.length : 0,
      suggestion: suggestion, saved: saved, preview: preview });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/commission/calc { month, achievement }  (OM/MD) -> compute + save. */
router.post('/calc', auth.requireAuth, perms.requirePerm('commission', 'edit'), async function (req, res) {
  try {
    var repo = db.get();
    var body = req.body || {};
    var month = String(body.month || '');
    if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Provide month as YYYY-MM' });
    var suggestion = await suggestAchievement(repo, month);
    var ach = (body.achievement !== undefined && body.achievement !== '' && body.achievement !== null)
      ? Number(body.achievement) : (suggestion != null ? suggestion : 0);
    var src = await sourceRows(repo, month);
    var calc = commission.calc(src.rows, ach);
    await repo.setCommissionCalc(month, calc);
    await repo.addAudit({ userId: req.user.uid, action: 'commission_calc', detail: month + ' ach=' + ach + ' final=' + Math.round(calc.final) });
    res.json({ ok: true, month: month, source: src.from, calc: calc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
module.exports.helpers = { actualServed: actualServed, suggestAchievement: suggestAchievement };
