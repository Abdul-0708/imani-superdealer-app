'use strict';
/*
 * Commission Intelligence math (spec section 11). PURE.
 * Only Served Status = SERVED is counted. Pool split is fixed 30% / variable 70%.
 * The variable pool is released according to office KPI achievement:
 *   < 50%  -> 0 (NA)
 *   50-59% -> 20%
 *   60-69% -> 40%
 *   70-79% -> 60%
 *   80-89% -> 80%
 *   >= 90% -> 100%
 * e.g. 82% achievement releases 80% of the variable pool.
 */

var FIXED_PCT = 0.30;
var VARIABLE_PCT = 0.70;

/* Step function: achievement percent (0..100+) -> released fraction (0..1). */
function releaseFor(achievementPct) {
  var a = Number(achievementPct) || 0;
  if (a >= 90) return 1.0;
  if (a >= 80) return 0.8;
  if (a >= 70) return 0.6;
  if (a >= 60) return 0.4;
  if (a >= 50) return 0.2;
  return 0;
}

function isServed(row) {
  var s = String(row.servedStatus || row.served || '').toUpperCase();
  return s === 'SERVED';
}

/*
 * rows: [{ saCommission, servedStatus }]; achievementPct: office KPI achievement.
 * Returns the full commission breakdown for the month.
 */
function calc(rows, achievementPct) {
  var served = (rows || []).filter(isServed);
  var total = served.reduce(function (s, r) { return s + (Number(r.saCommission) || 0); }, 0);
  var fixedPool = total * FIXED_PCT;
  var variablePool = total * VARIABLE_PCT;
  var releasePct = releaseFor(achievementPct);
  var variablePaid = variablePool * releasePct;
  var final = fixedPool + variablePaid;
  return {
    servedCount: served.length,
    total: total,
    fixedPool: fixedPool,
    variablePool: variablePool,
    achievement: Number(achievementPct) || 0,
    releasePct: releasePct,
    variablePaid: variablePaid,
    final: final
  };
}

module.exports = { FIXED_PCT: FIXED_PCT, VARIABLE_PCT: VARIABLE_PCT, releaseFor: releaseFor, isServed: isServed, calc: calc };
