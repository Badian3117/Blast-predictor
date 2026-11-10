/* Copies the web tool into ./web and swaps Google Fonts for the bundled offline fonts. */
const fs = require("fs"), path = require("path");
const src = path.join(__dirname, ".."), out = path.join(__dirname, "web");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "fonts"), { recursive: true });
const files = ["index.html", "handbook.html", "content.js", "fr-1.js", "fr-2.js", "fr-3.js", "i18n.js", "illustrations.js"];
for (const f of files) {
  let s = fs.readFileSync(path.join(src, f), "utf8");
  if (f.endsWith(".html")) {
    s = s.replace(/<link rel="preconnect"[^>]*>\s*/g, "")
         .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/fonts.css">');
    if (s.includes("fonts.googleapis.com")) throw new Error(f + ": remote font link left");
  }
  fs.writeFileSync(path.join(out, f), s);
}
for (const f of fs.readdirSync(path.join(__dirname, "fonts"))) fs.copyFileSync(path.join(__dirname, "fonts", f), path.join(out, "fonts", f));
console.log("web/ ready:", files.length, "files + fonts");
