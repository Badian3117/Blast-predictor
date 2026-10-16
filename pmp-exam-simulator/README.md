# PMP Practice Exam Simulator

A browser-based practice exam that reproduces the **computer-based testing experience of the PMP exam** under the
**July 2026 Examination Content Outline (ECO)**. It needs no install, server or internet connection.

## Run it

Open `index.html` in any modern browser (double-click it). Every launch draws a **new random exam**, and questions you
have not seen recently are served first.

## What mirrors the real exam

| Real exam (July 2026 ECO) | Simulator |
|---|---|
| 180 questions, 240 minutes | Full exam form: 180 questions, 240:00 clock (80 s per question) |
| People 33% / Process 41% / Business Environment 26% | Questions drawn to the same domain weights (59 / 74 / 47) |
| ~40% predictive, ~60% agile + hybrid | Selection balances the delivery-approach mix inside each domain |
| 3 sections, 2 optional 10-minute breaks; a closed section cannot be reopened | Same; the exam clock is paused during breaks |
| Flag for review, review screen (all / incomplete / flagged), calculator, highlighter, strikethrough | All included, plus keyboard shortcuts (Alt+N, Alt+P, Alt+F, Alt+R) |
| Multiple choice, multiple response, matching, fill-in-the-blank, graphic/table-based | All supported (hotspot items are not yet implemented) |
| Unanswered = incorrect; exam ends automatically at 0:00:00 | Same |

Shorter forms (90, 60 and 30 questions, with time scaled to match) and single-domain drills are available for study sessions.

## Results report

- Overall score (%) and an overall rating.
- Performance by domain in PMI-style bands (Needs Improvement / Below Target / Target / Above Target) and by delivery approach.
- **Every incorrect or unanswered question**, showing your answer and the **correct answer underneath it**, plus an explanation.
  Tabs also show flagged questions and all questions.
- Print or save as PDF, plus score history on this device.

PMI does not publish a passing percentage. The bands here use practice thresholds (Above Target ≥ 80%, Target 65–79%,
Below Target 50–64%, Needs Improvement < 50%).

## Question bank

`questions/people.js`, `questions/process.js` and `questions/business.js` contain **266 original practice questions**, each with an
explanation. They are written for the PMI mindset (servant leadership, value delivery, tailoring, governance) and are
**not** actual exam content. To add questions, append objects using the schema documented at the top of `js/app.js`, then run:

```bash
node tests/validate-bank.js   # structure, answer keys, domain coverage, and "longest answer" bias guard
node tests/e2e.mjs [shotDir]  # full browser run-through (needs Playwright)
```

The validator fails if the correct option is the longest choice too often, a cue that inflates practice scores.

## Limitations

- With 266 questions, two consecutive full 180-question exams will overlap. Shorter forms rotate with no overlap until
  the unseen pool runs out. A larger bank (1,000+) is the most valuable next improvement.
- History and the "seen questions" record are stored in the browser's local storage on this device only.

Independent study tool. Not affiliated with, endorsed by or sponsored by PMI or Pearson VUE. PMP and PMI are registered marks of
the Project Management Institute, Inc.
