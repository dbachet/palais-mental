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
│   ├── objets.js       # Objets des lieux dessinés par le code (SVG, sans image)
│   ├── recompenses.js  # Défis du jour et album de stickers
│   ├── jeux-cartes.js  # QCM, paires et réponse à écrire (cartes questions, mots de langue)
│   ├── arcade.js       # Salle de jeux : serpent, blocs (tetris), bonbons (match-3)
│   ├── config.js       # Adresse et clé publique Supabase (vide = app 100 % locale)
│   ├── sync.js         # Compte et enregistrement en ligne (fusion, hors-ligne)
│   └── kawaii.js       # Moteur de dessin des personnages kawaii (SVG, sans image)
└── data/
    ├── lieux.js        # Économie, temps, cartes, langues, catalogue de stickers
    └── monde.js        # BATIMENTS : étages, décor et objets de chaque bâtiment
```

## 🐾 Kawaii : principal et compagnons

Pas d'avatar humain : l'enfant choisit un **kawaii principal** parmi 16 personnages (animaux, objets, aliments) et le personnalise dans l'atelier. Personnages, expressions et couleur naturelle sont libres ; pelages pastel, chapeaux, lunettes et tenues se débloquent en boutique ou dans les coffres. Un **compagnon** se débloque à chaque liste qui atteint le niveau Ninja, jusqu'à cinq. Toute l'équipe s'affiche sur l'accueil ; « Mes kawaii » permet de modifier chacun et de choisir qui est le principal, à tout moment.

Ajouter un personnage = ajouter une entrée dans `CHARS` et sa forme dans `shapes()` de `js/kawaii.js`.

## 🎨 Récompenses : étoiles, coffres, stickers

Aucune image à gérer : les récompenses sont des **stickers** (emojis, ou kawaii dessinés par le code, plus chers) que l'enfant colle où elle veut dans sa ville, et des **habits et accessoires** pour ses kawaii. Les stickers ne servent qu'à décorer : ils ne portent jamais de mot ni de question. Tout se règle dans `data/lieux.js` :

- `ECONOMIE` : étoiles par bonne réponse, bonus sans-faute, étoiles par coffre, prix par rareté (commun, rare, légendaire, kawaii), prix des habits et accessoires, chance qu'un coffre donne un accessoire, stickers max par scène (`maxStickersParScene`).
- `STICKERS` : le catalogue. Un sticker emoji = `{ id, nom, emoji, rarete }`. Un sticker kawaii = `{ id, nom, rarete: "kawaii", k: { char, fur, face, hat, glasses, outfit, outfitColor } }` (les champs de `k` absents prennent la valeur de base).

Boucle de jeu :
1. Chaque bonne réponse donne des étoiles, d'autant plus que le niveau de la liste est élevé (1 ⭐ au niveau 1, 2 ⭐ au niveau 2...). Le compteur s'anime pendant la session.
2. Tous les 12 étoiles gagnées, un **coffre** apparaît sur l'accueil : l'enfant tape dessus pour l'ouvrir et découvre un sticker (rareté aléatoire). Un niveau sans faute donne un coffre rare garanti.
3. Les étoiles se dépensent aussi dans la **Boutique** pour choisir un sticker précis.
4. **🎒 Mes stickers** (sur la carte de la ville) : l'enfant choisit un sticker, tape où elle veut le coller, le déplace au doigt ; un appui long le décolle (il revient dans le sac).
5. **Mon album** montre tout le catalogue : les stickers trouvés en couleur, les autres en silhouette. Des cadeaux (étoiles, coffres) se récupèrent à chaque palier de stickers différents. Les coffres donnent le plus souvent un sticker qui manque encore.
6. Les **défis du jour** : trois petits défis, quelques étoiles chacun, un coffre pour les trois. Pas de série à tenir : on ne perd jamais rien en ne jouant pas, et le compteur de jours de jeu ne fait que monter.

7. La **salle de jeux** : de vrais jeux (serpent, blocs, bonbons) à débloquer une fois avec des étoiles, puis un jeton par partie. Ils ne rapportent rien : les étoiles se gagnent en apprenant, et se dépensent aussi à jouer. Chaque partie se termine d'elle-même ; le record est gardé.

Réglages : `ALBUM` (paliers et cadeaux), `DEFIS` (défis, étoiles, coffre), `ARCADE` (jeux, prix, jeton ; `prixJeton: 0` = parties gratuites) et `ECONOMIE.chanceNouveauSticker` dans `data/lieux.js`.

## 🎯 Fonctionnalités

### ✅ Implémenté

- **Gestion des listes** : créer, éditer, supprimer des listes de mots ; barre de maîtrise et badge « liste dorée » quand tous les mots sont acquis
- **La ville** (accueil) : chaque liste est un bâtiment de la carte (voir plus bas)
- **Mode apprentissage** : « Apprendre » avec animation rythmique
  - L'objet où le mot est rangé, puis « Voir le mot »
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
- **Cartes questions** : listes de questions/réponses (`question = réponse`, une par ligne), jouées en cartes à retourner
  - 10 cartes par session, « Je savais » / « À revoir », seule ou avec un parent
  - Boîtes 1-2-3 : les cartes à revoir reviennent en premier ; toutes en boîte 3 = liste **Ninja**
  - On gagne des étoiles pour la session terminée, pas pour les bonnes réponses (réglages : `CARTES` dans `data/lieux.js`)
  - Trois jeux corrigés par l'app, où chaque bonne réponse du premier coup rapporte des étoiles : **QCM** (mauvaises réponses tirées des autres cartes), **Paires** (relier question et réponse), **Écrire la réponse** (réponses courtes ; accents et majuscules ne comptent pas). Un jeu n'est proposé que si la liste s'y prête
  - Le QCM ne monte pas une carte plus haut que « ça vient » et les paires ne changent aucune boîte : on devient Ninja en retournant les cartes ou en écrivant
  - QCM et paires existent aussi pour les mots de langue, comme échauffement (sans effet sur le niveau)
- **Espace parents** : sauvegarde de toutes les données dans un fichier, et restauration (entrée protégée par un calcul)
- **Mots à travailler** : liste des mots en difficulté par liste, avec bouton pour s'entraîner dessus uniquement
- **Design** : tokens de couleur, une action héro par écran, contrastes renforcés pour la lecture, mouvement calme pendant la tâche
- **Responsive** : optimisé pour iPad, fonctionne sur téléphone
- **PWA** : ajout à l'écran d'accueil iOS, mode offline

### 🚧 À implémenter plus tard

- **Scanner OCR** : Scan photo avec Tesseract.js (saisie manuelle dispo)
- **Mode rythmique** : Jeu basé sur les syllabes (TODO commenté dans le code)
- **Vérification d'images** : Détection automatique des images disponibles

## 🏙️ La ville : lieux, étages et objets

L'accueil est la carte d'une petite ville. **Une liste = un lieu**, **un élément de la liste (mot, question) = un objet** de ce lieu.

- À la création d'une liste, on choisit son bâtiment parmi six : boulangerie, salon de coiffure, château, musée, labo, école. On peut en changer plus tard (édition de la liste) : tous les éléments sont alors rangés sur de nouveaux objets.
- Chaque bâtiment a **6 étages de 12 objets** (72 emplacements). Un étage n'est ouvert que si la liste en a besoin : les 12 premiers éléments vont au premier étage, etc. Au-delà de 72, plusieurs éléments partagent un objet.
- Le **rangement est stable** : un élément garde son objet. En modifiant la liste, seuls les nouveaux éléments sont rangés. Mots : au hasard dans le premier étage qui a de la place. Cartes questions : dans l'ordre de la liste, pour qu'une question reste voisine de celles qui l'entourent.
- Les objets sont **dessinés par le code** (`js/objets.js`, une centaine de formes) : silhouette grise tant que l'élément n'est pas maîtrisé, en couleur avec un petit visage ensuite. Les emojis et les stickers ne servent que de décor.
- Un appui sur un bâtiment ouvre sa liste et ses modes de jeu ; le **+** crée une nouvelle liste.

Ajouter un bâtiment = ajouter une entrée dans `BATIMENTS` (`data/monde.js`) : 6 étages, chacun avec son décor et 12 formes de `js/objets.js`, sans réutiliser une forme dans le même bâtiment. Ajouter un objet = ajouter une forme dans `FORMES` (`js/objets.js`).

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
- **Visuel** : Animation de chaque lettre (agrandissement + couleur rose vif très contrastée)
- **Auditif** : Mélodie unique pour chaque mot (gamme pentatonique majeure)
  - Chaque lettre = une note musicale différente
  - 20 notes sur 4 octaves (C4 à A7)
  - Sons doux et agréables (pas de bip strident)
  - Chaque mot a sa propre "chanson" pour faciliter la mémorisation
- **Rythmique** : Tempo constant et ajustable (0.5s à 2.0s par lettre)

## 💾 Données

Toutes les données sont stockées en **localStorage** :

- `wordLists` : Listes, niveaux, progression, lieu (`lieu`), rangement des éléments sur les objets (`places`) et place sur la carte (`parcelle`)
- `economy` : Étoiles, inventaire, stickers collés (`placed` : par scène, avec leur position), garde-robe, cadeaux de l'album récupérés, défis du jour, jours de jeu, jeux débloqués et records
- `kawaiiTeam` : Kawaii principal et compagnons
- `sauvegardeAvantMonde` : copie, faite une seule fois, des données d'avant la ville (reste sur l'appareil)

Avec un compte (espace parents), ces clés, plus `mixSelection` et `animationSpeed`, sont recopiées en ligne et suivent l'enfant d'un appareil à l'autre : voir [EN-LIGNE.md](EN-LIGNE.md). Pour qu'une nouvelle clé suive aussi, l'ajouter à `SYNC_KEYS` dans `js/sync.js`.

⚠️ **Attention** : sans compte, effacer les données du navigateur supprime tout le progrès ! (Espace parents → sauvegarde dans un fichier.)

## 🎵 Sons

- **Mélodie unique par mot** : Système de notes musicales basé sur la gamme pentatonique
  - Chaque caractère est mappé à une note musicale (C4 à A7)
  - Gamme pentatonique majeure : Do, Ré, Mi, Sol, La (notes qui sonnent toujours bien)
  - Sons doux et agréables avec enveloppe ADSR
  - Chaque mot crée une mélodie différente et mémorisable
- **Synthèse vocale** : Dictée des mots en mode interrogation (Web Speech API, français)

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
