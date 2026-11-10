/* Bench to Boardroom — illustration library.
   Every scene is an inline SVG string coloured through CSS custom properties
   (--sky, --lat, --sap, --rock, --rock2, --ore, --mach, --machd, --steel, --tyre,
    --water, --flash, --dust, --ink, --muted, --road, --hg, --mg, --lg, --waste),
   so it follows the page theme. Animations are SMIL; pages pause them for reduced motion. */
(function () {
  const S = { lang: "en" };
  const L = (en, fr) => (S.lang === "fr" ? fr : en);
  const svg = (w, h, label, inner) =>
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" class="scene">${inner}</svg>`;
  const T = (x, y, t, cls = "lbl", anchor = "start") => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${t}</text>`;
  const dimV = (x, y1, y2, t) => `<g class="dim"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x - 4}" y1="${y1}" x2="${x + 4}" y2="${y1}"/><line x1="${x - 4}" y1="${y2}" x2="${x + 4}" y2="${y2}"/></g>${T(x + 7, (y1 + y2) / 2 + 4, t, "lbl dimt")}`;
  const dimH = (x1, x2, y, t) => `<g class="dim"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 4}" x2="${x1}" y2="${y + 4}"/><line x1="${x2}" y1="${y - 4}" x2="${x2}" y2="${y + 4}"/></g>${T((x1 + x2) / 2, y - 6, t, "lbl dimt", "middle")}`;

  /* ---------- machines (origin = ground contact, facing right unless flipped) ---------- */
  function truck(x, y, s = 1, loaded = true, flip = false, extra = "") {
    const sx = flip ? -s : s;
    return `<g transform="translate(${x},${y}) scale(${sx},${s})" ${extra}>
      <rect x="4" y="-17" width="62" height="6" fill="var(--machd)"/>
      <polygon points="2,-36 52,-36 50,-17 8,-17" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <polygon points="50,-36 68,-36 68,-33 50,-33" fill="var(--mach)"/>
      <rect x="53" y="-31" width="14" height="15" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <rect x="57" y="-29" width="8" height="6" fill="var(--sky)"/>
      ${loaded ? `<polygon points="5,-36 14,-46 28,-49 42,-45 50,-36" fill="var(--rock)" stroke="var(--rockline)" stroke-width="0.8"/>` : ""}
      <circle cx="16" cy="-7" r="7.5" fill="var(--tyre)"/><circle cx="16" cy="-7" r="3" fill="var(--steel)"/>
      <circle cx="56" cy="-7" r="7.5" fill="var(--tyre)"/><circle cx="56" cy="-7" r="3" fill="var(--steel)"/>
    </g>`;
  }
  function excavator(x, y, s = 1, animate = true) {
    const arm = `<g>
        <polygon points="14,-30 20,-26 -26,-66 -32,-62" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
        <polygon points="-32,-64 -26,-66 -48,-22 -54,-24" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
        <polygon points="-56,-26 -44,-22 -46,-10 -62,-12" fill="var(--machd)"/>
        ${animate ? `<animateTransform attributeName="transform" type="rotate" values="0 16 -28;-14 16 -28;-14 16 -28;6 16 -28;0 16 -28" keyTimes="0;0.3;0.5;0.8;1" dur="4s" repeatCount="indefinite"/>` : ""}
      </g>`;
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="-4" y="-11" width="64" height="11" rx="5.5" fill="var(--tyre)"/>
      <circle cx="3" cy="-5.5" r="3" fill="var(--steel)"/><circle cx="53" cy="-5.5" r="3" fill="var(--steel)"/>
      <rect x="2" y="-32" width="52" height="21" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <rect x="38" y="-46" width="16" height="15" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <rect x="42" y="-43" width="9" height="7" fill="var(--sky)"/>
      <rect x="2" y="-30" width="10" height="17" fill="var(--machd)"/>
      ${arm}
    </g>`;
  }
  function drillRig(x, y, s = 1, holeDepth = 0, animate = true) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="0" y="-10" width="56" height="10" rx="5" fill="var(--tyre)"/>
      <rect x="4" y="-30" width="46" height="20" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <rect x="6" y="-44" width="16" height="14" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <rect x="9" y="-41" width="10" height="6" fill="var(--sky)"/>
      <rect x="44" y="-112" width="8" height="112" fill="var(--machd)"/>
      <path d="M44,-108 L52,-98 M44,-94 L52,-84 M44,-80 L52,-70 M44,-66 L52,-56 M44,-52 L52,-42 M44,-38 L52,-28" stroke="var(--mach)" stroke-width="1.2"/>
      <rect x="42" y="-74" width="12" height="10" fill="var(--steel)">${animate ? `<animate attributeName="y" values="-104;-20;-104" dur="9s" repeatCount="indefinite"/>` : ""}</rect>
      <line x1="48" y1="-100" x2="48" y2="${holeDepth}" stroke="var(--steel)" stroke-width="2.4" stroke-dasharray="5 3">${animate ? `<animate attributeName="stroke-dashoffset" values="0;-16" dur="0.5s" repeatCount="indefinite"/>` : ""}</line>
      <polygon points="38,0 48,-5 58,0" fill="var(--dust)"/>
      ${animate ? [0, 0.6, 1.2].map(d => `<circle cx="48" cy="-4" r="3" fill="var(--dust)" opacity="0.7"><animate attributeName="r" values="3;14" dur="1.8s" begin="${d}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="1.8s" begin="${d}s" repeatCount="indefinite"/><animate attributeName="cy" values="-4;-22" dur="1.8s" begin="${d}s" repeatCount="indefinite"/></circle>`).join("") : ""}
    </g>`;
  }
  function rcRig(x, y, s = 1, animate = true) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="0" y="-16" width="70" height="7" fill="var(--machd)"/>
      <rect x="52" y="-32" width="18" height="16" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <rect x="56" y="-29" width="10" height="6" fill="var(--sky)"/>
      <rect x="4" y="-30" width="44" height="14" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <g transform="rotate(-30 20 -18)">
        <rect x="16" y="-112" width="7" height="96" fill="var(--machd)"/>
        <line x1="19.5" y1="-108" x2="19.5" y2="22" stroke="var(--steel)" stroke-width="2" stroke-dasharray="5 3">${animate ? `<animate attributeName="stroke-dashoffset" values="0;-16" dur="0.5s" repeatCount="indefinite"/>` : ""}</line>
      </g>
      <circle cx="12" cy="-7" r="6" fill="var(--tyre)"/><circle cx="30" cy="-7" r="6" fill="var(--tyre)"/><circle cx="60" cy="-7" r="6" fill="var(--tyre)"/>
      <rect x="-26" y="-44" width="12" height="18" fill="var(--steel)"/><polygon points="-26,-26 -14,-26 -18,-14 -22,-14" fill="var(--steel)"/>
      <path d="M-14,-40 Q0,-60 14,-44" fill="none" stroke="var(--machd)" stroke-width="2.5"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${-46 + i * 9}" y="-9" width="7" height="9" rx="1.5" fill="var(--paper)" stroke="var(--muted)" stroke-width="0.8"/>`).join("")}
    </g>`;
  }
  function pumpSkid(x, y, s = 1) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="0" y="-4" width="46" height="4" fill="var(--machd)"/>
      <rect x="2" y="-22" width="26" height="18" rx="2" fill="var(--mach)" stroke="var(--machd)" stroke-width="1"/>
      <circle cx="36" cy="-12" r="8" fill="var(--steel)" stroke="var(--machd)" stroke-width="1"/>
      <rect x="6" y="-28" width="4" height="6" fill="var(--machd)"/>
    </g>`;
  }
  const flowPipe = (d, w = 4) => `<path d="${d}" fill="none" stroke="var(--steel)" stroke-width="${w + 2}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="var(--water)" stroke-width="${w - 1}" stroke-dasharray="6 6" stroke-linejoin="round"><animate attributeName="stroke-dashoffset" values="0;-24" dur="1s" repeatCount="indefinite"/></path>`;
  const rain = (x1, x2, y1, y2, n = 26) => {
    let r = "";
    for (let i = 0; i < n; i++) {
      const x = x1 + ((x2 - x1) * ((i * 37) % n)) / n, d = ((i * 0.13) % 1).toFixed(2);
      r += `<line x1="${x}" y1="${y1}" x2="${x - 4}" y2="${y1 + 12}" class="rain"><animateTransform attributeName="transform" type="translate" values="0 0;-14 ${y2 - y1}" dur="0.9s" begin="${d}s" repeatCount="indefinite"/></line>`;
    }
    return r;
  };
  const sky = (w, h) => `<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky2)"/><stop offset="1" stop-color="var(--sky)"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#skyg)"/>`;

  /* ---------------------------- HERO: pit section ---------------------------- */
  S.hero = function (opts = {}) {
    const anim = opts.animate !== false;
    const W = 1100, H = 390;
    const rockPts = "0,110 110,110 125,155 170,155 185,200 230,200 245,245 290,245 305,290 350,290 365,335 635,335 650,290 695,290 710,245 755,245 770,200 815,200 830,155 875,155 890,110 1100,110 1100,390 0,390";
    const ramp = "M560,333 L885,113";
    const ramp2 = "M885,113 L560,333";
    const blastHoles = [190, 202, 214, 226];
    const flashes = blastHoles.map((hx, i) => {
      const t = 0.1 + i * 0.03;
      return `<circle cx="${hx}" cy="198" r="10" fill="var(--flash)" opacity="0">${anim ? `<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;${t.toFixed(2)};${(t + 0.01).toFixed(2)};${(t + 0.06).toFixed(2)};1" dur="9s" repeatCount="indefinite"/>` : ""}</circle>`;
    }).join("");
    const hot = (act, label, lx, ly, inner, w = 108) => `<g class="hot" data-act="${act}" tabindex="0" role="button" aria-label="${L("Open", "Ouvrir")} ${label}">${inner}<g class="tag"><rect x="${lx}" y="${ly}" width="${w}" height="20" rx="10"/><text x="${lx + w / 2}" y="${ly + 14}" text-anchor="middle">${label}</text></g></g>`;
    return svg(W, H, "Open-pit section showing grade control drilling, production drilling, blasting, load and haul, dewatering and crusher feed", `
      ${sky(W, H)}
      <g opacity="0.55"><ellipse cx="220" cy="46" rx="60" ry="12" fill="var(--paper)"/><ellipse cx="260" cy="40" rx="40" ry="12" fill="var(--paper)"/>${anim ? `<animateTransform attributeName="transform" type="translate" values="0 0;140 0;0 0" dur="60s" repeatCount="indefinite"/>` : ""}</g>
      <g opacity="0.45"><ellipse cx="760" cy="58" rx="70" ry="11" fill="var(--paper)"/>${anim ? `<animateTransform attributeName="transform" type="translate" values="0 0;-120 0;0 0" dur="70s" repeatCount="indefinite"/>` : ""}</g>
      <!-- far wall seen through the pit -->
      <polygon points="110,110 890,110 890,335 110,335" fill="var(--rock2)"/>
      ${[155, 200, 245, 290].map(y => `<line x1="110" y1="${y}" x2="890" y2="${y}" stroke="var(--rockline)" stroke-width="1" opacity="0.6"/>`).join("")}
      <path d="${ramp}" stroke="var(--road)" stroke-width="12" fill="none"/>
      <path d="${ramp}" stroke="var(--paper)" stroke-width="1" stroke-dasharray="6 8" fill="none" opacity="0.7"/>
      <!-- near section -->
      <clipPath id="rockclip"><polygon points="${rockPts}"/></clipPath>
      <polygon points="${rockPts}" fill="var(--rock)"/>
      <g clip-path="url(#rockclip)">
        <rect x="0" y="105" width="1100" height="30" fill="var(--lat)"/>
        <rect x="0" y="135" width="1100" height="48" fill="var(--sap)"/>
        <polygon points="40,110 104,110 520,390 430,390" fill="var(--ore)" opacity="0.55"/>
        <polygon points="40,110 104,110 520,390 430,390" fill="none" stroke="var(--ore)" stroke-width="1.5"/>
      </g>
      <polyline points="${rockPts.split(" ").slice(0, 23).join(" ")}" fill="none" stroke="var(--rockline)" stroke-width="1.5"/>
      ${T(8, 104, "RL 420", "lbl small")}${T(132, 150, "410", "lbl small")}${T(192, 195, "400", "lbl small")}${T(252, 240, "390", "lbl small")}${T(312, 285, "380", "lbl small")}${T(372, 330, "370", "lbl small")}
      ${T(1090, 128, L("Laterite", "Latérite"), "lbl small", "end")}${T(1090, 165, "Saprolite", "lbl small", "end")}${T(1090, 230, L("Fresh rock", "Roche saine"), "lbl small", "end")}
      ${T(452, 366, L("Ore zone", "Zone minéralisée"), "lbl small light")}
      ${T(14, 384, L("SECTION A–A′ · bench height 10 m · not to scale", "COUPE A–A′ · gradin de 10 m · sans échelle"), "lbl small")}
      <!-- ramp trucks (far wall) -->
      <g>${truck(0, 0, 0.42, true)}${anim ? `<animateMotion path="${ramp}" dur="14s" rotate="auto" repeatCount="indefinite"/>` : `<animateMotion path="${ramp}" dur="1s" keyPoints="0.45;0.45" keyTimes="0;1" rotate="auto" fill="freeze"/>`}</g>
      <g>${truck(0, 0, 0.42, false, true)}${anim ? `<animateMotion path="${ramp2}" dur="14s" begin="-7s" rotate="auto" repeatCount="indefinite"/>` : ""}</g>
      ${hot("gc", L("Grade control", "Contrôle teneurs"), 6, 22, rcRig(36, 110, 0.62, anim), 104)}
      ${hot("blasting", L("Blasting", "Tir"), 168, 166, `<g>${blastHoles.map(hx => `<line x1="${hx}" y1="200" x2="${hx}" y2="236" stroke="var(--ore)" stroke-width="3"/><line x1="${hx}" y1="200" x2="${hx}" y2="210" stroke="var(--muted)" stroke-width="3"/>`).join("")}${flashes}${anim ? `<circle cx="208" cy="196" r="8" fill="var(--dust)" opacity="0"><animate attributeName="opacity" values="0;0;0.8;0" keyTimes="0;0.12;0.2;0.45" dur="9s" repeatCount="indefinite"/><animate attributeName="r" values="8;8;40;70" keyTimes="0;0.12;0.25;0.45" dur="9s" repeatCount="indefinite"/></circle>` : ""}</g>`, 84)}
      ${hot("drilling", L("Drilling", "Foration"), 908, 0, drillRig(912, 110, 0.75, 46, anim), 84)}
      ${hot("loadhaul", L("Load & haul", "Chargement"), 470, 236, `<g>${excavator(560, 335, 0.72, anim)}${truck(436, 335, 0.62, true)}</g>`, 100)}
      ${hot("dewatering", L("Dewatering", "Exhaure"), 372, 262, `<g><path d="M366,335 L372,318 L424,318 L428,335 Z" fill="var(--water)" opacity="0.85"><animate attributeName="opacity" values="0.85;0.65;0.85" dur="3s" repeatCount="indefinite"/></path>${flowPipe("M400,322 L400,300 L352,290 L302,290 L292,245 L242,245 L232,200 L182,200 L172,155 L122,155 L112,112 L4,112", 4)}</g>`, 96)}
      ${hot("crusher", L("Crusher feed", "Concasseur"), 978, 52, `<g transform="translate(990,110)"><polygon points="0,-34 40,-34 32,-16 8,-16" fill="var(--steel)" stroke="var(--machd)"/><rect x="10" y="-16" width="20" height="16" fill="var(--machd)"/><path d="M30,-8 L104,-46" stroke="var(--machd)" stroke-width="4"/><path d="M30,-8 L104,-46" stroke="var(--mach)" stroke-width="2" stroke-dasharray="4 6"><animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite"/></path><polygon points="70,0 96,-30 122,0" fill="var(--rock)"/>${truck(-58, 0, 0.5, true, false)}</g>`, 104)}
    `);
  };

  /* --------------------------- LOAD & HAUL scene --------------------------- */
  S.loadhaul = function (opts = {}) {
    const anim = opts.animate !== false;
    return svg(800, 300, "Excavator loading a haul truck, with a haul road cross-section", `
      ${sky(800, 300)}
      <polygon points="0,240 800,240 800,300 0,300" fill="var(--road)"/>
      <polygon points="430,240 470,190 800,186 800,240" fill="var(--rock)"/>
      ${Array.from({ length: 22 }, (_, i) => `<circle cx="${480 + (i * 47) % 300}" cy="${200 + (i * 13) % 34}" r="${4 + (i % 4) * 2}" fill="var(--rock2)" stroke="var(--rockline)" stroke-width="0.6"/>`).join("")}
      ${excavator(560, 190, 1.35, anim)}
      ${truck(300, 240, 1.25, true)}
      ${anim ? [0, 1, 2].map(i => `<circle cx="${396 + i * 8}" cy="170" r="4" fill="var(--rock)"><animate attributeName="cy" values="160;160;196" keyTimes="0;0.55;0.75" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.55;0.7;0.8" dur="4s" repeatCount="indefinite"/></circle>`).join("") : ""}
      <g>${truck(0, 240, 0.7, false, true)}${anim ? `<animateTransform attributeName="transform" type="translate" values="260 0;-120 0" dur="7s" repeatCount="indefinite"/>` : `<animateTransform attributeName="transform" type="translate" values="180 0" dur="1s" fill="freeze"/>`}</g>
      ${T(300, 140, L("Swing 60–90° · 4 passes · fill factor 0.9", "Rotation 60–90° · 4 passes · remplissage 0,9"), "lbl")}
      ${T(470, 182, L("Muckpile", "Tas abattu"), "lbl small")}
      <!-- haul road cross-section inset -->
      <g transform="translate(20,30)">
        <rect x="0" y="0" width="250" height="96" rx="6" class="inset"/>
        ${T(10, 16, L("Haul road section", "Coupe de piste"), "lbl strong")}
        <path d="M18,70 L40,70 L48,56 L58,70 L190,64 L222,70 L232,70" fill="none" stroke="var(--ink)" stroke-width="1.5"/>
        <polygon points="40,70 48,56 58,70" fill="var(--rock2)"/>
        <polygon points="190,64 202,52 214,66" fill="var(--rock2)"/>
        ${dimH(58, 190, 84, L("≥ 3.5 × truck width", "≥ 3,5 × largeur camion"))}
        ${T(30, 50, L("windrow ≥ ½ tyre", "merlon ≥ ½ pneu"), "lbl small")}
        ${T(110, 58, L("crossfall 2–3%", "dévers 2–3 %"), "lbl small")}
      </g>
    `);
  };

  /* ----------------------------- DRILLING scene ----------------------------- */
  S.drilling = function (opts = {}) {
    const anim = opts.animate !== false;
    const holes = [430, 500, 570, 640];
    return svg(800, 300, "Drill rig on a bench with hole geometry and tolerances", `
      ${sky(800, 300)}
      <polygon points="0,120 720,120 760,250 800,250 800,300 0,300" fill="var(--rock)"/>
      <line x1="0" y1="250" x2="800" y2="250" stroke="var(--rockline)" stroke-dasharray="6 5"/>
      ${T(8, 246, L("Floor grade (RL 400)", "Cote du carreau (RL 400)"), "lbl small")}
      ${drillRig(220, 120, 1.05, anim ? 0 : 0, anim)}
      <line x1="270.4" y1="120" x2="270.4" y2="160" stroke="var(--paper)" stroke-width="4"><animate attributeName="y2" values="122;272;272" keyTimes="0;0.85;1" dur="9s" repeatCount="indefinite"/></line>
      ${holes.map((hx, i) => `<line x1="${hx}" y1="120" x2="${hx + (i === 2 ? 10 : 0)}" y2="272" stroke="var(--paper)" stroke-width="4"/><line x1="${hx}" y1="120" x2="${hx + (i === 2 ? 10 : 0)}" y2="272" stroke="var(--rockline)" stroke-width="1" stroke-dasharray="${i === 2 ? "3 3" : "0"}"/>`).join("")}
      ${dimV(690, 120, 250, "H = 10 m")}
      ${dimV(690, 250, 272, "J")}
      ${dimH(430, 500, 108, "S")}
      ${T(585, 290, L("Deviation: 3° → 0.58 m at toe", "Déviation : 3° → 0,58 m au pied"), "lbl small warn")}
      <g transform="translate(20,20)"><rect width="190" height="78" rx="6" class="inset"/>${T(10, 18, L("Tolerances", "Tolérances"), "lbl strong")}${T(10, 38, L("Collar position ±0.2 m", "Position de tête ±0,2 m"), "lbl small")}${T(10, 54, L("Depth ±0.2 m · Angle ±1°", "Profondeur ±0,2 m · Angle ±1°"), "lbl small")}${T(10, 70, L("Dip every hole · log water", "Sonder chaque trou · noter l'eau"), "lbl small")}</g>
    `);
  };

  /* ----------------------------- BLASTING scene ----------------------------- */
  S.blasting = function (opts = {}) {
    const anim = opts.animate !== false;
    // charged hole section (left)
    const hx = 120, top = 60, floor = 230, bottom = 252;
    const section = `
      <polygon points="20,${top} 210,${top} 230,${floor} 20,${floor}" fill="var(--rock)"/>
      <polygon points="20,${floor} 260,${floor} 260,280 20,280" fill="var(--rock)" opacity="0.85"/>
      <line x1="20" y1="${floor}" x2="260" y2="${floor}" stroke="var(--rockline)" stroke-dasharray="5 4"/>
      <rect x="${hx - 6}" y="${top}" width="12" height="40" fill="var(--muted)"/>
      ${Array.from({ length: 8 }, (_, i) => `<circle cx="${hx - 3 + (i % 2) * 6}" cy="${top + 5 + i * 4.6}" r="1.8" fill="var(--rock2)"/>`).join("")}
      <rect x="${hx - 6}" y="${top + 40}" width="12" height="${bottom - top - 40}" fill="var(--ore)"/>
      <rect x="${hx - 5}" y="${bottom - 16}" width="10" height="12" fill="var(--hg)"/>
      <line x1="${hx + 2}" y1="${top - 14}" x2="${hx + 2}" y2="${bottom - 10}" stroke="var(--waste)" stroke-width="1.2"/>
      ${dimV(40, top, top + 40, "T")}
      ${dimV(40, top + 40, floor, L("Column", "Colonne"))}
      ${dimV(40, floor, bottom, "J")}
      ${dimH(hx, 214, floor + 44, L("B (to face)", "B (vers le front)"))}
      ${T(hx + 12, bottom - 2, L("Booster + detonator", "Booster + détonateur"), "lbl small light")}
      ${T(hx + 12, top + 100, L("Explosive column", "Colonne d'explosif"), "lbl small")}`;
    // plan view V pattern (right)
    const rows = 4, cols = 8, ox = 360, oy = 70, dx = 52, dy = 46, h2h = 17, r2r = 42, mid = 3.5;
    let holes = "";
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = ox + c * dx + (r % 2 ? dx / 2 : 0), y = oy + (rows - 1 - r) * dy;
      const t = Math.round(Math.abs(c + (r % 2 ? 0.5 : 0) - mid) * h2h + r * r2r);
      const k = (t / 260).toFixed(3), k2 = Math.min(0.999, t / 260 + 0.03).toFixed(3);
      holes += `<g><circle cx="${x}" cy="${y}" r="7" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2"/>
        <circle cx="${x}" cy="${y}" r="7" fill="var(--flash)" opacity="0">${anim ? `<animate attributeName="opacity" values="0;0;1;0.25;0.25;0" keyTimes="0;${k};${k2};${Math.min(0.999, +k2 + 0.05).toFixed(3)};0.97;1" dur="6s" repeatCount="indefinite"/>` : ""}</circle>
        ${T(x, y + 20, t, "lbl tiny", "middle")}</g>`;
    }
    return svg(800, 300, "Charged blast hole section and a V-pattern firing sequence in plan", `
      <rect width="800" height="300" fill="var(--paper)"/>
      ${T(20, 30, L("Charged hole · section", "Trou chargé · coupe"), "lbl strong")}
      ${section}
      ${T(360, 30, L("Pattern plan · V (chevron) firing · times in ms", "Plan de maille · amorçage en V · temps en ms"), "lbl strong")}
      ${holes}
      <line x1="${ox - 20}" y1="${oy + rows * dy - 10}" x2="${ox + cols * dx + 10}" y2="${oy + rows * dy - 10}" stroke="var(--ink)" stroke-width="2"/>
      ${T(ox - 20, oy + rows * dy + 6, L("FREE FACE", "FACE LIBRE"), "lbl small")}
      ${T(ox + 120, oy + rows * dy + 6, L(`hole-to-hole ${h2h} ms · row-to-row ${r2r} ms`, `trou à trou ${h2h} ms · rangée à rangée ${r2r} ms`), "lbl small")}
    `);
  };

  /* ---------------------------- DEWATERING scene ---------------------------- */
  S.dewatering = function (opts = {}) {
    const anim = opts.animate !== false;
    return svg(800, 300, "Pit sump with pump, discharge line, settling pond and wall piezometer", `
      ${sky(800, 300)}
      ${anim ? rain(0, 800, 0, 250) : ""}
      <polygon points="0,70 160,70 180,120 260,120 280,170 360,170 380,230 560,230 560,300 0,300" fill="var(--rock)"/>
      <polygon points="560,230 800,230 800,300 560,300" fill="var(--rock)"/>
      <path d="M380,230 L400,270 L520,270 L540,230 Z" fill="var(--rock2)"/>
      <rect x="400" y="246" width="120" height="24" fill="var(--water)" opacity="0.9"><animate attributeName="y" values="246;240;246" dur="5s" repeatCount="indefinite"/><animate attributeName="height" values="24;30;24" dur="5s" repeatCount="indefinite"/></rect>
      <rect x="452" y="252" width="16" height="16" rx="3" fill="var(--steel)"/>
      ${flowPipe("M460,252 L460,226 L370,226 L352,170 L274,170 L256,120 L178,120 L158,72 L60,72 L60,80", 5)}
      <path d="M20,72 Q60,94 100,72 Z" fill="var(--water)" opacity="0.9"/>
      ${T(20, 64, L("Settling pond", "Bassin de décantation"), "lbl small")}
      <path d="M0,150 C120,150 200,190 300,210 S440,250 560,252" fill="none" stroke="var(--water)" stroke-width="2" stroke-dasharray="7 5"/>
      ${T(14, 144, L("Water table", "Nappe"), "lbl small water")}
      <line x1="230" y1="120" x2="230" y2="215" stroke="var(--machd)" stroke-width="2"/><circle cx="230" cy="205" r="4" fill="var(--hg)"/>
      ${T(238, 208, L("VW piezometer", "Piézomètre CV"), "lbl small")}
      ${pumpSkid(600, 230, 1)}
      ${T(600, 252, L("Standby pump (N+1)", "Pompe de secours (N+1)"), "lbl small")}
      ${dimV(760, 72, 252, L("Static lift", "Hauteur géom."))}
      <g transform="translate(560,20)"><rect width="220" height="70" rx="6" class="inset"/>${T(10, 18, L("TDH = static + friction", "HMT = géom. + pertes"), "lbl strong")}${T(10, 38, L("P = 9.81 · Q · H / η  (kW)", "P = 9,81 · Q · H / η  (kW)"), "lbl small")}${T(10, 56, L("V = P × A × C (storm)", "V = P × A × C (orage)"), "lbl small")}</g>
    `);
  };

  /* ----------------------------- CRUSHER scene ----------------------------- */
  S.crusher = function (opts = {}) {
    const anim = opts.animate !== false;
    const pile = (x, w, h, cls, label) => `<polygon points="${x},250 ${x + w / 2},${250 - h} ${x + w},250" fill="var(--${cls})" stroke="var(--rockline)" stroke-width="0.8"/>${T(x + w / 2, 268, label, "lbl small", "middle")}`;
    return svg(800, 300, "ROM pad with grade fingers, truck tipping into the crusher and conveyor", `
      ${sky(800, 300)}
      <rect x="0" y="250" width="800" height="50" fill="var(--road)"/>
      ${pile(20, 110, 60, "hg", L("HG 2.4 g/t", "HT 2,4 g/t"))}${pile(140, 110, 52, "mg", L("MG 1.2 g/t", "MT 1,2 g/t"))}${pile(260, 110, 46, "lg", L("LG 0.7 g/t", "BT 0,7 g/t"))}
      <rect x="470" y="200" width="70" height="50" fill="var(--machd)"/>
      <polygon points="440,150 570,150 540,200 470,200" fill="var(--steel)" stroke="var(--machd)" stroke-width="1.5"/>
      <rect x="430" y="140" width="10" height="10" fill="var(--hg)"/>
      ${T(470, 230, L("Jaw · gape 1 000 mm", "Mâchoires · ouv. 1 000 mm"), "lbl small light")}
      <path d="M540,236 L760,150" stroke="var(--machd)" stroke-width="7"/>
      <path d="M540,236 L760,150" stroke="var(--mach)" stroke-width="3" stroke-dasharray="6 8">${anim ? `<animate attributeName="stroke-dashoffset" values="0;-28" dur="1s" repeatCount="indefinite"/>` : ""}</path>
      <polygon points="700,250 760,160 800,250" fill="var(--rock)"/>
      <g transform="translate(380,150)">
        <rect x="-4" y="-4" width="92" height="4" fill="var(--machd)"/>
        <g>
          <polygon points="20,-46 70,-46 68,-27 26,-27" fill="var(--mach)" stroke="var(--machd)"/>
          <polygon points="23,-46 32,-56 46,-59 60,-55 68,-46" fill="var(--rock)"/>
          ${anim ? `<animateTransform attributeName="transform" type="rotate" values="0 24 -27;0 24 -27;38 24 -27;38 24 -27;0 24 -27" keyTimes="0;0.2;0.45;0.7;1" dur="6s" repeatCount="indefinite"/>` : ""}
        </g>
        <rect x="22" y="-27" width="62" height="6" fill="var(--machd)"/>
        <rect x="70" y="-42" width="14" height="15" fill="var(--mach)" stroke="var(--machd)"/>
        <circle cx="34" cy="-11" r="9" fill="var(--tyre)"/><circle cx="74" cy="-11" r="9" fill="var(--tyre)"/>
      </g>
      ${anim ? [0, 1, 2, 3].map(i => `<circle cx="${452 + i * 10}" cy="140" r="${3 + (i % 2) * 2}" fill="var(--rock)" opacity="0"><animate attributeName="cy" values="130;130;190" keyTimes="0;0.4;0.65" dur="6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.4;0.6;0.7" dur="6s" repeatCount="indefinite"/></circle>`).join("") : ""}
      ${T(412, 126, L("Wheel stop · spotter", "Butée de roue · guide"), "lbl small")}
      <g transform="translate(20,20)"><rect width="230" height="88" rx="6" class="inset"/>${T(10, 18, L("Crusher feed rules", "Règles d'alimentation"), "lbl strong")}${T(10, 38, L("Max lump ≈ 0.8 × gape = 800 mm", "Bloc max ≈ 0,8 × ouverture = 800 mm"), "lbl small")}${T(10, 54, L("Oxide ≤ 35% of blend", "Oxyde ≤ 35 % du mélange"), "lbl small")}${T(10, 70, L("No tramp metal in the bin", "Aucun métal étranger en trémie"), "lbl small")}</g>
    `);
  };

  /* --------------------------- GRADE CONTROL scene --------------------------- */
  S.gc = function (opts = {}) {
    const anim = opts.animate !== false;
    const poly = "M500,120 L640,110 L700,160 L660,220 L540,230 L490,180 Z";
    return svg(800, 300, "RC grade-control rig with sampling and an ore polygon shifted by blast movement", `
      ${sky(800, 300)}
      <polygon points="0,200 400,200 400,300 0,300" fill="var(--rock)"/>
      <polygon points="120,200 230,200 320,300 200,300" fill="var(--ore)" opacity="0.55"/>
      ${rcRig(150, 200, 1.1, anim)}
      ${T(60, 230, L("Cyclone → cone splitter → 2–3 kg calico", "Cyclone → diviseur conique → sac 2–3 kg"), "lbl small light")}
      ${T(20, 290, L("RC at 60° across the ore structure", "RC à 60° en travers de la structure"), "lbl small light")}
      <rect x="420" y="70" width="370" height="220" rx="8" class="inset"/>
      ${T(434, 92, L("Plan · ore polygon and blast movement", "Plan · polygone de minerai et mouvement au tir"), "lbl strong")}
      ${Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, c) => `<circle cx="${450 + c * 44}" cy="${116 + r * 30}" r="2.4" fill="var(--muted)"/>`).join("")).join("")}
      <path d="${poly}" fill="none" stroke="var(--hg)" stroke-width="1.5" stroke-dasharray="5 4"/>
      <path d="${poly}" fill="var(--hg)" fill-opacity="0.25" stroke="var(--hg)" stroke-width="2">${anim ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;18 10;18 10;0 0" keyTimes="0;0.25;0.45;0.9;1" dur="7s" repeatCount="indefinite"/>` : `<animateTransform attributeName="transform" type="translate" values="18 10" dur="1s" fill="freeze"/>`}</path>
      <path d="M600,170 l26,14" stroke="var(--ink)" stroke-width="2" marker-end="url(#arr)"/>
      <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--ink)"/></marker></defs>
      ${T(434, 280, L("Dashed: pre-blast · solid: after 3 m movement", "Pointillé : avant tir · plein : après 3 m de mouvement"), "lbl small")}
      ${[["hg", L("HG", "HT")], ["mg", L("MG", "MT")], ["lg", L("LG", "BT")], ["waste", L("Waste", "Stérile")]].map(([c, l], i) => `<rect x="${436 + i * 70}" y="248" width="10" height="10" fill="var(--${c})"/>${T(450 + i * 70, 257, l, "lbl small")}`).join("")}
    `);
  };

  window.SCENES = S;
})();
