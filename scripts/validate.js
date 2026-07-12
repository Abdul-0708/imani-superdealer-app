'use strict';
/* Structural checks on the front-end script (public/app.js):
 *  - pure ASCII (no raw unicode - use HTML numeric entities in strings instead)
 *  - balanced braces / parens / brackets
 *  - no duplicate function declarations
 * Also sanity-checks that every server file parses. */
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var failures = [];

function fail(msg) { failures.push(msg); }

/* ---- front-end app.js discipline ---- */
var appPath = path.join(ROOT, 'public', 'app.js');
var src = fs.readFileSync(appPath, 'utf8');

/* ASCII */
for (var i = 0; i < src.length; i++) {
  if (src.charCodeAt(i) > 127) {
    var line = src.slice(0, i).split('\n').length;
    fail('public/app.js: non-ASCII char (code ' + src.charCodeAt(i) + ') at line ' + line);
    break;
  }
}

/* Balance (ignoring strings/comments would be ideal; a raw count catches gross errors) */
function balance(str, open, close, label) {
  var depth = 0;
  for (var j = 0; j < str.length; j++) {
    if (str[j] === open) depth++;
    else if (str[j] === close) depth--;
    if (depth < 0) { fail('public/app.js: unbalanced ' + label + ' (extra ' + close + ')'); return; }
  }
  if (depth !== 0) fail('public/app.js: unbalanced ' + label + ' (depth ' + depth + ')');
}
balance(src, '{', '}', 'braces');
balance(src, '(', ')', 'parens');
balance(src, '[', ']', 'brackets');

/* Duplicate function names */
var seen = {};
var re = /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
var m;
while ((m = re.exec(src))) {
  if (seen[m[1]]) fail('public/app.js: duplicate function name "' + m[1] + '"');
  seen[m[1]] = true;
}

/* ---- server files parse (require them) ---- */
var serverFiles = [
  'server/config.js', 'server/auth.js', 'server/seed.js', 'server/index.js', 'server/permissions.js', 'server/mfa.js',
  'server/logger.js', 'server/metrics.js',
  'server/db/index.js', 'server/db/filestore.js', 'server/db/mysql.js', 'server/db/migrate.js',
  'server/services/priority.js', 'server/services/weekly.js', 'server/services/bank.js', 'server/services/targets.js',
  'server/services/commission.js', 'server/services/clawback.js', 'server/services/verify.js', 'server/services/final.js',
  'server/routes/auth.js', 'server/routes/users.js', 'server/routes/uploads.js',
  'server/routes/agents.js', 'server/routes/base.js', 'server/routes/dashboard.js',
  'server/routes/verification.js', 'server/routes/quality.js',
  'server/routes/commission.js', 'server/routes/clawback.js', 'server/routes/executive.js',
  'server/routes/serve.js', 'server/routes/insights.js', 'server/routes/admin.js'
];
serverFiles.forEach(function (f) {
  try { require(path.join(ROOT, f)); }
  catch (e) { fail(f + ': ' + e.message); }
});

if (failures.length) {
  console.error('VALIDATE FAILED:');
  failures.forEach(function (f) { console.error('  - ' + f); });
  process.exit(1);
}
console.log('VALIDATE OK (public/app.js clean; ' + serverFiles.length + ' server files load).');
