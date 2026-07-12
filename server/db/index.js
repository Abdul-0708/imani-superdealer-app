'use strict';
/* Selects the active database driver from config.dbDriver.
 * Both drivers expose the identical repository interface. */
var config = require('../config');

var repo = null;

function makeRepo(overrides) {
  overrides = overrides || {};
  var driver = overrides.driver || config.dbDriver;
  if (driver === 'mysql') {
    return require('./mysql').createMysqlStore(overrides.mysql || config.mysql);
  }
  return require('./filestore').createFileStore(overrides.dbFile || config.dbFile);
}

module.exports = {
  /* Get (or lazily create) the process-wide repository. */
  get: function () {
    if (!repo) repo = makeRepo({});
    return repo;
  },
  /* Build an isolated repository (used by tests). */
  make: makeRepo
};
