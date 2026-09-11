// ═══════════════════════════════════════════════════════════════
// KAWAII - Personnages dessinés par le code (aucune image)
// ═══════════════════════════════════════════════════════════════
// Même visage pour tous : yeux énormes et écartés, placés bas ; bouche
// minuscule dessous ; joues roses ; contour blanc de sticker.
// Utilisation : Kawaii.draw(config, taille) → chaîne SVG
// config = { char, fur, face, hat, glasses, outfit, outfitColor }

const Kawaii = (function () {

const CHARS = [
  { id: 'chat',     nom: 'Chat',      type: 'animal', fur: '#FFD1B0', famille: 'Animaux' },
  { id: 'lapin',    nom: 'Lapin',     type: 'animal', fur: '#FFFFFF', famille: 'Animaux' },
  { id: 'ours',     nom: 'Ourson',    type: 'animal', fur: '#C9A6F0', famille: 'Animaux' },
  { id: 'panda',    nom: 'Panda',     type: 'animal', fur: '#FFFFFF', famille: 'Animaux' },
  { id: 'renard',   nom: 'Renard',    type: 'animal', fur: '#F2A26A', famille: 'Animaux' },
  { id: 'licorne',  nom: 'Licorne',   type: 'animal', fur: '#FFFFFF', famille: 'Animaux' },
  { id: 'pingouin', nom: 'Pingouin',  type: 'animal', fur: '#4A4066', famille: 'Animaux' },
  { id: 'cochon',   nom: 'Cochon',    type: 'animal', fur: '#FFC2D6', famille: 'Animaux' },
  { id: 'etoile',   nom: 'Étoile',    type: 'objet',  fur: '#FFD466', famille: 'Objets' },
  { id: 'nuage',    nom: 'Nuage',     type: 'objet',  fur: '#FFFFFF', famille: 'Objets' },
  { id: 'coeur',    nom: 'Cœur',      type: 'objet',  fur: '#FF8FA3', famille: 'Objets' },
  { id: 'lune',     nom: 'Lune',      type: 'objet',  fur: '#FFE7A3', famille: 'Objets' },
  { id: 'flan',     nom: 'Flan',      type: 'aliment', fur: '#FFE0A8', famille: 'Aliments' },
  { id: 'cupcake',  nom: 'Cupcake',   type: 'aliment', fur: '#FFB3D6', famille: 'Aliments' },
  { id: 'glace',    nom: 'Glace',     type: 'aliment', fur: '#FFB3D6', famille: 'Aliments' },
  { id: 'fraise',   nom: 'Fraise',    type: 'aliment', fur: '#FF6B7A', famille: 'Aliments' }
];
const FURS = [
  { id: 'nature', c: null }, { id: 'rose', c: '#FFB3D6' }, { id: 'lilas', c: '#C9A6F0' }, { id: 'menthe', c: '#A8ECE6' },
  { id: 'ciel', c: '#B5D4F7' }, { id: 'citron', c: '#FFE7A3' }, { id: 'pêche', c: '#FFD1B0' }, { id: 'blanc', c: '#FFFFFF' }
];
const FACES = [ { id: 'content', nom: 'Content' }, { id: 'rieur', nom: 'Rieur' }, { id: 'dodo', nom: 'Dodo' }, { id: 'etoiles', nom: 'Étoilé' }, { id: 'clin', nom: 'Clin d’œil' }, { id: 'surpris', nom: 'Surpris' }, { id: 'langue', nom: 'Langue' } ];
const HATS = [ { id: 'aucun', nom: 'Rien' }, { id: 'couronne', nom: 'Couronne' }, { id: 'noeud', nom: 'Nœud' }, { id: 'fleur', nom: 'Fleur' }, { id: 'fraise', nom: 'Petite fraise' }, { id: 'bonnet', nom: 'Bonnet' }, { id: 'chapeau', nom: 'Chapeau de fête' } ];
const GLASSES = [ { id: 'aucune', nom: 'Sans' }, { id: 'rondes', nom: 'Rondes' }, { id: 'coeur', nom: 'Cœurs' }, { id: 'soleil', nom: 'Soleil' } ];
const OUTFITS = [ { id: 'aucune', nom: 'Rien' }, { id: 'foulard', nom: 'Foulard' }, { id: 'noeudpap', nom: 'Nœud papillon' }, { id: 'collier', nom: 'Collier' }, { id: 'cape', nom: 'Cape' } ];
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
  const eyes = left + eye(cx + dx);

  const my = ey + 15 * s;
  let mouth;
  if (opts.mouth === 'chat') mouth = `<path d="M${cx - 7 * s} ${my} q${3.5 * s} ${5 * s} ${7 * s} 0 q${3.5 * s} ${5 * s} ${7 * s} 0" fill="none" stroke="${dark}" stroke-width="${2.8 * s}" stroke-linecap="round"/>`;
  else if (opts.mouth === 'nez') mouth = `<ellipse cx="${cx}" cy="${my - 3 * s}" rx="${5 * s}" ry="${3.5 * s}" fill="${dark}"/><path d="M${cx - 6 * s} ${my + 3 * s} q${6 * s} ${5 * s} ${12 * s} 0" fill="none" stroke="${dark}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`;
  else if (opts.mouth === 'bec') mouth = `<path d="M${cx - 8 * s} ${my - 4 * s} L${cx + 8 * s} ${my - 4 * s} L${cx} ${my + 6 * s} Z" fill="#FFB347" ${line}/>`;
  else if (opts.mouth === 'groin') mouth = `<ellipse cx="${cx}" cy="${my - 1 * s}" rx="${11 * s}" ry="${7 * s}" fill="${opts.groin}" ${line}/><circle cx="${cx - 4 * s}" cy="${my - 1 * s}" r="${1.8 * s}" fill="${dark}"/><circle cx="${cx + 4 * s}" cy="${my - 1 * s}" r="${1.8 * s}" fill="${dark}"/>`;
  else mouth = `<path d="M${cx - 6 * s} ${my - 2 * s} q${6 * s} ${6 * s} ${12 * s} 0" fill="none" stroke="${dark}" stroke-width="${2.8 * s}" stroke-linecap="round"/>`;
  if (a.face === 'surpris') mouth = `<ellipse cx="${cx}" cy="${my + 1 * s}" rx="${4.5 * s}" ry="${5.5 * s}" fill="${dark}"/>`;
  if (a.face === 'langue') mouth = `<path d="M${cx - 7 * s} ${my - 2 * s} q${7 * s} ${7 * s} ${14 * s} 0" fill="none" stroke="${dark}" stroke-width="${2.8 * s}" stroke-linecap="round"/><path d="M${cx - 1 * s} ${my + 1 * s} q${4 * s} ${9 * s} ${8 * s} 0 Z" fill="#FF8FA3" stroke="${dark}" stroke-width="${2 * s}"/>`;

  const bx = dx + 14 * s, by = ey + 12 * s;
  const blush = `<ellipse cx="${cx - bx}" cy="${by}" rx="${12 * s}" ry="${7 * s}" fill="#FF8FB1" opacity=".75"/><ellipse cx="${cx + bx}" cy="${by}" rx="${12 * s}" ry="${7 * s}" fill="#FF8FB1" opacity=".75"/>
    <circle cx="${cx - bx - 5 * s}" cy="${by - 2 * s}" r="${1.4 * s}" fill="#fff" opacity=".9"/><circle cx="${cx + bx + 5 * s}" cy="${by - 2 * s}" r="${1.4 * s}" fill="#fff" opacity=".9"/>`;
  return eyes + mouth + blush;
}

// ── Formes de chaque personnage ──
// Retourne { back, body, head, front, ey, dx, hatY, mouth }
function shapes(id, fur, oc) {
  const g = glossy(fur), d2 = darken(fur, .18), pink = '#FFB3D6';
  const flatHead = `<ellipse cx="120" cy="120" rx="92" ry="74" fill="${g}" ${line}/>`;
  const body = (c = fur) => `<ellipse cx="120" cy="206" rx="46" ry="26" fill="${glossy(c)}" ${line}/>
    <ellipse cx="120" cy="210" rx="26" ry="16" fill="#fff" opacity=".5"/>
    <ellipse cx="82" cy="220" rx="14" ry="9" fill="${glossy(c)}" ${line}/><ellipse cx="158" cy="220" rx="14" ry="9" fill="${glossy(c)}" ${line}/>`;
  const S = {
    chat: { back: `<path d="M48 78 L44 22 L98 52 Z" fill="${g}" ${line}/><path d="M192 78 L196 22 L142 52 Z" fill="${g}" ${line}/><path d="M56 68 L54 36 L86 54 Z" fill="${pink}"/><path d="M184 68 L186 36 L154 54 Z" fill="${pink}"/>`,
            body: body(), head: flatHead,
            front: `<path d="M114 138 L126 138 L120 144 Z" fill="#FF8FA3"/><path d="M30 130 L60 134 M30 142 L60 140 M210 130 L180 134 M210 142 L180 140" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>`,
            ey: 124, dx: 46, hatY: 40, mouth: 'chat' },
    lapin: { back: `<ellipse cx="82" cy="34" rx="20" ry="52" fill="${g}" ${line} transform="rotate(-10 82 34)"/><ellipse cx="158" cy="34" rx="20" ry="52" fill="${g}" ${line} transform="rotate(10 158 34)"/><ellipse cx="82" cy="36" rx="10" ry="36" fill="${pink}" transform="rotate(-10 82 36)"/><ellipse cx="158" cy="36" rx="10" ry="36" fill="${pink}" transform="rotate(10 158 36)"/>`,
             body: body(), head: flatHead,
             front: `<ellipse cx="120" cy="136" rx="5" ry="3.5" fill="#FF8FA3"/><rect x="113" y="148" width="14" height="9" rx="3" fill="#fff" stroke="${dark}" stroke-width="2"/><path d="M120 148 L120 157" stroke="${dark}" stroke-width="1.5"/>`,
             ey: 122, dx: 48, hatY: 44, mouth: 'plain' },
    ours: { back: `<circle cx="42" cy="66" r="24" fill="${g}" ${line}/><circle cx="198" cy="66" r="24" fill="${g}" ${line}/><circle cx="42" cy="66" r="12" fill="${pink}"/><circle cx="198" cy="66" r="12" fill="${pink}"/>`,
            body: body(), head: flatHead,
            front: `<ellipse cx="120" cy="146" rx="26" ry="17" fill="#fff" opacity=".85"/>`,
            ey: 122, dx: 48, hatY: 46, mouth: 'nez' },
    panda: { back: `<circle cx="44" cy="66" r="24" fill="${dark}"/><circle cx="196" cy="66" r="24" fill="${dark}"/>`,
             body: body('#3A2B3F').replace(/opacity="\.5"/, 'opacity=".25"'), head: flatHead,
             front: `<ellipse cx="72" cy="122" rx="24" ry="20" fill="${dark}" transform="rotate(-18 72 122)"/><ellipse cx="168" cy="122" rx="24" ry="20" fill="${dark}" transform="rotate(18 168 122)"/>`,
             ey: 124, dx: 46, hatY: 46, mouth: 'nez', pandaEyes: true },
    renard: { back: `<path d="M44 84 L38 18 L102 52 Z" fill="${g}" ${line}/><path d="M196 84 L202 18 L138 52 Z" fill="${g}" ${line}/><path d="M52 72 L48 36 L86 56 Z" fill="${dark}" opacity=".7"/><path d="M188 72 L192 36 L154 56 Z" fill="${dark}" opacity=".7"/>`,
              body: body(), head: flatHead,
              front: `<path d="M56 128 C70 176 170 176 184 128 C160 150 80 150 56 128 Z" fill="#fff"/>`,
              ey: 122, dx: 50, hatY: 40, mouth: 'nez' },
    licorne: { back: `<path d="M120 52 L106 -2 L134 -2 Z" fill="#FFD466" ${line}/><path d="M111 36 L129 30 M109 24 L127 18 M113 12 L125 8" stroke="#E8A317" stroke-width="2.5" stroke-linecap="round"/>
                      <path d="M52 78 L46 26 L100 52 Z" fill="${g}" ${line}/><path d="M188 78 L194 26 L140 52 Z" fill="${g}" ${line}/>
                      <path d="M46 60 C22 74 20 120 36 154 C44 128 56 106 76 88 Z" fill="#FFB3D6" ${line}/><path d="M40 100 C30 116 30 140 38 154 C44 136 50 122 60 108 Z" fill="#C9A6F0"/><path d="M62 74 C50 84 44 96 44 108 C52 96 62 88 74 84 Z" fill="#A8ECE6"/>`,
               body: body(), head: flatHead,
               front: `<ellipse cx="120" cy="146" rx="24" ry="15" fill="#FFE4F1"/><circle cx="111" cy="146" r="3" fill="${dark}" opacity=".55"/><circle cx="129" cy="146" r="3" fill="${dark}" opacity=".55"/>`,
               ey: 120, dx: 48, hatY: 44, mouth: 'none' },
    pingouin: { back: '', body: body(), head: flatHead,
                front: `<path d="M44 128 C44 76 196 76 196 128 C196 170 168 190 120 190 C72 190 44 170 44 128 Z" fill="#fff"/>`,
                ey: 122, dx: 44, hatY: 46, mouth: 'bec' },
    cochon: { back: `<path d="M50 80 L42 34 C60 34 78 44 90 56 Z" fill="${g}" ${line}/><path d="M190 80 L198 34 C180 34 162 44 150 56 Z" fill="${g}" ${line}/><path d="M56 70 L52 44 C64 46 74 52 82 60 Z" fill="${pink}"/><path d="M184 70 L188 44 C176 46 166 52 158 60 Z" fill="${pink}"/>`,
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
function drawChar(a, size) {
  defs = [];
  uid = 'k' + (++drawCount) + '-';
  const ch = find(CHARS, a.char);
  const furOpt = find(FURS, a.fur);
  const fur = furOpt.c || ch.fur;
  const oc = find(OUTFIT_COLORS, a.outfitColor);
  const sh = shapes(ch.id, fur, oc);
  const acc = accessories(a, sh, oc);
  const s = sh.s || 1;
  const fa = sh.pandaEyes && a.face === 'content'
    ? `<circle cx="74" cy="124" r="9" fill="#fff"/><circle cx="166" cy="124" r="9" fill="#fff"/><circle cx="74" cy="124" r="5.5" fill="${dark}"/><circle cx="166" cy="124" r="5.5" fill="${dark}"/><circle cx="76" cy="121" r="2" fill="#fff"/><circle cx="168" cy="121" r="2" fill="#fff"/>` + face({ ...a, face: 'rieur' }, sh.dx, sh.ey, s, { mouth: sh.mouth }).replace(/<path[^>]*stroke-width="4"[^>]*\/>/g, '')
    : face(a, sh.dx, sh.ey, s, { mouth: sh.mouth, groin: sh.groin });
  const capeBehind = a.outfit === 'cape';
  const filterDef = `<filter id="${uid}sticker" x="-15%" y="-15%" width="130%" height="130%"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="o"/><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#1F4B48" flood-opacity=".25" in="o" result="os"/><feMerge><feMergeNode in="os"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const inner = `${capeBehind ? acc.outfit : ''}${sh.back}${sh.body}${sh.head}${sh.topping || ''}${sh.front}${fa}${acc.glasses}${capeBehind ? '' : acc.outfit}${acc.hat}`;
  return `<svg viewBox="-10 -10 260 260" width="${size}" height="${size}" role="img" aria-label="${ch.nom}"><defs>${filterDef}${defs.join('')}</defs><g filter="url(#${uid}sticker)" transform="translate(0 ${sh.body ? 0 : 6})">${inner}</g></svg>`;
}


const DEFAULT_CONFIG = { char: 'chat', fur: 'nature', face: 'content', hat: 'aucun', glasses: 'aucune', outfit: 'aucune', outfitColor: 'rose' };

function randomConfig() {
  const pick = l => l[Math.floor(Math.random() * l.length)].id;
  return { char: pick(CHARS), fur: pick(FURS), face: pick(FACES), hat: pick(HATS), glasses: pick(GLASSES), outfit: pick(OUTFITS), outfitColor: pick(OUTFIT_COLORS) };
}

return {
  CHARS, FURS, FACES, HATS, GLASSES, OUTFITS, OUTFIT_COLORS, DEFAULT_CONFIG,
  draw: drawChar,
  randomConfig,
  name: (config) => (CHARS.find(c => c.id === config.char) || CHARS[0]).nom
};
})();
