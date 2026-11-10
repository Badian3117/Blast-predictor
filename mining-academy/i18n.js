/* Bench to Boardroom — language layer.
   academyFor("fr") returns the English content with every translated string replaced by its French version
   (numbers, answers and formulas always come from content.js). */
(function () {
  function merge(en, fr) {
    if (fr === undefined || fr === null) return en;
    if (Array.isArray(en)) return en.map((x, i) => merge(x, Array.isArray(fr) ? fr[i] : undefined));
    if (en && typeof en === "object") { const o = {}; for (const k in en) o[k] = merge(en[k], fr[k]); return o; }
    if (typeof en === "string" && typeof fr === "string") return fr;
    return en;
  }
  window.academyFor = function (lang) { return lang === "fr" ? merge(window.ACADEMY, window.ACADEMY_FR || {}) : window.ACADEMY; };
})();
