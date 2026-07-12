'use strict';
/* Structured JSON logger (one line per event) for log aggregation / monitoring.
 * Level via LOG_LEVEL env (error|warn|info|debug); defaults to info. */
var LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
var threshold = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()];
if (threshold == null) threshold = LEVELS.info;

function emit(level, msg, fields) {
  if (LEVELS[level] > threshold) return;
  var rec = { t: new Date().toISOString(), level: level, msg: msg };
  if (fields) Object.keys(fields).forEach(function (k) { rec[k] = fields[k]; });
  var line = JSON.stringify(rec);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

module.exports = {
  error: function (m, f) { emit('error', m, f); },
  warn: function (m, f) { emit('warn', m, f); },
  info: function (m, f) { emit('info', m, f); },
  debug: function (m, f) { emit('debug', m, f); }
};
