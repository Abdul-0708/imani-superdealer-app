'use strict';
var express = require('express');
var auth = require('../auth');
var db = require('../db');

var router = express.Router();

/* GET /api/dashboard/summary?month=YYYY-MM  -> headline KPI numbers */
router.get('/summary', auth.requireAuth, async function (req, res) {
  try {
    var repo = db.get();
    var month = String(req.query.month || new Date().toISOString().slice(0, 7));

    var agents = await repo.listAgents({});
    var svc = await repo.listService({ month: month });

    var servedSet = {};
    var visitYes = 0, apkYes = 0;
    svc.forEach(function (s) {
      if (s.servedStatus === 'SERVED') servedSet[s.agentId] = true;
      if (s.odk === 'YES') visitYes++;
      if (s.apk === 'YES') apkYes++;
    });
    var servedThisMonth = Object.keys(servedSet).length;

    var stationMap = {};
    agents.forEach(function (a) {
      var st = a.station || 'Unassigned';
      stationMap[st] = stationMap[st] || { station: st, agents: 0, served: 0 };
      stationMap[st].agents++;
    });
    Object.keys(servedSet).forEach(function (id) {
      var a = agents.filter(function (x) { return String(x.id) === String(id); })[0];
      var st = (a && a.station) || 'Unassigned';
      if (stationMap[st]) stationMap[st].served++;
    });

    var users = await repo.listUsers();
    res.json({
      month: month,
      totalAgents: agents.length,
      servedThisMonth: servedThisMonth,
      servedRate: agents.length ? Math.round((servedThisMonth / agents.length) * 100) : 0,
      visitYes: visitYes,
      apkYes: apkYes,
      bdoCount: users.filter(function (u) { return u.role === 'bdo'; }).length,
      stations: Object.keys(stationMap).map(function (k) { return stationMap[k]; }),
      uploads: (await repo.listWeeklyUploads()).slice(-8).reverse()
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
