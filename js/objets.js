// ═══════════════════════════════════════════════════════════════
// OBJETS DU MONDE - dessinés par le code (aucune image, aucun emoji)
// ═══════════════════════════════════════════════════════════════
// Les objets portent les éléments des listes (un mot, une question, un
// bloc de leçon). Même style que les kawaii : traits ronds foncés, couleurs
// pastel, reflet blanc. Un objet pas encore maîtrisé s'affiche en
// silhouette grise ; maîtrisé, il prend ses couleurs et un petit visage.
//
// Chaque forme tient dans un carré 100 × 100, posée sur le bas (y ≈ 94).
//   k : 'sol' (meuble posé par terre), 'mur' (accroché), 'petit' (sur une étagère)
//   c : couleur par défaut (voir COULEURS) ; face : [x, y, échelle] du visage
// Utilisation : Objets.draw(id, { couleur, taille, gris }) → chaîne SVG
//               Objets.inner(id, couleur, { gris }) → contenu à placer dans une scène
// Ajouter un objet = ajouter une entrée dans FORMES.

const Objets = (function () {

const INK = '#3A2B3F';
const O = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const COULEURS = {
  rose:   { c: '#FF9EC7', s: '#E8679F' },
  violet: { c: '#C3A2EC', s: '#9A72CF' },
  menthe: { c: '#8EE3DC', s: '#3FBDB6' },
  jaune:  { c: '#FFDB6E', s: '#E8B42A' },
  bleu:   { c: '#9CC7FA', s: '#5E95DA' },
  corail: { c: '#FF9F8F', s: '#E5675A' },
  vert:   { c: '#9BDB8A', s: '#5FAE52' },
  bois:   { c: '#D9A06B', s: '#A86F3F' },
  creme:  { c: '#FFF1D6', s: '#E8CFA0' },
  gris:   { c: '#DCD8E6', s: '#A9A4BA' },
  blanc:  { c: '#FFFFFF', s: '#D9D6E3' },
  rouge:  { c: '#FF7A7A', s: '#D94848' },
  brun:   { c: '#B98258', s: '#80553A' },
  nuit:   { c: '#6E63A0', s: '#463D73' }
};

// Petites briques de dessin
const R = (x, y, w, h, rx, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${O}/>`;
const E = (cx, cy, rx, ry, f) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" ${O}/>`;
const C = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" ${O}/>`;
const P = (d, f) => `<path d="${d}" fill="${f}" ${O}/>`;
const L = (d, w = 2.5) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const H = (d) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".75"/>`; // reflet
const D = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`; // point sans trait

// ── La bibliothèque ──
// d(c) : c = { c: couleur, s: ombre }
const FORMES = {
  // ─── Meubles ───
  lit: { nom: 'le lit', k: 'sol', c: 'rose', face: [66, 70, .7], d: c =>
    R(8, 40, 14, 54, 5, COULEURS.bois.c) + R(80, 62, 10, 32, 4, COULEURS.bois.c) + R(12, 60, 78, 22, 8, '#fff') +
    P('M42 60 h42 a6 6 0 0 1 6 6 v16 h-48 z', c.c) + E(28, 57, 11, 7, '#fff') },
  armoire: { nom: "l'armoire", k: 'sol', c: 'bois', face: [50, 36, .7], d: c =>
    R(22, 12, 56, 80, 6, c.c) + L('M50 16 v72') + D(45, 56, 2.6, INK) + D(55, 56, 2.6, INK) + R(17, 7, 66, 9, 4, c.s) + L('M28 92 v3 M72 92 v3', 4) + H('M28 20 v12') },
  commode: { nom: 'la commode', k: 'sol', c: 'menthe', face: [50, 49, .6], d: c =>
    R(12, 38, 76, 52, 6, c.c) + L('M16 56 h68 M16 73 h68') + D(22, 47, 2.5, INK) + D(78, 47, 2.5, INK) + D(50, 64, 2.5, INK) + D(50, 81, 2.5, INK) + L('M20 90 v5 M80 90 v5', 4) },
  chaise: { nom: 'la chaise', k: 'sol', c: 'jaune', face: [49, 32, .6], d: c =>
    R(30, 12, 38, 46, 9, c.c) + R(24, 56, 52, 10, 4, c.s) + L('M30 66 v28 M70 66 v28', 4.5) + H('M36 20 v12') },
  fauteuil: { nom: 'le fauteuil', k: 'sol', c: 'rose', face: [50, 40, .75], d: c =>
    R(20, 18, 60, 46, 16, c.c) + R(8, 46, 22, 38, 10, c.s) + R(70, 46, 22, 38, 10, c.s) + R(26, 60, 48, 22, 8, c.c) + L('M16 84 v8 M84 84 v8', 4.5) + H('M28 28 q4 -6 10 -6') },
  canape: { nom: 'le canapé', k: 'sol', c: 'violet', face: [50, 44, .75], d: c =>
    R(10, 28, 80, 38, 14, c.c) + R(4, 50, 18, 34, 8, c.s) + R(78, 50, 18, 34, 8, c.s) + R(18, 62, 64, 20, 7, c.c) + L('M50 64 v16') + L('M12 84 v8 M88 84 v8', 4.5) },
  table: { nom: 'la table', k: 'sol', c: 'bois', face: [50, 60, .55], d: c =>
    R(8, 44, 84, 10, 4, c.c) + R(16, 54, 8, 40, 3, c.s) + R(76, 54, 8, 40, 3, c.s) + P('M30 54 h40 v14 q-20 8 -40 0 z', '#fff') },
  bureau: { nom: 'le bureau', k: 'sol', c: 'bleu', face: [70, 64, .55], d: c =>
    R(8, 42, 84, 10, 4, c.c) + R(56, 52, 30, 42, 4, c.c) + L('M56 72 h30') + R(14, 52, 7, 42, 3, c.s) + D(71, 62, 2.4, INK) + D(71, 82, 2.4, INK) },
  etagere: { nom: "l'étagère à livres", k: 'sol', c: 'bois', face: null, d: c =>
    R(16, 6, 68, 88, 5, c.c) + L('M20 34 h60 M20 62 h60') +
    R(24, 14, 8, 20, 2, '#FF9EC7') + R(33, 17, 7, 17, 2, '#9CC7FA') + R(41, 12, 9, 22, 2, '#FFDB6E') + R(60, 18, 14, 16, 3, '#9BDB8A') +
    R(24, 44, 10, 18, 2, '#C3A2EC') + R(36, 40, 7, 22, 2, '#FF9F8F') + R(54, 46, 20, 8, 2, '#8EE3DC') + R(56, 54, 16, 8, 2, '#FFDB6E') +
    R(26, 70, 18, 20, 6, '#FFF1D6') + R(50, 72, 8, 18, 2, '#9CC7FA') + R(60, 68, 8, 22, 2, '#FF9EC7') },
  lampadaire: { nom: 'le lampadaire', k: 'sol', c: 'jaune', face: [50, 22, .6], d: c =>
    P('M30 34 L38 8 h24 L70 34 z', c.c) + L('M50 34 v54', 4) + E(50, 91, 18, 5, COULEURS.gris.c) + H('M40 14 l-3 12') },
  lampe: { nom: 'la petite lampe', k: 'petit', c: 'menthe', face: [50, 32, .6], d: c =>
    P('M28 46 L36 18 h28 L72 46 z', c.c) + L('M50 46 v30', 4) + P('M34 92 q16 -20 32 0 z', c.s) },
  horloge: { nom: "l'horloge", k: 'mur', c: 'bleu', face: null, d: c =>
    C(50, 50, 38, c.c) + C(50, 50, 29, '#fff') + L('M50 50 V30 M50 50 L64 58', 3.5) + D(50, 50, 3.5, INK) +
    D(50, 26, 2, INK) + D(74, 50, 2, INK) + D(50, 74, 2, INK) + D(26, 50, 2, INK) },
  pendule: { nom: 'la grande pendule', k: 'sol', c: 'bois', face: null, d: c =>
    R(32, 6, 36, 88, 8, c.c) + C(50, 26, 13, '#fff') + L('M50 26 v-8 M50 26 l6 3', 2.5) + R(40, 46, 20, 38, 6, c.s) + L('M50 50 v20') + C(50, 74, 6, '#FFDB6E') },
  miroir: { nom: 'le miroir', k: 'mur', c: 'rose', face: null, d: c =>
    E(50, 50, 30, 40, c.c) + E(50, 50, 22, 32, '#E6F4FF') + H('M40 30 q-6 10 -4 22') + H('M46 28 l-2 4') },
  tableau: { nom: 'le tableau', k: 'mur', c: 'jaune', face: null, d: c =>
    R(10, 18, 80, 64, 4, c.c) + R(18, 26, 64, 48, 2, '#CFE8FF') + P('M18 74 L38 48 L52 64 L62 54 L82 74 z', '#9BDB8A') + D(68, 38, 6, '#FFDB6E') },
  coffre: { nom: 'le coffre', k: 'sol', c: 'bois', face: [50, 70, .6], d: c =>
    P('M14 50 q0 -22 36 -22 q36 0 36 22 z', c.s) + R(14, 50, 72, 42, 5, c.c) + R(44, 44, 12, 14, 3, '#FFDB6E') + L('M24 50 v42 M76 50 v42', 3) },
  coussin: { nom: 'le coussin', k: 'petit', c: 'violet', face: [50, 66, .7], d: c =>
    P('M16 50 q34 -10 68 0 q6 22 0 44 q-34 10 -68 0 q-6 -22 0 -44 z', c.c) + H('M26 56 q8 -3 16 -3') },
  pouf: { nom: 'le pouf', k: 'sol', c: 'corail', face: [50, 70, .7], d: c =>
    E(50, 82, 34, 12, c.s) + R(16, 50, 68, 32, 14, c.c) + E(50, 52, 34, 10, c.c) + H('M26 62 v10') },
  plante: { nom: 'la plante verte', k: 'sol', c: 'corail', face: [50, 80, .6], d: c =>
    P('M50 66 C30 60 18 40 24 22 C38 30 48 46 50 66 z', '#7FCF6E') + P('M50 66 C70 58 84 40 76 18 C62 28 52 46 50 66 z', '#9BDB8A') + P('M50 66 C46 46 46 26 52 10 C60 28 58 48 50 66 z', '#6BC25A') +
    P('M30 66 h40 l-6 28 h-28 z', c.c) },
  vase: { nom: 'le vase de fleurs', k: 'petit', c: 'bleu', face: [50, 76, .55], d: c =>
    L('M50 60 V30 M44 60 L32 38 M56 60 L70 36', 3) + C(50, 26, 8, '#FF9EC7') + C(31, 34, 7, '#FFDB6E') + C(71, 32, 7, '#C3A2EC') +
    P('M38 58 h24 q10 14 2 36 h-28 q-8 -22 2 -36 z', c.c) },
  cheminee: { nom: 'la cheminée', k: 'sol', c: 'brun', face: null, d: c =>
    R(8, 30, 84, 64, 4, c.c) + R(4, 24, 92, 10, 4, c.s) + P('M26 94 v-26 a24 24 0 0 1 48 0 v26 z', '#3A2B3F') +
    P('M50 92 C38 92 36 80 44 70 C44 78 48 78 48 74 C48 66 54 62 56 56 C60 66 66 72 64 82 C62 90 56 92 50 92 z', '#FFB347') + P('M50 92 c-6 0 -6 -8 0 -14 c6 6 6 14 0 14 z', '#FFE38A') },
  baignoire: { nom: 'la baignoire', k: 'sol', c: 'blanc', face: [50, 72, .7], d: c =>
    L('M78 46 V26 q0 -8 -8 -8 h-6', 4) + P('M8 50 h84 q0 36 -28 36 h-28 q-28 0 -28 -36 z', c.c) + L('M24 86 l-4 8 M76 86 l4 8', 4) +
    C(30, 46, 8, '#E6F4FF') + C(44, 42, 10, '#E6F4FF') + C(60, 45, 8, '#E6F4FF') },
  lavabo: { nom: 'le lavabo', k: 'sol', c: 'menthe', face: [50, 48, .55], d: c =>
    P('M14 40 h72 q0 22 -36 22 q-36 0 -36 -22 z', c.c) + R(42, 60, 16, 34, 4, c.c) + L('M50 40 V26 h10 v6', 4) + D(38, 30, 4, INK) },

  // ─── Cuisine et gourmandises ───
  four: { nom: 'le four', k: 'sol', c: 'rouge', face: null, d: c =>
    R(10, 24, 80, 70, 8, c.c) + R(20, 46, 60, 38, 6, '#3A2B3F') + R(26, 52, 48, 26, 4, '#FFB347') + D(26, 34, 4, '#fff') + D(42, 34, 4, '#fff') + D(58, 34, 4, '#fff') + L('M68 34 h12', 4) },
  frigo: { nom: 'le frigo', k: 'sol', c: 'bleu', face: [50, 66, .7], d: c =>
    R(24, 6, 52, 88, 10, c.c) + L('M24 38 h52') + L('M32 18 v12 M32 46 v14', 4) + H('M66 14 v18') },
  marmite: { nom: 'la marmite', k: 'petit', c: 'rouge', face: [50, 74, .65], d: c =>
    H('M38 30 q-4 -8 2 -14 M52 28 q-4 -8 2 -14') + R(46, 38, 8, 6, 3, c.s) + P('M18 48 q32 -12 64 0 z', c.s) + R(20, 48, 60, 44, 10, c.c) + L('M20 60 h-8 M80 60 h8', 4) },
  theiere: { nom: 'la théière', k: 'petit', c: 'menthe', face: [46, 70, .65], d: c =>
    P('M76 60 q14 -14 12 -24 l-6 2 q0 10 -12 14', c.c) + P('M20 62 q-12 -4 -10 -16 q8 2 12 6', c.c) + E(46, 66, 30, 26, c.c) + P('M28 42 q18 -12 36 0 z', c.s) + C(46, 34, 4, c.s) },
  tasse: { nom: 'la tasse', k: 'petit', c: 'rose', face: [44, 72, .6], d: c =>
    H('M38 40 q-4 -8 2 -14 M50 40 q-4 -8 2 -14') + P('M74 58 q14 0 12 12 q-2 10 -14 8', 'none') + P('M20 50 h52 v24 q0 18 -26 18 q-26 0 -26 -18 z', c.c) + E(46, 50, 26, 5, '#B98258') },
  bocal: { nom: 'le bocal de bonbons', k: 'petit', c: 'rose', face: null, d: c =>
    R(34, 18, 32, 10, 3, c.c) + R(24, 28, 52, 64, 14, '#EAF6FF') + D(38, 74, 7, '#FF9EC7') + D(56, 78, 7, '#FFDB6E') + D(48, 62, 7, '#9BDB8A') + D(62, 60, 6, '#C3A2EC') + D(36, 52, 6, '#9CC7FA') + H('M32 40 v20') },
  balance: { nom: 'la balance', k: 'petit', c: 'jaune', face: null, d: c =>
    L('M50 30 V88 M22 34 h56', 4) + P('M10 56 q12 12 24 0 z', c.c) + P('M66 56 q12 12 24 0 z', c.c) + L('M22 34 l-10 22 M22 34 l10 22 M78 34 l-10 22 M78 34 l10 22', 2) + R(32, 86, 36, 8, 4, c.s) + C(50, 28, 5, c.s) },
  panier: { nom: 'le panier', k: 'petit', c: 'bois', face: [50, 76, .6], d: c =>
    P('M26 58 q24 -50 48 0', 'none') + P('M14 56 h72 l-8 36 h-56 z', c.c) + L('M18 68 h64 M22 80 h56', 2) + D(36, 52, 8, '#FF7A7A') + D(54, 50, 9, '#FFDB6E') },
  pain: { nom: 'le pain', k: 'petit', c: 'bois', face: [50, 74, .65], d: c =>
    P('M12 80 q-2 -34 38 -34 q40 0 38 34 q-2 12 -38 12 q-36 0 -38 -12 z', c.c) + L('M32 56 l8 10 M48 52 l8 10 M64 56 l8 10', 3) },
  baguette: { nom: 'la baguette', k: 'petit', c: 'bois', face: [50, 64, .55], d: c =>
    P('M14 86 L74 18 q10 -6 12 4 L26 92 q-10 6 -12 -6 z', c.c) + L('M34 70 l10 2 M46 56 l10 2 M58 42 l10 2', 3) },
  croissant: { nom: 'le croissant', k: 'petit', c: 'jaune', face: [50, 66, .6], d: c =>
    P('M10 74 q-2 -20 14 -26 q12 -14 26 -14 q14 0 26 14 q16 6 14 26 q-8 -6 -16 -4 q-10 10 -24 10 q-14 0 -24 -10 q-8 -2 -16 4 z', c.c) + L('M34 40 q4 14 0 28 M66 40 q-4 14 0 28', 2.5) },
  gateau: { nom: "le gâteau d'anniversaire", k: 'petit', c: 'rose', face: [50, 76, .6], d: c =>
    R(14, 58, 72, 34, 6, c.c) + R(22, 36, 56, 24, 6, '#FFF1D6') + P('M22 44 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0', 'none') + L('M50 36 V22', 3) + P('M50 22 c-5 -6 0 -12 0 -12 c0 0 5 6 0 12 z', '#FFB347') },
  cupcake: { nom: 'le cupcake', k: 'petit', c: 'violet', face: [50, 74, .6], d: c =>
    P('M24 58 h52 l-6 34 h-40 z', COULEURS.rose.c) + L('M38 60 l-2 30 M50 60 v30 M62 60 l2 30', 2) + P('M20 58 q-4 -18 14 -20 q4 -16 16 -14 q12 -2 16 14 q18 2 14 20 z', c.c) + C(50, 22, 6, '#FF7A7A') },
  donut: { nom: 'le donut', k: 'petit', c: 'rose', face: null, d: c =>
    E(50, 62, 38, 30, '#E8B57A') + P('M16 56 q34 -36 68 0 q-2 8 -8 6 q-4 6 -10 2 q-8 6 -14 0 q-8 4 -12 -2 q-8 4 -12 -2 q-8 4 -12 -4 z', c.c) + E(50, 58, 10, 7, '#fff') +
    R(32, 44, 6, 2.5, 1, '#FFDB6E') + R(62, 40, 6, 2.5, 1, '#8EE3DC') + R(48, 34, 6, 2.5, 1, '#fff') },
  tarte: { nom: 'la tarte', k: 'petit', c: 'rouge', face: null, d: c =>
    P('M8 66 q42 -28 84 0 l-6 22 h-72 z', '#E8B57A') + E(50, 66, 42, 12, c.c) + L('M20 64 l60 4 M30 58 l40 16 M40 56 l20 20', 2) },
  glace: { nom: 'la glace', k: 'petit', c: 'menthe', face: [50, 38, .6], d: c =>
    P('M32 52 L50 94 L68 52 z', '#E8B57A') + L('M38 60 l20 20 M62 60 l-18 26', 2) + C(50, 38, 20, c.c) + C(50, 18, 10, '#FF9EC7') },
  sucette: { nom: 'la sucette', k: 'petit', c: 'rose', face: null, d: c =>
    L('M50 60 V94', 4.5) + C(50, 36, 28, c.c) + L('M50 36 m-18 0 a18 18 0 1 1 18 18 a12 12 0 1 1 -12 -12 a6 6 0 1 1 6 6', 3) },
  fromage: { nom: 'le fromage', k: 'petit', c: 'jaune', face: [44, 72, .6], d: c =>
    P('M10 60 L80 34 L90 60 z', '#FFE9A8') + P('M10 60 h80 v30 h-80 z', c.c) + D(70, 76, 5, c.s) + D(24, 82, 4, c.s) + D(80, 48, 3, c.s) },
  pomme: { nom: 'la pomme', k: 'petit', c: 'rouge', face: [50, 64, .7], d: c =>
    L('M50 34 q2 -12 8 -16', 3) + P('M54 22 q12 -8 18 2 q-10 6 -18 -2 z', '#9BDB8A') + P('M50 36 q-34 -14 -36 22 q2 36 36 34 q34 2 36 -34 q-2 -36 -36 -22 z', c.c) + H('M28 50 q2 -8 8 -10') },
  fraise: { nom: 'la grosse fraise', k: 'petit', c: 'rouge', face: [50, 58, .7], d: c =>
    P('M50 92 q-38 -20 -36 -46 q2 -16 36 -14 q34 -2 36 14 q2 26 -36 46 z', c.c) + P('M28 34 q10 -18 22 -6 q12 -12 22 6 q-12 6 -22 2 q-10 4 -22 -2 z', '#7FCF6E') +
    D(34, 50, 1.8, '#FFE9A8') + D(66, 50, 1.8, '#FFE9A8') + D(40, 74, 1.8, '#FFE9A8') + D(60, 74, 1.8, '#FFE9A8') + D(50, 82, 1.8, '#FFE9A8') },

  // ─── Château et magie ───
  bougie: { nom: 'la bougie', k: 'petit', c: 'creme', face: [50, 70, .6], d: c =>
    P('M50 30 c-8 -10 0 -22 0 -22 c0 0 8 12 0 22 z', '#FFB347') + R(36, 34, 28, 52, 6, c.c) + E(50, 90, 24, 6, COULEURS.jaune.c) },
  chandelier: { nom: 'le chandelier', k: 'sol', c: 'jaune', face: null, d: c =>
    L('M50 40 V88 M20 40 q0 18 30 18 q30 0 30 -18', 4) + E(50, 90, 18, 5, c.c) +
    [20, 50, 80].map(x => R(x - 5, 22, 10, 18, 3, '#FFF1D6') + P(`M${x} 18 c-4 -5 0 -11 0 -11 c0 0 4 6 0 11 z`, '#FFB347')).join('') },
  lanterne: { nom: 'la lanterne', k: 'mur', c: 'nuit', face: null, d: c =>
    L('M50 6 v8', 3) + C(50, 16, 5, 'none') + P('M34 24 h32 l-4 8 h-24 z', c.c) + R(30, 32, 40, 46, 6, '#FFE9A8') + L('M40 32 v46 M60 32 v46', 2.5) + R(30, 78, 40, 8, 3, c.c) + D(50, 55, 8, '#FFB347') },
  couronne: { nom: 'la couronne', k: 'petit', c: 'jaune', face: [50, 74, .6], d: c =>
    P('M14 88 L10 38 L32 58 L50 26 L68 58 L90 38 L86 88 z', c.c) + D(50, 70, 5, '#FF7A7A') + C(10, 36, 4, '#9CC7FA') + C(50, 24, 4, '#FF9EC7') + C(90, 36, 4, '#9CC7FA') },
  trone: { nom: 'le trône', k: 'sol', c: 'rouge', face: [50, 42, .7], d: c =>
    P('M24 70 V20 q26 -22 52 0 v50 z', COULEURS.jaune.c) + R(30, 24, 40, 40, 10, c.c) + R(16, 62, 68, 14, 6, COULEURS.jaune.c) + R(22, 76, 8, 18, 2, COULEURS.jaune.s) + R(70, 76, 8, 18, 2, COULEURS.jaune.s) + C(50, 10, 5, '#FF9EC7') },
  epee: { nom: "l'épée", k: 'mur', c: 'gris', face: null, d: c =>
    P('M46 64 V14 l4 -8 l4 8 v50 z', '#EEF2FA') + R(30, 62, 40, 8, 4, COULEURS.jaune.c) + R(45, 70, 10, 18, 3, COULEURS.brun.c) + C(50, 92, 5, COULEURS.jaune.c) + H('M50 18 v40') },
  bouclier: { nom: 'le bouclier', k: 'mur', c: 'bleu', face: [50, 46, .7], d: c =>
    P('M50 8 q24 10 38 8 q2 50 -38 76 q-40 -26 -38 -76 q14 2 38 -8 z', c.c) + P('M50 18 v64 q-26 -20 -28 -56 q14 0 28 -8', COULEURS.blanc.c) },
  drapeau: { nom: 'le drapeau', k: 'sol', c: 'violet', face: [44, 28, .55], d: c =>
    L('M22 10 V92', 4) + C(22, 8, 4, COULEURS.jaune.c) + P('M24 12 q20 -6 40 4 q14 6 26 0 v32 q-12 6 -26 0 q-20 -10 -40 -4 z', c.c) + E(22, 92, 12, 4, COULEURS.gris.c) },
  boule_cristal: { nom: 'la boule de cristal', k: 'petit', c: 'violet', face: null, d: c =>
    C(50, 48, 32, '#E4DBFF') + D(40, 44, 3, '#fff') + D(58, 56, 2, '#fff') + D(52, 36, 2, c.s) + P('M24 78 q26 -12 52 0 l6 14 h-64 z', COULEURS.brun.c) + H('M30 36 q4 -10 14 -14') },
  potion: { nom: 'la potion', k: 'petit', c: 'rose', face: [50, 70, .6], d: c =>
    R(42, 10, 16, 10, 3, COULEURS.brun.c) + P('M42 20 h16 v14 q24 8 24 32 q0 26 -32 26 q-32 0 -32 -26 q0 -24 24 -32 z', '#EAF6FF') + P('M20 62 q30 -10 60 0 q0 26 -30 26 q-30 0 -30 -26 z', c.c) + D(40, 52, 3, '#fff') },
  chaudron: { nom: 'le chaudron', k: 'sol', c: 'nuit', face: [50, 70, .7], d: c =>
    D(36, 34, 7, '#9BDB8A') + D(56, 26, 9, '#9BDB8A') + D(68, 38, 6, '#9BDB8A') + E(50, 46, 40, 8, '#7FCF6E') + P('M10 46 q0 46 40 46 q40 0 40 -46 z', c.c) + L('M24 88 l-6 6 M76 88 l6 6', 4) },
  parchemin: { nom: 'le parchemin', k: 'petit', c: 'creme', face: null, d: c =>
    R(22, 22, 56, 60, 4, c.c) + R(16, 14, 68, 12, 6, c.s) + R(16, 78, 68, 12, 6, c.s) + L('M32 38 h36 M32 50 h30 M32 62 h36', 2.5) },
  baton_magique: { nom: 'la baguette magique', k: 'petit', c: 'jaune', face: [50, 30, .55], d: c =>
    L('M28 92 L46 48', 5) + P('M50 8 l9 18 l20 3 l-15 13 l4 20 l-18 -10 l-18 10 l4 -20 l-15 -13 l20 -3 z', c.c) },
  armure: { nom: "l'armure", k: 'sol', c: 'gris', face: null, d: c =>
    P('M34 8 h32 v30 h-32 z', c.c) + L('M38 24 h24', 3) + P('M30 40 h40 l6 30 h-52 z', c.c) + R(12, 40, 16, 34, 7, c.c) + R(72, 40, 16, 34, 7, c.c) + R(34, 70, 13, 24, 4, c.s) + R(53, 70, 13, 24, 4, c.s) + P('M50 4 q10 -2 12 6', 'none') },

  // ─── Sciences ───
  telescope: { nom: 'le télescope', k: 'sol', c: 'bleu', face: null, d: c =>
    L('M50 54 L30 94 M50 54 L70 94 M50 54 V94', 3.5) + P('M14 50 L74 18 l8 14 L22 64 z', c.c) + R(70, 14, 18, 22, 4, c.s) + C(50, 44, 5, COULEURS.jaune.c) },
  microscope: { nom: 'le microscope', k: 'petit', c: 'menthe', face: null, d: c =>
    R(18, 84, 64, 10, 4, c.s) + P('M62 84 q16 -26 -2 -52', 'none') + L('M62 84 q16 -26 -2 -52', 6) + R(32, 18, 18, 46, 5, c.c) + R(26, 66, 34, 8, 3, COULEURS.gris.c) + R(34, 8, 14, 12, 3, c.s) },
  eprouvette: { nom: 'les éprouvettes', k: 'petit', c: 'bois', face: null, d: c =>
    R(10, 56, 80, 10, 3, c.c) + L('M14 66 v26 M86 66 v26', 4) +
    [[24, '#FF9EC7'], [42, '#8EE3DC'], [60, '#FFDB6E'], [76, '#C3A2EC']].map(([x, col]) => P(`M${x - 6} 18 h12 v48 a6 6 0 0 1 -12 0 z`, '#EAF6FF') + P(`M${x - 6} 46 h12 v20 a6 6 0 0 1 -12 0 z`, col)).join('') },
  robot: { nom: 'le robot', k: 'sol', c: 'gris', face: [50, 34, .8], d: c =>
    L('M50 16 V6', 3) + C(50, 6, 4, '#FF7A7A') + R(26, 16, 48, 36, 10, c.c) + R(30, 54, 40, 30, 8, c.c) + R(38, 60, 24, 10, 3, '#8EE3DC') + L('M30 62 L16 72 M70 62 L84 72', 4) + R(34, 84, 10, 10, 2, c.s) + R(56, 84, 10, 10, 2, c.s) },
  fusee: { nom: 'la fusée', k: 'sol', c: 'blanc', face: null, d: c =>
    P('M38 78 L22 92 L30 64 z', '#FF7A7A') + P('M62 78 L78 92 L70 64 z', '#FF7A7A') + P('M50 4 q22 20 18 74 h-36 q-4 -54 18 -74 z', c.c) + C(50, 38, 9, '#9CC7FA') + P('M42 80 h16 l-8 14 z', '#FFB347') },
  planete: { nom: 'la planète', k: 'mur', c: 'corail', face: [50, 52, .7], d: c =>
    C(50, 50, 26, c.c) + P('M6 60 q44 -36 88 -20 q4 6 -8 10', 'none') + L('M8 62 q42 -30 86 -22', 4) + H('M38 34 q6 -6 14 -6') },
  aimant: { nom: "l'aimant", k: 'petit', c: 'rouge', face: null, d: c =>
    P('M16 30 v26 a34 34 0 0 0 68 0 v-26 h-20 v26 a14 14 0 0 1 -28 0 v-26 z', c.c) + R(16, 18, 20, 14, 2, '#EEF2FA') + R(64, 18, 20, 14, 2, '#EEF2FA') },
  ampoule: { nom: "l'ampoule", k: 'petit', c: 'jaune', face: [50, 44, .7], d: c =>
    C(50, 42, 28, c.c) + R(38, 66, 24, 20, 4, COULEURS.gris.c) + L('M38 74 h24 M38 80 h24', 2) + H('M34 30 q4 -8 12 -10') },
  engrenage: { nom: "l'engrenage", k: 'mur', c: 'gris', face: [50, 50, .7], d: c =>
    P(Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; const p = (r, da) => `${(50 + r * Math.cos(a + da)).toFixed(1)} ${(50 + r * Math.sin(a + da)).toFixed(1)}`; return `${i ? 'L' : 'M'}${p(32, -.22)} L${p(42, -.16)} L${p(42, .16)} L${p(32, .22)}`; }).join(' ') + ' z', c.c) + C(50, 50, 22, c.c) },
  ordinateur: { nom: "l'ordinateur", k: 'petit', c: 'gris', face: [50, 42, .7], d: c =>
    R(12, 14, 76, 54, 6, c.c) + R(18, 20, 64, 42, 3, '#CFE8FF') + R(42, 68, 16, 12, 2, c.s) + R(26, 80, 48, 10, 4, c.c) },
  antenne: { nom: "l'antenne", k: 'sol', c: 'blanc', face: null, d: c =>
    P('M14 22 q6 44 50 50 z', c.c) + L('M38 46 L60 24', 3) + C(62, 22, 5, '#FF7A7A') + L('M44 66 L40 92 h22 L54 70', 4) },
  sablier: { nom: 'le sablier', k: 'petit', c: 'bois', face: null, d: c =>
    R(22, 8, 56, 10, 4, c.c) + R(22, 82, 56, 10, 4, c.c) + P('M30 18 h40 q0 22 -16 32 q16 10 16 32 h-40 q0 -22 16 -32 q-16 -10 -16 -32 z', '#EAF6FF') + P('M38 82 q12 -14 24 0 z', '#FFDB6E') + P('M40 30 h20 q-4 10 -10 14 q-6 -4 -10 -14 z', '#FFDB6E') },
  boussole: { nom: 'la boussole', k: 'petit', c: 'jaune', face: null, d: c =>
    C(50, 54, 36, c.c) + C(50, 54, 28, '#fff') + P('M50 30 l7 24 h-14 z', '#FF7A7A') + P('M50 78 l7 -24 h-14 z', COULEURS.bleu.c) + C(50, 16, 5, c.c) },

  // ─── Musique et école ───
  piano: { nom: 'le piano', k: 'sol', c: 'nuit', face: null, d: c =>
    R(10, 20, 80, 50, 6, c.c) + R(10, 54, 80, 14, 2, '#fff') + L('M20 54 v14 M30 54 v14 M40 54 v14 M50 54 v14 M60 54 v14 M70 54 v14 M80 54 v14', 2) +
    [25, 35, 55, 65, 75].map(x => `<rect x="${x - 2.5}" y="54" width="5" height="8" fill="${INK}"/>`).join('') + R(16, 70, 8, 24, 2, c.s) + R(76, 70, 8, 24, 2, c.s) + R(30, 26, 40, 20, 3, '#fff') },
  guitare: { nom: 'la guitare', k: 'sol', c: 'corail', face: null, d: c =>
    R(46, 4, 8, 44, 3, COULEURS.brun.c) + P('M50 40 q-18 -2 -18 14 q0 8 6 12 q-14 6 -12 18 q2 12 24 12 q22 0 24 -12 q2 -12 -12 -18 q6 -4 6 -12 q0 -16 -18 -14 z', c.c) + C(50, 64, 6, INK) + L('M47 10 v74 M53 10 v74', 1.2) },
  tambour: { nom: 'le tambour', k: 'sol', c: 'rouge', face: null, d: c =>
    R(16, 42, 68, 46, 6, c.c) + E(50, 42, 34, 10, '#fff') + L('M18 50 L36 84 L52 50 L68 84 L82 50', 2.5) + L('M30 10 L48 38 M72 12 L56 38', 3.5) + C(30, 10, 4, COULEURS.bois.c) + C(72, 12, 4, COULEURS.bois.c) },
  trompette: { nom: 'la trompette', k: 'petit', c: 'jaune', face: null, d: c =>
    P('M10 56 h52 l26 -20 v44 l-26 -20 z', c.c) + R(26, 40, 8, 14, 2, c.s) + R(38, 40, 8, 14, 2, c.s) + R(50, 40, 8, 14, 2, c.s) + R(4, 52, 8, 8, 2, c.s) },
  violon: { nom: 'le violon', k: 'mur', c: 'brun', face: null, d: c =>
    R(46, 4, 8, 30, 3, INK) + P('M50 30 q-20 0 -18 16 q2 6 6 8 q-10 4 -10 16 q2 18 22 18 q20 0 22 -18 q0 -12 -10 -16 q4 -2 6 -8 q2 -16 -18 -16 z', c.c) + L('M44 54 q-3 4 0 8 M56 54 q3 4 0 8', 2) + L('M80 18 L24 90', 2.5) },
  micro: { nom: 'le micro', k: 'sol', c: 'gris', face: null, d: c =>
    L('M50 34 V88', 4) + E(50, 92, 20, 5, c.s) + R(40, 6, 20, 30, 10, c.c) + L('M42 16 h16 M42 24 h16', 1.8) },
  tableau_noir: { nom: 'le tableau noir', k: 'mur', c: 'vert', face: null, d: c =>
    R(6, 14, 88, 62, 4, COULEURS.bois.c) + R(12, 20, 76, 50, 2, '#3F6B57') + L('M22 40 q6 -10 12 0 t12 0 M58 32 l14 14 M72 32 l-14 14', 2.5).replace(INK, '#fff') + R(30, 76, 40, 6, 2, '#fff') },
  globe: { nom: 'le globe', k: 'petit', c: 'bleu', face: null, d: c =>
    L('M28 18 q-18 30 4 54', 3.5) + C(50, 44, 28, c.c) + P('M36 28 q10 -4 14 4 q-4 8 -12 6 q-6 6 -10 0 z', '#9BDB8A') + P('M54 50 q12 -4 16 6 q-6 12 -16 8 z', '#9BDB8A') + L('M50 72 V84', 4) + R(32, 84, 36, 8, 4, COULEURS.bois.c) },
  cartable: { nom: 'le cartable', k: 'sol', c: 'corail', face: [50, 60, .7], d: c =>
    P('M36 30 q14 -18 28 0', 'none') + L('M36 30 q14 -18 28 0', 4) + R(16, 30, 68, 62, 12, c.c) + P('M16 50 q34 16 68 0 v-8 q0 -12 -12 -12 h-44 q-12 0 -12 12 z', c.s) + R(44, 52, 12, 10, 3, COULEURS.jaune.c) },
  crayon: { nom: 'le gros crayon', k: 'petit', c: 'jaune', face: [50, 46, .6], d: c =>
    P('M38 88 L50 98 L62 88 z', '#FFE9A8') + R(38, 18, 24, 70, 2, c.c) + R(38, 10, 24, 10, 3, COULEURS.rose.c) + L('M46 22 v62 M54 22 v62', 1.5) },
  livres: { nom: 'la pile de livres', k: 'petit', c: 'violet', face: null, d: c =>
    R(12, 74, 76, 18, 4, c.c) + R(18, 56, 66, 18, 4, COULEURS.menthe.c) + R(14, 38, 70, 18, 4, COULEURS.corail.c) + R(22, 20, 58, 18, 4, COULEURS.jaune.c) + L('M78 78 h6 M72 60 h8 M72 42 h8 M70 24 h6', 2) },
  cloche: { nom: 'la cloche', k: 'mur', c: 'jaune', face: [50, 52, .7], d: c =>
    C(50, 12, 6, 'none') + P('M50 16 q-28 0 -28 34 v18 l-10 10 h76 l-10 -10 v-18 q0 -34 -28 -34 z', c.c) + C(50, 84, 8, c.s) + H('M34 40 q2 -12 10 -16') },
  pinceaux: { nom: 'le pot de pinceaux', k: 'petit', c: 'bleu', face: [50, 74, .6], d: c =>
    L('M38 58 L28 12 M50 58 V8 M62 58 L74 14', 3.5) + P('M24 10 l8 -2 l2 10 l-8 2 z', '#FF9EC7') + P('M46 4 h8 v10 h-8 z', '#FFDB6E') + P('M70 12 l8 2 l-2 10 l-8 -2 z', '#9BDB8A') + R(28, 56, 44, 38, 8, c.c) },
  chevalet: { nom: 'le chevalet', k: 'sol', c: 'bois', face: null, d: c =>
    L('M30 94 L48 8 M70 94 L52 8 M50 50 V94', 4) + R(18, 14, 64, 48, 3, '#fff') + D(40, 34, 8, '#FF9EC7') + D(58, 42, 9, '#9CC7FA') + D(50, 30, 6, '#FFDB6E') + R(16, 60, 68, 6, 2, c.c) },
  palette: { nom: 'la palette de peinture', k: 'mur', c: 'bois', face: null, d: c =>
    P('M50 14 q40 0 40 34 q0 26 -26 26 q-8 0 -8 8 q0 12 -14 12 q-38 0 -38 -40 q0 -40 46 -40 z', c.c) + C(32, 70, 7, '#fff') +
    D(34, 38, 7, '#FF7A7A') + D(52, 30, 7, '#FFDB6E') + D(70, 38, 7, '#9CC7FA') + D(74, 56, 6, '#9BDB8A') + D(24, 54, 6, '#C3A2EC') },

  // ─── Mode et beauté ───
  seche_cheveux: { nom: 'le sèche-cheveux', k: 'petit', c: 'rose', face: [40, 38, .65], d: c =>
    R(46, 50, 16, 40, 6, c.c) + P('M14 26 q0 -18 26 -18 h34 v38 h-34 q-26 0 -26 -20 z', c.c) + E(80, 27, 8, 20, c.s) + L('M92 18 l6 -4 M94 28 h6 M92 38 l6 4', 2.5) },
  ciseaux: { nom: 'les ciseaux', k: 'petit', c: 'menthe', face: null, d: c =>
    P('M48 52 L84 10 l6 6 L56 58 z', '#EEF2FA') + P('M52 52 L16 10 l-6 6 L44 58 z', '#EEF2FA') + C(32, 76, 14, c.c) + C(68, 76, 14, c.c) + C(32, 76, 6, '#fff') + C(68, 76, 6, '#fff') + C(50, 56, 4, INK) },
  peigne: { nom: 'le peigne', k: 'petit', c: 'violet', face: null, d: c =>
    R(10, 34, 80, 18, 6, c.c) + Array.from({ length: 11 }, (_, i) => `<rect x="${14 + i * 7}" y="50" width="4" height="${i < 5 ? 22 : 30}" rx="2" fill="${c.c}" ${O}/>`).join('') },
  vernis: { nom: 'le vernis à ongles', k: 'petit', c: 'rouge', face: [50, 72, .65], d: c =>
    R(40, 8, 20, 30, 5, INK) + R(30, 38, 40, 54, 12, c.c) + H('M38 50 v14') },
  rouge_levres: { nom: 'le rouge à lèvres', k: 'petit', c: 'rose', face: null, d: c =>
    P('M38 40 v-20 q12 -14 24 -6 v26 z', '#FF5C93') + R(34, 38, 32, 14, 3, COULEURS.jaune.c) + R(30, 52, 40, 40, 6, c.c) },
  parfum: { nom: 'le parfum', k: 'petit', c: 'violet', face: [50, 66, .65], d: c =>
    R(42, 14, 16, 16, 4, COULEURS.jaune.c) + L('M58 20 h14', 3) + C(78, 20, 6, COULEURS.rose.c) + R(18, 30, 64, 62, 18, c.c) + H('M28 44 q2 -6 8 -6') },
  chapeau: { nom: 'le chapeau à ruban', k: 'petit', c: 'creme', face: null, d: c =>
    E(50, 74, 44, 14, c.c) + P('M24 72 q0 -46 26 -46 q26 0 26 46 z', c.c) + P('M25 62 q25 8 50 0 v-10 q-25 8 -50 0 z', COULEURS.rose.c) + C(72, 56, 6, COULEURS.rose.s) },
  robe: { nom: 'la robe', k: 'mur', c: 'rose', face: [50, 54, .7], d: c =>
    L('M50 12 q-6 -6 0 -10 q6 2 2 8 L22 24 h56 L50 10', 2.5) + P('M38 24 h24 l-2 20 l22 48 h-64 l22 -48 z', c.c) + L('M36 52 q14 6 28 0', 2) },
  chaussure: { nom: 'la chaussure à talon', k: 'petit', c: 'rouge', face: null, d: c =>
    P('M10 52 q30 6 50 22 q16 12 30 6 q4 10 -6 14 h-44 q-6 -16 -24 -10 v-22 z', c.c) + R(10, 66, 8, 28, 2, c.s) + C(66, 74, 4, COULEURS.jaune.c) },
  sac_main: { nom: 'le sac à main', k: 'petit', c: 'violet', face: [50, 66, .7], d: c =>
    L('M32 44 q0 -30 18 -30 q18 0 18 30', 4) + P('M14 44 h72 l-6 48 h-60 z', c.c) + R(44, 44, 12, 10, 3, COULEURS.jaune.c) },
  collier: { nom: 'le collier de perles', k: 'mur', c: 'blanc', face: null, d: c =>
    Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (0.1 + 0.8 * i / 12); return C((50 - 38 * Math.cos(a)).toFixed(1), (20 + 50 * Math.sin(a)).toFixed(1), 5.5, c.c); }).join('') + P('M50 74 l10 10 l-10 10 l-10 -10 z', COULEURS.rose.c) },
  mannequin: { nom: 'le mannequin', k: 'sol', c: 'creme', face: null, d: c =>
    L('M50 64 V90 M36 92 h28', 4) + P('M30 14 q20 -10 40 0 l-4 20 q8 10 4 30 h-32 q-4 -20 4 -30 z', c.c) + L('M30 30 q20 8 40 0', 2) + C(50, 8, 5, COULEURS.bois.c) },
  diamant: { nom: 'le diamant', k: 'petit', c: 'bleu', face: [50, 56, .6], d: c =>
    P('M26 26 h48 l16 18 l-40 46 l-40 -46 z', c.c) + L('M10 44 h80 M38 26 l-6 18 l18 46 l18 -46 l-6 -18', 2) },

  // ─── Nature et extérieur ───
  arbre: { nom: "l'arbre", k: 'sol', c: 'vert', face: [50, 40, .8], d: c =>
    R(42, 58, 16, 36, 4, COULEURS.brun.c) + P('M50 6 q22 0 26 18 q16 6 12 24 q-2 18 -20 18 h-36 q-18 0 -20 -18 q-4 -18 12 -24 q4 -18 26 -18 z', c.c) + D(30, 30, 4, '#FF7A7A') + D(70, 50, 4, '#FF7A7A') },
  sapin: { nom: 'le sapin', k: 'sol', c: 'vert', face: [50, 62, .65], d: c =>
    R(44, 78, 12, 16, 2, COULEURS.brun.c) + P('M50 6 L72 36 h-10 L80 60 h-12 L88 80 h-76 L32 60 h-12 L38 36 h-10 z', c.s) + P('M50 2 l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z', COULEURS.jaune.c) },
  fleur: { nom: 'la grande fleur', k: 'sol', c: 'rose', face: [50, 30, .65], d: c =>
    L('M50 46 V92', 4) + P('M50 72 q-20 -2 -24 -16 q16 -2 24 16 z', '#9BDB8A') + P('M50 80 q20 -2 24 -16 q-16 -2 -24 16 z', '#9BDB8A') +
    [0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="16" rx="11" ry="16" fill="${c.c}" ${O} transform="rotate(${a} 50 30)"/>`).join('') + C(50, 30, 12, COULEURS.jaune.c) },
  tournesol: { nom: 'le tournesol', k: 'sol', c: 'jaune', face: [50, 32, .6], d: c =>
    L('M50 50 V94', 4) + P('M50 76 q-22 -4 -24 -18 q18 -2 24 18 z', '#9BDB8A') +
    Array.from({ length: 10 }, (_, i) => `<ellipse cx="50" cy="10" rx="7" ry="13" fill="${c.c}" ${O} transform="rotate(${i * 36} 50 32)"/>`).join('') + C(50, 32, 15, COULEURS.brun.c) },
  cactus: { nom: 'le cactus', k: 'sol', c: 'vert', face: [50, 42, .65], d: c =>
    P('M28 50 v-14 q0 -8 6 -8 q6 0 6 8 v14', c.c) + P('M60 60 v-20 q0 -8 6 -8 q6 0 6 8 v20', c.c) + R(36, 12, 28, 66, 14, c.c) + C(50, 10, 5, COULEURS.rose.c) + P('M28 74 h44 l-6 20 h-32 z', COULEURS.corail.c) },
  champignon: { nom: 'le champignon', k: 'sol', c: 'rouge', face: [50, 72, .65], d: c =>
    R(36, 52, 28, 42, 10, '#FFF1D6') + P('M8 56 q4 -46 42 -46 q38 0 42 46 z', c.c) + D(30, 32, 6, '#fff') + D(58, 24, 5, '#fff') + D(72, 42, 6, '#fff') + D(46, 44, 4, '#fff') },
  buisson: { nom: 'le buisson de roses', k: 'sol', c: 'vert', face: [50, 66, .65], d: c =>
    P('M12 92 q-8 -30 14 -36 q2 -24 24 -22 q10 -16 26 -4 q20 2 16 26 q14 14 0 36 z', c.c) + D(30, 54, 6, '#FF7A7A') + D(56, 40, 6, '#FF7A7A') + D(74, 60, 6, '#FF7A7A') + D(40, 76, 5, '#FF9EC7') },
  fontaine: { nom: 'la fontaine', k: 'sol', c: 'bleu', face: null, d: c =>
    P('M8 70 h84 v14 q0 10 -10 10 h-64 q-10 0 -10 -10 z', COULEURS.gris.c) + E(50, 70, 42, 8, c.c) + R(44, 38, 12, 32, 3, COULEURS.gris.c) + E(50, 38, 18, 5, c.c) +
    L('M50 30 q-14 -24 -26 4 M50 30 q14 -24 26 4 M50 34 V14', 3).replace(new RegExp(INK, 'g'), c.s) },
  banc: { nom: 'le banc', k: 'sol', c: 'bois', face: null, d: c =>
    R(10, 30, 80, 10, 3, c.c) + R(10, 44, 80, 10, 3, c.c) + R(6, 58, 88, 10, 3, c.c) + L('M18 68 v26 M82 68 v26 M18 30 v28 M82 30 v28', 4) },
  parasol: { nom: 'le parasol', k: 'sol', c: 'corail', face: null, d: c =>
    L('M50 20 V92', 4) + E(50, 92, 16, 4, COULEURS.gris.c) + P('M6 40 q44 -40 88 0 q-11 -6 -22 0 q-11 -6 -22 0 q-11 -6 -22 0 q-11 -6 -22 0 z', c.c) + L('M28 40 q22 -34 22 -34 q0 0 0 34', 2) },
  nuage: { nom: 'le nuage', k: 'mur', c: 'blanc', face: [50, 58, .75], d: c =>
    P('M20 74 q-16 0 -14 -16 q2 -14 18 -12 q2 -20 24 -20 q18 0 24 16 q20 -4 22 16 q2 16 -16 16 z', c.c) },
  soleil: { nom: 'le soleil', k: 'mur', c: 'jaune', face: [50, 50, .8], d: c =>
    Array.from({ length: 10 }, (_, i) => `<path d="M50 6 l6 14 h-12 z" fill="${COULEURS.corail.c}" ${O} transform="rotate(${i * 36} 50 50)"/>`).join('') + C(50, 50, 28, c.c) },
  lune: { nom: 'la lune', k: 'mur', c: 'jaune', face: [44, 56, .65], d: c =>
    P('M64 8 q-38 4 -40 44 q2 40 44 40 q-26 -10 -26 -42 q0 -28 22 -42 z', c.c) + D(76, 26, 3, '#fff') + D(84, 50, 2, '#fff') },
  etoile: { nom: "l'étoile", k: 'mur', c: 'jaune', face: [50, 56, .7], d: c =>
    P('M50 6 l13 28 l30 4 l-22 21 l6 30 l-27 -15 l-27 15 l6 -30 l-22 -21 l30 -4 z', c.c) },
  arrosoir: { nom: "l'arrosoir", k: 'petit', c: 'vert', face: [42, 66, .65], d: c =>
    P('M66 56 L90 30 l6 6 L76 66', c.c) + L('M30 40 q12 -24 24 0', 4) + R(14, 40, 56, 52, 10, c.c) + E(92, 32, 6, 4, c.s) },
  nichoir: { nom: 'le nichoir', k: 'mur', c: 'bleu', face: null, d: c =>
    P('M14 40 L50 8 L86 40 z', COULEURS.rouge.c) + R(22, 38, 56, 50, 4, c.c) + C(50, 58, 10, INK) + L('M50 76 v8', 3) + C(50, 58, 4, COULEURS.jaune.c).replace(O, '') },
  cage: { nom: 'la cage à oiseau', k: 'sol', c: 'jaune', face: null, d: c =>
    C(50, 8, 4, 'none') + P('M18 80 v-40 q0 -28 32 -28 q32 0 32 28 v40 z', 'none') + L('M18 80 v-40 q0 -28 32 -28 q32 0 32 28 v40 M34 80 V20 M50 80 V12 M66 80 V20', 2.5) + R(12, 80, 76, 12, 4, c.c) +
    E(50, 54, 10, 8, COULEURS.menthe.c) + D(54, 52, 1.8, INK) },

  // ─── Jeux et sport ───
  ballon: { nom: 'le ballon', k: 'sol', c: 'rouge', face: [50, 64, .7], d: c =>
    C(50, 62, 30, c.c) + P('M22 52 q28 10 56 0', 'none') + L('M22 54 q28 12 56 0', 6).replace(INK, '#fff') + H('M36 42 q4 -6 10 -6') },
  ballons: { nom: 'les ballons de fête', k: 'mur', c: 'rose', face: null, d: c =>
    L('M50 92 q-8 -20 -20 -42 M50 92 q4 -24 4 -48 M50 92 q12 -20 22 -38', 2) + E(28, 34, 15, 19, c.c) + E(54, 26, 15, 19, COULEURS.jaune.c) + E(74, 40, 15, 19, COULEURS.menthe.c) },
  cerf_volant: { nom: 'le cerf-volant', k: 'mur', c: 'violet', face: [44, 34, .6], d: c =>
    P('M44 4 L74 34 L44 74 L14 34 z', c.c) + L('M44 4 V74 M14 34 H74', 2) + L('M44 74 q10 8 0 14 q-10 6 4 10', 2.5) + P('M50 82 l6 -4 l0 8 z', COULEURS.rose.c) },
  velo: { nom: 'le vélo', k: 'sol', c: 'menthe', face: null, d: c =>
    C(24, 70, 18, 'none') + C(76, 70, 18, 'none') + L('M24 70 L42 40 H70 L76 70 M42 40 L54 70 L70 40 M54 70 H24 M40 32 h10 M66 30 l6 -6 h8', 4).replace(INK, c.s) + C(54, 70, 4, INK) },
  trottinette: { nom: 'la trottinette', k: 'sol', c: 'rose', face: null, d: c =>
    L('M70 12 L76 80 M62 12 h18', 4.5) + R(16, 76, 62, 8, 4, c.c) + C(22, 86, 8, COULEURS.gris.c) + C(76, 86, 8, COULEURS.gris.c) },
  toboggan: { nom: 'le toboggan', k: 'sol', c: 'jaune', face: null, d: c =>
    L('M16 94 V22 M30 94 V22 M16 36 h14 M16 52 h14 M16 68 h14 M16 84 h14', 3.5) + R(12, 16, 22, 8, 3, COULEURS.rouge.c) + P('M30 22 q20 2 34 40 q8 22 26 26 v8 q-24 -2 -34 -30 q-12 -32 -26 -36 z', c.c) },
  nounours: { nom: "l'ours en peluche", k: 'sol', c: 'bois', face: [50, 38, .65], d: c =>
    C(30, 18, 9, c.c) + C(70, 18, 9, c.c) + E(50, 74, 24, 20, c.c) + C(26, 66, 9, c.c) + C(74, 66, 9, c.c) + C(34, 90, 9, c.c) + C(66, 90, 9, c.c) + C(50, 38, 24, c.c) + E(50, 76, 12, 10, '#FFF1D6') },
  cubes: { nom: 'les cubes', k: 'petit', c: 'bleu', face: null, d: c =>
    R(10, 56, 36, 36, 4, c.c) + R(52, 56, 36, 36, 4, COULEURS.rouge.c) + R(30, 18, 36, 36, 4, COULEURS.jaune.c) +
    `<text x="28" y="84" font-size="22" font-weight="900" text-anchor="middle" fill="#fff" stroke="${INK}" stroke-width="1.5">A</text><text x="70" y="84" font-size="22" font-weight="900" text-anchor="middle" fill="#fff" stroke="${INK}" stroke-width="1.5">B</text><text x="48" y="46" font-size="22" font-weight="900" text-anchor="middle" fill="#fff" stroke="${INK}" stroke-width="1.5">C</text>` },
  toupie: { nom: 'la toupie', k: 'petit', c: 'violet', face: [50, 50, .6], d: c =>
    R(46, 10, 8, 18, 3, COULEURS.bois.c) + P('M14 44 q36 -24 72 0 L52 90 h-4 z', c.c) + L('M16 46 q34 12 68 0', 3).replace(INK, '#fff') },
  quilles: { nom: 'les quilles', k: 'sol', c: 'blanc', face: null, d: c =>
    [[26, 40], [50, 34], [74, 40]].map(([x, y]) => P(`M${x} ${y} q-8 0 -8 10 q0 8 4 14 q-8 10 -6 24 q2 10 10 10 q8 0 10 -10 q2 -14 -6 -24 q4 -6 4 -14 q0 -10 -8 -10 z`, c.c) + L(`M${x - 5} ${y + 22} h10`, 3).replace(INK, '#FF7A7A')).join('') },

  // ─── Musée ───
  statue: { nom: 'la statue', k: 'sol', c: 'blanc', face: [50, 30, .65], d: c =>
    R(30, 62, 40, 32, 3, COULEURS.gris.c) + R(26, 58, 48, 8, 2, COULEURS.gris.s) + P('M32 58 q0 -16 18 -16 q18 0 18 16 z', c.c) + C(50, 30, 16, c.c) + P('M34 22 q16 -16 32 0 q-16 -6 -32 0 z', '#9BDB8A') },
  colonne: { nom: 'la colonne', k: 'sol', c: 'creme', face: null, d: c =>
    R(18, 6, 64, 12, 3, c.c) + P('M14 18 q-6 6 4 6 h64 q10 0 4 -6 z', c.c) + R(28, 24, 44, 60, 2, c.c) + L('M38 26 v56 M50 26 v56 M62 26 v56', 2) + R(20, 84, 60, 10, 2, c.c) },
  amphore: { nom: "l'amphore", k: 'sol', c: 'corail', face: [50, 54, .7], d: c =>
    L('M36 18 q-16 6 -4 22 M64 18 q16 6 4 22', 3.5) + P('M40 8 h20 v10 q24 10 24 36 q0 30 -26 40 h-16 q-26 -10 -26 -40 q0 -26 24 -36 z', c.c) + L('M24 44 q26 8 52 0', 2.5) },
  dinosaure: { nom: 'le dinosaure', k: 'sol', c: 'vert', face: [76, 26, .55], d: c =>
    P('M6 76 q20 -4 30 -20 q10 -20 30 -24 q2 -14 14 -16 q14 0 16 12 q0 8 -10 8 h-6 q2 16 -8 30 q-6 10 -6 26 h-10 v-14 h-16 v14 h-10 q-2 -18 -10 -14 q-10 4 -20 -2 z', c.c) +
    P('M44 36 l4 -10 l6 8 l4 -10 l6 8', 'none').replace('fill="none"', `fill="${COULEURS.jaune.c}"`) },
  os: { nom: "l'os de dinosaure", k: 'petit', c: 'creme', face: null, d: c =>
    P('M22 34 q-14 -12 -2 -22 q10 -4 12 8 q8 -10 18 0 q4 12 -8 14 L72 66 q12 -4 16 8 q2 12 -12 12 q2 12 -10 12 q-12 -2 -8 -14 z', c.c) },
  coquillage: { nom: 'le coquillage', k: 'petit', c: 'rose', face: [50, 62, .6], d: c =>
    P('M50 88 L12 52 q-4 -36 38 -42 q42 6 38 42 z', c.c) + L('M50 88 L30 22 M50 88 V12 M50 88 L70 22 M50 88 L16 44 M50 88 L84 44', 2) + R(40, 84, 20, 8, 3, c.s) },
  pyramide: { nom: 'la pyramide', k: 'petit', c: 'jaune', face: [44, 66, .6], d: c =>
    P('M50 10 L92 88 H8 z', c.c) + P('M50 10 L62 88 H92 z', c.s) + L('M24 60 h46 M36 38 h22', 2) },
  masque: { nom: 'le masque', k: 'mur', c: 'blanc', face: null, d: c =>
    P('M14 22 q36 -16 72 0 q4 44 -36 66 q-40 -22 -36 -66 z', c.c) + P('M28 40 q8 -8 16 0 q-8 6 -16 0 z', INK) + P('M56 40 q8 -8 16 0 q-8 6 -16 0 z', INK) + P('M36 60 q14 14 28 0 q-14 6 -28 0 z', COULEURS.rouge.c) + E(28, 52, 5, 3, COULEURS.rose.c).replace(O, '') + E(72, 52, 5, 3, COULEURS.rose.c).replace(O, '') },
  carte_tresor: { nom: 'la carte au trésor', k: 'mur', c: 'creme', face: null, d: c =>
    P('M8 22 l28 -8 l28 8 l28 -8 v64 l-28 8 l-28 -8 l-28 8 z', c.c) + L('M36 14 v64 M64 22 v64', 2) + L('M18 62 q14 -18 26 -6 q12 10 22 -10', 2.5) + L('M68 38 l10 10 M78 38 l-10 10', 3.5).replace(INK, '#E5484D') },

  // ─── Un peu de tout ───
  valise: { nom: 'la valise', k: 'sol', c: 'corail', face: [50, 64, .7], d: c =>
    R(36, 22, 28, 12, 5, 'none') + R(10, 32, 80, 58, 10, c.c) + L('M30 32 v58 M70 32 v58', 3) + D(24, 92, 4, INK) + D(76, 92, 4, INK) },
  parapluie: { nom: 'le parapluie', k: 'sol', c: 'bleu', face: [50, 26, .55], d: c =>
    L('M50 40 V84 q0 10 -10 10 q-8 0 -8 -8', 4) + P('M6 42 q44 -50 88 0 q-11 -8 -22 0 q-11 -8 -22 0 q-11 -8 -22 0 q-11 -8 -22 0 z', c.c) + C(50, 8, 3, c.s) },
  echelle: { nom: "l'échelle", k: 'sol', c: 'bois', face: null, d: c =>
    L('M30 94 L38 6 M70 94 L62 6', 5).replace(INK, c.s) + L('M31 80 h38 M33 62 h34 M35 44 h30 M37 26 h26', 4) },
  tonneau: { nom: 'le tonneau', k: 'sol', c: 'bois', face: [50, 58, .7], d: c =>
    P('M22 12 q-10 40 0 80 h56 q10 -40 0 -80 z', c.c) + L('M18 30 q32 6 64 0 M16 74 q34 6 68 0', 4).replace(INK, COULEURS.gris.s) + E(50, 12, 28, 5, c.s) },
  caisse: { nom: 'la caisse en bois', k: 'sol', c: 'bois', face: null, d: c =>
    R(12, 34, 76, 60, 3, c.c) + L('M12 54 h76 M12 74 h76', 2.5) + L('M16 38 L84 90 M84 38 L16 90', 3).replace(INK, c.s) },
  seau: { nom: 'le seau', k: 'petit', c: 'bleu', face: [50, 66, .65], d: c =>
    L('M22 44 q28 -40 56 0', 3.5) + P('M16 42 h68 l-8 50 h-52 z', c.c) + E(50, 42, 34, 6, c.s) },
  aquarium: { nom: "l'aquarium", k: 'petit', c: 'bleu', face: null, d: c =>
    R(10, 30, 80, 60, 10, '#DDF2FF') + P('M10 52 h80 v28 q0 10 -10 10 h-60 q-10 0 -10 -10 z', c.c) + P('M40 62 q10 -10 20 0 q-10 10 -20 0 z M60 62 l8 -6 v12 z', COULEURS.corail.c) + L('M22 90 q-4 -14 4 -24 M30 90 q4 -10 -2 -18', 3).replace(INK, '#5FAE52') + D(70, 44, 3, '#fff') + D(64, 36, 2, '#fff') },
  telephone: { nom: 'le téléphone', k: 'petit', c: 'rouge', face: [50, 70, .6], d: c =>
    P('M14 38 q36 -26 72 0 v8 h-18 v-8 q-18 -6 -36 0 v8 h-18 z', c.c) + P('M22 56 q28 -14 56 0 l8 36 h-72 z', c.c) + C(50, 72, 9, '#fff') },
  radio: { nom: 'la radio', k: 'petit', c: 'menthe', face: null, d: c =>
    L('M70 34 L84 8', 3) + R(10, 34, 80, 56, 10, c.c) + C(34, 62, 16, '#fff') + L('M24 56 h20 M24 62 h20 M24 68 h20', 2) + R(56, 46, 26, 12, 3, '#FFF1D6') + C(64, 74, 5, c.s) + C(78, 74, 5, c.s) },
  television: { nom: 'la télévision', k: 'sol', c: 'violet', face: [50, 42, .8], d: c =>
    L('M38 6 L50 18 L62 4', 3) + R(10, 18, 80, 56, 10, c.c) + R(18, 26, 64, 40, 6, '#CFE8FF') + L('M34 74 l-8 18 M66 74 l8 18', 4) },
  cadeau: { nom: 'le cadeau', k: 'petit', c: 'menthe', face: [36, 66, .6], d: c =>
    R(14, 42, 72, 50, 4, c.c) + R(10, 30, 80, 14, 4, c.c) + R(44, 30, 12, 62, 1, COULEURS.rose.c) + P('M50 30 q-26 -26 -24 -4 q2 6 24 4 z', COULEURS.rose.c) + P('M50 30 q26 -26 24 -4 q-2 6 -24 4 z', COULEURS.rose.c) },
  sac_or: { nom: "le sac de pièces d'or", k: 'petit', c: 'bois', face: [50, 68, .65], d: c =>
    P('M38 30 l-8 -16 q20 -6 40 0 l-8 16 q30 14 26 44 q-4 20 -38 20 q-34 0 -38 -20 q-4 -30 26 -44 z', c.c) + L('M36 30 h28', 4) + C(18, 88, 7, COULEURS.jaune.c) + C(84, 86, 7, COULEURS.jaune.c) },
  coeur: { nom: 'le cœur', k: 'mur', c: 'rose', face: [50, 50, .75], d: c =>
    P('M50 90 q-44 -28 -40 -58 q4 -22 24 -22 q12 0 16 12 q4 -12 16 -12 q20 0 24 22 q4 30 -40 58 z', c.c) + H('M24 30 q2 -8 10 -10') },

  // ─── La ferme ───
  vache: { nom: 'la vache', k: 'sol', c: 'blanc', face: [80, 42, .5], d: c =>
    L('M14 52 q-8 8 -6 20', 3) + L('M26 74 v18 M38 76 v16 M60 76 v16 M72 74 v18', 5) + R(14, 40, 64, 38, 18, c.c) +
    D(30, 52, 7, INK) + D(54, 64, 6, INK) + D(46, 46, 5, INK) + L('M73 30 l-5 -9 M87 30 l5 -9', 3.5) +
    E(66, 34, 7, 4, c.c) + E(80, 44, 14, 14, c.c) + E(84, 56, 11, 7, '#FFB3C7') + D(80, 56, 1.6, INK) + D(88, 56, 1.6, INK) },
  poule: { nom: 'la poule', k: 'petit', c: 'blanc', face: [64, 34, .45], d: c =>
    L('M44 82 v12 M56 82 v12', 3.5).replace(INK, COULEURS.jaune.s) + P('M22 58 l-12 -18 l18 8 z', c.c) + E(48, 62, 30, 24, c.c) +
    P('M30 62 q12 -14 26 0 q-12 10 -26 0 z', c.s) + C(66, 34, 14, c.c) + P('M58 22 q3 -12 8 -3 q4 -12 9 0 z', COULEURS.rouge.c) +
    P('M79 32 l11 4 l-11 4 z', COULEURS.jaune.c) },
  cochon: { nom: 'le cochon', k: 'sol', c: 'rose', face: [74, 48, .5], d: c =>
    L('M12 58 q-8 -4 -4 -10 q6 -4 6 4', 3) + R(26, 70, 9, 22, 4, c.s) + R(56, 70, 9, 22, 4, c.s) + E(46, 60, 34, 24, c.c) +
    P('M64 34 l2 -14 l10 10 z', c.s) + P('M82 34 l6 -12 l4 14 z', c.s) + C(76, 52, 17, c.c) + E(90, 58, 8, 7, c.s) +
    D(87, 58, 1.7, INK) + D(93, 58, 1.7, INK) },
  mouton: { nom: 'le mouton', k: 'sol', c: 'blanc', face: [78, 50, .45], d: c =>
    L('M30 76 v16 M44 78 v14 M58 78 v14 M70 76 v16', 5) +
    C(26, 58, 14, c.c) + C(42, 46, 16, c.c) + C(60, 48, 15, c.c) + C(38, 66, 15, c.c) + C(58, 66, 15, c.c) + C(20, 44, 10, c.c) +
    E(68, 44, 7, 4, COULEURS.creme.s) + E(78, 52, 13, 15, COULEURS.creme.s) },
  lapin: { nom: 'le lapin', k: 'petit', c: 'gris', face: [50, 46, .55], d: c =>
    E(40, 18, 6, 17, c.c) + E(60, 18, 6, 17, c.c) + E(40, 20, 2.5, 11, '#FFB3C7').replace(O, '') + E(60, 20, 2.5, 11, '#FFB3C7').replace(O, '') +
    C(76, 76, 7, '#fff') + E(50, 74, 24, 20, c.c) + C(50, 44, 17, c.c) + E(42, 92, 8, 4, c.c) + E(58, 92, 8, 4, c.c) },
  canard: { nom: 'le canard', k: 'petit', c: 'jaune', face: [62, 32, .45], d: c =>
    P('M12 58 q2 -10 14 -8 q10 -6 30 -6 q30 0 32 22 q0 22 -38 24 q-36 0 -38 -32 z', c.c) + P('M32 64 q14 -14 30 0 q-14 10 -30 0 z', c.s) +
    C(62, 32, 15, c.c) + P('M76 32 q14 -2 16 6 q-8 6 -16 2 z', COULEURS.corail.c) },
  tracteur: { nom: 'le tracteur', k: 'sol', c: 'rouge', face: null, d: c =>
    R(16, 46, 70, 26, 6, c.c) + R(18, 18, 36, 32, 6, c.c) + R(24, 24, 24, 20, 4, '#CFE8FF') + L('M72 46 v-16', 5) +
    C(30, 74, 18, COULEURS.gris.s) + C(30, 74, 7, COULEURS.jaune.c) + C(78, 80, 12, COULEURS.gris.s) + C(78, 80, 4, COULEURS.jaune.c) },
  brouette: { nom: 'la brouette', k: 'sol', c: 'vert', face: [42, 56, .55], d: c =>
    L('M62 66 L92 78 M58 74 v18', 4) + P('M10 42 h66 l-10 30 h-46 z', c.c) + C(30, 80, 12, COULEURS.gris.c) + D(30, 80, 3, INK) },
  botte_foin: { nom: 'la botte de foin', k: 'sol', c: 'jaune', face: [50, 62, .6], d: c =>
    R(10, 38, 80, 54, 10, c.c) + L('M22 38 v54 M78 38 v54', 3).replace(INK, c.s) + L('M18 50 l8 -4 M60 82 l10 -4 M40 44 l6 4 M70 52 l6 -6', 2.5).replace(INK, c.s) },
  carotte: { nom: 'la carotte', k: 'petit', c: 'corail', face: [50, 44, .5], d: c =>
    L('M40 24 l-8 -14 M50 22 v-16 M60 24 l8 -14', 5).replace(INK, COULEURS.vert.s) +
    P('M30 26 q20 -8 40 0 q-4 40 -20 68 q-16 -28 -20 -68 z', c.c) + L('M40 44 l8 2 M44 62 l8 2', 2.5) },
  citrouille: { nom: 'la citrouille', k: 'petit', c: 'corail', face: [50, 62, .65], d: c =>
    L('M50 30 q2 -14 12 -18', 4).replace(INK, COULEURS.vert.s) + E(30, 62, 20, 28, c.c) + E(70, 62, 20, 28, c.c) + E(50, 62, 22, 30, c.c) + H('M26 50 q2 -8 6 -12') },
  oeufs: { nom: "le nid d'œufs", k: 'petit', c: 'creme', face: null, d: c =>
    E(34, 62, 12, 16, c.c) + E(66, 62, 12, 16, c.c) + E(50, 56, 13, 18, c.c) + P('M10 66 q40 30 80 0 q-4 26 -40 26 q-36 0 -40 -26 z', COULEURS.bois.c) +
    L('M18 74 q32 12 64 0', 2).replace(INK, COULEURS.bois.s) },
  bidon: { nom: 'le bidon de lait', k: 'petit', c: 'gris', face: [50, 66, .6], d: c =>
    R(38, 10, 24, 12, 4, c.s) + P('M38 22 h24 l12 22 v44 q0 6 -6 6 h-36 q-6 0 -6 -6 v-44 z', c.c) + L('M26 52 h48', 3) + H('M34 58 v18') },
  epouvantail: { nom: "l'épouvantail", k: 'sol', c: 'bois', face: [50, 30, .55], d: c =>
    L('M50 44 v50 M14 52 h72', 5).replace(INK, c.s) + P('M34 46 h32 l6 30 h-44 z', COULEURS.bleu.c) + C(50, 30, 15, COULEURS.creme.c) +
    P('M30 20 h40 l-4 -14 h-32 z', COULEURS.jaune.s) + R(26, 18, 48, 6, 3, COULEURS.jaune.c) },

  // ─── Le théâtre ───
  projecteur: { nom: 'le projecteur', k: 'sol', c: 'nuit', face: null, d: c =>
    L('M50 56 L30 94 M50 56 L70 94 M50 56 v38', 4) + P('M28 20 l34 -6 l8 30 l-34 8 z', c.c) + E(68, 28, 6, 16, COULEURS.jaune.c) + C(48, 50, 5, c.s) },
  rideau: { nom: 'le rideau', k: 'mur', c: 'rouge', face: null, d: c =>
    R(6, 8, 88, 8, 4, COULEURS.jaune.c) + P('M10 16 h36 q-6 40 -26 74 h-10 z', c.c) + P('M90 16 h-36 q6 40 26 74 h10 z', c.c) +
    L('M20 30 v50 M80 30 v50', 2).replace(INK, c.s) + C(22, 60, 4, COULEURS.jaune.c) + C(78, 60, 4, COULEURS.jaune.c) },
  billet: { nom: 'le billet', k: 'petit', c: 'jaune', face: [50, 54, .55], d: c =>
    P('M12 32 h76 v10 a8 8 0 0 0 0 16 v10 h-76 v-10 a8 8 0 0 0 0 -16 z', c.c) + L('M30 32 v36', 2).replace(INK, c.s) }
};

function couleur(nom, defaut) {
  return COULEURS[nom] || COULEURS[defaut] || COULEURS.rose;
}

// Petit visage kawaii (visible seulement quand l'objet est maîtrisé)
function visage(x, y, s) {
  const dx = 9 * s;
  return `<g class="obj-face">
    <ellipse cx="${x - dx}" cy="${y}" rx="${3.4 * s}" ry="${4 * s}" fill="${INK}"/><ellipse cx="${x + dx}" cy="${y}" rx="${3.4 * s}" ry="${4 * s}" fill="${INK}"/>
    <circle cx="${x - dx - 1 * s}" cy="${y - 1.6 * s}" r="${1.3 * s}" fill="#fff"/><circle cx="${x + dx - 1 * s}" cy="${y - 1.6 * s}" r="${1.3 * s}" fill="#fff"/>
    <path d="M${x - 3 * s} ${y + 4 * s} q${3 * s} ${3 * s} ${6 * s} 0" fill="none" stroke="${INK}" stroke-width="${2 * s}" stroke-linecap="round"/>
    <ellipse cx="${x - dx - 4 * s}" cy="${y + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}" fill="#FF8FB1" opacity=".8"/><ellipse cx="${x + dx + 4 * s}" cy="${y + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}" fill="#FF8FB1" opacity=".8"/>
  </g>`;
}

// Contenu d'un objet (à placer dans un <svg viewBox="0 0 100 100"> ou une scène)
function inner(id, coul, opts = {}) {
  const f = FORMES[id];
  if (!f) return '';
  const c = couleur(coul, f.c);
  const avecVisage = opts.visage !== undefined ? opts.visage : !opts.gris;
  const face = avecVisage && f.face ? visage(...f.face) : '';
  return `<g class="obj-dessin">${f.d(c)}${face}</g>`;
}

// SVG complet. opts : { couleur, taille, gris, visage, classe }
// (visage : par défaut, seulement quand l'objet n'est pas gris)
function draw(id, opts = {}) {
  const taille = opts.taille || 64;
  const cls = `objet${opts.gris ? ' obj-gris' : ''}${opts.classe ? ' ' + opts.classe : ''}`;
  return `<svg class="${cls}" viewBox="-4 -4 108 108" width="${taille}" height="${taille}" aria-hidden="true">${inner(id, opts.couleur, opts)}</svg>`;
}

function info(id) {
  return FORMES[id] || null;
}

return { FORMES, COULEURS, draw, inner, info, ids: () => Object.keys(FORMES) };
})();
