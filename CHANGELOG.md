# Changelog - Mental Palace

## [2026-09-11] - Ma maison : pièces et endroits modifiables dans l'app

### Ajouté
- **Écran « Ma maison »** (Mon palais → ✏️) : ajouter, renommer, réordonner (↑ ↓) et supprimer des pièces et des endroits. Appuyer sur un nom pour le changer, dans une feuille avec champ texte
- Les mots rangés dans un endroit et les stickers collés suivent un **renommage**
- **Supprimer** un endroit libère ses stickers et déplace les mots qui y étaient vers un endroit libre ; les autres mots ne bougent pas. Impossible de supprimer le dernier endroit
- Bouton « Revenir à la maison de départ » (celle de `data/lieux.js`)

### Technique
- Stockage `maison` : `[{ piece, emplacements: [] }]`. Au premier lancement, la maison est copiée depuis `LIEUX` : les appareils existants gardent leur maison même si `data/lieux.js` change ensuite
- `Storage.getMaison()`, `saveMaison()`, `maisonParDefaut()`, `renommerLieu()`, `supprimerLieu()`, `reparerEmplacements()`
- `reparerEmplacements()` au démarrage : tout mot sans endroit valide en reçoit un. Une liste avec plus de mots que d'endroits partage désormais les endroits au lieu de laisser des mots sans endroit
- `LIEUX` n'est plus lu directement que pour la maison de départ ; le palais lit `Storage.getMaison()` et `emplacementsDe(piece)`
- Service worker `v10`

## [2026-09-10] - Stickers emoji + kawaii à 40 ⭐, habits et accessoires en récompenses

### Stickers
- Les **stickers emoji** reviennent (commun 5 ⭐, rare 12 ⭐, légendaire 25 ⭐)
- Nouveau rayon **Kawaii** à **40 ⭐** : 24 stickers dessinés par le code (les 16 personnages + 8 variantes en cape ou couronne)
- Coffres : petite chance de sticker kawaii (3 % coffre normal, 8 % coffre rare)

### Habits et accessoires (atelier)
- Pelages pastel (8 ⭐), lunettes (10 ⭐), chapeaux (12 ⭐), tenues (15 ⭐) sont maintenant des **récompenses** : 20 objets
- Gratuits : les 16 personnages, les expressions, la couleur naturelle, les couleurs de tenue
- **Boutique** : rayon « Habits et accessoires », aperçu porté par le kawaii principal, compteur débloqués/total
- **Coffres** : un coffre sur trois environ donne un accessoire au lieu d'un sticker (`ECONOMIE.chanceAccessoireCoffre`)
- **Atelier** : options verrouillées avec 🔒 ; appuyer dessus propose de la débloquer avec les étoiles, avec aperçu sur le kawaii en cours ; « Au hasard » ne pioche que dans ce qui est débloqué
- Les kawaii déjà enregistrés gardent leurs accessoires

### Technique
- `economy.wardrobe` : liste des accessoires débloqués (`"hat:couronne"`)
- `accessoryCatalog()`, `Storage.unlockAccessory()`, `Storage.drawAccessory()`
- `showChestOverlay(tier, reward)` accepte n'importe quelle récompense `{ art, nom, tag, tagColor, sub }`
- `stickerArt()` rend un emoji ou un kawaii selon le sticker

## [2026-09-09] - Équipe de kawaii + stickers kawaii

### Décision
- Pas d'avatar fille : que des kawaii. Des avatars kawaii pourront venir plus tard.

### Ajouté
- **`js/kawaii.js`** : moteur de dessin SVG de 16 personnages kawaii (8 animaux, 4 objets, 4 aliments), sans aucune image. Style : tête large et aplatie, yeux énormes et écartés placés bas, bouche minuscule, joues roses, contour blanc de sticker, dégradé brillant. Couleur, expression (7), chapeau (6), lunettes (3), tenue (4) et couleur de tenue au choix
- **Kawaii principal** choisi dès le départ (accueil → « C'est parti »)
- **Compagnons** : un nouveau débloqué à chaque liste qui atteint le niveau Ninja, jusqu'à 5. Message et bouton sur l'écran de résultats
- **Écran « Mes kawaii »** : principal, compagnons, cases verrouillées avec la condition ; « Modifier » ; « Devenir principal » échange un compagnon et le principal. Elle change quand elle veut
- **Atelier** : galerie des 16 personnages redessinés avec les réglages en cours, scène, réglages, « Au hasard », « C'est lui ! »
- **Accueil** : carte d'équipe avec le principal en grand (qui se balance doucement) et les compagnons en rond, cases « + » à choisir et « 🔒 » à débloquer
- **Stickers kawaii** : les 40 stickers des coffres, de la boutique et du palais sont maintenant des kawaii dessinés par le code (16 communs, 16 rares avec couleur/expression/accessoire, 8 légendaires avec cape ou couronne). Catalogue dans `data/lieux.js`, champ `k`

### Technique
- Stockage `kawaiiTeam` : `{ main, companions[5] }`
- `Storage.getCompanionSlots()` = nombre de listes au niveau Ninja (max 5)
- `stickerArt(sticker, taille)` remplace les emojis partout
- Service worker : cache `mental-palace-v9`, `js/kawaii.js` mis en cache

## [2026-09-09] - Niveau Ninja

### Ajouté
- **Niveau Ninja**, dernier niveau de chaque liste (après celui où le mot entier est masqué) : le mot entier est à écrire et une ou deux **cases pièges** sont ajoutées, identiques aux autres, pour ne pas connaître le nombre de lettres
- Les lettres tapées en trop s'affichent en rouge au résultat
- Badge 🥷 sur la liste et sur l'écran de résultats quand le niveau Ninja est atteint
- Le niveau Ninja rapporte le plus d'étoiles par mot (base + niveau)

## [2026-09-09] - Rejouer, son et volume pendant l'apprentissage, erreurs sans notification

### Ajouté
- **Bouton « Réécouter »** sous le mot à compléter en interrogation et entraînement : redit le mot à voix haute
- **Bouton « Rejouer »** sur l'écran de résultats : relance la même session (même liste, même mode, mêmes mots, y compris après un apprentissage ou sur les mots à travailler)
- **Bouton son** dans les contrôles de lecture de la visite du palais, synchronisé avec celui de l'accueil
- **Curseur de volume** (sauvegardé) : s'applique aux notes des lettres, aux sons d'étoiles et de coffres, et à la voix

### Modifié
- En cas d'erreur, plus de notification « C'était : ... » : le mot affiche déjà les bonnes lettres, en rouge là où c'était faux
- « Retour à l'accueil » devient un bouton discret sur l'écran de résultats, « Rejouer » est l'action principale

## [2026-09-09] - Temps par mot beaucoup plus généreux

### Problème
- Le mode progressif ne laissait que 15 s au niveau 1 (puis 13, 11, 10 s) : trop court pour une enfant sur clavier virtuel

### Nouveau
- Temps par mot = base + secondes par lettre à trouver, réglable dans `data/lieux.js` (`TEMPS`)
- Par défaut 30 s + 5 s par lettre : 40 s au niveau 1, 45 s au niveau 2, 70 s pour un mot entier de 8 lettres
- Même formule en interrogation complète. Le temps ne diminue jamais quand le niveau monte

## [2026-09-09] - Niveau mémorisé par liste, récompenses qui grandissent avec le niveau

### Problème
- Le « niveau » était l'index du paquet de dix mots dans la session : une liste de dix mots ou moins restait toujours au niveau 1

### Nouveau
- **Niveau par liste**, sauvegardé (`list.level`). Niveau 1 = 2 lettres à trouver, +1 lettre par niveau, jusqu'au mot entier
- **Passage au niveau suivant** quand une session en mode progressif est réussie à 80 % ou plus (`ECONOMIE.seuilPassageNiveau`). **Le niveau ne redescend jamais**
- **Étoiles par bonne réponse = base du mode + niveau** : 1 ⭐ au niveau 1, 2 ⭐ au niveau 2, etc. Le bonus sans-faute grandit aussi
- Écran résultats : encart « Niveau X atteint », ou rappel bienveillant de l'objectif, ou couronne au niveau maximum
- Écran listes : badge de niveau et étoiles par mot
- Indice pendant l'interrogation : niveau, lettres à trouver, étoiles par mot

## [2026-09-09] - Refonte design + récompenses (étoiles, coffres, stickers)

### Constat de départ
- L'écran « Ma collection » n'était jamais rempli : les récompenses débloquées étaient invisibles
- Aucune image de récompense n'existait : quatre emojis génériques pour dix-neuf objets
- Le pool de dix-neuf récompenses s'épuisait vite, indépendamment du score
- La police Nunito n'était jamais chargée (`@import` placé après une règle CSS, donc ignoré)
- Deux écrans partageaient l'id `feedback-container` : le message « Bravo ! » de l'interrogation s'affichait dans l'écran caché

### Récompenses (nouveau système, sans images)
- **Étoiles** : +1 par bonne réponse (+2 en interrogation complète), +5 bonus sans-faute, +3 par visite du palais
- **Coffres** : un coffre tous les 12 étoiles gagnées ; ouverture interactive (on tape dessus), confettis, son ; sans-faute = coffre rare garanti
- **Stickers** : 38 stickers emoji en trois raretés (commun, rare, légendaire), catalogue dans `data/lieux.js`
- **Boutique** : achat au choix avec les étoiles (5 / 12 / 25 ⭐)
- **Mon palais** : chaque pièce a un emoji trouvé par mot-clé ; l'enfant colle jusqu'à 4 stickers par lieu ; les stickers apparaissent ensuite sur la carte du lieu pendant le jeu
- **Accueil** : solde d'étoiles, jauge « prochain coffre », bouton d'ouverture, badges (stickers collés, listes dorées)
- Migration : les anciennes récompenses débloquées sont converties en étoiles (5 chacune)

### Design
- Tokens CSS (`:root`) pour couleurs, rayons, ombres, mouvement
- Hiérarchie : « Mes listes » en action héro, tuiles secondaires ; plus de dégradé sur tous les boutons
- Encre plus foncée et corps plus gros pour la lisibilité
- Mot à compléter en cases de lettres (façon Wordle) ; vert / rouge au résultat
- Clavier en rangées, accents toujours visibles, parenthèses conservées, Valider à droite conservé
- Timer orange sous 30 % du temps
- Feedback en toast fixe sous le bandeau
- Mouvement réduit pendant la tâche, célébrations gardées pour les paliers
- Police chargée via `<link>` avec pile de secours pour le mode offline
- Écran « Mots à travailler » et « Mes listes » vide enfin rendus

### Technique
- `data/lieux.js` : `RECOMPENSES` remplacé par `STICKERS`, `RARETES`, `ECONOMIE`, `PIECE_EMOJIS`
- `js/app.js` : `Storage` gère l'économie (`economy` dans localStorage) ; nouvelles fonctions `renderHome`, `showPalaisScreen`, `showPieceScreen`, `showShopScreen`, `openPendingChests`, `showChestOverlay`
- `startInterrogationBase(listId, wordsSubset)` accepte un sous-ensemble de mots
- Service worker : cache `mental-palace-v8`, stratégie réseau d'abord (cache en secours hors ligne), rechargement automatique quand une nouvelle version est installée

## [2026-09-06] - FIX CRITIQUE : Normalisation apostrophes

### Problème découvert
- ❌ **"aujourd'hui" ne fonctionnait pas** quand c'était un mot de la liste
- La fonction `normalizeApostrophes()` était **CASSÉE** : elle ne faisait rien
- Les regex contenaient `/'/g` (U+0027) au lieu de `/’/g` (apostrophe iOS)
- Résultat : tous les mots avec apostrophe iOS (') ne matchaient jamais avec le clavier (')

### Corrigé
- ✅ **Fonction `normalizeApostrophes()` réparée avec codes Unicode échappés**
  ```javascript
  .replace(/’/g, "'")  // Apostrophe courbe droite iOS (U+2019) → standard (U+0027)
  .replace(/‘/g, "'")  // Apostrophe courbe gauche (U+2018) → standard (U+0027)
  .replace(/`/g, "'")       // Accent grave (U+0060) → standard
  .replace(/´/g, "'")       // Accent aigu (U+00B4) → standard
  .replace(/′/g, "'")  // Prime (U+2032) → standard
  .replace(/ʼ/g, "'")  // Modifier letter (U+02BC) → standard
  ```

### Test de validation
- Test avant fix : "aujourd**'**hui" (U+2019) !== "aujourd**'**hui" (U+0027) ❌
- Test après fix : "aujourd**'**hui" (U+2019) → normalisation → "aujourd**'**hui" (U+0027) ✅
- **Tous les types d'apostrophes convertis vers U+0027 standard**

### Impact
- **Tous les mots avec apostrophes fonctionnent maintenant**, peu importe le clavier (iOS/iPad/Mac/Windows)
- La normalisation se fait à la création/édition de liste ET à la comparaison
- Plus de problème de "mot non reconnu" à cause des apostrophes

### Technique
- Utilisation de `\uXXXX` pour garantir les bons caractères Unicode dans le code source
- Sinon l'outil d'édition convertit automatiquement les apostrophes en U+0027

## [2026-09-06] - Sauvegarde préférences + Normalisation apostrophes (tentative initiale)

### Ajouté
- **Sauvegarde de la vitesse d'animation**
  - La vitesse de l'animation des lettres (slider) est maintenant sauvegardée dans localStorage
  - Chargée automatiquement au démarrage de l'application
  - Fonctionne comme le toggle son : la préférence persiste entre les sessions
  - Log console : "Vitesse animation sauvegardée: X.X" et "Vitesse animation chargée: X.X"

- **Normalisation automatique des apostrophes dans les listes**
  - Quand tu crées ou édites une liste, tous les mots sont automatiquement normalisés
  - Toutes les variantes d'apostrophes (', ', `, ´, etc.) sont converties en apostrophe standard (')
  - Normalisé à la SOURCE (dans la liste), pas seulement à la comparaison
  - Plus simple et plus fiable : tout le monde utilise le même format

### Modifié
- **Fonction `createListFromManualInput()`**
  - Ajoute `.map(w => normalizeApostrophes(w.trim()))` lors du parsing des mots
  - Tous les mots sont normalisés avant d'être sauvegardés dans la liste
  - Log console : "Liste créée avec apostrophes normalisées: [...]"

- **Fonction `saveEditedList()`**
  - Même normalisation que pour la création
  - Garantit que l'édition ne casse pas la cohérence
  - Log console : "Liste modifiée avec apostrophes normalisées: [...]"

- **Fonction `updateSpeed()`**
  - Sauvegarde la nouvelle vitesse dans localStorage
  - `localStorage.setItem('animationSpeed', value)`

- **Initialisation DOMContentLoaded**
  - Charge la vitesse sauvegardée au démarrage
  - Met à jour le slider et l'affichage de la valeur
  - Se fait juste après le chargement de la préférence son

### Technique
- Les mots dans les listes sont normalisés dès leur création/édition
- Format stocké : apostrophes standard uniquement
- Le clavier peut continuer à utiliser n'importe quelle apostrophe
- La comparaison fonctionne toujours (déjà normalisée des deux côtés)

### Exemple du flux
```
Utilisateur tape : "aujourd'hui" (apostrophe courbe iOS)
↓
createListFromManualInput()
↓
normalizeApostrophes("aujourd'hui")
↓
Stocké : "aujourd'hui" (apostrophe standard)
↓
Plus tard en interrogation :
- Mot stocké : "aujourd'hui" (standard)
- Utilisateur tape : "aujourd'hui" (courbe)
- normalizeApostrophes() sur les deux
- Match ! ✅
```

### Bénéfices
- ✅ Préférences son + vitesse sauvegardées : pas besoin de reconfigurer à chaque session
- ✅ Apostrophes cohérentes : format uniforme dans toutes les listes
- ✅ Plus de problème de compatibilité clavier iOS/Windows/Mac
- ✅ Simplification : normalisation à la source plutôt qu'à chaque comparaison
- ✅ Meilleure expérience utilisateur : "ça marche, point final"

### Service Worker
- Version v6 du cache
- Inclut toutes les améliorations

## [2026-09-06] - Séquence audio corrigée (voix puis notes)

### Corrigé
- **Conflit entre synthèse vocale et notes musicales**
  - Problème : Les notes musicales ne jouaient plus pendant l'animation des lettres
  - Cause : Web Speech API (synthèse vocale) et Web Audio API (notes) utilisées en même temps
  - Conflit de ressources audio sur iOS/Safari
  - Solution : Séquence stricte avec callback
    1. Lecture vocale du mot (Web Speech API)
    2. **Attente de la fin** de la lecture (événement `onend`)
    3. Délai de 200ms pour libérer l'AudioContext
    4. Puis animation avec les notes musicales (Web Audio API)

- **Fonction speakWord() améliorée**
  - Accepte maintenant un callback `onEndCallback`
  - Callback appelé quand `utterance.onend` se déclenche
  - Logs console pour suivre la séquence :
    - "Début lecture vocale: [mot]"
    - "Lecture vocale terminée"
    - "Début de l'animation avec les notes musicales"
  - Fallback si pas de synthèse vocale : callback appelé après 500ms

### Séquence avant (bugguée)
```
1. speakWord(mot)                    // Démarre la lecture
2. setTimeout 800ms                   // Délai fixe
3. prepareWordAnimation()             // Pendant que la voix parle
4. startWordAnimation()               // ❌ Conflit audio !
```

### Séquence maintenant (corrigée)
```
1. speakWord(mot, callback)           // Démarre la lecture
2. ... lecture en cours ...
3. onend event                        // Lecture TERMINÉE
4. setTimeout 200ms                   // Petit délai de sécurité
5. prepareWordAnimation()             // Maintenant c'est safe
6. startWordAnimation()               // ✅ Notes jouent !
```

### Technique
- Modification de `speakWord(word, onEndCallback)` :
  - Paramètre optionnel `onEndCallback`
  - Utilise `utterance.onend` pour détecter la fin
  - Logs console pour debug

- Modification de `showWordToTrace()` :
  - Utilise le callback au lieu d'un setTimeout fixe
  - Délai de 200ms après la fin de la voix
  - Garantit la séparation entre Web Speech et Web Audio

### Bénéfices
- ✅ Les notes musicales jouent à nouveau
- ✅ Pas de conflit audio
- ✅ Séquence logique : d'abord on entend le mot entier, puis la mélodie lettre par lettre
- ✅ Meilleure pédagogie : contexte global (voix) puis détails (notes)
- ✅ Fonctionne sur iOS/Safari qui sont stricts sur l'utilisation de l'audio

### Service Worker
- Version v5 du cache
- Inclut les corrections audio

## [2026-09-06] - Corrections mode apprentissage

### Corrigé
- **Bug affichage mot précédent**
  - Problème : Quand on passe au mot suivant, on clique "J'y suis", et on voit brièvement l'ancien mot avant le nouveau
  - Cause : Le container `#animated-word` n'était pas vidé avant d'afficher le nouveau mot
  - Délai de 800ms entre l'affichage du container et l'appel à `prepareWordAnimation()`
  - Solution : Vider le container immédiatement dans `showWordToTrace()` avant de l'afficher
  - Maintenant : Le container est vide pendant les 800ms, puis le nouveau mot apparaît

- **Scroll automatique vers bouton Suivant**
  - Problème : À la fin de l'animation, le bouton "Suivant" apparaît mais n'est pas visible (hors écran)
  - Solution : Scroll automatique vers le bouton après 300ms (le temps que le bouton apparaisse)
  - Comportement `smooth` avec `block: 'nearest'` pour un scroll naturel
  - Améliore l'UX : pas besoin de scroller manuellement pour cliquer sur "Suivant"

### Technique
- Modification de `showWordToTrace()` :
  - Ajout de `animatedWord.innerHTML = ''` avant l'affichage
  - Nettoie le container pour éviter de voir l'ancien contenu

- Modification de `startWordAnimation()` :
  - Ajout de scroll automatique à la fin de l'animation (ligne 638)
  - `setTimeout(() => nextButton.scrollIntoView(...), 300)`
  - Délai de 300ms pour que le bouton soit affiché avant le scroll

### Bénéfices
- ✅ Plus de flash de l'ancien mot
- ✅ Transition fluide entre les mots
- ✅ Bouton "Suivant" automatiquement visible
- ✅ Meilleure expérience utilisateur
- ✅ Moins de manipulation manuelle (scroll)

## [2026-09-06] - Toggle son + Support apostrophes multiples

### Ajouté
- **Bouton toggle son** 🔊/🔇
  - Bouton sur l'écran d'accueil pour activer/désactiver le son
  - États visuels : "🔊 Son activé" (rose/violet) ou "🔇 Son coupé" (gris)
  - Persistance dans localStorage : la préférence est sauvegardée
  - Désactive les mélodies (notes musicales) en mode apprentissage
  - La synthèse vocale reste active même si le son est coupé
  - Effet visuel : bouton grisé quand le son est coupé

- **Support des différents types d'apostrophes**
  - Fonction `normalizeApostrophes()` qui convertit tous les types d'apostrophes en apostrophe standard
  - Apostrophes supportées :
    - ' (U+2019) - apostrophe courbe droite (iOS/macOS)
    - ' (U+2018) - apostrophe courbe gauche
    - ` (U+0060) - accent grave
    - ´ (U+00B4) - accent aigu
    - ′ (U+2032) - prime
    - ʼ (U+02BC) - modifier letter apostrophe
    - ' (U+0027) - apostrophe standard (ASCII)
  - Normalisation appliquée dans :
    - `validateAnswer()` : comparaison globale de la réponse
    - `animateWordError()` : comparaison lettre par lettre
  - Fonctionne avec les mots comme "aujourd'hui", "d'accord", etc.

### Modifié
- **Comparaison des réponses améliorée**
  - Avant : `userInput.toLowerCase() === expected.toLowerCase()`
  - Maintenant : `normalizeApostrophes(userInput).toLowerCase() === normalizeApostrophes(expected).toLowerCase()`
  - Plus de normalisation NFD pour les accents
  - Logs console détaillés montrant les versions normalisées

- **Fonction playBeep() conditionnelle**
  - Vérifie `AppState.soundEnabled` avant de jouer
  - Si désactivé, retourne immédiatement sans jouer de son
  - Économise les ressources (pas d'initialisation AudioContext inutile)

### Interface
- **Bouton toggle son**
  - Position : écran d'accueil, entre l'avatar et le menu
  - Design : dégradé rose/violet quand activé, gris quand désactivé
  - Taille : 1.1rem, padding généreux pour touch
  - Effet hover : remonte légèrement
  - Effet actif : s'enfonce légèrement
  - Classe `.muted` pour l'état désactivé

### Technique
- Nouvelle propriété AppState :
  - `soundEnabled: true` (par défaut)
  - Chargée depuis localStorage au démarrage
  - Sauvegardée à chaque toggle

- Nouvelles fonctions utilitaires :
  - `normalizeApostrophes(str)` : normalise tous les types d'apostrophes
  - `toggleSound()` : inverse l'état du son + sauvegarde + met à jour le bouton
  - `updateSoundButton()` : met à jour le texte et le style du bouton

- Logs console ajoutés :
  - "Son: activé/désactivé" au toggle
  - "Après normalisation: input=..., expected=..., correct=..." dans validateAnswer

- Service Worker :
  - Version v3 du cache
  - Inclut les nouveaux fichiers HTML/CSS/JS

### Bénéfices
- ✅ Contrôle du son : utile en classe, dans les transports, etc.
- ✅ Compatibilité apostrophes : fonctionne quel que soit le clavier (iOS, Windows, Mac)
- ✅ Moins de frustration : "aujourd'hui" accepté même avec apostrophe courbe iOS
- ✅ Préférence persistante : pas besoin de recouper le son à chaque fois
- ✅ Interface claire : bouton explicite avec emoji et texte

### Notes
- La synthèse vocale (Web Speech API) n'est PAS affectée par le toggle son
- Seules les mélodies (notes musicales via Web Audio API) sont coupées
- Si besoin, on pourrait ajouter un toggle séparé pour la voix

## [2026-09-06] - Édition et suppression de listes

### Ajouté
- **Édition de listes existantes**
  - Bouton ✏️ sur chaque liste pour l'éditer
  - Écran d'édition avec les champs pré-remplis
  - Modification du nom de la liste
  - Ajout/suppression/modification de mots
  - Préservation des emplacements (palais) des mots existants
  - Nouveaux mots reçoivent de nouveaux emplacements automatiquement
  - Nettoyage automatique des mots supprimés (emplacements + progression)

- **Suppression de listes**
  - Bouton 🗑️ sur chaque liste pour la supprimer
  - Confirmation avant suppression (popup de sécurité)
  - Message d'avertissement : action irréversible
  - Supprime la liste ET toute la progression associée

- **Boutons icônes**
  - Design cohérent avec l'app (dégradés roses)
  - Taille : 36x36px
  - Icônes emoji : ✏️ (éditer) et 🗑️ (supprimer)
  - Effet hover : remonte légèrement
  - Bouton supprimer en rouge clair

### Interface
- **Écran d'édition de liste** (`edit-list-screen`)
  - Similaire à l'écran de création
  - Champs pré-remplis avec les données actuelles
  - Bouton "✅ Enregistrer les modifications"
  - Retour aux listes après sauvegarde

- **Affichage des listes modifié**
  - En-tête avec titre + boutons icônes
  - Boutons alignés à droite
  - Layout flexible pour s'adapter

### Technique
- Nouvelles fonctions Storage :
  - `updateList(listId, name, words)` : met à jour une liste
    - Préserve les emplacements des mots existants
    - Assigne de nouveaux emplacements aux nouveaux mots
    - Nettoie les emplacements des mots supprimés
    - Nettoie la progression des mots supprimés
  - `deleteList(listId)` : supprime une liste
    - Filtre les listes et sauvegarde
    - Retourne true si succès

- Nouvelles fonctions interface :
  - `showEditListScreen(listId)` : affiche l'écran d'édition
    - Charge la liste
    - Pré-remplit les champs
    - Stocke l'ID dans AppState.editingListId
  - `saveEditedList()` : sauvegarde les modifications
    - Validation des champs
    - Appel à Storage.updateList()
    - Feedback utilisateur
    - Retour à la liste des listes
  - `confirmDeleteList(listId)` : confirme et supprime
    - Demande confirmation (confirm())
    - Message d'avertissement clair
    - Feedback utilisateur
    - Rafraîchit l'affichage

- AppState enrichi :
  - `editingListId` : ID de la liste en cours d'édition

### Sécurité
- ✅ Confirmation obligatoire avant suppression
- ✅ Message clair sur l'irréversibilité
- ✅ Validation des champs avant sauvegarde
- ✅ Préservation de la progression des mots conservés

### Bénéfices
- ✅ Correction des fautes de frappe dans les listes
- ✅ Ajout de nouveaux mots sans recréer la liste
- ✅ Suppression des listes obsolètes
- ✅ Gestion complète du cycle de vie des listes
- ✅ Pas de perte de progression pour les mots conservés

## [2026-09-06] - Mode Offline complet (PWA)

### Ajouté
- **Service Worker pour fonctionnement offline**
  - Fichier `sw.js` qui met en cache tous les fichiers de l'application
  - L'app fonctionne maintenant **même si l'ordinateur est éteint** 🔌
  - Cache tous les fichiers nécessaires (HTML, CSS, JS, data, manifest)
  - Stratégie "Cache First" : charge depuis le cache, puis réseau si nécessaire
  - Nettoyage automatique des anciens caches lors des mises à jour

- **Rechargement possible en PWA**
  - ✅ On peut recharger la page même hors ligne
  - ✅ Tous les fichiers sont servis depuis le cache de l'iPad
  - ✅ Les données (listes, progression, récompenses) restent sur l'iPad grâce à localStorage
  - ✅ Pas besoin du serveur après la première visite

- **Mise à jour automatique**
  - Le Service Worker vérifie les mises à jour toutes les heures
  - Quand une nouvelle version est disponible, elle se télécharge en arrière-plan
  - Message dans la console : "Nouvelle version prête. Rechargez pour l'activer."
  - Au prochain rechargement, la nouvelle version s'active automatiquement

### Comment ça marche

**Première utilisation :**
1. L'iPad visite `http://[IP_DU_MAC]:8000` (ordi allumé)
2. Le Service Worker se télécharge et met TOUT en cache
3. Message console : "✅ Service Worker enregistré"
4. Message console : "🔌 L'app fonctionne maintenant OFFLINE !"

**Utilisations suivantes :**
1. L'iPad peut lancer l'app MÊME SI l'ordi est éteint ✅
2. Rechargement de la page : charge depuis le cache ✅
3. Toutes les fonctionnalités marchent normalement ✅

**Mises à jour :**
1. Quand l'ordi est rallumé, le Service Worker détecte les changements
2. Nouvelle version téléchargée automatiquement
3. Au prochain rechargement de l'app, nouvelle version active

### Technique
- Nouveau fichier `sw.js` à la racine du projet
- Cache name : `mental-palace-v1`
- Fichiers en cache :
  - `./` (racine)
  - `./index.html`
  - `./css/style.css`
  - `./js/app.js`
  - `./data/lieux.js`
  - `./manifest.json`
- Enregistrement du Service Worker dans `app.js` au `DOMContentLoaded`
- Logs console pour debug :
  - Installation du SW
  - Mise en cache
  - Interception des requêtes
  - Détection des mises à jour

### Avantages
- ✅ **Autonomie totale** : fonctionne sans serveur
- ✅ **Rechargement sécurisé** : pas de perte de données
- ✅ **Mises à jour transparentes** : automatiques quand l'ordi est allumé
- ✅ **Pas de configuration** : tout est automatique
- ✅ **Vraie PWA** : installable sur l'écran d'accueil + offline

### Instructions utilisateur
1. **Première fois** : Visite l'app avec l'ordi allumé
2. **Ajouter à l'écran d'accueil** : icône Safari → "Ajouter à l'écran d'accueil"
3. **Utilisation** : Lance depuis l'icône, même ordi éteint !
4. **Rechargement** : Peut recharger autant qu'elle veut, ça marche toujours
5. **Mises à jour** : Automatiques quand l'ordi est rallumé

## [2026-09-06] - Écran de résultats + Mode interrogation complète

### Corrigé
- **Bug affichage des erreurs au clic sur Valider**
  - Problème : les erreurs (lettres rouges) s'affichaient quand le timer expirait, mais pas au clic sur Valider
  - Cause : `handleKeyPress()` appelait `updateInputDisplay()` APRÈS `validateAnswer()`, ce qui écrasait le HTML des erreurs avec du textContent
  - Solution : `updateInputDisplay()` n'est plus appelé après VALIDER, seulement après EFFACER ou après saisie de lettre
  - Maintenant les erreurs s'affichent correctement dans tous les cas

### Ajouté
- **Écran de résultats détaillés après interrogation**
  - Affiche le score final avec pourcentage et étoiles (0-5)
  - Affiche la récompense débloquée (icône + nom)
  - Liste complète des erreurs commises :
    - Mot concerné
    - Lettres attendues
    - Réponse de l'utilisateur
  - Message de félicitations si aucune erreur
  - Bouton retour à l'accueil
  - Design cohérent avec le reste de l'app

- **Mode Interrogation Complète**
  - Nouveau mode où **tout le mot** est masqué (aucune lettre visible)
  - Timer de 40 secondes (vs 10-15s en mode progressif)
  - Plus difficile que le mode progressif
  - Accessible depuis la liste des mots avec bouton 🏆

- **Récompense après apprentissage**
  - Débloquer une récompense à la fin de chaque session d'apprentissage
  - Affichée sur l'écran de félicitations avant de proposer l'entraînement
  - Même système que pour l'interrogation

- **Tracking des erreurs**
  - Toutes les erreurs sont enregistrées dans `AppState.errors`
  - Chaque erreur contient :
    - Le mot complet
    - Les lettres attendues
    - La saisie de l'utilisateur
    - Le pattern affiché
  - Permet l'affichage détaillé des erreurs à la fin

### Modifié
- **Écran de sélection des listes**
  - 3 boutons au lieu de 2 :
    - 📖 Apprendre (mode apprentissage)
    - 🎯 S'entraîner (progressif) - mode interrogation avec aide
    - 🏆 Interrogation complète - tout le mot à trouver
  - Boutons empilés verticalement pour plus de clarté
  - Icônes pour différencier visuellement les modes

- **Système de timer adaptatif**
  - Mode progressif : 15/13/11/10s selon le niveau
  - Mode complet : 40s fixe (beaucoup plus de temps car tout le mot à trouver)
  - Log console indique le mode et le timer

- **Fonction `createWordPattern()` améliorée**
  - Détecte le mode d'interrogation (`progressive` ou `complete`)
  - Mode complet : masque toutes les lettres
  - Mode progressif : masque 2-5 lettres selon le niveau
  - Log console pour debug

- **Fin d'interrogation repensée**
  - Au lieu de retourner directement à l'accueil
  - Affiche d'abord l'écran de résultats pendant un moment
  - Puis bouton manuel pour retour accueil
  - Permet de consulter tranquillement les erreurs et la récompense

- **Comparaison des caractères accentués améliorée**
  - Utilise `normalize('NFD')` pour gérer les accents correctement
  - Logs détaillés pour debug : compare caractère par caractère
  - Affiche les versions normalisées dans la console
  - Corrige le bug où "à coté" n'affichait pas "ô" comme erreur

### Technique
- Nouvelle propriété `AppState.interrogationMode` : 'progressive' | 'complete'
- Nouvelle propriété `AppState.errors` : array d'objets erreur
- Nouvelles fonctions :
  - `startInterrogationProgressive(listId)` : lance mode progressif
  - `startInterrogationComplete(listId)` : lance mode complet
  - `startInterrogationBase(listId)` : fonction commune aux 2 modes
  - `showResultsScreen(reward)` : affiche résultats détaillés
- Modifications :
  - `validateAnswer()` : enregistre les erreurs dans AppState
  - `finishInterrogationLevel()` : appelle showResultsScreen au lieu de retour accueil
  - `showApprentissageComplete()` : débloque et affiche une récompense
  - `createWordPattern()` : gère les 2 modes
  - `showInterrogationQuestion()` : timer adapté au mode
  - `animateWordError()` : comparaison Unicode + logs détaillés

### Interface
- Nouvel écran HTML `results-screen` avec container `results-content`
- Design cohérent : dégradés roses/violets, cartes arrondies
- Étoiles pleines/vides pour visualiser le score
- Section récompense avec dégradé et ombre
- Section erreurs avec fond blanc et cartes individuelles
- Message de succès si aucune erreur (fond vert)

### Bénéfices
- ✅ Feedback complet sur la performance
- ✅ Apprentissage des erreurs facilité
- ✅ Motivation renforcée (récompenses + score détaillé)
- ✅ 2 niveaux de difficulté pour s'adapter à la progression
- ✅ Mode complet = vrai challenge pour tester la mémorisation
- ✅ Bug des accents corrigé avec normalisation Unicode

## [2026-09-06] - Déplacement items avatar + clavier amélioré

### Ajouté
- **Déplacement des items sur l'avatar**
  - Cliquer sur un item équipé sur l'avatar pour le sélectionner
  - Contrôles de déplacement apparaissent : ↑ ↓ ← →
  - Déplace l'item par pas de 10px dans toutes les directions
  - Item sélectionné pulse avec effet lumineux rose
  - Position sauvegardée automatiquement dans localStorage
  - Bouton "✓ OK" pour désélectionner et fermer les contrôles
  - Permet de personnaliser précisément l'apparence de l'avatar

- **Positions personnalisées persistantes**
  - Chaque item peut avoir sa propre position (x, y)
  - Positions sauvegardées par ID d'item dans localStorage
  - Positions par défaut si pas encore personnalisées :
    - Accessoires : x=0, y=-30 (en haut)
    - Maquillage : x=0, y=40 (centre visage)
    - Habits : x=0, y=60 (centre corps)

### Modifié
- **Bouton Supprimer déplacé**
  - Bouton ⌫ EFFACER maintenant sur la ligne 5 (dernière ligne)
  - Positionné à côté de la barre d'espace
  - Plus ergonomique : proche du pouce sur iPad
  - Barre d'espace réduite à 8 colonnes (au lieu de 9)
  - Ligne 5 : û ü ÿ [espace] ⌫

- **Avatar avec emoji petite fille**
  - Remplacé 😊 par 👧 (même emoji que l'écran d'accueil)
  - Plus cohérent avec le thème de l'application
  - Plus adapté au public cible

### Interface
- **Feedback visuel de sélection**
  - Item sélectionné pulse avec glow rose
  - Curseur "move" au survol des items
  - Animation smooth lors du déplacement
  - Panneau de contrôles avec fond blanc et ombre

- **Contrôles de déplacement**
  - 4 boutons directionnels (rose/violet)
  - Bouton "OK" vert pour terminer
  - Instructions claires : "Déplace l'objet avec les flèches"
  - Design cohérent avec le reste de l'app

### Technique
- Nouvelles fonctions Storage :
  - `getItemPositions()` : charge toutes les positions
  - `saveItemPosition(id, x, y)` : sauvegarde position d'un item
  - `getItemPosition(id, category)` : obtient position (ou défaut)
- Nouvelles fonctions interface :
  - `selectItemForMove(id)` : sélectionne/désélectionne un item
  - `deselectItem()` : désélectionne l'item actuel
  - `moveItem(direction)` : déplace dans une direction
- AppState.selectedItemForMove : track l'item en cours de déplacement
- CSS : .avatar-slot-selected, .move-controls, .move-btn, etc.

### Bénéfices
- ✅ Personnalisation avancée de l'avatar
- ✅ Contrôle total sur l'apparence
- ✅ Interface intuitive et tactile
- ✅ Positions sauvegardées entre sessions
- ✅ Clavier plus ergonomique pour iPad
- ✅ Cohérence visuelle renforcée

## [2026-09-06] - Avatar personnalisable en temps réel

### Ajouté
- **Système d'avatar personnalisable**
  - Écran "Ma collection" complètement repensé
  - Avatar affiché en haut de l'écran
  - Possibilité de sélectionner les items débloqués pour les porter
  - Mise à jour en temps réel de l'avatar quand on sélectionne un item
  - Items organisés par catégorie (Habits, Accessoires, Maquillages, Pièces virtuelles)

- **Système d'équipement**
  - Un item par catégorie peut être équipé à la fois
  - Cliquer sur un item équipé le retire
  - Cliquer sur un item non équipé l'ajoute (et remplace l'ancien de la même catégorie)
  - Indication visuelle : bordure verte + "✓ Porté" pour les items équipés
  - Sauvegarde automatique dans localStorage

- **Interface visuelle**
  - Avatar représenté par une silhouette avec emoji de base
  - Items affichés en overlay sur l'avatar selon leur catégorie :
    - Accessoires : en haut (couronne, lunettes, etc.)
    - Maquillage : au centre du visage
    - Habits : au centre du corps
    - Pièces virtuelles : affichées en texte sous l'avatar
  - Cartes d'items cliquables avec preview et nom
  - Animation au survol des items
  - Items verrouillés affichés en grisé

### Modifié
- **Écran Ma collection restructuré**
  - Section avatar en haut
  - Barre de progression des items débloqués
  - Items groupés par catégorie
  - Design moderne avec cartes et grille responsive
  - Plus d'espace et meilleure lisibilité

### Technique
- Ajout de `AppState.equippedItems` pour tracker l'équipement actuel
- Nouvelles fonctions dans Storage :
  - `getEquippedItems()` : charge l'équipement depuis localStorage
  - `saveEquippedItems()` : sauvegarde l'équipement
  - `toggleEquipItem()` : équipe/déséquipe un item
- Nouvelle fonction `updateAvatarDisplay()` pour rafraîchir l'avatar
- Nouvelle fonction `toggleItemEquip()` appelée au clic sur un item
- CSS complet pour avatar-section, avatar-display, item-card, etc.

### Bénéfices
- ✅ Engagement renforcé avec système de personnalisation
- ✅ Feedback visuel immédiat quand on change l'avatar
- ✅ Motivation supplémentaire pour débloquer de nouveaux items
- ✅ Aspect ludique et créatif
- ✅ Cohérent avec l'inspiration Roblox Avatar World

## [2026-09-06] - Ajout parenthèses au clavier

### Ajouté
- **Parenthèses dans le clavier virtuel**
  - Ajout des touches ( et ) dans la ligne 3 du clavier
  - Placées entre le tiret (-) et le ç
  - Permettent d'écrire des mots avec parenthèses

### Modifié
- **Grille du clavier élargie**
  - Passage de 10 à 12 colonnes
  - Ligne 3 : u-z + ' - ( ) ç ⌫ (12 touches)
  - Barre d'espace élargie de 7 à 9 colonnes pour remplir la largeur
  - Autres lignes (10 touches) s'alignent naturellement

## [2026-09-06] - Audio amélioré en mode apprentissage

### Corrigé
- **Son coupé en mode apprentissage**
  - Fonctions audio (initAudio, playBeep) converties en async/await
  - L'AudioContext est maintenant correctement resumed avant de jouer les notes
  - Plus de problème de son muet sur iOS/Safari
  - Les notes musicales jouent bien pendant l'animation des lettres

### Ajouté
- **Lecture du mot avant l'animation**
  - Le mot est lu à voix haute (synthèse vocale) AVANT l'animation
  - Délai de 800ms entre la lecture et l'animation pour bien entendre le mot
  - Séquence complète : Clic "J'y suis" → Lecture vocale → Animation + notes musicales
  - Log console "Lecture du mot: [mot]" pour debug

### Bénéfices
- ✅ Feedback audio complet et cohérent
- ✅ L'enfant entend d'abord le mot entier (voix)
- ✅ Puis elle entend la mélodie lettre par lettre (notes)
- ✅ Mémorisation multi-sensorielle renforcée

## [2026-09-06] - Corrections affichage et ergonomie

### Corrigé
- **Affichage progrès corrigé en mode interrogation**
  - Avant : "Mot 3/25" (total sur toute la liste)
  - Maintenant : "Mot 3/10" (position dans le niveau actuel)
  - Cohérent avec le fait que chaque niveau = 10 mots
  - Plus clair et moins intimidant

- **Scroll automatique en mode apprentissage**
  - Cliquer sur "J'y suis" scroll automatiquement vers le mot animé
  - Le mot reste au centre de l'écran
  - Plus besoin de scroller manuellement sur iPad
  - Animation de scroll fluide

### Amélioré
- **Espaces plus visibles dans les mots**
  - Les espaces ont maintenant une largeur augmentée (0.8em au lieu de 0.3em)
  - Marges ajoutées de chaque côté (0.3em)
  - Les caractères autour des espaces sont mieux espacés
  - Facilite la lecture et la compréhension de la structure du mot
  - Particulièrement utile pour les mots composés ("aujourd'hui", etc.)

## [2026-09-06] - Améliorations UX interrogation

### Modifié
- **Sessions de 10 mots** (au lieu de 12)
  - Chaque niveau contient maintenant 10 mots maximum
  - Sessions plus courtes, plus adaptées à l'attention TDAH
  - Moins de fatigue cognitive

- **Score masqué pendant l'interrogation**
  - Plus d'affichage "0/1", "2/2" qui peut stresser
  - L'enfant se concentre uniquement sur le mot actuel
  - Seules les étoiles progressives restent visibles
  - Score final toujours affiché à la fin

- **Temps d'affichage des erreurs augmenté**
  - Délai passé de 2.5s à 3.5s entre deux questions
  - Laisse plus de temps pour voir les lettres incorrectes
  - Permet de mieux comprendre son erreur

- **Scroll automatique au clic sur "J'y suis"**
  - En mode interrogation, cliquer sur "J'y suis" scroll automatiquement vers le bas
  - Affiche directement le clavier et le mot à compléter
  - Plus besoin de scroller manuellement sur iPad
  - Animation de scroll fluide (smooth)

### Bénéfices
- ✅ Sessions plus digestes (10 mots vs 12)
- ✅ Moins de stress (pas de score visible)
- ✅ Meilleur apprentissage des erreurs (temps d'affichage +40%)
- ✅ Ergonomie iPad améliorée (auto-scroll)

## [2026-09-06] - Animation lettres incorrectes

### Ajouté
- **Affichage pédagogique en cas d'erreur**
  - Quand la réponse est incorrecte, affiche le mot complet avec la bonne orthographe
  - Les lettres qui n'ont PAS été trouvées correctement sont :
    - **Plus grosses** (1.4x la taille normale)
    - **En rouge vif** avec effet lumineux
    - **Animées** : apparaissent avec un effet d'agrandissement
    - Position légèrement surélevée pour plus de visibilité
  - Les lettres correctes restent normales
  - Permet de voir immédiatement où était l'erreur

### Exemple
Mot : "aujourd'hui", 2 lettres à trouver : "au"
- Si saisie : "ou" → affiche "**au**jourd'hui" (au en rouge et gros)
- Si saisie : "a" → affiche "**au**jourd'hui" (u en rouge et gros)
- Si saisie vide : "**au**jourd'hui" (au en rouge et gros)

### Animation CSS
- Classe `.letter-wrong` pour les lettres incorrectes
- Animation `letterWrong` : apparition progressive avec bounce
- Font-size 1.4em pour être bien visible
- Color rouge (#FF0000) avec text-shadow lumineux
- Position relative avec top: -2px pour sortir légèrement

### Bénéfices pédagogiques
- Feedback visuel immédiat et clair
- Permet de voir la bonne orthographe
- Met en évidence exactement où était l'erreur
- Aide à la mémorisation de la correction
- Moins frustrant : elle voit ce qu'elle aurait dû écrire

## [2026-09-06] - Corrections timer et animation

### Corrigé
- **Animation verte ne déconcentre plus**
  - L'animation est maintenant réinitialisée à chaque nouvelle question
  - La couleur revient au rose par défaut au début de chaque question
  - L'animation ne se déclenche QUE quand la réponse est correcte
  - Force un reflow CSS pour garantir la réinitialisation
  - Log console pour confirmer quand l'animation se déclenche

### Modifié
- **Timer adapté au niveau de difficulté**
  - Niveau 1 (Facile, 2 lettres) : **15 secondes** ⏰
  - Niveau 2 (Moyen, 3 lettres) : **13 secondes**
  - Niveau 3 (Difficile, 4 lettres) : **11 secondes**
  - Niveau 4+ (Expert+, 5+ lettres) : **10 secondes**
  - Plus juste : plus de lettres à trouver = moins de temps
  - Log console affiche le temps pour chaque question

### Animation
- L'animation `wordSuccess` n'affecte plus directement la couleur dans le CSS
- La couleur verte est appliquée en JavaScript seulement lors du succès
- Animation plus subtile avec effet lumineux vert
- Réinitialisation garantie entre chaque question

## [2026-09-06] - Corrections mode interrogation + collection + audio

### Corrigé
- **Notes musicales trop aiguës**
  - Gamme réduite de 4 octaves à 2 octaves
  - Note maximale : E6 à 1318 Hz (au lieu de A7 à 3520 Hz)
  - 13 notes au lieu de 20
  - Sons beaucoup plus agréables et pas stridents
  - Exemple : 's' joue maintenant ~880 Hz au lieu de 3135 Hz

- **Progression affichée incorrectement**
  - Affichage "Mot X/Y" maintenant calculé sur TOUS les mots de la session
  - Avant : affichait "1/12" puis recommençait "1/3" au niveau suivant
  - Maintenant : affiche "1/15", "2/15", ... "15/15" pour une liste de 15 mots
  - Plus clair pour comprendre combien de mots restent

### Ajouté
- **Animation quand le mot est trouvé**
  - Le mot complet s'affiche en vert
  - Animation d'agrandissement + effet lumineux
  - Feedback visuel immédiat de succès
  - Animation CSS wordSuccess

- **Écran "Ma collection"**
  - Bouton "👗 Ma collection" sur l'écran d'accueil
  - Affiche tous les objets débloqués avec icônes
  - Barre de progression : X/Y objets débloqués
  - Objets verrouillés affichés en grisé avec "???"
  - Catégories : habits, accessoires, maquillages, pièces virtuelles

### Note sur les niveaux
Les listes de plus de 12 mots sont automatiquement découpées en niveaux :
- Liste de 15 mots = Niveau 1 (12 mots) + Niveau 2 (3 mots)
- C'est normal ! L'affichage "Mot X/Y" montre maintenant le total
- À la fin du niveau 1, il y a un passage automatique au niveau 2 après 3 secondes

### À venir
- Possibilité d'ajuster le timer selon le niveau de difficulté

## [2026-09-06] - CORRECTION CRITIQUE : Erreur syntaxe lieux.js

### Corrigé (URGENT)
- **Erreur de syntaxe JavaScript dans lieux.js**
  - Problème : Les clés d'objet avec espaces n'étaient pas entre guillemets
  - Erreur : `Uncaught SyntaxError: Unexpected identifier 'de'`
  - Cause : `salle de douche: [...]` au lieu de `"salle de douche": [...]`
  - Solution : Toutes les clés avec espaces sont maintenant entre guillemets
  - ✅ Le fichier se charge maintenant correctement
  - ✅ L'objet LIEUX est maintenant défini
  - ✅ La création de listes fonctionne

### Clés corrigées
- `"salle de douche"` (au lieu de `salle de douche`)
- `"chambre des parents"` (au lieu de `chambre des parents`)
- `"salle de bain chambre"` (au lieu de `salle de bain chambre`)
- `"ta chambre"` (au lieu de `ta chambre`)
- `"chambre d'amis"` (au lieu de `chambre d'amis`)
- `"atelier de maman"` (au lieu de `atelier de maman`)
- `"bureau de papa"` (au lieu de `bureau de papa`)

### Note technique
En JavaScript, les clés d'objet contenant des espaces ou des caractères spéciaux
DOIVENT être entre guillemets. Sans guillemets, JavaScript interprète chaque mot
comme un identifiant séparé, causant une erreur de syntaxe.

## [2026-09-06] - Debug mode interrogation (blocage)

### Ajouté
- **Logs de debug complets** pour diagnostiquer le blocage
  - Logs à chaque étape de validateAnswer
  - Logs dans nextWordInInterrogation
  - Logs dans finishInterrogationLevel
  - Logs dans showInterrogationScreen
  - Logs au démarrage de l'interrogation
  - Logs de la création des niveaux randomisés

### Fichiers créés
- **DEBUG.md** : Guide complet pour diagnostiquer les problèmes
  - Comment ouvrir la console JavaScript
  - Quels logs chercher
  - Comment identifier où ça bloque
  - Liste des erreurs courantes

### Pour diagnostiquer le blocage
1. Ouvrir Safari > Développement > Afficher la console JavaScript
2. Lancer une interrogation
3. Répondre et valider
4. Observer les logs dans la console
5. Copier les logs et le dernier message avant le blocage

### Logs attendus
Au clic sur Valider :
```
validateAnswer appelé
isValidating = true
Timer arrêté
Question 1, mot: alors
setTimeout pour nextWordInInterrogation dans 2500ms
[après 2.5s]
Appel de nextWordInInterrogation
nextWordInInterrogation appelé
Index actuel: 0, total mots niveau: 10
Nouvel index: 1
showInterrogationScreen appelé
Mot à afficher: "après"
```

Si les logs s'arrêtent avant la fin, cela indique où le problème se situe.

## [2026-09-06] - Animations fluides en mode apprentissage

### Amélioré
- **Animations beaucoup plus fluides** pour le grossissement des lettres
  - Courbe d'animation élastique douce (cubic-bezier 0.34, 1.56, 0.64, 1)
  - Durée augmentée à 0.4s pour une transition plus smooth
  - Animation pulse améliorée avec étapes intermédiaires
  - Effet de "rebond" doux et naturel

- **Optimisations performances**
  - Accélération GPU forcée (backface-visibility, perspective)
  - will-change pour optimiser les transformations
  - Transform-origin centré pour un scaling parfait
  - Transitions séparées pour transform, color et text-shadow

- **Effet visuel amélioré**
  - Agrandissement à 1.6x (au lieu de 1.5x)
  - Text-shadow progressif à 3 niveaux pour effet lumineux
  - Padding augmenté pour éviter les sauts de layout
  - Gap augmenté entre les lettres (8px au lieu de 5px)

- **Accessibilité**
  - Respect de prefers-reduced-motion pour les utilisateurs sensibles
  - Animations simplifiées si demandé par le système

### Technique
- Transitions GPU-accelerated pour 60fps constant
- Animation smoothPulse en 4 étapes (0% → 30% → 60% → 100%)
- Min-height augmenté (200px) pour compenser l'agrandissement
- Overflow visible pour ne pas couper les lettres agrandies

### Résultat
✅ Animations douces et fluides  
✅ Pas de saccades  
✅ Effet élastique agréable  
✅ Performances optimales  

## [2026-09-06] - Correction bugs interrogation + audio + espaces

### Corrigé (URGENT)
- **Blocage en mode interrogation**
  - Le jeu se bloquait au clic sur Valider ou à la fin du timer
  - Problème : recalcul incorrect des niveaux dans finishInterrogationLevel
  - Solution : sauvegarde de tous les niveaux randomisés dès le début
  - AppState.allInterrogationLevels conserve l'ordre aléatoire pour toute la session
  - ✅ L'interrogation ne bloque plus !

- **Système audio amélioré** pour iOS/Safari
  - Initialisation au premier tap/click utilisateur
  - Détection et résolution de l'état 'suspended' de l'AudioContext
  - Son silencieux initial pour "débloquer" l'audio sur iOS
  - Logs de debug pour diagnostiquer les problèmes
  - Resume automatique du contexte audio à chaque note
  - ✅ Les mélodies devraient maintenant fonctionner !

### Modifié
- **Affichage des espaces en mode apprentissage**
  - Quand petits (inactifs) : espace invisible " " (naturel)
  - Quand agrandis (actifs) : symbole "␣" (visible et clair)
  - Plus logique : on voit l'espace seulement quand il est mis en valeur
  - Cohérent avec le symbole "␣" déjà utilisé pour la barre d'espace du clavier

### Technique
- AudioContext initialisé explicitement au clic sur "J'y suis"
- Vérification de l'état du contexte avant chaque note
- Gestion des erreurs avec logs console
- Min-width CSS pour que les espaces aient une largeur

### Debug
- Si le son ne fonctionne toujours pas :
  1. Ouvrir la console Safari (Développer > Afficher la console JavaScript)
  2. Vérifier les messages "AudioContext créé", "Audio débloqué"
  3. Vérifier les messages "Joue note pour 'x': XXXHz"
  4. Vérifier qu'il n'y a pas d'erreur rouge

## [2026-09-06] - Flux apprentissage → interrogation + mots aléatoires

### Ajouté
- **Écran de transition après l'apprentissage**
  - Message de félicitations avec nombre de mots appris
  - Bouton "🎯 Oui, je m'entraîne !" pour interrogation immédiate
  - Bouton "🏠 Non, retour à l'accueil" pour revenir plus tard
  - Encourage à pratiquer juste après avoir appris

- **Interrogation ciblée après apprentissage**
  - L'interrogation porte uniquement sur les mots qui viennent d'être appris
  - Renforce immédiatement la mémorisation
  - Mots présentés dans un ordre aléatoire

- **Interrogation complète (accès direct)**
  - Si on clique sur "S'entraîner" depuis la liste sans apprentissage préalable
  - L'interrogation porte sur TOUS les mots de la liste
  - Mots présentés dans un ordre aléatoire

### Modifié
- **Ordre des mots randomisé en mode interrogation**
  - Algorithme Fisher-Yates pour un mélange équitable
  - Empêche l'apprentissage par cœur de l'ordre
  - Force la vraie mémorisation des mots

### Technique
- Fonction `shuffleArray()` pour randomisation
- État `AppState.lastLearnedWords` pour tracer les mots appris
- Distinction entre interrogation post-apprentissage et interrogation directe
- Réinitialisation automatique de `lastLearnedWords` après interrogation

### Bénéfices pédagogiques
- **Révision immédiate** : renforce la mémorisation à court terme
- **Ordre aléatoire** : force la vraie reconnaissance du mot (pas juste l'ordre)
- **Flexibilité** : peut choisir de s'entraîner immédiatement ou plus tard
- **Ciblage** : peut réviser juste les mots vus ou tous les mots de la liste
- **Motivation** : écran de félicitations encourage à continuer

## [2026-09-06] - Amélioration ergonomie du clavier

### Modifié
- **Barre d'espace plus large** (comme sur un vrai clavier)
  - Occupe 7 colonnes au lieu de 1
  - Texte "espace" pour clarté
  - Couleur grise distinguable des autres touches

- **Bouton "Valider" repositionné à droite du clavier**
  - Plus gros et plus visible
  - Position ergonomique (comme la touche Entrée d'un clavier)
  - Prend toute la hauteur du clavier
  - Texte sur deux lignes : "✓" puis "Valider"
  - Facile à atteindre avec le pouce droit sur iPad

- **Layout du clavier optimisé**
  - Clavier principal dans un conteneur flex
  - Bouton Valider en colonne à droite (desktop/tablette)
  - Sur mobile : bouton Valider en bas (pleine largeur)
  - Lettres ç déplacée en ligne 3 pour équilibrer

### Bénéfices UX
- Barre d'espace beaucoup plus facile à toucher (comme sur un vrai clavier)
- Bouton Valider toujours accessible du pouce sans déplacer la main
- Layout plus intuitif et ergonomique
- Moins d'erreurs de frappe

## [2026-09-06] - Feux d'artifice pour score parfait

### Ajouté
- **Animation de feux d'artifice** quand elle atteint 5 étoiles (score 10/10) !
  - Explosion de feux d'artifice multicolores à l'écran
  - Message "🎉 PARFAIT ! 🎉" au centre
  - 5 vagues successives de feux d'artifice
  - Couleurs vives : or, rose, turquoise, violet
  - Particules qui explosent dans toutes les directions
  - Animation de 3 secondes puis disparaît automatiquement

### Technique
- 8-12 feux d'artifice par vague
- 12 particules par feu d'artifice
- Couleurs avec effet de lueur (box-shadow)
- Positions aléatoires pour un effet naturel
- Animation CSS fluide (ease-out)

### Bénéfices
- Célébration spectaculaire du score parfait
- Renforce la satisfaction et la motivation
- Feedback visuel très positif pour encourager la réussite
- Effet "wow" mémorable

## [2026-09-06] - Amélioration affichage des lieux et espaces

### Modifié
- **Noms des lieux** : Ajout de déterminants pour des noms plus agréables et naturels
  - "chambre_parents" → "chambre des parents"
  - "sa_chambre" → "ta chambre"
  - Tous les emplacements avec déterminants appropriés (sur le, devant la, dans ton, etc.)

- **Affichage des lieux** :
  - Les underscores sont remplacés par des espaces dans l'affichage
  - "salle_de_douche" s'affiche comme "salle de douche"
  - Plus naturel et plus facile à lire

- **Espaces dans les mots** :
  - Affichés comme "␣" (symbole espace) quand le mot est au repos
  - Deviennent "_" (underscore) SEULEMENT quand ils sont agrandis (actifs)
  - Permet de voir clairement la structure du mot pendant l'animation
  - Exemple : "aujourd'␣hui" → au grossissement de l'espace → "aujourd'_hui"

### Détails des lieux mis à jour
- Salon : "sur le canapé", "sur la table à manger", "dans la cuisine", "devant la télé"
- Couloir : "devant la porte de **ta** chambre", "devant la porte de la chambre **de tes parents**"
- Ta chambre : "sur **ta** chaise de bureau", "devant **ta** coiffeuse", "sous **ton** lit"
- Chambre des parents : "sur la place de **ta** maman", "sur la place de **ton** papa"
- Bureau de papa : "**assise** sur le tapis de gym" (accord grammatical)
- Et tous les autres lieux avec déterminants appropriés

### Bénéfices
- Noms plus naturels et personnalisés ("ta chambre" au lieu de "sa chambre")
- Meilleure lisibilité des lieux affichés
- Espaces clairement visibles pendant l'animation
- Cohérence entre l'affichage et la langue parlée

## [2026-09-06] - Feedback visuel de validation (interrogation)

### Amélioré
- **Bouton "Valider"** : Feedback visuel clair après le clic
  - Le bouton change immédiatement en "⏳ Validation..."
  - Le bouton est désactivé (devient gris) pendant la validation
  - Impossible de cliquer plusieurs fois sur Valider

- **Clavier virtuel** : Désactivé pendant la transition
  - Toutes les touches deviennent grisées et non cliquables
  - Empêche de continuer à taper pendant le feedback
  - Se réactive automatiquement à la question suivante

- **Feedback amélioré** :
  - Animation d'apparition plus dynamique (rotation + scale)
  - Ombre portée plus marquée pour mieux se détacher
  - Padding augmenté pour plus d'impact visuel
  - Icône ✨ animée sur les réussites (rotation + pulsation)

- **Timing** : Délai passé de 2s à 2.5s pour laisser le temps de lire le feedback

### Corrigé
- **Validations multiples** : Impossible de valider plusieurs fois la même réponse
- **État du bouton** : Le texte du bouton est correctement restauré à chaque nouvelle question

### Bénéfices UX
- Plus de confusion sur ce qui se passe après avoir cliqué sur Valider
- Feedback immédiat et clair (bouton + clavier désactivés)
- Transition fluide entre les questions
- L'enfant sait exactement quand elle peut interagir ou non

## [2026-09-06] - Mélodie musicale et couleurs contrastées

### Amélioré
- **Couleurs plus contrastées** :
  - Lettres inactives : gris clair (#B0B0B0) au lieu de violet pâle
  - Lettres actives : rose vif (#FF1493 - DeepPink) avec ombre lumineuse intense
  - Beaucoup plus visible et percutant !

- **Mélodie unique par mot** :
  - Chaque lettre joue une note musicale différente
  - Algorithme basé sur la gamme pentatonique majeure (Do, Ré, Mi, Sol, La)
  - 20 notes sur 4 octaves (C4 à A7) pour couvrir tous les caractères
  - Mapping déterministe : même lettre = même note à chaque fois
  - Son doux et agréable (type 'sine' avec enveloppe ADSR)
  - Chaque mot crée sa propre mélodie !

- **Espaces visibles** :
  - Les espaces sont affichés comme "_" quand ils sont agrandis
  - Permet de voir clairement la structure du mot (ex: "aujourd'_hui")

### Technique
- **Gamme pentatonique** : notes qui sonnent toujours bien ensemble, jamais de dissonance
- **Enveloppe ADSR** : Attack, Decay, Sustain, Release pour un son musical
- **Durée de note** : 400ms par note (adapté au rythme d'apprentissage)
- **Caractères supportés** : a-z, lettres accentuées, apostrophe, tiret, espace

### Bénéfices pédagogiques
- Association audio-visuelle forte (couleur vive + note unique)
- Mémorisation multi-sensorielle : chaque mot a sa "chanson"
- Sons agréables et musicaux (pas de bip strident)
- L'enfant peut "chanter" le mot dans sa tête en se rappelant la mélodie
- Renforce l'encodage mnémotechnique

## [2026-09-06] - Corrections mode interrogation

### Ajouté
- **Bouton "J'y suis"** dans le mode interrogation
  - Même principe que le mode apprentissage
  - L'enfant se déplace physiquement vers l'endroit
  - Clique sur "J'y suis !" quand elle est à l'emplacement
  - Seulement après, la question s'affiche avec le timer

### Corrigé
- **Problème du bouton Valider** : réinitialisation correcte de l'état entre les questions
- **Timer qui continue** : tous les timers sont maintenant arrêtés quand on change d'écran
- **Synthèse vocale** : annulée automatiquement lors du changement d'écran
- **Réinitialisation de la saisie** : l'input est bien vidé entre chaque question
- **Barre de timer** : réinitialisée à 100% au début de chaque question

### Amélioré
- **Affichage de la progression** : "Mot X/Y" en haut de l'écran d'interrogation
- **Nettoyage du feedback** : le message précédent disparaît avant la question suivante
- **Gestion de l'état** : meilleure isolation entre les écrans et les questions

### Bénéfices
- Cohérence entre apprentissage et interrogation (déplacement physique dans les deux)
- Plus de bugs de timer qui tourne en arrière-plan
- Expérience plus fluide et prévisible
- Pas de confusion entre les questions

## [2026-09-06] - Amélioration animation apprentissage

### Corrigé
- **Animation du mot** : Vitesse constante entre chaque lettre
  - Correction du bug d'accélération progressive
  - Utilisation de setTimeout au lieu de setInterval pour un timing précis

### Modifié
- **Vitesse par défaut** : 1.5 seconde par lettre (au lieu de 1.0s)
- **Plage de vitesse** : 0.5s à 2.0s (au lieu de 0.5s à 1.25s)
- **Step du curseur** : 0.1s (au lieu de 0.05s) pour des paliers plus clairs
- **Comportement des lettres** :
  - Les lettres restent **grandes et colorées** après leur animation
  - Seul le bouton **"Rejouer"** réinitialise toutes les lettres à leur taille/couleur d'origine
  - Permet de voir le mot complet agrandi à la fin de l'animation

### Bénéfices pédagogiques
- Vitesse par défaut plus adaptée (moins rapide)
- Le mot reste visible en grand après l'animation (meilleure mémorisation visuelle)
- Timing constant et prévisible (important pour le TDAH)

## [2026-09-06] - Difficulté progressive en interrogation

### Modifié
- **Mode interrogation** : Progression de difficulté par niveau
  - Niveau 1 (Facile) : 2 lettres consécutives à trouver
  - Niveau 2 (Moyen) : 3 lettres à trouver
  - Niveau 3 (Difficile) : 4 lettres à trouver
  - Et ainsi de suite jusqu'à devoir trouver tout le mot
  - Les lettres visibles aident à retrouver les lettres manquantes
  - Position aléatoire des lettres à trouver dans le mot

- **Clavier virtuel étendu** :
  - Toutes les lettres accentuées : à, â, é, è, ê, ë, î, ï, ô, ù, û, ü, ÿ
  - Caractères spéciaux : apostrophe ('), tiret (-), espace (␣)
  - Cédille : ç
  - Layout optimisé sur 5 lignes
  - Bouton "Valider" élargi pour faciliter le tap

### Amélioré
- Affichage de la difficulté et du nombre de lettres à trouver
- Labels des niveaux : Facile, Moyen, Difficile, Expert, Maître
- Feedback affiche les lettres attendues ET le mot complet
- Limitation automatique de la saisie au nombre de lettres manquantes

### Bénéfices pédagogiques
- Commence vraiment facile (2 lettres seulement)
- Progression naturelle de la difficulté
- L'enfant voit une partie du mot → aide contextuelle
- Moins de frustration au début
- Tous les caractères français disponibles

## [2026-09-06] - Animation rythmique du mot

### Modifié
- **Nouvelle méthode d'apprentissage** : Animation rythmique et visuelle
  - Le mot complet s'affiche
  - Chaque lettre s'agrandit et change de couleur une par une
  - Son synchronisé à chaque lettre (bip toutes les X secondes)
  - Bouton "Rejouer" (icône flèche qui tourne) pour relancer l'animation
  - Curseur de vitesse ajustable : 0.5s à 1.25s par lettre
  - Marqueurs : Rapide - Normal - Lent

### Amélioré
- **Apprentissage multi-sensoriel** :
  - Visuel : agrandissement + couleur vive (#FFB6D9) de la lettre active
  - Auditif : son synchronisé avec chaque lettre
  - Rythmique : tempo constant et ajustable
- **Contrôle total** : l'enfant peut ajuster la vitesse et rejouer autant de fois que nécessaire

### Bénéfices pédagogiques
- Apprentissage rythmique et musical (important pour la mémorisation)
- Décomposition claire du mot lettre par lettre
- Synchronisation audio-visuelle renforce l'encodage
- Plus adapté au TDAH : stimulation visuelle/auditive sans interaction complexe
- Vitesse ajustable selon le niveau de confort

## [2026-09-06] - Amélioration mode apprentissage (déplacement physique)

### Modifié
- **Mode apprentissage** : Flux progressif avec étapes claires
  - Affichage du lieu d'abord
  - Bouton "J'y suis !" pour indiquer qu'elle s'est déplacée physiquement
  - Le mot s'affiche seulement après avoir cliqué sur "J'y suis"
  - Bouton "Suivant" pour passer au mot suivant à son rythme
  - Affichage de la progression (Mot X/Y) en haut de l'écran

### Bénéfices pédagogiques
- Permet à l'enfant de se déplacer PHYSIQUEMENT dans la maison avant de voir le mot
- Renforce l'ancrage spatial corporel (méthode des lieux)
- Plus de contrôle sur le rythme d'apprentissage
- Moins de pression, plus adapté au TDAH

## [2026-09-06] - Version initiale

### Fonctionnalités
- Interface complète style Roblox Avatar World
- Palais mental avec 40+ emplacements de la maison
- Mode apprentissage avec tracé tactile
- Mode interrogation avec dictée vocale
- Système de déblocages (récompenses)
- Suivi des mots maîtrisés vs. à travailler
- PWA pour ajout à l'écran d'accueil iOS
- Optimisé pour iPad tactile
