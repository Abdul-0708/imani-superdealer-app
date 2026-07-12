'use strict';
/* Central configuration, loaded from environment (.env in production). */
try { require('dotenv').config(); } catch (e) { /* dotenv optional in some envs */ }
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

function num(v, d) { var n = parseInt(v, 10); return isNaN(n) ? d : n; }

/* Default DB file lives under the app root regardless of the process CWD. */
var DEFAULT_DB_FILE = path.join(__dirname, '..', 'data', 'dev-db.json');
var IS_PROD = (process.env.NODE_ENV || '') === 'production';
var PLACEHOLDER_SECRET = 'change-me-to-a-long-random-secret';

/*
 * JWT secret resolution:
 *  - use JWT_SECRET from the environment (required, and must be non-placeholder in production)
 *  - in development, generate a strong random secret once and persist it under data/
 *    so restarts don't invalidate everyone's sessions.
 */
function resolveJwtSecret() {
  var env = process.env.JWT_SECRET;
  if (env && env !== PLACEHOLDER_SECRET) return env;
  if (IS_PROD) throw new Error('SECURITY: JWT_SECRET must be set to a strong random value in production (see .env.example).');
  var file = path.join(__dirname, '..', 'data', '.jwtsecret');
  try { if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim(); } catch (e) { /* ignore */ }
  var secret = crypto.randomBytes(48).toString('hex');
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, secret); } catch (e) { /* ignore */ }
  return secret;
}

module.exports = {
  port: num(process.env.PORT, 3000),
  isProd: IS_PROD,
  jwtSecret: resolveJwtSecret(),
  dbDriver: (process.env.DB_DRIVER || 'file').toLowerCase(),
  dbFile: process.env.DB_FILE || DEFAULT_DB_FILE,
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: num(process.env.MYSQL_PORT, 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'imani_superdealer'
  },
  seed: {
    saUser: process.env.SEED_SA_USER || 'superadmin',
    saPass: process.env.SEED_SA_PASS || 'imani123',
    omUser: process.env.SEED_OM_USER || 'om',
    omPass: process.env.SEED_OM_PASS || 'imani123',
    mdUser: process.env.SEED_MD_USER || 'md',
    mdPass: process.env.SEED_MD_PASS || 'imani123'
  }
};
