'use strict';
/*
 * Priority & agent-lifecycle rules (spec sections 1 and 2). PURE functions:
 * they take plain data and return plain data, so they are trivially unit-tested
 * and never touch the database or HTTP layer.
 */

var LEVELS = { PRIORITY: 'priority', NEW: 'new', NEVER: 'never' };

function toSet(ids) {
  var s = {};
  (ids || []).forEach(function (id) { s[Number(id)] = true; });
  return s;
}

/*
 * Classify a single agent for a BDO's working month.
 *   green  "priority" -> carried forward (served the previous month)
 *   red    "never"    -> in the base but has never been served, ever
 *   yellow "new"      -> newly uploaded this month (has some history but not carried)
 */
function classify(agentId, sets) {
  agentId = Number(agentId);
  var priority = sets.priority || {};
  var everServed = sets.everServed || {};
  if (priority[agentId]) return LEVELS.PRIORITY;
  if (!everServed[agentId]) return LEVELS.NEVER;
  return LEVELS.NEW;
}

var ORDER = { priority: 0, new: 1, never: 2 };

/*
 * Given the agent objects that make up a BDO's base for a month, plus the id
 * lists that describe that base, return the agents tagged with .level and sorted
 * priority-first (spec: "Priority agents appear first in the list").
 */
function classifyList(agents, ids) {
  var sets = { priority: toSet(ids.priority), everServed: toSet(ids.everServed) };
  var out = (agents || []).map(function (a) {
    var copy = Object.assign({}, a);
    copy.level = classify(a.id, sets);
    return copy;
  });
  out.sort(function (x, y) {
    if (ORDER[x.level] !== ORDER[y.level]) return ORDER[x.level] - ORDER[y.level];
    return String(x.name || '').localeCompare(String(y.name || ''));
  });
  return out;
}

/*
 * Working-base counts for the "August Base" panel (spec section 1):
 * priority (carried), new (uploaded and not already priority), total working base.
 */
function baseCounts(ids) {
  var pr = toSet(ids.priority);
  var priorityCount = Object.keys(pr).length;
  var newCount = 0, union = Object.assign({}, pr);
  (ids.uploaded || []).forEach(function (id) {
    id = Number(id);
    if (!pr[id]) { newCount++; }
    union[id] = true;
  });
  return { priority: priorityCount, newAgents: newCount, total: Object.keys(union).length };
}

/* 'YYYY-MM' -> next month 'YYYY-MM'. */
function nextMonth(ym) {
  var parts = String(ym).split('-');
  var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10);
  m += 1; if (m > 12) { m = 1; y += 1; }
  return y + '-' + (m < 10 ? '0' + m : '' + m);
}

/*
 * Carry-forward (spec section 1): the agents a BDO SERVED in `fromMonth` become
 * that BDO's priority base for the next month. `servedByBdo` maps bdoKey -> [agentId].
 * Returns { month, byBdo: { bdoKey: [agentId] } } for the caller to persist.
 */
function rollover(fromMonth, servedByBdo) {
  var target = nextMonth(fromMonth);
  var byBdo = {};
  Object.keys(servedByBdo || {}).forEach(function (bdo) {
    var seen = {}, list = [];
    (servedByBdo[bdo] || []).forEach(function (id) {
      id = Number(id);
      if (!seen[id]) { seen[id] = true; list.push(id); }
    });
    byBdo[bdo] = list;
  });
  return { month: target, byBdo: byBdo };
}

module.exports = {
  LEVELS: LEVELS, classify: classify, classifyList: classifyList,
  baseCounts: baseCounts, nextMonth: nextMonth, rollover: rollover
};
