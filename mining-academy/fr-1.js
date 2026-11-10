/* Bench to Boardroom — traduction française (1/3) : cycles, activités, modules du cycle Ingénieur.
   Même structure que content.js ; seuls les textes sont traduits (les valeurs numériques restent dans content.js). */
(function () {
  const F = window.ACADEMY_FR = window.ACADEMY_FR || { modules: {} };

  F.cycles = [
    { name: "Ingénieur", years: "0–3 ans",
      role: "Ingénieur mines / forage-tir en poste. Exécute le plan en sécurité et enregistre ce qui s'est réellement passé.",
      goal: "Maîtriser un poste d'une activité : calculer, vérifier, enregistrer, et arrêter le travail quand quelque chose ne va pas.",
      competencies: ["Calculs de terrain sans tableur", "Connaît et respecte les points d'autorisation", "Saisie de données propre et honnête (arrêts, foré réel, chargements)", "Reconnaît les dangers et ose arrêter le travail"] },
    { name: "Ingénieur senior", years: "3–7 ans",
      role: "Responsable de la conception et de la performance d'une activité sur tous les postes. Encadre les ingénieurs.",
      goal: "Transformer les données de terrain en meilleures conceptions : régressions, réconciliations, optimisation et standards écrits.",
      competencies: ["Construit des modèles propres au site à partir des mesures", "Diagnostique les causes racines, pas les symptômes", "Rédige le standard que les juniors appliquent", "Chiffre les arbitrages en $/t, pas en opinions"] },
    { name: "Chef de projet", years: "7 ans et +",
      role: "Responsable du contrat : sécurité, planning, coûts, relation client et personnel sur toutes les activités.",
      goal: "Livrer les prestations contractuelles à la marge prévue tout en protégeant la position contractuelle de l'entrepreneur.",
      competencies: ["Maîtrise et prévision par la valeur acquise", "Gestion des modifications et des avenants", "Propriété des risques et escalade", "Gestion des parties prenantes : client, fournisseur, administration, communautés"] }
  ];

  F.activities = [
    { name: "Chargement & transport" }, { name: "Foration" }, { name: "Tir à l'explosif" },
    { name: "Exhaure" }, { name: "Alimentation concasseur" }, { name: "Contrôle des teneurs" }
  ];

  const E = F.modules.engineer = {};

  E.loadhaul = {
    title: "Déplacer la roche : en place, foisonné et tonnes",
    objectives: ["Convertir entre m³ en place, m³ foisonnés et tonnes", "Décomposer le cycle d'un camion", "Calculer le nombre de passes, la charge utile et le facteur d'appariement", "Appliquer les règles des pistes et des interactions engins"],
    lessons: [
      { h: "Trois façons de mesurer la même roche", body: `<p>La topographie mesure des <b>m³ en place (BCM)</b> : la roche intacte. Le tir crée des vides, donc la même roche dans le godet devient des <b>m³ foisonnés (LCM)</b>. L'usine et le client paient en <b>tonnes</b>.</p><ul><li>Coefficient de foisonnement = LCM / BCM. Roche saine abattue : 1,3–1,5. Oxyde/latérite : 1,2–1,3.</li><li>Densité foisonnée = densité en place / coefficient de foisonnement.</li><li>Densité sèche en place : latérite/oxyde 1,8–2,2 t/m³ ; transition 2,3–2,5 ; roche saine 2,65–2,85.</li></ul><p>Précisez toujours la base. « 50 000 m³ » ne veut rien dire tant que vous n'avez pas dit en place ou foisonné.</p>` },
      { h: "Le cycle du camion", body: `<p>Cycle = mise à quai + chargement + transport en charge + manœuvre et déchargement + retour à vide + attente. L'attente est le temps caché : personne ne la planifie, tout le monde la paie.</p><p>Heure productive : une heure de 60 minutes en donne rarement 60. Utilisez 50 minutes (rendement 0,83) en planification, sauf si les données du site disent autre chose.</p>` },
      { h: "Passes, charge utile et facteur d'appariement", body: `<p><b>Charge du godet</b> = capacité à refus × taux de remplissage × densité foisonnée. Le taux de remplissage est le meilleur indicateur de la qualité de fragmentation au front : 0,95–1,05 bien abattu, 0,75–0,85 en blocs.</p><p><b>Nombre de passes</b> = charge nominale / charge du godet. Visez un nombre entier de 3 à 5 passes. Une demi-passe finale coûte un cycle de godet complet.</p><p><b>Facteur d'appariement</b> MF = (N<sub>camions</sub> × temps de chargement) / (N<sub>chargeuses</sub> × temps de cycle camion). MF &lt; 1 : la pelle attend les camions. MF &gt; 1 : les camions font la queue. La pelle est l'engin le plus cher ; planifiez proche de 1,0 et gérez les regroupements avec le dispatching.</p>` },
      { h: "Pistes et interactions", body: `<ul><li>Résistance au roulement ≈ 2 % + 0,6 % par cm d'enfoncement des pneus. Cinq centimètres d'ornière en saison des pluies la triplent.</li><li>Résistance totale = résistance au roulement + pente (%). Rampes normalement à 8–10 %.</li><li>Largeur roulable d'une piste à double sens ≥ 3,5 × le camion le plus large ; voie unique ≥ 2 ×.</li><li>Merlon de sécurité d'au moins la moitié de la hauteur du pneu du plus gros camion. Il guide ; il n'arrête pas un camion chargé lancé.</li><li>Dévers de 2–3 % pour évacuer l'eau. Une flaque sur la piste est un défaut de piste.</li><li>Véhicules légers : communication radio positive avant d'entrer sur une piste, fanion et gyrophare, jamais dans l'angle mort d'un camion.</li></ul>` }
    ],
    formulas: [
      { name: "Densité foisonnée", note: "t/m³ ; SF = coefficient de foisonnement" },
      { name: "Charge du godet", note: "t" },
      { name: "Facteur d'appariement", note: "sans dimension" },
      { name: "Production de la flotte", note: "t/h, limitée par la pelle" }
    ],
    tips: ["Placez les camions pour que la pelle tourne de 60–90°. Une rotation de 180° allonge fortement chaque cycle de godet.", "Le chargement des deux côtés supprime l'essentiel du temps d'échange des camions. Demandez-le quand le front le permet.", "Codez honnêtement les causes d'arrêt. « Autre » n'est pas une cause ; c'est une leçon perdue.", "Les relèves, la première et la dernière heure cachent les plus grosses pertes. Une relève au volant vaut 20 à 30 minutes par camion et par jour.", "Contrôlez les dents du godet à la prise de poste. Une dent perdue dans le concasseur arrête l'usine."],
    prof: "Les juniors déclarent souvent la production en nombre de voyages × charge nominale. Ce chiffre est une supposition. Utilisez le système de pesée embarqué ou le pont-bascule, et réconciliez avec les m³ en place levés en fin de mois. L'écart entre les trois est votre premier vrai travail d'ingénieur.",
    exercise: {
      intro: "Une pelle de 12 m³ charge des tombereaux rigides de 90 t en roche saine. Densité en place 2,70 t/m³, foisonnement 1,40, taux de remplissage 0,90. Cycle godet 30 s, mise à quai 30 s. Cycle camion 25 min. Rendement 0,83.",
      parts: [
        { q: "Charge du godet", unit: "t" },
        { q: "Nombre entier de passes (sans dépasser la charge nominale)", unit: "passes" },
        { q: "Camions nécessaires pour MF = 1,0 (chargement + mise à quai)", unit: "camions" },
        { q: "Production de la flotte limitée par la pelle", unit: "t/h" }
      ],
      solution: `<p>ρ<sub>foisonnée</sub> = 2,70 / 1,40 = 1,93 t/m³ → P<sub>g</sub> = 12 × 0,90 × 1,93 = <b>20,8 t</b>.</p><p>90 / 20,8 = 4,3 → <b>4 passes</b> = 83,3 t (93 % du nominal). Cinq passes surchargeraient à 104 t.</p><p>Temps de service de la pelle = 4 × 30 s + 30 s = 150 s = 2,5 min. N = 25 / 2,5 = <b>10 camions</b>.</p><p>Q = (60 / 2,5) × 83,3 × 0,83 = <b>1 660 t/h</b>.</p>`
    }
  };

  E.drilling = {
    title: "Mettre le trou là où le plan l'indique",
    objectives: ["Choisir entre marteau hors trou, fond de trou et rotary", "Implanter et forer dans les tolérances", "Tenir un journal de foration exploitable par l'ingénieur tir", "Estimer la productivité et les tonnes par mètre foré"],
    lessons: [
      { h: "Méthodes de foration", body: `<ul><li><b>Marteau hors trou</b> : 64–127 mm, rapide en trous courts, la déviation croît avec la profondeur. Prédécoupage, débitage secondaire, petits gradins.</li><li><b>Marteau fond de trou (MFT/DTH)</b> : 90–254 mm, marteau au taillant, trous rectilignes ; le standard des mines d'or en roche dure.</li><li><b>Rotary (tricône)</b> : 200–311 mm et plus, poussée et rotation, adapté aux roches plus tendres ou aux très grandes exploitations.</li></ul><p>La vitesse de pénétration dépend de la résistance de la roche, de la pression d'air et de l'état du taillant. Elle chute dans la même roche quand le taillant est usé : suivez-la.</p>` },
      { h: "La précision est un paramètre du tir", body: `<p>Tolérances usuelles : position de tête ±0,2 m, profondeur ±0,2 m, inclinaison ±1°. Une erreur de 1° sur un trou de 11 m décale le pied de 0,19 m ; 3° le décalent de 0,58 m, soit 17 % d'une banquette de 3,5 m.</p><ul><li>Implantez au GPS ou par un topographe. Ne mesurez jamais une maille au pas.</li><li>Mettez la foreuse de niveau sur ses vérins avant d'attaquer, contrôlez l'angle du mât.</li><li>Attaquez lentement dans le terrain fracturé, puis passez en pleine avance.</li></ul>` },
      { h: "Le journal de foration", body: `<p>Le journal de foration est la première donnée géotechnique de chaque tir. Notez par trou : profondeur forée réelle, eau, vides ou cavités, terrain fracturé, argile, changement de pénétration, et tout trou non terminé.</p><p>Sondez chaque trou après foration. Les trous remblayés ou effondrés sont reforés ou recalculés avant chargement. <b>Pas d'autorisation de chargement sans validation du foré réel</b> : c'est un point d'arrêt sécurité et contractuel.</p>` },
      { h: "Productivité", body: `<p>Temps par trou = longueur / vitesse de pénétration + déplacement et mise en station. Les heures effectives de foration sur un poste de 12 h sont en général de 8 à 9 après relève, contrôle prise de poste, ravitaillement et pauses.</p><p>Tonnes par mètre foré = (B × S × H × ρ) / longueur du trou. Ce ratio relie la foration au plan minier : tonnes à abattre ÷ t/m = mètres à forer.</p>` }
    ],
    formulas: [
      { name: "Longueur du trou", note: "m ; θ par rapport à la verticale, J = surforation" },
      { name: "Décalage du pied", note: "m" },
      { name: "Tonnes par mètre", note: "t/m" },
      { name: "Trous par poste", note: "PR en m/min" }
    ],
    tips: ["Protégez chaque tête de trou en saison des pluies : un bouchon coûte moins cher qu'une reforation.", "Notez la hauteur d'eau par trou ; elle décide entre ANFO et émulsion, et donc le budget explosif.", "Une pénétration soudainement rapide sur 1–2 m signale souvent un vide ou une faille. Notez-le ; l'ingénieur tir doit faire un découpage de charge.", "Ne forez jamais dans ou à côté d'un culot de trou ancien. Il peut contenir de l'explosif.", "Changez le taillant selon son usure (calibre), pas par habitude."],
    prof: "Un entrepreneur forage-tir est souvent payé au mètre, la pression est donc de forer vite. Le vrai indicateur est le résultat du tir. Une maille forée à 0,5 m de sa position coûtera plus en pieds, blocs et reforation que les mètres gagnés.",
    exercise: {
      intro: "Hauteur de gradin 10 m, trous verticaux, surforation 1,0 m, banquette 3,5 m, espacement 4,0 m, densité de la roche 2,70 t/m³. Vitesse de pénétration 30 m/h, déplacement et mise en station 4 min par trou, 9 heures effectives par poste.",
      parts: [
        { q: "Longueur du trou", unit: "m" },
        { q: "Tonnes par mètre foré", unit: "t/m" },
        { q: "Trous par poste (trous entiers)", unit: "trous" },
        { q: "Mètres par poste", unit: "m" }
      ],
      solution: `<p>L = 10 + 1,0 = <b>11 m</b>.</p><p>t/m = 3,5 × 4,0 × 10 × 2,70 / 11 = 378 / 11 = <b>34,4 t/m</b>.</p><p>Temps par trou = 11 / 30 × 60 + 4 = 22 + 4 = 26 min. n = 540 / 26 = 20,8 → <b>20 trous complets</b>, <b>220 m</b> (228 m en comptant le trou commencé).</p>`
    }
  };

  E.blasting = {
    title: "Le trou chargé et le tir sûr",
    objectives: ["Nommer les parties d'un trou de mine et leur rôle", "Calculer la charge par trou et la consommation spécifique", "Choisir ANFO ou émulsion pour les trous en eau", "Conduire une évacuation de tir et connaître la procédure de raté"],
    lessons: [
      { h: "Explosifs et amorçage", body: `<ul><li><b>ANFO</b> (94/6) : densité 0,80–0,85 g/cm³, bon marché, <b>aucune résistance à l'eau</b>.</li><li><b>Émulsion</b> : 1,10–1,30 g/cm³, résiste à l'eau, plus d'énergie par mètre, plus chère.</li><li><b>Mélanges (ANFO lourd)</b> : émulsion/ANFO. Au-delà d'environ 50 % d'émulsion, ils deviennent pompables et résistants à l'eau.</li><li><b>Booster</b> (amorce coulée) en pied de colonne, initié par un <b>détonateur de fond</b> : tube à choc (retard pyrotechnique) ou électronique.</li><li>Les raccords de surface transmettent la temporisation d'un trou à l'autre. Les retards pyrotechniques ont une dispersion ; les électroniques se programment à la milliseconde.</li></ul>` },
      { h: "Géométrie du tir en gradin", body: `<p>Banquette B (jusqu'à la face libre), espacement S (le long de la rangée), hauteur de gradin H, surforation J, bourrage T, diamètre D.</p><ul><li>Banquette : 25–35 × D en roche dure (115 mm → 2,9–4,0 m). Konya : B = 0,012 × (2·SG<sub>e</sub>/SG<sub>r</sub> + 1,5) × D, B en m, D en mm.</li><li>Espacement 1,0–1,3 × B (maille en quinconce de préférence).</li><li>Surforation 0,3 × B ; bourrage 0,7–1,0 × B avec du gravillon concassé anguleux d'environ D/10.</li><li>Rapport de raideur H/B ≥ 3 pour une bonne fragmentation ; en dessous de 2, le front sort en blocs et projette.</li></ul>` },
      { h: "Chargement et consommation spécifique", body: `<p>Charge linéique (kg/m) = 7,854 × 10<sup>-4</sup> × D² × ρ, D en mm, ρ en g/cm³. Charge par trou = charge linéique × longueur de colonne. Consommation spécifique = charge / (B × S × H), en kg/m³ (ou kg/t).</p><p>Sondez chaque trou juste avant le chargement et ajustez la colonne à la profondeur et à l'eau réelles. Un seul gabarit pour une maille aux profondeurs variables est une erreur de conception.</p>` },
      { h: "Évacuation et ratés", body: `<ul><li>Zone d'exclusion fixée par le standard du site (en général 500 m personnel, 300 m engins), gardée par des sentinelles équipées de radios. Comptez chaque personne évacuée.</li><li>Foudre : suspendez le chargement et évacuez la maille quand le détecteur signale des orages dans la distance de déclenchement du site. La saison des pluies en Guinée apporte des orages convectifs quotidiens.</li><li>Raté : maintenez la zone d'exclusion, prévenez la salle de contrôle, attendez (30 min minimum en pyrotechnique ; règle du site si la cause est inconnue), puis un boutefeu compétent inspecte. Ne retirez jamais une charge. Enregistrez et déclarez chaque raté.</li><li>Terrain réactif (roche riche en sulfures) : mesurez la température des trous et utilisez des produits inhibés quand c'est exigé.</li></ul>` }
    ],
    formulas: [
      { name: "Charge linéique", note: "kg/m ; D en mm, ρ en g/cm³" },
      { name: "Charge par trou", note: "kg" },
      { name: "Consommation spécifique", note: "kg/m³" },
      { name: "Banquette de Konya", note: "m ; D en mm" }
    ],
    tips: ["Mesurez le bourrage au décamètre, pas à l'œil. Un bourrage trop court est la première cause de projections et de surpression aérienne.", "Les cuttings de foration sont une poudre fine qui est éjectée. Utilisez du gravillon anguleux en roche saine.", "Ne laissez pas l'ANFO séjourner dans des trous en eau ; il se dissout et perd son énergie. Gainez le trou ou utilisez de l'émulsion.", "Parcourez le raccordement après la liaison et avant l'évacuation : contrôlez chaque raccord et chaque détonateur de fond.", "Le tir n'est pas terminé tant que l'inspection après tir n'est pas signée."],
    prof: "La consommation spécifique est un résultat, pas une donnée de conception. Si vous concevez en choisissant une consommation spécifique, vous cacherez une mauvaise banquette et un mauvais espacement derrière « plus d'explosif ». Concevez d'abord la géométrie, puis vérifiez que la consommation spécifique est dans la plage attendue (0,45–0,75 kg/m³ en roche saine dure).",
    exercise: {
      intro: "Diamètre 115 mm, gradin 10 m, surforation 1,0 m, bourrage 2,5 m, banquette 3,5 m, espacement 4,0 m. ANFO à 0,85 g/cm³. (Ce sont les valeurs par défaut du Blast Predictor du site.)",
      parts: [
        { q: "Charge linéique", unit: "kg/m" },
        { q: "Charge par trou", unit: "kg" },
        { q: "Consommation spécifique", unit: "kg/m³" },
        { q: "Banquette de Konya (SG roche 2,70)", unit: "m" }
      ],
      solution: `<p>q = 7,854×10⁻⁴ × 115² × 0,85 = <b>8,83 kg/m</b>.</p><p>Colonne = 11 − 2,5 = 8,5 m → Q = 8,83 × 8,5 = <b>75,1 kg</b>.</p><p>CS = 75,1 / (3,5 × 4,0 × 10) = <b>0,536 kg/m³</b>.</p><p>Konya : 0,012 × (2 × 0,85 / 2,70 + 1,5) × 115 = 0,012 × 2,13 × 115 = <b>2,94 m</b>. La banquette de conception de 3,5 m est 19 % plus large que le guide de Konya : attendez-vous à une fragmentation plus grossière et à des pieds, sauf si les résultats de terrain prouvent que la roche le tolère.</p>`
    }
  };

  E.dewatering = {
    title: "Garder l'eau hors du chemin de l'exploitation",
    objectives: ["Identifier les sources d'eau de la fosse", "Dimensionner un puisard pour une pluie de projet", "Effectuer les contrôles quotidiens des pompes", "Comprendre comment l'eau pénalise la foration, le tir et le transport"],
    lessons: [
      { h: "D'où vient l'eau de la fosse", body: `<ul><li>Pluie directe sur la fosse et ruissellement du bassin versant autour.</li><li>Infiltrations d'eau souterraine par les parois et le fond ; dans les profils latérite/saprolite, nappes perchées au-dessus de l'argile.</li><li>Climat de Haute-Guinée : une seule saison des pluies (environ mai à octobre, pic en août–septembre), 1 300–1 800 mm par an, orages de 50–100 mm en une journée.</li></ul>` },
      { h: "Puisards et pompes", body: `<p>Le puisard est au point bas de la zone active, loin des tirs et de la circulation, dimensionné pour stocker une pluie de projet pendant que les pompes rattrapent.</p><ul><li>Volume d'orage V = hauteur de pluie × surface du bassin × coefficient de ruissellement (0,7–0,9 en fosse).</li><li>Pompes diesel sur châssis : centrifuges auto-amorçantes, mobiles. Pompes électriques immergées : efficaces, nécessitent un réseau électrique.</li><li>Conduites de refoulement en PEHD avec ancrages, vannes et clapet anti-retour à la pompe.</li></ul>` },
      { h: "Routine quotidienne", body: `<ul><li>La pompe tourne ? Le refoulement coule ? Carburant, huile, compteur horaire.</li><li>Crépine d'aspiration propre, flotteurs fonctionnels, pas de prise d'air.</li><li>Niveau du puisard par rapport au repère. Un niveau qui monte signifie que les apports dépassent la capacité : signalez-le avant que le gradin inférieur soit inondé.</li><li>Tournée de la conduite : fuites, coudes écrasés, dégâts causés par la circulation.</li></ul>` },
      { h: "Pourquoi l'exploitation s'en soucie", body: `<p>Les trous en eau imposent l'émulsion au lieu de l'ANFO (coût par tonne plus élevé). Les sols détrempés augmentent la résistance au roulement et coupent les pneus. La pression d'eau dans les parois réduit la stabilité des talus. Le minerai humide et collant bouche le concasseur. L'exhaure est une activité de production, pas un service.</p>` }
    ],
    formulas: [
      { name: "Volume d'orage", note: "m³ ; P en mm, A en m² (1 ha = 10 000 m²)" },
      { name: "Temps de pompage", note: "h ; Q en L/s" }
    ],
    tips: ["Creusez le prochain puisard avant la saison des pluies, pas pendant le premier orage.", "Ne vous tenez jamais au bord d'un puisard plein ; le bord est sapé et saturé.", "Gardez une pompe de secours sur site et faites-la tourner chaque semaine.", "Planifiez les tirs pour que le puisard ne soit jamais dans la zone de tir.", "Photographiez chaque jour le niveau du puisard depuis le même point : une donnée bon marché et convaincante."],
    prof: "Une pompe annoncée à 150 L/s les débite rarement. Son débit dépend de la hauteur manométrique totale sur sa courbe. Apprenez à lire la courbe de pompe avant de promettre un délai de pompage à qui que ce soit.",
    exercise: {
      intro: "Le bassin versant de la fosse fait 20 ha. Pluie de projet 80 mm en 24 h. Coefficient de ruissellement 0,80. Deux pompes débitant chacune 75 L/s à la hauteur de service.",
      parts: [
        { q: "Volume ruisselé de l'orage", unit: "m³" },
        { q: "Capacité de pompage totale", unit: "m³/h" },
        { q: "Temps de pompage (sans nouvel apport)", unit: "h" }
      ],
      solution: `<p>V = 0,080 × 200 000 × 0,80 = <b>12 800 m³</b>.</p><p>Q = 2 × 75 = 150 L/s = <b>540 m³/h</b>.</p><p>t = 12 800 / 540 = <b>23,7 h</b>. S'il pleut à nouveau le lendemain, vous êtes en retard : c'est ainsi que les fosses s'inondent.</p>`
    }
  };

  E.crusher = {
    title: "Alimenter l'usine avec la bonne roche",
    objectives: ["Organiser un stock ROM par teneur et type de minerai", "Calculer une teneur de mélange", "Maîtriser les hors-gabarits et les métaux étrangers", "Travailler en sécurité au quai de déchargement"],
    lessons: [
      { h: "Le stock ROM", body: `<p>L'aire de stockage ROM (tout-venant) fait tampon entre la mine et l'usine. Le minerai est stocké en doigts par classe de teneur (haute, moyenne, basse, marginale) et par type (oxyde, transition, sain). Chaque doigt porte un panneau avec la classe, la teneur, le tonnage et la date.</p><p>Le déversement direct au concasseur est le moins cher. La reprise à la chargeuse coûte à chaque fois ; elle ne se justifie que par le mélange ou le tampon.</p>` },
      { h: "Mélange", body: `<p>Teneur du mélange = Σ(t<sub>i</sub> × g<sub>i</sub>) / Σt<sub>i</sub>. L'usine a aussi besoin d'une dureté stable et d'une part limitée d'argile/oxyde : l'oxyde collant bouche goulottes et cribles en saison des pluies.</p>` },
      { h: "Hors-gabarits et métaux étrangers", body: `<ul><li>Bloc maximal d'environ 80 % de l'ouverture du concasseur (mâchoires ou giratoire). Les blocs plus gros se coincent et arrêtent l'alimentation.</li><li>Les hors-gabarits vont sur un tas séparé pour le brise-roche ou le débitage secondaire, jamais « juste cette fois » dans la trémie.</li><li>Les métaux étrangers (dents, taillants, tiges) endommagent le concasseur. Aimants et détecteurs protègent le convoyeur ; la discipline de terrain protège le concasseur.</li></ul>` },
      { h: "Sécurité au quai de déchargement", body: `<ul><li>Butée de roue ou merlon à chaque bord de déversement ; un camion ne recule jamais vers un bord qui n'en a pas.</li><li>Feux de circulation ou un guide contrôlent l'accès à la trémie.</li><li>Personne sous le quai ni près de la trémie quand le brise-roche travaille.</li><li>Abattage des poussières : rampes d'arrosage à la trémie et sur les pistes du stock.</li></ul>` }
    ],
    formulas: [
      { name: "Teneur du mélange", note: "g/t" },
      { name: "Or contenu", note: "onces troy" },
      { name: "Bloc maximal", note: "mm" }
    ],
    tips: ["Sachez ce dont le concasseur a besoin pour les prochaines 24 h avant d'envoyer les camions.", "Constituez un stock d'oxyde sec avant les pluies ; l'oxyde humide seul arrête l'usine.", "Levez les doigts du stock ROM chaque mois et réconciliez avec le comptage des camions.", "Marquez les hors-gabarits au front ; il est moins cher de les casser dans la fosse qu'au concasseur.", "Un camion qui décharge sur le mauvais doigt coûte de la teneur. Utilisez le dispatching et un plan ROM clair."],
    prof: "La mine est mesurée en tonnes déplacées ; l'entreprise est payée en or récupéré. L'alimentation du concasseur est le point où ces deux mesures se rencontrent. Le junior qui comprend les contraintes de l'usine devient la personne que les deux départements appellent.",
    exercise: {
      intro: "Le concasseur prendra 12 000 t demain. Mélange : 60 % du doigt HT (1,80 g/t, 20 % d'oxyde) et 40 % du doigt BT (0,90 g/t, 50 % d'oxyde). L'usine limite l'oxyde à 35 % de l'alimentation.",
      parts: [
        { q: "Teneur du mélange", unit: "g/t" },
        { q: "Part d'oxyde du mélange", unit: "%" },
        { q: "Or contenu dans l'alimentation", unit: "oz" }
      ],
      solution: `<p>g = 0,60 × 1,80 + 0,40 × 0,90 = <b>1,44 g/t</b>.</p><p>Oxyde = 0,60 × 20 + 0,40 × 50 = <b>32 %</b>, sous la limite de 35 %.</p><p>oz = 12 000 × 1,44 / 31,1035 = <b>556 oz</b>.</p>`
    }
  };

  E.gc = {
    title: "Distinguer le minerai du stérile, gradin par gradin",
    objectives: ["Expliquer pourquoi la foration de contrôle des teneurs existe", "Conduire l'échantillonnage RC selon le standard", "Insérer et vérifier les échantillons de contrôle qualité (QAQC)", "Délimiter le minerai et calculer la dilution"],
    lessons: [
      { h: "Pourquoi le contrôle des teneurs", body: `<p>Le modèle de ressources est foré à une maille de 25–50 m ; c'est une bonne estimation d'un gisement et une mauvaise estimation d'un bloc d'excavation. La foration de contrôle des teneurs (CT), généralement en circulation inverse (RC) à 5–12,5 m de maille, définit les limites minerai/stérile à l'échelle de ce que la pelle excave.</p>` },
      { h: "Échantillonnage RC", body: `<ul><li>Marteau à échantillonnage frontal ; les cuttings remontent à l'intérieur des tiges jusqu'au cyclone.</li><li>L'intervalle d'échantillonnage suit la passe du gradin (souvent 1 m ou 2,5 m). Divisez au diviseur conique ou à riffles jusqu'à 2–3 kg.</li><li>Les échantillons humides biaisent les résultats en or ; arrêtez et asséchez le trou ou signalez les échantillons.</li><li>Pesez le sac de rejet : une récupération inférieure à environ 70 % de l'attendu est une alerte.</li><li>Nettoyez le cyclone et le diviseur entre deux trous pour éviter la contamination.</li></ul>` },
      { h: "QAQC", body: `<p>Insérez environ un contrôle tous les 20 échantillons pour chaque type : matériaux de référence certifiés (MRC, teneur connue), blancs (sans or, contrôle de contamination) et doublons de terrain (précision de l'échantillonnage). Un MRC hors de ±3 écarts-types rejette le lot ; réanalysez avant d'utiliser les résultats.</p>` },
      { h: "Délimitation du minerai et dilution", body: `<ul><li>Les polygones de minerai sont conçus sur le modèle CT à la teneur de coupure et piquetés/balisés sur le terrain avec un code couleur (ex. rouge HT, orange MT, jaune BT, bleu stérile).</li><li>Le tir déplace la roche de 1 à 5 m. Décalez les polygones selon le mouvement mesuré avant d'excaver.</li><li>Un guide ou le dispatching confirme la destination de chaque chargement. Un mauvais déversement, c'est de l'or perdu.</li><li>Dilution : stérile extrait avec le minerai. Perte de minerai : minerai envoyé au stérile. Les deux sont payées par l'entreprise, pas par le planning de la mine.</li></ul>` }
    ],
    formulas: [
      { name: "Teneur de coupure d'équilibre", note: "g/t ; C $/t traitement + frais généraux, P $/oz, r redevance, R récupération" },
      { name: "Teneur diluée", note: "g/t" }
    ],
    tips: ["Passez au cyclone au début de chaque poste. La plupart des erreurs d'échantillonnage se voient.", "Étiquetez les sacs avant le trou, pas après.", "Un blanc qui renvoie de l'or signale une contamination : vérifiez le cyclone et le concasseur du laboratoire.", "Demandez au géologue quelles structures portent l'or. Les limites du minerai suivent la géologie, pas des lignes droites.", "Les résultats CT doivent revenir avant l'excavation du tir. Le délai du laboratoire est une contrainte de production."],
    prof: "L'or a un fort effet de pépite : deux moitiés du même échantillon peuvent donner des teneurs très différentes. C'est pourquoi la masse d'échantillon, la division et le QAQC ne sont pas de la paperasse ; ce sont les seules défenses contre une mauvaise classification d'un bloc.",
    exercise: {
      intro: "Prix de l'or 2 500 $/oz, redevance 5 %, récupération métallurgique 92 %, coût traitement + frais généraux 25 $/t de minerai. Un bloc de 10 000 t à 2,00 g/t est extrait avec 5 % de perte de minerai et 10 % de dilution (tonnes de dilution = 10 % des tonnes de minerai effectivement extraites) à 0,20 g/t.",
      parts: [
        { q: "Teneur de coupure d'équilibre", unit: "g/t" },
        { q: "Tonnes envoyées à l'usine", unit: "t" },
        { q: "Teneur livrée", unit: "g/t" }
      ],
      solution: `<p>Prix net par gramme = 2 500 × 0,95 / 31,1035 = 76,36 $/g ; × 0,92 = 70,25 $ par gramme en place. Teneur de coupure = 25 / 70,25 = <b>0,36 g/t</b>.</p><p>Minerai extrait = 9 500 t ; dilution = 950 t → <b>10 450 t</b>.</p><p>g = (9 500 × 2,00 + 950 × 0,20) / 10 450 = 19 190 / 10 450 = <b>1,84 g/t</b> (−8 % sur la teneur, −4 % sur les onces).</p>`
    }
  };
})();
