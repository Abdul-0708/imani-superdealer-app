/* IMANI SUPERDEALER - front-end SPA (OM/MD). Talks to the /api backend.
 * Pure ASCII, brace-balanced, unique top-level function names (checked by validate.js). */
(function () {
  'use strict';

  var state = {
    token: localStorage.getItem('imani_token') || '',
    user: null,
    perms: {},
    tab: 'dashboard',
    month: defaultMonth(),
    baseBdo: '',
    bdos: []
  };

  /* Effective-permission check for the current user (Super Admin always allowed). */
  function can(moduleKey, level) {
    if (state.user && state.user.role === 'superadmin') return true;
    var p = state.perms[moduleKey];
    return !!(p && p[level]);
  }

  /* ---------------- helpers ---------------- */
  function defaultMonth() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function elById(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(n) {
    n = Number(n) || 0;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    elById('toasts').appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 400); }, 3200);
  }

  /* ---- inline SVG icon set (no emoji; stroke, currentColor, themable) ---- */
  var ICON = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    upload: '<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M14.5 9.3a2.6 2.6 0 0 0-2.5-1.5c-1.5 0-2.6.8-2.6 2s1.1 1.8 2.6 2 2.5.6 2.5 2-1.1 2-2.5 2a2.6 2.6 0 0 1-2.6-1.5"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/>',
    spark: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M19 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    percent: '<path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M16 14h3"/>',
    inbox: '<path d="M4 13l2.5-8h11L20 13"/><path d="M4 13v6h16v-6"/><path d="M4 13h5l1 2h4l1-2h5"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || ICON.grid) + '</svg>';
  }
  var TAB_ICON = { executive: 'grid', mybase: 'phone', dashboard: 'grid', agents: 'users', base: 'layers', upload: 'upload', verification: 'shield', quality: 'alert', commission: 'dollar', clawback: 'wallet', analytics: 'chart', insights: 'spark', settings: 'gear', admin: 'lock' };
  function iconForTitle(t) {
    t = ('' + t).toLowerCase();
    if (/sa commission|commission|fixed|final/.test(t)) return 'dollar';
    if (/clawback|potential|recovered|net/.test(t)) return 'wallet';
    if (/rate|achievement|performance|integrity|projected|%/.test(t)) return 'percent';
    if (/visit|odk/.test(t)) return 'target';
    if (/apk|update/.test(t)) return 'rotate';
    if (/bdo/.test(t)) return 'phone';
    if (/variable|pool|float|target|analy/.test(t)) return 'chart';
    if (/gps|location|missing|unknown|branch|duplicate|phone/.test(t)) return 'alert';
    if (/agent|priority|new|base|served|member|total/.test(t)) return 'users';
    return 'layers';
  }
  function initials(n) { var w = ('' + n).match(/[A-Za-z]+/g) || []; return ((w[0] ? w[0][0] : '') + (w[1] ? w[1][0] : '')).toUpperCase() || 'U'; }
  function skeletonHtml() {
    var c = ''; for (var i = 0; i < 4; i++) c += '<div class="skel skel-card"></div>';
    var l = ''; for (var j = 0; j < 5; j++) l += '<div class="skel skel-line" style="width:' + (92 - j * 10) + '%"></div>';
    return '<div class="grid cards" style="margin-bottom:16px">' + c + '</div><div class="panel">' + l + '</div>';
  }
  function emptyState(icon, title, msg) {
    return '<div class="empty">' + svg(icon) + '<b>' + esc(title) + '</b>' + (msg ? '<div>' + esc(msg) + '</div>' : '') + '</div>';
  }

  function apiHeaders(json) {
    var h = {};
    if (json) h['Content-Type'] = 'application/json';
    if (state.token) h.Authorization = 'Bearer ' + state.token;
    return h;
  }
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', headers: apiHeaders(opts.body != null) };
    if (opts.body != null) init.body = JSON.stringify(opts.body);
    return fetch('/api' + path, init).then(function (r) {
      if (r.status === 401) { doLogout(true); throw new Error('Please sign in again'); }
      return r.json().then(function (data) {
        if (!r.ok) throw new Error(data && data.error ? data.error : ('Error ' + r.status));
        return data;
      });
    });
  }
  function apiUpload(path, formData) {
    return fetch('/api' + path, { method: 'POST', headers: apiHeaders(false), body: formData }).then(function (r) {
      return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || ('Error ' + r.status)); return d; });
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    applyTheme();
    if (state.token) {
      api('/auth/me').then(function (d) { state.user = d.user; return loadPerms(); })
        .then(function () { state.tab = defaultTab(); render(); })
        .catch(function () { state.token = ''; localStorage.removeItem('imani_token'); render(); });
    } else { render(); }
  }
  function loadPerms() {
    return api('/auth/permissions').then(function (d) { state.perms = d.modules || {}; state.moduleMeta = d.moduleMeta || []; });
  }
  function defaultTab() {
    if (state.user && state.user.role === 'superadmin') return 'admin';
    var tabs = tabsForUser();
    return tabs.length ? tabs[0][0] : 'dashboard';
  }

  function applyTheme() {
    var t = localStorage.getItem('imani_theme');
    document.body.classList.toggle('light', t === 'light');
  }
  function toggleTheme() {
    var light = !document.body.classList.contains('light');
    document.body.classList.toggle('light', light);
    localStorage.setItem('imani_theme', light ? 'light' : 'dark');
  }

  function render() {
    if (!state.user) { renderLogin(); return; }
    if (state.user.mustChangePassword) { renderChangePassword(); return; }
    renderShell();
  }

  function renderChangePassword() {
    elById('app').innerHTML =
      '<div class="login"><div class="box">' +
      '<div class="brandmark">' + svg('lock') + '</div>' +
      '<h1>Set your password</h1>' +
      '<p class="hint">For security you must choose your own password before continuing.</p>' +
      '<form id="cpForm">' +
      '<div class="field"><label>Current password</label><input id="cpCur" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label>New password (min 8 characters)</label><input id="cpNew" type="password" autocomplete="new-password"></div>' +
      '<div class="field"><label>Confirm new password</label><input id="cpNew2" type="password" autocomplete="new-password"></div>' +
      '<button class="btn" type="submit">Update password</button>' +
      '<div class="err" id="cpErr"></div></form>' +
      '<button class="tab" data-action="logout" style="margin-top:8px">Sign out</button>' +
      '</div></div>';
    var f = elById('cpCur'); if (f) f.focus();
  }
  function doChangePassword() {
    var cur = elById('cpCur').value, nw = elById('cpNew').value, nw2 = elById('cpNew2').value;
    if (nw !== nw2) { elById('cpErr').textContent = 'Passwords do not match'; return; }
    if (nw.length < 8) { elById('cpErr').textContent = 'New password must be at least 8 characters'; return; }
    api('/auth/change-password', { method: 'POST', body: { currentPassword: cur, newPassword: nw } })
      .then(function () { state.user.mustChangePassword = false; toast('Password updated', 'ok'); render(); })
      .catch(function (e) { elById('cpErr').textContent = e.message; });
  }

  /* ---------------- login ---------------- */
  function renderLogin() {
    elById('app').innerHTML =
      '<div class="login"><div class="box">' +
      '<div class="brandmark">' + svg('layers') + '</div>' +
      '<h1>IMANI SUPERDEALER</h1>' +
      '<p class="hint">Business Management Platform</p>' +
      '<form id="loginForm">' +
      '<div class="field"><label>Username</label><input id="lUser" autocomplete="username" placeholder="om"></div>' +
      '<div class="field"><label>Password</label><input id="lPass" type="password" autocomplete="current-password" placeholder="password"></div>' +
      '<button class="btn" type="submit">Sign in</button>' +
      '<div class="err" id="lErr"></div>' +
      '</form></div></div>';
    var u = elById('lUser'); if (u) u.focus();
  }
  function finishLogin(d) {
    state.token = d.token; state.user = d.user;
    localStorage.setItem('imani_token', d.token);
    state._loginCreds = null;
    return loadPerms().then(function () { state.tab = defaultTab(); render(); });
  }
  function doLogin() {
    var username = elById('lUser').value.trim();
    var password = elById('lPass').value;
    api('/auth/login', { method: 'POST', body: { username: username, password: password } })
      .then(function (d) {
        if (d.mfaRequired) { state._loginCreds = { username: username, password: password }; showLoginMfa(); return; }
        return finishLogin(d);
      })
      .catch(function (e) { elById('lErr').textContent = e.message; });
  }
  function showLoginMfa() {
    elById('app').innerHTML =
      '<div class="login"><div class="box">' +
      '<div class="brandmark">' + svg('lock') + '</div>' +
      '<h1>Two-factor code</h1>' +
      '<p class="hint">Enter the 6-digit code from your authenticator app.</p>' +
      '<form id="mfaForm"><div class="field"><label>Authentication code</label>' +
      '<input id="lCode" inputmode="numeric" autocomplete="one-time-code" placeholder="123456"></div>' +
      '<button class="btn" type="submit">Verify</button><div class="err" id="lErr"></div></form>' +
      '<button class="tab" data-action="logout" style="margin-top:8px">Cancel</button></div></div>';
    var c = elById('lCode'); if (c) c.focus();
  }
  function doLoginMfa() {
    var creds = state._loginCreds || {};
    api('/auth/login', { method: 'POST', body: { username: creds.username, password: creds.password, code: elById('lCode').value.trim() } })
      .then(function (d) { if (d.mfaRequired) { elById('lErr').textContent = 'Enter the code'; return; } return finishLogin(d); })
      .catch(function (e) { elById('lErr').textContent = e.message; });
  }
  function doLogout(silent) {
    state.token = ''; state.user = null;
    localStorage.removeItem('imani_token');
    if (!silent) render();
  }

  /* ---------------- shell ---------------- */
  var TAB_LABELS = { executive: 'Executive', mybase: 'My Agent Base', dashboard: 'Dashboard', agents: 'Agents', base: 'Agent Base', upload: 'Upload', verification: 'Verification', quality: 'Data Quality', commission: 'Commission', clawback: 'Clawback', analytics: 'Analytics', insights: 'AI Insights', settings: 'Settings', admin: 'Admin' };
  var TAB_ORDER = ['executive', 'mybase', 'dashboard', 'agents', 'base', 'upload', 'verification', 'quality', 'commission', 'clawback', 'analytics', 'insights', 'settings', 'admin'];
  /* Tabs are whatever modules the current user has VIEW permission on. */
  function tabsForUser() {
    var out = [];
    TAB_ORDER.forEach(function (k) { if (can(k, 'view')) out.push([k, TAB_LABELS[k]]); });
    return out;
  }
  function renderShell() {
    var tabs = tabsForUser();
    if (!tabs.some(function (t) { return t[0] === state.tab; })) state.tab = tabs.length ? tabs[0][0] : 'dashboard';
    var tabHtml = tabs.map(function (t) {
      return '<button class="tab' + (t[0] === state.tab ? ' active' : '') + '" data-action="tab" data-tab="' + t[0] + '">' + svg(TAB_ICON[t[0]] || 'grid') + '<span>' + esc(t[1]) + '</span></button>';
    }).join('');
    elById('app').innerHTML =
      '<div class="topbar"><div class="brand">IMANI SUPERDEALER<small>Business Management</small></div>' +
      '<div class="spacer"></div>' +
      '<span class="avatar" aria-hidden="true">' + esc(initials(state.user.name)) + '</span>' +
      '<div class="who"><b>' + esc(state.user.name) + '</b><span class="badge-role">' + esc(roleLabel(state.user.role)) + '</span></div>' +
      '<button class="tab" data-action="account" title="Account and security" aria-label="Account and security" style="margin-left:10px">Account</button>' +
      '<button class="tab" data-action="toggleTheme" title="Toggle light/dark theme" aria-label="Toggle light or dark theme">Theme</button>' +
      '<button class="tab" data-action="logout">Sign out</button></div>' +
      '<div class="tabs">' + tabHtml + '</div>' +
      '<div class="wrap"><div id="view"></div></div>';
    renderTab();
  }
  function roleLabel(r) { return r === 'superadmin' ? 'Super Admin' : (r === 'md' ? 'Managing Director' : (r === 'om' ? 'Operational Manager' : 'BDO')); }

  function renderTab() {
    var v = elById('view'); if (!v) return;
    v.innerHTML = skeletonHtml();
    if (state.tab === 'dashboard') viewDashboard(v);
    else if (state.tab === 'agents') viewAgents(v);
    else if (state.tab === 'base') viewBase(v);
    else if (state.tab === 'upload') viewUpload(v);
    else if (state.tab === 'verification') viewVerification(v);
    else if (state.tab === 'quality') viewQuality(v);
    else if (state.tab === 'commission') viewCommission(v);
    else if (state.tab === 'clawback') viewClawback(v);
    else if (state.tab === 'analytics') viewAnalytics(v);
    else if (state.tab === 'executive') viewExecutive(v);
    else if (state.tab === 'insights') viewInsights(v);
    else if (state.tab === 'mybase') viewMyBase(v);
    else if (state.tab === 'admin') viewAdmin(v);
    else if (state.tab === 'settings') viewSettings(v);
  }

  /* ---------------- dashboard ---------------- */
  function viewDashboard(v) {
    api('/dashboard/summary?month=' + state.month).then(function (d) {
      var cards =
        card('Total Agents', fmt(d.totalAgents)) +
        card('Served This Month', fmt(d.servedThisMonth), d.month) +
        card('Served Rate', d.servedRate + '%') +
        card('Agent Visits (ODK)', fmt(d.visitYes), 'YES claims') +
        card('APK Updates', fmt(d.apkYes), 'YES claims') +
        card('Active BDOs', fmt(d.bdoCount));
      var stationRows = (d.stations || []).map(function (s) {
        var pct = s.agents ? Math.round((s.served / s.agents) * 100) : 0;
        return '<tr><td>' + esc(s.station) + '</td><td>' + fmt(s.agents) + '</td><td>' + fmt(s.served) + '</td>' +
          '<td style="min-width:120px"><div class="bar"><i style="width:' + pct + '%"></i></div></td><td>' + pct + '%</td></tr>';
      }).join('') || '<tr><td colspan="5" class="note">No agents yet. Import a weekly file under Upload.</td></tr>';
      var uploads = (d.uploads || []).map(function (u) {
        return '<tr><td>' + esc(u.bdo) + '</td><td>' + esc(u.month) + '</td><td>' + esc(u.week || '-') + '</td><td>' + fmt(u.rowCount || u.row_count || 0) + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="note">No uploads yet.</td></tr>';
      v.innerHTML =
        monthPicker() +
        '<div class="grid cards" style="margin-bottom:16px">' + cards + '</div>' +
        '<div class="panel"><h2>Performance by Station</h2><div class="tablewrap"><table><thead><tr><th>Station</th><th>Agents</th><th>Served</th><th>Progress</th><th>%</th></tr></thead><tbody>' + stationRows + '</tbody></table></div></div>' +
        '<div class="panel"><h2>Recent Uploads</h2><div class="tablewrap"><table><thead><tr><th>BDO</th><th>Month</th><th>Week</th><th>Rows</th></tr></thead><tbody>' + uploads + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function card(title, value, sub) {
    return '<div class="card"><div class="card-head"><span class="kpi-ic">' + svg(iconForTitle(title)) + '</span><h3>' + esc(title) + '</h3></div>' +
      '<div class="kpi">' + esc(value) + '</div>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>';
  }
  function monthPicker() {
    return '<div class="panel"><div class="row"><div class="field"><label>Working Month</label>' +
      '<input id="monthInput" type="month" value="' + esc(state.month) + '"></div>' +
      '<button class="btn" data-action="setMonth">Apply</button></div></div>';
  }

  /* ---------------- agents ---------------- */
  function viewAgents(v) {
    var page = state.agentPage || 1;
    var qs = '?page=' + page + '&limit=50' + (state._agentSearch ? '&search=' + encodeURIComponent(state._agentSearch) : '');
    api('/agents' + qs).then(function (d) {
      var list = d.items || [];
      var rows = list.map(function (a) {
        return '<tr><td>' + esc(a.acc) + '</td><td>' + esc(a.name) + '</td><td>' + esc(a.phone) + '</td>' +
          '<td>' + esc(a.branch) + '</td><td>' + esc(a.station) + '</td><td>' + esc(a.physicalLocation || '-') + '</td>' +
          '<td>' + (a.partner ? 'Yes' : '-') + '</td></tr>';
      }).join('') || '<tr><td colspan="7" class="note">No agents found.</td></tr>';
      var pager = d.pages > 1
        ? '<div class="row" style="margin-top:12px;align-items:center"><button class="ghost btn" data-action="prevPage"' + (d.page <= 1 ? ' disabled' : '') + '>Prev</button>' +
          '<div class="note">Page ' + d.page + ' of ' + d.pages + '</div>' +
          '<button class="ghost btn" data-action="nextPage"' + (d.page >= d.pages ? ' disabled' : '') + '>Next</button></div>'
        : '';
      v.innerHTML =
        '<div class="panel"><div class="row"><div class="field"><label>Search agents</label>' +
        '<input id="agentSearch" placeholder="name, account, phone" value="' + esc(state._agentSearch || '') + '"></div>' +
        '<button class="btn" data-action="agentSearch">Search</button>' +
        '<button class="ghost btn" data-action="agentClear">Clear</button>' +
        '<div class="spacer"></div><div class="note">' + fmt(d.total) + ' agents</div></div></div>' +
        '<div class="panel"><div class="tablewrap"><table><thead><tr><th scope="col">Account</th><th scope="col">Name</th><th scope="col">Phone</th><th scope="col">Branch</th><th scope="col">Station</th><th scope="col">Physical Location</th><th scope="col">Partner</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + pager + '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }

  /* ---------------- agent base ---------------- */
  function viewBase(v) {
    ensureBdos().then(function () {
      if (!state.baseBdo && state.bdos.length) state.baseBdo = state.bdos[0].username;
      var opts = state.bdos.map(function (b) {
        return '<option value="' + esc(b.username) + '"' + (b.username === state.baseBdo ? ' selected' : '') + '>' + esc(b.name) + '</option>';
      }).join('') + '<option value="unassigned"' + (state.baseBdo === 'unassigned' ? ' selected' : '') + '>Unassigned</option>';
      var controls =
        '<div class="panel"><div class="row">' +
        '<div class="field"><label>BDO</label><select id="baseBdo">' + opts + '</select></div>' +
        '<div class="field"><label>Month</label><input id="baseMonth" type="month" value="' + esc(state.month) + '"></div>' +
        '<button class="btn" data-action="loadBase">Load base</button>' +
        (can('agents', 'view') ? '<button class="ghost btn" data-action="downloadServed">Download served (Excel)</button>' : '') +
        (can('base', 'edit') ? '<div class="spacer"></div><button class="btn" data-action="rollover" title="Carry served agents into next month">Run month-end carry-forward</button>' : '') +
        '</div></div><div id="baseBody"></div>';
      v.innerHTML = controls;
      if (state.baseBdo) loadBaseInto();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function loadBaseInto() {
    var body = elById('baseBody'); if (!body) return;
    body.innerHTML = '<div class="note">Loading base...</div>';
    api('/base/' + encodeURIComponent(state.baseBdo) + '/' + state.month).then(function (d) {
      var c = d.counts;
      var counts =
        '<div class="grid cards" style="margin-bottom:16px">' +
        card('Priority Agents', fmt(c.priority), 'served last month') +
        card('New Uploaded', fmt(c.newAgents), 'this month') +
        card('Total Working Base', fmt(c.total)) +
        '</div>';
      var rows = d.agents.map(function (a) {
        return '<tr><td><span class="dot ' + a.level + '"></span><span class="pill ' + a.level + '">' + levelLabel(a.level) + '</span></td>' +
          '<td>' + esc(a.acc) + '</td><td>' + esc(a.name) + '</td><td>' + esc(a.phone) + '</td><td>' + esc(a.branch) + '</td><td>' + esc(a.physicalLocation || '-') + '</td></tr>';
      }).join('') || '<tr><td colspan="6" class="note">No agents in this base yet.</td></tr>';
      body.innerHTML = counts +
        '<div class="panel"><h2>Agent Base &mdash; ' + esc(d.bdo) + '</h2>' +
        '<div class="note" style="margin-bottom:10px"><span class="pill priority">Priority</span> served previous month &nbsp; <span class="pill new">New</span> uploaded &nbsp; <span class="pill never">Never served</span></div>' +
        '<div class="tablewrap"><table><thead><tr><th>Level</th><th>Account</th><th>Name</th><th>Phone</th><th>Branch</th><th>Physical Location</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).catch(function (e) { body.innerHTML = errBox(e); });
  }
  function levelLabel(l) { return l === 'priority' ? 'Priority' : (l === 'new' ? 'New' : 'Never'); }

  /* ---------------- upload ---------------- */
  function viewUpload(v) {
    ensureBdos().then(function () {
      var opts = '<option value="">Auto (from file / unassigned)</option>' +
        state.bdos.map(function (b) { return '<option value="' + esc(b.username) + '">' + esc(b.name) + '</option>'; }).join('');
      v.innerHTML =
        '<div class="panel"><h2>Weekly / Dated Performance Upload</h2>' +
        '<p class="note">Excel columns: Agent Account, Agent Name, Phone, Branch, Unique Serving Status, Float Served, Agent Visit (YES/NO), APK Update (YES/NO), Agent Activeness, SA Commission, Served Status. Optional: <b>BDO / Officer</b>, Physical Location, Partner, Date.</p>' +
        '<p class="note">You do <b>not</b> need to attach a BDO. If the file has a BDO/Officer column each agent is linked automatically (new BDOs are created); rows without one go to <b>Unassigned</b>. Use the dropdown only if you want to force every row to one BDO.</p>' +
        '<div class="row" style="margin-top:8px">' +
        '<div class="field"><label>Assign to BDO (optional)</label><select id="upBdo">' + opts + '</select></div>' +
        '<div class="field"><label>Date</label><input id="upDate" type="date"></div>' +
        '<div class="field"><label>Week</label><input id="upWeek" placeholder="e.g. W1"></div>' +
        '<div class="field"><label>Excel file (.xlsx)</label><input id="upFile" type="file" accept=".xlsx,.xls"></div>' +
        (can('upload', 'edit') ? '<button class="btn" data-action="doUpload">Upload</button><button class="ghost btn" data-action="loadDemo">Load demo data</button>' : '<span class="note">View only - you cannot upload.</span>') +
        '</div><div id="upResult" class="note" style="margin-top:12px"></div></div>' +
        '<div class="panel"><h2>Monthly Target Upload</h2>' +
        '<p class="note">Office / station KPI targets for a month. Columns: Station, Target Agents, Target Float, Target Served, Target Visits. Feeds commission achievement.</p>' +
        '<div class="row" style="margin-top:8px">' +
        '<div class="field"><label>Month</label><input id="tgtMonth" type="month" value="' + esc(state.month) + '"></div>' +
        '<div class="field"><label>Excel file (.xlsx)</label><input id="tgtFile" type="file" accept=".xlsx,.xls"></div>' +
        (can('upload', 'edit') ? '<button class="btn" data-action="doTargets">Upload targets</button><button class="ghost btn" data-action="loadDemoTargets">Load demo targets</button>' : '<span class="note">View only.</span>') +
        '</div><div id="tgtResult" class="note" style="margin-top:10px"></div><div id="tgtBody" style="margin-top:12px"></div></div>';
      loadTargets();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function doUpload() {
    var bdo = elById('upBdo').value;
    var date = elById('upDate').value;
    var week = elById('upWeek').value;
    var fileInput = elById('upFile');
    if (!fileInput.files || !fileInput.files[0]) { toast('Choose an Excel file first', 'warn'); return; }
    var fd = new FormData();
    fd.append('file', fileInput.files[0]);
    if (bdo) fd.append('bdo', bdo);
    if (date) { fd.append('date', date); fd.append('month', date.slice(0, 7)); }
    fd.append('week', week);
    elById('upResult').textContent = 'Uploading...';
    apiUpload('/uploads/weekly', fd).then(function (d) { elById('upResult').innerHTML = uploadSummary(d); toast('Upload complete', 'ok'); })
      .catch(function (e) { elById('upResult').innerHTML = errBox(e); });
  }
  function loadDemo() {
    var bdo = elById('upBdo').value;
    var body = { month: state.month, week: 'W1', rows: demoRows() };
    if (bdo) body.bdo = bdo;
    api('/uploads/weekly', { method: 'POST', body: body })
      .then(function (d) { toast('Demo data loaded', 'ok'); elById('upResult').innerHTML = uploadSummary(d); })
      .catch(function (e) { elById('upResult').innerHTML = errBox(e); });
  }
  function uploadSummary(d) {
    var s = 'Imported <b>' + fmt(d.rows) + '</b> rows (' + esc(d.month) + '): ' + fmt(d.agents) + ' agents, ' + fmt(d.served) + ' served. BDOs: <b>' + (d.bdos || []).map(esc).join(', ') + '</b>.';
    if (d.createdBdos && d.createdBdos.length) s += ' New BDO accounts created: ' + d.createdBdos.map(esc).join(', ') + '.';
    return s;
  }
  function loadTargets() {
    var body = elById('tgtBody'); if (!body) return;
    var month = (elById('tgtMonth') && elById('tgtMonth').value) || state.month;
    api('/uploads/targets/' + month).then(function (list) {
      if (!list.length) { body.innerHTML = '<div class="note">No targets set for ' + esc(month) + ' yet.</div>'; return; }
      var rows = list.map(function (t) {
        return '<tr><td>' + esc(t.station) + '</td><td>' + fmt(t.agentsTarget) + '</td><td>' + fmt(t.floatTarget) + '</td><td>' + fmt(t.servedTarget) + '</td><td>' + fmt(t.visitsTarget) + '</td></tr>';
      }).join('');
      body.innerHTML = '<div class="tablewrap"><table><thead><tr><th>Station</th><th>Target Agents</th><th>Target Float</th><th>Target Served</th><th>Target Visits</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }).catch(function (e) { body.innerHTML = errBox(e); });
  }
  function doTargets() {
    var month = elById('tgtMonth').value;
    var fileInput = elById('tgtFile');
    if (!fileInput.files || !fileInput.files[0]) { toast('Choose a targets Excel file first', 'warn'); return; }
    var fd = new FormData();
    fd.append('file', fileInput.files[0]); fd.append('month', month);
    elById('tgtResult').textContent = 'Uploading targets...';
    apiUpload('/uploads/targets', fd).then(function (d) { elById('tgtResult').innerHTML = 'Saved ' + fmt(d.rows) + ' target rows for ' + esc(d.month) + '.'; toast('Targets saved', 'ok'); loadTargets(); })
      .catch(function (e) { elById('tgtResult').innerHTML = errBox(e); });
  }
  function loadDemoTargets() {
    var month = elById('tgtMonth').value || state.month;
    var rows = [
      { 'Station': 'Arusha', 'Target Agents': 500, 'Target Float': 200000000, 'Target Served': 420, 'Target Visits': 100 },
      { 'Station': 'Manyara', 'Target Agents': 100, 'Target Float': 30000000, 'Target Served': 80, 'Target Visits': 40 }
    ];
    api('/uploads/targets', { method: 'POST', body: { month: month, rows: rows } })
      .then(function (d) { toast('Demo targets loaded', 'ok'); elById('tgtResult').innerHTML = 'Saved ' + fmt(d.rows) + ' demo target rows for ' + esc(d.month) + '.'; loadTargets(); })
      .catch(function (e) { elById('tgtResult').innerHTML = errBox(e); });
  }
  function demoRows() {
    var out = [];
    var branches = ['Kaloleni', 'Sakina', 'Njiro', 'Sokoni', 'Central'];
    var bdos = ['John', 'Mary', 'Peter'];    // spread across BDOs via the file column (no attach needed)
    for (var i = 1; i <= 12; i++) {
      var served = i % 3 !== 0;
      var partner = (i % 4 === 0);           // some agents are partner-served
      out.push({
        'Agent Account': '01527' + (100000 + i),
        'Agent Name': 'Demo Agent ' + i,
        'BDO': bdos[i % bdos.length],
        'Phone': (i === 5 || i === 9) ? '' : ('07' + (10000000 + i * 137)),   // a couple missing phones
        'Branch': (i === 7) ? '' : branches[i % branches.length],             // one unknown branch
        'Unique Serving Status': served ? 'Unique' : 'Repeat',
        'Float Served': served ? (50000 + i * 1000) : 0,
        'Agent Visit': served ? 'YES' : 'NO',
        'APK Update': (i % 2 === 0) ? 'YES' : 'NO',
        'Agent Activeness': served ? 'Active' : 'Dormant',
        'SA Commission': served ? (20000 + i * 500) : 0,
        'Served Status': served ? 'SERVED' : 'NOT_SERVED',
        'Physical Location': partner ? '' : ('Shop ' + i),                    // partner-served -> missing location
        'Partner': partner ? 'YES' : 'NO'
      });
    }
    return out;
  }

  /* ---------------- settings ---------------- */
  function viewSettings(v) {
    ensureBdos(true).then(function () {
      var rows = state.bdos.map(function (b) {
        return '<tr><td>' + esc(b.username) + '</td><td>' + esc(b.name) + '</td><td>' + esc(b.station || '-') + '</td><td>' + (b.active === false ? 'Disabled' : 'Active') + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="note">No BDOs yet.</td></tr>';
      v.innerHTML =
        '<div class="panel"><h2>Add BDO</h2><div class="row">' +
        '<div class="field"><label>Username</label><input id="bUser" placeholder="e.g. amina"></div>' +
        '<div class="field"><label>Full name</label><input id="bName" placeholder="Amina (BDO)"></div>' +
        '<div class="field"><label>Station</label><input id="bStation" placeholder="Arusha"></div>' +
        '<div class="field"><label>Password</label><input id="bPass" placeholder="imani123"></div>' +
        (can('settings', 'edit') ? '<button class="btn" data-action="addBdo">Add BDO</button>' : '<span class="note">View only.</span>') + '</div></div>' +
        '<div class="panel"><h2>BDO Accounts</h2><div class="tablewrap"><table><thead><tr><th>Username</th><th>Name</th><th>Station</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function addBdo() {
    var body = { username: elById('bUser').value.trim(), name: elById('bName').value.trim(), station: elById('bStation').value.trim(), password: elById('bPass').value.trim() };
    if (!body.username || !body.name) { toast('Username and name are required', 'warn'); return; }
    api('/users/bdos', { method: 'POST', body: body }).then(function () {
      toast('BDO added', 'ok'); state.bdos = []; renderTab();
    }).catch(function (e) { toast(e.message, 'err'); });
  }

  /* ---------------- verification ---------------- */
  function viewVerification(v) {
    v.innerHTML =
      '<div class="panel"><h2>Bank Upload (verification source)</h2>' +
      '<p class="note">The official monthly bank file. Columns: Agent Account, Agent Visit (YES/NO), APK Update (YES/NO), Served Status. BDO claims are checked against this.</p>' +
      '<div class="row" style="margin-top:8px">' +
      '<div class="field"><label>Month</label><input id="verMonth" type="month" value="' + esc(state.month) + '"></div>' +
      '<div class="field"><label>Bank file (.xlsx)</label><input id="bankFile" type="file" accept=".xlsx,.xls"></div>' +
      (can('verification', 'edit') ? '<button class="btn" data-action="uploadBank">Upload bank file</button><button class="ghost btn" data-action="loadDemoBank">Load demo bank</button><div class="spacer"></div><button class="btn" data-action="runVerify">Run verification</button>' : '<span class="note">View only - you cannot upload or run verification.</span>') +
      '</div><div id="verResult" class="note" style="margin-top:10px"></div></div>' +
      '<div id="verBody"></div>';
    loadVerification();
  }
  function loadVerification() {
    var body = elById('verBody'); if (!body) return;
    body.innerHTML = '<div class="note">Loading...</div>';
    var month = (elById('verMonth') && elById('verMonth').value) || state.month;
    api('/verification/' + month).then(function (d) {
      if (!d.hasBank) { body.innerHTML = '<div class="panel"><div class="note">No bank file uploaded for ' + esc(month) + ' yet. Upload one (or Load demo bank) then Run verification.</div></div>'; return; }
      var rows = d.byBdo.map(function (b) {
        return '<tr><td>' + esc(b.name) + '</td><td>' + b.uniqueFalse + '</td><td>' + b.apkFalse + '</td><td>' + b.visitFalse + '</td>' +
          '<td>' + b.total + '</td><td>' + b.verified + '</td>' +
          '<td style="min-width:130px"><div class="bar"><i style="width:' + b.integrity + '%;background:' + integrityColor(b.integrity) + '"></i></div></td>' +
          '<td><b>' + b.integrity + '%</b></td></tr>';
      }).join('') || '<tr><td colspan="8" class="note">No claims to verify for this month.</td></tr>';
      var falseList = (d.falseRows || []).slice(0, 60).map(function (r) {
        return '<tr><td>' + esc(r.bdo) + '</td><td>' + esc(r.acc) + '</td><td>' + esc(r.field) + '</td><td><span class="pill no">Claimed ' + esc(r.claim) + '</span></td><td>Bank: ' + esc(r.bank) + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="note">No false claims. Clean month.</td></tr>';
      body.innerHTML =
        '<div class="panel"><h2>Integrity by BDO (' + esc(month) + ')</h2>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Unique False</th><th>APK False</th><th>Visit False</th><th>Total Claims</th><th>Verified</th><th>Integrity</th><th>%</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
        '<div class="panel"><h2>False Claims (' + d.falseCount + ')</h2><div class="tablewrap"><table><thead><tr><th>BDO</th><th>Account</th><th>Field</th><th>Claim</th><th>Bank</th></tr></thead><tbody>' + falseList + '</tbody></table></div></div>';
    }).catch(function (e) { body.innerHTML = errBox(e); });
  }
  function integrityColor(p) { return p >= 90 ? 'var(--green)' : (p >= 70 ? 'var(--amber)' : 'var(--red)'); }
  function uploadBank() {
    var month = elById('verMonth').value;
    var fileInput = elById('bankFile');
    if (!fileInput.files || !fileInput.files[0]) { toast('Choose a bank Excel file first', 'warn'); return; }
    var fd = new FormData();
    fd.append('file', fileInput.files[0]); fd.append('month', month);
    elById('verResult').textContent = 'Uploading bank file...';
    apiUpload('/uploads/bank', fd).then(function (d) {
      elById('verResult').innerHTML = 'Bank file loaded: ' + fmt(d.rows) + ' rows for ' + esc(d.month) + '. Now click Run verification.';
      toast('Bank file loaded', 'ok');
    }).catch(function (e) { elById('verResult').innerHTML = errBox(e); });
  }
  function loadDemoBank() {
    var month = elById('verMonth').value || state.month;
    api('/uploads/bank', { method: 'POST', body: { month: month, rows: demoBankRows() } })
      .then(function (d) { toast('Demo bank loaded', 'ok'); elById('verResult').innerHTML = 'Demo bank loaded (' + fmt(d.rows) + ' rows). Click Run verification.'; })
      .catch(function (e) { elById('verResult').innerHTML = errBox(e); });
  }
  function runVerify() {
    var month = elById('verMonth').value || state.month;
    elById('verResult').textContent = 'Verifying...';
    api('/verification/run', { method: 'POST', body: { month: month } }).then(function (d) {
      elById('verResult').innerHTML = 'Verified ' + fmt(d.updated) + ' service records for ' + esc(month) + '.';
      toast('Verification complete', 'ok');
      loadVerification();
    }).catch(function (e) { elById('verResult').innerHTML = errBox(e); });
  }
  function demoBankRows() {
    var out = [];
    for (var i = 1; i <= 12; i++) {
      var served = i % 3 !== 0;
      out.push({
        'Agent Account': '01527' + (100000 + i),
        'Agent Visit': (served && i !== 2 && i !== 8) ? 'YES' : 'NO',
        'APK Update': (i % 2 === 0 && i !== 4) ? 'YES' : 'NO',
        'Served Status': (served && i !== 10) ? 'SERVED' : 'NOT_SERVED'
      });
    }
    return out;
  }

  /* ---------------- data quality ---------------- */
  function viewQuality(v) {
    api('/quality').then(function (d) {
      var c = d.counts;
      var cards =
        '<div class="grid cards" style="margin-bottom:16px">' +
        card('Missing GPS', fmt(c.missingGps)) +
        card('Missing Location', fmt(c.missingLocation)) +
        card('Missing Phone', fmt(c.missingPhone)) +
        card('Unknown Branch', fmt(c.unknownBranch)) +
        card('Duplicate Agents', fmt(c.duplicates)) +
        card('Unknown Locations', fmt(c.unknownLocations), 'partner-served') +
        '</div>';
      var unk = (d.unknownLocations || []).map(function (a) {
        return '<tr><td>' + esc(a.name) + '</td><td>Yes</td><td><span class="pill no">Missing</span></td><td>' + esc(a.acc) + '</td><td>' + esc(a.branch || '-') + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="note">None. Every partner-served agent has a location.</td></tr>';
      var issues = buildIssues(d);
      v.innerHTML = cards +
        '<div class="panel"><h2>Unknown Physical Locations (partner-served)</h2>' +
        '<p class="note">Partner serves the agent but the shop location is unknown. Download and assign a BDO to capture it next visit.</p>' +
        (d.unknownLocations && d.unknownLocations.length ? '<button class="ghost btn" data-action="dqDownloadUnknown" style="margin-bottom:10px">Download list (Excel)</button>' : '') +
        '<div class="tablewrap"><table><thead><tr><th>Agent</th><th>Partner</th><th>Physical Location</th><th>Account</th><th>Branch</th></tr></thead><tbody>' + unk + '</tbody></table></div></div>' +
        '<div class="panel"><h2>Data Issues</h2><div class="tablewrap"><table><thead><tr><th>Account</th><th>Name</th><th>Missing / Issue</th></tr></thead><tbody>' + issues + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function buildIssues(d) {
    var map = {};
    function tag(list, label) {
      (list || []).forEach(function (a) {
        if (!map[a.id]) map[a.id] = { acc: a.acc, name: a.name, tags: [] };
        map[a.id].tags.push(label);
      });
    }
    tag(d.missingPhone, 'Phone');
    tag(d.missingLocation, 'Location');
    tag(d.unknownBranch, 'Branch');
    tag(d.duplicates, 'Duplicate');
    var keys = Object.keys(map);
    if (!keys.length) return '<tr><td colspan="3" class="note">No data issues found.</td></tr>';
    return keys.slice(0, 100).map(function (k) {
      var x = map[k];
      return '<tr><td>' + esc(x.acc) + '</td><td>' + esc(x.name) + '</td><td>' + x.tags.map(function (t) { return '<span class="pill no">' + esc(t) + '</span>'; }).join(' ') + '</td></tr>';
    }).join('');
  }
  function dqDownloadUnknown() {
    fetch('/api/quality/unknown-locations.xlsx', { headers: apiHeaders(false) }).then(function (r) {
      if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || 'Download failed'); });
      return r.blob();
    }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'unknown_locations.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
    }).catch(function (e) { toast(e.message, 'err'); });
  }

  /* ---------------- commission (spec section 11) ---------------- */
  function money(n) { return fmt(Math.round(Number(n) || 0)); }
  function viewCommission(v) {
    v.innerHTML =
      '<div class="panel"><div class="row"><div class="field"><label>Month</label><input id="commMonth" type="month" value="' + esc(state.month) + '"></div>' +
      '<button class="btn" data-action="commLoad">Load</button></div></div>' +
      '<div class="panel"><h2>Final Monthly Performance</h2>' +
      '<p class="note">Upload Month_Final.xlsx (SA Commission, Served Status, Float, Unique). If not uploaded, the calculator uses the weekly performance data already in the system.</p>' +
      '<div class="row"><div class="field"><label>Final file (.xlsx)</label><input id="commFile" type="file" accept=".xlsx,.xls"></div>' +
      (can('commission', 'edit') ? '<button class="btn" data-action="uploadFinal">Upload final</button><button class="ghost btn" data-action="loadDemoFinal">Load demo final</button>' : '') +
      '<div class="spacer"></div>' +
      '<div class="field"><label>Office Achievement %</label><input id="commAch" type="number" min="0" max="200" style="min-width:90px"' + (can('commission', 'edit') ? '' : ' disabled') + '></div>' +
      (can('commission', 'edit') ? '<button class="btn" data-action="calcCommission">Calculate &amp; Save</button>' : '<span class="note">View only.</span>') +
      '</div><div id="commStatus" class="note" style="margin-top:10px"></div></div>' +
      '<div id="commBody"></div>';
    loadCommission();
  }
  function loadCommission() {
    var body = elById('commBody'); if (!body) return;
    body.innerHTML = '<div class="note">Loading...</div>';
    api('/commission/' + state.month).then(function (d) {
      var achInput = elById('commAch');
      var achVal = d.saved ? d.saved.achievement : (d.suggestion != null ? d.suggestion : '');
      if (achInput && achInput.value === '') achInput.value = achVal;
      var statusEl = elById('commStatus');
      if (statusEl) statusEl.innerHTML = 'Source: <b>' + (d.hasFinal ? 'Final file (' + d.finalRows + ' rows)' : 'Weekly data') + '</b>' +
        (d.suggestion != null ? ' &nbsp; Suggested achievement from targets: <b>' + d.suggestion + '%</b>' : ' &nbsp; (no targets set - enter achievement manually)');
      var c = d.saved || d.preview;
      var savedNote = d.saved ? 'Saved calculation' : 'Live preview (not yet saved)';
      body.innerHTML =
        '<div class="grid cards" style="margin-bottom:16px">' +
        card('SA Commission (SERVED)', money(c.total), c.servedCount + ' served rows') +
        card('Fixed Pool (30%)', money(c.fixedPool)) +
        card('Variable Pool (70%)', money(c.variablePool)) +
        card('Achievement', (c.achievement || 0) + '%', 'release ' + Math.round((c.releasePct || 0) * 100) + '%') +
        card('Variable Paid', money(c.variablePaid)) +
        card('Final Commission', money(c.final), savedNote) +
        '</div>' +
        '<div class="panel"><h2>Variable Release Table</h2><div class="tablewrap"><table><thead><tr><th>Achievement</th><th>Variable Released</th></tr></thead><tbody>' +
        releaseTableRows(c.achievement) + '</tbody></table></div></div>';
    }).catch(function (e) { body.innerHTML = errBox(e); });
  }
  function releaseTableRows(ach) {
    var tiers = [[0, '&lt; 50%', 0], [50, '50-59%', 20], [60, '60-69%', 40], [70, '70-79%', 60], [80, '80-89%', 80], [90, '&ge; 90%', 100]];
    var active = 0;
    tiers.forEach(function (t) { if ((Number(ach) || 0) >= t[0]) active = t[0]; });
    return tiers.map(function (t) {
      var on = t[0] === active;
      return '<tr' + (on ? ' style="background:rgba(18,184,134,.15)"' : '') + '><td>' + t[1] + '</td><td>' + t[2] + '%' + (on ? ' &larr; current' : '') + '</td></tr>';
    }).join('');
  }
  function uploadFinal() {
    var fileInput = elById('commFile');
    if (!fileInput.files || !fileInput.files[0]) { toast('Choose the final Excel file first', 'warn'); return; }
    var fd = new FormData(); fd.append('file', fileInput.files[0]); fd.append('month', state.month);
    elById('commStatus').textContent = 'Uploading final file...';
    apiUpload('/commission/final', fd).then(function (d) { toast('Final file loaded', 'ok'); loadCommission(); })
      .catch(function (e) { elById('commStatus').innerHTML = errBox(e); });
  }
  function loadDemoFinal() {
    var rows = [];
    for (var i = 1; i <= 10; i++) rows.push({ 'SA Commission': 12500000, 'Served Status': (i <= 8 ? 'SERVED' : 'NOT_SERVED'), 'Float': 1000000, 'Unique': 'Unique' });
    api('/commission/final', { method: 'POST', body: { month: state.month, rows: rows } })
      .then(function () { toast('Demo final loaded (8 served x 12.5M = 100M)', 'ok'); loadCommission(); })
      .catch(function (e) { elById('commStatus').innerHTML = errBox(e); });
  }
  function calcCommission() {
    var ach = elById('commAch').value;
    api('/commission/calc', { method: 'POST', body: { month: state.month, achievement: ach } }).then(function (d) {
      toast('Commission calculated & saved', 'ok'); loadCommission();
    }).catch(function (e) { elById('commStatus').innerHTML = errBox(e); });
  }

  /* ---------------- clawback (spec section 12) ---------------- */
  function viewClawback(v) {
    api('/clawback/' + state.month).then(function (d) {
      var s = d.saved;
      var reasons = s ? s.reasons : [];
      function amt(label) { var r = (reasons || []).filter(function (x) { return x.label === label; })[0]; return r ? r.amount : ''; }
      v.innerHTML =
        '<div class="panel"><div class="row"><div class="field"><label>Month</label><input id="clawMonth" type="month" value="' + esc(state.month) + '"></div>' +
        '<button class="btn" data-action="clawLoad">Load</button></div></div>' +
        '<div class="panel"><h2>Clawback Inputs</h2>' +
        '<p class="note">Hints from data: Dormant/Inactive agents <b>' + d.hints.dormantAgents + '</b>, Not-served agents <b>' + d.hints.notServedAgents + '</b>, Served-but-APK-missing <b>' + d.hints.apkMissing + '</b>.</p>' +
        '<div class="row">' +
        '<div class="field"><label>Commission Earned</label><input id="clawEarned" type="number" value="' + (s ? s.earned : d.earnedDefault) + '"></div>' +
        '<div class="field"><label>Dormant Agents</label><input id="clawDormant" type="number" value="' + amt('Dormant Agents') + '"></div>' +
        '<div class="field"><label>APK Missing</label><input id="clawApk" type="number" value="' + amt('APK Missing') + '"></div>' +
        '<div class="field"><label>Inactive Agents</label><input id="clawInactive" type="number" value="' + amt('Inactive Agents') + '"></div>' +
        '<div class="field"><label>Float Reduction</label><input id="clawFloat" type="number" value="' + amt('Float Reduction') + '"></div>' +
        '<div class="field"><label>Recovered</label><input id="clawRecovered" type="number" value="' + (s ? s.recovered : '') + '"></div>' +
        (can('clawback', 'edit') ? '<button class="btn" data-action="saveClawback">Calculate &amp; Save</button>' : '<span class="note">View only.</span>') +
        '</div></div>' +
        '<div id="clawBody">' + clawbackCards(s) + '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function clawbackCards(s) {
    if (!s) return '<div class="panel"><div class="note">Enter clawback reasons above and Calculate.</div></div>';
    var reasons = (s.reasons || []).map(function (r) { return '<tr><td>' + esc(r.label) + '</td><td>' + money(r.amount) + '</td></tr>'; }).join('') || '<tr><td colspan="2" class="note">No reasons.</td></tr>';
    return '<div class="grid cards" style="margin-bottom:16px">' +
      card('Commission Earned', money(s.earned)) +
      card('Potential Clawback', money(s.potential)) +
      card('Recovered', money(s.recovered)) +
      card('Net Commission', money(s.net)) +
      '</div><div class="panel"><h2>Clawback Reasons</h2><div class="tablewrap"><table><thead><tr><th>Reason</th><th>Amount</th></tr></thead><tbody>' + reasons + '</tbody></table></div></div>';
  }
  function saveClawback() {
    var body = {
      earned: elById('clawEarned').value,
      recovered: elById('clawRecovered').value,
      reasons: [
        { label: 'Dormant Agents', amount: Number(elById('clawDormant').value) || 0 },
        { label: 'APK Missing', amount: Number(elById('clawApk').value) || 0 },
        { label: 'Inactive Agents', amount: Number(elById('clawInactive').value) || 0 },
        { label: 'Float Reduction', amount: Number(elById('clawFloat').value) || 0 }
      ]
    };
    api('/clawback/' + state.month, { method: 'POST', body: body }).then(function (d) {
      toast('Clawback saved', 'ok');
      elById('clawBody').innerHTML = clawbackCards(d.clawback);
    }).catch(function (e) { toast(e.message, 'err'); });
  }

  /* ---------------- analytics (spec section 13) ---------------- */
  function viewAnalytics(v) {
    api('/commission/history').then(function (list) {
      if (!list.length) { v.innerHTML = '<div class="panel"><div class="note">No saved commission calculations yet. Calculate a month under Commission first.</div></div>'; return; }
      var rows = list.map(function (m) {
        return '<tr><td>' + esc(m.month) + '</td><td>' + money(m.total) + '</td><td>' + money(m.fixed) + '</td><td>' + money(m.variable) + '</td><td>' + money(m.clawback) + '</td><td>' + money(m.net) + '</td></tr>';
      }).join('');
      v.innerHTML =
        '<div class="panel"><h2>Commission Trend</h2><div style="position:relative;height:340px"><canvas id="analyticsChart"></canvas></div></div>' +
        '<div class="panel"><h2>By Month</h2><div class="tablewrap"><table><thead><tr><th>Month</th><th>Total</th><th>Fixed</th><th>Variable</th><th>Clawback</th><th>Net</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
      drawAnalyticsChart(list);
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function drawAnalyticsChart(list) {
    if (!window.Chart) return;
    var cvs = elById('analyticsChart'); if (!cvs) return;
    if (state._chart) { try { state._chart.destroy(); } catch (e) { } }
    var labels = list.map(function (m) { return m.month; });
    state._chart = new window.Chart(cvs.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Fixed', data: list.map(function (m) { return Math.round(m.fixed); }), backgroundColor: '#4dabf7', stack: 'c' },
          { label: 'Variable', data: list.map(function (m) { return Math.round(m.variable); }), backgroundColor: '#12b886', stack: 'c' },
          { label: 'Clawback', data: list.map(function (m) { return -Math.round(m.clawback); }), backgroundColor: '#ff6b6b', stack: 'c' },
          { type: 'line', label: 'Net', data: list.map(function (m) { return Math.round(m.net); }), borderColor: '#ffd43b', backgroundColor: '#ffd43b', tension: .3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e8eef5' } } },
        scales: { x: { stacked: true, ticks: { color: '#93a1b2' } }, y: { stacked: true, ticks: { color: '#93a1b2' } } } }
    });
  }

  /* ---------------- executive (spec section 14) ---------------- */
  function viewExecutive(v) {
    api('/executive/' + state.month).then(function (d) {
      v.innerHTML =
        '<div class="panel"><div class="row"><div class="field"><label>Month</label><input id="execMonth" type="month" value="' + esc(state.month) + '"></div>' +
        '<button class="btn" data-action="execLoad">Load</button><div class="spacer"></div><div class="note">' + esc(d.month) + ' &middot; ' + fmt(d.served) + ' / ' + fmt(d.totalAgents) + ' agents served</div></div></div>' +
        '<div class="grid cards">' +
        card('Office Performance', d.officePerformance + '%') +
        card('Today\'s Achievement', d.todaysAchievement + '%') +
        card('Projected Month-End', d.projectedMonthEnd + '%') +
        card('Commission', money(d.commission), d.hasCommission ? 'final' : 'not calculated') +
        card('Potential Clawback', money(d.potentialClawback), d.hasClawback ? '' : 'not entered') +
        card('Net', money(d.net)) +
        '</div>' +
        (!d.hasCommission ? '<div class="panel"><div class="note">Tip: calculate this month under Commission (and Clawback) to populate the money figures.</div></div>' : '');
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }

  /* ---------------- BDO: my agent base + serve (spec sections 2,4,5,7) ---------------- */
  function viewMyBase(v) {
    v.innerHTML =
      '<div class="panel"><div class="row"><div class="field"><label>Month</label><input id="myMonth" type="month" value="' + esc(state.month) + '"></div>' +
      '<button class="btn" data-action="myLoad">Load</button></div></div><div id="myBaseBody"><div class="note">Loading...</div></div>';
    loadMyBase();
  }
  function loadMyBase() {
    var body = elById('myBaseBody'); if (!body) return;
    api('/base/' + encodeURIComponent(state.user.username) + '/' + state.month).then(function (d) {
      var c = d.counts;
      var counts = '<div class="grid cards" style="margin-bottom:16px">' +
        card('Priority Agents', fmt(c.priority), 'served last month') +
        card('New Uploaded', fmt(c.newAgents)) +
        card('Total Base', fmt(c.total)) +
        card('Served This Month', fmt(d.served || 0)) + '</div>';
      var rows = d.agents.map(function (a) {
        var action = a.servedThisMonth
          ? '<span class="pill yes">Served</span>'
          : (can('mybase', 'edit') ? '<button class="btn serve-btn" data-action="serveAgent" data-id="' + a.id + '" data-name="' + esc(a.name) + '">Serve</button>' : '<span class="note">-</span>');
        return '<tr><td><span class="dot ' + a.level + '"></span><span class="pill ' + a.level + '">' + levelLabel(a.level) + '</span></td>' +
          '<td>' + esc(a.name) + '</td><td>' + esc(a.acc) + '</td><td>' + esc(a.branch || '-') + '</td><td>' + action + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="note">No agents in your base yet.</td></tr>';
      body.innerHTML = counts +
        '<div class="panel"><h2>My Agents</h2>' +
        '<div class="note" style="margin-bottom:10px"><span class="pill priority">Priority</span> served last month &nbsp; <span class="pill new">New</span> &nbsp; <span class="pill never">Never</span></div>' +
        '<div class="tablewrap"><table><thead><tr><th>Level</th><th>Name</th><th>Account</th><th>Branch</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).catch(function (e) { body.innerHTML = errBox(e); });
  }
  function serveAgentPrompt(id, name) {
    closeModal();
    var box = document.createElement('div');
    box.className = 'modalback'; box.id = 'modalback';
    box.innerHTML = '<div class="modalbox" role="dialog" aria-modal="true" aria-label="Serve agent"><h2>Serve ' + esc(name) + '</h2>' +
      '<div class="field"><label>Agent Visit (ODK)</label><select id="svOdk"><option value="YES">YES</option><option value="NO">NO</option></select></div>' +
      '<div class="field"><label>APK Update</label><select id="svApk"><option value="YES">YES</option><option value="NO">NO</option></select></div>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:10px 0"><input type="checkbox" id="svGps"> Capture GPS location (optional)</label>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost btn" data-action="closeModal">Cancel</button>' +
      '<button class="btn" data-action="confirmServe" data-id="' + id + '">Confirm served</button></div></div>';
    box.addEventListener('click', function (e) { if (e.target === box) closeModal(); });
    document.body.appendChild(box);
    var first = elById('svOdk'); if (first) first.focus();
  }
  function closeModal() { var m = elById('modalback'); if (m) m.remove(); }
  function showModal(html, label) {
    closeModal();
    var box = document.createElement('div');
    box.className = 'modalback'; box.id = 'modalback';
    box.innerHTML = '<div class="modalbox" role="dialog" aria-modal="true" aria-label="' + esc(label || 'Dialog') + '">' + html + '</div>';
    box.addEventListener('click', function (e) { if (e.target === box) closeModal(); });
    document.body.appendChild(box);
    return box;
  }

  /* ---------------- account & security (per-user MFA + password) ---------------- */
  function openAccount() {
    api('/auth/mfa/status').then(function (s) {
      var mfaBlock = s.enabled
        ? '<p class="note">Two-factor authentication is <b style="color:var(--green)">ON</b>. Enter a current code to turn it off.</p>' +
          '<div class="field"><label>Authentication code</label><input id="mfaCode" inputmode="numeric" placeholder="123456"></div>' +
          '<button class="danger btn" data-action="mfaDisable">Disable 2FA</button>'
        : '<p class="note">Add an authenticator app (Google Authenticator, Authy, Microsoft Authenticator) for stronger sign-in security.</p>' +
          '<button class="btn" data-action="mfaSetup">Enable 2FA</button>';
      var html = '<h2>Account &amp; Security</h2>' +
        '<h3 style="margin:16px 0 6px;font-size:14px">Two-factor authentication</h3>' + mfaBlock +
        '<div id="mfaSetupArea"></div>' +
        '<h3 style="margin:20px 0 6px;font-size:14px">Change password</h3>' +
        '<div class="field"><label>Current password</label><input id="acCur" type="password" autocomplete="current-password"></div>' +
        '<div class="field"><label>New password (min 8)</label><input id="acNew" type="password" autocomplete="new-password"></div>' +
        '<button class="btn" data-action="acChangePw">Update password</button>' +
        '<div class="row" style="justify-content:flex-end;margin-top:16px"><button class="ghost btn" data-action="closeModal">Close</button></div>';
      showModal(html, 'Account and security');
    }).catch(function (e) { toast(e.message, 'err'); });
  }
  function mfaSetup() {
    api('/auth/mfa/setup', { method: 'POST' }).then(function (d) {
      var area = elById('mfaSetupArea'); if (!area) return;
      area.innerHTML = '<div class="panel" style="margin-top:12px">' +
        '<p class="note">1. Scan this QR with your authenticator app.</p>' +
        '<div style="background:#fff;padding:10px;border-radius:12px;width:200px;margin:6px 0">' + d.qrSvg + '</div>' +
        '<p class="note">Or enter this key manually: <b class="mono">' + esc(d.secret) + '</b></p>' +
        '<div class="field"><label>2. Enter the 6-digit code</label><input id="mfaConfirmCode" inputmode="numeric" placeholder="123456"></div>' +
        '<button class="btn" data-action="mfaConfirm">Confirm &amp; enable</button></div>';
    }).catch(function (e) { toast(e.message, 'err'); });
  }
  function mfaConfirm() {
    api('/auth/mfa/confirm', { method: 'POST', body: { code: elById('mfaConfirmCode').value.trim() } })
      .then(function () { toast('Two-factor enabled', 'ok'); if (state.user) state.user.mfaEnabled = true; openAccount(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function mfaDisable() {
    api('/auth/mfa/disable', { method: 'POST', body: { code: elById('mfaCode').value.trim() } })
      .then(function () { toast('Two-factor disabled', 'warn'); if (state.user) state.user.mfaEnabled = false; openAccount(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function acChangePw() {
    var nw = elById('acNew').value;
    if (nw.length < 8) { toast('New password must be at least 8 characters', 'warn'); return; }
    api('/auth/change-password', { method: 'POST', body: { currentPassword: elById('acCur').value, newPassword: nw } })
      .then(function () { toast('Password updated', 'ok'); closeModal(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function confirmServe(id) {
    var odk = elById('svOdk').value, apk = elById('svApk').value, wantGps = elById('svGps').checked;
    function post(gps) {
      api('/serve', { method: 'POST', body: { agentId: Number(id), month: state.month, odk: odk, apk: apk, gps: gps } })
        .then(function () { closeModal(); toast('Agent served', 'ok'); loadMyBase(); })
        .catch(function (e) { toast(e.message, 'err'); });
    }
    if (wantGps && navigator.geolocation) {
      toast('Getting GPS...', 'warn');
      navigator.geolocation.getCurrentPosition(
        function (p) { post({ lat: p.coords.latitude, lng: p.coords.longitude }); },
        function () { toast('GPS unavailable, saving without it', 'warn'); post(null); },
        { timeout: 8000 });
    } else { post(null); }
  }

  /* ---------------- AI Insights (spec section 16, local) ---------------- */
  function viewInsights(v) {
    api('/insights/questions').then(function (list) {
      var btns = list.map(function (q) {
        return '<button class="ghost btn" style="text-align:left;margin:4px 0;display:block;width:100%" data-action="askPreset" data-q="' + esc(q.id) + '">' + esc(q.label) + '</button>';
      }).join('');
      v.innerHTML =
        '<div class="panel"><h2>AI Insights</h2>' +
        '<p class="note">Ask about performance, verification, agents and commission for <b>' + esc(state.month) + '</b>. Answered instantly from your own data (no external service).</p>' +
        '<div class="row"><input id="aiQ" class="aiq" placeholder="Type a question..." style="flex:1;min-width:240px"><button class="btn" data-action="askFree">Ask</button></div>' +
        '<div style="margin-top:14px">' + btns + '</div></div>' +
        '<div id="aiAnswer"></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function askInsight(q) {
    var ans = elById('aiAnswer'); if (ans) ans.innerHTML = '<div class="panel"><div class="note">Thinking...</div></div>';
    api('/insights/ask', { method: 'POST', body: { q: q, month: state.month } }).then(function (d) {
      var extra = '';
      if (d.suggestions) extra = '<ul>' + d.suggestions.map(function (s) { return '<li>' + esc(s.label) + '</li>'; }).join('') + '</ul>';
      else if (d.rows && d.rows.length) {
        var cols = Object.keys(d.rows[0]);
        extra = '<div class="tablewrap" style="margin-top:10px"><table><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          d.rows.map(function (r) { return '<tr>' + cols.map(function (c) { return '<td>' + esc(r[c]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      }
      elById('aiAnswer').innerHTML = '<div class="panel"><div style="font-size:16px">' + esc(d.answer) + '</div>' + extra + '</div>';
    }).catch(function (e) { elById('aiAnswer').innerHTML = errBox(e); });
  }

  /* ---------------- Super Admin panel ---------------- */
  function viewAdmin(v) {
    Promise.all([api('/admin/meta'), api('/admin/permissions'), api('/admin/users'), api('/admin/audit')]).then(function (r) {
      var meta = r[0], matrix = r[1], users = r[2], audit = r[3];
      state._adminRoles = meta.roles; state._adminModules = meta.modules;
      v.innerHTML =
        '<div class="panel"><h2>Access Control &mdash; Permissions</h2>' +
        '<p class="note">Tick what each role can do per module: <b>V</b> view, <b>E</b> edit, <b>D</b> delete. Super Admin always has full access. Changes take effect when members next load the app.</p>' +
        permMatrixHtml(meta, matrix) +
        '<div style="margin-top:12px"><button class="btn" data-action="savePerms">Save permissions</button></div></div>' +
        '<div class="panel"><h2>Members</h2>' +
        '<div class="row" style="margin-bottom:12px">' +
        '<div class="field"><label>Username</label><input id="nuUser" placeholder="e.g. amina"></div>' +
        '<div class="field"><label>Full name</label><input id="nuName" placeholder="Amina Said"></div>' +
        '<div class="field"><label>Role</label><select id="nuRole">' + meta.roles.map(function (r2) { return '<option value="' + esc(r2) + '">' + esc(roleLabel(r2)) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Station</label><input id="nuStation" placeholder="Arusha"></div>' +
        '<div class="field"><label>Password</label><input id="nuPass" placeholder="imani123"></div>' +
        '<button class="btn" data-action="addUser">Add member</button></div>' +
        usersTableHtml(users) + '</div>' +
        '<div class="panel"><h2>Recent Activity (Audit Trail)</h2>' + auditTableHtml(audit) + '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function auditTableHtml(audit) {
    var rows = (audit || []).slice(0, 100).map(function (a) {
      return '<tr><td>' + esc((a.at || '').replace('T', ' ').slice(0, 16)) + '</td><td>' + esc(a.who) + '</td><td>' + esc(a.action) + '</td><td>' + esc(a.detail || '') + '</td></tr>';
    }).join('') || '<tr><td colspan="4" class="note">No activity yet.</td></tr>';
    return '<div class="tablewrap"><table><thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Action</th><th scope="col">Detail</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function permMatrixHtml(meta, matrix) {
    var head1 = '<th>Module</th>' + meta.roles.map(function (r) { return '<th colspan="3" style="text-align:center">' + esc(roleLabel(r)) + '</th>'; }).join('');
    var head2 = '<th></th>' + meta.roles.map(function () { return '<th>V</th><th>E</th><th>D</th>'; }).join('');
    var body = meta.modules.map(function (m) {
      var cells = meta.roles.map(function (r) {
        return ['view', 'edit', 'delete'].map(function (lv) {
          var on = matrix[r] && matrix[r][m.key] && matrix[r][m.key][lv];
          var dis = (r === 'superadmin') ? ' disabled' : '';
          return '<td style="text-align:center"><input type="checkbox" data-role="' + r + '" data-mod="' + m.key + '" data-lv="' + lv + '"' + (on ? ' checked' : '') + dis + '></td>';
        }).join('');
      }).join('');
      return '<tr><td>' + esc(m.label) + '</td>' + cells + '</tr>';
    }).join('');
    return '<div class="tablewrap"><table><thead><tr>' + head1 + '</tr><tr>' + head2 + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function usersTableHtml(users) {
    var rows = users.map(function (u) {
      var roleSel = '<select data-change="userRole" data-id="' + u.id + '"' + (u.role === 'superadmin' ? ' disabled' : '') + '>' +
        (state._adminRoles || []).map(function (r) { return '<option value="' + esc(r) + '"' + (r === u.role ? ' selected' : '') + '>' + esc(roleLabel(r)) + '</option>'; }).join('') + '</select>';
      var actions = (u.role === 'superadmin')
        ? '<span class="note">protected</span>'
        : '<button class="ghost btn serve-btn" data-action="userToggle" data-id="' + u.id + '" data-active="' + (u.active ? '0' : '1') + '">' + (u.active ? 'Disable' : 'Enable') + '</button> ' +
          '<button class="ghost btn serve-btn" data-action="userReset" data-id="' + u.id + '">Reset pwd</button> ' +
          '<button class="danger btn serve-btn" data-action="userDelete" data-id="' + u.id + '" data-name="' + esc(u.username) + '">Delete</button>';
      return '<tr><td>' + esc(u.username) + '</td><td>' + esc(u.name) + '</td><td>' + roleSel + '</td><td>' + esc(u.station || '-') + '</td>' +
        '<td>' + (u.active ? '<span class="pill yes">Active</span>' : '<span class="pill no">Disabled</span>') + '</td><td>' + actions + '</td></tr>';
    }).join('');
    return '<div class="tablewrap"><table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Station</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function savePerms() {
    var matrix = {};
    (state._adminRoles || []).forEach(function (r) { matrix[r] = {}; (state._adminModules || []).forEach(function (m) { matrix[r][m.key] = { view: false, edit: false, delete: false }; }); });
    Array.prototype.forEach.call(document.querySelectorAll('input[type=checkbox][data-role]'), function (cb) {
      var r = cb.getAttribute('data-role'), m = cb.getAttribute('data-mod'), lv = cb.getAttribute('data-lv');
      if (matrix[r] && matrix[r][m]) matrix[r][m][lv] = cb.checked;
    });
    api('/admin/permissions', { method: 'PUT', body: { matrix: matrix } }).then(function () { toast('Permissions saved', 'ok'); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function addUser() {
    var body = { username: elById('nuUser').value.trim(), name: elById('nuName').value.trim(), role: elById('nuRole').value, station: elById('nuStation').value.trim(), password: elById('nuPass').value.trim() };
    if (!body.username || !body.name) { toast('Username and name are required', 'warn'); return; }
    api('/admin/users', { method: 'POST', body: body }).then(function () { toast('Member added', 'ok'); renderTab(); }).catch(function (e) { toast(e.message, 'err'); });
  }
  function patchUser(id, fields) {
    return api('/admin/users/' + id, { method: 'PATCH', body: fields }).then(function () { toast('Member updated', 'ok'); renderTab(); }).catch(function (e) { toast(e.message, 'err'); });
  }
  function userReset(id) {
    var pw = window.prompt('New password for this member:', 'imani123');
    if (pw) patchUser(id, { password: pw });
  }
  function userDelete(id, name) {
    if (window.confirm('Delete member "' + name + '"? This cannot be undone.')) {
      api('/admin/users/' + id, { method: 'DELETE' }).then(function () { toast('Member deleted', 'ok'); renderTab(); }).catch(function (e) { toast(e.message, 'err'); });
    }
  }

  /* ---------------- shared ---------------- */
  function ensureBdos(force) {
    if (state.bdos.length && !force) return Promise.resolve();
    return api('/users/bdos').then(function (list) { state.bdos = list; });
  }
  function errBox(e) { return '<div class="panel"><div class="err">' + esc(e.message || String(e)) + '</div></div>'; }

  function downloadServed() {
    var url = '/api/agents/served.xlsx?bdo=' + encodeURIComponent(state.baseBdo) + '&month=' + state.month;
    fetch(url, { headers: apiHeaders(false) }).then(function (r) {
      if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || 'Download failed'); });
      return r.blob();
    }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'served_' + state.baseBdo + '_' + state.month + '.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
    }).catch(function (e) { toast(e.message, 'err'); });
  }
  function runRollover() {
    if (!confirm('Carry each BDO\'s served agents from ' + state.month + ' into next month as Priority?')) return;
    api('/base/rollover', { method: 'POST', body: { fromMonth: state.month } }).then(function (d) {
      var n = d.summary.reduce(function (s, x) { return s + x.priority; }, 0);
      toast('Carried ' + n + ' priority agents into ' + d.toMonth, 'ok');
    }).catch(function (e) { toast(e.message, 'err'); });
  }

  /* ---------------- events ---------------- */
  function onClick(e) {
    var node = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!node) return;
    var action = node.getAttribute('data-action');
    if (action === 'logout') { doLogout(); return; }
    if (action === 'tab') { state.tab = node.getAttribute('data-tab'); renderShell(); return; }
    if (action === 'setMonth') { state.month = elById('monthInput').value || state.month; renderTab(); return; }
    if (action === 'agentSearch') { state._agentSearch = elById('agentSearch').value.trim(); state.agentPage = 1; renderTab(); return; }
    if (action === 'agentClear') { state._agentSearch = ''; state.agentPage = 1; renderTab(); return; }
    if (action === 'loadBase') { state.baseBdo = elById('baseBdo').value; state.month = elById('baseMonth').value || state.month; loadBaseInto(); return; }
    if (action === 'downloadServed') { state.baseBdo = elById('baseBdo').value; downloadServed(); return; }
    if (action === 'rollover') { runRollover(); return; }
    if (action === 'doUpload') { doUpload(); return; }
    if (action === 'loadDemo') { loadDemo(); return; }
    if (action === 'doTargets') { doTargets(); return; }
    if (action === 'loadDemoTargets') { loadDemoTargets(); return; }
    if (action === 'addBdo') { addBdo(); return; }
    if (action === 'uploadBank') { uploadBank(); return; }
    if (action === 'loadDemoBank') { loadDemoBank(); return; }
    if (action === 'runVerify') { runVerify(); return; }
    if (action === 'dqDownloadUnknown') { dqDownloadUnknown(); return; }
    if (action === 'commLoad') { state.month = elById('commMonth').value || state.month; renderTab(); return; }
    if (action === 'uploadFinal') { uploadFinal(); return; }
    if (action === 'loadDemoFinal') { loadDemoFinal(); return; }
    if (action === 'calcCommission') { calcCommission(); return; }
    if (action === 'clawLoad') { state.month = elById('clawMonth').value || state.month; renderTab(); return; }
    if (action === 'saveClawback') { saveClawback(); return; }
    if (action === 'execLoad') { state.month = elById('execMonth').value || state.month; renderTab(); return; }
    if (action === 'myLoad') { state.month = elById('myMonth').value || state.month; renderTab(); return; }
    if (action === 'serveAgent') { serveAgentPrompt(node.getAttribute('data-id'), node.getAttribute('data-name')); return; }
    if (action === 'confirmServe') { confirmServe(node.getAttribute('data-id')); return; }
    if (action === 'closeModal') { closeModal(); return; }
    if (action === 'askPreset') { askInsight(node.getAttribute('data-q')); return; }
    if (action === 'askFree') { askInsight(elById('aiQ').value); return; }
    if (action === 'toggleTheme') { toggleTheme(); return; }
    if (action === 'account') { openAccount(); return; }
    if (action === 'mfaSetup') { mfaSetup(); return; }
    if (action === 'mfaConfirm') { mfaConfirm(); return; }
    if (action === 'mfaDisable') { mfaDisable(); return; }
    if (action === 'acChangePw') { acChangePw(); return; }
    if (action === 'prevPage') { state.agentPage = Math.max(1, (state.agentPage || 1) - 1); renderTab(); return; }
    if (action === 'nextPage') { state.agentPage = (state.agentPage || 1) + 1; renderTab(); return; }
    if (action === 'savePerms') { savePerms(); return; }
    if (action === 'addUser') { addUser(); return; }
    if (action === 'userToggle') { patchUser(node.getAttribute('data-id'), { active: node.getAttribute('data-active') === '1' }); return; }
    if (action === 'userReset') { userReset(node.getAttribute('data-id')); return; }
    if (action === 'userDelete') { userDelete(node.getAttribute('data-id'), node.getAttribute('data-name')); return; }
  }
  function onChange(e) {
    var n = e.target;
    if (n && n.getAttribute && n.getAttribute('data-change') === 'userRole') { patchUser(n.getAttribute('data-id'), { role: n.value }); }
  }
  function onSubmit(e) {
    if (e.target && e.target.id === 'loginForm') { e.preventDefault(); doLogin(); }
    if (e.target && e.target.id === 'mfaForm') { e.preventDefault(); doLoginMfa(); }
    if (e.target && e.target.id === 'cpForm') { e.preventDefault(); doChangePassword(); }
  }
  function onKeydown(e) {
    if (e.key === 'Escape' && elById('modalback')) closeModal();
  }

  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', onKeydown);
  boot();
})();
