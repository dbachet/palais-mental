# 🏰 Mental Palace

Application web pour aider les enfants (notamment avec TDAH et dysorthographie) à mémoriser les mots invariables via la **méthode des lieux** (palais mental).

## 🚀 Lancement de l'application

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
│   └── kawaii.js       # Moteur de dessin des personnages kawaii (SVG, sans image)
└── data/
    └── lieux.js        # LIEUX, emojis des pièces, économie, temps, catalogue de stickers
```

## 🐾 Kawaii : principal et compagnons

Pas d'avatar humain : l'enfant choisit un **kawaii principal** parmi 16 personnages (animaux, objets, aliments) et le personnalise dans l'atelier. Personnages, expressions et couleur naturelle sont libres ; pelages pastel, chapeaux, lunettes et tenues se débloquent en boutique ou dans les coffres. Un **compagnon** se débloque à chaque liste qui atteint le niveau Ninja, jusqu'à cinq. Toute l'équipe s'affiche sur l'accueil ; « Mes kawaii » permet de modifier chacun et de choisir qui est le principal, à tout moment.

Ajouter un personnage = ajouter une entrée dans `CHARS` et sa forme dans `shapes()` de `js/kawaii.js`.

## 🎨 Récompenses : étoiles, coffres, stickers

Aucune image à gérer : les récompenses sont des **stickers** (emojis, ou kawaii dessinés par le code, plus chers) que l'enfant colle sur les lieux de son palais, et des **habits et accessoires** pour ses kawaii. Tout se règle dans `data/lieux.js` :

- `ECONOMIE` : étoiles par bonne réponse, bonus sans-faute, étoiles par coffre, prix par rareté (commun, rare, légendaire, kawaii), prix des habits et accessoires, chance qu'un coffre donne un accessoire, stickers max par lieu.
- `STICKERS` : le catalogue. Un sticker emoji = `{ id, nom, emoji, rarete }`. Un sticker kawaii = `{ id, nom, rarete: "kawaii", k: { char, fur, face, hat, glasses, outfit, outfitColor } }` (les champs de `k` absents prennent la valeur de base).
- `PIECE_EMOJIS` : emoji affiché pour chaque pièce, trouvé par mot-clé dans son nom (fonctionne avec n'importe quelle maison).

Boucle de jeu :
1. Chaque bonne réponse donne des étoiles, d'autant plus que le niveau de la liste est élevé (1 ⭐ au niveau 1, 2 ⭐ au niveau 2...). Le compteur s'anime pendant la session.
2. Tous les 12 étoiles gagnées, un **coffre** apparaît sur l'accueil : l'enfant tape dessus pour l'ouvrir et découvre un sticker (rareté aléatoire). Un niveau sans faute donne un coffre rare garanti.
3. Les étoiles se dépensent aussi dans la **Boutique** pour choisir un sticker précis.
4. Dans **Mon palais**, l'enfant colle ses stickers sur les lieux réels de la maison. Ils apparaissent ensuite pendant la visite et l'interrogation, sur la carte du lieu.

## 🎯 Fonctionnalités

### ✅ Implémenté

- **Gestion des listes** : créer, éditer, supprimer des listes de mots ; barre de maîtrise et badge « liste dorée » quand tous les mots sont acquis
- **Mode apprentissage** : « Visite du palais » avec animation rythmique
  - Déplacement physique vers chaque emplacement
  - Animation lettre par lettre avec agrandissement et changement de couleur
  - Son synchronisé à chaque lettre, bouton Rejouer, curseur de vitesse (sauvegardé)
- **Mode interrogation** : « Retour au palais » avec dictée et clavier virtuel
  - Mot affiché en **cases de lettres** : lettres visibles, cases à trouver, saisie en rose, vert si juste, rouge si faux
  - **Niveau mémorisé par liste** : niveau 1 = 2 lettres à trouver, +1 lettre par niveau. Une session réussie à 80 % fait monter d'un niveau, et ça ne redescend jamais. Dernier niveau **Ninja** : mot entier plus une ou deux cases pièges, pour ne pas connaître le nombre de lettres. Mode complet = tout le mot
  - Ordre aléatoire des mots, timer qui passe à l'orange quand il reste peu de temps. Temps = 30 s + 5 s par lettre à trouver, réglable via `TEMPS` dans `data/lieux.js`
  - Clavier en rangées : lettres, signes (' - ( )), **accents toujours visibles**, espace large, Valider à droite
  - Étoiles de score du niveau + compteur d'étoiles gagnées
  - Feux d'artifice pour un sans-faute
- **Récompenses** : étoiles, coffres à ouvrir, boutique, stickers à coller sur les lieux (voir plus haut)
- **Mots à travailler** : liste des mots en difficulté par liste, avec bouton pour s'entraîner dessus uniquement
- **Design** : tokens de couleur, une action héro par écran, contrastes renforcés pour la lecture, mouvement calme pendant la tâche
- **Responsive** : optimisé pour iPad, fonctionne sur téléphone
- **PWA** : ajout à l'écran d'accueil iOS, mode offline

### 🚧 À implémenter plus tard

- **Scanner OCR** : Scan photo avec Tesseract.js (saisie manuelle dispo)
- **Mode rythmique** : Jeu basé sur les syllabes (TODO commenté dans le code)
- **Vérification d'images** : Détection automatique des images disponibles

## 📝 Modifier les pièces et les endroits

Depuis l'app : **Mon palais → ✏️** ouvre l'écran **Ma maison**. On peut y ajouter, renommer, réordonner et supprimer des pièces et des endroits, sans toucher au code. La maison est sauvegardée en localStorage (`maison`).

- **Emoji** : appuyer sur l'emoji d'une pièce ouvre une palette (`EMOJIS_PIECES` dans `data/lieux.js`). « Automatique » revient à la détection par mot-clé.
- **Renommer** une pièce ou un endroit garde les mots qui y sont rangés et les stickers collés.
- **Supprimer** un endroit libère ses stickers et déplace les mots qui y étaient vers un endroit libre. Les autres mots ne bougent pas.
- **Revenir à la maison de départ** recharge la maison définie dans `data/lieux.js`.

La **maison de départ** (`LIEUX` dans `data/lieux.js`) sert uniquement la première fois qu'un appareil ouvre l'app, et pour le bouton « maison de départ » :

```javascript
const LIEUX = {
  salon: [
    "sur le canapé",
    "sur la table à manger",
    "dans la cuisine",
    "devant la télé"
  ],
  "ta chambre": [
    "sur ta chaise de bureau",
    "devant ta coiffeuse",
    "sous ton lit"
  ]
};
```

**Conseils** :
- Utilisez des déterminants (le, la, ta, ton, des) pour rendre les noms plus naturels
- Sans emoji choisi, l'emoji d'une pièce est trouvé par mot-clé dans son nom (`PIECE_EMOJIS`)

**Important** : une fois les mots d'une liste rangés dans des endroits, le rangement ne change plus, sauf pour un mot dont l'endroit a été supprimé. S'il y a plus de mots que d'endroits, plusieurs mots partagent un endroit.

## 🎨 Direction artistique

- **Inspiration** : Roblox "Avatar World" (mode, dressing, maquillage)
- **Couleurs** : Pastel vives (rose, violet, turquoise)
- **Style** : "Cute", animations fluides, pas de brutalité
- **Police** : Nunito (ronde et douce)
- **Boutons** : Minimum 44px pour le tactile

## 🧠 Méthode des lieux

Chaque mot est associé à un **emplacement précis** de la maison réelle. L'enfant :

1. **Se déplace PHYSIQUEMENT** vers chaque emplacement de la maison avec son iPad
2. **Clique sur "J'y suis !"** une fois arrivée à l'endroit
3. **Observe l'animation rythmique** du mot (lettre par lettre, son + agrandissement)
4. **Ajuste la vitesse** et **rejoue** autant de fois que nécessaire
5. **Se remémore** en revisitant physiquement l'emplacement lors de l'interrogation

### Flux pédagogique recommandé

**Apprentissage → Interrogation immédiate** (recommandé pour renforcer la mémorisation)
1. Choisir "Apprendre" sur une liste
2. Visiter tous les emplacements et voir les mots
3. À la fin : écran "Bravo ! Tu as appris X mots"
4. Cliquer sur "🎯 Oui, je m'entraîne !"
5. Interrogation sur les mots qui viennent d'être appris (ordre aléatoire)

**OU Interrogation directe** (révision de tous les mots)
1. Choisir "S'entraîner" directement sur une liste
2. Interrogation sur TOUS les mots de la liste (ordre aléatoire)
3. Utile pour réviser une liste complète apprise précédemment

### Apprentissage multi-sensoriel

- **Spatial** : Déplacement physique dans la maison (ancrage corporel)
- **Visuel** : Animation de chaque lettre (agrandissement + couleur rose vif très contrastée)
- **Auditif** : Mélodie unique pour chaque mot (gamme pentatonique majeure)
  - Chaque lettre = une note musicale différente
  - 20 notes sur 4 octaves (C4 à A7)
  - Sons doux et agréables (pas de bip strident)
  - Chaque mot a sa propre "chanson" pour faciliter la mémorisation
- **Rythmique** : Tempo constant et ajustable (0.5s à 2.0s par lettre)

Les **pièces virtuelles** (chambre panda, bureau de président, etc.) sont des versions fantaisistes qui rendent le jeu plus ludique, tout en gardant l'ancrage spatial réel nécessaire à la méthode. L'enfant doit vraiment aller au canapé, devant la télé, etc.

## 💾 Données

Toutes les données sont stockées en **localStorage** :

- `wordLists` : Listes de mots, niveaux, progression et rangement des mots
- `economy` : Étoiles, inventaire, stickers collés, garde-robe
- `kawaiiTeam` : Kawaii principal et compagnons
- `maison` : Pièces et endroits (modifiables dans l'app)

⚠️ **Attention** : Effacer les données du navigateur supprimera tout le progrès !

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
