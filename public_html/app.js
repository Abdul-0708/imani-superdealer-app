/* IMANI SUPERDEALER - front-end SPA (PHP backend, session auth). */
(function () {
  'use strict';

  var state = { user: null, perms: {}, tab: 'dashboard', month: null, months: [], openMonth: null, agentPage: 1, agentPer: 50, _agentSeq: 0, _roles: [], _permMatrix: {}, _permRole: 'om' };

  /* ---------------- language (EN / Swahili) ----------------
   * Technical terms stay as they are (KPI, acc, name, phone, branch, Served,
   * Visit, APK, Active, float...). Only interface wording is translated. */
  var LANG = localStorage.getItem('imani_lang') === 'sw' ? 'sw' : 'en';
  var SW = {
    'Dashboard': 'Dashibodi',
    'My Agent Base': 'Base ya Wakala Wangu',
    'Daily Report': 'Ripoti ya Siku',
    'Agents': 'Mawakala',
    'All Agents': 'Mawakala Wote',
    'Weekly Upload': 'Upakiaji wa Wiki',
    'Monthly Targets': 'Malengo ya Mwezi',
    'Commission & Months': 'Kamisheni na Miezi',
    'Reports & Ranks': 'Ripoti na Viwango',
    'Admin': 'Usimamizi',
    'Sign out': 'Toka',
    'Password': 'Nenosiri',
    'Light': 'Mwanga',
    'Dark': 'Giza',
    'Sign in': 'Ingia',
    'Username': 'Jina la mtumiaji',
    'Search (live)': 'Tafuta (papo hapo)',
    'Show': 'Onyesha',
    'Clear': 'Futa',
    'Load': 'Pakia',
    'Month': 'Mwezi',
    'Send report': 'Tuma ripoti',
    'Save report': 'Hifadhi ripoti',
    'My reports this month': 'Ripoti zangu mwezi huu',
    'My Performance': 'Utendaji Wangu',
    'Performance trend': 'Mwenendo wa utendaji',
    'Messages from management': 'Ujumbe kutoka kwa Uongozi',
    'Report date (today or up to 2 days back)': 'Tarehe ya ripoti (leo au hadi siku 2 nyuma)',
    'Total float served': 'Jumla ya float iliyohudumiwa',
    'Agents visited': 'Mawakala waliotembelewa',
    'Inactive waked': 'Walioamshwa (inactive)',
    'APK updated': 'APK zilizosasishwa',
    'Report float shortage': 'Ripoti upungufu wa float',
    'Priority': 'Kipaumbele',
    'New': 'Mpya',
    'Total Base': 'Jumla ya Base',
    'My Served': 'Nilizohudumia',
    'Priority to serve': 'Kipaumbele cha kuhudumia',
    'Agents - mark KPIs': 'Mawakala - weka KPI',
    'Level': 'Ngazi',
    'Status': 'Hali',
    'Date': 'Tarehe',
    'Target Attainment': 'Ufikiaji wa Malengo',
    'Achievement': 'Ufanisi',
    'Open Daily Report': 'Fungua Ripoti ya Siku',
    'Send today\'s KPI numbers from the': 'Tuma idadi za KPI za leo kupitia',
    'served last month': 'waliohudumiwa mwezi uliopita',
    'Total': 'Jumla',
    'tap a KPI to mark it done. A KPI already done by a colleague shows their name and cannot be repeated.':
      'gusa KPI kuikamilisha. KPI iliyokwisha fanywa na mwenzako inaonyesha jina lake na haiwezi kurudiwa.',
    'Type only FLOAT and APK here. Serving, visits and activeness are done on the agent list - find the agent, tap his chip and confirm, so we know which agent was handled by which BDO.':
      'Andika FLOAT na APK tu hapa. Kuhudumia, visits na activeness hufanywa kwenye orodha ya mawakala - mtafute wakala, gusa chip yake na uthibitishe, ili tujue wakala gani alishughulikiwa na BDO yupi.',
    'Serving, visits and activeness: use the agent list, not this form.':
      'Kuhudumia, visits na activeness: tumia orodha ya mawakala, si fomu hii.',
    'Open agent list': 'Fungua orodha ya mawakala',
    'Confirm?': 'Thibitisha?',
    'No connection - check your internet and try again': 'Hakuna mtandao - angalia intaneti yako kisha ujaribu tena',
    'Two-step verification': 'Uthibitisho wa hatua mbili',
    'Open your authenticator app and type the 6-digit code for IMANI.': 'Fungua app yako ya authenticator kisha andika namba 6 za IMANI.',
    '6-digit code': 'Namba 6 za uthibitisho',
    'Verify': 'Thibitisha',
    'Back to sign in': 'Rudi kuingia',
    'Live KPI status - a KPI already done shows who did it, so nobody repeats it. Work on the ones not ready.':
      'Hali ya KPI papo hapo - KPI iliyokwisha fanywa inaonyesha aliyeifanya, hivyo hakuna anayerudia. Fanyia kazi zile ambazo hazijakamilika.',
    'Master list with live KPI status.': 'Orodha kuu na hali ya KPI papo hapo.',
    'Your OM has not set your targets for': 'OM wako bado hajaweka malengo yako ya',
    'yet - your weighted score will appear here.': 'bado - alama yako ya uzito itaonekana hapa.'
  };
  function t(s) { return LANG === 'sw' && SW[s] ? SW[s] : s; }
  function toggleLang() {
    LANG = LANG === 'sw' ? 'en' : 'sw';
    localStorage.setItem('imani_lang', LANG);
    render();
  }

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
    /* X-Requested-With is the CSRF token-in-header: the server rejects any
     * POST without it, and no cross-site page can attach it. */
    var init = { method: opts.body ? 'POST' : 'GET', credentials: 'same-origin', headers: { 'X-Requested-With': 'imani' } };
    if (opts.body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch(url, init).catch(function () {
      throw new Error(t('No connection - check your internet and try again'));
    }).then(function (r) {
      return r.json().catch(function () { return { error: 'Bad server response' }; }).then(function (d) {
        if (r.status === 401) { state.user = null; render(); throw new Error(d.error || 'Please sign in'); }
        if (!r.ok) { var err = new Error(d.error || ('Error ' + r.status)); err.data = d; throw err; }
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
  function isoOf(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function isoToday() { return isoOf(new Date()); }
  function isoDaysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return isoOf(d); }
  function prettyToday() {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var d = new Date();
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + mon[d.getMonth()] + ' ' + d.getFullYear();
  }
  /* Theme: dark (default fire) or light. Persisted in localStorage. */
  function applyTheme() { document.body.classList.toggle('light', localStorage.getItem('imani_theme') === 'light'); }
  function toggleTheme() {
    var light = !document.body.classList.contains('light');
    document.body.classList.toggle('light', light);
    localStorage.setItem('imani_theme', light ? 'light' : 'dark');
    var b = elById('themeBtn'); if (b) b.innerHTML = light ? (svg('flame') + ' ' + t('Dark')) : (svg('eye') + ' ' + t('Light'));
  }

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
    check: '<path d="M20 6L9 17l-5-5"/>',
    chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    pin: '<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || ICON.grid) + '</svg>';
  }

  var MODULES = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { key: 'mybase', label: 'My Agent Base', icon: 'phone' },
    { key: 'daily', label: 'Daily Report', icon: 'cal' },
    { key: 'agents', label: 'Agents', icon: 'users' },
    { key: 'upload', label: 'Weekly Upload', icon: 'upload' },
    { key: 'targets', label: 'Monthly Targets', icon: 'target' },
    { key: 'commission', label: 'Commission & Months', icon: 'dollar' },
    { key: 'reports', label: 'Reports & Ranks', icon: 'chart' },
    { key: 'admin', label: 'Admin', icon: 'lock' }
  ];
  var TARGET_DEFS = [
    { key: 'serving', label: 'Serving', icon: 'users', hint: 'unique agents served' },
    { key: 'float', label: 'Float', icon: 'dollar', hint: 'float from SERVED agents only' },
    { key: 'visits', label: 'Agent Visits', icon: 'target', hint: 'visits (YES)' },
    { key: 'apk', label: 'Agent APK', icon: 'rotate', hint: 'on required APK version' },
    { key: 'activeness', label: 'Agent Activeness', icon: 'zap', hint: 'waked (inactive -> active)' }
  ];
  /* Office KPIs = the five above + withdraw volume (office-wide, no BDO attached). */
  var OFFICE_DEFS = TARGET_DEFS.concat([
    { key: 'withdraw', label: 'Withdraw Volume', icon: 'chart', hint: 'cumulative from the uploaded file' }
  ]);

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
    applyTheme();
    api('me').then(function (d) { state.user = d.user; state.perms = d.perms; state.tab = defaultTab(); render(); })
      .catch(function () { state.user = null; render(); });
  }
  function defaultTab() {
    if (state.user && state.user.role === 'superadmin') return 'admin';
    var t = visibleModules();
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
      '<div class="field"><label>' + t('Username') + '</label><input id="lUser" autocomplete="username"></div>' +
      '<div class="field"><label>' + t('Password') + '</label><div class="pwwrap"><input id="lPass" type="password" autocomplete="current-password">' +
      '<button type="button" class="pweye" data-action="togglePw" data-for="lPass" aria-label="Show password">' + svg('eye') + '</button></div></div>' +
      '<button class="btn" type="submit">' + t('Sign in') + '</button>' +
      '<div style="text-align:center;margin-top:10px"><button type="button" class="ghost tiny" data-action="toggleLang">' + (LANG === 'sw' ? 'English' : 'Swahili') + '</button></div>' +
      '<div class="err" id="lErr"></div>' +
      '</form></div></div>';
    var f = elById('lUser'); if (f) f.focus();
  }
  /* Second sign-in step when the account has 2FA: the 6-digit authenticator code. */
  function render2fa() {
    elById('app').innerHTML =
      '<div class="login"><div class="box">' +
      '<div class="brandmark">' + svg('lock') + '</div>' +
      '<h1>' + t('Two-step verification') + '</h1>' +
      '<p class="hint">' + t('Open your authenticator app and type the 6-digit code for IMANI.') + '</p>' +
      '<form id="twofaForm">' +
      '<div class="field"><label>' + t('6-digit code') + '</label>' +
      '<input id="lCode" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="000000" style="text-align:center;letter-spacing:6px;font-size:20px;font-weight:800"></div>' +
      '<button class="btn" type="submit">' + t('Verify') + '</button>' +
      '<div style="text-align:center;margin-top:10px"><button type="button" class="ghost tiny" data-action="backToLogin">' + t('Back to sign in') + '</button></div>' +
      '<div class="err" id="lErr"></div>' +
      '</form></div></div>';
    var f = elById('lCode'); if (f) f.focus();
  }
  function do2fa() {
    api('login_2fa', { body: { code: elById('lCode').value.trim() } })
      .then(function (d) { state.user = d.user; state.perms = d.perms; state.tab = defaultTab(); render(); })
      .catch(function (e) { var el = elById('lErr'); if (el) el.textContent = e.message; });
  }
  /* 2FA enrolment: QR (or manual key) + a code to prove the scan worked. */
  function totpSetupModal(d) {
    openModal('<h2>' + svg('lock') + ' Enable 2FA</h2>' +
      '<p class="note">1. Install <b>Google Authenticator</b> (or Authy / Microsoft Authenticator).<br>' +
      '2. Scan this QR code - or type the manual key.<br>' +
      '3. Enter the 6-digit code the app shows to confirm.</p>' +
      '<div id="qrBox" style="background:#fff;padding:10px;border-radius:12px;width:180px;margin:12px auto"></div>' +
      '<p class="note" style="word-break:break-all;text-align:center">Manual key: <b>' + esc(d.secret) + '</b></p>' +
      '<div class="field"><label>6-digit code from the app</label>' +
      '<input id="tfCode" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="000000"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
      '<button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="btn" data-action="totpEnable">Turn on 2FA</button></div>');
    if (window.QRCode) { try { new QRCode(elById('qrBox'), { text: d.uri, width: 160, height: 160 }); } catch (e) { elById('qrBox').style.display = 'none'; } }
    else elById('qrBox').style.display = 'none';
    var f = elById('tfCode'); if (f) f.focus();
  }
  /* Which tabs the user sees. BDOs get the Agents tab too (restricted columns,
   * enforced by the server) so the uploaded list is visible to everyone. */
  function visibleModules() {
    return MODULES.filter(function (m) {
      if (m.key === 'daily') return can('mybase', 'e'); // BDO's own daily-report tab
      if (can(m.key, 'v')) return true;
      return m.key === 'agents' && can('mybase', 'v');
    });
  }
  function renderShell() {
    var tabs = visibleModules();
    if (!tabs.some(function (m) { return m.key === state.tab; })) state.tab = tabs.length ? tabs[0].key : 'dashboard';
    var nav = tabs.map(function (m) {
      return '<button class="nav-item' + (m.key === state.tab ? ' active' : '') + '" data-action="tab" data-tab="' + m.key + '">' + svg(m.icon) + '<span>' + esc(t(m.label)) + '</span></button>';
    }).join('');
    elById('app').innerHTML =
      '<div class="shell"><aside class="sidebar">' +
      '<div class="sb-brand"><div class="sb-mark">' + svg('flame') + '</div><div class="sb-title">IMANI<br>SUPERDEALER<small>Business Management</small></div></div>' +
      '<div class="today-chip">' + svg('cal') + '<span>' + esc(prettyToday()) + '</span></div>' +
      nav +
      '<div class="sb-foot"><div class="sb-user"><span class="avatar">' + esc(initials(state.user.name)) + '</span>' +
      '<div><b>' + esc(state.user.name) + '</b><small>' + esc(roleLabel(state.user.role)) + '</small></div></div>' +
      '<div class="sb-actions"><button class="ghost tiny" id="themeBtn" data-action="toggleTheme" title="Theme">' +
      (document.body.classList.contains('light') ? svg('flame') + ' ' + t('Dark') : svg('eye') + ' ' + t('Light')) + '</button>' +
      '<button class="ghost tiny" data-action="toggleLang" title="Language">' + (LANG === 'sw' ? 'EN' : 'SW') + '</button>' +
      '<button class="ghost tiny" data-action="pwd">' + t('Password') + '</button>' +
      '<button class="ghost tiny" data-action="logout">' + t('Sign out') + '</button></div></div>' +
      '</aside><main class="main"><div id="view"></div></main></div>';
    renderTab();
  }
  function renderTab() {
    var v = elById('view'); if (!v) return;
    v.innerHTML = skeletonHtml();
    if (state.tab === 'dashboard') viewDashboard(v);
    else if (state.tab === 'agents') viewAgents(v);
    else if (state.tab === 'mybase') viewMyBase(v);
    else if (state.tab === 'daily') viewDaily(v);
    else if (state.tab === 'upload') viewUpload(v);
    else if (state.tab === 'targets') viewTargets(v);
    else if (state.tab === 'commission') viewCommission(v);
    else if (state.tab === 'reports') viewReports(v);
    else if (state.tab === 'admin') viewAdmin(v);
  }

  /* ---------------- auth actions ---------------- */
  function doLogin() {
    api('login', { body: { username: elById('lUser').value.trim(), password: elById('lPass').value } })
      .then(function (d) {
        if (d.need2fa) { render2fa(); return; }
        state.user = d.user; state.perms = d.perms; state.tab = defaultTab(); render();
      })
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
      var visible = (d.visibleKpis || '').split(',');
      function shown(k) { return visible.indexOf(k) >= 0; }
      var defs = OFFICE_DEFS.filter(function (t) { return shown(t.key) && att[t.key]; });

      var bars = defs.map(function (t) {
        var a = att[t.key];
        var pct = a.pct == null ? 0 : a.pct;
        var meta = a.target > 0 ? fmt(a.actual) + ' / ' + fmt(a.target) : fmt(a.actual) + ' (no target)';
        var wtag = a.weight > 0 ? ' <span class="note">(' + a.weight + '%)</span>' : '';
        return '<div class="tg-row"><span class="tg-ic">' + svg(t.icon) + '</span>' +
          '<span class="tg-name">' + esc(t.label) + wtag + '</span>' +
          '<div class="bar" style="flex:1"><i style="width:' + pct + '%"></i></div>' +
          '<span class="tg-meta">' + meta + '</span>' +
          '<span class="tg-pct">' + (a.pct == null ? '-' : a.pct + '%') + '</span></div>';
      }).join('');

      var cards = card('users', 'Total Agents', fmt(d.totalAgents));
      if (shown('serving')) cards += card('users', 'Served', fmt(att.serving.actual));
      if (shown('float')) cards += card('dollar', 'Float (SERVED only)', fmt(att.float.actual));
      if (shown('visits')) cards += card('target', 'Visits', fmt(att.visits.actual));
      if (shown('apk')) cards += card('rotate', 'APK ' + esc(d.apkRequired) + '+', fmt(att.apk.actual));
      if (shown('activeness')) cards += card('zap', 'Activeness (net)', fmt(att.activeness.actual), 'waked ' + fmt(d.waked) + ' - lost ' + fmt(d.lost));
      if (shown('withdraw')) cards += card('chart', 'Withdraw Volume', fmt(att.withdraw.actual), 'office-wide');
      cards += card('percent', d.weighted ? 'Weighted Achievement' : 'Achievement',
        d.achievement == null ? '-' : d.achievement + '%',
        d.achievement == null ? 'set targets first' : (d.weighted ? 'real weighted result' : 'plain average - set weights'));

      /* OM: choose visible KPIs + required APK version */
      var settings = can('dashboard', 'e')
        ? '<div class="panel"><h2>' + svg('target') + 'Dashboard settings</h2>' +
          '<div class="row" style="align-items:center">' +
          OFFICE_DEFS.map(function (t) {
            return '<label class="tgl' + (shown(t.key) ? ' on' : '') + '" style="cursor:pointer"><input type="checkbox" class="kpivis" value="' + t.key + '"' + (shown(t.key) ? ' checked' : '') + ' style="display:none">' + esc(t.label) + '</label>';
          }).join('') +
          '<div class="spacer"></div>' +
          '<div class="field"><label>Required APK version</label><input id="apkReq" style="width:100px" value="' + esc(d.apkRequired) + '"></div>' +
          '<button class="btn" data-action="dashSettingsSave">Save</button></div>' +
          '<p class="note" style="margin-top:6px">Ticked KPIs appear on everyone\'s dashboard. APK counts only when an agent reads version ' + esc(d.apkRequired) + ' or newer.</p></div>'
        : '';

      v.innerHTML =
        '<h1 class="page-title">' + t('Dashboard') + '</h1><p class="page-sub">Performance for ' + esc(d.month) +
        (d.status ? ' &middot; <span class="pill ' + (d.status === 'OPEN' ? 'gold' : d.status === 'AWAITING' ? 'fire' : 'dim') + '">' + d.status + '</span>' : '') +
        (d.fromUpload ? ' &middot; main KPIs from the uploaded performance file' : ' &middot; <span class="pill dim">no performance file uploaded yet</span>') + '</p>' +
        '<div class="panel"><div class="row"><div class="field"><label>Month</label><input id="dashMonth" type="month" value="' + esc(d.month) + '"></div>' +
        '<button class="btn" data-action="dashLoad">Load</button></div></div>' +
        settings +
        '<div class="grid cards" style="margin-bottom:16px">' + cards + '</div>' +
        '<div class="panel"><h2>' + svg('target') + t('Target Attainment') + (d.weighted ? ' <span class="pill gold">weighted</span>' : '') + '</h2>' + bars + '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function dashSettingsSave() {
    var kpis = Array.prototype.map.call(document.querySelectorAll('.kpivis:checked'), function (c) { return c.value; });
    api('dashboard_settings_save', { body: { kpis: kpis, apkVersion: elById('apkReq').value.trim() } })
      .then(function () { toast('Dashboard settings saved', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function card(icon, title, value, sub) {
    return '<div class="card"><div class="card-head"><span class="kpi-ic">' + svg(icon) + '</span><h3>' + esc(title) + '</h3></div>' +
      '<div class="kpi">' + esc(value) + '</div>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>';
  }
  function errBox(e) { return '<div class="panel"><div class="err">' + esc(e.message || String(e)) + '</div></div>'; }

  /* ---------------- agents (all roles; BDOs get restricted columns) ---------------- */
  /* phone renders as a tap-to-call link - field BDOs dial the agent in one tap */
  function telHtml(p) { return p ? '<a class="tel" href="tel:' + esc(p) + '">' + esc(p) + '</a>' : '-'; }
  function agentRowHtml(a, editable, restricted) {
    var partnerServed = a.kpi && a.kpi.served && a.kpi.served.by === 'partners';
    var name = esc(a.name) + (partnerServed ? ' <span class="pill fire" title="Served by partners - build the relationship and capture the location">PARTNER</span>' : '');
    return '<tr data-agent="' + a.id + '"><td class="c-meta" data-l="acc">' + esc(a.acc) + '</td><td class="c-name">' + name + '</td>' +
      '<td class="c-meta" data-l="phone">' + telHtml(a.phone) + '</td><td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
      '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td>' +
      '<td class="c-kpis"><div class="kchips">' + kpiChips(a, editable) + '</div></td>' +
      '</tr>';
  }
  function agentsBodyLoad() {
    var body = elById('agentsBody'); if (!body) return;
    var seq = ++state._agentSeq;
    var qs = '&page=' + (state.agentPage || 1) + '&per=' + (state.agentPer || 50) +
      (state._agentSearch ? '&search=' + encodeURIComponent(state._agentSearch) : '');
    api('agents', { qs: qs }).then(function (d) {
      if (seq !== state._agentSeq) return; // stale response - a newer search is in flight
      state._agentsMeta = d;
      var editable = can('mybase', 'e') && d.monthStatus === 'OPEN';
      var cols = 6;
      var rows = (d.items || []).map(function (a) { return agentRowHtml(a, editable, d.restricted); }).join('')
        || '<tr><td colspan="' + cols + '">' + emptyState('users', 'No agents found', state._agentSearch ? 'Try a different search.' : 'The OM uploads the agent performance file.') + '</td></tr>';
      body.innerHTML = rows;
      var info = elById('agentsInfo');
      if (info) info.textContent = fmt(d.total) + ' agents - page ' + d.page + ' of ' + d.pages;
      var prev = elById('agentsPrev'), next = elById('agentsNext');
      if (prev) prev.disabled = d.page <= 1;
      if (next) next.disabled = d.page >= d.pages;
    }).catch(function (e) { body.innerHTML = '<tr><td colspan="7"><span class="err">' + esc(e.message) + '</span></td></tr>'; });
  }
  function viewAgents(v) {
    var restricted = !can('agents', 'v');
    var perOpts = [20, 50, 100].map(function (n) {
      return '<option value="' + n + '"' + (n === (state.agentPer || 50) ? ' selected' : '') + '>' + n + ' / page</option>';
    }).join('');
    v.innerHTML =
      '<h1 class="page-title">' + (restricted ? t('All Agents') : t('Agents')) + '</h1>' +
      '<p class="page-sub">' + (restricted
        ? t('Live KPI status - a KPI already done shows who did it, so nobody repeats it. Work on the ones not ready.')
        : t('Master list with live KPI status.')) + '</p>' +
      '<div class="panel"><div class="row">' +
      '<div class="field" style="flex:1;min-width:160px"><label>' + t('Search (live)') + '</label><input id="agentSearch" placeholder="type to search..." value="' + esc(state._agentSearch || '') + '" autocomplete="off"></div>' +
      '<div class="field"><label>' + t('Show') + '</label><select id="agentPer">' + perOpts + '</select></div>' +
      '<button class="ghost" data-action="agentClear">' + t('Clear') + '</button>' +
      (restricted ? '' : '<button class="ghost mini" data-action="locExport" title="Download all agents that have a physical location">' + svg('pin') + ' Locations</button>') +
      '<div class="spacer"></div><span class="note" id="agentsInfo">Loading...</span></div></div>' +
      '<div class="panel wide"><div class="tablewrap tall cardwrap"><table class="cardable"><thead><tr><th>Account</th><th>Name</th><th>Phone</th><th>Branch</th><th>Physical Location</th><th>KPIs &mdash; Served / Visit / APK / Active</th>' +
      '</tr></thead><tbody id="agentsBody"></tbody></table></div>' +
      '<div class="row" style="margin-top:12px;align-items:center"><button class="ghost" id="agentsPrev" data-action="prevPage">Prev</button>' +
      '<button class="ghost" id="agentsNext" data-action="nextPage">Next</button></div></div>' +
      '<div id="inactivePanel"></div>';
    agentsBodyLoad();
    inactivePanelLoad();
    var s = elById('agentSearch'); if (s && state._agentSearch) s.focus();
  }
  /* Inactive agents - two categories, visible to every BDO and management. */
  function inactivePanelLoad() {
    var el = elById('inactivePanel'); if (!el) return;
    api('inactive_agents').then(function (d) {
      if (!d.counts.all) { el.innerHTML = ''; return; }
      var mode = state._inactMode === 'all' ? 'all' : 'lost';
      var list = mode === 'all' ? d.all : d.lost;
      var rows = list.map(function (a) {
        var lostTag = a.act_prev === 'ACTIVE' ? ' <span class="pill bad">was ACTIVE</span>' : '';
        return '<tr><td class="c-name">' + esc(a.name) + lostTag + '<div class="note">' + esc(a.acc) + '</div></td>' +
          '<td class="c-meta" data-l="phone">' + telHtml(a.phone) + '</td><td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
          '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="note">None - great.</td></tr>';
      el.innerHTML =
        '<div class="panel"><h2>' + svg('zap') + 'Inactive Agents &mdash; ' + esc(d.month) + '</h2>' +
        '<p class="note">Category 2 first: they were ACTIVE last month and went silent - wake them before month end.</p>' +
        '<div class="row" style="margin-bottom:10px">' +
        '<button class="role-chip' + (mode === 'lost' ? ' active' : '') + '" data-action="inactMode" data-m="lost">Were active last month (' + d.counts.lost + ')</button>' +
        '<button class="role-chip' + (mode === 'all' ? ' active' : '') + '" data-action="inactMode" data-m="all">All inactive this month (' + d.counts.all + ')</button></div>' +
        '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>Agent</th><th>Phone</th><th>Branch</th><th>Location</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).catch(function () { el.innerHTML = ''; });
  }
  function locExport() {
    api('agents_location_export').then(function (d) {
      if (!d.count) { toast('No agents with a physical location yet', 'warn'); return; }
      var rows = d.items.map(function (a) {
        return { 'Agent Account': a.acc, 'Agent Name': a.name, 'Phone': a.phone, 'Branch': a.branch,
                 'Station': a.station, 'Physical Location': a.physical_location,
                 'Last Served By': a.last_served_by || '', 'Last Served At': a.last_served_at || '' };
      });
      var ws = XLSX.utils.json_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Agents with location');
      XLSX.writeFile(wb, 'agents_with_locations_' + new Date().toISOString().slice(0, 10) + '.xlsx');
      toast(fmt(d.count) + ' agents exported', 'ok');
    }).catch(function (e) { toast(e.message, 'err'); });
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
  /* KPI chips for one agent: done -> who did it (locked); open -> markable. */
  function kpiChips(a, editable) {
    var isOM = can('agents', 'e');
    return KPI_CHIPS.map(function (c) { return kpiChip(a, c, editable, isOM); }).join('');
  }
  function doneChip(a, c, mark, isOM) {
    var lbl = c.key === 'active' ? 'Active' : (c.key === 'visit' ? 'Visit YES' : c.label);
    var mine = state.user && mark.by === state.user.username;
    var reversible = mark.src === 'bdo' && (isOM || mine);
    var x = reversible ? ' <button class="kchip-x" title="Reverse this mark" aria-label="Reverse this mark" data-action="kpiUnmark" data-id="' + a.id + '" data-kpi="' + c.key + '">&times;</button>' : '';
    return '<span class="kchip done' + (mine ? ' mine' : '') + '" title="Done by ' + esc(mark.by) + (mark.src === 'upload' ? ' (from file)' : '') + '">' +
      esc(lbl) + ' &#10003; <small>' + esc(mark.by) + '</small>' + x + '</span>';
  }
  function todoChip(a, c, label) {
    return '<button class="kchip todo" data-action="kpiMark" data-id="' + a.id + '" data-kpi="' + c.key + '" data-name="' + esc(a.name) + '">' + esc(label || c.label) + '</button>';
  }
  function kpiChip(a, c, editable, isOM) {
    var mark = a.kpi && a.kpi[c.key];
    if (c.key === 'active' && !mark) {
      /* real status from the file even when no one "marked" it */
      if (a.actStatus === 'ACTIVE') return '<span class="kchip done" title="Active (from uploaded file)">Active &#10003;</span>';
      if (a.actStatus === 'INACTIVE') return editable ? todoChip(a, c, 'Wake') : '<span class="kchip bad-off">Inactive</span>';
      return editable ? todoChip(a, c, 'Active') : '<span class="kchip off">Active</span>';
    }
    if (c.key === 'visit' && !mark) {
      /* reads as NO until the BDO taps + confirms it to YES */
      return editable ? todoChip(a, c, 'Visit NO') : '<span class="kchip off">Visit NO</span>';
    }
    if (mark) return doneChip(a, c, mark, isOM);
    return editable ? todoChip(a, c) : '<span class="kchip off">' + esc(c.label) + '</span>';
  }
  function viewMyBase(v) {
    Promise.all([api('base', { qs: state.month ? '&month=' + state.month : '' }), api('messages_get')]).then(function (rr) {
      var d = rr[0], msgs = rr[1];
      state.month = d.month;
      var editable = can('mybase', 'e') && d.monthStatus === 'OPEN';
      var rows = (d.agents || []).map(function (a) {
        var chips = kpiChips(a, editable);
        var lv = a.level === 'priority' ? 'Priority' : a.level === 'new' ? 'New' : 'Never';
        var pc = a.level === 'priority' ? 'ok' : a.level === 'new' ? 'gold' : 'bad';
        return '<tr><td class="c-level"><span class="dot ' + a.level + '"></span><span class="pill ' + pc + '">' + lv + '</span></td>' +
          '<td class="c-name">' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div></td>' +
          '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td>' +
          '<td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td><td class="c-kpis"><div class="kchips">' + chips + '</div></td></tr>';
      }).join('') || '<tr><td colspan="5">' + emptyState('phone', 'No agents in your base yet', 'Your OM uploads your agent list.') + '</td></tr>';

      /* OM broadcast messages */
      var msgPanel = (msgs && msgs.length)
        ? '<div class="panel"><h2>' + svg('mail') + 'Messages from management</h2>' +
          msgs.slice(0, 5).map(function (m) {
            return '<div class="tg-row"><span class="tg-ic">' + svg('mail') + '</span><div style="flex:1">' + esc(m.body) +
              '<div class="note">' + esc(m.from_user) + ' &middot; ' + esc((m.at || '').slice(0, 16)) + '</div></div></div>';
          }).join('') + '</div>'
        : '';

      /* Daily report now lives in its own "Daily Report" tab */
      var dailyPanel = editable
        ? '<div class="panel"><div class="row" style="align-items:center"><span class="note">Send today\'s KPI numbers from the <b>Daily Report</b> tab.</span>' +
          '<button class="ghost mini" data-action="tab" data-tab="daily">' + svg('cal') + ' ' + t('Open Daily Report') + '</button></div></div>'
        : '';

      /* Priority agents still to serve this month */
      var prioLeft = (d.agents || []).filter(function (a) { return a.level === 'priority' && !(a.kpi && a.kpi.served); });
      var prioPanel = prioLeft.length
        ? '<div class="panel"><h2>' + svg('flame') + t('Priority to serve') + ' (' + prioLeft.length + ')</h2>' +
          '<p class="note">Your carried base - you already know where they are. Serve them first.</p>' +
          '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>Agent</th><th>Location</th><th>Branch</th><th>Action</th></tr></thead><tbody>' +
          prioLeft.map(function (a) {
            return '<tr><td class="c-name">' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div></td>' +
              '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td>' +
              '<td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
              '<td class="c-kpis">' + (editable ? '<button class="kchip todo" data-action="kpiMark" data-id="' + a.id + '" data-kpi="served" data-name="' + esc(a.name) + '">Serve</button>' : '-') + '</td></tr>';
          }).join('') + '</tbody></table></div></div>'
        : '';

      /* Special: partner-served agents everyone should adopt + locate */
      var specialPanel = (d.special && d.special.length)
        ? '<div class="panel"><h2>' + svg('alert') + 'Special agents - served by PARTNERS (' + d.special.length + ')</h2>' +
          '<p class="note">The partner served these agents. Visit them, build the relationship and capture the physical location.</p>' +
          '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>Agent</th><th>Phone</th><th>Branch</th><th>Location</th><th>Action</th></tr></thead><tbody>' +
          d.special.map(function (a) {
            return '<tr><td class="c-name">' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div></td><td class="c-meta" data-l="phone">' + telHtml(a.phone) + '</td>' +
              '<td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
              '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td>' +
              '<td class="c-kpis">' + (editable && !a.physical_location ? '<button class="kchip todo" data-action="setLoc" data-id="' + a.id + '" data-name="' + esc(a.name) + '">' + svg('pin') + ' Set location</button>' : '-') + '</td></tr>';
          }).join('') + '</tbody></table></div></div>'
        : '';

      var perfPanel = d.performance
        ? '<div class="panel"><h2>' + svg('percent') + 'My Performance ' + flagPill(d.performance.flag, d.performance.score) + '</h2>' +
          perfBars(d.performance.kpis) + '</div>'
        : '<div class="panel"><div class="note">Your OM has not set your targets for ' + esc(d.month) + ' yet - your weighted score will appear here.</div></div>';

      v.innerHTML =
        '<h1 class="page-title">' + t('My Agent Base') + '</h1><p class="page-sub">' + esc(d.month) +
        ' &middot; <span class="pill ' + (d.monthStatus === 'OPEN' ? 'gold' : 'dim') + '">' + esc(d.monthStatus || '-') + '</span>' +
        ' &middot; ' + t('tap a KPI to mark it done. A KPI already done by a colleague shows their name and cannot be repeated.') + '</p>' +
        msgPanel +
        '<div class="grid cards" style="margin-bottom:16px">' +
        card('flame', t('Priority'), fmt(d.counts.priority), t('served last month')) +
        card('users', t('New'), fmt(d.counts.newAgents)) +
        card('users', t('Total Base'), fmt(d.counts.total)) +
        card('check', t('My Served'), fmt(d.counts.served)) +
        '</div>' + dailyPanel + perfPanel + prioPanel + specialPanel +
        '<div class="panel"><h2>' + svg('phone') + t('Agents - mark KPIs') + '</h2>' +
        '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>Level</th><th>Agent</th><th>Location</th><th>Branch</th><th>KPIs (Served / Visit / APK / Active)</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* ---------------- Daily Report (separate BDO tab) ---------------- */
  function viewDaily(v) {
    /* base gives his weighted performance so each saved report moves the trend */
    Promise.all([api('daily_reports_get'), api('base')]).then(function (rr) {
      var d = rr[0], base = rr[1];
      var mine = (d.reports || []).filter(function (r) { return r.bdo === state.user.username; }).reverse();
      var tot = { f: 0, a: 0 };
      mine.forEach(function (r) { tot.f += Number(r.float) || 0; tot.a += Number(r.apk) || 0; });
      var hist = mine.slice(0, 14).map(function (r) {
        return '<tr><td>' + esc(r.date) + '</td><td>' + fmt(r.float) + '</td><td>' + fmt(r.apk) + '</td>' +
          '<td>' + (r.late ? '<span class="pill gold">LATE</span>' : '<span class="pill ok">OK</span>') + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="note">-</td></tr>';
      var totalRow = mine.length
        ? '<tr style="font-weight:800"><td>' + t('Total') + ' (' + mine.length + ')</td><td>' + fmt(tot.f) + '</td><td>' + fmt(tot.a) + '</td><td></td></tr>'
        : '';
      var perfPanel = base.performance
        ? '<div class="panel"><h2>' + svg('percent') + t('Performance trend') + ' ' + flagPill(base.performance.flag, base.performance.score) + '</h2>' +
          '<p class="note">' + esc(t('My reports this month')) + ' + KPI = ' + esc(t('My Performance')) + '</p>' +
          perfBars(base.performance.kpis) + '</div>'
        : '<div class="panel"><div class="note">' + esc(t('Your OM has not set your targets for')) + ' ' + esc(base.month || '') + ' ' + esc(t('yet - your weighted score will appear here.')) + '</div></div>';
      v.innerHTML =
        '<h1 class="page-title">' + t('Daily Report') + '</h1>' +
        '<p class="page-sub">' + t('Type only FLOAT and APK here. Serving, visits and activeness are done on the agent list - find the agent, tap his chip and confirm, so we know which agent was handled by which BDO.') + '</p>' +
        '<div class="panel"><h2>' + svg('cal') + t('Send report') + '</h2>' +
        '<div class="row"><div class="field"><label>' + t('Report date (today or up to 2 days back)') + '</label><input id="drDate" type="date" value="' + isoToday() + '" min="' + isoDaysAgo(2) + '" max="' + isoToday() + '"></div>' +
        '<div class="field"><label>' + t('Total float served') + '</label><input id="drFloat" type="number" min="0" placeholder="0"></div>' +
        '<div class="field"><label>' + t('APK updated') + '</label><input id="drApk" type="number" min="0" placeholder="0"></div></div>' +
        '<p class="note" style="margin-top:8px">' + svg('users') + ' ' + t('Serving, visits and activeness: use the agent list, not this form.') + ' <button class="ghost tiny" data-action="tab" data-tab="' + (can('agents', 'v') ? 'agents' : 'mybase') + '">' + t('Open agent list') + '</button></p>' +
        '<div class="row" style="margin-top:10px"><button class="btn" data-action="drSave">' + t('Save report') + '</button>' +
        '<button class="ghost" data-action="shortage">' + svg('alert') + ' ' + t('Report float shortage') + '</button></div></div>' +
        perfPanel +
        '<div class="panel"><h2>' + svg('chart') + t('My reports this month') + '</h2>' +
        '<div class="tablewrap"><table><thead><tr><th>' + t('Date') + '</th><th>Float</th><th>APK</th><th>' + t('Status') + '</th></tr></thead><tbody>' + hist + totalRow + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function drSave() {
    api('daily_report_save', { body: { date: elById('drDate').value, float: elById('drFloat').value, apk: elById('drApk').value } })
      .then(function (d) { toast('Daily report saved for ' + d.date, 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function shortageModal() {
    openModal('<h2>' + svg('alert') + ' Float shortage</h2>' +
      '<p class="note">Seen by management only.</p>' +
      '<div class="field"><label>Amount short</label><input id="shAmt" type="number" min="1" placeholder="0"></div>' +
      '<div class="field"><label>Reason</label><input id="shReason" placeholder="what happened"></div>' +
      '<div class="field"><label>When will you recover it? (within 24hrs)</label><input id="shRecover" placeholder="e.g. today 18:00"></div>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="shNotified"> I have already notified the manager</label>' +
      '<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="danger" data-action="shortageSave">Submit</button></div>');
  }
  function shortageSave() {
    api('shortage_save', { body: { amount: elById('shAmt').value, reason: elById('shReason').value, recoverBy: elById('shRecover').value, notified: elById('shNotified').checked } })
      .then(function () { closeModal(); toast('Shortage reported to management', 'ok'); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function setLocModal(id, name) {
    openModal('<h2>' + svg('pin') + ' Location of ' + esc(name) + '</h2>' +
      '<div class="field"><label>Physical location</label><input id="locInput" placeholder="e.g. Sakina, near the mosque"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="btn" data-action="setLocGo" data-id="' + id + '">Save location</button></div>');
  }
  /* Fast path: swap the tapped chip in place. NEVER reloads the page or loses
   * the user's position - the row stays where it is with a fresh green chip. */
  function chipDoneHtml(kpiKey, owner, agentId) {
    var c = KPI_CHIPS.filter(function (x) { return x.key === kpiKey; })[0];
    var lbl = kpiKey === 'active' ? 'Active' : (kpiKey === 'visit' ? 'Visit YES' : (c ? c.label : kpiKey));
    /* a just-made mark is the current user's own bdo mark -> reversible */
    var x = ' <button class="kchip-x" title="Reverse this mark" aria-label="Reverse this mark" data-action="kpiUnmark" data-id="' + agentId + '" data-kpi="' + kpiKey + '">&times;</button>';
    return '<span class="kchip done mine" title="Done by you">' +
      esc(lbl) + ' &#10003; <small>' + esc(owner) + '</small>' + x + '</span>';
  }
  function swapChip(node, kpi, owner) {
    if (!node || !node.parentNode) return false;
    var id = node.getAttribute('data-id');
    var tmp = document.createElement('span');
    tmp.innerHTML = chipDoneHtml(kpi, owner, id);
    node.parentNode.replaceChild(tmp.firstChild, node);
    return true;
  }
  function kpiUnmark(id, kpi) {
    api('kpi_unmark', { body: { agentId: Number(id), kpi: kpi } })
      .then(function () { toast('Mark reversed', 'ok'); if (state.tab === 'agents') agentsBodyLoad(); else renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function kpiMark(id, kpi, name, node, location) {
    api('kpi_mark', { body: { agentId: Number(id), kpi: kpi, location: location || '' } })
      .then(function () {
        toast(name + ': ' + kpi + ' marked - counted for you', 'ok');
        swapChip(node, kpi, state.user.username);
        /* finished serving an agent found via search? clear the search so the
         * next lookup starts fresh (the list reloads, position resets cleanly) */
        if (kpi === 'served' && state.tab === 'agents' && state._agentSearch) {
          state._agentSearch = ''; state.agentPage = 1;
          var si = elById('agentSearch');
          if (si) { si.value = ''; si.focus(); }
          agentsBodyLoad();
        }
      })
      .catch(function (e) {
        if (e.data && e.data.needLocation) { locationModal(id, kpi, name, node); return; }
        toast(e.message, 'err');
        /* someone else already did it - show their name on the chip, in place */
        var m = String(e.message).match(/Already done by (\S+)/);
        if (m) swapChip(node, kpi, m[1]);
      });
  }
  /* Forced physical-location entry before an agent can be marked served. */
  function locationModal(id, kpi, name, node) {
    openModal('<h2>' + svg('pin') + ' Where is ' + esc(name) + '?</h2>' +
      '<p class="note">Type the agent\'s physical location before saving him as served. It becomes his known location for the coming months.</p>' +
      '<div class="field"><label>Physical location</label><input id="locInput" placeholder="e.g. Kaloleni, opposite NMB Bank"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
      '<button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="btn" data-action="locConfirm" data-id="' + id + '" data-kpi="' + kpi + '" data-name="' + esc(name) + '">Save location &amp; mark served</button></div>');
    state._locNode = node;
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
      '</div>' +
      '<label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="upPriority"> ' +
      'This is a <b>&nbsp;priority base list&nbsp;</b> (agents with physical locations + BDO names) - place agents into each BDO\'s priority base</label>' +
      '<div id="upResult" class="note" style="margin-top:12px"></div></div>';
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
      var mode = elById('upPriority') && elById('upPriority').checked ? 'priority' : '';
      api('upload_weekly', { body: { month: elById('upMonth').value, week: elById('upWeek').value, mode: mode, rows: rows } })
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
    var s = 'Imported <b>' + fmt(d.rows) + '</b> rows into ' + esc(d.month) + (d.priorityMode ? ' as <b>PRIORITY base</b>' : '') + ': ' + fmt(d.served) + ' served. BDOs: <b>' + (d.bdos || []).map(esc).join(', ') + '</b>.';
    if (d.createdBdos && d.createdBdos.length) s += ' New BDO accounts: ' + d.createdBdos.map(esc).join(', ') + ' (password imani123).';
    if (d.flagged) s += ' <span class="pill bad">' + d.flagged + ' flag' + (d.flagged > 1 ? 's' : '') + ' raised</span> (claimed served but file says NOT served - see Reports & Ranks).';
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
    var rows = (perf.rows || []).map(function (r, i) {
      var mini = TARGET_DEFS.map(function (t) {
        var k = r.kpis[t.key];
        var cls = !k || k.pct == null ? 'dim' : (k.pct < 50 ? 'bad' : (k.pct >= 80 ? 'ok' : 'gold'));
        return '<span class="pill ' + cls + '" title="' + esc(t.label) + ': ' + (k ? fmt(k.actual) + '/' + fmt(k.target) : '-') + '">' + esc(t.label.split(' ')[0]) + ' ' + (k && k.pct != null ? k.pct + '%' : '-') + '</span>';
      }).join(' ');
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + flagPill(r.flag, r.score) + '</td><td><div class="kchips">' + mini + '</div></td></tr>';
    }).join('') || '<tr><td colspan="4" class="note">No BDOs yet.</td></tr>';
    return '<div class="panel"><h2>' + svg('percent') + 'BDO Performance &mdash; ' + esc(perf.month) + ' (all BDOs, top to bottom)</h2>' +
      '<div class="tablewrap"><table><thead><tr><th>#</th><th>BDO</th><th>Weighted Score</th><th>Per-KPI</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
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
      var fields = OFFICE_DEFS.map(function (td) {
        var val = t[td.key + '_target'];
        var wv = t[td.key + '_w'];
        return '<div class="tg-row"><span class="tg-ic">' + svg(td.icon) + '</span>' +
          '<span class="tg-name">' + esc(td.label) + '</span>' +
          '<div class="field"><label>Target</label><input id="tg_' + td.key + '" type="number" min="0" style="width:150px" value="' + (val != null ? esc(val) : '') + '" placeholder="0"></div>' +
          '<div class="field"><label>Weight %</label><input id="tgw_' + td.key + '" type="number" min="0" max="100" style="width:90px" class="tg-w" value="' + (wv != null && Number(wv) > 0 ? esc(wv) : '') + '" placeholder="0"></div>' +
          '<span class="note" style="flex:1">' + esc(td.hint) + '</span></div>';
      }).join('');
      var hist = list.map(function (r) {
        return '<tr><td>' + esc(r.month) + '</td><td>' + fmt(r.serving_target) + '</td><td>' + fmt(r.float_target) + '</td><td>' + fmt(r.visits_target) + '</td><td>' + fmt(r.apk_target) + '</td><td>' + fmt(r.activeness_target) + '</td><td>' + fmt(r.withdraw_target || 0) + '</td></tr>';
      }).join('') || '<tr><td colspan="6">' + emptyState('target', 'No targets yet', 'Type this month\'s targets above and save.') + '</td></tr>';
      v.innerHTML =
        '<h1 class="page-title">Monthly Targets</h1><p class="page-sub">Type the office targets for the month &mdash; they drive the dashboard and the commission achievement.</p>' +
        '<div class="panel"><h2>' + svg('target') + 'Set Office Targets &amp; KPI Weights</h2>' +
        '<p class="note">Weights decide the REAL achieved performance (e.g. Withdraw 30%, Visits 10%, APK 10%, Float 20%...). They must total <b>100</b> - or leave all empty for a plain average.</p>' +
        '<div class="row" style="margin-bottom:8px"><div class="field"><label>Month</label><input id="tgMonth" type="month" value="' + esc(m) + '"></div>' +
        '<button class="ghost" data-action="tgLoad">Load month</button><div class="spacer"></div>' +
        '<span class="note">Weights total: <b id="tgSum">0</b>%</span>' +
        (can('targets', 'e') ? '<button class="btn" data-action="tgSave">Save targets</button>' : '<span class="note">View only.</span>') + '</div>' +
        fields + '</div>' +
        bdoTargetsPanel(bt) +
        bdoPerfPanel(perf) +
        '<div class="panel"><h2>' + svg('cal') + 'Saved Office Targets</h2><div class="tablewrap"><table><thead><tr><th>Month</th><th>Serving</th><th>Float</th><th>Visits</th><th>APK</th><th>Activeness</th><th>Withdraw</th></tr></thead><tbody>' + hist + '</tbody></table></div></div>';
      btUpdateSum();
      tgUpdateSum();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function tgSave() {
    var body = { month: elById('tgMonth').value };
    OFFICE_DEFS.forEach(function (td) {
      body[td.key] = elById('tg_' + td.key).value;
      body[td.key + '_w'] = elById('tgw_' + td.key).value;
    });
    api('targets_save', { body: body })
      .then(function () { toast('Targets saved for ' + body.month, 'ok'); state.month = body.month; renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function tgUpdateSum() {
    var s = 0;
    OFFICE_DEFS.forEach(function (td) { var el = elById('tgw_' + td.key); if (el) s += Number(el.value) || 0; });
    var el = elById('tgSum');
    if (el) { el.textContent = s; el.style.color = (s === 100 || s === 0) ? 'var(--ok)' : 'var(--bad)'; }
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

  /* ---------------- reports & ranks ---------------- */
  var DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function isoDow(dateStr) { var d = new Date(dateStr + 'T12:00:00'); var n = d.getDay(); return n === 0 ? 7 : n; }
  function viewReports(v) {
    var m = state._repMonth || state.openMonth || curMonth();
    state._repMonth = m;
    var period = state._rankPeriod || 'daily';
    var calls = [api('daily_reports_get', { qs: '&month=' + m }), api('flags_get', { qs: '&month=' + m }),
                 api('rank_get', { qs: '&period=' + period + '&date=' + (state._rankDate || new Date().toISOString().slice(0, 10)) }),
                 api('messages_get')];
    if (can('targets', 'v')) calls.push(api('shortages_get', { qs: '&month=' + m }));
    Promise.all(calls).then(function (rr) {
      var dr = rr[0], fl = rr[1], rk = rr[2], msgs = rr[3], sh = rr[4] || null;

      /* --- daily report matrix: BDO x day, OK / LATE / MISSING(red) --- */
      var byKey = {};
      (dr.reports || []).forEach(function (r) { byKey[r.bdo + '|' + r.date] = r; });
      var today = dr.today;
      var days = [];
      var dim = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate();
      for (var i = 1; i <= dim; i++) {
        var ds = m + '-' + String(i).padStart(2, '0');
        if (ds > today) break;
        days.push(ds);
      }
      var shown = days.slice(-10); // last 10 elapsed days keep the matrix readable
      var head = '<th>BDO</th>' + shown.map(function (ds) { return '<th>' + Number(ds.slice(8)) + '<div class="note">' + DAY_NAMES[isoDow(ds)] + '</div></th>'; }).join('');
      var matrix = (dr.bdos || []).map(function (b) {
        var cells = shown.map(function (ds) {
          var wd = (b.workingDays || []).indexOf(isoDow(ds)) >= 0;
          var r = byKey[b.username + '|' + ds];
          if (r) {
            var cls = r.late ? 'gold' : 'ok', label = r.late ? 'LATE' : 'OK';
            return '<td><span class="pill ' + cls + '" title="Float ' + fmt(r.float) + ', visited ' + r.visited + ', waked ' + r.waked + ', APK ' + r.apk + '">' + label + '</span></td>';
          }
          if (!wd) return '<td><span class="pill dim">-</span></td>';
          return '<td><span class="pill bad" title="No report on a working day">MISS</span></td>';
        }).join('');
        return '<tr><td>' + esc(b.name) + '</td>' + cells + '</tr>';
      }).join('') || '<tr><td class="note">No BDOs yet.</td></tr>';

      /* --- rankings --- */
      var rankRows = (rk.rows || []).map(function (r, i) {
        return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + fmt(r.served) + '</td><td>' + fmt(r.visit) + '</td><td>' + fmt(r.active) + '</td>' + (rk.hasApk ? '<td>' + fmt(r.apk) + '</td>' : '') + '</tr>';
      }).join('') || '<tr><td colspan="6" class="note">No KPI activity in this period.</td></tr>';

      /* --- flags ranking --- */
      var flagRank = (fl.rank || []).map(function (r, i) {
        return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.bdo) + '</td><td><span class="pill bad">' + r.n + ' flag' + (r.n > 1 ? 's' : '') + '</span></td></tr>';
      }).join('') || '<tr><td colspan="3" class="note">No flags this month. Clean.</td></tr>';
      var flagDetails = (fl.flags || []).slice(0, 20).map(function (f) {
        return '<tr><td>' + esc(f.bdo) + '</td><td>' + esc(f.agent_name || f.acc || '') + '</td><td class="note">' + esc(f.detail) + '</td></tr>';
      }).join('');

      /* --- management extras --- */
      var omTools = can('reports', 'e')
        ? '<div class="panel"><h2>' + svg('mail') + 'Send message to all BDOs</h2>' +
          '<div class="row"><input id="msgBody" placeholder="Type the announcement..." style="flex:1;min-width:220px" maxlength="500">' +
          '<button class="btn" data-action="msgSend">Send</button></div>' +
          ((msgs && msgs.length) ? '<div class="note" style="margin-top:8px">Last: "' + esc(msgs[0].body) + '" - ' + esc(msgs[0].from_user) + '</div>' : '') + '</div>' +
          '<div class="panel"><h2>' + svg('cal') + 'Working days</h2>' +
          '<p class="note">Default applies to everyone; override per BDO below (e.g. works Sunday instead of Saturday).</p>' +
          '<div class="row"><div class="field"><label>Default working days</label><input id="wdGlobal" value="' + esc(dr.globalWorkingDays) + '" placeholder="1,2,3,4,5,6"></div>' +
          '<div class="field"><label>BDO override</label><select id="wdBdo">' + (dr.bdos || []).map(function (b) { return '<option value="' + esc(b.username) + '">' + esc(b.name) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label>His days (1=Mon..7=Sun)</label><input id="wdDays" placeholder="1,2,3,4,5,7"></div>' +
          '<button class="btn" data-action="wdSave">Save</button></div>' +
          '<div class="note" style="margin-top:6px">1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat 7=Sun</div></div>'
        : '';
      var shortPanel = (sh !== null)
        ? '<div class="panel"><h2>' + svg('alert') + 'Float shortages (management only)</h2>' +
          '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Amount</th><th>Reason</th><th>Recover by</th><th>Notified?</th><th>When</th></tr></thead><tbody>' +
          ((sh || []).map(function (s) {
            return '<tr><td>' + esc(s.bdo) + '</td><td>' + fmt(s.amount) + '</td><td>' + esc(s.reason) + '</td><td>' + esc(s.recover_by || '-') + '</td>' +
              '<td>' + (Number(s.notified) ? '<span class="pill ok">Yes</span>' : '<span class="pill bad">No</span>') + '</td><td class="note">' + esc((s.at || '').slice(0, 16)) + '</td></tr>';
          }).join('') || '<tr><td colspan="6" class="note">No shortages reported.</td></tr>') + '</tbody></table></div></div>'
        : '';

      v.innerHTML =
        '<h1 class="page-title">Reports &amp; Ranks</h1><p class="page-sub">Daily reports, rankings and flags - visible to every member.</p>' +
        '<div class="panel"><div class="row"><div class="field"><label>Month</label><input id="repMonth" type="month" value="' + esc(m) + '"></div>' +
        '<button class="btn" data-action="repLoad">Load</button></div></div>' +
        omTools +
        '<div class="panel"><h2>' + svg('cal') + 'Daily reports - last ' + shown.length + ' days</h2>' +
        '<p class="note"><span class="pill ok">OK</span> on time &middot; <span class="pill gold">LATE</span> after midnight &middot; <span class="pill bad">MISS</span> working day without a report</p>' +
        '<div class="tablewrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + matrix + '</tbody></table></div></div>' +
        '<div class="panel"><h2>' + svg('chart') + 'BDO Ranking</h2>' +
        '<div class="row" style="margin-bottom:8px">' +
        ['daily', 'weekly', 'monthly'].map(function (p) { return '<button class="role-chip' + (p === period ? ' active' : '') + '" data-action="rankPeriod" data-p="' + p + '">' + p.charAt(0).toUpperCase() + p.slice(1) + '</button>'; }).join('') +
        '<div class="field"><label>Date</label><input id="rankDate" type="date" value="' + esc(state._rankDate || new Date().toISOString().slice(0, 10)) + '"></div>' +
        '<button class="ghost" data-action="rankLoad">Load</button>' +
        '<div class="spacer"></div><span class="note">' + esc(rk.from) + (rk.from !== rk.to ? ' to ' + esc(rk.to) : '') + '</span></div>' +
        '<div class="tablewrap"><table><thead><tr><th>#</th><th>BDO</th><th>Unique Served</th><th>Visits (ODK)</th><th>Activeness</th>' + (rk.hasApk ? '<th>APK</th>' : '') + '</tr></thead><tbody>' + rankRows + '</tbody></table></div></div>' +
        '<div class="panel"><h2>' + svg('alert') + 'Flagged BDOs - ' + esc(fl.month) + ' (most to fewest)</h2>' +
        '<p class="note">A flag = claimed served, but the released performance file said NOT served.</p>' +
        '<div class="tablewrap"><table><thead><tr><th>#</th><th>BDO</th><th>Flags</th></tr></thead><tbody>' + flagRank + '</tbody></table></div>' +
        (flagDetails ? '<div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>BDO</th><th>Agent</th><th>Detail</th></tr></thead><tbody>' + flagDetails + '</tbody></table></div>' : '') +
        '</div>' + shortPanel;
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function msgSend() {
    api('message_send', { body: { body: elById('msgBody').value } })
      .then(function () { toast('Message sent to all BDOs', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function wdSave() {
    var per = {};
    var bdo = elById('wdBdo') ? elById('wdBdo').value : '';
    var days = elById('wdDays') ? elById('wdDays').value.trim() : '';
    if (bdo && days) per[bdo] = days;
    api('working_days_save', { body: { global: elById('wdGlobal').value.trim(), perBdo: per } })
      .then(function () { toast('Working days saved', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }

  /* ---------------- admin: users + permissions ---------------- */
  function viewAdmin(v) {
    Promise.all([api('admin_meta'), api('admin_perms'), api('admin_users'), api('admin_audit'), api('me')]).then(function (r) {
      var meta = r[0], matrix = r[1], users = r[2], audit = r[3], me = r[4];
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

      /* superadmin secures his own account with an authenticator app */
      var twofaPanel = state.user.role === 'superadmin'
        ? '<div class="panel"><h2>' + svg('lock') + 'Two-step verification (2FA)</h2>' +
          (me.user.totp_on
            ? '<p class="note">2FA is <span class="pill ok">ON</span> for <b>' + esc(state.user.username) + '</b> - signing in needs your password <b>plus</b> the 6-digit code from your authenticator app.</p>' +
              '<div class="row"><div class="field"><label>Current 6-digit code</label><input id="tfOff" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"></div>' +
              '<button class="danger" data-action="totpDisable">Turn off 2FA</button></div>'
            : '<p class="note">2FA is <span class="pill bad">OFF</span>. Protect this account: after enabling, signing in needs your password <b>plus</b> a 6-digit code from <b>Google Authenticator</b> (or any authenticator app). If you ever lose the phone, another super admin - or phpMyAdmin (clear <code>users.totp_secret</code>) - can rescue you.</p>' +
              '<button class="btn" data-action="totpSetup">' + svg('lock') + ' Enable 2FA</button>') +
          '</div>'
        : '';
      v.innerHTML =
        '<h1 class="page-title">Admin</h1><p class="page-sub">Members, roles, access control and activity.</p>' +
        twofaPanel +
        '<div class="panel"><h2>' + svg('users') + 'Members</h2>' +
        '<div class="row" style="margin-bottom:14px">' +
        '<div class="field"><label>Username</label><input id="nuUser" placeholder="e.g. amina"></div>' +
        '<div class="field"><label>Full name</label><input id="nuName" placeholder="Amina Said"></div>' +
        '<div class="field"><label>Role</label><select id="nuRole">' + roleOpts + '</select></div>' +
        '<div class="field"><label>Station</label><input id="nuStation" placeholder="Arusha"></div>' +
        '<div class="field"><label>Password</label><input id="nuPass" placeholder="min 8 chars"></div>' +
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
    if (a === 'toggleTheme') { toggleTheme(); return; }
    if (a === 'toggleLang') { toggleLang(); return; }
    if (a === 'logout') { doLogout(); return; }
    if (a === 'backToLogin') { renderLogin(); return; }
    if (a === 'totpSetup') { api('totp_setup').then(totpSetupModal).catch(function (e2) { toast(e2.message, 'err'); }); return; }
    if (a === 'totpEnable') {
      api('totp_enable', { body: { code: elById('tfCode').value.trim() } })
        .then(function () { closeModal(); toast('2FA is ON - next sign-in will ask for your code', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'totpDisable') {
      api('totp_disable', { body: { code: elById('tfOff').value.trim() } })
        .then(function () { toast('2FA turned off', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'pwd') { pwdModal(); return; }
    if (a === 'pwdSave') { pwdSave(); return; }
    if (a === 'closeModal') { closeModal(); return; }
    if (a === 'dashLoad') { state.month = elById('dashMonth').value; renderTab(); return; }
    if (a === 'agentClear') { state._agentSearch = ''; state.agentPage = 1; var si = elById('agentSearch'); if (si) si.value = ''; agentsBodyLoad(); return; }
    if (a === 'prevPage') { state.agentPage = Math.max(1, (state.agentPage || 1) - 1); agentsBodyLoad(); return; }
    if (a === 'nextPage') { state.agentPage = (state.agentPage || 1) + 1; agentsBodyLoad(); return; }
    if (a === 'kpiMark') {
      /* tap-and-CONFIRM: first tap arms the chip, second tap (within 4s) marks */
      if (node.getAttribute('data-armed')) {
        node.removeAttribute('data-armed'); node.classList.remove('arm');
        kpiMark(node.getAttribute('data-id'), node.getAttribute('data-kpi'), node.getAttribute('data-name'), node);
      } else {
        node.setAttribute('data-armed', '1'); node.setAttribute('data-label', node.innerHTML);
        node.classList.add('arm'); node.innerHTML = t('Confirm?');
        setTimeout(function () {
          if (node.getAttribute('data-armed')) {
            node.removeAttribute('data-armed'); node.classList.remove('arm');
            node.innerHTML = node.getAttribute('data-label');
          }
        }, 4000);
      }
      return;
    }
    if (a === 'kpiUnmark') { kpiUnmark(node.getAttribute('data-id'), node.getAttribute('data-kpi')); return; }
    if (a === 'locConfirm') { var lv2 = elById('locInput').value.trim(); if (!lv2) { toast('Type the physical location', 'warn'); return; } var n2 = state._locNode; closeModal(); kpiMark(node.getAttribute('data-id'), node.getAttribute('data-kpi'), node.getAttribute('data-name'), n2, lv2); return; }
    if (a === 'setLoc') { setLocModal(node.getAttribute('data-id'), node.getAttribute('data-name')); return; }
    if (a === 'setLocGo') { api('agent_location_set', { body: { agentId: Number(node.getAttribute('data-id')), location: elById('locInput').value } }).then(function () { closeModal(); toast('Location saved', 'ok'); renderTab(); }).catch(function (e2) { toast(e2.message, 'err'); }); return; }
    if (a === 'togglePw') { var pi = elById(node.getAttribute('data-for')); if (pi) pi.type = pi.type === 'password' ? 'text' : 'password'; return; }
    if (a === 'locExport') { locExport(); return; }
    if (a === 'drSave') { drSave(); return; }
    if (a === 'shortage') { shortageModal(); return; }
    if (a === 'shortageSave') { shortageSave(); return; }
    if (a === 'msgSend') { msgSend(); return; }
    if (a === 'wdSave') { wdSave(); return; }
    if (a === 'repLoad') { state._repMonth = elById('repMonth').value; renderTab(); return; }
    if (a === 'rankPeriod') { state._rankPeriod = node.getAttribute('data-p'); renderTab(); return; }
    if (a === 'rankLoad') { state._rankDate = elById('rankDate').value; renderTab(); return; }
    if (a === 'dashSettingsSave') { dashSettingsSave(); return; }
    if (a === 'inactMode') { state._inactMode = node.getAttribute('data-m'); inactivePanelLoad(); return; }
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
    if (n && n.id === 'agentPer') { state.agentPer = Number(n.value); state.agentPage = 1; agentsBodyLoad(); return; }
    if (n && n.classList && n.classList.contains('kpivis')) { var lbl = n.closest('label'); if (lbl) lbl.classList.toggle('on', n.checked); return; }
  }
  var _searchTimer = null;
  function onInput(e) {
    if (e.target && e.target.classList && e.target.classList.contains('bt-w')) { btUpdateSum(); return; }
    if (e.target && e.target.classList && e.target.classList.contains('tg-w')) { tgUpdateSum(); return; }
    if (e.target && e.target.id === 'agentSearch') {
      /* live search from the first letter, tight debounce for speed */
      clearTimeout(_searchTimer);
      var val = e.target.value.trim();
      _searchTimer = setTimeout(function () {
        state._agentSearch = val; state.agentPage = 1; agentsBodyLoad();
      }, 150);
    }
  }
  function onSubmit(e) {
    if (e.target && e.target.id === 'loginForm') { e.preventDefault(); doLogin(); }
    if (e.target && e.target.id === 'twofaForm') { e.preventDefault(); do2fa(); }
  }
  function onKeydown(e) { if (e.key === 'Escape') closeModal(); }

  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onKeydown);
  boot();

  /* PWA: installable on phones; the worker is network-first so users always
   * get the newest version while online - cache is only an offline fallback. */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* http or old browser - fine */ });
  }
})();
