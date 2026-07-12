'use strict';
/*
 * Final Monthly Performance parser (spec section 11 step 1). The Month_Final.xlsx
 * contains SA Commission, Served Status, Float, Unique. Account/name optional
 * (unlike the weekly file). PURE.
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
  acc: ['Agent Account', 'account', 'acc'],
  name: ['Agent Name', 'name', 'agent'],
  saCommission: ['SA Commission', 'sacommission', 'commission', 'sacomm'],
  servedStatus: ['Served Status', 'served', 'servedstatus', 'status'],
  float: ['Float', 'floatserved', 'floatvalue'],
  unique: ['Unique', 'uniqueserving', 'uniquestatus', 'uniqueservingstatus']
};

function parseRow(row) {
  var idx = indexRow(row);
  var sa = pick(idx, COLS.saCommission);
  var served = pick(idx, COLS.servedStatus);
  if (sa === '' && served === '') return null;
  return {
    acc: String(pick(idx, COLS.acc)).trim(),
    name: String(pick(idx, COLS.name)).trim(),
    saCommission: num(sa),
    servedStatus: weekly.servedStatus(served),
    float: num(pick(idx, COLS.float)),
    unique: String(pick(idx, COLS.unique)).trim()
  };
}

function parse(rows) {
  var out = [];
  (rows || []).forEach(function (r) { var p = parseRow(r); if (p) out.push(p); });
  return out;
}

module.exports = { parse: parse, parseRow: parseRow };
