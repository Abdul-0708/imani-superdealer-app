'use strict';
/*
 * AI Insights (spec section 16) - STUBBED, local only. No external model calls.
 * Preset management questions are answered directly from the data via resolvers.
 * Free text is matched to the nearest intent. The resolver interface is designed
 * so a real model backend could later replace `answer()` without touching callers.
 */
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var commission = require('../services/commission');
var commissionRoute = require('./commission');
var verificationRoute = require('./verification');
var perms = require('../permissions');

var router = express.Router();

var PRESETS = [
  { id: 'top-performer', label: 'Which BDO has the highest verified performance this month?' },
  { id: 'partner-missing-location', label: 'Show partner-served agents missing physical locations.' },
  { id: 'unserved-priority', label: 'Which priority agents have not yet been served this month?' },
  { id: 'projected-variable', label: 'How much variable commission is projected at current performance?' },
  { id: 'top-clawback', label: 'What are the top reasons for clawback this month?' },
  { id: 'best-integrity', label: 'Which BDO has the highest integrity over recent months?' }
];

function money(n) { return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function prevMonth(ym, back) {
  var p = ym.split('-'); var y = Number(p[0]), m = Number(p[1]);
  for (var i = 0; i < back; i++) { m--; if (m < 1) { m = 12; y--; } }
  return y + '-' + (m < 10 ? '0' + m : '' + m);
}

var RESOLVERS = {
  'top-performer': async function (repo, month) {
    var c = await verificationRoute.helpers.computeVerification(repo, month);
    if (!c.hasBank) return { answer: 'No bank file has been uploaded for ' + month + ' yet, so verified performance cannot be measured. Upload it under Verification.' };
    var ranked = c.byBdo.slice().sort(function (a, b) { return (b.integrity - a.integrity) || (b.verified - a.verified); });
    if (!ranked.length) return { answer: 'No verifiable claims for ' + month + ' yet.' };
    var top = ranked[0];
    return {
      answer: top.name + ' has the highest verified performance for ' + month + ' at ' + top.integrity + '% integrity (' + top.verified + ' of ' + top.total + ' claims verified).',
      rows: ranked.map(function (b) { return { BDO: b.name, Integrity: b.integrity + '%', Verified: b.verified, 'False': (b.visitFalse + b.apkFalse + b.uniqueFalse) }; })
    };
  },
  'partner-missing-location': async function (repo) {
    var agents = await repo.listAgents({});
    var list = agents.filter(function (a) { return a.partner && !a.physicalLocation; });
    return {
      answer: list.length ? (list.length + ' partner-served agent(s) are missing a physical location.') : 'Every partner-served agent has a physical location. Nothing to chase.',
      rows: list.map(function (a) { return { Agent: a.name, Account: a.acc, Branch: a.branch || '-' }; })
    };
  },
  'unserved-priority': async function (repo, month) {
    var bdos = await repo.listBaseBdos(month);
    var rows = [];
    for (var i = 0; i < bdos.length; i++) {
      var b = bdos[i];
      var base = await repo.getBase(month, b);
      if (!base.priority.length) continue;
      var served = await repo.servedAgentIds(b, month);
      var servedSet = {}; served.forEach(function (id) { servedSet[id] = true; });
      for (var j = 0; j < base.priority.length; j++) {
        var id = base.priority[j];
        if (!servedSet[id]) { var a = await repo.getAgentById(id); if (a) rows.push({ BDO: b, Agent: a.name, Account: a.acc }); }
      }
    }
    return { answer: rows.length ? (rows.length + ' priority agent(s) have not been served yet in ' + month + '.') : 'All priority agents have been served this month. Great continuity.', rows: rows };
  },
  'projected-variable': async function (repo, month) {
    var comm = await repo.getCommissionCalc(month);
    var suggestion = await commissionRoute.helpers.suggestAchievement(repo, month);
    var ach = (suggestion != null) ? suggestion : (comm ? comm.achievement : 0);
    var variablePool = comm ? comm.variablePool : 0;
    var projected = variablePool * commission.releaseFor(ach);
    if (!comm) return { answer: 'No commission has been calculated for ' + month + ' yet. Calculate it under Commission to project the variable pool.' };
    return { answer: 'At the current achievement of ' + ach + '%, the variable pool of ' + money(variablePool) + ' would release ' + Math.round(commission.releaseFor(ach) * 100) + '% = ' + money(projected) + ' in variable commission.' };
  },
  'top-clawback': async function (repo, month) {
    var cb = await repo.getClawback(month);
    if (!cb) return { answer: 'No clawback has been recorded for ' + month + ' yet.' };
    var reasons = (cb.reasons || []).slice().sort(function (a, b) { return (b.amount || 0) - (a.amount || 0); });
    return {
      answer: 'Total potential clawback for ' + month + ' is ' + money(cb.potential) + '. Top reason: ' + (reasons[0] ? reasons[0].label + ' (' + money(reasons[0].amount) + ')' : 'none') + '.',
      rows: reasons.map(function (r) { return { Reason: r.label, Amount: money(r.amount) }; })
    };
  },
  'best-integrity': async function (repo, month) {
    var agg = {};
    for (var k = 0; k < 6; k++) {
      var m = prevMonth(month, k);
      var c = await verificationRoute.helpers.computeVerification(repo, m);
      if (!c.hasBank) continue;
      c.byBdo.forEach(function (b) {
        if (!agg[b.bdo]) agg[b.bdo] = { name: b.name, sum: 0, n: 0 };
        agg[b.bdo].sum += b.integrity; agg[b.bdo].n++;
      });
    }
    var ranked = Object.keys(agg).map(function (k2) { return { name: agg[k2].name, avg: Math.round(agg[k2].sum / agg[k2].n), months: agg[k2].n }; })
      .sort(function (a, b) { return b.avg - a.avg; });
    if (!ranked.length) return { answer: 'No verification history in the last 6 months to rank integrity.' };
    return { answer: ranked[0].name + ' has the highest average integrity over the last ' + ranked[0].months + ' month(s): ' + ranked[0].avg + '%.', rows: ranked.map(function (r) { return { BDO: r.name, 'Avg Integrity': r.avg + '%', Months: r.months }; }) };
  }
};

function matchIntent(q) {
  q = String(q || '').toLowerCase();
  if (RESOLVERS[q]) return q;
  if (/clawback|claw back/.test(q)) return 'top-clawback';
  if (/location|partner|shop/.test(q)) return 'partner-missing-location';
  if (/priority|unserved|not served|not yet/.test(q)) return 'unserved-priority';
  if (/project|variable|forecast/.test(q)) return 'projected-variable';
  if (/integrity|six month|6 month|history/.test(q)) return 'best-integrity';
  if (/perform|highest|best bdo|verified|top/.test(q)) return 'top-performer';
  return null;
}

/* GET /api/insights/questions -> preset questions */
router.get('/questions', auth.requireAuth, perms.requirePerm('insights', 'view'), function (req, res) { res.json(PRESETS); });

/* POST /api/insights/ask { q, month } -> local answer */
router.post('/ask', auth.requireAuth, perms.requirePerm('insights', 'view'), async function (req, res) {
  try {
    var body = req.body || {};
    var month = String(body.month || new Date().toISOString().slice(0, 7));
    var intent = matchIntent(body.q);
    if (!intent) return res.json({ answer: 'I can answer these questions from your data:', suggestions: PRESETS });
    var out = await RESOLVERS[intent](db.get(), month);
    out.intent = intent; out.month = month;
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
