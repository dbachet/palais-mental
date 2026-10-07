# 🏰 Mental Palace

Application web pour aider les enfants (notamment avec TDAH et dysorthographie) à mémoriser les mots invariables via la **méthode des lieux** (palais mental).

## 🚀 Lancement de l'application

### En ligne, avec comptes (recommandé)

Hébergée sur GitHub Pages, l'app s'ouvre sans le Mac, fonctionne hors-ligne, et la ville de chaque enfant est enregistré dans son compte (connexion par code reçu par email). Mise en place pas à pas, et déménagement des données existantes : **[EN-LIGNE.md](EN-LIGNE.md)**.

### Sur Mac (serveur local)

1. Ouvrez un terminal
2. Naviguez vers le dossier de l'application :
   ```bash
   cd /chemin/vers/palais-mental
   ```
3. Lancez un serveur HTTP simple :
   ```bash
   python3 -m http.server 8000
   ```
4. Notez l'adresse IP locale de votre Mac :
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Exemple : `192.168.1.10`

### Sur iPad Safari

1. Assurez-vous que l'iPad et le Mac sont sur le **même réseau WiFi**
2. Ouvrez Safari sur l'iPad
3. Tapez l'adresse : `http://[IP_DU_MAC]:8000`
   Exemple : `http://192.168.1.10:8000`
4. Pour ajouter à l'écran d'accueil :
   - Appuyez sur l'icône "Partager" (carré avec flèche)
   - Sélectionnez "Sur l'écran d'accueil"
   - L'application se lancera en plein écran comme une vraie app !

## 📁 Structure des fichiers

```
palais-mental/
├── index.html          # Page principale (tous les écrans)
├── manifest.json       # Config PWA (écran d'accueil)
├── sw.js               # Service worker (mode offline)
├── README.md           # Ce fichier
├── css/
│   └── style.css       # Tous les styles (tokens de couleur dans :root)
├── js/
│   ├── app.js          # Logique principale
│   ├── monde.js        # La ville : lieux, rangement des éléments sur les objets, carte, migration
│   ├── scene.js        # Les étages : décor, objets, déco, kawaii ; mode calme et mode libre (🧸 Jouer)
│   ├── objets.js       # Objets des lieux dessinés par le code (SVG, sans image)
│   ├── recompenses.js  # Défis du jour, album de stickers, temps de jeu du jour
│   ├── revision.js     # Listes de révision : lecture du texte, éditeur, Apprendre et Se rappeler
│   ├── images.js       # Images des leçons (IndexedDB, réduites à 1600 px)
│   ├── maisons.js      # Créer ta maison : Mes maisons, construire, aménager
│   ├── jeux-cartes.js  # QCM, paires et réponse à écrire (questions de révision, mots de langue)
│   ├── arcade.js       # Salle de jeux : serpent, blocs (tetris), bonbons (match-3)
│   ├── config.js       # Adresse et clé publique Supabase (vide = app 100 % locale)
│   ├── sync.js         # Compte et enregistrement en ligne (fusion, hors-ligne)
│   └── kawaii.js       # Moteur de dessin des personnages kawaii (SVG, sans image)
└── data/
    ├── lieux.js        # Économie, temps, révision, images, langues, catalogue de stickers
    └── monde.js        # BATIMENTS : étages, décor et objets de chaque bâtiment ; QUARTIERS ; MODELES de maisons
```

## 🐾 Kawaii : principal et compagnons

Pas d'avatar humain : l'enfant choisit un **kawaii principal** parmi 16 personnages (animaux, objets, aliments) et le personnalise dans l'atelier. Personnages, expressions et couleur naturelle sont libres ; pelages pastel, chapeaux, lunettes et tenues se débloquent en boutique ou dans les coffres. Un **compagnon** se débloque à chaque liste qui atteint le niveau Ninja, jusqu'à cinq. Toute l'équipe s'affiche sur l'accueil ; « Mes kawaii » permet de modifier chacun et de choisir qui est le principal, à tout moment.

Ajouter un personnage = ajouter une entrée dans `CHARS` et sa forme dans `shapes()` de `js/kawaii.js`.

## 🎨 Récompenses : étoiles, coffres, stickers, meubles

Chaque **niveau gagné** sur une liste offre un meuble, de préférence un qu'elle n'a pas encore. L'album a une page « Mes meubles » : ceux trouvés en couleur, les autres en silhouette.

Aucune image à gérer : les récompenses sont des **stickers** (emojis, ou kawaii dessinés par le code, plus chers) et des **meubles** (les formes de `js/objets.js`) que l'enfant pose où elle veut dans les étages de ses lieux, et des **habits et accessoires** pour ses kawaii. Stickers et meubles ne servent qu'à décorer : ils ne portent jamais de mot ni de question. Tout se règle dans `data/lieux.js` :

- `ECONOMIE` : étoiles par bonne réponse, bonus sans-faute, étoiles par coffre, prix par rareté (commun, rare, légendaire, kawaii), prix des habits et accessoires, contenu des coffres (`chanceAccessoireCoffre`, `chanceMeubleCoffre`), prix des meubles (`prixMeubles`), kit de 12 meubles offert au départ (`kitDepart`), déco max par étage (`maxDecoParScene`, 20).
- `STICKERS` : le catalogue. Un sticker emoji = `{ id, nom, emoji, rarete }`. Un sticker kawaii = `{ id, nom, rarete: "kawaii", k: { char, fur, face, hat, glasses, outfit, outfitColor } }` (les champs de `k` absents prennent la valeur de base).

Boucle de jeu :
1. Chaque bonne réponse donne des étoiles, d'autant plus que le niveau de la liste est élevé (1 ⭐ au niveau 1, 2 ⭐ au niveau 2...). Le compteur s'anime pendant la session.
2. Tous les 12 étoiles gagnées, un **coffre** apparaît sur l'accueil : l'enfant tape dessus pour l'ouvrir et découvre un sticker (rareté aléatoire), un meuble ou un accessoire. Un niveau sans faute donne un coffre rare garanti. Les coffres s'ouvrent aussi en fin de paquet et en fin d'Apprendre.
3. Les étoiles se dépensent aussi dans la **Boutique** pour choisir un sticker, un meuble ou un habit précis, et pour acheter du temps de jeu.
4. **🧸 Jouer dans un lieu** : dans chaque étage, l'enfant pose ses meubles et ses stickers où elle veut (20 au plus), les déplace au doigt, et les retire d'un appui long (ils reviennent dans l'inventaire).
5. **Mon album** montre tout le catalogue : les stickers trouvés en couleur, les autres en silhouette. Des cadeaux (étoiles, coffres) se récupèrent à chaque palier de stickers différents. Les coffres donnent le plus souvent un sticker qui manque encore.
6. Les **défis du jour** : trois petits défis, quelques étoiles chacun, un coffre pour les trois. Pas de série à tenir : on ne perd jamais rien en ne jouant pas, et le compteur de jours de jeu ne fait que monter.

7. La **salle de jeux** : un bâtiment de la ville, avec une borne par jeu (serpent, blocs, bonbons). Chaque jeu se débloque une fois avec des étoiles, puis on y joue sur le temps de jeu du jour. Les jeux ne rapportent rien : les étoiles se gagnent en apprenant. Chaque partie se termine d'elle-même ; le record est gardé.
8. Le **temps de jeu du jour** : 5 minutes offertes chaque jour pour jouer dans les lieux (se promener, décorer) et dans la salle de jeux, puis 5 minutes de plus pour 5 ⭐, jusqu'à 20 minutes par jour. Apprendre, s'entraîner, l'atelier, les coffres et la boutique ne le consomment pas. Le temps ne compte que l'app à l'écran, et pas après une minute sans toucher l'écran. Quand il est fini, retour à la ville avec un message doux ; une partie commencée se termine normalement.

Réglages : `ALBUM` (paliers et cadeaux), `DEFIS` (défis, étoiles, coffre), `ARCADE` (jeux, prix de déblocage), `TEMPS_JEU` (minutes offertes, prix et durée d'un achat, plafond par jour) et `ECONOMIE.chanceNouveauSticker` dans `data/lieux.js`.

## 🎯 Fonctionnalités

### ✅ Implémenté

- **Gestion des listes** : créer, éditer, supprimer des listes de mots ; barre de maîtrise et badge « liste dorée » quand tous les mots sont acquis
- **La ville** (accueil) : chaque liste est un bâtiment de la carte (voir plus bas)
- **Mode apprentissage** : « Apprendre » avec animation rythmique
  - Elle choisit l'objet dans la pièce, puis le mot s'affiche seul
  - Animation lettre par lettre avec agrandissement et changement de couleur
  - Son synchronisé à chaque lettre, bouton Rejouer, curseur de vitesse (sauvegardé)
- **Mode interrogation** : « S'entraîner » avec dictée et clavier virtuel
  - Mot affiché en **cases de lettres** : lettres visibles, cases à trouver, saisie en rose, vert si juste, rouge si faux
  - **Niveau mémorisé par liste** : niveau 1 = 2 lettres à trouver, +1 lettre par niveau. Une session réussie à 80 % fait monter d'un niveau, et ça ne redescend jamais. Dernier niveau **Ninja** : mot entier plus une ou deux cases pièges, pour ne pas connaître le nombre de lettres. **Interrogation complète = niveau Ninja** : réussie à 80 %, la liste passe directement Ninja (et débloque un compagnon) sans passer tous les niveaux
  - Ordre aléatoire des mots, timer qui passe à l'orange quand il reste peu de temps. Temps = 30 s + 5 s par lettre à trouver, réglable via `TEMPS` dans `data/lieux.js`
  - Clavier en rangées : lettres, signes (' - ( )), **accents toujours visibles**, espace large, Valider à droite
  - Barre d'avancement de la session (une case par mot) + compteur d'étoiles gagnées
  - Feux d'artifice pour un sans-faute
- **Récompenses** : étoiles, coffres à ouvrir, boutique, stickers à coller sur les lieux (voir plus haut)
- **Mélanger plusieurs listes** (Mes listes → 🔀) : on coche 2 listes de mots ou plus, puis Apprendre, S'entraîner ou Interrogation complète sur tous leurs mots, tirés au hasard parmi toutes les listes cochées
  - Chaque mot garde son objet, le niveau de sa liste et sa progression ; chaque liste passe son niveau sur ses propres mots (80 %)
  - Les listes cochées sont retenues pour la fois suivante
- **Mots de langue** (anglais, espagnol, allemand…) : une ligne par mot, `mot = traduction`, avec la langue montrée et la langue à écrire (⇄ inverse les deux, mots compris)
  - Même jeu que les mots à réécrire (objets, niveaux, Ninja, mélange) : on voit et on entend le mot de départ, on écrit la traduction en cases de lettres
  - À la visite, le mot de départ est dit dans sa langue puis la traduction dans la sienne. En interrogation, seul le mot de départ est dit
  - Langues et voix : `LANGUES` dans `data/lieux.js`
- **Révision** : des questions et des leçons dans une même liste, dans l'ordre du texte. Le texte se découpe en blocs séparés par une ligne vide :
  - `# Titre` commence une **leçon** (le titre, puis son texte)
  - un bloc dont chaque ligne est `question = réponse` (ou `question | réponse`) donne une **question** par ligne : uniquement des faits à réponse unique et courte
  - tout autre bloc est une leçon sans titre ; `[📷 n]` place une **image** (dans une leçon, ou seule dans son bloc). « 📷 » dans l'aperçu ajoute ou change l'image d'une leçon, « 🖼️ Ajouter un bloc image » en ajoute une seule
  - Corriger le texte garde l'objet, la progression et l'image de chaque élément reconnu
  - **📖 Apprendre** : dans la pièce, elle choisit un objet ; la question et sa réponse, ou la leçon entière (image en grand d'un appui, « 🔊 Lire » phrase par phrase), s'affichent seules. Un paquet par étage
  - **🧠 Se rappeler** : elle choisit un objet. Question : « Voir la réponse », puis « Je savais » ou « À revoir ». Leçon : un indice selon le niveau (niveau 1 : le titre et les 5 premiers mots ; niveau 2 : le titre ; Ninja : rien), puis « Voir le cours », puis « Presque rien », « Une partie » ou « L'essentiel » (0, ½ ou 1 point). 80 % des points font monter d'un niveau, sans jamais redescendre ; tout maîtrisé = Ninja aussi
  - Boîtes : maîtrisé petit à petit ; moins que tout = **à retravailler** (dans « Mots à travailler », avec « Me rappeler ces éléments »)
  - On gagne des étoiles pour la session terminée, pas pour les bonnes réponses (réglages : `CARTES` et `REVISION` dans `data/lieux.js`)
  - Trois jeux corrigés par l'app, sur les questions seulement, où chaque bonne réponse du premier coup rapporte des étoiles : **QCM** (mauvaises réponses tirées des autres questions), **Paires** (relier question et réponse), **Écrire la réponse** (réponses courtes ; accents et majuscules ne comptent pas). Un jeu n'est proposé que si la liste s'y prête
  - Le QCM ne monte pas une question plus haut que « ça vient » et les paires ne changent aucune boîte
  - QCM et paires existent aussi pour les mots de langue, comme échauffement (sans effet sur le niveau)
- **Espace parents** : sauvegarde de toutes les données dans un fichier, images des leçons comprises, et restauration (entrée protégée par un calcul)
- **Mots à travailler** : les mots en difficulté et les éléments de révision à retravailler, par liste, avec un bouton pour s'entraîner dessus uniquement
- **Design** : tokens de couleur, une action héro par écran, contrastes renforcés pour la lecture, mouvement calme pendant la tâche
- **Responsive** : optimisé pour iPad, fonctionne sur téléphone
- **PWA** : ajout à l'écran d'accueil iOS, mode offline

### 🚧 À implémenter plus tard

- **Scanner OCR** : Scan photo avec Tesseract.js (saisie manuelle dispo)
- **Mode rythmique** : Jeu basé sur les syllabes (TODO commenté dans le code)
- **Vérification d'images** : Détection automatique des images disponibles

## 🏙️ La ville : lieux, étages et objets

L'accueil est la carte d'une petite ville. **Une liste = un lieu**, **un élément de la liste (mot, question, leçon) = un objet** de ce lieu.

- À la création d'une liste, on choisit son bâtiment parmi six : boulangerie, salon de coiffure, château, musée, labo, école. D'autres s'ouvrent avec les **quartiers** (voir plus bas). On peut en changer plus tard (édition de la liste) : tous les éléments sont alors rangés sur de nouveaux objets.
- Chaque bâtiment a **6 étages de 12 objets** (72 emplacements). Un étage n'est ouvert que si la liste en a besoin : les 12 premiers éléments vont au premier étage, etc. Au-delà de 72, plusieurs éléments partagent un objet.
- Le **rangement est stable** : un élément garde son objet. En modifiant la liste, seuls les nouveaux éléments sont rangés. Mots : au hasard dans le premier étage qui a de la place. Révision : dans l'ordre du texte, pour qu'un élément reste voisin de ceux qui l'entourent.
- Les objets sont **dessinés par le code** (`js/objets.js`, une centaine de formes) : silhouette grise tant que l'élément n'est pas maîtrisé, en couleur avec un petit visage ensuite (sur la carte et en mode libre). Pendant Apprendre et S'entraîner, seuls les objets qu'elle peut toucher sont en couleur ; le reste de la pièce est gris pâle. Les emojis et les stickers ne servent que de décor.
- Un appui sur un bâtiment ouvre sa liste et ses modes de jeu ; le **+** crée une nouvelle liste. La **salle de jeux** a aussi son bâtiment.
- **Apprendre et S'entraîner** se passent dans l'étage, en **mode calme** : la pièce, les objets du paquet en cours (10 mots) et le kawaii. **L'enfant choisit elle-même l'objet** : le kawaii y marche, puis la pièce disparaît et on ne voit plus que le mot (qui s'anime, ou à écrire) ; « ← Retour à la pièce » pour en choisir un autre. En Apprendre, on peut revoir un objet autant qu'on veut (✓ = déjà vu ; « J'ai tout vu » quand tout est vu). En S'entraîner, un objet fait est marqué (✓ ou ↺) et ne se touche plus ; le paquet se termine quand tous sont faits. Si le paquet est rangé dans plusieurs étages (ou lieux, dans un mélange), des boutons permettent de passer de l'un à l'autre. Les objets hors du paquet et les déco sont estompés.
- **🧸 Jouer dans ce lieu** (fiche d'un bâtiment), en **mode libre** : on passe d'étage en étage, on déplace les objets d'apprentissage (marqués ⭐ ; le mot suit son objet), son kawaii et ses déco, et on pose meubles et stickers depuis le tiroir « 🎒 Décorer ». « Remettre les objets » rend leur place de départ aux objets de l'étage. Ce mode consomme le temps de jeu du jour.

- **Quartiers** : les étoiles gagnées depuis le début (`totalEarned`) agrandissent la ville. À 150 ⭐, le quartier des spectacles ouvre le **Théâtre** ; à 400 ⭐, la campagne ouvre la **Ferme**. Chaque quartier ouvert ajoute son morceau de carte en bas de la ville, et il est fêté une fois. Un bâtiment pas encore ouvert est grisé dans le choix du lieu, avec les étoiles qu'il faut. Réglages : `QUARTIERS` dans `data/monde.js`.
- **Liste Ninja** : son lieu devient doré et scintille sur la carte, et un compagnon de l'équipe s'y installe (le 1er compagnon dans la 1re liste Ninja, etc.). On le voit à côté du bâtiment et dans ses étages.
- **Bac à sable** : en mode libre, toute l'équipe kawaii est dans la pièce. On la déplace au doigt ; un appui long sur un kawaii ouvre son habillage (chapeaux, lunettes, tenues et couleurs qu'elle possède déjà ; les achats se font à l'atelier).

- **Créer ta maison** (🏡 Mes maisons, ou « Construire ma maison » dans le choix du lieu) : elle choisit un modèle (cabane, maison de ville, chalet, villa, petit château, maison dans les arbres ; 1 à 3 étages) et lui donne un nom, puis l'**aménage** avec les meubles de son inventaire : choisir un meuble, taper dans la pièce, le faire glisser, appui long pour le retirer. 12 meubles au plus par étage. Aménager ne consomme pas de temps de jeu ; les stickers et l'équipe s'y ajoutent en jouant (🧸), comme ailleurs.
  - Une maison accueille une liste à la fois (les maisons prises sont grisées dans le choix du lieu). Chaque meuble posé porte un élément, dans le même ordre stable que les bâtiments. S'il manque des meubles, un bandeau dit « Il manque N objets » avec « Ajouter des meubles », et en attendant certains meubles portent plusieurs éléments ; dès qu'un meuble arrive, ils se répartissent. Retirer un meuble range ce qu'il portait sur un autre.
  - Une maison ne se démolit que si aucune liste ne l'habite ; ses meubles et ses stickers reviennent dans l'inventaire.

Ajouter un bâtiment = ajouter une entrée dans `BATIMENTS` (`data/monde.js`) : 6 étages, chacun avec son décor, ses supports (comptoir, étagère, table, socle) et 12 objets de `js/objets.js` composés à la main, chacun à sa place de départ, sans réutiliser une forme dans le même étage. Ajouter un objet = ajouter une forme dans `FORMES` (`js/objets.js`).

Le hasard du rangement est tiré de l'id de la liste : deux appareils qui rangent la même liste obtiennent les mêmes objets.

## 🎨 Direction artistique

- **Inspiration** : Roblox "Avatar World" (mode, dressing, maquillage)
- **Couleurs** : Pastel vives (rose, violet, turquoise)
- **Style** : "Cute", animations fluides, pas de brutalité
- **Police** : Nunito (ronde et douce)
- **Boutons** : Minimum 44px pour le tactile

## 🧠 Méthode des lieux

Chaque mot est associé à un **objet précis** d'un lieu de la ville. L'enfant :

1. **Regarde l'objet** où le mot est rangé (son nom, son étage, son bâtiment)
2. **Observe l'animation rythmique** du mot (lettre par lettre, son + agrandissement)
3. **Ajuste la vitesse** et **rejoue** autant de fois que nécessaire
4. **Se remémore** le mot en revoyant l'objet lors de l'entraînement

### Flux pédagogique recommandé

**Apprentissage → Interrogation immédiate** (recommandé pour renforcer la mémorisation)
1. Choisir "Apprendre" sur une liste
2. Voir chaque objet et le mot qui y est rangé
3. À la fin : écran "Bravo ! Tu as appris X mots"
4. Cliquer sur "🎯 Oui, je m'entraîne !"
5. Interrogation sur les mots qui viennent d'être appris (ordre aléatoire)

**OU Interrogation directe** (révision de tous les mots)
1. Choisir "S'entraîner" directement sur une liste
2. Interrogation sur TOUS les mots de la liste (ordre aléatoire)
3. Utile pour réviser une liste complète apprise précédemment

### Apprentissage multi-sensoriel

- **Spatial** : chaque mot a sa place sur un objet, dans un étage, dans un bâtiment
- **Visuel** : le mot s'affiche en gris, il est lu à voix haute, puis chaque lettre s'anime (agrandissement + couleur rose vif très contrastée)
- **Auditif** : la voix lit le mot (puis sa traduction pour les langues étrangères) avant que les lettres s'animent, en silence
- **Rythmique** : Tempo constant et ajustable (0.5s à 2.0s par lettre)

## 💾 Données

Toutes les données sont stockées en **localStorage** :

- `wordLists` : Listes, niveaux, progression, éléments de révision (`cards`) et numéros de leurs images (`images`), lieu (`lieu`), rangement des éléments sur les objets (`places`), place des objets dans l'étage si elle les a déplacés (`positions`) et place sur la carte (`parcelle`)
- `economy` : Étoiles, stickers et meubles possédés (`inventory`, `meubles`), déco posées (`placed` : par étage, avec leur position), garde-robe, cadeaux de l'album récupérés, défis du jour, jours de jeu, jeux débloqués et records, temps de jeu du jour (`tempsJeu`), parcelle de la salle de jeux (`salleJeux`), quartiers déjà fêtés (`quartiersVus`)
- `kawaiiTeam` : Kawaii principal et compagnons
- `maisons` : maisons construites, avec leurs meubles posés (`objets` : forme, étage, position)
- `sauvegardeAvantMonde` : copie, faite une seule fois, des données d'avant la ville (reste sur l'appareil)

Les **images des leçons** sont dans IndexedDB (base `mp-images`), pas dans le localStorage. Elles sont incluses dans le fichier de sauvegarde (format 2), mais ne passent pas en ligne : sur un autre appareil, la leçon s'affiche sans son image.

Avec un compte (espace parents), ces clés (sauf `sauvegardeAvantMonde`), plus `mixSelection` et `animationSpeed`, sont recopiées en ligne et suivent l'enfant d'un appareil à l'autre : voir [EN-LIGNE.md](EN-LIGNE.md). Pour qu'une nouvelle clé suive aussi, l'ajouter à `SYNC_KEYS` dans `js/sync.js`.

⚠️ **Attention** : sans compte, effacer les données du navigateur supprime tout le progrès ! (Espace parents → sauvegarde dans un fichier.)

## 🎵 Sons

- **Synthèse vocale** : lecture des mots en Apprendre et dictée en S'entraîner (Web Speech API, dans la langue de la liste)
- Petits sons doux dans les jeux et les récompenses (Web Audio)

## 🚢 Publier une nouvelle version

Sur une adresse `http://IP:port`, Safari et Chrome n'activent pas le service worker et gardent les scripts en cache HTTP. Pour que les iPad prennent la nouvelle version, augmenter le numéro à deux endroits :

- `index.html` : le `?v=` des balises `<link>` et `<script>`
- `sw.js` : la constante `V` et le `CACHE_NAME`

## 🐛 Dépannage

### L'app semble ne pas avoir la nouvelle version
- Vérifier que le `?v=` de `index.html` a bien été augmenté (voir ci-dessus)
- Sur iPad : fermer complètement l'app depuis l'écran d'accueil et la rouvrir

### Le serveur ne démarre pas
```bash
# Vérifiez que Python 3 est installé
python3 --version

# Ou utilisez un autre port
python3 -m http.server 9000
```

### L'iPad ne se connecte pas
- Vérifiez que Mac et iPad sont sur le même WiFi
- Essayez de désactiver/réactiver le WiFi
- Vérifiez le pare-feu du Mac (Préférences Système > Sécurité)

### Pas de son
- Tapez une fois sur l'écran pour activer l'audio (requis par iOS)
- Vérifiez que le volume n'est pas coupé
- Vérifiez le bouton silence sur le côté de l'iPad

### L'application ne s'affiche pas correctement
- Videz le cache Safari (Réglages > Safari > Effacer historique et données)
- Rafraîchissez la page

## 📄 Licence

Licence MIT (voir [LICENSE](LICENSE)). Application créée avec ❤️ pour aider les enfants à apprendre.
