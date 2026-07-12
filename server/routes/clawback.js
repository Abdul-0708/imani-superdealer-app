'use strict';
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var clawback = require('../services/clawback');
var perms = require('../permissions');

var router = express.Router();

/* Data-derived hints to help the manager fill in clawback reasons. */
async function hints(repo, month) {
  var svc = await repo.listService({ month: month });
  var dormant = {}, notServed = {}, apkMissing = 0;
  svc.forEach(function (s) {
    var act = String(s.activeness || '').toLowerCase();
    if (act.indexOf('dormant') >= 0 || act.indexOf('inactive') >= 0) dormant[s.agentId] = true;
    if (s.servedStatus !== 'SERVED') notServed[s.agentId] = true;
    if (s.servedStatus === 'SERVED' && s.apk !== 'YES') apkMissing++;
  });
  return { dormantAgents: Object.keys(dormant).length, notServedAgents: Object.keys(notServed).length, apkMissing: apkMissing };
}

/* GET /api/clawback/:month -> saved clawback + earned default (from commission) + hints. */
router.get('/:month', auth.requireAuth, perms.requirePerm('clawback', 'view'), async function (req, res) {
  try {
    var repo = db.get();
    var month = req.params.month;
    var saved = await repo.getClawback(month);
    var comm = await repo.getCommissionCalc(month);
    res.json({ month: month, saved: saved, earnedDefault: comm ? comm.total : 0, commissionFinal: comm ? comm.final : 0, hints: await hints(repo, month) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/clawback/:month { earned?, recovered?, reasons:[{label,amount}] }  (OM/MD). */
router.post('/:month', auth.requireAuth, perms.requirePerm('clawback', 'edit'), async function (req, res) {
  try {
    var repo = db.get();
    var month = req.params.month;
    if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Provide month as YYYY-MM' });
    var body = req.body || {};
    var comm = await repo.getCommissionCalc(month);
    var earned = (body.earned !== undefined && body.earned !== '' && body.earned !== null) ? Number(body.earned) : (comm ? comm.total : 0);
    var data = clawback.calc({ earned: earned, recovered: body.recovered, reasons: body.reasons || [] });
    await repo.setClawback(month, data);
    await repo.addAudit({ userId: req.user.uid, action: 'clawback_save', detail: month + ' net=' + Math.round(data.net) });
    res.json({ ok: true, month: month, clawback: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
