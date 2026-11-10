# Bench to Boardroom — open-pit operations academy

A training programme that takes a junior engineer from **Engineer → Senior Engineer → Project Manager**
across six open-pit activities: load & haul, drilling, blasting, dewatering, crusher feed and grade control.

| File | What it is |
|---|---|
| `index.html` | Interactive tool (English / French switch in the top bar): animated pit section, 18 modules (course, field tips, graded exercise, field calculator), blast timing simulator, three 15-question exams (pass 80%), certificates. Progress is stored in the browser. |
| `handbook.html` | The same content as a bilingual A4 handbook: English, with the French translation in smaller italics under each block. |
| `Bench-to-Boardroom-Handbook.pdf` | Pre-rendered 101-page bilingual handbook with worked solutions, exam keys, formula sheet, EN–FR glossary. |
| `content.js` | Single source of truth for all courses, exercises, exams, glossary and references. Edit here; both views update. |
| `fr-1.js`, `fr-2.js`, `fr-3.js`, `i18n.js` | French translation (same structure as `content.js`) and the merge layer. |
| `desktop/` | Offline desktop edition (Electron): `BenchToBoardroom.exe` for Windows. See `desktop/README.md`. |
| `illustrations.js` | SVG scene library (section views, animated with SMIL, themed through CSS variables). |

Open `index.html` directly in a browser (no build step). To regenerate the PDF, print `handbook.html` to A4 with background graphics on.

Teaching values are typical of hard-rock gold pits in West Africa; site-approved designs, SOPs and national regulations take precedence.
