'use strict';
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var commissionRoute = require('./commission');
var perms = require('../permissions');

var router = express.Router();

function daysInMonth(month) {
  var p = month.split('-'); return new Date(Number(p[0]), Number(p[1]), 0).getDate();
}
/* Local (not UTC) date parts, to match how service rows store their date. */
function localDateParts() {
  var d = new Date();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return { iso: d.getFullYear() + '-' + mm + '-' + dd, month: d.getFullYear() + '-' + mm, day: d.getDate() };
}

/* GET /api/executive/:month -> live headline numbers for the MD landing (spec section 14). */
router.get('/:month', auth.requireAuth, perms.requirePerm('executive', 'view'), async function (req, res) {
  try {
    var repo = db.get();
    var month = req.params.month;
    var agents = await repo.listAgents({});
    var svc = await repo.listService({ month: month });

    var local = localDateParts();
    var servedSet = {}, todaySet = {};
    var todayISO = local.iso;
    svc.forEach(function (s) {
      if (s.servedStatus === 'SERVED') { servedSet[s.agentId] = true; if (s.date === todayISO) todaySet[s.agentId] = true; }
    });
    var served = Object.keys(servedSet).length;
    var totalAgents = agents.length;
    var servedRate = totalAgents ? Math.round((served / totalAgents) * 100) : 0;

    var suggestion = await commissionRoute.helpers.suggestAchievement(repo, month);
    var comm = await repo.getCommissionCalc(month);
    var officePerformance = (comm && comm.achievement) ? comm.achievement : (suggestion != null ? suggestion : servedRate);

    /* Today's achievement vs the month's per-day served target (fallback: served rate). */
    var targets = await repo.getTargets(month);
    var totalServedTarget = targets.reduce(function (s, t) { return s + (Number(t.servedTarget) || 0); }, 0);
    var dim = daysInMonth(month);
    var todaysAchievement = servedRate;
    if (totalServedTarget) { var perDay = totalServedTarget / dim; todaysAchievement = perDay ? Math.min(100, Math.round((Object.keys(todaySet).length / perDay) * 100)) : 0; }

    /* Projected month-end: scale current served rate by elapsed fraction of the month. */
    var curMonth = local.month;
    var elapsed = (month === curMonth) ? local.day : dim;
    var projected = Math.min(100, Math.round(servedRate * (dim / Math.max(1, elapsed))));

    var cb = await repo.getClawback(month);
    var commissionAmt = comm ? comm.final : 0;
    var clawAmt = cb ? cb.potential : 0;
    var net = commissionAmt - clawAmt;

    res.json({
      month: month, totalAgents: totalAgents, served: served,
      officePerformance: officePerformance, todaysAchievement: todaysAchievement, projectedMonthEnd: projected,
      commission: commissionAmt, potentialClawback: clawAmt, net: net,
      hasCommission: !!comm, hasClawback: !!cb
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
