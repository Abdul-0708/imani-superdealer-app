'use strict';
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var priority = require('../services/priority');
var perms = require('../permissions');

var router = express.Router();

/*
 * GET /api/base/:bdo/:month
 * The BDO's permanent working base for the month: uploaded + carried priority,
 * tagged green/yellow/red and sorted priority-first, plus the working-base counts.
 */
router.get('/:bdo/:month', auth.requireAuth, async function (req, res) {
  try {
    var repo = db.get();
    var bdo = String(req.params.bdo).toLowerCase();
    var month = req.params.month;
    if (req.user.role === 'bdo') {
      if (bdo !== req.user.username) return res.status(403).json({ error: 'BDOs can only view their own base' });
    } else {
      var matrix = perms.mergeMatrix(await repo.getPermissions());
      if (!perms.capsFor(matrix, req.user.role, 'base').view) return res.status(403).json({ error: 'No access to agent base' });
    }

    var ids = await repo.getBase(month, bdo);
    var everServed = await repo.everServedAgentIds();

    var union = {};
    ids.priority.concat(ids.uploaded).forEach(function (id) { union[id] = true; });
    var agents = await repo.getAgentsByIds(Object.keys(union));

    var classified = priority.classifyList(agents, { priority: ids.priority, everServed: everServed });
    var servedNow = await repo.servedAgentIds(bdo, month);
    var servedSet = {}; servedNow.forEach(function (id) { servedSet[id] = true; });
    classified.forEach(function (a) { a.servedThisMonth = !!servedSet[a.id]; });
    var counts = priority.baseCounts({ priority: ids.priority, uploaded: ids.uploaded });
    res.json({ bdo: bdo, month: month, counts: counts, served: servedNow.length, agents: classified });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/*
 * POST /api/base/rollover { fromMonth }   (OM/MD)
 * Carry-forward: agents each BDO SERVED in fromMonth become next month's priority.
 */
router.post('/rollover', auth.requireAuth, perms.requirePerm('base', 'edit'), async function (req, res) {
  try {
    var repo = db.get();
    var fromMonth = String((req.body || {}).fromMonth || '');
    if (!/^\d{4}-\d{2}$/.test(fromMonth)) return res.status(400).json({ error: 'Provide fromMonth as YYYY-MM' });

    var svc = await repo.listService({ month: fromMonth });
    var servedByBdo = {};
    svc.forEach(function (s) {
      if (s.servedStatus !== 'SERVED') return;
      (servedByBdo[s.bdo] = servedByBdo[s.bdo] || []).push(s.agentId);
    });

    var plan = priority.rollover(fromMonth, servedByBdo);
    var summary = [];
    var bdos = Object.keys(plan.byBdo);
    for (var i = 0; i < bdos.length; i++) {
      await repo.setPriority(plan.month, bdos[i], plan.byBdo[bdos[i]]);
      summary.push({ bdo: bdos[i], priority: plan.byBdo[bdos[i]].length });
    }
    await repo.addAudit({ userId: req.user.uid, action: 'rollover', detail: fromMonth + ' -> ' + plan.month });
    res.json({ ok: true, fromMonth: fromMonth, toMonth: plan.month, summary: summary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
