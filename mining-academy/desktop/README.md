# Bench to Boardroom — desktop edition

Offline Windows (and Linux) app built with Electron. It packages the same files as the web tool (`../index.html`,
`../handbook.html`, content, French translation, illustrations) with bundled fonts, so it runs on site computers
without internet.

## Use
1. Download `BenchToBoardroom-win-x64.zip` (GitHub Actions artifact, or the Release for an `academy-v*` tag).
2. Unzip anywhere (for example `C:\Training\`), open the folder and run **BenchToBoardroom.exe**.
3. Windows SmartScreen may warn because the app is not code-signed: choose *More info → Run anyway*.

Menu: **File** → Handbook window, Handbook PDF, Print (Ctrl+P). **Language** → English (Ctrl+Shift+E) / Français (Ctrl+Shift+F).
Progress is stored per Windows user on that computer.

## Build
```
cd mining-academy/desktop
npm ci
npm run build:win     # dist/BenchToBoardroom-win32-x64/BenchToBoardroom.exe
npm run build:linux   # dist/BenchToBoardroom-linux-x64/BenchToBoardroom
npm start             # run from source
```
`build.js` holds the packaging options (kept out of `package.json` scripts because `cmd.exe` mangles regex characters).
Fonts in `fonts/` are Barlow Condensed and IBM Plex (SIL Open Font License).
