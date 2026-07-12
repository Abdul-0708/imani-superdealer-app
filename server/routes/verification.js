'use strict';
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var verify = require('../services/verify');
var perms = require('../permissions');

var router = express.Router();

/* Build claim rows (service history joined with agent account) for a month. */
async function buildClaims(repo, month) {
  var svc = await repo.listService({ month: month });
  var agents = await repo.listAgents({});
  var accById = {}, nameById = {};
  agents.forEach(function (a) { accById[a.id] = a.acc; nameById[a.id] = a.name; });
  return svc.map(function (s) {
    return { id: s.id, agentId: s.agentId, acc: accById[s.agentId] || '', name: nameById[s.agentId] || '',
      bdo: s.bdo, odk: s.odk, apk: s.apk, servedStatus: s.servedStatus };
  });
}

async function computeVerification(repo, month) {
  var claims = await buildClaims(repo, month);
  var bankRows = await repo.getBankRows(month);
  var result = verify.verify(claims, bankRows);
  var users = await repo.listUsers();
  var nameByKey = {};
  users.forEach(function (u) { nameByKey[u.username] = u.name; });
  var byBdo = Object.keys(result.byBdo).map(function (k) {
    var t = result.byBdo[k];
    return { bdo: k, name: nameByKey[k] || k, total: t.total, verified: t.verified,
      visitFalse: t.visitFalse, apkFalse: t.apkFalse, uniqueFalse: t.uniqueFalse, integrity: t.integrity };
  }).sort(function (a, b) { return a.integrity - b.integrity; });
  return { claims: claims, bankRows: bankRows, result: result, byBdo: byBdo, hasBank: bankRows.length > 0 };
}

/* GET /api/verification/:month -> live false-claim tallies (no writes). */
router.get('/:month', auth.requireAuth, perms.requirePerm('verification', 'view'), async function (req, res) {
  try {
    var repo = db.get();
    var month = req.params.month;
    var c = await computeVerification(repo, month);
    var falseRows = c.result.rows.filter(function (r) { return r.result === 'FALSE'; }).slice(0, 200);
    res.json({ month: month, hasBank: c.hasBank, byBdo: c.byBdo, falseRows: falseRows,
      falseCount: c.result.rows.filter(function (r) { return r.result === 'FALSE'; }).length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/verification/run { month }  (OM/MD) -> back-fill service statuses. */
router.post('/run', auth.requireAuth, perms.requirePerm('verification', 'edit'), async function (req, res) {
  try {
    var repo = db.get();
    var month = String((req.body || {}).month || '');
    if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Provide month as YYYY-MM' });
    var c = await computeVerification(repo, month);
    if (!c.hasBank) return res.status(400).json({ error: 'Upload the bank file for ' + month + ' first' });
    var bankIdx = verify.bankIndex(c.bankRows);
    var updated = 0;
    for (var i = 0; i < c.claims.length; i++) {
      var claim = c.claims[i];
      var status = verify.serviceStatus(claim, bankIdx[claim.acc]);
      await repo.updateServiceVerification(claim.id, status);
      updated++;
    }
    await repo.addAudit({ userId: req.user.uid, action: 'verify_run', detail: month + ' updated=' + updated });
    res.json({ ok: true, month: month, updated: updated, byBdo: c.byBdo });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
module.exports.helpers = { computeVerification: computeVerification };
