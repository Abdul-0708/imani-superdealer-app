'use strict';
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var perms = require('../permissions');

var router = express.Router();

function todayParts() {
  var d = new Date();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  var hh = String(d.getHours()).padStart(2, '0');
  var mi = String(d.getMinutes()).padStart(2, '0');
  return { date: d.getFullYear() + '-' + mm + '-' + dd, time: hh + ':' + mi, month: d.getFullYear() + '-' + mm };
}

/*
 * POST /api/serve  (BDO live serving; OM/MD may serve on a BDO's behalf)
 * body: { agentId, month?, gps?:{lat,lng}, odk:'YES'|'NO', apk:'YES'|'NO', float?, bdo? }
 * Records a SERVED service_history row and keeps the agent in that BDO's base.
 */
router.post('/', auth.requireAuth, perms.requirePerm('mybase', 'edit'), async function (req, res) {
  try {
    var repo = db.get();
    var body = req.body || {};
    var bdo = (req.user.role === 'bdo') ? req.user.username : String(body.bdo || 'unassigned').toLowerCase();
    var agentId = Number(body.agentId);
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });
    var agent = await repo.getAgentById(agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    var tp = todayParts();
    var month = String(body.month || tp.month);
    var gps = (body.gps && body.gps.lat != null && body.gps.lng != null) ? { lat: Number(body.gps.lat), lng: Number(body.gps.lng) } : null;

    await repo.addServiceRows([{
      agentId: agentId, bdo: bdo, month: month, week: String(body.week || ''), date: tp.date, time: tp.time,
      gps: gps, odk: (body.odk === 'YES') ? 'YES' : 'NO', apk: (body.apk === 'YES') ? 'YES' : 'NO',
      floatServed: Number(body.float) || 0, activeness: 'Active', saCommission: 0,
      servedStatus: 'SERVED', source: 'bdo'
    }]);
    /* Persist an in-app GPS capture onto the agent when provided. */
    if (gps) await repo.upsertAgentByAcc({ acc: agent.acc, gps: gps });
    await repo.addUploaded(month, bdo, [agentId]);
    await repo.addAudit({ userId: req.user.uid, action: 'serve', detail: bdo + ' agent=' + agentId + ' ' + month });

    res.json({ ok: true, bdo: bdo, agentId: agentId, month: month, gps: !!gps });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
