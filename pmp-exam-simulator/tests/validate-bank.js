#!/usr/bin/env node
/* Validates the question bank structure. Run: node tests/validate-bank.js */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ctx = { window: {} };
vm.createContext(ctx);
function loadDir(sub) {
  var dir = path.join(__dirname, '..', 'questions', sub);
  return fs.readdirSync(dir).filter(function (f) { return /\.js$/.test(f); }).sort().map(function (f) {
    vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: sub + '/' + f });
    return sub + '/' + f;
  });
}
var enFiles = loadDir('en');
var frFiles = fs.existsSync(path.join(__dirname, '..', 'questions', 'fr')) ? loadDir('fr') : [];
var bank = ctx.window.PMP_BANK;
var errors = [];
var ids = {};
var DOMAINS = ['People', 'Process', 'Business'];
var APPROACHES = ['Predictive', 'Agile', 'Hybrid'];
var isInt = function (n) { return typeof n === 'number' && Math.floor(n) === n; };

bank.forEach(function (q, i) {
  var where = (q.id || '#' + i) + ': ';
  if (!q.id) errors.push(where + 'missing id');
  if (ids[q.id]) errors.push(where + 'duplicate id');
  ids[q.id] = true;
  if (DOMAINS.indexOf(q.d) < 0) errors.push(where + 'bad domain ' + q.d);
  if (APPROACHES.indexOf(q.ap) < 0) errors.push(where + 'bad approach ' + q.ap);
  if (!q.q || typeof q.q !== 'string') errors.push(where + 'missing stem');
  if (!q.e) errors.push(where + 'missing explanation');
  var t = q.t || 'single';
  if (t === 'single' || t === 'multi') {
    if (!Array.isArray(q.o) || q.o.length < 4) errors.push(where + 'needs at least 4 options');
    var uniq = {};
    (q.o || []).forEach(function (o) { if (uniq[o]) errors.push(where + 'duplicate option "' + o + '"'); uniq[o] = 1; });
    if (t === 'single' && !(isInt(q.c) && q.c >= 0 && q.c < q.o.length)) errors.push(where + 'bad single answer index');
    if (t === 'multi') {
      if (!Array.isArray(q.c) || q.c.length < 2) errors.push(where + 'multi needs >= 2 answers');
      else q.c.forEach(function (c) { if (!(isInt(c) && c >= 0 && c < q.o.length)) errors.push(where + 'bad multi index ' + c); });
      if (new Set(q.c).size !== q.c.length) errors.push(where + 'duplicate multi index');
      var words = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
      if (q.q.indexOf(words[q.c.length]) < 0) errors.push(where + 'stem does not say "' + words[q.c.length] + '"');
    }
  } else if (t === 'match') {
    if (!Array.isArray(q.o) || !Array.isArray(q.m) || !Array.isArray(q.c)) errors.push(where + 'match needs o, m, c arrays');
    else {
      if (q.c.length !== q.o.length) errors.push(where + 'match c length must equal o length');
      q.c.forEach(function (c) { if (!(isInt(c) && c >= 0 && c < q.m.length)) errors.push(where + 'bad match index ' + c); });
    }
  } else if (t === 'numeric') {
    if (typeof q.c !== 'number' || !isFinite(q.c)) errors.push(where + 'numeric answer must be a number');
  } else {
    errors.push(where + 'unknown type ' + t);
  }
});

var counts = {};
DOMAINS.forEach(function (d) { counts[d] = bank.filter(function (q) { return q.d === d; }).length; });
var ap = {};
APPROACHES.forEach(function (a) { ap[a] = bank.filter(function (q) { return q.ap === a; }).length; });
var types = {};
bank.forEach(function (q) { var t = q.t || 'single'; types[t] = (types[t] || 0) + 1; });

// Each domain must be able to fill its share of a full 180-question exam.
var need = { People: Math.round(180 * 0.33), Process: 180 - Math.round(180 * 0.33) - Math.round(180 * 0.26), Business: Math.round(180 * 0.26) };
DOMAINS.forEach(function (d) { if (counts[d] < need[d]) errors.push(d + ' has ' + counts[d] + ' questions; a full exam needs ' + need[d]); });

// Guard against the "pick the longest answer" cue that inflates practice scores.
var singles = bank.filter(function (q) { return (q.t || 'single') === 'single'; });
var longest = 0, clearlyLongest = [];
singles.forEach(function (q) {
  var lens = q.o.map(function (o) { return o.length; });
  var others = lens.filter(function (_, i) { return i !== q.c; });
  if (lens[q.c] === Math.max.apply(null, lens)) longest++;
  if (lens[q.c] > Math.max.apply(null, others) + 15) clearlyLongest.push(q.id);
});
var longestPct = Math.round(longest / singles.length * 100);
if (longestPct > 36) errors.push('correct answer is the longest option in ' + longestPct + '% of single-choice items (max 36%)');
if (clearlyLongest.length > singles.length * 0.05) errors.push('correct answer is longest by >15 chars in too many items: ' + clearlyLongest.join(', '));

// French translations: complete, structurally identical, and free of the same length cue.
var FR = ctx.window.PMP_FR || {};
var frMissing = [], frLongest = 0, frSingles = 0;
bank.forEach(function (q) {
  var tr = FR[q.id];
  if (!tr) { frMissing.push(q.id); return; }
  var where = q.id + ' (fr): ';
  if (!tr.q || !tr.e) errors.push(where + 'missing q or e');
  var t = q.t || 'single';
  if (t !== 'numeric') {
    if (!Array.isArray(tr.o) || tr.o.length !== q.o.length) errors.push(where + 'option count differs from English');
  } else if (tr.o) errors.push(where + 'numeric item must not have options');
  if (t === 'match' && (!Array.isArray(tr.m) || tr.m.length !== q.m.length)) errors.push(where + 'match list differs from English');
  (tr.o || []).forEach(function (o) { if (!o || typeof o !== 'string') errors.push(where + 'empty option'); });
  if (t === 'single' && Array.isArray(tr.o)) {
    frSingles++;
    var fl = tr.o.map(function (o) { return o.length; });
    if (fl[q.c] === Math.max.apply(null, fl)) frLongest++;
  }
});
Object.keys(FR).forEach(function (id) { if (!bank.some(function (q) { return q.id === id; })) errors.push(id + ' (fr): no English question with this id'); });
var frPct = frSingles ? Math.round(frLongest / frSingles * 100) : 0;
if (frFiles.length && frSingles && frPct > 36) errors.push('French: correct answer is the longest option in ' + frPct + '% of single-choice items (max 36%)');
var requireFr = process.argv.indexOf('--allow-missing-fr') < 0;
if (frMissing.length && requireFr) errors.push(frMissing.length + ' question(s) have no French translation, e.g. ' + frMissing.slice(0, 5).join(', '));

console.log('Questions:', bank.length, JSON.stringify(counts));
console.log('French: ' + (bank.length - frMissing.length) + '/' + bank.length + ' translated; correct is longest in ' + frPct + '% of translated single-choice items');
console.log('Answer-length cue: correct is longest in ' + longestPct + '% of single-choice items; clearly longest in ' + clearlyLongest.length);
console.log('Approach mix:', JSON.stringify(ap));
console.log('Item types:', JSON.stringify(types));
if (errors.length) {
  console.error('\n' + errors.length + ' problem(s):\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('OK - question bank is valid.');
