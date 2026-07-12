'use strict';
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var perms = require('../permissions');

var router = express.Router();

/* GET /api/users/bdos -> list of BDO accounts (for upload assignment dropdowns) */
router.get('/bdos', auth.requireAuth, async function (req, res) {
  try {
    var users = await db.get().listUsers();
    res.json(users.filter(function (u) { return u.role === 'bdo'; })
      .map(function (u) { return { username: u.username, name: u.name, station: u.station, active: u.active }; }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/users/bdos { username, name, station }  (OM only) */
router.post('/bdos', auth.requireAuth, perms.requirePerm('settings', 'edit'), async function (req, res) {
  try {
    var repo = db.get();
    var b = req.body || {};
    var username = String(b.username || '').toLowerCase().trim();
    if (!username || !b.name) return res.status(400).json({ error: 'username and name are required' });
    if (await repo.getUserByUsername(username)) return res.status(409).json({ error: 'That username already exists' });
    var user = await repo.createUser({
      username: username, role: 'bdo', name: b.name, station: b.station || '',
      passwordHash: auth.hashPassword(b.password || 'imani123'), active: true
    });
    await repo.addAudit({ userId: req.user.uid, action: 'create_bdo', detail: username });
    res.json({ username: user.username, name: user.name, station: user.station });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
