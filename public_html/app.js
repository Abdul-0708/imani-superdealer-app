/* IMANI SUPERDEALER - front-end SPA (PHP backend, session auth). */
(function () {
  'use strict';

  /* Must match APP_VERSION in lib/helpers.php. If they differ, only SOME files
   * were uploaded - the app says so loudly instead of behaving strangely. */
  var APP_VERSION = '1.18.0';

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
    'Wake': 'Amsha',
    'Take a photo of the agent\'s TRANSACTION RECEIPTS as proof he is transacting again. Management can open it from his chip.':
      'Piga picha ya RISITI ZA MIAMALA ya wakala kama uthibitisho kwamba anafanya miamala tena. Uongozi unaweza kuifungua kwenye chip yake.',
    'Receipt photo': 'Picha ya risiti',
    'Save proof & wake': 'Hifadhi uthibitisho & amsha',
    'Take the receipt photo first': 'Piga picha ya risiti kwanza',
    'Receipt proof': 'Uthibitisho wa risiti',
    'Close': 'Funga',
    'Cancel': 'Ghairi',
    'That file is not a photo': 'Faili hilo si picha',
    'Recruit new agent': 'Sajili wakala mpya',
    'Fill the new agent\'s details - he joins your base as NEW + ACTIVE and counts in your Activeness.':
      'Jaza taarifa za wakala mpya - anaingia kwenye base yako kama MPYA + ACTIVE na anahesabika kwenye Activeness yako.',
    'Save new agent': 'Hifadhi wakala mpya',
    'Agent added - counted in your Activeness': 'Wakala ameongezwa - amehesabika kwenye Activeness yako',
    'No photo? Confirm by words - how are you SURE he transacted?': 'Huna picha? Thibitisha kwa maneno - una uhakika gani kwamba alifanya miamala?',
    'e.g. I saw his float statement at the branch today': 'mf. Nimeona taarifa yake ya float tawini leo',
    'Last tx': 'Muamala wa mwisho',
    'Last month': 'Mwezi uliopita',
    'Now': 'Sasa',
    'days ago': 'siku zilizopita',
    'WON\'T RETURN': 'HATARUDI',
    'Won\'t return': 'Hatarudi',
    'Undo won\'t-return': 'Ondoa hatarudi',
    'Only mark this if you CONTACTED the agent and he CONFIRMED he will not return to work. He goes on the deletion-discussion list the OM can download.':
      'Weka alama hii tu kama ULIWASILIANA na wakala na AKATHIBITISHA kwamba hatarudi kazini. Anaingia kwenye orodha ya majadiliano ya kufutwa ambayo OM anaweza kupakua.',
    'Note (what did he say?)': 'Maelezo (alisema nini?)',
    'e.g. moved to Dodoma, sold the POS': 'mf. amehamia Dodoma, ameuza POS',
    'Mark won\'t return': 'Weka hatarudi',
    'Marked - on the deletion-discussion list': 'Imewekwa - yupo kwenye orodha ya majadiliano ya kufutwa',
    'Removed from the won\'t-return list': 'Ameondolewa kwenye orodha ya hatarudi',
    'Recruitment pipeline': 'Mchakato wa usajili',
    'New agent form': 'Fomu ya wakala mpya',
    'New agent form (stage 1)': 'Fomu ya wakala mpya (hatua 1)',
    'The form is submitted at the branch and held by the BANK CHAMPION. It moves: audit -> approved -> paid & POS -> acc + location (becomes a real agent, counted in your Activeness).':
      'Fomu inawasilishwa tawini na kushikiliwa na BANK CHAMPION. Inapita: ukaguzi -> kuidhinishwa -> kulipa & POS -> acc + mahali (anakuwa wakala kamili, anahesabika kwenye Activeness yako).',
    'Save form': 'Hifadhi fomu',
    'Form saved - stage 1': 'Fomu imehifadhiwa - hatua 1',
    'Passed bank audit?': 'Amepita ukaguzi wa benki?',
    'Approved?': 'Ameidhinishwa?',
    'Paid & POS assigned?': 'Amelipa & amepewa POS?',
    'Fill acc & location': 'Jaza acc & mahali',
    'Finish: make him a real agent': 'Malizia: mfanye wakala kamili',
    'paid and POS assigned. Fill his acc number and physical location; he becomes ACTIVE and counts in your Activeness.':
      'amelipa na amepewa POS. Jaza namba yake ya acc na mahali alipo; anakuwa ACTIVE na anahesabika kwenye Activeness yako.',
    'Create agent': 'Tengeneza wakala',
    'Agent created - counted in your Activeness': 'Wakala ametengenezwa - amehesabika kwenye Activeness yako',
    'Moved to stage': 'Amehamia hatua',
    'No forms yet - tap "New agent form" to start one.': 'Hakuna fomu bado - gusa "Fomu ya wakala mpya" kuanza.',
    'Recruit': 'Msajiliwa',
    'Stages': 'Hatua',
    'DONE': 'IMEKAMILIKA',
    'GOOD MORNING': 'HABARI ZA ASUBUHI',
    'GOOD AFTERNOON': 'HABARI ZA MCHANA',
    'GOOD EVENING': 'HABARI ZA JIONI',
    'WELCOME': 'KARIBU',
    'Messages': 'Ujumbe',
    'Your box': 'Sanduku lako',
    'Newest first. Reply to the sender, or delete a message from your own box once read.':
      'Mpya kwanza. Jibu aliyetuma, au futa ujumbe kwenye sanduku lako baada ya kuusoma.',
    'Reply': 'Jibu',
    'Reply to': 'Jibu kwa',
    'Your reply': 'Jibu lako',
    'Send reply': 'Tuma jibu',
    'Reply sent': 'Jibu limetumwa',
    'Delete for me': 'Futa kwangu',
    'Message removed from your inbox': 'Ujumbe umeondolewa kwenye sanduku lako',
    'No messages yet.': 'Hakuna ujumbe bado.',
    'everyone': 'wote',
    'to you': 'kwako',
    'to management': 'kwa uongozi',
    'MARKET FEEDBACK': 'MREJESHO WA SOKO',
    'REPLY': 'JIBU',
    'Market feedback - complaints, opinions, suggestions': 'Mrejesho wa soko - malalamiko, maoni na mapendekezo',
    'What you face in the market goes straight to your team leader and the operational manager.':
      'Unachokutana nacho sokoni kinaenda moja kwa moja kwa kiongozi wa timu na meneja wa uendeshaji.',
    'e.g. agents in Kaloleni complain about float delays...': 'mf. mawakala wa Kaloleni wanalalamika kuchelewa kwa float...',
    'Send to management': 'Tuma kwa uongozi',
    'Sent to your team leader and the OM': 'Imetumwa kwa kiongozi wa timu na OM',
    'My route plan today': 'Mpango wangu wa njia leo',
    'Write the places you are going to visit BEFORE 10:00 EAT. Your team leader approves it.':
      'Andika sehemu utakazotembelea KABLA ya saa nne asubuhi (10:00 EAT). Kiongozi wa timu ataidhinisha.',
    'e.g. Kaloleni -> Sakina -> Njiro, then HYDOM branch': 'mf. Kaloleni -> Sakina -> Njiro, kisha tawi la HYDOM',
    'Send route plan': 'Tuma mpango wa njia',
    'Update plan': 'Sasisha mpango',
    'Resend plan': 'Tuma tena mpango',
    'waiting for your team leader': 'inasubiri kiongozi wa timu',
    'Route plans close at 10:00 EAT - ask your team leader to assign one.':
      'Mipango ya njia inafungwa saa nne asubuhi - muombe kiongozi wa timu akupangie.',
    'Route plan sent - waiting for your team leader': 'Mpango wa njia umetumwa - unasubiri kiongozi wa timu',
    'CLOSED': 'IMEFUNGWA',
    'My report days': 'Siku zangu za ripoti',
    'Your report days and the top performers': 'Siku zako za ripoti na wanaoongoza',
    'Top performing - weighted score': 'Wanaoongoza - alama ya uzito',
    'Weighted score': 'Alama ya uzito',
    'on time': 'kwa wakati',
    'Search in': 'Tafuta kwenye',
    'Everything': 'Kila kitu',
    'Any': 'Yoyote',
    'From (EAT)': 'Kuanzia (EAT)',
    'To (EAT)': 'Hadi (EAT)',
    'All day': 'Siku nzima',
    'Morning': 'Asubuhi',
    'Afternoon': 'Mchana',
    'Evening': 'Jioni',
    'Download window': 'Pakua kipindi',
    'Every KPI your BDOs ticked inside the chosen time window (EAT).': 'Kila KPI ambayo BDO wako waliweka ndani ya kipindi ulichochagua (EAT).',
    'Showing': 'Inaonyesha',
    'Flags': 'Alama',
    'Every BDO live mark cross-checked against the uploaded performance file. Matched = both agree, Mismatch = the file said NOT.':
      'Kila alama ya BDO inalinganishwa na faili la utendaji lililopakiwa. Zimelingana = zote zinakubaliana, Hazikulingana = faili linasema SIVYO.',
    'Per BDO x KPI': 'Kwa BDO x KPI',
    'matched vs mismatch': 'zimelingana dhidi ya hazikulingana',
    'Green = matched, red = mismatch. Bigger red = more suspicious claims.': 'Kijani = zimelingana, nyekundu = hazikulingana. Nyekundu kubwa = madai mengi ya shaka.',
    'Every claim': 'Kila madai',
    'BDO, agent name, acc, branch, station': 'BDO, jina la wakala, acc, tawi, kituo',
    'Matched': 'Zimelingana',
    'Flagged': 'Zenye alama',
    'MISMATCH': 'HAZIKULINGANA',
    'MATCHED': 'ZIMELINGANA',
    'mismatch': 'hazikulingana',
    'matched': 'zimelingana',
    'shown': 'zinaonyeshwa',
    'No live BDO marks in this month yet.': 'Hakuna alama za moja kwa moja za BDO mwezi huu bado.',
    'Flag details moved to their own tab.': 'Maelezo ya alama yamehamishiwa kwenye tabu yao.',
    'Open Flags': 'Fungua Alama',
    'All BDOs': 'BDO wote',
    'All': 'Zote',
    'Load': 'Pakia',
    'Detail': 'Maelezo',
    'Branch': 'Tawi',
    'Station': 'Kituo',
    'When': 'Wakati',
    'Agent': 'Wakala',
    'Status updated': 'Hali imesasishwa',
    'Field Tasks': 'Kazi za Uwandani',
    'Agents you can CLAIM. They join your base only once you act on them - they do not touch your performance until then.':
      'Mawakala unaoweza KUCHUKUA. Wanaingia kwenye base yako pale tu utakapowashughulikia - hawaathiri utendaji wako kabla ya hapo.',
    'Special agents - served by PARTNERS': 'Mawakala maalum - waliohudumiwa na PARTNERS',
    'The partner served these agents. Visit them, capture the physical location and take them into your base.':
      'Partner aliwahudumia mawakala hawa. Watembelee, chukua mahali walipo na uwaingize kwenye base yako.',
    'No partner-served agents right now.': 'Hakuna mawakala waliohudumiwa na partners kwa sasa.',
    'Set location': 'Weka mahali',
    'located': 'ana mahali',
    'partner-served agents are waiting to be claimed.': 'mawakala waliohudumiwa na partners wanasubiri kuchukuliwa.',
    'Open Field Tasks': 'Fungua Kazi za Uwandani',
    'Activeness - wake or recruit': 'Activeness - amsha au sajili',
    'Both count in the SAME Activeness KPI this month: agents you WAKE and brand-new agents you RECRUIT.':
      'Vyote vinahesabika kwenye KPI moja ya Activeness mwezi huu: mawakala unaoWAAMSHA na mawakala WAPYA unaoWASAJILI.',
    'Wake inactive agents': 'Amsha mawakala walio inactive',
    'Live work today': 'Kazi za leo moja kwa moja',
    'Every KPI your BDOs tick today, with the exact time (EAT).': 'Kila KPI ambayo BDO wako wanaweka leo, na saa kamili (EAT).',
    'Day': 'Siku',
    'Refresh': 'Onyesha upya',
    'Download day': 'Pakua siku',
    'No live work yet today.': 'Hakuna kazi bado leo.',
    'Nothing ticked yet today.': 'Hakuna iliyowekwa alama bado leo.',
    'Every tick, newest first': 'Kila alama, mpya kwanza',
    'New agent forms today': 'Fomu za wakala mpya leo',
    'Confirmed won\'t return today': 'Waliothibitisha hawatarudi leo',
    'Nothing to download for this day': 'Hakuna cha kupakua kwa siku hii',
    'ticks exported': 'alama zimepakuliwa',
    'proof': 'uthibitisho',
    'Activeness': 'Activeness',
    'Visits': 'Visits',
    'Served': 'Served',
    'App files do not match': 'Faili za mfumo hazilingani',
    'Browser files are version': 'Faili za kivinjari ni toleo',
    'the server is': 'seva ni',
    'Only some files were uploaded. Re-deploy every file, then press Ctrl+F5.':
      'Baadhi tu ya faili zilipakiwa. Pakia faili zote tena, kisha bonyeza Ctrl+F5.',
    'Marking is switched off': 'Kuweka alama kumezimwa',
    'Your role cannot mark KPIs - ask the admin to switch ON "My Agent Base -> Edit" for your role.':
      'Cheo chako hakiwezi kuweka KPI - muombe admin awashe "My Agent Base -> Edit" kwa cheo chako.',
    'The month is': 'Mwezi ni',
    'KPIs can only be marked while the month is OPEN.': 'KPI zinawekwa tu wakati mwezi uko OPEN.',
    'Theme': 'Muonekano',
    'Choose theme': 'Chagua muonekano',
    'Pick the colours you like. Saved on this device.': 'Chagua rangi unazopenda. Zinahifadhiwa kwenye kifaa hiki.',
    'Fire orange': 'Fire orange',
    'Fire green & white': 'Fire green na nyeupe',
    'Fire yellow & white': 'Fire yellow na nyeupe',
    'Fire blue & white': 'Fire blue na nyeupe',
    'the original': 'ya awali',
    'light': 'nyeupe',
    'Fire orange mode': 'Hali ya fire orange',
    'Done': 'Nimemaliza',
    'Were-ACTIVE-last-month first: they went silent - wake them before month end. Waking asks for receipt proof and the physical location.':
      'Waliokuwa ACTIVE mwezi uliopita kwanza: wamekaa kimya - waamshe kabla mwezi haujaisha. Kuamsha kunahitaji uthibitisho wa risiti na mahali alipo.',
    'My Dashboard': 'Dashibodi Yangu',
    'your own performance only': 'utendaji wako pekee',
    'Month': 'Mwezi',
    'Inactive visited': 'Inactive waliotembelewa',
    'Waked up': 'Walioamshwa',
    'Forms submitted': 'Fomu zilizowasilishwa',
    'became agents': 'wamekuwa mawakala',
    'waked + won\'t-return': 'walioamshwa + hatarudi',
    'computed from your agent list and forms - nothing to type, nothing to forget':
      'imehesabiwa kutoka orodha yako ya mawakala na fomu - hakuna cha kuandika, hakuna cha kusahau',
    'Your target: inactive agents waked + new agents recruited. Nothing else counts.':
      'Lengo lako: mawakala inactive walioamshwa + mawakala wapya waliosajiliwa. Hakuna kingine kinachohesabika.',
    'New agent - which one?': 'Wakala mpya - ipi?',
    'Pick what you have in front of you.': 'Chagua ulichonacho mbele yako.',
    'Agent recruited ALREADY': 'Wakala AMESHASAJILIWA',
    'type name, acc, branch, phone, location - done': 'andika jina, acc, tawi, simu, mahali - imekamilika',
    'Form of agent TO BE SUBMITTED': 'Fomu ya wakala ITAKAYOWASILISHWA',
    'follows the stages: audit, approval, POS, acc': 'inafuata hatua: ukaguzi, idhini, POS, acc',
    'Confirm his physical location (for the follow-up)': 'Thibitisha mahali alipo (kwa ufuatiliaji)',
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
  /* Mirrors the server: a FIELD user (a BDO who marks his own base) never gets
   * management override powers, even if someone ticks "agents: Edit" for his
   * role in Access Control. Managers = OM / super admin. */
  function isFieldUser() {
    if (state.user && state.user.role === 'superadmin') return false;
    return can('mybase', 'e');
  }
  function isManager() {
    if (state.user && state.user.role === 'superadmin') return true;
    if (isFieldUser()) return false;
    return can('agents', 'e');
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
  /* ---------------- themes: 4 colour palettes ----------------
   * 'fire'   = the original look (dark by default, Light/Dark switch applies)
   * the three "& white" palettes always ride on the light base. */
  var PALETTES = [
    { key: 'fire', label: 'Fire orange', sub: 'the original', dot: 'linear-gradient(135deg,#ff5400,#ff9a1f,#ffd84a)' },
    { key: 'green', label: 'Fire green & white', sub: 'light', dot: 'linear-gradient(135deg,#0b8043,#0f9d58,#57c98a)' },
    { key: 'yellow', label: 'Fire yellow & white', sub: 'light', dot: 'linear-gradient(135deg,#f9ab00,#ffc93c,#ffe08a)' },
    { key: 'blue', label: 'Fire blue & white', sub: 'light', dot: 'linear-gradient(135deg,#1557b0,#1a73e8,#6fa8f5)' }
  ];
  function curPal() {
    var p = localStorage.getItem('imani_pal') || 'fire';
    return PALETTES.some(function (x) { return x.key === p; }) ? p : 'fire';
  }
  function applyTheme() {
    var pal = curPal();
    var light = localStorage.getItem('imani_theme') === 'light';
    document.body.classList.remove('pal-green', 'pal-yellow', 'pal-blue');
    if (pal !== 'fire') { document.body.classList.add('pal-' + pal); light = true; } // white palettes
    document.body.classList.toggle('light', light);
  }
  function setPalette(p) {
    localStorage.setItem('imani_pal', p);
    if (p !== 'fire') localStorage.setItem('imani_theme', 'light');
    applyTheme();
  }
  function toggleTheme() {
    var light = !document.body.classList.contains('light');
    localStorage.setItem('imani_theme', light ? 'light' : 'dark');
    if (light === false) localStorage.setItem('imani_pal', 'fire'); // dark = fire only
    applyTheme();
    renderShell();
  }
  /* picker: 4 palettes + a Dark/Light switch for the fire palette */
  function themePicker() {
    var pal = curPal();
    var opts = PALETTES.map(function (p) {
      return '<button class="pal-opt' + (p.key === pal ? ' on' : '') + '" data-action="palSet" data-p="' + p.key + '">' +
        '<span class="pal-dot" style="background:' + p.dot + '"></span>' +
        '<span>' + esc(t(p.label)) + '<br><span class="note">' + esc(t(p.sub)) + '</span></span></button>';
    }).join('');
    var isLight = document.body.classList.contains('light');
    openModal('<h2>' + svg('flame') + ' ' + t('Choose theme') + '</h2>' +
      '<p class="note">' + t('Pick the colours you like. Saved on this device.') + '</p>' +
      '<div class="pal-grid">' + opts + '</div>' +
      (pal === 'fire'
        ? '<div class="row" style="margin-top:12px;align-items:center"><span class="note">' + t('Fire orange mode') + '</span>' +
          '<div class="spacer"></div><button class="ghost" data-action="toggleTheme">' +
          (isLight ? svg('flame') + ' ' + t('Dark') : svg('eye') + ' ' + t('Light')) + '</button></div>'
        : '') +
      '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
      '<button class="btn" data-action="closeModal">' + t('Done') + '</button></div>');
  }

  /* ---------------- icons (inline SVG, stroke) ---------------- */
  var ICON = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    upload: '<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
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
    { key: 'flags', label: 'Flags', icon: 'alert' },
    { key: 'field', label: 'Field Tasks', icon: 'pin' },
    { key: 'inbox', label: 'Messages', icon: 'mail' },
    { key: 'data', label: 'Data Manager', icon: 'alert' },
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
    api('me').then(function (d) { state.user = d.user; state.perms = d.perms; state.serverVersion = d.serverVersion; state.tab = defaultTab(); render(); })
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
      .then(function (d) { state.user = d.user; state.perms = d.perms; state.serverVersion = d.serverVersion; state.tab = defaultTab(); render(); })
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
      if (m.key === 'data') return isManager(); // OM/superadmin data manager ONLY
      if (m.key === 'inbox') return true; // everyone has a message box
      if (m.key === 'field') return can('mybase', 'v'); // BDO take-over + wake list
      if (m.key === 'flags') return isManager(); // OM / super admin only
      if (m.key === 'dashboard') return can('dashboard', 'v') || can('mybase', 'v'); // BDOs get a PERSONAL dashboard
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
      '<div class="sb-actions"><button class="ghost tiny" id="themeBtn" data-action="themePick" title="' + esc(t('Choose theme')) + '">' +
      svg('flame') + ' ' + t('Theme') + '</button>' +
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
    else if (state.tab === 'data') viewData(v);
    else if (state.tab === 'inbox') viewInbox(v);
    else if (state.tab === 'field') viewField(v);
    else if (state.tab === 'flags') viewFlags(v);
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
        state.user = d.user; state.perms = d.perms; state.serverVersion = d.serverVersion; state.tab = defaultTab(); render();
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
  /* Time-of-day greeting on the EAT (+3 Nairobi) business clock. */
  function greetingLine() {
    var h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Nairobi' }).format(new Date()));
    var g = h < 12 ? t('GOOD MORNING') : h < 17 ? t('GOOD AFTERNOON') : t('GOOD EVENING');
    var first = (state.user && state.user.name ? state.user.name : '').split(' ')[0] || (state.user ? state.user.username : '');
    return '<div class="greet">' + g + ', ' + esc(first.toUpperCase()) + ' &mdash; ' + t('WELCOME') + ' 👋</div>';
  }
  /* BDO: HIS OWN performance only - no office KPIs, no office targets. */
  function personalDashboard(v) {
    var calls = [api('base')];
    if (isSpecial()) calls.push(api('specialist_summary'));
    Promise.all(calls).then(function (rr) {
      var d = rr[0], sum = rr[1];
      var perf = d.performance;
      var cards;
      if (sum) {
        /* activeness specialist: computed straight from his taps + forms */
        cards = card('users', t('Inactive visited'), fmt(sum.inactiveVisited), t('waked + won\'t-return')) +
          card('zap', t('Waked up'), fmt(sum.waked)) +
          card('alert', t('Won\'t return'), fmt(sum.wontReturn)) +
          card('check', t('Forms submitted'), fmt(sum.formsSubmitted), t('became agents') + ': ' + fmt(sum.recruited));
      } else {
        cards = card('flame', t('Priority'), fmt(d.counts.priority), t('served last month')) +
          card('users', t('Total Base'), fmt(d.counts.total)) +
          card('check', t('My Served'), fmt(d.counts.served)) +
          card('cal', t('Month'), d.month + (d.monthStatus ? ' · ' + d.monthStatus : ''));
      }
      v.innerHTML =
        greetingLine() + '<h1 class="page-title">' + t('My Dashboard') + '</h1>' +
        '<p class="page-sub">' + esc(d.month) + ' &middot; ' + t('your own performance only') + '</p>' +
        '<div class="grid cards" style="margin-bottom:16px">' + cards + '</div>' +
        (perf
          ? '<div class="panel"><h2>' + svg('percent') + t('My Performance') + ' ' + flagPill(perf.flag, perf.score) + '</h2>' +
            (sum ? '<p class="note">' + t('Your target: inactive agents waked + new agents recruited. Nothing else counts.') + '</p>' : '') +
            perfBars(perf.kpis) + '</div>'
          : '<div class="panel"><div class="note">' + t('Your OM has not set your targets for') + ' ' + esc(d.month || '') + ' ' + t('yet - your weighted score will appear here.') + '</div></div>');
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* ---------------- LIVE WORK OF THE DAY (management) ----------------
   * Every KPI a BDO ticked today with the exact time - "Calvin served X at
   * 09:42". Refreshes on demand and downloads to Excel. */
  function liveTodayLoad() {
    var box = elById('liveBox'); if (!box) return;
    var date = (elById('liveDate') && elById('liveDate').value) || isoToday();
    var from = (elById('liveFrom') && elById('liveFrom').value) || '00:00';
    var to = (elById('liveTo') && elById('liveTo').value) || '23:59';
    box.innerHTML = '<div class="skel skel-line"></div><div class="skel skel-line"></div>';
    api('live_today', { qs: '&date=' + date + '&from=' + from + '&to=' + to }).then(function (d) {
      state._live = d;
      var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Activeness' };
      var cards = card('check', t('Served'), fmt(d.perKpi.served)) +
        card('target', t('Visits'), fmt(d.perKpi.visit)) +
        card('rotate', 'APK', fmt(d.perKpi.apk)) +
        card('zap', t('Activeness'), fmt(d.perKpi.active));
      var byBdo = (d.perBdo || []).map(function (b) {
        return '<tr><td>' + esc(b.name) + '</td><td>' + fmt(b.served) + '</td><td>' + fmt(b.visit) + '</td>' +
          '<td>' + fmt(b.apk) + '</td><td>' + fmt(b.active) + '</td><td><b>' + fmt(b.total) + '</b></td></tr>';
      }).join('') || '<tr><td colspan="6" class="note">' + t('No live work yet today.') + '</td></tr>';
      var feed = (d.marks || []).slice(0, 200).map(function (m) {
        var pill = m.kpi === 'served' ? 'ok' : m.kpi === 'active' ? 'gold' : 'fire';
        return '<tr><td><b>' + esc(m.time) + '</b></td><td>' + esc(m.bdoName) + '</td>' +
          '<td class="c-name">' + esc(m.agent) + '<div class="note">' + esc(m.acc) + '</div></td>' +
          '<td>' + esc(m.branch || '-') + '</td><td>' + esc(m.station || '-') + '</td>' +
          '<td><span class="pill ' + pill + '">' + (KL[m.kpi] || m.kpi) + '</span>' +
          (m.hasProof ? ' <span class="pill dim">' + t('proof') + '</span>' : '') + '</td></tr>';
      }).join('') || '<tr><td colspan="6" class="note">' + t('Nothing ticked yet today.') + '</td></tr>';
      var extras = '';
      if ((d.recruits || []).length) {
        extras += '<h3 style="font-size:13px;margin:14px 0 6px">' + t('New agent forms today') + ' (' + d.recruits.length + ')</h3>' +
          '<div class="tablewrap"><table><thead><tr><th>Time</th><th>BDO</th><th>Agent</th><th>Branch</th><th>Champion</th></tr></thead><tbody>' +
          d.recruits.map(function (r) {
            return '<tr><td><b>' + esc(r.time) + '</b></td><td>' + esc(r.bdoName) + '</td><td>' + esc(r.name) + '</td><td>' + esc(r.branch) + '</td><td>' + esc(r.champion) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      if ((d.wontReturn || []).length) {
        extras += '<h3 style="font-size:13px;margin:14px 0 6px">' + t('Confirmed won\'t return today') + ' (' + d.wontReturn.length + ')</h3>' +
          '<div class="tablewrap"><table><thead><tr><th>Time</th><th>BDO</th><th>Agent</th><th>Note</th></tr></thead><tbody>' +
          d.wontReturn.map(function (r) {
            return '<tr><td><b>' + esc(r.time) + '</b></td><td>' + esc(r.bdoName) + '</td><td>' + esc(r.agent) + '</td><td class="note">' + esc(r.note || '') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      var winTag = '<span class="pill dim">' + esc(d.from || '00:00') + ' &ndash; ' + esc(d.to || '23:59') + ' EAT</span>';
      box.innerHTML =
        '<div class="row" style="margin-bottom:8px"><span class="note">' + t('Showing') + ' ' + winTag + ' &middot; ' + esc(d.date) + '</span></div>' +
        '<div class="grid cards" style="margin-bottom:12px">' + cards + '</div>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Served</th><th>Visit</th><th>APK</th><th>Active</th><th>Total</th></tr></thead><tbody>' + byBdo + '</tbody></table></div>' +
        '<h3 style="font-size:13px;margin:14px 0 6px">' + t('Every tick, newest first') + ' (' + (d.marks || []).length + ') ' + winTag + '</h3>' +
        '<div class="tablewrap tall"><table><thead><tr><th>Time</th><th>BDO</th><th>Agent</th><th>Branch</th><th>Station</th><th>KPI</th></tr></thead><tbody>' + feed + '</tbody></table></div>' +
        extras;
    }).catch(function (e) { box.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
  }
  function liveDownload() {
    var d = state._live;
    if (!d || !(d.marks || []).length) { toast(t('Nothing to download for this day'), 'warn'); return; }
    var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Activeness' };
    var rows = d.marks.map(function (m) {
      return { 'Time': m.time, 'BDO': m.bdoName, 'Username': m.bdo, 'KPI': KL[m.kpi] || m.kpi,
               'Agent': m.agent, 'Acc': m.acc, 'Branch': m.branch, 'SA Station': m.station,
               'Location': m.physical_location, 'Proof': m.hasProof ? 'YES' : '' };
    });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Live work');
    if ((d.perBdo || []).length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.perBdo.map(function (b) {
        return { 'BDO': b.name, 'Served': b.served, 'Visit': b.visit, 'APK': b.apk, 'Activeness': b.active, 'Total': b.total };
      })), 'Per BDO');
    }
    if ((d.recruits || []).length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.recruits.map(function (r) {
        return { 'Time': r.time, 'BDO': r.bdoName, 'Agent': r.name, 'Branch': r.branch, 'Bank champion': r.champion, 'Stage': r.stage };
      })), 'New agent forms');
    }
    var winTag = (d.from || '0000').replace(':', '') + '-' + (d.to || '2359').replace(':', '');
    XLSX.writeFile(wb, 'live_work_' + d.date + '_' + winTag + '.xlsx');
    toast(rows.length + ' ' + t('ticks exported'), 'ok');
  }
  function viewDashboard(v) {
    if (!can('dashboard', 'v')) { personalDashboard(v); return; }
    var m = state.month || '';
    api('dashboard', { qs: (m ? '&month=' + m : '') + (state._dashStation ? '&station=' + encodeURIComponent(state._dashStation) : '') }).then(function (d) {
      state.month = d.month;
      var att = d.attainment;
      /* a chosen SA station swaps the CARD numbers to that station's share
       * (incl. its own withdraw sum); target attainment stays office-wide */
      var ss = d.stationStats;
      function cardVal(k) { return ss ? (ss[k] || 0) : att[k].actual; }
      var stTag = ss ? ' - ' + esc(d.station) : '';
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

      var cards = card('users', 'Total Agents' + stTag, fmt(d.totalAgents));
      if (shown('serving')) cards += card('users', 'Served' + stTag, fmt(cardVal('serving')));
      if (shown('float')) cards += card('dollar', 'Float (SERVED only)' + stTag, fmt(cardVal('float')));
      if (shown('visits')) cards += card('target', 'Visits' + stTag, fmt(cardVal('visits')));
      if (shown('apk')) cards += card('rotate', 'APK upgraded to ' + esc(d.apkRequired) + '+' + stTag, fmt(cardVal('apk')), 'was below ' + esc(d.apkRequired) + ' last month');
      if (shown('activeness')) cards += card('zap', 'Activeness (net)' + stTag, fmt(ss ? (ss.net_active || 0) : att.activeness.actual),
        'waked ' + fmt(ss ? ss.waked : d.waked) + ' - lost ' + fmt(ss ? ss.lost : d.lost));
      if (shown('withdraw')) cards += card('chart', 'Withdraw Volume' + stTag, fmt(cardVal('withdraw')), ss ? esc(d.station) + ' only' : 'office-wide');
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
        greetingLine() + '<h1 class="page-title">' + t('Dashboard') + '</h1><p class="page-sub">Performance for ' + esc(d.month) +
        (d.status ? ' &middot; <span class="pill ' + (d.status === 'OPEN' ? 'gold' : d.status === 'AWAITING' ? 'fire' : 'dim') + '">' + d.status + '</span>' : '') +
        (d.fromUpload ? ' &middot; main KPIs from the uploaded performance file' : ' &middot; <span class="pill dim">no performance file uploaded yet</span>') + '</p>' +
        '<div class="panel"><div class="row"><div class="field"><label>Month</label><input id="dashMonth" type="month" value="' + esc(d.month) + '"></div>' +
        '<div class="field"><label>SA Station</label><select data-change="dashStation">' +
        '<option value="">All stations</option>' +
        (d.stations || []).map(function (s) { return '<option value="' + esc(s) + '"' + (d.station === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') +
        '</select></div>' +
        '<button class="btn" data-action="dashLoad">Load</button>' +
        (ss ? '<span class="note">cards show ' + esc(d.station) + ' only &middot; target attainment stays office-wide</span>' : '') +
        '</div></div>' +
        /* LIVE: what the team is doing today, with times */
        '<div class="panel"><div class="row" style="align-items:center;margin-bottom:6px">' +
        '<h2 style="margin:0">' + svg('zap') + t('Live work today') + '</h2>' +
        '<span class="pill fire">' + esc(d.month) + '</span><div class="spacer"></div>' +
        '<div class="field"><label>' + t('Day') + '</label><input id="liveDate" type="date" value="' + isoToday() + '" max="' + isoToday() + '"></div>' +
        '<div class="field"><label>' + t('From (EAT)') + '</label><input id="liveFrom" type="time" value="00:00"></div>' +
        '<div class="field"><label>' + t('To (EAT)') + '</label><input id="liveTo" type="time" value="23:59"></div>' +
        '<button class="ghost mini" data-action="liveWinAll" title="' + esc(t('All day')) + '">' + t('All day') + '</button>' +
        '<button class="ghost mini" data-action="liveWinMorning" title="06:00-12:00">' + t('Morning') + '</button>' +
        '<button class="ghost mini" data-action="liveWinAfternoon" title="12:00-17:00">' + t('Afternoon') + '</button>' +
        '<button class="ghost mini" data-action="liveWinEvening" title="17:00-23:59">' + t('Evening') + '</button>' +
        '<button class="ghost" data-action="liveLoad">' + svg('rotate') + ' ' + t('Refresh') + '</button>' +
        '<button class="btn" data-action="liveDownload">' + svg('download') + ' ' + t('Download window') + '</button></div>' +
        '<p class="note">' + t('Every KPI your BDOs ticked inside the chosen time window (EAT).') + '</p>' +
        '<div id="liveBox"></div></div>' +
        settings +
        '<div class="grid cards" style="margin-bottom:16px">' + cards + '</div>' +
        '<div class="panel"><h2>' + svg('target') + t('Target Attainment') + (d.weighted ? ' <span class="pill gold">weighted</span>' : '') + '</h2>' + bars + '</div>';
      liveTodayLoad();
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
    return '<tr data-agent="' + a.id + '"><td class="c-meta" data-l="acc">' + esc(a.acc) + '</td><td class="c-name">' + name + actInfoHtml(a) + '</td>' +
      '<td class="c-meta" data-l="phone">' + telHtml(a.phone) + '</td><td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
      '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td>' +
      '<td class="c-kpis"><div class="kchips">' + kpiChips(a, editable) + '</div></td>' +
      '</tr>';
  }
  function agentsBodyLoad() {
    var body = elById('agentsBody'); if (!body) return;
    var seq = ++state._agentSeq;
    var qs = '&page=' + (state.agentPage || 1) + '&per=' + (state.agentPer || 50) +
      (state._agentSearch ? '&search=' + encodeURIComponent(state._agentSearch) : '') +
      (state._agentField ? '&field=' + state._agentField : '') +
      (state._fserved ? '&fserved=' + state._fserved : '') +
      (state._fvisit ? '&fvisit=' + state._fvisit : '') +
      (state._fapk ? '&fapk=' + state._fapk : '') +
      (state._factive ? '&factive=' + state._factive : '');
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
      /* explain a switched-off chip set instead of leaving dead buttons */
      var offBox = elById('markOffNote');
      if (offBox) offBox.innerHTML = markingOffNote(d.monthStatus);
      var prev = elById('agentsPrev'), next = elById('agentsNext');
      if (prev) prev.disabled = d.page <= 1;
      if (next) next.disabled = d.page >= d.pages;
    }).catch(function (e) { body.innerHTML = '<tr><td colspan="7"><span class="err">' + esc(e.message) + '</span></td></tr>'; });
  }
  /* Loud banner when the uploaded files don't match each other, plus a plain
   * explanation of WHY KPI marking is switched off - so it is never a silent
   * "the buttons just don't work". */
  function deployWarning() {
    if (!state.serverVersion || state.serverVersion === APP_VERSION) return '';
    return '<div class="panel" style="border-color:var(--bad)"><h2>' + svg('alert') + ' ' + t('App files do not match') + '</h2>' +
      '<p class="note">' + t('Browser files are version') + ' <b>' + esc(APP_VERSION) + '</b>, ' +
      t('the server is') + ' <b>' + esc(state.serverVersion) + '</b>. ' +
      t('Only some files were uploaded. Re-deploy every file, then press Ctrl+F5.') + '</p></div>';
  }
  function markingOffNote(monthStatus) {
    if (can('mybase', 'e') && monthStatus === 'OPEN') return '';
    var why = !can('mybase', 'e')
      ? t('Your role cannot mark KPIs - ask the admin to switch ON "My Agent Base -> Edit" for your role.')
      : t('The month is') + ' ' + esc(monthStatus || '-') + ' - ' + t('KPIs can only be marked while the month is OPEN.');
    return '<div class="panel" style="border-color:var(--bad)"><h2>' + svg('alert') + ' ' + t('Marking is switched off') + '</h2>' +
      '<p class="note">' + why + '</p></div>';
  }
  function viewAgents(v) {
    var restricted = !can('agents', 'v');
    var perOpts = [20, 50, 100].map(function (n) {
      return '<option value="' + n + '"' + (n === (state.agentPer || 50) ? ' selected' : '') + '>' + n + ' / page</option>';
    }).join('');
    v.innerHTML =
      deployWarning() + '<div id="markOffNote"></div>' +
      '<h1 class="page-title">' + (restricted ? t('All Agents') : t('Agents')) + '</h1>' +
      '<p class="page-sub">' + (restricted
        ? t('Live KPI status - a KPI already done shows who did it, so nobody repeats it. Work on the ones not ready.')
        : t('Master list with live KPI status.')) + '</p>' +
      '<div class="panel"><div class="row">' +
      '<div class="field"><label>' + t('Search in') + '</label><select data-change="agentField">' +
      [['', t('Everything')], ['acc', 'Account'], ['name', 'Name'], ['phone', 'Phone'], ['branch', 'Branch'], ['location', 'Physical Location']].map(function (o) {
        return '<option value="' + o[0] + '"' + ((state._agentField || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field" style="flex:1;min-width:160px"><label>' + t('Search (live)') + '</label><input id="agentSearch" placeholder="type to search..." value="' + esc(state._agentSearch || '') + '" autocomplete="off"></div>' +
      '<div class="field"><label>Served</label><select data-change="fserved">' +
      '<option value="">' + t('Any') + '</option><option value="yes"' + (state._fserved === 'yes' ? ' selected' : '') + '>Served</option><option value="no"' + (state._fserved === 'no' ? ' selected' : '') + '>Not Served</option></select></div>' +
      '<div class="field"><label>Visit</label><select data-change="fvisit">' +
      '<option value="">' + t('Any') + '</option><option value="yes"' + (state._fvisit === 'yes' ? ' selected' : '') + '>Visit YES</option><option value="no"' + (state._fvisit === 'no' ? ' selected' : '') + '>Visit NO</option></select></div>' +
      '<div class="field"><label>APK</label><select data-change="fapk">' +
      '<option value="">' + t('Any') + '</option><option value="yes"' + (state._fapk === 'yes' ? ' selected' : '') + '>APK YES</option><option value="no"' + (state._fapk === 'no' ? ' selected' : '') + '>APK NO</option></select></div>' +
      '<div class="field"><label>Active</label><select data-change="factive">' +
      '<option value="">' + t('Any') + '</option><option value="active"' + (state._factive === 'active' ? ' selected' : '') + '>Active</option><option value="inactive"' + (state._factive === 'inactive' ? ' selected' : '') + '>Inactive</option></select></div>' +
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
  /* Inactive agents grouped BY SA STATION (Arusha / Manyara / ...): the LOST
   * ones (active last month, silent now) first, then all inactive. A BDO with
   * edit rights - especially the activeness specialist - wakes them or marks
   * won't-return straight from here. */
  function inactivePanelLoad() {
    var el = elById('inactivePanel'); if (!el) return;
    api('inactive_agents').then(function (d) {
      if (!d.counts.all) { el.innerHTML = ''; return; }
      var mode = state._inactMode === 'all' ? 'all' : 'lost';
      var list = mode === 'all' ? d.all : d.lost;
      var editable = can('mybase', 'e');
      var byStation = {};
      list.forEach(function (a) {
        var st = (a.station || 'NO STATION').toUpperCase();
        (byStation[st] = byStation[st] || []).push(a);
      });
      var sections = Object.keys(byStation).sort().map(function (st) {
        var rows = byStation[st].map(function (a) {
          var lostTag = a.act_prev === 'ACTIVE' ? ' <span class="pill bad">was ACTIVE</span>' : '';
          var actions = editable
            ? '<div class="kchips"><button class="kchip todo" data-action="kpiMark" data-id="' + a.id + '" data-kpi="active" data-name="' + esc(a.name) + '">' + t('Wake') + '</button>' +
              (isSpecial() ? ' <button class="kchip todo" data-action="wontReturn" data-id="' + a.id + '" data-name="' + esc(a.name) + '">' + t('Won\'t return') + '</button>' : '') + '</div>'
            : '-';
          return '<tr><td class="c-name">' + esc(a.name) + lostTag + '<div class="note">' + esc(a.acc) + '</div></td>' +
            '<td class="c-meta" data-l="phone">' + telHtml(a.phone) + '</td><td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
            '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td>' +
            '<td class="c-kpis">' + actions + '</td></tr>';
        }).join('');
        return '<h3 style="margin:14px 0 6px;font-size:13px"><span class="pill fire">' + esc(st) + '</span> <span class="note">' + byStation[st].length + ' agent' + (byStation[st].length > 1 ? 's' : '') + '</span></h3>' +
          '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>Agent</th><th>Phone</th><th>Branch</th><th>Location</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      }).join('') || '<div class="note">None - great.</div>';
      el.innerHTML =
        '<div class="panel"><h2>' + svg('zap') + 'Inactive Agents by SA Station &mdash; ' + esc(d.month) + '</h2>' +
        '<p class="note">' + t('Were-ACTIVE-last-month first: they went silent - wake them before month end. Waking asks for receipt proof and the physical location.') + '</p>' +
        '<div class="row" style="margin-bottom:4px">' +
        '<button class="role-chip' + (mode === 'lost' ? ' active' : '') + '" data-action="inactMode" data-m="lost">Were active last month (' + d.counts.lost + ')</button>' +
        '<button class="role-chip' + (mode === 'all' ? ' active' : '') + '" data-action="inactMode" data-m="all">All inactive this month (' + d.counts.all + ')</button></div>' +
        sections + '</div>';
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
  /* the activeness specialist works ONLY on waking + recruiting */
  function isSpecial() { return state.user && state.user.specialty === 'activeness'; }
  function kpiChips(a, editable) {
    var isOM = isManager();
    var list = isSpecial() ? KPI_CHIPS.filter(function (c) { return c.key === 'active'; }) : KPI_CHIPS;
    return list.map(function (c) { return kpiChip(a, c, editable, isOM); }).join('') + wontReturnBtn(a);
  }
  /* specialist info line: last transaction, days inactive, last month vs now */
  function actInfoHtml(a) {
    if (!isSpecial()) return '';
    var days = '';
    if (a.lastTx) {
      var diff = Math.floor((Date.now() - new Date(a.lastTx + 'T00:00:00').getTime()) / 86400000);
      if (diff >= 0) days = diff + ' ' + t('days ago');
    }
    var wr = a.wontReturn ? ' <span class="pill bad">' + t('WON\'T RETURN') + '</span>' : '';
    return '<div class="note">' + t('Last tx') + ': ' + (a.lastTx ? esc(a.lastTx) + (days ? ' (' + days + ')' : '') : '-') +
      ' &middot; ' + t('Last month') + ': ' + (a.actPrev || '-') + ' &middot; ' + t('Now') + ': ' + (a.actStatus || '-') + wr + '</div>';
  }
  /* specialist action: mark/unmark "agent confirmed he will NOT return to work" */
  function wontReturnBtn(a) {
    if (!isSpecial() || !can('mybase', 'e')) return '';
    if (a.wontReturn) {
      return ' <button class="kchip todo" data-action="wontReturn" data-id="' + a.id + '" data-name="' + esc(a.name) + '" data-marked="1">' + t('Undo won\'t-return') + '</button>';
    }
    if (a.actStatus !== 'INACTIVE') return '';
    return ' <button class="kchip todo" data-action="wontReturn" data-id="' + a.id + '" data-name="' + esc(a.name) + '">' + t('Won\'t return') + '</button>';
  }
  function doneChip(a, c, mark, isOM) {
    var lbl = c.key === 'active' ? 'Active' : (c.key === 'visit' ? 'Visit YES' : (c.key === 'apk' ? 'APK YES' : c.label));
    var mine = state.user && mark.by === state.user.username;
    /* OM overturns ANY tick; a BDO overturns his OWN live mark OR an UNASSIGNED
     * orphan only - never a fellow BDO's mark and never a partners mark. */
    var orphan = (mark.by === 'unassigned');
    var reversible = isOM || (mine && mark.src === 'bdo') || (orphan && can('mybase', 'e'));
    var xTitle = orphan ? 'Take over / clear this unassigned mark' : 'Reverse this mark';
    var x = reversible ? ' <button class="kchip-x" title="' + xTitle + '" aria-label="Reverse this mark" data-action="kpiUnmark" data-id="' + a.id + '" data-kpi="' + c.key + '">&times;</button>' : '';
    /* wake came with a receipt photo or a typed commitment - anyone can open it */
    var pr = (c.key === 'active' && mark.proof)
      ? ' <button class="kchip-x" title="View proof" aria-label="View proof" data-action="viewProof" data-id="' + a.id + '" data-name="' + esc(a.name) + '" data-note="' + esc(mark.note || '') + '">' + svg('eye') + '</button>' : '';
    return '<span class="kchip done' + (mine ? ' mine' : '') + '" title="Done by ' + esc(mark.by) + (mark.src === 'upload' ? ' (from file)' : '') + '">' +
      esc(lbl) + ' &#10003; <small>' + esc(mark.by) + '</small>' + pr + x + '</span>';
  }
  function todoChip(a, c, label) {
    return '<button class="kchip todo" data-action="kpiMark" data-id="' + a.id + '" data-kpi="' + c.key + '" data-name="' + esc(a.name) + '">' + esc(label || c.label) + '</button>';
  }
  function kpiChip(a, c, editable, isOM) {
    var mark = a.kpi && a.kpi[c.key];
    if (c.key === 'active' && !mark) {
      /* ONLY a real ACTIVE status from the file shows the green tick. INACTIVE
       * and unknown both read "Inactive (wake up)" - an orange "Active" button
       * was misleading (it looked like a claim), so it is gone. */
      if (a.actStatus === 'ACTIVE') return '<span class="kchip done" title="Active (from uploaded file)">Active &#10003;</span>';
      return editable ? todoChip(a, c, 'Inactive - wake up') : '<span class="kchip bad-off">Inactive (wake up)</span>';
    }
    if (c.key === 'visit' && !mark) {
      /* reads as NO until the BDO taps + confirms it to YES */
      return editable ? todoChip(a, c, 'Visit NO') : '<span class="kchip off">Visit NO</span>';
    }
    if (c.key === 'served' && !mark) {
      return editable ? todoChip(a, c, 'Not Served') : '<span class="kchip off">Not Served</span>';
    }
    if (c.key === 'apk' && !mark) {
      return editable ? todoChip(a, c, 'APK NO') : '<span class="kchip off">APK NO</span>';
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
          '<td class="c-name">' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div>' + actInfoHtml(a) + '</td>' +
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

      /* Partner-served + inactive agents moved to the FIELD TASKS tab: they are
       * not his base and must not sit inside My Agent Base. A short pointer is
       * shown instead so nobody loses the work. */
      var fieldHint = ((d.special && d.special.length) || 0)
        ? '<div class="panel"><div class="row" style="align-items:center"><span class="note">' +
          svg('pin') + ' ' + d.special.length + ' ' + t('partner-served agents are waiting to be claimed.') + '</span>' +
          '<div class="spacer"></div><button class="ghost mini" data-action="tab" data-tab="field">' + t('Open Field Tasks') + '</button></div></div>'
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
        '</div>' + dailyPanel + perfPanel + prioPanel + fieldHint +
        '<div class="panel"><div class="row" style="align-items:center;margin-bottom:8px"><h2 style="margin:0">' + svg('phone') + t('Agents - mark KPIs') + '</h2></div>' +
        '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>Level</th><th>Agent</th><th>Location</th><th>Branch</th><th>KPIs (Served / Visit / APK / Active)</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* New agent recruited in the field - counts as the BDO's activeness credit. */
  function recruitModal() {
    openModal('<h2>' + svg('users') + ' ' + t('Recruit new agent') + '</h2>' +
      '<p class="note">' + t('Fill the new agent\'s details - he joins your base as NEW + ACTIVE and counts in your Activeness.') + '</p>' +
      '<div class="field"><label>Acc name</label><input id="rcName" placeholder="agent full name"></div>' +
      '<div class="field"><label>Acc number</label><input id="rcAcc" placeholder="e.g. 01J7731842000"></div>' +
      '<div class="field"><label>Branch</label><input id="rcBranch" placeholder="e.g. HYDOM"></div>' +
      '<div class="field"><label>Phone</label><input id="rcPhone" inputmode="tel" placeholder="e.g. 2557XXXXXXXX"></div>' +
      '<div class="field"><label>Physical location</label><input id="rcLoc" placeholder="e.g. Kaloleni, opposite NMB Bank"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
      '<button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
      '<button class="btn" data-action="recruitSave">' + t('Save new agent') + '</button></div>');
    var f = elById('rcName'); if (f) f.focus();
  }
  function recruitSave() {
    api('agent_recruit', { body: {
      name: elById('rcName').value.trim(), acc: elById('rcAcc').value.trim(),
      branch: elById('rcBranch').value.trim(), phone: elById('rcPhone').value.trim(),
      location: elById('rcLoc').value.trim()
    } }).then(function () {
      closeModal();
      toast(t('Agent added - counted in your Activeness'), 'ok');
      renderTab();
    }).catch(function (e) { toast(e.message, 'err'); });
  }

  /* Recruitment pipeline: form -> audit -> approved -> paid+POS -> real agent. */
  var PIPE_STAGES = ['Form', 'Audit', 'Approved', 'Paid+POS', 'Agent'];
  function pipePanel(pipe) {
    var rows = (pipe && pipe.rows || []).map(function (r) {
      var stage = Number(r.stage);
      var chips = PIPE_STAGES.map(function (s, i) {
        return '<span class="kchip ' + (i < stage ? 'done' : 'off') + '">' + s + (i < stage ? ' &#10003;' : '') + '</span>';
      }).join(' ');
      var next = stage >= 5
        ? '<span class="pill ok">' + t('DONE') + ' ' + esc(r.acc) + '</span>'
        : '<button class="kchip todo" data-action="pipeNext" data-id="' + r.id + '" data-stage="' + stage + '" data-name="' + esc(r.name) + '">' +
          (stage === 1 ? t('Passed bank audit?') : stage === 2 ? t('Approved?') : stage === 3 ? t('Paid & POS assigned?') : t('Fill acc & location')) + '</button>';
      return '<tr><td class="c-name">' + esc(r.name) + '<div class="note">' + esc(r.branch) + ' &middot; ' + t('champion') + ': ' + esc(r.champion) + (r.phone ? ' &middot; ' + esc(r.phone) : '') + '</div></td>' +
        '<td class="c-kpis"><div class="kchips">' + chips + ' ' + next + '</div></td></tr>';
    }).join('') || '<tr><td colspan="2" class="note">' + t('No forms yet - tap "New agent form" to start one.') + '</td></tr>';
    return '<div class="panel"><div class="row" style="align-items:center;margin-bottom:8px"><h2 style="margin:0">' + svg('users') + t('Recruitment pipeline') + '</h2><div class="spacer"></div>' +
      '<button class="btn mini" data-action="pipeAdd">+ ' + t('New agent form') + '</button></div>' +
      '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>' + t('Recruit') + '</th><th>' + t('Stages') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  /* ---------------- Daily Report (separate BDO tab) ---------------- */
  function viewDaily(v) {
    /* base gives his weighted performance so each saved report moves the trend */
    Promise.all([api('daily_reports_get'), api('base'), isSpecial() ? api('recruit_pipe_list') : Promise.resolve(null),
                 isSpecial() ? api('specialist_summary') : Promise.resolve(null),
                 api('route_plans_get')]).then(function (rr) {
      var d = rr[0], base = rr[1], pipe = rr[2], sum = rr[3], rp = rr[4];

      /* today's ROUTE PLAN (EAT): write before 10:00; leader approves/assigns */
      var todayPlan = (rp.rows || []).filter(function (r) { return r.date === rp.today; })[0];
      var before10 = Number((rp.now || '00:00').slice(0, 2)) < 10;
      var routeHtml;
      if (todayPlan && todayPlan.status !== 'PENDING') {
        var rpPill = todayPlan.status === 'APPROVED' ? '<span class="pill ok">APPROVED</span>'
          : todayPlan.status === 'ASSIGNED' ? '<span class="pill fire">ASSIGNED ' + (todayPlan.by_leader ? '&middot; ' + esc(todayPlan.by_leader) : '') + '</span>'
          : '<span class="pill bad">REJECTED' + (todayPlan.note ? ' &middot; ' + esc(todayPlan.note) : '') + '</span>';
        routeHtml = '<div class="note" style="margin-top:6px">' + rpPill + ' ' + esc(todayPlan.plan) + '</div>' +
          (todayPlan.status === 'REJECTED' && before10
            ? '<div class="row" style="margin-top:8px"><input id="rpPlan" maxlength="2000" style="flex:1;min-width:200px" value="' + esc(todayPlan.plan) + '"><button class="btn" data-action="routeSave">' + t('Resend plan') + '</button></div>'
            : '');
      } else if (todayPlan) {
        routeHtml = '<div class="note" style="margin-top:6px"><span class="pill gold">PENDING</span> ' + esc(todayPlan.plan) + ' &middot; ' + t('waiting for your team leader') + '</div>' +
          (before10 ? '<div class="row" style="margin-top:8px"><input id="rpPlan" maxlength="2000" style="flex:1;min-width:200px" value="' + esc(todayPlan.plan) + '"><button class="btn" data-action="routeSave">' + t('Update plan') + '</button></div>' : '');
      } else if (before10) {
        routeHtml = '<div class="row" style="margin-top:8px"><input id="rpPlan" maxlength="2000" style="flex:1;min-width:200px" placeholder="' + esc(t('e.g. Kaloleni -> Sakina -> Njiro, then HYDOM branch')) + '">' +
          '<button class="btn" data-action="routeSave">' + t('Send route plan') + '</button></div>';
      } else {
        routeHtml = '<div class="note" style="margin-top:6px"><span class="pill bad">' + t('CLOSED') + '</span> ' + t('Route plans close at 10:00 EAT - ask your team leader to assign one.') + '</div>';
      }
      /* ACTIVENESS work lives here now (moved out of My Agent Base): recruiting
       * a new agent counts in the SAME activeness KPI as waking a sleeping one. */
      var canMark = can('mybase', 'e') && base.monthStatus === 'OPEN';
      var activenessPanel = can('mybase', 'e')
        ? '<div class="panel"><div class="row" style="align-items:center;margin-bottom:6px"><h2 style="margin:0">' + svg('zap') + t('Activeness - wake or recruit') + '</h2><div class="spacer"></div>' +
          (canMark ? (isSpecial()
            ? '<button class="btn mini" data-action="pipeAdd">+ ' + t('New agent form') + '</button>'
            : '<button class="btn mini" data-action="recruit">+ ' + t('Recruit new agent') + '</button>') : '') + '</div>' +
          '<p class="note">' + t('Both count in the SAME Activeness KPI this month: agents you WAKE and brand-new agents you RECRUIT.') + '</p>' +
          '<div class="row"><button class="ghost mini" data-action="tab" data-tab="field">' + svg('pin') + ' ' + t('Wake inactive agents') + '</button></div></div>'
        : '';
      var routePanel = can('mybase', 'e')
        ? '<div class="panel"><h2>' + svg('pin') + t('My route plan today') + ' <span class="pill dim">' + esc(rp.now || '') + ' EAT</span></h2>' +
          '<p class="note">' + t('Write the places you are going to visit BEFORE 10:00 EAT. Your team leader approves it.') + '</p>' + routeHtml + '</div>'
        : '';
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
      /* the activeness specialist types NOTHING: his report is COMPUTED from
       * his agent taps + forms, so it always matches the agent list. No float
       * shortage for him either. */
      if (sum) {
        v.innerHTML =
          greetingLine() + '<h1 class="page-title">' + t('Daily Report') + '</h1>' +
          '<p class="page-sub">' + esc(sum.month) + ' &middot; ' + t('computed from your agent list and forms - nothing to type, nothing to forget') + '</p>' +
          '<div class="grid cards" style="margin-bottom:16px">' +
          card('users', t('Inactive visited'), fmt(sum.inactiveVisited), t('waked + won\'t-return')) +
          card('zap', t('Waked up'), fmt(sum.waked)) +
          card('alert', t('Won\'t return'), fmt(sum.wontReturn)) +
          card('check', t('Forms submitted'), fmt(sum.formsSubmitted), t('became agents') + ': ' + fmt(sum.recruited)) +
          '</div>' +
          routePanel + perfPanel + activenessPanel + (pipe ? pipePanel(pipe) : '');
        return;
      }
      v.innerHTML =
        greetingLine() + '<h1 class="page-title">' + t('Daily Report') + '</h1>' +
        '<p class="page-sub">' + t('Type only FLOAT and APK here. Serving, visits and activeness are done on the agent list - find the agent, tap his chip and confirm, so we know which agent was handled by which BDO.') + '</p>' +
        '<div class="panel"><h2>' + svg('cal') + t('Send report') + '</h2>' +
        '<div class="row"><div class="field"><label>' + t('Report date (today or up to 2 days back)') + '</label><input id="drDate" type="date" value="' + isoToday() + '" min="' + isoDaysAgo(2) + '" max="' + isoToday() + '"></div>' +
        '<div class="field"><label>' + t('Total float served') + '</label><input id="drFloat" type="number" min="0" placeholder="0"></div>' +
        '<div class="field"><label>' + t('APK updated') + '</label><input id="drApk" type="number" min="0" placeholder="0"></div></div>' +
        '<p class="note" style="margin-top:8px">' + svg('users') + ' ' + t('Serving, visits and activeness: use the agent list, not this form.') + ' <button class="ghost tiny" data-action="tab" data-tab="' + (can('agents', 'v') ? 'agents' : 'mybase') + '">' + t('Open agent list') + '</button></p>' +
        '<div class="row" style="margin-top:10px"><button class="btn" data-action="drSave">' + t('Save report') + '</button>' +
        '<button class="ghost" data-action="shortage">' + svg('alert') + ' ' + t('Report float shortage') + '</button></div></div>' +
        routePanel + perfPanel + activenessPanel + (pipe ? pipePanel(pipe) : '') +
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
    var lbl = kpiKey === 'active' ? 'Active' : (kpiKey === 'visit' ? 'Visit YES'
            : (kpiKey === 'apk' ? 'APK YES' : (c ? c.label : kpiKey)));
    /* Only MY own fresh mark (or a manager) gets the reverse ×. When the server
     * said "already done by <colleague>" the chip belongs to HIM - show it
     * locked, never as "done by you" with a working × . */
    var mine = state.user && owner === state.user.username;
    var reversible = mine || isManager();
    var x = reversible ? ' <button class="kchip-x" title="Reverse this mark" aria-label="Reverse this mark" data-action="kpiUnmark" data-id="' + agentId + '" data-kpi="' + kpiKey + '">&times;</button>' : '';
    return '<span class="kchip done' + (mine ? ' mine' : '') + '" title="Done by ' + esc(owner) + '">' +
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
  /* label a freshly-reversed chip should fall back to, per KPI */
  var TODO_LABEL = { served: 'Not Served', visit: 'Visit NO', apk: 'APK NO', active: 'Inactive - wake up' };
  function kpiUnmark(id, kpi, node) {
    api('kpi_unmark', { body: { agentId: Number(id), kpi: kpi } })
      .then(function () {
        toast(t('Status updated'), 'ok');
        /* swap the reversed chip back to its "todo" state in place - no reload,
         * so the scroll position is kept */
        var chip = node && node.closest ? node.closest('.kchip') : null;
        if (chip && chip.parentNode) {
          var row = chip.closest ? chip.closest('tr') : null;
          var nameCell = row ? row.querySelector('.c-name') : null;
          var nm = nameCell ? (nameCell.childNodes[0] ? nameCell.childNodes[0].textContent.trim() : '') : '';
          var b = document.createElement('button');
          b.className = 'kchip todo';
          b.setAttribute('data-action', 'kpiMark');
          b.setAttribute('data-id', id);
          b.setAttribute('data-kpi', kpi);
          b.setAttribute('data-name', nm);
          b.textContent = TODO_LABEL[kpi] || kpi;
          chip.parentNode.replaceChild(b, chip);
        } else { renderTab(); }
      })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function kpiMark(id, kpi, name, node, location, proof, proofNote) {
    api('kpi_mark', { body: { agentId: Number(id), kpi: kpi, location: location || '', proof: proof || '', proofNote: proofNote || '' } })
      .then(function () {
        toast(t('Status updated') + ' - ' + esc(name), 'ok');
        /* swap ONLY the tapped chip in place - never reload the list, so the
         * BDO keeps his scroll position and carries on down the page */
        swapChip(node, kpi, state.user.username);
      })
      .catch(function (e) {
        if (e.data && e.data.needLocation) { locationModal(id, kpi, name, node); return; }
        if (e.data && e.data.needProof) { proofModal(id, name, node, e.data.agentLoc || ''); return; }
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
  /* Waking an INACTIVE agent needs a receipt photo. The photo is downscaled on
   * the phone (max 1280px JPEG) so it uploads fast even on slow networks. */
  function proofModal(id, name, node, knownLoc) {
    openModal('<h2>' + svg('zap') + ' ' + t('Wake') + ' ' + esc(name) + '</h2>' +
      '<p class="note">' + t('Take a photo of the agent\'s TRANSACTION RECEIPTS as proof he is transacting again. Management can open it from his chip.') + '</p>' +
      '<div class="field"><label>' + t('Receipt photo') + '</label>' +
      '<input id="proofFile" type="file" accept="image/*" capture="environment"></div>' +
      '<div id="proofPrev" style="margin-top:8px;text-align:center"></div>' +
      '<div class="field" style="margin-top:8px"><label>' + t('No photo? Confirm by words - how are you SURE he transacted?') + '</label>' +
      '<input id="proofNote" maxlength="255" placeholder="' + esc(t('e.g. I saw his float statement at the branch today')) + '"></div>' +
      '<div class="field" style="margin-top:8px"><label>' + t('Confirm his physical location (for the follow-up)') + '</label>' +
      '<input id="proofLoc" maxlength="255" value="' + esc(knownLoc || '') + '" placeholder="' + esc(t('e.g. Kaloleni, opposite NMB Bank')) + '"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
      '<button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
      '<button class="btn" data-action="proofConfirm" data-id="' + id + '" data-name="' + esc(name) + '" disabled>' + t('Save proof & wake') + '</button></div>');
    state._locNode = node;
    state._proofData = '';
    function proofReady() {
      var btn = document.querySelector('[data-action=proofConfirm]');
      var locOk = elById('proofLoc') && elById('proofLoc').value.trim() !== '';
      var proofOk = state._proofData || (elById('proofNote') && elById('proofNote').value.trim().length >= 10);
      if (btn) btn.disabled = !(proofOk && locOk);
    }
    state._proofReady = proofReady;
    var noteInp = elById('proofNote');
    noteInp.addEventListener('input', proofReady);
    elById('proofLoc').addEventListener('input', proofReady);
    var inp = elById('proofFile');
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var img = new Image();
      img.onload = function () {
        var max = 1280, w = img.width, h = img.height;
        if (w > max || h > max) { var s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        state._proofData = cv.toDataURL('image/jpeg', 0.72);
        URL.revokeObjectURL(img.src);
        var pv = elById('proofPrev');
        if (pv) pv.innerHTML = '<img src="' + state._proofData + '" alt="receipt preview" style="max-width:100%;max-height:140px;border-radius:10px">';
        if (state._proofReady) state._proofReady();
      };
      img.onerror = function () { toast(t('That file is not a photo'), 'err'); };
      img.src = URL.createObjectURL(f);
    });
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
      '<div class="field"><label>Label (optional)</label><input id="upLabel" maxlength="160" placeholder="e.g. July week 2 final file"></div>' +
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
      api('upload_weekly', { body: { month: elById('upMonth').value, week: elById('upWeek').value, label: elById('upLabel') ? elById('upLabel').value : '', mode: mode, rows: rows } })
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
  /* OM: download BDO performance for any date range with hand-picked KPIs. */
  function rangeReportPanel() {
    var kpiBoxes = [
      ['served', 'Served'], ['float', 'Float'], ['visits', 'Visits'], ['apk', 'APK'], ['activeness', 'Activeness'],
      ['reports', 'Daily reports (sent/missed)']
    ].map(function (k) {
      return '<label class="kchip todo" style="cursor:pointer"><input type="checkbox" class="rrKpi" value="' + k[0] + '" checked style="accent-color:var(--fire2);margin-right:5px">' + k[1] + '</label>';
    }).join(' ');
    return '<div class="panel"><h2>' + svg('chart') + 'Download BDO Report (Excel)</h2>' +
      '<p class="note">Pick a date range and the KPIs you want - one row per BDO. Served/Visits/Activeness count his dated agent marks; Float and APK come from dated daily reports (APK uses the same max-of-marks-or-typed rule as the monthly score). The reports option adds days he SENT a daily report, days he MISSED (per his working days) and how many were late.</p>' +
      '<div class="row">' +
      '<div class="field"><label>From</label><input id="rrFrom" type="date" value="' + isoDaysAgo(30) + '" max="' + isoToday() + '"></div>' +
      '<div class="field"><label>To</label><input id="rrTo" type="date" value="' + isoToday() + '" max="' + isoToday() + '"></div>' +
      '</div><div class="row" style="margin-top:8px">' + kpiBoxes + '</div>' +
      '<div class="row" style="margin-top:10px"><button class="btn" data-action="rrDownload">' + svg('download') + ' Download Excel</button>' +
      '<button class="ghost" data-action="pipeDownload">' + svg('download') + ' Recruitment pipeline (by stages)</button>' +
      '<button class="ghost" data-action="wrDownload">' + svg('download') + ' Won\'t-return list</button></div></div>';
  }
  /* OM: every recruit with his stage + dates - the "report by stages". */
  function pipeDownload() {
    api('recruit_pipe_list').then(function (d) {
      if (!d.rows.length) { toast('No recruits in the pipeline yet', 'warn'); return; }
      var stages = ['', 'Form submitted', 'Audit passed', 'Approved', 'Paid + POS', 'Agent created'];
      var rows = d.rows.map(function (r) {
        return { 'BDO': r.bdo, 'Agent name': r.name, 'Branch': r.branch, 'Bank champion': r.champion,
                 'Phone': r.phone, 'Stage': stages[Number(r.stage)] || r.stage,
                 'Form submitted': (r.submitted_at || '').slice(0, 16), 'Audit passed': (r.audit_at || '').slice(0, 16),
                 'Approved': (r.approved_at || '').slice(0, 16), 'Paid + POS': (r.paid_at || '').slice(0, 16),
                 'Agent created': (r.done_at || '').slice(0, 16), 'Acc': r.acc, 'Location': r.location };
      });
      var ws = XLSX.utils.json_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Recruitment pipeline');
      XLSX.writeFile(wb, 'recruitment_pipeline_' + new Date().toISOString().slice(0, 10) + '.xlsx');
      toast(d.rows.length + ' recruits exported', 'ok');
    }).catch(function (e) { toast(e.message, 'err'); });
  }
  /* OM: agents who CONFIRMED they will not return - the deletion discussion list. */
  function wrDownload() {
    api('wont_return_list').then(function (d) {
      if (!d.rows.length) { toast('No agents marked won\'t-return yet', 'warn'); return; }
      var rows = d.rows.map(function (r) {
        return { 'Acc': r.acc, 'Agent name': r.name, 'Phone': r.phone, 'Branch': r.branch,
                 'Location': r.physical_location, 'Status now': r.act_current, 'Last month': r.act_prev,
                 'Confirmed by (BDO)': r.bdo, 'Note': r.note, 'Marked on': (r.at || '').slice(0, 16) };
      });
      var ws = XLSX.utils.json_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Wont return');
      XLSX.writeFile(wb, 'wont_return_list_' + new Date().toISOString().slice(0, 10) + '.xlsx');
      toast(d.rows.length + ' agents exported', 'ok');
    }).catch(function (e) { toast(e.message, 'err'); });
  }
  function rrDownload() {
    var kpis = Array.prototype.slice.call(document.querySelectorAll('.rrKpi:checked')).map(function (c) { return c.value; });
    if (!kpis.length) { toast('Tick at least one KPI', 'warn'); return; }
    var from = elById('rrFrom').value, to = elById('rrTo').value;
    if (!from || !to) { toast('Pick both dates', 'warn'); return; }
    api('bdo_range_report', { qs: '&from=' + from + '&to=' + to + '&kpis=' + kpis.join(',') }).then(function (d) {
      if (!d.rows.length) { toast('No BDOs found', 'warn'); return; }
      var head = { bdo: 'BDO', name: 'Name', served: 'Served', float: 'Float', visits: 'Visits', apk: 'APK', activeness: 'Activeness',
                   reported: 'Reports sent', missed: 'Reports missed', late: 'Late reports' };
      var rows = d.rows.map(function (r) {
        var o = {};
        Object.keys(r).forEach(function (k) { o[head[k] || k] = r[k]; });
        return o;
      });
      var ws = XLSX.utils.json_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BDO ' + d.from + ' to ' + d.to);
      XLSX.writeFile(wb, 'bdo_report_' + d.from + '_' + d.to + '.xlsx');
      toast(d.rows.length + ' BDOs exported', 'ok');
    }).catch(function (e) { toast(e.message, 'err'); });
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
        rangeReportPanel() +
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
    var isMgmt = can('reports', 'e') || can('targets', 'v');
    var calls = [api('daily_reports_get', { qs: '&month=' + m }),
                 isManager() ? api('flags_get', { qs: '&month=' + m }) : Promise.resolve({ rank: [], flags: [], matched: [], grid: [] }),
                 api('rank_get', { qs: '&period=' + period + '&date=' + (state._rankDate || new Date().toISOString().slice(0, 10)) }),
                 api('messages_get'), api('bdo_rank_public')];
    calls.push(isMgmt ? api('shortages_get', { qs: '&month=' + m }) : Promise.resolve(null));
    calls.push(can('reports', 'e') ? api('route_plans_get') : Promise.resolve(null));
    Promise.all(calls).then(function (rr) {
      var dr = rr[0], fl = rr[1], rk = rr[2], msgs = rr[3], wrk = rr[4], sh = rr[5], rp = rr[6];

      /* weighted TOP-PERFORMING ranking - the one list every member sees */
      var weightRank = '<div class="panel"><h2>' + svg('percent') + t('Top performing - weighted score') + '</h2>' +
        '<div class="tablewrap"><table><thead><tr><th>#</th><th>BDO</th><th>' + t('Weighted score') + '</th></tr></thead><tbody>' +
        ((wrk.rows || []).map(function (r, i) {
          return '<tr' + (state.user && r.bdo === state.user.username ? ' style="font-weight:800"' : '') + '><td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + flagPill(r.flag, r.score) + '</td></tr>';
        }).join('') || '<tr><td colspan="3" class="note">No targets set yet.</td></tr>') + '</tbody></table></div></div>';

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

      /* Flag details moved to their own tab (viewFlags) - keep the response
       * loaded so `fl` is still valid, but don't render anything here. */

      /* --- management extras --- */
      var omTools = can('reports', 'e')
        ? '<div class="panel"><h2>' + svg('mail') + 'Messages to members</h2>' +
          '<div class="row"><div class="field"><label>To</label><select id="msgTo"><option value="">All members</option></select></div>' +
          '<div class="field" style="flex:1;min-width:220px"><label>Message</label><input id="msgBody" placeholder="Type the announcement..." maxlength="500"></div>' +
          '<button class="btn" data-action="msgSend">Send</button></div>' +
          '<div id="msgSent" style="margin-top:10px"></div></div>' +
          '<div class="panel"><h2>' + svg('cal') + 'Working days</h2>' +
          '<p class="note">Default applies to everyone; override per BDO below (e.g. works Sunday instead of Saturday).</p>' +
          '<div class="row"><div class="field"><label>Default working days</label><input id="wdGlobal" value="' + esc(dr.globalWorkingDays) + '" placeholder="1,2,3,4,5,6"></div>' +
          '<div class="field"><label>BDO override</label><select id="wdBdo">' + (dr.bdos || []).map(function (b) { return '<option value="' + esc(b.username) + '">' + esc(b.name) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label>His days (1=Mon..7=Sun)</label><input id="wdDays" placeholder="1,2,3,4,5,7"></div>' +
          '<button class="btn" data-action="wdSave">Save</button></div>' +
          '<div class="note" style="margin-top:6px">1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat 7=Sun</div></div>'
        : '';
      /* shortage chain: PENDING until the team leader approves; only APPROVED
       * ones reach top management (the server already filters per role) */
      var canApprove = can('reports', 'e');
      var shortPanel = (sh !== null)
        ? '<div class="panel"><h2>' + svg('alert') + 'Float shortages</h2>' +
          (canApprove ? '<p class="note">PENDING shortages wait for YOUR approval before top management sees them.</p>' : '') +
          '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Amount</th><th>Reason</th><th>Recover by</th><th>Status</th><th>When</th>' + (canApprove ? '<th></th>' : '') + '</tr></thead><tbody>' +
          ((sh || []).map(function (s) {
            var stPill = s.status === 'APPROVED'
              ? '<span class="pill ok">APPROVED' + (s.approved_by ? ' &middot; ' + esc(s.approved_by) : '') + '</span>'
              : '<span class="pill gold">PENDING</span>';
            var act = canApprove && s.status === 'PENDING'
              ? '<td><button class="btn mini" data-action="shortApprove" data-id="' + s.id + '">Approve</button></td>'
              : (canApprove ? '<td></td>' : '');
            return '<tr><td>' + esc(s.bdo) + '</td><td>' + fmt(s.amount) + '</td><td>' + esc(s.reason) + '</td><td>' + esc(s.recover_by || '-') + '</td>' +
              '<td>' + stPill + '</td><td class="note">' + esc((s.at || '').slice(0, 16)) + '</td>' + act + '</tr>';
          }).join('') || '<tr><td colspan="7" class="note">No shortages reported.</td></tr>') + '</tbody></table></div></div>'
        : '';

      /* team leader: today's route plans - approve, reject, assign */
      var routePanel = rp
        ? '<div class="panel"><h2>' + svg('pin') + 'Daily route plans (EAT)</h2>' +
          '<p class="note">BDOs submit before 10:00 EAT. Approve or reject; assign a route yourself when needed.</p>' +
          '<div class="tablewrap"><table><thead><tr><th>Date</th><th>BDO</th><th>Route</th><th>Status</th><th></th></tr></thead><tbody>' +
          ((rp.rows || []).map(function (r) {
            var pill = r.status === 'APPROVED' ? '<span class="pill ok">APPROVED</span>'
              : r.status === 'ASSIGNED' ? '<span class="pill fire">ASSIGNED' + (r.by_leader ? ' &middot; ' + esc(r.by_leader) : '') + '</span>'
              : r.status === 'REJECTED' ? '<span class="pill bad">REJECTED</span>'
              : '<span class="pill gold">PENDING</span>';
            var act = r.status === 'PENDING'
              ? '<button class="btn mini" data-action="routeOk" data-id="' + r.id + '">Approve</button> <button class="danger mini" data-action="routeNo" data-id="' + r.id + '">Reject</button>'
              : '';
            return '<tr><td class="note">' + esc(r.date) + '</td><td>' + esc(r.bdo) + '</td><td>' + esc(r.plan) + '</td><td>' + pill + '</td><td>' + act + '</td></tr>';
          }).join('') || '<tr><td colspan="5" class="note">No route plans yet.</td></tr>') + '</tbody></table></div>' +
          '<div class="row" style="margin-top:10px"><div class="field"><label>Assign to</label><select id="raBdo">' +
          (dr.bdos || []).map(function (b) { return '<option value="' + esc(b.username) + '">' + esc(b.name) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field" style="flex:1;min-width:200px"><label>Route for today</label><input id="raPlan" maxlength="2000" placeholder="e.g. Kaloleni -> Sakina -> Njiro"></div>' +
          '<button class="btn" data-action="routeAssign">Assign route</button></div></div>'
        : '';

      /* plain BDO: HIS report days + the weighted top-performers list. Nothing else. */
      if (!isMgmt) {
        v.innerHTML =
          greetingLine() +
          '<h1 class="page-title">Reports &amp; Ranks</h1><p class="page-sub">' + t('Your report days and the top performers') + '</p>' +
          '<div class="panel"><h2>' + svg('cal') + t('My report days') + ' - ' + esc(m) + '</h2>' +
          '<p class="note"><span class="pill ok">OK</span> ' + t('on time') + ' &middot; <span class="pill gold">LATE</span> &middot; <span class="pill bad">MISS</span></p>' +
          '<div class="tablewrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + matrix + '</tbody></table></div></div>' +
          weightRank;
        return;
      }

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
        (isManager()
          ? '<div class="panel"><div class="row" style="align-items:center"><span class="note">' + svg('alert') + ' ' + t('Flag details moved to their own tab.') + '</span>' +
            '<div class="spacer"></div><button class="ghost mini" data-action="tab" data-tab="flags">' + t('Open Flags') + '</button></div></div>'
          : '') +
        weightRank + routePanel + shortPanel;
      msgMgrLoad();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* recipient picker + the sender's own messages with edit/delete */
  function msgMgrLoad() {
    var sel = elById('msgTo'), box = elById('msgSent');
    if (!sel || !box) return;
    Promise.all([api('members_list'), api('messages_sent')]).then(function (rr) {
      var members = rr[0], sent = rr[1];
      sel.innerHTML = '<option value="">All members</option>' + members
        .filter(function (m) { return m.username !== state.user.username; })
        .map(function (m) { return '<option value="' + esc(m.username) + '">' + esc(m.name) + ' (' + esc(m.username) + ')</option>'; }).join('');
      box.innerHTML = sent.length
        ? '<div class="tablewrap"><table><thead><tr><th>To</th><th>Message</th><th>When</th><th></th></tr></thead><tbody>' +
          sent.map(function (m) {
            return '<tr><td>' + (m.to_user ? esc(m.to_user) : '<span class="pill dim">everyone</span>') + '</td>' +
              '<td>' + esc(m.body) + '</td><td class="note">' + esc((m.at || '').slice(0, 16)) + '</td>' +
              '<td><button class="ghost mini" data-action="msgEdit" data-id="' + m.id + '" data-body="' + esc(m.body) + '">Edit</button> ' +
              '<button class="danger mini" data-action="msgDel" data-id="' + m.id + '">Delete</button></td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<div class="note">No messages sent yet.</div>';
    }).catch(function () { /* panel stays minimal */ });
  }
  function msgSend() {
    api('message_send', { body: { body: elById('msgBody').value, to: elById('msgTo') ? elById('msgTo').value : '' } })
      .then(function () { toast('Message sent', 'ok'); elById('msgBody').value = ''; msgMgrLoad(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  /* danger zone: show a BDO's filled data with per-report deletes + erase buttons */
  function bdLoad() {
    var bdo = elById('bdSel') ? elById('bdSel').value : '';
    var box = elById('bdBox');
    if (!bdo) { toast('Pick a BDO first', 'warn'); return; }
    api('bdo_data_summary', { qs: '&bdo=' + encodeURIComponent(bdo) }).then(function (d) {
      var c = d.counts;
      var reps = (d.reports || []).map(function (r) {
        return '<tr><td>' + esc(r.report_date) + '</td><td>' + fmt(r.float_served) + '</td><td>' + fmt(r.apk) + '</td>' +
          '<td class="note">' + esc(r.note || '') + '</td>' +
          '<td><button class="danger mini" data-action="bdDelReport" data-id="' + r.id + '">Delete</button></td></tr>';
      }).join('') || '<tr><td colspan="5" class="note">No typed reports.</td></tr>';
      box.innerHTML =
        '<div class="row" style="margin-bottom:10px">' +
        '<span class="pill fire">' + c.marksMonth + ' marks this month (' + c.marksAll + ' all-time)</span>' +
        '<span class="pill gold">' + c.reportsMonth + ' reports this month (' + c.reportsAll + ' all-time)</span>' +
        '<span class="pill dim">' + c.wontReturn + ' won\'t-return &middot; ' + c.recruits + ' forms &middot; ' + c.shortages + ' shortages</span></div>' +
        '<div class="tablewrap"><table><thead><tr><th>Date</th><th>Float</th><th>APK</th><th>Note</th><th></th></tr></thead><tbody>' + reps + '</tbody></table></div>' +
        '<p class="note" style="margin-top:8px">Single agent marks: reverse them with the &times; on his chips in the agent list (you have no time limit).</p>' +
        '<div class="row" style="margin-top:10px">' +
        '<button class="danger" data-action="bdErase" data-bdo="' + esc(d.bdo) + '" data-scope="month">Erase THIS MONTH (' + esc(d.month) + ')</button>' +
        '<button class="danger" data-action="bdErase" data-bdo="' + esc(d.bdo) + '" data-scope="all">Erase EVERYTHING</button></div>';
    }).catch(function (e) { toast(e.message, 'err'); });
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

  /* ---------------- Field Tasks (BDO): agents to CLAIM ----------------
   * Everything here is work he can take over. None of it is his base yet, so
   * it stays out of My Agent Base and out of his performance until he acts:
   *   1. partner-served agents - capture the location and adopt them
   *   2. inactive agents by SA station - wake them (receipt + location) */
  /* ---------------- Flags (OM / management): all KPI, all BDO, live search ----- */
  function viewFlags(v) {
    var m = state._flagsMonth || state.openMonth || curMonth();
    state._flagsMonth = m;
    api('flags_get', { qs: '&month=' + m }).then(function (d) {
      var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Active' };
      /* per-BDO x per-KPI grid: matched (both agree) vs flagged (mismatch) */
      var gridRows = (d.grid || []).map(function (g) {
        function cell(k) { return '<td><span class="pill ok">' + g[k].m + '</span> <span class="pill bad">' + g[k].f + '</span></td>'; }
        return '<tr><td><b>' + esc(g.bdo) + '</b></td>' +
          cell('served') + cell('visit') + cell('apk') + cell('active') +
          '<td><b>' + g.matched + '</b></td><td><b>' + g.flagged + '</b></td></tr>';
      }).join('') || '<tr><td colspan="7" class="note">' + t('No live BDO marks in this month yet.') + '</td></tr>';

      function detailRow(r, isFlag) {
        return '<tr class="fl-row" data-bdo="' + esc(r.bdo).toLowerCase() + '" data-kpi="' + esc(r.kpi || '') + '" data-search="' +
          esc((r.bdo + ' ' + (r.agent_name || '') + ' ' + (r.acc || '') + ' ' + (r.branch || '') + ' ' + (r.station || '')).toLowerCase()) + '">' +
          '<td><span class="pill ' + (isFlag ? 'bad' : 'ok') + '">' + (isFlag ? t('MISMATCH') : t('MATCHED')) + '</span></td>' +
          '<td>' + esc(r.bdo) + '</td><td>' + esc(KL[r.kpi] || r.kpi) + '</td>' +
          '<td class="c-name">' + esc(r.agent_name || '') + '<div class="note">' + esc(r.acc || '') + '</div></td>' +
          '<td>' + esc(r.branch || '-') + '</td><td>' + esc(r.station || '-') + '</td>' +
          '<td class="note">' + esc(r.detail || '') + '</td>' +
          '<td class="note">' + esc((r.at || '').slice(0, 16)) + '</td></tr>';
      }
      var mmRows = (d.flags || []).map(function (r) { return detailRow(r, true); }).join('');
      var okRows = (d.matched || []).map(function (r) { return detailRow(r, false); }).join('');

      /* filter chips (KPI + BDO) rendered as data-attribute filters so search
       * stays entirely client-side and instant */
      var bdoOpts = '<option value="">' + t('All BDOs') + '</option>' + (d.grid || []).map(function (g) {
        return '<option value="' + esc(g.bdo).toLowerCase() + '">' + esc(g.bdo) + '</option>';
      }).join('');

      v.innerHTML =
        greetingLine() +
        '<h1 class="page-title">' + t('Flags') + '</h1>' +
        '<p class="page-sub">' + t('Every BDO live mark cross-checked against the uploaded performance file. Matched = both agree, Mismatch = the file said NOT.') + '</p>' +
        '<div class="panel"><div class="row"><div class="field"><label>' + t('Month') + '</label><input id="flMonth" type="month" value="' + esc(m) + '"></div>' +
        '<button class="btn" data-action="flLoad">' + t('Load') + '</button></div></div>' +
        '<div class="panel"><h2>' + svg('percent') + t('Per BDO x KPI') + ' &mdash; ' + t('matched vs mismatch') + '</h2>' +
        '<p class="note">' + t('Green = matched, red = mismatch. Bigger red = more suspicious claims.') + '</p>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Served</th><th>Visit</th><th>APK</th><th>Active</th><th>' + t('Matched') + '</th><th>' + t('Flagged') + '</th></tr></thead><tbody>' + gridRows + '</tbody></table></div></div>' +
        '<div class="panel"><h2>' + svg('users') + t('Every claim') + '</h2>' +
        '<div class="row" style="margin-bottom:8px">' +
        '<div class="field" style="flex:1;min-width:180px"><label>' + t('Search') + '</label><input id="flSearch" placeholder="' + esc(t('BDO, agent name, acc, branch, station')) + '"></div>' +
        '<div class="field"><label>' + t('BDO') + '</label><select id="flBdo">' + bdoOpts + '</select></div>' +
        '<div class="field"><label>KPI</label><select id="flKpi"><option value="">' + t('Any') + '</option>' +
        ['served','visit','apk','active'].map(function (k) { return '<option value="' + k + '">' + KL[k] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('Status') + '</label><select id="flStatus"><option value="">' + t('All') + '</option><option value="ok">' + t('Matched') + '</option><option value="bad">' + t('Mismatch') + '</option></select></div>' +
        '<button class="ghost" data-action="flClear">' + t('Clear') + '</button></div>' +
        '<div class="tablewrap tall"><table><thead><tr><th>' + t('Status') + '</th><th>BDO</th><th>KPI</th><th>' + t('Agent') + '</th><th>' + t('Branch') + '</th><th>' + t('Station') + '</th><th>' + t('Detail') + '</th><th>' + t('When') + '</th></tr></thead><tbody id="flBody">' + mmRows + okRows + '</tbody></table></div>' +
        '<div class="note" style="margin-top:6px"><b>' + (d.flags || []).length + '</b> ' + t('mismatch') + ' &middot; <b>' + (d.matched || []).length + '</b> ' + t('matched') + ' &middot; <span id="flShown">' + ((d.flags || []).length + (d.matched || []).length) + '</span> ' + t('shown') + '</div>' +
        '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* live client-side filter over the flags list */
  function flApply() {
    var q = (elById('flSearch') ? elById('flSearch').value.trim().toLowerCase() : '');
    var b = (elById('flBdo') ? elById('flBdo').value : '');
    var k = (elById('flKpi') ? elById('flKpi').value : '');
    var s = (elById('flStatus') ? elById('flStatus').value : '');
    var rows = document.querySelectorAll('#flBody tr.fl-row');
    var shown = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var ok = true;
      if (q && (r.getAttribute('data-search') || '').indexOf(q) < 0) ok = false;
      if (ok && b && r.getAttribute('data-bdo') !== b) ok = false;
      if (ok && k && r.getAttribute('data-kpi') !== k) ok = false;
      if (ok && s) {
        var isMismatch = r.querySelector('.pill.bad') !== null;
        if (s === 'ok' && isMismatch) ok = false;
        if (s === 'bad' && !isMismatch) ok = false;
      }
      r.style.display = ok ? '' : 'none';
      if (ok) shown++;
    }
    var t2 = elById('flShown'); if (t2) t2.textContent = shown;
  }

  function viewField(v) {
    api('base', { qs: state.month ? '&month=' + state.month : '' }).then(function (d) {
      var editable = can('mybase', 'e') && d.monthStatus === 'OPEN';
      var special = (d.special || []).map(function (a) {
        return '<tr><td class="c-name">' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div></td>' +
          '<td class="c-meta" data-l="phone">' + telHtml(a.phone) + '</td>' +
          '<td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
          '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td>' +
          '<td class="c-kpis">' + (editable && !a.physical_location
            ? '<button class="kchip todo" data-action="setLoc" data-id="' + a.id + '" data-name="' + esc(a.name) + '">' + svg('pin') + ' ' + t('Set location') + '</button>'
            : (a.physical_location ? '<span class="pill ok">' + t('located') + '</span>' : '-')) + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="note">' + t('No partner-served agents right now.') + '</td></tr>';

      v.innerHTML =
        greetingLine() +
        '<h1 class="page-title">' + t('Field Tasks') + '</h1>' +
        '<p class="page-sub">' + t('Agents you can CLAIM. They join your base only once you act on them - they do not touch your performance until then.') + '</p>' +
        '<div class="panel"><h2>' + svg('alert') + t('Special agents - served by PARTNERS') + ' (' + (d.special || []).length + ')</h2>' +
        '<p class="note">' + t('The partner served these agents. Visit them, capture the physical location and take them into your base.') + '</p>' +
        '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>Agent</th><th>Phone</th><th>Branch</th><th>Location</th><th>Action</th></tr></thead><tbody>' + special + '</tbody></table></div></div>' +
        '<div id="inactivePanel"></div>';
      inactivePanelLoad();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }

  /* ---------------- Messages (every member's box) ---------------- */
  function viewInbox(v) {
    api('messages_get').then(function (msgs) {
      var rows = (msgs || []).map(function (m2) {
        var kindPill = m2.kind === 'feedback' ? '<span class="pill fire">' + t('MARKET FEEDBACK') + '</span> '
          : m2.kind === 'reply' ? '<span class="pill gold">' + t('REPLY') + '</span> ' : '';
        var toTag = m2.to_user === '' ? '<span class="pill dim">' + t('everyone') + '</span>'
          : m2.to_user === 'mgmt' ? '<span class="pill gold">' + t('to management') + '</span>'
          : '<span class="pill ok">' + t('to you') + '</span>';
        return '<div class="msg-item">' +
          '<div class="msg-head"><b>' + esc(m2.from_user) + '</b> ' + toTag + ' <span class="note">' + esc((m2.at || '').slice(0, 16)) + '</span></div>' +
          '<div class="msg-body">' + kindPill + esc(m2.body) + '</div>' +
          '<div class="row" style="margin-top:6px">' +
          (m2.from_user !== state.user.username ? '<button class="ghost tiny" data-action="msgReply" data-id="' + m2.id + '" data-from="' + esc(m2.from_user) + '" data-body="' + esc(m2.body) + '">' + t('Reply') + '</button>' : '') +
          '<button class="ghost tiny" data-action="msgDismiss" data-id="' + m2.id + '">' + t('Delete for me') + '</button></div></div>';
      }).join('') || '<div class="note">' + t('No messages yet.') + '</div>';
      var fb = can('mybase', 'e')
        ? '<div class="panel"><h2>' + svg('flame') + t('Market feedback - complaints, opinions, suggestions') + '</h2>' +
          '<p class="note">' + t('What you face in the market goes straight to your team leader and the operational manager.') + '</p>' +
          '<div class="row"><input id="fbBody" maxlength="500" style="flex:1;min-width:220px" placeholder="' + esc(t('e.g. agents in Kaloleni complain about float delays...')) + '">' +
          '<button class="btn" data-action="fbSend">' + t('Send to management') + '</button></div></div>'
        : '';
      v.innerHTML =
        greetingLine() +
        '<h1 class="page-title">' + t('Messages') + '</h1>' +
        '<p class="page-sub">' + t('Newest first. Reply to the sender, or delete a message from your own box once read.') + '</p>' +
        fb +
        '<div class="panel"><h2>' + svg('mail') + t('Your box') + '</h2>' + rows + '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }

  /* ---------------- Data Manager (OM/superadmin) ---------------- */
  function viewData(v) {
    Promise.all([api('uploads_list'), api('members_list')]).then(function (rr) {
      var ups = rr[0].rows || [];
      var members = (rr[1] || []).filter(function (m) { return m.username !== state.user.username; });
      var upRows = ups.map(function (u) {
        return '<tr><td>' + esc((u.at || '').slice(0, 16)) + '</td><td>' + esc(u.month) + '</td><td>' + esc(u.week || '-') + '</td>' +
          '<td>' + esc(u.label) + '</td><td>' + esc(u.by_user) + '</td><td>' + fmt(u.rows_count) + '</td>' +
          '<td><button class="ghost mini" data-action="upRename" data-id="' + u.id + '" data-label="' + esc(u.label) + '">Rename</button> ' +
          '<button class="danger mini" data-action="upErase" data-id="' + u.id + '" data-label="' + esc(u.label) + '">Erase</button></td></tr>';
      }).join('') || '<tr><td colspan="7" class="note">No uploads registered yet. New uploads appear here with their date and time.</td></tr>';
      var memChecks = members.map(function (m) {
        return '<label class="kchip todo" style="cursor:pointer"><input type="checkbox" class="mSel" value="' + esc(m.username) + '" style="accent-color:var(--fire2);margin-right:5px">' + esc(m.name) + ' (' + esc(m.username) + ')</label>';
      }).join(' ');
      v.innerHTML =
        '<h1 class="page-title">Data Manager</h1>' +
        '<p class="page-sub">Every eraser in one place. Performance and all reports recalculate instantly after any erase. Everything here is audit-logged.</p>' +

        '<div class="panel"><h2>' + svg('upload') + 'Uploaded Excel files</h2>' +
        '<p class="note">Every upload is saved with its exact date &amp; time, label and who uploaded it. Erasing one removes its rows and the credits it created; the month\'s office numbers fall back to the latest remaining upload.</p>' +
        '<div class="tablewrap"><table><thead><tr><th>When</th><th>Month</th><th>Week</th><th>Label</th><th>By</th><th>Rows</th><th></th></tr></thead><tbody>' + upRows + '</tbody></table></div>' +
        '<div class="row" style="margin-top:10px"><button class="danger" data-action="exErase">Erase ALL Excel data</button>' +
        '<span class="note">removes every upload, all office numbers and file statuses - agents and BDO live work stay</span></div></div>' +

        '<div class="panel"><h2>' + svg('users') + 'One BDO - inspect &amp; erase</h2>' +
        '<p class="note">See what is attributed to him, delete single typed reports, or erase his month / everything - marks, base and file credits included, his performance returns to zero (type his username to confirm).</p>' +
        '<div class="row"><div class="field"><label>BDO</label><select id="bdSel"><option value="">pick...</option>' +
        members.map(function (m) { return '<option value="' + esc(m.username) + '">' + esc(m.name) + ' (' + esc(m.username) + ')</option>'; }).join('') +
        '</select></div><button class="ghost" data-action="bdLoad">Load his data</button></div>' +
        '<div id="bdBox" style="margin-top:10px"></div></div>' +

        '<div class="panel"><h2>' + svg('alert') + 'Erase BDO data - tick members or take everyone</h2>' +
        '<p class="note">Removes EVERYTHING attributed to them: agent marks including the ones the uploaded file gave (+proof photos), typed reports, won\'t-return marks, pipeline forms, shortages and their saved base. Performance reads ZERO after. Office month totals stay until you erase uploads above.</p>' +
        '<div class="row" style="margin-bottom:8px">' + (memChecks || '<span class="note">no members</span>') + '</div>' +
        '<div class="row"><div class="field"><label>Scope</label><select id="mScope"><option value="month">This month only</option><option value="all">Everything (all months)</option></select></div>' +
        '<button class="danger" data-action="mEraseSel">Erase ticked members</button>' +
        '<button class="danger" data-action="mEraseAll">Erase ALL BDO data at once</button></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* one confirm pattern for every big eraser: type ERASE to proceed */
  function dmConfirm(title, note, action, attrs) {
    var extra = '';
    Object.keys(attrs || {}).forEach(function (k) { extra += ' data-' + k + '="' + esc(String(attrs[k])) + '"'; });
    openModal('<h2>' + svg('alert') + ' ' + title + '</h2>' +
      '<p class="note">' + note + ' This cannot be undone.</p>' +
      '<div class="field"><label>Type <b>ERASE</b> to confirm</label><input id="dmWord" autocomplete="off"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
      '<button class="danger" data-action="' + action + '"' + extra + '>Erase now</button></div>');
  }
  function dmWordOk() {
    var w = elById('dmWord');
    if (!w || w.value.trim().toUpperCase() !== 'ERASE') { toast('Type ERASE to confirm', 'warn'); return false; }
    return true;
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
        var specSel = prot ? '-'
          : '<select data-change="uSpec" data-id="' + u.id + '">' +
            '<option value=""' + (!u.specialty ? ' selected' : '') + '>General</option>' +
            '<option value="activeness"' + (u.specialty === 'activeness' ? ' selected' : '') + '>Activeness (wake + recruit only)</option></select>';
        return '<tr><td>' + esc(u.username) + '</td><td>' + esc(u.name) + '</td><td>' + roleSel + '</td><td>' + specSel + '</td><td>' + esc(u.station || '-') + '</td>' +
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
        '<div class="tablewrap"><table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Specialty</th><th>Station</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + userRows + '</tbody></table></div></div>' +
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
    if (a === 'tab') {
      var toTab = node.getAttribute('data-tab');
      /* fresh visit to the agent list starts clean - a stale search/filter left
       * in the box after navigating away confused people */
      if (toTab !== state.tab) {
        state._agentSearch = ''; state._agentField = ''; state.agentPage = 1;
        state._fserved = state._fvisit = state._fapk = state._factive = '';
      }
      state.tab = toTab; renderShell(); return;
    }
    if (a === 'toggleTheme') { toggleTheme(); themePicker(); return; }
    if (a === 'themePick') { themePicker(); return; }
    if (a === 'palSet') { setPalette(node.getAttribute('data-p')); renderShell(); themePicker(); return; }
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
    if (a === 'liveLoad') { liveTodayLoad(); return; }
    if (a === 'flLoad') { state._flagsMonth = elById('flMonth').value; renderTab(); return; }
    if (a === 'flClear') {
      ['flSearch','flBdo','flKpi','flStatus'].forEach(function (id) { var el = elById(id); if (el) el.value = ''; });
      flApply(); return;
    }
    if (a === 'liveWinAll' || a === 'liveWinMorning' || a === 'liveWinAfternoon' || a === 'liveWinEvening') {
      var win = a === 'liveWinAll' ? ['00:00', '23:59']
              : a === 'liveWinMorning' ? ['06:00', '12:00']
              : a === 'liveWinAfternoon' ? ['12:00', '17:00']
              : ['17:00', '23:59'];
      if (elById('liveFrom')) elById('liveFrom').value = win[0];
      if (elById('liveTo')) elById('liveTo').value = win[1];
      liveTodayLoad();
      return;
    }
    if (a === 'liveDownload') { liveDownload(); return; }
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
    if (a === 'kpiUnmark') { kpiUnmark(node.getAttribute('data-id'), node.getAttribute('data-kpi'), node); return; }
    if (a === 'locConfirm') { var lv2 = elById('locInput').value.trim(); if (!lv2) { toast('Type the physical location', 'warn'); return; } var n2 = state._locNode; closeModal(); kpiMark(node.getAttribute('data-id'), node.getAttribute('data-kpi'), node.getAttribute('data-name'), n2, lv2); return; }
    if (a === 'proofConfirm') {
      var pNoteV = (elById('proofNote') ? elById('proofNote').value.trim() : '');
      var pLocV = (elById('proofLoc') ? elById('proofLoc').value.trim() : '');
      if (!state._proofData && pNoteV.length < 10) { toast(t('Take the receipt photo first'), 'warn'); return; }
      if (!pLocV) { toast(t('Confirm his physical location (for the follow-up)'), 'warn'); return; }
      var n3 = state._locNode, pd = state._proofData; state._proofData = ''; closeModal();
      kpiMark(node.getAttribute('data-id'), 'active', node.getAttribute('data-name'), n3, pLocV, pd, pNoteV);
      return;
    }
    if (a === 'viewProof') {
      var pNote = node.getAttribute('data-note') || '';
      openModal('<h2>' + svg('eye') + ' ' + t('Receipt proof') + ' &mdash; ' + esc(node.getAttribute('data-name') || '') + '</h2>' +
        (pNote ? '<p class="note" style="border:1px dashed var(--line);border-radius:10px;padding:10px">&ldquo;' + esc(pNote) + '&rdquo;</p>' : '') +
        '<img src="api.php?action=wake_proof&agent=' + node.getAttribute('data-id') + '" alt="receipt photo" style="max-width:100%;border-radius:12px;margin-top:8px" onerror="this.style.display=\'none\'">' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">' + t('Close') + '</button></div>');
      return;
    }
    if (a === 'recruit') { recruitModal(); return; }
    if (a === 'recruitSave') { recruitSave(); return; }
    if (a === 'rrDownload') { rrDownload(); return; }
    if (a === 'wontReturn') {
      if (node.getAttribute('data-marked')) {
        api('wont_return_toggle', { body: { agentId: Number(node.getAttribute('data-id')) } })
          .then(function () { toast(t('Removed from the won\'t-return list'), 'ok'); if (state.tab === 'agents') agentsBodyLoad(); else renderTab(); })
          .catch(function (e2) { toast(e2.message, 'err'); });
        return;
      }
      openModal('<h2>' + svg('alert') + ' ' + esc(node.getAttribute('data-name')) + '</h2>' +
        '<p class="note">' + t('Only mark this if you CONTACTED the agent and he CONFIRMED he will not return to work. He goes on the deletion-discussion list the OM can download.') + '</p>' +
        '<div class="field"><label>' + t('Note (what did he say?)') + '</label><input id="wrNote" maxlength="255" placeholder="' + esc(t('e.g. moved to Dodoma, sold the POS')) + '"></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
        '<button class="danger" data-action="wrGo" data-id="' + node.getAttribute('data-id') + '">' + t('Mark won\'t return') + '</button></div>');
      return;
    }
    if (a === 'wrGo') {
      api('wont_return_toggle', { body: { agentId: Number(node.getAttribute('data-id')), note: elById('wrNote').value.trim() } })
        .then(function () { closeModal(); toast(t('Marked - on the deletion-discussion list'), 'ok'); if (state.tab === 'agents') agentsBodyLoad(); else renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'pipeAdd') {
      /* first question: is this agent ALREADY recruited, or is it a form to submit? */
      openModal('<h2>' + svg('users') + ' ' + t('New agent - which one?') + '</h2>' +
        '<p class="note">' + t('Pick what you have in front of you.') + '</p>' +
        '<button class="btn" data-action="recruit" style="width:100%;margin-bottom:10px">' + t('Agent recruited ALREADY') + '<br><small style="font-weight:600">' + t('type name, acc, branch, phone, location - done') + '</small></button>' +
        '<button class="ghost" data-action="pipeFormNew" style="width:100%">' + t('Form of agent TO BE SUBMITTED') + '<br><small style="font-weight:600">' + t('follows the stages: audit, approval, POS, acc') + '</small></button>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">' + t('Cancel') + '</button></div>');
      return;
    }
    if (a === 'pipeFormNew') {
      openModal('<h2>' + svg('users') + ' ' + t('New agent form (stage 1)') + '</h2>' +
        '<p class="note">' + t('The form is submitted at the branch and held by the BANK CHAMPION. It moves: audit -> approved -> paid & POS -> acc + location (becomes a real agent, counted in your Activeness).') + '</p>' +
        '<div class="field"><label>Agent name</label><input id="ppName"></div>' +
        '<div class="field"><label>Branch</label><input id="ppBranch"></div>' +
        '<div class="field"><label>Bank champion (holds the form)</label><input id="ppChamp"></div>' +
        '<div class="field"><label>Phone (optional)</label><input id="ppPhone" inputmode="tel"></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
        '<button class="btn" data-action="pipeAddGo">' + t('Save form') + '</button></div>');
      return;
    }
    if (a === 'pipeAddGo') {
      api('recruit_pipe_add', { body: { name: elById('ppName').value.trim(), branch: elById('ppBranch').value.trim(), champion: elById('ppChamp').value.trim(), phone: elById('ppPhone').value.trim() } })
        .then(function () { closeModal(); toast(t('Form saved - stage 1'), 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'pipeNext') {
      var pStage = Number(node.getAttribute('data-stage'));
      if (pStage === 4) {
        openModal('<h2>' + svg('check') + ' ' + t('Finish: make him a real agent') + '</h2>' +
          '<p class="note">' + esc(node.getAttribute('data-name')) + ' - ' + t('paid and POS assigned. Fill his acc number and physical location; he becomes ACTIVE and counts in your Activeness.') + '</p>' +
          '<div class="field"><label>Acc number</label><input id="ppAcc"></div>' +
          '<div class="field"><label>Physical location</label><input id="ppLoc"></div>' +
          '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
          '<button class="btn" data-action="pipeFinish" data-id="' + node.getAttribute('data-id') + '">' + t('Create agent') + '</button></div>');
        return;
      }
      api('recruit_pipe_advance', { body: { id: Number(node.getAttribute('data-id')) } })
        .then(function (d) { toast(t('Moved to stage') + ' ' + d.stage, 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'pipeFinish') {
      api('recruit_pipe_advance', { body: { id: Number(node.getAttribute('data-id')), acc: elById('ppAcc').value.trim(), location: elById('ppLoc').value.trim() } })
        .then(function () { closeModal(); toast(t('Agent created - counted in your Activeness'), 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'pipeDownload') { pipeDownload(); return; }
    if (a === 'wrDownload') { wrDownload(); return; }
    if (a === 'setLoc') { setLocModal(node.getAttribute('data-id'), node.getAttribute('data-name')); return; }
    if (a === 'setLocGo') { api('agent_location_set', { body: { agentId: Number(node.getAttribute('data-id')), location: elById('locInput').value } }).then(function () { closeModal(); toast('Location saved', 'ok'); renderTab(); }).catch(function (e2) { toast(e2.message, 'err'); }); return; }
    if (a === 'togglePw') { var pi = elById(node.getAttribute('data-for')); if (pi) pi.type = pi.type === 'password' ? 'text' : 'password'; return; }
    if (a === 'locExport') { locExport(); return; }
    if (a === 'drSave') { drSave(); return; }
    if (a === 'shortage') { shortageModal(); return; }
    if (a === 'shortageSave') { shortageSave(); return; }
    if (a === 'msgSend') { msgSend(); return; }
    if (a === 'msgEdit') {
      openModal('<h2>' + svg('mail') + ' Edit message</h2>' +
        '<div class="field"><label>Message</label><input id="msgEditBody" maxlength="500" value="' + esc(node.getAttribute('data-body') || '') + '"></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
        '<button class="btn" data-action="msgEditGo" data-id="' + node.getAttribute('data-id') + '">Save</button></div>');
      return;
    }
    if (a === 'msgEditGo') {
      api('message_update', { body: { id: Number(node.getAttribute('data-id')), body: elById('msgEditBody').value } })
        .then(function () { closeModal(); toast('Message updated', 'ok'); msgMgrLoad(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'msgDel') {
      openModal('<h2>' + svg('alert') + ' Delete message?</h2>' +
        '<p class="note">Members will no longer see it.</p>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
        '<button class="danger" data-action="msgDelGo" data-id="' + node.getAttribute('data-id') + '">Delete</button></div>');
      return;
    }
    if (a === 'msgDelGo') {
      api('message_delete', { body: { id: Number(node.getAttribute('data-id')) } })
        .then(function () { closeModal(); toast('Message deleted', 'ok'); msgMgrLoad(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'bdLoad') { bdLoad(); return; }
    if (a === 'shortApprove') {
      api('shortage_approve', { body: { id: Number(node.getAttribute('data-id')) } })
        .then(function () { toast('Shortage approved - top management can now see it', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'routeOk' || a === 'routeNo') {
      api('route_plan_review', { body: { id: Number(node.getAttribute('data-id')), approve: a === 'routeOk' ? 1 : 0 } })
        .then(function (d) { toast('Route ' + d.status, 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'routeAssign') {
      api('route_assign', { body: { bdo: elById('raBdo').value, plan: elById('raPlan').value.trim() } })
        .then(function () { toast('Route assigned', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'routeSave') {
      api('route_plan_save', { body: { plan: elById('rpPlan').value.trim() } })
        .then(function () { toast(t('Route plan sent - waiting for your team leader'), 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'msgReply') {
      openModal('<h2>' + svg('mail') + ' ' + t('Reply to') + ' ' + esc(node.getAttribute('data-from')) + '</h2>' +
        '<p class="note" style="border:1px dashed var(--line);border-radius:10px;padding:8px">&ldquo;' + esc(node.getAttribute('data-body') || '') + '&rdquo;</p>' +
        '<div class="field"><label>' + t('Your reply') + '</label><input id="mrBody" maxlength="500"></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
        '<button class="btn" data-action="msgReplyGo" data-id="' + node.getAttribute('data-id') + '">' + t('Send reply') + '</button></div>');
      return;
    }
    if (a === 'msgReplyGo') {
      api('message_reply', { body: { id: Number(node.getAttribute('data-id')), body: elById('mrBody').value.trim() } })
        .then(function () { closeModal(); toast(t('Reply sent'), 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'msgDismiss') {
      api('message_dismiss', { body: { id: Number(node.getAttribute('data-id')) } })
        .then(function () { toast(t('Message removed from your inbox'), 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'fbSend') {
      api('feedback_send', { body: { body: elById('fbBody').value.trim() } })
        .then(function () { elById('fbBody').value = ''; toast(t('Sent to your team leader and the OM'), 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'upRename') {
      openModal('<h2>' + svg('upload') + ' Rename upload</h2>' +
        '<div class="field"><label>Label</label><input id="upNewLabel" maxlength="160" value="' + esc(node.getAttribute('data-label') || '') + '"></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
        '<button class="btn" data-action="upRenameGo" data-id="' + node.getAttribute('data-id') + '">Save</button></div>');
      return;
    }
    if (a === 'upRenameGo') {
      api('upload_label', { body: { id: Number(node.getAttribute('data-id')), label: elById('upNewLabel').value.trim() } })
        .then(function () { closeModal(); toast('Upload renamed', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'upErase') {
      dmConfirm('Erase this upload?', '"' + esc(node.getAttribute('data-label') || '') + '" - its rows and the credits it created are removed; the month\'s office numbers fall back to the latest remaining upload.', 'upEraseGo', { id: node.getAttribute('data-id') });
      return;
    }
    if (a === 'upEraseGo') {
      if (!dmWordOk()) return;
      api('upload_erase', { body: { id: Number(node.getAttribute('data-id')) } })
        .then(function (d) { closeModal(); toast('Upload erased: ' + d.deleted.services + ' rows, ' + d.deleted.marks + ' credits', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'exErase') {
      dmConfirm('Erase ALL Excel data?', 'Every upload, every office number and every file status disappears everywhere. Agents and BDO live work stay.', 'exEraseGo', {});
      return;
    }
    if (a === 'exEraseGo') {
      if (!dmWordOk()) return;
      api('excel_erase_all', { body: {} })
        .then(function (d) { closeModal(); toast('Excel data erased: ' + d.deleted.services + ' rows, ' + d.deleted.marks + ' credits, ' + d.deleted.uploads + ' uploads', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'mEraseSel') {
      var mSel = Array.prototype.slice.call(document.querySelectorAll('.mSel:checked')).map(function (c) { return c.value; });
      if (!mSel.length) { toast('Tick at least one member', 'warn'); return; }
      dmConfirm('Erase ' + mSel.length + ' member(s)?', mSel.join(', ') + ' - scope: ' + (elById('mScope').value === 'all' ? 'EVERYTHING' : 'this month') + '.', 'mEraseGo', { bdos: mSel.join(','), scope: elById('mScope').value });
      return;
    }
    if (a === 'mEraseAll') {
      dmConfirm('Erase ALL BDO data at once?', 'Every member\'s filled work goes - scope: ' + (elById('mScope').value === 'all' ? 'EVERYTHING' : 'this month') + '.', 'mEraseGo', { bdos: 'ALL', scope: elById('mScope').value });
      return;
    }
    if (a === 'mEraseGo') {
      if (!dmWordOk()) return;
      api('bdo_data_erase', { body: { bdos: node.getAttribute('data-bdos').split(','), scope: node.getAttribute('data-scope') } })
        .then(function (d) { closeModal(); toast('Erased ' + d.bdos.length + ' member(s): ' + d.deleted.marks + ' marks, ' + d.deleted.reports + ' reports', 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'bdDelReport') {
      api('daily_report_delete', { body: { id: Number(node.getAttribute('data-id')) } })
        .then(function () { toast('Report deleted - the day reads as missed again', 'ok'); bdLoad(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'bdErase') {
      var ebdo = node.getAttribute('data-bdo'), escope = node.getAttribute('data-scope');
      openModal('<h2>' + svg('alert') + ' Erase ' + esc(ebdo) + '\'s data?</h2>' +
        '<p class="note">' + (escope === 'all'
          ? 'EVERYTHING he ever filled will be deleted: agent marks, daily reports, won\'t-return marks, pipeline forms, shortages. Proof photos are removed too. This cannot be undone.'
          : 'Everything he filled THIS MONTH will be deleted: agent marks, daily reports, won\'t-return marks, pipeline forms, shortages. Agents he waked go back to INACTIVE. This cannot be undone.') + '</p>' +
        '<div class="field"><label>Type his username (<b>' + esc(ebdo) + '</b>) to confirm</label><input id="bdConfirm" autocomplete="off"></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="ghost" data-action="closeModal">Cancel</button>' +
        '<button class="danger" data-action="bdEraseGo" data-bdo="' + esc(ebdo) + '" data-scope="' + esc(escope) + '">Erase ' + (escope === 'all' ? 'EVERYTHING' : 'this month') + '</button></div>');
      return;
    }
    if (a === 'bdEraseGo') {
      if (elById('bdConfirm').value.trim().toLowerCase() !== node.getAttribute('data-bdo')) {
        toast('Type the username exactly to confirm', 'warn'); return;
      }
      api('bdo_data_erase', { body: { bdo: node.getAttribute('data-bdo'), scope: node.getAttribute('data-scope') } })
        .then(function (d) {
          closeModal();
          toast('Erased: ' + d.deleted.marks + ' marks, ' + d.deleted.reports + ' reports, ' + d.deleted.wontReturn + ' won\'t-return, ' + d.deleted.recruits + ' forms', 'ok');
          bdLoad();
        })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
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
    if (n && n.getAttribute && n.getAttribute('data-change') === 'uSpec') { uPatch(n.getAttribute('data-id'), { specialty: n.value }); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'dashStation') { state._dashStation = n.value; renderTab(); return; }
    if (n && n.getAttribute && ['agentField','fserved','fvisit','fapk','factive'].indexOf(n.getAttribute('data-change')) >= 0) {
      state['_' + (n.getAttribute('data-change') === 'agentField' ? 'agentField' : n.getAttribute('data-change'))] = n.value;
      state.agentPage = 1; agentsBodyLoad(); return;
    }
    if (n && n.id === 'btBdo') { state._btBdo = n.value; renderTab(); return; }
    if (n && n.id === 'agentPer') { state.agentPer = Number(n.value); state.agentPage = 1; agentsBodyLoad(); return; }
    if (n && n.id && ['flBdo','flKpi','flStatus'].indexOf(n.id) >= 0) { flApply(); return; }
    if (n && n.classList && n.classList.contains('kpivis')) { var lbl = n.closest('label'); if (lbl) lbl.classList.toggle('on', n.checked); return; }
  }
  var _searchTimer = null;
  function onInput(e) {
    if (e.target && e.target.classList && e.target.classList.contains('bt-w')) { btUpdateSum(); return; }
    if (e.target && e.target.classList && e.target.classList.contains('tg-w')) { tgUpdateSum(); return; }
    if (e.target && ['flSearch','flBdo','flKpi','flStatus'].indexOf(e.target.id) >= 0) { flApply(); return; }
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
