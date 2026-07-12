'use strict';
/* Seed the initial users on first run. Idempotent: only creates what is missing. */
var auth = require('./auth');
var config = require('./config');
var permissions = require('./permissions');

var SEED_BDOS = [
  { username: 'john', name: 'John (BDO)', station: 'Arusha' },
  { username: 'mary', name: 'Mary (BDO)', station: 'Arusha' },
  { username: 'peter', name: 'Peter (BDO)', station: 'Manyara' }
];

async function ensureUser(repo, u) {
  var existing = await repo.getUserByUsername(u.username);
  if (existing) return existing;
  return repo.createUser({
    username: u.username, role: u.role, name: u.name, station: u.station || '',
    passwordHash: auth.hashPassword(u.password), active: true,
    /* Privileged seeded accounts must set their own password on first login. */
    mustChangePassword: !!u.mustChangePassword
  });
}

async function seed(repo) {
  await ensureUser(repo, { username: config.seed.saUser, role: 'superadmin', name: 'Super Administrator', password: config.seed.saPass, mustChangePassword: true });
  await ensureUser(repo, { username: config.seed.omUser, role: 'om', name: 'Operational Manager', password: config.seed.omPass, mustChangePassword: true });
  await ensureUser(repo, { username: config.seed.mdUser, role: 'md', name: 'Managing Director', password: config.seed.mdPass, mustChangePassword: true });
  for (var i = 0; i < SEED_BDOS.length; i++) {
    var b = SEED_BDOS[i];
    await ensureUser(repo, { username: b.username, role: 'bdo', name: b.name, station: b.station, password: 'imani123' });
  }
  if (!(await repo.getPermissions())) await repo.setPermissions(permissions.defaultMatrix());
}

module.exports = { seed: seed, SEED_BDOS: SEED_BDOS };
