/* PMP Practice Exam Simulator - exam engine
 * Question schema (see questions/en/*.js):
 *   id  unique id            d  'People' | 'Process' | 'Business'
 *   ap  'Predictive' | 'Agile' | 'Hybrid'
 *   t   'single' (default) | 'multi' | 'match' | 'numeric'
 *   q   stem (trusted HTML)   o  options (single/multi) or left-hand items (match)
 *   m   right-hand choices (match only)
 *   c   correct: index | [indices] | [right index per left item] | number
 *   tol numeric tolerance (numeric only, default 0)
 *   e   explanation
 *   fixedOrder  keep option order (e.g. options that reference a table in order)
 * Translations (questions/fr/*.js): window.PMP_FR[id] = { q, o, m, e } with the same option order.
 */
(function () {
  'use strict';

  var BANK = window.PMP_BANK || [];
  var FR = window.PMP_FR || {};
  var I18N = window.PMP_I18N;

  // July 2026 PMP Examination Content Outline weights.
  var DOMAINS = { People: 0.33, Process: 0.41, Business: 0.26 };
  var DOMAIN_KEYS = ['People', 'Process', 'Business'];
  var APPROACHES = ['Predictive', 'Agile', 'Hybrid'];
  // Real exam: 180 questions / 240 minutes => 80 seconds per question.
  var SECONDS_PER_Q = 240 * 60 / 180;
  var MODES = { full: 180, half: 90, quick: 60, sprint: 30 };
  var PREDICTIVE_SHARE = 0.4;
  var SECTION_SIZE = 60;
  var BREAK_SECONDS = 10 * 60;
  var STORE_KEY = 'pmpSim.v1';
  var LETTERS = 'ABCDEFGHIJ';

  // ---------- persistence (history, last-seen timestamps, language; an exam never resumes) ----------
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* private mode */ }
  }
  var store = loadStore();
  store.seen = store.seen || {};
  store.history = store.history || [];

  // ---------- language ----------
  var lang = store.lang || ((navigator.language || '').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en');
  if (!I18N[lang]) lang = 'en';

  function t(key, vars) {
    var s = I18N[lang][key];
    if (s == null) s = I18N.en[key];
    if (s == null) return key;
    if (vars && typeof s === 'string') {
      s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    }
    return s;
  }
  // Localized text of a question; falls back to English if a translation is missing.
  function L(q) {
    var tr = lang === 'fr' ? FR[q.id] : null;
    return {
      q: (tr && tr.q) || q.q,
      o: (tr && tr.o) || q.o,
      m: (tr && tr.m) || q.m,
      e: (tr && tr.e) || q.e
    };
  }
  function domLabel(d) { return t('dom.' + d); }
  function locale() { return lang === 'fr' ? 'fr-FR' : 'en-US'; }

  function applyStatic() {
    document.documentElement.lang = lang;
    $all('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
    $all('[data-i18n-html]').forEach(function (n) { n.innerHTML = t(n.getAttribute('data-i18n-html')); });
    $all('[data-i18n-ph]').forEach(function (n) { n.placeholder = t(n.getAttribute('data-i18n-ph')); });
    $all('[data-i18n-title]').forEach(function (n) { n.title = t(n.getAttribute('data-i18n-title')); });
    $all('.lang-switch button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
  }

  function setLang(l) {
    if (!I18N[l] || l === lang) return;
    lang = l;
    store.lang = l;
    saveStore();
    applyStatic();
    renderWelcome();
    if (!ex) return;
    if (isActive('screen-exam')) render();
    else if (isActive('screen-review')) openReview();
    else if (isActive('screen-break')) renderBreakText();
    else if (isActive('screen-results') && ex.result) renderResults(ex.result);
    if (!ex.finished) updateClockLabels();
  }

  // ---------- randomness ----------
  function rnd(n) {
    if (window.crypto && window.crypto.getRandomValues) {
      var a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = rnd(i + 1);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  function range(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }

  // Never-seen questions first, then least recently seen; random order within each group.
  function freshOrder(list) {
    var s = shuffle(list.slice());
    return s.sort(function (a, b) { return (store.seen[a.id] || 0) - (store.seen[b.id] || 0); });
  }

  // Take k items from a freshness-ordered pool. Freshness wins: questions are taken tier by tier
  // (never seen first, then by last-seen time), and the ~40% predictive / ~60% agile+hybrid mix is
  // only balanced inside the tier that has more questions than are still needed.
  function takeBalanced(pool, k) {
    var targetP = Math.round(k * PREDICTIVE_SHARE);
    var taken = [], rest = [], np = 0, na = 0, i = 0;
    var isP = function (q) { return q.ap === 'Predictive'; };
    while (i < pool.length) {
      var stamp = store.seen[pool[i].id] || 0, tier = [];
      while (i < pool.length && (store.seen[pool[i].id] || 0) === stamp) tier.push(pool[i++]);
      var need = k - taken.length;
      if (need <= 0) { rest = rest.concat(tier); continue; }
      if (tier.length <= need) {
        tier.forEach(function (q) { if (isP(q)) np++; else na++; });
        taken = taken.concat(tier);
        continue;
      }
      var pred = tier.filter(isP), adapt = tier.filter(function (q) { return !isP(q); });
      var tp = Math.min(pred.length, Math.max(0, targetP - np), need);
      var ta = Math.min(adapt.length, need - tp);
      tp = Math.min(pred.length, need - ta);
      np += tp; na += ta;
      taken = taken.concat(pred.slice(0, tp), adapt.slice(0, ta));
      rest = rest.concat(pred.slice(tp), adapt.slice(ta));
    }
    return [taken, rest];
  }

  function pickQuestions(n, focus) {
    var byDom = { People: [], Process: [], Business: [] };
    BANK.forEach(function (q) { if (byDom[q.d]) byDom[q.d].push(q); });
    var doms = focus ? [focus] : DOMAIN_KEYS;
    var quotas = {};
    if (focus) {
      quotas[focus] = n;
    } else {
      var total = 0;
      doms.forEach(function (d) { quotas[d] = Math.round(n * DOMAINS[d]); total += quotas[d]; });
      quotas.Process += n - total;
    }
    var chosen = [], spare = [];
    doms.forEach(function (d) {
      var split = takeBalanced(freshOrder(byDom[d]), quotas[d]);
      chosen = chosen.concat(split[0]);
      spare = spare.concat(split[1]);
    });
    if (chosen.length < n) chosen = chosen.concat(freshOrder(spare).slice(0, n - chosen.length));
    return shuffle(chosen);
  }

  function poolSize(focus) {
    return focus ? BANK.filter(function (q) { return q.d === focus; }).length : BANK.length;
  }

  // ---------- DOM helpers ----------
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function show(id) {
    $all('.screen').forEach(function (s) { s.classList.remove('active'); });
    $('#' + id).classList.add('active');
    window.scrollTo(0, 0);
  }
  function isActive(id) { return $('#' + id).classList.contains('active'); }
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function fmtMin(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function modal(title, bodyHtml, buttons) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = bodyHtml;
    var foot = $('#modal-foot');
    foot.innerHTML = '';
    buttons.forEach(function (b) {
      foot.appendChild(el('button', {
        class: 'btn' + (b.primary ? ' primary' : ''), text: b.label,
        onclick: function () { $('#modal').hidden = true; if (b.action) b.action(); }
      }));
    });
    $('#modal').hidden = false;
    var last = foot.lastChild; if (last) last.focus();
  }

  // ---------- question helpers ----------
  function qType(q) { return q.t || 'single'; }

  // Accepts "1,234.5", "1 234,5", "0,8", "$250,000", "-10 000".
  function parseNum(v) {
    var s = String(v).replace(/[\s  $%€]/g, '');
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/,/g, '');
    else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
    return parseFloat(s);
  }

  function isAnswered(q, a) {
    switch (qType(q)) {
      case 'single': return a != null;
      case 'multi': return !!a && a.length === q.c.length;
      case 'match': return !!a && a.every(function (x) { return x != null; });
      case 'numeric': return a != null && String(a).trim() !== '' && !isNaN(parseNum(a));
    }
    return false;
  }

  function isCorrect(q, a) {
    if (!isAnswered(q, a)) return false;
    switch (qType(q)) {
      case 'single': return a === q.c;
      case 'multi':
        var x = a.slice().sort(), y = q.c.slice().sort();
        return x.length === y.length && x.every(function (v, i) { return v === y[i]; });
      case 'match': return q.c.every(function (v, i) { return a[i] === v; });
      case 'numeric': return Math.abs(parseNum(a) - q.c) <= (q.tol || 0) + 1e-9;
    }
    return false;
  }

  function instructionFor(q) {
    switch (qType(q)) {
      case 'multi': return t('instr.multi', { n: t('num.words')[q.c.length] });
      case 'match': return t('instr.match');
      case 'numeric': return t('instr.numeric');
    }
    return t('instr.single');
  }

  // ---------- exam state ----------
  var ex = null;
  var zoomLevels = [16, 18, 20, 14];
  var zoomIdx = 0;

  function startExam() {
    var modeKey = ($('input[name=mode]:checked') || {}).value || 'full';
    var focus = $('#domain-focus').value || '';
    var n = Math.min(MODES[modeKey], poolSize(focus));
    if (n === 0) { modal('', t('empty.bank'), [{ label: t('btn.ok') }]); return; }

    var items = pickQuestions(n, focus).map(function (q) {
      var it = { q: q };
      var ty = qType(q);
      if (ty === 'single' || ty === 'multi') it.perm = q.fixedOrder ? range(q.o.length) : shuffle(range(q.o.length));
      if (ty === 'match') { it.perm = shuffle(range(q.o.length)); it.mperm = shuffle(range(q.m.length)); }
      return it;
    });
    var sections = [];
    for (var i = 0; i < n; i += SECTION_SIZE) sections.push([i, Math.min(n, i + SECTION_SIZE)]);

    ex = {
      name: ($('#cand-name').value || '').trim() || (lang === 'fr' ? 'Candidat' : 'Candidate'),
      modeKey: modeKey, focus: focus, items: items, sections: sections, sec: 0, cur: 0,
      ans: items.map(function () { return null; }),
      flag: items.map(function () { return false; }),
      strike: items.map(function () { return []; }),
      hl: items.map(function () { return {}; }),   // highlighted stem HTML per language
      totalSec: Math.round(n * SECONDS_PER_Q),
      remaining: Math.round(n * SECONDS_PER_Q),
      deadline: 0, timer: null, breakTimer: null, reviewList: null,
      hlMode: false, strikeMode: false, startedAt: Date.now(), finished: false, result: null
    };
    show('screen-tutorial');
  }

  function beginClock() {
    ex.deadline = Date.now() + ex.remaining * 1000;
    clearInterval(ex.timer);
    ex.timer = setInterval(tick, 250);
    tick();
  }
  function pauseClock() {
    if (!ex) return;
    clearInterval(ex.timer);
    ex.timer = null;
    ex.remaining = Math.max(0, Math.ceil((ex.deadline - Date.now()) / 1000));
    updateClockLabels();
  }
  function tick() {
    ex.remaining = Math.max(0, Math.ceil((ex.deadline - Date.now()) / 1000));
    updateClockLabels();
    if (ex.remaining <= 0) {
      clearInterval(ex.timer); ex.timer = null;
      finishExam(true);
    }
  }
  function updateClockLabels() {
    var s = fmtTime(ex.remaining);
    $('#time-left').textContent = s;
    $all('.time-left-mirror').forEach(function (n) { n.textContent = s; });
    var timer = $('#timer');
    timer.classList.toggle('low', ex.remaining <= 15 * 60 && ex.remaining > 5 * 60);
    timer.classList.toggle('critical', ex.remaining <= 5 * 60);
  }

  function secRange() { return ex.sections[ex.sec]; }

  // ---------- rendering a question ----------
  function render() {
    var it = ex.items[ex.cur], q = it.q, ty = qType(q), tx = L(q);
    var sr = secRange();
    $('#qcount').textContent = t('exam.count', { n: ex.cur + 1, total: ex.items.length });
    $('#section-info').textContent = t('exam.section', { n: ex.sec + 1, total: ex.sections.length });
    $('#exam-title').textContent = t('exam.title', { name: ex.name });
    $('#flag-cb').checked = ex.flag[ex.cur];
    $('.flag-tool').classList.toggle('on', ex.flag[ex.cur]);
    $('#qmeta').textContent = t('exam.question', { n: ex.cur + 1 });
    $('#stem').innerHTML = ex.hl[ex.cur][lang] || tx.q;
    $('#instr').textContent = instructionFor(q);
    $('#qmsg').textContent = '';

    var box = $('#answers');
    box.innerHTML = '';
    var a = ex.ans[ex.cur];

    if (ty === 'single' || ty === 'multi') {
      it.perm.forEach(function (oi, pos) {
        var chosen = ty === 'single' ? a === oi : !!(a && a.indexOf(oi) >= 0);
        var input = el('input', { type: ty === 'single' ? 'radio' : 'checkbox', name: 'ans', value: String(oi) });
        input.checked = chosen;
        var lab = el('label', { class: 'opt' + (chosen ? ' chosen' : '') + (ex.strike[ex.cur].indexOf(oi) >= 0 ? ' struck' : '') }, [
          input, el('span', { class: 'letter', text: LETTERS[pos] + '.' }), el('span', { class: 'txt', text: tx.o[oi] })
        ]);
        lab.addEventListener('click', function (ev) {
          if (ex.strikeMode) { ev.preventDefault(); toggleStrike(oi); }
        });
        lab.addEventListener('contextmenu', function (ev) { ev.preventDefault(); toggleStrike(oi); });
        input.addEventListener('change', function () { onChoice(oi, input); });
        box.appendChild(lab);
      });
    } else if (ty === 'match') {
      var table = el('table', { class: 'match-table' });
      it.perm.forEach(function (li) {
        var sel = el('select', { 'aria-label': t('match.aria', { item: tx.o[li] }), 'data-left': String(li) });
        sel.appendChild(el('option', { value: '', text: t('match.select') }));
        it.mperm.forEach(function (ri) { sel.appendChild(el('option', { value: String(ri), text: tx.m[ri] })); });
        if (a && a[li] != null) sel.value = String(a[li]);
        sel.addEventListener('change', function () {
          var cur = ex.ans[ex.cur] || q.o.map(function () { return null; });
          cur[li] = sel.value === '' ? null : parseInt(sel.value, 10);
          ex.ans[ex.cur] = cur;
        });
        table.appendChild(el('tr', null, [el('td', { text: tx.o[li] }), el('td', null, [sel])]));
      });
      box.appendChild(table);
    } else if (ty === 'numeric') {
      var inp = el('input', { type: 'text', inputmode: 'decimal', class: 'numeric-input', 'aria-label': t('num.aria'), autocomplete: 'off' });
      inp.value = a == null ? '' : a;
      inp.addEventListener('input', function () { ex.ans[ex.cur] = inp.value; });
      box.appendChild(inp);
    }

    var atStart = ex.reviewList ? ex.reviewList.indexOf(ex.cur) <= 0 : ex.cur <= sr[0];
    $('#btn-prev').disabled = atStart;
    $('#qarea').classList.toggle('hl-on', ex.hlMode);
    $('#qarea').classList.toggle('strike-on', ex.strikeMode);
    window.scrollTo(0, 0);
  }

  function onChoice(oi, input) {
    var q = ex.items[ex.cur].q;
    if (qType(q) === 'single') {
      ex.ans[ex.cur] = oi;
      var s = ex.strike[ex.cur], k = s.indexOf(oi);
      if (k >= 0) s.splice(k, 1);
    } else {
      var cur = (ex.ans[ex.cur] || []).slice();
      var idx = cur.indexOf(oi);
      if (input.checked && idx < 0) {
        if (cur.length >= q.c.length) {
          input.checked = false;
          $('#qmsg').textContent = t('msg.maxSel', { n: q.c.length });
          return;
        }
        cur.push(oi);
      } else if (!input.checked && idx >= 0) {
        cur.splice(idx, 1);
      }
      ex.ans[ex.cur] = cur.length ? cur : null;
      $('#qmsg').textContent = '';
    }
    $all('#answers .opt').forEach(function (lab) {
      lab.classList.toggle('chosen', lab.querySelector('input').checked);
    });
  }

  function toggleStrike(oi) {
    var s = ex.strike[ex.cur], k = s.indexOf(oi);
    if (k >= 0) s.splice(k, 1); else s.push(oi);
    render();
  }

  // ---------- navigation ----------
  function go(delta) {
    var sr = secRange();
    if (ex.reviewList) {
      var pos = ex.reviewList.indexOf(ex.cur) + delta;
      if (pos >= ex.reviewList.length) { openReview(); return; }
      if (pos < 0) return;
      ex.cur = ex.reviewList[pos];
    } else {
      var next = ex.cur + delta;
      if (next >= sr[1]) { openReview(); return; }
      if (next < sr[0]) return;
      ex.cur = next;
    }
    render();
  }

  function openReview() {
    ex.reviewList = null;
    var sr = secRange();
    $('#review-heading').textContent = t('rev.heading', { n: ex.sec + 1, total: ex.sections.length });
    var grid = $('#review-grid');
    grid.innerHTML = '';
    var inc = 0, fl = 0;
    for (var i = sr[0]; i < sr[1]; i++) {
      var done = isAnswered(ex.items[i].q, ex.ans[i]);
      if (!done) inc++;
      if (ex.flag[i]) fl++;
      (function (idx, done) {
        grid.appendChild(el('button', {
          class: 'rv' + (done ? '' : ' inc'), type: 'button',
          onclick: function () { ex.cur = idx; show('screen-exam'); render(); }
        }, [
          el('span', { text: t('exam.question', { n: idx + 1 }) }),
          el('span', { class: 'f', text: (ex.flag[idx] ? '⚑' : '') + (done ? '' : ' ' + t('rev.inc')) })
        ]));
      })(i, done);
    }
    $('#review-summary').textContent = t('rev.summary', { n: sr[1] - sr[0], inc: inc, fl: fl });
    $('#btn-end-section').textContent = t(ex.sec === ex.sections.length - 1 ? 'rev.endExam' : 'rev.endSection');
    show('screen-review');
  }

  function startReview(filter) {
    var sr = secRange(), list = [];
    for (var i = sr[0]; i < sr[1]; i++) {
      if (filter === 'all' ||
          (filter === 'inc' && !isAnswered(ex.items[i].q, ex.ans[i])) ||
          (filter === 'flag' && ex.flag[i])) list.push(i);
    }
    if (!list.length) {
      modal(t('rev.title'), t(filter === 'inc' ? 'rev.noInc' : 'rev.noFlag'), [{ label: t('btn.ok'), primary: true }]);
      return;
    }
    ex.reviewList = list;
    ex.cur = list[0];
    show('screen-exam');
    render();
  }

  function confirmEndSection() {
    var sr = secRange(), inc = 0;
    for (var i = sr[0]; i < sr[1]; i++) if (!isAnswered(ex.items[i].q, ex.ans[i])) inc++;
    var last = ex.sec === ex.sections.length - 1;
    var body = (inc ? t('end.incomplete', { n: inc }) : '') +
      t(last ? 'end.lastWarn' : 'end.secWarn') + t(last ? 'end.askExam' : 'end.askSection');
    modal(t(last ? 'rev.endExam' : 'rev.endSection'), body, [
      { label: t('btn.no') },
      { label: t('btn.yes'), primary: true, action: endSection }
    ]);
  }

  function endSection() {
    if (ex.sec === ex.sections.length - 1) { finishExam(false); return; }
    pauseClock();
    ex.sec++;
    ex.reviewList = null;
    renderBreakText();
    $('#break-offer').hidden = false;
    $('#break-running').hidden = true;
    show('screen-break');
  }

  function renderBreakText() {
    $('#break-heading').textContent = t('brk.heading', { n: ex.sec, total: ex.sections.length });
    $('#break-offer-text').innerHTML = t('brk.offer', { time: fmtTime(ex.remaining) });
  }

  function takeBreak() {
    $('#break-offer').hidden = true;
    $('#break-running').hidden = false;
    var end = Date.now() + BREAK_SECONDS * 1000;
    var upd = function () {
      var left = Math.ceil((end - Date.now()) / 1000);
      $('#break-clock').textContent = fmtMin(left);
      if (left <= 0) resumeAfterBreak();
    };
    clearInterval(ex.breakTimer);
    ex.breakTimer = setInterval(upd, 250);
    upd();
  }

  function resumeAfterBreak() {
    clearInterval(ex.breakTimer);
    ex.breakTimer = null;
    ex.cur = secRange()[0];
    show('screen-exam');
    render();
    beginClock();
  }

  // ---------- tools ----------
  function applyHighlight() {
    if (!ex || !ex.hlMode) return;
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    var rg = sel.getRangeAt(0), stem = $('#stem');
    if (!stem.contains(rg.commonAncestorContainer)) return;
    var mark = document.createElement('mark');
    try {
      rg.surroundContents(mark);
    } catch (e) {
      try { mark.appendChild(rg.extractContents()); rg.insertNode(mark); } catch (e2) { return; }
    }
    sel.removeAllRanges();
    ex.hl[ex.cur][lang] = stem.innerHTML;
  }

  function setToggle(btn, on) { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }

  // ---------- calculator ----------
  var calc = { display: '0', acc: null, op: null, fresh: true, mem: 0 };
  function calcShow() {
    var d = calc.display;
    if (d !== 'Error' && d.length > 14 && !isNaN(+d)) d = String(+(+d).toPrecision(12));
    $('#calc-display').textContent = d;
  }
  function calcApply(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
    }
    return b;
  }
  function calcNum(v) { return isFinite(v) ? String(+v.toPrecision(12)) : 'Error'; }
  function calcKey(k) {
    var cur = parseFloat(calc.display);
    if (calc.display === 'Error' && k !== 'C' && k !== 'CE') return;
    if (/^[0-9]$/.test(k)) {
      calc.display = (calc.fresh || calc.display === '0') ? k : calc.display + k;
      calc.fresh = false;
    } else if (k === '.') {
      if (calc.fresh) { calc.display = '0.'; calc.fresh = false; }
      else if (calc.display.indexOf('.') < 0) calc.display += '.';
    } else if ('+-*/'.indexOf(k) >= 0) {
      if (calc.op && !calc.fresh) { calc.acc = calcApply(calc.acc, cur, calc.op); calc.display = calcNum(calc.acc); }
      else calc.acc = cur;
      calc.op = k; calc.fresh = true;
    } else if (k === '=') {
      if (calc.op) { calc.display = calcNum(calcApply(calc.acc, cur, calc.op)); calc.op = null; calc.acc = null; }
      calc.fresh = true;
    } else if (k === 'C') { calc.display = '0'; calc.acc = null; calc.op = null; calc.fresh = true; }
    else if (k === 'CE') { calc.display = '0'; calc.fresh = true; }
    else if (k === 'BS') {
      if (!calc.fresh) calc.display = calc.display.length > 1 ? calc.display.slice(0, -1) : '0';
    }
    else if (k === 'NEG') { calc.display = calcNum(-cur); }
    else if (k === 'SQRT') { calc.display = cur < 0 ? 'Error' : calcNum(Math.sqrt(cur)); calc.fresh = true; }
    else if (k === 'SQ') { calc.display = calcNum(cur * cur); calc.fresh = true; }
    else if (k === 'INV') { calc.display = cur === 0 ? 'Error' : calcNum(1 / cur); calc.fresh = true; }
    else if (k === '%') { calc.display = calcNum(calc.op && calc.acc != null ? calc.acc * cur / 100 : cur / 100); calc.fresh = true; }
    else if (k === 'MC') calc.mem = 0;
    else if (k === 'MR') { calc.display = calcNum(calc.mem); calc.fresh = true; }
    else if (k === 'M+') { calc.mem += cur; calc.fresh = true; }
    else if (k === 'M-') { calc.mem -= cur; calc.fresh = true; }
    calcShow();
  }
  function makeDraggable(box, handle) {
    var sx, sy, ox, oy, drag = false;
    handle.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      drag = true; sx = e.clientX; sy = e.clientY;
      var r = box.getBoundingClientRect(); ox = r.left; oy = r.top;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag) return;
      box.style.left = Math.max(0, Math.min(window.innerWidth - 60, ox + e.clientX - sx)) + 'px';
      box.style.top = Math.max(0, Math.min(window.innerHeight - 40, oy + e.clientY - sy)) + 'px';
      box.style.right = 'auto';
    });
    handle.addEventListener('pointerup', function () { drag = false; });
  }

  // ---------- scoring & results ----------
  function rating(pct) {
    if (pct >= 80) return 3;   // Above Target
    if (pct >= 65) return 2;   // Target
    if (pct >= 50) return 1;   // Below Target
    return 0;                  // Needs Improvement
  }

  function sortByPerm(list, perm) { return list.slice().sort(function (x, y) { return perm.indexOf(x) - perm.indexOf(y); }); }
  function isAnsweredLoose(q, a) {
    var ty = qType(q);
    if (a == null) return false;
    if (ty === 'multi') return a.length > 0;
    if (ty === 'match') return a.some(function (x) { return x != null; });
    if (ty === 'numeric') return String(a).trim() !== '';
    return true;
  }
  function fmtNumber(n) { return Number(n).toLocaleString(locale(), { maximumFractionDigits: 4 }); }

  function answerText(q, a, it) {
    var ty = qType(q), tx = L(q);
    if (!isAnsweredLoose(q, a)) return null;
    if (ty === 'single') return [tx.o[a]];
    if (ty === 'multi') return sortByPerm(a, it.perm).map(function (i) { return tx.o[i]; });
    if (ty === 'match') return it.perm.map(function (li) { return tx.o[li] + '  →  ' + (a[li] == null ? t('card.noSel') : tx.m[a[li]]); });
    if (ty === 'numeric') return [String(a).trim()];
    return null;
  }
  function correctText(q, it) {
    var ty = qType(q), tx = L(q);
    if (ty === 'single') return [tx.o[q.c]];
    if (ty === 'multi') return sortByPerm(q.c, it.perm).map(function (i) { return tx.o[i]; });
    if (ty === 'match') return it.perm.map(function (li) { return tx.o[li] + '  →  ' + tx.m[q.c[li]]; });
    if (ty === 'numeric') return [fmtNumber(q.c) + (q.tol ? t('card.tol', { tol: fmtNumber(q.tol) }) : '')];
    return [];
  }

  function finishExam(timedOut) {
    if (ex.finished) return;
    ex.finished = true;
    clearInterval(ex.timer);
    clearInterval(ex.breakTimer);
    ex.timer = null;
    ex.remaining = timedOut ? 0 : Math.max(0, Math.ceil((ex.deadline - Date.now()) / 1000));

    var res = { total: ex.items.length, correct: 0, byDom: {}, byAp: {}, rows: [], timedOut: timedOut,
                used: ex.totalSec - ex.remaining, date: new Date() };
    DOMAIN_KEYS.forEach(function (d) { res.byDom[d] = { n: 0, ok: 0 }; });
    APPROACHES.forEach(function (p) { res.byAp[p] = { n: 0, ok: 0 }; });

    ex.items.forEach(function (it, i) {
      var q = it.q, a = ex.ans[i], ok = isCorrect(q, a);
      if (ok) res.correct++;
      res.byDom[q.d].n++; if (ok) res.byDom[q.d].ok++;
      if (res.byAp[q.ap]) { res.byAp[q.ap].n++; if (ok) res.byAp[q.ap].ok++; }
      res.rows.push({ i: i, it: it, ok: ok, answered: isAnswered(q, a), flagged: ex.flag[i] });
    });
    res.pct = Math.round(res.correct / res.total * 1000) / 10;
    ex.result = res;

    var entry = { date: res.date.toISOString(), mode: ex.modeKey, focus: ex.focus, pct: res.pct, correct: res.correct, total: res.total, dom: {} };
    DOMAIN_KEYS.forEach(function (d) { var b = res.byDom[d]; entry.dom[d] = b.n ? Math.round(b.ok / b.n * 100) : null; });
    store.history.unshift(entry);
    store.history = store.history.slice(0, 30);
    saveStore();

    renderResults(res);
    show('screen-results');
  }

  function renderResults(res) {
    var r = rating(res.pct);
    var vClass = r === 3 ? 'pass' : r === 2 ? 'border' : 'fail';
    var focusLabel = ex.focus ? ' · ' + t('res.only', { d: domLabel(ex.focus) }) : '';
    var wrong = res.rows.filter(function (x) { return !x.ok; });
    var flagged = res.rows.filter(function (x) { return x.flagged; });
    var prevTab = $('#results .tab.active');
    var activeTab = prevTab ? prevTab.getAttribute('data-tab') : 'wrong';
    var pct = function (v) { return lang === 'fr' ? String(v).replace('.', ',') + ' %' : v + '%'; };

    var h = '<h1>' + esc(t('res.h1')) + '</h1>';
    if (res.timedOut) h += '<p class="verdict fail">' + esc(t('res.timeout')) + '</p>';
    h += '<div class="score-hero"><div class="score-big">' + pct(res.pct) + '<small>' + esc(t('res.correctOf', { c: res.correct, t: res.total })) + '</small></div>';
    h += '<div><div class="verdict ' + vClass + '">' + esc(t('res.overall', { v: t('verdict.' + r) })) + '</div>';
    h += '<p class="meta-list">' + t('res.meta', {
      name: esc(ex.name), form: esc(t('form.' + ex.modeKey) + focusLabel), date: esc(res.date.toLocaleString(locale())),
      used: fmtTime(res.used), total: fmtTime(ex.totalSec),
      un: res.rows.filter(function (x) { return !x.answered; }).length, fl: flagged.length
    }) + '</p></div></div>';

    h += '<h2 style="margin-top:22px">' + esc(t('res.byDomain')) + '</h2>';
    h += '<div class="table-scroll"><table class="data rating-table"><thead><tr><th>' + esc(t('res.domain')) + '</th><th>' + esc(t('res.score')) + '</th><th></th>' +
         [0, 1, 2, 3].map(function (k) { return '<th class="rt-h">' + esc(t('rating.' + k)) + '</th>'; }).join('') + '</tr></thead><tbody>';
    DOMAIN_KEYS.forEach(function (d) {
      var b = res.byDom[d];
      if (!b.n) return;
      var p = Math.round(b.ok / b.n * 100), rr = rating(p);
      h += '<tr><td><b>' + esc(domLabel(d)) + '</b><br><span class="note">' + esc(t('res.okOf', { c: b.ok, t: b.n })) + '</span></td><td>' + pct(p) + '</td>' +
           '<td><div class="bar"><span style="width:' + p + '%"></span></div></td>' +
           [0, 1, 2, 3].map(function (k) { return '<td class="rt' + (k === rr ? ' on' : '') + '">' + (k === rr ? '●' : '') + '</td>'; }).join('') + '</tr>';
    });
    h += '</tbody></table></div>';

    h += '<h2 style="margin-top:22px">' + esc(t('res.byApproach')) + '</h2><table class="data"><thead><tr><th>' + esc(t('res.approach')) + '</th><th>' +
         esc(t('res.correct')) + '</th><th>' + esc(t('res.score')) + '</th><th></th></tr></thead><tbody>';
    APPROACHES.forEach(function (p) {
      var b = res.byAp[p];
      if (!b.n) return;
      var pc = Math.round(b.ok / b.n * 100);
      h += '<tr><td>' + esc(t('ap.' + p)) + '</td><td>' + b.ok + ' / ' + b.n + '</td><td>' + pct(pc) + '</td><td><div class="bar"><span style="width:' + pc + '%"></span></div></td></tr>';
    });
    h += '</tbody></table>';
    h += '<p class="note">' + t('res.note') + '</p>';

    h += '<div class="tabs noprint" role="tablist">' +
         '<button class="tab" data-tab="wrong">' + t('tab.wrong', { n: wrong.length }) + '</button>' +
         '<button class="tab" data-tab="flagged">' + t('tab.flagged', { n: flagged.length }) + '</button>' +
         '<button class="tab" data-tab="all">' + t('tab.all', { n: res.rows.length }) + '</button></div>';
    h += '<div class="rq-list" id="rq-list"></div>';

    $('#results').innerHTML = h;

    var lists = { wrong: wrong, flagged: flagged, all: res.rows };
    function renderList(key) {
      $all('#results .tab').forEach(function (x) { x.classList.toggle('active', x.getAttribute('data-tab') === key); });
      var list = lists[key], box = $('#rq-list');
      box.innerHTML = '';
      if (!list.length) {
        box.appendChild(el('p', { class: 'empty', text: t(key === 'wrong' ? 'res.noWrong' : 'res.nothing') }));
        return;
      }
      var frag = document.createDocumentFragment();
      list.forEach(function (row) { frag.appendChild(reviewCard(row)); });
      box.appendChild(frag);
    }
    $all('#results .tab').forEach(function (b) {
      b.addEventListener('click', function () { renderList(b.getAttribute('data-tab')); });
    });
    renderList(lists[activeTab] ? activeTab : 'wrong');
  }

  function answerBox(cls, label, lines) {
    var box = el('div', { class: 'ans-box ' + cls }, [el('span', { class: 'lbl', text: label })]);
    if (!lines) { box.appendChild(el('span', { text: t('card.notAnswered') })); return box; }
    if (lines.length === 1) { box.appendChild(el('span', { text: lines[0] })); return box; }
    var ul = el('ul');
    lines.forEach(function (l) { ul.appendChild(el('li', { text: l })); });
    box.appendChild(ul);
    return box;
  }

  function reviewCard(row) {
    var it = row.it, q = it.q, a = ex.ans[row.i], tx = L(q);
    var card = el('div', { class: 'rq' + (row.ok ? ' correct' : '') });
    card.appendChild(el('div', { class: 'rq-head' }, [
      el('span', { text: t('exam.question', { n: row.i + 1 }) + (row.flagged ? '  ' + t('card.flagged') : '') }),
      el('span', { text: domLabel(q.d) + ' · ' + t('ap.' + q.ap) + ' · ' + t(row.ok ? 'card.correct' : row.answered ? 'card.incorrect' : 'card.unanswered') })
    ]));
    card.appendChild(el('div', { class: 'rq-stem', html: tx.q }));
    card.appendChild(answerBox('yours' + (row.ok ? ' right' : ''), t(row.ok ? 'card.yoursOk' : 'card.yours'), answerText(q, a, it)));
    if (!row.ok) card.appendChild(answerBox('correct', t('card.right'), correctText(q, it)));
    if (tx.e) card.appendChild(el('div', { class: 'explain', html: '<b>' + esc(t('card.explain')) + '</b> ' + esc(tx.e) }));
    return card;
  }

  // ---------- welcome / history ----------
  function renderWelcome() {
    var counts = { People: 0, Process: 0, Business: 0 };
    BANK.forEach(function (q) { if (counts[q.d] != null) counts[q.d]++; });
    var unseen = BANK.filter(function (q) { return !store.seen[q.id]; }).length;
    $('#bank-info').textContent = t('bank.info', { total: BANK.length, p: counts.People, r: counts.Process, b: counts.Business, unseen: unseen });

    var hp = $('#history-panel');
    if (!store.history.length) { hp.hidden = true; return; }
    hp.hidden = false;
    var tb = $('#history-table tbody');
    tb.innerHTML = '';
    store.history.slice(0, 10).forEach(function (h) {
      var cell = function (v) { return v == null ? '—' : v + '%'; };
      tb.appendChild(el('tr', null, [
        el('td', { text: new Date(h.date).toLocaleString(locale()) }),
        el('td', { text: t('form.' + h.mode) + (h.focus ? ' · ' + domLabel(h.focus) : '') }),
        el('td', { text: h.pct + '% (' + h.correct + '/' + h.total + ')' }),
        el('td', { text: cell(h.dom.People) }), el('td', { text: cell(h.dom.Process) }), el('td', { text: cell(h.dom.Business) })
      ]));
    });
  }

  // ---------- wiring ----------
  function wire() {
    $all('.lang-switch button').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
    $('#btn-start').addEventListener('click', startExam);
    $('#btn-tutorial-next').addEventListener('click', function () { show('screen-agreement'); });
    $('#btn-disagree').addEventListener('click', function () {
      modal(t('agr.modal'), esc(t('agr.must')), [
        { label: t('agr.back'), action: function () { ex = null; show('screen-welcome'); } },
        { label: t('agr.reread'), primary: true }
      ]);
    });
    $('#btn-agree').addEventListener('click', function () {
      // Record exposure only once the exam really starts, so these questions rotate to the back next time.
      var now = Date.now();
      ex.items.forEach(function (it) { store.seen[it.q.id] = now; });
      saveStore();
      ex.cur = 0;
      show('screen-exam');
      render();
      beginClock();
    });

    $('#btn-next').addEventListener('click', function () { go(1); });
    $('#btn-prev').addEventListener('click', function () { go(-1); });
    $('#btn-review').addEventListener('click', openReview);
    $('#btn-rev-all').addEventListener('click', function () { startReview('all'); });
    $('#btn-rev-inc').addEventListener('click', function () { startReview('inc'); });
    $('#btn-rev-flag').addEventListener('click', function () { startReview('flag'); });
    $('#btn-end-section').addEventListener('click', confirmEndSection);
    $('#btn-take-break').addEventListener('click', takeBreak);
    $('#btn-skip-break').addEventListener('click', resumeAfterBreak);
    $('#btn-end-break').addEventListener('click', resumeAfterBreak);

    $('#flag-cb').addEventListener('change', function (e) {
      ex.flag[ex.cur] = e.target.checked;
      $('.flag-tool').classList.toggle('on', e.target.checked);
    });

    $('#tool-hl').addEventListener('click', function () {
      ex.hlMode = !ex.hlMode;
      if (ex.hlMode && ex.strikeMode) { ex.strikeMode = false; setToggle($('#tool-strike'), false); }
      setToggle(this, ex.hlMode);
      render();
    });
    $('#tool-hl-clear').addEventListener('click', function () { ex.hl[ex.cur] = {}; render(); });
    $('#tool-strike').addEventListener('click', function () {
      ex.strikeMode = !ex.strikeMode;
      if (ex.strikeMode && ex.hlMode) { ex.hlMode = false; setToggle($('#tool-hl'), false); }
      setToggle(this, ex.strikeMode);
      render();
    });
    $('#tool-zoom').addEventListener('click', function () {
      zoomIdx = (zoomIdx + 1) % zoomLevels.length;
      document.documentElement.style.setProperty('--font-size', zoomLevels[zoomIdx] + 'px');
    });
    $('#stem').addEventListener('mouseup', applyHighlight);
    $('#stem').addEventListener('touchend', function () { setTimeout(applyHighlight, 0); });

    $('#tool-calc').addEventListener('click', function () { $('#calc').hidden = !$('#calc').hidden; });
    $('#calc-close').addEventListener('click', function () { $('#calc').hidden = true; });
    $('#calc-keys').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (b) calcKey(b.getAttribute('data-k'));
    });
    makeDraggable($('#calc'), $('#calc-head'));

    document.addEventListener('keydown', function (e) {
      var examOn = isActive('screen-exam');
      if (!$('#calc').hidden && !e.altKey && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        var map = { Enter: '=', Backspace: 'BS', Escape: 'C', Delete: 'CE' };
        var k = map[e.key] || e.key;
        if (/^[0-9.+\-*/=%]$/.test(k) || map[e.key]) { e.preventDefault(); calcKey(k); return; }
      }
      if (!examOn || !e.altKey) return;
      var key = e.key.toLowerCase();
      if (key === 'n') { e.preventDefault(); go(1); }
      else if (key === 'p') { e.preventDefault(); if (!$('#btn-prev').disabled) go(-1); }
      else if (key === 'f') { e.preventDefault(); $('#flag-cb').click(); }
      else if (key === 'r') { e.preventDefault(); openReview(); }
    });

    $('#btn-print').addEventListener('click', function () {
      // Print the score report followed by the incorrect / unanswered questions.
      var wrongTab = $('#results .tab[data-tab="wrong"]');
      if (wrongTab) wrongTab.click();
      window.print();
    });
    $('#btn-new').addEventListener('click', function () { window.location.reload(); });
    $('#btn-reset-history').addEventListener('click', function () {
      modal(t('hist.clearTitle'), esc(t('hist.clearAsk')), [
        { label: t('btn.cancel') },
        { label: t('btn.delete'), primary: true, action: function () { store = { seen: {}, history: [], lang: lang }; saveStore(); renderWelcome(); } }
      ]);
    });

    window.addEventListener('beforeunload', function (e) {
      if (ex && !ex.finished && ex.timer) { e.preventDefault(); e.returnValue = ''; }
    });

    if (store.lastName) $('#cand-name').value = store.lastName;
    $('#cand-name').addEventListener('change', function () { store.lastName = this.value.trim(); saveStore(); });
  }

  // Expose a tiny API for automated tests.
  window.PMPSim = {
    isCorrect: isCorrect, isAnswered: isAnswered, parseNum: parseNum, pickQuestions: pickQuestions,
    setLang: setLang, lang: function () { return lang; }, state: function () { return ex; }
  };

  applyStatic();
  wire();
  renderWelcome();
})();
