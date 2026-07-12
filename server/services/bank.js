'use strict';
/*
 * Bank-upload parser (spec section 5). The official monthly bank file is the
 * source of truth that BDO claims are verified against. PURE.
 * Recognized columns (flexible): Agent Account, Agent Visit, APK Update, Served Status.
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

var COLS = {
  acc: ['Agent Account', 'account', 'acc', 'agentacc'],
  visit: ['Agent Visit', 'visit', 'odk', 'agentvisit'],
  apk: ['APK Update', 'apk', 'apkupdate'],
  served: ['Served Status', 'served', 'servedstatus', 'unique', 'status']
};

function parseRow(row) {
  var idx = indexRow(row);
  var acc = String(pick(idx, COLS.acc)).trim();
  if (!acc) return null;
  return {
    acc: acc,
    visit: weekly.yesno(pick(idx, COLS.visit)),
    apk: weekly.yesno(pick(idx, COLS.apk)),
    served: weekly.servedStatus(pick(idx, COLS.served))
  };
}

function parse(rows) {
  var out = [];
  (rows || []).forEach(function (r) { var p = parseRow(r); if (p) out.push(p); });
  return out;
}

module.exports = { parse: parse, parseRow: parseRow };
