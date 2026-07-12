'use strict';
/*
 * MySQL database driver (production).
 * Implements the same repository interface as filestore.js. Not exercised by the
 * local test suite (no MySQL on the dev box) - schema.sql is the source of truth
 * and these queries map 1:1 to it.
 */
var mysql = require('mysql2/promise');

function mapAgent(r) {
  if (!r) return null;
  return {
    id: r.id, acc: r.acc, name: r.name, phone: r.phone, branch: r.branch,
    station: r.station, physicalLocation: r.physical_location,
    gps: (r.gps_lat != null && r.gps_lng != null) ? { lat: Number(r.gps_lat), lng: Number(r.gps_lng) } : null,
    partner: !!r.partner, source: r.source, createdAt: r.created_at
  };
}
function mapUser(r) {
  if (!r) return null;
  return { id: r.id, username: r.username, role: r.role, name: r.name,
    passwordHash: r.password_hash, station: r.station, active: !!r.active,
    mustChangePassword: !!r.must_change_password, mfaSecret: r.mfa_secret || '',
    mfaEnabled: !!r.mfa_enabled, createdAt: r.created_at };
}
function mapService(r) {
  return {
    id: r.id, agentId: r.agent_id, bdo: r.bdo, month: r.month, week: r.week, date: r.date, time: r.time,
    gps: (r.gps_lat != null && r.gps_lng != null) ? { lat: Number(r.gps_lat), lng: Number(r.gps_lng) } : null,
    odk: r.odk, apk: r.apk, floatServed: Number(r.float_served), activeness: r.activeness,
    saCommission: Number(r.sa_commission), servedStatus: r.served_status,
    verificationStatus: r.verification_status, source: r.source
  };
}

function createMysqlStore(cfg) {
  var pool = mysql.createPool({
    host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password,
    database: cfg.database, waitForConnections: true, connectionLimit: 10, namedPlaceholders: false
  });
  async function q(sql, params) { var r = await pool.query(sql, params || []); return r[0]; }

  return {
    driver: 'mysql',
    init: async function () { /* schema applied via migrations (see server/db/migrate.js) */ },
    ping: async function () { await q('SELECT 1'); return true; },
    close: async function () { await pool.end(); },
    reset: async function () {
      var tables = ['service_history', 'base', 'weekly_uploads', 'bank_uploads', 'audit_log', 'agents', 'users'];
      await q('SET FOREIGN_KEY_CHECKS=0');
      for (var i = 0; i < tables.length; i++) await q('TRUNCATE TABLE ' + tables[i]);
      await q('SET FOREIGN_KEY_CHECKS=1');
    },

    getUserByUsername: async function (username) {
      var rows = await q('SELECT * FROM users WHERE username=? LIMIT 1', [String(username).toLowerCase()]);
      return mapUser(rows[0]);
    },
    getUserById: async function (id) {
      var rows = await q('SELECT * FROM users WHERE id=? LIMIT 1', [id]);
      return mapUser(rows[0]);
    },
    listUsers: async function () { return (await q('SELECT * FROM users ORDER BY id')).map(mapUser); },
    updateUser: async function (id, fields) {
      var sets = [], p = [];
      ['name', 'role', 'station'].forEach(function (k) { if (fields[k] !== undefined && fields[k] !== '') { sets.push(k + '=?'); p.push(fields[k]); } });
      if (fields.passwordHash) { sets.push('password_hash=?'); p.push(fields.passwordHash); }
      if (fields.active !== undefined) { sets.push('active=?'); p.push(fields.active ? 1 : 0); }
      if (fields.mustChangePassword !== undefined) { sets.push('must_change_password=?'); p.push(fields.mustChangePassword ? 1 : 0); }
      if (fields.mfaSecret !== undefined) { sets.push('mfa_secret=?'); p.push(fields.mfaSecret); }
      if (fields.mfaEnabled !== undefined) { sets.push('mfa_enabled=?'); p.push(fields.mfaEnabled ? 1 : 0); }
      if (!sets.length) return this.getUserById(id);
      p.push(id);
      await q('UPDATE users SET ' + sets.join(',') + ' WHERE id=?', p);
      return this.getUserById(id);
    },
    deleteUser: async function (id) {
      var r = await q('DELETE FROM users WHERE id=?', [id]);
      return r.affectedRows > 0;
    },
    createUser: async function (u) {
      var r = await q('INSERT INTO users (username,role,name,password_hash,station,active,must_change_password) VALUES (?,?,?,?,?,?,?)',
        [String(u.username).toLowerCase(), u.role, u.name || u.username, u.passwordHash, u.station || '', u.active === false ? 0 : 1, u.mustChangePassword ? 1 : 0]);
      return this.getUserById(r.insertId);
    },

    countAgents: async function () { var r = await q('SELECT COUNT(*) c FROM agents'); return r[0].c; },
    getAgentByAcc: async function (acc) { return mapAgent((await q('SELECT * FROM agents WHERE acc=? LIMIT 1', [String(acc)]))[0]); },
    getAgentById: async function (id) { return mapAgent((await q('SELECT * FROM agents WHERE id=? LIMIT 1', [id]))[0]); },
    getAgentsByIds: async function (ids) {
      if (!ids || !ids.length) return [];
      var placeholders = ids.map(function () { return '?'; }).join(',');
      return (await q('SELECT * FROM agents WHERE id IN (' + placeholders + ')', ids.map(Number))).map(mapAgent);
    },
    _agentWhere: function (filter) {
      var sql = ' WHERE 1=1', p = [];
      if (filter.station) { sql += ' AND station=?'; p.push(filter.station); }
      if (filter.branch) { sql += ' AND branch=?'; p.push(filter.branch); }
      if (filter.search) { sql += ' AND (name LIKE ? OR acc LIKE ? OR phone LIKE ? OR branch LIKE ?)'; var s = '%' + filter.search + '%'; p.push(s, s, s, s); }
      return { sql: sql, p: p };
    },
    listAgents: async function (filter) {
      filter = filter || {};
      var w = this._agentWhere(filter);
      var sql = 'SELECT * FROM agents' + w.sql + ' ORDER BY name';
      var p = w.p.slice();
      if (filter.limit) { sql += ' LIMIT ? OFFSET ?'; p.push(Number(filter.limit), Number(filter.offset) || 0); }
      return (await q(sql, p)).map(mapAgent);
    },
    countAgentsFiltered: async function (filter) {
      filter = filter || {};
      var w = this._agentWhere(filter);
      var r = await q('SELECT COUNT(*) c FROM agents' + w.sql, w.p);
      return r[0].c;
    },
    upsertAgentByAcc: async function (a) {
      var existing = await this.getAgentByAcc(a.acc);
      var lat = a.gps ? a.gps.lat : null, lng = a.gps ? a.gps.lng : null;
      if (existing) {
        await q('UPDATE agents SET name=COALESCE(NULLIF(?,\'\'),name), phone=COALESCE(NULLIF(?,\'\'),phone), branch=COALESCE(NULLIF(?,\'\'),branch), station=COALESCE(NULLIF(?,\'\'),station), physical_location=COALESCE(NULLIF(?,\'\'),physical_location), partner=?, gps_lat=COALESCE(?,gps_lat), gps_lng=COALESCE(?,gps_lng) WHERE id=?',
          [a.name || '', a.phone || '', a.branch || '', a.station || '', a.physicalLocation || '', a.partner ? 1 : 0, lat, lng, existing.id]);
        return this.getAgentById(existing.id);
      }
      var r = await q('INSERT INTO agents (acc,name,phone,branch,station,physical_location,gps_lat,gps_lng,partner,source) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [String(a.acc), a.name || '', a.phone || '', a.branch || '', a.station || '', a.physicalLocation || '', lat, lng, a.partner ? 1 : 0, a.source || 'upload']);
      return this.getAgentById(r.insertId);
    },

    addServiceRows: async function (rows) {
      for (var i = 0; i < (rows || []).length; i++) {
        var r = rows[i];
        await q('INSERT INTO service_history (agent_id,bdo,month,week,date,time,gps_lat,gps_lng,odk,apk,float_served,activeness,sa_commission,served_status,verification_status,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [r.agentId, r.bdo, r.month, r.week || '', r.date || '', r.time || '', r.gps ? r.gps.lat : null, r.gps ? r.gps.lng : null,
            r.odk || 'NO', r.apk || 'NO', Number(r.floatServed) || 0, r.activeness || '', Number(r.saCommission) || 0,
            r.servedStatus || 'NOT_SERVED', r.verificationStatus || 'PENDING', r.source || 'weekly']);
      }
      return (rows || []).length;
    },
    listService: async function (filter) {
      filter = filter || {};
      var sql = 'SELECT * FROM service_history WHERE 1=1', p = [];
      if (filter.bdo) { sql += ' AND bdo=?'; p.push(filter.bdo); }
      if (filter.month) { sql += ' AND month=?'; p.push(filter.month); }
      if (filter.agentId) { sql += ' AND agent_id=?'; p.push(filter.agentId); }
      return (await q(sql, p)).map(mapService);
    },
    servedAgentIds: async function (bdo, month) {
      var sql = 'SELECT DISTINCT agent_id FROM service_history WHERE month=? AND served_status=\'SERVED\'', p = [month];
      if (bdo) { sql += ' AND bdo=?'; p.push(bdo); }
      return (await q(sql, p)).map(function (r) { return r.agent_id; });
    },
    everServedAgentIds: async function () {
      return (await q('SELECT DISTINCT agent_id FROM service_history WHERE served_status=\'SERVED\'')).map(function (r) { return r.agent_id; });
    },
    updateServiceVerification: async function (id, status) {
      await q('UPDATE service_history SET verification_status=? WHERE id=?', [status, id]);
    },

    addBankRows: async function (month, rows) {
      await q('DELETE FROM bank_uploads WHERE month=?', [month]);
      for (var i = 0; i < (rows || []).length; i++) {
        var r = rows[i];
        await q('INSERT INTO bank_uploads (month,acc,visit,apk,served) VALUES (?,?,?,?,?)',
          [month, String(r.acc), r.visit || 'NO', r.apk || 'NO', r.served || 'NOT_SERVED']);
      }
      return (rows || []).length;
    },
    getBankRows: async function (month) {
      return (await q('SELECT month,acc,visit,apk,served FROM bank_uploads WHERE month=?', [month]));
    },

    setTargets: async function (month, rows) {
      await q('DELETE FROM monthly_targets WHERE month=?', [month]);
      for (var i = 0; i < (rows || []).length; i++) {
        var r = rows[i];
        await q('INSERT INTO monthly_targets (month,station,agents_target,float_target,served_target,visits_target) VALUES (?,?,?,?,?,?)',
          [month, r.station || 'Office', Number(r.agentsTarget) || 0, Number(r.floatTarget) || 0, Number(r.servedTarget) || 0, Number(r.visitsTarget) || 0]);
      }
      return (rows || []).length;
    },
    getTargets: async function (month) {
      var rows = await q('SELECT * FROM monthly_targets WHERE month=?', [month]);
      return rows.map(function (r) {
        return { month: r.month, station: r.station, agentsTarget: Number(r.agents_target), floatTarget: Number(r.float_target), servedTarget: Number(r.served_target), visitsTarget: Number(r.visits_target) };
      });
    },

    setCommissionFinal: async function (month, meta) {
      await q('DELETE FROM commission_final WHERE month=?', [month]);
      await q('INSERT INTO commission_final (month,filename,`rows`) VALUES (?,?,?)', [month, meta.filename || '', JSON.stringify(meta.rows || [])]);
      return (meta.rows || []).length;
    },
    getCommissionFinal: async function (month) {
      var rows = await q('SELECT * FROM commission_final WHERE month=? LIMIT 1', [month]);
      if (!rows[0]) return null;
      var r = rows[0];
      return { month: r.month, filename: r.filename, rows: (typeof r.rows === 'string') ? JSON.parse(r.rows) : r.rows };
    },
    setCommissionCalc: async function (month, c) {
      await q('DELETE FROM commission_calc WHERE month=?', [month]);
      await q('INSERT INTO commission_calc (month,served_count,total,fixed_pool,variable_pool,achievement,release_pct,variable_paid,final_amount) VALUES (?,?,?,?,?,?,?,?,?)',
        [month, c.servedCount || 0, c.total || 0, c.fixedPool || 0, c.variablePool || 0, c.achievement || 0, c.releasePct || 0, c.variablePaid || 0, c.final || 0]);
    },
    getCommissionCalc: async function (month) {
      var rows = await q('SELECT * FROM commission_calc WHERE month=? LIMIT 1', [month]);
      if (!rows[0]) return null;
      var r = rows[0];
      return { month: r.month, servedCount: r.served_count, total: Number(r.total), fixedPool: Number(r.fixed_pool),
        variablePool: Number(r.variable_pool), achievement: Number(r.achievement), releasePct: Number(r.release_pct),
        variablePaid: Number(r.variable_paid), final: Number(r.final_amount) };
    },
    listCommissionCalc: async function () {
      var rows = await q('SELECT * FROM commission_calc ORDER BY month', []);
      return rows.map(function (r) {
        return { month: r.month, servedCount: r.served_count, total: Number(r.total), fixedPool: Number(r.fixed_pool),
          variablePool: Number(r.variable_pool), achievement: Number(r.achievement), releasePct: Number(r.release_pct),
          variablePaid: Number(r.variable_paid), final: Number(r.final_amount) };
      });
    },
    setClawback: async function (month, d) {
      await q('DELETE FROM clawback WHERE month=?', [month]);
      await q('INSERT INTO clawback (month,earned,potential,recovered,net,reasons) VALUES (?,?,?,?,?,?)',
        [month, d.earned || 0, d.potential || 0, d.recovered || 0, d.net || 0, JSON.stringify(d.reasons || [])]);
    },
    getClawback: async function (month) {
      var rows = await q('SELECT * FROM clawback WHERE month=? LIMIT 1', [month]);
      if (!rows[0]) return null;
      var r = rows[0];
      return { month: r.month, earned: Number(r.earned), potential: Number(r.potential), recovered: Number(r.recovered),
        net: Number(r.net), reasons: (typeof r.reasons === 'string') ? JSON.parse(r.reasons || '[]') : (r.reasons || []) };
    },
    listClawback: async function () {
      var rows = await q('SELECT * FROM clawback ORDER BY month', []);
      return rows.map(function (r) {
        return { month: r.month, earned: Number(r.earned), potential: Number(r.potential), recovered: Number(r.recovered),
          net: Number(r.net), reasons: (typeof r.reasons === 'string') ? JSON.parse(r.reasons || '[]') : (r.reasons || []) };
      });
    },

    getBase: async function (month, bdo) {
      var rows = await q('SELECT agent_id, kind FROM base WHERE month=? AND bdo=?', [month, bdo]);
      var priority = [], uploaded = [];
      rows.forEach(function (r) { if (r.kind === 'priority') priority.push(r.agent_id); else uploaded.push(r.agent_id); });
      return { priority: priority, uploaded: uploaded };
    },
    addUploaded: async function (month, bdo, ids) {
      for (var i = 0; i < (ids || []).length; i++) {
        await q('INSERT IGNORE INTO base (month,bdo,agent_id,kind) VALUES (?,?,?,\'uploaded\')', [month, bdo, Number(ids[i])]);
      }
    },
    setPriority: async function (month, bdo, ids) {
      await q('DELETE FROM base WHERE month=? AND bdo=? AND kind=\'priority\'', [month, bdo]);
      for (var i = 0; i < (ids || []).length; i++) {
        await q('INSERT IGNORE INTO base (month,bdo,agent_id,kind) VALUES (?,?,?,\'priority\')', [month, bdo, Number(ids[i])]);
      }
    },
    listBaseBdos: async function (month) {
      var sql = 'SELECT DISTINCT bdo FROM base', p = [];
      if (month) { sql += ' WHERE month=?'; p.push(month); }
      return (await q(sql, p)).map(function (r) { return r.bdo; });
    },

    addWeeklyUpload: async function (m) {
      var r = await q('INSERT INTO weekly_uploads (filename,month,week,bdo,uploaded_by,row_count) VALUES (?,?,?,?,?,?)',
        [m.filename || '', m.month, m.week || '', m.bdo, m.uploadedBy || null, m.rowCount || 0]);
      return { id: r.insertId };
    },
    listWeeklyUploads: async function () { return await q('SELECT * FROM weekly_uploads ORDER BY id DESC'); },

    getPermissions: async function () {
      var rows = await q('SELECT value FROM app_settings WHERE name=? LIMIT 1', ['permissions']);
      if (!rows[0]) return null;
      var v = rows[0].value;
      return (typeof v === 'string') ? JSON.parse(v) : v;
    },
    setPermissions: async function (matrix) {
      await q('INSERT INTO app_settings (name,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)', ['permissions', JSON.stringify(matrix)]);
    },

    addAudit: async function (a) {
      await q('INSERT INTO audit_log (user_id,action,detail) VALUES (?,?,?)', [a.userId || null, a.action, a.detail || '']);
    },
    listAudit: async function () { return await q('SELECT * FROM audit_log ORDER BY id DESC LIMIT 500'); }
  };
}

module.exports = { createMysqlStore: createMysqlStore };
