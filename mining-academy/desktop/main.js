/* Bench to Boardroom — offline desktop edition. */
const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const WEB = path.join(__dirname, "web");
const ICON = path.join(__dirname, "build", "icon.png");
const pdfPath = () => {
  const packed = path.join(process.resourcesPath, "Bench-to-Boardroom-Handbook.pdf");
  return fs.existsSync(packed) ? packed : path.join(__dirname, "..", "Bench-to-Boardroom-Handbook.pdf");
};
const secure = { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false };

function guard(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("file:") && url.includes("handbook.html")) { openHandbook(); return { action: "deny" }; }
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file:")) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });
}

let main, handbook;
function createMain() {
  main = new BrowserWindow({ width: 1320, height: 900, minWidth: 420, minHeight: 500, title: "Bench to Boardroom", icon: ICON, backgroundColor: "#eef0ec", webPreferences: secure });
  guard(main);
  main.loadFile(path.join(WEB, "index.html"));
}
function openHandbook() {
  if (handbook && !handbook.isDestroyed()) { handbook.focus(); return; }
  handbook = new BrowserWindow({ width: 980, height: 900, title: "Bench to Boardroom — Handbook / Manuel", icon: ICON, webPreferences: secure });
  guard(handbook);
  handbook.loadFile(path.join(WEB, "handbook.html"));
}
const setLang = lang => { if (main && !main.isDestroyed()) main.webContents.executeJavaScript(`document.querySelector('.lang button[data-lang="${lang}"]')?.click()`); };

function menu() {
  const tpl = [
    { label: "File / Fichier", submenu: [
      { label: "Handbook / Manuel", accelerator: "CmdOrCtrl+H", click: openHandbook },
      { label: "Handbook PDF / Manuel PDF", click: async () => { const err = await shell.openPath(pdfPath()); if (err) dialog.showErrorBox("PDF", err); } },
      { type: "separator" },
      { label: "Print… / Imprimer…", accelerator: "CmdOrCtrl+P", click: (_, w) => (w || main).webContents.print({ printBackground: true }) },
      { type: "separator" },
      { role: "quit", label: "Quit / Quitter" } ] },
    { label: "Language / Langue", submenu: [
      { label: "English", accelerator: "CmdOrCtrl+Shift+E", click: () => setLang("en") },
      { label: "Français", accelerator: "CmdOrCtrl+Shift+F", click: () => setLang("fr") } ] },
    { label: "View / Affichage", submenu: [
      { role: "reload" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" } ] },
    { label: "Help / Aide", submenu: [
      { label: "About / À propos", click: () => dialog.showMessageBox({ type: "info", title: "Bench to Boardroom", icon: ICON,
        message: "Bench to Boardroom " + app.getVersion(),
        detail: "Open-pit operations academy — Engineer · Senior Engineer · Project Manager.\nAcadémie des opérations à ciel ouvert — Ingénieur · Ingénieur senior · Chef de projet.\n\nWorks offline. Progress is saved on this computer.\nFonctionne hors ligne. La progression est enregistrée sur cet ordinateur." }) } ] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => { if (main) { if (main.isMinimized()) main.restore(); main.focus(); } });
app.whenReady().then(() => { menu(); createMain(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createMain(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
