// End-to-end smoke test (requires Playwright): node tests/e2e.mjs [screenshotDir]
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

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
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
const ids = () => page.evaluate(() => window.PMPSim.state().items.map((it) => it.q.id));

// Answer the current question: correct when `right`, deliberately wrong otherwise.
async function answer(right) {
  const info = await page.evaluate(() => {
    const ex = window.PMPSim.state(); const q = ex.items[ex.cur].q;
    return { t: q.t || 'single', c: q.c, n: (q.o || []).length, m: (q.m || []).length };
  });
  if (info.t === 'single') {
    const v = right ? info.c : (info.c + 1) % info.n;
    await page.click(`#answers input[value="${v}"]`);
  } else if (info.t === 'multi') {
    const vals = right ? info.c : [...Array(info.n).keys()].filter((i) => !info.c.includes(i)).slice(0, info.c.length);
    for (const v of vals) await page.click(`#answers input[value="${v}"]`);
  } else if (info.t === 'match') {
    const sels = await page.$$('#answers select');
    for (const s of sels) {
      const li = await page.evaluate((el) => {
        const ex = window.PMPSim.state(); const q = ex.items[ex.cur].q;
        return q.o.indexOf(el.getAttribute('aria-label').replace('Match for: ', ''));
      }, s);
      const target = right ? info.c[li] : (info.c[li] + 1) % info.m;
      await s.selectOption(String(target));
    }
  } else {
    await page.fill('#answers input', String(right ? info.c : info.c + 7));
  }
}

// ---------- Full exam: 180 questions, 3 sections, break, scoring ----------
await start('full');
let st = await page.evaluate(() => { const e = window.PMPSim.state(); return { n: e.items.length, secs: e.sections.length, total: e.totalSec }; });
check(st.n === 180 && st.secs === 3 && st.total === 240 * 60, `full exam has 180 Q / 3 sections / 240 min (${JSON.stringify(st)})`);
const dist = await page.evaluate(() => {
  const r = { People: 0, Process: 0, Business: 0, Predictive: 0 };
  window.PMPSim.state().items.forEach((it) => { r[it.q.d]++; if (it.q.ap === 'Predictive') r.Predictive++; });
  return r;
});
check(dist.People === 59 && dist.Process === 74 && dist.Business === 47, `domain mix 59/74/47 (${JSON.stringify(dist)})`);
check(dist.Predictive >= 66 && dist.Predictive <= 78, `predictive share about 40% (${dist.Predictive}/180)`);
const t0 = await page.textContent('#time-left');
check(/^3:59:5\d$|^4:00:00$/.test(t0), `clock starts at ~4:00:00 (${t0})`);
if (shots) await page.screenshot({ path: path.join(shots, '1-question.png') });

// Tools: flag, strikethrough, calculator.
await page.click('#flag-cb');
check(await page.evaluate(() => window.PMPSim.state().flag[0]), 'flag for review sets the flag');
const firstType = await page.evaluate(() => window.PMPSim.state().items[0].q.t || 'single');
if (firstType === 'single' || firstType === 'multi') {
  await page.click('#answers .opt >> nth=1', { button: 'right' });
  check(await page.$('#answers .opt.struck') !== null, 'right-click strikes out an option');
  await page.click('#answers .opt >> nth=1', { button: 'right' });
}
await page.click('#tool-calc');
for (const k of ['1', '2', '0', '0', '0', '0', '/', '0', '.', '8', '=']) await page.click(`#calc-keys [data-k="${k}"]`);
check((await page.textContent('#calc-display')) === '150000', 'calculator: 120000 / 0.8 = 150000');
if (shots) await page.screenshot({ path: path.join(shots, '2-tools.png') });
await page.click('#calc-close');

let expectedCorrect = 0;
const plan = []; // per question: 'right' | 'wrong' | 'skip'
for (let s = 0; s < 3; s++) {
  for (let i = 0; i < 60; i++) {
    const g = s * 60 + i;
    const mode = g % 5 === 0 ? 'wrong' : g % 11 === 0 ? 'skip' : 'right';
    plan.push(mode);
    if (mode !== 'skip') await answer(mode === 'right');
    if (mode === 'right') expectedCorrect++;
    await page.click('#btn-next');
  }
  check(await page.isVisible('#screen-review'), `section ${s + 1}: Next on last question opens the Review Screen`);
  if (s === 0) {
    const sum = await page.textContent('#review-summary');
    check(/incomplete/.test(sum), `review summary shown (${sum})`);
    if (shots) await page.screenshot({ path: path.join(shots, '3-review.png') });
    await page.click('#btn-rev-inc');
    const cur = await page.evaluate(() => window.PMPSim.state().cur);
    check(plan[cur] === 'skip', 'Review Incomplete jumps to an unanswered question');
    await page.click('#btn-review');
  }
  await page.click('#btn-end-section');
  await page.click('#modal-foot .btn.primary');
  if (s < 2) {
    check(await page.isVisible('#screen-break'), `break offered after section ${s + 1}`);
    const before = await page.evaluate(() => window.PMPSim.state().remaining);
    await page.click('#btn-take-break');
    await page.waitForTimeout(1500);
    const during = await page.evaluate(() => window.PMPSim.state().remaining);
    check(before === during, 'exam clock is paused during the break');
    if (s === 0 && shots) await page.screenshot({ path: path.join(shots, '4-break.png') });
    await page.click('#btn-end-break');
    const sec = await page.evaluate(() => window.PMPSim.state());
    check(sec.cur === (s + 1) * 60 && sec.sec === s + 1, `section ${s + 2} starts at question ${(s + 1) * 60 + 1}`);
    check(await page.isDisabled('#btn-prev'), 'cannot go back into a closed section');
  }
}
check(await page.isVisible('#screen-results'), 'results screen shown after last section');
const scoreTxt = await page.textContent('.score-big small');
check(scoreTxt.startsWith(expectedCorrect + ' of 180'), `score ${scoreTxt} matches expected ${expectedCorrect}`);
const wrongCards = await page.$$eval('#rq-list .rq', (els) => els.length);
check(wrongCards === 180 - expectedCorrect, `incorrect/unanswered list has ${wrongCards} cards (expected ${180 - expectedCorrect})`);
const order = await page.$eval('#rq-list .rq', (c) => [...c.querySelectorAll('.ans-box')].map((b) => b.className));
check(order.length === 2 && /yours/.test(order[0]) && /correct/.test(order[1]), 'each wrong item shows your answer, then the correct answer underneath');
check(await page.$$eval('#rq-list .rq .explain', (e) => e.length) === wrongCards, 'every reviewed item has an explanation');
if (shots) {
  await page.screenshot({ path: path.join(shots, '5-results.png'), fullPage: false });
  await page.evaluate(() => document.querySelector('#rq-list').scrollIntoView());
  await page.screenshot({ path: path.join(shots, '6-wrong-answers.png') });
}
const firstIds = await ids();

// ---------- Re-open: questions must change ----------
await start('quick');
const q1 = await ids();
await page.evaluate(() => window.removeEventListener('beforeunload', () => {}));
await start('quick');
const q2 = await ids();
const overlap = q1.filter((id) => q2.includes(id)).length;
check(overlap === 0, `two consecutive 60-question launches share ${overlap} questions (expected 0)`);
const notInFull = q1.filter((id) => !firstIds.includes(id)).length;
check(notInFull > 0, `next launch after a full exam prioritizes unseen questions (${notInFull}/60 unseen)`);

// ---------- Mobile layout ----------
await page.setViewportSize({ width: 390, height: 800 });
const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check(!hscroll, 'no horizontal scrolling at phone width');
if (shots) await page.screenshot({ path: path.join(shots, '7-mobile.png') });

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
