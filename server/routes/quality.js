'use strict';
var express = require('express');
var XLSX = require('xlsx');
var auth = require('../auth');
var db = require('../db');
var perms = require('../permissions');

var router = express.Router();

function normName(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

async function analyze(repo) {
  var agents = await repo.listAgents({});
  var missingGps = [], missingLocation = [], missingPhone = [], unknownBranch = [], unknownLocations = [];
  var byName = {};
  agents.forEach(function (a) {
    if (!a.gps) missingGps.push(a);
    if (!a.physicalLocation) missingLocation.push(a);
    if (!a.phone) missingPhone.push(a);
    if (!a.branch) unknownBranch.push(a);
    if (a.partner && !a.physicalLocation) unknownLocations.push(a);
    var n = normName(a.name);
    if (n) (byName[n] = byName[n] || []).push(a);
  });
  var duplicates = [];
  Object.keys(byName).forEach(function (n) { if (byName[n].length > 1) duplicates = duplicates.concat(byName[n]); });
  return { agents: agents, missingGps: missingGps, missingLocation: missingLocation, missingPhone: missingPhone,
    unknownBranch: unknownBranch, duplicates: duplicates, unknownLocations: unknownLocations };
}

function slim(a) { return { id: a.id, acc: a.acc, name: a.name, phone: a.phone, branch: a.branch, station: a.station, physicalLocation: a.physicalLocation, partner: a.partner }; }

/* GET /api/quality -> data-quality dashboard (spec section 9) + unknown-location list (section 8). */
router.get('/', auth.requireAuth, perms.requirePerm('quality', 'view'), async function (req, res) {
  try {
    var a = await analyze(db.get());
    res.json({
      counts: {
        missingGps: a.missingGps.length, missingLocation: a.missingLocation.length,
        missingPhone: a.missingPhone.length, unknownBranch: a.unknownBranch.length,
        duplicates: a.duplicates.length, unknownLocations: a.unknownLocations.length
      },
      unknownLocations: a.unknownLocations.map(slim),
      missingPhone: a.missingPhone.map(slim),
      missingLocation: a.missingLocation.map(slim),
      duplicates: a.duplicates.map(slim),
      unknownBranch: a.unknownBranch.map(slim)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/quality/unknown-locations.xlsx  (OM/MD) - download for BDO assignment (spec section 8). */
router.get('/unknown-locations.xlsx', auth.requireAuth, perms.requirePerm('quality', 'view'), async function (req, res) {
  try {
    var a = await analyze(db.get());
    var aoa = [['Agent Account', 'Agent Name', 'Partner', 'Physical Location', 'Phone', 'Branch', 'Station']];
    a.unknownLocations.forEach(function (x) {
      aoa.push([x.acc, x.name, x.partner ? 'YES' : 'NO', x.physicalLocation || 'Missing', x.phone, x.branch, x.station]);
    });
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = aoa[0].map(function () { return { wch: 18 }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Unknown Locations');
    var buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="unknown_locations.xlsx"');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
