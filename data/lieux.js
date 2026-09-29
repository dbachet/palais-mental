// ═══════════════════════════════════════════════════════════════
// DONNÉES DU PALAIS MENTAL
// ═══════════════════════════════════════════════════════════════
// Maison de départ : pièces et endroits proposés la première fois qu'un
// appareil ouvre l'app. Ensuite, la maison se modifie dans l'app
// (Mon palais → ✏️ Ma maison) et est stockée en localStorage (`maison`).
// Ce fichier sert aussi au bouton « Revenir à la maison de départ ».

const LIEUX = {
  "salon": [
    "sur le canapé",
    "devant la télé",
    "à côté de la fenêtre",
    "sur le fauteuil"
  ],
  "cuisine": [
    "devant le frigo",
    "sur la table",
    "devant l'évier",
    "à côté du four"
  ],
  "entrée": [
    "devant la porte d'entrée",
    "à côté des chaussures",
    "sous les manteaux"
  ],
  "couloir": [
    "devant la porte de la salle de bain",
    "devant la porte de ta chambre",
    "devant la porte de la chambre de tes parents"
  ],
  "salle de bain": [
    "devant le miroir",
    "dans la baignoire",
    "sur les wc",
    "à côté de la machine à laver"
  ],
  "ta chambre": [
    "sur ton lit",
    "sous ton lit",
    "sur ta chaise de bureau",
    "devant ton armoire",
    "à côté de la fenêtre",
    "sur le tapis"
  ],
  "chambre des parents": [
    "sur le lit",
    "devant l'armoire",
    "à côté de la table de nuit"
  ],
  "bureau": [
    "sur la chaise de bureau",
    "devant l'ordinateur",
    "à côté de la bibliothèque"
  ]
};

// ═══════════════════════════════════════════════════════════════
// MAPPING PIÈCES VIRTUELLES
// ═══════════════════════════════════════════════════════════════
// Associe chaque emplacement réel à une image de pièce virtuelle
// Format: "piece_emplacement" → "nom_fichier_image.png"
// Les images doivent être placées dans assets/rooms/
// Si pas d'image, un fond générique sera affiché

const PIECES_VIRTUELLES = {
  // Exemple: "sa_chambre_sous le lit": "chambre_panda.png",
  // Ajouter vos mappings ici au fur et à mesure
};

// ═══════════════════════════════════════════════════════════════
// EMOJIS DES PIÈCES
// ═══════════════════════════════════════════════════════════════
// Emoji affiché pour chaque pièce, trouvé par mot-clé dans son nom.
// Le premier mot-clé qui matche gagne. "defaut" sert si rien ne matche.

const PIECE_EMOJIS = [
  { motCle: "salon",     emoji: "🛋️" },
  { motCle: "cuisine",   emoji: "🍳" },
  { motCle: "douche",    emoji: "🚿" },
  { motCle: "bain",      emoji: "🛁" },
  { motCle: "couloir",   emoji: "🚪" },
  { motCle: "parents",   emoji: "🛏️" },
  { motCle: "amis",      emoji: "🛌" },
  { motCle: "chambre",   emoji: "🧸" },
  { motCle: "atelier",   emoji: "🧵" },
  { motCle: "sous-sol",  emoji: "🔦" },
  { motCle: "cave",      emoji: "🔦" },
  { motCle: "garage",    emoji: "🚗" },
  { motCle: "bureau",    emoji: "💻" },
  { motCle: "jardin",    emoji: "🌳" },
  { motCle: "defaut",    emoji: "🏠" }
];

// Emojis proposés dans l'app quand on choisit l'icône d'une pièce
const EMOJIS_PIECES = [
  "🛋️", "📺", "🍳", "🍽️", "🧊", "🚪", "🔑", "🧥",
  "🚿", "🛁", "🚽", "🧺", "🛏️", "🛌", "🧸", "🪆",
  "🧵", "🎨", "🎹", "🎸", "📚", "💻", "🎮", "🧩",
  "🔦", "🚗", "🚲", "🧰", "🏋️", "🌳", "🌸", "🪴",
  "🐶", "🐱", "🐰", "🦄", "🏠", "🏡", "🏰", "⭐"
];

// ═══════════════════════════════════════════════════════════════
// ÉCONOMIE DES ÉTOILES
// ═══════════════════════════════════════════════════════════════
// Les étoiles sont gagnées en jouant et dépensées dans la boutique.
// Un coffre s'ouvre à chaque palier d'étoiles gagnées (cumul, jamais
// diminué par les achats).

const ECONOMIE = {
  etoilesParBonneReponse: 1,      // mode progressif, + le niveau de la liste
  etoilesParBonneReponseComplet: 2, // mode interrogation complète, + le niveau de la liste
  bonusSansFaute: 5,              // niveau parfait (au moins 5 mots)
  etoilesApprentissage: 3,        // fin d'une visite du palais
  seuilPassageNiveau: 0.8,        // réussite de session pour monter d'un niveau (jamais de descente)
  etoilesParCoffre: 12,           // un coffre tous les N étoiles gagnées
  maxStickersParLieu: 4,
  prix: { commun: 5, rare: 12, legendaire: 25, kawaii: 40 },
  // Habits et accessoires de l'atelier : prix par type
  // fond : couleur unie derrière le kawaii ; scene : fond dessiné (plage, espace…)
  prixAccessoires: { fur: 8, glasses: 10, hat: 12, outfit: 15, fond: 6, scene: 18 },
  chanceAccessoireCoffre: 0.3,  // un coffre sur trois donne un accessoire plutôt qu'un sticker
  // Probabilités d'un coffre normal (un coffre "rare" garantit au moins rare)
  chancesCoffre: { commun: 0.62, rare: 0.30, legendaire: 0.05, kawaii: 0.03 },
  // Dans la rareté tirée, chance de donner un sticker que l'enfant n'a pas
  // encore (s'il en reste) : l'album se remplit, les doubles restent possibles
  chanceNouveauSticker: 0.7
};

// ═══════════════════════════════════════════════════════════════
// ALBUM DE STICKERS
// ═══════════════════════════════════════════════════════════════
// L'album montre tous les stickers du catalogue : ceux trouvés, et la
// silhouette des autres. Chaque palier de stickers différents donne un
// cadeau à récupérer dans l'album. n: "tout" = l'album complet.
// cadeau : { etoiles } et/ou { coffres: ['normal' | 'rare', ...] }

const ALBUM = {
  paliers: [
    { n: 3,  cadeau: { etoiles: 5 } },
    { n: 6,  cadeau: { coffres: ['normal'] } },
    { n: 10, cadeau: { etoiles: 10 } },
    { n: 15, cadeau: { coffres: ['rare'] } },
    { n: 20, cadeau: { etoiles: 15 } },
    { n: 28, cadeau: { coffres: ['rare'] } },
    { n: 36, cadeau: { etoiles: 25 } },
    { n: 45, cadeau: { coffres: ['rare', 'rare'] } },
    { n: 54, cadeau: { etoiles: 40 } },
    { n: 'tout', cadeau: { etoiles: 60, coffres: ['rare', 'rare', 'rare'] } }
  ]
};

// ═══════════════════════════════════════════════════════════════
// DÉFIS DU JOUR
// ═══════════════════════════════════════════════════════════════
// Trois petits défis par jour, un par famille. Rien ne se perd quand on ne
// joue pas : pas de série à tenir, seulement un compteur de jours de jeu
// qui ne fait que monter.
// cible = nombre à atteindre. Un défi n'est proposé que s'il est faisable
// ce jour-là (voir Defis.faisable dans js/recompenses.js).

const DEFIS = {
  etoilesParDefi: 3,
  coffreLesTrois: 'normal', // cadeau quand tous les défis du jour sont réussis
  familles: [
    [ // l'effort du jour
      { id: 'mots10',  emoji: '✏️', texte: 'Réussis 10 réponses', cible: 10 },
      { id: 'suite5',  emoji: '🔥', texte: 'Réussis 5 réponses d\'affilée', cible: 5 },
      { id: 'mots20',  emoji: '💪', texte: 'Réussis 20 réponses', cible: 20 }
    ],
    [ // une activité à terminer
      { id: 'session', emoji: '🎯', texte: 'Termine un entraînement', cible: 1 },
      { id: 'visite',  emoji: '🎓', texte: 'Fais une visite du palais', cible: 1 },
      { id: 'travail', emoji: '🌱', texte: 'Réussis 3 mots à travailler', cible: 3 },
      { id: 'jeu',     emoji: '🃏', texte: 'Termine un jeu de cartes questions', cible: 1 }
    ],
    [ // un moment doux
      { id: 'calin',   emoji: '💖', texte: 'Fais un câlin à ton kawaii', cible: 1 },
      { id: 'sticker', emoji: '🏠', texte: 'Colle un sticker dans ton palais', cible: 1 },
      { id: 'album',   emoji: '📒', texte: 'Va voir ton album', cible: 1 }
    ]
  ]
};

// ═══════════════════════════════════════════════════════════════
// TEMPS PAR MOT (interrogation)
// ═══════════════════════════════════════════════════════════════
// Temps accordé = base + secondes par lettre à trouver.
// Niveau 1 (2 lettres) : 30 + 2×5 = 40 s. Mot entier de 8 lettres : 70 s.
// Le temps ne diminue jamais quand le niveau monte.

const TEMPS = {
  baseSecondes: 30,
  secondesParLettre: 5
};

// ═══════════════════════════════════════════════════════════════
// CARTES QUESTIONS
// ═══════════════════════════════════════════════════════════════
// Cartes à retourner, rangées dans 3 boîtes : 1 = à revoir, 2 = ça vient,
// 3 = connue. L'enfant (ou le parent) valide lui-même : on récompense donc
// la session terminée, jamais les bonnes réponses.
// Une liste devient Ninja quand toutes ses cartes sont dans la boîte 3.

const CARTES = {
  parSession: 10,        // cartes tirées par session
  etoilesSession: 5,     // étoiles pour une session terminée
  retoursMaxParCarte: 2, // une carte « à revoir » revient au plus N fois dans la session
  // Tirage : plus le poids est petit, plus la carte sort souvent
  poidsTirage: { 1: 1, 0: 1.5, 2: 3, 3: 6 }, // 0 = jamais vue

  // Jeux corrigés par l'app (QCM, paires, réponse à écrire) : l'enfant ne se
  // note pas lui-même, une bonne réponse du premier coup rapporte des étoiles.
  etoilesQcm: 1,          // par bonne réponse
  etoilesPaire: 1,        // par paire trouvée sans se tromper
  etoilesEcrire: 2,       // par réponse écrite juste
  retoursMaxJeu: 1,       // une carte ratée revient une fois dans la session
  boiteMaxQcm: 2,         // reconnaître n'est pas savoir : le QCM s'arrête à « ça vient »
  pairesParManche: 5,
  reponsesMinQcm: 4,      // réponses différentes qu'il faut dans la liste pour un QCM
  cartesMinPaires: 3,
  cartesMinEcrire: 3,
  lettresMaxEcrire: 16    // au-delà, la réponse est trop longue pour être écrite
};

// ═══════════════════════════════════════════════════════════════
// LISTES DE LANGUE (traduction)
// ═══════════════════════════════════════════════════════════════
// On montre un mot dans la langue de départ, l'enfant écrit sa traduction
// dans la langue d'arrivée (lettres à trouver, comme une liste de mots).
// voix = langue de la synthèse vocale. Ajouter une langue = ajouter une ligne.

const LANGUES = {
  fr: { nom: "français", drapeau: "🇫🇷", voix: "fr-FR" },
  en: { nom: "anglais",  drapeau: "🇬🇧", voix: "en-GB" },
  es: { nom: "espagnol", drapeau: "🇪🇸", voix: "es-ES" },
  de: { nom: "allemand", drapeau: "🇩🇪", voix: "de-DE" }
};

// ═══════════════════════════════════════════════════════════════
// STICKERS (récompenses)
// ═══════════════════════════════════════════════════════════════
// Pas d'images : chaque sticker est un emoji. On les gagne dans les
// coffres ou on les achète, puis on les colle sur les lieux du palais.
// Ajouter un sticker = ajouter une ligne.

// Deux sortes de stickers :
// - emoji : { id, nom, emoji, rarete } (commun / rare / legendaire)
// - kawaii : { id, nom, rarete: "kawaii", k: { char, fur, face, hat, glasses, outfit, outfitColor } }
//   dessiné par js/kawaii.js ; les champs de k absents prennent la valeur de base.
// Ajouter un sticker = ajouter une ligne.

const STICKERS = [
  // ── Communs (emoji) ──
  { id: "fleur",      nom: "Fleur",          emoji: "🌸", rarete: "commun" },
  { id: "ballon",     nom: "Ballon",         emoji: "🎈", rarete: "commun" },
  { id: "nounours",   nom: "Nounours",       emoji: "🧸", rarete: "commun" },
  { id: "plante",     nom: "Plante",         emoji: "🪴", rarete: "commun" },
  { id: "bougie",     nom: "Bougie",         emoji: "🕯️", rarete: "commun" },
  { id: "noeud",      nom: "Nœud rose",      emoji: "🎀", rarete: "commun" },
  { id: "sucette",    nom: "Sucette",        emoji: "🍭", rarete: "commun" },
  { id: "chat",       nom: "Chaton",         emoji: "🐱", rarete: "commun" },
  { id: "chien",      nom: "Chiot",          emoji: "🐶", rarete: "commun" },
  { id: "papillon",   nom: "Papillon",       emoji: "🦋", rarete: "commun" },
  { id: "arc",        nom: "Arc-en-ciel",    emoji: "🌈", rarete: "commun" },
  { id: "palette",    nom: "Palette",        emoji: "🎨", rarete: "commun" },
  { id: "livres",     nom: "Livres",         emoji: "📚", rarete: "commun" },
  { id: "cupcake",    nom: "Cupcake",        emoji: "🧁", rarete: "commun" },
  { id: "fraise",     nom: "Fraise",         emoji: "🍓", rarete: "commun" },
  { id: "lapin",      nom: "Lapin",          emoji: "🐰", rarete: "commun" },
  { id: "coeur",      nom: "Cœur",           emoji: "💖", rarete: "commun" },
  { id: "tournesol",  nom: "Tournesol",      emoji: "🌻", rarete: "commun" },

  // ── Rares (emoji) ──
  { id: "licorne",    nom: "Licorne",        emoji: "🦄", rarete: "rare" },
  { id: "panda",      nom: "Panda",          emoji: "🐼", rarete: "rare" },
  { id: "fee",        nom: "Fée",            emoji: "🧚", rarete: "rare" },
  { id: "couronne",   nom: "Couronne",       emoji: "👑", rarete: "rare" },
  { id: "carrousel",  nom: "Carrousel",      emoji: "🎠", rarete: "rare" },
  { id: "baguette",   nom: "Baguette magique", emoji: "🪄", rarete: "rare" },
  { id: "flamant",    nom: "Flamant rose",   emoji: "🦩", rarete: "rare" },
  { id: "dauphin",    nom: "Dauphin",        emoji: "🐬", rarete: "rare" },
  { id: "roue",       nom: "Grande roue",    emoji: "🎡", rarete: "rare" },
  { id: "diamant",    nom: "Diamant",        emoji: "💎", rarete: "rare" },
  { id: "disco",      nom: "Boule disco",    emoji: "🪩", rarete: "rare" },
  { id: "koala",      nom: "Koala",          emoji: "🐨", rarete: "rare" },

  // ── Légendaires (emoji) ──
  { id: "dragon",     nom: "Dragon",         emoji: "🐉", rarete: "legendaire" },
  { id: "chateau",    nom: "Château",        emoji: "🏰", rarete: "legendaire" },
  { id: "fusee",      nom: "Fusée",          emoji: "🚀", rarete: "legendaire" },
  { id: "sirene",     nom: "Sirène",         emoji: "🧜‍♀️", rarete: "legendaire" },
  { id: "galaxie",    nom: "Galaxie",        emoji: "🌌", rarete: "legendaire" },
  { id: "paon",       nom: "Paon",           emoji: "🦚", rarete: "legendaire" },
  { id: "feu",        nom: "Feu d'artifice", emoji: "🎇", rarete: "legendaire" },
  { id: "soucoupe",   nom: "Soucoupe volante", emoji: "🛸", rarete: "legendaire" },

  // ── Kawaii (dessinés par le code, 40 ⭐) ──
  { id: "k_chat",      nom: "Chat kawaii",        rarete: "kawaii", k: { char: "chat" } },
  { id: "k_lapin",     nom: "Lapin kawaii",       rarete: "kawaii", k: { char: "lapin" } },
  { id: "k_ours",      nom: "Ourson kawaii",      rarete: "kawaii", k: { char: "ours" } },
  { id: "k_panda",     nom: "Panda kawaii",       rarete: "kawaii", k: { char: "panda" } },
  { id: "k_renard",    nom: "Renard kawaii",      rarete: "kawaii", k: { char: "renard" } },
  { id: "k_licorne",   nom: "Licorne kawaii",     rarete: "kawaii", k: { char: "licorne" } },
  { id: "k_pingouin",  nom: "Pingouin kawaii",    rarete: "kawaii", k: { char: "pingouin" } },
  { id: "k_cochon",    nom: "Cochon kawaii",      rarete: "kawaii", k: { char: "cochon" } },
  { id: "k_etoile",    nom: "Étoile kawaii",      rarete: "kawaii", k: { char: "etoile" } },
  { id: "k_nuage",     nom: "Nuage kawaii",       rarete: "kawaii", k: { char: "nuage" } },
  { id: "k_coeur",     nom: "Cœur kawaii",        rarete: "kawaii", k: { char: "coeur" } },
  { id: "k_lune",      nom: "Lune kawaii",        rarete: "kawaii", k: { char: "lune" } },
  { id: "k_flan",      nom: "Flan kawaii",        rarete: "kawaii", k: { char: "flan" } },
  { id: "k_cupcake",   nom: "Cupcake kawaii",     rarete: "kawaii", k: { char: "cupcake" } },
  { id: "k_glace",     nom: "Glace kawaii",       rarete: "kawaii", k: { char: "glace" } },
  { id: "k_fraise",    nom: "Fraise kawaii",      rarete: "kawaii", k: { char: "fraise" } },
  { id: "k_chat_royal",      nom: "Chat royal",         rarete: "kawaii", k: { char: "chat", face: "etoiles", hat: "couronne", outfit: "cape", outfitColor: "violet" } },
  { id: "k_licorne_magique", nom: "Licorne magique",    rarete: "kawaii", k: { char: "licorne", fur: "rose", face: "etoiles", glasses: "coeur", outfit: "cape", outfitColor: "rose" } },
  { id: "k_panda_fete",      nom: "Panda de fête",      rarete: "kawaii", k: { char: "panda", face: "rieur", hat: "chapeau", outfit: "cape", outfitColor: "jaune" } },
  { id: "k_renard_heros",    nom: "Renard super-héros", rarete: "kawaii", k: { char: "renard", face: "clin", glasses: "soleil", outfit: "cape", outfitColor: "bleu" } },
  { id: "k_etoile_reine",    nom: "Reine des étoiles",  rarete: "kawaii", k: { char: "etoile", face: "etoiles", hat: "couronne", outfit: "collier", outfitColor: "rose" } },
  { id: "k_ours_volant",     nom: "Ourson volant",      rarete: "kawaii", k: { char: "ours", fur: "lilas", face: "langue", hat: "bonnet", outfit: "cape", outfitColor: "corail" } },
  { id: "k_cupcake_royal",   nom: "Cupcake royal",      rarete: "kawaii", k: { char: "cupcake", face: "etoiles", hat: "couronne", glasses: "coeur" } },
  { id: "k_lapin_volant",    nom: "Lapin volant",       rarete: "kawaii", k: { char: "lapin", fur: "rose", face: "rieur", hat: "fleur", outfit: "cape", outfitColor: "menthe" } }
];

const RARETES = {
  commun:     { nom: "Commun",     couleur: "#7DD3D0" },
  rare:       { nom: "Rare",       couleur: "#B48CDB" },
  legendaire: { nom: "Légendaire", couleur: "#F5B21B" },
  kawaii:     { nom: "Kawaii",     couleur: "#FF7EB9" }
};

// ═══════════════════════════════════════════════════════════════
// COULEURS DU THÈME
// ═══════════════════════════════════════════════════════════════

const THEME_COLORS = {
  rose: "#FFB6D9",
  violet: "#D4A5D4",
  turquoise: "#A0E7E5",
  rose_clair: "#FFE5F0",
  violet_clair: "#F0E5F0",
  turquoise_clair: "#E0F9F8",
  blanc: "#FFFFFF",
  texte: "#5A5A5A"
};
