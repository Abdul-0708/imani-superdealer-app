'use strict';
/* Super Admin control panel: permission matrix + full user management. Superadmin only. */
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var perms = require('../permissions');

var router = express.Router();
var onlySuper = [auth.requireAuth, auth.requireRole('superadmin')];

/* GET /api/admin/meta -> module + role definitions for the matrix UI */
router.get('/meta', onlySuper, function (req, res) {
  res.json({ modules: perms.MODULES, roles: perms.ROLES });
});

/* GET /api/admin/permissions -> the full (merged) matrix */
router.get('/permissions', onlySuper, async function (req, res) {
  try { res.json(perms.mergeMatrix(await db.get().getPermissions())); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

/* PUT /api/admin/permissions { matrix } -> save (superadmin stays full) */
router.put('/permissions', onlySuper, async function (req, res) {
  try {
    var matrix = perms.mergeMatrix((req.body && req.body.matrix) || {});
    await db.get().setPermissions(matrix);
    await db.get().addAudit({ userId: req.user.uid, action: 'permissions_update', detail: 'matrix saved' });
    res.json({ ok: true, matrix: matrix });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/admin/audit -> recent audit trail (newest first) */
router.get('/audit', onlySuper, async function (req, res) {
  try {
    var repo = db.get();
    var log = await repo.listAudit();
    var users = await repo.listUsers();
    var nameById = {}; users.forEach(function (u) { nameById[u.id] = u.username; });
    var out = log.slice(-200).reverse().map(function (a) { return { at: a.at, who: nameById[a.userId] || 'system', action: a.action, detail: a.detail }; });
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/admin/users -> all users */
router.get('/users', onlySuper, async function (req, res) {
  try {
    var users = await db.get().listUsers();
    res.json(users.map(function (u) { return { id: u.id, username: u.username, role: u.role, name: u.name, station: u.station, active: u.active }; }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/admin/users { username, name, role, station, password } */
router.post('/users', onlySuper, async function (req, res) {
  try {
    var repo = db.get();
    var b = req.body || {};
    var username = String(b.username || '').toLowerCase().trim();
    if (!username || !b.name || perms.ROLES.indexOf(b.role) < 0) return res.status(400).json({ error: 'username, name and a valid role are required' });
    if (await repo.getUserByUsername(username)) return res.status(409).json({ error: 'Username already exists' });
    var u = await repo.createUser({ username: username, role: b.role, name: b.name, station: b.station || '', passwordHash: auth.hashPassword(b.password || 'imani123'), active: true });
    await repo.addAudit({ userId: req.user.uid, action: 'user_create', detail: username + ' (' + b.role + ')' });
    res.json({ id: u.id, username: u.username, role: u.role, name: u.name, station: u.station, active: u.active });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* PATCH /api/admin/users/:id { active?, role?, name?, station?, password? } */
router.patch('/users/:id', onlySuper, async function (req, res) {
  try {
    var repo = db.get();
    var b = req.body || {};
    var target = await repo.getUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (b.role !== undefined && perms.ROLES.indexOf(b.role) < 0) return res.status(400).json({ error: 'Invalid role' });
    if (target.role === 'superadmin' && (b.active === false || (b.role && b.role !== 'superadmin'))) return res.status(400).json({ error: 'Cannot demote or disable a Super Admin' });
    var fields = { name: b.name, role: b.role, station: b.station };
    if (b.active !== undefined) fields.active = b.active;
    if (b.password) fields.passwordHash = auth.hashPassword(b.password);
    var u = await repo.updateUser(target.id, fields);
    await repo.addAudit({ userId: req.user.uid, action: 'user_update', detail: target.username });
    res.json({ id: u.id, username: u.username, role: u.role, name: u.name, station: u.station, active: u.active });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* DELETE /api/admin/users/:id */
router.delete('/users/:id', onlySuper, async function (req, res) {
  try {
    var repo = db.get();
    var target = await repo.getUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'superadmin') return res.status(400).json({ error: 'Cannot delete a Super Admin account' });
    if (target.id === req.user.uid) return res.status(400).json({ error: 'You cannot delete your own account' });
    await repo.deleteUser(target.id);
    await repo.addAudit({ userId: req.user.uid, action: 'user_delete', detail: target.username });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
