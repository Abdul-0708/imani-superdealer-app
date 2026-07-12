'use strict';
/*
 * Weekly-upload parser (spec section 6). Reads ONLY the fields that matter and
 * ignores everything else. Header matching is flexible (case/space/punctuation
 * insensitive, with common synonyms) so real-world spreadsheets import cleanly.
 * Pure: takes array-of-objects rows (as produced by xlsx sheet_to_json) and
 * returns normalized records.
 */

function normKey(k) { return String(k).toLowerCase().replace(/[^a-z0-9]/g, ''); }

/* Build a lookup of normalized-header -> value for one row. */
function indexRow(row) {
  var idx = {};
  Object.keys(row).forEach(function (k) { idx[normKey(k)] = row[k]; });
  return idx;
}

function pick(idx, names) {
  for (var i = 0; i < names.length; i++) {
    var n = normKey(names[i]);
    if (idx[n] !== undefined && idx[n] !== null && String(idx[n]).trim() !== '') return idx[n];
  }
  return '';
}

function yesno(v) {
  var s = String(v).trim().toLowerCase();
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1' || s === 'served') return 'YES';
  return 'NO';
}

function servedStatus(v) {
  var s = String(v).trim().toLowerCase().replace(/[^a-z]/g, '');
  if (s === 'served' || s === 'yes' || s === 'active' || s === 'done') return 'SERVED';
  return 'NOT_SERVED';
}

function num(v) {
  var n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

var COLS = {
  acc: ['Agent Account', 'account', 'accountnumber', 'acc', 'agentacc'],
  name: ['Agent Name', 'name', 'agent'],
  phone: ['Phone', 'phonenumber', 'mobile', 'simu'],
  branch: ['Branch', 'tawi'],
  uniqueServing: ['Unique Serving Status', 'unique', 'uniqueserving', 'uniquestatus'],
  floatServed: ['Float Served', 'float', 'floatserved'],
  agentVisit: ['Agent Visit', 'agentvisitodk', 'visit', 'odk'],
  apkUpdate: ['APK Update', 'apk', 'apkupdate'],
  activeness: ['Agent Activeness', 'activeness', 'active'],
  saCommission: ['SA Commission', 'sacommission', 'commission'],
  servedStatus: ['Served Status', 'served', 'servedstatus', 'status'],
  /* optional, ignored if absent */
  physicalLocation: ['Physical Location', 'location', 'shop', 'physicallocation', 'sehemu'],
  partner: ['Partner', 'partnerserved', 'ispartner', 'partnerserving'],
  bdo: ['BDO', 'Officer', 'Assigned BDO', 'bdoname', 'fieldofficer', 'bdoassigned', 'agent officer'],
  date: ['Date', 'Date Served', 'servedate', 'tarehe']
};

/* Parse one row into a normalized record, or null if it has no account. */
function parseRow(row) {
  var idx = indexRow(row);
  var acc = String(pick(idx, COLS.acc)).trim();
  if (!acc) return null;
  return {
    acc: acc,
    name: String(pick(idx, COLS.name)).trim(),
    phone: String(pick(idx, COLS.phone)).trim(),
    branch: String(pick(idx, COLS.branch)).trim(),
    uniqueServing: String(pick(idx, COLS.uniqueServing)).trim(),
    floatServed: num(pick(idx, COLS.floatServed)),
    agentVisit: yesno(pick(idx, COLS.agentVisit)),
    apkUpdate: yesno(pick(idx, COLS.apkUpdate)),
    activeness: String(pick(idx, COLS.activeness)).trim(),
    saCommission: num(pick(idx, COLS.saCommission)),
    servedStatus: servedStatus(pick(idx, COLS.servedStatus)),
    physicalLocation: String(pick(idx, COLS.physicalLocation)).trim(),
    partner: yesno(pick(idx, COLS.partner)) === 'YES',
    bdo: String(pick(idx, COLS.bdo)).trim(),
    date: String(pick(idx, COLS.date)).trim()
  };
}

function parse(rows) {
  var out = [];
  (rows || []).forEach(function (r) { var p = parseRow(r); if (p) out.push(p); });
  return out;
}

module.exports = { parse: parse, parseRow: parseRow, normKey: normKey, yesno: yesno, servedStatus: servedStatus };
