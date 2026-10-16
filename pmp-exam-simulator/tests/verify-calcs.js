#!/usr/bin/env node
/* Recomputes every calculation-based answer key from first principles and compares it with the bank.
 * Run: node tests/verify-calcs.js */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ctx = { window: {} };
vm.createContext(ctx);
var dir = path.join(__dirname, '..', 'questions', 'en');
fs.readdirSync(dir).filter(function (f) { return /\.js$/.test(f); }).forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx);
});
var byId = {};
ctx.window.PMP_BANK.forEach(function (q) { byId[q.id] = q; });

// ---- formulas ----
var channels = function (n) { return n * (n - 1) / 2; };
var pert = function (o, m, p) { return (o + 4 * m + p) / 6; };
var pertSd = function (o, p) { return (p - o) / 6; };
// Forward pass over an activity network: acts = { A: [dur, [preds]] } -> { duration, float: { X: totalFloat } }
function cpm(acts) {
  var ids = Object.keys(acts), es = {}, ef = {}, ls = {}, lf = {};
  var done = function (x) { return ef[x] != null; };
  while (ids.some(function (x) { return !done(x); })) {
    ids.forEach(function (x) {
      if (done(x)) return;
      var preds = acts[x][1];
      if (preds.every(done)) {
        es[x] = preds.length ? Math.max.apply(null, preds.map(function (p) { return ef[p]; })) : 0;
        ef[x] = es[x] + acts[x][0];
      }
    });
  }
  var end = Math.max.apply(null, ids.map(function (x) { return ef[x]; }));
  var succ = function (x) { return ids.filter(function (y) { return acts[y][1].indexOf(x) >= 0; }); };
  var doneB = function (x) { return ls[x] != null; };
  while (ids.some(function (x) { return !doneB(x); })) {
    ids.forEach(function (x) {
      if (doneB(x)) return;
      var s = succ(x);
      if (s.every(doneB)) {
        lf[x] = s.length ? Math.min.apply(null, s.map(function (y) { return ls[y]; })) : end;
        ls[x] = lf[x] - acts[x][0];
      }
    });
  }
  var fl = {};
  ids.forEach(function (x) { fl[x] = ls[x] - es[x]; });
  return { duration: end, float: fl };
}
var net1 = cpm({ A: [3, []], B: [4, ['A']], C: [5, ['A']], D: [2, ['B']], E: [3, ['C', 'D']] });
var net2 = cpm({ A: [4, []], B: [6, ['A']], C: [3, ['A']], D: [5, ['C']], E: [2, ['B', 'D']] });
function fpif(targetCost, targetFee, sellerShare, ceiling, actual) {
  var fee = targetFee + sellerShare * (targetCost - actual);
  return Math.min(actual + fee, ceiling);
}
function cpif(estCost, targetFee, sellerShare, actual) {
  return actual + targetFee + sellerShare * (estCost - actual);
}

var expected = {
  PE012: channels(12) - channels(8),
  PE188: channels(15),
  PR013: net1.duration,
  PR014: net1.float.C,
  PR283: net2.duration,
  PR284: net2.float.B,
  PR019: pert(4, 7, 16),
  PR088: pertSd(6, 18),
  PR021: 240 / 30,
  PR026: 20 / 5,
  PR029: 200000 / 0.8,
  PR031: 50000 - 60000,
  PR034: (300 / 30) * 50000,
  PR050: 120000 + 10000,
  PR072: (0.4 * 500000) / 250000,
  PR098: 5 * 6 * 10 - 1 * 6 * 4,
  PR212: 2 / (2 + 8) * 100,
  PR222: (300 - 120) / 20,
  PR223: 200 / (30 - 10),
  PR224: 12 / 3,
  PR225: 6 * (10 - 2) * 6,
  PR226: 60000 / 30,
  PR285: fpif(200000, 20000, 0.2, 250000, 180000),
  PR286: cpif(100000, 10000, 0.3, 120000),
  PR287: 120000 - 150000,
  PR288: (100000 - 40000) / (100000 - 50000),
  PR289: 300000 - 360000,
  PR290: 70000 + 50000,
  BE017: 0.30 * -50000 + 0.20 * 20000,
  BE115: 0.20 * 50000 + 0.10 * 80000,
  BE116: 0.40 * 100000,
  BE119: 200000 / 50000,
  BE120: (150000 - 100000) / 100000 * 100,
  BE121: 300000 / 200000,
  BE122: 110000 / 1.10,
  BE125: 60000
};

// Calculation-based single-choice items: the keyed option must contain the computed figure.
var choice = {
  PR017: { want: 'Crash G by 2 days', calc: Math.min(4000 + 2500, 2500 * 2, 3000 * 2, 4000 + 3000) === 5000 },
  PR028: { want: 'Behind schedule and over budget', calc: 90000 / 100000 < 1 && 90000 / 110000 < 1 },
  PR071: { want: 'Ahead of schedule and over budget', calc: 1.2 > 1 && 0.8 < 1 },
  PR033: { want: '$850,000', calc: 800000 + 50000 === 850000 },
  PR069: { want: 'Bravo', calc: [20 / 10, 12 / 3, 30 / 15, 8 / 8].indexOf(Math.max(20 / 10, 12 / 3, 30 / 15, 8 / 8)) === 1 },
  PR107: { want: '0.89', calc: Math.round((80 / 200 * 400000) / 180000 * 100) / 100 === 0.89 },
  PR092: { want: 'About 29', calc: Math.round((25 + 31 + 28 + 32) / 4) === 29 },
  BE018: { want: 'Upgrade existing, with an expected net value of $46M', calc: (0.6 * 120 + 0.4 * 60 - 50) === 46 && (0.6 * 120 + 0.4 * 60 - 50) > (0.6 * 200 + 0.4 * 90 - 120) },
  BE069: { want: '2 weeks', calc: 0.25 * 8 === 2 }
};

var fails = 0, checked = 0;
Object.keys(expected).forEach(function (id) {
  var q = byId[id];
  checked++;
  if (!q) { console.log('MISSING ' + id); fails++; return; }
  var ok = Math.abs(q.c - expected[id]) <= (q.tol || 0) + 1e-9;
  if (!ok) { console.log('FAIL ' + id + ': key ' + q.c + ' but computed ' + expected[id]); fails++; }
});
Object.keys(choice).forEach(function (id) {
  var q = byId[id], ch = choice[id];
  checked++;
  if (!q) { console.log('MISSING ' + id); fails++; return; }
  var keyed = q.o[q.c];
  if (!ch.calc || keyed.indexOf(ch.want) !== 0) { console.log('FAIL ' + id + ': keyed "' + keyed + '"'); fails++; }
});
var numericInBank = ctx.window.PMP_BANK.filter(function (q) { return q.t === 'numeric'; }).map(function (q) { return q.id; });
var unverified = numericInBank.filter(function (id) { return !(id in expected); });
if (unverified.length) { console.log('FAIL numeric items without an independent check: ' + unverified.join(', ')); fails++; }

console.log(checked + ' calculation answers recomputed; ' + (fails ? fails + ' problem(s)' : 'all match'));
process.exit(fails ? 1 : 0);
