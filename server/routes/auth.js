'use strict';
var express = require('express');
var auth = require('../auth');
var db = require('../db');
var perms = require('../permissions');
var mfa = require('../mfa');

var router = express.Router();

/* Per-username failed-login tracking (in addition to the IP rate-limit). */
var LOCK_AFTER = 6, LOCK_MS = 15 * 60 * 1000;
var attempts = {};
function lockState(key) { var a = attempts[key]; if (a && a.until && a.until < Date.now()) { delete attempts[key]; return null; } return a; }
function noteFail(key) { var a = attempts[key] || { count: 0 }; a.count++; if (a.count >= LOCK_AFTER) a.until = Date.now() + LOCK_MS; attempts[key] = a; }

function pubUser(u) { return { id: u.id, username: u.username, role: u.role, name: u.name, mustChangePassword: !!u.mustChangePassword, mfaEnabled: !!u.mfaEnabled }; }

/* POST /api/auth/login  { username, password } -> { token, user } */
router.post('/login', async function (req, res) {
  try {
    var repo = db.get();
    var body = req.body || {};
    var key = String(body.username || '').toLowerCase().trim();
    var locked = lockState(key);
    if (locked && locked.until) return res.status(429).json({ error: 'Account temporarily locked after too many failed attempts. Try again later.' });

    var user = await repo.getUserByUsername(key);
    if (!user || user.active === false || !auth.checkPassword(body.password || '', user.passwordHash)) {
      noteFail(key);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    /* Second factor when enabled. */
    if (user.mfaEnabled) {
      var code = String(body.code || '').trim();
      if (!code) return res.json({ mfaRequired: true });
      if (!mfa.verify(user.mfaSecret, code)) { noteFail(key); return res.status(401).json({ error: 'Invalid authentication code' }); }
    }
    delete attempts[key];
    var token = auth.issueToken(user);
    await repo.addAudit({ userId: user.id, action: 'login', detail: user.username });
    res.json({ token: token, user: pubUser(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/auth/me -> re-validated identity (revokes disabled/deleted accounts on next load) */
router.get('/me', auth.requireAuth, async function (req, res) {
  try {
    var user = await db.get().getUserById(req.user.uid);
    if (!user || user.active === false) return res.status(401).json({ error: 'Account is no longer active' });
    res.json({ user: pubUser(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/auth/change-password { currentPassword, newPassword } */
router.post('/change-password', auth.requireAuth, async function (req, res) {
  try {
    var repo = db.get();
    var body = req.body || {};
    var user = await repo.getUserById(req.user.uid);
    if (!user) return res.status(401).json({ error: 'Not signed in' });
    if (!auth.checkPassword(body.currentPassword || '', user.passwordHash)) return res.status(400).json({ error: 'Current password is incorrect' });
    if (String(body.newPassword || '').length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    await repo.updateUser(user.id, { passwordHash: auth.hashPassword(body.newPassword), mustChangePassword: false });
    await repo.addAudit({ userId: user.id, action: 'password_change', detail: user.username });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/auth/mfa/status -> is MFA enabled for me */
router.get('/mfa/status', auth.requireAuth, async function (req, res) {
  try {
    var user = await db.get().getUserById(req.user.uid);
    res.json({ enabled: !!(user && user.mfaEnabled) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/auth/mfa/setup -> generate a secret + QR (not yet enabled) */
router.post('/mfa/setup', auth.requireAuth, async function (req, res) {
  try {
    var repo = db.get();
    var user = await repo.getUserById(req.user.uid);
    if (!user) return res.status(401).json({ error: 'Not signed in' });
    var secret = mfa.generateSecret();
    await repo.updateUser(user.id, { mfaSecret: secret, mfaEnabled: false });
    var uri = mfa.otpauthURI(secret, user.username);
    res.json({ secret: secret, otpauth: uri, qrSvg: await mfa.qrSvg(uri) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/auth/mfa/confirm { code } -> verify a code and turn MFA on */
router.post('/mfa/confirm', auth.requireAuth, async function (req, res) {
  try {
    var repo = db.get();
    var user = await repo.getUserById(req.user.uid);
    if (!user || !user.mfaSecret) return res.status(400).json({ error: 'Start setup first' });
    if (!mfa.verify(user.mfaSecret, (req.body || {}).code)) return res.status(400).json({ error: 'Code did not match. Check your authenticator app and try again.' });
    await repo.updateUser(user.id, { mfaEnabled: true });
    await repo.addAudit({ userId: user.id, action: 'mfa_enabled', detail: user.username });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/auth/mfa/disable { code } -> verify then turn MFA off */
router.post('/mfa/disable', auth.requireAuth, async function (req, res) {
  try {
    var repo = db.get();
    var user = await repo.getUserById(req.user.uid);
    if (!user || !user.mfaEnabled) return res.json({ ok: true });
    if (!mfa.verify(user.mfaSecret, (req.body || {}).code)) return res.status(400).json({ error: 'Invalid authentication code' });
    await repo.updateUser(user.id, { mfaEnabled: false, mfaSecret: '' });
    await repo.addAudit({ userId: user.id, action: 'mfa_disabled', detail: user.username });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* GET /api/auth/permissions -> the current user's effective module permissions */
router.get('/permissions', auth.requireAuth, async function (req, res) {
  try {
    var matrix = perms.mergeMatrix(await db.get().getPermissions());
    var out = {};
    perms.MODULE_KEYS.forEach(function (k) { out[k] = perms.capsFor(matrix, req.user.role, k); });
    res.json({ role: req.user.role, modules: out, moduleMeta: perms.MODULES });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
