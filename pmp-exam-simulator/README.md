# PMP Practice Exam Simulator (English / Français)

A browser-based practice exam that reproduces the **computer-based testing experience of the PMP exam** under the
**July 2026 Examination Content Outline (ECO)**. It needs no install, server or internet connection, and is fully
bilingual: switch between **English and French** at any time with the EN / FR button. You can switch even mid-exam, and your answers are kept.

## Run it

Open `index.html` in any modern browser (double-click it). Every launch draws a **new random exam**. Questions you have
not seen recently are served first, and the answer options are reshuffled every time.

## What mirrors the real exam

| Real exam (July 2026 ECO) | Simulator |
|---|---|
| 180 questions, 240 minutes | Full exam form: 180 questions, 240:00 clock (80 s per question) |
| People 33% / Process 41% / Business Environment 26% | Questions drawn to the same domain weights (59 / 74 / 47) |
| ~40% predictive, ~60% agile + hybrid | Mix balanced inside each domain (freshness takes priority when pools run low) |
| 3 sections, 2 optional 10-minute breaks; a closed section cannot be reopened | Same; the exam clock is paused during breaks |
| Flag for review, review screen (all / incomplete / flagged), calculator, highlighter, strikethrough | All included, plus keyboard shortcuts (Alt+N, Alt+P, Alt+F, Alt+R) |
| Multiple choice, multiple response, matching, fill-in-the-blank, graphic/table-based | All supported (hotspot items are not yet implemented) |
| Exam available in several languages | English and French interface and questions |
| Unanswered = incorrect; exam ends automatically at 0:00:00 | Same |

Shorter forms (90, 60 and 30 questions, with time scaled to match) and single-domain drills are available for study sessions.

## Question bank

**540 original questions**, each with an explanation and a full French translation:

| Domain | Questions | Predictive | Agile / Hybrid |
|---|---|---|---|
| People | 177 | 58 | 119 |
| Process | 222 | 86 | 136 |
| Business Environment | 141 | 54 | 87 |

That is enough for **three consecutive full 180-question exams with no repeated question**. From the fourth exam, the
least recently seen questions return first.

Item types: 471 single answer, 19 multiple response, 14 matching, 36 numeric calculation.

English files live in `questions/en/` and the matching French translations in `questions/fr/` (same ids, same option order).

## Results report

- Overall score and an overall rating.
- Performance by domain in PMI-style bands (Needs Improvement / Below Target / Target / Above Target) and by delivery approach.
- **Every incorrect or unanswered question**, showing your answer and the **correct answer underneath it**, plus an explanation.
  Tabs also show flagged questions and all questions. The report can be switched between English and French.
- Print or save as PDF, plus score history on this device.

PMI does not publish a passing percentage. The bands here use practice thresholds (Above Target ≥ 80%, Target 65–79%,
Below Target 50–64%, Needs Improvement < 50%).

## Quality checks

```bash
node tests/validate-bank.js   # structure, answer keys, domain/approach coverage, French completeness, answer-length bias guard
node tests/verify-calcs.js    # recomputes all 45 calculation answers (EVM, PERT, CPM, contracts, EMV, finance) independently
node tests/e2e.mjs [shotDir]  # full browser run-through, including French switching and 3 non-repeating exams (needs Playwright)
```

The validator fails if the correct option is the longest choice in more than 36% of single-answer items, in either
language. That cue would inflate practice scores.

## Limitations

- The questions are original practice items written to the PMI mindset, not actual exam content. A review by a
  PMP-certified subject-matter expert is still recommended before relying on scores for high-stakes decisions.
- From the third consecutive full exam onward the predictive share drifts below 40%. The bank has fewer predictive
  items than three full exams would need, and the engine prefers fresh questions over an exact mix.
- History, language choice and the "seen questions" record are stored in the browser's local storage on this device only.

Independent study tool. Not affiliated with, endorsed by or sponsored by PMI or Pearson VUE. PMP and PMI are registered marks of
the Project Management Institute, Inc.
