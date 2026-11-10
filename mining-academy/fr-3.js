/* Bench to Boardroom — traduction française (3/3) : cycle Chef de projet, examens, corrections. */
(function () {
  const F = window.ACADEMY_FR = window.ACADEMY_FR || { modules: {} };
  const P = F.modules.pm = {};

  P.loadhaul = {
    title: "Contrats miniers, tarifs et économie de la flotte",
    objectives: ["Lire un contrat à bordereau de prix unitaires", "Valoriser la disponibilité et la productivité en argent contractuel", "Décider des changements de flotte sur le coût par tonne", "Gérer la révision des prix et les tarifs d'attente"],
    lessons: [
      { h: "Structures de contrat", body: `<ul><li><b>Bordereau de prix unitaires</b> : $/m³ en place ou $/t par matériau et par tranche de distance de transport, plus des frais mensuels fixes (encadrement, amortissement de la mobilisation).</li><li><b>Révision des prix</b> : des indices de carburant, main-d'œuvre, pneus et change ajustent les tarifs. Vérifiez la date de base et la source des indices.</li><li><b>Tarifs d'attente / d'immobilisation</b> : ce que le client paie quand la flotte est arrêtée pour une cause client (tir, usine à l'arrêt, pas d'accès). Si ce n'est pas écrit, cela n'existe pas.</li><li><b>Indicateurs et bonus/malus</b> : disponibilité, tonnes, sécurité. Sachez exactement comment chacun est calculé.</li></ul>` },
      { h: "Valeur de la disponibilité", body: `<p>1 % de disponibilité sur une flotte payée à la tonne = 1 % × tonnes prévues × tarif. Ramenez chaque décision de maintenance à ce chiffre. Un composant à 30 000 $ qui fait gagner 2 % de disponibilité sur un mois est souvent une décision facile une fois exprimée ainsi.</p>` },
      { h: "Décisions de flotte", body: `<p>Décidez sur le coût par tonne sur la durée restante du contrat, pas sur le prix d'achat : possession (amortissement sur la durée du contrat, financement), exploitation (carburant, pneus, maintenance, main-d'œuvre) et production rendue possible. Intégrez la valeur de démobilisation et le droit de résiliation du client.</p>` },
      { h: "Réalité du terrain", body: `<p>Les arrêts causés par le client (libération tardive des gradins, usine à l'arrêt, attentes de tir) apparaissent comme une faible productivité de l'entrepreneur dans le rapport du client. Enregistrez-les chaque jour, codés par cause, signés par les deux superviseurs. Ce sont les preuves des réclamations d'immobilisation.</p>` }
    ],
    formulas: [
      { name: "Recette par 1 % de disponibilité", note: "$/période" },
      { name: "Coût par tonne", note: "" }
    ],
    tips: ["Lisez le contrat en entier pendant votre premier mois ; repérez chaque délai de notification.", "Faites signer les feuilles d'arrêts quotidiennes par le représentant du client sur site.", "N'acceptez jamais un tarif verbal ; confirmez-le par courriel le jour même.", "Suivez le carburant par tonne-kilomètre ; c'est l'alerte la plus rapide sur un problème de piste ou de flotte.", "Votre rapport mensuel doit permettre au DG du client de comprendre le mois en deux minutes."],
    prof: "Le PMBOK appelle cela la gestion des approvisionnements et de l'intégration. Dans le monde de l'entrepreneur, c'est plus simple et plus dur : vous êtes payé pour ce que le contrat dit, et rien d'autre. Un chef de projet qui ne connaît pas le contrat gère le projet du client aux frais de l'entrepreneur.",
    exercise: {
      intro: "Un contrat de chargement-transport paie 3,20 $/t pour 1,2 Mt par mois prévues. La disponibilité de la flotte est de 82 % contre une cible contractuelle de 85 %. On suppose que les tonnes varient avec la disponibilité. Une action de maintenance coûtant 45 000 $ par mois rétablirait 85 %.",
      parts: [
        { q: "Recette mensuelle perdue à 82 % contre 85 %", unit: "$" },
        { q: "Bénéfice mensuel net de l'action", unit: "$" }
      ],
      solution: `<p>Tonnes à 82 % = 1,2 Mt × 82/85 = 1,1576 Mt → perte de 42 353 t × 3,20 $ = <b>135 500 $</b> par mois.</p><p>Bénéfice net = 135 500 − 45 000 = <b>90 500 $</b> par mois, avant tout malus évité. Approuvez-la.</p>`
    }
  };

  P.drilling = {
    title: "Maîtrise du contrat de forage-tir",
    objectives: ["Construire le rapport mensuel de coûts forage-tir", "Faire fonctionner le système de points d'autorisation avec le client", "Maîtriser la reforation et les avenants", "Gérer le stock de consommables"],
    lessons: [
      { h: "Le système de points d'autorisation", body: `<p>L'entrepreneur exécute ; le propriétaire autorise. Huit points : approbation de la maille → foration → validation du levé du foré réel → autorisation de chargement → inspection avant tir → exécution du tir et fin d'alerte → inspection après tir → clôture au registre des tirs. Chaque point produit un document. Un document manquant est une responsabilité que porte l'entrepreneur.</p>` },
      { h: "Reforation et avenants", body: `<p>La reforation due à l'entrepreneur (déviation, trous perdus) est à sa charge. La reforation due au client (maille modifiée après foration, libération tardive, trous effondrés laissés ouverts par un retard client) est un avenant. Enregistrez la cause par trou au moment même, pas en fin de mois.</p>` },
      { h: "Stocks", body: `<p>Taillants, marteaux, tiges et emmanchements ont de longs délais d'acheminement vers l'Afrique de l'Ouest (souvent 8 à 16 semaines par mer et par route). Tenez un stock minimum basé sur la consommation × le délai + un stock de sécurité. Les ruptures arrêtent les foreuses ; le surstock immobilise la trésorerie.</p>` },
      { h: "Rapport mensuel de coûts", body: `<p>Mètres forés contre plan, $/m réel contre offre, consommables par mètre, disponibilité et utilisation des foreuses, % de reforation par cause et registre des avenants. Montrez les tendances sur 4 semaines avec un statut rouge/orange/vert.</p>` }
    ],
    formulas: [
      { name: "Point de commande", note: "unités ; d consommation journalière, LT délai en jours" },
      { name: "Marge au mètre", note: "$/m" }
    ],
    tips: ["Si le client dit « forez maintenant, nous approuverons après », répondez par écrit et archivez.", "Gardez la validation du foré réel comme point d'arrêt strict avant chargement. Sans exception.", "Analysez les consommables par mètre et par foreuse ; une foreuse au double du coût de taillants a un problème de conducteur ou d'air.", "Planifiez la maintenance des foreuses avec le programme de tir du client pour ne jamais bloquer le chemin critique.", "Chaque ligne de reforation du rapport a une cause et un responsable."],
    prof: "Votre marge se décide à l'offre et se perd sur le site. L'offre supposait une vitesse de pénétration, une durée de vie des taillants et un taux de reforation. Suivez ces trois valeurs contre l'offre chaque mois ; quand l'une dérive, vous savez où part votre marge.",
    exercise: {
      intro: "Les taillants coûtent 1 450 $ pièce et durent 1 800 m. La flotte fore 21 000 m par mois. Le délai d'approvisionnement est de 75 jours ; le stock de sécurité est de 30 jours de consommation.",
      parts: [
        { q: "Taillants consommés par jour (mois de 30 jours)", unit: "taillants/jour" },
        { q: "Point de commande", unit: "taillants" },
        { q: "Coût des taillants au mètre", unit: "$/m" }
      ],
      solution: `<p>Taillants par mois = 21 000 / 1 800 = 11,67 → <b>0,389/jour</b>.</p><p>Point de commande = 0,389 × 75 + 0,389 × 30 = 29,2 + 11,7 = 40,8 → <b>41 taillants</b>.</p><p>Coût = 1 450 / 1 800 = <b>0,81 $/m</b>.</p>`
    }
  };

  P.blasting = {
    title: "Risque de tir, conformité et fournisseur",
    objectives: ["Porter le registre des risques de tir", "Séparer causes techniques et causes systémiques", "Gérer le contrat du fournisseur d'explosifs", "Maintenir la conformité réglementaire à jour"],
    lessons: [
      { h: "Hiérarchie de conformité", body: `<p>D'abord la loi nationale (Code minier guinéen et réglementation des explosifs : licences, autorisations de dépôts, transport, déclarations), puis la pratique internationale (ISEE, USBM pour les vibrations et la surpression aérienne), puis les standards techniques du fournisseur, puis les procédures du site. Là où la loi est muette, la plus stricte des autres s'applique.</p>` },
      { h: "Enquête sur incident et raté", body: `<p>Utilisez une méthode structurée (ICAM ou équivalente). La cause technique (un raccord défaillant) est rarement la cause racine. Demandez pourquoi la défaillance n'a pas été détectée : inspection, formation, achats, pression du temps. Les actions correctives entrent au registre des risques avec responsables et dates, et elles sont vérifiées, pas simplement clôturées.</p>` },
      { h: "Le fournisseur d'explosifs", body: `<p>Le fournisseur livre le produit et l'appui technique ; l'entrepreneur reste responsable du tir. Réconciliez chaque mois produit reçu, consommé et enregistré. Suivez les taux de défaillance par lot. Consignez chaque visite technique. Gardez un stock tampon minimum (par ex. 2 semaines) car les routes d'approvisionnement de la région sont longues et les pistes ferment en saison des pluies.</p>` },
      { h: "Coût du forage-tir", body: `<p>Coût forage-tir par tonne = (foration + explosifs + amorçage + main-d'œuvre + frais généraux) / tonnes abattues. La part d'émulsion est en général le poste de coût le plus mobile ; si les trous en eau augmentent à cause de la performance d'exhaure du client, c'est un coût réclamable si le contrat attribue l'exhaure au client.</p>` }
    ],
    formulas: [
      { name: "Coût forage-tir", note: "" },
      { name: "Réconciliation des explosifs", note: "kg ; tout résidu fait l'objet d'une enquête" }
    ],
    tips: ["La réconciliation mensuelle des explosifs est une exigence réglementaire et de sûreté : traitez tout écart comme un incident.", "Tenez licences et permis dans un registre avec dates d'expiration et une alerte à 90 jours.", "Informez le client avant un tir sensible, pas après une plainte.", "Faites tourner les responsables d'enquête pour ne pas répéter les mêmes angles morts.", "Diffusez les retours d'expérience dans toute l'entreprise, pas seulement sur le site."],
    prof: "Un raté est un événement technique aux conséquences commerciales. Si la modification de conception du client y a contribué, c'est peut-être un avenant. Si votre inspection l'a manqué, c'est votre coût et votre réputation. L'enquête doit être honnête dans les deux sens.",
    exercise: {
      intro: "Un mois : 1,30 Mt abattues. Explosif 680 t à 820 $/t ; amorçage 96 000 $ ; foration 230 000 $ ; main-d'œuvre et frais généraux 310 000 $. Les trous en eau sont passés de 20 % à 45 % parce que les pompes du client sont tombées en panne ; le surcoût d'émulsion est de 160 $/t d'explosif pour le produit supplémentaire en trou humide, et les trous en eau supplémentaires ont consommé 170 t d'explosif.",
      parts: [
        { q: "Coût forage-tir par tonne", unit: "$/t" },
        { q: "Surcoût d'émulsion réclamable", unit: "$" }
      ],
      solution: `<p>Explosifs = 680 × 820 = 557 600 $. Total = 557 600 + 96 000 + 230 000 + 310 000 = 1 193 600 $ → 1 193 600 / 1 300 000 = <b>0,92 $/t</b>.</p><p>Surcoût = 170 × 160 = <b>27 200 $</b>, réclamable par avenant si le contrat attribue l'exhaure au client et si la cause a été enregistrée au moment même.</p>`
    }
  };

  P.dewatering = {
    title: "Stratégie d'exhaure, responsabilités et budget",
    objectives: ["Définir qui porte l'exhaure dans le contrat", "Budgéter une saison des pluies", "Chiffrer la production à risque", "Intégrer les engagements environnementaux"],
    lessons: [
      { h: "À qui appartient l'eau ?", body: `<p>Les contrats répartissent différemment l'exhaure en fosse, les forages périphériques et les rejets. Clarifiez-le avant la première saison : qui achète les pompes, qui les fait tourner, qui paie le carburant, qui est responsable si la fosse est inondée. Une répartition floue devient un litige en août.</p>` },
      { h: "Budgéter une saison des pluies", body: `<p>Pompes (en propriété ou en location, plus le secours N+1), carburant ou électricité, conduites, creusement des puisards, main-d'œuvre, et le coût indirect : surcoût d'émulsion, transport ralenti, dégâts aux pneus, postes perdus. Comparez le budget à la valeur de production protégée.</p>` },
      { h: "Production à risque", body: `<p>Chiffrez la valeur d'un gradin inondé : tonnes retardées × marge + manque d'alimentation de l'usine. Cela transforme l'exhaure, de frais généraux, en investissement de maîtrise des risques devant le comité de pilotage.</p>` },
      { h: "Environnement et communautés", body: `<p>Points de rejet, limites de qualité de l'eau et usagers de l'eau des communautés sont des engagements de l'EIES. Une rivière trouble en aval devient en quelques heures un problème communautaire et réglementaire. Surveillance, bassins de décantation et mécanisme de gestion des plaintes relèvent du chef de projet.</p>` }
    ],
    formulas: [
      { name: "Production à risque", note: "$" }
    ],
    tips: ["Mettez le tableau de répartition de l'exhaure dans le compte rendu de la réunion de lancement, signé.", "Louez les pompes de secours sur contrat à commande avant la saison, quand les prix sont bas.", "Déclarez la pluie et le pompage dans le rapport mensuel à côté de la production.", "Rencontrez le comité de l'eau de la communauté avant la saison.", "Comptez comme retards client les défaillances d'exhaure qui retardent les tirs, quand elles relèvent du périmètre client."],
    prof: "La gestion des risques du PMBOK dit : identifier, analyser, planifier les réponses, surveiller. Sur une fosse d'Afrique de l'Ouest en saison des pluies, cela veut dire : vous savez que l'orage arrive, la seule question est de savoir si vous avez payé la réponse en mai ou si vous paierez la remise en état en septembre.",
    exercise: {
      intro: "Un gradin inférieur inondé retarderait 180 000 t de minerai de 3 semaines. La marge contractuelle est de 0,80 $/t sur l'exploitation. L'usine perdrait 25 000 t d'alimentation à 1,5 g/t, 92 % de récupération, 2 500 $/oz, avec 40 % de la recette en marge usine. Dispositif d'exhaure de saison des pluies : 210 000 $.",
      parts: [
        { q: "Marge d'exploitation retardée", unit: "$" },
        { q: "Marge usine perdue", unit: "$" },
        { q: "Rapport valeur protégée / coût du dispositif", unit: "×" }
      ],
      solution: `<p>Exploitation : 180 000 × 0,80 = <b>144 000 $</b>.</p><p>Usine : 25 000 × 1,5 / 31,1035 × 0,92 × 2 500 × 0,40 = 1 205,7 oz × 0,92 = 1 109,2 oz × 2 500 $ × 0,40 = <b>1,109 M$</b>.</p><p>(144 000 + 1 109 000) / 210 000 = <b>6,0×</b>. C'est le propriétaire qui gagne le plus ; utilisez-le dans la négociation sur qui paie.</p>`
    }
  };

  P.crusher = {
    title: "L'interface mine–usine",
    objectives: ["Définir les indicateurs d'interface entre mine et usine", "Répartir le coût de reprise du stock ROM", "Animer une réunion commune mine–usine", "Escalader les contraintes avec des chiffres"],
    lessons: [
      { h: "Indicateurs d'interface", body: `<ul><li>Tonnes et teneur alimentées au concasseur contre plan.</li><li>Heures de manque d'alimentation par cause, attribuées à la mine ou à l'usine.</li><li>Stock ROM en jours d'alimentation, par classe de mélange.</li><li>% de hors-gabarits au concasseur.</li></ul>` },
      { h: "Reprise", body: `<p>La reprise a souvent un tarif séparé. Si l'usine ne peut pas accepter le déversement direct (concasseur à l'arrêt), la reprise est un coût client. Si la mine a envoyé le mauvais matériau, c'est un coût entrepreneur. Le journal de dispatching tranche.</p>` },
      { h: "La réunion commune", body: `<p>Hebdomadaire, 30 minutes, une page : indicateurs d'interface de la semaine écoulée, plan d'alimentation de la semaine suivante, contraintes, actions avec responsables. Restez factuel ; c'est là que la confiance entre départements se construit ou se perd.</p>` },
      { h: "Escalade", body: `<p>Escaladez avec impact, cause et proposition : « Le concasseur a attendu 26 h la semaine dernière pour le dégagement des hors-gabarits (impact 1,2 M$ de marge usine). Cause : banquette de la première rangée. Proposition : profilage laser + recoupe de la première rangée, coût 12 000 $/mois. »</p>` }
    ],
    formulas: [{ name: "Jours de stock ROM", note: "jours" }],
    tips: ["Invitez une fois le chef d'usine à un tir.", "Partagez avec l'usine la prévision à 2 semaines de la mine.", "Une seule version de la vérité : données de dispatching et d'usine partagées.", "Convenez des causes de reprise au moment même, par courriel.", "Célébrez ensemble un bon mois."],
    prof: "La plupart des conflits mine–usine viennent de ce que chaque côté mesure son propre succès. Faites de l'once dans la salle d'or la mesure commune.",
    exercise: {
      intro: "Alimentation quotidienne de l'usine 10 800 t. Stock ROM : 54 000 t au total, dont 18 000 t en classe de mélange HT. Tarif contractuel de reprise 0,55 $/t. Le mois dernier, 92 000 t ont été reprises : 60 % parce que le concasseur était à l'arrêt, 40 % à cause de mauvais déversements de la mine.",
      parts: [
        { q: "Jours de stock ROM", unit: "jours" },
        { q: "Reprise facturable au client", unit: "$" },
        { q: "Coût de reprise à la charge de l'entrepreneur", unit: "$" }
      ],
      solution: `<p>54 000 / 10 800 = <b>5,0 jours</b>.</p><p>Client : 92 000 × 0,60 × 0,55 = <b>30 360 $</b>. Entrepreneur : 92 000 × 0,40 × 0,55 = <b>20 240 $</b>, plus la perte de teneur des mauvais déversements. Corrigez d'abord la discipline de dispatching.</p>`
    }
  };

  P.gc = {
    title: "Gouvernance de la réconciliation et onces à risque",
    objectives: ["Encadrer les rapports de réconciliation", "Gérer la foration CT et le délai du laboratoire comme chemin critique", "Valoriser le risque de mauvaise classification", "Intégrer la valeur acquise au rapport mensuel"],
    lessons: [
      { h: "Gouvernance", body: `<p>Les rapports publics (codes JORC, NI 43-101 et équivalents) exigent une Personne compétente/qualifiée pour les ressources et réserves. Le chef de projet ne signe pas les estimations mais porte la qualité des données qui les alimentent : foration, échantillonnage, QAQC, dispatching et enregistrements de réconciliation.</p>` },
      { h: "Chemin critique", body: `<p>La foration CT doit précéder le tir d'assez de gradins pour que les analyses reviennent avant l'excavation. Le délai du laboratoire (par ex. ≤ 48 h) est un indicateur contractuel. Un résultat CT en retard signifie extraire le bloc de minerai comme stérile ou immobiliser les pelles.</p>` },
      { h: "Maîtrise par la valeur acquise", body: `<p>VA (EV) = valeur du travail réalisé aux tarifs du contrat ; VP (PV) = valeur planifiée à date ; CR (AC) = coût réel. CPI = EV/AC ; SPI = EV/PV. Escaladez quand CPI &lt; 0,95 ; déclenchez une revue de récupération des coûts sous 0,90. Si SPI &lt; 0,90 pendant deux semaines, refaites la référence et notifiez formellement le client. EAC = BAC / CPI quand la performance actuelle est censée se poursuivre.</p>` },
      { h: "Rotation et passation", body: `<p>Avec un roster 1 mois sur site / 1 mois de repos, chaque passation est un risque de perte d'information. Rapport de passation standard : points d'autorisation ouverts, avenants ouverts, risques, engagements pris envers le client, questions de personnel. Un chevauchement de 2 jours avec une visite de terrain commune est le minimum.</p>` }
    ],
    formulas: [
      { name: "CPI / SPI", note: "" },
      { name: "EAC", note: "$" },
      { name: "TCPI", note: "efficacité nécessaire pour finir dans le budget" }
    ],
    tips: ["Lisez la réconciliation avec le géologue chaque mois.", "Mettez le délai du laboratoire sur le tableau de bord.", "Expliquez chaque écart en une phrase.", "Rédigez le rapport de passation pendant la rotation, pas le dernier jour.", "Préparez le PMP en associant chaque processus du site à son domaine de connaissance."],
    prof: "La valeur acquise ressemble à de la comptabilité. Sur un contrat minier, c'est un système d'alerte précoce : le CPI vous dit que la marge fuit deux mois avant les comptes.",
    exercise: {
      intro: "Valeur du contrat pour le trimestre (BAC) 9,6 M$. Après 6 semaines sur 13 : PV 4,4 M$, EV 4,0 M$, AC 4,3 M$.",
      parts: [
        { q: "CPI", unit: "" },
        { q: "SPI", unit: "" },
        { q: "EAC (méthode CPI)", unit: "M$" },
        { q: "TCPI pour finir dans le budget", unit: "" }
      ],
      solution: `<p>CPI = 4,0 / 4,3 = <b>0,93</b> (sous 0,95 : escalader). SPI = 4,0 / 4,4 = <b>0,91</b> (à surveiller : une deuxième semaine sous 0,90 déclenche une nouvelle référence).</p><p>EAC = 9,6 / 0,93 = <b>10,32 M$</b> → dépassement ≈ 0,72 M$.</p><p>TCPI = (9,6 − 4,0) / (9,6 − 4,3) = 5,6 / 5,3 = <b>1,06</b> : le travail restant doit être 6 % plus efficace que le budget. Pas crédible sans plan de redressement.</p>`
    }
  };

  /* --------------------------- EXAMENS --------------------------- */
  F.exams = {
    engineer: [
      { q: "La topographie indique 40 000 m³ en place de roche saine (2,70 t/m³, foisonnement 1,40). Combien de tonnes ?", o: ["28 571 t", "56 000 t", "108 000 t", "151 200 t"], why: "Tonnes = m³ en place × densité en place = 40 000 × 2,70. Le foisonnement ne change pas la masse." },
      { q: "Un facteur d'appariement de 1,3 signifie :", o: ["La pelle attend les camions", "Les camions font la queue à la pelle", "La flotte est parfaitement équilibrée", "Les camions sont surchargés"], why: "MF > 1 : plus de capacité camions que la pelle ne peut servir, donc les camions attendent." },
      { q: "Une ornière de 5 cm sur la piste donne une résistance au roulement d'environ :", o: ["2 %", "3 %", "5 %", "10 %"], why: "2 % + 0,6 % × 5 cm = 5 %." },
      { q: "Quelle méthode de foration est le standard pour des trous de 115–165 mm en roche aurifère dure ?", o: ["Marteau hors trou", "Marteau fond de trou (MFT)", "Rotary tricône", "Tarière"], why: "Le fond de trou garde le marteau au taillant : trous rectilignes et bonne pénétration en roche dure." },
      { q: "Une erreur d'angle de 3° sur un trou de 11 m décale le pied d'environ :", o: ["0,06 m", "0,19 m", "0,58 m", "1,1 m"], why: "11 × tan 3° = 0,58 m." },
      { q: "Avant l'autorisation de chargement, quel document est obligatoire ?", o: ["Rapport de production hebdomadaire", "Validation du levé du foré réel", "Analyse de fragmentation", "Réconciliation du carburant"], why: "La validation du foré réel est le point d'arrêt sécurité et contractuel avant le chargement." },
      { q: "Charge par trou pour 115 mm, ANFO 0,85 g/cm³, colonne de 8,5 m :", o: ["37 kg", "62 kg", "75 kg", "98 kg"], why: "7,854e-4 × 115² × 0,85 = 8,83 kg/m × 8,5 m = 75 kg." },
      { q: "Les trous contiennent 2 m d'eau. Quel produit ?", o: ["ANFO, il va sécher", "Émulsion ou mélange résistant à l'eau, ou gainer le trou", "Plus de bourrage", "Reporter le tir d'une semaine"], why: "L'ANFO ne résiste pas à l'eau ; il se dissout et peut rater." },
      { q: "Le principal moyen de maîtrise des projections et de la surpression aérienne en tête de trou est :", o: ["Un booster plus gros", "Une longueur et un matériau de bourrage corrects", "Une surforation plus longue", "Des retards entre rangées plus courts"], why: "Un bourrage insuffisant ou de mauvaise qualité laisse les gaz s'échapper en tête." },
      { q: "Orage de 60 mm sur un bassin de 15 ha, C = 0,8. Volume ruisselé ?", o: ["720 m³", "7 200 m³", "9 000 m³", "72 000 m³"], why: "0,060 × 150 000 × 0,8 = 7 200 m³." },
      { q: "Un bloc plus grand qu'environ 80 % de l'ouverture du concasseur doit être :", o: ["Déversé lentement", "Envoyé sur le tas de hors-gabarits pour débitage", "Mélangé aux fines", "Déversé la nuit"], why: "Les hors-gabarits coincent le concasseur. Cassez-les dans la fosse ou au brise-roche." },
      { q: "Mélange : 7 000 t à 1,6 g/t + 3 000 t à 0,8 g/t. Teneur ?", o: ["1,20 g/t", "1,36 g/t", "1,44 g/t", "2,40 g/t"], why: "(7 000 × 1,6 + 3 000 × 0,8) / 10 000 = 1,36 g/t." },
      { q: "Un blanc renvoie 0,45 g/t d'or. Cause la plus probable ?", o: ["Minerai à haute teneur", "Contamination à l'échantillonnage ou à la préparation", "Échantillon humide", "Variation normale"], why: "Un blanc ne doit pas contenir d'or. Un résultat au-dessus de la limite de détection signale une contamination." },
      { q: "Pourquoi décale-t-on les polygones de minerai après un tir ?", o: ["Pour inclure plus de tonnes", "Parce que le tir a déplacé la roche de plusieurs mètres", "Pour tenir le plan", "Erreur topographique"], why: "Le mouvement dû au tir décale les limites du minerai ; des polygones non corrigés diluent et perdent du minerai." },
      { q: "Lors d'un raté, la première action est :", o: ["S'approcher et inspecter le trou", "Maintenir la zone d'exclusion, prévenir la salle de contrôle, démarrer le temps d'attente", "Retirer le détonateur de fond", "Re-raccorder et tirer immédiatement"], why: "La sécurité d'abord : maintenir la zone, prévenir, attendre le délai prescrit avant qu'une personne compétente inspecte." }
    ],
    senior: [
      { q: "Disponibilité physique 88 %, utilisation de la disponibilité 75 %. Utilisation effective ?", o: ["63 %", "66 %", "75 %", "88 %"], why: "UE = PA × UoA = 0,88 × 0,75 = 66 %." },
      { q: "La politique constructeur « 10/10/20 » signifie :", o: ["10 % des chargements peuvent être 10 % en dessous", "≤ 10 % des chargements au-dessus de 110 % de la cible, aucun au-dessus de 120 %", "Charger 10 t, 10 t, 20 t", "10 % d'économie de carburant"], why: "Elle limite les surcharges pour protéger châssis, pneus et transmissions." },
      { q: "Un TKPH supérieur à la capacité des pneus se règle d'abord en :", o: ["Achetant de plus gros camions", "Revoyant le profil de transport, la vitesse et le temps de refroidissement", "Augmentant la pression des pneus", "L'ignorant en saison des pluies"], why: "Le TKPH est charge × vitesse ; les changements opérationnels passent avant les changements de pneus." },
      { q: "La vitesse de pénétration baisse de 20 % sur toute la flotte dans la même roche. Premier contrôle ?", o: ["La géologie", "L'état des taillants et la pression du compresseur", "Le roster des conducteurs", "La conception du tir"], why: "Les consommables et l'air sont les causes les plus fréquentes d'une dureté apparente." },
      { q: "L'espacement des trous de prédécoupage est en général de :", o: ["2–4 × D", "10–12 × D", "25–35 × D", "Le même qu'en production"], why: "Un espacement serré avec des charges découplées crée un plan de fissure sur la ligne de paroi." },
      { q: "Dans Kuz-Ram, augmenter la consommation spécifique à charge par trou constante :", o: ["Grossit X50", "Réduit X50", "Ne change pas X50", "Ne change que l'uniformité"], why: "X50 ∝ K^-0,8 : K plus élevé, fragmentation plus fine." },
      { q: "La constante de vibration USBM k = 160 s'applique à :", o: ["VPP en mm/s avec DR en m/kg½", "VPP en in/s avec DR en ft/lb½", "Surpression aérienne en dB(L)", "N'importe quel système d'unités"], why: "160 est la valeur impériale. L'équivalent métrique est d'environ 1 140 (mm/s, m/kg½)." },
      { q: "Limite VPP 25 mm/s à 300 m, k = 1 140, β = 1,6. La charge unitaire instantanée maximale est d'environ :", o: ["190 kg", "760 kg", "1 500 kg", "3 000 kg"], why: "DR = (1140/25)^(1/1,6) = 45,6^0,625 = 10,9 m/kg½ ; Q = (300/10,9)² ≈ 760 kg par 8 ms." },
      { q: "La surpression aérienne, pour la conformité structurelle et réglementaire, se déclare en :", o: ["dB(A)", "dB(L) (linéaire)", "mm/s", "Hz"], why: "Le dB(L) capte l'énergie basse fréquence qui affecte les structures ; le dB(A) est pour l'oreille humaine." },
      { q: "Doubler la longueur de conduite (réseau dominé par les pertes) avec la même pompe va :", o: ["Augmenter le débit", "Déplacer le point de fonctionnement vers un débit plus faible", "Ne rien changer", "Doubler le débit"], why: "La courbe du réseau se raidit ; elle croise la courbe de pompe à un débit plus faible." },
      { q: "Raison principale de dépressuriser les parois de la fosse :", o: ["Tirs moins chers", "Augmenter la contrainte effective et le coefficient de sécurité", "Maîtrise des poussières", "Transport plus rapide"], why: "La pression interstitielle réduit la contrainte normale effective sur les surfaces de rupture." },
      { q: "F1 = 1,08, F2 = 0,95. Interprétation ?", o: ["Modèle de ressources optimiste, exploitation bonne", "Modèle de ressources prudent ; onces perdues entre CT et usine", "Les deux parfaits", "L'usine récupère trop"], why: "F1 > 1 : le CT a trouvé plus que le modèle de ressources. F2 < 1 : pertes après le CT (dilution, perte de minerai, biais d'échantillonnage)." },
      { q: "Un résultat de MRC dépasse +3 écarts-types. Action ?", o: ["Accepter", "Rejeter le lot, réanalyser, enquêter", "Supprimer le MRC", "Faire la moyenne avec le résultat suivant"], why: "Au-delà de ±3 écarts-types, c'est un échec QAQC ; les résultats sont inutilisables tant que ce n'est pas résolu." },
      { q: "L'effet de pépite du variogramme représente :", o: ["La distance de corrélation", "La variabilité à distance nulle : erreur d'échantillonnage et géologie à micro-échelle", "La teneur moyenne", "La teneur de coupure"], why: "La pépite est la discontinuité à l'origine du variogramme." },
      { q: "Ajouter des camions à une flotte dont les camions font déjà la queue à la pelle va :", o: ["Augmenter fortement la production", "Augmenter le coût par tonne avec peu de production en plus", "Réduire l'attente", "Améliorer la disponibilité"], why: "La pelle est la contrainte ; les camions supplémentaires ne font qu'attendre." }
    ],
    pm: [
      { q: "Le directeur de mine du client dit « chargez maintenant, nous signerons plus tard ». Bonne réponse ?", o: ["Charger, pour tenir le planning", "Ne pas charger ; demander l'autorisation écrite et consigner l'instruction", "Charger la moitié de la maille", "Demander au fournisseur de signer"], why: "Charger sans autorisation transfère la responsabilité à l'entrepreneur ; consignez et demandez une confirmation écrite." },
      { q: "EV 4,0 M$, AC 4,3 M$, PV 4,4 M$. CPI et SPI ?", o: ["1,08 / 1,10", "0,93 / 0,91", "0,91 / 0,93", "1,10 / 0,98"], why: "CPI = 4,0/4,3 = 0,93 ; SPI = 4,0/4,4 = 0,91." },
      { q: "CPI de 0,89 ce mois-ci. Selon les seuils du site, vous devez :", o: ["Ne rien faire", "Escalader seulement", "Déclencher une revue de récupération des coûts", "Refaire la référence du planning"], why: "CPI < 0,90 déclenche une revue de récupération des coûts (l'escalade se fait dès < 0,95)." },
      { q: "Une modification de maille après foration, ordonnée par le client, impose une reforation. C'est :", o: ["Un coût de l'entrepreneur", "Un avenant à consigner et à réclamer", "Couvert par la marge", "Une question de sécurité seulement"], why: "Un changement causé par le client est une modification de périmètre : inscrivez-le au registre des avenants." },
      { q: "En termes PMBOK, le registre des avenants relève surtout de :", o: ["La gestion des ressources", "Le périmètre et l'intégration (maîtrise des modifications)", "La gestion de la qualité", "Les communications"], why: "La maîtrise des modifications fait partie de la maîtrise intégrée des modifications et de la gestion du périmètre." },
      { q: "Le produit du fournisseur d'explosifs fait défaut lors d'un raté. Qui est responsable du tir ?", o: ["Le fournisseur", "L'entrepreneur de tir", "Le client", "L'administration"], why: "Le fournisseur est un sous-traitant ; la responsabilité du tir reste à l'entrepreneur." },
      { q: "La réconciliation des explosifs montre 120 kg non justifiés. Action ?", o: ["Ajuster le mois prochain", "Traiter comme un incident : sécuriser, enquêter, déclarer comme la loi l'exige", "Ignorer si moins de 1 %", "Faire signer les opérateurs"], why: "La sûreté des explosifs est une obligation légale ; tout écart fait l'objet d'une enquête et d'une déclaration." },
      { q: "Meilleure preuve pour une réclamation d'immobilisation contre le client :", o: ["Synthèse mensuelle", "Feuilles d'arrêts quotidiennes codées par cause, signées par les deux parties", "Souvenir des conducteurs", "Courriel après le litige"], why: "Des enregistrements contemporains signés conjointement sont la preuve la plus solide." },
      { q: "Disponibilité de la flotte 82 % contre 85 % visés, 1,2 Mt/mois à 3,20 $/t. Recette perdue par mois environ :", o: ["38 000 $", "135 000 $", "384 000 $", "1,2 M$"], why: "1,2 Mt × (1 − 82/85) × 3,20 ≈ 135 500 $." },
      { q: "Point de commande : 0,4 unité/jour, délai 75 jours, stock de sécurité 12 unités :", o: ["30", "42", "75", "87"], why: "Point de commande = 0,4 × 75 + 12 = 42." },
      { q: "Moyen le plus efficace de maîtriser le risque de passation de rotation :", o: ["Rotations plus longues", "Rapport de passation standard plus chevauchement et visite de terrain commune", "Appels téléphoniques", "Courriel en fin de mois"], why: "Une documentation structurée et un chevauchement préservent l'information d'une rotation à l'autre." },
      { q: "L'eau rejetée devient trouble en aval après un orage. Priorité ?", o: ["Attendre qu'elle s'éclaircisse", "Confiner, notifier selon l'EIES/le permis, dialoguer avec la communauté, corriger la maîtrise des sédiments", "Pomper davantage", "Déclarer en fin de mois"], why: "Les engagements environnementaux et communautaires exigent une réponse et une notification immédiates." },
      { q: "L'exhaure relève du client dans le contrat. Les pompes tombent en panne ; les trous en eau doublent. Le surcoût d'émulsion est :", o: ["À l'entrepreneur", "Potentiellement réclamable par avenant s'il a été consigné au moment même", "Partagé automatiquement", "Une affaire d'assurance"], why: "Un coût causé par une défaillance du périmètre client peut être réclamé s'il a été enregistré au moment même." },
      { q: "Un TCPI de 1,25 signifie :", o: ["Projet sous le budget", "Le travail restant doit être 25 % plus efficace que le budget pour finir au BAC", "25 % d'avancement", "Planning en avance"], why: "TCPI = (BAC − EV)/(BAC − AC) ; au-dessus de 1,1, c'est rarement atteignable sans changement." },
      { q: "Une escalade vers le DG du client doit commencer par :", o: ["Qui est responsable", "L'impact chiffré, la cause et une proposition chiffrée", "Le détail technique", "Les seuls numéros de clauses du contrat"], why: "Les décideurs agissent sur l'impact et les options." }
    ]
  };

  F.corrections = [
    { claim: "Constante de vibration USBM par défaut k = 160, n = 1,6 pour une VPP en mm/s.", fix: "k = 160 est la valeur impériale (VPP en in/s, distance réduite en ft/lb½). En métrique (mm/s, m/kg½), la même courbe donne k ≈ 1 140. Utiliser 160 en métrique sous-estime la VPP d'environ 7 fois et autorise une CUIM environ 11 fois trop grande pour la même limite." },
    { claim: "Banquette B = 0,012 × (SGe/SGr)^(1/3) × De.", fix: "Cette formule mélange les deux formules de Konya. Konya métrique : B = 0,012 × (2·SGe/SGr + 1,5) × De (m, De en mm). Forme à racine cubique : B = 0,0378 × (SGe/SGr)^(1/3) × De. La version mélangée donne environ 0,9 m pour un trou de 115 mm au lieu d'environ 2,9 m." },
    { claim: "42 ms entre rangées est un minimum ISEE.", fix: "L'ISEE ne fixe pas de retard entre rangées. Le guide de Konya est de 6,5–13 ms par mètre de banquette (2–4 ms/ft) ; 42 ms convient à une banquette de 3,5 m mais doit suivre la banquette et être validé par les tas abattus et les mesures de vibrations." },
    { claim: "La méthodologie de surpression aérienne suit l'USBM RI 8507.", fix: "Le RI 8507 (Siskind et al., 1980) traite des vibrations du sol. La surpression aérienne relève du RI 8485 (Siskind et al., 1980). Les deux datent de 1980 et sont souvent cités ensemble." },
    { claim: "La consommation spécifique est le principal paramètre de conception.", fix: "La consommation spécifique résulte de la géométrie et de la charge. Concevez banquette, espacement, bourrage et séquence ; vérifiez la consommation spécifique comme plage de cohérence." },
    { claim: "La disponibilité, c'est la disponibilité.", fix: "Disponibilité physique, disponibilité mécanique et utilisation de la disponibilité sont différentes. Écrivez la définition contractuelle avant de discuter du chiffre." }
  ];
})();
