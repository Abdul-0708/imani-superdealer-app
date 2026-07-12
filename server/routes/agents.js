'use strict';
var express = require('express');
var XLSX = require('xlsx');
var auth = require('../auth');
var db = require('../db');
var perms = require('../permissions');

var router = express.Router();

/* GET /api/agents?station=&branch=&search=&page=&limit= -> paginated */
router.get('/', auth.requireAuth, perms.requirePerm('agents', 'view'), async function (req, res) {
  try {
    var repo = db.get();
    var filter = { station: req.query.station, branch: req.query.branch, search: req.query.search };
    var limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    var page = Math.max(1, parseInt(req.query.page, 10) || 1);
    var total = await repo.countAgentsFiltered(filter);
    filter.limit = limit; filter.offset = (page - 1) * limit;
    var items = await repo.listAgents(filter);
    res.json({ items: items, total: total, page: page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

var EXPORT_HEADERS = ['Agent Account', 'Agent Name', 'Phone', 'Branch', 'Physical Location',
  'Date Served', 'Time Served', 'BDO Name', 'Status', 'Verification Status'];

/*
 * GET /api/agents/served.xlsx?bdo=&month=   (OM/MD)
 * Download the served-agents list for a BDO/month (spec section 3).
 */
router.get('/served.xlsx', auth.requireAuth, perms.requirePerm('agents', 'view'), async function (req, res) {
  try {
    var repo = db.get();
    var bdo = String(req.query.bdo || '').toLowerCase();
    var month = String(req.query.month || '');
    if (!bdo || !month) return res.status(400).json({ error: 'bdo and month are required' });

    var bdoUser = await repo.getUserByUsername(bdo);
    var bdoName = bdoUser ? bdoUser.name : bdo;
    var svc = await repo.listService({ bdo: bdo, month: month });
    var served = svc.filter(function (s) { return s.servedStatus === 'SERVED'; });

    var agentMap = {};
    (await repo.getAgentsByIds(served.map(function (s) { return s.agentId; }))).forEach(function (a) { agentMap[a.id] = a; });
    var aoa = [EXPORT_HEADERS];
    for (var i = 0; i < served.length; i++) {
      var s = served[i];
      var a = agentMap[s.agentId] || {};
      aoa.push([
        a.acc || '', a.name || '', a.phone || '', a.branch || '', a.physicalLocation || '',
        s.date || '', s.time || '', bdoName,
        (s.odk === 'YES' ? 'Visited' : 'No visit'),
        s.verificationStatus || 'PENDING'
      ]);
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = EXPORT_HEADERS.map(function () { return { wch: 18 }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Served');
    var buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="served_' + bdo + '_' + month + '.xlsx"');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
