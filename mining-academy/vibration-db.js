/* Bench to Boardroom — blast vibration and airblast database (compiled November 2026 from public sources).
   Every entry carries a verification status:
     "verified"  : value confirmed by at least two independent public sources (regulator text or several citing documents)
     "partial"   : value confirmed by one public source, or only part of the table could be confirmed
     "check"     : value recalled from the standard and consistent with secondary sources, but the table itself could not be read
   Paywalled standards (AS 2187.2, DIN 4150-3, BS 7385-2, GB 6722) must be checked against a licensed copy before compliance use.
   Units: PPV in mm/s, distance in m, charge in kg, scaled distance in m/kg^0.5 (ground) or m/kg^(1/3) (air). */
(function () {
  const S = {
    isee: { t: "ISEE Golden West chapter, Official metric equivalents and DuPont/ISEE scaled-distance note", u: "http://www.iseegoldenwest.org/tech.htm" },
    padep: { t: "Pennsylvania DEP, Blaster's License Training Manual 5600-MN-DEP4778 (K 160 average, 242 worst case, exponent −1.6)", u: "https://files.dep.state.pa.us/Mining/District%20Mining/DistrictMinePortalFiles/Blasting/Blaster%20Manual%205600-MN-DEP4778.pdf" },
    eweb: { t: "EWEB, Blast vibration criteria selection (Oriard K 242, b −1.2 to −1.6)", u: "https://www.eweb.org/documents/Projects/Water%20Storage/Blast-Vibration-Criteria-Selection.pdf" },
    strutt: { t: "Arup Strutt help, Ground vibration from blasting (AS 2187.2 average free-face K 1140, B 1.6)", u: "https://strutt.arup.com/help/Vibration/BlastVibration.htm" },
    struttAir: { t: "Arup Strutt help, Airblast overpressure from blasting (confined Ka 10–100, a −1.45; unconfined 516)", u: "https://strutt.arup.com/help/Vibration/BlastOverpressure.htm" },
    coraki: { t: "Coraki Quarry blast parameters evaluation, NSW planning portal (B 1.6 industry average, AS 2187.2-2006 App. J)", u: "https://majorprojects.planningportal.nsw.gov.au/prweb/PRRestService/mp/01/getContent?AttachRef=SSD-7036%2120190227T092223.743+GMT" },
    dyno: { t: "Dyno Nobel, Explosives Engineers' Guide (free face hard or highly structured rock K 500, B −1.6)", u: "https://www.dynonobel.com.au/siteassets/guides/dyno_nobel_explosive_engineers_guide_2025_01_hr.pdf" },
    mdiom: { t: "WA EPA, MDIOM noise and vibration desktop assessment (AS 2187.2 airblast Ka 55, exponent −1.45 adopted)", u: "https://www.epa.wa.gov.au/sites/default/files/PER_documentation2/A20_NoiseVibrationDesktopAssessment.pdf" },
    shottrack: { t: "ShotTrack vibration calculator (K 1140, B −1.6 as planning guide)", u: "https://www.shottrack.com.au/vibration-calculator" },
    yin: { t: "Yin et al. (2018), Assessment of blasting-induced ground vibration in an open-pit mine under different rock properties, Advances in Civil Engineering", u: "https://onlinelibrary.wiley.com/doi/10.1155/2018/4603687" },
    yaramoko: { t: "PPV predicting equation, Yaramoko mine, Bagassi, Burkina Faso (2024), J. Minerals & Materials Characterization & Engineering", u: "https://doi.org/10.4236/jmmce.2024.126020" },
    cfr: { t: "30 CFR 816.67, Use of explosives: control of adverse effects (US surface mining regulation)", u: "https://www.law.cornell.edu/cfr/text/30/816.67" },
    usbr: { t: "US Bureau of Reclamation, Safety and Health Standards 4.03 Blasting (RI 8507 criteria)", u: "https://www.usbr.gov/safety/rshs/documents/4.03 Blasting.pdf" },
    ri8485: { t: "Siskind et al. (1980), USBM RI 8485, Structure response and damage produced by airblast from surface mining", u: "https://onemine.org/documents/ri-8485-structure-response-and-damage-produced-by-airblast-from-surface-mining" },
    qld: { t: "Queensland Government, Guideline: noise and vibration from blasting", u: "https://www.ehp.qld.gov.au/assets/documents/regulation/ts-gl-blasting-noise-and-vibration.pdf" },
    qldbiz: { t: "Queensland Government, Minimising noise and vibration from blasting activities", u: "https://business.qld.gov.au/industries/mining-energy-water/explosives-fireworks/requirements/blasting/minimising-noise" },
    anzecc: { t: "ANZECC (1990), Technical basis for guidelines to minimise annoyance due to blasting overpressure and ground vibration", u: "https://www.nepc.gov.au/sites/default/files/2022-09/anzec-gl-technical-basis-guidelines-minimise-annoyance-due-blasting-overpressure-and-ground.pdf" },
    waepa: { t: "WA EPA, Appendix M Vibration & Overpressure (AS 2187.2 App. J: 115 dBL for 95% of blasts, 120 dBL)", u: "https://www.epa.wa.gov.au/sites/default/files/PER_documentation2/Appendix%20M%20-Vibration%20%26%20Overpressure.pdf" },
    tmr: { t: "Queensland TMR Technical Note 03, Ground vibrations and airblast (PPV as peak of the vector sum)", u: "https://www.tmr.qld.gov.au/-/media/busind/techstdpubs/Technical-notes/Pavements-materials-geotechnical/TN03groundvibrationsairblast.pdf?la=en" },
    gbreview: { t: "An introduction to Chinese safety regulations for blasting vibration (review citing GB 6722)", u: "https://www.researchgate.net/publication/257793932_An_introduction_to_Chinese_safety_regulations_for_blasting_vibration" },
    gbcode: { t: "GB 6722-2014 Safety regulations for blasting (standard listing)", u: "https://codeofchina.com/standard/GB6722-2014.html" },
    din: { t: "DIN 4150-3:2016-12 Vibrations in buildings, Part 3: Effects on structures (standard listing)", u: "https://www.din.de/en/wdc-beuth:din21:262430160" },
    ncsu: { t: "NCSU repository paper reproducing DIN 4150-3 foundation reference curves (20 mm/s commercial)", u: "https://repository.lib.ncsu.edu/server/api/core/bitstreams/75b353d5-0ce2-4699-8732-f92fdc477ad1/content" },
    bs: { t: "BS 7385-2:1993 Evaluation and measurement for vibration in buildings, Part 2 (standard listing)", u: "https://infostore.saiglobal.com/en-us/standards/bs-7385-2-1993-213614_saig_bsi_bsi_504501/" },
    ioa: { t: "Institute of Acoustics, Scannell, Investigating environmental vibration complaints (BS 7385-2 Table 1: 50 mm/s at 4 Hz and above, framed)", u: "https://www.ioa.org.uk/system/files/proceedings/k_scannell_investigating_environmental_vibration_complaints_-_practical_aspects.pdf" },
    nirm: { t: "NIRM vibration study report citing DGMS standard (5 mm/s below 8 Hz)", u: "https://www.scribd.com/document/91628308/Nirm-Vib-Report-Final" }
  };

  /* Ground-vibration attenuation laws.
     form "sqrt"   : PPV = k · (D / √Q)^−β          (USBM square-root scaling)
     form "davies" : PPV = k · D^−b · Q^a           (general form) */
  const laws = [
    { id: "usbm-avg", form: "sqrt", k: 1140, beta: 1.6, status: "verified",
      name: { en: "Generic average (USBM / ISEE, metric)", fr: "Moyenne générique (USBM / ISEE, métrique)" },
      context: { en: "Planning default where no site data exist. Metric form of the imperial K 160 (in/s, ft/lb½): 160 × 25.4 × 0.45236^1.6 ≈ 1 142.", fr: "Valeur de planification sans données de site. Forme métrique du K 160 impérial (in/s, ft/lb½) : 160 × 25,4 × 0,45236^1,6 ≈ 1 142." },
      src: ["isee", "padep", "strutt", "shottrack"] },
    { id: "usbm-upper", form: "sqrt", k: 1725, beta: 1.6, status: "verified",
      name: { en: "Generic upper bound / worst case (Oriard K 242, metric)", fr: "Borne supérieure générique / cas défavorable (Oriard K 242, métrique)" },
      context: { en: "Conservative design line before a site law exists. Metric form of K 242 (in/s).", fr: "Droite de conception prudente avant toute loi de site. Forme métrique de K 242 (in/s)." },
      src: ["padep", "eweb"] },
    { id: "as-hard", form: "sqrt", k: 500, beta: 1.6, status: "partial",
      name: { en: "Free face, hard or highly structured rock", fr: "Face libre, roche dure ou très structurée" },
      context: { en: "Typical value in an explosives manufacturer's guide (attributed to AS 2187.2 practice). Lower K: faster energy loss in jointed hard rock.", fr: "Valeur type d'un guide fabricant d'explosifs (pratique AS 2187.2). K plus faible : perte d'énergie plus rapide en roche dure diaclasée." },
      src: ["dyno"] },
    { id: "dolomite-op", form: "sqrt", k: 3852, beta: 2.57, status: "partial",
      name: { en: "Dolomite, open pit (published case)", fr: "Dolomie, mine à ciel ouvert (cas publié)" },
      context: { en: "Site regression from one open-pit mine. Higher K but much faster attenuation (β 2.57): close in it predicts more than the generic law, far out less.", fr: "Régression d'une mine à ciel ouvert. K plus élevé mais atténuation bien plus rapide (β 2,57) : en champ proche elle prédit plus que la loi générique, au loin moins." },
      src: ["yin"] },
    { id: "shale-op", form: "sqrt", k: 1367, beta: 1.94, status: "partial",
      name: { en: "Shale, open pit (published case)", fr: "Schiste argileux, mine à ciel ouvert (cas publié)" },
      context: { en: "Same study as the dolomite case, softer layered rock.", fr: "Même étude que la dolomie, roche plus tendre et litée." },
      src: ["yin"] },
    { id: "granitoid-bf", form: "davies", k: 4762, a: 0.869, b: 1.737, status: "partial",
      name: { en: "Granitoid, West Africa (published case, general form)", fr: "Granitoïde, Afrique de l'Ouest (cas publié, forme générale)" },
      context: { en: "Burkina Faso mine on granitoid rock; the paper notes an underground setting, so use only as a cross-check for granitic terrain.", fr: "Mine du Burkina Faso sur granitoïde ; l'article indique un contexte souterrain : à utiliser seulement comme contrôle en terrain granitique." },
      src: ["yaramoko"] }
  ];

  /* Airblast law (AS 2187.2 form): P (kPa) = Ka · (D / Q^(1/3))^−a ; dBL = 20·log10(P / 20 µPa) */
  const airLaws = [
    { id: "air-confined", Ka: 55, a: 1.45, range: "10–100", status: "verified",
      name: { en: "Confined blasthole charges (typical Ka 55)", fr: "Charges confinées en trou (Ka type 55)" },
      context: { en: "Ka 10 for well-stemmed charges to 100 for poor confinement. Stemming quality moves Ka more than any other factor.", fr: "Ka 10 pour un bourrage soigné à 100 pour un confinement médiocre. La qualité du bourrage fait varier Ka plus que tout autre facteur." },
      src: ["struttAir", "mdiom"] },
    { id: "air-unconfined", Ka: 516, a: 1.45, status: "partial",
      name: { en: "Unconfined surface charges", fr: "Charges de surface non confinées" },
      context: { en: "Secondary blasting, plaster shots, exposed detonating cord.", fr: "Débitage secondaire, pétardage, cordeau détonant à l'air libre." },
      src: ["struttAir"] }
  ];

  /* Vibration limit standards. points: [frequency Hz, PPV mm/s] interpolated linearly; step: true = band steps.
     metric: "component" (peak of any single axis) or "vector" (peak vector sum). */
  const vib = [
    { id: "anzecc", status: "verified", metric: "vector", kind: "comfort",
      name: { en: "AS 2187.2 App. J / ANZECC human comfort (Australia)", fr: "AS 2187.2 ann. J / ANZECC confort humain (Australie)" },
      classes: [{ id: "res", label: { en: "Sensitive sites (dwellings)", fr: "Sites sensibles (habitations)" }, flat: 5, max: 10 }],
      note: { en: "5 mm/s for 95% of blasts over 12 months (Queensland: 9 of 10 consecutive blasts, 7 am–6 pm); 10 mm/s must never be exceeded. Comfort limits, far below damage thresholds.", fr: "5 mm/s pour 95 % des tirs sur 12 mois (Queensland : 9 tirs consécutifs sur 10, 7 h–18 h) ; 10 mm/s ne doit jamais être dépassé. Limites de confort, très en dessous des seuils de dommage." },
      src: ["anzecc", "qld", "tmr", "waepa"] },
    { id: "osm-fig1", status: "partial", metric: "component", kind: "damage",
      name: { en: "USBM RI 8507 / OSM, simplified (USA)", fr: "USBM RI 8507 / OSM, simplifié (États-Unis)" },
      classes: [
        { id: "drywall", label: { en: "Modern house, drywall interior", fr: "Maison moderne, cloisons plâtre (placo)" }, points: [[1, 19.05], [39.99, 19.05], [40, 50.8], [500, 50.8]] },
        { id: "plaster", label: { en: "Older house, plaster on wood lath", fr: "Maison ancienne, plâtre sur lattis bois" }, points: [[1, 12.7], [39.99, 12.7], [40, 50.8], [500, 50.8]] }],
      note: { en: "0.75 in/s (drywall) or 0.50 in/s (plaster) below 40 Hz, 2.0 in/s above. The full RI 8507 curve is lower than this table below about 4 Hz (constant displacement): treat sub-4 Hz readings with caution.", fr: "0,75 in/s (placo) ou 0,50 in/s (plâtre) sous 40 Hz, 2,0 in/s au-dessus. La courbe RI 8507 complète est plus basse que ce tableau sous environ 4 Hz (déplacement constant) : prudence avec les fréquences inférieures à 4 Hz." },
      src: ["usbr", "cfr"] },
    { id: "osm-dist", status: "verified", metric: "component", kind: "damage", byDistance: true,
      name: { en: "30 CFR 816.67 distance table, no monitoring (USA)", fr: "30 CFR 816.67, tableau par distance sans mesure (États-Unis)" },
      classes: [{ id: "any", label: { en: "Dwellings and public buildings", fr: "Habitations et bâtiments publics" }, dist: [[91.4, 31.75, 22.6], [1524, 25.4, 24.9], [1e9, 19.05, 29.4]] }],
      note: { en: "0–91 m: 1.25 in/s (Ds 50 ft/lb½ = 22.6 m/kg½); 92–1 524 m: 1.00 in/s (Ds 55 = 24.9); beyond: 0.75 in/s (Ds 65 = 29.4). Without monitoring, charge per delay W = (D/Ds)².", fr: "0–91 m : 1,25 in/s (Ds 50 ft/lb½ = 22,6 m/kg½) ; 92–1 524 m : 1,00 in/s (Ds 55 = 24,9) ; au-delà : 0,75 in/s (Ds 65 = 29,4). Sans mesure, charge par retard W = (D/Ds)²." },
      src: ["cfr"] },
    { id: "din4150", status: "check", metric: "component", kind: "damage",
      name: { en: "DIN 4150-3:2016, foundation (Germany)", fr: "DIN 4150-3:2016, fondation (Allemagne)" },
      classes: [
        { id: "comm", label: { en: "Commercial / industrial", fr: "Commercial / industriel" }, points: [[1, 20], [10, 20], [50, 40], [100, 50]] },
        { id: "dwell", label: { en: "Dwellings", fr: "Habitations" }, points: [[1, 5], [10, 5], [50, 15], [100, 20]] },
        { id: "sens", label: { en: "Sensitive / listed buildings", fr: "Bâtiments sensibles / classés" }, points: [[1, 3], [10, 3], [50, 8], [100, 10]] }],
      note: { en: "Short-term vibration at the foundation; values interpolated within 1–10, 10–50, 50–100 Hz. Commercial 20 mm/s and sensitive 3 mm/s confirmed; check the rest against the 2016 edition.", fr: "Vibrations de courte durée à la fondation ; valeurs interpolées dans les bandes 1–10, 10–50, 50–100 Hz. Commercial 20 mm/s et sensible 3 mm/s confirmés ; vérifier le reste dans l'édition 2016." },
      src: ["din", "ncsu"] },
    { id: "bs7385", status: "partial", metric: "component", kind: "damage",
      name: { en: "BS 7385-2:1993, cosmetic damage (UK)", fr: "BS 7385-2:1993, dommages esthétiques (Royaume-Uni)" },
      classes: [
        { id: "framed", label: { en: "Reinforced or framed, industrial / heavy commercial", fr: "Ossature ou béton armé, industriel / commercial lourd" }, points: [[4, 50], [500, 50]], lowDisp: 0 },
        { id: "light", label: { en: "Unreinforced or light framed, residential", fr: "Non armé ou ossature légère, résidentiel" }, points: [[4, 15], [15, 20], [40, 50], [500, 50]], lowDisp: 0.6 }],
      note: { en: "Transient vibration, onset of cosmetic damage. Framed 50 mm/s from 4 Hz confirmed; residential 15 → 20 → 50 mm/s at 4/15/40 Hz, with 0.6 mm displacement below 4 Hz. Reduce up to 50% where resonance is likely.", fr: "Vibrations transitoires, apparition de dommages esthétiques. Ossature 50 mm/s dès 4 Hz confirmé ; résidentiel 15 → 20 → 50 mm/s à 4/15/40 Hz, déplacement 0,6 mm sous 4 Hz. Réduire jusqu'à 50 % en cas de résonance probable." },
      src: ["bs", "ioa"] },
    { id: "gb6722", status: "verified", metric: "component", kind: "damage", step: true,
      name: { en: "GB 6722-2014 (China), lower bound of each range", fr: "GB 6722-2014 (Chine), borne basse de chaque plage" },
      classes: [
        { id: "adobe", label: { en: "Earth, adobe (banco) and rubble-stone houses", fr: "Maisons en terre, adobe (banco) et moellons" }, bands: [[10, 1.5, "1.5–4.5"], [50, 4.5, "4.5–9"], [1e9, 9, "9–15"]] },
        { id: "civil", label: { en: "General civil buildings", fr: "Bâtiments civils courants" }, bands: [[10, 15, "15–20"], [50, 20, "20–25"], [1e9, 25, "25–30"]] },
        { id: "indus", label: { en: "Industrial and commercial buildings", fr: "Bâtiments industriels et commerciaux" }, bands: [[10, 25, "25–35"], [50, 35, "35–45"], [1e9, 42, "42–50"]] }],
      note: { en: "Bands f ≤ 10 Hz, 10–50 Hz, > 50 Hz. The standard gives ranges (in cm/s); this tool uses the lower bound. The earth/adobe class is the relevant one for traditional village houses in West Africa.", fr: "Bandes f ≤ 10 Hz, 10–50 Hz, > 50 Hz. La norme donne des plages (en cm/s) ; l'outil retient la borne basse. La classe terre/adobe est celle qui convient aux maisons villageoises traditionnelles d'Afrique de l'Ouest." },
      src: ["gbreview", "gbcode"] },
    { id: "dgms", status: "partial", metric: "component", kind: "damage", step: true,
      name: { en: "DGMS Technical Circular 7/1997 (India)", fr: "DGMS circulaire technique 7/1997 (Inde)" },
      classes: [{ id: "dom", label: { en: "Domestic houses (not owned by the mine)", fr: "Maisons d'habitation (hors mine)" }, bands: [[8, 5, "5"], [25, 10, "10"], [1e9, 15, "15"]] }],
      note: { en: "5 mm/s below 8 Hz confirmed; 10 mm/s (8–25 Hz) and 15 mm/s (> 25 Hz) to be checked against the circular.", fr: "5 mm/s sous 8 Hz confirmé ; 10 mm/s (8–25 Hz) et 15 mm/s (> 25 Hz) à vérifier dans la circulaire." },
      src: ["nirm"] }
  ];

  /* Airblast limits (dB linear peak unless stated). */
  const air = [
    { id: "anzecc-air", status: "verified", name: { en: "AS 2187.2 App. J / ANZECC (Australia)", fr: "AS 2187.2 ann. J / ANZECC (Australie)" }, limit: 115, max: 120,
      note: { en: "115 dBL for 95% of blasts per year (Queensland: 9 of 10); 120 dBL never.", fr: "115 dBL pour 95 % des tirs par an (Queensland : 9 sur 10) ; 120 dBL jamais." }, src: ["waepa", "qld", "qldbiz", "anzecc"] },
    { id: "osm-air", status: "verified", name: { en: "30 CFR 816.67 / USBM RI 8485 (USA)", fr: "30 CFR 816.67 / USBM RI 8485 (États-Unis)" }, limit: 134, max: 134,
      note: { en: "Depends on the instrument's low-frequency limit: 134 dB (0.1 Hz flat), 133 dB (2 Hz), 129 dB (6 Hz), 105 dBC (C-weighted, if approved). Damage-based, not comfort-based.", fr: "Selon la limite basse fréquence de l'appareil : 134 dB (0,1 Hz linéaire), 133 dB (2 Hz), 129 dB (6 Hz), 105 dBC (pondération C, si approuvée). Fondé sur les dommages, pas le confort." }, src: ["cfr", "ri8485"] }
  ];

  window.VIBDB = { compiled: "2026-11", sources: S, laws, airLaws, vib, air };

  /* ----------------------------- calculations ----------------------------- */
  const interp = (pts, f) => { if (f <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) { const [f0, v0] = pts[i - 1], [f1, v1] = pts[i]; return v0 + (v1 - v0) * (f - f0) / (f1 - f0); } return pts[pts.length - 1][1]; };
  window.VIBDB.limit = function (stdId, clsId, f, dist) {
    const s = vib.find(x => x.id === stdId); if (!s) return null; const c = s.classes.find(x => x.id === clsId) || s.classes[0];
    if (c.flat != null) return { v: c.flat, max: c.max, metric: s.metric };
    if (c.dist) { const row = c.dist.find(r => (dist || 0) <= r[0]); return { v: row[1], ds: row[2], metric: s.metric }; }
    if (c.bands) { const row = c.bands.find(r => f <= r[0]); return { v: row[1], range: row[2], metric: s.metric }; }
    if (c.lowDisp && f < c.points[0][0]) return { v: 2 * Math.PI * f * c.lowDisp, metric: s.metric, disp: true };
    return { v: interp(c.points, f), metric: s.metric };
  };
  window.VIBDB.ppv = function (lawId, D, Q) {
    const L = laws.find(x => x.id === lawId); if (!L || D <= 0 || Q <= 0) return NaN;
    return L.form === "davies" ? L.k * Math.pow(D, -L.b) * Math.pow(Q, L.a) : L.k * Math.pow(D / Math.sqrt(Q), -L.beta);
  };
  window.VIBDB.maxCharge = function (lawId, D, ppvLim) {
    const L = laws.find(x => x.id === lawId); if (!L) return NaN;
    return L.form === "davies" ? Math.pow(ppvLim * Math.pow(D, L.b) / L.k, 1 / L.a) : Math.pow(D / Math.pow(L.k / ppvLim, 1 / L.beta), 2);
  };
  window.VIBDB.airDb = function (airId, D, Q, Ka) {
    const L = airLaws.find(x => x.id === airId); const k = Ka || L.Ka; const kPa = k * Math.pow(D / Math.cbrt(Q), -L.a);
    return { kPa, dBL: 20 * Math.log10(kPa * 1000 / 20e-6) };
  };
  window.VIBDB.dBL = pa => 20 * Math.log10(pa / 20e-6);
  /* Least-squares fit of log PPV = log k − β log SD; returns median k, β, R², n and the 95% upper-bound k (prediction band at the data mean). */
  window.VIBDB.fit = function (rows) {
    const p = rows.filter(r => r.D > 0 && r.Q > 0 && r.ppv > 0).map(r => [Math.log10(r.D / Math.sqrt(r.Q)), Math.log10(r.ppv)]);
    const n = p.length; if (n < 3) return { n };
    const mx = p.reduce((s, x) => s + x[0], 0) / n, my = p.reduce((s, x) => s + x[1], 0) / n;
    let sxx = 0, sxy = 0, syy = 0; p.forEach(([x, y]) => { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); syy += (y - my) ** 2; });
    const slope = sxy / sxx, inter = my - slope * mx; const resid = p.map(([x, y]) => y - (inter + slope * x)); const se = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / (n - 2));
    const df = n - 2, T = [0, 6.314, 2.920, 2.353, 2.132, 2.015, 1.943, 1.895, 1.860, 1.833, 1.812, 1.796, 1.782, 1.771, 1.761, 1.753, 1.746, 1.740, 1.734, 1.729, 1.725, 1.721, 1.717, 1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697];
    const t95 = df <= 30 ? T[df] : 1.645; /* one-sided 95% Student t */
    return { n, k50: Math.pow(10, inter), beta: -slope, r2: (sxy * sxy) / (sxx * syy), k95: Math.pow(10, inter + t95 * se * Math.sqrt(1 + 1 / n)), se };
  };
})();
