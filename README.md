# Zombie Game · v0.2 — Artillerie & hordes

RTS militaire et simulation d’apocalypse zombie en JavaScript et HTML5 Canvas. Visuel minimaliste, bâtiments vus uniquement de l’extérieur. Sans bibliothèque, service externe, compte, téléchargement d’assets ou compilation obligatoire.

## Jouer immédiatement

Décompressez le dossier et ouvrez **Jouer.html** par double-clic dans Chrome, Edge ou Firefox. Cette page autonome contient le même jeu que les modules source et fonctionne hors ligne. Choisissez un scénario puis **Nouvelle simulation**.

- **Défense :** protéger le QG pendant 5 minutes. Départ : 24 soldats, un char, un blindé, une artillerie mobile, un mortier, un canon HE, 80 civils, 2 500 zombies et 900 crédits. Population initiale réglable. Première horde à 35 s, suivantes toutes les 40 s. Le QG détruit termine la partie.
- **Banc d’essai — artillerie :** scénario sandbox prêt à jouer, avec 3 500 zombies concentrés au nord de la base et deux pièces d’artillerie mobile. Il suffit de le choisir dans le menu ; les armes tirent automatiquement. Le bouton Nouveau test de siège recommence ce scénario en remplaçant la simulation actuelle.
- **Sandbox :** ressources illimitées, pas de victoire ni de vagues automatiques. Placer des hordes, soldats et civils, effacer les zombies, construire et modifier la vitesse. Plafonds : 20 000 zombies et 600 humains/véhicules au total ; les choix initiaux vont jusqu’à 10 000 zombies.

Le jeu démarre en attente dans son menu. Les menus suspendent la simulation. Une nouvelle partie remplace l’ancienne : exportez votre sauvegarde si vous voulez la conserver.

## Contrôles

| Action | Commande |
| --- | --- |
| Sélectionner | Clic gauche sur une unité, ou rectangle glissé |
| Ajouter / retirer à la sélection | Maj + clic ; Maj + rectangle ajoute |
| Sélectionner l’armée | Ctrl+A / Cmd+A, ou bouton Tout sélectionner |
| Déplacer en formation | Clic droit, ou Déplacer puis clic gauche |
| Avancer en combattant | T puis clic, ou bouton Avancer / attaquer |
| Barrage manuel d’artillerie | Sélectionner une artillerie, B puis clic sur une cible au sol |
| Tenir la position | H, ou bouton Tenir |
| Caméra | WASD, ZQSD, flèches, bouton central glissé |
| Zoom | Molette, centré sur le curseur |
| Recentrer sur le QG | F, ou bouton QG de la minicarte |
| Naviguer rapidement | Clic sur la minicarte |
| Pause | Espace, ou bouton Pause |
| Construction / apparition | Choisir un outil puis cliquer ; Maj pour répéter |
| Annuler un outil | Échap ou clic droit |

Sur écran tactile, utilisez **Forces** pour afficher/masquer le panneau, **Tout sélectionner**, **Déplacer**, puis touchez la destination. Glissez à deux doigts et pincez pour déplacer/zoomer la caméra. Une souris reste plus pratique pour cette version.

## Combat et économie

Les soldats tirent seuls sur les zombies visibles à portée, même pendant un déplacement normal. L’ordre avancer/attaquer les arrête pour tirer lorsqu’ils rencontrent une cible. Les cercles bleus ont un fusil qui s’oriente indépendamment de leur déplacement. Les chars et les canons HE utilisent des obus à dégâts de zone ; les blindés ont une mitrailleuse. Les mortiers et les artilleries mobiles tirent en cloche par-dessus les bâtiments, avec un délai avant l’impact.

Les projectiles ont un trajet réel, un impact, une durée de vie et sont arrêtés par les bâtiments. Les chargeurs sont limités ; le rechargement prend des munitions dans une réserve finie. Les alliés et les constructions amies ne reçoivent pas de tirs amis. Le souffle perd de sa puissance avec la distance et les murs/bâtiments protègent des éclats. Les survivants sont repoussés sans traverser les obstacles.

Une morsure infecte un humain. Il se transforme après 18 secondes, ou immédiatement s’il meurt infecté. Les civils cherchent à rejoindre la base. Le QG et les dépôts soignent, guérissent l’infection et reconstituent les réserves dans un rayon de 270 unités. Les tourelles se ravitaillent à moins de 700 unités d’un dépôt ou du QG. Les véhicules ne sont pas infectés.

Le QG produit **8 crédits/seconde**. Un civil évacué rapporte **20 crédits**. Les casernes permettent de recruter des soldats ; le QG déploie les véhicules. Les bâtiments se posent sur une grille de 64 unités près d’une installation militaire existante. Laissez des passages pour les unités et les civils.

| Élément | Coût | Fonction |
| --- | ---: | --- |
| Soldat | 45 | Fusil automatique, 30 balles + 150 en réserve |
| Blindé | 350 | Mitrailleuse, 900 PV |
| Char | 600 | Canon à dégâts de zone, 1 600 PV |
| Barricade | 40 | Obstacle destructible, 950 PV |
| Tourelle | 220 | Défense automatique, 600 balles initiales |
| Dépôt | 180 | Soins, guérison et ravitaillement |
| Caserne | 250 | Point de recrutement des soldats |

## Artillerie et sensation d’impact

Les armes lourdes cherchent un ennemi au cœur d’une cellule dense de la horde, plutôt que de viser systématiquement le zombie le plus proche. L’artillerie mobile doit s’arrêter pour tirer ; ses obus partent avec une trajectoire en cloche visible et tombent après 0,8 à 2,2 secondes.

Sélectionnez **Artillerie seule**, puis **Bombarder [B]** et une cible au sol : les pièces à portée bombardent cette position en boucle, même si la horde s’en éloigne. **Tenir [H]** ou un nouvel ordre de déplacement annule la cible manuelle et rétablit le tir autonome sur les ennemis. Une pièce trop proche ou trop loin de la cible refuse l’ordre.

| Arme | Coût | Portée | Rayon d’impact | Rythme nominal |
| --- | ---: | ---: | ---: | --- |
| Canon HE fixe | 320 | 720 | 112 | Un tir / 2,6 s, tir direct |
| Mortier fixe | 420 | 160–1 250 | 160 | Un tir / 5,5 s, tir indirect |
| Artillerie mobile | 800 | 180–1 450 | 185 | Cycle de tir de 6 s, tir indirect |
| Canon du char | 600 pour le véhicule | 520 | 92 | Limité par le rechargement |

Ces distances sont des unités du monde. Les réserves restent limitées : 60 obus pour un canon fixe, 30 pour un mortier et un obus chargé + 24 en réserve pour l’artillerie mobile. Les dépôts reconstituent les réserves selon le type d’arme.

Les impacts montrent une onde de choc, un cœur incandescent, des éclats, de la fumée et un cratère. Les morts laissent du sang au sol, regroupé par petites zones pour conserver des performances raisonnables. Un compteur indique les éliminations explosives et le meilleur impact. Le menu permet de désactiver le sang ou les secousses et de réduire les effets ; ces réglages changent uniquement le rendu.

Conseil : déplacez une partie de l’armée vers les accès, construisez des tourelles et un dépôt près du front. La garnison et ses défenses initiales ont été renforcées pour présenter les nouvelles armes ; l’équilibrage reste provisoire.

## Sauvegardes

Menu ☰ → **Sauvegarder JSON** / **Charger JSON**. Export explicite, aucun cloud ni sauvegarde automatique. Le fichier conserve les entités, constructions, ordres, munitions, infection, projectiles, bruits, économie, horloge et état du générateur aléatoire. Les tirs en cloche en vol, les cibles de barrage, le recul résiduel, les cratères et les traces de sang sont également conservés. Les particules transitoires et la caméra ne sont pas conservées. Les sauvegardes v0.1 sont acceptées puis converties au format v0.2 ; l’ancienne version ne peut pas charger les sauvegardes v0.2. Les fichiers incompatibles ou aux champs invalides sont refusés.

## Développement

Le code de référence reste modulaire dans `src/`. Pour le servir en local depuis ce dossier :

```sh
python -m http.server 8000
```

Sous Windows, `py -m http.server 8000` fonctionne aussi si le lanceur Python est installé. Ouvrez ensuite `http://localhost:8000`.

Node.js 20+ pour les tests et outils facultatifs ; **aucun npm install nécessaire** :

```sh
npm test
npm run benchmark
npm run build
```

`build` régénère `Jouer.html` à partir des modules et produit `dist/`. Après modification des sources, relancez cette commande avant de partager la page autonome. `index.html` utilise directement les modules et n’a pas besoin d’être reconstruit.

| Module | Responsabilité |
| --- | --- |
| `src/core.js` | Constantes, générateur aléatoire, géométrie, grille spatiale |
| `src/navigation.js` | Collisions, visibilité, A* et champ de navigation partagé |
| `src/simulation.js` | Monde, IA, combat, infection, ressources, construction, sauvegardes |
| `src/combat.js` | Armes lourdes, visée sur les groupes denses, traces au sol bornées |
| `src/effects.js` | Sang, onde de choc, fumée, éclats et trajectoires des obus |
| `src/renderer.js` | Canvas, caméra, visibilité et minicarte |
| `src/input.js` | Sélection, ordres RTS, clavier, souris et tactile |
| `src/main.js` | Boucle à pas fixe 30 Hz, interface et fichiers |
| `tests/engine.test.js` | Tests fonctionnels du moteur |
| `tests/artillery.test.js` | Artillerie, dégâts et protection, recul, compatibilité des sauvegardes |
| `tests/benchmark.js` | Mesures reproductibles, populations dispersées et concentrées |
| `scripts/portable.js` | Assemblage de la page autonome sans dépendance |

## Import et GitHub Pages

Importez le **contenu** du dossier `Zombie_Game` à la racine de votre dépôt. Pour GitHub Pages : **Settings → Pages → Deploy from a branch → main → / (root)**. `index.html`, `style.css` et `src/` suffisent pour jouer ; conservez aussi tests et outils pour le développement. Le workflow inclus exécute uniquement les tests et la construction, sans publication automatique.

## Validation et performances

27 tests automatisés couvrent la navigation, les commandes, les tirs, les obstacles, les munitions, les dégâts de zone, l’infection, les défenses destructibles, l’économie, les vagues, les fins de partie, la sauvegarde et les limites de requête spatiale. Vérification navigateur : banc d’essai de siège, impacts, sang/cratères, sélection des artilleries et ordre de barrage manuel. Les tests moteur vérifient aussi le tir indirect par-dessus un bâtiment, la protection contre le souffle, le recul sans traverser les obstacles, l’absence de dégâts alliés et la reprise de sauvegardes avec des obus en vol.

`BENCHMARK.json` contient les mesures effectuées dans l’environnement de développement. Les effectifs indiquent la population initiale et la population restante après les combats. Ces mesures concernent le moteur Node.js, **pas le nombre d’images par seconde dans votre navigateur**. Le rendu, le matériel, le zoom et la concentration des zombies influencent la fluidité. La limite de 20 000 est une protection de population, pas une promesse de fluidité sur tous les appareils.

Les traces au sol sont plafonnées à 4 096 zones de sang et 192 cratères. Les particules transitoires sont bornées ; les morts massives ne créent pas un objet permanent par cadavre.

Le moteur utilise une grille spatiale, des décisions IA espacées dans le temps, un champ BFS commun aux zombies, A* pour les déplacements commandés, un budget de voisins pour la séparation, un rendu groupé des zombies et un filtrage des éléments hors champ. En cas de surcharge, la boucle limite le rattrapage : la simulation peut ralentir au lieu de bloquer l’interface.

## Limites actuelles

- Une seule carte générée à graine fixe, sans campagne, multijoueur ni brouillard de guerre.
- Les zombies convergent vers le QG, sont attirés localement par les tirs et poursuivent les humains visibles. Pas encore de stratégie collective avancée ni d’odeur persistante.
- Les humains et véhicules ont une collision avec les bâtiments ; ils peuvent se chevaucher entre eux. La séparation des zombies est approximative et bornée pour les performances.
- Une construction ajoutée sur une route peut interrompre un ancien ordre ; redonnez cet ordre pour recalculer le trajet.
- Pas d’embarquement dans les véhicules, réparation manuelle, démolition, sons, intérieur de bâtiment ou simulation de toit.
- Les modèles et tarifs sont provisoires. L’équilibrage mérite encore des parties sur plusieurs machines.

Projet original inspiré d’Ebbtide pour l’échelle et le commandement militaire, et de Sir, We Have an Orc Problem pour les hordes massives et l’impact de l’artillerie. Aucun code ni asset de ces jeux n’est utilisé.
