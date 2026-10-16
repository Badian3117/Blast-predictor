// End-to-end test (requires Playwright): node tests/e2e.mjs [screenshotDir]
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

// createRequire honours NODE_PATH, so a globally installed Playwright also works.
const { chromium } = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(here, '..', 'index.html');
const shots = process.argv[2];
let failures = 0;
const check = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };
const shot = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, name) }); };

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, locale: 'en-US' });
page.on('pageerror', (e) => { console.log('PAGE ERROR', e.message); failures++; });
page.on('dialog', (d) => d.accept());

async function start(mode) {
  await page.goto(url);
  await page.fill('#cand-name', 'Test Candidate');
  await page.check(`input[name=mode][value=${mode}]`);
  await page.click('#btn-start');
  await page.click('#btn-tutorial-next');
  await page.click('#btn-agree');
}
const state = () => page.evaluate(() => {
  const e = window.PMPSim.state();
  return { cur: e.cur, sec: e.sec, n: e.items.length, secs: e.sections.length, total: e.totalSec, remaining: e.remaining };
});
const ids = () => page.evaluate(() => window.PMPSim.state().items.map((it) => it.q.id));
const mix = () => page.evaluate(() => {
  const r = { People: 0, Process: 0, Business: 0, Predictive: 0 };
  window.PMPSim.state().items.forEach((it) => { r[it.q.d]++; if (it.q.ap === 'Predictive') r.Predictive++; });
  return r;
});

// Answer the current question: correct when `right`, deliberately wrong otherwise.
async function answer(right) {
  const info = await page.evaluate(() => {
    const ex = window.PMPSim.state(); const q = ex.items[ex.cur].q;
    return { t: q.t || 'single', c: q.c, n: (q.o || []).length, m: (q.m || []).length };
  });
  if (info.t === 'single') {
    await page.click(`#answers input[value="${right ? info.c : (info.c + 1) % info.n}"]`);
  } else if (info.t === 'multi') {
    const vals = right ? info.c : [...Array(info.n).keys()].filter((i) => !info.c.includes(i)).slice(0, info.c.length);
    for (const v of vals) await page.click(`#answers input[value="${v}"]`);
  } else if (info.t === 'match') {
    for (const s of await page.$$('#answers select')) {
      const li = Number(await s.getAttribute('data-left'));
      await s.selectOption(String(right ? info.c[li] : (info.c[li] + 1) % info.m));
    }
  } else {
    await page.fill('#answers input', String(right ? info.c : info.c + 7));
  }
}

// ---------- Exam 1: full exam, 3 sections, breaks, language switching, scoring ----------
await start('full');
let st = await state();
check(st.n === 180 && st.secs === 3 && st.total === 240 * 60, `full exam: 180 Q / 3 sections / 240 min (${JSON.stringify(st)})`);
let m = await mix();
check(m.People === 59 && m.Process === 74 && m.Business === 47, `domain mix 59/74/47 (${JSON.stringify(m)})`);
check(m.Predictive >= 68 && m.Predictive <= 76, `predictive share about 40% (${m.Predictive}/180)`);
const t0 = await page.textContent('#time-left');
check(/^3:59:5\d$|^4:00:00$/.test(t0), `clock starts at ~4:00:00 (${t0})`);
await shot('1-question-en.png');

await page.click('#flag-cb');
check(await page.evaluate(() => window.PMPSim.state().flag[0]), 'flag for review sets the flag');
await page.click('#tool-calc');
for (const k of ['1', '2', '0', '0', '0', '0', '/', '0', '.', '8', '=']) await page.click(`#calc-keys [data-k="${k}"]`);
check((await page.textContent('#calc-display')) === '150000', 'calculator: 120000 / 0.8 = 150000');
await page.click('#calc-close');

let expectedCorrect = 0;
const plan = [];
for (let s = 0; s < 3; s++) {
  for (let i = 0; i < 60; i++) {
    const g = s * 60 + i;
    const mode = g % 5 === 0 ? 'wrong' : g % 11 === 0 ? 'skip' : 'right';
    plan.push(mode);
    if (mode !== 'skip') await answer(mode === 'right');
    if (mode === 'right') expectedCorrect++;

    if (g === 3) {
      // Switch to French mid-exam: same question, translated text, answer kept.
      const before = await page.evaluate(() => { const e = window.PMPSim.state(); return { a: JSON.stringify(e.ans[e.cur]), id: e.items[e.cur].q.id }; });
      await page.click('.lang-switch button[data-lang="fr"]');
      const after = await page.evaluate(() => {
        const e = window.PMPSim.state(); const id = e.items[e.cur].q.id;
        return { a: JSON.stringify(e.ans[e.cur]), stem: document.querySelector('#stem').innerHTML, fr: window.PMP_FR[id].q, next: document.querySelector('#btn-next').textContent, lang: document.documentElement.lang };
      });
      check(after.lang === 'fr' && after.stem === after.fr, `switching to FR shows the French translation of ${before.id}`);
      check(after.a === before.a, 'answer is preserved when switching language');
      check(after.next.includes('Suivant'), `interface labels switch to French ("${after.next.trim()}")`);
      await shot('2-question-fr.png');
      await page.click('.lang-switch button[data-lang="en"]');
    }
    await page.click('#btn-next');
  }
  check(await page.isVisible('#screen-review'), `section ${s + 1}: Next on the last question opens the Review Screen`);
  if (s === 0) {
    await page.click('#btn-rev-inc');
    const cur = await page.evaluate(() => window.PMPSim.state().cur);
    check(plan[cur] === 'skip', 'Review Incomplete jumps to an unanswered question');
    await page.click('#btn-review');
    await shot('3-review.png');
  }
  await page.click('#btn-end-section');
  await page.click('#modal-foot .btn.primary');
  if (s < 2) {
    check(await page.isVisible('#screen-break'), `break offered after section ${s + 1}`);
    const before = (await state()).remaining;
    await page.click('#btn-take-break');
    await page.waitForTimeout(1500);
    check(before === (await state()).remaining, 'exam clock is paused during the break');
    await page.click('#btn-end-break');
    st = await state();
    check(st.cur === (s + 1) * 60 && st.sec === s + 1, `section ${s + 2} starts at question ${(s + 1) * 60 + 1}`);
    check(await page.isDisabled('#btn-prev'), 'cannot go back into a closed section');
  }
}
check(await page.isVisible('#screen-results'), 'results screen shown after the last section');
const scoreTxt = await page.textContent('.score-big small');
check(scoreTxt.startsWith(expectedCorrect + ' of 180'), `score "${scoreTxt}" matches expected ${expectedCorrect}`);
const wrongCards = await page.$$eval('#rq-list .rq', (els) => els.length);
check(wrongCards === 180 - expectedCorrect, `incorrect/unanswered list has ${wrongCards} cards (expected ${180 - expectedCorrect})`);
const order = await page.$eval('#rq-list .rq', (c) => [...c.querySelectorAll('.ans-box')].map((b) => b.className));
check(order.length === 2 && /yours/.test(order[0]) && /correct/.test(order[1]), 'each wrong item shows your answer, then the correct answer underneath');
check(await page.$$eval('#rq-list .rq .explain', (e) => e.length) === wrongCards, 'every reviewed item has an explanation');
await shot('4-results-en.png');
await page.click('.lang-switch button[data-lang="fr"]');
const frLabels = await page.$$eval('#rq-list .ans-box .lbl', (els) => els.slice(0, 2).map((e) => e.textContent));
check(frLabels[0] === 'Votre réponse' && frLabels[1] === 'Bonne réponse', `results re-render in French (${frLabels.join(' / ')})`);
check(await page.$$eval('#rq-list .rq', (els) => els.length) === wrongCards, 'French results keep the same review list');
await page.evaluate(() => document.querySelector('#rq-list').scrollIntoView());
await shot('5-wrong-answers-fr.png');
await page.click('.lang-switch button[data-lang="en"]');

// ---------- French numeric input ----------
const parsed = await page.evaluate(() => [window.PMPSim.parseNum('0,8'), window.PMPSim.parseNum('250 000'), window.PMPSim.parseNum('$250,000'), window.PMPSim.parseNum('-10 000'), window.PMPSim.parseNum('1,5')]);
check(JSON.stringify(parsed) === JSON.stringify([0.8, 250000, 250000, -10000, 1.5]), `numeric answers accept French and English formats (${parsed.join(', ')})`);

// ---------- Exams 2 and 3: no question repeats across three consecutive full exams ----------
const seenSets = [await ids()];
for (let k = 2; k <= 3; k++) {
  await start('full');
  seenSets.push(await ids());
  m = await mix();
  check(m.People === 59 && m.Process === 74 && m.Business === 47, `exam ${k}: domain mix 59/74/47`);
}
const all = seenSets.flat();
check(new Set(all).size === 540, `three consecutive full exams use 540 different questions (${new Set(all).size} unique)`);
await start('full');
const fourth = await ids();
const oldest = new Set(seenSets[0]);
check(fourth.every((id) => oldest.has(id)), 'the 4th exam reuses the least recently seen questions (from exam 1)');

// ---------- Language preference persists across reloads ----------
await page.click('.lang-switch button[data-lang="fr"]');
await page.goto(url);
check((await page.textContent('#btn-start')).trim() === 'Commencer', 'language choice is remembered after reopening');

// ---------- Mobile layout ----------
await page.setViewportSize({ width: 390, height: 800 });
check(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), 'no horizontal scrolling at phone width (welcome)');
await start('sprint');
check(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), 'no horizontal scrolling at phone width (exam)');
await shot('6-mobile-fr.png');

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
