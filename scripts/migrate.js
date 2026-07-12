'use strict';
/* CLI: apply pending MySQL migrations. Usage: DB_DRIVER=mysql node scripts/migrate.js */
process.env.DB_DRIVER = 'mysql';
var config = require('../server/config');
var migrate = require('../server/db/migrate');

migrate.migrate(config.mysql)
  .then(function (applied) {
    console.log(applied.length ? ('Applied migrations: ' + applied.join(', ')) : 'No pending migrations.');
    process.exit(0);
  })
  .catch(function (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  });
