// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Le monde : lieux, rangement, carte de la ville
// ═══════════════════════════════════════════════════════════════
// Une liste = un lieu ; un élément de la liste = un objet du lieu.
//   list.lieu   = { kind: 'batiment', type: 'boulangerie' } (maison : étape 5)
//   list.places = { cléÉlément: slotId } ; slotId = "étage:objet" ("0:5")
//   list.parcelle = place du bâtiment sur la carte (0, 1, 2…)
// Clé d'un élément : le mot (listes de mots et de langue), l'id de la carte
// en texte (listes de révision).
//
// Le rangement est stable : un élément garde son objet tant que l'objet
// existe. Seuls les nouveaux éléments sont rangés, d'abord dans les
// étages déjà ouverts : un nouvel étage ne sert que quand les autres sont
// pleins. Au-delà de la place du lieu, plusieurs éléments partagent un objet.
// Le hasard est tiré d'une graine (id de la liste) : deux appareils qui
// rangent la même liste obtiennent le même résultat.

const Monde = (function () {

const COLONNES = 4;          // parcelles par rangée sur la carte
const CELLULE = { w: 250, h: 360 };
const LARGEUR_CARTE = COLONNES * CELLULE.w;

// ── Lieux ──

function batiment(type) {
  return BATIMENTS.find(b => b.id === type) || BATIMENTS[0];
}

// Emplacements d'un lieu, dans l'ordre du parcours (étage par étage)
function slotsOf(lieu) {
  if (!lieu || lieu.kind !== 'batiment') return [];
  return batiment(lieu.type).etages.flatMap((e, ei) => e.objets.map((_, i) => `${ei}:${i}`));
}

// Objet d'un emplacement : { batiment, etage, etageNom, index, forme, couleur, nom }
function slotInfo(lieu, slotId) {
  if (!lieu || !slotId) return null;
  const b = batiment(lieu.type);
  const [ei, i] = slotId.split(':').map(Number);
  const etage = b.etages[ei];
  const o = etage && objetDe(etage.objets[i], etage);
  if (!o) return null;
  return { batiment: b, etage: ei, etageNom: etage.nom, index: i, slotId, ...o };
}

// Supports d'un étage (comptoir, étagère, table, socle) :
// [{ type, x1, x2, haut, pied }] ; haut = y où l'on pose un objet
const HAUTEUR = { comptoir: 90, table: 62, socle: 80 };
function supportsDe(etage) {
  return (etage.supports || []).map(texte => {
    const [type, ...n] = texte.split(' ');
    const v = n.map(Number);
    if (type === 'comptoir') return { type, x1: v[0], x2: v[1], pied: 470, haut: 470 - HAUTEUR.comptoir };
    if (type === 'etagere') return { type, x1: v[0], x2: v[1], pied: v[2], haut: v[2] };
    if (type === 'socle') return { type, x1: v[0] - 45, x2: v[0] + 45, pied: v[1], haut: v[1] - HAUTEUR.socle };
    return { type, x1: v[0], x2: v[1], pied: v[2], haut: v[2] - HAUTEUR.table };
  });
}

// 'four 110 470 1.3', 'pain 500 s0' ou { f, c, nom, at } →
// { forme, couleur, nom, x, y, echelle, z } (z : profondeur de départ)
function objetDe(entree, etage) {
  if (!entree) return null;
  const texte = typeof entree === 'string' ? entree : `${entree.f} ${entree.at || ''}`;
  const [forme, xs, ys, es] = texte.trim().split(/\s+/);
  const info = Objets.info(forme);
  if (!info) return null;
  const x = Number(xs) || 500;
  let y = Number(ys) || 600, z = y;
  if (/^s\d+$/.test(ys || '') && etage) {
    const sup = supportsDe(etage)[Number(ys.slice(1))];
    if (sup) {
      y = sup.haut;
      z = sup.pied + 1;
    }
  }
  return {
    forme, couleur: entree.c || null, nom: entree.nom || info.nom,
    x, y, z, echelle: Number(es) || 1
  };
}

// Dessin d'un objet de lieu. gris : pas encore maîtrisé
function dessinObjet(info, taille, gris) {
  return Objets.draw(info.forme, { couleur: info.couleur, taille, gris });
}

// Clés des éléments d'une liste, dans l'ordre de la liste
function elementKeys(list) {
  if (Storage.isCardList(list)) return (list.cards || []).map(c => String(c.id));
  return [...new Set(list.words || [])];
}

function placeOf(list, key) {
  return slotInfo(list.lieu, (list.places || {})[key]);
}

// Étages occupés par la liste (indices triés)
function etagesUtilises(list) {
  const set = new Set(Object.values(list.places || {}).map(s => Number(s.split(':')[0])));
  return [...set].sort((a, b) => a - b);
}

// ── Hasard reproductible ──

function graine(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hasard(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Rangement ──
// Garde les éléments bien rangés, range ceux qui n'ont pas (ou plus)
// d'objet, oublie ceux qui ont quitté la liste. true si quelque chose a changé.
//
// Révision : les éléments suivent l'ordre du texte, pour qu'une question
// reste voisine du paragraphe qu'elle accompagne. Un nouvel élément prend
// le premier objet libre après celui de l'élément qui le précède.
// Mots : un objet libre au hasard dans le premier étage qui a de la place.
function rangerListe(list) {
  const slots = slotsOf(list.lieu);
  if (slots.length === 0) return false;
  const valides = new Set(slots);
  const keys = elementKeys(list);
  const avant = list.places || {};
  const places = {};
  keys.forEach(k => { if (valides.has(avant[k])) places[k] = avant[k]; });

  const aRanger = keys.filter(k => !places[k]);
  const pris = new Set(Object.values(places));
  const libre = s => !pris.has(s);
  const rand = hasard(graine(`${list.id}:${Object.keys(places).length}:${aRanger.length}`));
  const ordonne = Storage.isCardList(list);

  aRanger.forEach(k => {
    let slot = null;
    if (ordonne) {
      const i = keys.indexOf(k);
      let depart = 0;
      for (let j = i - 1; j >= 0; j--) {
        if (places[keys[j]]) { depart = slots.indexOf(places[keys[j]]) + 1; break; }
      }
      slot = slots.slice(depart).find(libre) || slots.find(libre);
    } else {
      const etage = slots.find(libre);
      if (etage) {
        const prefixe = etage.split(':')[0] + ':';
        const choix = slots.filter(s => libre(s) && s.startsWith(prefixe));
        slot = choix[Math.floor(rand() * choix.length)];
      }
    }
    // Lieu plein : on partage un objet
    if (!slot) slot = ordonne ? slots[keys.indexOf(k) % slots.length] : slots[Math.floor(rand() * slots.length)];
    places[k] = slot;
    pris.add(slot);
  });

  const change = JSON.stringify(places) !== JSON.stringify(avant);
  list.places = places;
  return change;
}

// Bâtiment proposé pour une nouvelle liste : le moins utilisé
function batimentPropose(lists = Storage.getActiveLists()) {
  const compte = id => lists.filter(l => l.lieu && l.lieu.type === id).length;
  return BATIMENTS.reduce((best, b) => (compte(b.id) < compte(best.id) ? b : best), BATIMENTS[0]).id;
}

// Première parcelle libre de la carte (ni une liste, ni la salle de jeux)
function parcelleLibre(lists, sauf) {
  const prises = new Set(lists.filter(l => l !== sauf && !Storage.isArchived(l) && Number.isInteger(l.parcelle)).map(l => l.parcelle));
  const salle = parcelleSalle();
  if (salle !== null) prises.add(salle);
  let p = 0;
  while (prises.has(p)) p++;
  return p;
}

// La salle de jeux a sa parcelle, gardée dans economy.salleJeux
function parcelleSalle() {
  const s = Storage.getEconomy().salleJeux;
  return s && Number.isInteger(s.parcelle) ? s.parcelle : null;
}

// Chaque liste active a sa parcelle, sans doublon. true si quelque chose a changé.
function donnerParcelles(lists) {
  let change = false;
  const vues = new Set();
  const salle = parcelleSalle();
  if (salle !== null) vues.add(salle);
  lists.filter(l => !Storage.isArchived(l)).forEach(l => {
    if (!Number.isInteger(l.parcelle) || vues.has(l.parcelle)) {
      l.parcelle = parcelleLibre(lists, l);
      change = true;
    }
    vues.add(l.parcelle);
  });
  return change;
}

// ── Migration (premier lancement du monde, et à chaque démarrage) ──
// Sans risque à relancer : une liste déjà installée ne bouge pas.
function migrer() {
  const lists = Storage.getLists();
  const anciennes = lists.some(l => !l.lieu || l.wordLocations) || localStorage.getItem('maison') !== null;

  // Copie de sécurité, une seule fois, gardée sur l'appareil
  if (anciennes && !localStorage.getItem('sauvegardeAvantMonde')) {
    const copie = { faiteLe: new Date().toISOString() };
    ['wordLists', 'economy', 'kawaiiTeam', 'maison'].forEach(k => { copie[k] = localStorage.getItem(k); });
    try { localStorage.setItem('sauvegardeAvantMonde', JSON.stringify(copie)); } catch (e) {}
  }

  let change = false;
  lists.forEach((list, i) => {
    if (!list.lieu || (list.lieu.kind === 'batiment' && !BATIMENTS.some(b => b.id === list.lieu.type))) {
      list.lieu = { kind: 'batiment', type: BATIMENTS[i % BATIMENTS.length].id };
      change = true;
    }
    if (list.wordLocations) {
      delete list.wordLocations;
      change = true;
    }
    if (rangerListe(list)) change = true;
  });
  if (donnerParcelles(lists)) change = true;
  if (change) Storage.saveLists(lists);

  // La salle de jeux : un bâtiment de la ville, sur la première parcelle libre
  if (parcelleSalle() === null) {
    const eco0 = Storage.getEconomy();
    eco0.salleJeux = { parcelle: parcelleLibre(lists) };
    Storage.saveEconomy(eco0);
  }

  // Économie : les stickers collés dans l'ancienne maison, puis ceux collés
  // sur la carte (ils vont maintenant dans les étages), reviennent dans le
  // sac ; le kit de meubles de départ est offert une fois.
  const eco = Storage.getEconomy();
  let ecoChange = false;
  if (!eco.version || eco.version < 2) {
    eco.placed = {};
    ecoChange = true;
  }
  if (eco.placed.carte) {
    delete eco.placed.carte;
    ecoChange = true;
  }
  if (!eco.kitDepart) {
    ECONOMIE.kitDepart.forEach(f => { eco.meubles[f] = (eco.meubles[f] || 0) + 1; });
    eco.kitDepart = true;
    ecoChange = true;
  }
  // Version 4 : les pièces ont été recomposées (objets et places de
  // départ) ; les objets déplacés reprennent leur nouvelle place.
  if (eco.version !== 4) {
    if (lists.some(l => l.positions)) {
      lists.forEach(l => { delete l.positions; });
      Storage.saveLists(lists);
    }
    eco.version = 4;
    ecoChange = true;
  }
  if (ecoChange) Storage.saveEconomy(eco);
  localStorage.removeItem('maison');
}

// ── Dessin d'un bâtiment (façade, sans image) ──
// x, y : milieu du pied du bâtiment ; etages : nombre d'étages montrés
function facade(b, etages, x, y) {
  const c = b.couleurs;
  const ink = '#3A2B3F';
  const trait = `stroke="${ink}" stroke-width="3" stroke-linejoin="round"`;
  const w = 168, hEtage = 30, hRdc = 64;
  const h = hRdc + etages * hEtage;
  const g = x - w / 2, top = y - h;
  let s = '';

  // Toit selon le bâtiment (derrière la façade quand il dépasse)
  if (b.id === 'chateau') {
    [g - 14, g + w - 22].forEach(tx => {
      s += `<rect x="${tx}" y="${top - 26}" width="36" height="${h + 26}" rx="4" fill="${c.facade}" ${trait}/>`;
      s += `<path d="M${tx - 6} ${top - 26} L${tx + 18} ${top - 70} L${tx + 42} ${top - 26} Z" fill="${c.toit}" ${trait}/>`;
      s += `<path d="M${tx + 18} ${top - 70} v-16 l14 5 -14 5" fill="${c.accent}" stroke="${ink}" stroke-width="2"/>`;
    });
  }

  s += `<rect x="${g}" y="${top}" width="${w}" height="${h}" rx="6" fill="${c.facade}" ${trait}/>`;

  if (b.id === 'boulangerie' || b.id === 'ecole') {
    s += `<path d="M${g - 12} ${top + 2} L${x} ${top - 46} L${g + w + 12} ${top + 2} Z" fill="${c.toit}" ${trait}/>`;
  }
  if (b.id === 'ecole') {
    s += `<rect x="${x - 18}" y="${top - 74}" width="36" height="34" rx="4" fill="${c.facade}" ${trait}/><path d="M${x - 24} ${top - 74} L${x} ${top - 96} L${x + 24} ${top - 74} Z" fill="${c.toit}" ${trait}/>`;
    s += `<circle cx="${x}" cy="${top - 26}" r="12" fill="#fff" ${trait}/><path d="M${x} ${top - 26} v-7 M${x} ${top - 26} h6" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (b.id === 'musee') {
    s += `<path d="M${g - 10} ${top + 4} L${x} ${top - 36} L${g + w + 10} ${top + 4} Z" fill="${c.toit}" ${trait}/><rect x="${g - 10}" y="${top}" width="${w + 20}" height="10" fill="${c.toit}" ${trait}/>`;
  }
  if (b.id === 'labo') {
    s += `<path d="M${x - 50} ${top + 2} A50 44 0 0 1 ${x + 50} ${top + 2} Z" fill="${c.toit}" ${trait}/><path d="M${x} ${top - 42} v-22" stroke="${ink}" stroke-width="3"/><circle cx="${x}" cy="${top - 66}" r="6" fill="${c.accent}" ${trait}/>`;
  }
  if (b.id === 'coiffure') {
    s += `<rect x="${g - 8}" y="${top - 12}" width="${w + 16}" height="16" rx="5" fill="${c.toit}" ${trait}/>`;
  }
  if (b.id === 'salle') {
    s += `<rect x="${g + 14}" y="${top - 40}" width="${w - 28}" height="36" rx="10" fill="${c.toit}" ${trait}/>`;
    s += `<text x="${x}" y="${top - 13}" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" font-family="system-ui, sans-serif">JEUX</text>`;
    [g + 22, g + 50, g + w - 50, g + w - 22].forEach((lx, i) => { s += `<circle cx="${lx}" cy="${top - 48}" r="5" fill="${['#FFE38A', '#5FD3CE', '#FF9EC7', '#FFE38A'][i]}" class="ville-neon"/>`; });
  }
  if (b.id === 'chateau') {
    for (let k = 0; k < 6; k++) s += `<rect x="${g + 6 + k * 28}" y="${top - 14}" width="18" height="16" fill="${c.facade}" ${trait}/>`;
  }

  // Étages : une rangée de fenêtres chacun
  for (let e = 0; e < etages; e++) {
    const fy = top + 10 + e * hEtage;
    [g + 24, x - 13, g + w - 50].forEach(fx => {
      s += `<rect x="${fx}" y="${fy}" width="26" height="20" rx="5" fill="#CFE8FF" stroke="${ink}" stroke-width="2.5"/><path d="M${fx + 13} ${fy} v20 M${fx} ${fy + 10} h26" stroke="#fff" stroke-width="2"/>`;
    });
  }

  // Rez-de-chaussée : porte, enseigne
  const ry = y - hRdc;
  if (b.id === 'boulangerie') {
    s += `<path d="M${g - 4} ${ry} h${w + 8} l-8 18 h-${w - 8} z" fill="${c.accent}" ${trait}/>`;
    for (let k = 0; k < 6; k++) s += `<rect x="${g + 4 + k * 28}" y="${ry + 1}" width="14" height="15" fill="#fff" opacity=".85"/>`;
  }
  if (b.id === 'coiffure') {
    s += `<rect x="${g + w - 22}" y="${ry + 8}" width="12" height="44" rx="6" fill="#fff" ${trait}/><path d="M${g + w - 22} ${ry + 16} l12 -8 M${g + w - 22} ${ry + 30} l12 -8 M${g + w - 22} ${ry + 44} l12 -8" stroke="${c.accent}" stroke-width="4"/>`;
  }
  if (b.id === 'musee') {
    [g + 14, g + 44, g + w - 56, g + w - 26].forEach(cx => { s += `<rect x="${cx}" y="${ry + 4}" width="12" height="${hRdc - 4}" fill="#fff" stroke="${ink}" stroke-width="2"/>`; });
  }
  s += `<path d="M${x - 22} ${y} v-34 a22 22 0 0 1 44 0 v34 z" fill="${b.id === 'chateau' ? '#9C6B45' : c.toit}" ${trait}/>`;
  s += `<circle cx="${x + 12}" cy="${y - 18}" r="3" fill="#FFD466"/>`;
  if (b.embleme) s += `<circle cx="${g + 36}" cy="${ry + 30}" r="20" fill="#fff" ${trait}/><g transform="translate(${g + 21} ${ry + 15}) scale(.3)">${Objets.inner(b.embleme, null, { gris: true })}</g>`;
  return s;
}

// ── Carte de la ville (accueil) ──

function tronquer(texte, max) {
  const t = String(texte);
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function escape(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Un élément est maîtrisé : mot réussi à 80 % ou plus, carte dans la boîte 3.
// Son objet prend alors ses couleurs.
function estMaitrise(list, key) {
  if (!list) return false;
  if (Storage.isCardList(list)) {
    const card = (list.cards || []).find(c => String(c.id) === String(key));
    return !!card && card.box >= 3;
  }
  const p = (list.progress || {})[key];
  return !!p && p.attempts > 0 && p.lastScore >= 0.8;
}

// Part des éléments maîtrisés (0 à 1)
function maitrise(list) {
  const keys = elementKeys(list);
  return keys.length ? keys.filter(k => estMaitrise(list, k)).length / keys.length : 0;
}

function hauteurCarte(lists) {
  const parcelles = lists.map(l => l.parcelle).concat([parcelleLibre(lists), parcelleSalle() || 0]);
  const rangees = Math.ceil((Math.max(...parcelles) + 1) / COLONNES);
  return rangees * CELLULE.h + 30;
}

function carteSVG(lists) {
  const H = hauteurCarte(lists);
  const nouvelle = parcelleLibre(lists);
  let s = `<rect x="0" y="0" width="${LARGEUR_CARTE}" height="${H}" fill="#CDEFC4"/>`;
  // Petites touffes d'herbe et fleurs
  const rand = hasard(7);
  for (let k = 0; k < 40; k++) {
    const fx = rand() * LARGEUR_CARTE, fy = rand() * H;
    s += k % 3 ? `<path d="M${fx} ${fy} l4 -9 l3 9 l4 -7 l2 7" fill="none" stroke="#9BD48C" stroke-width="2.5" stroke-linecap="round"/>`
      : `<circle cx="${fx}" cy="${fy}" r="4" fill="${['#FFB3D6', '#FFE38A', '#fff'][k % 3 ? 0 : (k % 2) + 1]}"/>`;
  }
  // Rues sous chaque rangée
  const rangees = Math.round((H - 30) / CELLULE.h);
  for (let r = 0; r < rangees; r++) {
    const ry = r * CELLULE.h + 300;
    s += `<rect x="0" y="${ry}" width="${LARGEUR_CARTE}" height="46" fill="#E4DEEC"/><rect x="0" y="${ry}" width="${LARGEUR_CARTE}" height="6" fill="#F6F2FA"/><rect x="0" y="${ry + 40}" width="${LARGEUR_CARTE}" height="6" fill="#F6F2FA"/>`;
    s += `<path d="M10 ${ry + 23} H${LARGEUR_CARTE}" stroke="#fff" stroke-width="4" stroke-dasharray="22 18"/>`;
  }

  lists.forEach(list => {
    const col = list.parcelle % COLONNES, row = Math.floor(list.parcelle / COLONNES);
    const cx = col * CELLULE.w + CELLULE.w / 2, base = row * CELLULE.h + 236;
    const b = batiment(list.lieu.type);
    const etages = Math.max(1, etagesUtilises(list).length);
    const pct = Math.round(maitrise(list) * 100);
    s += `<g class="ville-batiment" role="button" tabindex="0" aria-label="${escape(list.name)}" onclick="Monde.ouvrirLieu(${list.id})">
      <rect x="${cx - 118}" y="${row * CELLULE.h + 4}" width="236" height="292" rx="22" fill="transparent"/>
      <ellipse cx="${cx}" cy="${base + 4}" rx="98" ry="12" fill="#000" opacity=".08"/>
      ${facade(b, etages, cx, base)}
      <text x="${cx}" y="${base + 30}" class="ville-nom" text-anchor="middle">${escape(tronquer(list.name, 18))}</text>
      <rect x="${cx - 60}" y="${base + 42}" width="120" height="10" rx="5" fill="#fff" opacity=".9"/>
      <rect x="${cx - 60}" y="${base + 42}" width="${Math.max(pct ? 10 : 0, 120 * pct / 100)}" height="10" rx="5" fill="#2FB86A"/>
    </g>`;
  });

  // La salle de jeux
  const salle = parcelleSalle();
  if (salle !== null) {
    const sc = salle % COLONNES, sr = Math.floor(salle / COLONNES);
    const cx = sc * CELLULE.w + CELLULE.w / 2, base = sr * CELLULE.h + 236;
    s += `<g class="ville-batiment" role="button" tabindex="0" aria-label="Salle de jeux" onclick="showArcadeScreen()">
      <rect x="${cx - 118}" y="${sr * CELLULE.h + 4}" width="236" height="292" rx="22" fill="transparent"/>
      <ellipse cx="${cx}" cy="${base + 4}" rx="98" ry="12" fill="#000" opacity=".08"/>
      ${facade(SALLE_JEUX, 2, cx, base)}
      <text x="${cx}" y="${base + 30}" class="ville-nom" text-anchor="middle">Salle de jeux</text>
    </g>`;
  }

  // Parcelle libre : nouvelle liste
  const col = nouvelle % COLONNES, row = Math.floor(nouvelle / COLONNES);
  const cx = col * CELLULE.w + CELLULE.w / 2, cy = row * CELLULE.h + 150;
  s += `<g class="ville-batiment ville-nouveau" role="button" tabindex="0" aria-label="Nouvelle liste" onclick="showNewListScreen()">
    <rect x="${cx - 96}" y="${cy - 96}" width="192" height="200" rx="26" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-width="5" stroke-dasharray="16 12"/>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="64" font-weight="900" fill="#8E5FC4">+</text>
    <text x="${cx}" y="${cy + 64}" text-anchor="middle" class="ville-nom">Nouvelle liste</text>
  </g>`;

  return `<svg class="ville-svg" viewBox="0 0 ${LARGEUR_CARTE} ${H}" role="img" aria-label="Ma ville">${s}</svg>`;
}

function renderCarte() {
  const card = document.getElementById('ville-card');
  if (!card) return;
  const lists = Storage.getActiveLists();
  const carte = carteSVG(lists);
  card.innerHTML = `
    <div class="ville-head">
      <h2>🏙️ Ma ville</h2>
      <span class="ville-temps">${TempsJeu.texte()}</span>
    </div>
    <div class="ville" id="ville">
      ${carte}
    </div>
    ${lists.length === 0 ? '<p class="hint text-center">Tape sur le + pour construire ton premier lieu : une liste de mots ou de questions.</p>' : ''}
  `;
}

// Feuille d'un lieu : sa liste et ses modes de jeu
function ouvrirLieu(listId) {
  const list = Storage.getActiveLists().find(l => l.id === listId);
  if (!list) return;
  const b = batiment(list.lieu.type);
  const etages = etagesUtilises(list);
  const n = etages.length;
  showSheet(`
    <div class="lieu-sheet-head">
      <span class="lieu-sheet-emoji">${Objets.draw(b.embleme, { taille: 56 })}</span>
      <div>
        <div class="lieu-sheet-type">${escape(b.nom)} · ${n} étage${n > 1 ? 's' : ''}</div>
        <div class="lieu-sheet-etages">${etages.map(e => escape(capitalizeFirst(b.etages[e].nom))).join(' · ')}</div>
      </div>
    </div>
    ${Storage.isCardList(list) ? cardListHTML(list) : wordListHTML(list)}
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Fermer</button>
      <button class="btn btn-secondary" onclick="closeSheet(); Scene.ouvrirLibre(${list.id})">🧸 Jouer dans ce lieu</button>
    </div>
  `);
}

// ── Choix du lieu (création et édition d'une liste) ──
// containerId : où dessiner les choix ; selected : id du bâtiment choisi
function renderChoixLieu(containerId, selected, onPick) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = BATIMENTS.map(b => `
    <button type="button" class="lieu-choix${b.id === selected ? ' selected' : ''}" onclick="${onPick}('${b.id}')" aria-pressed="${b.id === selected}">
      <svg viewBox="-110 -232 220 240" width="92" height="100" aria-hidden="true">${facade(b, 2, 0, 0)}</svg>
      <span>${escape(b.nom)}</span>
    </button>
  `).join('');
}

// Texte court d'un emplacement : « Boulangerie · étage 1 (le fournil) »
function lieuTexte(info) {
  return `${info.batiment.nom} · étage ${info.etage + 1} (${info.etageNom})`;
}

return {
  batiment, slotsOf, slotInfo, supportsDe, elementKeys, placeOf, etagesUtilises,
  rangerListe, batimentPropose, objetDe, dessinObjet, parcelleLibre, donnerParcelles, migrer,
  renderCarte, ouvrirLieu, renderChoixLieu, lieuTexte, maitrise, estMaitrise, facade
};
})();
