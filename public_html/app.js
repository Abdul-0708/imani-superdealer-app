/* IMANI SUPERDEALER - front-end SPA (PHP backend, session auth). */
(function () {
  'use strict';

  /* Must match APP_VERSION in lib/helpers.php. If they differ, only SOME files
   * were uploaded - the app says so loudly instead of behaving strangely. */
  var APP_VERSION = '1.44.0';

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
    'Take photo': 'Piga picha',
    'Choose from gallery': 'Chagua kwenye ghala la picha',
    'Take the receipt photo now, or attach one already saved on your phone.':
      'Piga picha ya risiti sasa, au ambatanisha iliyoko kwenye simu yako.',
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
    'High-earner list': 'Orodha ya mapato',
    'Wake sleeping agents and recruit new ones - both build the SAME Activeness KPI this month.':
      'Amsha mawakala waliolala na sajili wapya - vyote vinajenga KPI ILE ILE ya Activeness mwezi huu.',
    'Recruit a new agent': 'Sajili wakala mpya',
    'A brand-new agent you bring in counts in your Activeness exactly like waking a sleeping one.':
      'Wakala mpya unayemleta anahesabika kwenye Activeness yako sawa kabisa na kumuamsha aliyelala.',
    'the agents you served - finish their other KPIs right here':
      'mawakala uliowahudumia - maliza KPI zao nyingine hapa hapa',
    'My agents': 'Mawakala wangu',
    'High earners': 'Wenye mapato makubwa',
    'Nothing here yet': 'Bado hakuna kitu hapa',
    'Agents join this list the moment you serve them on the Agents tab.':
      'Mawakala wanaingia kwenye orodha hii mara tu unapowahudumia kwenye kichupo cha Mawakala.',
    'name, acc, branch, location, LIST A...': 'jina, acc, tawi, mahali, ORODHA A...',
    'High earners I served': 'Wenye mapato makubwa niliowahudumia',
    'How valuable your serving was - by high-earner list.': 'Thamani ya kuhudumia kwako - kwa orodha ya mapato.',
    'High total': 'Jumla kubwa',
    'Today': 'Leo',
    'This week': 'Wiki hii',
    'This month': 'Mwezi huu',
    'Messages from administration': 'Ujumbe kutoka utawalani',
    'Open Messages': 'Fungua Ujumbe',
    'No targets set yet.': 'Bado hakuna malengo yaliyowekwa.',
    'GOING BACKWARDS': 'INARUDI NYUMA',
    'Type only FLOAT here. Every other KPI is ticked on the agent itself, so we always know which agent was handled by whom.':
      'Andika FLOAT tu hapa. KPI nyingine zote zinawekwa kwa wakala mwenyewe, ili tujue nani alishughulikiwa na nani.',
    'Serving, visits, APK and activeness: tick them on the agent, not here.':
      'Kuhudumia, visits, APK na activeness: ziweke kwa wakala, si hapa.',
    'Tick the places you will visit - they fill the route below.':
      'Chagua sehemu utakazotembelea - zitajaza njia hapa chini.',
    'Save a place for next time': 'Hifadhi sehemu kwa mara nyingine',
    'Save place': 'Hifadhi sehemu',
    'Place saved': 'Sehemu imehifadhiwa',
    'Type the place name': 'Andika jina la sehemu',
    'e.g. Kaloleni': 'mf. Kaloleni',
    'From day': 'Kuanzia siku',
    'To day': 'Hadi siku',
    'All agents': 'Mawakala wote',
    'Every agent, one sheet per BDO': 'Kila wakala, ukurasa mmoja kwa kila BDO',
    'agents exported - one sheet per BDO': 'mawakala wamepakuliwa - ukurasa mmoja kwa kila BDO',
    'No agents to export': 'Hakuna mawakala wa kupakua',
    'Flags against me': 'Alama dhidi yangu',
    'need your answer': 'zinahitaji jibu lako',
    'all answered': 'zote zimejibiwa',
    'All KPI': 'KPI zote',
    'total': 'jumla',
    'No flags on this KPI.': 'Hakuna alama kwenye KPI hii.',
    'When I did it': 'Nilipofanya',
    'flagged': 'imewekewa alama',
    /* KPI names (Served / Visit / APK / Activeness) stay in English by request */
    'Live work today - whole team': 'Kazi mubashara leo - timu nzima',
    'view only': 'kuangalia tu',
    'What everyone ticked inside the chosen time window (EAT). You can watch it, not download it.':
      'Kila kilichowekwa alama ndani ya muda uliochagua (EAT). Unaweza kuangalia, huwezi kupakua.',
    'Only management can download the live board': 'Ni menejimenti pekee wanaoweza kupakua bodi ya mubashara',
    'Attach the receipt photo of what he transacted as your proof of serving.':
      'Ambatanisha picha ya risiti ya alichofanya kama uthibitisho wa kumhudumia.',
    'The file says the PARTNER served this agent': 'Faili linasema MSHIRIKA ndiye alimhudumia wakala huyu',
    'You can still claim him if the visit was yours, but the receipt photo is compulsory and your OM is told so he can decide.':
      'Bado unaweza kumdai kama ziara ilikuwa yako, lakini picha ya risiti ni lazima na OM wako ataarifiwa ili aamue.',
    'Grow my round': 'Kuza mzunguko wangu',
    'SECTION 1 - FROM THE PERFORMANCE FILE': 'SEHEMU 1 - KUTOKA FAILI LA UTENDAJI',
    'SECTION 2 - THE FILE PLUS THE FIELD': 'SEHEMU 2 - FAILI PAMOJA NA KAZI YA UWANDANI',
    'The office result exactly as the uploaded file reports it. This is the number the commission is settled on.':
      'Matokeo ya ofisi kama faili lililopakiwa linavyoripoti. Hii ndiyo namba kamisheni inayolipwa kwayo.',
    'Same month and station as the section above.': 'Mwezi na kituo sawa na sehemu iliyo juu.',
    'BDOs': 'Maafisa (BDO)',
    'Officer': 'Afisa',
    'Officers': 'Maafisa',
    'Base': 'Msingi',
    'Covered': 'Imefikiwa',
    'High earners served': 'Wanaolipa zaidi waliohudumiwa',
    'Still untouched': 'Bado hawajafikiwa',
    'High earners NOT served': 'Wanaolipa zaidi AMBAO hawajahudumiwa',
    'The money still sitting in his round. Biggest list first.':
      'Fedha bado zipo kwenye mzunguko wake. Orodha kubwa kwanza.',
    'Ordered by high earners still untouched - the officer at the top is the one to speak to today.':
      'Imepangwa kwa wanaolipa zaidi ambao hawajafikiwa - afisa wa juu ndiye wa kuzungumza naye leo.',
    'Every officer\'s round, how far through it he is, and the high earners he has not reached yet. Tap a name to open him.':
      'Mzunguko wa kila afisa, amefikia wapi, na wanaolipa zaidi ambao hajawafikia. Gusa jina kumfungua.',
    'All officers': 'Maafisa wote',
    'His round': 'Mzunguko wake',
    'His whole round': 'Mzunguko wake wote',
    'Still to serve': 'Bado kuhudumia',
    'not served': 'hajahudumiwa',
    'all served': 'wote wamehudumiwa',
    'to go': 'zimebaki',
    'left': 'zimebaki',
    'More': 'Zaidi',
    'Database Upload': 'Upakiaji wa Database',
    'Every office file comes in here. Pick what kind it is - only the performance file scores anybody or raises a flag.':
      'Kila faili la ofisi linaingia hapa. Chagua ni aina gani - faili la utendaji pekee ndilo linalotoa alama au kuweka bendera.',
    'What are you uploading?': 'Unapakia nini?',
    'scores': 'inatoa alama',
    'This file scores and flags': 'Faili hili linatoa alama na bendera',
    'Updates the database only - never scores, never flags':
      'Linasasisha database tu - halitoi alama wala bendera',
    'Columns': 'Safu',
    'Clear result': 'Futa matokeo',
    'Importing': 'Inapakia',
    'rows...': 'safu...',
    'No scores and no flags from this file': 'Hakuna alama wala bendera kutoka faili hili',
    'new agents added': 'mawakala wapya wameongezwa',
    '- BDOs can claim them under NEW in My Agent Base.':
      '- BDO wanaweza kuwachukua chini ya MPYA kwenye Base Yangu.',
    'weekly performance': 'utendaji wa wiki',
    'monthly database baseline': 'msingi wa database wa mwezi',
    'physical locations': 'maeneo halisi',
    'priority base': 'base ya kipaumbele',
    'commission rows saved': 'safu za kamisheni zimehifadhiwa',
    'Open Commission & Months to calculate the release.': 'Fungua Kamisheni na Miezi kukokotoa malipo.',
    'Commission file saved': 'Faili la kamisheni limehifadhiwa',
    'Upload complete': 'Upakiaji umekamilika',
    'Now showing': 'Sasa inaonyesha',
    'Now showing all stations': 'Sasa inaonyesha vituo vyote',
    'New agents to claim': 'Mawakala wapya wa kuchukua',
    'My round': 'Mzunguko wangu',
    'NEW - not yet mine': 'MPYA - bado si wangu',
    'Agents whose physical location nobody has captured are here too - go, find the place, serve him, and he becomes yours.':
      'Mawakala ambao hakuna aliyerekodi mahali walipo wapo hapa pia - nenda, tafuta mahali, mhudumie, naye atakuwa wako.',
    'Agents in the company database that no BDO owns this month. Serve one and he joins your round.':
      'Mawakala waliopo kwenye database ambao hakuna BDO aliyewachukua mwezi huu. Mhudumie mmoja naye anaingia kwenye mzunguko wako.',
    'All sections': 'Sehemu zote',
    'Main navigation': 'Urambazaji mkuu',
    'Home': 'Nyumbani',
    'My Base': 'Base Yangu',
    'Report': 'Ripoti',
    'Field': 'Uwandani',
    'Real Perf.': 'Utendaji',
    'Upload': 'Pakia',
    'Targets': 'Malengo',
    'Reports': 'Ripoti',
    'Settings': 'Mipangilio',
    'TEAM TODAY': 'TIMU LEO',
    'NO KPI RECORDED IN OVER 24 HOURS': 'HAKUNA KPI ILIYOWEKWA KWA ZAIDI YA MASAA 24',
    'You have not recorded a single KPI yet.': 'Bado hujaweka hata KPI moja.',
    'Your last KPI was': 'KPI yako ya mwisho ilikuwa',
    'that is': 'hiyo ni',
    'hours ago': 'masaa yaliyopita',
    'working days with nothing': 'siku za kazi bila kitu',
    'Your OM sees this too. Serve an agent, tick a visit or wake a dormant one today.':
      'OM wako anaona hii pia. Mhudumie wakala, weka alama ya ziara au mwamshe aliyelala leo.',
    'Open My Agent Base': 'Fungua Base Yangu ya Mawakala',
    'Base coverage - how much of his own round each BDO has served':
      'Ufikiaji wa base - kila BDO amehudumia kiasi gani cha mzunguko wake',
    'His round is the agents carried from last month plus anyone added to him this month. Served counts the ones he has actually done.':
      'Mzunguko wake ni mawakala waliobebwa kutoka mwezi uliopita pamoja na walioongezwa mwezi huu. Waliohudumiwa ni wale aliowafanyia kweli.',
    'His round': 'Mzunguko wake',
    'Still to serve': 'Waliobaki kuhudumiwa',
    'Covered': 'Amefikia',
    'No BDO has a round for this month yet.': 'Hakuna BDO mwenye mzunguko wa mwezi huu bado.',
    'Loading the photo...': 'Inapakia picha...',
    'Open the photo in a new tab': 'Fungua picha kwenye kichupo kipya',
    'The photo could not be loaded': 'Picha haikuweza kupakiwa',
    'The mark is still valid - only the picture is missing. Ask the BDO to re-attach it, or open the link below.':
      'Alama bado ni halali - picha tu ndiyo haipo. Muombe BDO aiambatanishe tena, au fungua kiungo hapa chini.',
    'Where each BDO\'s work is filed': 'Kazi ya kila BDO imehifadhiwa wapi',
    'in the wrong month': 'ziko kwenye mwezi usio sahihi',
    'all correctly filed': 'zote zimehifadhiwa sawa',
    'Serving credits per BDO per month. The bold column is the open month. A BDO who worked before the month rolled over can have his taps sitting in the previous column - the repair moves them by their own timestamp.':
      'Sifa za kuhudumia kwa kila BDO kwa mwezi. Safu iliyokolezwa ni mwezi ulio wazi. BDO aliyefanya kazi kabla mwezi haujabadilika anaweza kuwa na alama zake kwenye safu iliyopita - urekebishaji unazihamisha kwa muda wake wenyewe.',
    'Filed under': 'Imehifadhiwa chini ya',
    'Actually done in': 'Ilifanyika kweli',
    'Rows': 'Safu',
    'Re-file work by its own timestamp': 'Hamisha kazi kwa muda wake wenyewe',
    'Last run': 'Mara ya mwisho',
    'Re-filing done': 'Uhamishaji umekamilika',
    'No BDO serving credits in the last few months.': 'Hakuna sifa za kuhudumia za BDO miezi ya karibuni.',
    'KPIs done by the team': 'KPI zilizofanywa na timu',
    'you': 'wewe',
    'BDOs out today': 'BDO waliopo kazini leo',
    'You are leading today': 'Unaongoza leo',
    'of': 'kati ya',
    'Apply these to ALL BDOs': 'Weka hizi kwa BDO WOTE',
    'Only fill BDOs with no targets yet': 'Jaza tu BDO wasio na malengo bado',
    'Set everyone in one entry, then adjust the exceptions above.':
      'Weka wote kwa mara moja, kisha rekebisha wachache tofauti hapo juu.',
    'Overwrite the targets of EVERY BDO for': 'Badilisha malengo ya KILA BDO kwa',
    'Individual changes made so far will be replaced.': 'Mabadiliko ya mtu mmoja mmoja yaliyofanyika yatafutwa.',
    'Give these targets to every BDO who has none set for': 'Toa malengo haya kwa kila BDO asiye na malengo kwa',
    'BDOs set': 'BDO wamewekewa',
    'left untouched': 'hawakuguswa',
    'Waiting for the final performance file': 'Tunasubiri faili la mwisho la utendaji',
    'These months ended and the new one opened automatically. Upload their final file to settle the achievement and commission.':
      'Miezi hii imeisha na mwezi mpya umefunguliwa wenyewe. Pakia faili lao la mwisho ili kukamilisha ufikiaji na kamisheni.',
    'Go to Weekly Upload': 'Nenda Kupakia Wiki',
    'Active - confirmed by this month\'s performance file': 'Hai - imethibitishwa na faili la utendaji la mwezi huu',
    'Active - carried from last month; no file has covered him yet this month':
      'Hai - imebebwa kutoka mwezi uliopita; hakuna faili lililomgusa mwezi huu bado',
    'carried': 'imebebwa',
    'Real Performance': 'Utendaji Halisi',
    'The uploaded file PLUS the work your BDOs did in the field, added together and counted once.':
      'Faili lililopakiwa PAMOJA na kazi BDO walizofanya uwandani, zimejumlishwa na kuhesabiwa mara moja.',
    'No double counting: an agent can hold only ONE credit per KPI per month, so a KPI already in the file is never added again when a BDO also ticked it. "From field" is only the work the file does not contain.':
      'Hakuna kuhesabu mara mbili: wakala anaweza kuwa na sifa MOJA tu kwa kila KPI kwa mwezi, hivyo KPI iliyopo kwenye faili haiongezwi tena hata kama BDO naye aliweka alama. "Kutoka uwandani" ni kazi ambayo faili halina.',
    'Combined against target': 'Jumla dhidi ya lengo',
    'Weighted achievement': 'Ufikiaji wenye uzito',
    'Achievement (plain average)': 'Ufikiaji (wastani wa kawaida)',
    'weights total': 'jumla ya uzito',
    'no weights set - set them in Monthly Targets': 'hakuna uzito uliowekwa - weka kwenye Malengo ya Mwezi',
    'Office score': 'Alama ya ofisi',
    'from the uploaded file - the dashboard number': 'kutoka faili lililopakiwa - namba ya dashibodi',
    'no file uploaded yet - the dashboard falls back to live marks':
      'hakuna faili lililopakiwa bado - dashibodi inatumia alama za moja kwa moja',
    'Difference': 'Tofauti',
    'what counting the field work changes': 'kinachobadilika ukihesabu kazi ya uwandani',
    'Every KPI that carries a weight, and how each one feeds the score above.':
      'Kila KPI yenye uzito, na jinsi kila moja inavyochangia alama iliyo juu.',
    'Weight': 'Uzito',
    'weighted': 'yenye uzito',
    'WEIGHTED AVERAGE': 'WASTANI WENYE UZITO',
    'Activeness is a NET: agents waked minus agents that fell asleep this month. A negative month scores negative and pulls the weighted average down.':
      'Uhai ni JUMLA HALISI: mawakala walioamshwa toa waliolala mwezi huu. Mwezi hasi hupata alama hasi na hushusha wastani wenye uzito.',
    'waked': 'walioamshwa',
    'slept': 'waliolala',
    'From file': 'Kutoka faili',
    'From field': 'Kutoka uwandani',
    'Combined': 'Jumla',
    'Target': 'Lengo',
    'Attainment': 'Ufikiaji',
    'file alone': 'faili peke yake',
    'no target': 'hakuna lengo',
    'Per BDO - what each one really produced': 'Kwa kila BDO - kila mmoja alizalisha nini hasa',
    'Nothing credited this month yet.': 'Hakuna kilichowekwa mwezi huu bado.',
    'Recruitment - the real monthly picture': 'Uandikishaji - picha halisi ya mwezi',
    'The app only sees the forms your BDOs opened in it. Type the files that reached the bank outside the app so the month reads true.':
      'Mfumo unaona tu fomu ambazo BDO walifungua ndani yake. Andika faili zilizofika benki nje ya mfumo ili mwezi usomeke kwa ukweli.',
    'Submitted to bank': 'Zilizopelekwa benki',
    'Forms in app': 'Fomu ndani ya mfumo',
    'Became agents': 'Walioanza kuwa mawakala',
    'No recruitment recorded this month yet.': 'Hakuna uandikishaji uliorekodiwa mwezi huu bado.',
    'e.g. 6 files handed over at the branch on the 12th': 'mf. faili 6 zilikabidhiwa tawini tarehe 12',
    'Note': 'Maelezo',
    'Total': 'Jumla',
    'TOTAL': 'JUMLA',
    'Saved': 'Imehifadhiwa',
    'Downloaded': 'Imepakuliwa',
    'Download Excel': 'Pakua Excel',
    'From the performance file': 'Kutoka faili la utendaji',
    'uploaded': 'lilipakiwa',
    'no BDO was named on that row': 'hakuna BDO aliyetajwa kwenye safu hiyo',
    'Ticked in the field by': 'Iliwekwa alama uwandani na',
    'at': 'saa',
    'file': 'faili',
    'Nobody was named in the file - take this over if you did it':
      'Hakuna aliyetajwa kwenye faili - chukua hii kama ni wewe uliyefanya',
    'The performance file did not back this - awaiting the BDO answer':
      'Faili la utendaji halikuunga mkono hili - tunasubiri jibu la BDO',
    'Flagged - the BDO says he did it': 'Ina alama - BDO anasema alifanya',
    'Flagged - the BDO agreed with the file': 'Ina alama - BDO amekubaliana na faili',
    'What everyone is doing today, and where you stand.': 'Kila mtu anafanya nini leo, na wewe uko wapi.',
    'Your month so far, and where you stand against the rest.':
      'Mwezi wako hadi sasa, na uko wapi ukilinganisha na wenzako.',
    'Every claim you made matches the performance file. Keep it up!':
      'Kila dai lako linalingana na faili la utendaji. Endelea hivyo!',
    'Settings & Data': 'Mipangilio na Data',
    'The rules everyone works by, and every eraser in one place. Performance and all reports recalculate instantly after any erase. Everything here is audit-logged.':
      'Kanuni tunazofuata wote, na vifutio vyote mahali pamoja. Utendaji na ripoti zote hukokotolewa upya mara moja baada ya kufuta. Kila kitu hapa kinawekwa kwenye kumbukumbu.',
    'Dashboard & field rules': 'Kanuni za dashibodi na kazi za nje',
    'Ticked KPIs appear on everyone\'s dashboard. APK counts only when an agent reads the required version or newer.':
      'KPI zilizotiwa alama zinaonekana kwenye dashibodi ya kila mtu. APK inahesabika tu wakala akiwa na toleo linalotakiwa au jipya zaidi.',
    'Required APK version': 'Toleo la APK linalotakiwa',
    'Rules saved': 'Kanuni zimehifadhiwa',
    'Save': 'Hifadhi',
    'All stations': 'Vituo vyote',
    'All stations combined': 'Vituo vyote kwa pamoja',
    'Everything below reads': 'Kila kitu hapa chini kinasoma',
    'only': 'pekee',
    'using office-wide targets': 'inatumia malengo ya ofisi nzima',
    'Set targets for': 'Weka malengo ya',
    'no targets set': 'hakuna malengo yaliyowekwa',
    'Editing': 'Unahariri',
    'Editing the all-stations roll-up': 'Unahariri jumla ya vituo vyote',
    'nothing saved here yet': 'hakuna kilichohifadhiwa hapa bado',
    'Targets saved for': 'Malengo yamehifadhiwa kwa',
    'rows had no SA STATION': 'safu hazikuwa na SA STATION',
    'counted as': 'zimehesabiwa kama',
    'so nothing drops out of that station\'s attainment - fix the column in the file when you can.':
      'ili kisiwepo kinachopotea kwenye ufikiaji wa kituo hicho - rekebisha safu kwenye faili utakapoweza.',
    'The performance file did not back these claims. Say whether each one is true - your answer goes to the OM.':
      'Faili la utendaji halikuunga mkono madai haya. Sema kama kila moja ni kweli - jibu lako linaenda kwa OM.',
    'Your answer': 'Jibu lako',
    'I confirm': 'Nakubali',
    'I dispute': 'Napinga',
    'True': 'Ni kweli',
    'Not true': 'Si kweli',
    'Why is this flag wrong?': 'Kwa nini alama hii si sahihi?',
    'Explain what really happened - the OM reads this before deciding.':
      'Eleza kilichotokea hasa - OM atasoma kabla ya kuamua.',
    'Your explanation': 'Maelezo yako',
    'e.g. I served him on the 22nd, receipt attached': 'mf. Nilimhudumia tarehe 22, risiti imeambatanishwa',
    'Send answer': 'Tuma jibu',
    'Answer sent to the OM': 'Jibu limetumwa kwa OM',
    'Write why you disagree - the OM reads this': 'Andika kwa nini hukubaliani - OM atasoma hii',
    'BDO confirms': 'BDO amekubali',
    'BDO disputes': 'BDO amepinga',
    'no answer yet': 'bado hajajibu',
    'BDO answer': 'Jibu la BDO',
    'Flags need your decision': 'Alama zinahitaji uamuzi wako',
    'answered by BDOs': 'zimejibiwa na BDO',
    'Open Flags': 'Fungua Alama',
    'No flags this month': 'Hakuna alama mwezi huu',
    'Every BDO claim matches the performance file.': 'Kila dai la BDO linalingana na faili la utendaji.',
    'Waking proof': 'Uthibitisho wa kuamsha',
    'Photo only': 'Picha tu',
    'Photo or typed note': 'Picha au maandishi',
    'Attach the receipt photo - a typed note is not accepted for waking':
      'Ambatanisha picha ya risiti - maandishi hayakubaliki kwa kuamsha',
    'KPI still to do': 'KPI iliyobaki',
    'Search in': 'Tafuta katika',
    'Everything': 'Kila kitu',
    'Served': 'Amehudumiwa',
    'Not served yet': 'Hajahudumiwa bado',
    'Already served': 'Tayari amehudumiwa',
    'Missing': 'Haipo',
    'Captured': 'Imechukuliwa',
    'Sort by': 'Panga kwa',
    'High-earner list': 'Orodha ya wanaolipa zaidi',
    'Most still to do': 'Waliobaki zaidi',
    'name, acc, phone, branch, location...': 'jina, acc, simu, tawi, mahali...',
    'carried from last month': 'wamebebwa kutoka mwezi uliopita',
    'No agent matches these filters - clear them to see your whole round.':
      'Hakuna wakala anayelingana na vichujio hivi - viondoe uone mzunguko wako wote.',
    'Your round for this month - agents carried from last month plus anyone you serve now.':
      'Mzunguko wako wa mwezi huu - mawakala waliobebwa kutoka mwezi uliopita pamoja na unaowahudumia sasa.',
    'Visit not done': 'Visit haijafanyika',
    'APK not done': 'APK haijafanyika',
    'Not active': 'Si active',
    'Visit done': 'Visit imefanyika',
    'APK done': 'APK imefanyika',
    'Preparing the photo...': 'Inaandaa picha...',
    'This photo format is not supported. Take the picture with the camera instead.':
      'Muundo huu wa picha haukubaliki. Piga picha kwa kamera badala yake.',
    'Photo too large - take a smaller picture.': 'Picha ni kubwa mno - piga picha ndogo zaidi.',
    'Could not read the photo - try again.': 'Imeshindwa kusoma picha - jaribu tena.',
    'All': 'Zote',
    'No report days yet.': 'Bado hakuna siku za ripoti.',
    'working day without a report': 'siku ya kazi bila ripoti',
    'No report on a working day': 'Hakuna ripoti siku ya kazi',
    'High-earner priority list': 'Orodha ya kipaumbele ya wanaoingiza zaidi',
    'High earners - PRIORITY to serve': 'Wanaoingiza zaidi - KIPAUMBELE kuhudumia',
    'The OM\'s commission list, matched live: only the NOT-served appear. Pick your SA station first.':
      'Orodha ya kamisheni ya OM, inalinganishwa papo hapo: wasiohudumiwa tu ndio wanaonekana. Chagua SA station yako kwanza.',
    'pick...': 'chagua...',
    'Show list': 'Onyesha orodha',
    'All stations': 'Station zote',
    'Pick your SA station first': 'Chagua SA station yako kwanza',
    'already served': 'wamehudumiwa tayari',
    'showing the NOT-served only': 'inaonyesha wasiohudumiwa tu',
    'LIST': 'ORODHA',
    'above 2,000,000': 'zaidi ya 2,000,000',
    'above 1,000,000': 'zaidi ya 1,000,000',
    'above 500,000': 'zaidi ya 500,000',
    'above 100,000': 'zaidi ya 100,000',
    'above 50,000': 'zaidi ya 50,000',
    'not in system yet': 'bado hayupo kwenye mfumo',
    'Every high earner here is already served. Excellent.': 'Kila mwenye kuingiza zaidi hapa amehudumiwa. Vizuri sana.',
    'The OM has not uploaded a high-earner list yet.': 'OM bado hajapakia orodha ya wanaoingiza zaidi.',
    'Upload high earners': 'Pakia wanaoingiza zaidi',
    'high earners saved': 'wanaoingiza zaidi wamehifadhiwa',
    'Serve': 'Hudumia',
    'Serving receipt': 'Risiti ya kuhudumia',
    'Serving receipt photo': 'Picha ya risiti ya kuhudumia',
    'Optional': 'Hiari',
    'Compulsory': 'Lazima',
    'COMPULSORY': 'LAZIMA',
    'optional': 'hiari',
    'Attach the serving receipt photo - the OM has made it compulsory': 'Ambatanisha picha ya risiti ya kuhudumia - OM ameifanya lazima',
    'Confirm the agent\'s physical location - it becomes his known location and counts him into your base.':
      'Thibitisha mahali alipo wakala - inakuwa mahali pake pa kujulikana na inamuingiza kwenye base yako.',
    'Save & mark served': 'Hifadhi & weka amehudumiwa',
    'Physical location': 'Mahali alipo',
    'Type the physical location': 'Andika mahali alipo',
    'My day so far': 'Siku yangu hadi sasa',
    'done': 'zimekamilika',
    'Served today': 'Waliohudumiwa leo',
    'Visits today': 'Visits leo',
    'today': 'leo',
    'Activeness today': 'Activeness leo',
    'Nothing yet today - your first tick will show here the moment you make it. Twende kazi! 💪':
      'Bado hakuna kitu leo - alama yako ya kwanza itaonekana hapa mara tu utakapoiweka. Twende kazi! 💪',
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
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    elById('toasts').appendChild(el);
    /* `el`, not `t` - `t` is the translator, and reaching for `t.style` here
     * threw every time a toast timed out, so toasts never faded or removed. */
    setTimeout(function () { el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 400); }, 3400);
  }
  /* Top progress bar: any request in flight keeps it visible, so a slow phone
   * network reads as "working" instead of "frozen". */
  var netCount = 0;
  function netBar() {
    var b = elById('netbar');
    if (!b) { b = document.createElement('div'); b.id = 'netbar'; document.body.appendChild(b); }
    return b;
  }
  function netStart() {
    netCount++;
    var b = netBar();
    b.classList.add('on');
    b.style.width = (netCount === 1 ? 12 : 60) + '%';
    clearTimeout(state._netCreep);
    state._netCreep = setTimeout(function () { if (netCount > 0) b.style.width = '82%'; }, 400);
  }
  function netEnd() {
    netCount = Math.max(0, netCount - 1);
    if (netCount) return;
    var b = netBar();
    clearTimeout(state._netCreep);
    b.style.width = '100%';
    setTimeout(function () {
      if (netCount) return;
      b.classList.remove('on');
      setTimeout(function () { if (!netCount) b.style.width = '0'; }, 300);
    }, 180);
  }
  function api(action, opts) {
    opts = opts || {};
    var url = 'api.php?action=' + action + (opts.qs || '');
    /* X-Requested-With is the CSRF token-in-header: the server rejects any
     * POST without it, and no cross-site page can attach it. */
    var init = { method: opts.body ? 'POST' : 'GET', credentials: 'same-origin', headers: { 'X-Requested-With': 'imani' } };
    if (opts.body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    /* silent = background poll (nav badges): no progress bar, it is not a
     * request the user made and a flickering bar would just look like noise */
    if (!opts.silent) netStart();
    function done() { if (!opts.silent) netEnd(); }
    return fetch(url, init).catch(function () {
      throw new Error(t('No connection - check your internet and try again'));
    }).then(function (r) {
      return r.json().catch(function () { return { error: 'Bad server response' }; }).then(function (d) {
        if (r.status === 401) { state.user = null; render(); throw new Error(d.error || 'Please sign in'); }
        if (!r.ok) { var err = new Error(d.error || ('Error ' + r.status)); err.data = d; throw err; }
        return d;
      });
    }).then(function (d) { done(); return d; }, function (e) { done(); throw e; });
  }
  function can(mod, lvl) {
    if (state.user && state.user.role === 'superadmin') return true;
    var p = state.perms[mod]; return !!(p && p[lvl]);
  }
  /* Mirrors the server: a FIELD user (a BDO who marks his own base) never gets
   * management override powers, even if someone ticks "agents: Edit" for his
   * role in Access Control. Managers = OM / super admin. */
  /* Mirrors is_office_role()/is_field_user()/is_manager() in lib/helpers.php -
   * office roles are managers by ROLE, never by which permission boxes are
   * ticked, so the OM cannot lose the Flags panel by being given a "my base"
   * tick. A BDO still never gains office powers. */
  function isOfficeRole() {
    var r = state.user && state.user.role;
    return r === 'superadmin' || r === 'md' || r === 'om';
  }
  function isFieldUser() {
    if (isOfficeRole()) return false;
    return can('mybase', 'e');
  }
  function isManager() {
    if (isOfficeRole()) return true;
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
  /* ---------------- themes: 4 colour palettes x light/dark ----------------
   * Every palette now works in BOTH modes - the colour choice and the light/dark
   * choice are independent, and each dark variant is tuned so every detail stays
   * readable. */
  var PALETTES = [
    { key: 'fire', label: 'Fire orange', sub: 'the original', dot: 'linear-gradient(135deg,#ff5400,#ff9a1f,#ffd84a)' },
    { key: 'green', label: 'Fire green', sub: 'light or dark', dot: 'linear-gradient(135deg,#0b8043,#0f9d58,#57c98a)' },
    { key: 'yellow', label: 'Fire yellow', sub: 'light or dark', dot: 'linear-gradient(135deg,#f9ab00,#ffc93c,#ffe08a)' },
    { key: 'blue', label: 'Fire blue', sub: 'light or dark', dot: 'linear-gradient(135deg,#1557b0,#1a73e8,#6fa8f5)' }
  ];
  function curPal() {
    var p = localStorage.getItem('imani_pal') || 'fire';
    return PALETTES.some(function (x) { return x.key === p; }) ? p : 'fire';
  }
  function applyTheme() {
    var pal = curPal();
    var light = localStorage.getItem('imani_theme') === 'light';
    document.body.classList.remove('pal-green', 'pal-yellow', 'pal-blue');
    if (pal !== 'fire') document.body.classList.add('pal-' + pal);
    document.body.classList.toggle('light', light);
  }
  function setPalette(p) { localStorage.setItem('imani_pal', p); applyTheme(); }
  function toggleTheme() {
    var light = !document.body.classList.contains('light');
    localStorage.setItem('imani_theme', light ? 'light' : 'dark');
    applyTheme();
    renderShell();
  }
  /* picker: 4 palettes, each usable light or dark */
  function themePicker() {
    var pal = curPal();
    var opts = PALETTES.map(function (p) {
      return '<button class="pal-opt' + (p.key === pal ? ' on' : '') + '" data-action="palSet" data-p="' + p.key + '">' +
        '<span class="pal-dot" style="background:' + p.dot + '"></span>' +
        '<span>' + esc(t(p.label)) + '<br><span class="note">' + esc(t(p.sub)) + '</span></span></button>';
    }).join('');
    var isLight = document.body.classList.contains('light');
    openModal('<h2>' + svg('flame') + ' ' + t('Choose theme') + '</h2>' +
      '<p class="note">' + t('Pick the colours you like, then light or dark. Saved on this device.') + '</p>' +
      '<div class="pal-grid">' + opts + '</div>' +
      '<div class="row" style="margin-top:12px;align-items:center"><span class="note">' +
      t('Currently') + ': <b>' + (isLight ? t('Light') : t('Dark')) + '</b></span>' +
      '<div class="spacer"></div><button class="ghost" data-action="toggleTheme">' +
      (isLight ? svg('flame') + ' ' + t('Switch to dark') : svg('eye') + ' ' + t('Switch to light')) + '</button></div>' +
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
    pin: '<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
    gallery: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-6 6-2-2-5 5"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || ICON.grid) + '</svg>';
  }

  var MODULES = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { key: 'mybase', label: 'My Agent Base', icon: 'phone' },
    { key: 'daily', label: 'Daily Report', icon: 'cal' },
    { key: 'agents', label: 'Agents', icon: 'users' },
    { key: 'bdos', label: 'BDOs', icon: 'users' },
    { key: 'upload', label: 'Database Upload', icon: 'upload' },
    { key: 'targets', label: 'Monthly Targets', icon: 'target' },
    { key: 'commission', label: 'Commission & Months', icon: 'dollar' },
    { key: 'flags', label: 'Flags', icon: 'alert' },
    { key: 'inbox', label: 'Messages', icon: 'mail' },
    { key: 'data', label: 'Settings & Data', icon: 'lock' },
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
    var tabs = visibleModules();
    return tabs.length ? tabs[0].key : 'dashboard';
  }
  function render() {
    if (!state.user) { renderLogin(); return; }
    renderShell();
    refreshBadges();
  }
  /* Counts behind the nav badges. Fetched quietly in the background and painted
   * straight into the existing nav - re-rendering the shell here would re-fetch
   * whatever tab the user is reading. A failure must never blank the app, so
   * both branches swallow their errors. */
  function refreshBadges() {
    if (!state.user) return;
    Promise.all([
      api('messages_unread', { silent: true }).then(function (d) { state.unreadMsgs = d.unread || 0; }, function () {}),
      isFieldUser()
        ? api('my_flags', { silent: true }).then(function (d) { state.pendingFlags = d.pending || 0; }, function () {})
        : Promise.resolve()
    ]).then(paintBadges);
  }
  function paintBadges() {
    if (!state.user) return;
    var counts = [['inbox', state.unreadMsgs || 0, ''], ['flags', isFieldUser() ? (state.pendingFlags || 0) : 0, ' bad']];
    counts.forEach(function (x) {
      var item = document.querySelector('.nav-item[data-tab="' + x[0] + '"]');
      if (!item) return;
      var b = item.querySelector('.navbadge');
      if (!x[1]) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('span'); b.className = 'navbadge' + x[2]; item.appendChild(b); }
      b.textContent = x[1] > 99 ? '99+' : x[1];
    });
    /* the phone bar carries the same counts - and whatever it hides behind More
     * rolls up onto the More button, so nothing waits unseen */
    var hidden = 0;
    counts.forEach(function (x) {
      var slot = document.querySelector('.botnav .bn-item[data-tab="' + x[0] + '"] .bn-ic');
      if (!slot) { hidden += x[1]; return; }
      var d = slot.querySelector('.bn-dot');
      if (!x[1]) { if (d) d.remove(); return; }
      if (!d) { d = document.createElement('span'); d.className = 'bn-dot' + x[2]; slot.appendChild(d); }
      d.textContent = x[1] > 9 ? '9+' : x[1];
    });
    var moreIc = document.querySelector('.botnav .bn-item[data-action="moreNav"] .bn-ic');
    if (moreIc) {
      var md = moreIc.querySelector('.bn-dot');
      if (!hidden) { if (md) md.remove(); }
      else {
        if (!md) { md = document.createElement('span'); md.className = 'bn-dot bad'; moreIc.appendChild(md); }
        md.textContent = hidden > 9 ? '9+' : hidden;
      }
    }
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
      if (m.key === 'mybase' || m.key === 'daily') {
        if (isOfficeRole()) return false;      /* he manages the round, he does not walk it */
        return can('mybase', m.key === 'daily' ? 'e' : 'v');
      }
      if (m.key === 'data') return isManager(); // OM/superadmin data manager ONLY
      if (m.key === 'inbox') return true; // everyone has a message box
      /* Flags: the OM sees EVERY BDO's flags, a field user sees only his own
       * (viewFlags branches on the role). Both need the tab. */
      if (m.key === 'flags') return isManager() || can('mybase', 'v');
      /* The officer window IS the old Reports screen now, so everyone who
       * could read Reports still reaches it - the team leader above all, since
       * approving route plans and float shortages is his job. */
      if (m.key === 'bdos') return isManager() || (!isFieldUser() && can('reports', 'v'));
      if (m.key === 'dashboard') return can('dashboard', 'v') || can('mybase', 'v'); // BDOs get a PERSONAL dashboard
      if (can(m.key, 'v')) return true;
      return m.key === 'agents' && can('mybase', 'v');
    });
  }
  function renderShell() {
    var tabs = visibleModules();
    if (!tabs.some(function (m) { return m.key === state.tab; })) state.tab = tabs.length ? tabs[0].key : 'dashboard';
    /* Nav badges replace the panels that used to shout from the dashboard:
     * unread messages and flags still waiting for the BDO's answer. */
    var nav = tabs.map(function (m) {
      var n = m.key === 'inbox' ? (state.unreadMsgs || 0)
            : m.key === 'flags' ? (isFieldUser() ? (state.pendingFlags || 0) : 0) : 0;
      var badge = n ? '<span class="navbadge' + (m.key === 'flags' ? ' bad' : '') + '">' + (n > 99 ? '99+' : n) + '</span>' : '';
      return '<button class="nav-item' + (m.key === state.tab ? ' active' : '') + '" data-action="tab" data-tab="' + m.key + '">' +
        svg(m.icon) + '<span>' + esc(t(m.label)) + '</span>' + badge + '</button>';
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
      '</aside><main class="main"><div id="view"></div></main></div>' +
      bottomNavHtml(tabs);
    renderTab();
  }

  /* ---------------- BOTTOM NAV (phones) ----------------
   * A BDO works this app one-handed, standing in front of an agent. On a phone
   * the sidebar collapsed into a top bar, which put every tab at the far end of
   * his thumb. These four sit where the thumb already rests; everything else
   * lives behind More, which carries the badges of whatever it hides so a
   * pending flag or an unread message is never buried silently.
   *
   * Desktop is untouched - this is display:none above the phone breakpoint. */
  var BOTNAV_MAX = 4;
  /* Five labels across a 375px phone: the sidebar wording truncates ("My Agent
   * B..."), so the bar gets its own short forms. Same destination, fewer
   * letters - a truncated label teaches nobody anything. */
  var BOTNAV_SHORT = {
    mybase: 'My Base', daily: 'Report', agents: 'Agents', dashboard: 'Home',
    bdos: 'BDOs', inbox: 'Messages', upload: 'Upload',
    targets: 'Targets', commission: 'Commission', data: 'Settings'
  };
  function botLabel(m) { return t(BOTNAV_SHORT[m.key] || m.label); }
  function botBadge(key) {
    if (key === 'inbox') return state.unreadMsgs || 0;
    if (key === 'flags') return isFieldUser() ? (state.pendingFlags || 0) : 0;
    return 0;
  }
  function bottomNavHtml(tabs) {
    if (!tabs.length) return '';
    var primary = tabs.slice(0, BOTNAV_MAX);
    var rest = tabs.slice(BOTNAV_MAX);
    /* keep the active tab reachable: if the user is inside a More tab, swap it
       into the last primary slot so the bar always shows where he is */
    if (rest.some(function (m) { return m.key === state.tab; })) {
      var cur = rest.filter(function (m) { return m.key === state.tab; })[0];
      rest = rest.filter(function (m) { return m.key !== state.tab; }).concat([primary[primary.length - 1]]);
      primary = primary.slice(0, primary.length - 1).concat([cur]);
    }
    function item(m) {
      var n = botBadge(m.key);
      return '<button class="bn-item' + (m.key === state.tab ? ' active' : '') + '" data-action="tab" data-tab="' + m.key + '">' +
        '<span class="bn-ic">' + svg(m.icon) +
        (n ? '<span class="bn-dot' + (m.key === 'flags' ? ' bad' : '') + '">' + (n > 9 ? '9+' : n) + '</span>' : '') +
        '</span><span class="bn-lb">' + esc(botLabel(m)) + '</span></button>';
    }
    var moreCount = 0;
    rest.forEach(function (m) { moreCount += botBadge(m.key); });
    var more = rest.length
      ? '<button class="bn-item" data-action="moreNav">' +
        '<span class="bn-ic">' + svg('grid') +
        (moreCount ? '<span class="bn-dot bad">' + (moreCount > 9 ? '9+' : moreCount) + '</span>' : '') +
        '</span><span class="bn-lb">' + t('More') + '</span></button>'
      : '';
    return '<nav class="botnav" aria-label="' + esc(t('Main navigation')) + '">' +
      primary.map(item).join('') + more + '</nav>';
  }
  function moreNavSheet() {
    var tabs = visibleModules();
    var shown = {};
    document.querySelectorAll('.botnav .bn-item[data-tab]').forEach(function (b) { shown[b.getAttribute('data-tab')] = 1; });
    var rest = tabs.filter(function (m) { return !shown[m.key]; });
    openModal('<h2>' + svg('grid') + ' ' + t('All sections') + '</h2>' +
      '<div class="morelist">' +
      rest.map(function (m) {
        var n = botBadge(m.key);
        return '<button class="more-item" data-action="tab" data-tab="' + m.key + '">' +
          svg(m.icon) + '<span style="flex:1;text-align:left">' + esc(t(m.label)) + '</span>' +
          (n ? '<span class="navbadge' + (m.key === 'flags' ? ' bad' : '') + '">' + n + '</span>' : '') + '</button>';
      }).join('') +
      '</div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
      '<button class="ghost" data-action="closeModal">' + t('Close') + '</button></div>');
  }
  function renderTab() {
    var v = elById('view'); if (!v) return;
    /* THE VIEW IS BEING REBUILT, SO ANY OPEN DIALOG IS STALE BY DEFINITION.
     * Saves that rebuilt the page but forgot to shut their own box left it
     * hanging over the fresh screen, and the only way out was Close or tapping
     * outside. Closing here fixes the whole class at once instead of chasing
     * each save. (Flows that mean to keep a dialog - the theme picker - reopen
     * it after the redraw, so they are unaffected.) */
    closeModal();
    v.innerHTML = skeletonHtml();
    if (state.tab === 'dashboard') viewDashboard(v);
    else if (state.tab === 'agents') viewAgents(v);
    else if (state.tab === 'mybase') viewMyBase(v);
    else if (state.tab === 'daily') viewDaily(v);
    else if (state.tab === 'data') viewData(v);
    else if (state.tab === 'inbox') viewInbox(v);
    else if (state.tab === 'bdos') viewBdos(v);
    /* same tab, two pages: the OM audits everyone, a BDO answers for himself */
    else if (state.tab === 'flags') { if (isManager()) viewFlags(v); else viewMyFlags(v); }
    else if (state.tab === 'upload') viewUpload(v);
    else if (state.tab === 'targets') viewTargets(v);
    else if (state.tab === 'commission') viewCommission(v);
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
  /* His report days for a month: OK / LATE / MISS per elapsed working day.
   * Shared by the BDO dashboard and the management Reports tab. */
  function reportDaysMatrix(dr, month) {
    var byKey = {};
    (dr.reports || []).forEach(function (r) { byKey[r.bdo + '|' + r.date] = r; });
    var today = dr.today, days = [];
    var dim = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
    for (var i = 1; i <= dim; i++) {
      var ds = month + '-' + String(i).padStart(2, '0');
      if (ds > today) break;
      days.push(ds);
    }
    var shown = days.slice(-10);
    var head = '<th>BDO</th>' + shown.map(function (ds) {
      return '<th>' + Number(ds.slice(8)) + '<div class="note">' + DAY_NAMES[isoDow(ds)] + '</div></th>';
    }).join('');
    var body = (dr.bdos || []).map(function (b) {
      var cells = shown.map(function (ds) {
        var wd = (b.workingDays || []).indexOf(isoDow(ds)) >= 0;
        var r = byKey[b.username + '|' + ds];
        if (r) {
          var cls = r.late ? 'gold' : 'ok';
          return '<td><span class="pill ' + cls + '" title="Float ' + fmt(r.float) + '">' + (r.late ? 'LATE' : 'OK') + '</span></td>';
        }
        if (!wd) return '<td><span class="pill dim">-</span></td>';
        return '<td><span class="pill bad" title="' + esc(t('No report on a working day')) + '">MISS</span></td>';
      }).join('');
      return '<tr><td>' + esc(b.name) + '</td>' + cells + '</tr>';
    }).join('') || '<tr><td class="note">' + t('No report days yet.') + '</td></tr>';
    return { head: head, body: body, days: shown.length };
  }
  /* HIS ONE PAGE: how is MY day and MY month going, and where do I stand.
   * The Team tab used to hold the second half of that answer - his high-earner
   * value and the whole-team board - which meant two tabs to learn one thing,
   * and his weighted score rendered in both places. It is all here now. His
   * flags stay in the Flags tab (it carries the red badge), his report days sit
   * beside the Daily Report he writes, and messages only in Messages. */
  function personalDashboard(v) {
    var calls = [api('base'), api('my_live_today'), api('bdo_rank_public'),
                 isSpecial() ? api('specialist_summary') : Promise.resolve(null)];
    Promise.all(calls).then(function (rr) {
      var d = rr[0], live = rr[1], wrk = rr[2], sum = rr[3];
      /* HIS day so far - read-only motivation feed, updates as he works */
      var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Activeness' };
      var liveFeed = (live.marks || []).slice(0, 12).map(function (m) {
        var pill = m.kpi === 'served' ? 'ok' : m.kpi === 'active' ? 'gold' : 'fire';
        return '<div class="tg-row"><b style="min-width:44px">' + esc(m.time) + '</b>' +
          '<span class="pill ' + pill + '">' + (KL[m.kpi] || m.kpi) + '</span>' +
          '<span style="flex:1">' + esc(m.agent) + ' <span class="note">' + esc(m.acc) + '</span></span></div>';
      }).join('');
      var todayTotal = live.perKpi.served + live.perKpi.visit + live.perKpi.apk + live.perKpi.active;
      var livePanel =
        '<div class="panel"><h2>' + svg('zap') + t('My day so far') + ' <span class="pill fire">' + esc(live.now) + ' EAT</span>' +
        (todayTotal ? ' <span class="pill ok">' + fmt(todayTotal) + ' ' + t('done') + '</span>' : '') + '</h2>' +
        '<div class="grid cards" style="margin-bottom:10px">' +
        card('check', t('Served today'), fmt(live.perKpi.served)) +
        card('target', t('Visits today'), fmt(live.perKpi.visit)) +
        card('rotate', 'APK ' + t('today'), fmt(live.perKpi.apk)) +
        card('zap', t('Activeness today'), fmt(live.perKpi.active)) +
        '</div>' +
        (liveFeed || '<div class="note">' + t('Nothing yet today - your first tick will show here the moment you make it. Twende kazi! 💪') + '</div>') +
        /* THE TEAM'S DAY beside his own. A number climbing next to yours is
         * worth more than any reminder - he can see the office total, how many
         * colleagues are out, and where he sits among them. */
        (function () {
          var T = live.team;
          if (!T || !T.workers) return '';
          var lead = T.myRank === 1 && T.myTotal > 0;
          return '<div class="tg-row" style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px">' +
            '<span class="pill fire">' + t('TEAM TODAY') + '</span>' +
            '<span style="flex:1">' +
              '<b>' + fmt(T.total) + '</b> ' + t('KPIs done by the team') +
              ' <span class="note">(' + t('you') + ' ' + fmt(T.myTotal) + ' &middot; ' +
              T.workers + ' ' + t('BDOs out today') + ')</span>' +
              '<div class="note">' +
                t('Served') + ' ' + fmt(T.perKpi.served) + ' &middot; ' +
                t('Visit') + ' ' + fmt(T.perKpi.visit) + ' &middot; APK ' + fmt(T.perKpi.apk) + ' &middot; ' +
                t('Activeness') + ' ' + fmt(T.perKpi.active) +
              '</div>' +
            '</span>' +
            (lead
              ? '<span class="pill ok">' + t('You are leading today') + ' 🔥</span>'
              : '<span class="pill ' + (T.myRank <= 3 ? 'gold' : 'dim') + '">#' + T.myRank + ' ' + t('of') + ' ' + T.workers +
                (T.top && !T.top.me ? ' &middot; ' + esc(T.top.name) + ' ' + fmt(T.top.total) : '') + '</span>') +
            '</div>';
        })() +
        '</div>';

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
      /* HIS DASHBOARD IS HIS DAY. Nothing else belongs on it: no office totals,
       * no team feed, no month-long tables. Just his own counters and what he
       * has done since this morning. The monthly weighted score and the
       * high-earner value he built sit on the Team tab, one tap away, under
       * "where you stand". */
      /* IDLE ALERT - the first thing he sees, in red, when a working day has
       * gone by without a single KPI. Counted in HIS working days, so a day off
       * never triggers it. */
      var idle = live.idle || {};
      var idlePanel = '';
      if (idle.alert) {
        var howLong = idle.never
          ? t('You have not recorded a single KPI yet.')
          : t('Your last KPI was') + ' <b>' + esc(idle.lastAt) + '</b> - ' +
            t('that is') + ' <b>' + fmt(idle.hours) + ' ' + t('hours ago') + '</b>' +
            (idle.missedWorkingDays > 1 ? ' (' + idle.missedWorkingDays + ' ' + t('working days with nothing') + ')' : '');
        idlePanel =
          '<div class="panel idle-alert"><div class="row" style="align-items:flex-start">' +
          '<span class="idle-ic">' + svg('alert') + '</span>' +
          '<div style="flex:1">' +
          '<b style="font-size:15px">' + t('NO KPI RECORDED IN OVER 24 HOURS') + '</b>' +
          '<div class="note" style="margin-top:4px">' + howLong + '</div>' +
          '<div class="note">' + t('Your OM sees this too. Serve an agent, tick a visit or wake a dormant one today.') + '</div>' +
          '<div class="row" style="margin-top:8px">' +
          '<button class="btn mini" data-action="tab" data-tab="mybase">' + t('Open My Agent Base') + '</button>' +
          '<button class="ghost mini" data-action="tab" data-tab="agents">' + t('Open agent list') + '</button>' +
          '</div></div></div></div>';
      }

      /* HIS WEIGHTED SCORE AGAINST THE MONTHLY TARGET, TWICE.
       * Left: what he has claimed. Right: what survives if every flag against
       * him is upheld. The gap between the two is the exact cost of his flags,
       * which is what makes him go and settle them. */
      var scorePanel = '';
      if (d.performance) {
        var withF = d.performance, clean = d.performanceClean || d.performance;
        var gap = (withF.score != null && clean.score != null) ? (withF.score - clean.score) : 0;
        var nFlags = d.flagCount || 0;
        scorePanel =
          '<div class="panel"><h2>' + svg('percent') + t('My weighted score vs my monthly target') + '</h2>' +
          '<div class="grid cards" style="margin-bottom:10px">' +
          card('percent', t('As I claimed'), (withF.score == null ? '-' : withF.score + '%'),
               t('every KPI I ticked')) +
          card(nFlags ? 'alert' : 'check', t('If every flag stands'), (clean.score == null ? '-' : clean.score + '%'),
               nFlags ? (fmt(nFlags) + ' ' + t('flags would remove this much')) : t('no flags against me')) +
          '</div>' +
          (nFlags
            ? '<div style="border-top:1px solid var(--line);padding-top:10px">' +
              '<div class="row" style="align-items:center;gap:8px;flex-wrap:wrap">' +
              '<span class="pill ' + (gap >= 10 ? 'bad' : 'fire') + '">-' + (gap > 0 ? gap : 0) + '%</span>' +
              '<b>' + t('is what your flags cost you') + '</b></div>' +
              '<div class="note" style="margin:6px 0 8px">' + t('Answer them on the Flags panel - a claim you can prove is a claim the OM can clear.') + '</div>' +
              '<button class="btn mini" data-action="tab" data-tab="flags">' + t('Work on my flags') + '</button></div>'
            : '<div class="note">' + t('Clean month - nothing is being questioned. Both numbers are the same.') + '</div>') +
          '<div style="margin-top:10px">' + perfBars(withF.kpis) + '</div>' +
          '</div>';
      }

      /* WHERE HE STANDS ON HIS BASE. The base is the raw material of every KPI
       * he will ever score, so he is shown its size against everyone else's and
       * how much of it he has actually covered. Growing the base is the point. */
      var standPanel = '';
      var sd = d.standing;
      if (sd && sd.peers > 1) {
        var covPct = sd.coverage == null ? 0 : sd.coverage;
        var behind = sd.biggestBase != null ? (sd.biggestBase - sd.base) : null;
        standPanel =
          '<div class="panel"><h2>' + svg('users') + t('Where I stand') + '</h2>' +
          '<div class="grid cards" style="margin-bottom:10px">' +
          card('users', t('My agent base'), fmt(sd.base),
               '#' + sd.baseRank + ' ' + t('of') + ' ' + sd.peers + ' ' + t('by base size')) +
          card('check', t('Covered so far'), covPct + '%',
               fmt(sd.served) + ' / ' + fmt(sd.base) + ' · #' + sd.coverageRank + ' ' + t('by coverage')) +
          '</div>' +
          '<div class="tg-row"><span class="tg-name">' + t('My coverage') + '</span>' +
          '<div class="bar" style="flex:1"><i class="' + (covPct < 50 ? 'red' : covPct >= 80 ? 'green' : '') + '" style="width:' + Math.max(0, Math.min(100, covPct)) + '%"></i></div>' +
          '<span class="tg-pct">' + covPct + '%</span></div>' +
          weightedBoard(wrk) +
          '<div class="note" style="margin-top:8px">' +
          (behind != null && behind > 0
            ? t('The biggest base in the office holds') + ' <b>' + fmt(sd.biggestBase) + '</b> ' + t('agents') + ' &mdash; ' +
              t('you are') + ' <b>' + fmt(behind) + '</b> ' + t('short of it. Every new agent you recruit or take over grows what you can score from.')
            : t('You hold the biggest base in the office. Keep it covered and keep it growing.')) +
          '</div></div>';
      }

      /* HIGH EARNERS HE SERVED - the money view of his effort: not just how
       * many agents, but how valuable they were. */
      var B = live.bands || {};
      function bandCells(sp) {
        var b = B[sp] || {};
        return ['A', 'B', 'C', 'D', 'E'].map(function (k) {
          return '<td>' + ((b[k] || 0) ? '<b>' + b[k] + '</b>' : '<span class="note">0</span>') + '</td>';
        }).join('') + '<td class="note">' + (b.F || 0) + '</td><td><b>' + (b.highTotal || 0) + '</b></td>';
      }
      var heScorePanel =
        '<div class="panel"><h2>' + svg('dollar') + t('High earners I served') + '</h2>' +
        '<p class="note">' + t('How valuable your serving was - by high-earner list.') + '</p>' +
        '<div class="tablewrap"><table><thead><tr><th></th>' +
        ['A', 'B', 'C', 'D', 'E'].map(function (k) { return '<th>' + t('LIST') + ' ' + k + '</th>'; }).join('') +
        '<th>' + t('LIST') + ' F</th><th>' + t('High total') + '</th></tr></thead><tbody>' +
        '<tr><td><b>' + t('Today') + '</b></td>' + bandCells('day') + '</tr>' +
        '<tr><td><b>' + t('This week') + '</b></td>' + bandCells('week') + '</tr>' +
        '<tr><td><b>' + t('This month') + '</b></td>' + bandCells('month') + '</tr>' +
        '</tbody></table></div></div>';

      /* THE WHOLE TEAM'S DAY, read-only. He watches it; the export stays with
       * management. */
      var teamBoard =
        '<div class="panel"><div class="row" style="align-items:center;margin-bottom:6px">' +
        '<h2 style="margin:0">' + svg('zap') + t('Live work today - whole team') + '</h2>' +
        '<span class="pill dim">' + t('view only') + '</span><div class="spacer"></div>' +
        '<div class="field"><label>' + t('From day') + '</label><input id="liveDate" type="date" value="' + isoToday() + '" max="' + isoToday() + '"></div>' +
        '<div class="field"><label>' + t('To day') + '</label><input id="liveDateTo" type="date" value="' + isoToday() + '" max="' + isoToday() + '"></div>' +
        '<div class="field"><label>' + t('From (EAT)') + '</label><input id="liveFrom" type="time" value="00:00"></div>' +
        '<div class="field"><label>' + t('To (EAT)') + '</label><input id="liveTo" type="time" value="23:59"></div>' +
        '<button class="ghost mini" data-action="liveWinAll">' + t('All day') + '</button>' +
        '<button class="ghost mini" data-action="liveWinMorning" title="06:00-12:00">' + t('Morning') + '</button>' +
        '<button class="ghost mini" data-action="liveWinAfternoon" title="12:00-17:00">' + t('Afternoon') + '</button>' +
        '<button class="ghost mini" data-action="liveWinEvening" title="17:00-23:59">' + t('Evening') + '</button>' +
        '<button class="ghost" data-action="liveLoad">' + svg('rotate') + ' ' + t('Refresh') + '</button></div>' +
        '<p class="note">' + t('What everyone ticked inside the chosen time window (EAT). You can watch it, not download it.') + '</p>' +
        '<div id="liveBox"></div></div>';

      v.innerHTML =
        greetingLine() + '<h1 class="page-title">' + t('My Dashboard') + '</h1>' +
        '<p class="page-sub">' + esc(d.month) + ' &middot; ' + t('your own performance only') + '</p>' +
        idlePanel +
        '<div class="grid cards" style="margin-bottom:12px">' + cards + '</div>' +
        scorePanel +
        standPanel +
        heScorePanel +
        livePanel +
        teamBoard;
      liveTodayLoad();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }


  /* ---------------- Flags, a field user's own page ----------------
   * The same panel that used to sit on his dashboard, now a tab of its own with
   * a red nav badge while any flag is unanswered. */
  function viewMyFlags(v) {
    api('my_flags').then(function (myfl) {
      state.pendingFlags = myfl.pending || 0;
      paintBadges();
      var KLF = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Activeness' };
      var flRows = myfl.rows || [];
      var head = greetingLine() + '<h1 class="page-title">' + t('Flags against me') + '</h1>' +
        '<p class="page-sub">' + esc(myfl.month || '') + ' &middot; ' +
        t('The performance file did not back these claims. Say whether each one is true - your answer goes to the OM.') + '</p>';

      if (!flRows.length) {
        v.innerHTML = head + '<div class="panel"><div class="row" style="align-items:center">' +
          '<span class="pill ok">' + t('No flags this month') + '</span>' +
          '<span class="note">' + t('Every claim you made matches the performance file. Keep it up!') + '</span></div></div>';
        return;
      }

      var perKpi = { served: 0, visit: 0, apk: 0, active: 0 };
      flRows.forEach(function (f) { if (perKpi[f.kpi] !== undefined) perKpi[f.kpi]++; });
      /* an empty KPI tab still opens - "0 flags on APK" is the answer he wants,
       * not a silent bounce back to All */
      var active = state._myFlagKpi || 'all';
      if (active !== 'all' && perKpi[active] === undefined) active = 'all';
      state._myFlagKpi = active;

      var tabs = [{ k: 'all', label: t('All KPI'), n: flRows.length }].concat(
        ['served', 'visit', 'apk', 'active'].map(function (k) { return { k: k, label: t(KLF[k]), n: perKpi[k] }; })
      ).map(function (x) {
        return '<button class="ghost mini' + (x.k === active ? ' on' : '') + '" data-action="myFlagTab" data-kpi="' + x.k + '">' +
          esc(x.label) + ' <span class="pill ' + (x.n ? 'bad' : 'dim') + '">' + x.n + '</span></button>';
      }).join(' ');

      var shown = active === 'all' ? flRows : flRows.filter(function (f) { return f.kpi === active; });
      var body = shown.map(function (f) {
        var ans = f.bdo_response === 'CONFIRMED'
            ? '<span class="pill gold">' + t('I confirm') + '</span>' + (f.bdo_note ? '<div class="note">' + esc(f.bdo_note) + '</div>' : '')
          : f.bdo_response === 'DISPUTED'
            ? '<span class="pill ok">' + t('I dispute') + '</span><div class="note">' + esc(f.bdo_note) + '</div>'
            : '<button class="btn mini" data-action="flagAnswer" data-id="' + f.id + '" data-r="CONFIRMED" data-agent="' + esc(f.agent || '') + '">' + t('True') + '</button> ' +
              '<button class="ghost mini" data-action="flagAnswer" data-id="' + f.id + '" data-r="DISPUTED" data-agent="' + esc(f.agent || '') + '">' + t('Not true') + '</button>';
        return '<tr><td>' + esc(t(KLF[f.kpi] || f.kpi)) + '</td>' +
          '<td class="c-name">' + esc(f.agent || '') + '<div class="note">' + esc(f.acc || '') + '</div></td>' +
          '<td class="note">' + esc(f.detail || '') + '</td>' +
          '<td class="note">' + esc(kpiWhen(f)) + '</td><td>' + ans + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="note">' + t('No flags on this KPI.') + '</td></tr>';

      v.innerHTML = head +
        '<div class="panel" style="border-color:' + (myfl.pending ? 'var(--bad)' : 'var(--line)') + '">' +
        '<h2>' + svg('alert') + t('Flags against me') +
        ' <span class="pill ' + (flRows.length ? 'bad' : 'dim') + '">' + flRows.length + ' ' + t('total') + '</span>' +
        (myfl.pending ? ' <span class="pill bad">' + myfl.pending + ' ' + t('need your answer') + '</span>' : ' <span class="pill ok">' + t('all answered') + '</span>') + '</h2>' +
        '<div class="row tabrow" style="margin-bottom:8px">' + tabs + '</div>' +
        '<div class="tablewrap"><table><thead><tr><th>KPI</th><th>' + t('Agent') + '</th><th>' + t('Detail') + '</th><th>' + t('When I did it') + '</th><th>' + t('Your answer') + '</th></tr></thead><tbody>' +
        body + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* OM dashboard alert: unmatched claims waiting for his decision, broken down
   * by KPI so he sees at a glance whether it is serving, visits, APK or
   * activeness that is drifting from the file. */
  function flagAlertLoad() {
    var box = elById('flagAlert'); if (!box) return;
    api('flags_get').then(function (d) {
      var f = d.flags || [];
      if (!f.length) {
        box.innerHTML = '<div class="panel"><div class="row" style="align-items:center">' +
          '<span class="pill ok">' + t('No flags this month') + '</span>' +
          '<span class="note">' + t('Every BDO claim matches the performance file.') + '</span></div></div>';
        return;
      }
      var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Activeness' };
      var byKpi = {}, answered = 0;
      f.forEach(function (r) {
        byKpi[r.kpi] = (byKpi[r.kpi] || 0) + 1;
        if (r.bdo_response) answered++;
      });
      var chips = Object.keys(byKpi).map(function (k) {
        return '<span class="pill bad">' + (KL[k] || k) + ' <b>' + byKpi[k] + '</b></span>';
      }).join(' ');
      box.innerHTML =
        '<div class="panel" style="border-color:var(--bad)"><div class="row" style="align-items:center;margin-bottom:6px">' +
        '<h2 style="margin:0">' + svg('alert') + t('Flags need your decision') + '</h2>' +
        '<span class="pill bad">' + f.length + '</span>' +
        (answered ? '<span class="pill gold">' + answered + ' ' + t('answered by BDOs') + '</span>' : '') +
        '<div class="spacer"></div>' +
        '<button class="btn" data-action="tab" data-tab="flags">' + t('Open Flags') + '</button></div>' +
        '<div class="row">' + chips + '</div></div>';
    }).catch(function () { box.innerHTML = ''; });
  }
  /* ---------------- LIVE WORK OF THE DAY (management) ----------------
   * Every KPI a BDO ticked today with the exact time - "Calvin served X at
   * 09:42". Refreshes on demand and downloads to Excel. */
  function liveTodayLoad() {
    var box = elById('liveBox'); if (!box) return;
    var date = (elById('liveDate') && elById('liveDate').value) || isoToday();
    var dTo = (elById('liveDateTo') && elById('liveDateTo').value) || date;
    var from = (elById('liveFrom') && elById('liveFrom').value) || '00:00';
    var to = (elById('liveTo') && elById('liveTo').value) || '23:59';
    box.innerHTML = '<div class="skel skel-line"></div><div class="skel skel-line"></div>';
    api('live_today', { qs: '&date=' + date + '&dateFrom=' + date + '&dateTo=' + dTo + '&from=' + from + '&to=' + to }).then(function (d) {
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
      var dayTag = (d.dateFrom && d.dateTo && d.dateFrom !== d.dateTo)
        ? '<span class="pill fire">' + esc(d.dateFrom) + ' &rarr; ' + esc(d.dateTo) + '</span>'
        : '<span class="pill fire">' + esc(d.date) + '</span>';
      /* how much VALUE was served in this window, by high-earner list */
      var bs = d.bandServed || {};
      var bandRow = ['A', 'B', 'C', 'D', 'E'].map(function (k) {
        return '<span class="pill ' + ((k === 'A' || k === 'B') ? 'fire' : (k === 'E' ? 'ok' : 'gold')) + '">' +
          t('LIST') + ' ' + k + ' <b>' + (bs[k] || 0) + '</b></span>';
      }).join(' ') + ' <span class="pill dim">' + t('LIST') + ' F <b>' + (bs.F || 0) + '</b></span>';
      box.innerHTML =
        '<div class="row" style="margin-bottom:8px"><span class="note">' + t('Showing') + ' ' + dayTag + ' ' + winTag + '</span></div>' +
        '<div class="row" style="margin-bottom:10px">' + bandRow + '</div>' +
        '<div class="grid cards" style="margin-bottom:12px">' + cards + '</div>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Served</th><th>Visit</th><th>APK</th><th>Active</th><th>Total</th></tr></thead><tbody>' + byBdo + '</tbody></table></div>' +
        '<h3 style="font-size:13px;margin:14px 0 6px">' + t('Every tick, newest first') + ' (' + (d.marks || []).length + ') ' + winTag + '</h3>' +
        '<div class="tablewrap tall"><table><thead><tr><th>Time</th><th>BDO</th><th>Agent</th><th>Branch</th><th>Station</th><th>KPI</th></tr></thead><tbody>' + feed + '</tbody></table></div>' +
        extras;
    }).catch(function (e) { box.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
  }
  function liveDownload() {
    /* BDOs watch the live board but never carry it out of the app. */
    if (!isManager()) { toast(t('Only management can download the live board'), 'warn'); return; }
    var d = state._live;
    if (!d || !(d.marks || []).length) { toast(t('Nothing to download for this day'), 'warn'); return; }
    var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Activeness' };
    var rows = d.marks.map(function (m) {
      return { 'Date': m.date || d.date, 'Time': m.time, 'BDO': m.bdoName, 'Username': m.bdo,
               'KPI': KL[m.kpi] || m.kpi, 'High-earner list': m.band || 'F',
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
    var span = (d.dateFrom && d.dateTo && d.dateFrom !== d.dateTo) ? d.dateFrom + '_to_' + d.dateTo : d.date;
    XLSX.writeFile(wb, 'live_work_' + span + '_' + winTag + '.xlsx');
    toast(rows.length + ' ' + t('ticks exported'), 'ok');
  }
  function viewDashboard(v) {
    /* A FIELD USER ALWAYS GETS HIS OWN DASHBOARD - by role, never by which
     * permission boxes happen to be ticked. Ticking "Dashboard: View" for the
     * BDO role used to hand him the entire office board: total agents, office
     * withdraw volume, the whole team's live feed and its download button. He
     * sees his own day here; the team board lives on the Team tab, read-only. */
    if (isFieldUser() || !can('dashboard', 'v')) { personalDashboard(v); return; }
    var m = state.month || '';
    var qs = (m ? '&month=' + m : '') + (state._dashStation ? '&station=' + encodeURIComponent(state._dashStation) : '');
    Promise.all([
      api('dashboard', { qs: qs }),
      /* Real Performance was a separate tab asking the same question of the
       * same month. It is section two of this page now - never merged into one
       * figure, because the file result and the file-plus-field result mean
       * different things and the commission is settled on the first. */
      api('combined_performance', { qs: '&month=' + (m || curMonth()) +
          '&station=' + encodeURIComponent(state._dashStation || '') }).catch(function () { return null; })
    ]).then(function (rr) {
      var d = rr[0], cb = rr[1];
      state.month = d.month;
      var att = d.attainment;
      /* a chosen SA station swaps the CARD numbers to that station's share
       * (incl. its own withdraw sum); target attainment stays office-wide */
      var ss = d.stationStats;
      function cardVal(k) { return ss ? (ss[k] || 0) : att[k].actual; }
      var stTag = ss ? ' - ' + esc(d.station) : '';
      var visible = (d.visibleKpis || '').split(',');
      function shown(k) { return visible.indexOf(k) >= 0; }
      var defs = OFFICE_DEFS.filter(function (def) { return shown(def.key) && att[def.key]; });

      /* NB: the loop variable must NOT be called `t` - that shadows the t()
       * translation helper used inside the body. */
      var bars = defs.map(function (def) {
        var a = att[def.key];
        /* A NEGATIVE result (e.g. activeness -11: more agents lost than waked)
         * must never draw a bar - a raw negative width is invalid CSS and the
         * browser used to paint it FULL. Clamp to 0 and flag the retardation. */
        var raw = a.pct == null ? null : a.pct;
        var neg = raw !== null && raw < 0;
        var pct = raw == null ? 0 : Math.max(0, Math.min(100, raw));
        var meta = a.target > 0 ? fmt(a.actual) + ' / ' + fmt(a.target) : fmt(a.actual) + ' (no target)';
        var wtag = a.weight > 0 ? ' <span class="note">(' + a.weight + '%)</span>' : '';
        return '<div class="tg-row"><span class="tg-ic">' + svg(def.icon) + '</span>' +
          '<span class="tg-name">' + esc(def.label) + wtag + '</span>' +
          '<div class="bar' + (neg ? ' neg' : '') + '" style="flex:1"><i class="' + (neg ? 'red' : '') + '" style="width:' + pct + '%"></i></div>' +
          '<span class="tg-meta">' + meta + '</span>' +
          '<span class="tg-pct' + (neg ? ' bad' : '') + '">' + (raw == null ? '-' : raw + '%') +
          (neg ? ' <span class="pill bad">' + t('GOING BACKWARDS') + '</span>' : '') + '</span></div>';
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
        (d.station
          ? '<span class="note">' + t('Everything below reads') + ' <b>' + esc(d.station) + '</b> ' + t('only') +
            (d.targetsFrom === 'office-fallback'
              ? ' &middot; <span class="pill gold">' + t('using office-wide targets') + '</span> ' +
                '<button class="ghost tiny" data-action="tab" data-tab="targets">' + t('Set targets for') + ' ' + esc(d.station) + '</button>'
              : d.targetsFrom === 'none'
                ? ' &middot; <span class="pill dim">' + t('no targets set') + '</span>'
                : '') + '</span>'
          : '<span class="note">' + t('All stations combined') + '</span>') +
        '</div></div>' +
        /* NO TARGET, NO SCORE - and say which it is.
         * A weighted average has no meaning without a denominator, so with no
         * target typed the whole screen reads blank however hard the team is
         * working. That looked exactly like the app had stopped counting. Now
         * it says what is actually missing, and offers the way to fix it. */
        (d.targetsFrom === 'none'
          ? '<div class="panel" style="border-color:var(--bad)"><div class="row" style="align-items:flex-start">' +
            '<span class="idle-ic">' + svg('alert') + '</span><div style="flex:1">' +
            '<b>' + t('No targets set for') + ' ' + esc(d.month || '') + '</b>' +
            '<div class="note" style="margin-top:4px">' +
            t('The team\'s work IS being recorded - every serve, visit and wake is counted. But a weighted average needs a target to measure against, so it cannot be worked out until you set one.') +
            '</div><div class="row" style="margin-top:8px">' +
            '<button class="btn mini" data-action="tab" data-tab="targets">' + t('Set this month\'s targets') + '</button>' +
            '</div></div></div></div>'
          : '') +
        /* The calendar opened this month by itself. Anything it rolled past is
         * AWAITING its final performance file - say so loudly, because the
         * month's achievement and commission cannot be settled until it lands. */
        ((d.awaiting || []).length
          ? '<div class="panel" style="border-color:var(--fire2)"><div class="row" style="align-items:center">' +
            '<b>' + svg('upload') + ' ' + t('Waiting for the final performance file') + '</b>' +
            (d.awaiting).map(function (mm) { return ' <span class="pill fire">' + esc(mm) + '</span>'; }).join('') +
            '<span class="note">' + t('These months ended and the new one opened automatically. Upload their final file to settle the achievement and commission.') + '</span>' +
            '<div class="spacer"></div><button class="ghost mini" data-action="tab" data-tab="upload">' + t('Go to Weekly Upload') + '</button>' +
            '</div></div>'
          : '') +
        '<div id="flagAlert"></div>' +
        /* LIVE: what the team is doing today, with times */
        '<div class="panel"><div class="row" style="align-items:center;margin-bottom:6px">' +
        '<h2 style="margin:0">' + svg('zap') + t('Live work today') + '</h2>' +
        '<span class="pill fire">' + esc(d.month) + '</span><div class="spacer"></div>' +
        '<div class="field"><label>' + t('From day') + '</label><input id="liveDate" type="date" value="' + isoToday() + '" max="' + isoToday() + '"></div>' +
        '<div class="field"><label>' + t('To day') + '</label><input id="liveDateTo" type="date" value="' + isoToday() + '" max="' + isoToday() + '"></div>' +
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
        '<h2 class="sec-head">' + svg('upload') + ' ' + t('SECTION 1 - FROM THE PERFORMANCE FILE') + '</h2>' +
        '<p class="page-sub">' + t('The office result exactly as the uploaded file reports it. This is the number the commission is settled on.') + '</p>' +
        '<div class="grid cards" style="margin-bottom:16px">' + cards + '</div>' +
        '<div class="panel"><h2>' + svg('target') + t('Target Attainment') +
        (d.station ? ' <span class="pill fire">' + esc(d.station) + '</span>' : '') +
        (d.weighted ? ' <span class="pill gold">weighted</span>' : '') + '</h2>' + bars + '</div>' +
        (cb ? combinedSection(cb) : '');
      liveTodayLoad();
      flagAlertLoad();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function dashSettingsSave() {
    var kpis = Array.prototype.map.call(document.querySelectorAll('.kpivis:checked'), function (c) { return c.value; });
    api('dashboard_settings_save', { body: { kpis: kpis, apkVersion: elById('apkReq').value.trim(), serveReceipt: elById('srvRec') ? elById('srvRec').value : '', wakeReceipt: elById('wakeRec') ? elById('wakeRec').value : '' } })
      .then(function () { toast(t('Rules saved'), 'ok'); renderTab(); })
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
  /* Which high-earner list an agent belongs to. A..E are the OM's commission
   * bands; F means he is not on the list at all. Shown on EVERY agent list so a
   * BDO instantly sees who is worth the trip. */
  function bandPill(band) {
    var b = band || 'F';
    var cls = (b === 'A' || b === 'B') ? 'fire' : (b === 'C' || b === 'D') ? 'gold' : (b === 'E' ? 'ok' : 'dim');
    return '<span class="pill ' + cls + '" title="' + esc(t('High-earner list')) + ' ' + b + '">' + t('LIST') + ' ' + b + '</span>';
  }
  function agentRowHtml(a, editable, restricted) {
    var partnerServed = a.kpi && a.kpi.served && a.kpi.served.by === 'partners';
    var name = esc(a.name) + (partnerServed ? ' <span class="pill fire" title="Served by partners - build the relationship and capture the location">PARTNER</span>' : '');
    return '<tr data-agent="' + a.id + '"><td class="c-meta" data-l="acc">' + esc(a.acc) + '</td>' +
      '<td class="c-name">' + name + ' ' + bandPill(a.band) + actInfoHtml(a) + '</td>' +
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
      (state._factive ? '&factive=' + state._factive : '') +
      (state._fband ? '&fband=' + state._fband : '');
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
      '<div class="field"><label>' + t('High-earner list') + '</label><select data-change="fband">' +
      '<option value="">' + t('Any') + '</option>' +
      ['A', 'B', 'C', 'D', 'E', 'F'].map(function (b) {
        return '<option value="' + b + '"' + (state._fband === b ? ' selected' : '') + '>' + t('LIST') + ' ' + b + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>' + t('Show') + '</label><select id="agentPer">' + perOpts + '</select></div>' +
      '<button class="ghost" data-action="agentClear">' + t('Clear') + '</button>' +
      (restricted ? '' : '<button class="ghost mini" data-action="locExport" title="Download all agents that have a physical location">' + svg('pin') + ' Locations</button>') +
      (isManager() ? '<button class="ghost mini" data-action="agentsExport" title="' + esc(t('Every agent, one sheet per BDO')) + '">' + svg('download') + ' ' + t('All agents') + '</button>' : '') +
      '<div class="spacer"></div><span class="note" id="agentsInfo">Loading...</span></div></div>' +
      '<div class="panel wide"><div class="tablewrap tall cardwrap"><table class="cardable"><thead><tr><th>Account</th><th>Name</th><th>Phone</th><th>Branch</th><th>Physical Location</th><th>KPIs &mdash; Served / Visit / APK / Active</th>' +
      '</tr></thead><tbody id="agentsBody"></tbody></table></div>' +
      '<div class="row" style="margin-top:12px;align-items:center"><button class="ghost" id="agentsPrev" data-action="prevPage">Prev</button>' +
      '<button class="ghost" id="agentsNext" data-action="nextPage">Next</button></div></div>';
    agentsBodyLoad();
    var s = elById('agentSearch'); if (s && state._agentSearch) s.focus();
  }
  /* OM: every agent in one workbook, ONE SHEET PER BDO. */
  function agentsExportAll() {
    api('agents_export_all').then(function (d) {
      if (!d.rows.length) { toast(t('No agents to export'), 'warn'); return; }
      var wb = XLSX.utils.book_new();
      function sheetRows(list) {
        return list.map(function (r) {
          return { 'Acc name': r.name, 'Acc number': r.acc, 'Phone': r.phone,
                   'Branch': r.branch, 'Physical location': r.location,
                   'High-earner list': r.band, 'BDO': r.bdoName };
        });
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows(d.rows)), 'All agents');
      var per = {};
      d.rows.forEach(function (r) { (per[r.bdoName || r.bdo] = per[r.bdoName || r.bdo] || []).push(r); });
      var used = { 'all agents': true };
      Object.keys(per).sort().forEach(function (b) {
        var name = String(b).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 28) || 'bdo';
        var base = name, i = 2;
        while (used[name.toLowerCase()]) name = base.slice(0, 25) + ' ' + (i++);
        used[name.toLowerCase()] = true;
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows(per[b])), name);
      });
      XLSX.writeFile(wb, 'all_agents_' + d.month + '.xlsx');
      toast(d.rows.length + ' ' + t('agents exported - one sheet per BDO'), 'ok');
    }).catch(function (e) { toast(e.message, 'err'); });
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
  /* THE weighted leaderboard. Written once and called from everywhere it is
   * needed: the BDO's own standing panel and the OM's Reports page. Two copies
   * of this table is how the app ended up with three different rankings of the
   * same people. `me` bolds the reader's own row. */
  function weightedBoard(wrk, compact) {
    var rows = (wrk && wrk.rows) || [];
    if (!rows.length) return '<div class="note">' + t('No targets set yet.') + '</div>';
    var mine = state.user && state.user.username;
    return '<div class="tablewrap"' + (compact ? '' : ' style="margin-top:6px"') + '><table><thead><tr><th>#</th><th>BDO</th>' +
      '<th>' + t('Weighted score') + '</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        return '<tr' + (r.bdo === mine ? ' style="font-weight:800"' : '') + '>' +
          '<td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + flagPill(r.flag, r.score) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function perfBars(kpis) {
    /* loop variable must not be `t` - it would shadow the t() translator */
    return TARGET_DEFS.map(function (def) {
      var k = kpis[def.key]; if (!k) return '';
      /* negative = going backwards; clamp the width so it never paints full */
      var raw = k.pct == null ? null : k.pct;
      var neg = raw !== null && raw < 0;
      var pct = raw == null ? 0 : Math.max(0, Math.min(100, raw));
      var cls = raw == null ? '' : (raw < 50 ? ' red' : (raw >= 80 ? ' green' : ''));
      return '<div class="tg-row"><span class="tg-ic">' + svg(def.icon) + '</span>' +
        '<span class="tg-name">' + esc(def.label) + ' <span class="note">(' + k.weight + '%)</span></span>' +
        '<div class="bar' + (neg ? ' neg' : '') + '" style="flex:1"><i class="' + cls + '" style="width:' + pct + '%"></i></div>' +
        '<span class="tg-meta">' + fmt(k.actual) + ' / ' + fmt(k.target) + '</span>' +
        '<span class="tg-pct' + (neg ? ' bad' : '') + '">' + (raw == null ? '-' : raw + '%') +
        (neg ? ' <span class="pill bad">' + t('GOING BACKWARDS') + '</span>' : '') + '</span></div>';
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
  /* Specialist info line: last transaction, days inactive, last month vs now.
   * The WON'T RETURN badge itself is for everyone - now that any BDO can set it,
   * every BDO must be able to see it, or two of them walk to the same closed
   * shop. Only the dormancy detail below stays specialist-only. */
  function actInfoHtml(a) {
    var wr = a.wontReturn ? ' <span class="pill bad">' + t('WON\'T RETURN') + '</span>' : '';
    if (!isSpecial()) return wr;
    var days = '';
    if (a.lastTx) {
      var diff = Math.floor((Date.now() - new Date(a.lastTx + 'T00:00:00').getTime()) / 86400000);
      if (diff >= 0) days = diff + ' ' + t('days ago');
    }
    return '<div class="note">' + t('Last tx') + ': ' + (a.lastTx ? esc(a.lastTx) + (days ? ' (' + days + ')' : '') : '-') +
      ' &middot; ' + t('Last month') + ': ' + (a.actPrev || '-') + ' &middot; ' + t('Now') + ': ' + (a.actStatus || '-') + wr + '</div>';
  }
  /* Mark/unmark "agent confirmed he will NOT return to work".
   * EVERY BDO gets this, not only the activeness specialist: any of them can
   * walk up to a dormant agent and be told he has closed shop, and that fact is
   * worth recording whoever hears it. The server has always allowed it
   * (wont_return_toggle only asks for mybase:e) - the button was the only thing
   * hiding it from general BDOs. */
  function wontReturnBtn(a) {
    if (!can('mybase', 'e')) return '';
    if (a.wontReturn) {
      return ' <button class="kchip todo" data-action="wontReturn" data-id="' + a.id + '" data-name="' + esc(a.name) + '" data-marked="1">' + t('Undo won\'t-return') + '</button>';
    }
    if (a.actStatus !== 'INACTIVE') return '';
    return ' <button class="kchip todo" data-action="wontReturn" data-id="' + a.id + '" data-name="' + esc(a.name) + '">' + t('Won\'t return') + '</button>';
  }
  function doneChip(a, c, mark, isOM) {
    var lbl = c.key === 'active' ? 'Active' : (c.key === 'visit' ? 'Visit YES' : (c.key === 'apk' ? 'APK YES' : c.label));
    var mine = state.user && mark.by === state.user.username;
    /* OM overturns ANY tick; a BDO overturns his OWN live mark, or claims an
     * UNCLAIMED one - never a fellow BDO's mark.
     * "partners" and "unassigned" are not colleagues: both mean the file listed
     * a positive result with NO BDO named. A BDO who actually did that work can
     * take it over, and the normal reconciliation still checks his claim against
     * the file, so he cannot take credit the file does not support. */
    var orphan = (mark.by === 'unassigned' || mark.by === 'partners');
    var reversible = isOM || (mine && mark.src === 'bdo') || (orphan && can('mybase', 'e'));
    var xTitle = orphan ? t('Nobody was named in the file - take this over if you did it') : 'Reverse this mark';
    var x = reversible ? ' <button class="kchip-x" title="' + xTitle + '" aria-label="Reverse this mark" data-action="kpiUnmark" data-id="' + a.id + '" data-kpi="' + c.key + '">&times;</button>' : '';
    /* wake came with a receipt photo or a typed commitment - anyone can open it */
    var pr = ((c.key === 'active' || c.key === 'served') && mark.proof)
      ? ' <button class="kchip-x" title="View proof" aria-label="View proof" data-action="viewProof" data-id="' + a.id + '" data-kpi="' + c.key + '" data-name="' + esc(a.name) + '" data-note="' + esc(mark.note || '') + '">' + svg('eye') + '</button>' : '';
    /* A flag QUERIES the mark, it does not cancel it. The tick stays; a small
     * marker carries the state so a queried agent never reads as "not done". */
    var fl = '';
    if (mark.flag === 'OPEN') fl = ' <span class="kflag" title="' + esc(t('The performance file did not back this - awaiting the BDO answer')) + '">!</span>';
    else if (mark.flag === 'DISPUTED') fl = ' <span class="kflag ok" title="' + esc(t('Flagged - the BDO says he did it')) + '">!</span>';
    else if (mark.flag === 'CONFIRMED') fl = ' <span class="kflag warn" title="' + esc(t('Flagged - the BDO agreed with the file')) + '">!</span>';
    /* WHERE THIS MARK CAME FROM. A BDO seeing "Active - partners" with no idea
     * why now gets the answer in the tooltip: the exact file and the moment it
     * was imported, or the moment the colleague ticked it in the field. */
    var prov = mark.src === 'upload'
      ? t('From the performance file') + (mark.file ? ' "' + mark.file + '"' : '') +
        (mark.fileAt ? ' ' + t('uploaded') + ' ' + mark.fileAt : '') +
        (mark.by === 'partners' ? ' - ' + t('no BDO was named on that row') : '')
      : t('Ticked in the field by') + ' ' + mark.by + (mark.at ? ' ' + t('at') + ' ' + mark.at : '');
    return '<span class="kchip done' + (mine ? ' mine' : '') + (mark.flag ? ' queried' : '') + '" title="' + esc(prov) + '">' +
      esc(lbl) + ' &#10003; <small>' + esc(mark.by) + '</small>' +
      (mark.src === 'upload' ? ' <small class="ksrc" title="' + esc(prov) + '">' + t('file') + '</small>' : '') +
      fl + pr + x + '</span>';
  }
  function todoChip(a, c, label) {
    return '<button class="kchip todo" data-action="kpiMark" data-id="' + a.id + '" data-kpi="' + c.key + '" data-name="' + esc(a.name) + '">' + esc(label || c.label) + '</button>';
  }
  function kpiChip(a, c, editable, isOM) {
    var mark = a.kpi && a.kpi[c.key];
    if (c.key === 'active' && !mark) {
      /* ONLY a real ACTIVE status shows the green tick. INACTIVE and unknown
       * both read "Inactive (wake up)" - an orange "Active" button was
       * misleading (it looked like a claim), so it is gone.
       *
       * At the turn of the month the status is CARRIED from the month that
       * ended: an agent woken then is active now, and only those who finished
       * dormant need waking. Say which of the two it is, because "active
       * because we woke him in July" and "active because this month's file says
       * so" are different facts and the OM should not have to guess. */
      if (a.actStatus === 'ACTIVE') {
        return '<span class="kchip done" title="' + esc(a.actFromFile
          ? t('Active - confirmed by this month\'s performance file')
          : t('Active - carried from last month; no file has covered him yet this month')) + '">Active &#10003;' +
          (a.actFromFile ? '' : ' <small class="ksrc">' + t('carried') + '</small>') + '</span>';
      }
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
  /* ---------------- MY AGENT BASE ----------------
   * ONLY the agents he actually served this month (location captured). This is
   * his "these are mine" list: he finishes the remaining KPIs right here, and
   * every row is labelled with its high-earner list so he can chase value
   * first. Anything not yet served lives on the Agents tab. */
  function viewMyBase(v) {
    Promise.all([api('base', { qs: state.month ? '&month=' + state.month : '' })]).then(function (rr) {
      var d = rr[0];
      state.month = d.month;
      var editable = can('mybase', 'e') && d.monthStatus === 'OPEN';
      /* NEW = agents the monthly database file brought in that nobody owns yet.
       * He serves one and it joins his round, so this is where his base grows. */
      var showNew = state._baseNew === '1';
      var all = showNew ? (d.unclaimed || []) : (d.agents || []);
      var q = (state._baseSearch || '').toLowerCase();
      var fb = state._baseBand || '';
      /* KPI filters: "who still needs a visit?" is one tap */
      var fk = state._baseKpi || '';
      function kpiDone(a, key) {
        if (key === 'active') return a.actStatus === 'ACTIVE' || !!(a.kpi && a.kpi.active);
        return !!(a.kpi && a.kpi[key]);
      }
      /* Extra switches so he can cut his round the way he actually works it:
       * still-to-serve, missing location, which branch, and how to sort. */
      var fs = state._baseServed || '';        /* '' | 'yes' | 'no'            */
      var fl = state._baseLoc || '';           /* '' | 'has' | 'missing'       */
      var fbr = state._baseBranch || '';       /* branch name                  */
      var fld = state._baseField || '';        /* which column the text hits   */
      var so = state._baseSort || 'band';      /* band | name | branch | todo  */

      function fieldText(a) {
        if (fld === 'name') return a.name || '';
        if (fld === 'acc') return a.acc || '';
        if (fld === 'phone') return a.phone || '';
        if (fld === 'branch') return a.branch || '';
        if (fld === 'location') return a.physical_location || '';
        return (a.name || '') + ' ' + (a.acc || '') + ' ' + (a.phone || '') + ' ' +
               (a.branch || '') + ' ' + (a.physical_location || '') + ' LIST' + (a.band || 'F');
      }
      function todoCount(a) {
        var n = 0;
        ['served', 'visit', 'apk', 'active'].forEach(function (k) { if (!kpiDone(a, k)) n++; });
        return n;
      }
      var list = all.filter(function (a) {
        if (fb && (a.band || 'F') !== fb) return false;
        if (fs) { var done = kpiDone(a, 'served'); if (done !== (fs === 'yes')) return false; }
        if (fl === 'missing' && (a.physical_location || '').trim() !== '') return false;
        if (fl === 'has' && (a.physical_location || '').trim() === '') return false;
        if (fbr && (a.branch || '') !== fbr) return false;
        if (fk) {
          var parts = fk.split(':');           /* e.g. "visit:no" */
          var want = parts[1] === 'yes';
          if (kpiDone(a, parts[0]) !== want) return false;
        }
        if (!q) return true;
        return fieldText(a).toLowerCase().indexOf(q) >= 0;
      });
      var BANDORD = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };
      list.sort(function (x, y) {
        if (so === 'name') return (x.name || '').localeCompare(y.name || '');
        if (so === 'branch') return (x.branch || '').localeCompare(y.branch || '') || (x.name || '').localeCompare(y.name || '');
        if (so === 'todo') return todoCount(y) - todoCount(x) || (x.name || '').localeCompare(y.name || '');
        return (BANDORD[x.band || 'F'] - BANDORD[y.band || 'F']) || (x.name || '').localeCompare(y.name || '');
      });
      var rows = list.map(function (a) {
        return '<tr><td class="c-level">' + bandPill(a.band) + '</td>' +
          '<td class="c-name">' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div>' + actInfoHtml(a) + '</td>' +
          '<td class="c-meta" data-l="phone">' + telHtml(a.phone) + '</td>' +
          '<td class="c-meta" data-l="location">' + (a.physical_location ? esc(a.physical_location) : '<span class="pill bad">missing</span>') + '</td>' +
          '<td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
          '<td class="c-kpis"><div class="kchips">' + kpiChips(a, editable) + '</div></td></tr>';
      }).join('') || '<tr><td colspan="6">' + emptyState('phone', t('Nothing here yet'),
        all.length ? t('No agent matches these filters - clear them to see your whole round.')
                   : t('Agents join this list the moment you serve them on the Agents tab.')) + '</td></tr>';

      /* how many of each high-earner list he already owns */
      var byBand = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
      all.forEach(function (a) { byBand[a.band || 'F']++; });
      /* branches actually present in his round - no point offering the rest */
      var branches = [];
      all.forEach(function (a) { if (a.branch && branches.indexOf(a.branch) < 0) branches.push(a.branch); });
      branches.sort();
      var bandChips = ['A', 'B', 'C', 'D', 'E', 'F'].map(function (b) {
        if (!byBand[b]) return '';
        return '<button class="role-chip' + (fb === b ? ' active' : '') + '" data-action="baseBand" data-b="' + b + '">' +
          t('LIST') + ' ' + b + ' <b>' + byBand[b] + '</b></button>';
      }).join('') + (fb ? '<button class="role-chip" data-action="baseBand" data-b="">' + t('All') + '</button>' : '');

      v.innerHTML =
        '<h1 class="page-title">' + t('My Agent Base') + '</h1>' +
        '<p class="page-sub">' + esc(d.month) +
        ' &middot; <span class="pill ' + (d.monthStatus === 'OPEN' ? 'gold' : 'dim') + '">' + esc(d.monthStatus || '-') + '</span>' +
        ' &middot; ' + t('Your round for this month - agents carried from last month plus anyone you serve now.') +
        (d.counts.priority ? ' &middot; <span class="pill fire">' + d.counts.priority + ' ' + t('carried from last month') + '</span>' : '') + '</p>' +
        '<div class="grid cards" style="margin-bottom:16px">' +
        card('check', t('My agents'), fmt(all.length)) +
        card('flame', t('High earners'), fmt(all.length - byBand.F), t('LIST A-E')) +
        card('users', t('Total Base'), fmt(d.counts.total)) +
        card('cal', t('Month'), d.month) +
        '</div>' +
        '<div class="panel"><div class="row" style="align-items:center;margin-bottom:8px">' +
        '<h2 style="margin:0">' + svg('phone') + (showNew ? t('New agents to claim') : t('My agents')) + ' (' + list.length + ')</h2>' +
        '<div class="spacer"></div>' +
        '<button class="ghost mini' + (showNew ? '' : ' on') + '" data-action="baseScope" data-v="">' + t('My round') +
        ' <span class="pill dim">' + fmt((d.agents || []).length) + '</span></button>' +
        '<button class="ghost mini' + (showNew ? ' on' : '') + '" data-action="baseScope" data-v="1">' + t('NEW - not yet mine') +
        ' <span class="pill ' + (d.counts.unclaimed ? 'fire' : 'dim') + '">' + fmt(d.counts.unclaimed || 0) + '</span></button>' +
        '</div>' +
        (showNew ? '<p class="note" style="margin:0 0 8px">' +
          t('Agents in the company database that no BDO owns this month. Serve one and he joins your round.') + ' ' +
          t('Agents whose physical location nobody has captured are here too - go, find the place, serve him, and he becomes yours.') + '</p>' : '') +
        '<div class="row filters" style="margin-bottom:6px">' +
        '<div class="field" style="flex:1;min-width:160px"><label>' + t('Search') + '</label>' +
        '<input id="baseSearch" placeholder="' + esc(t('name, acc, phone, branch, location...')) + '" value="' + esc(state._baseSearch || '') + '" autocomplete="off"></div>' +
        '<div class="field"><label>' + t('Search in') + '</label><select data-change="baseField">' +
        [['', t('Everything')], ['name', t('Agent')], ['acc', 'Acc'], ['phone', t('Phone')],
         ['branch', t('Branch')], ['location', t('Location')]].map(function (o) {
          return '<option value="' + o[0] + '"' + (fld === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('KPI still to do') + '</label><select data-change="baseKpi">' +
        [['', t('Any')], ['visit:no', t('Visit not done')], ['apk:no', t('APK not done')],
         ['active:no', t('Not active')], ['visit:yes', t('Visit done')], ['apk:yes', t('APK done')],
         ['active:yes', t('Active')]].map(function (o) {
          return '<option value="' + o[0] + '"' + (fk === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('Served') + '</label><select data-change="baseServed">' +
        [['', t('Any')], ['no', t('Not served yet')], ['yes', t('Already served')]].map(function (o) {
          return '<option value="' + o[0] + '"' + (fs === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('Location') + '</label><select data-change="baseLoc">' +
        [['', t('Any')], ['missing', t('Missing')], ['has', t('Captured')]].map(function (o) {
          return '<option value="' + o[0] + '"' + (fl === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('Branch') + '</label><select data-change="baseBranch">' +
        ['<option value="">' + t('All') + '</option>'].concat(branches.map(function (b) {
          return '<option value="' + esc(b) + '"' + (fbr === b ? ' selected' : '') + '>' + esc(b) + '</option>';
        })).join('') + '</select></div>' +
        '<div class="field"><label>' + t('Sort by') + '</label><select data-change="baseSort">' +
        [['band', t('High-earner list')], ['name', t('Agent')], ['branch', t('Branch')], ['todo', t('Most still to do')]].map(function (o) {
          return '<option value="' + o[0] + '"' + (so === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></div>' +
        (fk || fb || q || fs || fl || fbr || fld ? '<button class="ghost mini" data-action="baseClear">' + t('Clear') + '</button>' : '') +
        '</div>' +
        (bandChips ? '<div class="row" style="margin-bottom:10px">' + bandChips + '</div>' : '') +
        '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>List</th><th>Agent</th><th>Phone</th><th>Location</th><th>Branch</th><th>KPIs (Served / Visit / APK / Active)</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
        /* GROWING the round, directly under the round itself: a brand-new agent
         * counts in Activeness exactly like waking a sleeping one, so the two
         * belong together and belong here. */
        '<div class="panel"><div class="row" style="align-items:center">' +
        '<h2 style="margin:0">' + svg('zap') + t('Grow my round') + '</h2><div class="spacer"></div>' +
        (editable ? '<button class="btn mini" data-action="recruit">+ ' + t('Recruit new agent') + '</button>' : '') + '</div>' +
        '<p class="note">' + t('A brand-new agent you bring in counts in your Activeness exactly like waking a sleeping one.') + '</p></div>' +
        '<div id="inactivePanel"></div>';
      inactivePanelLoad();
      var sb = elById('baseSearch');
      if (sb) {
        sb.addEventListener('input', function () {
          state._baseSearch = sb.value;
          clearTimeout(state._baseTimer);
          state._baseTimer = setTimeout(function () { renderTab(); }, 220);
        });
        if (state._baseSearch) { sb.focus(); sb.setSelectionRange(sb.value.length, sb.value.length); }
      }
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* ---- high-earner priority list (bands A-E, live not-served match) ---- */
  var BAND_META = { A: 'above 2,000,000', B: 'above 1,000,000', C: 'above 500,000', D: 'above 100,000', E: 'above 50,000' };
  function heStationsFill() {
    var sel = elById('heStation'); if (!sel) return;
    api('high_earners_get').then(function (d) {
      sel.innerHTML = '<option value="">' + t('pick...') + '</option><option value="ALL">' + t('All stations') + '</option>' +
        (d.stations || []).map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('');
      var box = elById('heBox');
      if (box && !d.total) box.innerHTML = '<span class="note">' + t('The OM has not uploaded a high-earner list yet.') + '</span>';
    }).catch(function () { /* panel stays quiet */ });
  }
  function heLoad() {
    var sel = elById('heStation'), box = elById('heBox');
    if (!sel || !box) return;
    if (!sel.value) { toast(t('Pick your SA station first'), 'warn'); return; }
    var qs = sel.value === 'ALL' ? '' : '&station=' + encodeURIComponent(sel.value);
    box.innerHTML = '<div class="skel skel-line"></div><div class="skel skel-line"></div>';
    api('high_earners_get', { qs: qs }).then(function (d) {
      var editable = can('mybase', 'e') && !isSpecial();
      var html = '<div class="row" style="margin-bottom:6px"><span class="note">' +
        fmt(d.servedAlready) + ' ' + t('already served') + ' &middot; ' + t('showing the NOT-served only') + '</span></div>';
      var any = false;
      ['A', 'B', 'C', 'D', 'E'].forEach(function (b) {
        var list = d.bands[b] || [];
        if (!list.length) return;
        any = true;
        /* commission figures are management-only: BDOs get the band letter,
         * the server never sends them the amount */
        var money = !!d.showMoney;
        html += '<h3 style="margin:12px 0 6px;font-size:13px"><span class="pill fire">' + t('LIST') + ' ' + b + '</span> ' +
          '<span class="note">' + (money ? t(BAND_META[b]) + ' &middot; ' : '') + list.length + '</span></h3>' +
          '<div class="tablewrap cardwrap"><table class="cardable"><thead><tr><th>Agent</th>' + (money ? '<th>Commission</th>' : '') + '<th>Phone</th><th>Branch</th><th>Location</th><th>Action</th></tr></thead><tbody>' +
          list.map(function (a) {
            var act = a.agentId
              ? (editable ? '<button class="kchip todo" data-action="kpiMark" data-id="' + a.agentId + '" data-kpi="served" data-name="' + esc(a.name) + '">' + t('Serve') + '</button>' : '-')
              : '<span class="pill dim">' + t('not in system yet') + '</span>';
            return '<tr><td class="c-name">' + esc(a.name || a.acc) + '<div class="note">' + esc(a.acc) + '</div></td>' +
              (money ? '<td class="c-meta" data-l="commission"><b>' + fmt(a.commission) + '</b></td>' : '') +
              '<td class="c-meta" data-l="phone">' + telHtml(a.phone) + '</td>' +
              '<td class="c-meta" data-l="branch">' + esc(a.branch || '-') + '</td>' +
              '<td class="c-meta" data-l="location">' + (a.location ? esc(a.location) : '<span class="pill bad">missing</span>') + '</td>' +
              '<td class="c-kpis">' + act + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      });
      if (!any) html += '<div class="note">' + t('Every high earner here is already served. Excellent.') + '</div>';
      box.innerHTML = html;
    }).catch(function (e) { box.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
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
                 api('route_plans_get'), api('places_get')]).then(function (rr) {
      var d = rr[0], base = rr[1], pipe = rr[2], sum = rr[3], rp = rr[4], places = rr[5];

      /* His saved places: tick as many as he plans to visit today and they are
       * joined into the route - no retyping the same spots every morning. */
      var placeList = (places && places.rows) || [];
      function placeChips(current) {
        var chosen = String(current || '').split(/\s*(?:->|,)\s*/).filter(Boolean);
        return placeList.map(function (p) {
          var on = chosen.indexOf(p.place) >= 0;
          return '<label class="role-chip' + (on ? ' active' : '') + '" style="cursor:pointer">' +
            '<input type="checkbox" class="rpPlace" value="' + esc(p.place) + '"' + (on ? ' checked' : '') + ' style="accent-color:var(--fire2);margin-right:5px">' +
            esc(p.place) + '</label>';
        }).join('');
      }
      function routeEditor(current, label) {
        return '<div class="row" style="margin-top:8px">' + (placeList.length ? placeChips(current) : '') + '</div>' +
          (placeList.length ? '<p class="note">' + t('Tick the places you will visit - they fill the route below.') + '</p>' : '') +
          '<div class="row" style="margin-top:6px"><input id="rpPlan" maxlength="2000" style="flex:1;min-width:200px" value="' + esc(current || '') + '" placeholder="' + esc(t('e.g. Kaloleni -> Sakina -> Njiro, then HYDOM branch')) + '">' +
          '<button class="btn" data-action="routeSave">' + label + '</button></div>' +
          '<div class="row" style="margin-top:6px"><div class="field" style="flex:1;min-width:160px"><label>' + t('Save a place for next time') + '</label>' +
          '<input id="newPlace" maxlength="160" placeholder="' + esc(t('e.g. Kaloleni')) + '"></div>' +
          '<button class="ghost mini" data-action="placeAdd">+ ' + t('Save place') + '</button></div>';
      }

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
            ? routeEditor(todayPlan.plan, t('Resend plan'))
            : '');
      } else if (todayPlan) {
        routeHtml = '<div class="note" style="margin-top:6px"><span class="pill gold">PENDING</span> ' + esc(todayPlan.plan) + ' &middot; ' + t('waiting for your team leader') + '</div>' +
          (before10 ? routeEditor(todayPlan.plan, t('Update plan')) : '');
      } else if (before10) {
        routeHtml = routeEditor('', t('Send route plan'));
      } else {
        routeHtml = '<div class="note" style="margin-top:6px"><span class="pill bad">' + t('CLOSED') + '</span> ' + t('Route plans close at 10:00 EAT - ask your team leader to assign one.') + '</div>';
      }
      /* ACTIVENESS work lives here now (moved out of My Agent Base): recruiting
       * a new agent counts in the SAME activeness KPI as waking a sleeping one. */
      var canMark = can('mybase', 'e') && base.monthStatus === 'OPEN';
      /* wake + recruit now live entirely on the FIELD ACTIVITY tab */
      var activenessPanel = '';
      var routePanel = can('mybase', 'e')
        ? '<div class="panel"><h2>' + svg('pin') + t('My route plan today') + ' <span class="pill dim">' + esc(rp.now || '') + ' EAT</span></h2>' +
          '<p class="note">' + t('Write the places you are going to visit BEFORE 10:00 EAT. Your team leader approves it.') + '</p>' + routeHtml + '</div>'
        : '';
      var mine = (d.reports || []).filter(function (r) { return r.bdo === state.user.username; }).reverse();
      var tot = { f: 0, a: 0 };
      mine.forEach(function (r) { tot.f += Number(r.float) || 0; tot.a += Number(r.apk) || 0; });
      var hist = mine.slice(0, 14).map(function (r) {
        return '<tr><td>' + esc(r.date) + '</td><td>' + fmt(r.float) + '</td>' +
          '<td>' + (r.late ? '<span class="pill gold">LATE</span>' : '<span class="pill ok">OK</span>') + '</td></tr>';
      }).join('') || '<tr><td colspan="3" class="note">-</td></tr>';
      var totalRow = mine.length
        ? '<tr style="font-weight:800"><td>' + t('Total') + ' (' + mine.length + ')</td><td>' + fmt(tot.f) + '</td><td></td></tr>'
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
          routePanel + perfPanel + activenessPanel + (pipe ? pipePanel(pipe) : '') +
          reportDaysPanel(d, base.month || curMonth());
        return;
      }
      v.innerHTML =
        greetingLine() + '<h1 class="page-title">' + t('Daily Report') + '</h1>' +
        '<p class="page-sub">' + t('Type only FLOAT here. Every other KPI is ticked on the agent itself, so we always know which agent was handled by whom.') + '</p>' +
        '<div class="panel"><h2>' + svg('cal') + t('Send report') + '</h2>' +
        '<div class="row"><div class="field"><label>' + t('Report date (today or up to 2 days back)') + '</label><input id="drDate" type="date" value="' + isoToday() + '" min="' + isoDaysAgo(2) + '" max="' + isoToday() + '"></div>' +
        '<div class="field"><label>' + t('Total float served') + '</label><input id="drFloat" type="number" min="0" placeholder="0"></div></div>' +
        '<p class="note" style="margin-top:8px">' + svg('users') + ' ' + t('Serving, visits, APK and activeness: tick them on the agent, not here.') + ' <button class="ghost tiny" data-action="tab" data-tab="' + (can('agents', 'v') ? 'agents' : 'mybase') + '">' + t('Open agent list') + '</button></p>' +
        '<div class="row" style="margin-top:10px"><button class="btn" data-action="drSave">' + t('Save report') + '</button>' +
        '<button class="ghost" data-action="shortage">' + svg('alert') + ' ' + t('Report float shortage') + '</button></div></div>' +
        routePanel + perfPanel + activenessPanel + (pipe ? pipePanel(pipe) : '') +
        '<div class="panel"><h2>' + svg('chart') + t('My reports this month') + '</h2>' +
        '<div class="tablewrap"><table><thead><tr><th>' + t('Date') + '</th><th>Float</th><th>' + t('Status') + '</th></tr></thead><tbody>' + hist + totalRow + '</tbody></table></div></div>' +
        /* the report-days grid belongs next to where he writes reports, not on
         * the dashboard - OK / LATE / MISS for every working day of the month */
        reportDaysPanel(d, base.month || curMonth());
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function reportDaysPanel(dr, month) {
    var mx = reportDaysMatrix(dr, month);
    return '<div class="panel"><h2>' + svg('cal') + t('My report days') + ' - ' + esc(month || '') + '</h2>' +
      '<p class="note"><span class="pill ok">OK</span> ' + t('on time') + ' &middot; <span class="pill gold">LATE</span> &middot; <span class="pill bad">MISS</span> ' +
      t('working day without a report') + '</p>' +
      '<div class="tablewrap"><table><thead><tr>' + mx.head + '</tr></thead><tbody>' + mx.body + '</tbody></table></div></div>';
  }
  function drSave() {
    api('daily_report_save', { body: { date: elById('drDate').value, float: elById('drFloat').value } })
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
  /* `confirmed` is set once the BDO has been through the serve dialog, so the
   * server knows he was offered the receipt-photo box. */
  function kpiMark(id, kpi, name, node, location, proof, proofNote, confirmed) {
    api('kpi_mark', { body: { agentId: Number(id), kpi: kpi, location: location || '', proof: proof || '', proofNote: proofNote || '', confirmed: confirmed ? '1' : '' } })
      .then(function () {
        toast(t('Status updated') + ' - ' + esc(name), 'ok');
        /* swap ONLY the tapped chip in place - never reload the list, so the
         * BDO keeps his scroll position and carries on down the page */
        swapChip(node, kpi, state.user.username);
      })
      .catch(function (e) {
        if (e.data && e.data.needLocation) { locationModal(id, kpi, name, node, e.data.receiptRule || 'optional', e.data.agentLoc || '', e.data.partnerServed); return; }
        if (e.data && e.data.needProof) { proofModal(id, name, node, e.data.agentLoc || ''); return; }
        toast(e.message, 'err');
        /* someone else already did it - show their name on the chip, in place */
        var m = String(e.message).match(/Already done by (\S+)/);
        if (m) swapChip(node, kpi, m[1]);
      });
  }
  /* Forced physical-location entry before an agent can be marked served. */
  /* Serving modal: physical location (required for the base count) + serving
   * RECEIPT photo (optional or compulsory per the OM's setting). Separate from
   * the wake-up receipt. */
  function locationModal(id, kpi, name, node, receiptRule, knownLoc, partnerServed) {
    var required = receiptRule === 'required';
    openModal('<h2>' + svg('pin') + ' ' + t('Serve') + ' ' + esc(name) + '</h2>' +
      /* Claiming an agent the file gave to the partner: say so plainly BEFORE he
       * fills anything in, so he knows the receipt is the whole case and that
       * the OM will be told. */
      (partnerServed
        ? '<div class="panel" style="border-color:var(--bad);margin-bottom:10px;padding:12px">' +
          '<b>' + svg('alert') + ' ' + t('The file says the PARTNER served this agent') + '</b>' +
          '<p class="note" style="margin:6px 0 0">' +
          t('You can still claim him if the visit was yours, but the receipt photo is compulsory and your OM is told so he can decide.') + '</p></div>'
        : '') +
      '<p class="note">' + t('Confirm the agent\'s physical location - it becomes his known location and counts him into your base.') + ' ' +
      t('Attach the receipt photo of what he transacted as your proof of serving.') + ' ' +
      t('Take the receipt photo now, or attach one already saved on your phone.') + '</p>' +
      '<div class="field"><label>' + t('Physical location') + '</label><input id="locInput" value="' + esc(knownLoc || '') + '" placeholder="e.g. Kaloleni, opposite NMB Bank"></div>' +
      '<div class="field" style="margin-top:8px"><label>' + t('Serving receipt photo') + ' ' +
      (required ? '<span class="pill bad">' + t('COMPULSORY') + '</span>' : '<span class="pill dim">' + t('optional') + '</span>') + '</label>' +
      photoPicker('serveFile') + '</div>' +
      '<div id="servePrev" style="margin-top:8px;text-align:center"></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
      '<button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
      '<button class="btn" data-action="locConfirm" data-id="' + id + '" data-kpi="' + kpi + '" data-name="' + esc(name) + '" data-req="' + (required ? '1' : '') + '">' + t('Save & mark served') + '</button></div>');
    state._locNode = node;
    state._serveProof = '';
    photoPickerWire('serveFile', 'servePrev', function (dataUrl) {
      state._serveProof = dataUrl;
    });
  }
  /* ---------------- where the photo comes from ----------------
   * `capture="environment"` does not mean "prefer the camera" on a phone - it
   * means CAMERA ONLY, and the gallery is not offered at all. So a receipt he
   * photographed at the agent's counter an hour ago, or one a colleague sent
   * him on WhatsApp, could never be attached. Two separate inputs: one goes
   * straight to the camera, one straight to the gallery, both feeding the same
   * preview. The camera sits first because a fresh photo is the honest default.
   */
  function photoPicker(base) {
    /* input BEFORE its own label so the focus ring can follow it in CSS */
    return '<div class="row pick-row">' +
      '<input class="pick-input" id="' + base + 'Cam" type="file" accept="image/*" capture="environment">' +
      '<label class="pick-btn" for="' + base + 'Cam">' + svg('camera') + ' ' + t('Take photo') + '</label>' +
      '<input class="pick-input" id="' + base + 'Gal" type="file" accept="image/*">' +
      '<label class="pick-btn" for="' + base + 'Gal">' + svg('gallery') + ' ' + t('Choose from gallery') + '</label>' +
      '</div>';
  }
  /* Both inputs share one handler, and picking from one clears the other so the
   * last photo chosen is always the one that gets sent. */
  function photoPickerWire(base, prevId, done) {
    ['Cam', 'Gal'].forEach(function (which) {
      var inp = elById(base + which);
      if (!inp) return;
      inp.addEventListener('change', function () {
        var other = elById(base + (which === 'Cam' ? 'Gal' : 'Cam'));
        if (other) other.value = '';
        readPhoto(inp.files && inp.files[0], elById(prevId), done);
      });
    });
  }
  /* ---------------- photo picker (shared, resilient) ----------------
   * Phones hand us formats a plain <img> cannot decode (iPhone HEIC above all).
   * The old code just fired onerror and left the Save button dead, which is the
   * "it gets stuck" the field reported. Now: try createImageBitmap (widest
   * format support), fall back to Image, and if BOTH fail send the original
   * file untouched as long as the server will accept it. The user always gets
   * either a preview or a real explanation - never a frozen button. */
  function readPhoto(file, box, done) {
    if (!file) return;
    var MAXB = 4 * 1024 * 1024;
    function show(msg, cls) { if (box) box.innerHTML = '<span class="' + (cls || 'note') + '">' + esc(msg) + '</span>'; }
    function preview(dataUrl) {
      if (box) box.innerHTML = '<img src="' + dataUrl + '" alt="receipt preview" style="max-width:100%;max-height:140px;border-radius:10px">';
      done(dataUrl);
    }
    show(t('Preparing the photo...'));
    function shrink(src, w0, h0, cleanup) {
      try {
        var max = 1280, w = w0, h = h0;
        if (w > max || h > max) { var s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(src, 0, 0, w, h);
        var out = cv.toDataURL('image/jpeg', 0.72);
        if (cleanup) cleanup();
        preview(out);
        return true;
      } catch (e) { if (cleanup) cleanup(); return false; }
    }
    function rawFallback() {
      /* no decode possible - ship the original bytes if the server takes them */
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type || '')) {
        show(t('This photo format is not supported. Take the picture with the camera instead.'), 'err');
        return;
      }
      if (file.size > MAXB) { show(t('Photo too large - take a smaller picture.'), 'err'); return; }
      var fr = new FileReader();
      fr.onload = function () { preview(String(fr.result)); };
      fr.onerror = function () { show(t('Could not read the photo - try again.'), 'err'); };
      fr.readAsDataURL(file);
    }
    function viaImage() {
      var url = URL.createObjectURL(file);
      var img = new Image();
      var settled = false;
      var guard = setTimeout(function () {
        if (settled) return; settled = true;
        URL.revokeObjectURL(url); rawFallback();
      }, 12000); /* never hang forever */
      img.onload = function () {
        if (settled) return; settled = true; clearTimeout(guard);
        if (!shrink(img, img.width, img.height, function () { URL.revokeObjectURL(url); })) rawFallback();
      };
      img.onerror = function () {
        if (settled) return; settled = true; clearTimeout(guard);
        URL.revokeObjectURL(url); rawFallback();
      };
      img.src = url;
    }
    if (window.createImageBitmap) {
      createImageBitmap(file).then(function (bmp) {
        if (!shrink(bmp, bmp.width, bmp.height, function () { if (bmp.close) bmp.close(); })) viaImage();
      }).catch(viaImage);
    } else viaImage();
  }
  /* Waking an INACTIVE agent needs a receipt photo. The photo is downscaled on
   * the phone (max 1280px JPEG) so it uploads fast even on slow networks. */
  function proofModal(id, name, node, knownLoc) {
    openModal('<h2>' + svg('zap') + ' ' + t('Wake') + ' ' + esc(name) + '</h2>' +
      '<p class="note">' + t('Take a photo of the agent\'s TRANSACTION RECEIPTS as proof he is transacting again. Management can open it from his chip.') + ' ' +
      t('Take the receipt photo now, or attach one already saved on your phone.') + '</p>' +
      '<div class="field"><label>' + t('Receipt photo') + '</label>' +
      photoPicker('proofFile') + '</div>' +
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
    photoPickerWire('proofFile', 'proofPrev', function (dataUrl) {
      state._proofData = dataUrl;
      if (state._proofReady) state._proofReady();
    });
  }

  /* ---------------- weekly upload ---------------- */
  /* ---------------- DATABASE UPLOAD ----------------
   * Every file the office feeds the system comes through one door, and the KIND
   * of file decides what it is allowed to do. Only the PERFORMANCE file scores
   * anybody or raises a flag; the rest maintain the database and nothing more.
   * One screen, one file box, one type - rather than five separate panels each
   * with its own half-remembered rules. */
  var UPLOAD_KINDS = [
    { k: 'performance', label: 'Weekly performance', icon: 'chart', scores: true,
      hint: 'The result file. Writes the office KPI totals, gives each BDO his credits, and raises flags where a BDO claim is not backed. This is the ONLY file that judges anybody.',
      cols: 'Agent Account, Agent Name, Phone, Branch, Servicing, Agent Visit, APK, Agent Activeness, SA Commission, Served Status, SA Station. Optional: BDO, Physical Location.' },
    { k: 'fixed', label: 'Monthly database (fixed)', icon: 'users', scores: false,
      hint: 'The start-of-month baseline: every agent with his standing status - nobody served, no visits, no float, activeness as it stands, APK version where known. Refreshes the agent database only. NO credits, NO office totals and NO flags, so it is safe to upload late even after the BDOs have been out serving all week.',
      cols: 'Agent Account, Agent Name, Phone, Branch, SA Station, Agent Activeness, APK. Optional: Physical Location.' },
    { k: 'location', label: 'Physical locations', icon: 'pin', scores: false,
      hint: 'Fills in where agents actually are. Touches the address only - no KPI, no score, no flag.',
      cols: 'Agent Account, Physical Location. Optional: Agent Name, Branch, SA Station.' },
    { k: 'commission', label: 'Commission file', icon: 'dollar', scores: false,
      hint: 'The month\'s commission per agent, used to work out the release percentage. Kept per SA station.',
      cols: 'Agent Account, Agent Name, SA Commission, Served Status, SA Station.' },
    { k: 'highearners', label: 'High-earner list', icon: 'flame', scores: false,
      hint: 'Ranks agents by commission into LIST A-E so every BDO chases the valuable ones first. Uploading REPLACES the previous list.',
      cols: 'Agent Account, Agent Name, SA Commission, SA Station.' }
  ];
  function viewUpload(v) {
    var sel = state._upKind || 'performance';
    var def = UPLOAD_KINDS.filter(function (x) { return x.k === sel; })[0] || UPLOAD_KINDS[0];
    state._upKind = def.k;

    var chips = UPLOAD_KINDS.map(function (x) {
      return '<button class="role-chip' + (x.k === def.k ? ' active' : '') + '" data-action="upKind" data-k="' + x.k + '">' +
        svg(x.icon) + ' ' + esc(t(x.label)) +
        (x.scores ? ' <span class="pill bad">' + t('scores') + '</span>' : '') + '</button>';
    }).join('');

    v.innerHTML =
      '<h1 class="page-title">' + t('Database Upload') + '</h1>' +
      '<p class="page-sub">' + t('Every office file comes in here. Pick what kind it is - only the performance file scores anybody or raises a flag.') + '</p>' +

      '<div class="panel"><h2>' + svg('upload') + t('What are you uploading?') + '</h2>' +
      '<div class="row" style="gap:8px;margin-bottom:10px">' + chips + '</div>' +
      '<div class="panel" style="margin:0;border-color:' + (def.scores ? 'var(--bad)' : 'var(--line)') + '">' +
      '<b>' + svg(def.icon) + ' ' + esc(t(def.label)) + '</b>' +
      (def.scores
        ? ' <span class="pill bad">' + t('This file scores and flags') + '</span>'
        : ' <span class="pill ok">' + t('Updates the database only - never scores, never flags') + '</span>') +
      '<p class="note" style="margin:6px 0 0">' + esc(t(def.hint)) + '</p>' +
      '<p class="note" style="margin:6px 0 0"><b>' + t('Columns') + ':</b> ' + esc(def.cols) + '</p></div>' +

      '<div class="row" style="margin-top:10px">' +
      '<div class="field"><label>' + t('Month') + '</label><input id="upMonth" type="month" value="' + esc(state.openMonth || curMonth()) + '"></div>' +
      (def.k === 'performance' ? '<div class="field"><label>' + t('Week') + '</label><input id="upWeek" placeholder="e.g. W1"></div>' : '') +
      '<div class="field"><label>' + t('Label') + ' (' + t('optional') + ')</label><input id="upLabel" maxlength="160" placeholder="' + esc(t('e.g. August baseline')) + '"></div>' +
      '<div class="field"><label>' + t('Excel file') + ' (.xlsx)</label><input id="upFile" type="file" accept=".xlsx,.xls,.csv"></div>' +
      (can('upload', 'e')
        ? '<button class="btn" data-action="doUpload">' + svg('upload') + ' ' + t('Upload') + '</button>' +
          (def.k === 'performance' ? '<button class="ghost" data-action="loadDemo">' + t('Load demo data') + '</button>' : '')
        : '<span class="note">' + t('View only.') + '</span>') +
      '</div>' +
      /* the result of the last import, with its own dismiss - a summary that
       * cannot be cleared looks like it is still happening */
      '<div id="upResult" class="note" style="margin-top:12px"></div>' +
      '<div class="row" style="margin-top:6px"><button class="ghost mini" data-action="upClear">' + t('Clear result') + '</button></div>' +
      '</div>';
  }
  function heUpload() {
    readExcel(elById('heFile'), function (rows) {
      api('high_earners_upload', { body: { rows: rows } })
        .then(function (d) {
          elById('heResult').innerHTML = '<span class="pill ok">' + d.count + ' ' + t('high earners saved') + '</span> ' + t('BDOs now see the not-served ones on their priority list.');
          toast(d.count + ' ' + t('high earners saved'), 'ok');
        })
        .catch(function (e) { elById('heResult').innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
    });
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
  /* One button, five destinations. The kind chosen above decides which endpoint
   * the rows go to and what the file is allowed to change. */
  function doUpload() {
    var kind = state._upKind || 'performance';
    var box = elById('upResult');
    readExcel(elById('upFile'), function (rows) {
      box.innerHTML = '<span class="note">' + t('Importing') + ' ' + fmt(rows.length) + ' ' + t('rows...') + '</span>';
      if (kind === 'highearners') {
        api('high_earners_upload', { body: { rows: rows } })
          .then(function (d) {
            box.innerHTML = '<span class="pill ok">' + d.count + ' ' + t('high earners saved') + '</span> ' +
              t('BDOs now see the not-served ones on their priority list.');
            toast(d.count + ' ' + t('high earners saved'), 'ok');
          })
          .catch(function (e) { box.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
        return;
      }
      if (kind === 'commission') {
        api('commission_upload', { body: { month: elById('upMonth').value, rows: rows } })
          .then(function (d) {
            box.innerHTML = '<span class="pill ok">' + fmt(d.rows || d.count || rows.length) + ' ' + t('commission rows saved') + '</span> ' +
              t('Open Commission & Months to calculate the release.');
            toast(t('Commission file saved'), 'ok');
          })
          .catch(function (e) { box.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
        return;
      }
      api('upload_weekly', { body: {
        month: elById('upMonth').value,
        week: elById('upWeek') ? elById('upWeek').value : '',
        label: elById('upLabel') ? elById('upLabel').value : '',
        mode: kind, rows: rows
      } })
        .then(function (d) { box.innerHTML = uploadSummary(d); toast(t('Upload complete'), 'ok'); })
        .catch(function (e) { box.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
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
    var KINDNAME = { performance: 'weekly performance', fixed: 'monthly database baseline',
                     location: 'physical locations', priority: 'priority base' };
    var s = 'Imported <b>' + fmt(d.rows) + '</b> rows into ' + esc(d.month) +
            ' as <b>' + esc(t(KINDNAME[d.mode] || d.mode || 'performance')) + '</b>';
    s += d.scoring
      ? ': ' + fmt(d.served) + ' served. BDOs: <b>' + (d.bdos || []).map(esc).join(', ') + '</b>.'
      : '. <span class="pill ok">' + t('No scores and no flags from this file') + '</span>';
    if (d.newAgents) s += ' <span class="pill fire">' + fmt(d.newAgents) + ' ' + t('new agents added') + '</span> ' +
      t('- BDOs can claim them under NEW in My Agent Base.');
    if (d.createdBdos && d.createdBdos.length) s += ' New BDO accounts: ' + d.createdBdos.map(esc).join(', ') + ' (password imani123).';
    if (d.flagged) s += ' <span class="pill bad">' + d.flagged + ' flag' + (d.flagged > 1 ? 's' : '') + ' raised</span> (a BDO claim the month\'s files do not back - see Flags).';
    /* blank SA STATION cells were counted into the home station rather than
     * dropped - say so, so the file can be fixed at source */
    if (d.blankStation) {
      s += '<div class="note" style="margin-top:6px"><span class="pill gold">' + fmt(d.blankStation) + ' ' + t('rows had no SA STATION') + '</span> ' +
        t('counted as') + ' <b>' + esc(d.homeStation || '') + '</b> ' + t('so nothing drops out of that station\'s attainment - fix the column in the file when you can.') + '</div>';
    }
    return s;
  }

  /* ---------------- targets (typed) + per-BDO targets & weights ---------------- */
  var DEFAULT_W = { serving: 30, float: 20, visits: 20, apk: 15, activeness: 15 };
  /* CAREFUL: `t` is the global translator. Never name a local that, here or in
   * any callback below - shadowing it turns every t('...') in this function
   * into "t is not a function" and blanks the whole page. */
  function bdoTargetsPanel(bt) {
    var m = bt.month;
    var byBdo = {};
    (bt.targets || []).forEach(function (row) { byBdo[row.bdo] = row; });
    var sel = state._btBdo && bt.bdos.some(function (b) { return b.username === state._btBdo; }) ? state._btBdo : (bt.bdos[0] ? bt.bdos[0].username : '');
    state._btBdo = sel;
    var cur = byBdo[sel] || {};
    var opts = bt.bdos.map(function (b) {
      return '<option value="' + esc(b.username) + '"' + (b.username === sel ? ' selected' : '') + '>' + esc(b.name) + (byBdo[b.username] ? ' ✓' : '') + '</option>';
    }).join('');
    var rows = TARGET_DEFS.map(function (td) {
      var col = td.key;
      var tv = cur[col + '_target'], wv = cur[col + '_w'];
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
      /* Start-of-month shortcut: write these numbers to EVERY BDO in one go,
       * then tailor the exceptions individually. Typing the same five figures
       * officer by officer was the slowest job of the month. */
      (can('targets', 'e')
        ? '<div class="row" style="margin:0 0 10px;align-items:center">' +
          '<button class="ghost" data-action="btSaveAll">' + svg('users') + ' ' + t('Apply these to ALL BDOs') + '</button>' +
          '<button class="ghost" data-action="btSaveMissing">' + t('Only fill BDOs with no targets yet') + '</button>' +
          '<span class="note">' + t('Set everyone in one entry, then adjust the exceptions above.') + '</span></div>'
        : '') +
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
  function btSave() {
    var body = { month: elById('tgMonth') ? elById('tgMonth').value : (state.month || state.openMonth), bdo: elById('btBdo').value };
    TARGET_DEFS.forEach(function (td) { body[td.key] = elById('bt_' + td.key).value; body[td.key + '_w'] = elById('btw_' + td.key).value; });
    api('bdo_targets_save', { body: body })
      .then(function () { toast('Targets & weights saved for ' + body.bdo, 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  /* Write the typed targets to EVERY active BDO. Overwriting other people's
   * numbers is not something to do by accident, so it confirms first and says
   * exactly how many officers it will touch. */
  function btSaveAll(onlyMissing) {
    var body = { month: elById('tgMonth') ? elById('tgMonth').value : (state.month || state.openMonth) };
    TARGET_DEFS.forEach(function (td) { body[td.key] = elById('bt_' + td.key).value; body[td.key + '_w'] = elById('btw_' + td.key).value; });
    if (onlyMissing) body.onlyMissing = '1';
    var ask = onlyMissing
      ? t('Give these targets to every BDO who has none set for') + ' ' + body.month + '?'
      : t('Overwrite the targets of EVERY BDO for') + ' ' + body.month + '? ' + t('Individual changes made so far will be replaced.');
    if (!window.confirm(ask)) return;
    api('bdo_targets_save_all', { body: body })
      .then(function (d) {
        toast(d.set + ' ' + t('BDOs set') + (d.kept ? ' - ' + d.kept + ' ' + t('left untouched') : ''), 'ok');
        renderTab();
      })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function btUpdateSum() {
    var s = 0;
    TARGET_DEFS.forEach(function (td) { var el = elById('btw_' + td.key); if (el) s += Number(el.value) || 0; });
    var el = elById('btSum');
    if (el) { el.textContent = s; el.style.color = s === 100 ? 'var(--ok)' : 'var(--bad)'; }
  }
  /* Office targets are typed per MONTH x SA STATION. Station "" is the
   * all-stations roll-up; picking ARUSHA edits Arusha's own numbers, which is
   * what Target Attainment reads when the dashboard is scoped to Arusha.
   * CAREFUL: never name a local variable `t` in here - `t` is the translator. */
  function viewTargets(v) {
    var m0 = state.month || state.openMonth || curMonth();
    /* no bdo_performance call any more - that table moved to the BDOs window */
    Promise.all([api('targets_get'), api('bdo_targets_get', { qs: '&month=' + m0 })]).then(function (rr) {
      var list = (rr[0] && rr[0].rows) || [], bt = rr[1];
      var stations = (rr[0] && rr[0].stations) || [];
      var home = (rr[0] && rr[0].homeStation) || 'ARUSHA';
      var m = m0;
      /* default to the home station - that is the region actually being worked */
      var st = state.tgStation;
      if (st === undefined) st = stations.indexOf(home) >= 0 ? home : '';
      state.tgStation = st;

      var cur = {};
      list.forEach(function (row) { if (row.month === m && row.station === st) cur = row; });

      var fields = OFFICE_DEFS.map(function (def) {
        var val = cur[def.key + '_target'];
        var wv = cur[def.key + '_w'];
        return '<div class="tg-row"><span class="tg-ic">' + svg(def.icon) + '</span>' +
          '<span class="tg-name">' + esc(def.label) + '</span>' +
          '<div class="field"><label>Target</label><input id="tg_' + def.key + '" type="number" min="0" style="width:150px" value="' + (val != null ? esc(val) : '') + '" placeholder="0"></div>' +
          '<div class="field"><label>Weight %</label><input id="tgw_' + def.key + '" type="number" min="0" max="100" style="width:90px" class="tg-w" value="' + (wv != null && Number(wv) > 0 ? esc(wv) : '') + '" placeholder="0"></div>' +
          '<span class="note" style="flex:1">' + esc(def.hint) + '</span></div>';
      }).join('');

      var stOpts = '<option value="">' + t('All stations') + '</option>' +
        stations.map(function (s) { return '<option value="' + esc(s) + '"' + (s === st ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('');

      var hist = list.map(function (r) {
        return '<tr><td>' + esc(r.month) + '</td><td>' + (r.station ? '<span class="pill fire">' + esc(r.station) + '</span>' : '<span class="pill dim">' + t('All stations') + '</span>') + '</td>' +
          '<td>' + fmt(r.serving_target) + '</td><td>' + fmt(r.float_target) + '</td><td>' + fmt(r.visits_target) + '</td>' +
          '<td>' + fmt(r.apk_target) + '</td><td>' + fmt(r.activeness_target) + '</td><td>' + fmt(r.withdraw_target || 0) + '</td></tr>';
      }).join('') || '<tr><td colspan="8">' + emptyState('target', 'No targets yet', 'Type this month\'s targets above and save.') + '</td></tr>';

      v.innerHTML =
        '<h1 class="page-title">Monthly Targets</h1><p class="page-sub">Type the office targets for the month &mdash; they drive the dashboard and the commission achievement.</p>' +
        '<div class="panel"><h2>' + svg('target') + 'Set Office Targets &amp; KPI Weights</h2>' +
        '<p class="note">Targets belong to one <b>SA Station</b>: pick the region, then type its numbers. The dashboard reads exactly these when it is scoped to that station. Weights must total <b>100</b> - or leave all empty for a plain average.</p>' +
        '<div class="row" style="margin-bottom:8px"><div class="field"><label>Month</label><input id="tgMonth" type="month" value="' + esc(m) + '"></div>' +
        '<div class="field"><label>SA Station</label><select id="tgStation" data-change="tgStationPick">' + stOpts + '</select></div>' +
        '<button class="ghost" data-action="tgLoad">Load</button><div class="spacer"></div>' +
        '<span class="note">Weights total: <b id="tgSum">0</b>%</span>' +
        (can('targets', 'e') ? '<button class="btn" data-action="tgSave">Save targets</button>' : '<span class="note">View only.</span>') + '</div>' +
        '<p class="note">' + (st ? t('Editing') + ' <b>' + esc(st) + '</b>' : t('Editing the all-stations roll-up')) +
        (cur.month ? '' : ' &middot; <span class="pill dim">' + t('nothing saved here yet') + '</span>') + '</p>' +
        fields + '</div>' +
        bdoTargetsPanel(bt) +
        '<div class="panel"><h2>' + svg('cal') + 'Saved Office Targets</h2><div class="tablewrap"><table><thead><tr><th>Month</th><th>SA Station</th><th>Serving</th><th>Float</th><th>Visits</th><th>APK</th><th>Activeness</th><th>Withdraw</th></tr></thead><tbody>' + hist + '</tbody></table></div></div>';
      btUpdateSum();
      tgUpdateSum();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  function tgSave() {
    var body = { month: elById('tgMonth').value, station: elById('tgStation') ? elById('tgStation').value : '' };
    OFFICE_DEFS.forEach(function (def) {
      body[def.key] = elById('tg_' + def.key).value;
      body[def.key + '_w'] = elById('tgw_' + def.key).value;
    });
    api('targets_save', { body: body })
      .then(function () {
        toast(t('Targets saved for') + ' ' + body.month + (body.station ? ' - ' + body.station : ''), 'ok');
        state.month = body.month; state.tgStation = body.station; renderTab();
      })
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
      var qs = '&month=' + sel + (state._commStation ? '&station=' + encodeURIComponent(state._commStation) : '');
      return api('commission_get', { qs: qs }).then(function (d) {
        state._commStation = d.station || '';
        var strip = ms.months.map(function (m) {
          return '<button class="mo ' + m.status + (m.month === sel ? ' sel' : '') + '" data-action="commMonth" data-m="' + m.month + '">' + m.month + '<span class="st">' + m.status + '</span></button>';
        }).join('');
        /* Every station on file for this month, plus the one being viewed even
         * if nothing has been uploaded for it yet. */
        var stns = (d.stations || []).slice();
        if (d.station && stns.indexOf(d.station) < 0) stns.unshift(d.station);
        var stationBar = stns.length > 1
          ? '<div class="role-chips" style="margin:6px 0 10px">' + stns.map(function (sn) {
              return '<button class="role-chip' + (sn === d.station ? ' active' : '') + '" data-action="commStation" data-s="' + esc(sn) + '">' + esc(sn) + '</button>';
            }).join('') + '</div>'
          : '';
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
          '<div class="panel"><h2>' + svg('dollar') + 'Final Commission &mdash; ' + esc(sel) + ' &middot; ' + esc(d.station || 'no station') + ' <span class="pill ' + (d.status === 'OPEN' ? 'gold' : d.status === 'AWAITING' ? 'fire' : 'dim') + '">' + esc(d.status || '?') + '</span></h2>' +
          stationBar +
          '<p class="note">Each SA station is settled on its own: its own served rows, its own pool, its own achievement.</p>' +
          '<p class="note">Uploaded rows: <b>' + fmt(d.uploadedRows) + '</b> (' + fmt(d.servedRows) + ' served) for <b>' + esc(d.station || '-') + '</b>. Suggested achievement from ' + esc(d.station || 'this station') + ' targets: <b>' + (d.suggestedAchievement == null ? 'set targets first' : d.suggestedAchievement + '%') + '</b></p>' +
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
      /* The station travels with the upload so a file WITHOUT an SA STATION
       * column lands on the station being viewed instead of nowhere. */
      api('commission_upload', { body: { month: state._commMonth, station: state._commStation || '', rows: rows } })
        .then(function (d) {
          toast('Commission file loaded: ' + fmt(d.rows) + ' rows (' + (d.stations || []).join(', ') + ')', 'ok');
          renderTab();
        })
        .catch(function (e) { toast(e.message, 'err'); });
    });
  }
  function commDemo() {
    var rows = [], stn = state._commStation || 'ARUSHA';
    for (var i = 1; i <= 10; i++) rows.push({ 'Agent Account': 'D' + i, 'SA Commission': 12500000, 'Served Status': i <= 8 ? 'SERVED' : 'NOT_SERVED', 'SA STATION': stn });
    api('commission_upload', { body: { month: state._commMonth, station: stn, rows: rows } })
      .then(function () { toast('Demo commission loaded for ' + stn + ' (8 x 12.5M served)', 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function commCalc() {
    api('commission_calc', { body: { month: state._commMonth, station: state._commStation || '', achievement: elById('commAch').value } })
      .then(function () { toast('Commission calculated & saved for ' + (state._commStation || 'station'), 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function commStation(el) { state._commStation = el.getAttribute('data-s') || ''; renderTab(); }
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
  /* Who sent his daily report, who was late, who missed a working day. */
  function reportDaysPanel(dr, m) {
    var mx = reportDaysMatrix(dr, m);
    return '<div class="panel"><h2>' + svg('cal') + t('Daily reports - last') + ' ' + mx.days + ' ' + t('days') + '</h2>' +
      '<p class="note"><span class="pill ok">OK</span> ' + t('on time') + ' &middot; <span class="pill gold">LATE</span> ' +
      t('after midnight') + ' &middot; <span class="pill bad">MISS</span> ' + t('working day without a report') + '</p>' +
      '<div class="tablewrap"><table><thead><tr>' + mx.head + '</tr></thead><tbody>' + mx.body + '</tbody></table></div></div>';
  }
  /* Team leader: today's route plans - approve, reject, or assign one. */
  function routePlansPanel(rp, dr) {
    if (!rp) return '';
    var body = (rp.rows || []).map(function (r) {
      var pill = r.status === 'APPROVED' ? '<span class="pill ok">APPROVED</span>'
        : r.status === 'ASSIGNED' ? '<span class="pill fire">ASSIGNED' + (r.by_leader ? ' &middot; ' + esc(r.by_leader) : '') + '</span>'
        : r.status === 'REJECTED' ? '<span class="pill bad">REJECTED</span>'
        : '<span class="pill gold">PENDING</span>';
      var act = r.status === 'PENDING'
        ? '<button class="btn mini" data-action="routeOk" data-id="' + r.id + '">' + t('Approve') + '</button> ' +
          '<button class="danger mini" data-action="routeNo" data-id="' + r.id + '">' + t('Reject') + '</button>'
        : '';
      return '<tr><td class="note">' + esc(r.date) + '</td><td>' + esc(r.bdo) + '</td><td>' + esc(r.plan) + '</td>' +
        '<td>' + pill + '</td><td>' + act + '</td></tr>';
    }).join('') || '<tr><td colspan="5" class="note">' + t('No route plans yet.') + '</td></tr>';
    return '<div class="panel"><h2>' + svg('pin') + t('Daily route plans (EAT)') + '</h2>' +
      '<p class="note">' + t('BDOs submit before 10:00 EAT. Approve or reject; assign a route yourself when needed.') + '</p>' +
      '<div class="tablewrap"><table><thead><tr><th>' + t('Date') + '</th><th>BDO</th><th>' + t('Route') + '</th>' +
      '<th>' + t('Status') + '</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="row" style="margin-top:10px"><div class="field"><label>' + t('Assign to') + '</label><select id="raBdo">' +
      ((dr && dr.bdos) || []).map(function (b) { return '<option value="' + esc(b.username) + '">' + esc(b.name) + '</option>'; }).join('') +
      '</select></div><div class="field" style="flex:1;min-width:200px"><label>' + t('Route for today') + '</label>' +
      '<input id="raPlan" maxlength="2000" placeholder="e.g. Kaloleni -> Sakina -> Njiro"></div>' +
      '<button class="btn" data-action="routeAssign">' + t('Assign route') + '</button></div></div>';
  }
  /* Float shortages. PENDING waits for the team leader; only APPROVED ones
   * reach top management (the server already filters per role). */
  function shortagesPanel(sh) {
    if (sh === null) return '';
    var canApprove = can('reports', 'e');
    var body = (sh || []).map(function (x) {
      var stPill = x.status === 'APPROVED'
        ? '<span class="pill ok">APPROVED' + (x.approved_by ? ' &middot; ' + esc(x.approved_by) : '') + '</span>'
        : '<span class="pill gold">PENDING</span>';
      var act = canApprove
        ? '<td>' + (x.status === 'PENDING' ? '<button class="btn mini" data-action="shortApprove" data-id="' + x.id + '">' + t('Approve') + '</button>' : '') + '</td>'
        : '';
      return '<tr><td>' + esc(x.bdo) + '</td><td>' + fmt(x.amount) + '</td><td>' + esc(x.reason) + '</td>' +
        '<td>' + esc(x.recover_by || '-') + '</td><td>' + stPill + '</td>' +
        '<td class="note">' + esc((x.at || '').slice(0, 16)) + '</td>' + act + '</tr>';
    }).join('') || '<tr><td colspan="7" class="note">' + t('No shortages reported.') + '</td></tr>';
    return '<div class="panel"><h2>' + svg('alert') + t('Float shortages') + '</h2>' +
      (canApprove ? '<p class="note">' + t('PENDING shortages wait for YOUR approval before top management sees them.') + '</p>' : '') +
      '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>' + t('Amount') + '</th><th>' + t('Reason') + '</th>' +
      '<th>' + t('Recover by') + '</th><th>' + t('Status') + '</th><th>' + t('When') + '</th>' + (canApprove ? '<th></th>' : '') +
      '</tr></thead><tbody>' + body + '</tbody></table></div></div>';
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
  /* "When?" on a flag means the moment the BDO tapped the KPI in the field
   * (kpi_at), not the moment the upload raised the flag. Matched rows already
   * carry the tap time in .at. */
  function kpiWhen(r) { return String(r.kpi_at || r.at || '').slice(0, 16); }

  /* ---------------- REAL PERFORMANCE (OM): file + field, counted once --------
   * The plain dashboard answers "what did the office file say". This one
   * answers "what did we actually do" by adding the BDOs' live field work to
   * the file WITHOUT counting anything twice - the ledger's UNIQUE(month,
   * agent, kpi) key makes the two columns disjoint by construction, so their
   * sum is the honest combined figure rather than an estimate. */
  /* SECTION TWO OF THE DASHBOARD: the same month and the same station as the
   * section above it, counted the other way.
   *
   * These two are NOT one number and must never be blended into one. Section
   * one is the uploaded performance file - the auditable office result, the
   * figure the commission is settled on. Section two adds the field work the
   * file does not yet contain. Same page, because the OM was opening two tabs
   * to hold one thought; two labelled sections, because which number came from
   * where is the whole point of having both. */
  function combinedSection(d) {
    {
      state._combined = d;
      var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Activeness' };

      /* A negative KPI gets an EMPTY red track, never a filled one - a negative
       * width is invalid CSS and the browser paints it full, which read as
       * "target smashed" when the truth was the opposite. */
      function bar(pct) {
        if (pct != null && pct < 0) return '<div class="bar neg"></div>';
        var p = Math.max(0, Math.min(100, pct == null ? 0 : pct));
        return '<div class="bar"><i style="display:block;height:100%;width:' + p + '%;background:var(--grad)"></i></div>';
      }
      /* label per office KPI column, taken from the same catalogue the Targets
       * screen uses so the two always read the same */
      var LBL = {};
      OFFICE_DEFS.forEach(function (def) { LBL[def.key] = def.label; });
      var kpiRows = (d.rows || []).map(function (r) {
        var neg = r.pct != null && r.pct < 0;
        return '<tr><td><b>' + esc(t(LBL[r.key] || r.key)) + '</b>' +
          /* activeness carries its own arithmetic - show it, so a negative
             month is explained rather than merely reported */
          (r.lost ? '<div class="note">' + fmt(r.file + r.live) + ' ' + t('waked') + ' &minus; ' +
                    fmt(r.lost) + ' ' + t('slept') + '</div>' : '') + '</td>' +
          '<td>' + (r.weight ? '<span class="pill gold">' + r.weight + '%</span>' : '<span class="note">-</span>') + '</td>' +
          '<td>' + fmt(r.file) + '</td>' +
          '<td>' + (r.live ? '<span class="pill ok">+' + fmt(r.live) + '</span>' : '<span class="note">0</span>') +
            (r.lost ? ' <span class="pill bad">&minus;' + fmt(r.lost) + '</span>' : '') + '</td>' +
          '<td><b' + (r.total < 0 ? ' style="color:var(--bad)"' : '') + '>' + fmt(r.total) + '</b></td>' +
          '<td>' + (r.target ? fmt(r.target) : '<span class="note">-</span>') + '</td>' +
          '<td style="min-width:150px">' + bar(r.pct) +
            '<span class="note' + (neg ? ' tg-pct bad' : '') + '">' + (r.pct == null ? t('no target') : r.pct + '%') +
            (neg ? ' <span class="pill bad">' + t('GOING BACKWARDS') + '</span>' : '') +
            (!neg && r.filePct != null && r.pct != null && r.pct > r.filePct ? ' &middot; ' + t('file alone') + ' ' + r.filePct + '%' : '') +
            '</span></td></tr>';
      }).join('');

      var bdoRows = (d.byBdo || []).map(function (b) {
        return '<tr><td><b>' + esc(b.name) + '</b></td>' +
          '<td>' + fmt(b.served) + '</td><td>' + fmt(b.visit) + '</td><td>' + fmt(b.apk) + '</td><td>' + fmt(b.active) + '</td>' +
          '<td>' + fmt(b.file) + '</td>' +
          '<td>' + (b.live ? '<span class="pill ok">+' + fmt(b.live) + '</span>' : '<span class="note">0</span>') + '</td>' +
          '<td><b>' + fmt(b.total) + '</b></td></tr>';
      }).join('') || '<tr><td colspan="8" class="note">' + t('Nothing credited this month yet.') + '</td></tr>';

      var rt = d.recruitTotals || { pipeline: 0, became: 0, bank: 0, total: 0 };
      var recRows = (d.recruits || []).map(function (r) {
        return '<tr><td><b>' + esc(r.name) + '</b></td>' +
          '<td>' + fmt(r.pipeline) + '</td><td>' + fmt(r.became) + '</td>' +
          '<td>' + (r.bank ? '<span class="pill gold">' + fmt(r.bank) + '</span>' : '<span class="note">0</span>') + '</td>' +
          '<td><b>' + fmt(r.total) + '</b></td>' +
          '<td class="note">' + esc(r.note || '') + '</td></tr>';
      }).join('') || '<tr><td colspan="6" class="note">' + t('No recruitment recorded this month yet.') + '</td></tr>';

      var bdoOpts = (d.bdos || []).map(function (b) {
        return '<option value="' + esc(b.username) + '">' + esc(b.name) + '</option>';
      }).join('');

      return '<h2 class="sec-head">' + svg('percent') + ' ' + t('SECTION 2 - THE FILE PLUS THE FIELD') + '</h2>' +
        '<p class="page-sub">' + t('The uploaded file PLUS the work your BDOs did in the field, added together and counted once.') + '</p>' +

        '<div class="panel"><div class="row" style="align-items:center;flex-wrap:wrap;gap:8px">' +
        '<span class="note" style="flex:1 1 220px;min-width:180px">' + t('Same month and station as the section above.') + '</span>' +
        '<button class="ghost" data-action="cbDownload">' + svg('download') + ' ' + t('Download Excel') + '</button>' +
        '</div>' +
        '<p class="note" style="margin-top:8px">' + svg('check') + ' ' +
        t('No double counting: an agent can hold only ONE credit per KPI per month, so a KPI already in the file is never added again when a BDO also ticked it. "From field" is only the work the file does not contain.') +
        (d.targetsFrom === 'office-fallback' ? ' <span class="pill gold">' + t('using office-wide targets') + '</span>' : '') + '</p></div>' +

        /* THE HEADLINE: one weighted score for this station, built from the
         * combined figures, beside the file-only score the dashboard shows. */
        '<div class="grid cards" style="margin-bottom:16px">' +
        card('percent', (d.weighted ? t('Weighted achievement') : t('Achievement (plain average)')) +
             (d.station ? ' - ' + d.station : ''),
             d.achievement == null ? '-' : d.achievement + '%',
             d.weighted ? t('weights total') + ' ' + d.weightTotal + '%' : t('no weights set - set them in Monthly Targets')) +
        card('upload', t('Office score'), d.officeAchievement == null ? '-' : d.officeAchievement + '%',
             d.fromUpload ? t('from the uploaded file - the dashboard number')
                          : t('no file uploaded yet - the dashboard falls back to live marks')) +
        card('zap', t('Difference'),
             (d.achievement == null || d.officeAchievement == null) ? '-'
               : (d.achievement >= d.officeAchievement ? '+' : '') + (d.achievement - d.officeAchievement) + '%',
             t('what counting the field work changes')) +
        '</div>' +

        '<div class="panel"><h2>' + svg('percent') + t('Combined against target') +
        (d.station ? ' <span class="pill fire">' + esc(d.station) + '</span>' : '') +
        (d.weighted ? ' <span class="pill gold">' + t('weighted') + '</span>' : '') + '</h2>' +
        '<p class="note">' + t('Every KPI that carries a weight, and how each one feeds the score above.') + ' ' +
        t('Activeness is a NET: agents waked minus agents that fell asleep this month. A negative month scores negative and pulls the weighted average down.') + '</p>' +
        '<div class="tablewrap"><table><thead><tr><th>KPI</th><th>' + t('Weight') + '</th><th>' + t('From file') + '</th><th>' + t('From field') + '</th>' +
        '<th>' + t('Combined') + '</th><th>' + t('Target') + '</th><th>' + t('Attainment') + '</th></tr></thead><tbody>' +
        kpiRows +
        '<tr><td><b>' + t('WEIGHTED AVERAGE') + '</b></td>' +
        '<td><b>' + (d.weightTotal || 0) + '%</b></td><td></td><td></td><td></td><td></td>' +
        '<td><b' + (d.achievement != null && d.achievement < 0 ? ' style="color:var(--bad)"' : '') + '>' +
        (d.achievement == null ? '-' : d.achievement + '%') + '</b></td></tr>' +
        '</tbody></table></div></div>' +

        /* HOW FAR THROUGH HIS OWN ROUND each BDO is. "He served 40" means
         * nothing alone: 40 of 45 is a month nearly finished, 40 of 400 is
         * barely started. */
        '<div class="panel"><h2>' + svg('check') + t('Base coverage - how much of his own round each BDO has served') + '</h2>' +
        '<p class="note">' + t('His round is the agents carried from last month plus anyone added to him this month. Served counts the ones he has actually done.') + '</p>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>' + t('His round') + '</th><th>' + t('Served') + '</th>' +
        '<th>' + t('Still to serve') + '</th><th>' + t('Covered') + '</th></tr></thead><tbody>' +
        ((d.coverage || []).map(function (c) {
          var p = c.pct == null ? 0 : c.pct;
          var cls = p >= 80 ? 'ok' : (p >= 50 ? 'gold' : 'bad');
          return '<tr><td><b>' + esc(c.name) + '</b></td>' +
            '<td>' + fmt(c.base) + '</td><td><b>' + fmt(c.served) + '</b></td>' +
            '<td>' + (c.left ? '<span class="pill ' + (c.left > c.served ? 'bad' : 'dim') + '">' + fmt(c.left) + '</span>' : '<span class="pill ok">0</span>') + '</td>' +
            '<td style="min-width:130px"><div class="cov"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>' +
            '<span class="pill ' + cls + '">' + (c.pct == null ? '-' : p + '%') + '</span></td></tr>';
        }).join('') || '<tr><td colspan="5" class="note">' + t('No BDO has a round for this month yet.') + '</td></tr>') +
        '</tbody></table></div></div>' +

        '<div class="panel"><h2>' + svg('users') + t('Per BDO - what each one really produced') + '</h2>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Served</th><th>Visit</th><th>APK</th><th>Activeness</th>' +
        '<th>' + t('From file') + '</th><th>' + t('From field') + '</th><th>' + t('Combined') + '</th></tr></thead><tbody>' +
        bdoRows + '</tbody></table></div></div>' +

        '<div class="panel"><h2>' + svg('check') + t('Recruitment - the real monthly picture') + '</h2>' +
        '<p class="note">' + t('The app only sees the forms your BDOs opened in it. Type the files that reached the bank outside the app so the month reads true.') + '</p>' +
        '<div class="row" style="margin-bottom:10px">' +
        '<div class="field"><label>BDO</label><select id="brBdo">' + bdoOpts + '</select></div>' +
        '<div class="field"><label>' + t('Submitted to bank') + '</label><input id="brN" type="number" min="0" style="width:130px" placeholder="0"></div>' +
        '<div class="field" style="flex:1;min-width:170px"><label>' + t('Note') + ' (' + t('optional') + ')</label><input id="brNote" maxlength="255" placeholder="' + esc(t('e.g. 6 files handed over at the branch on the 12th')) + '"></div>' +
        '<button class="btn" data-action="brSave">' + t('Save') + '</button></div>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>' + t('Forms in app') + '</th><th>' + t('Became agents') + '</th>' +
        '<th>' + t('Submitted to bank') + '</th><th>' + t('Total') + '</th><th>' + t('Note') + '</th></tr></thead><tbody>' +
        recRows +
        '<tr><td><b>' + t('TOTAL') + '</b></td><td><b>' + fmt(rt.pipeline) + '</b></td><td><b>' + fmt(rt.became) + '</b></td>' +
        '<td><b>' + fmt(rt.bank) + '</b></td><td><b>' + fmt(rt.total) + '</b></td><td></td></tr>' +
        '</tbody></table></div></div>';
    }
  }
  function brSave() {
    api('bank_recruits_save', { body: {
      month: elById('dashMonth') ? elById('dashMonth').value : (state.month || state.openMonth), bdo: elById('brBdo').value,
      submitted: elById('brN').value, note: elById('brNote').value
    } }).then(function () { toast(t('Saved'), 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  function cbDownload() {
    var d = state._combined;
    if (!d) { toast(t('Load a month first'), 'warn'); return; }
    var LBL = {};
    OFFICE_DEFS.forEach(function (def) { LBL[def.key] = def.label; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((d.rows || []).map(function (r) {
      return { 'KPI': LBL[r.key] || r.key, 'Weight %': r.weight, 'From file': r.file, 'From field': r.live,
               'Slept (subtracted)': r.lost || 0,
               'Combined': r.total, 'Target': r.target, 'Attainment %': r.pct == null ? '' : r.pct,
               'File alone %': r.filePct == null ? '' : r.filePct };
    }).concat([
      { 'KPI': 'WEIGHTED AVERAGE (file + field)', 'Weight %': d.weightTotal, 'From file': '', 'From field': '',
        'Slept (subtracted)': '', 'Combined': '', 'Target': '',
        'Attainment %': d.achievement == null ? '' : d.achievement, 'File alone %': '' },
      { 'KPI': 'OFFICE SCORE (what the dashboard shows)', 'Weight %': '', 'From file': '', 'From field': '',
        'Slept (subtracted)': '', 'Combined': '', 'Target': '',
        'Attainment %': d.officeAchievement == null ? '' : d.officeAchievement, 'File alone %': '' }
    ])), 'Combined');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((d.byBdo || []).map(function (b) {
      return { 'BDO': b.name, 'Served': b.served, 'Visit': b.visit, 'APK': b.apk, 'Activeness': b.active,
               'From file': b.file, 'From field': b.live, 'Combined': b.total };
    })), 'Per BDO');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((d.coverage || []).map(function (c) {
      return { 'BDO': c.name, 'His round': c.base, 'Served': c.served,
               'Still to serve': c.left, 'Covered %': c.pct == null ? '' : c.pct };
    })), 'Base coverage');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((d.recruits || []).map(function (r) {
      return { 'BDO': r.name, 'Forms in app': r.pipeline, 'Became agents': r.became,
               'Submitted to bank': r.bank, 'Total': r.total, 'Note': r.note };
    })), 'Recruitment');
    XLSX.writeFile(wb, 'real_performance_' + (d.month || '') + (d.station ? '_' + d.station : '') + '.xlsx');
    toast(t('Downloaded'), 'ok');
  }

  /* ---------------- BDOs: the officer window (OM) ----------------
   *
   * Everything the OM used to hunt for across Real Performance, Reports and the
   * Upload tab, on one screen: who has how big a round, how much of it he has
   * covered, what he is scoring - and how many of the HIGH EARNERS in his round
   * are still untouched. Sorted by untouched earners, so the officer the OM
   * needs to speak to today is at the top.
   */
  function viewBdos(v) {
    var m = state._bdMonth || state.openMonth || curMonth();
    state._bdMonth = m;
    if (state._bdOpen) return bdoDetail(v, state._bdOpen, m);
    /* Reports & Ranks was this same screen seen from the other side: the
     * leaderboard, who sent his daily report, whose route needs approving,
     * who is short of float. All of it is about these officers, so all of it
     * is here, under the list of them. */
    var isMgmt = can('reports', 'e') || can('targets', 'v');
    Promise.all([
      api('bdos', { qs: '&month=' + m }),
      api('daily_reports_get', { qs: '&month=' + m }),
      api('bdo_rank_public'),
      isMgmt ? api('shortages_get', { qs: '&month=' + m }) : Promise.resolve(null),
      can('reports', 'e') ? api('route_plans_get') : Promise.resolve(null)
    ]).then(function (rr) {
      var d = rr[0], dr = rr[1], wrk = rr[2], sh = rr[3], rp = rr[4];
      state._bdos = d;
      state._bdDaily = dr;
      var rows = d.rows || [];
      var T = d.totals || {};

      var body = rows.map(function (r) {
        var cov = r.coverage == null ? 0 : r.coverage;
        var covCls = r.coverage == null ? '' : (cov < 50 ? ' red' : cov >= 80 ? ' green' : '');
        /* the untouched-earner cell is the point of the screen: red while there
         * is money left in his round, green only when there is none */
        var leftPill = !d.hasHighEarners
          ? '<span class="note">' + t('no list uploaded') + '</span>'
          : r.heLeft > 0
            ? '<span class="pill bad">' + fmt(r.heLeft) + ' ' + t('left') + '</span>' +
              bandsLeftHtml(r.bandsLeft)
            : (r.he > 0 ? '<span class="pill ok">' + t('all served') + '</span>'
                        : '<span class="note">' + t('none in his round') + '</span>');
        return '<tr class="clickrow" data-action="bdOpen" data-bdo="' + esc(r.bdo) + '">' +
          '<td><b>' + esc(r.name) + '</b>' +
            (r.specialty === 'activeness' ? ' <span class="pill gold">' + t('activeness') + '</span>' : '') +
            '<div class="note">' + esc(r.bdo) + '</div></td>' +
          '<td><b>' + fmt(r.base) + '</b></td>' +
          '<td><div class="row" style="align-items:center;gap:6px">' +
            '<div class="bar" style="flex:1;min-width:60px"><i class="' + covCls + '" style="width:' + Math.max(0, Math.min(100, cov)) + '%"></i></div>' +
            '<span class="tg-pct">' + (r.coverage == null ? '-' : cov + '%') + '</span></div>' +
            '<div class="note">' + fmt(r.served) + ' ' + t('served') + ' · ' + fmt(r.left) + ' ' + t('to go') + '</div></td>' +
          '<td>' + fmt(r.heServed) + ' / ' + fmt(r.he) + '</td>' +
          '<td>' + leftPill + '</td>' +
          '<td>' + (r.hasTargets ? flagPill(r.flag, r.score) : '<span class="pill dim">' + t('no targets') + '</span>') + '</td>' +
          '<td>' + (r.flags ? '<span class="pill bad">' + fmt(r.flags) + '</span>' : '<span class="note">-</span>') + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="7" class="note">' + t('No officers with a round this month.') + '</td></tr>';

      v.innerHTML =
        greetingLine() +
        '<h1 class="page-title">' + t('BDOs') + '</h1>' +
        '<p class="page-sub">' + t('Every officer\'s round, how far through it he is, and the high earners he has not reached yet. Tap a name to open him.') + '</p>' +
        '<div class="panel"><div class="row">' +
        '<div class="field"><label>' + t('Month') + '</label><input id="bdMonth" type="month" value="' + esc(m) + '"></div>' +
        '<button class="btn" data-action="bdLoad">' + t('Load') + '</button>' +
        '<div class="spacer"></div>' +
        '<button class="ghost" data-action="bdDownload">' + svg('download') + ' ' + t('Download Excel') + '</button>' +
        '<button class="ghost" data-action="heXlsAll">' + svg('flame') + ' ' + t('High earners - Excel') + '</button>' +
        '<button class="ghost" data-action="heDocAll">' + svg('flame') + ' ' + t('High earners - Word') + '</button>' +
        '</div></div>' +
        '<div class="grid cards" style="margin-bottom:12px">' +
        card('users', t('Agents in all rounds'), fmt(T.base), fmt(T.served) + ' ' + t('served so far')) +
        card('flame', t('High earners in rounds'), fmt(T.he), fmt(T.heServed) + ' ' + t('served')) +
        card('alert', t('High earners not reached'), fmt(T.heLeft), t('across every officer')) +
        card('alert', t('Flags standing'), fmt(T.flags), t('this month')) +
        '</div>' +
        '<div class="panel"><h2>' + svg('users') + t('Officers') + ' &mdash; ' + esc(m) +
          (d.station ? ' · ' + esc(d.station) : '') + '</h2>' +
        '<p class="note">' + t('Ordered by high earners still untouched - the officer at the top is the one to speak to today.') + '</p>' +
        '<div class="tablewrap"><table><thead><tr><th>' + t('Officer') + '</th><th>' + t('Base') + '</th>' +
        '<th>' + t('Covered') + '</th><th>' + t('High earners served') + '</th><th>' + t('Still untouched') + '</th>' +
        '<th>' + t('Score') + '</th><th>' + t('Flags') + '</th></tr></thead><tbody>' + body + '</tbody></table></div></div>' +
        /* the date-range officer report - it was stranded in the target-setting
         * screen, which is not where anybody looks for a report */
        rangeReportPanel() +
        '<div class="panel"><h2>' + svg('percent') + t('Top performing - weighted score') + '</h2>' +
        weightedBoard(wrk) + '</div>' +
        reportDaysPanel(dr, m) +
        routePlansPanel(rp, dr) +
        shortagesPanel(sh);
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* the untouched earners broken down by list, so "8 left" says WHICH 8 */
  function bandsLeftHtml(bl) {
    if (!bl) return '';
    var out = ['A', 'B', 'C', 'D', 'E'].filter(function (b) { return bl[b] > 0; })
      .map(function (b) { return b + ':' + bl[b]; }).join(' · ');
    return out ? '<div class="note">' + esc(out) + '</div>' : '';
  }

  /* One officer. High earners first - served on one side, still untouched on
   * the other - because that is the question the OM opens him to answer. */
  function bdoDetail(v, bdo, m) {
    api('bdo_detail', { qs: '&month=' + m + '&bdo=' + encodeURIComponent(bdo) }).then(function (d) {
      state._bdDetail = d;
      function heTable(list, served) {
        if (!list.length) {
          return '<div class="note">' + (served ? t('None of his high earners are served yet.')
                                                : t('Nothing left - every high earner in his round is served.')) + '</div>';
        }
        return '<div class="tablewrap"><table><thead><tr><th>' + t('List') + '</th><th>' + t('Agent') + '</th>' +
          '<th>' + t('Branch') + '</th><th>' + t('Location') + '</th>' +
          '<th>' + (served ? t('Served') : t('Status')) + '</th></tr></thead><tbody>' +
          list.map(function (a) {
            return '<tr><td>' + bandPill(a.band) + '</td>' +
              '<td class="c-name">' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div></td>' +
              '<td>' + esc(a.branch || '-') + '</td>' +
              '<td>' + esc(a.location || '-') + '</td>' +
              '<td>' + (served
                ? '<span class="pill ok">' + esc(a.servedAt || t('yes')) + '</span>' +
                  (a.servedBy && a.servedBy !== d.bdo ? '<div class="note">' + t('by') + ' ' + esc(a.servedBy) + '</div>' : '')
                : '<span class="pill bad">' + t('not served') + '</span>' +
                  (a.active === 'INACTIVE' ? ' <span class="pill dim">' + t('inactive') + '</span>' : '')) +
              '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      var cov = d.baseCount > 0 ? Math.round(d.servedCount / d.baseCount * 100) : 0;
      var flagTotal = 0;
      Object.keys(d.flags || {}).forEach(function (k) { flagTotal += d.flags[k]; });

      var baseRows = (d.base || []).map(function (a) {
        return '<tr><td>' + bandPill(a.band) + '</td>' +
          '<td class="c-name">' + esc(a.name) + '<div class="note">' + esc(a.acc) + '</div></td>' +
          '<td>' + esc(a.branch || '-') + '</td>' +
          '<td>' + esc(a.location || '-') + '</td>' +
          '<td>' + (a.served ? '<span class="pill ok">' + t('served') + '</span>'
                             : '<span class="pill dim">' + t('not yet') + '</span>') + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="note">' + t('His round is empty this month.') + '</td></tr>';

      v.innerHTML =
        '<div class="row" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
        '<button class="ghost" data-action="bdBack">&larr; ' + t('All officers') + '</button>' +
        '<div class="spacer"></div>' +
        '<button class="ghost" data-action="heXlsOne" data-bdo="' + esc(d.bdo) + '">' + svg('download') + ' ' + t('His high earners - Excel') + '</button>' +
        '<button class="ghost" data-action="heDocOne" data-bdo="' + esc(d.bdo) + '">' + svg('download') + ' ' + t('His high earners - Word') + '</button>' +
        '</div>' +
        '<h1 class="page-title">' + esc(d.name) + '</h1>' +
        '<p class="page-sub">' + esc(d.month) + ' · ' + esc(d.bdo) +
          (d.specialty === 'activeness' ? ' · ' + t('activeness specialist') : '') + '</p>' +
        '<div class="grid cards" style="margin-bottom:12px">' +
        card('users', t('His round'), fmt(d.baseCount), fmt(d.servedCount) + ' ' + t('served') + ' · ' + cov + '%') +
        card('flame', t('High earners served'), fmt((d.heServed || []).length),
             t('of') + ' ' + fmt((d.heServed || []).length + (d.heLeft || []).length)) +
        card('alert', t('Still untouched'), fmt((d.heLeft || []).length), t('high earners')) +
        card('percent', t('Weighted score'), d.performance ? d.performance.score + '%' : '-',
             d.performance ? '' : t('no targets set')) +
        '</div>' +
        (d.performance
          ? '<div class="panel"><h2>' + svg('percent') + t('His score against target') + ' ' +
            flagPill(d.performance.flag, d.performance.score) + '</h2>' + perfBars(d.performance.kpis) + '</div>'
          : '') +
        /* untouched FIRST: it is the list he has to act on */
        '<div class="panel"><h2>' + svg('alert') + t('High earners NOT served') +
          ' <span class="pill bad">' + fmt((d.heLeft || []).length) + '</span>' +
          listBtn('notserved') + '</h2>' +
        '<p class="note">' + t('The money still sitting in his round. Biggest list first.') + '</p>' +
        heTable(d.heLeft || [], false) + '</div>' +
        '<div class="panel"><h2>' + svg('check') + t('High earners served') +
          ' <span class="pill ok">' + fmt((d.heServed || []).length) + '</span>' +
          listBtn('served') + '</h2>' +
        heTable(d.heServed || [], true) + '</div>' +
        (isManager() && d.rules ? officerRulesPanel(d) : '') +
        (flagTotal
          ? '<div class="panel"><h2>' + svg('alert') + t('Flags against him') +
            ' <span class="pill bad">' + fmt(flagTotal) + '</span></h2>' +
            '<p class="note">' + Object.keys(d.flags).map(function (k) { return k + ': ' + d.flags[k]; }).join(' · ') + '</p>' +
            '<button class="ghost mini" data-action="tab" data-tab="flags">' + t('Open the Flags panel') + '</button></div>'
          : '') +
        '<div class="panel"><h2>' + svg('users') + t('His whole round') +
          ' <span class="pill dim">' + fmt(d.baseCount) + '</span>' +
          listBtn('round') + '</h2>' +
        '<div class="tablewrap tall"><table><thead><tr><th>' + t('List') + '</th><th>' + t('Agent') + '</th>' +
        '<th>' + t('Branch') + '</th><th>' + t('Location') + '</th><th>' + t('Served') + '</th></tr></thead><tbody>' +
        baseRows + '</tbody></table></div></div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* ---------------- one officer's three lists, as Excel ----------------
   *
   * The OM asked for these separately because they are three different jobs:
   * the untouched list is a route to walk, the served list is a month to check,
   * the whole round is the officer's territory. Each is built as a laid-out
   * sheet rather than a raw dump - a title block, a count, then the agents
   * grouped under LIST A, B, C, D, E (and F, "not on the list", for the whole
   * round), alphabetical inside each band, with a band heading and a running
   * number so a printed page can be ticked off door by door.
   */
  /* each list downloads from its own panel heading, so it is obvious which
   * list the file will contain */
  function listBtn(which) {
    return ' <button class="ghost mini" data-action="bdList" data-w="' + which + '">' +
      svg('download') + ' ' + t('Excel') + '</button>';
  }
  var BAND_ORDER = ['A', 'B', 'C', 'D', 'E', 'F'];
  var BAND_TITLE = {
    A: 'LIST A  -  above 2,000,000',
    B: 'LIST B  -  above 1,000,000',
    C: 'LIST C  -  above 500,000',
    D: 'LIST D  -  above 100,000',
    E: 'LIST E  -  above 50,000',
    F: 'NOT ON THE HIGH-EARNER LIST'
  };
  /* LIST A first, then alphabetical by name inside every band */
  function byBandThenName(a, b) {
    var x = BAND_ORDER.indexOf(a.band || 'F'), y = BAND_ORDER.indexOf(b.band || 'F');
    if (x !== y) return x - y;
    return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
  }
  function bdoListXls(which) {
    var d = state._bdDetail;
    if (!d) { toast(t('Open the officer first'), 'warn'); return; }
    var rows, title, note;
    if (which === 'served') {
      rows = (d.heServed || []).slice();
      title = 'HIGH EARNERS SERVED';
      note = 'The high earners in his round he has already served this month.';
    } else if (which === 'notserved') {
      rows = (d.heLeft || []).slice();
      title = 'HIGH EARNERS NOT SERVED';
      note = 'The money still sitting in his round. Work down from LIST A.';
    } else {
      rows = (d.base || []).slice();
      title = 'HIS WHOLE ROUND';
      note = 'Every agent in his round this month, high earners first.';
    }
    rows.sort(byBandThenName);
    if (!rows.length) { toast(t('Nothing to download in that list'), 'warn'); return; }

    var showServed = (which !== 'notserved');
    var head = ['#', 'LIST', 'AGENT NAME', 'ACCOUNT', 'PHONE', 'BRANCH', 'PHYSICAL LOCATION', 'SA STATION'];
    head.push(showServed ? 'SERVED' : 'AGENT STATUS');

    var aoa = [];
    aoa.push(['IMANI SUPERDEALER  -  ' + title]);
    aoa.push([d.name + '   (' + d.bdo + ')']);
    aoa.push([d.month + (d.base && d.base.length && d.base[0].station ? '   ' + d.base[0].station : '') +
              '     generated ' + nowStamp() + ' EAT']);
    aoa.push([note]);
    aoa.push([]);
    aoa.push([rows.length + ' agents   -   ' + bandTally(rows)]);
    aoa.push([]);
    aoa.push(head);

    var seen = {}, num = 0;
    rows.forEach(function (a) {
      var band = a.band || 'F';
      if (!seen[band]) {                       /* a heading before each band */
        seen[band] = true;
        aoa.push([]);
        aoa.push([BAND_TITLE[band] + '   (' + rows.filter(function (x) { return (x.band || 'F') === band; }).length + ')']);
      }
      num++;
      var line = [num, band, a.name || '', a.acc || '', a.phone || '', a.branch || '',
                  a.location || '', a.station || ''];
      line.push(showServed
        ? (a.served === false ? 'NOT SERVED' : (a.servedAt || 'YES'))
        : (a.active || 'unknown'));
      aoa.push(line);
    });

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 5 }, { wch: 7 }, { wch: 30 }, { wch: 18 }, { wch: 15 },
                   { wch: 20 }, { wch: 32 }, { wch: 14 }, { wch: 18 }];
    /* the title block spans the table so it reads as a heading, not a stray cell */
    ws['!merges'] = [0, 1, 2, 3, 5].map(function (r) {
      return { s: { r: r, c: 0 }, e: { r: r, c: head.length - 1 } };
    });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 28));
    XLSX.writeFile(wb, d.bdo + '_' + which.replace('notserved', 'not_served') + '_' + d.month + '.xlsx');
    toast(t('Downloaded'), 'ok');
  }
  function bandTally(rows) {
    return BAND_ORDER.map(function (b) {
      var n = rows.filter(function (x) { return (x.band || 'F') === b; }).length;
      return n ? (b === 'F' ? 'not listed: ' + n : 'LIST ' + b + ': ' + n) : null;
    }).filter(Boolean).join('   ') || '-';
  }
  function nowStamp() {
    var n = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate()) + ' ' + p(n.getHours()) + ':' + p(n.getMinutes());
  }

  /* ---------------- high-earner report: Excel or Word ----------------
   *
   * The OM needs this off the screen and into somebody's hands - a workbook to
   * work through, or a printed document to carry into a meeting with an
   * officer. Word is produced as a self-contained HTML document saved as .doc,
   * which Word opens and formats natively: no library, no server round trip,
   * and it prints the way it looks.
   */
  function heReport(bdo, fmtKind) {
    var m = state._bdMonth || state.openMonth || curMonth();
    var qs = '&month=' + m + (bdo ? '&bdo=' + encodeURIComponent(bdo) : '');
    toast(t('Building the report...'), 'ok');
    api('he_report', { qs: qs }).then(function (d) {
      var offs = d.officers || [];
      if (!offs.length) { toast(t('No high earners in any round for this month.'), 'warn'); return; }
      if (fmtKind === 'word') heReportWord(d); else heReportExcel(d);
    }).catch(function (e) { toast(e.message, 'err'); });
  }
  function heRowsFor(p, servedList) {
    return (servedList ? p.served : p.notServed).map(function (a) {
      var row = { 'LIST': a.band, 'Agent': a.name, 'Account': a.acc, 'Phone': a.phone || '',
                  'Branch': a.branch || '', 'Location': a.location || '', 'SA Station': a.station || '' };
      if (servedList) row['Served at'] = a.servedAt || '';
      else row['Agent status'] = a.active || '';
      return row;
    });
  }
  function heReportExcel(d) {
    var wb = XLSX.utils.book_new();
    /* summary first: who is sitting on the most untouched money */
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((d.officers || []).map(function (p) {
      return { 'Officer': p.name, 'Username': p.bdo, 'High earners in round': p.total,
               'Served': p.servedCount, 'NOT served': p.leftCount,
               'Covered %': p.total ? Math.round(p.servedCount / p.total * 100) : '' };
    })), 'Summary');
    /* one sheet per officer: the untouched ones first, then the served */
    var used = {};
    (d.officers || []).forEach(function (p) {
      var rows = [];
      heRowsFor(p, false).forEach(function (r) { r['Status'] = 'NOT SERVED'; rows.push(r); });
      heRowsFor(p, true).forEach(function (r) { r['Status'] = 'SERVED'; rows.push(r); });
      if (!rows.length) rows = [{ 'LIST': '', 'Agent': 'No high earners in this round' }];
      /* Excel sheet names: 31 chars, no []:*?/\ - and never the same name twice */
      var nm = String(p.name || p.bdo).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 28) || 'BDO';
      var i = 2; var base = nm;
      while (used[nm.toLowerCase()]) nm = base.slice(0, 26) + ' ' + (i++);
      used[nm.toLowerCase()] = true;
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), nm);
    });
    XLSX.writeFile(wb, 'high_earners_' + (d.bdo ? d.bdo + '_' : 'team_') + d.month +
                       (d.station ? '_' + d.station : '') + '.xlsx');
    toast(t('Downloaded'), 'ok');
  }
  function heReportWord(d) {
    function tbl(list, served) {
      if (!list.length) {
        return '<p class="none">' + (served ? 'None served yet.' : 'Nothing left - every high earner here is served.') + '</p>';
      }
      return '<table><thead><tr><th>LIST</th><th>Agent</th><th>Account</th><th>Phone</th>' +
        '<th>Branch</th><th>Location</th><th>' + (served ? 'Served at' : 'Status') + '</th></tr></thead><tbody>' +
        list.map(function (a) {
          return '<tr><td class="band">' + esc(a.band) + '</td><td><b>' + esc(a.name) + '</b></td>' +
            '<td>' + esc(a.acc) + '</td><td>' + esc(a.phone || '-') + '</td>' +
            '<td>' + esc(a.branch || '-') + '</td><td>' + esc(a.location || '-') + '</td>' +
            '<td>' + (served ? esc(a.servedAt || 'yes')
                             : '<span class="no">NOT SERVED</span>' + (a.active === 'INACTIVE' ? ' (inactive)' : '')) +
            '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    var title = d.bdo ? ('High earners - ' + ((d.officers[0] && d.officers[0].name) || d.bdo))
                      : 'High earners - whole team';
    var body = (d.officers || []).map(function (p) {
      var cov = p.total ? Math.round(p.servedCount / p.total * 100) : 0;
      return '<h2>' + esc(p.name) + '</h2>' +
        '<p class="meta"><b>' + p.total + '</b> high earners in his round &nbsp;&middot;&nbsp; ' +
        '<b>' + p.servedCount + '</b> served &nbsp;&middot;&nbsp; ' +
        '<b class="no">' + p.leftCount + '</b> still untouched &nbsp;&middot;&nbsp; ' + cov + '% covered</p>' +
        '<h3>Still untouched &mdash; the money left in this round</h3>' + tbl(p.notServed, false) +
        '<h3>Already served</h3>' + tbl(p.served, true);
    }).join('<div class="brk"></div>');

    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + esc(title) + '</title>' +
      '<style>' +
      '@page { size: A4 landscape; margin: 1.6cm; }' +
      'body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; color: #222; }' +
      'h1 { font-size: 18pt; margin: 0 0 2pt; color: #b34700; }' +
      '.sub { color: #666; font-size: 9.5pt; margin: 0 0 14pt; }' +
      'h2 { font-size: 13pt; margin: 16pt 0 2pt; color: #b34700; border-bottom: 1.5pt solid #b34700; padding-bottom: 3pt; }' +
      'h3 { font-size: 10.5pt; margin: 10pt 0 4pt; color: #444; text-transform: uppercase; letter-spacing: .5pt; }' +
      '.meta { margin: 4pt 0 8pt; font-size: 10pt; }' +
      'table { border-collapse: collapse; width: 100%; margin-bottom: 8pt; }' +
      'th { background: #f2e6dc; border: .5pt solid #c8b8ac; padding: 4pt 5pt; text-align: left; font-size: 9pt; text-transform: uppercase; }' +
      'td { border: .5pt solid #d8ccc2; padding: 4pt 5pt; font-size: 9.5pt; }' +
      '.band { font-weight: bold; text-align: center; background: #faf3ee; }' +
      '.no { color: #b3001b; font-weight: bold; }' +
      '.none { color: #666; font-style: italic; }' +
      '.brk { page-break-after: always; }' +
      '.tot { margin-top: 12pt; padding-top: 6pt; border-top: 1pt solid #999; font-size: 10pt; }' +
      '</style></head><body>' +
      '<h1>IMANI SUPERDEALER &mdash; ' + esc(title) + '</h1>' +
      '<p class="sub">' + esc(d.month) + (d.station ? ' &middot; ' + esc(d.station) : ' &middot; all stations') +
      ' &middot; generated ' + esc(d.generatedAt) + ' EAT</p>' +
      '<p class="tot"><b>' + d.totals.total + '</b> high earners across these rounds &middot; ' +
      '<b>' + d.totals.served + '</b> served &middot; <b class="no">' + d.totals.left + '</b> still untouched.</p>' +
      body + '</body></html>';

    var blob = new Blob(['﻿', html], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'high_earners_' + (d.bdo ? d.bdo + '_' : 'team_') + d.month +
                 (d.station ? '_' + d.station : '') + '.doc';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast(t('Downloaded'), 'ok');
  }

  /* HOW MUCH PROOF THIS ONE OFFICER OWES.
   * The office rule is the default and most officers stay on it; this is for
   * the man the OM wants to hold to a stricter standard - or release from one -
   * without changing what the whole team has to do. */
  function officerRulesPanel(d) {
    var R = d.rules;
    function pick(id, cur, office, opts) {
      return '<select id="' + id + '"><option value=""' + (cur === '' ? ' selected' : '') + '>' +
        t('Follow the office rule') + ' (' + t(opts[office] || office) + ')</option>' +
        Object.keys(opts).map(function (k) {
          return '<option value="' + k + '"' + (cur === k ? ' selected' : '') + '>' + t(opts[k]) + '</option>';
        }).join('') + '</select>';
    }
    var overridden = R.serveReceipt !== '' || R.wakeReceipt !== '';
    return '<div class="panel"><h2>' + svg('camera') + t('Proof rules for this officer') +
      (overridden ? ' <span class="pill fire">' + t('own rule') + '</span>'
                  : ' <span class="pill dim">' + t('office rule') + '</span>') + '</h2>' +
      '<p class="note">' + t('Set the standard on the man, not on the whole team. Leave both on "follow the office rule" and he changes whenever the office setting changes.') + '</p>' +
      '<div class="row" style="flex-wrap:wrap;gap:10px">' +
      '<div class="field"><label>' + t('Serving receipt photo') + '</label>' +
      pick('orServe', R.serveReceipt, R.officeServe,
           { required: 'Compulsory - no serve without a photo', optional: 'Optional' }) + '</div>' +
      '<div class="field"><label>' + t('Waking proof') + '</label>' +
      pick('orWake', R.wakeReceipt, R.officeWake,
           { photo: 'Photo only - a typed note is not accepted', photo_or_note: 'Photo OR a typed commitment' }) + '</div>' +
      '<button class="btn" data-action="orSave" data-bdo="' + esc(d.bdo) + '">' + t('Save his rules') + '</button>' +
      '</div></div>';
  }
  function officerRulesSave(bdo) {
    api('bdo_rules_save', { body: { bdo: bdo,
        serveReceipt: elById('orServe').value, wakeReceipt: elById('orWake').value } })
      .then(function (r) {
        toast(t('Saved') + ' - ' + t('serving') + ': ' + r.effectiveServe + ', ' + t('waking') + ': ' + r.effectiveWake, 'ok');
        renderTab();
      })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  /* Officer workbook: the summary, then one sheet holding every untouched high
   * earner across the whole team - the call list the OM actually works from. */
  function bdosDownload() {
    var d = state._bdos;
    if (!d) { toast(t('Load a month first'), 'warn'); return; }
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((d.rows || []).map(function (r) {
      return { 'Officer': r.name, 'Username': r.bdo, 'Base': r.base, 'Served': r.served,
               'Still to serve': r.left, 'Covered %': r.coverage == null ? '' : r.coverage,
               'High earners': r.he, 'HE served': r.heServed, 'HE untouched': r.heLeft,
               'A left': r.bandsLeft.A, 'B left': r.bandsLeft.B, 'C left': r.bandsLeft.C,
               'D left': r.bandsLeft.D, 'E left': r.bandsLeft.E,
               'Weighted score': r.score == null ? '' : r.score, 'Flags': r.flags };
    })), 'Officers');
    XLSX.writeFile(wb, 'bdo_window_' + (d.month || '') + (d.station ? '_' + d.station : '') + '.xlsx');
    toast(t('Downloaded'), 'ok');
  }

  /* ---------------- Flags (OM / management): all KPI, all BDO, live search ----- */
  function viewFlags(v) {
    var m = state._flagsMonth || state.openMonth || curMonth();
    state._flagsMonth = m;
    api('flags_get', { qs: '&month=' + m }).then(function (d) {
      state._flags = d;
      var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Active' };
      /* per-BDO x per-KPI grid: matched (both agree) vs flagged (mismatch) */
      /* only management may forgive - the server enforces it too */
      var canClear = isManager();
      var gridRows = (d.grid || []).map(function (g) {
        function cell(k) { return '<td><span class="pill ok">' + g[k].m + '</span> <span class="pill bad">' + g[k].f + '</span></td>'; }
        return '<tr><td><b>' + esc(g.bdo) + '</b></td>' +
          cell('served') + cell('visit') + cell('apk') + cell('active') +
          '<td><b>' + g.matched + '</b></td><td><b>' + g.flagged + '</b></td>' +
          (canClear ? '<td>' + (g.flagged
            ? '<button class="ghost sm" data-action="flClearOne" data-bdo="' + esc(g.bdo) + '">' + t('Clear his flags') + '</button>'
            : '<span class="note">&mdash;</span>') + '</td>' : '') +
          '</tr>';
      }).join('') || '<tr><td colspan="8" class="note">' + t('No live BDO marks in this month yet.') + '</td></tr>';

      function detailRow(r, isFlag) {
        return '<tr class="fl-row" data-bdo="' + esc(r.bdo).toLowerCase() + '" data-kpi="' + esc(r.kpi || '') + '" data-search="' +
          esc((r.bdo + ' ' + (r.agent_name || '') + ' ' + (r.acc || '') + ' ' + (r.branch || '') + ' ' + (r.station || '')).toLowerCase()) + '">' +
          '<td><span class="pill ' + (isFlag ? 'bad' : 'ok') + '">' + (isFlag ? t('MISMATCH') : t('MATCHED')) + '</span></td>' +
          '<td>' + esc(r.bdo) + '</td><td>' + esc(KL[r.kpi] || r.kpi) + '</td>' +
          '<td class="c-name">' + esc(r.agent_name || '') + '<div class="note">' + esc(r.acc || '') + '</div></td>' +
          '<td>' + esc(r.branch || '-') + '</td><td>' + esc(r.station || '-') + '</td>' +
          '<td class="note">' + esc(r.detail || '') + '</td>' +
          '<td>' + (r.bdo_response === 'CONFIRMED'
              ? '<span class="pill gold">' + t('BDO confirms') + '</span>'
            : r.bdo_response === 'DISPUTED'
              ? '<span class="pill ok">' + t('BDO disputes') + '</span><div class="note">' + esc(r.bdo_note || '') + '</div>'
            : (isFlag ? '<span class="pill dim">' + t('no answer yet') + '</span>' : '')) + '</td>' +
          '<td class="note">' + esc(kpiWhen(r)) +
            (isFlag && r.kpi_at ? '<div class="note dim">' + t('flagged') + ' ' + esc((r.at || '').slice(0, 16)) + '</div>' : '') +
            /* Clearing forgives the flag but never forgets it: a claim that has
             * been let go before says so, so a repeat offender is visible. */
            (isFlag && r.cleared_before ? '<div><span class="pill fire">' + t('forgiven') + ' ' + r.cleared_before + 'x</span></div>' : '') +
          '</td></tr>';
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
        '<button class="btn" data-action="flLoad">' + t('Load') + '</button>' +
        '<button class="ghost" data-action="flDownload">' + svg('download') + ' ' + t('Download Excel - one sheet per BDO') + '</button></div></div>' +
        '<div class="panel"><h2>' + svg('percent') + t('Per BDO x KPI') + ' &mdash; ' + t('matched vs mismatch') + '</h2>' +
        '<p class="note">' + t('Green = matched, red = mismatch. Bigger red = more suspicious claims.') + '</p>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th><th>Served</th><th>Visit</th><th>APK</th><th>Active</th><th>' + t('Matched') + '</th><th>' + t('Flagged') + '</th>' + (canClear ? '<th></th>' : '') + '</tr></thead><tbody>' + gridRows + '</tbody></table></div>' +
        /* One button forgives the whole month. The agents keep the status the
         * BDO gave them; only the accusation goes. The next performance upload
         * raises it again if the file still disagrees - and it can be cleared
         * again, with the count of past pardons showing on the row. */
        (canClear && (d.flags || []).length
          ? '<div class="row" style="margin-top:12px;justify-content:flex-end;align-items:center;gap:10px">' +
            '<span class="note">' + t('Clearing keeps every agent exactly as the BDO marked him. The claim is forgiven, not forgotten - it is recorded and re-raised if the next file still disagrees.') + '</span>' +
            '<button class="danger" data-action="flClearAll">' + svg('check') + ' ' + t('Clear all flags') + ' (' + (d.flags || []).length + ')</button></div>'
          : '') +
        '</div>' +
        '<div class="panel"><h2>' + svg('users') + t('Every claim') + '</h2>' +
        '<div class="row" style="margin-bottom:8px">' +
        '<div class="field" style="flex:1;min-width:180px"><label>' + t('Search') + '</label><input id="flSearch" placeholder="' + esc(t('BDO, agent name, acc, branch, station')) + '"></div>' +
        '<div class="field"><label>' + t('BDO') + '</label><select id="flBdo">' + bdoOpts + '</select></div>' +
        '<div class="field"><label>KPI</label><select id="flKpi"><option value="">' + t('Any') + '</option>' +
        ['served','visit','apk','active'].map(function (k) { return '<option value="' + k + '">' + KL[k] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('Status') + '</label><select id="flStatus"><option value="">' + t('All') + '</option><option value="ok">' + t('Matched') + '</option><option value="bad">' + t('Mismatch') + '</option></select></div>' +
        '<button class="ghost" data-action="flClear">' + t('Clear') + '</button></div>' +
        '<div class="tablewrap tall"><table><thead><tr><th>' + t('Status') + '</th><th>BDO</th><th>KPI</th><th>' + t('Agent') + '</th><th>' + t('Branch') + '</th><th>' + t('Station') + '</th><th>' + t('Detail') + '</th><th>' + t('BDO answer') + '</th><th>' + t('When') + '</th></tr></thead><tbody id="flBody">' + mmRows + okRows + '</tbody></table></div>' +
        '<div class="note" style="margin-top:6px"><b>' + (d.flags || []).length + '</b> ' + t('mismatch') + ' &middot; <b>' + (d.matched || []).length + '</b> ' + t('matched') + ' &middot; <span id="flShown">' + ((d.flags || []).length + (d.matched || []).length) + '</span> ' + t('shown') + '</div>' +
        '</div>';
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }
  /* Forgiving flags. The OM is overruling the file in favour of the BDO's own
   * word, so the agents' statuses are left exactly as the BDO set them. What
   * disappears is only the accusation. */
  function flagsClearAsk(bdo) {
    var d = state._flags || {};
    var n = bdo
      ? (d.flags || []).filter(function (r) { return (r.bdo || '').toLowerCase() === bdo.toLowerCase(); }).length
      : (d.flags || []).length;
    openModal('<h2>' + (bdo ? t('Clear flags for') + ' ' + esc(bdo) : t('Clear every flag')) + '?</h2>' +
      '<p class="note">' + n + ' ' + t('flags in') + ' ' + esc(state._flagsMonth || '') + '.</p>' +
      '<ul class="note" style="margin:10px 0 0 18px;line-height:1.7">' +
      '<li>' + t('Every agent keeps the status the BDO gave him - nothing is reverted.') + '</li>' +
      '<li>' + t('Who cleared it and when is recorded permanently.') + '</li>' +
      '<li>' + t('If the next performance upload still disagrees, the flag comes back - and the row will show how many times it has been forgiven.') + '</li></ul>' +
      '<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
      '<button class="danger" data-action="flClearGo" data-bdo="' + esc(bdo) + '">' + t('Clear them') + '</button></div>');
  }
  function flagsClearGo(bdo) {
    api('flags_clear', { body: { month: state._flagsMonth, bdo: bdo } })
      .then(function (r) { closeModal(); toast(t('Cleared') + ' ' + r.cleared, 'ok'); renderTab(); })
      .catch(function (e) { toast(e.message, 'err'); });
  }
  /* Flags workbook: Summary grid first, then ONE SHEET PER BDO listing every
   * flag he collected across all KPIs (plus his matched claims underneath). */
  function flagsDownload() {
    var d = state._flags;
    if (!d) { toast(t('Load a month first'), 'warn'); return; }
    var KL = { served: 'Served', visit: 'Visit', apk: 'APK', active: 'Activeness' };
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((d.grid || []).map(function (g) {
      return { 'BDO': g.bdo,
               'Served OK': g.served.m, 'Served FLAG': g.served.f,
               'Visit OK': g.visit.m, 'Visit FLAG': g.visit.f,
               'APK OK': g.apk.m, 'APK FLAG': g.apk.f,
               'Active OK': g.active.m, 'Active FLAG': g.active.f,
               'Total matched': g.matched, 'Total flagged': g.flagged };
    })), 'Summary');
    /* group rows per BDO */
    var perBdo = {};
    (d.flags || []).forEach(function (r) { (perBdo[r.bdo] = perBdo[r.bdo] || { f: [], m: [] }).f.push(r); });
    (d.matched || []).forEach(function (r) { (perBdo[r.bdo] = perBdo[r.bdo] || { f: [], m: [] }).m.push(r); });
    var used = { 'summary': true };
    Object.keys(perBdo).sort().forEach(function (b) {
      var rows = perBdo[b].f.map(function (r) {
        return { 'Status': 'FLAG', 'KPI': KL[r.kpi] || r.kpi, 'Agent': r.agent_name || '', 'Acc': r.acc || '',
                 'Branch': r.branch || '', 'SA Station': r.station || '', 'Detail': r.detail || '',
                 'When BDO did the KPI': kpiWhen(r), 'When flagged': (r.at || '').slice(0, 16) };
      }).concat(perBdo[b].m.map(function (r) {
        return { 'Status': 'MATCHED', 'KPI': KL[r.kpi] || r.kpi, 'Agent': r.agent_name || '', 'Acc': r.acc || '',
                 'Branch': r.branch || '', 'SA Station': r.station || '', 'Detail': '',
                 'When BDO did the KPI': kpiWhen(r), 'When flagged': '' };
      }));
      if (!rows.length) return;
      /* sheet names: <=31 chars, no []:*?/\ and unique */
      var name = String(b).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 28) || 'bdo';
      var base = name, i = 2;
      while (used[name.toLowerCase()]) name = base.slice(0, 25) + ' ' + (i++);
      used[name.toLowerCase()] = true;
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
    });
    XLSX.writeFile(wb, 'flags_' + (d.month || '') + '.xlsx');
    toast(t('Flags workbook downloaded - one sheet per BDO'), 'ok');
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

  /* ---------------- Messages (every member's box) ---------------- */
  function viewInbox(v) {
    /* Opening the tab IS reading them - clear the nav badge. Messages no longer
     * appear anywhere else, so this badge is the only nudge he gets. */
    api('messages_seen', { body: {}, silent: true }).then(function () {
      state.unreadMsgs = 0; paintBadges();
    }, function () {});
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
      /* management composes here too, beside what it is answering */
      var send = can('reports', 'e')
        ? '<div class="panel"><h2>' + svg('mail') + t('Messages to members') + '</h2>' +
          '<div class="row"><div class="field"><label>' + t('To') + '</label><select id="msgTo"><option value="">' + t('All members') + '</option></select></div>' +
          '<div class="field" style="flex:1;min-width:220px"><label>' + t('Message') + '</label>' +
          '<input id="msgBody" placeholder="' + esc(t('Type the announcement...')) + '" maxlength="500"></div>' +
          '<button class="btn" data-action="msgSend">' + t('Send') + '</button></div>' +
          '<div id="msgSent" style="margin-top:10px"></div></div>'
        : '';
      v.innerHTML =
        greetingLine() +
        '<h1 class="page-title">' + t('Messages') + '</h1>' +
        '<p class="page-sub">' + t('Newest first. Reply to the sender, or delete a message from your own box once read.') + '</p>' +
        send + fb +
        '<div class="panel"><h2>' + svg('mail') + t('Your box') + '</h2>' + rows + '</div>';
      if (send) msgMgrLoad();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }

  /* ---------------- Data Manager (OM/superadmin) ---------------- */
  function viewData(v) {
    Promise.all([api('uploads_list'), api('members_list'),
                 can('dashboard', 'e') ? api('dashboard') : Promise.resolve(null)]).then(function (rr) {
      var ups = rr[0].rows || [];
      var members = (rr[1] || []).filter(function (m) { return m.username !== state.user.username; });
      var cfg = rr[2];
      var upRows = ups.map(function (u) {
        return '<tr><td>' + esc((u.at || '').slice(0, 16)) + '</td><td>' + esc(u.month) + '</td><td>' + esc(u.week || '-') + '</td>' +
          '<td>' + esc(u.label) + '</td><td>' + esc(u.by_user) + '</td><td>' + fmt(u.rows_count) + '</td>' +
          '<td><button class="ghost mini" data-action="upRename" data-id="' + u.id + '" data-label="' + esc(u.label) + '">Rename</button> ' +
          '<button class="danger mini" data-action="upErase" data-id="' + u.id + '" data-label="' + esc(u.label) + '">Erase</button></td></tr>';
      }).join('') || '<tr><td colspan="7" class="note">No uploads registered yet. New uploads appear here with their date and time.</td></tr>';
      var memChecks = members.map(function (m) {
        return '<label class="kchip todo" style="cursor:pointer"><input type="checkbox" class="mSel" value="' + esc(m.username) + '" style="accent-color:var(--fire2);margin-right:5px">' + esc(m.name) + ' (' + esc(m.username) + ')</label>';
      }).join(' ');
      /* THE RULES OF THE GAME - which KPIs everyone sees, the APK version that
       * counts, and what proof the field must attach. This is configuration, so
       * it lives here with the other management controls instead of crowding
       * the OM's dashboard. (Admin proper is superadmin-only; the OM must be
       * able to reach these, and he does reach Data Manager.)
       * NOTE: the loop variable below is `def`, never `t` - `t` is the
       * translator, and shadowing it blanks the whole page. */
      var visibleKpis = String((cfg && cfg.visibleKpis) || '').split(',');
      var rulesPanel = cfg
        ? '<div class="panel"><h2>' + svg('target') + t('Dashboard & field rules') + '</h2>' +
          '<p class="note" style="margin-bottom:10px">' + t('Ticked KPIs appear on everyone\'s dashboard. APK counts only when an agent reads the required version or newer.') + '</p>' +
          '<div class="row" style="align-items:center">' +
          OFFICE_DEFS.map(function (def) {
            var on = visibleKpis.indexOf(def.key) >= 0;
            return '<label class="tgl' + (on ? ' on' : '') + '" style="cursor:pointer">' +
              '<input type="checkbox" class="kpivis" value="' + def.key + '"' + (on ? ' checked' : '') + ' style="display:none">' + esc(def.label) + '</label>';
          }).join('') +
          '<div class="spacer"></div>' +
          '<div class="field"><label>' + t('Required APK version') + '</label><input id="apkReq" style="width:100px" value="' + esc(cfg.apkRequired) + '"></div>' +
          '<div class="field"><label>' + t('Serving receipt') + '</label><select id="srvRec"><option value="optional"' + (cfg.serveReceipt !== 'required' ? ' selected' : '') + '>' + t('Optional') + '</option><option value="required"' + (cfg.serveReceipt === 'required' ? ' selected' : '') + '>' + t('Compulsory') + '</option></select></div>' +
          '<div class="field"><label>' + t('Waking proof') + '</label><select id="wakeRec"><option value="photo"' + (cfg.wakeReceipt !== 'photo_or_note' ? ' selected' : '') + '>' + t('Photo only') + '</option><option value="photo_or_note"' + (cfg.wakeReceipt === 'photo_or_note' ? ' selected' : '') + '>' + t('Photo or typed note') + '</option></select></div>' +
          '<button class="btn" data-action="dashSettingsSave">' + t('Save') + '</button></div></div>'
        : '';

      v.innerHTML =
        '<h1 class="page-title">' + t('Settings & Data') + '</h1>' +
        '<p class="page-sub">' + t('The rules everyone works by, and every eraser in one place. Performance and all reports recalculate instantly after any erase. Everything here is audit-logged.') + '</p>' +
        rulesPanel +
        '<div id="filingCheck"></div>' +

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
      filingCheckLoad();
    }).catch(function (e) { v.innerHTML = errBox(e); });
  }

  /* WHERE IS EVERY BDO'S WORK FILED? Answers "he served agents but the app says
   * zero" with evidence instead of guesswork: what each officer holds in the
   * open month, what he holds in the months either side, and any row whose own
   * timestamp disagrees with the month it sits in. */
  function filingCheckLoad() {
    var box = elById('filingCheck'); if (!box) return;
    api('filing_check', { silent: true }).then(function (d) {
      var months = {};
      (d.perBdo || []).forEach(function (b) { Object.keys(b.months).forEach(function (m) { months[m] = 1; }); });
      var cols = Object.keys(months).sort();
      var rows = (d.perBdo || []).map(function (b) {
        return '<tr><td><b>' + esc(b.name) + '</b></td>' +
          cols.map(function (m) {
            var n = b.months[m] || 0;
            var here = m === d.month;
            return '<td' + (here ? ' style="font-weight:800"' : '') + '>' +
              (n ? (here ? '<span class="pill ok">' + n + '</span>' : '<span class="pill dim">' + n + '</span>') : '<span class="note">0</span>') + '</td>';
          }).join('') + '</tr>';
      }).join('') || '<tr><td colspan="' + (cols.length + 1) + '" class="note">' + t('No BDO serving credits in the last few months.') + '</td></tr>';

      box.innerHTML =
        '<div class="panel"' + (d.misfiled ? ' style="border-color:var(--bad)"' : '') + '>' +
        '<h2>' + svg('cal') + t('Where each BDO\'s work is filed') +
        (d.misfiled ? ' <span class="pill bad">' + d.misfiled + ' ' + t('in the wrong month') + '</span>'
                    : ' <span class="pill ok">' + t('all correctly filed') + '</span>') + '</h2>' +
        '<p class="note">' + t('Serving credits per BDO per month. The bold column is the open month. A BDO who worked before the month rolled over can have his taps sitting in the previous column - the repair moves them by their own timestamp.') + '</p>' +
        '<div class="tablewrap"><table><thead><tr><th>BDO</th>' +
        cols.map(function (m) { return '<th>' + esc(m) + (m === d.month ? ' &bull;' : '') + '</th>'; }).join('') +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        (d.misfiled
          ? '<div class="tablewrap" style="margin-top:8px"><table><thead><tr><th>BDO</th><th>' + t('Filed under') + '</th><th>' + t('Actually done in') + '</th><th>' + t('Rows') + '</th></tr></thead><tbody>' +
            (d.misfiledBy || []).map(function (r) {
              return '<tr><td>' + esc(r.bdo) + '</td><td><span class="pill bad">' + esc(r.month) + '</span></td>' +
                '<td><span class="pill ok">' + esc(r.real_month) + '</span></td><td><b>' + r.n + '</b></td></tr>';
            }).join('') + '</tbody></table></div>'
          : '') +
        '<div class="row" style="margin-top:10px;align-items:center">' +
        '<button class="btn" data-action="filingRepair">' + svg('rotate') + ' ' + t('Re-file work by its own timestamp') + '</button>' +
        (d.lastRepair ? '<span class="note">' + t('Last run') + ': ' + esc(d.lastRepair) + '</span>' : '') +
        '</div></div>';
    }).catch(function () { box.innerHTML = ''; });
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
  /* Buttons that fire a request show their own spinner until the network
   * settles, so nobody taps twice wondering whether it registered. */
  var NO_SPIN = { tab: 1, closeModal: 1, toggleTheme: 1, themePick: 1, palSet: 1, toggleLang: 1,
                  togglePw: 1, backToLogin: 1, agentClear: 1, flClear: 1, inactMode: 1,
                  baseBand: 1, kpiMark: 1 };
  function spinWhileBusy(node) {
    if (!node || node.tagName !== 'BUTTON' || node.classList.contains('loading')) return;
    var before = netCount;
    setTimeout(function () {
      if (netCount <= before) return;      /* no request started - nothing to show */
      node.classList.add('loading');
      var stop = setInterval(function () {
        if (netCount > before) return;
        clearInterval(stop);
        node.classList.remove('loading');
      }, 120);
      setTimeout(function () { clearInterval(stop); node.classList.remove('loading'); }, 20000);
    }, 0);
  }
  function onClick(e) {
    var node = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!node) return;
    var a = node.getAttribute('data-action');
    if (!NO_SPIN[a]) spinWhileBusy(node);
    if (a === 'tab') {
      var toTab = node.getAttribute('data-tab');
      /* fresh visit to the agent list starts clean - a stale search/filter left
       * in the box after navigating away confused people */
      if (toTab !== state.tab) {
        state._agentSearch = ''; state._agentField = ''; state.agentPage = 1;
        state._fserved = state._fvisit = state._fapk = state._factive = state._fband = '';
      }
      closeModal();   /* harmless if none is open; shuts the More sheet */
      state.tab = toTab; renderShell(); return;
    }
    if (a === 'moreNav') { moreNavSheet(); return; }
    if (a === 'upKind') { state._upKind = node.getAttribute('data-k'); renderTab(); return; }
    if (a === 'upClear') { var ur = elById('upResult'); if (ur) ur.innerHTML = ''; return; }
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
    if (a === 'agentsExport') { agentsExportAll(); return; }
    if (a === 'flagAnswer') {
      var fid = node.getAttribute('data-id'), fr = node.getAttribute('data-r');
      if (fr === 'CONFIRMED') {
        api('flag_respond', { body: { id: Number(fid), response: 'CONFIRMED' } })
          .then(function () { toast(t('Answer sent to the OM'), 'ok'); renderTab(); })
          .catch(function (e2) { toast(e2.message, 'err'); });
        return;
      }
      openModal('<h2>' + svg('alert') + ' ' + t('Why is this flag wrong?') + '</h2>' +
        '<p class="note">' + esc(node.getAttribute('data-agent') || '') + ' &middot; ' +
        t('Explain what really happened - the OM reads this before deciding.') + '</p>' +
        '<div class="field"><label>' + t('Your explanation') + '</label><input id="flNote" maxlength="255" placeholder="' + esc(t('e.g. I served him on the 22nd, receipt attached')) + '"></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:12px">' +
        '<button class="ghost" data-action="closeModal">' + t('Cancel') + '</button>' +
        '<button class="btn" data-action="flagDisputeGo" data-id="' + fid + '">' + t('Send answer') + '</button></div>');
      return;
    }
    if (a === 'flagDisputeGo') {
      var fnote = elById('flNote').value.trim();
      if (!fnote) { toast(t('Write why you disagree - the OM reads this'), 'warn'); return; }
      api('flag_respond', { body: { id: Number(node.getAttribute('data-id')), response: 'DISPUTED', note: fnote } })
        .then(function () { closeModal(); toast(t('Answer sent to the OM'), 'ok'); renderTab(); })
        .catch(function (e2) { toast(e2.message, 'err'); });
      return;
    }
    if (a === 'baseBand') { state._baseBand = node.getAttribute('data-b'); renderTab(); return; }
    if (a === 'baseScope') { state._baseNew = node.getAttribute('data-v'); renderTab(); return; }
    if (a === 'baseClear') {
      state._baseBand = ''; state._baseKpi = ''; state._baseSearch = '';
      state._baseServed = ''; state._baseLoc = ''; state._baseBranch = ''; state._baseField = '';
      renderTab(); return;
    }
    if (a === 'heUpload') { heUpload(); return; }
    if (a === 'heLoad') { heLoad(); return; }
    if (a === 'myFlagTab') { state._myFlagKpi = node.getAttribute('data-kpi'); renderTab(); return; }
    if (a === 'cbDownload') { cbDownload(); return; }
    if (a === 'brSave') { brSave(); return; }
    if (a === 'filingRepair') {
      api('filing_repair', { body: {} })
        .then(function (d) { toast(d.note || t('Re-filing done'), 'ok'); renderTab(); })
        .catch(function (e) { toast(e.message, 'err'); });
      return;
    }
    if (a === 'bdOpen') { state._bdOpen = node.getAttribute('data-bdo'); renderTab(); return; }
    if (a === 'bdBack') { state._bdOpen = null; renderTab(); return; }
    if (a === 'bdLoad') { state._bdMonth = elById('bdMonth').value; state._bdOpen = null; renderTab(); return; }
    if (a === 'bdDownload') { bdosDownload(); return; }
    if (a === 'heXlsAll') { heReport('', 'excel'); return; }
    if (a === 'heDocAll') { heReport('', 'word'); return; }
    if (a === 'heXlsOne') { heReport(node.getAttribute('data-bdo'), 'excel'); return; }
    if (a === 'heDocOne') { heReport(node.getAttribute('data-bdo'), 'word'); return; }
    if (a === 'orSave') { officerRulesSave(node.getAttribute('data-bdo')); return; }
    if (a === 'bdList') { bdoListXls(node.getAttribute('data-w')); return; }
    if (a === 'flLoad') { state._flagsMonth = elById('flMonth').value; renderTab(); return; }
    if (a === 'flDownload') { flagsDownload(); return; }
    if (a === 'flClear') {
      ['flSearch','flBdo','flKpi','flStatus'].forEach(function (id) { var el = elById(id); if (el) el.value = ''; });
      flApply(); return;
    }
    if (a === 'flClearAll') { flagsClearAsk(''); return; }
    if (a === 'flClearOne') { flagsClearAsk(node.getAttribute('data-bdo') || ''); return; }
    if (a === 'flClearGo') { flagsClearGo(node.getAttribute('data-bdo') || ''); return; }
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
    if (a === 'locConfirm') {
      var lv2 = elById('locInput').value.trim();
      if (!lv2) { toast(t('Type the physical location'), 'warn'); return; }
      if (node.getAttribute('data-req') && !state._serveProof) { toast(t('Attach the serving receipt photo - the OM has made it compulsory'), 'warn'); return; }
      var n2 = state._locNode, sp = state._serveProof; state._serveProof = '';
      closeModal();
      kpiMark(node.getAttribute('data-id'), node.getAttribute('data-kpi'), node.getAttribute('data-name'), n2, lv2, sp, '', true);
      return;
    }
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
      /* The old viewer hid a failed image and left a blank black box, so a
       * missing or unreadable photo looked identical to a slow one. Now it says
       * what actually happened - the server's own reason - and offers the raw
       * link so the photo can be opened or saved directly. */
      var pNote = node.getAttribute('data-note') || '';
      var purl = 'api.php?action=wake_proof&agent=' + encodeURIComponent(node.getAttribute('data-id')) +
                 '&kpi=' + encodeURIComponent(node.getAttribute('data-kpi') || 'active') +
                 '&month=' + encodeURIComponent(state.month || state.openMonth || curMonth());
      openModal('<h2>' + svg('eye') + ' ' + t('Receipt proof') + ' &mdash; ' + esc(node.getAttribute('data-name') || '') + '</h2>' +
        (pNote ? '<p class="note" style="border:1px dashed var(--line);border-radius:10px;padding:10px">&ldquo;' + esc(pNote) + '&rdquo;</p>' : '') +
        '<div id="proofBox" style="margin-top:8px;min-height:60px"><span class="note">' + t('Loading the photo...') + '</span></div>' +
        '<div class="row" style="justify-content:space-between;margin-top:12px">' +
        '<a class="note" id="proofLink" href="' + purl + '" target="_blank" rel="noopener">' + t('Open the photo in a new tab') + '</a>' +
        '<button class="ghost" data-action="closeModal">' + t('Close') + '</button></div>');
      (function (url) {
        var box = elById('proofBox');
        var img = new Image();
        img.onload = function () {
          box.innerHTML = '';
          img.style.maxWidth = '100%'; img.style.borderRadius = '12px';
          box.appendChild(img);
        };
        img.onerror = function () {
          /* ask the same URL again as JSON so the server can explain itself */
          fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'imani' } })
            .then(function (r) { return r.text().then(function (txt) { return { s: r.status, t: txt }; }); })
            .then(function (res) {
              var why = '';
              try { why = (JSON.parse(res.t) || {}).error || ''; } catch (e) { why = ''; }
              box.innerHTML = '<div class="err">' + esc(why || (t('The photo could not be loaded') + ' (HTTP ' + res.s + ')')) + '</div>' +
                '<p class="note">' + t('The mark is still valid - only the picture is missing. Ask the BDO to re-attach it, or open the link below.') + '</p>';
            })
            .catch(function () {
              box.innerHTML = '<div class="err">' + esc(t('The photo could not be loaded')) + '</div>';
            });
        };
        img.src = url;
      })(purl);
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
    if (a === 'placeAdd') {
      var np = elById('newPlace') ? elById('newPlace').value.trim() : '';
      if (!np) { toast(t('Type the place name'), 'warn'); return; }
      api('place_save', { body: { place: np } })
        .then(function () { toast(t('Place saved'), 'ok'); renderTab(); })
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
    if (a === 'dashSettingsSave') { dashSettingsSave(); return; }
    if (a === 'inactMode') { state._inactMode = node.getAttribute('data-m'); inactivePanelLoad(); return; }
    if (a === 'btSave') { btSave(); return; }
    if (a === 'btSaveAll') { btSaveAll(false); return; }
    if (a === 'btSaveMissing') { btSaveAll(true); return; }
    if (a === 'doUpload') { doUpload(); return; }
    if (a === 'loadDemo') { loadDemo(); return; }
    if (a === 'tgLoad') { state.month = elById('tgMonth').value; renderTab(); return; }
    if (a === 'tgSave') { tgSave(); return; }
    if (a === 'commMonth') { state._commMonth = node.getAttribute('data-m'); renderTab(); return; }
    if (a === 'commStation') { commStation(node); return; }
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
    /* ticking saved places rebuilds the route line (and the label highlight) */
    if (n && n.classList && n.classList.contains('rpPlace')) {
      var picked = Array.prototype.slice.call(document.querySelectorAll('.rpPlace:checked')).map(function (c) { return c.value; });
      var pl = elById('rpPlan');
      if (pl) pl.value = picked.join(' -> ');
      if (n.parentNode && n.parentNode.classList) n.parentNode.classList.toggle('active', n.checked);
      return;
    }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'uRole') { uPatch(n.getAttribute('data-id'), { role: n.value }); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'uSpec') { uPatch(n.getAttribute('data-id'), { specialty: n.value }); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'dashStation') {
      /* the region is a decision, not a page setting: store it so the agent
       * list, flags, live board, targets and commission all follow */
      state._dashStation = n.value;
      api('view_station_set', { body: { station: n.value } })
        .then(function () { toast(n.value ? (t('Now showing') + ' ' + n.value) : t('Now showing all stations'), 'ok'); renderTab(); })
        .catch(function (e) { toast(e.message, 'err'); renderTab(); });
      return;
    }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'tgStationPick') { state.tgStation = n.value; renderTab(); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'baseKpi') { state._baseKpi = n.value; renderTab(); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'baseServed') { state._baseServed = n.value; renderTab(); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'baseLoc') { state._baseLoc = n.value; renderTab(); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'baseBranch') { state._baseBranch = n.value; renderTab(); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'baseField') { state._baseField = n.value; renderTab(); return; }
    if (n && n.getAttribute && n.getAttribute('data-change') === 'baseSort') { state._baseSort = n.value; renderTab(); return; }
    if (n && n.getAttribute && ['agentField','fserved','fvisit','fapk','factive','fband'].indexOf(n.getAttribute('data-change')) >= 0) {
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
