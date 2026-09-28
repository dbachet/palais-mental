// ═══════════════════════════════════════════════════════════════
// KAWAII - Personnages dessinés par le code (aucune image)
// ═══════════════════════════════════════════════════════════════
// Même visage pour tous : yeux énormes et écartés, placés bas ; bouche
// minuscule dessous ; joues roses ; contour blanc de sticker.
// Utilisation : Kawaii.draw(config, taille) → chaîne SVG
// config = { char, fur, face, hat, glasses, outfit, outfitColor, bg, nom }
// (bg : fond derrière le kawaii ; nom : le nom que l'enfant lui a donné)

const Kawaii = (function () {

const CHARS = [
  { id: 'chat',     nom: 'Chat',      type: 'animal', fur: '#FFD1B0', famille: 'Animaux', objets: ['🐟', '🧶'] },
  { id: 'lapin',    nom: 'Lapin',     type: 'animal', fur: '#FFFFFF', famille: 'Animaux', objets: ['🥕'] },
  { id: 'ours',     nom: 'Ourson',    type: 'animal', fur: '#C9A6F0', famille: 'Animaux', objets: ['🍯'] },
  { id: 'panda',    nom: 'Panda',     type: 'animal', fur: '#FFFFFF', famille: 'Animaux', objets: ['🎋'] },
  { id: 'renard',   nom: 'Renard',    type: 'animal', fur: '#F2A26A', famille: 'Animaux', objets: ['🍂', '🍇'] },
  { id: 'licorne',  nom: 'Licorne',   type: 'animal', fur: '#FFFFFF', famille: 'Animaux', objets: ['🌈', '✨'] },
  { id: 'pingouin', nom: 'Pingouin',  type: 'animal', fur: '#4A4066', famille: 'Animaux', objets: ['🐟', '❄️'] },
  { id: 'cochon',   nom: 'Cochon',    type: 'animal', fur: '#FFC2D6', famille: 'Animaux', objets: ['🍎', '🌽'] },
  { id: 'etoile',   nom: 'Étoile',    type: 'objet',  fur: '#FFD466', famille: 'Objets', objets: ['⭐', '✨'] },
  { id: 'nuage',    nom: 'Nuage',     type: 'objet',  fur: '#FFFFFF', famille: 'Objets', objets: ['💧', '🌈'] },
  { id: 'coeur',    nom: 'Cœur',      type: 'objet',  fur: '#FF8FA3', famille: 'Objets', objets: ['💖', '💗'] },
  { id: 'lune',     nom: 'Lune',      type: 'objet',  fur: '#FFE7A3', famille: 'Objets', objets: ['🌙', '⭐'] },
  { id: 'flan',     nom: 'Flan',      type: 'aliment', fur: '#FFE0A8', famille: 'Aliments', objets: ['🍮', '✨'] },
  { id: 'cupcake',  nom: 'Cupcake',   type: 'aliment', fur: '#FFB3D6', famille: 'Aliments', objets: ['🧁', '🍒'] },
  { id: 'glace',    nom: 'Glace',     type: 'aliment', fur: '#FFB3D6', famille: 'Aliments', objets: ['🍦', '🍨'] },
  { id: 'fraise',   nom: 'Fraise',    type: 'aliment', fur: '#FF6B7A', famille: 'Aliments', objets: ['🍓', '🌸'] }
];
const FURS = [
  { id: 'nature', c: null }, { id: 'rose', c: '#FFB3D6' }, { id: 'lilas', c: '#C9A6F0' }, { id: 'menthe', c: '#A8ECE6' },
  { id: 'ciel', c: '#B5D4F7' }, { id: 'citron', c: '#FFE7A3' }, { id: 'pêche', c: '#FFD1B0' }, { id: 'blanc', c: '#FFFFFF' }
];
const FACES = [ { id: 'content', nom: 'Content' }, { id: 'rieur', nom: 'Rieur' }, { id: 'dodo', nom: 'Dodo' }, { id: 'etoiles', nom: 'Étoilé' }, { id: 'clin', nom: 'Clin d’œil' }, { id: 'surpris', nom: 'Surpris' }, { id: 'langue', nom: 'Langue' } ];
const HATS = [ { id: 'aucun', nom: 'Rien' }, { id: 'couronne', nom: 'Couronne' }, { id: 'noeud', nom: 'Nœud' }, { id: 'fleur', nom: 'Fleur' }, { id: 'fraise', nom: 'Petite fraise' }, { id: 'bonnet', nom: 'Bonnet' }, { id: 'chapeau', nom: 'Chapeau de fête' } ];
const GLASSES = [ { id: 'aucune', nom: 'Sans' }, { id: 'rondes', nom: 'Rondes' }, { id: 'coeur', nom: 'Cœurs' }, { id: 'soleil', nom: 'Soleil' } ];
const OUTFITS = [ { id: 'aucune', nom: 'Rien' }, { id: 'foulard', nom: 'Foulard' }, { id: 'noeudpap', nom: 'Nœud papillon' }, { id: 'collier', nom: 'Collier' }, { id: 'cape', nom: 'Cape' } ];
// Fonds : couleurs unies ou scènes dessinées (voir scene())
const BACKGROUNDS = [
  { id: 'aucun', nom: 'Sans fond' },
  { id: 'rose', nom: 'Rose', c: '#FFD1E6' }, { id: 'lilas', nom: 'Lilas', c: '#E3D2F7' },
  { id: 'menthe', nom: 'Menthe', c: '#C9F2EC' }, { id: 'ciel', nom: 'Ciel', c: '#CFE4FB' },
  { id: 'arcenciel', nom: 'Arc-en-ciel', scene: true }, { id: 'plage', nom: 'Plage', scene: true },
  { id: 'mer', nom: 'Sous la mer', scene: true }, { id: 'espace', nom: 'Espace', scene: true },
  { id: 'prairie', nom: 'Prairie', scene: true }, { id: 'bonbons', nom: 'Pays des bonbons', scene: true },
  { id: 'neige', nom: 'Neige', scene: true }, { id: 'chateau', nom: 'Château', scene: true }
];
const OUTFIT_COLORS = [ { id: 'rose', c: '#FF7EB9', s: '#E8479A' }, { id: 'violet', c: '#B48CDB', s: '#8E5FC4' }, { id: 'menthe', c: '#5FD3CE', s: '#2BB3AE' }, { id: 'jaune', c: '#FFD466', s: '#F5B21B' }, { id: 'bleu', c: '#7FB3F5', s: '#4F8FD6' }, { id: 'corail', c: '#FF8A80', s: '#E5484D' } ];

const find = (l, id) => l.find(x => x.id === id) || l[0];
const dark = '#3A2B3F';
const line = `stroke="${dark}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

// Couleurs dérivées
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function lighten(h, k) { const [r, g, b] = hex2rgb(h); return rgb2hex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k); }
function darken(h, k) { const [r, g, b] = hex2rgb(h); return rgb2hex(r * (1 - k), g * (1 - k), b * (1 - k)); }

// Dégradé brillant : clair en haut à gauche, couleur pleine en bas
let defs = [];
let uid = 'k0';
function glossy(c) {
  const id = uid + 'g' + c.slice(1);
  if (!defs.some(d => d.includes(`id="${id}"`))) {
    defs.push(`<radialGradient id="${id}" cx="32%" cy="26%" r="85%"><stop offset="0" stop-color="${lighten(c, .45)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${darken(c, .08)}"/></radialGradient>`);
  }
  return `url(#${id})`;
}

// ── Visage kawaii commun ──
// dx : écartement des yeux, ey : hauteur des yeux, s : échelle
function face(a, dx, ey, s = 1, opts = {}) {
  const cx = 120;
  const eyeR = 13 * s;
  const eye = (x) => ({
    content: `<ellipse cx="${x}" cy="${ey}" rx="${eyeR}" ry="${eyeR * 1.15}" fill="${dark}"/><ellipse cx="${x}" cy="${ey + 2}" rx="${eyeR * .78}" ry="${eyeR * .9}" fill="#1B1426"/><circle cx="${x - eyeR * .35}" cy="${ey - eyeR * .4}" r="${eyeR * .42}" fill="#fff"/><circle cx="${x + eyeR * .4}" cy="${ey + eyeR * .35}" r="${eyeR * .18}" fill="#fff"/>`,
    rieur: `<path d="M${x - eyeR} ${ey + 3} Q${x} ${ey - eyeR * 1.2} ${x + eyeR} ${ey + 3}" fill="none" stroke="${dark}" stroke-width="${4 * s}" stroke-linecap="round"/>`,
    dodo: `<path d="M${x - eyeR} ${ey - 2} Q${x} ${ey + eyeR} ${x + eyeR} ${ey - 2}" fill="none" stroke="${dark}" stroke-width="${4 * s}" stroke-linecap="round"/>`,
    etoiles: `<path d="M${x} ${ey - eyeR * 1.2} l${3.6 * s} ${8.5 * s} ${9 * s} .7 -${6.8 * s} ${6 * s} ${2.1 * s} ${9 * s} -${7.9 * s} -${4.8 * s} -${7.9 * s} ${4.8 * s} ${2.1 * s} -${9 * s} -${6.8 * s} -${6 * s} ${9 * s} -.7z" fill="#F5B21B" stroke="${dark}" stroke-width="${2.5 * s}" stroke-linejoin="round"/>`,
    surpris: `<ellipse cx="${x}" cy="${ey}" rx="${eyeR * 1.05}" ry="${eyeR * 1.2}" fill="${dark}"/><ellipse cx="${x}" cy="${ey + 1}" rx="${eyeR * .8}" ry="${eyeR * .95}" fill="#1B1426"/><circle cx="${x - eyeR * .3}" cy="${ey - eyeR * .45}" r="${eyeR * .45}" fill="#fff"/><circle cx="${x + eyeR * .4}" cy="${ey + eyeR * .4}" r="${eyeR * .2}" fill="#fff"/>`,
    langue: `<ellipse cx="${x}" cy="${ey}" rx="${eyeR}" ry="${eyeR * 1.15}" fill="${dark}"/><circle cx="${x - eyeR * .35}" cy="${ey - eyeR * .4}" r="${eyeR * .42}" fill="#fff"/>`
  })[a.face === 'clin' ? 'content' : a.face];
  const left = a.face === 'clin'
    ? `<path d="M${cx - dx - eyeR} ${ey} Q${cx - dx} ${ey + eyeR * .9} ${cx - dx + eyeR} ${ey}" fill="none" stroke="${dark}" stroke-width="${4 * s}" stroke-linecap="round"/>`
    : eye(cx - dx);
  const blinks = ['content', 'surpris', 'langue'].includes(a.face) || opts.eyes;
  const eyes = `<g class="k-look"><g class="k-eyes${blinks ? '' : ' k-noblink'}">${opts.eyes || left + eye(cx + dx)}</g></g>`;

  const my = ey + 15 * s;
  let mouth;
  if (opts.mouth === 'chat') mouth = `<path d="M${cx - 7 * s} ${my} q${3.5 * s} ${5 * s} ${7 * s} 0 q${3.5 * s} ${5 * s} ${7 * s} 0" fill="none" stroke="${dark}" stroke-width="${2.8 * s}" stroke-linecap="round"/>`;
  else if (opts.mouth === 'nez') mouth = `<ellipse cx="${cx}" cy="${my - 3 * s}" rx="${5 * s}" ry="${3.5 * s}" fill="${dark}"/><path d="M${cx - 6 * s} ${my + 3 * s} q${6 * s} ${5 * s} ${12 * s} 0" fill="none" stroke="${dark}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`;
  else if (opts.mouth === 'bec') mouth = `<path d="M${cx - 8 * s} ${my - 4 * s} L${cx + 8 * s} ${my - 4 * s} L${cx} ${my + 6 * s} Z" fill="#FFB347" ${line}/>`;
  else if (opts.mouth === 'groin') mouth = `<ellipse cx="${cx}" cy="${my - 1 * s}" rx="${11 * s}" ry="${7 * s}" fill="${opts.groin}" ${line}/><circle cx="${cx - 4 * s}" cy="${my - 1 * s}" r="${1.8 * s}" fill="${dark}"/><circle cx="${cx + 4 * s}" cy="${my - 1 * s}" r="${1.8 * s}" fill="${dark}"/>`;
  else mouth = `<path d="M${cx - 6 * s} ${my - 2 * s} q${6 * s} ${6 * s} ${12 * s} 0" fill="none" stroke="${dark}" stroke-width="${2.8 * s}" stroke-linecap="round"/>`;
  if (a.face === 'surpris') mouth = `<ellipse cx="${cx}" cy="${my + 1 * s}" rx="${4.5 * s}" ry="${5.5 * s}" fill="${dark}"/>`;
  if (a.face === 'langue') mouth = `<path d="M${cx - 7 * s} ${my - 2 * s} q${7 * s} ${7 * s} ${14 * s} 0" fill="none" stroke="${dark}" stroke-width="${2.8 * s}" stroke-linecap="round"/><path d="M${cx - 1 * s} ${my + 1 * s} q${4 * s} ${9 * s} ${8 * s} 0 Z" fill="#FF8FA3" stroke="${dark}" stroke-width="${2 * s}"/>`;

  mouth = `<g class="k-mouth">${mouth}</g>`;

  const bx = dx + 14 * s, by = ey + 12 * s;
  const blush = `<ellipse cx="${cx - bx}" cy="${by}" rx="${12 * s}" ry="${7 * s}" fill="#FF8FB1" opacity=".75"/><ellipse cx="${cx + bx}" cy="${by}" rx="${12 * s}" ry="${7 * s}" fill="#FF8FB1" opacity=".75"/>
    <circle cx="${cx - bx - 5 * s}" cy="${by - 2 * s}" r="${1.4 * s}" fill="#fff" opacity=".9"/><circle cx="${cx + bx + 5 * s}" cy="${by - 2 * s}" r="${1.4 * s}" fill="#fff" opacity=".9"/>`;
  return eyes + mouth + blush;
}

// Oreilles gauche / droite, chacune dans son groupe (elles frémissent)
const ears = (l, r) => `<g class="k-ear k-ear-l">${l}</g><g class="k-ear k-ear-r">${r}</g>`;

// ── Formes de chaque personnage ──
// Retourne { back, body, head, front, ey, dx, hatY, mouth }
function shapes(id, fur, oc) {
  const g = glossy(fur), d2 = darken(fur, .18), pink = '#FFB3D6';
  const flatHead = `<ellipse cx="120" cy="120" rx="92" ry="74" fill="${g}" ${line}/>`;
  const body = (c = fur) => `<ellipse cx="120" cy="206" rx="46" ry="26" fill="${glossy(c)}" ${line}/>
    <ellipse cx="120" cy="210" rx="26" ry="16" fill="#fff" opacity=".5"/>
    <ellipse cx="82" cy="220" rx="14" ry="9" fill="${glossy(c)}" ${line}/><ellipse cx="158" cy="220" rx="14" ry="9" fill="${glossy(c)}" ${line}/>`;
  const S = {
    chat: { back: ears(`<path d="M48 78 L44 22 L98 52 Z" fill="${g}" ${line}/><path d="M56 68 L54 36 L86 54 Z" fill="${pink}"/>`, `<path d="M192 78 L196 22 L142 52 Z" fill="${g}" ${line}/><path d="M184 68 L186 36 L154 54 Z" fill="${pink}"/>`),
            body: body(), head: flatHead,
            front: `<path d="M114 138 L126 138 L120 144 Z" fill="#FF8FA3"/><path d="M30 130 L60 134 M30 142 L60 140 M210 130 L180 134 M210 142 L180 140" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>`,
            ey: 124, dx: 46, hatY: 40, mouth: 'chat' },
    lapin: { back: ears(`<ellipse cx="82" cy="34" rx="20" ry="52" fill="${g}" ${line} transform="rotate(-10 82 34)"/><ellipse cx="82" cy="36" rx="10" ry="36" fill="${pink}" transform="rotate(-10 82 36)"/>`, `<ellipse cx="158" cy="34" rx="20" ry="52" fill="${g}" ${line} transform="rotate(10 158 34)"/><ellipse cx="158" cy="36" rx="10" ry="36" fill="${pink}" transform="rotate(10 158 36)"/>`),
             body: body(), head: flatHead,
             front: `<ellipse cx="120" cy="136" rx="5" ry="3.5" fill="#FF8FA3"/><rect x="113" y="148" width="14" height="9" rx="3" fill="#fff" stroke="${dark}" stroke-width="2"/><path d="M120 148 L120 157" stroke="${dark}" stroke-width="1.5"/>`,
             ey: 122, dx: 48, hatY: 44, mouth: 'plain' },
    ours: { back: ears(`<circle cx="42" cy="66" r="24" fill="${g}" ${line}/><circle cx="42" cy="66" r="12" fill="${pink}"/>`, `<circle cx="198" cy="66" r="24" fill="${g}" ${line}/><circle cx="198" cy="66" r="12" fill="${pink}"/>`),
            body: body(), head: flatHead,
            front: `<ellipse cx="120" cy="146" rx="26" ry="17" fill="#fff" opacity=".85"/>`,
            ey: 122, dx: 48, hatY: 46, mouth: 'nez' },
    panda: { back: ears(`<circle cx="44" cy="66" r="24" fill="${dark}"/>`, `<circle cx="196" cy="66" r="24" fill="${dark}"/>`),
             body: body('#3A2B3F').replace(/opacity="\.5"/, 'opacity=".25"'), head: flatHead,
             front: `<ellipse cx="72" cy="122" rx="24" ry="20" fill="${dark}" transform="rotate(-18 72 122)"/><ellipse cx="168" cy="122" rx="24" ry="20" fill="${dark}" transform="rotate(18 168 122)"/>`,
             ey: 124, dx: 46, hatY: 46, mouth: 'nez', pandaEyes: true },
    renard: { back: ears(`<path d="M44 84 L38 18 L102 52 Z" fill="${g}" ${line}/><path d="M52 72 L48 36 L86 56 Z" fill="${dark}" opacity=".7"/>`, `<path d="M196 84 L202 18 L138 52 Z" fill="${g}" ${line}/><path d="M188 72 L192 36 L154 56 Z" fill="${dark}" opacity=".7"/>`),
              body: body(), head: flatHead,
              front: `<path d="M56 128 C70 176 170 176 184 128 C160 150 80 150 56 128 Z" fill="#fff"/>`,
              ey: 122, dx: 50, hatY: 40, mouth: 'nez' },
    licorne: { back: `<path d="M120 52 L106 -2 L134 -2 Z" fill="#FFD466" ${line}/><path d="M111 36 L129 30 M109 24 L127 18 M113 12 L125 8" stroke="#E8A317" stroke-width="2.5" stroke-linecap="round"/>
                      ${ears(`<path d="M52 78 L46 26 L100 52 Z" fill="${g}" ${line}/>`, `<path d="M188 78 L194 26 L140 52 Z" fill="${g}" ${line}/>`)}
                      <path d="M46 60 C22 74 20 120 36 154 C44 128 56 106 76 88 Z" fill="#FFB3D6" ${line}/><path d="M40 100 C30 116 30 140 38 154 C44 136 50 122 60 108 Z" fill="#C9A6F0"/><path d="M62 74 C50 84 44 96 44 108 C52 96 62 88 74 84 Z" fill="#A8ECE6"/>`,
               body: body(), head: flatHead,
               front: `<ellipse cx="120" cy="146" rx="24" ry="15" fill="#FFE4F1"/><circle cx="111" cy="146" r="3" fill="${dark}" opacity=".55"/><circle cx="129" cy="146" r="3" fill="${dark}" opacity=".55"/>`,
               ey: 120, dx: 48, hatY: 44, mouth: 'none' },
    pingouin: { back: '', body: body(), head: flatHead,
                front: `<path d="M44 128 C44 76 196 76 196 128 C196 170 168 190 120 190 C72 190 44 170 44 128 Z" fill="#fff"/>`,
                ey: 122, dx: 44, hatY: 46, mouth: 'bec' },
    cochon: { back: ears(`<path d="M50 80 L42 34 C60 34 78 44 90 56 Z" fill="${g}" ${line}/><path d="M56 70 L52 44 C64 46 74 52 82 60 Z" fill="${pink}"/>`, `<path d="M190 80 L198 34 C180 34 162 44 150 56 Z" fill="${g}" ${line}/><path d="M184 70 L188 44 C176 46 166 52 158 60 Z" fill="${pink}"/>`),
              body: body(), head: flatHead,
              front: '', ey: 120, dx: 48, hatY: 46, mouth: 'groin', groin: darken(fur, .12) },
    etoile: { back: '', body: '',
              head: `<path d="M120 22 L146 84 L212 92 L162 136 L176 202 L120 168 L64 202 L78 136 L28 92 L94 84 Z" fill="${g}" ${line} stroke-linejoin="round"/>
                     ${[[70,70],[176,64],[58,150],[186,156],[120,50]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#fff" opacity=".9"/>`).join('')}`,
              front: '', ey: 118, dx: 34, hatY: 30, mouth: 'plain', s: .9 },
    nuage: { back: '', body: '',
             head: `<path d="M56 160 C24 160 24 112 54 108 C50 76 96 62 116 84 C132 58 186 68 186 104 C218 104 220 160 184 160 Z" fill="${g}" ${line}/>`,
             front: '', ey: 122, dx: 40, hatY: 60, mouth: 'plain', s: .9 },
    coeur: { back: '', body: '',
             head: `<path d="M120 200 C60 156 24 122 30 82 C34 52 66 38 92 52 C106 60 114 72 120 84 C126 72 134 60 148 52 C174 38 206 52 210 82 C216 122 180 156 120 200 Z" fill="${g}" ${line}/>
                    <ellipse cx="72" cy="78" rx="14" ry="8" fill="#fff" opacity=".55" transform="rotate(-30 72 78)"/>`,
             front: '', ey: 108, dx: 36, hatY: 34, mouth: 'plain', s: .9 },
    lune: { back: '', body: '',
            head: `<path d="M150 22 C90 30 56 80 66 130 C74 176 118 208 168 206 C124 190 96 154 96 118 C96 78 118 44 150 22 Z" fill="${g}" ${line}/>
                   <path d="M158 44 l3 7 7.5.6 -5.7 5 1.7 7.4 -6.5 -3.9 -6.5 3.9 1.7 -7.4 -5.7 -5 7.5 -.6z" fill="#fff" opacity=".9"/><circle cx="194" cy="110" r="4" fill="#fff" opacity=".9"/><circle cx="182" cy="170" r="3" fill="#fff" opacity=".8"/>`,
            front: '', ey: 112, dx: 20, hatY: 24, mouth: 'plain', s: .85, cx: 108 },
    flan: { back: '', body: '',
            head: `<ellipse cx="120" cy="196" rx="94" ry="20" fill="${glossy('#7FB3F5')}" ${line}/>
                   <path d="M40 176 C40 108 62 72 120 72 C178 72 200 108 200 176 C184 186 168 172 154 184 C142 176 132 190 120 180 C108 190 98 176 86 184 C72 172 56 186 40 176 Z" fill="${g}" ${line}/>
                   <path d="M46 132 C50 96 76 72 120 72 C164 72 190 96 194 132 C182 148 164 134 148 146 C138 138 128 150 120 140 C112 150 102 138 92 146 C76 134 58 148 46 132 Z" fill="${glossy('#D98B45')}" ${line}/>
                   <ellipse cx="84" cy="94" rx="10" ry="5" fill="#fff" opacity=".5" transform="rotate(-20 84 94)"/>`,
            front: '', ey: 154, dx: 40, hatY: 46, mouth: 'plain', s: .85, topping: `<path d="M120 76 C104 76 96 62 100 50 C104 40 116 38 120 44 C124 38 136 40 140 50 C144 62 136 76 120 76 Z" fill="${glossy('#FF6B7A')}" ${line}/>${[[112,58],[126,54],[118,66]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join('')}<path d="M120 42 C114 32 104 36 104 40 L120 42 L136 40 C136 36 126 32 120 42 Z" fill="#6FCF7A" ${line}/>` },
    cupcake: { back: '', body: '',
               head: `<path d="M50 118 L62 210 C62 218 70 222 78 222 L162 222 C170 222 178 218 178 210 L190 118 Z" fill="${g}" ${line}/>
                      ${[80,100,120,140,160].map(x => `<path d="M${x} 122 L${x} 218" stroke="${darken(fur, .18)}" stroke-width="3" opacity=".6"/>`).join('')}
                      <path d="M46 118 C40 100 58 90 72 98 C70 78 104 68 116 86 C126 62 168 70 162 98 C182 90 202 104 192 122 Z" fill="${glossy('#FFF7F0')}" ${line}/>
                      <path d="M72 98 C76 84 96 84 98 96 M118 86 C124 74 142 76 142 90" fill="none" stroke="${dark}" stroke-width="2" opacity=".35"/>
                      ${[[84,104],[140,106],[110,92],[164,108],[66,110]].map(([x,y], i) => `<rect x="${x}" y="${y}" width="9" height="3.5" rx="1.5" fill="${['#FF7EB9','#5FD3CE','#FFD466','#B48CDB','#FF8A80'][i]}" transform="rotate(${[-20,30,10,-40,25][i]} ${x} ${y})"/>`).join('')}
                      <circle cx="120" cy="68" r="10" fill="${glossy('#E5484D')}" ${line}/><path d="M120 58 C120 50 126 46 130 46" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>`,
               front: '', ey: 156, dx: 34, hatY: 30, mouth: 'plain', s: .85 },
    glace: { back: '', body: '',
             head: `<path d="M68 146 L120 236 L172 146 Z" fill="${glossy('#F2B879')}" ${line}/>
                    <path d="M84 160 L156 160 M96 180 L148 180 M108 200 L136 200 M100 148 L128 220 M140 148 L112 220" stroke="${darken('#F2B879', .3)}" stroke-width="2" opacity=".7"/>
                    <path d="M54 130 C40 80 80 44 120 52 C160 44 200 80 186 130 C176 152 154 150 146 158 C138 150 132 166 120 158 C108 166 102 150 94 158 C86 150 64 152 54 130 Z" fill="${g}" ${line}/>
                    <ellipse cx="86" cy="80" rx="12" ry="6" fill="#fff" opacity=".55" transform="rotate(-25 86 80)"/>
                    ${[[76,92],[150,84],[128,70],[100,64],[170,118]].map(([x,y], i) => `<rect x="${x}" y="${y}" width="8" height="3.2" rx="1.5" fill="${['#5FD3CE','#FFD466','#B48CDB','#FF8A80','#fff'][i]}" transform="rotate(${[20,-30,15,-10,40][i]} ${x} ${y})"/>`).join('')}`,
             front: '', ey: 114, dx: 36, hatY: 34, mouth: 'plain', s: .85 },
    fraise: { back: '', body: '',
              head: `<path d="M120 60 C168 60 206 92 200 136 C194 184 156 218 120 224 C84 218 46 184 40 136 C34 92 72 60 120 60 Z" fill="${g}" ${line}/>
                     ${[[70,120],[92,168],[120,196],[148,168],[170,120],[96,96],[144,96],[120,150],[60,150],[180,150]].map(([x,y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="4.5" fill="#FFE7A3" stroke="${darken('#FFE7A3', .3)}" stroke-width="1"/>`).join('')}
                     <path d="M120 66 C96 60 78 44 82 34 C96 34 110 42 116 52 C112 40 114 28 120 22 C126 28 128 40 124 52 C130 42 144 34 158 34 C162 44 144 60 120 66 Z" fill="${glossy('#6FCF7A')}" ${line}/>`,
              front: '', ey: 132, dx: 36, hatY: 26, mouth: 'plain', s: .85 }
  };
  return S[id];
}

// ── Accessoires (positionnés sur la tête du personnage) ──
function accessories(a, sh, oc) {
  const hatY = sh.hatY, cx = sh.cx || 120, dx = sh.dx, ey = sh.ey, s = sh.s || 1;
  const hat = {
    aucun: '',
    couronne: `<path d="M${cx - 30} ${hatY + 18} L${cx - 24} ${hatY - 14} L${cx - 9} ${hatY + 6} L${cx} ${hatY - 22} L${cx + 9} ${hatY + 6} L${cx + 24} ${hatY - 14} L${cx + 30} ${hatY + 18} Z" fill="${glossy('#FFD466')}" ${line}/><circle cx="${cx}" cy="${hatY + 4}" r="4" fill="#FF5FA8"/>`,
    noeud: `<g transform="translate(${cx + 46} ${hatY + 16}) rotate(15)"><path d="M0 0 C-14 -16 -32 -12 -28 0 C-32 12 -14 16 0 0 Z" fill="${glossy(oc.c)}" ${line}/><path d="M0 0 C14 -16 32 -12 28 0 C32 12 14 16 0 0 Z" fill="${glossy(oc.c)}" ${line}/><circle r="5" fill="${oc.s}"/></g>`,
    fleur: `<g transform="translate(${cx + 48} ${hatY + 18})">${[0,72,144,216,288].map(d => `<ellipse rx="8" ry="12" transform="rotate(${d}) translate(0 -10)" fill="${glossy('#FFB3D6')}" stroke="${dark}" stroke-width="2"/>`).join('')}<circle r="6" fill="#F5D06B"/></g>`,
    fraise: `<g transform="translate(${cx + 44} ${hatY + 14}) rotate(15)"><path d="M0 -10 C10 -10 18 -2 16 8 C14 18 6 24 0 26 C-6 24 -14 18 -16 8 C-18 -2 -10 -10 0 -10 Z" fill="${glossy('#FF6B7A')}" ${line}/>${[[-6,4],[6,4],[0,14]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#FFE7A3"/>`).join('')}<path d="M-10 -8 C-6 -14 -2 -14 0 -10 C2 -14 6 -14 10 -8 C4 -6 -4 -6 -10 -8 Z" fill="#6FCF7A" ${line}/></g>`,
    bonnet: `<path d="M${cx - 52} ${hatY + 22} Q${cx} ${hatY - 46} ${cx + 52} ${hatY + 22} Z" fill="${glossy(oc.c)}" ${line}/><path d="M${cx - 56} ${hatY + 22} Q${cx} ${hatY + 8} ${cx + 56} ${hatY + 22} L${cx + 56} ${hatY + 34} Q${cx} ${hatY + 20} ${cx - 56} ${hatY + 34} Z" fill="#fff" ${line}/><circle cx="${cx}" cy="${hatY - 24}" r="10" fill="#fff" ${line}/>`,
    chapeau: `<path d="M${cx} ${hatY - 40} L${cx + 28} ${hatY + 22} L${cx - 28} ${hatY + 22} Z" fill="${glossy(oc.c)}" ${line}/><path d="M${cx - 20} ${hatY + 4} L${cx + 20} ${hatY + 4} M${cx - 12} ${hatY - 12} L${cx + 12} ${hatY - 12}" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${hatY - 42}" r="6" fill="#FFD466" ${line}/>`
  }[a.hat];
  const r = 18 * s;
  const glasses = {
    aucune: '',
    rondes: `<circle cx="${cx - dx}" cy="${ey}" r="${r}" fill="rgba(255,255,255,.2)" ${line}/><circle cx="${cx + dx}" cy="${ey}" r="${r}" fill="rgba(255,255,255,.2)" ${line}/><path d="M${cx - dx + r} ${ey - 2} Q${cx} ${ey - 10} ${cx + dx - r} ${ey - 2}" fill="none" ${line}/>`,
    coeur: `<g stroke="#E8479A" stroke-width="3" fill="rgba(255,143,199,.35)">${[cx - dx, cx + dx].map(x => `<path d="M${x} ${ey + r} L${x - r} ${ey} a${r * .6} ${r * .6} 0 0 1 ${r} -${r * .7} a${r * .6} ${r * .6} 0 0 1 ${r} ${r * .7} Z"/>`).join('')}</g>`,
    soleil: `<rect x="${cx - dx - r}" y="${ey - r * .7}" width="${r * 2}" height="${r * 1.5}" rx="${r * .6}" fill="${dark}"/><rect x="${cx + dx - r}" y="${ey - r * .7}" width="${r * 2}" height="${r * 1.5}" rx="${r * .6}" fill="${dark}"/><path d="M${cx - dx + r} ${ey} L${cx + dx - r} ${ey}" ${line}/><path d="M${cx - dx - r * .5} ${ey - r * .2} L${cx - dx} ${ey - r * .5}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`
  }[a.glasses];
  const ny = sh.body ? 184 : (ey + 46 * s);
  const outfit = {
    aucune: '',
    foulard: `<path d="M${cx - 44} ${ny - 8} Q${cx} ${ny + 14} ${cx + 44} ${ny - 8} L${cx + 38} ${ny + 6} Q${cx} ${ny + 26} ${cx - 38} ${ny + 6} Z" fill="${glossy(oc.c)}" ${line}/><path d="M${cx + 24} ${ny + 4} L${cx + 40} ${ny + 32} L${cx + 12} ${ny + 18} Z" fill="${glossy(oc.c)}" ${line}/>`,
    noeudpap: `<g transform="translate(${cx} ${ny})"><path d="M0 0 L-22 -12 L-22 12 Z" fill="${glossy(oc.c)}" ${line}/><path d="M0 0 L22 -12 L22 12 Z" fill="${glossy(oc.c)}" ${line}/><circle r="5" fill="${oc.s}"/></g>`,
    collier: `${[-24,-12,0,12,24].map(x => `<circle cx="${cx + x}" cy="${ny + Math.abs(x) * -0.15 + 2}" r="5" fill="${glossy(oc.c)}" ${line}/>`).join('')}`,
    cape: `<path d="M${cx - 50} ${ny - 6} L${cx - 66} ${ny + 56} L${cx + 66} ${ny + 56} L${cx + 50} ${ny - 6} Q${cx} ${ny + 8} ${cx - 50} ${ny - 6} Z" fill="${glossy(oc.c)}" ${line}/><path d="M${cx - 50} ${ny - 6} Q${cx} ${ny + 8} ${cx + 50} ${ny - 6}" fill="none" stroke="${oc.s}" stroke-width="5"/><circle cx="${cx}" cy="${ny + 2}" r="5" fill="#FFD466" ${line}/>`
  }[a.outfit];
  return { hat, glasses, outfit };
}

let drawCount = 0;
// Yeux de réaction, cachés tant que le kawaii ne réagit pas :
// yeux rieurs (caresse, encouragement) et yeux étoiles (bravo)
function reactionEyes(sh) {
  const cx = sh.cx || 120, dx = sh.dx, ey = sh.ey, s = sh.s || 1;
  const eyeR = 13 * s;
  const ink = sh.pandaEyes ? '#fff' : dark;
  const arc = x => `<path d="M${x - eyeR} ${ey + 3} Q${x} ${ey - eyeR * 1.2} ${x + eyeR} ${ey + 3}" fill="none" stroke="${ink}" stroke-width="${4 * s}" stroke-linecap="round"/>`;
  const star = x => `<path d="M${x} ${ey - eyeR * 1.2} l${3.6 * s} ${8.5 * s} ${9 * s} .7 -${6.8 * s} ${6 * s} ${2.1 * s} ${9 * s} -${7.9 * s} -${4.8 * s} -${7.9 * s} ${4.8 * s} ${2.1 * s} -${9 * s} -${6.8 * s} -${6 * s} ${9 * s} -.7z" fill="#FFD466" stroke="${dark}" stroke-width="${2.5 * s}" stroke-linejoin="round"/>`;
  const shut = x => `<path d="M${x - eyeR} ${ey - 2} Q${x} ${ey + eyeR} ${x + eyeR} ${ey - 2}" fill="none" stroke="${ink}" stroke-width="${4 * s}" stroke-linecap="round"/>`;
  const my = ey + 15 * s;
  const yawn = `<g class="k-yawn"><ellipse cx="${cx}" cy="${my + 2 * s}" rx="${7 * s}" ry="${9 * s}" fill="${dark}"/><ellipse cx="${cx}" cy="${my + 7 * s}" rx="${4.5 * s}" ry="${3 * s}" fill="#FF8FA3"/></g>`;
  // Les yeux habituels sont masqués pendant la réaction (le panda garde ses taches)
  const both = f => f(cx - dx) + f(cx + dx);
  return `<g class="k-joy">${both(arc)}</g><g class="k-star">${both(x => `<g class="k-star1">${star(x)}</g>`)}</g><g class="k-shut">${both(shut)}</g>${yawn}`;
}

// Bonnet de nuit (remplace le chapeau la nuit) et « z » du sommeil
function nightcap(sh) {
  const cx = sh.cx || 120, y = sh.hatY;
  const stars = [[-26, 4], [4, -14], [30, 2]].map(([x, yy]) => `<path d="M${cx + x} ${y + yy - 5} l1.6 3.4 3.7.4 -2.8 2.5 .8 3.7 -3.3 -1.9 -3.3 1.9 .8 -3.7 -2.8 -2.5 3.7 -.4z" fill="#FFE7A3"/>`).join('');
  return `<g class="k-nightcap"><path d="M${cx - 54} ${y + 24} C${cx - 50} ${y - 34} ${cx + 30} ${y - 46} ${cx + 62} ${y - 4} C${cx + 74} ${y + 12} ${cx + 80} ${y + 30} ${cx + 82} ${y + 44} C${cx + 70} ${y + 30} ${cx + 60} ${y + 22} ${cx + 54} ${y + 24} Z" fill="${glossy('#8FA8F0')}" ${line}/>${stars}
    <path d="M${cx - 58} ${y + 24} Q${cx} ${y + 10} ${cx + 58} ${y + 24} L${cx + 58} ${y + 36} Q${cx} ${y + 22} ${cx - 58} ${y + 36} Z" fill="#fff" ${line}/><circle cx="${cx + 82}" cy="${y + 48}" r="10" fill="#fff" ${line}/></g>`;
}

function sleepZ(sh) {
  const cx = (sh.cx || 120) + 70, y = sh.hatY + 4;
  return `<g class="k-zzz">${[0, 1, 2].map(i => `<text x="${cx + i * 10}" y="${y - i * 14}" font-size="${18 + i * 5}" font-weight="900" font-family="system-ui, sans-serif" fill="#7B6CC4" stroke="#fff" stroke-width="3" paint-order="stroke" style="animation-delay:${-i * 0.8}s">z</text>`).join('')}</g>`;
}

// ── Fonds : disque derrière le kawaii (couleur ou petite scène) ──
function scene(id, u) {
  const bg = find(BACKGROUNDS, id);
  if (bg.id === 'aucun') return '';
  const grad = (gid, top, bottom) => `<linearGradient id="${u}${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
  const cloud = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff"><circle cx="0" cy="0" r="12"/><circle cx="14" cy="-6" r="15"/><circle cx="30" cy="0" r="12"/><rect x="0" y="0" width="30" height="12"/></g>`;
  let d = '', art = '';
  if (bg.c) {
    d = `<radialGradient id="${u}bg" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="${lighten(bg.c, .5)}"/><stop offset="1" stop-color="${bg.c}"/></radialGradient>`;
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>`;
  } else if (bg.id === 'arcenciel') {
    d = grad('bg', '#BFE6FF', '#FFF0FA');
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>
      ${['#FF9AA2', '#FFC48C', '#FFE38A', '#A8E6A1', '#9AD0F5', '#C9A6F0'].map((c, i) => `<path d="M${-20 + i * 11} 210 A${140 - i * 11} ${140 - i * 11} 0 0 1 ${260 - i * 11} 210" fill="none" stroke="${c}" stroke-width="11"/>`).join('')}
      ${cloud(-6, 196, 1.3)}${cloud(196, 196, 1.3)}`;
  } else if (bg.id === 'plage') {
    d = grad('bg', '#8ED4FF', '#E6F7FF') + grad('sea', '#5CC4EE', '#2E9BD6');
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>
      <circle cx="188" cy="46" r="30" fill="#FFE38A" opacity=".45"/><circle cx="188" cy="46" r="20" fill="#FFD466"/>
      ${cloud(20, 40, .9)}<path d="M150 80 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#3A2B3F" stroke-width="2" stroke-linecap="round" opacity=".5"/>
      <rect x="-10" y="148" width="260" height="50" fill="url(#${u}sea)"/>
      <path class="k-wave" d="M-20 160 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>
      <path d="M-10 186 C60 174 180 174 250 186 L250 250 L-10 250 Z" fill="#F7DDA0"/>
      <path d="M26 214 l8 -12 l8 12 z" fill="#FFB3D6" stroke="#E8479A" stroke-width="1.5"/><circle cx="208" cy="210" r="5" fill="#FF8A80"/>`;
  } else if (bg.id === 'mer') {
    d = grad('bg', '#86DDF2', '#2375B8');
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>
      <path d="M60 -10 L90 -10 L40 200 L10 200 Z M150 -10 L175 -10 L150 200 L118 200 Z" fill="#fff" opacity=".12"/>
      <path d="M-10 214 C50 200 190 200 250 214 L250 250 L-10 250 Z" fill="#F2D59A"/>
      <path d="M14 222 C4 190 28 170 14 140 M26 222 C34 196 18 178 30 152" fill="none" stroke="#3DBE8B" stroke-width="7" stroke-linecap="round"/>
      <path d="M214 222 C224 194 202 176 216 150 M226 222 C220 200 236 186 228 166" fill="none" stroke="#2FA878" stroke-width="7" stroke-linecap="round"/>
      <g transform="translate(186 70)"><ellipse rx="14" ry="9" fill="#FFB347" stroke="#3A2B3F" stroke-width="2"/><path d="M12 0 l12 -8 v16 z" fill="#FFB347" stroke="#3A2B3F" stroke-width="2" stroke-linejoin="round"/><circle cx="-6" cy="-2" r="2" fill="#3A2B3F"/></g>
      <g transform="translate(40 58) scale(-.8 .8)"><ellipse rx="14" ry="9" fill="#FF8FB1" stroke="#3A2B3F" stroke-width="2"/><path d="M12 0 l12 -8 v16 z" fill="#FF8FB1" stroke="#3A2B3F" stroke-width="2" stroke-linejoin="round"/><circle cx="-6" cy="-2" r="2" fill="#3A2B3F"/></g>
      ${[[30, 150, 6, 0], [48, 110, 4, 1.2], [200, 130, 5, .6], [214, 96, 3, 1.8], [190, 180, 4, 2.4]].map(([x, y, r, dl]) => `<circle class="k-bub" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width="2" opacity=".8" style="animation-delay:-${dl}s"/>`).join('')}`;
  } else if (bg.id === 'espace') {
    d = `<radialGradient id="${u}bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#4A3A8C"/><stop offset="1" stop-color="#171033"/></radialGradient>`;
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>
      ${[[20, 30], [60, 12], [100, 36], [150, 18], [220, 30], [30, 90], [210, 110], [14, 160], [226, 170], [70, 200], [180, 214], [120, 8]].map(([x, y], i) => `<circle class="k-tw" cx="${x}" cy="${y}" r="${i % 3 ? 1.6 : 2.6}" fill="#fff" style="animation-delay:-${(i * .37) % 2}s"/>`).join('')}
      <circle cx="194" cy="62" r="20" fill="#FF9FC8"/><path d="M198 50 a14 14 0 0 1 8 18" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/><ellipse cx="194" cy="64" rx="34" ry="8" fill="none" stroke="#FFD466" stroke-width="3.5" transform="rotate(-18 194 64)"/>
      <path d="M52 40 a22 22 0 1 0 18 34 a17 17 0 1 1 -18 -34 z" fill="#FFE7A3"/>
      <path d="M20 200 l4 8 8 1 -6 5 2 8 -8 -4 -8 4 2 -8 -6 -5 8 -1z" fill="#FFD466" class="k-tw"/>`;
  } else if (bg.id === 'prairie') {
    d = grad('bg', '#B6E8FF', '#F0FBFF');
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>
      <circle cx="46" cy="44" r="18" fill="#FFD466"/>${cloud(150, 34, .9)}
      <ellipse cx="40" cy="206" rx="130" ry="50" fill="#A8E6A1"/><ellipse cx="210" cy="212" rx="120" ry="46" fill="#7FD68A"/>
      <rect x="196" y="112" width="10" height="44" rx="4" fill="#B98556"/><circle cx="201" cy="104" r="26" fill="#5FC878"/><circle cx="188" cy="112" r="16" fill="#6FD088"/>
      ${[[20, 196, '#FF8FB1'], [52, 214, '#FFD466'], [178, 206, '#fff'], [226, 196, '#C9A6F0'], [36, 232, '#FF8A80'], [208, 234, '#FFB3D6']].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(r => `<circle r="3.6" cy="-4" transform="rotate(${r})" fill="${c}"/>`).join('')}<circle r="2.6" fill="#F5B21B"/></g>`).join('')}`;
  } else if (bg.id === 'bonbons') {
    d = grad('bg', '#FFE1F0', '#FFB8D8');
    const pop = (x, y, c) => `<rect x="${x - 2}" y="${y}" width="4" height="60" rx="2" fill="#fff" stroke="#E8A0C0" stroke-width="1"/><circle cx="${x}" cy="${y}" r="18" fill="${c}"/><path d="M${x} ${y} m-12 0 a12 12 0 1 1 12 12 a8 8 0 1 1 -8 -8 a4 4 0 1 1 4 4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>
      ${pop(26, 120, '#FF7EB9')}${pop(214, 110, '#B48CDB')}
      <g fill="#fff" opacity=".85"><circle cx="40" cy="36" r="14"/><circle cx="58" cy="30" r="16"/><circle cx="74" cy="38" r="12"/><circle cx="176" cy="30" r="12"/><circle cx="192" cy="24" r="15"/><circle cx="208" cy="32" r="12"/></g>
      ${[[110, 20, '#5FD3CE'], [140, 50, '#FFD466'], [90, 60, '#FF8A80'], [30, 76, '#7FB3F5'], [220, 72, '#FF7EB9'], [60, 210, '#FFD466'], [180, 214, '#5FD3CE']].map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="10" height="4" rx="2" fill="${c}" transform="rotate(${i * 37} ${x} ${y})"/>`).join('')}
      <path d="M-10 222 C40 206 70 230 120 218 C170 206 200 230 250 218 L250 250 L-10 250 Z" fill="#FFF7F0"/>`;
  } else if (bg.id === 'neige') {
    d = grad('bg', '#C4E2FF', '#F4FAFF');
    const pine = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-4" y="0" width="8" height="12" fill="#9C6B45"/><path d="M0 -60 L22 -20 L12 -20 L28 4 L-28 4 L-12 -20 L-22 -20 Z" fill="#3DAE7B"/><path d="M0 -60 L10 -42 L-10 -42 Z M-12 -20 L12 -20 L6 -28 L-6 -28 Z" fill="#fff"/></g>`;
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>
      ${pine(26, 186, 1)}${pine(214, 178, 1.2)}
      <path d="M-10 196 C60 180 180 180 250 196 L250 250 L-10 250 Z" fill="#fff"/>
      ${[[30, 20], [80, 50], [140, 14], [200, 44], [60, 110], [180, 96], [226, 130], [14, 140], [110, 70]].map(([x, y], i) => `<text class="k-snow" x="${x}" y="${y}" font-size="${10 + (i % 3) * 3}" fill="#fff" stroke="#9CC6EE" stroke-width=".6" style="animation-delay:-${(i * .9) % 6}s">❄</text>`).join('')}`;
  } else if (bg.id === 'chateau') {
    d = grad('bg', '#FFD6EA', '#C9B3F2');
    const tower = (x, w, h, c) => `<rect x="${x}" y="${200 - h}" width="${w}" height="${h}" fill="${c}"/><path d="M${x - 4} ${200 - h} L${x + w / 2} ${200 - h - 30} L${x + w + 4} ${200 - h} Z" fill="#B48CDB"/><path d="M${x + w / 2} ${200 - h - 30} v-12 l10 4 -10 4" fill="#FF7EB9" stroke="#8E5FC4" stroke-width="1.5"/>`;
    art = `<rect x="-10" y="-10" width="260" height="260" fill="url(#${u}bg)"/>
      ${[[30, 30], [200, 20], [120, 12], [70, 60], [170, 56]].map(([x, y], i) => `<circle class="k-tw" cx="${x}" cy="${y}" r="2.2" fill="#fff" style="animation-delay:-${i * .4}s"/>`).join('')}
      ${tower(-4, 34, 110, '#FFC2DD')}${tower(210, 34, 120, '#FFC2DD')}${tower(40, 26, 80, '#FFD6E8')}${tower(174, 26, 86, '#FFD6E8')}
      <rect x="40" y="150" width="160" height="50" fill="#FFD6E8"/>
      <path d="M-10 196 C60 186 180 186 250 196 L250 250 L-10 250 Z" fill="#A8E6A1"/>`;
  }
  return { defs: d, art: `<clipPath id="${u}clip"><circle cx="120" cy="122" r="124"/></clipPath><g class="k-bg" clip-path="url(#${u}clip)">${art}</g><circle cx="120" cy="122" r="124" fill="none" stroke="#fff" stroke-width="5" opacity=".9"/>` };
}

function drawChar(a, size, opts = {}) {
  defs = [];
  uid = 'k' + (++drawCount) + '-';
  const ch = find(CHARS, a.char);
  const furOpt = find(FURS, a.fur);
  const fur = furOpt.c || ch.fur;
  const oc = find(OUTFIT_COLORS, a.outfitColor);
  const sh = shapes(ch.id, fur, oc);
  const acc = accessories(a, sh, oc);
  // Humeur selon l'heure (kawaii vivants) : la nuit, bonnet de nuit à la place du chapeau
  const mood = opts.alive ? (opts.mood || period()) : 'jour';
  const night = mood === 'nuit';
  const s = sh.s || 1;
  const pandaEyes = sh.pandaEyes && a.face === 'content'
    ? `<circle cx="74" cy="124" r="9" fill="#fff"/><circle cx="166" cy="124" r="9" fill="#fff"/><circle cx="74" cy="124" r="5.5" fill="${dark}"/><circle cx="166" cy="124" r="5.5" fill="${dark}"/><circle cx="76" cy="121" r="2" fill="#fff"/><circle cx="168" cy="121" r="2" fill="#fff"/>`
    : null;
  const fa = face(a, sh.dx, sh.ey, s, { mouth: sh.mouth, groin: sh.groin, eyes: pandaEyes });
  const capeBehind = a.outfit === 'cape';
  const filterDef = `<filter id="${uid}sticker" x="-15%" y="-15%" width="130%" height="130%"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="o"/><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#1F4B48" flood-opacity=".25" in="o" result="os"/><feMerge><feMergeNode in="os"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  // La tête (oreilles, visage, chapeau…) forme un groupe : elle suit un peu le regard
  const head = `${sh.back}${sh.head}${sh.topping || ''}${sh.front}${fa}${opts.alive ? reactionEyes(sh) : ''}${acc.glasses}${night ? nightcap(sh) : acc.hat}`;
  const inner = `${capeBehind ? acc.outfit : ''}${sh.body}<g class="k-head">${head}</g>${capeBehind ? '' : acc.outfit}`;
  // Kawaii vivant : rythmes un peu différents pour chacun (respiration, clignement, oreilles)
  const r = (min, max) => (min + Math.random() * (max - min)).toFixed(2) + 's';
  const alive = opts.alive
    ? ` class="kawaii k-alive k-${mood}" data-char="${ch.id}" style="--kb:${r(3.4, 4.6)};--kbd:-${r(0, 4)};--ke:${r(6, 9.5)};--ked:-${r(0, 8)};--kt:${r(6, 11)};--ktd:-${r(0, 9)}"`
    : ' class="kawaii"';
  const bg = a.bg && a.bg !== 'aucun' ? scene(a.bg, uid) : null;
  const zzz = night ? sleepZ(sh) : '';
  return `<svg viewBox="-10 -10 260 260" width="${size}" height="${size}" role="img" aria-label="${name(a)}"${alive}><defs>${filterDef}${defs.join('')}${bg ? bg.defs : ''}</defs>${bg ? bg.art : ''}<g filter="url(#${uid}sticker)" transform="translate(0 ${sh.body ? 0 : 6})">${inner}</g>${zzz}</svg>`;
}


const DEFAULT_CONFIG = { char: 'chat', fur: 'nature', face: 'content', hat: 'aucun', glasses: 'aucune', outfit: 'aucune', outfitColor: 'rose', bg: 'aucun' };

// Nom donné par l'enfant, sinon le nom du personnage (sans caractères HTML)
function name(config) {
  const own = (config.nom || '').replace(/[<>"&]/g, '').trim();
  return own || (CHARS.find(c => c.id === config.char) || CHARS[0]).nom;
}

// Moment de la journée : matin (s'étire), jour, soir (bâille), nuit (dort)
function period(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 20 || h < 6.5) return 'nuit';
  if (h < 9.5) return 'matin';
  if (h >= 18.5) return 'soir';
  return 'jour';
}

function randomConfig() {
  const pick = l => l[Math.floor(Math.random() * l.length)].id;
  return { char: pick(CHARS), fur: pick(FURS), face: pick(FACES), hat: pick(HATS), glasses: pick(GLASSES), outfit: pick(OUTFITS), outfitColor: pick(OUTFIT_COLORS) };
}

// ── Kawaii vivants : regard, caresses et réactions ──
// Les dessins avec { alive: true } respirent, clignent, bougent les oreilles
// (en CSS) ; ici : le regard, les caresses, les réactions et la journée.
// Les sons sont joués par l'app : Kawaii.onSound(personnage, sorte).

const REACTIONS = {
  tape:      { cls: ['k-happy', 'k-squish'], ms: 650 },
  saut:      { cls: ['k-happy', 'k-hop'], ms: 800 },
  bravo:     { cls: ['k-starry', 'k-hop'], ms: 1100 },
  oups:      { cls: ['k-surprise'], ms: 700, then: 'courage' },
  courage:   { cls: ['k-happy', 'k-nod'], ms: 1100 },
  pirouette: { cls: ['k-starry', 'k-spin'], ms: 1300 },
  hoche:     { cls: ['k-nod1'], ms: 320 },
  cache:     { cls: ['k-shut-eyes', 'k-shake'], ms: 700 },
  etire:     { cls: ['k-shut-eyes', 'k-stretch'], ms: 1700 },
  baille:    { cls: ['k-shut-eyes', 'k-yawning'], ms: 1900 },
  reveil:    { cls: ['k-surprise', 'k-hop'], ms: 700, then: 'tape' }
};
const REACTION_CLASSES = [...new Set(Object.values(REACTIONS).flatMap(r => r.cls))];

const aliveOf = el => el && (el.matches && el.matches('.k-alive') ? el : el.querySelector && el.querySelector('.k-alive'));

// el : le svg vivant, ou un élément qui en contient un
function react(el, type) {
  const svg = aliveOf(el);
  const r = REACTIONS[type];
  if (!svg || !r || svg.classList.contains('k-petting')) return; // pendant la caresse, rien ne l'interrompt
  clearTimeout(svg._kTimer);
  svg.classList.remove(...REACTION_CLASSES);
  void svg.getBoundingClientRect(); // relance l'animation si la même revient
  svg.classList.add(...r.cls);
  svg._kTimer = setTimeout(() => {
    svg.classList.remove(...r.cls);
    if (r.then) react(svg, r.then);
  }, r.ms);
}

// Penché en avant (presque fini d'écrire le mot)
function setLean(el, on) {
  const svg = aliveOf(el);
  if (svg) svg.classList.toggle('k-lean', !!on);
}

function sound(svg, kind) {
  if (typeof api.onSound !== 'function') return null;
  try { return api.onSound(svg.dataset.char, kind) || null; } catch (e) { return null; }
}

// Objet qui s'envole de l'endroit touché : propre à chaque personnage
function fly(svg, x, y, delay = 0) {
  const ch = CHARS.find(c => c.id === svg.dataset.char) || CHARS[0];
  const list = ch.objets || ['💖'];
  const h = document.createElement('span');
  h.className = 'k-heart';
  h.textContent = list[Math.floor(Math.random() * list.length)];
  h.style.left = x + 'px';
  h.style.top = y + 'px';
  h.style.setProperty('--dx', (Math.random() * 50 - 25).toFixed(0) + 'px');
  h.style.setProperty('--rot', (Math.random() * 50 - 25).toFixed(0) + 'deg');
  h.style.animationDelay = delay + 'ms';
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 1300 + delay);
}

// La nuit, le kawaii dort ; on le réveille en le touchant, il se rendort ensuite
function isAsleep(svg) {
  return svg.classList.contains('k-nuit') && !svg.classList.contains('k-awake');
}

function wake(svg) {
  const was = isAsleep(svg);
  svg.classList.add('k-awake');
  clearTimeout(svg._kSleep);
  svg._kSleep = setTimeout(() => {
    react(svg, 'baille');
    sound(svg, 'baille');
    setTimeout(() => svg.classList.remove('k-awake'), 1500);
  }, 9000);
  return was;
}

// ── Toucher : tapoter = câlin et cri ; glisser le doigt dessus = caresse ──
// Pendant la caresse, il ferme les yeux de bonheur, penche la tête du côté
// du doigt et ronronne ; des objets s'envolent au fil de la caresse.
let pet = null; // { svg, id, x, y, moved, lastFly, stopSound }

function petStart(e) {
  const svg = e.target.closest && e.target.closest('.k-alive');
  if (!svg || pet) return;
  try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  pet = { svg, id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, lastFly: 0, stopSound: null, stroking: false };
}

function petMove(e) {
  if (!pet || e.pointerId !== pet.id) return;
  const { svg } = pet;
  pet.moved += Math.hypot(e.clientX - pet.x, e.clientY - pet.y);
  pet.x = e.clientX;
  pet.y = e.clientY;
  if (!pet.stroking && pet.moved > 24) {
    pet.stroking = true;
    if (wake(svg)) sound(svg, 'reveil');
    clearTimeout(svg._kTimer);
    svg.classList.remove(...REACTION_CLASSES);
    svg.classList.add('k-petting');
    pet.stopSound = sound(svg, 'ronron');
  }
  if (!pet.stroking) return;
  // La tête penche vers le doigt
  const b = svg.getBoundingClientRect();
  const side = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / (b.width / 2)));
  svg.style.setProperty('--tilt', (side * 9).toFixed(1) + 'deg');
  const now = Date.now();
  if (now - pet.lastFly > 260) {
    pet.lastFly = now;
    fly(svg, e.clientX, e.clientY);
    sound(svg, 'caresse');
  }
}

function petEnd(e) {
  if (!pet || e.pointerId !== pet.id) return;
  const { svg } = pet;
  if (pet.stroking) {
    svg.classList.remove('k-petting');
    svg.style.setProperty('--tilt', '0deg');
    if (pet.stopSound) pet.stopSound();
    react(svg, 'courage');
  } else if (e.type === 'pointerup') {
    tap(svg, e.clientX, e.clientY);
  }
  pet = null;
}

function tap(svg, x, y) {
  if (wake(svg)) {
    react(svg, 'reveil');
    sound(svg, 'reveil');
    fly(svg, x, y);
    return;
  }
  const now = Date.now();
  svg._kTaps = (now - (svg._kLastTap || 0) < 700) ? (svg._kTaps || 0) + 1 : 1;
  svg._kLastTap = now;
  if (svg._kTaps >= 3) {
    svg._kTaps = 0;
    react(svg, 'saut');
    sound(svg, 'saut');
    [0, 120, 240].forEach(d => fly(svg, x, y, d));
  } else {
    react(svg, 'tape');
    sound(svg, 'tape');
    fly(svg, x, y);
  }
}

document.addEventListener('pointerdown', petStart);
document.addEventListener('pointermove', petMove, { passive: true });
document.addEventListener('pointerup', petEnd);
document.addEventListener('pointercancel', petEnd);

// ── Regard : les yeux (et un peu la tête) se tournent vers le doigt ──
// Sans mouvement pendant un moment, ils regardent ailleurs de temps en temps.
// lookAt() fixe le regard sur un point (une case du mot) pour un moment.
const LOOK_MAX = 8; // en unités du dessin (260 de large)
let lookTarget = null;
let lookFrame = 0;
let lastPointer = 0;

function setLook(svg, lx, ly) {
  svg.style.setProperty('--lx', lx.toFixed(1) + 'px');
  svg.style.setProperty('--ly', ly.toFixed(1) + 'px');
}

function lookToward(svg, x, y) {
  const b = svg.getBoundingClientRect();
  if (!b.width) return;
  const dx = x - (b.left + b.width / 2);
  const dy = y - (b.top + b.height * 0.45);
  const dist = Math.hypot(dx, dy) || 1;
  // Plus le point est loin, plus le regard va au bout
  const k = Math.min(1, dist / (b.width * 1.2)) * LOOK_MAX / dist;
  setLook(svg, dx * k, dy * k * 0.7);
}

function lookAt(el, x, y, ms = 2500) {
  const svg = aliveOf(el);
  if (!svg) return;
  svg._kHold = Date.now() + ms;
  lookToward(svg, x, y);
}

function updateLooks() {
  lookFrame = 0;
  const now = Date.now();
  document.querySelectorAll('.k-alive').forEach(svg => {
    if ((svg._kHold || 0) > now || isAsleep(svg)) return;
    lookToward(svg, lookTarget.x, lookTarget.y);
  });
}

function onPointer(e) {
  lastPointer = Date.now();
  lookTarget = { x: e.clientX, y: e.clientY };
  if (!lookFrame) lookFrame = requestAnimationFrame(updateLooks);
}
document.addEventListener('pointermove', onPointer, { passive: true });
document.addEventListener('pointerdown', onPointer, { passive: true });

// ── Vie de tous les jours : coups d'œil, étirements le matin, bâillements le soir ──
setInterval(() => {
  if (document.hidden) return;
  const now = Date.now();
  const idle = now - lastPointer > 2500;
  document.querySelectorAll('.k-alive').forEach(svg => {
    if (isAsleep(svg) || svg.classList.contains('k-petting')) return;
    if (idle && (svg._kHold || 0) < now) {
      // Un coup d'œil au hasard, ou retour au centre
      if (Math.random() < 0.45) setLook(svg, 0, 0);
      else setLook(svg, (Math.random() * 2 - 1) * LOOK_MAX, (Math.random() * 1.2 - 0.6) * LOOK_MAX);
    }
    // Le matin il s'étire, le soir (ou réveillé la nuit) il bâille, de temps en temps
    const sleepy = svg.classList.contains('k-soir') || svg.classList.contains('k-nuit');
    const morning = svg.classList.contains('k-matin');
    if (!sleepy && !morning) return;
    if (!svg._kNext) svg._kNext = now + 3000 + Math.random() * 6000;
    if (now < svg._kNext || svg.className.baseVal.match(/k-(hop|spin|squish|yawning|stretch)/)) return;
    svg._kNext = now + 14000 + Math.random() * 14000;
    react(svg, morning ? 'etire' : 'baille');
    if (!morning) sound(svg, 'baille');
  });
}, 2200);

// Changement de moment de la journée (le soir arrive…) : l'app redessine
let lastPeriod = period();
setInterval(() => {
  const p = period();
  if (p === lastPeriod) return;
  lastPeriod = p;
  document.dispatchEvent(new CustomEvent('kawaii-period', { detail: p }));
}, 60000);

const api = {
  CHARS, FURS, FACES, HATS, GLASSES, OUTFITS, OUTFIT_COLORS, BACKGROUNDS, DEFAULT_CONFIG,
  draw: drawChar,
  react, setLean, lookAt, period,
  randomConfig,
  name,
  onSound: null // fixé par l'app : (personnage, sorte) → fonction d'arrêt éventuelle
};
return api;
})();
