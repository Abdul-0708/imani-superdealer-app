/* IMANI SUPERDEALER - front-end SPA (PHP backend, session auth). */
(function () {
  'use strict';

  var state = { user: null, perms: {}, tab: 'dashboard', month: null, months: [], openMonth: null, agentPage: 1, _roles: [], _permMatrix: {}, _permRole: 'om' };

  /* ---------------- helpers ---------------- */
  function elById(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(n) { n = Math.round(Number(n) || 0); return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    elById('toasts').appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 400); }, 3400);
  }
  function api(action, opts) {
    opts = opts || {};
    var url = 'api.php?action=' + action + (opts.qs || '');
    var init = { method: opts.body ? 'POST' : 'GET', credentials: 'same-origin', headers: {} };
    if (opts.body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch(url, init).then(function (r) {
      return r.json().catch(function () { return { error: 'Bad server response' }; }).then(function (d) {
        if (r.status === 401) { state.user = null; render(); throw new Error(d.error || 'Please sign in'); }
        if (!r.ok) throw new Error(d.error || ('Error ' + r.status));
        return d;
      });
    });
  }
  function can(mod, lvl) {
    if (state.user && state.user.role === 'superadmin') return true;
    var p = state.perms[mod]; return !!(p && p[lvl]);
  }
  function initials(n) { var w = ('' + n).match(/[A-Za-z]+/g) || []; return ((w[0] ? w[0][0] : '') + (w[1] ? w[1][0] : '')).toUpperCase() || 'U'; }
  function curMonth() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

  /* ---------------- icons (inline SVG, stroke) ---------------- */
  var ICON = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    upload: '<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M14.5 9.3a2.6 2.6 0 0 0-2.5-1.5c-1.5 0-2.6.8-2.6 2s1.1 1.8 2.6 2 2.5.6 2.5 2-1.1 2-2.5 2a2.6 2.6 0 0 1-2.6-1.5"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    flame: '<path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.5.5-3 1.5-4.5C9 9 10 10 11 10c0-3 1-7 1-7z"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    percent: '<path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    zap: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    check: '<path d="M20 6L9 17l-5-5"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || ICON.grid) + '</svg>';
  }

  var MODULES = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { key: 'mybase', label: 'My Agent Base', icon: 'phone' },
    { key: 'agents', label: 'Agents', icon: 'users' },
    { key: 'upload', label: 'Weekly Upload', icon: 'upload' },
    { key: 'targets', label: 'Monthly Targets', icon: 'target' },
    { key: 'commission', label: 'Commission & Months', icon: 'dollar' },
    { key: 'admin', label: 'Admin', icon: 'lock' }
  ];
  var TARGET_DEFS = [
    { key: 'serving', label: 'Serving', icon: 'users', hint: 'unique agents served' },
    { key: 'float', label: 'Float', icon: 'dollar', hint: 'total float served' },
    { key: 'visits', label: 'Agent Visits', icon: 'target', hint: 'visits (ODK = YES)' },
    { key: 'apk', label: 'Agent APK', icon: 'rotate', hint: 'APK updates (YES)' },
    { key: 'activeness', label: 'Agent Activeness', icon: 'zap', hint: 'active agents' }
  ];

  function skeletonHtml() {
    var c = ''; for (var i = 0; i < 4; i++) c += '<div class="skel skel-card"></div>';
    var l = ''; for (var j = 0; j < 5; j++) l += '<div class="skel skel-line" style="width:' + (92 - j * 10) + '%"></div>';
    return '<div class="grid cards" style="margin-bottom:16px">' + c + '</div><div class="panel">' + l + '</div>';
  }
  function emptyState(icon, title, msg) {
    return '<div class="empty">' + svg(icon) + '<b>' + esc(title) + '</b>' + (msg ? '<div>' + esc(msg) + '</div>' : '') + '</div>';
  }
  function roleLabel(r) {
    return r === 'superadmin' ? 'Super Admin' : r === 'md' ? 'Managing Director' : r === 'om' ? 'Operational Manager' : r === 'bdo' ? 'BDO' : r;
  }

  /* ---------------- boot / shell ---------------- */
  function boot() {
    api('me').then(function (d) { state.user = d.user; state.perms = d.perms; state.tab = defaultTab(); render(); })
      .catch(function () { state.user = null; render(); });
  }
  function defaultTab() {
    if (state.user && state.user.role === 'superadmin') return 'admin';
    var t = MODULES.filter(function (m) { return can(m.key, 'v'); });
    return t.length ? t[0].key : 'dashboard';
  }
  function render() {
    if (!state.user) { renderLogin(); return; }
    renderShell();
  }
  function renderLogin() {
    elById('app').innerHTML =
      '<div class="login"><div class="box">' +
      '<div class="brandmark">' + svg('flame') + '</div>' +
      '<h1>IMANI SUPERDEALER</h1>' +
      '<p class="hint">Business Management Platform</p>' +
      '<form id="loginForm">' +
      '<div class="field"><label>Username</label><input id="lUser" autocomplete="username"></div>' +
      '<div class="field"><label>Password</label><input id="lPass" type="password" autocomplete="current-password"></div>' +
      '<button class="btn" type="submit">Sign in</button>' +
      '<div class="err" id="lErr"></div>' +
      '</form></div></div>';
    var f = elById('lUser'); if (f) f.focus();
  }
  function renderShell() {
    var tabs = MODULES.filter(function (m) { return can(m.key, 'v'); });
    if (!tabs.some(function (m) { return m.key === state.tab; })) state.tab = tabs.length ? tabs[0].key : 'dashboard';
    var nav = tabs.map(function (m) {
      return '<button class="nav-item' + (m.key === state.tab ? ' active' : '') + '" data-action="tab" data-tab="' + m.key + '">' + svg(m.icon) + '<span>' + esc(m.label) + '</span></button>';
    }).join('');
    elById('app').innerHTML =
      '<div class="shell"><aside class="sidebar">' +
      '<div class="sb-brand"><div class="sb-mark">' + svg('flame') + '</div><div class="sb-title">IMANI<br>SUPERDEALER<small>Business Management</small></div></div>' +
      nav +
      '<div class="sb-foot"><div class="sb-user"><span class="avatar">' + esc(initials(state.user.name)) + '</span>' +
      '<div><b>' + esc(state.user.name) + '</b><small>' + esc(roleLabel(state.user.role)) + '</small></div></div>' +
      '<div class="sb-actions"><button class="ghost mini" data-action="pwd">Password</button>' +
      '<button class="ghost mini" data-action="logout">Sign out</button></div></div>' +
      '</aside><main class="main"><div id="view"></div></main></div>';
    renderTab();
  }
  function renderTab() {
    var v = elById('view'); if (!v) return;
    v.innerHTML = skeletonHtml();
    if (state.tab === 'dashboard') viewDashboard(v);
    else if (state.tab === 'agents') viewAgents(v);
    else if (state.tab === 'mybase') viewMyBase(v);
    else if (state.tab === 'upload') viewUpload(v);
    else if (state.tab === 'targets') viewTargets(v);
    else if (state.tab === 'commission') viewCommission(v);
    else if (state.tab === 'admin') viewAdmin(v);
  }

  /* ---------------- auth actions ---------------- */
  function doLogin() {
    api('login', { body: { username: elById('lUser').value.trim(), password: elById('lPass').value } })
      .then(function (d) { state.user = d.user; state.perms = d.perms; state.tab = defaultTab(); render(); })
      .catch(function (e) { elById('lErr').textContent = e.message; });
  }
  function doLogout() {
    api('logout', { body: {} }).catch(function () { }).then(function () { state.user = null; render(); });
  }
  function pwdModal() {
    openModal('<h2>Change password</h2>' +
      '<div class="field"><label>Current password</label><input id="cpCur" type="password"></div>' +
      '<div class="field"><label>New password (min 8)</label><input id="cpNew" type="password"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
      '<button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="btn" data-action="pwdSave">Update</button></div>');
  }
  function pwdSave() {
    api('change_password', { body: { current: elById('cpCur').value, new: elById('cpNew').value } })
      .then(function () { closeModal(); toast('Password updated', 'ok'); })
      .catch(function (e) { toast(e.message, 'err'); });
  }

  /* ---------------- dashboard ---------------- */
  function viewDashboard(v) {
    var m = state.month || '';
    api('dashboard', { qs: m ? '&month=' + m : '' }).then(function (d) {
      state.month = d.month;
      var att = d.attainment;
      var bars = TARGET_DEFS.map(function (t) {
        var a = att[t.key];
        var pct = a.pct == null ? 0 : a.pct;
        var meta = a.target > 0 ? fmt(a.actual) + ' / ' + fmt(a.target) : fmt(a.actual) + ' (no target)';
        return '<div class="tg-row"><span class="tg-ic">' + svg(t.icon) + '</span>' +
          '<span class="tg-name">' + esc(t.label) + '</span>' +
          '<div class="bar" style="flex:1"><i style="width:' + pct + '%"></i></div>' +
          '<span class="tg-meta">' + meta + '</span>' +
          '<span class="tg-pct">' + (a.pct == null ? '-' : a.pct + '%') + '</span></div>';
      }).join('');
      v.innerHTML =
        '<h1 class="page-title">Dashboard</h1><p class="page-sub">Performance for ' + esc(d.month) +
        (d.status ? ' &middot; <span class="pill ' + (d.status === 'OPEN' ? 'gold' : d.status === 'AWAITING' ? 'fire' : 'dim') + '">' + d.status + '</span>' : '') + '</p>' +
        '<div class="panel"><div class="row"><div class="field"><label>Month</label><input id="dashMonth" type="month" value="' + esc(d.month) + '"></div>' +
        '<button class="btn" data-action="dashLoad">Load</button></div></div>' +
        '<div class="grid cards" style="margin-bottom:16px">' +
        card('users', 'Total Agents', fmt(d.totalAgents)) +
        card('users', 'Served', fmt(att.serving.actual)) +
        card('dollar', 'Float Served', fmt(att.float.actual)) +
        card('target', 'Visits', fmt(att.visits.actual)) +
        card('rotate', 'APK Updates', fmt(att.apk.actual)) +
        card('percent', 'Achievement', d.achievement == null ? '-' : d.achievement + '%', d.achievement == null ? 'set targets first' : 'vs monthly targets') +
        '</div>' +
        '<div class="panel"><h2>' + svg('target') + 'Target Attainment</h2>' + bars + '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function card(icon, title, value, sub) {
    return '<div class="card"><div class="card-head"><span class="kpi-ic">' + svg(icon) + '</span><h3>' + esc(title) + '</h3></div>' +
      '<div class="kpi">' + esc(value) + '</div>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>';
  }
  function errBox(e) { return '<div class="panel"><div class="err">' + esc(e.message || String(e)) + '</div></div>'; }

  /* ---------------- agents ---------------- */
  function viewAgents(v) {
    var qs = '&page=' + (state.agentPage || 1) + (state._agentSearch ? '&search=' + encodeURIComponent(state._agentSearch) : '');
    api('agents', { qs: qs }).then(function (d) {
      var rows = (d.items || []).map(function (a) {
        return '<tr><td>' + esc(a.acc) + '</td><td>' + esc(a.name) + '</td><td>' + esc(a.phone) + '</td><td>' + esc(a.branch) + '</td>' +
          '<td>' + esc(a.physical_location || '-') + '</td><td>' + (Number(a.partner) ? 'Yes' : '-') + '</td></tr>';
      }).join('') || '<tr><td colspan="6">' + emptyState('users', 'No agents yet', 'Import a weekly file to add agents.') + '</td></tr>';
      var pager = d.pages > 1
        ? '<div class="row" style="margin-top:12px;align-items:center"><button class="ghost" data-action="prevPage"' + (d.page <= 1 ? ' disabled' : '') + '>Prev</button>' +
          '<div class="note">Page ' + d.page + ' of ' + d.pages + '</div>' +
          '<button class="ghost" data-action="nextPage"' + (d.page >= d.pages ? ' disabled' : '') + '>Next</button></div>' : '';
      v.innerHTML =
        '<h1 class="page-title">Agents</h1><p class="page-sub">' + fmt(d.total) + ' agents in the master list</p>' +
        '<div class="panel"><div class="row"><div class="field"><label>Search</label><input id="agentSearch" placeholder="name, account, phone" value="' + esc(state._agentSearch || '') + '"></div>' +
        '<button class="btn" data-action="agentSearch">Search</button>' +
        '<button class="ghost" data-action="agentClear">Clear</button></div></div>' +
        '<div class="panel"><div class="tablewrap"><table><thead><tr><th>Account</th><th>Name</th><th>Phone</th><th>Branch</th><th>Location</th><th>Partner</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + pager + '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }

  /* ---------------- my base (BDO): KPI chips + weighted score ---------------- */
  var KPI_CHIPS = [
    { key: 'served', label: 'Served' },
    { key: 'visit', label: 'Visit' },
    { key: 'apk', label: 'APK' },
    { key: 'active', label: 'Active' }
  ];
  function flagPill(flag, score) {
    if (score == null) return '<span class="pill dim">no targets yet</span>';
    if (flag === 'red') return '<span class="pill bad">' + score + '% &mdash; BELOW 50</span>';
    if (flag === 'excellent') return '<span class="pill ok">' + score + '% &mdash; EXCELLENT</span>';
    return '<span class="pill gold">' + score + '%</span>';
  }
  function perfBars(kpis) {
    return TARGET_DEFS.map(function (t) {
      var k = kpis[t.key]; if (!k) return '';
      var pct = k.pct == null ? 0 : k.pct;
      var cls = k.pct == null ? '' : (k.pct < 50 ? ' red' : (k.pct >= 80 ? ' green' : ''));
      return '<div class="tg-row"><span class="tg-ic">' + svg(t.icon) + '</span>' +
        '<span class="tg-name">' + esc(t.label) + ' <span class="note">(' + k.weight + '%)</span></span>' +
        '<div class="bar" style="flex:1"><i class="' + cls + '" style="width:' + pct + '%"></i></div>' +
        '<span class="tg-meta">' + fmt(k.actual) + ' / ' + fmt(k.target) + '</span>' +
        '<span class="tg-pct">' + (k.pct == null ? '-' : k.pct + '%') + '</span></div>';
    }).join('');
  }
  function viewMyBase(v) {
    api('base', { qs: state.month ? '&month=' + state.month : '' }).then(function (d) {
      state.month = d.month;
      var editable = can('mybase', 'e') && d.monthStatus === 'OPEN';
      var rows = (d.agents || []).map(function (a) {
        var chips = KPI_CHIPS.map(function (c) {
          var by = a.kpi && a.kpi[c.key];
          if (by) {
            var mine = state.user && by === state.user.username;
            return '<span class="kchip done' + (mine ? ' mine' : '') + '" title="Done by ' + esc(by) + '">' + esc(c.label) + ' &#10003; <small>' + esc(by) + '</small></span>';
          }
          return editable
            ? '<button class="kchip todo" data-action="kpiMark" data-id="' + a.id + '" data-kpi="' + c.key + '" data-name="' + esc(a.name) + '">' + esc(c.label) + '</button>'
            : '<span class="kchip off">' + esc(c.label) + '</span>';
        }).join('');
        var lv = a.level === 'priority' ? 'Priority' : a.level === 'new' ? 'New' : 'Never';
        var pc = a.level === 'priority' ? 'ok' : a.level === 'new' ? 'gold' : 'bad';
        return '<tr><td><span class="dot ' + a.level + '"></span><span class="pill ' + pc + '">' + lv + '</span></td>' +
          '<td>' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div></td>' +
          '<td>' + esc(a.branch || '-') + '</td><td><div class="kchips">' + chips + '</div></td></tr>';
      }).join('') || '<tr><td colspan="4">' + emptyState('phone', 'No agents in your base yet', 'Your OM uploads your agent list.') + '</td></tr>';

      var perfPanel = d.performance
        ? '<div class="panel"><h2>' + svg('percent') + 'My Performance ' + flagPill(d.performance.flag, d.performance.score) + '</h2>' +
          perfBars(d.performance.kpis) + '</div>'
        : '<div class="panel"><div class="note">Your OM has not set your targets for ' + esc(d.month) + ' yet - your weighted score will appear here.</div></div>';

      v.innerHTML =
        '<h1 class="page-title">My Agent Base</h1><p class="page-sub">' + esc(d.month) +
        ' &middot; <span class="pill ' + (d.monthStatus === 'OPEN' ? 'gold' : 'dim') + '">' + esc(d.monthStatus || '-') + '</span>' +
        ' &middot; tap a KPI to mark it done. A KPI already done by a colleague shows their name and cannot be repeated.</p>' +
        '<div class="grid cards" style="margin-bottom:16px">' +
        card('flame', 'Priority', fmt(d.counts.priority), 'served last month') +
        card('users', 'New', fmt(d.counts.newAgents)) +
        card('users', 'Total Base', fmt(d.counts.total)) +
        card('check', 'My Served', fmt(d.counts.served)) +
        '</div>' + perfPanel +
        '<div class="panel"><h2>' + svg('phone') + 'Agents &mdash; mark KPIs</h2>' +
        '<div class="tablewrap"><table><thead><tr><th>Level</th><th>Agent</th><th>Branch</th><th>KPIs (Served / Visit / APK / Active)</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function kpiMark(id, kpi, name) {
    api('kpi_mark', { body: { agentId: Number(id), kpi: kpi } })
      .then(function () { toast(name + ': ' + kpi + ' marked - counted for you', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); renderTab(); });
  }

  /* ---------------- weekly upload ---------------- */
  function viewUpload(v) {
    v.innerHTML =
      '<h1 class="page-title">Weekly Performance Upload</h1>' +
      '<p class="page-sub">Excel columns: Agent Account, Agent Name, Phone, Branch, Float Served, Agent Visit, APK Update, Agent Activeness, SA Commission, Served Status. Optional: BDO, Physical Location, Partner.</p>' +
      '<div class="panel"><h2>' + svg('upload') + 'Import</h2>' +
      '<p class="note">No need to pick a BDO &mdash; a BDO/Officer column in the file links each row automatically (new BDOs get accounts); rows without one go to Unassigned.</p>' +
      '<div class="row" style="margin-top:8px">' +
      '<div class="field"><label>Month</label><input id="upMonth" type="month" value="' + esc(state.openMonth || curMonth()) + '"></div>' +
      '<div class="field"><label>Week</label><input id="upWeek" placeholder="e.g. W1"></div>' +
      '<div class="field"><label>Excel file (.xlsx)</label><input id="upFile" type="file" accept=".xlsx,.xls,.csv"></div>' +
      (can('upload', 'e') ? '<button class="btn" data-action="doUpload">Upload</button><button class="ghost" data-action="loadDemo">Load demo data</button>' : '<span class="note">View only.</span>') +
      '</div><div id="upResult" class="note" style="margin-top:12px"></div></div>';
  }
  function readExcel(fileInput, cb) {
    var f = fileInput.files && fileInput.files[0];
    if (!f) { toast('Choose an Excel file first', 'warn'); return; }
    var rd = new FileReader();
    rd.onload = function (e) {
      try {
        var wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        var rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        cb(rows);
      } catch (err) { toast('Could not read that file: ' + err.message, 'err'); }
    };
    rd.readAsArrayBuffer(f);
  }
  function doUpload() {
    readExcel(elById('upFile'), function (rows) {
      api('upload_weekly', { body: { month: elById('upMonth').value, week: elById('upWeek').value, rows: rows } })
        .then(function (d) { elById('upResult').innerHTML = uploadSummary(d); toast('Upload complete', 'ok'); })
        .catch(function (e) { elById('upResult').innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
    });
  }
  function loadDemo() {
    var rows = [], bdos = ['John', 'Mary', 'Peter'], branches = ['Kaloleni', 'Sakina', 'Njiro', 'Sokoni', 'Central'];
    for (var i = 1; i <= 12; i++) {
      var served = i % 3 !== 0;
      rows.push({
        'Agent Account': '01527' + (100000 + i), 'Agent Name': 'Demo Agent ' + i, 'BDO': bdos[i % 3],
        'Phone': '07' + (10000000 + i * 137), 'Branch': branches[i % 5],
        'Float Served': served ? 50000 + i * 1000 : 0, 'Agent Visit': served ? 'YES' : 'NO',
        'APK Update': i % 2 === 0 ? 'YES' : 'NO', 'Agent Activeness': served ? 'Active' : 'Dormant',
        'SA Commission': served ? 12500000 : 0, 'Served Status': served ? 'SERVED' : 'NOT_SERVED'
      });
    }
    api('upload_weekly', { body: { month: elById('upMonth').value, week: 'W1', rows: rows } })
      .then(function (d) { elById('upResult').innerHTML = uploadSummary(d); toast('Demo data loaded', 'ok'); })
      .catch(function (e) { elById('upResult').innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
  }
  function uploadSummary(d) {
    var s = 'Imported <b>' + fmt(d.rows) + '</b> rows into ' + esc(d.month) + ': ' + fmt(d.served) + ' served. BDOs: <b>' + (d.bdos || []).map(esc).join(', ') + '</b>.';
    if (d.createdBdos && d.createdBdos.length) s += ' New BDO accounts: ' + d.createdBdos.map(esc).join(', ') + ' (password imani123).';
    return s;
  }

  /* ---------------- targets (typed) + per-BDO targets & weights ---------------- */
  var DEFAULT_W = { serving: 30, float: 20, visits: 20, apk: 15, activeness: 15 };
  function bdoTargetsPanel(bt) {
    var m = bt.month;
    var byBdo = {};
    (bt.targets || []).forEach(function (t) { byBdo[t.bdo] = t; });
    var sel = state._btBdo && bt.bdos.some(function (b) { return b.username === state._btBdo; }) ? state._btBdo : (bt.bdos[0] ? bt.bdos[0].username : '');
    state._btBdo = sel;
    var t = byBdo[sel] || {};
    var opts = bt.bdos.map(function (b) {
      return '<option value="' + esc(b.username) + '"' + (b.username === sel ? ' selected' : '') + '>' + esc(b.name) + (byBdo[b.username] ? ' ✓' : '') + '</option>';
    }).join('');
    var rows = TARGET_DEFS.map(function (td) {
      var col = td.key;
      var tv = t[col + '_target'], wv = t[col + '_w'];
      return '<div class="tg-row"><span class="tg-ic">' + svg(td.icon) + '</span>' +
        '<span class="tg-name">' + esc(td.label) + '</span>' +
        '<div class="field"><label>Target</label><input id="bt_' + col + '" type="number" min="0" style="width:130px" value="' + (tv != null ? esc(tv) : '') + '" placeholder="0"></div>' +
        '<div class="field"><label>Weight %</label><input id="btw_' + col + '" type="number" min="0" max="100" style="width:90px" class="bt-w" value="' + (wv != null ? esc(wv) : DEFAULT_W[col]) + '"></div>' +
        '<span class="note" style="flex:1">' + esc(td.hint) + '</span></div>';
    }).join('');
    return '<div class="panel"><h2>' + svg('users') + 'BDO Targets &amp; KPI Weights &mdash; ' + esc(m) + '</h2>' +
      '<p class="note">Set each BDO\'s monthly target per KPI and how much each KPI weighs in his score. Weights must total <b>100%</b>. Score flags: <span class="pill bad">below 50%</span> <span class="pill gold">50-79%</span> <span class="pill ok">80%+ excellent</span></p>' +
      '<div class="row" style="margin:10px 0 4px"><div class="field"><label>BDO</label><select id="btBdo">' + opts + '</select></div>' +
      '<div class="spacer"></div><span class="note">Weights total: <b id="btSum">?</b>%</span>' +
      (can('targets', 'e') ? '<button class="btn" data-action="btSave">Save BDO targets</button>' : '') + '</div>' +
      rows + '</div>';
  }
  function bdoPerfPanel(perf) {
    var rows = (perf.rows || []).map(function (r) {
      var mini = TARGET_DEFS.map(function (t) {
        var k = r.kpis[t.key];
        var cls = !k || k.pct == null ? 'dim' : (k.pct < 50 ? 'bad' : (k.pct >= 80 ? 'ok' : 'gold'));
        return '<span class="pill ' + cls + '" title="' + esc(t.label) + ': ' + (k ? fmt(k.actual) + '/' + fmt(k.target) : '-') + '">' + esc(t.label.split(' ')[0]) + ' ' + (k && k.pct != null ? k.pct + '%' : '-') + '</span>';
      }).join(' ');
      return '<tr><td>' + esc(r.name) + '</td><td>' + flagPill(r.flag, r.score) + '</td><td><div class="kchips">' + mini + '</div></td></tr>';
    }).join('') || '<tr><td colspan="3" class="note">No BDO targets set for this month yet.</td></tr>';
    return '<div class="panel"><h2>' + svg('percent') + 'BDO Performance &mdash; ' + esc(perf.month) + '</h2>' +
      '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Weighted Score</th><th>Per-KPI</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function btSave() {
    var body = { month: elById('tgMonth') ? elById('tgMonth').value : (state.month || state.openMonth), bdo: elById('btBdo').value };
    TARGET_DEFS.forEach(function (td) { body[td.key] = elById('bt_' + td.key).value; body[td.key + '_w'] = elById('btw_' + td.key).value; });
    api('bdo_targets_save', { body: body })
      .then(function () { toast('Targets & weights saved for ' + body.bdo, 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function btUpdateSum() {
    var s = 0;
    TARGET_DEFS.forEach(function (td) { var el = elById('btw_' + td.key); if (el) s += Number(el.value) || 0; });
    var el = elById('btSum');
    if (el) { el.textContent = s; el.style.color = s === 100 ? 'var(--ok)' : 'var(--bad)'; }
  }
  function viewTargets(v) {
    var m0 = state.month || state.openMonth || curMonth();
    Promise.all([api('targets_get'), api('bdo_targets_get', { qs: '&month=' + m0 }), api('bdo_performance', { qs: '&month=' + m0 })]).then(function (rr) {
      var list = rr[0], bt = rr[1], perf = rr[2];
      var byMonth = {};
      list.forEach(function (t) { byMonth[t.month] = t; });
      var m = m0;
      var t = byMonth[m] || {};
      var fields = TARGET_DEFS.map(function (td) {
        var val = t[td.key === 'float' ? 'float_target' : td.key + '_target'];
        return '<div class="tg-row"><span class="tg-ic">' + svg(td.icon) + '</span>' +
          '<span class="tg-name">' + esc(td.label) + '</span>' +
          '<input id="tg_' + td.key + '" type="number" min="0" style="width:170px" value="' + (val != null ? esc(val) : '') + '" placeholder="0">' +
          '<span class="note" style="flex:1">' + esc(td.hint) + '</span></div>';
      }).join('');
      var hist = list.map(function (r) {
        return '<tr><td>' + esc(r.month) + '</td><td>' + fmt(r.serving_target) + '</td><td>' + fmt(r.float_target) + '</td><td>' + fmt(r.visits_target) + '</td><td>' + fmt(r.apk_target) + '</td><td>' + fmt(r.activeness_target) + '</td></tr>';
      }).join('') || '<tr><td colspan="6">' + emptyState('target', 'No targets yet', 'Type this month\'s targets above and save.') + '</td></tr>';
      v.innerHTML =
        '<h1 class="page-title">Monthly Targets</h1><p class="page-sub">Type the office targets for the month &mdash; they drive the dashboard and the commission achievement.</p>' +
        '<div class="panel"><h2>' + svg('target') + 'Set Targets</h2>' +
        '<div class="row" style="margin-bottom:8px"><div class="field"><label>Month</label><input id="tgMonth" type="month" value="' + esc(m) + '"></div>' +
        '<button class="ghost" data-action="tgLoad">Load month</button><div class="spacer"></div>' +
        (can('targets', 'e') ? '<button class="btn" data-action="tgSave">Save targets</button>' : '<span class="note">View only.</span>') + '</div>' +
        fields + '</div>' +
        bdoTargetsPanel(bt) +
        bdoPerfPanel(perf) +
        '<div class="panel"><h2>' + svg('cal') + 'Saved Office Targets</h2><div class="tablewrap"><table><thead><tr><th>Month</th><th>Serving</th><th>Float</th><th>Visits</th><th>APK</th><th>Activeness</th></tr></thead><tbody>' + hist + '</tbody></table></div></div>';
      btUpdateSum();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function tgSave() {
    var body = { month: elById('tgMonth').value };
    TARGET_DEFS.forEach(function (td) { body[td.key] = elById('tg_' + td.key).value; });
    api('targets_save', { body: body })
      .then(function () { toast('Targets saved for ' + body.month, 'ok'); state.month = body.month; renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }

  /* ---------------- commission & months ---------------- */
  function viewCommission(v) {
    api('months').then(function (ms) {
      state.openMonth = ms.open;
      state.months = ms.months;
      var sel = state._commMonth || ms.open;
      state._commMonth = sel;
      return api('commission_get', { qs: '&month=' + sel }).then(function (d) {
        var strip = ms.months.map(function (m) {
          return '<button class="mo ' + m.status + (m.month === sel ? ' sel' : '') + '" data-action="commMonth" data-m="' + m.month + '">' + m.month + '<span class="st">' + m.status + '</span></button>';
        }).join('');
        var canE = can('commission', 'e');
        var s = d.saved;
        var calcCards = s
          ? '<div class="grid cards" style="margin-top:14px">' +
            card('dollar', 'SA Commission (SERVED)', fmt(s.total), s.served_count + ' served rows') +
            card('dollar', 'Fixed Pool (30%)', fmt(s.fixed_pool)) +
            card('dollar', 'Variable Pool (70%)', fmt(s.variable_pool)) +
            card('percent', 'Achievement', Math.round(s.achievement) + '%', 'release ' + Math.round(s.release_pct * 100) + '%') +
            card('zap', 'Variable Paid', fmt(s.variable_paid)) +
            card('check', 'Final Commission', fmt(s.final_amount), 'saved') + '</div>'
          : '<div class="note" style="margin-top:12px">No calculation saved for ' + esc(sel) + ' yet.</div>';
        v.innerHTML =
          '<h1 class="page-title">Commission &amp; Months</h1>' +
          '<p class="page-sub">Upload the final commission Excel before closing a month. A new month can be open for BDOs while the previous waits for its final commission.</p>' +
          '<div class="panel"><h2>' + svg('cal') + 'Months</h2><div class="mo-strip">' + strip + '</div>' +
          (canE ? '<button class="ghost" data-action="monthOpen">Open next month (current becomes AWAITING)</button>' : '') + '</div>' +
          '<div class="panel"><h2>' + svg('dollar') + 'Final Commission &mdash; ' + esc(sel) + ' <span class="pill ' + (d.status === 'OPEN' ? 'gold' : d.status === 'AWAITING' ? 'fire' : 'dim') + '">' + esc(d.status || '?') + '</span></h2>' +
          '<p class="note">Uploaded rows: <b>' + fmt(d.uploadedRows) + '</b> (' + fmt(d.servedRows) + ' served). Suggested achievement from targets: <b>' + (d.suggestedAchievement == null ? 'set targets first' : d.suggestedAchievement + '%') + '</b></p>' +
          (canE && d.status !== 'CLOSED'
            ? '<div class="row" style="margin-top:8px">' +
              '<div class="field"><label>Commission Excel (.xlsx)</label><input id="commFile" type="file" accept=".xlsx,.xls,.csv"></div>' +
              '<button class="btn" data-action="commUpload">Upload file</button>' +
              '<button class="ghost" data-action="commDemo">Load demo</button>' +
              '<div class="spacer"></div>' +
              '<div class="field"><label>Achievement %</label><input id="commAch" type="number" min="0" max="150" style="width:110px" value="' + (s ? Math.round(s.achievement) : (d.suggestedAchievement == null ? '' : d.suggestedAchievement)) + '"></div>' +
              '<button class="btn" data-action="commCalc">Calculate &amp; Save</button></div>'
            : '') +
          calcCards +
          (canE && d.status !== 'CLOSED'
            ? '<div class="row" style="margin-top:16px;justify-content:flex-end"><button class="danger" data-action="monthClose" data-m="' + esc(sel) + '"' + (s ? '' : ' disabled title="Calculate & Save first"') + '>Close ' + esc(sel) + ' (carry served agents forward)</button></div>'
            : '') +
          '</div>';
      });
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function commUpload() {
    readExcel(elById('commFile'), function (rows) {
      api('commission_upload', { body: { month: state._commMonth, rows: rows } })
        .then(function (d) { toast('Commission file loaded: ' + fmt(d.rows) + ' rows', 'ok'); renderTab(); })
        .catch(function (e) { toast(e.message, 'err'); });
    });
  }
  function commDemo() {
    var rows = [];
    for (var i = 1; i <= 10; i++) rows.push({ 'Agent Account': 'D' + i, 'SA Commission': 12500000, 'Served Status': i <= 8 ? 'SERVED' : 'NOT_SERVED' });
    api('commission_upload', { body: { month: state._commMonth, rows: rows } })
      .then(function () { toast('Demo commission loaded (8 x 12.5M served)', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function commCalc() {
    api('commission_calc', { body: { month: state._commMonth, achievement: elById('commAch').value } })
      .then(function () { toast('Commission calculated & saved', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function monthOpen() {
    openModal('<h2>Open next month?</h2><p class="note">BDOs will start serving in the new month. The current month becomes AWAITING until you upload its final commission and close it.</p>' +
      '<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="btn" data-action="monthOpenGo">Open next month</button></div>');
  }
  function monthOpenGo() {
    api('month_open', { body: {} })
      .then(function (d) { closeModal(); toast('Opened ' + d.opened + '; ' + d.awaiting + ' awaiting commission', 'ok'); state._commMonth = null; renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function monthClose(m) {
    openModal('<h2>Close ' + esc(m) + '?</h2><p class="note">The month locks and every agent served in it becomes a PRIORITY agent in the next month\'s base. This cannot be undone.</p>' +
      '<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="danger" data-action="monthCloseGo" data-m="' + esc(m) + '">Close month</button></div>');
  }
  function monthCloseGo(m) {
    api('month_close', { body: { month: m } })
      .then(function (d) { closeModal(); toast('Closed ' + d.closed + ' - ' + fmt(d.carried) + ' priority agents carried to ' + d.next, 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }

  /* ---------------- admin: users + permissions ---------------- */
  function viewAdmin(v) {
    Promise.all([api('admin_meta'), api('admin_perms'), api('admin_users'), api('admin_audit')]).then(function (r) {
      var meta = r[0], matrix = r[1], users = r[2], audit = r[3];
      state._roles = meta.roles.map(function (x) { return x.name; });
      state._permMatrix = matrix;
      if (!matrix[state._permRole]) state._permRole = state._roles.filter(function (x) { return x !== 'superadmin'; })[0] || 'om';

      var roleOpts = state._roles.map(function (rr) { return '<option value="' + esc(rr) + '">' + esc(roleLabel(rr)) + '</option>'; }).join('');
      var userRows = users.map(function (u) {
        var prot = u.role === 'superadmin';
        var acts = prot ? '<span class="note">protected</span>'
          : '<button class="ghost mini" data-action="uReset" data-id="' + u.id + '" data-name="' + esc(u.username) + '">Set password</button> ' +
            '<button class="ghost mini" data-action="uToggle" data-id="' + u.id + '" data-active="' + (Number(u.active) ? '0' : '1') + '">' + (Number(u.active) ? 'Disable' : 'Enable') + '</button> ' +
            '<button class="danger mini" data-action="uDelete" data-id="' + u.id + '" data-name="' + esc(u.username) + '">Delete</button>';
        var roleSel = prot ? '<span class="pill fire">Super Admin</span>'
          : '<select data-change="uRole" data-id="' + u.id + '">' + state._roles.map(function (rr) {
              return '<option value="' + esc(rr) + '"' + (rr === u.role ? ' selected' : '') + '>' + esc(roleLabel(rr)) + '</option>';
            }).join('') + '</select>';
        return '<tr><td>' + esc(u.username) + '</td><td>' + esc(u.name) + '</td><td>' + roleSel + '</td><td>' + esc(u.station || '-') + '</td>' +
          '<td>' + (Number(u.active) ? '<span class="pill ok">Active</span>' : '<span class="pill bad">Disabled</span>') + '</td><td>' + acts + '</td></tr>';
      }).join('');

      var auditRows = (audit || []).slice(0, 40).map(function (a) {
        return '<tr><td>' + esc((a.at || '').slice(0, 16)) + '</td><td>' + esc(a.who || 'system') + '</td><td>' + esc(a.action) + '</td><td>' + esc(a.detail || '') + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="note">No activity yet.</td></tr>';

      v.innerHTML =
        '<h1 class="page-title">Admin</h1><p class="page-sub">Members, roles, access control and activity.</p>' +
        '<div class="panel"><h2>' + svg('users') + 'Members</h2>' +
        '<div class="row" style="margin-bottom:14px">' +
        '<div class="field"><label>Username</label><input id="nuUser" placeholder="e.g. amina"></div>' +
        '<div class="field"><label>Full name</label><input id="nuName" placeholder="Amina Said"></div>' +
        '<div class="field"><label>Role</label><select id="nuRole">' + roleOpts + '</select></div>' +
        '<div class="field"><label>Station</label><input id="nuStation" placeholder="Arusha"></div>' +
        '<div class="field"><label>Password</label><input id="nuPass" placeholder="min 6 chars"></div>' +
        '<button class="btn" data-action="uAdd">Add member</button></div>' +
        '<div class="tablewrap"><table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Station</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + userRows + '</tbody></table></div></div>' +
        '<div class="panel"><h2>' + svg('lock') + 'Access Control</h2>' +
        '<p class="note" style="margin-bottom:12px">Pick a role, then switch on what it can <b>View</b>, <b>Edit</b> or <b>Delete</b> per module. Super Admin always has everything.</p>' +
        '<div class="role-chips" id="roleChips"></div>' +
        '<div id="permRows"></div>' +
        '<div class="row" style="margin-top:14px"><button class="ghost" data-action="roleAdd">+ New role</button><div class="spacer"></div>' +
        '<button class="btn" data-action="permSave">Save permissions</button></div></div>' +
        '<div class="panel"><h2>' + svg('cal') + 'Recent Activity</h2><div class="tablewrap"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>' + auditRows + '</tbody></table></div></div>';
      drawPermEditor();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function drawPermEditor() {
    var chips = elById('roleChips'), rowsEl = elById('permRows');
    if (!chips || !rowsEl) return;
    var roles = state._roles.filter(function (r) { return r !== 'superadmin'; });
    chips.innerHTML = roles.map(function (r) {
      return '<button class="role-chip' + (r === state._permRole ? ' active' : '') + '" data-action="permRole" data-r="' + esc(r) + '">' + esc(roleLabel(r)) + '</button>';
    }).join('');
    var m = state._permMatrix[state._permRole] || {};
    rowsEl.innerHTML = MODULES.map(function (mod) {
      var p = m[mod.key] || { v: false, e: false, d: false };
      function tgl(lvl, label, extra) {
        return '<button class="tgl' + (p[lvl] ? ' on' : '') + (extra || '') + '" data-action="permTgl" data-mod="' + mod.key + '" data-lvl="' + lvl + '">' + label + '</button>';
      }
      return '<div class="perm-row"><span class="perm-ic">' + svg(mod.icon) + '</span>' +
        '<span class="perm-name">' + esc(mod.label) + '</span>' +
        '<div class="perm-toggles">' + tgl('v', 'View') + tgl('e', 'Edit') + tgl('d', 'Delete', ' del') + '</div></div>';
    }).join('');
  }
  function permSave() {
    api('admin_perms_save', { body: { matrix: state._permMatrix } })
      .then(function () { toast('Permissions saved', 'ok'); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function roleAddModal() {
    openModal('<h2>New role</h2><p class="note">Lowercase letters and numbers, e.g. <b>teamleader</b>. Assign its permissions after creating.</p>' +
      '<div class="field"><label>Role name</label><input id="nrName" placeholder="teamleader"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="btn" data-action="roleAddGo">Create role</button></div>');
  }
  function roleAddGo() {
    api('admin_role_add', { body: { name: elById('nrName').value } })
      .then(function (d) { closeModal(); toast('Role "' + d.name + '" created', 'ok'); state._permRole = d.name; renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function uAdd() {
    api('admin_user_add', { body: { username: elById('nuUser').value.trim(), name: elById('nuName').value.trim(), role: elById('nuRole').value, station: elById('nuStation').value.trim(), password: elById('nuPass').value } })
      .then(function () { toast('Member added', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function uPatch(id, fields) {
    api('admin_user_update', { body: Object.assign({ id: Number(id) }, fields) })
      .then(function () { toast('Member updated', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function uReset(id, name) {
    openModal('<h2>Set password for ' + esc(name) + '</h2>' +
      '<div class="field"><label>New password (min 6)</label><input id="rpNew" type="text" placeholder="give them this password"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="btn" data-action="uResetGo" data-id="' + id + '">Set password</button></div>');
  }
  function uDelete(id, name) {
    openModal('<h2>Delete ' + esc(name) + '?</h2><p class="note">This cannot be undone.</p>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="danger" data-action="uDeleteGo" data-id="' + id + '">Delete member</button></div>');
  }

  /* ---------------- modal ---------------- */
  function openModal(html) {
    closeModal();
    var box = document.createElement('div');
    box.className = 'modalback'; box.id = 'modalback';
    box.innerHTML = '<div class="modalbox" role="dialog" aria-modal="true">' + html + '</div>';
    box.addEventListener('click', function (e) { if (e.target === box) closeModal(); });
    document.body.appendChild(box);
    var f = box.querySelector('input,select'); if (f) f.focus();
  }
  function closeModal() { var m = elById('modalback'); if (m) m.remove(); }

  /* ---------------- events ---------------- */
  function onClick(e) {
    var node = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!node) return;
    var a = node.getAttribute('data-action');
    if (a === 'tab') { state.tab = node.getAttribute('data-tab'); renderShell(); return; }
    if (a === 'logout') { doLogout(); return; }
    if (a === 'pwd') { pwdModal(); return; }
    if (a === 'pwdSave') { pwdSave(); return; }
    if (a === 'closeModal') { closeModal(); return; }
    if (a === 'dashLoad') { state.month = elById('dashMonth').value; renderTab(); return; }
    if (a === 'agentSearch') { state._agentSearch = elById('agentSearch').value.trim(); state.agentPage = 1; renderTab(); return; }
    if (a === 'agentClear') { state._agentSearch = ''; state.agentPage = 1; renderTab(); return; }
    if (a === 'prevPage') { state.agentPage = Math.max(1, (state.agentPage || 1) - 1); renderTab(); return; }
    if (a === 'nextPage') { state.agentPage = (state.agentPage || 1) + 1; renderTab(); return; }
    if (a === 'kpiMark') { kpiMark(node.getAttribute('data-id'), node.getAttribute('data-kpi'), node.getAttribute('data-name')); return; }
    if (a === 'btSave') { btSave(); return; }
    if (a === 'doUpload') { doUpload(); return; }
    if (a === 'loadDemo') { loadDemo(); return; }
    if (a === 'tgLoad') { state.month = elById('tgMonth').value; renderTab(); return; }
    if (a === 'tgSave') { tgSave(); return; }
    if (a === 'commMonth') { state._commMonth = node.getAttribute('data-m'); renderTab(); return; }
    if (a === 'commUpload') { commUpload(); return; }
    if (a === 'commDemo') { commDemo(); return; }
    if (a === 'commCalc') { commCalc(); return; }
    if (a === 'monthOpen') { monthOpen(); return; }
    if (a === 'monthOpenGo') { monthOpenGo(); return; }
    if (a === 'monthClose') { monthClose(node.getAttribute('data-m')); return; }
    if (a === 'monthCloseGo') { monthCloseGo(node.getAttribute('data-m')); return; }
    if (a === 'permRole') { state._permRole = node.getAttribute('data-r'); drawPermEditor(); return; }
    if (a === 'permTgl') {
      var mod = node.getAttribute('data-mod'), lvl = node.getAttribute('data-lvl');
      var mm = state._permMatrix[state._permRole];
      if (!mm) { mm = {}; state._permMatrix[state._permRole] = mm; }
      if (!mm[mod]) mm[mod] = { v: false, e: false, d: false };
      mm[mod][lvl] = !mm[mod][lvl];
      if ((lvl === 'e' || lvl === 'd') && mm[mod][lvl]) mm[mod].v = true; // edit/delete imply view
      drawPermEditor(); return;
    }
    if (a === 'permSave') { permSave(); return; }
    if (a === 'roleAdd') { roleAddModal(); return; }
    if (a === 'roleAddGo') { roleAddGo(); return; }
    if (a === 'uAdd') { uAdd(); return; }
    if (a === 'uToggle') { uPatch(node.getAttribute('data-id'), { active: node.getAttribute('data-active') === '1' }); return; }
    if (a === 'uReset') { uReset(node.getAttribute('data-id'), node.getAttribute('data-name')); return; }
    if (a === 'uResetGo') { var pw = elById('rpNew').value; closeModal(); uPatch(node.getAttribute('data-id'), { password: pw }); return; }
    if (a === 'uDelete') { uDelete(node.getAttribute('data-id'), node.getAttribute('data-name')); return; }
    if (a === 'uDeleteGo') {
      closeModal();
      api('admin_user_delete', { body: { id: Number(node.getAttribute('data-id')) } })
        .then(function () { toast('Member deleted', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
  }
  function onChange(e) {
    var n = e.target;
    if (n && n.getAttribute && n.getAttribute('data-change') === 'uRole') { uPatch(n.getAttribute('data-id'), { role: n.value }); return; }
    if (n && n.id === 'btBdo') { state._btBdo = n.value; renderTab(); return; }
  }
  function onInput(e) {
    if (e.target && e.target.classList && e.target.classList.contains('bt-w')) btUpdateSum();
  }
  function onSubmit(e) {
    if (e.target && e.target.id === 'loginForm') { e.preventDefault(); doLogin(); }
  }
  function onKeydown(e) { if (e.key === 'Escape') closeModal(); }

  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onKeydown);
  boot();
})();
