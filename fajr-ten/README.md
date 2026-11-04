# Fajr Ten

A six-month daily Islam learning app (10 minutes each morning, 6:30–6:40), in French and English, installable on Android as a Progressive Web App.

- `index.html` — the whole app (lessons, Qur'an passages, alarm, timer, progress).
- `manifest.webmanifest`, `icons/` — install metadata and icons.
- `sw.js` — service worker: works offline after the first visit.

Once GitHub Pages serves this repository from `main`, the app is at
`https://badian3117.github.io/Blast-predictor/fajr-ten/`.

## Install on Android (Pixel)

1. Open the address above in **Chrome**.
2. Tap **Installer** in the app header, or Chrome menu ⋮ → **Install app** / **Ajouter à l'écran d'accueil**.
3. Open Fajr Ten from the home screen once while online; after that it works offline.

## Sources

Qur'an text: Uthmani script (King Fahd Complex, via quranenc.com); translations Saheeh International (EN) and Muhammad Hamidullah (FR); transliteration tanzil.net — packaged by `quran-json` 3.1.2 (MIT). Hadith references point to sunnah.com. Lessons were compiled with AI assistance; verify a narration on its linked source before quoting it.
