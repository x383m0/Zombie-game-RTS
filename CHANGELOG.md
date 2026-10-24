# v0.2.1 — 23 octobre 2026

Correctif de démarrage : index.html et Jouer.html sont maintenant deux pages autonomes identiques, avec JavaScript classique intégré et sans import réseau. L’ouverture par double-clic ne dépend plus du chargement de modules en file://. Les sources restent modulaires via dev.html et src/page.html.

Ajout d’un panneau de diagnostic visible pour les erreurs JavaScript et de chargement, avec bouton Recharger. Les compteurs ne prétendent plus que le moteur tourne avant le démarrage. Premier rendu effectué avant de masquer le panneau. Quatre tests d’intégration supplémentaires exécutent les scripts réellement distribués sans réseau : 31 tests au total.

# v0.2.0 — 23 octobre 2026

Ajout d’un canon HE fixe, d’un mortier fixe et d’une artillerie mobile. Tir indirect en cloche, visée des groupes denses, barrage manuel avec B, recul des survivants et dégâts décroissants avec la distance. Les bâtiments protègent du souffle. Aucun dégât aux alliés ou aux constructions amies.

Nouveaux effets Canvas : onde de choc, flash chaud, éclats, fumée, sang persistant et cratères. Réglages de sang, secousses et effets réduits. Scénario de siège de 3 500 zombies accessible dès le menu. Compteurs d’éliminations explosives et de meilleur impact. Commandes RTS remontées dans le panneau pour rester accessibles.

Sauvegardes format v2, avec migration du format v1, conservation des obus en vol, cibles de barrage, recul et marques au sol. Effets et traces bornés pour les grandes populations. 27 tests passent ; benchmark actualisé dans BENCHMARK.json. Vérification navigateur du siège et du barrage manuel.

# v0.1.0 — 23 octobre 2026

Reprise du prototype Canvas initial avec architecture modulaire. Carte agrandie, navigation autour des bâtiments, blindé et char, projectiles avec impacts continus, dégâts de zone, chargeurs et réserves, propagation de l’infection, civils autonomes et évacuation, construction, barricades destructibles, tourelles, économie, casernes, dépôts, mode défense et sandbox, minicarte, ordres groupés, sauvegarde JSON et page autonome hors ligne.

Vérification : 16 tests moteur, benchmark de 2 500 à 10 000 zombies et test de horde concentrée. Test de défense prolongé sans intervention : défaite à environ 2 min 14 s, plus de 1 400 zombies éliminés. Tests navigateur : démarrage, sélection, ordres, construction et sandbox.
