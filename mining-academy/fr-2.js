/* Bench to Boardroom — traduction française (2/3) : modules du cycle Ingénieur senior. */
(function () {
  const F = window.ACADEMY_FR = window.ACADEMY_FR || { modules: {} };
  const S = F.modules.senior = {};

  S.loadhaul = {
    title: "Performance de la flotte et modèle d'utilisation du temps",
    objectives: ["Appliquer un modèle d'utilisation du temps cohérent", "Utiliser la politique de charge utile et les limites TKPH", "Diagnostiquer les pertes de la flotte avec les données de dispatching", "Exprimer les améliorations en $/t"],
    lessons: [
      { h: "Un seul modèle de temps pour tous", body: `<p>Temps calendaire → moins arrêts programmés (pas de roster, jours fériés) → moins pannes et maintenance = <b>disponible</b> → moins attente (pas de conducteur, attente, météo, tir) = <b>en marche</b> → moins arrêts opérationnels (file d'attente, ravitaillement, relève) = <b>productif</b>.</p><ul><li>Disponibilité physique PA = (total − maintenance) / total.</li><li>Taux d'utilisation de la disponibilité UoA = en marche / disponible.</li><li>Utilisation effective = PA × UoA.</li></ul><p>Fixez les définitions par écrit avec le client. La plupart des litiges sur la disponibilité sont des litiges de définition.</p>` },
      { h: "Gestion de la charge utile", body: `<p>Les politiques constructeur autorisent en général au plus 10 % des chargements au-dessus de 110 % de la cible et aucun au-dessus de 120 % (la règle « 10/10/20 »). La surcharge augmente le carburant, l'usure des pneus et les dommages au châssis ; la sous-charge gaspille un cycle. Utilisez l'histogramme de pesée, pas la moyenne.</p>` },
      { h: "Pneus et TKPH", body: `<p>TKPH = charge moyenne par pneu (t) × vitesse moyenne sur le poste (km/h). Charge moyenne = (vide + chargé) / 2 sur le pneu le plus chargé. Si le TKPH du site dépasse la capacité du pneu (corrigée de la température ambiante et de la longueur de transport), le pneu surchauffe et se délamine. Corrigez le profil de transport ou la vitesse avant d'acheter un autre pneu.</p>` },
      { h: "Pilotage à intervalles courts", body: `<p>Analysez les données de dispatching toutes les 2 heures, pas en fin de mois : regroupements, attente à chaque pelle, vitesse à vide, temps d'attente au concasseur. Une attente de 2 minutes sur un cycle de 25 minutes immobilise 8 % de la flotte.</p>` }
    ],
    formulas: [
      { name: "Utilisation effective", note: "%" },
      { name: "TKPH", note: "t·km/h" },
      { name: "Résistance totale", note: "%" }
    ],
    tips: ["Comparez les vitesses en charge et à vide sur chaque rampe : une chute sur un tronçon signale un défaut de piste.", "Envoyez la niveleuse sur la piste à la plus forte résistance au roulement, pas sur la plus proche.", "L'attente au concasseur est souvent un problème de l'usine mais un coût de la mine. Mesurez-la et signalez-la.", "Présentez les pertes en tonnes et en dollars ; « utilisation 68 % » ne convainc personne.", "Formez les conducteurs avec leurs propres données de charge et de cycle, individuellement."],
    prof: "Les ingénieurs seniors ajoutent souvent des camions quand la production baisse. Avant de le faire, prouvez où va le temps. Ajouter des camions à une pelle qui a déjà une file d'attente augmente le coût par tonne sans changer la production.",
    exercise: {
      intro: "Un camion de 90 t (masse à vide 65 t) transporte 85 t. Le pneu le plus chargé porte 18 % de la masse totale en charge et 16 % de la masse à vide. Vitesse moyenne du poste 22 km/h. Par ailleurs : une flotte de 10 camions sur un cycle de 25 min perd en moyenne 2 min d'attente par cycle.",
      parts: [
        { q: "Charge moyenne sur le pneu le plus chargé", unit: "t" },
        { q: "TKPH du site", unit: "t·km/h" },
        { q: "Part du temps de flotte perdue en attente", unit: "%" }
      ],
      solution: `<p>En charge : 0,18 × 150 = 27,0 t ; à vide : 0,16 × 65 = 10,4 t ; moyenne = <b>18,7 t</b>.</p><p>TKPH = 18,7 × 22 = <b>411</b>. Comparez avec la capacité du pneu après correction site.</p><p>Attente = 2 / 25 = <b>8 %</b> : l'équivalent de 0,8 camion garé tout le poste.</p>`
    }
  };

  S.drilling = {
    title: "Performance de foration, coût au mètre et contrôle des parois",
    objectives: ["Construire un modèle de coût au mètre", "Utiliser la pénétration et les données MWD comme information sur la roche", "Dimensionner une flotte de foreuses pour le plan", "Concevoir la foration de prédécoupage et de recoupe"],
    lessons: [
      { h: "Coût au mètre", body: `<p>Coût/m = (coût de possession + coût d'exploitation par heure) / (m par heure) + consommables par mètre (taillants, marteaux, tiges, emmanchements). La durée de vie d'un taillant se compte en mètres ; retiré trop tard il endommage le marteau, trop tôt il gaspille sa vie. Optimisez avec des intervalles de réaffûtage et des fiches d'état.</p>` },
      { h: "Les données de foration sont des données de roche", body: `<p>Le MWD (mesure pendant la foration) enregistre la pénétration, la poussée, le couple de rotation et la pression d'air. Normalisé en indice de dureté, il cartographie les zones dures et tendres avant la conception des charges, ce qui permet de varier l'explosif trou par trou. C'est moins cher que n'importe quelle campagne géotechnique.</p>` },
      { h: "Dimensionnement de la flotte", body: `<p>Mètres requis = tonnes à abattre / (t par mètre foré). Heures foreuse = mètres / vitesse nette (mise en station comprise). Nombre de foreuses = heures foreuse / (heures par an × disponibilité × utilisation). Ajoutez la reforation (en général 2–5 %) et les mètres CT/prédécoupage séparément.</p>` },
      { h: "Contrôle des parois", body: `<ul><li>Prédécoupage : trous plus petits (76–102 mm) sur la ligne de paroi finale, espacement 10–12 × D, charges légères découplées, tirées avant le tir principal.</li><li>Rangées tampon et de recoupe : banquette et charge réduites près de la paroi.</li><li>Les trous inclinés suivent l'angle du front et réduisent les dommages en pied et en crête.</li><li>La précision compte plus sur les rangées de paroi que partout ailleurs : un trou de prédécoupage dévié laisse une cicatrice visible et une crête fragile.</li></ul>` }
    ],
    formulas: [
      { name: "Coût au mètre", note: "$/m" },
      { name: "Foreuses nécessaires", note: "foreuses" }
    ],
    tips: ["Auditez chaque semaine le foré réel par rapport au plan sur 10 % des trous et publiez le résultat.", "Tracez la vitesse de pénétration par trou en carte de chaleur sur la maille ; partagez-la avec la géologie.", "Un taux de reforation au-dessus de 5 % est un problème de management, pas de géologie.", "Apprenez aux foreurs à lire le trou : changement de son, retour d'air et couleur des cuttings.", "Confiez le prédécoupage à votre meilleur foreur et à votre meilleure foreuse."],
    prof: "L'indice de forabilité d'une roche n'est pas une constante. Le même granite se fore différemment avec un taillant neuf ou usé, à 18 bar ou à 24 bar. Avant d'affirmer que la roche est devenue plus dure, vérifiez les consommables et le compresseur.",
    exercise: {
      intro: "Une foreuse fond de trou coûte 145 $/h (possession + exploitation, conducteur et carburant compris) et fore à 22 m/h nets, mise en station comprise. Les consommables coûtent 3,60 $/m. Le plan exige 6,5 Mt abattues par an à 34,4 t/m. Chaque foreuse travaille 6 000 h/an, disponibilité 85 %, utilisation de la disponibilité 80 %. Ajoutez 4 % de reforation.",
      parts: [
        { q: "Coût de foration au mètre", unit: "$/m" },
        { q: "Mètres par an, reforation comprise", unit: "m" },
        { q: "Foreuses nécessaires (décimal)", unit: "foreuses" }
      ],
      solution: `<p>C/m = 145 / 22 + 3,60 = 6,59 + 3,60 = <b>10,19 $/m</b>.</p><p>M = 6 500 000 / 34,4 × 1,04 = 188 953 × 1,04 = <b>196 500 m</b>.</p><p>Heures foreuse = 196 500 / 22 = 8 932 h. Heures effectives par foreuse = 6 000 × 0,85 × 0,80 = 4 080 h. N = <b>2,2</b> → 3 foreuses, ou 2 foreuses avec une meilleure utilisation. Présentez les deux options chiffrées au client.</p>`
    }
  };

  S.blasting = {
    title: "Fragmentation, séquence, vibrations et projections",
    objectives: ["Prédire la fragmentation avec Kuz-Ram", "Concevoir les retards entre trous et entre rangées", "Établir une loi d'amortissement du site et dimensionner la CUIM à rebours depuis une limite", "Évaluer les risques de projections et de surpression aérienne"],
    lessons: [
      { h: "Fragmentation (Kuz-Ram)", body: `<p>Cunningham (1983) : X<sub>50</sub> = A × K<sup>−0,8</sup> × Q<sup>1/6</sup> × (115/E)<sup>19/30</sup>, X<sub>50</sub> en cm, K consommation spécifique en kg/m³, Q kg par trou, E puissance relative en poids (ANFO = 100), A facteur de roche (≈7 moyenne, 10 dure fissurée, 13 dure massive). Utilisez-le comme <b>outil de tendance</b> : calibrez A par analyse photo des tas abattus réels.</p>` },
      { h: "Séquence d'amorçage", body: `<p>Guide de Konya : retard entre trous de 10–16 ms par mètre d'espacement en roche dure (3–5 ms/ft) ; entre rangées 6,5–13 ms par mètre de banquette (2–4 ms/ft) : le bas de la plage donne un tas haut et serré avec plus d'arrière-bris, le haut un tas plus lâche et plus bas. Pour B = 3,5 m, cela fait 23–46 ms. Une rangée doit avoir le temps de bouger avant que la suivante parte ; un retard trop court étouffe le tir et projette les rangées arrière vers le haut.</p><p>Les retards pyrotechniques se dispersent ; vérifiez le recouvrement des temps de mise à feu dans toute fenêtre de 8 ms. Utilisez des détonateurs électroniques près des infrastructures et pour les tirs de paroi.</p>` },
      { h: "Vibrations du sol", body: `<p>USBM (Siskind et al., RI 8507) : VPP = k × (D / √Q)<sup>−β</sup>, D en mètres, Q charge unitaire instantanée maximale (CUIM) par fenêtre de 8 ms en kg, VPP en mm/s. Sans loi propre au site, un point de départ métrique courant est k ≈ 1 140, β ≈ 1,6. <b>Le k = 160 souvent cité est la valeur impériale (in/s, ft/lb<sup>½</sup>).</b> Utilisé en unités métriques, il sous-estime la VPP d'environ sept fois.</p><p>Établissez la loi du site par régression de log VPP sur log DR à partir des tirs mesurés ; dimensionnez sur la borne supérieure à 95 %, pas sur la moyenne. Puis calculez la CUIM à rebours depuis la limite : Q<sub>max</sub> = (D / DR<sub>req</sub>)², DR<sub>req</sub> = (k / VPP<sub>limite</sub>)<sup>1/β</sup>.</p>` },
      { h: "Surpression aérienne et projections", body: `<ul><li>La surpression aérienne se déclare en dB(L) (linéaire, non pondéré) selon l'USBM RI 8485 ; le dB(A) concerne le bruit au travail. Limite usuelle aux récepteurs sensibles : 115–120 dB(L).</li><li>Projections (Richards & Moore, 2004) : portée en éclatement de front L = (k²/g) × (√m / B)<sup>2,6</sup>, en cratère L = (k²/g) × (√m / T)<sup>2,6</sup>, m en kg/m, k constante du site (≈13,5 tendre à 27 dure). Appliquez un coefficient de sécurité de 2 sur la distance d'évacuation.</li><li>La longueur et la qualité du bourrage, la banquette réelle au front (profilez le front au laser) et la maîtrise de la déviation les contrôlent.</li></ul>` }
    ],
    formulas: [
      { name: "X50 Kuz-Ram", note: "cm" },
      { name: "Distance réduite", note: "m/kg<sup>½</sup>" },
      { name: "VPP (USBM)", note: "mm/s ; métrique k≈1140, β≈1,6" },
      { name: "CUIM maximale", note: "kg par 8 ms" },
      { name: "Projections (éclatement de front)", note: "m" }
    ],
    tips: ["Photographiez chaque tas abattu avec des objets d'échelle et analysez la fragmentation ; recalibrez le facteur de roche chaque mois.", "Placez un sismographe sur la structure la plus proche à chaque tir jusqu'à ce que la loi du site soit solide.", "Profilez la première rangée au laser. Une banquette de 1,5 m sur un front bombé est une source de projections.", "Découpez les charges au niveau des vides et des passées argileuses relevés au journal de foration.", "Suivez le taux de ratés par lot de produit et par type de raccord ; partagez-le avec le fournisseur."],
    prof: "Une loi de site établie sur cinq tirs est une supposition. Attendez au moins 20 à 30 mesures indépendantes sur une plage de distances réduites avant de faire confiance à la régression, et gardez les constantes prudentes jusque-là.",
    exercise: {
      intro: "Avec la maille du cycle 1 (75,1 kg/trou, CS 0,536 kg/m³, ANFO E = 100) et un facteur de roche A = 10. Une usine de traitement est à 600 m avec une limite de 10 mm/s. Utilisez k = 1 140, β = 1,6.",
      parts: [
        { q: "Taille moyenne Kuz-Ram X50", unit: "cm" },
        { q: "Distance réduite requise", unit: "m/kg½" },
        { q: "Charge unitaire instantanée maximale", unit: "kg" },
        { q: "Trous autorisés par fenêtre de 8 ms", unit: "trous" }
      ],
      solution: `<p>K<sup>−0,8</sup> = 0,536<sup>−0,8</sup> = 1,647 ; Q<sup>1/6</sup> = 75,1<sup>1/6</sup> = 2,054 ; (115/100)<sup>0,633</sup> = 1,093. X<sub>50</sub> = 10 × 1,647 × 2,054 × 1,093 = <b>37 cm</b>.</p><p>DR = (1140/10)<sup>1/1,6</sup> = 114<sup>0,625</sup> = <b>19,3 m/kg½</b>.</p><p>Q = (600 / 19,3)² = <b>966 kg</b> → 966 / 75,1 = 12,9 → <b>12 trous</b> par fenêtre de 8 ms. Avec la dispersion pyrotechnique, prévoyez moins, ou passez à l'électronique.</p>`
    }
  };

  S.dewatering = {
    title: "Hydraulique des pompes, eau dans les parois et plan de saison des pluies",
    objectives: ["Calculer la hauteur manométrique totale et la puissance de pompe", "Expliquer la pression interstitielle et le drainage des parois", "Rédiger un plan de préparation à la saison des pluies avec seuils", "Gérer la qualité des eaux rejetées"],
    lessons: [
      { h: "Hauteur manométrique totale", body: `<p>HMT = hauteur géométrique + pertes de charge dans la conduite et les accessoires (+ pression au refoulement). Pertes (Hazen-Williams, SI) : h<sub>f</sub> = 10,67 L Q<sup>1,852</sup> / (C<sup>1,852</sup> d<sup>4,87</sup>), avec C ≈ 140–150 pour le PEHD. Gardez une vitesse dans la conduite autour de 1,5–3 m/s. Le point de fonctionnement est l'intersection de la courbe du réseau et de la courbe de la pompe ; rallonger la conduite le déplace vers un débit plus faible.</p><p>Puissance hydraulique P = ρ g Q H ; puissance à l'arbre = P / η.</p>` },
      { h: "L'eau dans les parois", body: `<p>La pression interstitielle réduit la contrainte normale effective sur les surfaces de rupture potentielles et abaisse le coefficient de sécurité. La saprolite et les contacts altérés des profils latéritiques sont la zone faible habituelle. Moyens de maîtrise : forages de dénoyage périphériques, drains subhorizontaux dans la paroi, fossés de dérivation en surface et piézomètres à corde vibrante pour prouver la dépressurisation (Beale & Read, 2013).</p>` },
      { h: "Préparation à la saison des pluies", body: `<ul><li>Puisards creusés et capacité de pompage installée pour la pluie de projet, avec redondance N+1.</li><li>Fossés de dérivation autour de la crête de fosse curés avant les premières pluies.</li><li>Plan de tir déplacé vers des gradins plus hauts et plus secs ; stock d'émulsion augmenté.</li><li>Stock de minerai sec constitué pour l'usine.</li><li>TARP : seuils de déclenchement sur la pluie, le niveau du puisard et les piézomètres, chacun avec une action et un responsable.</li></ul>` },
      { h: "Rejets et environnement", body: `<p>L'eau de fosse transporte des matières en suspension et de l'azote issu des explosifs (nitrate d'ammonium dissous depuis les trous en eau et les déversements). Décantez dans des bassins avant rejet et surveillez par rapport aux limites de l'EIES et du permis. Les bonnes pratiques de chargement en trou humide sont aussi une mesure environnementale.</p>` }
    ],
    formulas: [
      { name: "Hazen-Williams", note: "m ; Q en m³/s, d en m" },
      { name: "Puissance à l'arbre", note: "kW ; Q en m³/s, H en m" },
      { name: "Vitesse dans la conduite", note: "m/s" }
    ],
    tips: ["Installez les piézomètres avant d'exploiter la paroi, pas après l'apparition d'une fissure.", "Posez des manomètres au refoulement des pompes ; ils transforment des suppositions en contrôle de courbe.", "Deux pompes en série doublent la hauteur, en parallèle elles additionnent le débit : sachez de quoi votre problème a besoin.", "Un graphique hebdomadaire du niveau du puisard et de la pluie en réunion de production garde l'exhaure financée.", "Testez le TARP par un exercice sur table avant la saison."],
    prof: "Beaucoup de fosses sont « dénoyées » en déplaçant l'eau d'un gradin à l'autre. Tenez le bilan hydrique : pluie entrante, eau pompée, évaporation, variation de stock. Si les chiffres ne bouclent pas, vous recyclez votre propre eau.",
    exercise: {
      intro: "Pomper 150 L/s dans 1 000 m de PEHD de 250 mm de diamètre intérieur (C = 150). Hauteur géométrique 55 m. Rendement de la pompe 65 %.",
      parts: [
        { q: "Vitesse dans la conduite", unit: "m/s" },
        { q: "Pertes de charge", unit: "m" },
        { q: "Hauteur manométrique totale", unit: "m" },
        { q: "Puissance à l'arbre", unit: "kW" }
      ],
      solution: `<p>v = 0,15 / (π × 0,25² / 4) = 0,15 / 0,0491 = <b>3,06 m/s</b> (haut de plage ; une conduite de 280 mm réduirait les pertes).</p><p>h<sub>f</sub> = 10,67 × 1000 × 0,15<sup>1,852</sup> / (150<sup>1,852</sup> × 0,25<sup>4,87</sup>) = 10,67 × 1000 × 0,0298 / (10 720 × 0,00117) = <b>25,3 m</b>.</p><p>HMT = 55 + 25,3 = <b>80,3 m</b>. P = 9,81 × 0,15 × 80,3 / 0,65 = <b>182 kW</b>.</p>`
    }
  };

  S.crusher = {
    title: "De la mine à l'usine et réconciliation du stock ROM",
    objectives: ["Relier la fragmentation du tir au débit de l'usine", "Optimiser un mélange multi-stocks sous contraintes", "Réconcilier les stocks ROM", "Chiffrer le manque d'alimentation du concasseur"],
    lessons: [
      { h: "De la mine à l'usine", body: `<p>Une fragmentation du tout-venant plus fine et plus uniforme augmente le débit du concasseur et du broyeur et réduit l'énergie par tonne. Les projets « mine-to-mill » publiés rapportent des gains de débit à deux chiffres en minerai dur. Le coût est une consommation spécifique plus élevée à la mine ; la valeur est à l'usine. Mesurez les deux avec les mêmes tonnes.</p><p>Vocabulaire de l'usine : indice de Bond (kWh/t), réglage fermé du concasseur, F80 de l'alimentation et P80 du produit.</p>` },
      { h: "Optimisation du mélange", body: `<p>Le mélange est un programme linéaire : maximiser (ou stabiliser) le métal contenu sous contraintes de % d'oxyde, dureté, argile, humidité et tonnes disponibles par stock. Commencez avec le solveur d'un tableur ; la logique est la même que celle du modèle de l'usine.</p>` },
      { h: "Réconciliation du stock ROM", body: `<p>Chaque mois : stock initial + extrait vers ROM − alimenté au concasseur = stock final. Comparez au levé topographique. Les écarts viennent des facteurs camion, des mauvais déversements, de la densité retenue pour le levé et de l'humidité. Suivez-les en pourcentage et corrigez d'abord la plus grosse source.</p>` },
      { h: "Manque d'alimentation du concasseur", body: `<p>Chaque heure où le concasseur attend la mine coûte débit × teneur × récupération × prix. Enregistrez les arrêts avec un code de cause commun à la mine et à l'usine : pas de camions, mauvais matériau, blocage par hors-gabarit, quai obstrué.</p>` }
    ],
    formulas: [
      { name: "Bilan de stock", note: "t" },
      { name: "Valeur d'une heure de concasseur", note: "$/h" }
    ],
    tips: ["Convenez avec l'usine d'une liste unique de codes d'arrêt du concasseur.", "Levez les doigts ROM le même jour que l'inventaire de l'usine.", "Alimentez le minerai sain dur en proportion stable ; les variations perturbent le broyeur plus que la dureté moyenne.", "Gardez le brise-roche sur la liste des pièces critiques.", "Montrez au directeur d'usine les changements de tir que vous avez faits et le débit observé."],
    prof: "Le « mine-to-mill » échoue quand la mine paie le surcoût d'explosif et que l'usine garde le bénéfice. Le rôle de l'ingénieur senior est de mesurer honnêtement les deux côtés pour que la direction puisse décider.",
    exercise: {
      intro: "Trois stocks : HT 2,40 g/t (oxyde 10 %), MT 1,20 g/t (oxyde 40 %), BT 0,70 g/t (oxyde 60 %). Limite usine : oxyde ≤ 35 %. Règle du site : au moins 30 % de BT dans le mélange pour libérer l'aire de stockage. Concasseur à 450 t/h, récupération 92 %, prix 2 500 $/oz.",
      parts: [
        { q: "Part minimale de HT avec BT = 30 % (reste MT) respectant oxyde ≤ 35 %", unit: "%" },
        { q: "Teneur de ce mélange", unit: "g/t" },
        { q: "Valeur d'une heure d'arrêt du concasseur faute d'alimentation à cette teneur", unit: "$/h" }
      ],
      solution: `<p>HT = h, MT = 0,70 − h, BT = 0,30. Oxyde = 0,10h + 0,40(0,70 − h) + 0,18 = 0,46 − 0,30h ≤ 0,35 → h ≥ <b>36,7 %</b>. Ajouter du HT diminue l'oxyde, donc la limite impose un HT <i>minimal</i>, pas maximal. Vérifiez toujours dans quel sens une contrainte agit avant de résoudre.</p><p>Mélange HT 36,7 % / MT 33,3 % / BT 30 % : g = 0,367 × 2,40 + 0,333 × 1,20 + 0,30 × 0,70 = 0,880 + 0,400 + 0,210 = <b>1,49 g/t</b>.</p><p>V = 450 × 1,49 × 0,92 × 2 500 / 31,1035 = <b>49 600 $ par heure</b> d'arrêt. Présentez ce chiffre à la prochaine réunion mine–usine.</p>`
    }
  };

  S.gc = {
    title: "Géostatistique, maîtrise QAQC et réconciliation",
    objectives: ["Expliquer le variogramme, l'effet de pépite et l'UMS", "Lire les cartes de contrôle des MRC, blancs et doublons", "Calculer et interpréter F1/F2/F3", "Corriger les polygones de minerai du mouvement dû au tir"],
    lessons: [
      { h: "La géostatistique pour l'ingénieur", body: `<p>Le variogramme mesure comment l'écart entre échantillons croît avec la distance. Son <b>effet de pépite</b> est la variabilité à distance nulle (erreur d'échantillonnage + géologie à micro-échelle) ; sa <b>portée</b> est la distance au-delà de laquelle les échantillons ne sont plus liés. La maille CT doit être bien inférieure à la portée dans la direction principale de minéralisation. L'estimation (krigeage ordinaire ou simulation conditionnelle) se fait sur l'<b>unité minière de sélection</b> (UMS/SMU) : le plus petit bloc que la flotte peut extraire séparément.</p>` },
      { h: "Cartes QAQC", body: `<ul><li>Carte de contrôle des MRC : alerte à ±2 écarts-types, rejet à ±3 ou deux valeurs consécutives au-delà de ±2 du même côté. Un biais constant est un problème d'étalonnage du laboratoire.</li><li>Blancs : des résultats supérieurs à environ 5–10 × la limite de détection signalent une contamination.</li><li>Doublons de terrain : tracez la demi-différence relative absolue (HARD) ; pour l'or, 80–90 % des paires à moins de ±20–30 % de HARD est typique d'un bon échantillonnage RC.</li></ul>` },
      { h: "Facteurs de réconciliation", body: `<p>F1 = modèle CT / modèle de ressources (pour le volume extrait) : teste le modèle de ressources. F2 = usine (reçu) / modèle CT livré : teste l'exploitation et l'échantillonnage. F3 = F1 × F2 : usine contre modèle de ressources. Déclarez séparément tonnes, teneur et onces ; les onces peuvent correspondre alors que tonnes et teneur sont toutes deux fausses.</p>` },
      { h: "Mouvement dû au tir", body: `<p>La roche se déplace de 2 à 5 m horizontalement et se soulève verticalement pendant un tir. Des polygones non corrigés diluent l'avant du minerai et laissent du minerai à l'arrière. Mesurez avec des capteurs de mouvement installés dans des trous avant le tir et décalez les polygones par passe.</p>` }
    ],
    formulas: [
      { name: "F1", note: "en tonnes, teneur, onces" },
      { name: "F2", note: "" },
      { name: "F3", note: "" },
      { name: "HARD", note: "doublons" }
    ],
    tips: ["Revoyez les cartes MRC chaque semaine avec le responsable du laboratoire, pas chaque mois dans un rapport.", "Envoyez 5 % des pulpes à un laboratoire arbitre chaque trimestre.", "Si F2 &lt; 0,95 pendant trois mois, auditez la dilution et les mauvais déversements avant d'accuser l'usine.", "Installez des capteurs de mouvement à chaque tir de minerai jusqu'à ce que le mouvement soit prévisible.", "Convenez de l'UMS avec l'ingénieur chargement-transport ; c'est une question de flotte."],
    prof: "Une réconciliation qui boucle toujours à 1,00 n'est pas une bonne nouvelle ; cela signifie généralement que quelqu'un ajuste les chiffres. Déclarez les vrais facteurs et expliquez-les.",
    exercise: {
      intro: "Sur un trimestre : modèle de ressources dans le volume extrait 50 000 oz ; modèle CT 54 000 oz ; production réconciliée de l'usine 51 300 oz. Une paire de doublons de terrain donne 1,20 g/t et 0,90 g/t.",
      parts: [
        { q: "F1", unit: "" },
        { q: "F2", unit: "" },
        { q: "F3", unit: "" },
        { q: "HARD de la paire de doublons", unit: "%" }
      ],
      solution: `<p>F1 = 54 000 / 50 000 = <b>1,08</b> (modèle de ressources prudent). F2 = 51 300 / 54 000 = <b>0,95</b> (5 % perdus entre CT et usine : dilution, perte de minerai, mauvais déversements ou biais CT). F3 = <b>1,026</b>.</p><p>HARD = 0,5 × 0,30 / 1,05 = <b>14,3 %</b>, acceptable pour de l'or en RC.</p>`
    }
  };
})();
