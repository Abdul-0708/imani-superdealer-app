'use strict';
/* Authentication: password hashing (bcryptjs) + JWT sessions + role guards. */
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var config = require('./config');

function hashPassword(plain) { return bcrypt.hashSync(String(plain), 10); }
function checkPassword(plain, hash) { try { return bcrypt.compareSync(String(plain), hash || ''); } catch (e) { return false; } }

function issueToken(user) {
  return jwt.sign({ uid: user.id, role: user.role, username: user.username, name: user.name },
    config.jwtSecret, { expiresIn: '12h' });
}

/* Express middleware: require a valid token; attaches req.user. */
function requireAuth(req, res, next) {
  var h = req.headers.authorization || '';
  var m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'Not signed in' });
  try {
    req.user = jwt.verify(m[1], config.jwtSecret);
    next();
  } catch (e) { return res.status(401).json({ error: 'Session expired, please sign in again' }); }
}

/* Express middleware factory: require one of the given roles. */
function requireRole() {
  var roles = Array.prototype.slice.call(arguments);
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Not signed in' });
    if (roles.indexOf(req.user.role) < 0) return res.status(403).json({ error: 'Not allowed for your role' });
    next();
  };
}

module.exports = { hashPassword: hashPassword, checkPassword: checkPassword, issueToken: issueToken, requireAuth: requireAuth, requireRole: requireRole };
