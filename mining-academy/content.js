/* Bench to Boardroom — open-pit operations curriculum.
   Single source of truth: the training tool (index.html) and the handbook (handbook.html) both render this file.
   Units are SI throughout. Every formula states its units. */
(function () {
  const A = {};

  A.cycles = [
    {
      id: "engineer", n: 1, name: "Engineer", years: "0–3 years",
      role: "Mining / D&B engineer on shift. Executes the plan safely and records what really happened.",
      goal: "Own one shift of an activity: calculate, check, record, and stop the job when something is wrong.",
      competencies: ["Field calculations without a spreadsheet", "Reads and follows the approval gates", "Clean, honest data capture (delays, as-drilled, loads)", "Recognises hazards and has the confidence to stop work"]
    },
    {
      id: "senior", n: 2, name: "Senior Engineer", years: "3–7 years",
      role: "Owns the design and the performance of an activity across all shifts. Coaches the engineers.",
      goal: "Turn field data into better designs: regressions, reconciliations, optimisation, and documented standards.",
      competencies: ["Builds site-specific models from monitoring data", "Diagnoses root causes, not symptoms", "Writes the standard that juniors follow", "Quantifies trade-offs in $/t, not opinions"]
    },
    {
      id: "pm", n: 3, name: "Project Manager", years: "7+ years",
      role: "Accountable for the contract: safety, schedule, cost, client relationship and people across all activities.",
      goal: "Deliver contracted outputs at the agreed margin while protecting the contractor's contractual position.",
      competencies: ["Earned-value control and forecasting", "Variation and change management", "Risk ownership and escalation", "Stakeholder management: client, supplier, regulator, community"]
    }
  ];

  A.activities = [
    { id: "loadhaul", name: "Load & Haul", fr: "Chargement & transport" },
    { id: "drilling", name: "Drilling", fr: "Forage" },
    { id: "blasting", name: "Blasting", fr: "Tir à l'explosif" },
    { id: "dewatering", name: "Dewatering", fr: "Exhaure / dénoyage" },
    { id: "crusher", name: "Crusher Feed", fr: "Alimentation concasseur" },
    { id: "gc", name: "Grade Control", fr: "Contrôle des teneurs" }
  ];

  /* ------------------------------------------------------------------ */
  /* MODULES                                                             */
  /* ------------------------------------------------------------------ */
  const M = { engineer: {}, senior: {}, pm: {} };

  /* ============================ ENGINEER ============================ */
  M.engineer.loadhaul = {
    title: "Moving material: bank, loose and tonnes",
    objectives: ["Convert between BCM, LCM and tonnes", "Break a truck cycle into its components", "Calculate passes, payload and match factor", "Apply haul-road and interaction controls"],
    lessons: [
      { h: "Three ways to measure the same rock", body: `<p>Survey measures <b>bank cubic metres (BCM)</b>: rock in place. Blasting adds voids, so the same rock in the bucket is <b>loose cubic metres (LCM)</b>. The plant and the client pay on <b>tonnes</b>.</p><ul><li>Swell factor = LCM / BCM. Blasted fresh rock: 1.3–1.5. Oxide/laterite: 1.2–1.3.</li><li>Loose density = in-situ density / swell factor.</li><li>In-situ dry density: laterite/oxide 1.8–2.2 t/m³; transition 2.3–2.5; fresh rock 2.65–2.85.</li></ul><p>Always state the basis. "50 000 m³" is meaningless until you say bank or loose.</p>` },
      { h: "The truck cycle", body: `<p>Cycle = spot + load + haul loaded + manoeuvre & dump + return empty + queue. Queue is the hidden one: nobody plans it, everybody pays for it.</p><p>Productive hour: a 60-minute hour rarely delivers 60 minutes. Use 50 minutes (efficiency 0.83) for planning unless site data says otherwise.</p>` },
      { h: "Passes, payload and match factor", body: `<p><b>Bucket payload</b> = heaped capacity × fill factor × loose density. Fill factor is the best single indicator of fragmentation quality at the face: 0.95–1.05 well blasted, 0.75–0.85 blocky.</p><p><b>Passes</b> = rated payload / bucket payload. Aim for a whole number of 3–5 passes. A half pass at the end wastes a full bucket cycle.</p><p><b>Match factor</b> MF = (N<sub>trucks</sub> × loading time) / (N<sub>loaders</sub> × truck cycle time). MF &lt; 1: loader waits for trucks. MF &gt; 1: trucks queue at the loader. The loader is the expensive unit; plan close to 1.0 and manage bunching with dispatch.</p>` },
      { h: "Haul roads and interaction", body: `<ul><li>Rolling resistance ≈ 2% + 0.6% per cm of tyre penetration. Five centimetres of rut in the wet season triples it.</li><li>Total resistance = rolling resistance + grade (%). Ramp grades normally 8–10%.</li><li>Two-way haul road running width ≥ 3.5 × widest truck; single lane ≥ 2 ×.</li><li>Safety windrow (berm) at least half the tyre height of the largest truck. It guides; it does not stop a loaded truck at speed.</li><li>Crossfall 2–3% so water leaves the road. Standing water is a road defect.</li><li>Light vehicles: positive radio communication before entering a haul road, flag and strobe, never in a truck's blind zone.</li></ul>` }
    ],
    formulas: [
      { name: "Loose density", f: "ρ<sub>loose</sub> = ρ<sub>insitu</sub> / SF", note: "t/m³; SF = swell factor" },
      { name: "Bucket payload", f: "P<sub>b</sub> = V<sub>bucket</sub> × FF × ρ<sub>loose</sub>", note: "t" },
      { name: "Match factor", f: "MF = (N<sub>t</sub> × t<sub>load</sub>) / (N<sub>l</sub> × t<sub>cycle</sub>)", note: "dimensionless" },
      { name: "Fleet output", f: "Q = (60 / t<sub>load+spot</sub>) × payload × E", note: "t/h, loader-limited" }
    ],
    tips: ["Spot trucks so the excavator swings 60–90°. A 180° swing adds a large share to every bucket cycle.", "Double-side loading removes most of the truck-exchange delay. Ask for it when the face allows.", "Write delay reason codes honestly. 'Other' is not a reason code; it is a lost lesson.", "Shift change, first hour and last hour hide the biggest losses. Hot-seat changes are worth 20–30 minutes per truck per day.", "Check the bucket teeth (GET) at pre-start. A lost tooth in the crusher stops the plant."],
    prof: "Juniors often report production in loads × nominal payload. That number is a guess. Use the truck payload system or weighbridge, and reconcile to survey BCM at month end. The gap between the three is your first piece of real engineering.",
    exercise: {
      intro: "An excavator with a 12 m³ bucket loads 90 t rigid trucks in fresh rock. In-situ density 2.70 t/m³, swell factor 1.40, fill factor 0.90. Bucket cycle 30 s, truck spot time 30 s. Truck cycle time 25 min. Efficiency 0.83.",
      parts: [
        { q: "Bucket payload", ans: 20.8, tol: 0.3, unit: "t" },
        { q: "Whole number of passes (do not exceed rated payload)", ans: 4, tol: 0, unit: "passes" },
        { q: "Trucks needed for MF = 1.0 (loading time incl. spot)", ans: 10, tol: 0, unit: "trucks" },
        { q: "Loader-limited fleet output", ans: 1660, tol: 30, unit: "t/h" }
      ],
      solution: `<p>ρ<sub>loose</sub> = 2.70 / 1.40 = 1.93 t/m³ → P<sub>b</sub> = 12 × 0.90 × 1.93 = <b>20.8 t</b>.</p><p>90 / 20.8 = 4.3 → <b>4 passes</b> = 83.3 t (93% of rated). Five passes would overload to 104 t.</p><p>Loader service time = 4 × 30 s + 30 s = 150 s = 2.5 min. N = 25 / 2.5 = <b>10 trucks</b>.</p><p>Q = (60 / 2.5) × 83.3 × 0.83 = <b>1 660 t/h</b>.</p>`
    },
    tool: "haul"
  };

  M.engineer.drilling = {
    title: "Putting the hole where the design says",
    objectives: ["Choose between top-hammer, DTH and rotary", "Mark out and drill to tolerance", "Keep a drill log that the blast engineer can use", "Estimate drill productivity and tonnes per metre"],
    lessons: [
      { h: "Drilling methods", body: `<ul><li><b>Top hammer</b>: 64–127 mm, fast in short holes, deviation grows with depth. Pre-split, secondary, small benches.</li><li><b>Down-the-hole (DTH)</b>: 90–254 mm, hammer at the bit, straight holes, the standard for hard-rock gold pits.</li><li><b>Rotary (tricone)</b>: 200–311 mm+, pull-down and rotation, best in softer or very large operations.</li></ul><p>Penetration depends on rock strength, air pressure and bit condition. Penetration rate drops in the same rock when the bit is worn: track it.</p>` },
      { h: "Accuracy is a blast parameter", body: `<p>Typical tolerances: collar position ±0.2 m, depth ±0.2 m, angle ±1°. A 1° error on an 11 m hole puts the toe 0.19 m off; a 3° error puts it 0.58 m off, which is a 17% change on a 3.5 m burden.</p><ul><li>Mark out with GPS or a surveyor. Do not pace out a pattern.</li><li>Level the rig on the jacks before collaring, check the mast angle.</li><li>Collar slowly through broken ground, then go to full feed.</li></ul>` },
      { h: "The drill log", body: `<p>The drill log is the first geotechnical dataset of every blast. Record per hole: as-drilled depth, water, voids or cavities, broken ground, clay, change of penetration, and any hole you could not finish.</p><p>Dip every hole after drilling. Backfilled or collapsed holes are redrilled or re-designed before loading. <b>No loading authorization without as-drilled sign-off</b>: this is a safety gate and a contractual gate.</p>` },
      { h: "Productivity", body: `<p>Time per hole = hole length / penetration rate + tram and set-up time. Effective drilling hours per 12-hour shift are usually 8–9 after shift change, pre-start, refuelling and breaks.</p><p>Tonnes per drilled metre = (B × S × H × ρ) / hole length. It links drilling to the mine plan: tonnes to blast ÷ t/m = metres to drill.</p>` }
    ],
    formulas: [
      { name: "Hole length", f: "L = H / cos(θ) + J", note: "m; θ from vertical, J = subdrill" },
      { name: "Toe displacement", f: "δ = L × tan(error)", note: "m" },
      { name: "Tonnes per metre", f: "t/m = B × S × H × ρ / L", note: "t/m" },
      { name: "Holes per shift", f: "n = t<sub>eff</sub> / (L / PR + t<sub>setup</sub>)", note: "PR in m/min" }
    ],
    tips: ["Protect every collar in the wet season: a hole plug costs less than a redrill.", "Note water depth per hole; it decides ANFO versus emulsion and the explosive budget.", "A sudden fast penetration over 1–2 m is often a void or a fault. Log it; the blast engineer must deck around it.", "Never drill in or next to an old hole socket (bootleg). It may contain explosive.", "Change the bit by condition (gauge wear), not by habit."],
    prof: "A drill and blast contractor is often paid per metre, so pressure is to drill fast. The real metric is the blast result. A pattern drilled 0.5 m out of position will cost more in toes, oversize and redrill than the metres saved.",
    exercise: {
      intro: "Bench height 10 m, vertical holes, subdrill 1.0 m, burden 3.5 m, spacing 4.0 m, rock density 2.70 t/m³. Penetration rate 30 m/h, tram and set-up 4 min per hole, 9 effective hours per shift.",
      parts: [
        { q: "Hole length", ans: 11, tol: 0, unit: "m" },
        { q: "Tonnes per drilled metre", ans: 34.4, tol: 0.3, unit: "t/m" },
        { q: "Holes per shift (whole holes)", ans: 20, tol: 0, unit: "holes" },
        { q: "Metres per shift", ans: 220, tol: 10, unit: "m" }
      ],
      solution: `<p>L = 10 + 1.0 = <b>11 m</b>.</p><p>t/m = 3.5 × 4.0 × 10 × 2.70 / 11 = 378 / 11 = <b>34.4 t/m</b>.</p><p>Time per hole = 11 / 30 × 60 + 4 = 22 + 4 = 26 min. n = 540 / 26 = 20.8 → <b>20 complete holes</b>, <b>220 m</b> (228 m if you count the part-drilled hole).</p>`
    },
    tool: "drill"
  };

  M.engineer.blasting = {
    title: "The charged hole and the safe blast",
    objectives: ["Name the parts of a blast hole and their purpose", "Calculate charge per hole and powder factor", "Select ANFO or emulsion for wet holes", "Run a blast clearance and know the misfire protocol"],
    lessons: [
      { h: "Explosives and initiation", body: `<ul><li><b>ANFO</b> (94/6): density 0.80–0.85 g/cm³, cheap, <b>no water resistance</b>.</li><li><b>Emulsion</b>: 1.10–1.30 g/cm³, water resistant, more energy per metre, more expensive.</li><li><b>Blends (heavy ANFO)</b>: emulsion/ANFO mixes. Above about 50% emulsion they become pumpable and water resistant.</li><li><b>Booster</b> (cast primer) at the bottom of the column, initiated by a <b>downline</b> detonator: shock tube (pyrotechnic delay) or electronic.</li><li>Surface connectors carry the timing between holes. Pyrotechnic delays have scatter; electronic delays are programmable to the millisecond.</li></ul>` },
      { h: "Bench blast geometry", body: `<p>Burden B (to the free face), spacing S (along the row), bench height H, subdrill J, stemming T, hole diameter D.</p><ul><li>Burden: 25–35 × D in hard rock (115 mm → 2.9–4.0 m). Konya: B = 0.012 × (2·SG<sub>e</sub>/SG<sub>r</sub> + 1.5) × D, B in m, D in mm.</li><li>Spacing 1.0–1.3 × B (staggered pattern preferred).</li><li>Subdrill 0.3 × B; stemming 0.7–1.0 × B with angular crushed aggregate about D/10 in size.</li><li>Stiffness ratio H/B ≥ 3 for good fragmentation; below 2 the face blocks out and throws.</li></ul>` },
      { h: "Charging and powder factor", body: `<p>Linear charge density (kg/m) = 7.854 × 10<sup>-4</sup> × D² × ρ, D in mm, ρ in g/cm³. Charge per hole = density × column length. Powder factor = charge / (B × S × H), in kg/m³ (or kg/t).</p><p>Dip every hole immediately before loading and adjust the column to the real depth and water. One template for a pattern with variable depths is a design error.</p>` },
      { h: "Clearance and misfires", body: `<ul><li>Blast exclusion zone set by the site standard (typically 500 m personnel, 300 m equipment), guarded by sentries with radios. Count everyone out.</li><li>Lightning: suspend loading and clear the pattern when the detector shows storms inside the site trigger distance. Guinea's wet season brings daily convective storms.</li><li>Misfire: keep the exclusion zone, notify control, wait (30 min pyrotechnic minimum; site rule if cause unknown), then a competent shotfirer investigates. Never pull out a charge. Record and report every misfire.</li><li>Reactive ground (sulphide-rich rock): test hole temperature and use inhibited products when required.</li></ul>` }
    ],
    formulas: [
      { name: "Linear charge density", f: "q = 7.854×10⁻⁴ × D² × ρ", note: "kg/m; D mm, ρ g/cm³" },
      { name: "Charge per hole", f: "Q = q × (L − T)", note: "kg" },
      { name: "Powder factor", f: "PF = Q / (B × S × H)", note: "kg/m³" },
      { name: "Konya burden", f: "B = 0.012 × (2 SG<sub>e</sub>/SG<sub>r</sub> + 1.5) × D", note: "m; D in mm" }
    ],
    tips: ["Measure stemming with a tape, not by eye. Short stemming is the main cause of flyrock and airblast.", "Drill cuttings are fine powder and blow out. Use angular aggregate in fresh rock.", "Do not leave ANFO sleeping in wet holes; it dissolves and loses energy. Line the hole or use emulsion.", "Walk the tie-up after connecting and before clearing: check every connector and every downline.", "The blast is not finished until the post-blast inspection is signed."],
    prof: "Powder factor is a result, not a design input. If you design by picking a powder factor, you will hide a poor burden and spacing behind 'more explosive'. Design geometry first, then check the powder factor is in the expected range (0.45–0.75 kg/m³ for fresh hard rock).",
    exercise: {
      intro: "Hole diameter 115 mm, bench 10 m, subdrill 1.0 m, stemming 2.5 m, burden 3.5 m, spacing 4.0 m. ANFO at 0.85 g/cm³. (These are the defaults in the site Blast Predictor.)",
      parts: [
        { q: "Linear charge density", ans: 8.83, tol: 0.1, unit: "kg/m" },
        { q: "Charge per hole", ans: 75.1, tol: 1, unit: "kg" },
        { q: "Powder factor", ans: 0.536, tol: 0.01, unit: "kg/m³" },
        { q: "Konya burden check (SG rock 2.70)", ans: 2.94, tol: 0.06, unit: "m" }
      ],
      solution: `<p>q = 7.854×10⁻⁴ × 115² × 0.85 = <b>8.83 kg/m</b>.</p><p>Column = 11 − 2.5 = 8.5 m → Q = 8.83 × 8.5 = <b>75.1 kg</b>.</p><p>PF = 75.1 / (3.5 × 4.0 × 10) = <b>0.536 kg/m³</b>.</p><p>Konya: 0.012 × (2 × 0.85 / 2.70 + 1.5) × 115 = 0.012 × 2.13 × 115 = <b>2.94 m</b>. The 3.5 m design burden is 19% wider than Konya's guide: expect coarser fragmentation and toes unless field results prove the rock tolerates it.</p>`
    },
    tool: "blast"
  };

  M.engineer.dewatering = {
    title: "Keeping water out of the way of mining",
    objectives: ["Identify the sources of pit water", "Size a sump volume for a design storm", "Run daily pump checks", "Understand how water damages drilling, blasting and hauling"],
    lessons: [
      { h: "Where pit water comes from", body: `<ul><li>Direct rainfall on the pit and runoff from the catchment around it.</li><li>Groundwater seepage from the walls and floor; in laterite/saprolite profiles, perched water above the clay.</li><li>Upper Guinea climate: one wet season (about May to October, peak August–September), 1 300–1 800 mm a year, storms of 50–100 mm in a day.</li></ul>` },
      { h: "Sumps and pumps", body: `<p>The sump sits at the lowest point of the active pit, away from blasting and traffic, sized to hold a design storm while pumps catch up.</p><ul><li>Storm volume V = rainfall depth × catchment area × runoff coefficient (0.7–0.9 in a pit).</li><li>Diesel skid pumps: self-priming centrifugal, mobile. Electric submersibles: efficient, need power reticulation.</li><li>HDPE discharge lines with anchoring, valves and a non-return valve at the pump.</li></ul>` },
      { h: "Daily routine", body: `<ul><li>Pump running? Discharge flowing? Fuel, oil, hour meter.</li><li>Suction screen clear, float switches working, no air leaks.</li><li>Sump level against the marker post. Rising level means inflow exceeds capacity: report before it floods the bench below.</li><li>Pipeline walk: leaks, kinks, damage from traffic.</li></ul>` },
      { h: "Why mining cares", body: `<p>Wet holes force emulsion instead of ANFO (higher cost per tonne). Soft floors raise rolling resistance and cut tyres. Water pressure in the walls reduces slope stability. Wet sticky ore blocks the crusher. Dewatering is a production activity, not a service.</p>` }
    ],
    formulas: [
      { name: "Storm volume", f: "V = (P / 1000) × A × C", note: "m³; P mm, A m² (1 ha = 10 000 m²)" },
      { name: "Pump-out time", f: "t = V / (3.6 × Q)", note: "h; Q in L/s" }
    ],
    tips: ["Dig the next sump before the wet season, not during the first storm.", "Never stand on the edge of a flooded sump; the edge is undercut and saturated.", "Keep one standby pump on site and test-run it weekly.", "Plan blasting sequences so the sump is never in the blast zone.", "Photograph the sump level daily from the same point: cheap, convincing data."],
    prof: "A pump rated at 150 L/s rarely delivers it. Its output depends on the total head on its curve. Learn to read the pump curve before you promise anyone a pump-out time.",
    exercise: {
      intro: "The pit catchment is 20 ha. Design storm 80 mm in 24 h. Runoff coefficient 0.80. Two pumps each delivering 75 L/s at the operating head.",
      parts: [
        { q: "Storm runoff volume", ans: 12800, tol: 100, unit: "m³" },
        { q: "Combined pumping capacity", ans: 540, tol: 5, unit: "m³/h" },
        { q: "Time to pump out (no further inflow)", ans: 23.7, tol: 0.5, unit: "h" }
      ],
      solution: `<p>V = 0.080 × 200 000 × 0.80 = <b>12 800 m³</b>.</p><p>Q = 2 × 75 = 150 L/s = <b>540 m³/h</b>.</p><p>t = 12 800 / 540 = <b>23.7 h</b>. With another storm the next day you are behind; this is how pits flood.</p>`
    },
    tool: "water"
  };

  M.engineer.crusher = {
    title: "Feeding the plant the right rock",
    objectives: ["Lay out a ROM pad by grade and ore type", "Calculate a blend grade", "Control oversize and tramp metal", "Work safely at the tip head"],
    lessons: [
      { h: "The ROM pad", body: `<p>The run-of-mine (ROM) pad buffers the mine and the plant. Ore is stockpiled in fingers by grade bin (high, medium, low, marginal) and by type (oxide, transition, fresh). Each finger has a sign with bin, grade, tonnes and date.</p><p>Direct tip into the crusher is cheapest. Rehandle with a loader costs money every time; it is justified only by blending or buffering.</p>` },
      { h: "Blending", body: `<p>Blend grade = Σ(t<sub>i</sub> × g<sub>i</sub>) / Σt<sub>i</sub>. The plant also needs a stable hardness and a limited clay/oxide share: sticky oxide blocks chutes and screens in the wet season.</p>` },
      { h: "Oversize and tramp", body: `<ul><li>Maximum lump about 80% of the crusher gape (jaw or gyratory opening). Bigger rocks hang up and stop the feed.</li><li>Oversize goes to a separate pile for the rock breaker or secondary blasting, never 'just this once' to the bin.</li><li>Tramp metal (teeth, bits, drill rods) damages the crusher. Magnets and metal detectors protect the belt; field discipline protects the crusher.</li></ul>` },
      { h: "Tip-head safety", body: `<ul><li>Wheel stop or windrow at every tip edge; trucks never reverse to an edge without one.</li><li>Traffic lights or a spotter control the dump pocket.</li><li>No one stands below the tip or near the bin when the rock breaker works.</li><li>Dust suppression: sprays at the bin and on the pad roads.</li></ul>` }
    ],
    formulas: [
      { name: "Blend grade", f: "g = Σ(t<sub>i</sub> g<sub>i</sub>) / Σ t<sub>i</sub>", note: "g/t" },
      { name: "Contained gold", f: "oz = t × g / 31.1035", note: "troy oz" },
      { name: "Max lump", f: "d<sub>max</sub> ≈ 0.8 × gape", note: "mm" }
    ],
    tips: ["Know what the crusher needs for the next 24 h before you send trucks.", "Keep a dry oxide stockpile before the rains; wet oxide alone stops the plant.", "Survey the ROM fingers monthly and reconcile to truck counts.", "Mark oversize at the dig face; it is cheaper to break in the pit than at the crusher.", "A truck that tips on the wrong finger costs grade. Use the dispatch system and a clear ROM map."],
    prof: "The mine is measured on tonnes moved; the company is paid on gold recovered. Crusher feed is where those two meet. A junior who understands the plant's constraints becomes the person both departments call.",
    exercise: {
      intro: "The crusher will take 12 000 t tomorrow. Blend 60% from finger HG (1.80 g/t, 20% oxide) and 40% from finger LG (0.90 g/t, 50% oxide). The plant limits oxide to 35% of feed.",
      parts: [
        { q: "Blend grade", ans: 1.44, tol: 0.01, unit: "g/t" },
        { q: "Oxide share of blend", ans: 32, tol: 0.5, unit: "%" },
        { q: "Contained gold in feed", ans: 556, tol: 5, unit: "oz" }
      ],
      solution: `<p>g = 0.60 × 1.80 + 0.40 × 0.90 = <b>1.44 g/t</b>.</p><p>Oxide = 0.60 × 20 + 0.40 × 50 = <b>32%</b>, inside the 35% limit.</p><p>oz = 12 000 × 1.44 / 31.1035 = <b>556 oz</b>.</p>`
    },
    tool: "feed"
  };

  M.engineer.gc = {
    title: "Telling ore from waste, one bench at a time",
    objectives: ["Explain why grade control drilling exists", "Run RC sampling to standard", "Insert and check QAQC samples", "Mark out ore and calculate dilution"],
    lessons: [
      { h: "Why grade control", body: `<p>The resource model is drilled at 25–50 m spacing; it is a good estimate of a deposit and a poor estimate of a single dig block. Grade control (GC) drilling, typically reverse circulation (RC) at 5–12.5 m spacing, defines ore and waste boundaries at the scale the excavator digs.</p>` },
      { h: "RC sampling", body: `<ul><li>Face-sampling hammer; sample returns inside the rods to the cyclone.</li><li>Sample interval matches the bench flitch (often 1 m or 2.5 m). Split with a cone or riffle splitter to 2–3 kg.</li><li>Wet samples bias gold results; stop and dry the hole or flag the samples.</li><li>Weigh the reject (bulk) bag: recovery below about 70% of expected is a flag.</li><li>Clean the cyclone and splitter between holes to prevent contamination.</li></ul>` },
      { h: "QAQC", body: `<p>Insert about one control in every 20 samples of each type: certified reference materials (CRM, known grade), blanks (no gold, checks contamination) and field duplicates (checks sampling precision). A CRM outside ±3 standard deviations fails the batch; re-assay before using the results.</p>` },
      { h: "Ore markout and dilution", body: `<ul><li>Ore polygons are designed on the GC model at the cut-off grade and pegged/flagged in the field with a colour code (e.g., red HG, orange MG, yellow LG, blue waste).</li><li>Blasting moves the rock 1–5 m. Shift the polygons by measured blast movement before digging.</li><li>A spotter or the dispatch system confirms each load's destination. A wrong tip is lost gold.</li><li>Dilution: waste mined with ore. Ore loss: ore sent to waste. Both are paid by the company, not by the mine schedule.</li></ul>` }
    ],
    formulas: [
      { name: "Breakeven cut-off", f: "COG = C / [(P × (1−r) / 31.1035) × R]", note: "g/t; C $/t processing + G&A, P $/oz, r royalty, R recovery" },
      { name: "Diluted grade", f: "g = (t<sub>o</sub>g<sub>o</sub> + t<sub>w</sub>g<sub>w</sub>) / (t<sub>o</sub> + t<sub>w</sub>)", note: "g/t" }
    ],
    tips: ["Stand at the cyclone at the start of every shift. Most sampling errors are visible.", "Label bags before the hole, not after.", "A blank returning gold means contamination: check the cyclone and the lab's crusher.", "Ask the geologist which structures carry the gold. Ore boundaries follow geology, not straight lines.", "GC results must be back before the blast is dug. Lab turnaround is a production constraint."],
    prof: "Gold has a high nugget effect: two halves of the same sample can return very different grades. That is why sample mass, splitting and QAQC are not paperwork; they are the only defence against misclassifying a block.",
    exercise: {
      intro: "Gold price $2 500/oz, royalty 5%, metallurgical recovery 92%, processing + G&A cost $25/t ore. An ore block of 10 000 t at 2.00 g/t is mined with 5% ore loss and 10% dilution (dilution tonnes = 10% of the ore tonnes actually mined) at 0.20 g/t.",
      parts: [
        { q: "Breakeven cut-off grade", ans: 0.36, tol: 0.01, unit: "g/t" },
        { q: "Tonnes sent to the plant", ans: 10450, tol: 10, unit: "t" },
        { q: "Delivered grade", ans: 1.84, tol: 0.01, unit: "g/t" }
      ],
      solution: `<p>Net price per gram = 2 500 × 0.95 / 31.1035 = $76.36/g; × 0.92 = $70.25 per gram in situ. COG = 25 / 70.25 = <b>0.36 g/t</b>.</p><p>Ore mined = 9 500 t; dilution = 950 t → <b>10 450 t</b>.</p><p>g = (9 500 × 2.00 + 950 × 0.20) / 10 450 = 19 190 / 10 450 = <b>1.84 g/t</b> (−8% on grade, −4% on ounces).</p>`
    },
    tool: "gc"
  };

  /* ========================= SENIOR ENGINEER ========================= */
  M.senior.loadhaul = {
    title: "Fleet performance and the time model",
    objectives: ["Apply a consistent time-usage model", "Use payload policy and TKPH limits", "Diagnose fleet losses with dispatch data", "Express improvements in $/t"],
    lessons: [
      { h: "One time model for everybody", body: `<p>Calendar time → minus scheduled down (no roster, public holidays) → minus unscheduled and maintenance down = <b>available</b> → minus standby (no operator, waiting, weather, blasting) = <b>operating</b> → minus operating delays (queue, refuel, shift change) = <b>productive</b>.</p><ul><li>Physical availability PA = (total − maintenance) / total.</li><li>Use of availability UoA = operating / available.</li><li>Effective utilisation = PA × UoA.</li></ul><p>Agree the definitions in writing with the client. Most availability disputes are definition disputes.</p>` },
      { h: "Payload management", body: `<p>OEM payload policies typically allow no more than 10% of loads above 110% of target and none above 120% (the "10/10/20" rule). Overloading increases fuel, tyre and frame damage; underloading wastes a cycle. Use the payload monitor histogram, not the average.</p>` },
      { h: "Tyres and TKPH", body: `<p>TKPH = mean tyre load (t) × average work-shift speed (km/h). Mean load = (empty + loaded) / 2 on the most loaded tyre. If site TKPH exceeds the tyre rating (corrected for ambient temperature and haul length), the tyre overheats and separates. Fix the haul profile or speed before buying a different tyre.</p>` },
      { h: "Short-interval control", body: `<p>Review the dispatch data every 2 hours, not at the end of the month: bunching, queue time at each loader, empty-haul speed, hang time at the crusher. A 2-minute queue on a 25-minute cycle is 8% of the fleet idle.</p>` }
    ],
    formulas: [
      { name: "Effective utilisation", f: "EU = PA × UoA", note: "%" },
      { name: "TKPH", f: "TKPH = Q<sub>mean</sub> × V<sub>avg</sub>", note: "t·km/h" },
      { name: "Total resistance", f: "TR = RR + grade", note: "%" }
    ],
    tips: ["Compare loaded vs empty speed on each ramp: a drop on one segment points to a road defect.", "Put the grader on the haul road with the worst rolling resistance, not the closest one.", "Hang time at the crusher is often the plant's problem but the mine's cost. Measure and report it.", "Present losses in tonnes and dollars; 'utilisation 68%' convinces nobody.", "Coach operators with their own payload and cycle data, individually."],
    prof: "Senior engineers often add trucks when production drops. Before you do, prove where the time goes. Adding trucks to a queuing loader increases cost per tonne and production stays the same.",
    exercise: {
      intro: "A 90 t truck (empty mass 65 t) carries 85 t. The most loaded tyre carries 18% of gross mass when loaded and 16% of empty mass when empty. Average shift speed 22 km/h. Separately: a fleet of 10 trucks on a 25 min cycle loses an average 2 min queue per cycle.",
      parts: [
        { q: "Mean tyre load on the most loaded tyre", ans: 18.7, tol: 0.2, unit: "t" },
        { q: "Site TKPH", ans: 411, tol: 5, unit: "t·km/h" },
        { q: "Share of fleet time lost to queue", ans: 8, tol: 0.2, unit: "%" }
      ],
      solution: `<p>Loaded: 0.18 × 150 = 27.0 t; empty: 0.16 × 65 = 10.4 t; mean = <b>18.7 t</b>.</p><p>TKPH = 18.7 × 22 = <b>411</b>. Compare with the tyre rating after site correction.</p><p>Queue = 2 / 25 = <b>8%</b>: the equivalent of 0.8 trucks parked all shift.</p>`
    },
    tool: "haul"
  };

  M.senior.drilling = {
    title: "Drilling performance, cost per metre and wall control",
    objectives: ["Build a cost-per-metre model", "Use penetration and MWD data as rock information", "Size a drill fleet for the plan", "Design pre-split and trim drilling"],
    lessons: [
      { h: "Cost per metre", body: `<p>Cost/m = (ownership + operating cost per hour) / (m per hour) + consumables per metre (bits, hammers, rods, shanks). Bit life is in metres; a bit pulled too late damages the hammer, too early wastes life. Optimise with regrind intervals and condition records.</p>` },
      { h: "Drilling data is rock data", body: `<p>Measure-while-drilling (MWD) logs penetration, pull-down, rotation torque and air pressure. Normalised into a hardness index, it maps hard and soft zones ahead of the charge design, so you can vary the explosive per hole. It is cheaper than any geotechnical campaign.</p>` },
      { h: "Fleet sizing", body: `<p>Metres required = tonnes to blast / (t per drilled metre). Rig hours = metres / net penetration rate (including set-up). Number of rigs = rig hours / (hours per year × availability × utilisation). Add redrill (typically 2–5%) and GC/pre-split metres separately.</p>` },
      { h: "Wall control", body: `<ul><li>Pre-split: smaller holes (76–102 mm) on the final wall line, spacing 10–12 × D, light decoupled charges, fired before the main blast.</li><li>Buffer and trim rows: reduced burden and charge next to the wall.</li><li>Inclined holes match the face angle and reduce toe and crest damage.</li><li>Accuracy matters more on wall rows than anywhere: a deviated pre-split hole leaves a visible scar and a weak crest.</li></ul>` }
    ],
    formulas: [
      { name: "Cost per metre", f: "C/m = (C<sub>own</sub> + C<sub>op</sub>)/PR<sub>net</sub> + C<sub>cons</sub>", note: "$/m" },
      { name: "Rigs required", f: "N = M / (PR<sub>net</sub> × h × PA × UoA)", note: "rigs" }
    ],
    tips: ["Audit as-drilled versus design on 10% of holes every week and publish the result.", "Plot penetration rate per hole as a heat map on the pattern; share it with geology.", "Redrill rate above 5% is a management problem, not a geology problem.", "Train operators to read the hole: change of sound, air return and cuttings colour.", "Keep pre-split drilling with your best operator and best rig."],
    prof: "The drill index of a rock is not a constant. The same granite drills differently with a new bit and a worn one, with 18 bar and 24 bar. Before you claim the rock got harder, check the consumables and the compressor.",
    exercise: {
      intro: "A DTH rig costs $145/h (ownership + operation incl. operator and fuel) and drills at a net 22 m/h including set-up. Consumables cost $3.60/m. The plan needs 6.5 Mt blasted per year at 34.4 t/m. Each rig works 6 000 h/yr, availability 85%, use of availability 80%. Add 4% redrill.",
      parts: [
        { q: "Drilling cost per metre", ans: 10.19, tol: 0.05, unit: "$/m" },
        { q: "Metres per year incl. redrill", ans: 196500, tol: 1500, unit: "m" },
        { q: "Rigs required (decimal)", ans: 2.2, tol: 0.05, unit: "rigs" }
      ],
      solution: `<p>C/m = 145 / 22 + 3.60 = 6.59 + 3.60 = <b>$10.19/m</b>.</p><p>M = 6 500 000 / 34.4 × 1.04 = 188 953 × 1.04 = <b>196 500 m</b>.</p><p>Rig hours = 196 500 / 22 = 8 932 h. Effective hours per rig = 6 000 × 0.85 × 0.80 = 4 080 h. N = <b>2.2</b> → 3 rigs, or 2 rigs plus improved utilisation. Show the client both options with costs.</p>`
    },
    tool: "drill"
  };

  M.senior.blasting = {
    title: "Fragmentation, timing, vibration and flyrock",
    objectives: ["Predict fragmentation with Kuz-Ram", "Design inter-hole and inter-row timing", "Build a site vibration law and design MIC backwards from a limit", "Assess flyrock and airblast risk"],
    lessons: [
      { h: "Fragmentation (Kuz-Ram)", body: `<p>Cunningham (1983): X<sub>50</sub> = A × K<sup>−0.8</sup> × Q<sup>1/6</sup> × (115/E)<sup>19/30</sup>, X<sub>50</sub> in cm, K powder factor kg/m³, Q kg per hole, E relative weight strength (ANFO = 100), A rock factor (≈7 medium, 10 hard fissured, 13 hard massive). Treat it as a <b>trend tool</b>: calibrate A with photo-analysis of real muckpiles.</p>` },
      { h: "Timing", body: `<p>Konya's guide: hole-to-hole delay 10–16 ms per metre of spacing in hard rock (3–5 ms/ft); row-to-row 6.5–13 ms per metre of burden (2–4 ms/ft): the lower end gives a high, tight muckpile and more backbreak, the upper end a looser, lower pile. For B = 3.5 m that is 23–46 ms. Rows must have time to move before the next row fires; too short a row delay chokes the blast and throws the back rows upward.</p><p>Pyrotechnic delays scatter; check overlap of firing times inside any 8 ms window. Use electronic detonators near infrastructure and on wall-control blasts.</p>` },
      { h: "Ground vibration", body: `<p>USBM (Siskind et al., RI 8507): PPV = k × (D / √Q)<sup>−β</sup>, D metres, Q maximum instantaneous charge (MIC) per 8 ms window in kg, PPV mm/s. Without a site law, a typical metric starting point is k ≈ 1 140, β ≈ 1.6. <b>The often-quoted k = 160 is the imperial value (in/s, ft/lb<sup>½</sup>).</b> Used in metric units it under-predicts PPV about seven-fold.</p><p>Build the site law by regression of log PPV on log SD from monitored blasts; design on the 95% upper bound, not the mean. Then design MIC backwards from the limit: Q<sub>max</sub> = (D / SD<sub>req</sub>)², SD<sub>req</sub> = (k / PPV<sub>limit</sub>)<sup>1/β</sup>.</p>` },
      { h: "Airblast and flyrock", body: `<ul><li>Airblast is reported in dB(L) (linear, unweighted) per USBM RI 8485; dB(A) is for occupational noise. Typical limit at sensitive receivers 115–120 dB(L).</li><li>Flyrock (Richards & Moore, 2004): face-burst range L = (k²/g) × (√m / B)<sup>2.6</sup>, cratering L = (k²/g) × (√m / T)<sup>2.6</sup>, m in kg/m, k site constant (≈13.5 soft to 27 hard). Apply a safety factor of 2 to the clearance.</li><li>Stemming length and quality, burden at the face (profile the face with a laser) and hole deviation control both.</li></ul>` }
    ],
    formulas: [
      { name: "Kuz-Ram X50", f: "X<sub>50</sub> = A K<sup>−0.8</sup> Q<sup>1/6</sup> (115/E)<sup>19/30</sup>", note: "cm" },
      { name: "Scaled distance", f: "SD = D / √Q", note: "m/kg<sup>½</sup>" },
      { name: "PPV (USBM)", f: "PPV = k × SD<sup>−β</sup>", note: "mm/s; metric k≈1140, β≈1.6" },
      { name: "Max MIC", f: "Q<sub>max</sub> = [D / (k/PPV<sub>lim</sub>)<sup>1/β</sup>]²", note: "kg per 8 ms" },
      { name: "Flyrock (face burst)", f: "L = (k²/g)(√m / B)<sup>2.6</sup>", note: "m" }
    ],
    tips: ["Photograph every muckpile with scale objects and run fragmentation analysis; calibrate the rock factor monthly.", "Put a seismograph at the nearest structure for every blast until the site law is solid.", "Laser-profile the front row. A 1.5 m burden on a bulged face is a flyrock source.", "Deck around voids and clay seams found in the drill log.", "Trend the misfire rate by product batch and connector type; share it with the supplier."],
    prof: "A site law from five blasts is a guess. Wait for at least 20–30 independent readings across a range of scaled distances before you trust the regression, and keep using the conservative constants until then.",
    exercise: {
      intro: "Using the Cycle 1 pattern (75.1 kg/hole, PF 0.536 kg/m³, ANFO E = 100) with rock factor A = 10. A processing plant sits 600 m away with a 10 mm/s limit. Use k = 1 140, β = 1.6.",
      parts: [
        { q: "Kuz-Ram mean fragment size X50", ans: 37, tol: 1.5, unit: "cm" },
        { q: "Required scaled distance", ans: 19.3, tol: 0.3, unit: "m/kg½" },
        { q: "Maximum instantaneous charge", ans: 966, tol: 30, unit: "kg" },
        { q: "Holes allowed per 8 ms window", ans: 12, tol: 0, unit: "holes" }
      ],
      solution: `<p>K<sup>−0.8</sup> = 0.536<sup>−0.8</sup> = 1.647; Q<sup>1/6</sup> = 75.1<sup>1/6</sup> = 2.054; (115/100)<sup>0.633</sup> = 1.093. X<sub>50</sub> = 10 × 1.647 × 2.054 × 1.093 = <b>37 cm</b>.</p><p>SD = (1140/10)<sup>1/1.6</sup> = 114<sup>0.625</sup> = <b>19.3 m/kg½</b>.</p><p>Q = (600 / 19.3)² = <b>966 kg</b> → 966 / 75.1 = 12.9 → <b>12 holes</b> per 8 ms window. With pyrotechnic scatter, design for fewer, or use electronics.</p>`
    },
    tool: "blast"
  };

  M.senior.dewatering = {
    title: "Pump hydraulics, slope water and the wet-season plan",
    objectives: ["Calculate total dynamic head and pump power", "Explain pore pressure and wall depressurisation", "Write a wet-season readiness plan with triggers", "Manage discharge water quality"],
    lessons: [
      { h: "Total dynamic head", body: `<p>TDH = static lift + friction loss in pipe and fittings (+ discharge pressure). Friction (Hazen-Williams, SI): h<sub>f</sub> = 10.67 L Q<sup>1.852</sup> / (C<sup>1.852</sup> d<sup>4.87</sup>), with C ≈ 140–150 for HDPE. Keep pipe velocity around 1.5–3 m/s. The operating point is where the system curve crosses the pump curve; adding pipe length moves it to lower flow.</p><p>Hydraulic power P = ρ g Q H; shaft power = P / η.</p>` },
      { h: "Water in the walls", body: `<p>Pore pressure reduces effective normal stress on potential failure surfaces and lowers the factor of safety. Saprolite and weathered contacts in lateritic profiles are the usual weak zone. Controls: perimeter dewatering bores, horizontal drains in the wall, surface diversion drains, and vibrating-wire piezometers (VWP) to prove depressurisation (Beale & Read, 2013).</p>` },
      { h: "Wet-season readiness", body: `<ul><li>Sumps excavated and pump capacity installed to the design storm with N+1 redundancy.</li><li>Diversion drains around the pit crest cleaned before the first rains.</li><li>Blast plan moved to higher, drier benches; emulsion stock increased.</li><li>Dry ore stockpile built for the plant.</li><li>TARP: trigger levels on rainfall, sump level and piezometers, each with an action and an owner.</li></ul>` },
      { h: "Discharge and environment", body: `<p>Pit water carries suspended solids and nitrogen from explosives (ammonium nitrate dissolved from wet holes and spills). Settle in sediment ponds before discharge and monitor against the ESIA and permit limits. Good charging practice in wet holes is also an environmental control.</p>` }
    ],
    formulas: [
      { name: "Hazen-Williams", f: "h<sub>f</sub> = 10.67 L Q<sup>1.852</sup> / (C<sup>1.852</sup> d<sup>4.87</sup>)", note: "m; Q m³/s, d m" },
      { name: "Shaft power", f: "P = 9.81 × Q × H / η", note: "kW; Q m³/s, H m" },
      { name: "Pipe velocity", f: "v = Q / (π d² / 4)", note: "m/s" }
    ],
    tips: ["Install piezometers before the wall is mined, not after a crack appears.", "Put pressure gauges on pump discharges; they turn guesses into a pump curve check.", "Two pumps in series double head, in parallel add flow: know which your problem needs.", "Weekly sump-level and rainfall chart in the production meeting keeps dewatering funded.", "Trial the TARP with a desktop drill before the season."],
    prof: "Many pits are 'dewatered' by moving water from one bench to the next. Track the water balance: rainfall in, pumped out, evaporation, storage change. If the numbers do not close, you are recirculating your own water.",
    exercise: {
      intro: "Pump 150 L/s through 1 000 m of 250 mm internal-diameter HDPE (C = 150). Static lift 55 m. Pump efficiency 65%.",
      parts: [
        { q: "Pipe velocity", ans: 3.06, tol: 0.05, unit: "m/s" },
        { q: "Friction loss", ans: 25.3, tol: 0.8, unit: "m" },
        { q: "Total dynamic head", ans: 80.3, tol: 0.8, unit: "m" },
        { q: "Shaft power", ans: 182, tol: 4, unit: "kW" }
      ],
      solution: `<p>v = 0.15 / (π × 0.25² / 4) = 0.15 / 0.0491 = <b>3.06 m/s</b> (upper end; a 280 mm line would cut friction).</p><p>h<sub>f</sub> = 10.67 × 1000 × 0.15<sup>1.852</sup> / (150<sup>1.852</sup> × 0.25<sup>4.87</sup>) = 10.67 × 1000 × 0.0298 / (10 720 × 0.00117) = <b>25.3 m</b>.</p><p>TDH = 55 + 25.3 = <b>80.3 m</b>. P = 9.81 × 0.15 × 80.3 / 0.65 = <b>182 kW</b>.</p>`
    },
    tool: "water"
  };

  M.senior.crusher = {
    title: "Mine-to-mill and ROM reconciliation",
    objectives: ["Link blast fragmentation to plant throughput", "Optimise a multi-pile blend under constraints", "Reconcile ROM stockpiles", "Quantify crusher starvation"],
    lessons: [
      { h: "Mine-to-mill", body: `<p>Finer, more uniform run-of-mine fragmentation raises crusher and mill throughput and lowers the energy per tonne. Published mine-to-mill projects report double-digit throughput gains in hard ore. The cost is a higher powder factor in the mine; the value is in the plant. Measure both with the same tonnes.</p><p>Plant language: Bond work index (kWh/t), crusher closed-side setting, feed F80 and product P80.</p>` },
      { h: "Blend optimisation", body: `<p>Blending is a linear program: maximise (or stabilise) contained metal subject to oxide %, hardness, clay, moisture and available tonnes per pile. Start with a spreadsheet solver; the logic is the same as the plant's model.</p>` },
      { h: "ROM reconciliation", body: `<p>Monthly: opening stock + mined to ROM − fed to crusher = closing stock. Compare with the survey. Differences come from truck factors, wrong tips, survey bulk density and moisture. Track them as a percentage and fix the largest source first.</p>` },
      { h: "Crusher starvation", body: `<p>Every hour the crusher waits for the mine costs plant throughput × grade × recovery × price. Log starvation with a cause code shared by mine and plant: no trucks, wrong material, oversize hang-up, tip head blocked.</p>` }
    ],
    formulas: [
      { name: "Stock balance", f: "S<sub>close</sub> = S<sub>open</sub> + In − Out", note: "t" },
      { name: "Value of a crusher hour", f: "V = tph × g × R × P / 31.1035", note: "$/h" }
    ],
    tips: ["Agree one shared crusher-delay code list with the plant.", "Survey ROM fingers on the same day as the plant stocktake.", "Feed the hard fresh ore in a steady proportion; swings disturb the mill more than average hardness does.", "Keep the rock breaker on the critical spares list.", "Show the plant manager the blasting changes you made and the throughput you saw."],
    prof: "Mine-to-mill fails when the mine pays the explosive cost and the plant keeps the benefit. The senior engineer's job is to measure both sides honestly so that management can decide.",
    tool: "feed"
  };

  M.senior.crusher.exercise = {
    intro: "Three piles: HG 2.40 g/t (oxide 10%), MG 1.20 g/t (oxide 40%), LG 0.70 g/t (oxide 60%). Plant limit: oxide ≤ 35%. Site rule: at least 30% LG in the blend to keep the pad clear. Crusher at 450 t/h, recovery 92%, price $2 500/oz.",
    parts: [
      { q: "Minimum HG share with LG = 30% (rest MG) that meets oxide ≤ 35%", ans: 36.7, tol: 0.5, unit: "%" },
      { q: "Blend grade of that mix", ans: 1.49, tol: 0.02, unit: "g/t" },
      { q: "Value of one hour of crusher starvation at that grade", ans: 49600, tol: 900, unit: "$/h" }
    ],
    solution: `<p>HG = h, MG = 0.70 − h, LG = 0.30. Oxide = 0.10h + 0.40(0.70 − h) + 0.18 = 0.46 − 0.30h ≤ 0.35 → h ≥ <b>36.7%</b>. Adding HG lowers oxide, so the limit sets a <i>minimum</i> HG, not a maximum. Always check which way a constraint binds before solving.</p><p>Blend HG 36.7% / MG 33.3% / LG 30%: g = 0.367 × 2.40 + 0.333 × 1.20 + 0.30 × 0.70 = 0.880 + 0.400 + 0.210 = <b>1.49 g/t</b>.</p><p>V = 450 × 1.49 × 0.92 × 2 500 / 31.1035 = <b>$49 600 per hour</b> of starvation. Present this number at the next mine–plant meeting.</p>`
  };

  M.senior.gc = {
    title: "Geostatistics, QAQC control and reconciliation",
    objectives: ["Explain the variogram, nugget effect and SMU", "Read CRM, blank and duplicate charts", "Compute and interpret F1/F2/F3", "Correct ore polygons for blast movement"],
    lessons: [
      { h: "Geostatistics for the engineer", body: `<p>The variogram measures how sample differences grow with distance. Its <b>nugget</b> is the variability at zero distance (sampling error + micro-scale geology); its <b>range</b> is the distance beyond which samples are unrelated. GC spacing must be well inside the range along the main mineralised direction. Estimation (ordinary kriging or conditional simulation) is done on the <b>selective mining unit</b> (SMU): the smallest block the fleet can mine separately.</p>` },
      { h: "QAQC charts", body: `<ul><li>CRM control chart: warning at ±2 SD, failure at ±3 SD or two consecutive beyond ±2 SD on the same side. A consistent bias is a lab calibration issue.</li><li>Blanks: results above about 5–10 × detection limit flag contamination.</li><li>Field duplicates: plot half absolute relative difference (HARD); for gold, 80–90% of pairs within ±20–30% HARD is typical of good RC sampling.</li></ul>` },
      { h: "Reconciliation factors", body: `<p>F1 = GC model / resource model (for the mined volume): tests the resource model. F2 = plant (received) / GC model delivered: tests mining and sampling. F3 = F1 × F2: plant against the resource model. Report tonnes, grade and ounces separately; ounces can match while tonnes and grade both fail.</p>` },
      { h: "Blast movement", body: `<p>Rock moves 2–5 m horizontally and heaves vertically during a blast. Unadjusted polygons dilute the front of the ore and leave ore in the back. Measure with movement monitors installed in holes before the blast and shift the polygons per flitch.</p>` }
    ],
    formulas: [
      { name: "F1", f: "F1 = GC / Resource", note: "per tonnes, grade, oz" },
      { name: "F2", f: "F2 = Plant / GC", note: "" },
      { name: "F3", f: "F3 = F1 × F2", note: "" },
      { name: "HARD", f: "HARD = ½ |a − b| / ((a + b)/2)", note: "duplicates" }
    ],
    tips: ["Review CRM charts weekly with the lab manager, not monthly in a report.", "Send 5% of pulps to an umpire lab every quarter.", "If F2 &lt; 0.95 for three months, audit dilution and wrong tips before blaming the plant.", "Install blast movement monitors on every ore blast until movement is predictable.", "Agree the SMU with the load and haul engineer; it is a fleet question."],
    prof: "A reconciliation that always closes at 1.00 is not good news; it usually means someone is adjusting the numbers. Report the real factors and explain them.",
    exercise: {
      intro: "For a quarter: resource model in mined volume 50 000 oz; GC model 54 000 oz; plant reconciled production 51 300 oz. A field duplicate pair returns 1.20 g/t and 0.90 g/t.",
      parts: [
        { q: "F1", ans: 1.08, tol: 0.005, unit: "" },
        { q: "F2", ans: 0.95, tol: 0.005, unit: "" },
        { q: "F3", ans: 1.026, tol: 0.003, unit: "" },
        { q: "HARD of the duplicate pair", ans: 14.3, tol: 0.3, unit: "%" }
      ],
      solution: `<p>F1 = 54 000 / 50 000 = <b>1.08</b> (resource model conservative). F2 = 51 300 / 54 000 = <b>0.95</b> (5% lost between GC and plant: dilution, ore loss, wrong tips or GC bias). F3 = <b>1.026</b>.</p><p>HARD = 0.5 × 0.30 / 1.05 = <b>14.3%</b>, acceptable for RC gold.</p>`
    },
    tool: "gc"
  };

  /* ========================= PROJECT MANAGER ========================= */
  M.pm.loadhaul = {
    title: "Mining contracts, rates and fleet economics",
    objectives: ["Read a schedule-of-rates contract", "Value availability and productivity in contract money", "Decide fleet changes on cost per tonne", "Manage rise-and-fall and standby"],
    lessons: [
      { h: "Contract structures", body: `<ul><li><b>Schedule of rates</b>: $/BCM or $/t by material and haul-distance band, plus fixed monthly fees (management, mobilisation amortisation).</li><li><b>Rise and fall</b>: indices for fuel, labour, tyres and FX adjust rates. Check the base date and index source.</li><li><b>Standby / delay rates</b>: what the client pays when the fleet is stopped for client reasons (blasting, plant down, no access). If it is not written, it does not exist.</li><li><b>KPIs and bonus/malus</b>: availability, tonnes, safety. Know exactly how each is calculated.</li></ul>` },
      { h: "Value of availability", body: `<p>1% of availability on a fleet earning on tonnes = 1% × planned tonnes × rate. Turn every maintenance decision into this number. A $30 000 component that saves 2% availability for a month is often an easy decision when expressed this way.</p>` },
      { h: "Fleet decisions", body: `<p>Decide on cost per tonne over the remaining contract, not on purchase price: ownership (depreciation over contract life, finance), operating (fuel, tyres, maintenance, labour), and the production it enables. Include demobilisation value and the client's right to terminate.</p>` },
      { h: "Field reality", body: `<p>Delays caused by the client (late bench release, plant down, blasting holds) look like low contractor productivity in the client's report. Record them daily, cause-coded, signed by both supervisors. They are the evidence for standby claims.</p>` }
    ],
    formulas: [
      { name: "Revenue per 1% availability", f: "ΔRev = 0.01 × Q<sub>plan</sub> × rate", note: "$/period" },
      { name: "Cost per tonne", f: "$/t = (C<sub>own</sub> + C<sub>op</sub>) / t", note: "" }
    ],
    tips: ["Read the contract cover to cover in your first month; mark every notice period.", "Have the client's site representative sign daily delay sheets.", "Never accept a verbal rate; confirm by email the same day.", "Trend fuel per tonne-kilometre; it is the fastest early warning of road or fleet problems.", "Your monthly report should let the client's GM understand the month in two minutes."],
    prof: "PMBOK calls this Procurement and Integration Management. In a contractor's world it is simpler and harsher: you are paid for what the contract says you are paid for, and nothing else. A PM who does not know the contract is managing the client's project at the contractor's cost.",
    exercise: {
      intro: "A load and haul contract pays $3.20/t for 1.2 Mt per month planned. Fleet availability is 82% against a contract target of 85%. Assume tonnes scale with availability. A maintenance initiative costing $45 000 per month would restore 85%.",
      parts: [
        { q: "Monthly revenue lost at 82% vs 85%", ans: 135500, tol: 1500, unit: "$" },
        { q: "Net monthly benefit of the initiative", ans: 90500, tol: 1500, unit: "$" }
      ],
      solution: `<p>Tonnes at 82% = 1.2 Mt × 82/85 = 1.1576 Mt → lost 42 353 t × $3.20 = <b>$135 500</b> per month.</p><p>Net benefit = 135 500 − 45 000 = <b>$90 500</b> per month, before any KPI malus avoided. Approve it.</p>`
    },
    tool: "evm"
  };

  M.pm.drilling = {
    title: "Drill and blast contract control",
    objectives: ["Build the monthly drill & blast cost report", "Run the approval-gate system with the client", "Control redrill and variations", "Manage consumables inventory"],
    lessons: [
      { h: "The gate system", body: `<p>The contractor executes; the owner authorises. Eight gates: pattern approval → drilling → as-drilled survey sign-off → loading authorisation → pre-blast inspection → blast execution and all-clear → post-blast inspection → blast closeout in the register. Each gate has an output document. A missing document is a liability that the contractor carries.</p>` },
      { h: "Redrill and variations", body: `<p>Redrill caused by the contractor (deviation, lost holes) is the contractor's cost. Redrill caused by the client (pattern changed after drilling, late release, collapsed holes left open by client delay) is a variation. Log the cause per hole at the time, not at month end.</p>` },
      { h: "Inventory", body: `<p>Bits, hammers, rods and shanks have long lead times into West Africa (often 8–16 weeks by sea and road). Hold a minimum stock based on consumption rate × lead time + safety stock. Stock-outs stop rigs; overstock ties up cash.</p>` },
      { h: "Monthly cost report", body: `<p>Metres drilled versus plan, $/m actual versus tender, consumables per metre, rig availability and utilisation, redrill % by cause, and the variation register. Show 4-week trends, red/amber/green status.</p>` }
    ],
    formulas: [
      { name: "Reorder point", f: "ROP = d × LT + SS", note: "units; d daily use, LT lead time days" },
      { name: "Margin per metre", f: "m = rate − C/m", note: "$/m" }
    ],
    tips: ["If the client says 'drill it now, we will approve later', reply in writing and file it.", "Keep the as-drilled sign-off as the hard gate before loading. No exceptions.", "Review consumables per metre by rig; one rig with double the bit cost is an operator or air problem.", "Plan rig maintenance with the client's blasting schedule so you never block the critical path.", "Every redrill line in the report has a cause and an owner."],
    prof: "Your margin is decided at the tender and lost on site. The tender assumed a penetration rate, a bit life and a redrill rate. Track those three against tender every month; when one drifts, you know where your margin is going.",
    exercise: {
      intro: "Bits cost $1 450 each and last 1 800 m. The fleet drills 21 000 m per month. Supply lead time is 75 days; safety stock is 30 days of use.",
      parts: [
        { q: "Bits used per day (30-day month)", ans: 0.389, tol: 0.01, unit: "bits/day" },
        { q: "Reorder point", ans: 41, tol: 1, unit: "bits" },
        { q: "Bit cost per metre", ans: 0.81, tol: 0.01, unit: "$/m" }
      ],
      solution: `<p>Bits per month = 21 000 / 1 800 = 11.67 → <b>0.389/day</b>.</p><p>ROP = 0.389 × 75 + 0.389 × 30 = 29.2 + 11.7 = 40.8 → <b>41 bits</b>.</p><p>Cost = 1 450 / 1 800 = <b>$0.81/m</b>.</p>`
    },
    tool: "evm"
  };

  M.pm.blasting = {
    title: "Blasting risk, compliance and the supplier",
    objectives: ["Own the blasting risk register", "Separate technical and systemic root causes", "Manage the explosives supplier contract", "Keep regulatory compliance current"],
    lessons: [
      { h: "Compliance hierarchy", body: `<p>National law first (Guinea Mining Code and explosives regulations: licences, magazine permits, transport, notification), then international practice (ISEE, USBM for vibration and airblast), then supplier technical standards, then site SOPs. Where the law is silent, the stricter of the others applies.</p>` },
      { h: "Incident and misfire investigation", body: `<p>Use a structured method (ICAM or similar). The technical cause (a failed connector) is rarely the root cause. Ask why the failure was not detected: inspection, training, procurement, time pressure. Corrective actions go into the risk register with owners and dates and are verified, not just closed.</p>` },
      { h: "The explosives supplier", body: `<p>The supplier provides product and technical support; the contractor remains accountable for the blast. Reconcile product received, consumed and recorded every month. Track product failure rates by batch. Log every technical visit. Hold a minimum stock buffer (e.g., 2 weeks) because supply routes in the region are long and rainy-season roads close.</p>` },
      { h: "Cost of drill and blast", body: `<p>D&B cost per tonne = (drilling + explosives + initiation + labour + overheads) / tonnes blasted. The emulsion share is usually the fastest-moving cost item; if wet holes increase because of client dewatering performance, that is a claimable cost if the contract allocates dewatering to the client.</p>` }
    ],
    formulas: [
      { name: "D&B cost", f: "$/t = Σ costs / t<sub>blasted</sub>", note: "" },
      { name: "Explosives reconciliation", f: "Open + Received − Used − Close = 0", note: "kg; any residual is investigated" }
    ],
    tips: ["Monthly reconciliation of explosives is a regulatory and security requirement: treat any discrepancy as an incident.", "Keep licences and permits in a register with expiry dates and a 90-day alert.", "Brief the client before a sensitive blast, not after a complaint.", "Rotate investigation leaders so the same blind spots are not repeated.", "Publish lessons learned across the company, not only on site."],
    prof: "A misfire is a technical event with commercial consequences. If the client's design change contributed, it may be a variation. If your inspection missed it, it is your cost and your reputation. The investigation must be honest in both directions.",
    exercise: {
      intro: "A month: 1.30 Mt blasted. Explosive 680 t at $820/t; initiation $96 000; drilling $230 000; labour and overheads $310 000. Wet holes rose from 20% to 45% because the client's pumps failed; the emulsion premium is $160/t of explosive for the extra wet-hole product, and the extra wet holes used 170 t of explosive.",
      parts: [
        { q: "D&B cost per tonne", ans: 0.92, tol: 0.01, unit: "$/t" },
        { q: "Claimable emulsion premium", ans: 27200, tol: 200, unit: "$" }
      ],
      solution: `<p>Explosives = 680 × 820 = $557 600. Total = 557 600 + 96 000 + 230 000 + 310 000 = $1 193 600 → 1 193 600 / 1 300 000 = <b>$0.92/t</b>.</p><p>Premium = 170 × 160 = <b>$27 200</b>, claimable as a variation if the contract allocates dewatering to the client and the cause was logged at the time.</p>`
    },
    tool: "evm"
  };

  M.pm.dewatering = {
    title: "Dewatering strategy, responsibility and budget",
    objectives: ["Define who owns dewatering in the contract", "Budget a wet season", "Quantify production at risk", "Integrate environmental commitments"],
    lessons: [
      { h: "Who owns the water?", body: `<p>Contracts allocate in-pit dewatering, perimeter bores and discharge differently. Clarify it before the first season: who buys pumps, who runs them, who pays fuel, who is liable when the pit floods. Unclear allocation becomes a dispute in August.</p>` },
      { h: "Budgeting a wet season", body: `<p>Pumps (owned or hired, plus N+1 standby), fuel or power, pipe, sump excavation, labour, and the indirect cost: emulsion premium, slower haul, tyre damage, lost shifts. Compare the budget with the production value protected.</p>` },
      { h: "Production at risk", body: `<p>Quantify the value of a flooded bench: tonnes delayed × margin + plant feed shortfall. This turns dewatering from overhead into a risk-control investment in the steering committee.</p>` },
      { h: "Environment and community", body: `<p>Discharge points, water quality limits and community water users are ESIA commitments. A turbid creek downstream is a community and regulatory issue in hours. Monitoring, sediment ponds and a grievance mechanism are the PM's business.</p>` }
    ],
    formulas: [
      { name: "Production at risk", f: "V = t<sub>delayed</sub> × margin + feed shortfall value", note: "$" }
    ],
    tips: ["Put the dewatering allocation table in the kick-off minutes, signed.", "Hire standby pumps on a call-off contract before the season, when prices are low.", "Report rainfall and pumping in the monthly report alongside production.", "Meet the community water committee before the season.", "Count dewatering failures that delay blasting as client delays where they are client scope."],
    prof: "PMBOK Risk Management says: identify, analyse, plan responses, monitor. On a West African pit in the wet season it means: you know the storm is coming, so the only question is whether you paid for the response in May or pay for the recovery in September.",
    exercise: {
      intro: "A flooded lower bench would delay 180 000 t of ore by 3 weeks. Contract margin is $0.80/t on mining. The plant would lose 25 000 t of feed at 1.5 g/t, 92% recovery, $2 500/oz, with 40% of revenue as plant margin. Wet-season dewatering package: $210 000.",
      parts: [
        { q: "Mining margin delayed", ans: 144000, tol: 1000, unit: "$" },
        { q: "Plant margin lost", ans: 1109000, tol: 10000, unit: "$" },
        { q: "Ratio value protected / package cost", ans: 6.0, tol: 0.15, unit: "×" }
      ],
      solution: `<p>Mining: 180 000 × 0.80 = <b>$144 000</b>.</p><p>Plant: 25 000 × 1.5 / 31.1035 × 0.92 × 2 500 × 0.40 = 1 205.7 oz × 0.92 = 1 109.2 oz × $2 500 × 0.40 = <b>$1.109 M</b>.</p><p>(144 000 + 1 109 000) / 210 000 = <b>6.0×</b>. The owner gains most; use that in the negotiation on who pays.</p>`
    },
    tool: "evm"
  };

  M.pm.crusher = {
    title: "The mine–plant interface",
    objectives: ["Define interface KPIs between mine and plant", "Allocate ROM rehandle cost", "Run a joint mine–plant meeting", "Escalate constraints with numbers"],
    lessons: [
      { h: "Interface KPIs", body: `<ul><li>Crusher feed tonnes and grade versus plan.</li><li>Starvation hours by cause, attributed to mine or plant.</li><li>ROM stock in days of feed, by blend class.</li><li>Oversize % at the crusher.</li></ul>` },
      { h: "Rehandle", body: `<p>Rehandle is often a separate rate. If the plant cannot accept direct tip (crusher down), the rehandle is a client cost. If the mine sent the wrong material, it is a contractor cost. The dispatch log decides.</p>` },
      { h: "The joint meeting", body: `<p>Weekly, 30 minutes, one page: last week's interface KPIs, next week's feed plan, constraints, actions with owners. Keep it factual; it is where trust between departments is built or lost.</p>` },
      { h: "Escalation", body: `<p>Escalate with impact, cause and proposal: "Crusher waited 26 h last week for oversize clearing (impact $1.2 M plant margin). Cause: front-row burden. Proposal: laser profiling + front-row trim, cost $12 000/month."</p>` }
    ],
    formulas: [{ name: "Days of ROM stock", f: "d = ROM stock / daily feed", note: "days" }],
    tips: ["Bring the plant superintendent to a blast once.", "Share the mine's 2-week lookahead with the plant.", "One version of the truth: shared dispatch and plant data.", "Agree rehandle causes at the time, by email.", "Celebrate a good month together."],
    prof: "Most mine–plant conflict comes from each side measuring its own success. Make the shared measure the ounce in the gold room.",
    exercise: {
      intro: "Daily plant feed 10 800 t. ROM stock: 54 000 t total, of which 18 000 t is HG blend class. Contract rehandle rate $0.55/t. Last month 92 000 t were rehandled: 60% because the crusher was down, 40% because of wrong tips by the mine.",
      parts: [
        { q: "Days of ROM stock", ans: 5, tol: 0.05, unit: "days" },
        { q: "Rehandle billable to client", ans: 30360, tol: 100, unit: "$" },
        { q: "Rehandle cost carried by contractor", ans: 20240, tol: 100, unit: "$" }
      ],
      solution: `<p>54 000 / 10 800 = <b>5.0 days</b>.</p><p>Client: 92 000 × 0.60 × 0.55 = <b>$30 360</b>. Contractor: 92 000 × 0.40 × 0.55 = <b>$20 240</b>, plus the grade damage of wrong tips. Fix dispatch discipline first.</p>`
    },
    tool: "evm"
  };

  M.pm.gc = {
    title: "Reconciliation governance and ounces at risk",
    objectives: ["Govern reconciliation reporting", "Manage GC drilling and lab turnaround as critical path", "Value misclassification risk", "Integrate EVM into the monthly report"],
    lessons: [
      { h: "Governance", body: `<p>Public reporting (JORC, NI 43-101 and similar codes) requires a Competent/Qualified Person for resources and reserves. The PM does not sign estimates but owns the data quality that feeds them: drilling, sampling, QAQC, dispatch and reconciliation records.</p>` },
      { h: "Critical path", body: `<p>GC drilling must be ahead of the blast by enough benches that assays return before digging. Lab turnaround (e.g., ≤ 48 h) is a contract KPI. A late GC result means waste-mining the ore block or idle loaders.</p>` },
      { h: "Earned value control", body: `<p>EV = value of work completed at contract rates; PV = planned value to date; AC = actual cost. CPI = EV/AC; SPI = EV/PV. Escalate when CPI &lt; 0.95; trigger a cost-recovery review below 0.90. If SPI &lt; 0.90 for two weeks, re-baseline and notify the client formally. EAC = BAC / CPI when current performance is expected to continue.</p>` },
      { h: "Rotation and handover", body: `<p>On a 1-month on / 1-month off roster, every handover is an information-loss event. Standard handover report: open gates, open variations, risks, commitments made to the client, people issues. A 2-day overlap with a joint site walk is the minimum.</p>` }
    ],
    formulas: [
      { name: "CPI / SPI", f: "CPI = EV/AC; SPI = EV/PV", note: "" },
      { name: "EAC", f: "EAC = BAC / CPI", note: "$" },
      { name: "TCPI", f: "TCPI = (BAC − EV) / (BAC − AC)", note: "efficiency needed to finish on budget" }
    ],
    tips: ["Read the reconciliation with the geologist every month.", "Put lab turnaround on the dashboard.", "Variances explained in one sentence each.", "Handover report written during the rotation, not on the last day.", "Prepare for the PMP exam by mapping every site process to its knowledge area."],
    prof: "EVM looks like accounting. On a mining contract it is an early-warning system: CPI tells you the margin is leaking two months before the accounts do.",
    exercise: {
      intro: "Quarter contract value (BAC) $9.6 M. After 6 of 13 weeks: PV $4.4 M, EV $4.0 M, AC $4.3 M.",
      parts: [
        { q: "CPI", ans: 0.93, tol: 0.005, unit: "" },
        { q: "SPI", ans: 0.91, tol: 0.005, unit: "" },
        { q: "EAC (CPI method)", ans: 10.32, tol: 0.05, unit: "$M" },
        { q: "TCPI to finish on budget", ans: 1.06, tol: 0.01, unit: "" }
      ],
      solution: `<p>CPI = 4.0 / 4.3 = <b>0.93</b> (below 0.95: escalate). SPI = 4.0 / 4.4 = <b>0.91</b> (watch: second week below 0.90 triggers re-baseline).</p><p>EAC = 9.6 / 0.93 = <b>$10.32 M</b> → overrun ≈ $0.72 M.</p><p>TCPI = (9.6 − 4.0) / (9.6 − 4.3) = 5.6 / 5.3 = <b>1.06</b>: the remaining work must be 6% more efficient than budget. Not credible without a recovery plan.</p>`
    },
    tool: "evm"
  };

  A.modules = M;

  /* ------------------------------------------------------------------ */
  /* EXAMS (pass mark 80%)                                               */
  /* ------------------------------------------------------------------ */
  A.passMark = 0.8;
  A.exams = {
    engineer: [
      { q: "Survey reports 40 000 BCM of fresh rock (2.70 t/m³, swell 1.40). How many tonnes?", o: ["28 571 t", "56 000 t", "108 000 t", "151 200 t"], a: 2, why: "Tonnes = BCM × in-situ density = 40 000 × 2.70. Swell does not change mass." },
      { q: "Match factor 1.3 means:", o: ["The loader waits for trucks", "Trucks queue at the loader", "The fleet is perfectly balanced", "Trucks are overloaded"], a: 1, why: "MF > 1: more truck capacity than the loader can serve, so trucks queue." },
      { q: "A 5 cm wheel rut on the haul road gives a rolling resistance of about:", o: ["2%", "3%", "5%", "10%"], a: 2, why: "2% + 0.6% × 5 cm = 5%." },
      { q: "Which drilling method is the standard for 115–165 mm holes in hard gold-bearing rock?", o: ["Top hammer", "Down-the-hole (DTH)", "Rotary tricone", "Auger"], a: 1, why: "DTH keeps the hammer at the bit, giving straight holes and good penetration in hard rock." },
      { q: "A 3° angle error on an 11 m hole moves the toe by about:", o: ["0.06 m", "0.19 m", "0.58 m", "1.1 m"], a: 2, why: "11 × tan 3° = 0.58 m." },
      { q: "Before loading authorisation is issued, which document is mandatory?", o: ["Weekly production report", "As-drilled survey sign-off", "Fragmentation analysis", "Fuel reconciliation"], a: 1, why: "As-drilled sign-off is the safety and contractual gate before loading." },
      { q: "Charge per hole for 115 mm, ANFO 0.85 g/cm³, 8.5 m column:", o: ["37 kg", "62 kg", "75 kg", "98 kg"], a: 2, why: "7.854e-4 × 115² × 0.85 = 8.83 kg/m × 8.5 m = 75 kg." },
      { q: "Holes contain 2 m of water. Product choice?", o: ["ANFO, it will dry", "Emulsion or a water-resistant blend, or line the hole", "More stemming", "Delay the blast a week"], a: 1, why: "ANFO has no water resistance; it dissolves and can misfire." },
      { q: "The main control for flyrock and airblast from the collar is:", o: ["Larger booster", "Correct stemming length and material", "Longer subdrill", "Faster inter-row delays"], a: 1, why: "Insufficient or poor stemming lets gas vent at the collar." },
      { q: "Storm 60 mm on a 15 ha catchment, C = 0.8. Runoff volume?", o: ["720 m³", "7 200 m³", "9 000 m³", "72 000 m³"], a: 1, why: "0.060 × 150 000 × 0.8 = 7 200 m³." },
      { q: "A rock larger than about 80% of the crusher gape should be:", o: ["Tipped slowly", "Sent to the oversize pile for breaking", "Mixed with fines", "Tipped at night"], a: 1, why: "Oversize hangs up the crusher. Break it at the pit or with the rock breaker." },
      { q: "Blend: 7 000 t at 1.6 g/t + 3 000 t at 0.8 g/t. Grade?", o: ["1.20 g/t", "1.36 g/t", "1.44 g/t", "2.40 g/t"], a: 1, why: "(7 000 × 1.6 + 3 000 × 0.8) / 10 000 = 1.36 g/t." },
      { q: "A blank sample returns 0.45 g/t gold. Most likely cause?", o: ["High-grade ore", "Contamination in sampling or sample preparation", "Wet sample", "Normal variation"], a: 1, why: "Blanks should carry no gold. A result above detection signals contamination." },
      { q: "Why are ore polygons moved after a blast?", o: ["To include more tonnes", "Because the blast displaced the rock by several metres", "To meet the plan", "Survey error"], a: 1, why: "Blast movement shifts ore boundaries; unadjusted polygons dilute and lose ore." },
      { q: "During a misfire, the first action is:", o: ["Approach and inspect the hole", "Keep the exclusion zone, notify control, start the wait period", "Pull out the downline", "Re-tie and fire immediately"], a: 1, why: "Safety first: maintain the zone, notify, wait the prescribed time before a competent person inspects." }
    ],
    senior: [
      { q: "Physical availability 88%, use of availability 75%. Effective utilisation?", o: ["63%", "66%", "75%", "88%"], a: 1, why: "EU = PA × UoA = 0.88 × 0.75 = 66%." },
      { q: "OEM '10/10/20' payload policy means:", o: ["10% of loads may be 10% under", "≤10% of loads above 110% of target, none above 120%", "Load 10 t, 10 t, 20 t", "10% fuel saving"], a: 1, why: "It limits overloads to protect frames, tyres and drivetrains." },
      { q: "TKPH exceeding the tyre rating should first be solved by:", o: ["Buying bigger trucks", "Reviewing haul profile, speed and cooling time", "Raising tyre pressure", "Ignoring it in the wet season"], a: 1, why: "TKPH is load × speed; operational changes come before tyre changes." },
      { q: "Penetration rate falls 20% across the fleet in the same rock. First check?", o: ["Geology", "Bit condition and compressor pressure", "Operator roster", "Blast design"], a: 1, why: "Consumables and air are the most common causes of apparent hardness changes." },
      { q: "Pre-split hole spacing is typically:", o: ["2–4 × D", "10–12 × D", "25–35 × D", "Same as production spacing"], a: 1, why: "Close spacing with decoupled charges creates a crack plane on the wall line." },
      { q: "In Kuz-Ram, raising powder factor while keeping charge per hole constant:", o: ["Coarsens X50", "Reduces X50", "Does not change X50", "Only changes the uniformity"], a: 1, why: "X50 ∝ K^-0.8: higher K, finer fragmentation." },
      { q: "The USBM vibration constant k = 160 applies to:", o: ["PPV in mm/s with SD in m/kg½", "PPV in in/s with SD in ft/lb½", "Airblast in dB(L)", "Any unit system"], a: 1, why: "160 is the imperial value. The metric equivalent is about 1 140 (mm/s, m/kg½)." },
      { q: "PPV limit 25 mm/s at 300 m, k = 1 140, β = 1.6. Maximum instantaneous charge is about:", o: ["190 kg", "760 kg", "1 500 kg", "3 000 kg"], a: 1, why: "SD = (1140/25)^(1/1.6) = 45.6^0.625 = 10.9 m/kg½; Q = (300/10.9)² ≈ 760 kg per 8 ms." },
      { q: "Airblast for structural and regulatory compliance is reported in:", o: ["dB(A)", "dB(L) (linear)", "mm/s", "Hz"], a: 1, why: "dB(L) captures low-frequency energy that affects structures; dB(A) is for human hearing." },
      { q: "Doubling the pipeline length (friction-dominated system) at the same pump will:", o: ["Increase flow", "Move the operating point to lower flow", "Not change anything", "Double flow"], a: 1, why: "The system curve steepens; it crosses the pump curve at lower flow." },
      { q: "Main reason to depressurise pit walls:", o: ["Cheaper blasting", "Increase effective stress and factor of safety", "Dust control", "Faster hauling"], a: 1, why: "Pore pressure reduces effective normal stress on failure surfaces." },
      { q: "F1 = 1.08, F2 = 0.95. Interpretation?", o: ["Resource model optimistic, mining good", "Resource model conservative; ounces lost between GC and plant", "Both perfect", "Plant over-recovering"], a: 1, why: "F1 > 1: GC found more than the resource model. F2 < 1: losses after GC (dilution, ore loss, sampling bias)." },
      { q: "A CRM result is beyond +3 SD. Action?", o: ["Accept", "Fail the batch, re-assay, investigate", "Delete the CRM", "Average with the next result"], a: 1, why: "Beyond ±3 SD is a QAQC failure; results cannot be used until resolved." },
      { q: "The variogram nugget effect represents:", o: ["Distance of correlation", "Variability at zero distance: sampling error and micro-scale geology", "Mean grade", "Cut-off grade"], a: 1, why: "The nugget is the discontinuity at the origin of the variogram." },
      { q: "Adding trucks to a fleet where trucks already queue at the loader will:", o: ["Increase production a lot", "Raise cost per tonne with little extra production", "Reduce queue", "Improve availability"], a: 1, why: "The loader is the constraint; extra trucks only queue." }
    ],
    pm: [
      { q: "The client's mine manager says 'load it now, we will sign later'. Correct response?", o: ["Load, to keep the schedule", "Do not load; request written authorisation and record the instruction", "Load half the pattern", "Ask the supplier to sign"], a: 1, why: "Loading without authorisation transfers liability to the contractor; record and request written confirmation." },
      { q: "EV $4.0 M, AC $4.3 M, PV $4.4 M. CPI and SPI?", o: ["1.08 / 1.10", "0.93 / 0.91", "0.91 / 0.93", "1.10 / 0.98"], a: 1, why: "CPI = 4.0/4.3 = 0.93; SPI = 4.0/4.4 = 0.91." },
      { q: "CPI 0.89 this month. Per the site thresholds you should:", o: ["Do nothing", "Escalate only", "Trigger a cost-recovery review", "Re-baseline the schedule"], a: 2, why: "CPI < 0.90 triggers a cost-recovery review (escalation already at < 0.95)." },
      { q: "A change in pattern after drilling, ordered by the client, requires redrill. This is:", o: ["Contractor cost", "A variation to record and claim", "Covered by the margin", "A safety issue only"], a: 1, why: "Client-caused change is a scope change: capture it in the variation register." },
      { q: "In PMBOK terms, the variation register belongs mainly to:", o: ["Resource Management", "Scope and Integration (change control)", "Quality Management", "Communications"], a: 1, why: "Change control is part of Integrated Change Control and scope management." },
      { q: "The explosives supplier's product fails in a misfire. Who is accountable for the blast?", o: ["The supplier", "The blasting contractor", "The client", "The regulator"], a: 1, why: "The supplier is a subcontractor; accountability for the blast stays with the contractor." },
      { q: "Explosives reconciliation shows 120 kg unaccounted for. Action?", o: ["Adjust next month", "Treat as an incident: secure, investigate, report as required by law", "Ignore if under 1%", "Ask operators to sign for it"], a: 1, why: "Explosives security is a legal obligation; any discrepancy is investigated and reported." },
      { q: "Best evidence for a standby claim against the client:", o: ["Monthly summary", "Daily cause-coded delay sheets signed by both parties", "Operator recollection", "Email after the dispute"], a: 1, why: "Contemporaneous, jointly signed records are the strongest evidence." },
      { q: "Fleet availability 82% vs 85% target, 1.2 Mt/month at $3.20/t. Revenue lost per month approx:", o: ["$38 000", "$135 000", "$384 000", "$1.2 M"], a: 1, why: "1.2 Mt × (1 − 82/85) × 3.20 ≈ $135 500." },
      { q: "Reorder point: 0.4 units/day, lead time 75 days, safety stock 12 units:", o: ["30", "42", "75", "87"], a: 1, why: "ROP = 0.4 × 75 + 12 = 42." },
      { q: "Most effective control of rotation-handover risk:", o: ["Longer rotations", "Standard handover report plus overlap and joint site walk", "Phone calls", "Email at month end"], a: 1, why: "Structured documentation and overlap preserve information across rotations." },
      { q: "Discharge water downstream turns turbid after a storm. Priority?", o: ["Wait for it to clear", "Contain, notify per ESIA/permit, engage community, fix sediment control", "Increase pumping", "Report at month end"], a: 1, why: "Environmental and community commitments require immediate response and notification." },
      { q: "Dewatering is client scope in the contract. Pumps fail; wet holes double. The extra emulsion cost is:", o: ["Contractor's", "Potentially claimable as a variation if logged at the time", "Shared automatically", "Insurance"], a: 1, why: "Cost caused by client scope failure can be claimed if recorded contemporaneously." },
      { q: "TCPI of 1.25 means:", o: ["Project under budget", "Remaining work must be 25% more efficient than budget to finish on BAC", "25% complete", "Schedule ahead"], a: 1, why: "TCPI = (BAC − EV)/(BAC − AC); above 1.1 is rarely achievable without a change." },
      { q: "Escalation to the client's GM should lead with:", o: ["Who is to blame", "Quantified impact, cause and a costed proposal", "Technical detail", "Contract clause numbers only"], a: 1, why: "Decision makers act on impact and options." }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* PROFESSOR'S CORRECTIONS (common errors seen on sites)               */
  /* ------------------------------------------------------------------ */
  A.corrections = [
    { claim: "USBM vibration default k = 160, n = 1.6 for PPV in mm/s.", fix: "k = 160 is the imperial value (PPV in in/s, scaled distance in ft/lb½). In metric (mm/s, m/kg½) the same curve is k ≈ 1 140. Using 160 in metric under-predicts PPV about 7 times and allows a MIC about 11 times too large at the same limit." },
    { claim: "Burden B = 0.012 × (SGe/SGr)^(1/3) × De.", fix: "This mixes Konya's two formulas. Metric Konya: B = 0.012 × (2·SGe/SGr + 1.5) × De (m, De in mm). Cube-root form: B = 0.0378 × (SGe/SGr)^(1/3) × De. The mixed version gives about 0.9 m for a 115 mm hole instead of about 2.9 m." },
    { claim: "42 ms between rows is an ISEE minimum.", fix: "ISEE does not set a fixed row delay. Konya's guide is 6.5–13 ms per metre of burden (2–4 ms/ft); 42 ms suits a 3.5 m burden but must scale with burden and be validated by muckpile and vibration results." },
    { claim: "Airblast methodology follows USBM RI 8507.", fix: "RI 8507 (Siskind et al., 1980) covers ground vibration. Airblast is RI 8485 (Siskind et al., 1980). Both are USBM 1980 and often cited together." },
    { claim: "Powder factor is the main design parameter.", fix: "Powder factor is an outcome of geometry and charge. Design burden, spacing, stemming and timing; check powder factor as a sanity range." },
    { claim: "Availability is availability.", fix: "Physical availability, mechanical availability and use of availability differ. Write the contractual definition down before arguing about the number." }
  ];

  A.glossary = [
    ["Bench", "Gradin", "Horizontal step of the pit, defined by bench height and berm width."],
    ["Burden", "Banquette / Burden", "Distance from a hole to the free face or the previous row."],
    ["Spacing", "Espacement", "Distance between holes in the same row."],
    ["Subdrill", "Surforation", "Drilling below the bench floor grade to avoid toes."],
    ["Stemming", "Bourrage", "Inert material at the collar to confine the explosive gas."],
    ["Powder factor", "Consommation spécifique", "Explosive per unit rock (kg/m³ or kg/t)."],
    ["Misfire", "Raté de tir", "Charge that did not detonate as designed."],
    ["Flyrock", "Projections", "Rock thrown beyond the expected zone."],
    ["PPV", "Vitesse particulaire de crête", "Peak particle velocity of ground vibration (mm/s)."],
    ["MIC", "Charge unitaire instantanée max.", "Maximum charge firing within an 8 ms window."],
    ["Sump", "Puisard", "Low point collecting pit water for pumping."],
    ["Total dynamic head", "Hauteur manométrique totale", "Static lift plus friction losses."],
    ["ROM pad", "Stock ROM / aire de stockage", "Run-of-mine stockpile area at the crusher."],
    ["Oversize", "Hors-gabarit / blocs", "Rock too large for the crusher gape."],
    ["Grade control", "Contrôle des teneurs", "Close-spaced sampling to separate ore and waste."],
    ["Reverse circulation (RC)", "Circulation inverse", "Drilling with sample return inside the rods."],
    ["Cut-off grade", "Teneur de coupure", "Grade separating ore from waste economically."],
    ["Dilution", "Dilution", "Waste mined and sent with ore."],
    ["Match factor", "Facteur d'appariement", "Ratio of truck capacity to loader capacity."],
    ["Rolling resistance", "Résistance au roulement", "Resistance from tyre penetration and road surface (%)."],
    ["Variation order", "Avenant / ordre de modification", "Formal record of a change in contract scope."],
    ["Earned value", "Valeur acquise", "Value of work done at budgeted rates."]
  ];

  A.references = [
    "Konya, C.J. & Walter, E.J. (1990). Surface Blast Design. Prentice Hall.",
    "ISEE (2011). Blasters' Handbook, 18th ed. International Society of Explosives Engineers.",
    "Cunningham, C.V.B. (1983). The Kuz-Ram model for prediction of fragmentation from blasting. 1st Int. Symp. Rock Fragmentation by Blasting, Luleå.",
    "Siskind, D.E. et al. (1980). USBM RI 8507: Structure response and damage produced by ground vibration from surface mine blasting.",
    "Siskind, D.E. et al. (1980). USBM RI 8485: Structure response and damage produced by airblast from surface mining.",
    "Richards, A.B. & Moore, A.J. (2004). Flyrock control: by chance or design. ISEE 30th Annual Conference.",
    "Hustrulid, W., Kuchta, M. & Martin, R. (2013). Open Pit Mine Planning and Design, 3rd ed. CRC Press.",
    "Tannant, D.D. & Regensburg, B. (2001). Guidelines for Mine Haul Road Design. University of British Columbia.",
    "Beale, G. & Read, J. (eds) (2013). Guidelines for Evaluating Water in Pit Slope Stability. CSIRO Publishing.",
    "Read, J. & Stacey, P. (eds) (2009). Guidelines for Open Pit Slope Design. CSIRO Publishing.",
    "Abzalov, M. (2016). Applied Mining Geology. Springer.",
    "Project Management Institute (2021). PMBOK Guide, 7th ed., and Process Groups: A Practice Guide (2022)."
  ];

  window.ACADEMY = A;
})();
