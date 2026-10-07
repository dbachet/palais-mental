// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Les étages : décor, objets, déco, kawaii
// ═══════════════════════════════════════════════════════════════
// Une scène = un étage d'un lieu, dessiné par le code (aucune image).
// Unités : 1000 × 640 (le sol commence à y = 430). La position d'un objet
// est celle du milieu de son pied.
//
// Deux modes :
// - 'calme' (Apprendre, S'entraîner) : la pièce, les objets d'apprentissage
//   et le kawaii, qui marche vers l'objet du moment. Les déco sont très
//   pâles et ne se touchent pas.
// - 'libre' (🧸 Jouer) : elle se promène d'étage en étage, déplace les
//   objets d'apprentissage (le mot suit son objet) et son kawaii, pose et
//   retire des déco (meubles et stickers gagnés). Le temps de jeu du jour
//   s'écoule (TempsJeu, js/recompenses.js).
//
// list.positions = { slotId: { x, y } } : où elle a mis les objets
// d'apprentissage (sinon, leur place de départ). Déco : economy.placed,
// scène `bat:<listeId>:<étage>`.

const Scene = (function () {

const W = 1000, H = 640, SOL = 430;
const TAILLE = { sol: 170, petit: 110, mur: 120 };
let uid = 0;

// ── Place de départ des 12 objets : de gauche à droite (ordre du parcours),
// en deux rangées pour qu'ils ne se cachent pas ; les objets accrochés au mur.
function positionDepart(index, k) {
  const x = 80 + index * 76.4;
  if (k === 'mur') return { x, y: index % 2 ? 250 : 335 };
  return { x, y: index % 2 ? 612 : 512 };
}

function sceneId(list, etage) {
  return `bat:${list.id}:${etage}`;
}

// Objets d'apprentissage d'un étage : [{ slotId, info, keys, pos, maitrise }]
function objetsEtage(list, etage) {
  const parSlot = {};
  Object.entries(list.places || {}).forEach(([key, slot]) => {
    (parSlot[slot] = parSlot[slot] || []).push(key);
  });
  return Object.keys(parSlot)
    .filter(slot => Number(slot.split(':')[0]) === etage)
    .map(slotId => {
      const info = Monde.slotInfo(list.lieu, slotId);
      if (!info) return null;
      const k = (Objets.info(info.forme) || {}).k || 'sol';
      const pos = (list.positions || {})[slotId] || positionDepart(info.index, k);
      const keys = parSlot[slotId];
      return { slotId, info, k, keys, pos, maitrise: keys.every(key => Monde.estMaitrise(list, key)) };
    })
    .filter(Boolean)
    .sort((a, b) => a.info.index - b.info.index);
}

// ── Décor de l'étage (murs, sol, fenêtres) ──

function motif(id, nom, c) {
  const clair = 'rgba(255,255,255,.45)', fonce = 'rgba(58,43,63,.07)';
  const p = (w, h, art) => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${art}</pattern>`;
  switch (nom) {
    case 'rayures': return p(60, 60, `<rect width="28" height="60" fill="${clair}"/>`);
    case 'pois': return p(56, 56, `<circle cx="14" cy="14" r="6" fill="${clair}"/><circle cx="42" cy="42" r="6" fill="${clair}"/>`);
    case 'losanges': return p(60, 60, `<path d="M30 4 L56 30 L30 56 L4 30 Z" fill="${clair}"/>`);
    case 'briques': return p(80, 40, `<path d="M0 20 H80 M40 0 V20 M0 20 V40 M80 20 V40" stroke="${fonce}" stroke-width="3" fill="none"/>`);
    case 'pierre': return p(120, 80, `<path d="M4 4 h52 v32 h-52 z M64 4 h52 v32 h-52 z M34 44 h52 v32 h-52 z" fill="${clair}" stroke="${fonce}" stroke-width="2"/>`);
    case 'etoiles': return p(90, 90, `<path d="M20 10 l3 7 7 .6 -5.4 4.6 1.7 7 -6.3 -3.8 -6.3 3.8 1.7 -7 -5.4 -4.6 7 -.6z" fill="#FFE38A" opacity=".8"/><circle cx="66" cy="60" r="2.5" fill="#fff" opacity=".8"/>`);
    case 'carreaux': return p(50, 50, `<path d="M0 0 H50 V50" stroke="${clair}" stroke-width="5" fill="none"/>`);
    case 'vagues': return p(80, 40, `<path d="M0 20 q20 -14 40 0 t40 0" stroke="${clair}" stroke-width="6" fill="none"/>`);
    default: return '';
  }
}

function sol(nom, c, id) {
  const y = SOL, h = H - SOL;
  const ligne = 'rgba(58,43,63,.12)';
  let art = `<rect x="0" y="${y}" width="${W}" height="${h}" fill="${c}"/>`;
  if (nom === 'parquet') {
    for (let r = 0; r < 5; r++) art += `<path d="M0 ${y + r * 44} H${W}" stroke="${ligne}" stroke-width="3"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${(i * 180 + r * 90) % W} ${y + r * 44} v44" stroke="${ligne}" stroke-width="3"/>`).join('');
  } else if (nom === 'carrelage') {
    for (let i = 0; i <= 20; i++) art += `<path d="M${i * 50} ${y} V${H}" stroke="rgba(255,255,255,.5)" stroke-width="3"/>`;
    for (let r = 0; r <= 4; r++) art += `<path d="M0 ${y + r * 52} H${W}" stroke="rgba(255,255,255,.5)" stroke-width="3"/>`;
  } else if (nom === 'damier') {
    for (let r = 0; r < 5; r++) for (let i = 0; i < 20; i++) if ((i + r) % 2) art += `<rect x="${i * 50}" y="${y + r * 42}" width="50" height="42" fill="rgba(255,255,255,.45)"/>`;
  } else if (nom === 'tapis') {
    art += `<ellipse cx="${W / 2}" cy="${y + 120}" rx="380" ry="74" fill="rgba(255,255,255,.4)" stroke="rgba(255,255,255,.75)" stroke-width="8" stroke-dasharray="2 14" stroke-linecap="round"/>`;
  } else if (nom === 'pierre') {
    for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) art += `<rect x="${i * 120 + (r % 2) * 60 - 30}" y="${y + 6 + r * 52}" width="110" height="44" rx="10" fill="rgba(255,255,255,.18)" stroke="${ligne}" stroke-width="2"/>`;
  } else if (nom === 'herbe') {
    for (let i = 0; i < 40; i++) art += `<path d="M${(i * 97) % W} ${y + 20 + (i * 37) % (h - 30)} l5 -12 l4 12 l5 -9 l3 9" fill="none" stroke="rgba(58,120,60,.35)" stroke-width="3" stroke-linecap="round"/>`;
  }
  return art;
}

function fenetre(nom, x, accent) {
  const cadre = `fill="#CFE8FF" stroke="#fff" stroke-width="10"`;
  const croix = `stroke="#fff" stroke-width="6"`;
  if (nom === 'ronde') return `<circle cx="${x}" cy="150" r="70" ${cadre}/><path d="M${x - 70} 150 H${x + 70} M${x} 80 V220" ${croix}/>`;
  if (nom === 'arche') return `<path d="M${x - 70} 260 V140 a70 70 0 0 1 140 0 V260 Z" ${cadre}/><path d="M${x} 70 V260 M${x - 70} 170 H${x + 70}" ${croix}/>`;
  if (nom === 'vitrail') return `<path d="M${x - 64} 270 V140 a64 64 0 0 1 128 0 V270 Z" fill="${accent}" stroke="#fff" stroke-width="10" opacity=".9"/><path d="M${x} 76 V270 M${x - 64} 150 L${x + 64} 230 M${x + 64} 150 L${x - 64} 230" ${croix}/>`;
  return `<rect x="${x - 80}" y="70" width="160" height="180" rx="12" ${cadre}/><path d="M${x} 70 V250 M${x - 80} 160 H${x + 80}" ${croix}/><path d="M${x - 80} 70 h160 v26 q-80 18 -160 0 z" fill="rgba(255,255,255,.6)"/>`;
}

function decor(etage, b) {
  const id = 'sc' + (++uid);
  let defs = motif(id + 'm', etage.motif, etage.mur);
  let art = '';
  if (etage.fenetre === 'ciel') {
    // Sur le toit : le ciel à la place du mur
    defs += `<linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD3FF"/><stop offset="1" stop-color="#E6F5FF"/></linearGradient>`;
    art += `<rect width="${W}" height="${SOL}" fill="url(#${id}c)"/><circle cx="860" cy="90" r="46" fill="#FFE38A"/>`;
    [[120, 90], [420, 60], [640, 120]].forEach(([x, y]) => { art += `<g fill="#fff" opacity=".9"><circle cx="${x}" cy="${y}" r="26"/><circle cx="${x + 30}" cy="${y - 12}" r="32"/><circle cx="${x + 62}" cy="${y}" r="24"/><rect x="${x}" y="${y}" width="62" height="24"/></g>`; });
    art += `<rect x="0" y="${SOL - 70}" width="${W}" height="14" fill="#fff" opacity=".85"/>` + Array.from({ length: 21 }, (_, i) => `<rect x="${i * 50}" y="${SOL - 70}" width="10" height="70" fill="#fff" opacity=".85"/>`).join('');
  } else {
    art += `<rect width="${W}" height="${SOL}" fill="${etage.mur}"/>`;
    if (defs) art += `<rect width="${W}" height="${SOL}" fill="url(#${id}m)"/>`;
    art += `<rect width="${W}" height="26" fill="${b.couleurs.accent}" opacity=".55"/>`;
    art += fenetre(etage.fenetre, 230, b.couleurs.accent) + fenetre(etage.fenetre, 770, b.couleurs.accent);
    art += `<rect x="0" y="${SOL - 14}" width="${W}" height="14" fill="rgba(58,43,63,.12)"/>`;
  }
  art += sol(etage.solType, etage.sol, id);
  art += `<rect x="0" y="${SOL}" width="${W}" height="${H - SOL}" fill="url(#${id}o)"/>`;
  defs += `<linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".3" stop-color="#000" stop-opacity="0"/></linearGradient>`;
  return `<svg class="scene-fond" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs>${defs}</defs>${art}</svg>`;
}

// Petite table sous les petits objets
const TABLE = `<svg class="scene-table" viewBox="0 0 100 56" aria-hidden="true"><ellipse cx="50" cy="8" rx="46" ry="8" fill="#E8C7A0" stroke="#3A2B3F" stroke-width="3"/><path d="M50 16 V50 M30 54 H70" stroke="#3A2B3F" stroke-width="4" stroke-linecap="round"/></svg>`;

function pct(v, total) {
  return (v / total * 100).toFixed(3) + '%';
}

function placeStyle(x, y, largeur) {
  return `left:${pct(x, W)};top:${pct(y, H)};width:${pct(largeur, W)};z-index:${Math.round(y)}`;
}

// ── Dessin d'une scène ──
// opts : { list, etage, mode: 'calme' | 'libre', cible: slotId, onCible() }
function render(host, opts) {
  const { list, etage, mode } = opts;
  const b = Monde.batiment(list.lieu.type);
  const e = b.etages[etage];
  const objets = objetsEtage(list, etage);
  const deco = Storage.getDeco(sceneId(list, etage));

  const objHTML = objets.map(o => {
    const taille = TAILLE[o.k];
    const cible = o.slotId === opts.cible;
    return `<button type="button" class="scene-obj obj-${o.k}${cible ? ' obj-cible' : ''}${o.maitrise ? ' obj-maitrise' : ''}" data-slot="${o.slotId}"
        style="${placeStyle(o.pos.x, o.pos.y, taille)}" aria-label="${escapeText(o.info.nom)}"${mode === 'calme' && !cible ? ' tabindex="-1"' : ''}>
        ${Objets.draw(o.info.forme, { couleur: o.info.couleur, taille: 100, gris: !o.maitrise })}
        ${o.k === 'petit' ? TABLE : ''}
        ${mode === 'libre' ? '<span class="obj-pastille" aria-hidden="true">⭐</span>' : ''}
      </button>`;
  }).join('');

  const decoHTML = deco.map((d, i) => {
    const art = d.meuble ? Objets.draw(d.meuble, { taille: 100 }) : stickerArt(d.sticker, 100);
    const largeur = d.meuble ? TAILLE[(Objets.info(d.meuble) || {}).k || 'sol'] : 80;
    return `<div class="scene-deco${d.sticker ? ' deco-sticker' : ''}" data-index="${i}" style="${placeStyle(d.x, d.y, largeur)}">${art}</div>`;
  }).join('');

  const main = Storage.getTeam().main;
  const kawaii = main ? `<div class="scene-kawaii"${mode === 'libre' ? ' data-drag' : ''} style="${placeStyle(60, 620, 120)}">${Kawaii.draw(main, 120, { alive: true, mood: Kawaii.period() === 'nuit' ? 'soir' : undefined })}</div>` : '';

  host.innerHTML = `
    <div class="scene scene-${mode}" data-scene="${sceneId(list, etage)}">
      ${decor(e, b)}
      <div class="scene-items">${decoHTML}${objHTML}${kawaii}</div>
      <div class="scene-armed-hint hidden">👆 Tape dans la pièce pour le poser</div>
    </div>`;

  const el = host.querySelector('.scene');
  if (mode === 'calme') {
    const cible = el.querySelector('.obj-cible');
    if (cible && opts.onCible) cible.addEventListener('click', opts.onCible);
    const o = objets.find(x => x.slotId === opts.cible);
    if (o) marcherVers(el, o);
  }
  return el;
}

// Le kawaii marche jusqu'à l'objet (à sa gauche), puis le regarde
function marcherVers(el, o) {
  const k = el.querySelector('.scene-kawaii');
  if (!k) return;
  const x = Math.max(60, o.pos.x - (o.k === 'sol' ? 110 : 80));
  const y = o.k === 'mur' ? 600 : Math.max(o.pos.y + 8, 560);
  // Petit délai : la scène est d'abord dessinée, puis le kawaii part
  setTimeout(() => {
    k.classList.add('marche');
    k.style.left = pct(x, W);
    k.style.top = pct(y, H);
    k.style.zIndex = Math.round(y);
    setTimeout(() => {
      k.classList.remove('marche');
      const obj = el.querySelector('.obj-cible');
      if (obj) {
        const r = obj.getBoundingClientRect();
        Kawaii.lookAt(k, r.left + r.width / 2, r.top + r.height / 2, 8000);
      }
    }, 1300);
  }, 120);
}

// ── Point de l'écran → unités de la scène ──
function versScene(el, e) {
  const r = el.getBoundingClientRect();
  return {
    x: Math.max(20, Math.min(W - 20, (e.clientX - r.left) / r.width * W)),
    y: Math.max(60, Math.min(H - 4, (e.clientY - r.top) / r.height * H))
  };
}

// ═══════════════════════════════════════════════════════════════
// MODE LIBRE : 🧸 Jouer dans un lieu
// ═══════════════════════════════════════════════════════════════

const Libre = { listId: null, etage: 0, onglet: 'meubles', armed: null, tiroir: false };

function listeLibre() {
  return Storage.getActiveLists().find(l => l.id === Libre.listId) || null;
}

// Entrer dans un lieu. opts : { etage, onglet: 'meubles' | 'stickers', tiroir }
function ouvrirLibre(listId, opts = {}) {
  const list = Storage.getActiveLists().find(l => l.id === listId);
  if (!list) return;
  if (!TempsJeu.peutJouer()) {
    TempsJeu.proposerAchat(() => ouvrirLibre(listId, opts));
    return;
  }
  const etages = Monde.etagesUtilises(list);
  Libre.listId = listId;
  Libre.etage = etages.includes(opts.etage) ? opts.etage : (etages[0] || 0);
  Libre.onglet = opts.onglet || 'meubles';
  Libre.tiroir = !!opts.tiroir;
  Libre.armed = null;
  showScreen('lieu');
  TempsJeu.demarrer(() => finDuTemps());
  renderLibre();
}

function renderLibre() {
  const list = listeLibre();
  if (!list) return;
  const b = Monde.batiment(list.lieu.type);
  const etages = Monde.etagesUtilises(list);
  document.getElementById('lieu-titre').textContent = `${b.nom} · ${list.name}`;
  document.getElementById('lieu-etages').innerHTML = etages.map(e => `
    <button type="button" class="etage-chip${e === Libre.etage ? ' selected' : ''}" onclick="Scene.allerEtage(${e})" aria-pressed="${e === Libre.etage}">
      <strong>Étage ${e + 1}</strong><span>${escapeText(b.etages[e].nom)}</span>
    </button>`).join('');
  const el = render(document.getElementById('lieu-scene'), { list, etage: Libre.etage, mode: 'libre' });
  el.classList.toggle('armed', !!Libre.armed);
  el.querySelector('.scene-armed-hint').classList.toggle('hidden', !Libre.armed);
  el.addEventListener('pointerdown', onDown);
  renderTiroir();
}

function allerEtage(e) {
  Libre.etage = e;
  Libre.armed = null;
  renderLibre();
}

// ── Tiroir : meubles et stickers de son inventaire ──
function renderTiroir() {
  const box = document.getElementById('lieu-tiroir');
  const btn = document.getElementById('lieu-btn-tiroir');
  if (btn) btn.setAttribute('aria-expanded', Libre.tiroir);
  if (!box) return;
  box.classList.toggle('hidden', !Libre.tiroir);
  if (!Libre.tiroir) return;
  const n = Storage.getDeco(sceneId(listeLibre(), Libre.etage)).length;
  const items = Libre.onglet === 'meubles'
    ? Storage.getFreeMeubles().map(({ forme, count }) => `
        <button type="button" class="tiroir-item${Libre.armed && Libre.armed.meuble === forme ? ' selected' : ''}" onclick="Scene.armer({ meuble: '${forme}' })">
          ${Objets.draw(forme, { taille: 56 })}<span>${escapeText(capitalizeFirst(Objets.info(forme).nom))}${count > 1 ? ` ×${count}` : ''}</span>
        </button>`).join('')
    : Storage.getFreeStickers().map(({ sticker, count }) => `
        <button type="button" class="tiroir-item${Libre.armed && Libre.armed.sticker === sticker.id ? ' selected' : ''}" onclick="Scene.armer({ sticker: '${sticker.id}' })">
          ${stickerArt(sticker, 56)}<span>${escapeText(sticker.nom)}${count > 1 ? ` ×${count}` : ''}</span>
        </button>`).join('');
  const vide = Libre.onglet === 'meubles'
    ? 'Plus de meubles dans ton inventaire. Tu en gagnes dans les coffres et à la boutique.'
    : 'Ton sac de stickers est vide. Tu en gagnes dans les coffres et à la boutique.';
  box.innerHTML = `
    <div class="tiroir-onglets" role="tablist">
      <button type="button" role="tab" class="tiroir-onglet${Libre.onglet === 'meubles' ? ' selected' : ''}" aria-selected="${Libre.onglet === 'meubles'}" onclick="Scene.onglet('meubles')">🛋️ Meubles</button>
      <button type="button" role="tab" class="tiroir-onglet${Libre.onglet === 'stickers' ? ' selected' : ''}" aria-selected="${Libre.onglet === 'stickers'}" onclick="Scene.onglet('stickers')">🎒 Stickers</button>
      <span class="tiroir-compte">${n}/${ECONOMIE.maxDecoParScene} dans cet étage</span>
    </div>
    ${items ? `<div class="tiroir-grille">${items}</div>` : `<p class="hint text-center">${vide}</p>`}`;
}

function basculerTiroir() {
  Libre.tiroir = !Libre.tiroir;
  if (!Libre.tiroir) Libre.armed = null;
  renderLibre();
}

function onglet(nom) {
  Libre.onglet = nom;
  Libre.armed = null;
  renderLibre();
}

function armer(item) {
  const same = Libre.armed && (Libre.armed.meuble === item.meuble && Libre.armed.sticker === item.sticker);
  Libre.armed = same ? null : item;
  renderLibre();
  if (Libre.armed) document.getElementById('lieu-scene').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Toucher dans la scène : poser, déplacer, retirer ──
function onDown(e) {
  const el = e.currentTarget;
  TempsJeu.activite();
  if (Libre.armed) {
    e.preventDefault();
    const p = versScene(el, e);
    const list = listeLibre();
    if (Storage.placeDeco(sceneId(list, Libre.etage), Libre.armed, p.x, p.y)) {
      playStarSound();
      if (Libre.armed.sticker) Defis.track('sticker');
    } else {
      showFeedback(`Pas plus de ${ECONOMIE.maxDecoParScene} déco par étage`, 'error');
    }
    Libre.armed = null;
    renderLibre();
    return;
  }
  const cible = e.target.closest('.scene-obj, .scene-deco, .scene-kawaii');
  if (cible) glisser(e, el, cible);
}

function glisser(e, sceneEl, item) {
  e.preventDefault();
  const start = { x: e.clientX, y: e.clientY };
  let moved = false;
  const isDeco = item.classList.contains('scene-deco');
  const isKawaii = item.classList.contains('scene-kawaii');
  try { item.setPointerCapture(e.pointerId); } catch (err) {}
  item.classList.add('dragging');
  // Appui long sur une déco : la retirer
  const appuiLong = isDeco ? setTimeout(() => { if (!moved) { fin(); demanderRetrait(Number(item.dataset.index)); } }, 600) : null;
  const move = (ev) => {
    if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 8) return;
    moved = true;
    clearTimeout(appuiLong);
    TempsJeu.activite();
    const p = versScene(sceneEl, ev);
    item.style.left = pct(p.x, W);
    item.style.top = pct(p.y, H);
    item.style.zIndex = 2000;
  };
  const up = (ev) => {
    fin();
    if (!moved) {
      if (isKawaii) Kawaii.react(item, 'saut');
      return;
    }
    const p = versScene(sceneEl, ev);
    item.style.zIndex = Math.round(p.y);
    const list = listeLibre();
    if (isDeco) Storage.moveDeco(sceneId(list, Libre.etage), Number(item.dataset.index), p.x, p.y);
    else if (!isKawaii) deplacerObjet(list.id, item.dataset.slot, p);
  };
  const fin = () => {
    clearTimeout(appuiLong);
    item.classList.remove('dragging');
    item.removeEventListener('pointermove', move);
    item.removeEventListener('pointerup', up);
    item.removeEventListener('pointercancel', up);
  };
  item.addEventListener('pointermove', move);
  item.addEventListener('pointerup', up);
  item.addEventListener('pointercancel', up);
}

function deplacerObjet(listId, slotId, p) {
  const lists = Storage.getLists();
  const list = lists.find(l => l.id === listId);
  if (!list) return;
  list.positions = list.positions || {};
  list.positions[slotId] = { x: Math.round(p.x), y: Math.round(p.y) };
  Storage.saveLists(lists);
}

function remettreEnPlace() {
  const lists = Storage.getLists();
  const list = lists.find(l => l.id === Libre.listId);
  if (!list || !list.positions) return;
  Object.keys(list.positions).forEach(slot => { if (Number(slot.split(':')[0]) === Libre.etage) delete list.positions[slot]; });
  Storage.saveLists(lists);
  renderLibre();
}

function demanderRemettre() {
  showSheet(`
    <h3>Remettre les objets à leur place ?</h3>
    <p class="text-center">Les objets qui portent tes mots reviennent à leur place de départ dans cet étage. Tes déco ne bougent pas.</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Non</button>
      <button class="btn btn-secondary" onclick="closeSheet(); Scene.remettreEnPlace()">Oui</button>
    </div>
  `);
}

function demanderRetrait(index) {
  const list = listeLibre();
  const d = Storage.getDeco(sceneId(list, Libre.etage))[index];
  if (!d) return;
  const art = d.meuble ? Objets.draw(d.meuble, { taille: 110 }) : stickerArt(d.sticker, 110);
  const nom = d.meuble ? capitalizeFirst(Objets.info(d.meuble).nom) : d.sticker.nom;
  showSheet(`
    <div class="sheet-art">${art}</div>
    <h3>${escapeText(nom)}</h3>
    <p class="text-center">Le retirer ? Il retourne dans ton inventaire.</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Garder</button>
      <button class="btn btn-secondary" onclick="closeSheet(); Scene.retirer(${index})">Retirer</button>
    </div>
  `);
}

function retirer(index) {
  Storage.removeDeco(sceneId(listeLibre(), Libre.etage), index);
  renderLibre();
}

function quitter() {
  TempsJeu.arreter();
  showScreen('home');
}

function finDuTemps() {
  TempsJeu.arreter();
  const main = Storage.getTeam().main;
  const k = document.querySelector('#lieu-scene .scene-kawaii');
  if (k) Kawaii.react(k, 'baille');
  // Le temps est fini : retour à la ville (on ne peut plus rien bouger),
  // avec de quoi acheter du temps et revenir au même étage
  setTimeout(() => {
    if (AppState.currentScreen !== 'lieu') return;
    const { listId, etage } = Libre;
    const ong = Libre.onglet;
    showScreen('home');
    TempsJeu.messageFin(() => ouvrirLibre(listId, { etage, onglet: ong }), null, main);
  }, 900);
}

// Coller un sticker : choisir le lieu, puis y entrer avec le sac ouvert
function choisirLieu(onglet = 'stickers') {
  const lists = Storage.getActiveLists();
  if (lists.length === 0) {
    showSheet(`
      <h3>Pas encore de lieu</h3>
      <p class="text-center">Crée une liste : elle aura son bâtiment, où tu pourras décorer.</p>
      <div class="sheet-actions"><button class="btn btn-primary" onclick="closeSheet()">D'accord</button></div>
    `);
    return;
  }
  showSheet(`
    <h3>Dans quel lieu ?</h3>
    <div class="lieu-pick-list">
      ${lists.map(l => {
        const b = Monde.batiment(l.lieu.type);
        return `<button type="button" class="lieu-pick" onclick="closeSheet(); Scene.ouvrirLibre(${l.id}, { onglet: '${onglet}', tiroir: true })">
          ${Objets.draw(b.embleme, { taille: 44 })}<span><strong>${escapeText(l.name)}</strong><small>${escapeText(b.nom)}</small></span>
        </button>`;
      }).join('')}
    </div>
    <div class="sheet-actions"><button class="btn btn-ghost" onclick="closeSheet()">Annuler</button></div>
  `);
}

return {
  render, objetsEtage, sceneId, positionDepart,
  ouvrirLibre, allerEtage, basculerTiroir, onglet, armer, retirer,
  remettreEnPlace, demanderRemettre, quitter, choisirLieu
};
})();
