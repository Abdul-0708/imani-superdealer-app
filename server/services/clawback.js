'use strict';
/*
 * Clawback Intelligence (spec section 12). PURE.
 * Net = commission earned - potential clawback. `recovered` is informational
 * (the portion of clawback already recovered). Reasons carry the breakdown
 * (Dormant Agents, APK Missing, Inactive Agents, Float Reduction).
 */

/*
 * input: { earned, recovered, reasons: [{ label, amount }] }
 * potential is the sum of reason amounts (or an explicit input.potential).
 */
function calc(input) {
  input = input || {};
  var reasons = input.reasons || [];
  var potential = (input.potential != null)
    ? Number(input.potential) || 0
    : reasons.reduce(function (s, r) { return s + (Number(r.amount) || 0); }, 0);
  var earned = Number(input.earned) || 0;
  var recovered = Number(input.recovered) || 0;
  var net = earned - potential;
  return { earned: earned, potential: potential, recovered: recovered, net: net, reasons: reasons };
}

module.exports = { calc: calc };
