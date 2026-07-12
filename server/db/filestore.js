'use strict';
/*
 * File-store database driver.
 * A zero-dependency JSON-backed implementation of the repository interface used
 * for local development and automated tests. Production uses db/mysql.js which
 * exposes the SAME method names, so routes/services never know which is active.
 *
 * Pass dbFile === ':memory:' for an ephemeral store (used by the smoke tests).
 */
var fs = require('fs');
var path = require('path');

function nowISO() { return new Date().toISOString(); }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

function createFileStore(dbFile) {
  var memoryOnly = (dbFile === ':memory:');
  var file = memoryOnly ? null : path.resolve(dbFile);

  var db = {
    seq: {},
    users: [],
    agents: [],
    service: [],       // service_history rows
    base: [],          // {month, bdo, agentId, kind:'priority'|'uploaded'}
    weeklyUploads: [],
    targets: [],       // monthly targets {month, station, agentsTarget, floatTarget, servedTarget, visitsTarget}
    bankUploads: [],   // Phase 2
    verifications: [], // Phase 2
    commissionUploads: [], // Phase 3
    commissionCalc: [],    // Phase 3
    clawback: [],          // Phase 3
    settings: {},          // key/value app settings (e.g. permissions matrix)
    audit: []
  };

  function load() {
    if (memoryOnly) return;
    try {
      if (fs.existsSync(file)) {
        var raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        Object.keys(db).forEach(function (k) { if (raw[k] != null) db[k] = raw[k]; });
      }
    } catch (e) { /* start fresh on corrupt file */ }
  }
  function persist() {
    if (memoryOnly) return;
    try {
      var dir = path.dirname(file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(db, null, 2));
    } catch (e) { /* ignore write errors in dev */ }
  }
  function nextId(coll) { db.seq[coll] = (db.seq[coll] || 0) + 1; return db.seq[coll]; }

  load();

  var api = {
    driver: 'file',

    /* ---------- lifecycle ---------- */
    init: function () { return Promise.resolve(); },
    ping: function () { return Promise.resolve(true); },
    close: function () { return Promise.resolve(); },
    reset: function () {
      Object.keys(db).forEach(function (k) { db[k] = (k === 'seq') ? {} : []; });
      persist();
      return Promise.resolve();
    },

    /* ---------- users ---------- */
    getUserByUsername: function (username) {
      var u = db.users.find(function (x) { return x.username === String(username).toLowerCase(); });
      return Promise.resolve(clone(u) || null);
    },
    getUserById: function (id) {
      var u = db.users.find(function (x) { return x.id === Number(id); });
      return Promise.resolve(clone(u) || null);
    },
    listUsers: function () { return Promise.resolve(clone(db.users)); },
    updateUser: function (id, fields) {
      var u = db.users.find(function (x) { return x.id === Number(id); });
      if (!u) return Promise.resolve(null);
      ['name', 'role', 'station', 'passwordHash'].forEach(function (k) { if (fields[k] !== undefined && fields[k] !== '') u[k] = fields[k]; });
      if (fields.active !== undefined) u.active = !!fields.active;
      if (fields.mustChangePassword !== undefined) u.mustChangePassword = !!fields.mustChangePassword;
      if (fields.mfaSecret !== undefined) u.mfaSecret = fields.mfaSecret;
      if (fields.mfaEnabled !== undefined) u.mfaEnabled = !!fields.mfaEnabled;
      persist();
      return Promise.resolve(clone(u));
    },
    deleteUser: function (id) {
      var before = db.users.length;
      db.users = db.users.filter(function (x) { return x.id !== Number(id); });
      persist();
      return Promise.resolve(before !== db.users.length);
    },
    createUser: function (u) {
      var row = {
        id: nextId('users'),
        username: String(u.username).toLowerCase(),
        role: u.role,
        name: u.name || u.username,
        passwordHash: u.passwordHash,
        station: u.station || '',
        active: u.active !== false,
        mustChangePassword: !!u.mustChangePassword,
        mfaSecret: u.mfaSecret || '',
        mfaEnabled: !!u.mfaEnabled,
        createdAt: nowISO()
      };
      db.users.push(row); persist();
      return Promise.resolve(clone(row));
    },

    /* ---------- agents ---------- */
    countAgents: function () { return Promise.resolve(db.agents.length); },
    getAgentByAcc: function (acc) {
      var a = db.agents.find(function (x) { return x.acc === String(acc); });
      return Promise.resolve(clone(a) || null);
    },
    getAgentById: function (id) {
      var a = db.agents.find(function (x) { return x.id === Number(id); });
      return Promise.resolve(clone(a) || null);
    },
    getAgentsByIds: function (ids) {
      var want = {}; (ids || []).forEach(function (id) { want[Number(id)] = true; });
      return Promise.resolve(clone(db.agents.filter(function (a) { return want[a.id]; })));
    },
    _filterAgents: function (filter) {
      filter = filter || {};
      return db.agents.filter(function (a) {
        if (filter.station && a.station !== filter.station) return false;
        if (filter.branch && a.branch !== filter.branch) return false;
        if (filter.search) {
          var q = String(filter.search).toLowerCase();
          var hay = (a.name + ' ' + a.acc + ' ' + a.phone + ' ' + a.branch).toLowerCase();
          if (hay.indexOf(q) < 0) return false;
        }
        return true;
      }).sort(function (x, y) { return String(x.name || '').localeCompare(String(y.name || '')); });
    },
    listAgents: function (filter) {
      filter = filter || {};
      var out = this._filterAgents(filter);
      if (filter.limit) out = out.slice(Number(filter.offset) || 0, (Number(filter.offset) || 0) + Number(filter.limit));
      return Promise.resolve(clone(out));
    },
    countAgentsFiltered: function (filter) { return Promise.resolve(this._filterAgents(filter).length); },
    upsertAgentByAcc: function (agent) {
      var existing = db.agents.find(function (x) { return x.acc === String(agent.acc); });
      if (existing) {
        ['name', 'phone', 'branch', 'station', 'physicalLocation', 'partner'].forEach(function (k) {
          if (agent[k] !== undefined && agent[k] !== '' && agent[k] != null) existing[k] = agent[k];
        });
        if (agent.gps) existing.gps = agent.gps;
        persist();
        return Promise.resolve(clone(existing));
      }
      var row = {
        id: nextId('agents'),
        acc: String(agent.acc),
        name: agent.name || '',
        phone: agent.phone || '',
        branch: agent.branch || '',
        station: agent.station || '',
        physicalLocation: agent.physicalLocation || '',
        gps: agent.gps || null,
        partner: !!agent.partner,
        source: agent.source || 'upload',
        createdAt: nowISO()
      };
      db.agents.push(row); persist();
      return Promise.resolve(clone(row));
    },

    /* ---------- service history ---------- */
    addServiceRows: function (rows) {
      (rows || []).forEach(function (r) {
        db.service.push({
          id: nextId('service'),
          agentId: Number(r.agentId),
          bdo: r.bdo,
          month: r.month,
          week: r.week || '',
          date: r.date || '',
          time: r.time || '',
          gps: r.gps || null,
          odk: r.odk || 'NO',
          apk: r.apk || 'NO',
          floatServed: Number(r.floatServed) || 0,
          activeness: r.activeness || '',
          saCommission: Number(r.saCommission) || 0,
          servedStatus: r.servedStatus || 'NOT_SERVED',
          verificationStatus: r.verificationStatus || 'PENDING',
          source: r.source || 'weekly'
        });
      });
      persist();
      return Promise.resolve((rows || []).length);
    },
    listService: function (filter) {
      filter = filter || {};
      var out = db.service.filter(function (s) {
        if (filter.bdo && s.bdo !== filter.bdo) return false;
        if (filter.month && s.month !== filter.month) return false;
        if (filter.agentId && s.agentId !== Number(filter.agentId)) return false;
        return true;
      });
      return Promise.resolve(clone(out));
    },
    servedAgentIds: function (bdo, month) {
      var set = {};
      db.service.forEach(function (s) {
        if (s.month === month && (!bdo || s.bdo === bdo) && s.servedStatus === 'SERVED') set[s.agentId] = true;
      });
      return Promise.resolve(Object.keys(set).map(Number));
    },
    everServedAgentIds: function () {
      var set = {};
      db.service.forEach(function (s) { if (s.servedStatus === 'SERVED') set[s.agentId] = true; });
      return Promise.resolve(Object.keys(set).map(Number));
    },
    updateServiceVerification: function (id, status) {
      var row = db.service.find(function (s) { return s.id === Number(id); });
      if (row) { row.verificationStatus = status; persist(); }
      return Promise.resolve();
    },

    /* ---------- bank uploads (Phase 2 verification source) ---------- */
    addBankRows: function (month, rows) {
      db.bankUploads = db.bankUploads.filter(function (b) { return b.month !== month; });
      (rows || []).forEach(function (r) {
        db.bankUploads.push({ id: nextId('bankUploads'), month: month, acc: String(r.acc), visit: r.visit || 'NO', apk: r.apk || 'NO', served: r.served || 'NOT_SERVED' });
      });
      persist();
      return Promise.resolve((rows || []).length);
    },
    getBankRows: function (month) {
      return Promise.resolve(clone(db.bankUploads.filter(function (b) { return b.month === month; })));
    },

    /* ---------- monthly targets ---------- */
    setTargets: function (month, rows) {
      db.targets = db.targets.filter(function (t) { return t.month !== month; });
      (rows || []).forEach(function (r) {
        db.targets.push({
          id: nextId('targets'), month: month, station: r.station || 'Office',
          agentsTarget: Number(r.agentsTarget) || 0, floatTarget: Number(r.floatTarget) || 0,
          servedTarget: Number(r.servedTarget) || 0, visitsTarget: Number(r.visitsTarget) || 0
        });
      });
      persist();
      return Promise.resolve((rows || []).length);
    },
    getTargets: function (month) {
      return Promise.resolve(clone(db.targets.filter(function (t) { return t.month === month; })));
    },

    /* ---------- commission & clawback (Phase 3) ---------- */
    setCommissionFinal: function (month, meta) {
      db.commissionUploads = db.commissionUploads.filter(function (x) { return x.month !== month; });
      db.commissionUploads.push({ id: nextId('commissionUploads'), month: month, filename: meta.filename || '', rows: meta.rows || [] });
      persist();
      return Promise.resolve((meta.rows || []).length);
    },
    getCommissionFinal: function (month) {
      var x = db.commissionUploads.find(function (r) { return r.month === month; });
      return Promise.resolve(x ? clone(x) : null);
    },
    setCommissionCalc: function (month, calc) {
      db.commissionCalc = db.commissionCalc.filter(function (x) { return x.month !== month; });
      db.commissionCalc.push(Object.assign({ month: month }, calc));
      persist();
      return Promise.resolve();
    },
    getCommissionCalc: function (month) {
      var x = db.commissionCalc.find(function (r) { return r.month === month; });
      return Promise.resolve(x ? clone(x) : null);
    },
    listCommissionCalc: function () { return Promise.resolve(clone(db.commissionCalc)); },
    setClawback: function (month, data) {
      db.clawback = db.clawback.filter(function (x) { return x.month !== month; });
      db.clawback.push(Object.assign({ month: month }, data));
      persist();
      return Promise.resolve();
    },
    getClawback: function (month) {
      var x = db.clawback.find(function (r) { return r.month === month; });
      return Promise.resolve(x ? clone(x) : null);
    },
    listClawback: function () { return Promise.resolve(clone(db.clawback)); },

    /* ---------- base (monthly working base) ---------- */
    getBase: function (month, bdo) {
      var priority = [], uploaded = [];
      db.base.forEach(function (b) {
        if (b.month === month && b.bdo === bdo) {
          if (b.kind === 'priority') priority.push(b.agentId); else uploaded.push(b.agentId);
        }
      });
      return Promise.resolve({ priority: priority, uploaded: uploaded });
    },
    addUploaded: function (month, bdo, ids) {
      var seen = {};
      db.base.forEach(function (b) { if (b.month === month && b.bdo === bdo && b.kind === 'uploaded') seen[b.agentId] = true; });
      (ids || []).forEach(function (id) {
        id = Number(id);
        if (!seen[id]) { db.base.push({ id: nextId('base'), month: month, bdo: bdo, agentId: id, kind: 'uploaded' }); seen[id] = true; }
      });
      persist();
      return Promise.resolve();
    },
    setPriority: function (month, bdo, ids) {
      db.base = db.base.filter(function (b) { return !(b.month === month && b.bdo === bdo && b.kind === 'priority'); });
      var seen = {};
      (ids || []).forEach(function (id) {
        id = Number(id);
        if (!seen[id]) { db.base.push({ id: nextId('base'), month: month, bdo: bdo, agentId: id, kind: 'priority' }); seen[id] = true; }
      });
      persist();
      return Promise.resolve();
    },
    listBaseBdos: function (month) {
      var set = {};
      db.base.forEach(function (b) { if (!month || b.month === month) set[b.bdo] = true; });
      return Promise.resolve(Object.keys(set));
    },

    /* ---------- uploads metadata ---------- */
    addWeeklyUpload: function (meta) {
      var row = Object.assign({ id: nextId('weeklyUploads'), at: nowISO() }, meta);
      db.weeklyUploads.push(row); persist();
      return Promise.resolve(clone(row));
    },
    listWeeklyUploads: function () { return Promise.resolve(clone(db.weeklyUploads)); },

    /* ---------- settings / permissions ---------- */
    getPermissions: function () { return Promise.resolve(db.settings.permissions ? clone(db.settings.permissions) : null); },
    setPermissions: function (matrix) { db.settings.permissions = matrix; persist(); return Promise.resolve(); },

    /* ---------- audit ---------- */
    addAudit: function (a) {
      var row = { id: nextId('audit'), at: nowISO(), userId: a.userId || null, action: a.action, detail: a.detail || '' };
      db.audit.push(row); persist();
      return Promise.resolve(clone(row));
    },
    listAudit: function () { return Promise.resolve(clone(db.audit)); }
  };

  return api;
}

module.exports = { createFileStore: createFileStore };
