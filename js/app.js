// ═══════════════════════════════════════════════════════════════
// PALAIS MENTAL - APPLICATION PRINCIPALE
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// ÉTAT GLOBAL DE L'APPLICATION
// ───────────────────────────────────────────────────────────────

const AppState = {
  currentScreen: 'home',
  currentList: null,
  currentLevel: 0,
  currentWordIndex: 0,
  currentMode: null, // 'apprentissage' ou 'interrogation'
  score: 0,
  totalQuestions: 0,
  currentWord: null,
  currentLocation: null,
  userInput: '',
  timerInterval: null,
  audioContext: null,
  beepOscillator: null,
  animationSpeed: 1.0, // Vitesse d'animation en secondes par lettre
  currentLetterIndex: 0,
  isAnimating: false,
  animationSpeed: 1.5, // Vitesse par défaut à 1.5s
  missingLettersStart: 0, // Position de début des lettres manquantes
  missingLettersCount: 0, // Nombre de lettres à trouver
  wordPattern: '', // Mot avec _ pour les lettres manquantes
  isValidating: false, // Flag pour empêcher les validations multiples
  lastLearnedWords: [], // Mots vus lors du dernier apprentissage : [{ word, list }]
  allApprentissageLevels: [], // Tous les paquets de la visite en cours
  allInterrogationLevels: [], // Tous les niveaux de l'interrogation en cours
  sessionLists: [], // Listes de la session en cours (plusieurs pour un mix)
  sessionByList: {}, // Réussite par liste pendant la session : { listId: { correct, total } }
  sessionStars: 0, // Étoiles gagnées pendant la session en cours
  sessionCorrect: 0, // Bonnes réponses sur toute la session (tous paquets)
  sessionTotal: 0, // Questions posées sur toute la session
  listLevel: 0, // Niveau de difficulté de la liste en cours (mémorisé par liste)
  listMaxLevel: 0, // Niveau maximum de la liste (= niveau Ninja)
  decoyCount: 0, // Cases pièges en plus (niveau Ninja)
  newCompanionUnlocked: false, // Une liste vient d'atteindre Ninja et ouvre un compagnon
  currentPiece: null, // Pièce ouverte dans "Mon palais"
  interrogationMode: 'progressive', // 'progressive' ou 'complete'
  errors: [], // Liste des erreurs commises pendant la session
  editingListId: null, // ID de la liste en cours d'édition
  soundEnabled: true, // Son activé par défaut
  volume: 1, // Volume des sons (0 à 1)
  sessionReplay: null, // Fonction pour rejouer la session d'interrogation en cours
  reloadOnHome: false // Données reçues d'un autre appareil : recharger au retour à l'accueil
};

// ───────────────────────────────────────────────────────────────
// UTILITAIRES LOCALSTORAGE
// ───────────────────────────────────────────────────────────────

const Storage = {
  // Récupère toutes les listes de mots
  getLists() {
    const lists = localStorage.getItem('wordLists');
    return lists ? JSON.parse(lists) : [];
  },

  // Sauvegarde toutes les listes
  saveLists(lists) {
    localStorage.setItem('wordLists', JSON.stringify(lists));
  },

  // Ajoute une nouvelle liste
  addList(name, words) {
    const lists = this.getLists();
    const newList = {
      id: Date.now(),
      name,
      words,
      createdAt: new Date().toISOString(),
      wordLocations: this.assignLocations(words),
      progress: {} // {mot: {attempts: 0, successes: 0, lastScore: 0}}
    };
    lists.push(newList);
    this.saveLists(lists);
    return newList;
  },

  // Met à jour une liste existante
  updateList(listId, name, words) {
    const lists = this.getLists();
    const listIndex = lists.findIndex(l => l.id === listId);

    if (listIndex === -1) return null;

    const list = lists[listIndex];

    // Met à jour le nom
    list.name = name;

    // Met à jour les mots
    const oldWords = list.words;
    list.words = words;

    // Réassigne les emplacements uniquement pour les nouveaux mots
    const newWords = words.filter(w => !oldWords.includes(w));
    if (newWords.length > 0) {
      const allLocations = this.getAllLocations();
      const usedLocations = Object.values(list.wordLocations);
      const availableLocations = allLocations.filter(loc =>
        !usedLocations.some(used => used.piece === loc.piece && used.emplacement === loc.emplacement)
      );
      const shuffled = this.shuffleLocations(availableLocations);

      const pool = shuffled.length > 0 ? shuffled : this.shuffleLocations(allLocations);
      newWords.forEach((word, index) => {
        if (pool.length > 0) {
          list.wordLocations[word] = pool[index % pool.length];
        }
      });
    }

    // Nettoie les emplacements des mots supprimés
    Object.keys(list.wordLocations).forEach(word => {
      if (!words.includes(word)) {
        delete list.wordLocations[word];
      }
    });

    // Nettoie la progression des mots supprimés
    Object.keys(list.progress).forEach(word => {
      if (!words.includes(word)) {
        delete list.progress[word];
      }
    });

    lists[listIndex] = list;
    this.saveLists(lists);
    return list;
  },

  // ── Listes « cartes questions » ──
  // Même tiroir que les listes de mots (wordLists), avec type: 'cartes-questions'.
  // Une liste sans type est une liste de mots. words/wordLocations/progress
  // restent vides pour que le reste de l'app (palais, mots à travailler) les ignore.
  // Carte : { id, q, a, box } — box 0 = jamais vue, 1 = à revoir, 2 = ça vient, 3 = connue.
  // La progression est attachée à l'id : on peut corriger une question sans la perdre.

  isCardList(list) {
    return list.type === 'cartes-questions';
  },

  addCardList(name, pairs) {
    const lists = this.getLists();
    const newList = {
      id: Date.now(),
      type: 'cartes-questions',
      name,
      createdAt: new Date().toISOString(),
      words: [],
      wordLocations: {},
      progress: {},
      cards: pairs.map((p, i) => ({ id: i + 1, q: p.q, a: p.a, box: 0 })),
      nextCardId: pairs.length + 1,
      ninja: false
    };
    lists.push(newList);
    this.saveLists(lists);
    return newList;
  },

  // Remplace les cartes par celles saisies, en gardant la boîte des cartes
  // reconnues : même question, sinon même réponse, sinon même ligne
  // (quand le nombre de lignes n'a pas changé).
  updateCardList(listId, name, pairs) {
    const lists = this.getLists();
    const list = lists.find(l => l.id === listId);
    if (!list) return null;

    const old = list.cards || [];
    const taken = new Set();
    const claim = (test) => {
      const card = old.find(c => !taken.has(c.id) && test(c));
      if (card) taken.add(card.id);
      return card;
    };
    const matches = pairs.map(p => claim(c => c.q === p.q));
    pairs.forEach((p, i) => { if (!matches[i]) matches[i] = claim(c => c.a === p.a); });
    if (pairs.length === old.length) {
      pairs.forEach((p, i) => { if (!matches[i]) matches[i] = claim(c => c === old[i]); });
    }

    let nextId = list.nextCardId || old.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    list.cards = pairs.map((p, i) => {
      const card = matches[i];
      return card ? { ...card, q: p.q, a: p.a } : { id: nextId++, q: p.q, a: p.a, box: 0 };
    });
    list.nextCardId = nextId;
    list.name = name;
    this.saveLists(lists);
    return list;
  },

  // Range une carte dans une boîte. Toutes les cartes en boîte 3 = liste Ninja,
  // et ça ne redescend jamais. Retourne true si la liste vient de devenir Ninja.
  setCardBox(listId, cardId, box) {
    const lists = this.getLists();
    const list = lists.find(l => l.id === listId);
    const card = list && (list.cards || []).find(c => c.id === cardId);
    if (!card) return false;
    card.box = box;
    const becameNinja = !list.ninja && list.cards.every(c => c.box >= 3);
    if (becameNinja) list.ninja = true;
    this.saveLists(lists);
    return becameNinja;
  },

  // ── Listes de langue ──
  // Une liste de mots avec type: 'langue'. words = les traductions à écrire
  // (niveaux, lieux et progression marchent donc comme pour une liste de mots),
  // translations = { traduction: mot de départ }, langFrom → langTo.

  isLangList(list) {
    return list.type === 'langue';
  },

  addLangList(name, langFrom, langTo, pairs) {
    const list = this.addList(name, pairs.map(p => p.a));
    const lists = this.getLists();
    const saved = lists.find(l => l.id === list.id);
    Object.assign(saved, { type: 'langue', langFrom, langTo, translations: translationsOf(pairs) });
    this.saveLists(lists);
    return saved;
  },

  updateLangList(listId, name, langFrom, langTo, pairs) {
    if (!this.updateList(listId, name, pairs.map(p => p.a))) return null;
    const lists = this.getLists();
    const list = lists.find(l => l.id === listId);
    Object.assign(list, { langFrom, langTo, translations: translationsOf(pairs) });
    this.saveLists(lists);
    return list;
  },

  isListNinja(list) {
    if (this.isCardList(list)) return !!list.ninja;
    return this.getListLevel(list) >= this.getListMaxLevel(list);
  },

  // Supprime une liste
  deleteList(listId) {
    const lists = this.getLists();
    const filtered = lists.filter(l => l.id !== listId);
    this.saveLists(filtered);
    return filtered.length < lists.length; // true si suppression réussie
  },

  // Listes cochées dans « Mélanger des listes » : retrouvées d'une fois sur l'autre
  getMixSelection() {
    try {
      const ids = JSON.parse(localStorage.getItem('mixSelection') || '[]');
      return Array.isArray(ids) ? ids : [];
    } catch (e) {
      return [];
    }
  },

  saveMixSelection(listIds) {
    localStorage.setItem('mixSelection', JSON.stringify(listIds));
  },

  // Assigne les emplacements aux mots de façon DÉTERMINISTE
  assignLocations(words) {
    const allLocations = this.getAllLocations();
    const mapping = {};

    // Mélange aléatoire des emplacements (mais stable pour cette liste)
    const shuffled = this.shuffleLocations(allLocations);

    words.forEach((word, index) => {
      if (shuffled.length > 0) {
        mapping[word] = shuffled[index % shuffled.length];
      }
    });

    return mapping;
  },

  // ── Maison : pièces et endroits, modifiables dans l'app ──
  // Format stocké : [{ piece, emplacements: [] }] (l'ordre compte).
  // Sans sauvegarde, la maison de départ vient de LIEUX (data/lieux.js).

  maisonParDefaut() {
    return Object.entries(LIEUX).map(([piece, emplacements]) => ({ piece, emplacements: [...emplacements] }));
  },

  getMaison() {
    const raw = localStorage.getItem('maison');
    if (raw) {
      try {
        const m = JSON.parse(raw);
        if (Array.isArray(m)) return m;
      } catch (e) {
      }
    }
    return this.maisonParDefaut();
  },

  saveMaison(maison) {
    localStorage.setItem('maison', JSON.stringify(maison));
  },

  // Renomme une pièce (emplacement null) ou un endroit, dans la maison,
  // dans les listes (wordLocations) et dans les stickers collés.
  renommerLieu(piece, emplacement, nouveauNom) {
    const maison = this.getMaison();
    const room = maison.find(r => r.piece === piece);
    if (!room) return false;

    const remap = (loc) => {
      if (emplacement === null) {
        return loc.piece === piece ? { piece: nouveauNom, emplacement: loc.emplacement } : null;
      }
      return (loc.piece === piece && loc.emplacement === emplacement)
        ? { piece, emplacement: nouveauNom } : null;
    };

    if (emplacement === null) room.piece = nouveauNom;
    else {
      const i = room.emplacements.indexOf(emplacement);
      if (i === -1) return false;
      room.emplacements[i] = nouveauNom;
    }
    this.saveMaison(maison);

    const lists = this.getLists();
    lists.forEach(list => {
      Object.entries(list.wordLocations || {}).forEach(([word, loc]) => {
        const next = remap(loc);
        if (next) list.wordLocations[word] = next;
      });
    });
    this.saveLists(lists);

    const eco = this.getEconomy();
    const placed = {};
    Object.entries(eco.placed || {}).forEach(([key, ids]) => {
      const [p, e] = key.split('|');
      const next = remap({ piece: p, emplacement: e });
      placed[next ? placeKeyOf(next) : key] = ids;
    });
    eco.placed = placed;
    this.saveEconomy(eco);
    return true;
  },

  // Supprime une pièce (emplacement null) ou un endroit. Les stickers collés
  // redeviennent libres, les mots rangés là sont déplacés ailleurs.
  supprimerLieu(piece, emplacement) {
    const maison = this.getMaison();
    const idx = maison.findIndex(r => r.piece === piece);
    if (idx === -1) return false;

    const supprimes = emplacement === null
      ? maison[idx].emplacements.map(e => placeKeyOf({ piece, emplacement: e }))
      : [placeKeyOf({ piece, emplacement })];

    if (emplacement === null) maison.splice(idx, 1);
    else maison[idx].emplacements = maison[idx].emplacements.filter(e => e !== emplacement);
    this.saveMaison(maison);

    const eco = this.getEconomy();
    supprimes.forEach(key => delete eco.placed[key]);
    this.saveEconomy(eco);

    this.reparerEmplacements();
    return true;
  },

  // Donne un endroit à chaque mot dont l'endroit n'existe plus (ou n'a jamais
  // existé, par exemple plus de mots que d'endroits). Appelé au démarrage et
  // après une suppression.
  reparerEmplacements() {
    const all = this.getAllLocations();
    if (all.length === 0) return;
    const valides = new Set(all.map(placeKeyOf));

    const lists = this.getLists();
    let changed = false;
    lists.forEach(list => {
      list.wordLocations = list.wordLocations || {};
      const orphelins = (list.words || []).filter(w => {
        const loc = list.wordLocations[w];
        return !loc || !valides.has(placeKeyOf(loc));
      });
      if (orphelins.length === 0) return;

      const utilises = new Set(
        Object.values(list.wordLocations).map(placeKeyOf).filter(k => valides.has(k))
      );
      const libres = this.shuffleLocations(all.filter(loc => !utilises.has(placeKeyOf(loc))));
      orphelins.forEach((word, i) => {
        list.wordLocations[word] = libres[i] || all[Math.floor(Math.random() * all.length)];
      });
      changed = true;
    });
    if (changed) this.saveLists(lists);
  },

  // Récupère tous les emplacements disponibles
  getAllLocations() {
    const locations = [];
    Storage.getMaison().forEach(({ piece, emplacements }) => {
      emplacements.forEach(emplacement => {
        locations.push({ piece, emplacement });
      });
    });
    return locations;
  },

  // Mélange les emplacements en évitant 3 emplacements consécutifs de la même pièce
  shuffleLocations(locations) {
    const shuffled = [...locations].sort(() => Math.random() - 0.5);

    // Vérifie et corrige si 3 emplacements consécutifs de la même pièce
    for (let i = 0; i < shuffled.length - 2; i++) {
      if (
        shuffled[i].piece === shuffled[i + 1].piece &&
        shuffled[i + 1].piece === shuffled[i + 2].piece
      ) {
        // Trouve un emplacement différent à échanger
        for (let j = i + 3; j < shuffled.length; j++) {
          if (shuffled[j].piece !== shuffled[i].piece) {
            [shuffled[i + 2], shuffled[j]] = [shuffled[j], shuffled[i + 2]];
            break;
          }
        }
      }
    }

    return shuffled;
  },

  // ── Équipe de kawaii : un principal + jusqu'à 5 compagnons ──

  getTeam() {
    const raw = localStorage.getItem('kawaiiTeam');
    const team = raw ? JSON.parse(raw) : {};
    return {
      main: team.main || null,                // config Kawaii ou null
      companions: Array.from({ length: 5 }, (_, i) => (team.companions || [])[i] || null)
    };
  },

  saveTeam(team) {
    localStorage.setItem('kawaiiTeam', JSON.stringify(team));
  },

  // Nombre de compagnons débloqués = nombre de listes au niveau Ninja (max 5)
  getCompanionSlots() {
    const ninja = this.getLists().filter(l => this.isListNinja(l)).length;
    return Math.min(5, ninja);
  },

  // ── Niveau de difficulté par liste (ne redescend jamais) ──

  // Niveau actuel (0 = 2 lettres à trouver, +1 lettre par niveau)
  getListLevel(list) {
    return Math.min(list.level || 0, this.getListMaxLevel(list));
  },

  // Niveau maximum = niveau Ninja : mot entier masqué + cases pièges.
  // Juste avant, le niveau où le mot le plus long est entièrement masqué.
  getListMaxLevel(list) {
    const longest = list.words.reduce((max, w) => Math.max(max, w.length), 0);
    return Math.max(0, longest - 2) + 1;
  },

  setListLevel(listId, level) {
    const lists = this.getLists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    list.level = level;
    this.saveLists(lists);
  },

  // Met à jour la progression d'un mot
  updateProgress(listId, word, success) {
    const lists = this.getLists();
    const list = lists.find(l => l.id === listId);

    if (list) {
      if (!list.progress[word]) {
        list.progress[word] = { attempts: 0, successes: 0, lastScore: 0 };
      }

      list.progress[word].attempts++;
      if (success) {
        list.progress[word].successes++;
      }
      list.progress[word].lastScore = list.progress[word].successes / list.progress[word].attempts;

      this.saveLists(lists);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // ÉCONOMIE : étoiles, coffres, stickers, décoration du palais
  // ═══════════════════════════════════════════════════════════

  getEconomy() {
    const raw = localStorage.getItem('economy');
    const eco = raw ? JSON.parse(raw) : {};
    return {
      stars: eco.stars || 0,                   // solde dépensable
      totalEarned: eco.totalEarned || 0,       // cumul gagné (jauge des coffres)
      chestsOpened: eco.chestsOpened || 0,     // coffres de palier déjà attribués
      pendingChests: eco.pendingChests || [],  // coffres à ouvrir : 'normal' | 'rare'
      inventory: eco.inventory || {},          // { stickerId: nombre possédé }
      placed: eco.placed || {},                // { "piece|emplacement": [stickerId, ...] }
      wardrobe: eco.wardrobe || []             // accessoires d'atelier débloqués ("hat:couronne")
    };
  },

  saveEconomy(eco) {
    localStorage.setItem('economy', JSON.stringify(eco));
  },

  // Ajoute des étoiles et crée un coffre à chaque palier franchi
  addStars(n) {
    const eco = this.getEconomy();
    eco.stars += n;
    eco.totalEarned += n;
    const due = Math.floor(eco.totalEarned / ECONOMIE.etoilesParCoffre);
    while (eco.chestsOpened < due) {
      eco.chestsOpened++;
      eco.pendingChests.push('normal');
    }
    this.saveEconomy(eco);
    return eco;
  },

  spendStars(n) {
    const eco = this.getEconomy();
    if (eco.stars < n) return false;
    eco.stars -= n;
    this.saveEconomy(eco);
    return true;
  },

  grantChest(tier) {
    const eco = this.getEconomy();
    eco.pendingChests.push(tier);
    this.saveEconomy(eco);
  },

  // Retire et retourne le prochain coffre à ouvrir (ou null)
  popChest() {
    const eco = this.getEconomy();
    if (eco.pendingChests.length === 0) return null;
    const tier = eco.pendingChests.shift();
    this.saveEconomy(eco);
    return tier;
  },

  addSticker(stickerId) {
    const eco = this.getEconomy();
    eco.inventory[stickerId] = (eco.inventory[stickerId] || 0) + 1;
    this.saveEconomy(eco);
  },

  // Nombre d'exemplaires d'un sticker pas encore collés
  getFreeCount(stickerId, eco = this.getEconomy()) {
    const owned = eco.inventory[stickerId] || 0;
    let placedCount = 0;
    Object.values(eco.placed).forEach(ids => {
      placedCount += ids.filter(id => id === stickerId).length;
    });
    return owned - placedCount;
  },

  // Tous les stickers libres : [{sticker, count}]
  getFreeStickers() {
    const eco = this.getEconomy();
    return STICKERS
      .map(s => ({ sticker: s, count: this.getFreeCount(s.id, eco) }))
      .filter(x => x.count > 0);
  },

  placeSticker(placeKey, stickerId) {
    const eco = this.getEconomy();
    const list = eco.placed[placeKey] || [];
    if (list.length >= ECONOMIE.maxStickersParLieu) return false;
    if (this.getFreeCount(stickerId, eco) <= 0) return false;
    list.push(stickerId);
    eco.placed[placeKey] = list;
    this.saveEconomy(eco);
    return true;
  },

  removeSticker(placeKey, index) {
    const eco = this.getEconomy();
    const list = eco.placed[placeKey] || [];
    list.splice(index, 1);
    if (list.length === 0) delete eco.placed[placeKey];
    else eco.placed[placeKey] = list;
    this.saveEconomy(eco);
  },

  // ── Garde-robe : accessoires débloqués pour l'atelier ──
  getWardrobe() {
    return this.getEconomy().wardrobe || [];
  },

  hasAccessory(id) {
    return this.getWardrobe().includes(id);
  },

  unlockAccessory(id) {
    const eco = this.getEconomy();
    eco.wardrobe = eco.wardrobe || [];
    if (!eco.wardrobe.includes(id)) eco.wardrobe.push(id);
    this.saveEconomy(eco);
  },

  // Accessoire au hasard parmi ceux pas encore débloqués (ou null)
  drawAccessory() {
    const locked = accessoryCatalog().filter(x => !this.hasAccessory(x.id));
    if (locked.length === 0) return null;
    return locked[Math.floor(Math.random() * locked.length)];
  },

  getPlacedStickers(placeKey) {
    const eco = this.getEconomy();
    return (eco.placed[placeKey] || []).map(id => getSticker(id)).filter(Boolean);
  },

  // Tire un sticker au hasard selon la rareté. Un coffre 'rare' garantit rare ou mieux.
  drawSticker(tier) {
    const roll = Math.random();
    let rarity;
    if (tier === 'rare') {
      rarity = roll < 0.08 ? 'kawaii' : (roll < 0.28 ? 'legendaire' : 'rare');
    } else {
      const c = ECONOMIE.chancesCoffre;
      rarity = roll < c.kawaii ? 'kawaii'
        : (roll < c.kawaii + c.legendaire ? 'legendaire'
        : (roll < c.kawaii + c.legendaire + c.rare ? 'rare' : 'commun'));
    }
    const pool = STICKERS.filter(s => s.rarete === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }
};

// ───────────────────────────────────────────────────────────────
// NAVIGATION ENTRE ÉCRANS
// ───────────────────────────────────────────────────────────────

function showScreen(screenId) {
  // Des données d'un autre appareil sont arrivées pendant une session :
  // on repart de l'accueil avec un état tout neuf
  if (screenId === 'home' && AppState.reloadOnHome) {
    window.location.reload();
    return;
  }

  // Nettoie les timers et animations en cours avant de changer d'écran
  cleanupCurrentScreen();

  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const screen = document.getElementById(`${screenId}-screen`);
  if (screen) {
    screen.classList.add('active');
    AppState.currentScreen = screenId;
  }

  if (screenId === 'home') {
    renderHome();
    renderSyncStatus();
  }
  window.scrollTo(0, 0);
}

function cleanupCurrentScreen() {
  // Arrête tous les timers en cours
  if (AppState.timerInterval) {
    clearTimeout(AppState.timerInterval);
    clearInterval(AppState.timerInterval);
    AppState.timerInterval = null;
  }

  // Arrête l'animation du mot si active
  if (AppState.isAnimating) {
    stopWordAnimation();
  }

  // Arrête la synthèse vocale si active
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Réinitialise l'état d'animation
  AppState.isAnimating = false;
}

// ───────────────────────────────────────────────────────────────
// AUDIO - Système de notes musicales pour chaque lettre
// ───────────────────────────────────────────────────────────────

async function initAudio() {
  if (!AppState.audioContext) {
    try {
      AppState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext créé avec succès');
    } catch (e) {
      console.error('Erreur création AudioContext:', e);
      return;
    }
  }

  // Sur iOS/Safari, le contexte peut être en état 'suspended'
  if (AppState.audioContext && AppState.audioContext.state === 'suspended') {
    try {
      await AppState.audioContext.resume();
      console.log('AudioContext resumed avec succès');
    } catch (e) {
      console.error('Erreur resume AudioContext:', e);
    }
  }
}

// Gamme pentatonique majeure sur 2 octaves (limité à ~1400Hz pour rester agréable)
const PENTATONIC_SCALE = [
  261.63, // C4 - Do
  293.66, // D4 - Ré
  329.63, // E4 - Mi
  392.00, // G4 - Sol
  440.00, // A4 - La
  523.25, // C5 - Do
  587.33, // D5 - Ré
  659.25, // E5 - Mi
  783.99, // G5 - Sol
  880.00, // A5 - La
  1046.50, // C6 - Do
  1174.66, // D6 - Ré
  1318.51  // E6 - Mi (1318 Hz max)
];

// Convertit un caractère en fréquence musicale
function charToFrequency(char) {
  // Liste de tous les caractères possibles
  const chars = 'abcdefghijklmnopqrstuvwxyzàâäéèêëïîôùûüÿç\'-_ ';

  // Trouve l'index du caractère (insensible à la casse)
  const index = chars.indexOf(char.toLowerCase());

  // Si caractère inconnu, utilise une note par défaut
  if (index === -1) return PENTATONIC_SCALE[0];

  // Map l'index du caractère à une note de la gamme
  return PENTATONIC_SCALE[index % PENTATONIC_SCALE.length];
}

// Joue une note musicale pour un caractère
async function playBeep(char = 'a') {
  // Vérifie si le son est activé
  if (!AppState.soundEnabled) {
    return; // Son désactivé, on ne joue rien
  }

  // Initialise l'audio si nécessaire
  if (!AppState.audioContext) {
    await initAudio();
  }

  // Vérifie que le contexte audio est prêt
  if (!AppState.audioContext) {
    console.warn('AudioContext non disponible');
    return;
  }

  // Resume le contexte s'il est suspendu (iOS/Safari)
  if (AppState.audioContext.state === 'suspended') {
    await AppState.audioContext.resume();
  }

  try {
    const oscillator = AppState.audioContext.createOscillator();
    const gainNode = AppState.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(AppState.audioContext.destination);

    // Obtient la fréquence basée sur le caractère
    const frequency = charToFrequency(char);
    oscillator.frequency.value = frequency;

    console.log(`Joue note pour '${char}': ${frequency}Hz`);

    // Son de type 'sine' pour un son doux et musical
    oscillator.type = 'sine';

    // Enveloppe ADSR pour un son plus agréable
    const now = AppState.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    const v = AppState.volume;
    gainNode.gain.linearRampToValueAtTime(0.3 * v, now + 0.05); // Attack
    gainNode.gain.linearRampToValueAtTime(0.2 * v, now + 0.1); // Decay
    gainNode.gain.setValueAtTime(0.2 * v, now + 0.3); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); // Release

    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch (e) {
    console.error('Erreur playBeep:', e);
  }
}

// ───────────────────────────────────────────────────────────────
// DÉCOUPAGE EN NIVEAUX (10 mots max par niveau)
// ───────────────────────────────────────────────────────────────

function splitIntoLevels(words) {
  const levels = [];
  for (let i = 0; i < words.length; i += 10) {
    levels.push(words.slice(i, i + 10));
  }
  return levels;
}

// ───────────────────────────────────────────────────────────────
// MODE APPRENTISSAGE - Visite du palais
// ───────────────────────────────────────────────────────────────

// ── Sessions sur une ou plusieurs listes (mix) ──
// Une session est une suite de { word, list }. Chaque mot garde sa liste :
// son lieu, son niveau de difficulté et sa progression en dépendent.

function sessionItems(lists) {
  return lists.flatMap(list => list.words.map(word => ({ word, list })));
}

// Listes de mots (pas les cartes questions) correspondant aux ids, dans l'ordre de « Mes listes »
function wordListsByIds(listIds) {
  return Storage.getLists().filter(l => listIds.includes(l.id) && !Storage.isCardList(l));
}

// Installe le mot en cours : sa liste, son lieu et le niveau de sa liste
function setCurrentItem(item) {
  AppState.currentList = item.list;
  AppState.currentWord = item.word;
  AppState.currentLocation = item.list.wordLocations[item.word];
  AppState.listLevel = Storage.getListLevel(item.list);
  AppState.listMaxLevel = Storage.getListMaxLevel(item.list);
}

// { traduction: mot de départ } à partir des lignes « mot = traduction »
function translationsOf(pairs) {
  const translations = {};
  pairs.forEach(p => { translations[p.a] = p.q; });
  return translations;
}

// Mot de départ d'une liste de langue (null pour une liste de mots)
function promptOf(list, word) {
  if (!Storage.isLangList(list)) return null;
  return (list.translations || {})[word] || null;
}

function langInfo(code) {
  return LANGUES[code] || LANGUES.fr;
}

// Mot de départ de la question en cours, avec son drapeau
function promptHTML(list, word) {
  const prompt = promptOf(list, word);
  if (!prompt) return '';
  const from = langInfo(list.langFrom);
  const to = langInfo(list.langTo);
  return `
    <div class="translation-word"><span class="translation-flag">${from.drapeau}</span>${escapeText(prompt)}</div>
    <div class="translation-to">en ${to.nom} ${to.drapeau}</div>
  `;
}

function showTranslationPrompt(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const html = promptHTML(AppState.currentList, AppState.currentWord);
  box.innerHTML = html;
  box.classList.toggle('hidden', !html);
}

function isMixSession() {
  return AppState.sessionLists.length > 1;
}

function startApprentissage(listId) {
  startApprentissageOnLists([listId]);
}

// Une liste seule : visite dans l'ordre des mots.
// Mix : les mots de toutes les listes sont mélangés entre eux, comme à l'interrogation.
function startApprentissageOnLists(listIds) {
  const lists = wordListsByIds(listIds);
  const items = sessionItems(lists);
  if (items.length === 0) return;
  if (lists.length > 1) shuffleArray(items);

  AppState.sessionLists = lists;
  AppState.currentMode = 'apprentissage';
  AppState.currentLevel = 0;
  AppState.currentWordIndex = 0;

  AppState.allApprentissageLevels = splitIntoLevels(items);
  AppState.currentLevelWords = AppState.allApprentissageLevels[AppState.currentLevel];

  showApprentissageScreen();
}

function showApprentissageScreen() {
  showScreen('apprentissage');

  setCurrentItem(AppState.currentLevelWords[AppState.currentWordIndex]);
  const location = AppState.currentLocation;

  // Met à jour la progression
  const progress = document.getElementById('apprentissage-progress');
  if (progress) {
    progress.textContent = `Mot ${AppState.currentWordIndex + 1}/${AppState.currentLevelWords.length}`;
  }

  // Affiche uniquement le lieu et le bouton "J'y suis"
  displayLocation(location);
  document.getElementById('translation-prompt').classList.add('hidden');

  // Cache l'animation du mot, les contrôles et le bouton suivant
  document.getElementById('word-animation').classList.add('hidden');
  document.getElementById('playback-controls').classList.add('hidden');
  document.getElementById('next-button-container').classList.add('hidden');

  // Affiche le bouton "J'y suis"
  document.getElementById('ready-button-container').classList.remove('hidden');
}

async function showWordToTrace() {
  // Cache le bouton "J'y suis"
  document.getElementById('ready-button-container').classList.add('hidden');

  // Vide le container du mot pour éviter de voir l'ancien mot
  const animatedWord = document.getElementById('animated-word');
  if (animatedWord) {
    animatedWord.innerHTML = '';
  }

  // Affiche l'animation du mot et les contrôles
  document.getElementById('word-animation').classList.remove('hidden');
  document.getElementById('playback-controls').classList.remove('hidden');

  // Initialise l'audio (important pour iOS/Safari)
  await initAudio();

  // Scroll automatique vers l'animation du mot
  setTimeout(() => {
    const wordAnimation = document.getElementById('word-animation');
    if (wordAnimation) {
      wordAnimation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);

  // Lit le mot à voix haute PUIS lance l'animation avec les notes
  showTranslationPrompt('translation-prompt');
  console.log('Lecture du mot:', AppState.currentWord);
  speakCurrent(() => {
    // Callback appelé quand la lecture vocale est TERMINÉE
    console.log('Début de l\'animation avec les notes musicales');

    // Attend un petit délai supplémentaire pour laisser l'AudioContext se libérer
    setTimeout(() => {
      prepareWordAnimation(AppState.currentWord);
      startWordAnimation();
    }, 200);
  });
}

const LEVEL_NAMES = ['Facile', 'Moyen', 'Difficile', 'Expert', 'Maître'];

function levelName(level, maxLevel) {
  if (maxLevel !== undefined && level >= maxLevel) return 'Ninja';
  return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)];
}

// L'interrogation complète se joue toujours au niveau Ninja : l'enfant peut
// gagner le Ninja (et son compagnon) sans passer par tous les niveaux.
function isNinjaLevel() {
  return AppState.interrogationMode === 'complete' || AppState.listLevel >= AppState.listMaxLevel;
}

// Étoiles par bonne réponse : la base du mode + le niveau de la liste
function starsPerWord(mode, level) {
  const base = mode === 'complete'
    ? ECONOMIE.etoilesParBonneReponseComplet
    : ECONOMIE.etoilesParBonneReponse;
  return base + level;
}

function placeKeyOf(location) {
  return `${location.piece}|${location.emplacement}`;
}

// Endroits d'une pièce de la maison actuelle
function emplacementsDe(piece) {
  const room = Storage.getMaison().find(r => r.piece === piece);
  return room ? room.emplacements : [];
}

// Emoji d'une pièce : celui choisi dans « Ma maison », sinon par mot-clé dans son nom
function roomEmoji(piece) {
  const room = Storage.getMaison().find(r => r.piece === piece);
  if (room && room.emoji) return room.emoji;
  return roomEmojiAuto(piece);
}

function roomEmojiAuto(piece) {
  const name = piece.toLowerCase();
  const found = PIECE_EMOJIS.find(p => p.motCle !== 'defaut' && name.includes(p.motCle));
  return found ? found.emoji : PIECE_EMOJIS.find(p => p.motCle === 'defaut').emoji;
}

function getSticker(id) {
  return STICKERS.find(s => s.id === id) || null;
}

// Rendu d'un sticker : emoji, ou kawaii dessiné par le code
function stickerArt(sticker, size) {
  if (sticker.k) return Kawaii.draw({ ...Kawaii.DEFAULT_CONFIG, ...sticker.k }, size);
  return `<span class="sticker-emoji" style="font-size:${Math.round(size * 0.72)}px;width:${size}px;height:${size}px">${sticker.emoji}</span>`;
}

// ── Habits et accessoires de l'atelier (récompenses) ──
// id = "type:valeur", ex. "hat:couronne". Gratuits : personnages, expressions,
// couleur naturelle, option "rien" de chaque catégorie, couleurs de tenue.
function accessoryCatalog() {
  const K = Kawaii;
  const cat = [];
  K.FURS.filter(f => f.c).forEach(f => cat.push({ id: `fur:${f.id}`, type: 'fur', value: f.id, nom: `Pelage ${f.id}`, prix: ECONOMIE.prixAccessoires.fur }));
  K.GLASSES.filter(g => g.id !== 'aucune').forEach(g => cat.push({ id: `glasses:${g.id}`, type: 'glasses', value: g.id, nom: `Lunettes ${g.nom.toLowerCase()}`, prix: ECONOMIE.prixAccessoires.glasses }));
  K.HATS.filter(h => h.id !== 'aucun').forEach(h => cat.push({ id: `hat:${h.id}`, type: 'hat', value: h.id, nom: h.nom, prix: ECONOMIE.prixAccessoires.hat }));
  K.OUTFITS.filter(o => o.id !== 'aucune').forEach(o => cat.push({ id: `outfit:${o.id}`, type: 'outfit', value: o.id, nom: o.nom, prix: ECONOMIE.prixAccessoires.outfit }));
  return cat;
}

function getAccessory(id) {
  return accessoryCatalog().find(x => x.id === id) || null;
}

function isAccessoryFree(type, value) {
  return (type === 'fur' && value === 'nature') || (type === 'glasses' && value === 'aucune')
    || (type === 'hat' && value === 'aucun') || (type === 'outfit' && value === 'aucune');
}

// Dessin d'un accessoire porté par le kawaii principal (ou le chat)
function accessoryArt(acc, size) {
  const base = Storage.getTeam().main || Kawaii.DEFAULT_CONFIG;
  return Kawaii.draw({ ...base, [acc.type]: acc.value }, size);
}

function displayLocation(location, containerId = 'lieu-display') {
  const container = document.getElementById(containerId);
  if (!container || !location) return;

  const pieceDisplay = location.piece.replace(/_/g, ' ');
  const emplacementDisplay = location.emplacement.replace(/_/g, ' ');

  // Stickers collés à cet endroit : le palais s'embellit avec les mots appris
  const stickers = Storage.getPlacedStickers(placeKeyOf(location));
  const stickersHTML = stickers
    .map(s => `<span class="sticker-on-place" title="${s.nom}">${stickerArt(s, 56)}</span>`)
    .join('');

  container.innerHTML = `
    <div class="lieu-display">
      <div class="lieu-stickers">${stickersHTML}</div>
      <div class="lieu-room-emoji">${roomEmoji(location.piece)}</div>
      <div class="lieu-room">${capitalizeFirst(pieceDisplay)}</div>
      <div class="lieu-place">${emplacementDisplay}</div>
    </div>
  `;
}

// ───────────────────────────────────────────────────────────────
// ANIMATION RYTHMIQUE DU MOT
// ───────────────────────────────────────────────────────────────

function prepareWordAnimation(word) {
  const container = document.getElementById('animated-word');
  const letters = word.split('');

  let html = '';
  letters.forEach((letter, index) => {
    // Les espaces : invisible quand petit, ␣ quand agrandi
    const displayLetter = letter === ' ' ? ' ' : letter;
    const spaceClass = letter === ' ' ? ' letter-space' : '';
    html += `<span class="letter${spaceClass}" data-index="${index}" data-char="${letter}" data-original="${displayLetter}">${displayLetter}</span>`;
  });

  container.innerHTML = html;
  AppState.currentLetterIndex = 0;
}

function startWordAnimation() {
  if (AppState.isAnimating) return;

  AppState.isAnimating = true;
  AppState.currentLetterIndex = 0;

  const letters = document.querySelectorAll('#animated-word .letter');
  const totalLetters = letters.length;
  const intervalDuration = AppState.animationSpeed * 1000; // Conversion en millisecondes

  // Boucle d'animation
  let currentIndex = 0;

  function animateNextLetter() {
    // Active la lettre courante
    if (currentIndex < totalLetters) {
      const letterElement = letters[currentIndex];
      const char = letterElement.dataset.char;

      // Si c'est un espace, affiche le symbole ␣ quand il devient actif
      if (char === ' ') {
        letterElement.textContent = '␣';
      }

      letterElement.classList.add('active');

      // Joue la note correspondant au caractère
      playBeep(char);

      currentIndex++;

      // Planifie la prochaine lettre avec le même délai
      AppState.timerInterval = setTimeout(animateNextLetter, intervalDuration);
    } else {
      // Animation terminée
      AppState.isAnimating = false;

      // Affiche le bouton "Suivant"
      document.getElementById('next-button-container').classList.remove('hidden');

      // Scroll automatique vers le bouton "Suivant"
      setTimeout(() => {
        const nextButton = document.getElementById('next-button-container');
        if (nextButton) {
          nextButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300); // Petit délai pour que le bouton apparaisse d'abord
    }
  }

  // Lance l'animation
  animateNextLetter();
}

function stopWordAnimation() {
  if (AppState.timerInterval) {
    clearTimeout(AppState.timerInterval);
    AppState.timerInterval = null;
  }

  // Ne retire PAS les classes 'active' - les lettres restent grandes
  AppState.isAnimating = false;
}

function replayWord() {
  stopWordAnimation();
  document.getElementById('next-button-container').classList.add('hidden');

  // Réinitialise TOUTES les lettres à leur état initial
  const letters = document.querySelectorAll('#animated-word .letter');
  letters.forEach(letter => {
    letter.classList.remove('active');
    // Restaure le texte original (␣ pour les espaces)
    const originalText = letter.dataset.original;
    if (originalText) {
      letter.textContent = originalText;
    }
  });

  // Petit délai avant de relancer pour que l'animation soit visible
  setTimeout(() => {
    startWordAnimation();
  }, 200);
}

function updateSpeed(value) {
  AppState.animationSpeed = parseFloat(value);
  document.getElementById('speed-value').textContent = value;

  // Sauvegarde dans localStorage
  localStorage.setItem('animationSpeed', value);
  console.log('Vitesse animation sauvegardée:', value);

  // Si une animation est en cours, la redémarre avec la nouvelle vitesse
  if (AppState.isAnimating) {
    replayWord();
  }
}

function nextWordInApprentissage() {
  // Arrête l'animation si active
  stopWordAnimation();

  AppState.currentWordIndex++;

  // Vérifie si on a fini ce niveau
  if (AppState.currentWordIndex >= AppState.currentLevelWords.length) {
    finishApprentissageLevel();
  } else {
    showApprentissageScreen();
  }
}

function finishApprentissageLevel() {
  // Passe au niveau suivant ou termine
  const levels = AppState.allApprentissageLevels;

  if (AppState.currentLevel < levels.length - 1) {
    AppState.currentLevel++;
    AppState.currentWordIndex = 0;
    AppState.currentLevelWords = levels[AppState.currentLevel];

    showFeedback('Niveau terminé ! 🎉', 'success');
    setTimeout(() => showApprentissageScreen(), 2000);
  } else {
    // Sauvegarde les mots appris pour l'interrogation
    AppState.lastLearnedWords = levels.flat();

    // Propose de faire l'interrogation sur les mots vus
    showApprentissageComplete();
  }
}

function showApprentissageComplete() {
  // Étoiles pour avoir terminé la visite
  const earned = ECONOMIE.etoilesApprentissage;
  Storage.addStars(earned);
  playStarSound();

  showScreen('apprentissage-complete');

  const container = document.getElementById('apprentissage-complete-content');
  if (container) {
    const n = AppState.lastLearnedWords.length;
    container.innerHTML = `
      <div class="result-hero">
        <div class="result-icon">🎉</div>
        <h2>Bravo !</h2>
        <p class="result-sub">Tu as visité ${n} lieu${n > 1 ? 'x' : ''} du palais.</p>
        <div class="stars-earned">+${earned} ⭐</div>
      </div>

      <p class="intro">Veux-tu t'entraîner sur ces mots maintenant ?</p>
      <div class="result-actions">
        <button class="btn btn-primary btn-big" onclick="startInterrogationAfterLearning()">
          🎯 Oui, je m'entraîne !
        </button>
        <button class="btn btn-ghost" onclick="showScreen('home')">
          🏠 Non, retour à l'accueil
        </button>
      </div>
    `;
  }

  // Ouvre les coffres gagnés, s'il y en a
  setTimeout(() => openPendingChests(), 600);
}

// ───────────────────────────────────────────────────────────────
// MODE INTERROGATION - Retour au palais
// ───────────────────────────────────────────────────────────────

function startInterrogationProgressive(listId) {
  console.log('=== DÉMARRAGE INTERROGATION PROGRESSIVE ===');
  AppState.interrogationMode = 'progressive';
  AppState.errors = [];
  startInterrogationBase(listId);
}

function startInterrogationComplete(listId) {
  console.log('=== DÉMARRAGE INTERROGATION COMPLÈTE ===');
  AppState.interrogationMode = 'complete';
  AppState.errors = [];
  startInterrogationBase(listId);
}

function startInterrogationBase(listId, wordsSubset) {
  const list = wordListsByIds([listId])[0];

  if (!list) {
    console.error('Liste introuvable:', listId);
    return;
  }

  const words = wordsSubset || list.words;
  startInterrogationOnItems(words.map(word => ({ word, list })));
}

// Mix : tous les mots des listes choisies, mélangés entre eux
function startInterrogationOnLists(listIds, mode) {
  AppState.interrogationMode = mode;
  startInterrogationOnItems(sessionItems(wordListsByIds(listIds)));
}

function startInterrogationAfterLearning() {
  console.log('=== DÉMARRAGE INTERROGATION APRÈS APPRENTISSAGE ===');

  // Interrogation uniquement sur les mots qui viennent d'être appris
  if (AppState.lastLearnedWords.length === 0) {
    console.error('Pas de mots appris');
    showScreen('home');
    return;
  }

  // Interrogation en mode progressif après l'apprentissage
  AppState.interrogationMode = 'progressive';
  startInterrogationOnItems(AppState.lastLearnedWords);
}

// Lance une interrogation sur une suite de { word, list } (mélangée ici)
function startInterrogationOnItems(sessionWords) {
  if (sessionWords.length === 0) return;

  // Pour le bouton "Rejouer" de l'écran de résultats : mêmes mots, même mode
  const mode = AppState.interrogationMode;
  const replayItems = [...sessionWords];
  AppState.sessionReplay = () => {
    AppState.interrogationMode = mode;
    startInterrogationOnItems(replayItems);
  };

  console.log('Mode:', mode, '- Mots:', sessionWords.map(item => item.word));

  AppState.sessionLists = [...new Set(sessionWords.map(item => item.list))];
  AppState.sessionByList = {};
  AppState.errors = [];
  AppState.currentMode = 'interrogation';
  AppState.currentLevel = 0;
  AppState.currentWordIndex = 0;
  AppState.score = 0;
  AppState.totalQuestions = 0;
  AppState.sessionStars = 0;
  AppState.sessionCorrect = 0;
  AppState.sessionTotal = 0;
  updateSessionStarCounter(0);

  // Mots randomisés, puis découpés en niveaux
  AppState.allInterrogationLevels = splitIntoLevels(shuffleArray([...sessionWords]));
  console.log(`Niveaux créés: ${AppState.allInterrogationLevels.length} niveau(x)`);

  AppState.currentLevelWords = AppState.allInterrogationLevels[AppState.currentLevel];

  showInterrogationScreen();
}

// Fonction pour mélanger un tableau (algorithme Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showInterrogationScreen() {
  console.log('showInterrogationScreen appelé');
  console.log(`Index mot: ${AppState.currentWordIndex}, total: ${AppState.currentLevelWords.length}`);

  showScreen('interrogation');
  renderSessionProgress('session-progress', AppState.currentLevelWords.length, AppState.currentWordIndex);

  setCurrentItem(AppState.currentLevelWords[AppState.currentWordIndex]);
  const word = AppState.currentWord;
  const location = AppState.currentLocation;
  console.log(`Mot à afficher: "${word}"`, location);

  AppState.userInput = '';

  // Met à jour la progression (affiche le progrès dans le niveau actuel)
  const progress = document.getElementById('interrogation-progress');
  if (progress) {
    progress.textContent = `Mot ${AppState.currentWordIndex + 1}/${AppState.currentLevelWords.length}`;
  }

  // Calcule le pattern de difficulté selon le niveau
  createWordPattern(word);
  console.log(`Pattern créé: "${AppState.wordPattern}"`);

  displayLocation(location, 'interrogation-lieu-display');

  // Affiche uniquement le lieu et le bouton "J'y suis"
  document.getElementById('interrogation-ready-button').classList.remove('hidden');
  document.getElementById('interrogation-question-zone').classList.add('hidden');

  // Affiche l'indice de difficulté (pour préparer l'affichage)
  const difficultyHint = document.getElementById('difficulty-hint');
  if (difficultyHint) {
    const perWord = starsPerWord(AppState.interrogationMode, AppState.listLevel);
    const n = AppState.missingLettersCount;
    let what = `${n} lettre${n > 1 ? 's' : ''} à trouver`;
    if (isNinjaLevel()) what = 'tout le mot, avec des cases en trop';
    // Dans un mix, chaque mot est demandé au niveau de sa liste : on dit laquelle
    const from = isMixSession() ? `${AppState.currentList.name} · ` : '';
    const level = AppState.interrogationMode === 'complete'
      ? 'Ninja 🥷'
      : `Niveau ${AppState.listLevel + 1} (${levelName(AppState.listLevel, AppState.listMaxLevel)})`;
    difficultyHint.textContent = `${from}${level} · ${what} · ${perWord} ⭐ par mot`;
  }

  const title = document.getElementById('word-card-title');
  if (title) {
    title.textContent = Storage.isLangList(AppState.currentList)
      ? `Traduis en ${langInfo(AppState.currentList.langTo).nom}`
      : 'Complète le mot';
  }

  console.log('showInterrogationScreen terminé');
}

function showInterrogationQuestion() {
  // Cache le bouton "J'y suis"
  document.getElementById('interrogation-ready-button').classList.add('hidden');

  // Affiche la zone de question
  document.getElementById('interrogation-question-zone').classList.remove('hidden');

  // Réinitialise la saisie utilisateur
  AppState.userInput = '';
  AppState.isValidating = false;

  // Réactive les inputs (clavier et boutons)
  enableInterrogationInputs();

  // Réinitialise l'affichage et l'animation
  const display = document.getElementById('user-input-display');
  if (display) {
    display.classList.remove('success');
    display.innerHTML = '';
  }

  updateInputDisplay();
  showTranslationPrompt('interrogation-prompt');

  // Dicte le mot, ou le mot à traduire (si Web Speech API disponible)
  speakQuestion();

  // Réinitialise la barre de timer
  const timerBar = document.getElementById('interrogation-timer-fill');
  if (timerBar) {
    timerBar.style.width = '100%';
    timerBar.classList.remove('low');
  }

  // Temps accordé : une base + quelques secondes par lettre à trouver.
  // Réglable dans data/lieux.js (TEMPS). Le temps ne diminue jamais avec le niveau.
  const timerDuration = (TEMPS.baseSecondes + TEMPS.secondesParLettre * AppState.missingLettersCount) * 1000;

  // Lance le timer
  startInterrogationTimer(timerDuration);

  // Scroll automatique vers la zone de question pour voir le clavier et le mot
  setTimeout(() => {
    const questionZone = document.getElementById('interrogation-question-zone');
    if (questionZone) {
      questionZone.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100); // Petit délai pour que l'animation soit fluide
}

// Crée un pattern avec des lettres manquantes selon le niveau
function createWordPattern(word) {
  const wordLength = word.length;

  AppState.decoyCount = 0;

  // NIVEAU NINJA (et interrogation complète) : mot entier masqué + 1 ou 2
  // cases pièges, pour ne pas savoir combien de lettres il faut écrire
  if (isNinjaLevel()) {
    AppState.missingLettersStart = 0;
    AppState.missingLettersCount = wordLength;
    AppState.wordPattern = '_'.repeat(wordLength);
    AppState.decoyCount = 1 + Math.floor(Math.random() * 2);
    return;
  }

  // MODE PROGRESSIF : nombre de lettres manquantes selon le niveau
  // Niveau 0 : 2 lettres
  // Niveau 1 : 3 lettres
  // Niveau 2 : 4 lettres, etc.
  // Maximum : tout le mot
  let missingCount = Math.min(2 + AppState.listLevel, wordLength);

  // Pour les mots très courts, au moins 1 lettre manquante
  missingCount = Math.max(1, missingCount);

  // Position de départ aléatoire pour les lettres manquantes
  // Mais laisse au moins 1 lettre visible au début si possible
  const maxStart = Math.max(0, wordLength - missingCount);
  const startPos = Math.floor(Math.random() * (maxStart + 1));

  AppState.missingLettersStart = startPos;
  AppState.missingLettersCount = missingCount;

  // Construit le pattern (lettres visibles + _ pour lettres manquantes)
  let pattern = '';
  for (let i = 0; i < wordLength; i++) {
    if (i >= startPos && i < startPos + missingCount) {
      pattern += '_';
    } else {
      pattern += word[i];
    }
  }

  AppState.wordPattern = pattern;
}

// Redit le mot en cours (bouton Réécouter en interrogation)
function repeatWord() {
  if (!AppState.currentWord) return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  speakQuestion();
}

// Interrogation : le mot à écrire, ou pour une liste de langue le mot à
// traduire (dire la traduction donnerait la réponse)
function speakQuestion() {
  const list = AppState.currentList;
  const prompt = promptOf(list, AppState.currentWord);
  if (prompt) speakWord(prompt, null, langInfo(list.langFrom).voix);
  else speakWord(AppState.currentWord);
}

// Visite : le mot, ou le mot de départ puis sa traduction, chacun dans sa langue
function speakCurrent(onEnd) {
  const list = AppState.currentList;
  const word = AppState.currentWord;
  const prompt = promptOf(list, word);
  if (!prompt) {
    speakWord(word, onEnd);
    return;
  }
  speakWord(prompt, () => speakWord(word, onEnd, langInfo(list.langTo).voix), langInfo(list.langFrom).voix);
}

function speakWord(word, onEndCallback, lang = 'fr-FR') {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    utterance.rate = 0.8;
    utterance.volume = AppState.volume;

    // Appelle le callback quand la lecture est terminée
    if (onEndCallback) {
      utterance.onend = () => {
        console.log('Lecture vocale terminée');
        onEndCallback();
      };
    }

    console.log('Début lecture vocale:', word);
    window.speechSynthesis.speak(utterance);
  } else {
    // Si pas de synthèse vocale, appelle quand même le callback
    if (onEndCallback) {
      setTimeout(onEndCallback, 500);
    }
  }
}

function startInterrogationTimer(duration) {
  let remaining = duration;
  const timerBar = document.getElementById('interrogation-timer-fill');

  AppState.timerInterval = setInterval(() => {
    remaining -= 100;
    timerBar.style.width = `${(remaining / duration) * 100}%`;
    timerBar.classList.toggle('low', remaining / duration < 0.3);

    if (remaining <= 0) {
      clearInterval(AppState.timerInterval);
      validateAnswer();
    }
  }, 100);
}

function handleKeyPress(key) {
  if (key === 'EFFACER') {
    AppState.userInput = AppState.userInput.slice(0, -1);
    updateInputDisplay();
  } else if (key === 'VALIDER') {
    validateAnswer();
    // Ne pas appeler updateInputDisplay() ici car validateAnswer()
    // gère l'affichage (animateWordSuccess ou animateWordError)
  } else {
    // Limite la saisie au nombre de lettres manquantes
    if (AppState.userInput.length < AppState.missingLettersCount + AppState.decoyCount) {
      AppState.userInput += key;
    }
    updateInputDisplay();
  }
}

function updateInputDisplay() {
  const display = document.getElementById('user-input-display');
  if (!display) return;

  display.classList.remove('success');
  const pattern = AppState.wordPattern;
  const word = AppState.currentWord;
  let inputIndex = 0;
  let cursorPlaced = false;
  let html = '';

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '_') {
      if (inputIndex < AppState.userInput.length) {
        const ch = AppState.userInput[inputIndex];
        html += `<span class="tile typed">${ch === ' ' ? '␣' : ch}</span>`;
        inputIndex++;
      } else {
        const cursor = cursorPlaced ? '' : ' cursor';
        cursorPlaced = true;
        html += `<span class="tile missing${cursor}"></span>`;
      }
    } else if (word[i] === ' ') {
      html += '<span class="tile space"></span>';
    } else {
      html += `<span class="tile">${word[i]}</span>`;
    }
  }

  // Cases pièges (niveau Ninja) : identiques aux autres cases à remplir
  for (let d = 0; d < AppState.decoyCount; d++) {
    if (inputIndex < AppState.userInput.length) {
      const ch = AppState.userInput[inputIndex];
      html += `<span class="tile typed">${ch === ' ' ? '␣' : ch}</span>`;
      inputIndex++;
    } else {
      const cursor = cursorPlaced ? '' : ' cursor';
      cursorPlaced = true;
      html += `<span class="tile missing${cursor}"></span>`;
    }
  }

  display.innerHTML = html;
}

function animateWordSuccess() {
  const display = document.getElementById('user-input-display');
  if (!display) return;

  const word = AppState.currentWord;
  let html = '';
  for (let i = 0; i < word.length; i++) {
    html += word[i] === ' '
      ? '<span class="tile space"></span>'
      : `<span class="tile ok">${word[i]}</span>`;
  }
  display.innerHTML = html;
  display.classList.add('success');
}

function animateWordError(expectedLetters) {
  const display = document.getElementById('user-input-display');
  if (!display) return;

  const word = AppState.currentWord;
  const startPos = AppState.missingLettersStart;
  const count = AppState.missingLettersCount;
  let html = '';

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (ch === ' ' && !(i >= startPos && i < startPos + count)) {
      html += '<span class="tile space"></span>';
      continue;
    }

    const isInMissingRange = (i >= startPos && i < startPos + count);
    if (isInMissingRange) {
      const expectedIndex = i - startPos;
      const expectedChar = expectedLetters[expectedIndex];
      const userChar = AppState.userInput[expectedIndex] || '';
      const normalizedExpected = normalizeApostrophes(expectedChar.normalize('NFD').toLowerCase());
      const normalizedUser = normalizeApostrophes(userChar.normalize('NFD').toLowerCase());
      const isWrong = normalizedUser !== normalizedExpected;
      const shown = expectedChar === ' ' ? '␣' : expectedChar;
      html += `<span class="tile ${isWrong ? 'wrong' : 'ok'}">${shown}</span>`;
    } else {
      html += `<span class="tile">${ch}</span>`;
    }
  }

  // Lettres tapées en trop (cases pièges remplies) : en rouge
  const extra = AppState.userInput.slice(count);
  for (const ch of extra) {
    html += `<span class="tile wrong">${ch === ' ' ? '␣' : ch}</span>`;
  }

  display.innerHTML = html;
}

function validateAnswer() {
  console.log('validateAnswer appelé');

  // Empêche les validations multiples
  if (AppState.isValidating) {
    console.log('Validation déjà en cours, ignoré');
    return;
  }
  AppState.isValidating = true;
  console.log('isValidating = true');

  // Arrête le timer
  if (AppState.timerInterval) {
    clearInterval(AppState.timerInterval);
    AppState.timerInterval = null;
    console.log('Timer arrêté');
  }

  // Désactive le clavier et le bouton valider
  disableInterrogationInputs();

  AppState.totalQuestions++;
  AppState.sessionTotal++;
  console.log(`Question ${AppState.totalQuestions}, mot: ${AppState.currentWord}`);

  // Extrait les lettres manquantes du mot original
  const expectedLetters = AppState.currentWord
    .slice(AppState.missingLettersStart, AppState.missingLettersStart + AppState.missingLettersCount);

  console.log(`Lettres attendues: "${expectedLetters}", saisie: "${AppState.userInput}"`);

  // Compare avec la saisie utilisateur (insensible à la casse + normalise les apostrophes)
  const normalizedInput = normalizeApostrophes(AppState.userInput.toLowerCase());
  const normalizedExpected = normalizeApostrophes(expectedLetters.toLowerCase());
  const correct = normalizedInput === normalizedExpected;

  console.log(`Après normalisation: input="${normalizedInput}", expected="${normalizedExpected}", correct=${correct}`);

  // Réussite par liste : dans un mix, chaque liste passe son niveau sur ses propres mots
  const listId = AppState.currentList.id;
  const stat = AppState.sessionByList[listId] || (AppState.sessionByList[listId] = { correct: 0, total: 0 });
  stat.total++;
  if (correct) stat.correct++;

  if (correct) {
    AppState.score++;
    AppState.sessionCorrect++;
    awardStars(starsPerWord(AppState.interrogationMode, AppState.listLevel));
    Storage.updateProgress(AppState.currentList.id, AppState.currentWord, true);

    // Animation du mot complet trouvé
    animateWordSuccess();

    showFeedback('Bravo ! ✨', 'success');
    console.log('Réponse correcte !');
  } else {
    Storage.updateProgress(AppState.currentList.id, AppState.currentWord, false);

    // Enregistre l'erreur
    AppState.errors.push({
      word: AppState.currentWord,
      prompt: promptOf(AppState.currentList, AppState.currentWord),
      expected: expectedLetters,
      userInput: AppState.userInput,
      wordPattern: AppState.wordPattern
    });

    // Le mot affiche déjà les bonnes lettres, en rouge là où c'était faux :
    // pas de notification pour ne pas détourner le regard du mot
    animateWordError(expectedLetters);
    console.log('Réponse incorrecte');
  }

  updateScoreDisplay();

  console.log('setTimeout pour nextWordInInterrogation dans 3500ms');
  setTimeout(() => {
    console.log('Appel de nextWordInInterrogation');
    AppState.isValidating = false;
    nextWordInInterrogation();
  }, 3500);
}

function disableInterrogationInputs() {
  // Désactive toutes les touches du clavier
  const keys = document.querySelectorAll('#interrogation-question-zone .key');
  keys.forEach(key => {
    key.disabled = true;
  });

  // Ajoute un indicateur visuel sur le bouton Valider
  const validateBtn = document.querySelector('#interrogation-question-zone .validate-btn');
  if (validateBtn) {
    validateBtn.innerHTML = '⏳';
  }
}

function enableInterrogationInputs() {
  // Réactive toutes les touches du clavier
  const keys = document.querySelectorAll('#interrogation-question-zone .key');
  keys.forEach(key => {
    key.disabled = false;
  });

  // Restaure le texte du bouton Valider
  const validateBtn = document.querySelector('#interrogation-question-zone .validate-btn');
  if (validateBtn) {
    validateBtn.innerHTML = '✓<br>Valider';
  }
}

function nextWordInInterrogation() {
  console.log('nextWordInInterrogation appelé');
  console.log(`Index actuel: ${AppState.currentWordIndex}, total mots niveau: ${AppState.currentLevelWords.length}`);

  // Nettoie le feedback
  const feedbackContainer = document.getElementById('feedback-container');
  if (feedbackContainer) {
    feedbackContainer.innerHTML = '';
  }

  AppState.currentWordIndex++;
  console.log(`Nouvel index: ${AppState.currentWordIndex}`);

  if (AppState.currentWordIndex >= AppState.currentLevelWords.length) {
    console.log('Fin du niveau, appel finishInterrogationLevel');
    finishInterrogationLevel();
  } else {
    console.log('Mot suivant, appel showInterrogationScreen');
    showInterrogationScreen();
  }
}

function finishInterrogationLevel() {
  const total = AppState.totalQuestions;
  const perfect = total >= 5 && AppState.score === total;

  // Sans-faute : bonus d'étoiles + coffre rare garanti
  if (perfect) {
    // Dans un mix, le bonus suit la liste la moins avancée du paquet
    const level = Math.min(...AppState.currentLevelWords.map(item => Storage.getListLevel(item.list)));
    const bonus = ECONOMIE.bonusSansFaute + level;
    Storage.addStars(bonus);
    AppState.sessionStars += bonus;
    Storage.grantChest('rare');
    updateSessionStarCounter(bonus);
  }

  const hasNextLevel = AppState.currentLevel < AppState.allInterrogationLevels.length - 1;

  const continueSession = () => {
    if (hasNextLevel) {
      AppState.currentLevel++;
      AppState.currentWordIndex = 0;
      AppState.currentLevelWords = AppState.allInterrogationLevels[AppState.currentLevel];
      AppState.score = 0;
      AppState.totalQuestions = 0;
      showInterrogationScreen();
    } else {
      showResultsScreen();
    }
  };

  // Laisse le feedback du dernier mot se voir, puis ouvre les coffres, puis continue
  setTimeout(() => openPendingChests(continueSession), 800);
}

function showResultsScreen() {
  showScreen('results');

  const container = document.getElementById('results-content');
  if (!container) return;

  // Score de toute la session (tous les paquets de 10), pas seulement du dernier
  const scorePercent = AppState.sessionTotal > 0
    ? (AppState.sessionCorrect / AppState.sessionTotal) * 100
    : 0;
  const starsCount = Math.floor(scorePercent / 20); // 0-5 étoiles
  const freeStickers = Storage.getFreeStickers().reduce((sum, x) => sum + x.count, 0);

  // Passage de niveau : session réussie à 80 % ou plus. En mode progressif,
  // un niveau de plus ; en interrogation complète (jouée en Ninja), directement Ninja.
  // Le niveau ne redescend jamais. Dans un mix, chaque liste est jugée sur ses propres mots.
  let levelHTML = '';
  const complete = AppState.interrogationMode === 'complete';
  const mix = isMixSession();
  AppState.sessionLists.forEach(list => {
    const stat = AppState.sessionByList[list.id];
    if (!stat || stat.total === 0) return;

    const level = Storage.getListLevel(list);
    const maxLevel = Storage.getListMaxLevel(list);
    const accuracy = stat.correct / stat.total;
    const name = mix ? `${escapeText(list.name)} · ` : '';

    if (accuracy >= ECONOMIE.seuilPassageNiveau && level < maxLevel) {
      const next = complete ? maxLevel : level + 1;
      const slotsBefore = Storage.getCompanionSlots();
      Storage.setListLevel(list.id, next);
      list.level = next; // la session garde sa copie de la liste : "Rejouer" repart du nouveau niveau
      const ninja = next >= maxLevel;
      if (ninja && Storage.getCompanionSlots() > slotsBefore) {
        AppState.newCompanionUnlocked = true;
      }
      const sub = ninja
        ? 'Mot entier avec des cases en trop'
        : `${2 + next} lettres à trouver`;
      levelHTML += `
        <div class="level-up">
          <div class="level-up-icon">${ninja ? '🥷' : '🚀'}</div>
          <div class="level-up-title">${name}Niveau ${next + 1} atteint : ${levelName(next, maxLevel)} !</div>
          <div class="level-up-sub">${sub} · ${starsPerWord('progressive', next)} ⭐ par mot</div>
        </div>
      `;
    } else if (level >= maxLevel) {
      levelHTML += `<div class="level-up quiet">${name}🥷 Niveau maximum : ${levelName(level, maxLevel)}</div>`;
    } else {
      const needed = Math.ceil(ECONOMIE.seuilPassageNiveau * 100);
      const goal = complete ? 'devenir Ninja 🥷' : 'passer au suivant';
      levelHTML += `<div class="level-up quiet">${name}Niveau ${level + 1} (${levelName(level, maxLevel)}) · ${needed} % de réussite pour ${goal}</div>`;
    }
  });

  let html = `
    <div class="result-hero">
      <div class="result-icon">${scorePercent === 100 ? '🏆' : '👏'}</div>
      <h2>${scorePercent === 100 ? 'Parfait !' : 'Bien joué !'}</h2>
      <p class="result-score">${AppState.sessionCorrect} / ${AppState.sessionTotal}</p>
      <div class="result-stars">${'⭐'.repeat(starsCount)}${'☆'.repeat(5 - starsCount)}</div>
      ${AppState.sessionStars > 0 ? `<div class="stars-earned">+${AppState.sessionStars} ⭐ gagnées</div>` : ''}
    </div>
    ${levelHTML}
  `;

  if (AppState.errors.length > 0) {
    html += `
      <div class="error-card">
        <h3>À revoir (${AppState.errors.length})</h3>
    `;
    AppState.errors.forEach(error => {
      html += `
        <div class="error-item">
          <div class="error-word">${error.prompt ? `${escapeText(error.prompt)} → ` : ''}${escapeText(error.word)}</div>
          <div class="error-detail">Il fallait : <span class="error-expected">${error.expected}</span></div>
          <div class="error-detail">Tu as écrit : <span class="error-given">${error.userInput || '(rien)'}</span></div>
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
        <div class="level-up-icon">🐾</div>
        <div class="level-up-title">Nouveau compagnon débloqué !</div>
        <div class="level-up-sub">Va choisir ton kawaii de compagnie</div>
        <div class="team-actions"><button class="btn btn-secondary" onclick="showKawaiiScreen()">🎨 Choisir mon compagnon</button></div>
      </div>
    `;
  }

  html += '<div class="result-actions">';
  if (AppState.sessionReplay) {
    html += `
      <button class="btn btn-primary btn-big" onclick="replaySession()">
        🔁 Rejouer
      </button>
    `;
  }
  if (freeStickers > 0) {
    html += `
      <button class="btn btn-secondary" onclick="showPalaisScreen()">
        🏠 Coller mes ${freeStickers} sticker${freeStickers > 1 ? 's' : ''}
      </button>
    `;
  }
  html += '</div>';

  container.innerHTML = html;

  // Réinitialise les états
  AppState.lastLearnedWords = [];
  AppState.allInterrogationLevels = [];
  AppState.errors = [];
  AppState.sessionStars = 0;
}

function updateScoreDisplay() {
  const display = document.getElementById('score-display');
  display.textContent = `${AppState.score} / ${AppState.totalQuestions}`;

  updateProgressStars();
}

// Avancement de la session : une case par mot, remplie quand le mot est fait,
// entourée pour le mot en cours. Neutre : elle ne dit pas si c'était juste
// (les ⭐ sont réservées aux étoiles gagnées, à droite).
function renderSessionProgress(containerId, total, done) {
  const bar = document.getElementById(containerId);
  if (!bar) return;
  let html = '';
  for (let i = 0; i < total; i++) {
    html += `<span class="seg${i < done ? ' done' : (i === done ? ' current' : '')}"></span>`;
  }
  bar.innerHTML = html;
}

function updateProgressStars() {
  renderSessionProgress('session-progress', AppState.currentLevelWords.length, AppState.totalQuestions);

  // Feux d'artifice si sans-faute à la fin du niveau
  const total = AppState.currentLevelWords.length;
  if (AppState.totalQuestions === total && AppState.score === total && total >= 5) {
    triggerFireworks();
  }
}

// ───────────────────────────────────────────────────────────────
// ANIMATION FEUX D'ARTIFICE
// ───────────────────────────────────────────────────────────────

function triggerFireworks() {
  // Crée l'overlay pour les feux d'artifice
  const overlay = document.createElement('div');
  overlay.className = 'fireworks-overlay';
  overlay.id = 'fireworks-overlay';
  document.body.appendChild(overlay);

  // Message de célébration
  const message = document.createElement('div');
  message.className = 'celebration-message';
  message.innerHTML = '🎉<br>PARFAIT !<br>🎉';
  document.body.appendChild(message);

  // Couleurs des feux d'artifice
  const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF1493', '#9370DB', '#FFB6D9', '#A0E7E5'];

  // Crée plusieurs vagues de feux d'artifice
  for (let wave = 0; wave < 5; wave++) {
    setTimeout(() => {
      createFireworksBurst(overlay, colors);
    }, wave * 400);
  }

  // Nettoie après 3 secondes
  setTimeout(() => {
    overlay.remove();
    message.remove();
  }, 3000);
}

function createFireworksBurst(container, colors) {
  // Crée 8-12 feux d'artifice par vague
  const count = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      createSingleFirework(container, colors);
    }, i * 80);
  }
}

function createSingleFirework(container, colors) {
  const firework = document.createElement('div');
  firework.className = 'firework';

  // Position aléatoire
  const x = 20 + Math.random() * 60; // 20% à 80% de la largeur
  const y = 20 + Math.random() * 60; // 20% à 80% de la hauteur

  firework.style.left = x + '%';
  firework.style.top = y + '%';

  // Couleur aléatoire
  const color = colors[Math.floor(Math.random() * colors.length)];
  firework.style.background = color;
  firework.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;

  container.appendChild(firework);

  // Crée des particules supplémentaires
  createParticles(container, x, y, color);

  // Nettoie après l'animation
  setTimeout(() => {
    firework.remove();
  }, 1500);
}

function createParticles(container, x, y, color) {
  const particleCount = 12;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = '3px';
    particle.style.height = '3px';
    particle.style.borderRadius = '50%';
    particle.style.background = color;
    particle.style.left = x + '%';
    particle.style.top = y + '%';
    particle.style.boxShadow = `0 0 8px ${color}`;

    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 50 + Math.random() * 100;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;

    particle.style.animation = `particle-explode 1s ease-out forwards`;
    particle.style.setProperty('--tx', tx + 'px');
    particle.style.setProperty('--ty', ty + 'px');

    container.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 1000);
  }
}

// Animation CSS pour les particules (ajoutée dynamiquement)
if (!document.getElementById('particle-animation-style')) {
  const style = document.createElement('style');
  style.id = 'particle-animation-style';
  style.textContent = `
    @keyframes particle-explode {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(var(--tx), var(--ty)) scale(0);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// ───────────────────────────────────────────────────────────────
// ANIMATIONS & FEEDBACK
// ───────────────────────────────────────────────────────────────

function showFeedback(message, type) {
  // Toast fixe en haut de l'écran : visible sans scroller, quel que soit l'écran
  const existing = document.getElementById('feedback-toast');
  if (existing) existing.remove();

  const feedback = document.createElement('div');
  feedback.id = 'feedback-toast';
  feedback.className = `feedback-message ${type}`;
  feedback.textContent = message;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.classList.add('leaving');
    setTimeout(() => feedback.remove(), 250);
  }, 1800);
}

// ───────────────────────────────────────────────────────────────
// GESTION DES LISTES
// ───────────────────────────────────────────────────────────────

function showListsScreen() {
  showScreen('lists');
  refreshListsDisplay();
}

function refreshListsDisplay() {
  const container = document.getElementById('lists-container');
  const lists = Storage.getLists();

  if (lists.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        Aucune liste pour le moment.
      </div>
      <div class="result-actions">
        <button class="btn btn-primary btn-big" onclick="showNewListScreen()">➕ Créer ma première liste</button>
      </div>
    `;
    return;
  }

  // Sections toujours visibles : mots à réécrire, mots de langue, cartes questions
  const spellLists = lists.filter(l => !Storage.isCardList(l) && !Storage.isLangList(l));
  const langLists = lists.filter(l => Storage.isLangList(l));
  const cardLists = lists.filter(l => Storage.isCardList(l));
  const titled = [spellLists, langLists, cardLists].filter(g => g.length > 0).length > 1;

  let html = '';
  if (spellLists.length + langLists.length >= 2) {
    html += `
      <div class="mix-entry">
        <button class="btn btn-secondary" onclick="showMixScreen()">🔀 Mélanger plusieurs listes</button>
      </div>
    `;
  }
  if (titled && spellLists.length) html += '<h2 class="lists-section">✏️ Mots à réécrire</h2>';
  spellLists.forEach(list => { html += wordListHTML(list); });
  if (titled && langLists.length) html += '<h2 class="lists-section">🌍 Mots de langue</h2>';
  langLists.forEach(list => { html += wordListHTML(list); });
  if (titled && cardLists.length) html += '<h2 class="lists-section">🃏 Cartes questions</h2>';
  cardLists.forEach(list => { html += cardListHTML(list); });

  container.innerHTML = html;
}

// « 🇫🇷 → 🇬🇧 » pour une liste de langue, rien sinon
function langDirection(list) {
  if (!Storage.isLangList(list)) return '';
  return `${langInfo(list.langFrom).drapeau} → ${langInfo(list.langTo).drapeau} · `;
}

// Carte d'une liste de mots ou de langue (mêmes niveaux, mêmes modes)
function wordListHTML(list) {
  const wordCount = list.words.length;
  const masteredCount = list.words.filter(w => {
    const p = list.progress[w];
    return p && p.lastScore >= 0.8;
  }).length;
  const gold = isListGold(list);
  const pct = wordCount ? Math.round((masteredCount / wordCount) * 100) : 0;
  const level = Storage.getListLevel(list);
  const maxLevel = Storage.getListMaxLevel(list);

  return `
    <div class="card">
      <div class="list-card-head">
        <h3>${gold ? '🏅 ' : ''}${escapeText(list.name)}</h3>
        <div style="display:flex; gap:6px;">
          <button class="btn-icon" onclick="showEditListScreen(${list.id})" title="Éditer" aria-label="Éditer">✏️</button>
          <button class="btn-icon" onclick="confirmDeleteList(${list.id})" title="Supprimer" aria-label="Supprimer">🗑️</button>
        </div>
      </div>
      <p class="list-meta">${langDirection(list)}${wordCount} mot${wordCount > 1 ? 's' : ''} · ${masteredCount} maîtrisé${masteredCount > 1 ? 's' : ''}${gold ? ' · Liste dorée !' : ''}</p>
      <div class="list-level">
        <span class="level-badge">Niveau ${level + 1} · ${levelName(level, maxLevel)}${level >= maxLevel ? ' 🥷' : ''}</span>
        <span class="level-stars">${starsPerWord('progressive', level)} ⭐ par mot</span>
      </div>
      <div class="list-mastery"><div class="list-mastery-fill" style="width:${pct}%"></div></div>
      <div class="list-actions">
        <button class="btn btn-primary" onclick="startApprentissage(${list.id})">📖 Apprendre</button>
        <button class="btn btn-secondary" onclick="startInterrogationProgressive(${list.id})">🎯 S'entraîner</button>
        <button class="btn btn-ghost" onclick="startInterrogationComplete(${list.id})">🏆 Interrogation complète 🥷</button>
      </div>
    </div>
  `;
}

// ── Mix : une session sur plusieurs listes de mots ──

function showMixScreen() {
  showScreen('mix');
  renderMix();
}

function renderMix() {
  const container = document.getElementById('mix-content');
  if (!container) return;

  const lists = Storage.getLists().filter(l => !Storage.isCardList(l));
  const selected = Storage.getMixSelection().filter(id => lists.some(l => l.id === id));
  const chosen = lists.filter(l => selected.includes(l.id));
  const wordCount = chosen.reduce((sum, l) => sum + l.words.length, 0);
  const ready = chosen.length >= 2;
  const allChecked = chosen.length === lists.length;

  let html = '<p class="intro">Coche les listes à mélanger. Chaque mot garde son lieu et le niveau de sa liste.</p>';

  lists.forEach(list => {
    const on = selected.includes(list.id);
    const n = list.words.length;
    const level = Storage.getListLevel(list);
    const maxLevel = Storage.getListMaxLevel(list);
    html += `
      <button class="mix-row${on ? ' selected' : ''}" onclick="toggleMixList(${list.id})" aria-pressed="${on}">
        <span class="mix-check">${on ? '✅' : '⬜'}</span>
        <span class="mix-info">
          <strong>${escapeText(list.name)}</strong>
          <span>${langDirection(list)}${n} mot${n > 1 ? 's' : ''} · Niveau ${level + 1} · ${levelName(level, maxLevel)}${level >= maxLevel ? ' 🥷' : ''}</span>
        </span>
      </button>
    `;
  });

  const packets = Math.ceil(wordCount / 10);
  const summary = ready
    ? `${chosen.length} listes · ${wordCount} mots · ${packets} paquet${packets > 1 ? 's' : ''} de 10`
    : 'Coche au moins 2 listes';
  const disabled = ready ? '' : ' disabled';

  html += `
    <div class="text-center">
      <button class="btn btn-ghost" onclick="toggleMixAll()">${allChecked ? '⬜ Tout décocher' : '✅ Tout cocher'}</button>
    </div>
    <div class="card mix-start">
      <p class="mix-summary">${summary}</p>
      <div class="list-actions">
        <button class="btn btn-primary"${disabled} onclick="startMix('apprendre')">📖 Apprendre</button>
        <button class="btn btn-secondary"${disabled} onclick="startMix('progressive')">🎯 S'entraîner</button>
        <button class="btn btn-ghost"${disabled} onclick="startMix('complete')">🏆 Interrogation complète 🥷</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function toggleMixList(listId) {
  const selected = Storage.getMixSelection();
  const index = selected.indexOf(listId);
  if (index === -1) selected.push(listId);
  else selected.splice(index, 1);
  Storage.saveMixSelection(selected);
  renderMix();
}

function toggleMixAll() {
  const ids = Storage.getLists().filter(l => !Storage.isCardList(l)).map(l => l.id);
  const allChecked = ids.every(id => Storage.getMixSelection().includes(id));
  Storage.saveMixSelection(allChecked ? [] : ids);
  renderMix();
}

function startMix(mode) {
  const listIds = wordListsByIds(Storage.getMixSelection()).map(l => l.id);
  if (listIds.length < 2) return;

  if (mode === 'apprendre') startApprentissageOnLists(listIds);
  else startInterrogationOnLists(listIds, mode);
}

function cardListHTML(list) {
  const cards = list.cards || [];
  const count = (box) => cards.filter(c => c.box === box).length;
  const known = count(3);
  const pct = cards.length ? Math.round((known / cards.length) * 100) : 0;

  return `
    <div class="card">
      <div class="list-card-head">
        <h3>${isListGold(list) ? '🏅 ' : ''}${escapeText(list.name)}</h3>
        <div style="display:flex; gap:6px;">
          <button class="btn-icon" onclick="showEditListScreen(${list.id})" title="Éditer" aria-label="Éditer">✏️</button>
          <button class="btn-icon" onclick="confirmDeleteList(${list.id})" title="Supprimer" aria-label="Supprimer">🗑️</button>
        </div>
      </div>
      <p class="list-meta">${cards.length} carte${cards.length > 1 ? 's' : ''} · ${known} connue${known > 1 ? 's' : ''}</p>
      <div class="list-level">
        <span class="level-badge">${list.ninja ? 'Ninja 🥷' : 'Toutes les cartes connues = Ninja 🥷'}</span>
        <span class="level-stars">${CARTES.etoilesSession} ⭐ par session</span>
      </div>
      <div class="card-boxes">
        <span class="card-box">🆕 ${count(0)} nouvelle${count(0) > 1 ? 's' : ''}</span>
        <span class="card-box box-1">🔁 ${count(1)} à revoir</span>
        <span class="card-box box-2">🙂 ${count(2)} ça vient</span>
        <span class="card-box box-3">✅ ${known} connue${known > 1 ? 's' : ''}</span>
      </div>
      <div class="list-mastery"><div class="list-mastery-fill" style="width:${pct}%"></div></div>
      <div class="list-actions">
        <button class="btn btn-primary" onclick="startCartes(${list.id})">🃏 Jouer aux cartes</button>
      </div>
    </div>
  `;
}

function showNewListScreen() {
  showScreen('new-list');
  setNewListType(AppState.newListType || 'mots');
}

// Type de la liste en cours de création : 'mots', 'langue' ou 'cartes-questions'
function setNewListType(type) {
  AppState.newListType = type;
  const cartes = type === 'cartes-questions';
  const langue = type === 'langue';
  document.getElementById('type-btn-mots').classList.toggle('selected', !cartes && !langue);
  document.getElementById('type-btn-langue').classList.toggle('selected', langue);
  document.getElementById('type-btn-cartes').classList.toggle('selected', cartes);
  document.getElementById('new-list-mots').classList.toggle('hidden', cartes || langue);
  document.getElementById('new-list-langue').classList.toggle('hidden', !langue);
  document.getElementById('new-list-cartes').classList.toggle('hidden', !cartes);
  document.getElementById('scan-card').classList.toggle('hidden', cartes || langue);
  if (langue && !document.getElementById('new-lang-from').options.length) fillLangSelects('new-', 'fr', 'en');
}

// ── Listes de langue : choix des langues et saisie « mot = traduction » ──
// prefix = 'new-' (création) ou 'edit-' (édition)

function fillLangSelects(prefix, from, to) {
  const options = (selected) => Object.entries(LANGUES)
    .map(([code, l]) => `<option value="${code}"${code === selected ? ' selected' : ''}>${l.drapeau} ${capitalizeFirst(l.nom)}</option>`)
    .join('');
  document.getElementById(`${prefix}lang-from`).innerHTML = options(from);
  document.getElementById(`${prefix}lang-to`).innerHTML = options(to);
  renderLangLabel(prefix);
}

function renderLangLabel(prefix) {
  const from = langInfo(document.getElementById(`${prefix}lang-from`).value);
  const to = langInfo(document.getElementById(`${prefix}lang-to`).value);
  document.getElementById(`${prefix}lang-label`).textContent =
    `Une ligne par mot : ${from.drapeau} mot en ${from.nom} = ${to.drapeau} mot en ${to.nom}`;
}

// Inverse les langues et les deux côtés de chaque ligne déjà saisie
function swapLangs(prefix) {
  const fromSel = document.getElementById(`${prefix}lang-from`);
  const toSel = document.getElementById(`${prefix}lang-to`);
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
  const input = document.getElementById(`${prefix}lang-input`);
  input.value = input.value.split('\n').map(line => {
    const sep = line.includes('|') ? '|' : '=';
    const parts = line.split(sep);
    return parts.length === 2 ? `${parts[1].trim()} ${sep} ${parts[0].trim()}` : line;
  }).join('\n');
  renderLangLabel(prefix);
}

// Lit la saisie d'une liste de langue. null si quelque chose est à corriger.
function readLangInput(prefix) {
  const langFrom = document.getElementById(`${prefix}lang-from`).value;
  const langTo = document.getElementById(`${prefix}lang-to`).value;
  const parsed = parseCards(document.getElementById(`${prefix}lang-input`).value);
  if (langFrom === langTo) parsed.errors.unshift('Choisis deux langues différentes');
  // La traduction est la clé du mot (lieu, progression) : pas de doublon
  const seen = new Set();
  parsed.pairs.forEach(p => {
    if (seen.has(p.a)) parsed.errors.push(`« ${p.a} » est écrit deux fois comme traduction`);
    seen.add(p.a);
  });
  if (!checkCards(parsed, `${prefix}lang-errors`)) return null;
  return { langFrom, langTo, pairs: parsed.pairs };
}

function createLangListFromInput() {
  const name = document.getElementById('list-name-input').value.trim();
  if (!name) {
    alert('Il faut un nom pour la liste');
    return;
  }
  const input = readLangInput('new-');
  if (!input) return;

  Storage.addLangList(name, input.langFrom, input.langTo, input.pairs);
  document.getElementById('list-name-input').value = '';
  document.getElementById('new-lang-input').value = '';
  showFeedback(`Liste créée : ${input.pairs.length} mots ! 🎉`, 'success');
  setTimeout(() => showListsScreen(), 1500);
}

// Lit la saisie des cartes : une carte par ligne, « question = réponse ».
// Avec un « | » dans la ligne, c'est lui qui sépare (le = peut alors servir
// dans le texte : « 2 + 2 = ? | 4 »). Retourne { pairs, errors }.
function parseCards(text) {
  const pairs = [];
  const errors = [];
  text.split('\n').forEach((raw, i) => {
    const line = normalizeApostrophes(raw.trim());
    if (!line) return;
    const sep = line.includes('|') ? '|' : '=';
    const parts = line.split(sep);
    const q = (parts[0] || '').trim().replace(/\s+/g, ' ');
    const a = parts.slice(1).join(sep).trim().replace(/\s+/g, ' ');
    if (parts.length < 2) errors.push(`Ligne ${i + 1} : il manque le « = » entre la question et la réponse`);
    else if (parts.length > 2) errors.push(`Ligne ${i + 1} : plusieurs « ${sep} ». Sépare la question et la réponse par un seul « | »`);
    else if (!q || !a) errors.push(`Ligne ${i + 1} : question ou réponse vide`);
    else pairs.push({ q, a });
  });
  return { pairs, errors };
}

// Affiche les lignes à corriger sous la zone de saisie. true = tout est bon.
function checkCards(parsed, errorsId) {
  const box = document.getElementById(errorsId);
  const errors = parsed.errors.length > 0 ? parsed.errors
    : (parsed.pairs.length === 0 ? ['Aucune carte détectée'] : []);
  box.innerHTML = errors.map(e => `<div>⚠️ ${escapeText(e)}</div>`).join('');
  box.classList.toggle('hidden', errors.length === 0);
  if (errors.length > 0) showFeedback('Des lignes sont à corriger', 'error');
  return errors.length === 0;
}

// Consigne à coller dans une IA pour fabriquer une liste de cartes
function copyCardsPrompt() {
  const prompt = `Crée 30 questions-réponses pour un enfant de primaire sur le thème : [THÈME].
Format strict : une par ligne, « question = réponse », sans numéro, sans puce, sans ligne vide.
Réponses très courtes (quelques mots). Jamais de « = » dans la question ni dans la réponse
(si c'est indispensable, sépare alors la question et la réponse par « | » à la place).`;
  const done = () => showFeedback('Consigne copiée ! Colle-la dans ton IA 📋', 'success');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(prompt).then(done).catch(() => window.prompt('Copie cette consigne :', prompt));
  } else {
    window.prompt('Copie cette consigne :', prompt);
  }
}

function createCardListFromInput() {
  const name = document.getElementById('list-name-input').value.trim();
  if (!name) {
    alert('Il faut un nom pour la liste');
    return;
  }
  const parsed = parseCards(document.getElementById('cards-input').value);
  if (!checkCards(parsed, 'cards-errors')) return;

  Storage.addCardList(name, parsed.pairs);
  document.getElementById('list-name-input').value = '';
  document.getElementById('cards-input').value = '';
  showFeedback(`Liste créée : ${parsed.pairs.length} cartes ! 🎉`, 'success');
  setTimeout(() => showListsScreen(), 1500);
}

function createListFromManualInput() {
  if (AppState.newListType === 'cartes-questions') {
    createCardListFromInput();
    return;
  }
  if (AppState.newListType === 'langue') {
    createLangListFromInput();
    return;
  }

  const name = document.getElementById('list-name-input').value.trim();
  const wordsText = document.getElementById('words-input').value.trim();

  if (!name || !wordsText) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  // Normalise les apostrophes pour avoir un format standard
  const words = wordsText.split(/[\n,]+/)
    .map(w => normalizeApostrophes(w.trim()))
    .filter(w => w);

  if (words.length === 0) {
    alert('Aucun mot valide détecté');
    return;
  }

  Storage.addList(name, words);
  console.log('Liste créée avec apostrophes normalisées:', words);
  showFeedback('Liste créée ! 🎉', 'success');
  setTimeout(() => showListsScreen(), 1500);
}

function showEditListScreen(listId) {
  const lists = Storage.getLists();
  const list = lists.find(l => l.id === listId);

  if (!list) {
    alert('Liste introuvable');
    return;
  }

  AppState.editingListId = listId;

  document.getElementById('edit-list-name-input').value = list.name;

  const cartes = Storage.isCardList(list);
  const langue = Storage.isLangList(list);
  document.getElementById('edit-list-mots').classList.toggle('hidden', cartes || langue);
  document.getElementById('edit-list-langue').classList.toggle('hidden', !langue);
  document.getElementById('edit-list-cartes').classList.toggle('hidden', !cartes);
  document.getElementById('edit-cards-errors').classList.add('hidden');
  document.getElementById('edit-lang-errors').classList.add('hidden');
  if (langue) {
    fillLangSelects('edit-', list.langFrom, list.langTo);
    document.getElementById('edit-lang-input').value = list.words
      .map(w => {
        const q = promptOf(list, w) || '';
        return (q + w).includes('=') ? `${q} | ${w}` : `${q} = ${w}`;
      })
      .join('\n');
  } else if (cartes) {
    // Le « | » sert de séparateur dès qu'un = traîne dans le texte
    document.getElementById('edit-cards-input').value = (list.cards || [])
      .map(c => (c.q + c.a).includes('=') ? `${c.q} | ${c.a}` : `${c.q} = ${c.a}`)
      .join('\n');
  } else {
    document.getElementById('edit-words-input').value = list.words.join('\n');
  }

  showScreen('edit-list');
}

function saveEditedCardList(listId) {
  const name = document.getElementById('edit-list-name-input').value.trim();
  if (!name) {
    alert('Il faut un nom pour la liste');
    return;
  }
  const parsed = parseCards(document.getElementById('edit-cards-input').value);
  if (!checkCards(parsed, 'edit-cards-errors')) return;

  Storage.updateCardList(listId, name, parsed.pairs);
  showFeedback('Liste modifiée ! ✅', 'success');
  AppState.editingListId = null;
  setTimeout(() => showListsScreen(), 1500);
}

function saveEditedLangList(listId) {
  const name = document.getElementById('edit-list-name-input').value.trim();
  if (!name) {
    alert('Il faut un nom pour la liste');
    return;
  }
  const input = readLangInput('edit-');
  if (!input) return;

  Storage.updateLangList(listId, name, input.langFrom, input.langTo, input.pairs);
  showFeedback('Liste modifiée ! ✅', 'success');
  AppState.editingListId = null;
  setTimeout(() => showListsScreen(), 1500);
}

function saveEditedList() {
  const listId = AppState.editingListId;
  if (!listId) {
    alert('Erreur : aucune liste en cours d\'édition');
    return;
  }

  const edited = Storage.getLists().find(l => l.id === listId);
  if (edited && Storage.isCardList(edited)) {
    saveEditedCardList(listId);
    return;
  }
  if (edited && Storage.isLangList(edited)) {
    saveEditedLangList(listId);
    return;
  }

  const name = document.getElementById('edit-list-name-input').value.trim();
  const wordsText = document.getElementById('edit-words-input').value.trim();

  if (!name || !wordsText) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  // Normalise les apostrophes pour avoir un format standard
  const words = wordsText.split(/[\n,]+/)
    .map(w => normalizeApostrophes(w.trim()))
    .filter(w => w);

  if (words.length === 0) {
    alert('Aucun mot valide détecté');
    return;
  }

  Storage.updateList(listId, name, words);
  console.log('Liste modifiée avec apostrophes normalisées:', words);
  showFeedback('Liste modifiée ! ✅', 'success');
  AppState.editingListId = null;
  setTimeout(() => showListsScreen(), 1500);
}

function cancelEditList() {
  AppState.editingListId = null;
  showListsScreen();
}

function confirmDeleteList(listId) {
  const id = listId || AppState.editingListId;
  if (!id) return;

  if (confirm('Supprimer définitivement cette liste ?')) {
    const success = Storage.deleteList(id);
    if (success) {
      AppState.editingListId = null;
      showFeedback('Liste supprimée', 'success');
      setTimeout(() => showListsScreen(), 1000);
    } else {
      alert('Erreur lors de la suppression');
    }
  }
}

// ───────────────────────────────────────────────────────────────
// UTILITAIRES
// ───────────────────────────────────────────────────────────────

// Normalise les apostrophes pour gérer les différents types (iOS, Windows, macOS)
function normalizeApostrophes(str) {
  if (!str) return str;

  // Remplace toutes les variantes d'apostrophes par l'apostrophe standard (U+0027)
  return str
    .replace(/\u2019/g, "'")  // Apostrophe courbe droite (U+2019) iOS → standard
    .replace(/\u2018/g, "'")  // Apostrophe courbe gauche (U+2018) → standard
    .replace(/`/g, "'")       // Accent grave (U+0060) → standard
    .replace(/´/g, "'")        // Accent aigu (U+00B4) → standard
    .replace(/\u2032/g, "'")  // Prime (U+2032) → standard
    .replace(/\u02BC/g, "'"); // Modifier letter apostrophe (U+02BC) → standard
}

// Toggle son activé/désactivé
function toggleSound() {
  AppState.soundEnabled = !AppState.soundEnabled;

  // Sauvegarde dans localStorage
  localStorage.setItem('soundEnabled', AppState.soundEnabled);

  // Met à jour le bouton
  updateSoundButton();

  console.log('Son:', AppState.soundEnabled ? 'activé' : 'désactivé');
}

// Met à jour l'affichage du bouton son
function updateSoundButton() {
  document.querySelectorAll('.btn-toggle-sound').forEach(btn => {
    if (AppState.soundEnabled) {
      btn.textContent = '🔊';
      btn.title = 'Son activé';
      btn.classList.remove('muted');
    } else {
      btn.textContent = '🔇';
      btn.title = 'Son coupé';
      btn.classList.add('muted');
    }
  });
}

// Volume des sons (notes des lettres, étoiles, coffres, voix)
function updateVolume(value) {
  AppState.volume = Math.max(0, Math.min(1, parseFloat(value) / 100));
  localStorage.setItem('soundVolume', String(Math.round(AppState.volume * 100)));
  document.querySelectorAll('.volume-slider').forEach(s => { s.value = Math.round(AppState.volume * 100); });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ───────────────────────────────────────────────────────────────
// INITIALISATION
// ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Migration depuis l'ancien système de récompenses (avant les étoiles) :
  // chaque ancienne récompense débloquée vaut 5 étoiles.
  const oldRewards = localStorage.getItem('unlockedRewards');
  if (oldRewards && !localStorage.getItem('economy')) {
    try {
      const count = JSON.parse(oldRewards).length;
      if (count > 0) Storage.addStars(count * 5);
    } catch (e) {
    }
    ['unlockedRewards', 'equippedItems', 'itemPositions'].forEach(k => localStorage.removeItem(k));
  }

  // Mémorise la maison telle qu'elle est, pour qu'elle survive à un
  // changement de la maison de départ (data/lieux.js), puis vérifie que
  // chaque mot a bien un endroit.
  if (!localStorage.getItem('maison')) Storage.saveMaison(Storage.maisonParDefaut());
  Storage.reparerEmplacements();

  // Charge la préférence son depuis localStorage
  const savedSound = localStorage.getItem('soundEnabled');
  if (savedSound !== null) {
    AppState.soundEnabled = savedSound === 'true';
  }
  updateSoundButton();

  // Charge le volume depuis localStorage
  const savedVolume = localStorage.getItem('soundVolume');
  if (savedVolume !== null) updateVolume(savedVolume);

  // Charge la vitesse d'animation depuis localStorage
  const savedSpeed = localStorage.getItem('animationSpeed');
  if (savedSpeed !== null) {
    AppState.animationSpeed = parseFloat(savedSpeed);
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    if (speedSlider) speedSlider.value = savedSpeed;
    if (speedValue) speedValue.textContent = savedSpeed;
    console.log('Vitesse animation chargée:', savedSpeed);
  }

  // Écran d'accueil par défaut
  showScreen('home');

  // Compte en ligne (js/sync.js) : envoie les données, récupère celles des autres appareils
  Sync.onChange = () => {
    renderSyncStatus();
    renderAccountCard();
  };
  Sync.onRemoteData = () => {
    const calm = AppState.currentScreen === 'parents' ||
      (AppState.currentScreen === 'home' && !document.getElementById('sheet-overlay'));
    if (calm) window.location.reload();
    else AppState.reloadOnHome = true;
  };
  Sync.start();

  // Active l'audio au premier tap/click (requis par iOS/Safari)
  const initAudioOnFirstInteraction = () => {
    console.log('Initialisation audio suite à interaction utilisateur');
    initAudio();

    // Joue un son silencieux pour "débloquer" l'audio sur iOS
    if (AppState.audioContext) {
      const oscillator = AppState.audioContext.createOscillator();
      const gainNode = AppState.audioContext.createGain();
      gainNode.gain.value = 0.001; // Volume très faible
      oscillator.connect(gainNode);
      gainNode.connect(AppState.audioContext.destination);
      oscillator.start(AppState.audioContext.currentTime);
      oscillator.stop(AppState.audioContext.currentTime + 0.01);
      console.log('Audio débloqué');
    }
  };

  document.body.addEventListener('touchstart', initAudioOnFirstInteraction, { once: true });
  document.body.addEventListener('click', initAudioOnFirstInteraction, { once: true });

  // ───────────────────────────────────────────────────────────────
  // SERVICE WORKER - Mode offline
  // ───────────────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    // Quand un nouveau service worker prend le contrôle (nouvelle version installée),
    // recharge la page une fois pour utiliser les fichiers à jour.
    // Pas de rechargement au tout premier chargement (aucun contrôleur avant).
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('✅ Service Worker enregistré, scope:', registration.scope);
        console.log('🔌 L\'app fonctionne maintenant OFFLINE !');

        // Vérifie les mises à jour toutes les heures
        setInterval(() => {
          registration.update();
        }, 3600000);

        // Écoute les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Nouvelle version disponible !');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ Nouvelle version prête. Rechargez pour l\'activer.');
              // Optionnel : afficher un message à l'utilisateur
            }
          });
        });
      })
      .catch((error) => {
        console.log('❌ Erreur Service Worker:', error);
      });
  } else {
    console.log('⚠️ Service Worker non supporté par ce navigateur');
  }
});

// ───────────────────────────────────────────────────────────────
// ÉTOILES : compteur de session, sons
// ───────────────────────────────────────────────────────────────

// Relance la même session d'interrogation (même liste, même mode, mêmes mots)
function replaySession() {
  if (AppState.sessionReplay) AppState.sessionReplay();
}

function awardStars(n) {
  Storage.addStars(n);
  AppState.sessionStars += n;
  updateSessionStarCounter(n);
  playStarSound();
}

function updateSessionStarCounter(delta) {
  const value = document.getElementById('session-stars');
  const counter = document.getElementById('session-star-counter');
  if (value) value.textContent = AppState.sessionStars;
  if (!counter) return;

  counter.classList.remove('bump');
  void counter.offsetWidth;
  counter.classList.add('bump');

  if (delta > 0) {
    const float = document.createElement('span');
    float.className = 'star-float';
    float.textContent = `+${delta}`;
    counter.appendChild(float);
    setTimeout(() => float.remove(), 900);
  }
}

// Joue une note courte (utilitaire pour les sons de récompense)
function playTone(frequency, startDelay, duration, volume = 0.18) {
  if (!AppState.soundEnabled || !AppState.audioContext) return;
  try {
    const ctx = AppState.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    const t = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume * AppState.volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch (e) {
  }
}

function playStarSound() {
  playTone(659.25, 0, 0.18);     // Mi5
  playTone(1046.50, 0.1, 0.25);  // Do6
}

function playChestSound() {
  playTone(523.25, 0, 0.2);      // Do5
  playTone(659.25, 0.12, 0.2);   // Mi5
  playTone(783.99, 0.24, 0.2);   // Sol5
  playTone(1046.50, 0.36, 0.5);  // Do6
}

// ───────────────────────────────────────────────────────────────
// COFFRES : ouverture interactive
// ───────────────────────────────────────────────────────────────

// Ouvre les coffres en attente un par un, puis appelle onDone
function openPendingChests(onDone) {
  const tier = Storage.popChest();
  if (!tier) {
    if (onDone) onDone();
    return;
  }
  const next = () => openPendingChests(onDone);

  // Un coffre sur trois environ donne un habit ou accessoire pour l'atelier
  if (Math.random() < ECONOMIE.chanceAccessoireCoffre) {
    const acc = Storage.drawAccessory();
    if (acc) {
      Storage.unlockAccessory(acc.id);
      showChestOverlay(tier, {
        art: accessoryArt(acc, 170), nom: acc.nom, tag: 'Atelier', tagColor: '#8E5FC4',
        sub: 'Nouvel accessoire pour tes kawaii !'
      }, next);
      return;
    }
  }

  const sticker = Storage.drawSticker(tier);
  Storage.addSticker(sticker.id);
  const rarity = RARETES[sticker.rarete];
  showChestOverlay(tier, {
    art: stickerArt(sticker, 170), nom: sticker.nom, tag: rarity.nom, tagColor: rarity.couleur,
    sub: 'Nouveau sticker pour ton palais !'
  }, next);
}

// reward = { art, nom, tag, tagColor, sub }
function showChestOverlay(tier, reward, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'chest-overlay';
  overlay.innerHTML = `
    <div class="chest-card">
      <div class="chest-rays"></div>
      <h2>${tier === 'rare' ? '✨ Coffre rare !' : '🎁 Un coffre !'}</h2>
      <p class="chest-sub">Appuie dessus pour l'ouvrir</p>
      <div class="chest-box ${tier === 'rare' ? 'rare' : ''}" role="button" aria-label="Ouvrir le coffre">🎁</div>
      <div class="chest-reward">
        <div class="reward-emoji">${reward.art}</div>
        <div class="reward-name">${reward.nom}</div>
        <span class="rarity-tag" style="background:${reward.tagColor}">${reward.tag}</span>
        <div>
          <button class="btn btn-primary btn-big chest-continue">Super !</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const box = overlay.querySelector('.chest-box');
  const rewardEl = overlay.querySelector('.chest-reward');
  const card = overlay.querySelector('.chest-card');
  const sub = overlay.querySelector('.chest-sub');
  let opened = false;

  const open = () => {
    if (opened) return;
    opened = true;
    box.classList.add('opening');
    playChestSound();
    setTimeout(() => {
      box.classList.add('hidden');
      sub.textContent = reward.sub;
      rewardEl.classList.add('show');
      card.classList.add('revealed');
      launchConfetti();
    }, 450);
  };

  box.addEventListener('click', open);
  box.addEventListener('touchstart', (e) => { e.preventDefault(); open(); }, { passive: false });

  overlay.querySelector('.chest-continue').addEventListener('click', () => {
    overlay.remove();
    if (onClose) onClose();
  });
}

function launchConfetti() {
  const colors = ['#FF7EB9', '#B48CDB', '#5FD3CE', '#F5B21B', '#FFD466', '#2FB86A'];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

// ───────────────────────────────────────────────────────────────
// ACCUEIL : étoiles, jauge du coffre, badges
// ───────────────────────────────────────────────────────────────

function countGoldLists(lists) {
  return lists.filter(list => isListGold(list)).length;
}

// Liste dorée : chaque mot a été interrogé et réussi à 80 % ou plus
// (cartes questions : toutes les cartes dans la boîte 3)
function isListGold(list) {
  if (Storage.isCardList(list)) {
    return (list.cards || []).length > 0 && list.cards.every(c => c.box >= 3);
  }
  if (!list.words.length) return false;
  return list.words.every(word => {
    const p = list.progress[word];
    return p && p.attempts > 0 && p.lastScore >= 0.8;
  });
}

function renderTeamCard() {
  const card = document.getElementById('team-card');
  if (!card) return;

  const team = Storage.getTeam();
  const slots = Storage.getCompanionSlots();

  if (!team.main) {
    card.innerHTML = `
      <div class="team-empty">
        <div class="empty-icon">🐾</div>
        <p>Choisis ton kawaii !</p>
        <button class="btn btn-primary" onclick="showAtelierScreen('main')">🎨 C'est parti</button>
      </div>
    `;
    return;
  }

  let companions = '';
  let toChoose = 0;
  for (let i = 0; i < 5; i++) {
    const c = team.companions[i];
    if (c) {
      companions += `<div class="team-slot" onclick="showKawaiiScreen()" title="${Kawaii.name(c)}">${Kawaii.draw(c, 62)}</div>`;
    } else if (i < slots) {
      toChoose++;
      companions += `<div class="team-slot empty" onclick="showAtelierScreen(${i})" title="Choisir un compagnon">+</div>`;
    } else {
      companions += `<div class="team-slot locked" title="Atteins le niveau Ninja sur une liste">🔒</div>`;
    }
  }

  card.innerHTML = `
    <div class="team-main" onclick="showKawaiiScreen()">${Kawaii.draw(team.main, 170)}</div>
    <div class="team-name">${Kawaii.name(team.main)}</div>
    <div class="team-companions">${companions}</div>
    ${toChoose > 0 ? `<div class="team-hint">🎉 ${toChoose} compagnon${toChoose > 1 ? 's' : ''} à choisir !</div>` : ''}
  `;
}

function renderHome() {
  renderTeamCard();
  const card = document.getElementById('palace-card');
  if (!card) return;

  const eco = Storage.getEconomy();
  const per = ECONOMIE.etoilesParCoffre;
  const progress = eco.totalEarned % per;
  const pending = eco.pendingChests.length;
  const placedCount = Object.values(eco.placed).reduce((sum, ids) => sum + ids.length, 0);
  const freeCount = Storage.getFreeStickers().reduce((sum, x) => sum + x.count, 0);
  const goldCount = countGoldLists(Storage.getLists());

  let html = `
    <div class="palace-icon">🏰</div>
    <div class="palace-info">
      <div class="palace-stars"><strong>${eco.stars}</strong><span>⭐ à dépenser</span></div>
      <div class="gauge">
        <div class="gauge-label">
          <span>Prochain coffre</span>
          <span>${pending > 0 ? 'Prêt !' : `${progress} / ${per} ⭐`}</span>
        </div>
        <div class="gauge-track">
          <div class="gauge-fill" style="width:${pending > 0 ? 100 : (progress / per) * 100}%"></div>
        </div>
      </div>
    </div>
  `;

  if (pending > 0) {
    html += `
      <button class="btn btn-chest" onclick="openPendingChests(renderHome)">
        🎁 Ouvrir ${pending > 1 ? `mes ${pending} coffres` : 'mon coffre'}
      </button>
    `;
  }

  const badges = [];
  if (placedCount > 0) badges.push(`<span class="badge">🏠 ${placedCount} sticker${placedCount > 1 ? 's' : ''} collé${placedCount > 1 ? 's' : ''}</span>`);
  if (freeCount > 0) badges.push(`<span class="badge">🎒 ${freeCount} à coller</span>`);
  if (goldCount > 0) badges.push(`<span class="badge gold">🏅 ${goldCount} liste${goldCount > 1 ? 's' : ''} dorée${goldCount > 1 ? 's' : ''}</span>`);
  if (badges.length) html += `<div class="palace-badges">${badges.join('')}</div>`;

  card.innerHTML = html;
}

// ───────────────────────────────────────────────────────────────
// MON PALAIS : pièces, lieux, stickers
// ───────────────────────────────────────────────────────────────

function showPalaisScreen() {
  showScreen('palais');

  const grid = document.getElementById('palais-grid');
  const intro = document.getElementById('palais-intro');
  if (!grid) return;

  const freeCount = Storage.getFreeStickers().reduce((sum, x) => sum + x.count, 0);
  if (intro) {
    intro.textContent = freeCount > 0
      ? `Tu as ${freeCount} sticker${freeCount > 1 ? 's' : ''} à coller. Choisis une pièce !`
      : 'Gagne des étoiles pour décorer ton palais.';
  }

  let html = '';
  Storage.getMaison().forEach(({ piece, emplacements }) => {
    const stickers = [];
    emplacements.forEach(emplacement => {
      Storage.getPlacedStickers(placeKeyOf({ piece, emplacement })).forEach(s => stickers.push(stickerArt(s, 30)));
    });
    html += `
      <div class="room-card" onclick="showPieceScreen('${piece.replace(/'/g, "\\'")}')">
        <div class="room-emoji">${roomEmoji(piece)}</div>
        <div class="room-name">${capitalizeFirst(piece)}</div>
        <div class="room-meta">${emplacements.length} lieu${emplacements.length > 1 ? 'x' : ''}</div>
        <div class="room-stickers">${stickers.slice(0, 6).join('')}</div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

// Mots actuellement rangés à un emplacement (toutes listes confondues)
function wordsAtPlace(piece, emplacement) {
  const words = [];
  Storage.getLists().forEach(list => {
    Object.entries(list.wordLocations || {}).forEach(([word, loc]) => {
      if (loc.piece !== piece || loc.emplacement !== emplacement) return;
      const prompt = promptOf(list, word);
      words.push(prompt ? `${word} (${prompt})` : word);
    });
  });
  return words;
}

function showPieceScreen(piece) {
  AppState.currentPiece = piece;
  showScreen('piece');

  const title = document.getElementById('piece-title');
  const content = document.getElementById('piece-content');
  if (title) title.textContent = `${roomEmoji(piece)} ${capitalizeFirst(piece)}`;
  if (!content) return;

  const emplacements = emplacementsDe(piece);
  const freeCount = Storage.getFreeStickers().reduce((sum, x) => sum + x.count, 0);
  let html = '';

  emplacements.forEach((emplacement, placeIndex) => {
    const key = placeKeyOf({ piece, emplacement });
    const placed = Storage.getPlacedStickers(key);
    const words = wordsAtPlace(piece, emplacement);

    let slots = placed.map((s, i) =>
      `<div class="slot filled" onclick="askRemoveSticker(${placeIndex}, ${i})" title="${s.nom}">${stickerArt(s, 52)}</div>`
    ).join('');

    if (placed.length < ECONOMIE.maxStickersParLieu) {
      slots += freeCount > 0
        ? `<div class="slot add" onclick="openStickerPicker(${placeIndex})">+</div>`
        : `<div class="slot" onclick="showShopScreen()" title="Boutique">🛍️</div>`;
    }

    html += `
      <div class="place-card">
        <div class="place-head">
          <div>
            <div class="place-name">${emplacement.replace(/_/g, ' ')}</div>
            ${words.length ? `<div class="place-word">📝 ${words.map(escapeText).join(', ')}</div>` : ''}
          </div>
        </div>
        <div class="place-slots">${slots}</div>
      </div>
    `;
  });

  content.innerHTML = html;
}

function currentPlaceKey(placeIndex) {
  const piece = AppState.currentPiece;
  const emplacement = emplacementsDe(piece)[placeIndex];
  return placeKeyOf({ piece, emplacement });
}

function openStickerPicker(placeIndex) {
  const free = Storage.getFreeStickers();
  if (free.length === 0) return;

  const items = free.map(({ sticker, count }) => `
    <div class="sheet-item" onclick="pickSticker(${placeIndex}, '${sticker.id}')">
      <div class="emoji">${stickerArt(sticker, 64)}</div>
      <div class="count">${sticker.nom}${count > 1 ? ` ×${count}` : ''}</div>
    </div>
  `).join('');

  showSheet(`
    <h3>Quel sticker coller ici ?</h3>
    <div class="sheet-grid">${items}</div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Annuler</button>
    </div>
  `);
}

function pickSticker(placeIndex, stickerId) {
  closeSheet();
  if (Storage.placeSticker(currentPlaceKey(placeIndex), stickerId)) {
    playStarSound();
    showPieceScreen(AppState.currentPiece);
  }
}

function askRemoveSticker(placeIndex, stickerIndex) {
  const placed = Storage.getPlacedStickers(currentPlaceKey(placeIndex));
  const sticker = placed[stickerIndex];
  if (!sticker) return;

  showSheet(`
    <div class="sheet-art">${stickerArt(sticker, 110)}</div>
    <h3>${sticker.nom}</h3>
    <p class="text-center">Le retirer de cet endroit ? Il retourne dans ton sac.</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Garder</button>
      <button class="btn btn-secondary" onclick="removeStickerConfirmed(${placeIndex}, ${stickerIndex})">Retirer</button>
    </div>
  `);
}

function removeStickerConfirmed(placeIndex, stickerIndex) {
  closeSheet();
  Storage.removeSticker(currentPlaceKey(placeIndex), stickerIndex);
  showPieceScreen(AppState.currentPiece);
}

// Feuille en bas d'écran (sélecteur, confirmation)
function showSheet(innerHTML) {
  closeSheet();
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'sheet-overlay';
  overlay.innerHTML = `<div class="sheet">${innerHTML}</div>`;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSheet();
  });
  document.body.appendChild(overlay);
}

function closeSheet() {
  const existing = document.getElementById('sheet-overlay');
  if (existing) existing.remove();
}

// ───────────────────────────────────────────────────────────────
// MA MAISON : pièces et endroits modifiables
// ───────────────────────────────────────────────────────────────

function showMaisonScreen() {
  showScreen('maison');
  const content = document.getElementById('maison-content');
  if (!content) return;

  const maison = Storage.getMaison();
  const total = maison.reduce((n, r) => n + r.emplacements.length, 0);
  const attr = (str) => str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  let html = `<p class="intro">Les pièces de ta maison et les endroits où ranger les mots. Appuie sur un nom pour le changer, sur l'emoji pour en choisir un autre.</p>`;

  maison.forEach((room, ri) => {
    const p = attr(room.piece);
    const places = room.emplacements.map((emplacement, ei) => {
      const words = wordsAtPlace(room.piece, emplacement);
      return `
        <div class="maison-place">
          <button class="maison-name" onclick="askRenameLieu('${p}', '${attr(emplacement)}')">
            ${escapeText(emplacement)}
            ${words.length ? `<span class="maison-words">📝 ${escapeText(words.join(', '))}</span>` : ''}
          </button>
          <div class="maison-actions">
            <button class="btn-icon" onclick="moveEndroit(${ri}, ${ei}, -1)" ${ei === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
            <button class="btn-icon" onclick="moveEndroit(${ri}, ${ei}, 1)" ${ei === room.emplacements.length - 1 ? 'disabled' : ''} aria-label="Descendre">↓</button>
            <button class="btn-icon" onclick="askDeleteLieu('${p}', '${attr(emplacement)}')" aria-label="Supprimer">🗑️</button>
          </div>
        </div>`;
    }).join('');

    html += `
      <div class="maison-room">
        <div class="maison-room-head">
          <button class="maison-emoji" onclick="askRoomEmoji('${p}')" aria-label="Choisir l'emoji">${roomEmoji(room.piece)}</button>
          <button class="maison-name maison-room-name" onclick="askRenameLieu('${p}', null)">
            ${escapeText(capitalizeFirst(room.piece))}
          </button>
          <div class="maison-actions">
            <button class="btn-icon" onclick="moveRoom(${ri}, -1)" ${ri === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
            <button class="btn-icon" onclick="moveRoom(${ri}, 1)" ${ri === maison.length - 1 ? 'disabled' : ''} aria-label="Descendre">↓</button>
            <button class="btn-icon" onclick="askDeleteLieu('${p}', null)" aria-label="Supprimer">🗑️</button>
          </div>
        </div>
        <div class="maison-places">${places || '<p class="hint">Aucun endroit pour l\'instant.</p>'}</div>
        <button class="btn btn-ghost btn-block" onclick="askAddEndroit('${p}')">➕ Ajouter un endroit</button>
      </div>`;
  });

  html += `
    <button class="btn btn-primary btn-block mt-10" onclick="askAddRoom()">➕ Ajouter une pièce</button>
    <p class="hint mt-10">${maison.length} pièce${maison.length > 1 ? 's' : ''} · ${total} endroit${total > 1 ? 's' : ''}</p>
    <button class="btn btn-ghost btn-block btn-danger-text mt-20" onclick="askResetMaison()">↩️ Revenir à la maison de départ</button>
  `;
  content.innerHTML = html;
}

function escapeText(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Feuille avec un champ texte. onOk(valeur) est appelé avec le texte nettoyé.
let nameSheetCallback = null;

function askName(title, initial, onOk) {
  nameSheetCallback = onOk;
  showSheet(`
    <h3>${escapeText(title)}</h3>
    <input type="text" id="name-sheet-input" class="field" autocomplete="off" autocapitalize="none">
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Annuler</button>
      <button class="btn btn-success" onclick="submitNameSheet()">✅ Valider</button>
    </div>
  `);
  const input = document.getElementById('name-sheet-input');
  if (input) {
    input.value = initial || '';
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitNameSheet(); });
    setTimeout(() => { input.focus(); input.select(); }, 50);
  }
}

function submitNameSheet() {
  const input = document.getElementById('name-sheet-input');
  const value = input ? input.value.trim().replace(/\s+/g, ' ') : '';
  if (!value) {
    showFeedback('Il faut un nom', 'error');
    return;
  }
  const cb = nameSheetCallback;
  closeSheet();
  nameSheetCallback = null;
  if (cb) cb(value);
}

// Choix de l'emoji d'une pièce : palette EMOJIS_PIECES, ou automatique (mot-clé)
function askRoomEmoji(piece) {
  const room = Storage.getMaison().find(r => r.piece === piece);
  if (!room) return;
  const p = piece.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const auto = roomEmojiAuto(piece);
  // Repli si data/lieux.js est une ancienne version encore en cache
  const palette = typeof EMOJIS_PIECES !== 'undefined' ? EMOJIS_PIECES : PIECE_EMOJIS.map(x => x.emoji);
  const items = palette.map(e => `
    <button class="sheet-item ${room.emoji === e ? 'selected' : ''}" onclick="setRoomEmoji('${p}', '${e}')">
      <div class="emoji">${e}</div>
    </button>
  `).join('');
  showSheet(`
    <h3>Emoji de « ${escapeText(piece)} »</h3>
    <div class="sheet-grid sheet-grid-emoji">${items}</div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Annuler</button>
      <button class="btn btn-ghost ${room.emoji ? '' : 'selected'}" onclick="setRoomEmoji('${p}', null)">${auto} Automatique</button>
    </div>
  `);
}

function setRoomEmoji(piece, emoji) {
  const maison = Storage.getMaison();
  const room = maison.find(r => r.piece === piece);
  if (!room) return;
  if (emoji) room.emoji = emoji;
  else delete room.emoji;
  Storage.saveMaison(maison);
  closeSheet();
  showMaisonScreen();
}

function askAddRoom() {
  askName('Nom de la nouvelle pièce', '', (nom) => {
    const maison = Storage.getMaison();
    if (maison.some(r => r.piece === nom)) {
      showFeedback('Cette pièce existe déjà', 'error');
      return;
    }
    maison.push({ piece: nom, emplacements: [] });
    Storage.saveMaison(maison);
    showMaisonScreen();
  });
}

function askAddEndroit(piece) {
  askName(`Nouvel endroit : ${piece}`, '', (nom) => {
    const maison = Storage.getMaison();
    const room = maison.find(r => r.piece === piece);
    if (!room) return;
    if (room.emplacements.includes(nom)) {
      showFeedback('Cet endroit existe déjà', 'error');
      return;
    }
    room.emplacements.push(nom);
    Storage.saveMaison(maison);
    showMaisonScreen();
  });
}

function askRenameLieu(piece, emplacement) {
  const isRoom = emplacement === null;
  askName(isRoom ? 'Nom de la pièce' : 'Nom de l\'endroit', isRoom ? piece : emplacement, (nom) => {
    const maison = Storage.getMaison();
    if (isRoom) {
      if (nom === piece) return;
      if (maison.some(r => r.piece === nom)) {
        showFeedback('Cette pièce existe déjà', 'error');
        return;
      }
    } else {
      if (nom === emplacement) return;
      const room = maison.find(r => r.piece === piece);
      if (room && room.emplacements.includes(nom)) {
        showFeedback('Cet endroit existe déjà', 'error');
        return;
      }
    }
    Storage.renommerLieu(piece, emplacement, nom);
    showMaisonScreen();
  });
}

function askDeleteLieu(piece, emplacement) {
  const isRoom = emplacement === null;
  const maison = Storage.getMaison();
  const total = maison.reduce((n, r) => n + r.emplacements.length, 0);
  const room = maison.find(r => r.piece === piece);
  const removed = isRoom ? (room ? room.emplacements.length : 0) : 1;
  if (total - removed <= 0) {
    alert('Il faut garder au moins un endroit dans la maison.');
    return;
  }

  const words = isRoom
    ? (room ? room.emplacements : []).flatMap(e => wordsAtPlace(piece, e))
    : wordsAtPlace(piece, emplacement);
  let message = isRoom
    ? `Supprimer la pièce « ${piece} » et ses ${removed} endroit${removed > 1 ? 's' : ''} ?`
    : `Supprimer l'endroit « ${emplacement} » ?`;
  if (words.length) message += `\n\nLes mots rangés ici (${words.join(', ')}) seront déplacés ailleurs.`;
  message += '\nLes stickers collés ici redeviennent libres.';

  if (confirm(message)) {
    Storage.supprimerLieu(piece, emplacement);
    showMaisonScreen();
  }
}

function moveRoom(index, delta) {
  const maison = Storage.getMaison();
  const target = index + delta;
  if (target < 0 || target >= maison.length) return;
  [maison[index], maison[target]] = [maison[target], maison[index]];
  Storage.saveMaison(maison);
  showMaisonScreen();
}

function moveEndroit(roomIndex, index, delta) {
  const maison = Storage.getMaison();
  const room = maison[roomIndex];
  if (!room) return;
  const target = index + delta;
  if (target < 0 || target >= room.emplacements.length) return;
  [room.emplacements[index], room.emplacements[target]] = [room.emplacements[target], room.emplacements[index]];
  Storage.saveMaison(maison);
  showMaisonScreen();
}

function askResetMaison() {
  if (!confirm('Revenir à la maison de départ ?\n\nLes mots rangés dans des endroits qui n\'existent plus seront déplacés, et les stickers collés là redeviennent libres.')) return;
  Storage.saveMaison(Storage.maisonParDefaut());
  const valides = new Set(Storage.getAllLocations().map(placeKeyOf));
  const eco = Storage.getEconomy();
  Object.keys(eco.placed || {}).forEach(key => { if (!valides.has(key)) delete eco.placed[key]; });
  Storage.saveEconomy(eco);
  Storage.reparerEmplacements();
  showMaisonScreen();
}

// ───────────────────────────────────────────────────────────────
// MES KAWAII : principal + compagnons
// ───────────────────────────────────────────────────────────────

function showKawaiiScreen() {
  showScreen('kawaii');
  const content = document.getElementById('kawaii-content');
  if (!content) return;

  const team = Storage.getTeam();
  const slots = Storage.getCompanionSlots();

  let html = '';
  if (team.main) {
    html += `
      <div class="kawaii-main-card">
        <div class="kawaii-role">Mon kawaii principal</div>
        ${Kawaii.draw(team.main, 200)}
        <div class="team-name">${Kawaii.name(team.main)}</div>
        <div class="team-actions">
          <button class="btn btn-primary" onclick="showAtelierScreen('main')">🎨 Modifier</button>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="kawaii-main-card">
        <div class="team-empty">
          <div class="empty-icon">🐾</div>
          <p>Choisis ton kawaii principal !</p>
          <button class="btn btn-primary" onclick="showAtelierScreen('main')">🎨 C'est parti</button>
        </div>
      </div>
    `;
  }

  html += `<p class="intro">Compagnons : un nouveau à chaque liste qui atteint le niveau Ninja 🥷 (${slots}/5 débloqué${slots > 1 ? 's' : ''})</p>`;
  html += '<div class="companion-grid">';
  for (let i = 0; i < 5; i++) {
    const c = team.companions[i];
    if (c) {
      html += `
        <div class="companion-card">
          ${Kawaii.draw(c, 110)}
          <div class="team-name">${Kawaii.name(c)}</div>
          <button class="btn btn-ghost" onclick="showAtelierScreen(${i})">🎨 Modifier</button>
          <button class="btn btn-secondary" onclick="makeMain(${i})">⭐ Devenir principal</button>
        </div>
      `;
    } else if (i < slots) {
      html += `
        <div class="companion-card empty">
          <div class="add-icon">+</div>
          <div class="team-name">Compagnon ${i + 1}</div>
          <button class="btn btn-primary" onclick="showAtelierScreen(${i})">🎨 Choisir</button>
        </div>
      `;
    } else {
      html += `
        <div class="companion-card locked">
          <div class="lock-icon">🔒</div>
          <div>Compagnon ${i + 1}</div>
          <div>Liste au niveau Ninja n°${i + 1}</div>
        </div>
      `;
    }
  }
  html += '</div>';
  content.innerHTML = html;
}

// Échange un compagnon avec le principal
function makeMain(index) {
  const team = Storage.getTeam();
  const c = team.companions[index];
  if (!c) return;
  team.companions[index] = team.main;
  team.main = c;
  Storage.saveTeam(team);
  playStarSound();
  showKawaiiScreen();
}

// ───────────────────────────────────────────────────────────────
// ATELIER : choisir et personnaliser un kawaii
// ───────────────────────────────────────────────────────────────

const Atelier = { slot: 'main', config: null };

function showAtelierScreen(slot) {
  const team = Storage.getTeam();
  const existing = slot === 'main' ? team.main : team.companions[slot];
  Atelier.slot = slot;
  Atelier.config = existing ? { ...existing } : { ...Kawaii.DEFAULT_CONFIG };

  showScreen('atelier');
  const title = document.getElementById('atelier-title');
  if (title) title.textContent = slot === 'main' ? '🎨 Mon kawaii principal' : `🎨 Compagnon ${slot + 1}`;
  renderAtelier();
}

function renderAtelier() {
  const A = Atelier.config;
  const gallery = document.getElementById('atelier-gallery');
  const stage = document.getElementById('atelier-stage');
  const name = document.getElementById('atelier-name');
  const groups = document.getElementById('atelier-groups');
  if (!gallery || !stage || !groups) return;

  gallery.innerHTML = Kawaii.CHARS.map(c => `
    <button class="kchar ${A.char === c.id ? 'on' : ''}" onclick="atelierSet('char', '${c.id}')">
      ${Kawaii.draw({ ...A, char: c.id }, 80)}${c.nom}
    </button>`).join('');

  stage.innerHTML = Kawaii.draw(A, 260);
  if (name) name.textContent = Kawaii.name(A);

  const K = Kawaii;
  const defs = [
    { key: 'fur', titre: 'Couleur', items: K.FURS, swatch: true },
    { key: 'face', titre: 'Expression', items: K.FACES },
    { key: 'hat', titre: 'Sur la tête', items: K.HATS },
    { key: 'glasses', titre: 'Lunettes', items: K.GLASSES },
    { key: 'outfit', titre: 'Tenue', items: K.OUTFITS },
    { key: 'outfitColor', titre: 'Couleur de la tenue et des accessoires', items: K.OUTFIT_COLORS, swatch: true }
  ];
  const natural = (K.CHARS.find(c => c.id === A.char) || K.CHARS[0]).fur;
  const paid = ['fur', 'glasses', 'hat', 'outfit'];
  groups.innerHTML = defs.map(g => `
    <div class="kgroup">
      <p class="kgroup-title">${g.titre}${paid.includes(g.key) ? ' <span class="kgroup-note">🔒 à débloquer en boutique ou dans les coffres</span>' : ''}</p>
      <div class="kchips">${g.items.map(it => {
        const on = A[g.key] === it.id;
        const locked = paid.includes(g.key) && !isAccessoryFree(g.key, it.id) && !Storage.hasAccessory(`${g.key}:${it.id}`);
        const cls = `${on ? 'on' : ''} ${locked ? 'locked' : ''}`;
        if (g.swatch) {
          return `<button class="kchip swatch ${cls}" style="background:${it.c || natural}" title="${it.id}" aria-label="${it.id}" onclick="atelierSet('${g.key}', '${it.id}')">${locked ? '🔒' : ''}</button>`;
        }
        return `<button class="kchip ${cls}" onclick="atelierSet('${g.key}', '${it.id}')">${locked ? '🔒 ' : ''}${it.nom}</button>`;
      }).join('')}</div>
    </div>`).join('');
}

function atelierSet(key, value) {
  const paid = ['fur', 'glasses', 'hat', 'outfit'];
  if (paid.includes(key) && !isAccessoryFree(key, value) && !Storage.hasAccessory(`${key}:${value}`)) {
    askBuyAccessory(`${key}:${value}`, true);
    return;
  }
  Atelier.config[key] = value;
  renderAtelier();
}

// Achat d'un accessoire (depuis la boutique ou l'atelier)
function askBuyAccessory(id, fromAtelier = false) {
  const acc = getAccessory(id);
  if (!acc) return;
  const eco = Storage.getEconomy();
  const preview = fromAtelier ? Kawaii.draw({ ...Atelier.config, [acc.type]: acc.value }, 110) : accessoryArt(acc, 110);

  if (eco.stars < acc.prix) {
    showSheet(`
      <div class="sheet-art">${preview}</div>
      <h3>${acc.nom}</h3>
      <p class="text-center">Il te manque ${acc.prix - eco.stars} ⭐. Continue à t'entraîner, ou ouvre des coffres !</p>
      <div class="sheet-actions"><button class="btn btn-primary" onclick="closeSheet()">D'accord</button></div>
    `);
    return;
  }
  showSheet(`
    <div class="sheet-art">${preview}</div>
    <h3>${acc.nom}</h3>
    <p class="text-center">Débloquer pour ${acc.prix} ⭐ ? Il te restera ${eco.stars - acc.prix} ⭐.</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Non</button>
      <button class="btn btn-primary" onclick="buyAccessory('${id}', ${fromAtelier})">Oui, je débloque !</button>
    </div>
  `);
}

function buyAccessory(id, fromAtelier) {
  closeSheet();
  const acc = getAccessory(id);
  if (!acc || !Storage.spendStars(acc.prix)) return;
  Storage.unlockAccessory(id);
  playChestSound();
  showFeedback(`${acc.nom} : débloqué !`, 'success');
  if (fromAtelier) {
    Atelier.config[acc.type] = acc.value;
    renderAtelier();
  } else {
    showShopScreen();
  }
}

function atelierRandom() {
  const K = Kawaii;
  const pick = l => l[Math.floor(Math.random() * l.length)].id;
  const allowed = (type, list) => list.filter(it => isAccessoryFree(type, it.id) || Storage.hasAccessory(`${type}:${it.id}`));
  Atelier.config = {
    char: pick(K.CHARS), face: pick(K.FACES), outfitColor: pick(K.OUTFIT_COLORS),
    fur: pick(allowed('fur', K.FURS)), hat: pick(allowed('hat', K.HATS)),
    glasses: pick(allowed('glasses', K.GLASSES)), outfit: pick(allowed('outfit', K.OUTFITS))
  };
  renderAtelier();
}

function atelierSave() {
  const team = Storage.getTeam();
  if (Atelier.slot === 'main') team.main = { ...Atelier.config };
  else team.companions[Atelier.slot] = { ...Atelier.config };
  Storage.saveTeam(team);
  playChestSound();
  launchConfetti();
  showFeedback(`${Kawaii.name(Atelier.config)} rejoint ton équipe !`, 'success');
  showKawaiiScreen();
}

// ───────────────────────────────────────────────────────────────
// BOUTIQUE
// ───────────────────────────────────────────────────────────────

function showShopScreen() {
  showScreen('shop');

  const eco = Storage.getEconomy();
  const chip = document.getElementById('shop-stars');
  if (chip) chip.textContent = `⭐ ${eco.stars}`;

  const content = document.getElementById('shop-content');
  if (!content) return;

  const free = Storage.getFreeStickers();
  const freeCount = free.reduce((sum, x) => sum + x.count, 0);

  let html = `
    <div class="shop-inventory">
      <div>
        <strong>🎒 Mon sac</strong>
        <div class="inventory-emojis">${freeCount ? free.map(x => `<span class="inv-item" title="${x.sticker.nom}">${stickerArt(x.sticker, 44)}${x.count > 1 ? `<b>×${x.count}</b>` : ''}</span>`).join('') : 'vide'}</div>
      </div>
      ${freeCount ? '<button class="btn btn-secondary" onclick="showPalaisScreen()">Coller dans mon palais</button>' : ''}
    </div>
  `;

  // Rayon habits et accessoires pour l'atelier
  const wardrobe = accessoryCatalog();
  const unlockedCount = wardrobe.filter(x => Storage.hasAccessory(x.id)).length;
  html += `
    <div class="category-section">
      <div class="category-title">
        🎩 Habits et accessoires <span class="price-tag">${unlockedCount}/${wardrobe.length}</span>
      </div>
      <p class="hint" style="margin:0 0 10px">Pour tes kawaii, dans l'atelier. On peut aussi les trouver dans les coffres.</p>
      <div class="items-grid">
        ${wardrobe.map(acc => {
          const owned = Storage.hasAccessory(acc.id);
          const affordable = eco.stars >= acc.prix;
          return `
            <div class="item-card accessory ${owned ? 'owned' : (affordable ? '' : 'too-expensive')}" onclick="${owned ? '' : `askBuyAccessory('${acc.id}')`}">
              ${owned ? '<span class="item-owned">✓</span>' : ''}
              <div class="item-preview">${accessoryArt(acc, 84)}</div>
              <div class="item-name">${acc.nom}</div>
              <div class="item-price">${owned ? 'à toi' : `${acc.prix} ⭐`}</div>
            </div>`;
        }).join('')}
      </div>
    </div>
  `;

  ['commun', 'rare', 'legendaire', 'kawaii'].forEach(rarete => {
    const price = ECONOMIE.prix[rarete];
    const items = STICKERS.filter(s => s.rarete === rarete);
    html += `
      <div class="category-section">
        <div class="category-title">
          <span style="color:${RARETES[rarete].couleur}">●</span> ${RARETES[rarete].nom}
          <span class="price-tag">${price} ⭐</span>
        </div>
        <div class="items-grid">
    `;
    items.forEach(s => {
      const owned = eco.inventory[s.id] || 0;
      const affordable = eco.stars >= price;
      html += `
        <div class="item-card ${rarete} ${affordable ? '' : 'too-expensive'}" onclick="askBuySticker('${s.id}')">
          ${owned ? `<span class="item-owned">×${owned}</span>` : ''}
          <div class="item-preview">${stickerArt(s, 84)}</div>
          <div class="item-name">${s.nom}</div>
          <div class="item-price">${price} ⭐</div>
        </div>
      `;
    });
    html += '</div></div>';
  });

  content.innerHTML = html;
}

function askBuySticker(stickerId) {
  const sticker = getSticker(stickerId);
  if (!sticker) return;
  const price = ECONOMIE.prix[sticker.rarete];
  const eco = Storage.getEconomy();

  if (eco.stars < price) {
    const missing = price - eco.stars;
    showSheet(`
      <div class="sheet-art">${stickerArt(sticker, 110)}</div>
      <h3>${sticker.nom}</h3>
      <p class="text-center">Il te manque ${missing} ⭐. Continue à t'entraîner !</p>
      <div class="sheet-actions">
        <button class="btn btn-primary" onclick="closeSheet()">D'accord</button>
      </div>
    `);
    return;
  }

  showSheet(`
    <div class="sheet-art">${stickerArt(sticker, 110)}</div>
    <h3>${sticker.nom}</h3>
    <p class="text-center">Acheter pour ${price} ⭐ ? Il te restera ${eco.stars - price} ⭐.</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Non</button>
      <button class="btn btn-primary" onclick="buySticker('${stickerId}')">Oui, j'achète !</button>
    </div>
  `);
}

function buySticker(stickerId) {
  closeSheet();
  const sticker = getSticker(stickerId);
  if (!sticker) return;
  if (!Storage.spendStars(ECONOMIE.prix[sticker.rarete])) return;
  Storage.addSticker(stickerId);
  playChestSound();
  showShopScreen();
  showFeedback(`${sticker.nom} est à toi !`, 'success');
}

// ───────────────────────────────────────────────────────────────
// MOTS À TRAVAILLER
// ───────────────────────────────────────────────────────────────

function showStrugglingWordsScreen() {
  showScreen('struggling-words');
  const container = document.getElementById('struggling-words-list');
  if (!container) return;

  const lists = Storage.getLists();
  let html = '';
  let total = 0;

  lists.forEach(list => {
    const struggling = list.words
      .filter(word => {
        const p = list.progress[word];
        return p && p.attempts > 0 && p.lastScore < 0.8;
      })
      .sort((a, b) => list.progress[a].lastScore - list.progress[b].lastScore);

    if (struggling.length === 0) return;
    total += struggling.length;

    html += `
      <div class="card">
        <div class="list-card-head"><h3>${escapeText(list.name)}</h3></div>
    `;
    struggling.forEach(word => {
      const p = list.progress[word];
      const pct = Math.round(p.lastScore * 100);
      const loc = list.wordLocations[word];
      html += `
        <div class="word-item">
          <div>
            <strong>${promptOf(list, word) ? `${escapeText(promptOf(list, word))} → ` : ''}${escapeText(word)}</strong>
            ${loc ? `<span class="word-place">${roomEmoji(loc.piece)} ${loc.piece} · ${loc.emplacement}</span>` : ''}
          </div>
          <span class="word-score ${pct < 50 ? 'low' : 'mid'}">${p.successes}/${p.attempts}</span>
        </div>
      `;
    });
    html += `
        <div class="list-actions mt-20">
          <button class="btn btn-primary" onclick="startInterrogationOnWords(${list.id})">
            🎯 S'entraîner sur ces ${struggling.length} mot${struggling.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    `;
  });

  if (total === 0) {
    html = `
      <div class="empty-state">
        <div class="empty-icon">🌟</div>
        Aucun mot difficile pour le moment.<br>Continue comme ça !
      </div>
    `;
  } else {
    html = '<p class="intro">Ces mots méritent encore un peu d\'entraînement. Tu vas y arriver ! 💪</p>' + html;
  }

  container.innerHTML = html;
}

// Interrogation progressive limitée aux mots difficiles d'une liste
function startInterrogationOnWords(listId) {
  const list = Storage.getLists().find(l => l.id === listId);
  if (!list) return;
  const words = list.words.filter(word => {
    const p = list.progress[word];
    return p && p.attempts > 0 && p.lastScore < 0.8;
  });
  if (words.length === 0) return;

  AppState.interrogationMode = 'progressive';
  AppState.errors = [];
  startInterrogationBase(listId, words);
}

function startScan() {
  alert('Le scanner arrive bientôt. En attendant, saisis la liste à la main.');
}

// ───────────────────────────────────────────────────────────────
// CARTES QUESTIONS : cartes à retourner, rangées en boîtes
// ───────────────────────────────────────────────────────────────
// On lit la question, on répond à voix haute, on retourne la carte, puis
// on dit soi-même « Je savais » ou « À revoir ». Seule ou avec un parent,
// c'est le même écran : seul change celui qui appuie.

const CartesGame = {
  listId: null,
  cards: {},      // id → carte (copie de travail)
  queue: [],      // ids des cartes à venir, la première est à l'écran
  total: 0,       // cartes tirées pour la session
  done: 0,        // cartes terminées
  returns: {},    // id → nombre de retours dans la session
  toReview: [],   // ids des cartes ratées au moins une fois
  becameNinja: false
};

// Tirage pondéré : les cartes à revoir et les nouvelles sortent en premier,
// les cartes connues reviennent de temps en temps.
function drawCards(cards) {
  return cards
    .map(card => ({ card, key: Math.random() * (CARTES.poidsTirage[card.box] || 1) }))
    .sort((a, b) => a.key - b.key)
    .slice(0, CARTES.parSession)
    .map(x => x.card);
}

function startCartes(listId) {
  const list = Storage.getLists().find(l => l.id === listId);
  if (!list || !(list.cards || []).length) return;

  const drawn = shuffleArray(drawCards(list.cards));
  CartesGame.listId = listId;
  CartesGame.cards = {};
  drawn.forEach(c => { CartesGame.cards[c.id] = { ...c }; });
  CartesGame.queue = drawn.map(c => c.id);
  CartesGame.total = drawn.length;
  CartesGame.done = 0;
  CartesGame.returns = {};
  CartesGame.toReview = [];
  CartesGame.becameNinja = false;
  AppState.currentList = list;
  AppState.sessionReplay = () => startCartes(listId);

  showScreen('cartes');
  document.getElementById('cartes-list-name').textContent = list.name;
  showCarte();
}

function currentCarte() {
  return CartesGame.cards[CartesGame.queue[0]];
}

// Taille du texte selon sa longueur, pour que tout tienne sur la carte
function carteTextClass(text) {
  if (text.length > 120) return 'xs';
  if (text.length > 60) return 's';
  if (text.length > 25) return 'm';
  return '';
}

function showCarte() {
  const card = currentCarte();
  const flip = document.getElementById('flip-card');
  const again = (CartesGame.returns[card.id] || 0) > 0;

  // Revient côté question sans animation : sinon on verrait passer la réponse suivante
  flip.classList.add('no-anim');
  flip.classList.remove('flipped');
  const q = document.getElementById('carte-question');
  const a = document.getElementById('carte-answer');
  q.textContent = card.q;
  q.className = `carte-text ${carteTextClass(card.q)}`;
  a.textContent = card.a;
  a.className = `carte-text ${carteTextClass(card.a)}`;
  void flip.offsetWidth;
  flip.classList.remove('no-anim');

  renderSessionProgress('cartes-session-progress', CartesGame.total, CartesGame.done);
  document.getElementById('cartes-progress').textContent =
    again ? '🔁 On la revoit' : `Carte ${Math.min(CartesGame.done + 1, CartesGame.total)}/${CartesGame.total}`;
  document.getElementById('cartes-flip-zone').classList.remove('hidden');
  document.getElementById('cartes-verdict-zone').classList.add('hidden');
}

function flipCarte() {
  const flip = document.getElementById('flip-card');
  flip.classList.toggle('flipped');
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  // Une fois la réponse vue, on peut la valider (et re-regarder la question)
  document.getElementById('cartes-flip-zone').classList.add('hidden');
  document.getElementById('cartes-verdict-zone').classList.remove('hidden');
}

// Lit à voix haute le côté visible de la carte
function speakCarte() {
  const card = currentCarte();
  if (!card || !AppState.soundEnabled) return;
  const flipped = document.getElementById('flip-card').classList.contains('flipped');
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  speakWord(flipped ? card.a : card.q);
}

function answerCarte(known) {
  const card = currentCarte();
  if (!card) return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const failedBefore = CartesGame.toReview.includes(card.id);

  if (known) {
    // Ratée plus tôt dans la session : elle reste « à revoir » jusqu'à la prochaine fois
    const box = failedBefore ? 1 : (card.box === 0 ? 2 : Math.min(3, card.box + 1));
    const slotsBefore = Storage.getCompanionSlots();
    if (Storage.setCardBox(CartesGame.listId, card.id, box)) {
      CartesGame.becameNinja = true;
      if (Storage.getCompanionSlots() > slotsBefore) AppState.newCompanionUnlocked = true;
    }
    card.box = box;
    CartesGame.queue.shift();
    CartesGame.done++;
  } else {
    Storage.setCardBox(CartesGame.listId, card.id, 1);
    card.box = 1;
    if (!failedBefore) CartesGame.toReview.push(card.id);
    CartesGame.queue.shift();
    // La carte revient un peu plus loin dans la session
    const returns = CartesGame.returns[card.id] || 0;
    if (returns < CARTES.retoursMaxParCarte) {
      CartesGame.returns[card.id] = returns + 1;
      CartesGame.queue.splice(Math.min(3, CartesGame.queue.length), 0, card.id);
    } else {
      CartesGame.done++;
    }
  }

  if (CartesGame.queue.length === 0) finishCartes();
  else showCarte();
}

function finishCartes() {
  // La récompense est pour la session terminée, pas pour les bonnes réponses
  Storage.addStars(CARTES.etoilesSession);
  playStarSound();
  if (CartesGame.becameNinja) Storage.grantChest('rare');
  openPendingChests(showCartesResults);
}

function showCartesResults() {
  showScreen('results');
  const container = document.getElementById('results-content');
  if (!container) return;

  const review = CartesGame.toReview.map(id => CartesGame.cards[id]);
  const knownCount = CartesGame.total - review.length;
  const freeStickers = Storage.getFreeStickers().reduce((sum, x) => sum + x.count, 0);

  let html = `
    <div class="result-hero">
      <div class="result-icon">${review.length === 0 ? '🏆' : '👏'}</div>
      <h2>Session terminée !</h2>
      <p class="result-score">${knownCount} / ${CartesGame.total}</p>
      <p class="result-sub">carte${knownCount > 1 ? 's' : ''} connue${knownCount > 1 ? 's' : ''} du premier coup</p>
      <div class="stars-earned">+${CARTES.etoilesSession} ⭐ gagnées</div>
    </div>
  `;

  if (CartesGame.becameNinja) {
    html += `
      <div class="level-up">
        <div class="level-up-icon">🥷</div>
        <div class="level-up-title">Liste Ninja !</div>
        <div class="level-up-sub">Tu connais toutes les cartes de cette liste</div>
      </div>
    `;
  }

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
    html += '<p class="hint">Ces cartes reviendront en premier la prochaine fois.</p></div>';
  } else {
    html += '<div class="success-card">✅ Toutes les cartes connues !</div>';
  }

  if (AppState.newCompanionUnlocked) {
    AppState.newCompanionUnlocked = false;
    html += `
      <div class="level-up">
        <div class="level-up-icon">🐾</div>
        <div class="level-up-title">Nouveau compagnon débloqué !</div>
        <div class="level-up-sub">Va choisir ton kawaii de compagnie</div>
        <div class="team-actions"><button class="btn btn-secondary" onclick="showKawaiiScreen()">🎨 Choisir mon compagnon</button></div>
      </div>
    `;
  }

  html += `
    <div class="result-actions">
      <button class="btn btn-primary btn-big" onclick="replaySession()">🃏 Encore une session</button>
      ${freeStickers > 0 ? `<button class="btn btn-secondary" onclick="showPalaisScreen()">🏠 Coller mes ${freeStickers} sticker${freeStickers > 1 ? 's' : ''}</button>` : ''}
    </div>
  `;
  container.innerHTML = html;
}

// ───────────────────────────────────────────────────────────────
// ESPACE PARENTS : sauvegarde et restauration des données
// ───────────────────────────────────────────────────────────────
// Tout est dans le localStorage de l'appareil : sans sauvegarde, un
// nettoyage de Safari efface tout. L'entrée est protégée par un calcul.

let parentGateAnswer = null;

function askParentGate() {
  const a = 12 + Math.floor(Math.random() * 8);
  const b = 6 + Math.floor(Math.random() * 4);
  parentGateAnswer = a * b;
  showSheet(`
    <h3>👨‍👩‍👧 Espace parents</h3>
    <p class="hint">Pour entrer : combien font ${a} × ${b} ?</p>
    <input type="text" inputmode="numeric" id="parent-gate-input" class="field" autocomplete="off">
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Annuler</button>
      <button class="btn btn-success" onclick="submitParentGate()">✅ Valider</button>
    </div>
  `);
  const input = document.getElementById('parent-gate-input');
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitParentGate(); });
  setTimeout(() => input.focus(), 50);
}

function submitParentGate() {
  const input = document.getElementById('parent-gate-input');
  if (!input || parseInt(input.value.trim(), 10) !== parentGateAnswer) {
    showFeedback('Ce n\'est pas ça', 'error');
    return;
  }
  closeSheet();
  showParentsScreen();
}

function showParentsScreen() {
  showScreen('parents');
  renderAccountCard();
  const last = localStorage.getItem('lastExportAt');
  const lists = Storage.getLists();
  document.getElementById('parents-summary').textContent =
    `${lists.length} liste${lists.length > 1 ? 's' : ''} · ${Storage.getEconomy().stars} ⭐ · ` +
    (last ? `dernière sauvegarde le ${new Date(last).toLocaleDateString('fr-FR')}` : 'jamais sauvegardé');
}

function exportData() {
  localStorage.setItem('lastExportAt', new Date().toISOString());
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // La session du compte ne sort pas de l'appareil
    if (Sync.LOCAL_ONLY_KEYS.includes(key)) continue;
    data[key] = localStorage.getItem(key);
  }
  const json = JSON.stringify({ app: 'mental-palace', format: 1, exportedAt: new Date().toISOString(), data }, null, 1);
  const name = `mental-palace-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([json], name, { type: 'application/json' });

  const download = () => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // iPad : la feuille de partage permet « Enregistrer dans Fichiers », AirDrop, Mail…
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'Sauvegarde Mental Palace' })
      .catch(err => { if (err.name !== 'AbortError') download(); });
  } else {
    download();
  }
  showParentsScreen();
}

function importData(input) {
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    let payload;
    try {
      payload = JSON.parse(reader.result);
    } catch (e) {
      payload = null;
    }
    if (!payload || payload.app !== 'mental-palace' || !payload.data || typeof payload.data !== 'object') {
      alert('Ce fichier n\'est pas une sauvegarde Mental Palace.');
      return;
    }

    let savedLists = [];
    let savedStars = 0;
    try {
      savedLists = JSON.parse(payload.data.wordLists || '[]');
      savedStars = JSON.parse(payload.data.economy || '{}').stars || 0;
    } catch (e) {
      alert('Sauvegarde illisible.');
      return;
    }
    const date = payload.exportedAt ? new Date(payload.exportedAt).toLocaleDateString('fr-FR') : '?';
    const ok = confirm(
      `Sauvegarde du ${date} : ${savedLists.length} liste(s), ${savedStars} ⭐.\n\n` +
      `Elle va REMPLACER les données de cet appareil : ${Storage.getLists().length} liste(s), ${Storage.getEconomy().stars} ⭐.\n\nContinuer ?`
    );
    if (!ok) return;

    // Connecté à un compte : ces données y seront envoyées au rechargement
    Object.entries(payload.data).forEach(([key, value]) => {
      if (typeof value === 'string' && !Sync.LOCAL_ONLY_KEYS.includes(key)) localStorage.setItem(key, value);
    });
    window.location.reload();
  };
  reader.readAsText(file);
}

// ───────────────────────────────────────────────────────────────
// ESPACE PARENTS : compte en ligne (moteur dans js/sync.js)
// ───────────────────────────────────────────────────────────────
// Un compte = un enfant. Connexion par code reçu par email ; la session
// reste ouverte sur l'appareil, l'enfant ne tape jamais de code.

const AccountForm = { email: '', codeSent: false, busy: false };

function syncStatusText(s) {
  const at = s.lastSyncAt
    ? new Date(s.lastSyncAt).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : '';
  switch (s.status) {
    case 'signedOut': return '☁️ Pas de compte : le palais reste sur cet appareil';
    case 'expired': return '⚠️ Compte déconnecté : à reconnecter dans l\'espace parents';
    case 'choice': return '⚠️ Compte : un choix attend dans l\'espace parents';
    case 'syncing': return '☁️ Enregistrement en ligne…';
    case 'pending': return '☁️ Enregistrement en ligne dans un instant';
    case 'error': return '☁️ Pas de connexion : ce sera enregistré en ligne plus tard' + (at ? ` (dernier envoi le ${at})` : '');
    case 'synced': return `☁️ Enregistré en ligne le ${at}`;
    default: return '';
  }
}

// Ligne d'état sous l'entrée de l'espace parents, sur l'accueil
function renderSyncStatus() {
  const line = document.getElementById('sync-status');
  if (line) line.textContent = syncStatusText(Sync.state());
}

function renderAccountCard() {
  const card = document.getElementById('account-card');
  if (!card) return;
  const s = Sync.state();
  card.classList.toggle('hidden', s.status === 'off');
  // Ne pas effacer ce qu'un parent est en train de taper
  const typing = card.contains(document.activeElement) && document.activeElement.tagName === 'INPUT';
  if (s.status === 'off' || typing) return;

  const busy = AccountForm.busy ? 'disabled' : '';
  const summary = x => `${x.lists} liste${x.lists > 1 ? 's' : ''} · ${x.stars} ⭐`;
  let html = '<h2>☁️ Compte</h2>';

  if (s.status === 'signedOut' || s.status === 'expired') {
    if (s.status === 'expired') {
      html += `<p>La connexion au compte <strong>${escapeText(s.email || '')}</strong> a expiré. Rien n'est perdu : le palais est sur cet appareil et sera enregistré en ligne dès la reconnexion.</p>`;
    } else {
      html += '<p>Avec un compte, le palais est enregistré en ligne : on le retrouve sur l\'iPad, le téléphone ou l\'ordinateur, sans fichier à transférer. Un compte par enfant.</p>';
    }
    if (!AccountForm.codeSent) {
      html += `
        <label class="field-label" for="account-email">Email d'un parent</label>
        <input type="email" id="account-email" class="field" autocomplete="email" autocapitalize="off" spellcheck="false" value="${escapeText(AccountForm.email || s.email || '').replace(/"/g, '&quot;')}">
        <button class="btn btn-primary btn-block mt-20" onclick="sendAccountCode()" ${busy}>📧 Recevoir un code</button>
        <p class="hint">Première fois ? Le compte est créé tout seul.</p>`;
    } else {
      html += `
        <p>Un code a été envoyé à <strong>${escapeText(AccountForm.email)}</strong>. S'il n'arrive pas en une minute, regarde dans les indésirables.</p>
        <label class="field-label" for="account-code">Code reçu</label>
        <input type="text" id="account-code" class="field" inputmode="numeric" autocomplete="one-time-code">
        <button class="btn btn-success btn-block mt-20" onclick="submitAccountCode()" ${busy}>✅ Valider</button>
        <button class="btn btn-ghost btn-block mt-10" onclick="resetAccountForm()" ${busy}>Changer d'adresse ou redemander un code</button>`;
    }
  } else if (s.status === 'choice') {
    html += `<p><strong>${escapeText(s.email || '')}</strong></p>`;
    if (!s.choice.remote) {
      html += `
        <p>Le compte n'a pas pu être lu (pas de connexion ?). Rien n'a été modifié.</p>
        <button class="btn btn-primary btn-block mt-20" onclick="retryAccountFirstSync()" ${busy}>🔄 Réessayer</button>`;
    } else {
      const when = s.choice.remote.updatedAt ? new Date(s.choice.remote.updatedAt).toLocaleDateString('fr-FR') : '?';
      const where = s.choice.remote.device ? ` sur ${escapeText(s.choice.remote.device)}` : '';
      html += `
        <p>Ce compte contient déjà un palais, et cet appareil aussi. Lequel garder ?</p>
        <button class="btn btn-primary btn-block mt-20" onclick="chooseAccountData('remote')" ${busy}>☁️ Celui du compte : ${summary(s.choice.remote)}</button>
        <p class="hint">Modifié le ${when}${where}.</p>
        <button class="btn btn-ghost btn-block mt-20" onclick="chooseAccountData('local')" ${busy}>📱 Celui de cet appareil : ${summary(s.choice.local)}</button>
        <p class="hint">Une copie de secours de l'autre est gardée.</p>`;
    }
    html += `<button class="btn btn-ghost btn-block mt-20" onclick="logoutAccount()" ${busy}>Annuler la connexion</button>`;
  } else {
    html += `
      <p><strong>${escapeText(s.email || '')}</strong></p>
      <p class="hint">${escapeText(syncStatusText(s))}</p>
      <button class="btn btn-primary btn-block mt-20" onclick="syncAccountNow()" ${busy}>🔄 Synchroniser maintenant</button>
      <button class="btn btn-ghost btn-block mt-10" onclick="logoutAccount()" ${busy}>Se déconnecter</button>`;
  }
  card.innerHTML = html;
}

// Exécute une action du compte en grisant les boutons ; renvoie son résultat, ou null si elle échoue
async function runAccountAction(action) {
  if (AccountForm.busy) return null;
  AccountForm.busy = true;
  if (document.activeElement) document.activeElement.blur();
  renderAccountCard();
  try {
    return await action();
  } catch (e) {
    showFeedback(e.message || 'Ça n\'a pas marché', 'error');
    return null;
  } finally {
    AccountForm.busy = false;
    renderAccountCard();
  }
}

async function sendAccountCode() {
  const email = document.getElementById('account-email').value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFeedback('Adresse email incomplète', 'error');
    return;
  }
  AccountForm.email = email;
  const sent = await runAccountAction(() => Sync.requestCode(email).then(() => true));
  if (!sent) return;
  AccountForm.codeSent = true;
  renderAccountCard();
  const input = document.getElementById('account-code');
  if (input) input.focus();
}

async function submitAccountCode() {
  const code = document.getElementById('account-code').value.replace(/\D/g, '');
  if (code.length < 6) {
    showFeedback('Le code a au moins 6 chiffres', 'error');
    return;
  }
  const result = await runAccountAction(() => Sync.verifyCode(AccountForm.email, code));
  if (!result) return;
  resetAccountForm();
  if (result.status === 'ok') showFeedback('Connecté : le palais est enregistré en ligne', 'success');
}

function resetAccountForm() {
  AccountForm.codeSent = false;
  renderAccountCard();
}

async function retryAccountFirstSync() {
  await runAccountAction(() => Sync.retryFirstSync());
}

async function chooseAccountData(which) {
  const choice = Sync.state().choice;
  const summary = x => `${x.lists} liste(s), ${x.stars} ⭐`;
  const ok = which === 'remote'
    ? confirm(`Le palais du compte (${summary(choice.remote)}) va REMPLACER celui de cet appareil (${summary(choice.local)}).\n\nContinuer ?`)
    : confirm(`Le palais de cet appareil (${summary(choice.local)}) va REMPLACER celui du compte (${summary(choice.remote)}), sur tous les appareils.\n\nContinuer ?`);
  if (!ok) return;
  const done = await runAccountAction(() => Sync.resolveChoice(which));
  if (done === false) showFeedback('Pas de connexion : réessaie dans un instant', 'error');
}

async function syncAccountNow() {
  const ok = await runAccountAction(() => Sync.syncNow());
  if (ok) showFeedback('Tout est enregistré en ligne', 'success');
  else if (ok === false) showFeedback(Sync.state().error || 'Pas de connexion', 'error');
}

async function logoutAccount() {
  const merged = Sync.state().status !== 'choice';
  if (merged && !confirm('Se déconnecter ?\n\nLe palais reste enregistré dans le compte. Il sera retiré de cet appareil, et reviendra à la prochaine connexion.')) return;
  const emptied = await runAccountAction(() => Sync.logout());
  if (emptied) window.location.reload();
}

// ───────────────────────────────────────────────────────────────
// TODO: MODE RYTHMIQUE (à implémenter plus tard)
// ───────────────────────────────────────────────────────────────
// Un mode de jeu basé sur les syllabes avec un rythme musical
// - Décomposer les mots en syllabes
// - Afficher les syllabes au rythme d'une musique
// - L'enfant doit taper sur les syllabes au bon moment
// - Gamification avec combo et score multiplicateur
