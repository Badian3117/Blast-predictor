/* Cross-platform packaging: node build.js win32|linux|darwin  (options live here, not in npm scripts,
   because cmd.exe on Windows mangles regex characters such as ^ in package.json scripts). */
const { packager } = require("@electron/packager");
const path = require("path");
require("./prepare.js");
const platform = process.argv[2] || process.platform;
(async () => {
  const out = await packager({
    dir: __dirname,
    name: "BenchToBoardroom",
    platform, arch: "x64",
    out: path.join(__dirname, "dist"),
    overwrite: true,
    asar: true,
    icon: path.join(__dirname, "build", platform === "darwin" ? "icon.png" : "icon.ico"),
    extraResource: [path.join(__dirname, "..", "Bench-to-Boardroom-Handbook.pdf")],
    ignore: [/^\/dist($|\/)/, /^\/fonts($|\/)/, /^\/README\.md$/, /^\/build\.js$/, /^\/prepare\.js$/, /^\/\.gitignore$/],
    appCopyright: "Bench to Boardroom",
    win32metadata: { CompanyName: "Bench to Boardroom", FileDescription: "Bench to Boardroom", ProductName: "Bench to Boardroom" }
  });
  console.log("Built:", out.join(", "));
})().catch(e => { console.error(e); process.exit(1); });
