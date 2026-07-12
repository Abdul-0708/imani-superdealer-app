'use strict';
/*
 * Role-Based Access Control (RBAC).
 * A permission matrix maps ROLE -> MODULE -> { view, edit, delete }. The Super
 * Admin edits this matrix from the Admin panel; the API enforces it and the UI
 * hides what a user cannot see. Super Admin always has full access (cannot be
 * locked out).
 */

var MODULES = [
  { key: 'executive', label: 'Executive Dashboard' },
  { key: 'dashboard', label: 'Operations Dashboard' },
  { key: 'agents', label: 'Agents' },
  { key: 'base', label: 'Agent Base' },
  { key: 'mybase', label: 'BDO - My Agent Base' },
  { key: 'upload', label: 'Uploads (Weekly / Targets)' },
  { key: 'verification', label: 'Verification & Bank Upload' },
  { key: 'quality', label: 'Data Quality' },
  { key: 'commission', label: 'Commission' },
  { key: 'clawback', label: 'Clawback' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'insights', label: 'AI Insights' },
  { key: 'settings', label: 'Settings (BDO accounts)' },
  { key: 'admin', label: 'Admin & Permissions' }
];
var MODULE_KEYS = MODULES.map(function (m) { return m.key; });
var ROLES = ['superadmin', 'md', 'om', 'bdo'];

function lvl(v, e, d) { return { view: !!v, edit: !!e, delete: !!d }; }

/* Default matrix - reproduces the app's current behaviour. */
function defaultMatrix() {
  var M = {};
  ROLES.forEach(function (r) { M[r] = {}; MODULE_KEYS.forEach(function (k) { M[r][k] = lvl(false, false, false); }); });
  MODULE_KEYS.forEach(function (k) { M.superadmin[k] = lvl(true, true, true); });
  ['executive', 'commission', 'clawback', 'analytics', 'insights', 'verification', 'quality'].forEach(function (k) { M.md[k] = lvl(true, true, false); });
  ['dashboard', 'agents', 'base'].forEach(function (k) { M.md[k] = lvl(true, false, false); });
  ['dashboard', 'agents', 'base', 'upload', 'verification', 'quality', 'commission', 'clawback', 'analytics', 'insights', 'settings'].forEach(function (k) { M.om[k] = lvl(true, true, true); });
  M.bdo.mybase = lvl(true, true, false);
  return M;
}

/* Merge a stored (possibly partial) matrix over defaults; superadmin always full. */
function mergeMatrix(stored) {
  var base = defaultMatrix();
  if (stored && typeof stored === 'object') {
    ROLES.forEach(function (r) {
      if (!stored[r]) return;
      MODULE_KEYS.forEach(function (k) {
        if (stored[r][k]) base[r][k] = lvl(stored[r][k].view, stored[r][k].edit, stored[r][k].delete);
      });
    });
  }
  MODULE_KEYS.forEach(function (k) { base.superadmin[k] = lvl(true, true, true); });
  return base;
}

function capsFor(matrix, role, moduleKey) {
  if (role === 'superadmin') return lvl(true, true, true);
  return (matrix[role] && matrix[role][moduleKey]) || lvl(false, false, false);
}

/* Express middleware: require a permission level on a module. */
function requirePerm(moduleKey, level) {
  return async function (req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not signed in' });
      if (req.user.role === 'superadmin') return next();
      var repo = require('./db').get();
      var matrix = mergeMatrix(await repo.getPermissions());
      if (capsFor(matrix, req.user.role, moduleKey)[level]) return next();
      return res.status(403).json({ error: 'Your role does not have ' + level + ' access to ' + moduleKey });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  };
}

module.exports = {
  MODULES: MODULES, MODULE_KEYS: MODULE_KEYS, ROLES: ROLES,
  defaultMatrix: defaultMatrix, mergeMatrix: mergeMatrix, capsFor: capsFor, requirePerm: requirePerm
};
