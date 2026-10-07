// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Jeux des cartes questions corrigés par l'app
// ═══════════════════════════════════════════════════════════════
// Trois façons de jouer les questions d'une liste de révision, en plus
// d'Apprendre et Se rappeler (js/revision.js) :
//   qcm     la question et quatre réponses ; les mauvaises viennent des
//           autres cartes de la liste
//   paires  relier chaque question à sa réponse
//   ecrire  écrire la réponse au clavier, pour les réponses courtes ;
//           accents et majuscules ne comptent pas
// L'app corrige : une bonne réponse du premier coup rapporte des étoiles.
// Les cartes changent de boîte comme à « Se rappeler », sauf aux paires
// (on y joue sans risque) et le QCM ne monte pas plus haut que « ça vient ».
// Les listes de langue jouent aussi au QCM et aux paires (mot → traduction) :
// un échauffement qui rapporte des étoiles, sans toucher au niveau ni à la
// progression des mots, qui se gagnent en écrivant.
// Réglages : CARTES dans data/lieux.js. Chargé après js/app.js.

// Texte comparable : sans accents, majuscules, ponctuation finale ni espaces en trop
function normalizeAnswer(text) {
  let s = normalizeApostrophes(String(text)).toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.!?;:,\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  // « 1 789 » et « 1789 » sont le même nombre
  if (/^[\d\s]+$/.test(s)) s = s.replace(/\s/g, '');
  return s;
}

const JeuxCartes = {
  JEUX: {
    qcm:    { titre: '🎯 QCM',               icone: '🎯', nom: 'QCM',                 consigne: 'Choisis la bonne réponse' },
    paires: { titre: '🧩 Paires',            icone: '🧩', nom: 'Paires',              consigne: 'Relie chaque question à sa réponse' },
    ecrire: { titre: '⌨️ Écrire la réponse', icone: '⌨️', nom: 'Écrire la réponse',   consigne: 'Écris la réponse' }
  },

  jeu: null,
  listId: null,
  langue: null,    // liste de langue : { from, to } (voix), sinon null
  listCards: [],   // toutes les cartes de la liste (pour les mauvaises réponses du QCM)
  cards: {},       // id → carte tirée (copie de travail)
  queue: [],       // qcm, ecrire : ids à venir, la première est à l'écran
  total: 0,
  done: 0,
  correct: 0,      // réussies du premier coup
  stars: 0,
  returns: {},
  toReview: [],
  becameNinja: false,
  locked: false,   // réponse donnée : on attend la suite
  run: 0,          // numéro de la partie : les minuteries d'une partie quittée ne font rien
  choices: [],     // qcm : réponses proposées
  input: '',       // ecrire : lettres tapées
  bonus: 0,        // étoiles du sans-faute
  rounds: [],      // paires : manches
  round: 0,
  foundQ: null,
  foundA: null,
  erred: null,
  selected: null,  // paires : { side, id }

  // ── Ce qu'on peut jouer avec cette liste ──

  // Lettres et chiffres à taper ; le reste (espaces, apostrophes, tirets) est donné
  isSlot(ch) {
    return /[\p{L}\p{N}]/u.test(ch);
  },

  canWrite(card) {
    const slots = [...card.a].filter(ch => this.isSlot(ch));
    if (slots.length === 0 || slots.length > CARTES.lettresMaxEcrire) return false;
    if ([...card.a].length > CARTES.lettresMaxEcrire + 6) return false;
    // Chaque lettre doit exister sur le clavier, à un accent près
    return slots.every(ch => /^[a-z0-9]$/.test(ch.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')));
  },

  // Cartes d'une liste : les questions (pas les leçons). Liste de langue :
  // une carte par mot, sans boîte.
  cardsOf(list) {
    if (!Storage.isLangList(list)) return (list.cards || []).filter(c => c.kind !== 'lecon');
    return list.words
      .map((word, i) => ({ id: i + 1, q: promptOf(list, word), a: word, box: 0 }))
      .filter(card => card.q);
  },

  playable(list, jeu) {
    if (Storage.isLangList(list) && jeu === 'ecrire') return false; // c'est l'interrogation
    const cards = this.cardsOf(list);
    if (jeu === 'qcm') return new Set(cards.map(c => normalizeAnswer(c.a))).size >= CARTES.reponsesMinQcm;
    if (jeu === 'paires') return cards.length >= CARTES.cartesMinPaires;
    if (jeu === 'ecrire') return cards.filter(c => this.canWrite(c)).length >= CARTES.cartesMinEcrire;
    return false;
  },

  // Boutons de jeu sur la carte d'une liste (Mes listes)
  actionsHTML(list) {
    const tile = (onclick, icone, nom, gain) => `
      <button class="game-tile" onclick="${onclick}">
        <span class="game-icon">${icone}</span>
        <span class="game-name">${nom}</span>
        <span class="game-gain">${gain}</span>
      </button>`;
    const per = n => `${n} ⭐ par réponse`;
    let html = tile(`Revision.demarrer(${list.id}, 'apprendre')`, '📖', 'Apprendre', `${ECONOMIE.etoilesApprentissage} ⭐ la visite`)
      + tile(`Revision.demarrer(${list.id}, 'rappel')`, '🧠', 'Se rappeler', `${CARTES.etoilesSession} ⭐ la session`);
    if (this.playable(list, 'qcm')) html += tile(`JeuxCartes.start('qcm', ${list.id})`, '🎯', 'QCM', per(CARTES.etoilesQcm));
    if (this.playable(list, 'paires')) html += tile(`JeuxCartes.start('paires', ${list.id})`, '🧩', 'Paires', `${CARTES.etoilesPaire} ⭐ par paire`);
    if (this.playable(list, 'ecrire')) html += tile(`JeuxCartes.start('ecrire', ${list.id})`, '⌨️', 'Écrire la réponse', per(CARTES.etoilesEcrire));
    return `<div class="game-actions">${html}</div>`;
  },

  // Liste de langue : deux jeux d'échauffement sous les boutons habituels
  langActionsHTML(list) {
    const games = ['qcm', 'paires'].filter(jeu => this.playable(list, jeu));
    if (games.length === 0) return '';
    return `
      <div class="game-row">
        ${games.map(jeu => `
          <button class="btn btn-ghost" onclick="JeuxCartes.start('${jeu}', ${list.id})">${this.JEUX[jeu].icone} ${this.JEUX[jeu].nom}</button>`).join('')}
      </div>`;
  },

  // ── Partie ──

  start(jeu, listId) {
    const list = Storage.getLists().find(l => l.id === listId);
    if (!list || !this.playable(list, jeu)) return;

    const all = this.cardsOf(list);
    const pool = jeu === 'ecrire' ? all.filter(c => this.canWrite(c)) : all;
    const drawn = shuffleArray(drawCards(pool));

    this.run++;
    this.jeu = jeu;
    this.listId = listId;
    this.listCards = all;
    this.langue = Storage.isLangList(list) ? { from: langInfo(list.langFrom), to: langInfo(list.langTo) } : null;
    this.cards = {};
    drawn.forEach(c => { this.cards[c.id] = { ...c }; });
    this.queue = drawn.map(c => c.id);
    this.total = drawn.length;
    this.done = 0;
    this.correct = 0;
    this.stars = 0;
    this.returns = {};
    this.toReview = [];
    this.becameNinja = false;
    this.locked = false;
    this.bonus = 0;
    this.erred = new Set();
    AppState.currentList = list;
    AppState.sessionReplay = () => this.start(jeu, listId);

    showScreen('jeu');
    initAudio();
    document.getElementById('jeu-title').textContent = this.JEUX[jeu].titre;
    document.getElementById('jeu-list-name').textContent = list.name;
    document.getElementById('jeu-stars').textContent = '0';
    this.renderBuddy();

    if (jeu === 'paires') {
      this.rounds = this.splitRounds(drawn.map(c => c.id));
      this.round = -1;
      this.nextRound();
    } else {
      this.show();
    }
  },

  // Manches de paires de tailles voisines : 8 cartes = 4 + 4, pas 5 + 3
  splitRounds(ids) {
    const count = Math.ceil(ids.length / CARTES.pairesParManche);
    const size = Math.ceil(ids.length / count);
    const rounds = [];
    for (let i = 0; i < ids.length; i += size) rounds.push(ids.slice(i, i + size));
    return rounds;
  },

  quit() {
    this.run++;
    showListsScreen();
  },

  // Exécute `fn` plus tard, seulement si la même partie est toujours à l'écran
  later(ms, fn) {
    const run = this.run;
    setTimeout(() => {
      if (run === this.run && AppState.currentScreen === 'jeu') fn();
    }, ms);
  },

  current() {
    return this.cards[this.queue[0]];
  },

  buddy() {
    return document.getElementById('jeu-buddy');
  },

  renderBuddy() {
    const buddy = this.buddy();
    const main = Storage.getTeam().main;
    const mood = Kawaii.period() === 'nuit' ? 'soir' : undefined;
    buddy.innerHTML = main ? Kawaii.draw(main, 58, { alive: true, mood }) : '';
    buddy.classList.toggle('hidden', !main);
  },

  renderProgress() {
    renderSessionProgress('jeu-progress', this.total, this.done);
    const card = this.jeu === 'paires' ? null : this.current();
    const again = card && (this.returns[card.id] || 0) > 0;
    const unit = this.jeu === 'paires' ? 'Paire' : 'Carte';
    document.getElementById('jeu-chip').textContent =
      again ? '🔁 On la revoit' : `${unit} ${Math.min(this.done + 1, this.total)}/${this.total}`;
  },

  award(n) {
    Storage.addStars(n);
    this.stars += n;
    playStarSound();
    const value = document.getElementById('jeu-stars');
    const counter = document.getElementById('jeu-star-counter');
    if (value) value.textContent = this.stars;
    if (!counter) return;
    counter.classList.remove('bump');
    void counter.offsetWidth;
    counter.classList.add('bump');
    const float = document.createElement('span');
    float.className = 'star-float';
    float.textContent = `+${n}`;
    counter.appendChild(float);
    setTimeout(() => float.remove(), 900);
  },

  // Range la carte selon la réponse (qcm, ecrire) et prépare la suite
  settle(card, ok, { etoiles, boiteMax }) {
    const failedBefore = this.toReview.includes(card.id);
    const first = !(this.returns[card.id] > 0);
    Defis.answer(ok);
    Kawaii.setLean(this.buddy(), false);

    if (ok) {
      if (first) {
        this.correct++;
        this.award(etoiles);
      }
      // Ratée plus tôt dans la session : elle reste « à revoir » jusqu'à la prochaine fois.
      // Une carte ne descend jamais parce qu'on l'a réussie.
      const up = Math.min(boiteMax, card.box === 0 ? 2 : card.box + 1);
      const box = failedBefore ? 1 : Math.max(card.box, up);
      const slotsBefore = Storage.getCompanionSlots();
      if (!this.langue && Storage.setCardBox(this.listId, card.id, box)) {
        this.becameNinja = true;
        if (Storage.getCompanionSlots() > slotsBefore) AppState.newCompanionUnlocked = true;
      }
      card.box = box;
      this.queue.shift();
      this.done++;
      Kawaii.react(this.buddy(), 'bravo');
      return;
    }

    if (!this.langue) Storage.setCardBox(this.listId, card.id, 1);
    card.box = 1;
    if (!failedBefore) this.toReview.push(card.id);
    this.queue.shift();
    const returns = this.returns[card.id] || 0;
    if (returns < CARTES.retoursMaxJeu) {
      this.returns[card.id] = returns + 1;
      this.queue.splice(Math.min(3, this.queue.length), 0, card.id);
    } else {
      this.done++;
    }
    Kawaii.react(this.buddy(), 'oups');
  },

  next() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (this.queue.length === 0) this.finish();
    else this.show();
  },

  show() {
    this.locked = false;
    this.renderProgress();
    if (this.jeu === 'qcm') this.showQcm();
    else this.showEcrire();
    window.scrollTo(0, 0);
  },

  speak() {
    if (!AppState.soundEnabled) return;
    const card = this.current();
    if (!card) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakWord(card.q, null, this.langue ? this.langue.from.voix : 'fr-FR');
  },

  questionHTML(card) {
    const flag = this.langue ? `<span class="translation-flag">${this.langue.from.drapeau}</span>` : '';
    const consigne = this.langue ? `Choisis la traduction en ${this.langue.to.nom} ${this.langue.to.drapeau}` : this.JEUX[this.jeu].consigne;
    return `
      <p class="word-card-title">${consigne}</p>
      <div class="jeu-question carte-text ${carteTextClass(card.q)}">${flag}${escapeText(card.q)}</div>`;
  },

  // ── QCM ──

  isNumber(text) {
    return /^\d+$/.test(String(text).replace(/\s/g, ''));
  },

  // Trois mauvaises réponses : d'abord celles qui ressemblent à la bonne
  // (nombre avec nombres, longueur voisine), tirées des autres cartes
  distractors(card) {
    const good = normalizeAnswer(card.a);
    const seen = new Set([good]);
    const others = [];
    shuffleArray([...this.listCards]).forEach(c => {
      const key = normalizeAnswer(c.a);
      if (seen.has(key)) return;
      seen.add(key);
      others.push(c.a);
    });

    const numeric = this.isNumber(card.a);
    const close = a => Math.abs([...a].length - [...card.a].length) <= 6;
    const alike = others.filter(a => this.isNumber(a) === numeric);
    const picked = [...alike.filter(close), ...alike.filter(a => !close(a))].slice(0, 3);

    // Pas assez de nombres dans la liste : des nombres voisins
    if (numeric && picked.length < 3) {
      const n = parseInt(String(card.a).replace(/\s/g, ''), 10);
      const spread = n >= 1000 ? 12 : (n >= 100 ? 20 : (n >= 20 ? 6 : 3));
      const around = [];
      for (let d = -spread; d <= spread; d++) {
        if (d !== 0 && n + d >= 0 && !seen.has(String(n + d))) around.push(String(n + d));
      }
      shuffleArray(around).slice(0, 3 - picked.length).forEach(a => {
        seen.add(a);
        picked.push(a);
      });
    }

    others.filter(a => !picked.includes(a)).slice(0, 3 - picked.length).forEach(a => picked.push(a));
    return picked;
  },

  showQcm() {
    const card = this.current();
    this.choices = shuffleArray([card.a, ...this.distractors(card)]);
    const long = this.choices.some(c => [...c].length > 22);
    document.getElementById('jeu-content').innerHTML = `
      <div class="word-card jeu-card">
        ${this.questionHTML(card)}
        <button class="btn btn-listen" onclick="JeuxCartes.speak()" aria-label="Écouter la question">🔊 Écouter</button>
      </div>
      <div class="qcm-choices${long ? ' long' : ''}">
        ${this.choices.map((c, i) => `
          <button class="qcm-choice ${carteTextClass(c)}" onclick="JeuxCartes.choose(${i})">${escapeText(c)}</button>`).join('')}
      </div>
      <div id="jeu-next" class="text-center mt-20 hidden">
        <button class="btn btn-primary btn-big" onclick="JeuxCartes.next()">Suivant →</button>
      </div>
    `;
  },

  choose(index) {
    if (this.locked || this.jeu !== 'qcm') return;
    this.locked = true;
    const card = this.current();
    const good = normalizeAnswer(card.a);
    const ok = normalizeAnswer(this.choices[index]) === good;

    document.querySelectorAll('#jeu-content .qcm-choice').forEach((btn, i) => {
      btn.disabled = true;
      if (normalizeAnswer(this.choices[i]) === good) btn.classList.add('right');
      else if (i === index) btn.classList.add('wrong');
    });

    this.settle(card, ok, { etoiles: CARTES.etoilesQcm, boiteMax: CARTES.boiteMaxQcm });
    renderSessionProgress('jeu-progress', this.total, this.done);
    if (ok) this.later(1100, () => this.next());
    else this.showNext();
  },

  // Après une erreur : l'enfant lit la bonne réponse, puis continue quand il veut
  showNext() {
    const next = document.getElementById('jeu-next');
    if (!next) return;
    next.classList.remove('hidden');
    this.later(150, () => next.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  },

  // ── Réponse à écrire ──

  keyboardHTML(digits) {
    const keys = (list, cls = '') => [...list]
      .map(k => `<button class="key ${cls}" data-k="${k}" onclick="JeuxCartes.key(this.dataset.k)">${k}</button>`).join('');
    return `
      <div class="virtual-keyboard-container" id="jeu-keyboard">
        <div class="virtual-keyboard">
          ${digits ? `<div class="key-row key-row-digits">${keys('1234567890')}</div>` : ''}
          <div class="key-row">${keys('abcdefghij')}</div>
          <div class="key-row">${keys('klmnopqrst')}</div>
          <div class="key-row">${keys('uvwxyz')}<button class="key special" onclick="JeuxCartes.key('EFFACER')" aria-label="Effacer">⌫</button></div>
          <!-- Accents : toujours visibles -->
          <div class="key-row key-row-accents">${keys('çàâéèêëîïôùûüÿ', 'key-accent')}</div>
        </div>
        <button class="key validate-btn" onclick="JeuxCartes.key('VALIDER')">✓<br>Valider</button>
      </div>`;
  },

  slotCount(card) {
    return [...card.a].filter(ch => this.isSlot(ch)).length;
  },

  showEcrire() {
    const card = this.current();
    this.input = '';
    // Le pavé de chiffres est là dès qu'une carte de la partie en a besoin :
    // il ne dit donc pas si cette réponse-ci est un nombre
    const digits = Object.values(this.cards).some(c => /\d/.test(c.a));
    document.getElementById('jeu-content').innerHTML = `
      <div class="word-card jeu-card">
        ${this.questionHTML(card)}
        <div id="jeu-tiles" class="word-tiles${[...card.a].length > 11 ? ' small' : ([...card.a].length > 7 ? ' mid' : '')}"></div>
        <button class="btn btn-listen" onclick="JeuxCartes.speak()" aria-label="Écouter la question">🔊 Écouter</button>
      </div>
      ${this.keyboardHTML(digits)}
      <div id="jeu-next" class="text-center mt-20 hidden">
        <button class="btn btn-primary btn-big" onclick="JeuxCartes.next()">Suivant →</button>
      </div>
    `;
    this.renderTiles();
  },

  renderTiles() {
    const box = document.getElementById('jeu-tiles');
    if (!box) return;
    const typed = [...this.input];
    let i = 0;
    let cursorPlaced = false;
    box.classList.remove('success');
    box.innerHTML = [...this.current().a].map(ch => {
      if (!this.isSlot(ch)) return ch === ' ' ? '<span class="tile space"></span>' : `<span class="tile given">${escapeText(ch)}</span>`;
      if (i < typed.length) return `<span class="tile typed">${typed[i++]}</span>`;
      i++;
      const cursor = cursorPlaced ? '' : ' cursor';
      cursorPlaced = true;
      return `<span class="tile missing${cursor}"></span>`;
    }).join('');

    const tile = box.querySelector('.tile.cursor') || [...box.querySelectorAll('.tile.typed')].pop();
    if (tile) {
      const b = tile.getBoundingClientRect();
      Kawaii.lookAt(this.buddy(), b.left + b.width / 2, b.top + b.height / 2, 3000);
    }
    const left = this.slotCount(this.current()) - typed.length;
    Kawaii.setLean(this.buddy(), left <= 1 && typed.length > 0);
  },

  key(k) {
    if (this.locked || this.jeu !== 'ecrire' || AppState.currentScreen !== 'jeu') return;
    if (k === 'VALIDER') {
      this.validate();
      return;
    }
    if (k === 'EFFACER') this.input = [...this.input].slice(0, -1).join('');
    else if ([...this.input].length < this.slotCount(this.current())) {
      this.input += k;
      Kawaii.react(this.buddy(), 'hoche');
    }
    this.renderTiles();
  },

  validate() {
    const card = this.current();
    if ([...this.input].length === 0) {
      showFeedback('Écris ta réponse d\'abord ✏️', 'error');
      return;
    }
    this.locked = true;
    const same = (a, b) => normalizeAnswer(a || '') === normalizeAnswer(b || '');
    const typed = [...this.input];
    const expected = [...card.a].filter(ch => this.isSlot(ch));
    const ok = expected.length === typed.length && expected.every((ch, i) => same(ch, typed[i]));

    // La bonne réponse, avec ses accents ; en rouge les cases fausses
    const box = document.getElementById('jeu-tiles');
    let i = 0;
    box.innerHTML = [...card.a].map(ch => {
      if (!this.isSlot(ch)) return ch === ' ' ? '<span class="tile space"></span>' : `<span class="tile given">${escapeText(ch)}</span>`;
      const good = same(ch, typed[i++]);
      return `<span class="tile ${good ? 'ok' : 'wrong'}">${escapeText(ch)}</span>`;
    }).join('');
    if (ok) box.classList.add('success');

    document.querySelectorAll('#jeu-keyboard .key').forEach(key => { key.disabled = true; });
    this.settle(card, ok, { etoiles: CARTES.etoilesEcrire, boiteMax: 3 });
    renderSessionProgress('jeu-progress', this.total, this.done);

    if (ok) {
      this.later(1500, () => this.next());
      return;
    }
    const keyboard = document.getElementById('jeu-keyboard');
    if (keyboard) {
      keyboard.outerHTML = `<p class="jeu-given">Tu as écrit : <strong>${escapeText(this.input)}</strong></p>`;
    }
    this.showNext();
  },

  // ── Paires ──

  nextRound() {
    this.round++;
    if (this.round >= this.rounds.length) {
      this.finish();
      return;
    }
    this.locked = false;
    this.foundQ = new Set();
    this.foundA = new Set();
    this.selected = null;
    this.renderProgress();

    const ids = this.rounds[this.round];
    const tiles = (side, order) => order.map(id => {
      const text = side === 'q' ? this.cards[id].q : this.cards[id].a;
      return `<button class="paire-tile ${side} ${carteTextClass(text)}" data-side="${side}" data-id="${id}" onclick="JeuxCartes.tap('${side}', ${id})">${escapeText(text)}</button>`;
    }).join('');
    const manche = this.rounds.length > 1 ? ` · manche ${this.round + 1}/${this.rounds.length}` : '';

    const labels = this.langue
      ? [`${this.langue.from.drapeau} ${capitalizeFirst(this.langue.from.nom)}`, `${this.langue.to.drapeau} ${capitalizeFirst(this.langue.to.nom)}`]
      : ['❓ Questions', '💡 Réponses'];
    const consigne = this.langue ? 'Relie chaque mot à sa traduction' : this.JEUX.paires.consigne;

    document.getElementById('jeu-content').innerHTML = `
      <p class="intro">${consigne}${manche}</p>
      <div class="paires-grid${this.langue ? ' even' : ''}">
        <div class="paires-col">
          <div class="paires-label">${labels[0]}</div>
          ${tiles('q', shuffleArray([...ids]))}
        </div>
        <div class="paires-col">
          <div class="paires-label">${labels[1]}</div>
          ${tiles('a', shuffleArray([...ids]))}
        </div>
      </div>
    `;
    window.scrollTo(0, 0);
  },

  tileOf(side, id) {
    return document.querySelector(`#jeu-content .paire-tile[data-side="${side}"][data-id="${id}"]`);
  },

  tap(side, id) {
    if (this.locked || this.jeu !== 'paires') return;
    if ((side === 'q' ? this.foundQ : this.foundA).has(id)) return;

    const previous = this.selected;
    // Premier choix, ou autre choix dans la même colonne
    if (!previous || previous.side === side) {
      if (previous) this.tileOf(previous.side, previous.id).classList.remove('selected');
      const same = previous && previous.id === id;
      this.selected = same ? null : { side, id };
      if (!same) this.tileOf(side, id).classList.add('selected');
      return;
    }

    const q = side === 'q' ? id : previous.id;
    const a = side === 'a' ? id : previous.id;
    const qTile = this.tileOf('q', q);
    const aTile = this.tileOf('a', a);
    this.selected = null;
    qTile.classList.remove('selected');
    aTile.classList.remove('selected');

    // Deux cartes peuvent avoir la même réponse : les deux sont justes
    const ok = normalizeAnswer(this.cards[q].a) === normalizeAnswer(this.cards[a].a);
    Defis.answer(ok);

    if (!ok) {
      this.erred.add(q);
      if (!this.toReview.includes(q)) this.toReview.push(q);
      [qTile, aTile].forEach(t => {
        t.classList.remove('wrong');
        void t.offsetWidth;
        t.classList.add('wrong');
      });
      Kawaii.react(this.buddy(), 'oups');
      this.later(650, () => [qTile, aTile].forEach(t => t.classList.remove('wrong')));
      return;
    }

    this.foundQ.add(q);
    this.foundA.add(a);
    [qTile, aTile].forEach(t => {
      t.classList.add('found');
      t.disabled = true;
    });
    this.done++;
    if (!this.erred.has(q)) {
      this.correct++;
      this.award(CARTES.etoilesPaire);
    }
    Kawaii.react(this.buddy(), 'bravo');
    this.renderProgress();

    if (this.foundQ.size === this.rounds[this.round].length) {
      this.locked = true;
      this.later(900, () => this.nextRound());
    }
  },

  // ── Fin de partie ──

  finish() {
    const perfect = this.total >= 5 && this.correct === this.total;
    this.bonus = 0;
    if (perfect) {
      this.bonus = ECONOMIE.bonusSansFaute;
      Storage.addStars(this.bonus);
      // Écrire sans faute, c'est savoir : coffre rare comme à l'interrogation
      if (this.jeu === 'ecrire') Storage.grantChest('rare');
      triggerFireworks();
    }
    if (this.becameNinja) Storage.grantChest('rare');
    Defis.track('session');
    Defis.track('jeu');
    const run = this.run;
    setTimeout(() => {
      if (run !== this.run) return;
      openPendingChests(() => this.results());
    }, perfect ? 1600 : 300);
  },

  results() {
    showScreen('results');
    const container = document.getElementById('results-content');
    if (!container) return;

    const review = this.toReview.map(id => this.cards[id]);
    const freeStickers = Storage.getFreeStickers().reduce((sum, x) => sum + x.count, 0);
    const earned = this.stars + this.bonus;
    const unit = this.jeu === 'paires' ? 'paire' : 'réponse';
    const plural = this.correct > 1 ? 's' : '';
    const found = this.jeu === 'paires' ? `trouvée${plural}` : `juste${plural}`;

    let html = `
      <div class="result-hero">
        <div class="result-icon">${review.length === 0 ? '🏆' : '👏'}</div>
        <h2>${review.length === 0 ? 'Parfait !' : 'Bien joué !'}</h2>
        <p class="result-score">${this.correct} / ${this.total}</p>
        <p class="result-sub">${unit}${plural} ${found} du premier coup</p>
        ${earned > 0 ? `<div class="stars-earned">+${earned} ⭐ gagnées</div>` : ''}
      </div>
    `;

    if (this.becameNinja) {
      html += `
        <div class="level-up">
          ${celebrationArt('🥷')}
          <div class="level-up-title">Liste Ninja !</div>
          <div class="level-up-sub">Tu connais toutes les cartes de cette liste</div>
        </div>
      `;
    }
    html += Defis.celebrationHTML();

    if (review.length > 0) {
      html += `<div class="error-card"><h3>À revoir (${review.length})</h3>`;
      review.forEach(card => {
        html += `
          <div class="error-item">
            <div class="error-word">${escapeText(card.q)}</div>
            <div class="error-detail">Réponse : <span class="error-expected">${escapeText(card.a)}</span></div>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<div class="success-card">✅ Aucune erreur !</div>';
    }

    if (AppState.newCompanionUnlocked) {
      AppState.newCompanionUnlocked = false;
      html += `
        <div class="level-up">
          ${celebrationArt('🐾')}
          <div class="level-up-title">Nouveau compagnon débloqué !</div>
          <div class="level-up-sub">Va choisir ton kawaii de compagnie</div>
          <div class="team-actions"><button class="btn btn-secondary" onclick="showKawaiiScreen()">🎨 Choisir mon compagnon</button></div>
        </div>
      `;
    }

    html += `
      <div class="result-actions">
        <button class="btn btn-primary btn-big" onclick="replaySession()">${this.JEUX[this.jeu].icone} Encore une partie</button>
        <button class="btn btn-secondary" onclick="showListsScreen()">📚 Changer de jeu</button>
        ${freeStickers > 0 ? `<button class="btn btn-ghost" onclick="collerStickers()">🏙️ Coller mes ${freeStickers} sticker${freeStickers > 1 ? 's' : ''}</button>` : ''}
      </div>
    `;
    container.innerHTML = html;
  }
};

// Clavier physique (ordinateur) pour la réponse à écrire
document.addEventListener('keydown', (e) => {
  if (AppState.currentScreen !== 'jeu' || JeuxCartes.jeu !== 'ecrire') return;
  if (e.metaKey || e.ctrlKey || e.altKey || document.getElementById('sheet-overlay')) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (JeuxCartes.locked) {
      const next = document.getElementById('jeu-next');
      if (next && !next.classList.contains('hidden')) JeuxCartes.next();
    } else {
      JeuxCartes.key('VALIDER');
    }
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    JeuxCartes.key('EFFACER');
  } else if ([...e.key].length === 1 && JeuxCartes.isSlot(e.key)) {
    JeuxCartes.key(e.key.toLowerCase());
  }
});
