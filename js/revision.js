// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Listes de révision : questions, leçons, images
// ═══════════════════════════════════════════════════════════════
// Une liste de révision (type 'cartes-questions') mélange des questions et
// des leçons, dans l'ordre du texte. Chaque élément est rangé sur un objet
// du lieu, dans cet ordre (js/monde.js).
//   Question : { id, q, a, box }
//   Leçon    : { id, kind: 'lecon', titre, texte, image, box }
//              image = n, l'image n de la liste (list.images = { n: id },
//              js/images.js) ; titre et texte peuvent être vides (image seule)
// box : 0 jamais vu, 1 à retravailler, 2 ça vient, 3 maîtrisé.
//
// Le texte saisi se découpe en blocs séparés par une ligne vide :
//   # Titre          → une leçon (le titre, puis le texte du bloc)
//   q = r            → un bloc dont chaque ligne a un « = » (ou un « | ») :
//                      une question par ligne
//   autre chose      → une leçon sans titre
//   [📷 n]           → l'image n, dans une leçon ou seule dans son bloc
//
// Sessions, dans la pièce (comme les listes de mots : elle choisit l'objet,
// puis la pièce disparaît et l'élément s'affiche seul) :
//   Apprendre     : la question et sa réponse, ou la leçon entière, autant
//                   de fois qu'elle veut
//   Se rappeler   : un indice selon le niveau de la liste, puis la réponse
//                   (ou le cours) ; elle dit elle-même ce qu'elle savait.
//                   80 % des points font monter d'un niveau (jamais descendre).
// Niveaux : 0, 1, puis 2 = Ninja (list.ninja). Chargé après js/app.js.

const Revision = (function () {

const IMAGE = /^\[📷\s*(\d+)\]$/;
const NOMS_NIVEAUX = ['Niveau 1', 'Niveau 2', 'Ninja'];

// ═══ Texte ↔ éléments ═══

const aSeparateur = line => line.includes('=') || line.includes('|');

// Blocs du texte : [{ lignes: [{ t, n }] }] (n : numéro de ligne, pour les erreurs)
function blocs(texte) {
  const sortie = [];
  let courant = null;
  String(texte || '').replace(/\r/g, '').split('\n').forEach((raw, i) => {
    const t = normalizeApostrophes(raw.trim());
    if (!t) {
      courant = null;
      return;
    }
    if (!courant) sortie.push(courant = { lignes: [] });
    courant.lignes.push({ t, n: i + 1 });
  });
  return sortie;
}

// Texte → { items, errors } ; chaque item garde son numéro de bloc (bloc)
function parse(texte) {
  const items = [];
  const errors = [];
  blocs(texte).forEach((b, bloc) => {
    const images = b.lignes.filter(l => IMAGE.test(l.t));
    const lignes = b.lignes.filter(l => !IMAGE.test(l.t));
    const image = images.length ? Number(IMAGE.exec(images[0].t)[1]) : null;
    if (images.length > 1) errors.push(`Ligne ${images[1].n} : une seule image par leçon`);

    const titre = lignes.length && lignes[0].t.startsWith('#');
    if (!titre && lignes.length && lignes.every(l => aSeparateur(l.t))) {
      if (images.length) errors.push(`Ligne ${images[0].n} : une image va dans une leçon. Ajoute un titre « # … » au bloc, ou sépare l'image par une ligne vide`);
      lignes.forEach(l => {
        const sep = l.t.includes('|') ? '|' : '=';
        const parts = l.t.split(sep);
        const q = parts[0].trim().replace(/\s+/g, ' ');
        const a = parts.slice(1).join(sep).trim().replace(/\s+/g, ' ');
        if (parts.length > 2) errors.push(`Ligne ${l.n} : plusieurs « ${sep} ». Sépare la question et la réponse par un seul « | »`);
        else if (!q || !a) errors.push(`Ligne ${l.n} : question ou réponse vide`);
        else items.push({ q, a, bloc });
      });
      return;
    }
    const corps = titre ? lignes.slice(1) : lignes;
    items.push({
      kind: 'lecon',
      titre: titre ? lignes[0].t.replace(/^#+\s*/, '') : '',
      texte: corps.map(l => l.t).join('\n'),
      image,
      bloc
    });
  });
  return { items, errors };
}

const ligneQuestion = c => ((c.q + c.a).includes('=') ? `${c.q} | ${c.a}` : `${c.q} = ${c.a}`);

// Éléments → texte (pour l'édition) ; les questions qui se suivent forment un bloc
function texteDe(cards) {
  const parts = [];
  let questions = [];
  const vider = () => {
    if (questions.length) parts.push(questions.join('\n'));
    questions = [];
  };
  (cards || []).forEach(c => {
    if (c.kind !== 'lecon') {
      questions.push(ligneQuestion(c));
      return;
    }
    vider();
    parts.push([c.titre ? `# ${c.titre}` : '', c.texte, c.image ? `[📷 ${c.image}]` : ''].filter(Boolean).join('\n'));
  });
  vider();
  return parts.join('\n\n');
}

// Même élément ? (pour garder sa boîte, son id et donc son objet à l'édition)
function memeCle(a, b) {
  if ((a.kind === 'lecon') !== (b.kind === 'lecon')) return false;
  if (a.kind !== 'lecon') return a.q === b.q;
  return (!!a.titre && a.titre === b.titre) || (!!a.texte && a.texte === b.texte) || (!!a.image && a.image === b.image);
}

function memeSecondeCle(a, b) {
  if (a.kind === 'lecon' || b.kind === 'lecon') return false;
  return a.a === b.a;
}

// ═══ Éditeur (création et édition) ═══
// prefix : 'new-' ou 'edit-'. Les images choisies attendent ici que la
// liste soit enregistrée : { n: id }.

const enAttente = { 'new-': {}, 'edit-': {} };

function initEditeur(prefix, list) {
  enAttente[prefix] = { ...((list && list.images) || {}) };
  apercu(prefix);
}

function zone(prefix) {
  return document.getElementById(`${prefix}cards-input`);
}

// Images utilisées par le texte : { n: id }, et les numéros introuvables
function imagesDe(prefix, items) {
  const images = {};
  const manquantes = [];
  items.forEach(it => {
    if (!it.image) return;
    const id = enAttente[prefix][it.image];
    if (id) images[it.image] = id;
    else manquantes.push(it.image);
  });
  return { images, manquantes };
}

// Lit la zone de saisie : { items, images, errors }
function lireSaisie(prefix) {
  const parsed = parse(zone(prefix).value);
  const { images, manquantes } = imagesDe(prefix, parsed.items);
  manquantes.forEach(n => parsed.errors.push(`Image ${n} introuvable : ajoute-la avec « 📷 »`));
  return { items: parsed.items, images, errors: parsed.errors };
}

function resume(text, n) {
  const mots = String(text || '').split(/\s+/).filter(Boolean);
  return mots.slice(0, n).join(' ') + (mots.length > n ? '…' : '');
}

// Aperçu des blocs sous la zone de saisie
function apercu(prefix) {
  const box = document.getElementById(`${prefix}revision-apercu`);
  if (!box) return;
  const { items } = parse(zone(prefix).value);
  const nq = items.filter(it => it.kind !== 'lecon').length;
  const nl = items.length - nq;
  const vus = new Set();
  let html = `<p class="hint">${nq} question${nq > 1 ? 's' : ''} · ${nl} leçon${nl > 1 ? 's' : ''}</p>`;
  items.forEach(it => {
    if (it.kind !== 'lecon') {
      if (vus.has(it.bloc)) return; // un bloc de questions = une ligne d'aperçu
      vus.add(it.bloc);
      const n = items.filter(x => x.bloc === it.bloc).length;
      html += `<div class="apercu-bloc"><span class="apercu-icone">❓</span><span class="apercu-texte">${n} question${n > 1 ? 's' : ''} · ${escapeText(resume(it.q, 8))}</span></div>`;
      return;
    }
    const id = it.image ? enAttente[prefix][it.image] : null;
    html += `
      <div class="apercu-bloc">
        <span class="apercu-icone">${it.titre || it.texte ? '📖' : '🖼️'}</span>
        <span class="apercu-texte">${it.titre ? `<strong>${escapeText(it.titre)}</strong> ` : ''}${escapeText(resume(it.texte, 10)) || (it.titre ? '' : 'Image seule')}</span>
        ${id ? `<img class="apercu-image" data-image="${id}" alt="">` : ''}
        <button type="button" class="btn btn-ghost btn-small" onclick="Revision.choisirImage('${prefix}', ${it.bloc})">📷 ${it.image ? 'Changer' : 'Image'}</button>
      </div>`;
  });
  box.innerHTML = html;
  remplirImages(box);
}

// Charge les <img data-image="id"> d'un conteneur
function remplirImages(el) {
  el.querySelectorAll('img[data-image]').forEach(async img => {
    const src = await Images.url(img.dataset.image);
    if (src) img.src = src;
    else img.replaceWith(Object.assign(document.createElement('span'), { className: 'image-absente', textContent: '🖼️ image restée sur un autre appareil' }));
  });
}

// bloc : numéro du bloc qui reçoit l'image ; -1 = nouveau bloc image à la fin
function choisirImage(prefix, bloc) {
  const input = document.getElementById(`${prefix}revision-file`);
  input.dataset.bloc = bloc;
  input.click();
}

async function imageChoisie(input, prefix) {
  const file = input.files && input.files[0];
  const bloc = Number(input.dataset.bloc);
  input.value = '';
  if (!file) return;
  let id;
  try {
    id = await Images.enregistrer(file);
  } catch (e) {
    showFeedback('Cette image ne peut pas être lue', 'error');
    return;
  }
  const map = enAttente[prefix];
  const n = Math.max(0, ...Object.keys(map).map(Number)) + 1;
  map[n] = id;

  // Le marqueur va dans le bloc (il remplace l'image d'avant)
  const textarea = zone(prefix);
  const parts = blocs(textarea.value).map(b => b.lignes.map(l => l.t));
  const marqueur = `[📷 ${n}]`;
  if (bloc >= 0 && parts[bloc]) {
    parts[bloc] = parts[bloc].filter(t => !IMAGE.test(t)).concat(marqueur);
  } else {
    parts.push([marqueur]);
  }
  textarea.value = parts.map(p => p.join('\n')).join('\n\n');
  apercu(prefix);
  showFeedback('Image ajoutée 📷', 'success');
}

// Consigne à coller dans une IA pour fabriquer une liste de révision
function copierConsigne() {
  const prompt = `Prépare une fiche de révision pour une élève de 6e sur : [THÈME].
Format strict, des blocs séparés par une ligne vide :
- Une leçon : une première ligne « # Titre », puis 2 à 5 phrases simples.
- Des questions : un bloc où chaque ligne est « question = réponse » (réponse unique et courte, un fait).
Jamais de « = » dans une question ou une réponse (si c'est indispensable, sépare alors par « | »).
Pas de numéros, pas de puces, pas de gras.`;
  const done = () => showFeedback('Consigne copiée ! Colle-la dans ton IA 📋', 'success');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(prompt).then(done).catch(() => window.prompt('Copie cette consigne :', prompt));
  } else {
    window.prompt('Copie cette consigne :', prompt);
  }
}

// ═══ Niveaux ═══

function niveau(list) {
  return list.ninja ? 2 : Math.min(list.level || 0, 1);
}

function nomNiveau(n) {
  return NOMS_NIVEAUX[n];
}

// ═══ Sessions ═══

const S = {
  list: null,
  mode: 'apprendre', // 'apprendre' | 'rappel'
  paquets: [],       // [[{ list, word: clé }]] : un paquet par étage
  points: 0,
  total: 0,
  aRevoir: [],       // ids des éléments à retravailler
  partiel: false,    // session sur une partie de la liste (à retravailler) : pas de niveau
  niveauDepart: 0,
  becameNinja: false,
  revele: false
};

function carteDe(list, key) {
  return (list.cards || []).find(c => String(c.id) === String(key));
}

// Un paquet par étage, dans l'ordre du texte
function paquetsDe(list, ids) {
  const parEtage = {};
  (list.cards || []).forEach(c => {
    if (ids && !ids.includes(c.id)) return;
    const place = Monde.placeOf(list, String(c.id));
    if (!place) return;
    (parEtage[place.etage] = parEtage[place.etage] || []).push({ list, word: String(c.id) });
  });
  return Object.keys(parEtage).map(Number).sort((a, b) => a - b).map(e => parEtage[e]);
}

// mode : 'apprendre' | 'rappel' ; ids : seulement ces éléments (à retravailler)
function demarrer(listId, mode, ids) {
  const list = Storage.getActiveLists().find(l => l.id === listId);
  if (!list || !Storage.isCardList(list)) return;
  const paquets = paquetsDe(list, ids);
  if (!paquets.length) {
    // Maison pas encore meublée : rien n'est rangé
    if (list.lieu.kind === 'maison') {
      showFeedback('Pose d\'abord des meubles dans ta maison 🏡', 'error');
      Maisons.amenager(list.lieu.id);
    }
    return;
  }

  Object.assign(S, { list, mode, paquets, points: 0, total: 0, aRevoir: [], partiel: !!ids, niveauDepart: niveau(list), becameNinja: false, revele: false });
  AppState.sessionLists = [list];
  AppState.currentList = list;
  AppState.currentMode = mode === 'rappel' ? 'interrogation' : 'apprentissage';
  AppState.currentLevel = 0;
  AppState.sessionReplay = () => demarrer(listId, mode, ids);
  ouvrirPaquet(0);
}

function ouvrirPaquet(n) {
  AppState.currentLevel = n;
  AppState.currentLevelWords = S.paquets[n];
  AppState.faits = {};
  AppState.salleCourante = null;
  piece();
}

function faitsCount() {
  return Object.keys(AppState.faits).length;
}

// La pièce : elle choisit l'objet
function piece() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  showScreen('revision');
  const rappel = S.mode === 'rappel';
  const n = AppState.currentLevelWords.length;
  const nb = faitsCount();
  document.getElementById('revision-titre').textContent = rappel ? '🧠 Se rappeler' : '📖 Apprendre';
  document.getElementById('revision-chip').textContent = `${rappel ? 'Fait' : 'Vus'} ${nb}/${n}`;
  const paquet = S.paquets.length > 1 ? ` · étage ${AppState.currentLevel + 1}/${S.paquets.length}` : '';
  document.getElementById('revision-liste').textContent = `${S.list.name}${rappel ? ` · ${nomNiveau(niveau(S.list))}` : ''}${paquet}`;
  document.getElementById('revision-contenu').classList.add('hidden');
  const piece = document.getElementById('revision-piece');
  piece.classList.remove('hidden');

  let pied;
  if (rappel) {
    pied = '<p class="hint text-center">Choisis un objet : te souviens-tu de ce qui y est rangé ?</p>';
  } else if (nb === n) {
    pied = `<div class="text-center mt-20"><button class="btn btn-primary btn-big" onclick="Revision.paquetFini()">✅ J'ai tout vu</button>
      <p class="hint">Tu peux encore retourner voir les objets.</p></div>`;
  } else {
    pied = '<p class="hint text-center">Choisis un objet et tape dessus pour voir ce qui y est rangé.</p>';
  }
  renderPieceSession('revision-piece', choisir, pied);
}

function choisir(index) {
  const item = AppState.currentLevelWords[index];
  const card = item && carteDe(S.list, item.word);
  if (!card) return;
  AppState.currentWordIndex = index;
  S.revele = false;
  if (S.mode === 'apprendre') AppState.faits[index] = true;
  document.getElementById('revision-piece').classList.add('hidden');
  const box = document.getElementById('revision-contenu');
  box.classList.remove('hidden');
  box.innerHTML = S.mode === 'rappel' ? htmlRappel(card) : htmlApprendre(card);
  remplirImages(box);
  window.scrollTo(0, 0);
}

function retour() {
  return '<button class="btn btn-ghost btn-block mt-10" onclick="Revision.piece()">← Retour à la pièce</button>';
}

function htmlLecon(card) {
  const paragraphes = String(card.texte || '').split('\n').filter(Boolean)
    .map(p => `<p>${escapeText(p)}</p>`).join('');
  const id = card.image ? (S.list.images || {})[card.image] : null;
  return `
    ${card.titre ? `<h2 class="lecon-titre">${escapeText(card.titre)}</h2>` : ''}
    ${id ? `<img class="lecon-image" data-image="${id}" alt="" onclick="Revision.zoom(this)">` : ''}
    ${paragraphes ? `<div class="lecon-texte">${paragraphes}</div>` : ''}`;
}

function boutonLire(card) {
  if (card.kind === 'lecon' && !card.titre && !card.texte) return '';
  return `<button class="btn btn-listen" onclick="Revision.lire(${card.id})">🔊 ${card.kind === 'lecon' ? 'Lire' : 'Écouter'}</button>`;
}

function htmlApprendre(card) {
  const corps = card.kind === 'lecon'
    ? htmlLecon(card)
    : `<div class="revision-q">${escapeText(card.q)}</div><div class="revision-a"><span class="revision-label">💡 Réponse</span>${escapeText(card.a)}</div>`;
  return `<div class="revision-carte">${corps}</div><div class="text-center mt-10">${boutonLire(card)}</div>${retour()}`;
}

// Indice d'une leçon selon le niveau : titre et premiers mots, titre seul, rien
function indice(card) {
  const n = niveau(S.list);
  if (n >= 2) return '';
  const debut = resume(card.texte, n === 0 ? REVISION.motsIndice : 0);
  if (card.titre) return `<h2 class="lecon-titre">${escapeText(card.titre)}</h2>${n === 0 && debut ? `<p class="revision-indice">${escapeText(debut)}</p>` : ''}`;
  const sansTitre = resume(card.texte, n === 0 ? REVISION.motsIndice : REVISION.motsIndiceSansTitre);
  return sansTitre ? `<p class="revision-indice">${escapeText(sansTitre)}</p>` : '';
}

function htmlRappel(card) {
  if (card.kind !== 'lecon') {
    if (!S.revele) {
      return `<div class="revision-carte"><div class="revision-q">${escapeText(card.q)}</div></div>
        <div class="text-center mt-10">${boutonLire(card)}</div>
        <div class="text-center mt-20"><button class="btn btn-primary btn-big" onclick="Revision.reveler()">👀 Voir la réponse</button>
        <p class="hint">Dis ta réponse à voix haute, puis regarde</p></div>`;
    }
    return `<div class="revision-carte"><div class="revision-q">${escapeText(card.q)}</div><div class="revision-a"><span class="revision-label">💡 Réponse</span>${escapeText(card.a)}</div></div>
      <div class="cartes-verdict">
        <button class="btn btn-verdict verdict-review" onclick="Revision.verdict(0)">🔁 À revoir</button>
        <button class="btn btn-verdict verdict-known" onclick="Revision.verdict(1)">✅ Je savais</button>
      </div>`;
  }
  if (!S.revele) {
    // Ninja : aucun indice, l'objet qu'elle a choisi suffit
    const aide = indice(card) || '<p class="revision-indice">Qu\'est-ce qui est rangé ici ?</p>';
    return `<div class="revision-carte">
        ${aide}
        <p class="hint">Raconte ce que tu sais, à voix haute ou dans ta tête.</p>
      </div>
      <div class="text-center mt-20"><button class="btn btn-primary btn-big" onclick="Revision.reveler()">📖 Voir le cours</button></div>`;
  }
  return `<div class="revision-carte">${htmlLecon(card)}</div>
    <p class="hint text-center mt-10">Qu'est-ce que tu savais ?</p>
    <div class="cartes-verdict verdict-3">
      <button class="btn btn-verdict verdict-review" onclick="Revision.verdict(0)">😕 Presque rien</button>
      <button class="btn btn-verdict verdict-half" onclick="Revision.verdict(0.5)">🙂 Une partie</button>
      <button class="btn btn-verdict verdict-known" onclick="Revision.verdict(1)">😄 L'essentiel</button>
    </div>`;
}

function reveler() {
  S.revele = true;
  const item = AppState.currentLevelWords[AppState.currentWordIndex];
  const box = document.getElementById('revision-contenu');
  box.innerHTML = htmlRappel(carteDe(S.list, item.word));
  remplirImages(box);
}

// points : 1, ½ ou 0. La boîte suit : maîtrisé petit à petit ; moins que
// tout (½ ou 0), à retravailler.
function verdict(points) {
  const index = AppState.currentWordIndex;
  if (AppState.faits[index] !== undefined) return;
  const item = AppState.currentLevelWords[index];
  const card = carteDe(S.list, item.word);
  if (!card) return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  const box = points >= 1 ? (card.box === 0 ? 2 : Math.min(3, card.box + 1)) : 1;
  const slotsAvant = Storage.getCompanionSlots();
  if (Storage.setCardBox(S.list.id, card.id, box)) {
    S.becameNinja = true;
    S.list.ninja = true;
    if (Storage.getCompanionSlots() > slotsAvant) AppState.newCompanionUnlocked = true;
  }
  card.box = box;
  S.points += points;
  S.total += 1;
  if (points < 1) S.aRevoir.push(card.id);
  AppState.faits[index] = points >= 1;

  if (faitsCount() >= AppState.currentLevelWords.length) paquetFini();
  else piece();
}

function paquetFini() {
  if (AppState.currentLevel < S.paquets.length - 1) {
    showFeedback('Étage terminé ! 🎉', 'success');
    ouvrirPaquet(AppState.currentLevel + 1);
  } else if (S.mode === 'rappel') {
    finRappel();
  } else {
    finApprendre();
  }
}

function finApprendre() {
  const earned = ECONOMIE.etoilesApprentissage;
  Storage.addStars(earned);
  playStarSound();
  Defis.track('visite');
  showScreen('apprentissage-complete');
  const n = S.paquets.flat().length;
  document.getElementById('apprentissage-complete-content').innerHTML = `
    <div class="result-hero">
      <div class="result-icon">🎉</div>
      <h2>Bravo !</h2>
      <p class="result-sub">Tu as vu ${n} objet${n > 1 ? 's' : ''} et ce qui y est rangé.</p>
      <div class="stars-earned">+${earned} ⭐</div>
    </div>
    ${Defis.celebrationHTML()}
    <p class="intro">Veux-tu essayer de t'en rappeler maintenant ?</p>
    <div class="result-actions">
      <button class="btn btn-primary btn-big" onclick="Revision.demarrer(${S.list.id}, 'rappel')">🧠 Oui, je me rappelle !</button>
      <button class="btn btn-ghost" onclick="showScreen('home')">🏠 Non, retour à l'accueil</button>
    </div>`;
  setTimeout(() => openPendingChests(), 600);
}

function finRappel() {
  const etoiles = CARTES.etoilesSession;
  Storage.addStars(etoiles);
  playStarSound();
  Defis.track('session');

  // Passage de niveau : 80 % des points, sur toute la liste. La liste peut
  // aussi être devenue Ninja pendant la session (tout maîtrisé).
  let niveauHTML = '';
  const avant = S.niveauDepart;
  const pct = S.total ? S.points / S.total : 0;
  let apres = avant;
  if (!S.partiel && avant < 2 && pct >= ECONOMIE.seuilPassageNiveau) {
    const slotsAvant = Storage.getCompanionSlots();
    apres = avant + 1;
    Storage.setRevisionLevel(S.list.id, apres);
    S.list.level = Math.min(apres, 1);
    if (apres >= 2 && !S.list.ninja) {
      S.list.ninja = true;
      S.becameNinja = true;
      if (Storage.getCompanionSlots() > slotsAvant) AppState.newCompanionUnlocked = true;
    }
  }
  if (S.becameNinja) apres = 2;
  if (apres > avant) {
    niveauHTML = `
      <div class="level-up">
        ${celebrationArt(apres >= 2 ? '🥷' : '🚀')}
        <div class="level-up-title">${apres >= 2 ? 'Liste Ninja !' : `${nomNiveau(apres)} atteint !`}</div>
        <div class="level-up-sub">${apres >= 2 ? 'Les leçons sans aucun indice' : 'Les leçons avec leur titre seul'}</div>
        ${meubleGagneHTML(Storage.gagnerMeubleNiveau())}
      </div>`;
  } else if (!S.partiel) {
    niveauHTML = avant >= 2
      ? '<div class="level-up quiet">🥷 Niveau maximum : Ninja</div>'
      : `<div class="level-up quiet">${nomNiveau(avant)} · ${Math.ceil(ECONOMIE.seuilPassageNiveau * 100)} % des points pour passer au suivant</div>`;
  }
  if (S.becameNinja) Storage.grantChest('rare');
  openPendingChests(() => resultats(etoiles, niveauHTML));
}

const pointsTexte = p => String(p).replace('.', ',');

function resultats(etoiles, niveauHTML) {
  showScreen('results');
  const container = document.getElementById('results-content');
  const tout = S.points === S.total;
  const libres = Storage.getFreeStickers().reduce((sum, x) => sum + x.count, 0);
  let html = `
    <div class="result-hero">
      <div class="result-icon">${tout ? '🏆' : '👏'}</div>
      <h2>${tout ? 'Parfait !' : 'Bien joué !'}</h2>
      <p class="result-score">${pointsTexte(S.points)} / ${S.total}</p>
      <p class="result-sub">point${S.points > 1 ? 's' : ''}</p>
      <div class="stars-earned">+${etoiles} ⭐ gagnées</div>
    </div>
    ${niveauHTML}
    ${Defis.celebrationHTML()}`;

  if (S.aRevoir.length) {
    html += `<div class="error-card"><h3>À retravailler (${S.aRevoir.length})</h3>`;
    S.aRevoir.forEach(id => {
      const c = carteDe(S.list, id);
      if (!c) return;
      html += c.kind === 'lecon'
        ? `<div class="error-item"><div class="error-word">📖 ${escapeText(c.titre || resume(c.texte, 8) || 'Image')}</div></div>`
        : `<div class="error-item"><div class="error-word">${escapeText(c.q)}</div><div class="error-detail">Réponse : <span class="error-expected">${escapeText(c.a)}</span></div></div>`;
    });
    html += '<p class="hint">Tu les retrouves dans « Mots à travailler ».</p></div>';
  } else {
    html += '<div class="success-card">✅ Tout est là !</div>';
  }

  if (AppState.newCompanionUnlocked) {
    AppState.newCompanionUnlocked = false;
    html += `
      <div class="level-up">
        ${celebrationArt('🐾')}
        <div class="level-up-title">Nouveau compagnon débloqué !</div>
        <div class="level-up-sub">Va choisir ton kawaii de compagnie</div>
        <div class="team-actions"><button class="btn btn-secondary" onclick="showKawaiiScreen()">🎨 Choisir mon compagnon</button></div>
      </div>`;
  }
  html += `
    <div class="result-actions">
      <button class="btn btn-primary btn-big" onclick="replaySession()">🔁 Rejouer</button>
      ${libres > 0 ? `<button class="btn btn-secondary" onclick="collerStickers()">🏙️ Coller mes ${libres} sticker${libres > 1 ? 's' : ''}</button>` : ''}
    </div>`;
  container.innerHTML = html;
}

// ── Lecture à voix haute : phrase par phrase (Safari coupe les textes longs) ──
function lire(cardId) {
  const card = carteDe(S.list, cardId);
  if (!card || !AppState.soundEnabled) return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const texte = card.kind === 'lecon'
    ? [card.titre, card.texte].filter(Boolean).join('. ')
    : (S.mode === 'rappel' && !S.revele ? card.q : `${card.q}. ${card.a}`);
  const phrases = texte.replace(/\n+/g, '. ').split(/(?<=[.!?…])\s+/).map(p => p.trim()).filter(Boolean);
  const suivante = (i) => { if (i < phrases.length) speakWord(phrases[i], () => suivante(i + 1)); };
  suivante(0);
}

// ── Image en grand : un appui l'agrandit, un autre la rend ──
function zoom(img) {
  const voile = document.createElement('div');
  voile.className = 'image-plein';
  voile.innerHTML = `<button class="btn-icon image-fermer" aria-label="Fermer">✕</button><div class="image-defile"><img src="${img.src}" alt=""></div>`;
  voile.querySelector('.image-fermer').onclick = () => voile.remove();
  voile.querySelector('img').onclick = (e) => e.target.classList.toggle('grand');
  document.body.appendChild(voile);
}

return {
  parse, texteDe, memeCle, memeSecondeCle, initEditeur, lireSaisie, apercu, choisirImage, imageChoisie,
  copierConsigne, niveau, nomNiveau, demarrer, piece, paquetFini, reveler, verdict, lire, zoom
};
})();
