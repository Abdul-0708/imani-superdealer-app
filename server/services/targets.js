'use strict';
/*
 * Monthly Target parser (spec section 15 "Monthly Target Uploads").
 * Office/station KPI targets for a month. Feeds the commission achievement
 * calculation in Phase 3. PURE. Flexible columns; Station defaults to "Office".
 */
var weekly = require('./weekly');

function indexRow(row) {
  var idx = {};
  Object.keys(row).forEach(function (k) { idx[weekly.normKey(k)] = row[k]; });
  return idx;
}
function pick(idx, names) {
  for (var i = 0; i < names.length; i++) {
    var n = weekly.normKey(names[i]);
    if (idx[n] !== undefined && idx[n] !== null && String(idx[n]).trim() !== '') return idx[n];
  }
  return '';
}
function num(v) { var n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }

var COLS = {
  station: ['Station', 'kituo', 'office', 'region', 'branch'],
  agents: ['Target Agents', 'agents', 'agenttarget', 'targetagents', 'agentstarget'],
  float: ['Target Float', 'float', 'floattarget', 'targetfloat'],
  served: ['Target Served', 'served', 'targetserved', 'unique', 'uniquetarget', 'servedtarget'],
  visits: ['Target Visits', 'visits', 'visittarget', 'targetvisits']
};

function parseRow(row) {
  var idx = indexRow(row);
  var station = String(pick(idx, COLS.station)).trim() || 'Office';
  return {
    station: station,
    agentsTarget: num(pick(idx, COLS.agents)),
    floatTarget: num(pick(idx, COLS.float)),
    servedTarget: num(pick(idx, COLS.served)),
    visitsTarget: num(pick(idx, COLS.visits))
  };
}

function parse(rows) {
  var out = [];
  (rows || []).forEach(function (r) {
    var p = parseRow(r);
    if (p.agentsTarget || p.floatTarget || p.servedTarget || p.visitsTarget) out.push(p);
  });
  return out;
}

module.exports = { parse: parse, parseRow: parseRow };
