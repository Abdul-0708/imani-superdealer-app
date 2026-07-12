'use strict';
/*
 * Verification engine (spec sections 5 and 10). PURE.
 * Compares each BDO claim (from the weekly service rows) against the official
 * Bank Upload. A FALSE claim is when the BDO reported YES/SERVED but the bank
 * data says otherwise. Integrity % = verified claims / total claims.
 */

function bankIndex(bankRows) {
  var idx = {};
  (bankRows || []).forEach(function (b) { idx[String(b.acc)] = b; });
  return idx;
}

/*
 * claims: service rows [{ agentId, acc, bdo, odk('YES'/'NO' = Agent Visit),
 *                         apk, servedStatus }]
 * bankRows: [{ acc, visit('YES'/'NO'), apk, served('SERVED'/'NOT_SERVED') }]
 *
 * Returns { rows:[{agentId, bdo, field, claim, bank, result}], byBdo:{...} }.
 * A row is produced per claimed field (visit, apk, unique) that the BDO asserted.
 */
function verify(claims, bankRows) {
  var bank = bankIndex(bankRows);
  var rows = [];
  var byBdo = {};

  function tally(bdo) {
    if (!byBdo[bdo]) byBdo[bdo] = { bdo: bdo, total: 0, verified: 0, visitFalse: 0, apkFalse: 0, uniqueFalse: 0 };
    return byBdo[bdo];
  }

  (claims || []).forEach(function (c) {
    var b = bank[String(c.acc)] || {};
    var t = tally(c.bdo);

    function judge(field, claimed, truth, falseKey) {
      if (claimed !== 'YES') return;              // only assertions are verifiable
      t.total++;
      var ok = (truth === 'YES');
      var result = ok ? 'VERIFIED' : 'FALSE';
      if (ok) t.verified++; else t[falseKey]++;
      rows.push({ agentId: c.agentId, acc: c.acc, bdo: c.bdo, field: field, claim: claimed, bank: truth || 'NO', result: result });
    }

    judge('visit', c.odk === 'YES' ? 'YES' : 'NO', b.visit, 'visitFalse');
    judge('apk', c.apk === 'YES' ? 'YES' : 'NO', b.apk, 'apkFalse');
    judge('unique', c.servedStatus === 'SERVED' ? 'YES' : 'NO', (b.served === 'SERVED') ? 'YES' : 'NO', 'uniqueFalse');
  });

  Object.keys(byBdo).forEach(function (k) {
    var t = byBdo[k];
    t.integrity = t.total ? Math.round((t.verified / t.total) * 100) : 100;
  });

  return { rows: rows, byBdo: byBdo };
}

/*
 * Status for a single service_history row against its bank record, used to
 * back-fill service_history.verification_status:
 *   PENDING  - no bank record, or the BDO asserted nothing verifiable
 *   FALSE    - at least one asserted field contradicts the bank
 *   VERIFIED - every asserted field matches the bank
 */
function serviceStatus(claim, bankRow) {
  if (!bankRow) return 'PENDING';
  var checks = [];
  if (claim.odk === 'YES') checks.push(bankRow.visit === 'YES');
  if (claim.apk === 'YES') checks.push(bankRow.apk === 'YES');
  if (claim.servedStatus === 'SERVED') checks.push(bankRow.served === 'SERVED');
  if (!checks.length) return 'PENDING';
  return checks.every(function (x) { return x; }) ? 'VERIFIED' : 'FALSE';
}

module.exports = { verify: verify, bankIndex: bankIndex, serviceStatus: serviceStatus };
