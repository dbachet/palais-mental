// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Défis du jour et album de stickers
// ═══════════════════════════════════════════════════════════════
// Tout est rangé dans `economy` (déjà sauvegardé, exporté et synchronisé) :
//   daily        { date, ids, progress, done, bonus, suite, played }
//   daysPlayed   nombre de jours où l'enfant a joué
//   albumClaimed paliers de l'album déjà récupérés
// Réglages : DEFIS et ALBUM dans data/lieux.js.
// Chargé après js/app.js, qui fournit Storage, AppState et les écrans.

// ───────────────────────────────────────────────────────────────
// DÉFIS DU JOUR
// ───────────────────────────────────────────────────────────────
// Pas de série à tenir, rien à perdre : trois défis neufs chaque jour,
// quelques étoiles par défi, un coffre quand les trois sont réussis.

const Defis = {
  fresh: [],       // défis réussis pas encore fêtés : [{ defi } | { bonus: true }]
  cache: null,     // { date, open } : évite de relire le stockage à chaque caresse

  // Écrans où l'enfant est en plein travail : on ne l'interrompt pas,
  // les défis réussis sont fêtés sur l'écran de fin
  ECRANS_CALMES: ['interrogation', 'apprentissage', 'cartes', 'jeu'],

  today() {
    const d = new Date();
    const two = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
  },

  all() {
    return DEFIS.familles.flat();
  },

  byId(id) {
    return this.all().find(d => d.id === id) || null;
  },

  // Le défi peut-il être réussi aujourd'hui, avec ce que l'enfant a ?
  faisable(id) {
    const lists = Storage.getActiveLists();
    const wordLists = lists.filter(l => !Storage.isCardList(l) && l.words.length > 0);
    const cardLists = lists.filter(l => Storage.isCardList(l) && (l.cards || []).length > 0);
    switch (id) {
      case 'mots10':
      case 'mots20':
      case 'suite5':
      case 'session':
        return wordLists.length + cardLists.length > 0;
      case 'visite':
        return wordLists.length > 0;
      case 'jeu':
        return cardLists.length > 0;
      case 'travail': {
        const hard = wordLists.reduce((n, l) => n + l.words.filter(w => {
          const p = l.progress[w];
          return p && p.attempts > 0 && p.lastScore < 0.8;
        }).length, 0);
        return hard >= 3;
      }
      case 'calin':
        return !!Storage.getTeam().main;
      case 'sticker': {
        const eco = Storage.getEconomy();
        const free = Storage.getFreeStickers().length > 0;
        const room = Storage.getAllLocations()
          .some(loc => (eco.placed[placeKeyOf(loc)] || []).length < ECONOMIE.maxStickersParLieu);
        return free && room;
      }
      default:
        return true;
    }
  },

  // Nombre stable pour une date : les mêmes défis toute la journée, sur tous les appareils
  seed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },

  pick(date) {
    const ids = [];
    DEFIS.familles.forEach((famille, i) => {
      const possibles = famille.filter(d => this.faisable(d.id));
      if (possibles.length === 0) return;
      ids.push(possibles[this.seed(`${date}#${i}`) % possibles.length].id);
    });
    return ids;
  },

  // Défis d'aujourd'hui (créés à la première lecture du jour)
  state() {
    const eco = Storage.getEconomy();
    const date = this.today();
    const known = d => Array.isArray(d.ids) && d.ids.every(id => this.byId(id));
    if (eco.daily && eco.daily.date === date && known(eco.daily)) return eco.daily;

    eco.daily = { date, ids: this.pick(date), progress: {}, done: [], bonus: false, suite: 0, played: false };
    Storage.saveEconomy(eco);
    this.cache = null;
    return eco.daily;
  },

  // Défis du jour pas encore réussis (gardés en mémoire)
  open() {
    const date = this.today();
    if (!this.cache || this.cache.date !== date) {
      const daily = this.state();
      this.cache = { date, open: daily.ids.filter(id => !daily.done.includes(id)), played: daily.played };
    }
    return this.cache.open;
  },

  // Une bonne ou une mauvaise réponse (interrogation, QCM, paires, réponse écrite)
  answer(correct, { travail = false } = {}) {
    this.markPlayed();
    if (correct) {
      this.track('mots10');
      this.track('mots20');
      if (travail) this.track('travail');
    }
    if (!this.open().includes('suite5')) return;
    const eco = Storage.getEconomy();
    eco.daily.suite = correct ? (eco.daily.suite || 0) + 1 : 0;
    Storage.saveEconomy(eco);
    if (correct) this.track('suite5', 0, eco.daily.suite);
  },

  // Premier jeu de la journée : un jour de jeu de plus
  markPlayed() {
    this.open();
    if (this.cache.played) return;
    this.state();
    const eco = Storage.getEconomy();
    eco.daily.played = true;
    eco.daysPlayed = (eco.daysPlayed || 0) + 1;
    Storage.saveEconomy(eco);
    if (this.cache) this.cache.played = true;
  },

  // Avance un défi de n (ou le porte à `atLeast`). Sans effet s'il n'est pas du jour.
  track(id, n = 1, atLeast = 0) {
    if (!this.open().includes(id)) return;
    if (id !== 'calin' && id !== 'album' && id !== 'sticker') this.markPlayed();

    const defi = this.byId(id);
    const eco = Storage.getEconomy();
    const daily = eco.daily;
    const value = Math.max((daily.progress[id] || 0) + n, atLeast);
    daily.progress[id] = Math.min(value, defi.cible);
    const reussi = daily.progress[id] >= defi.cible;
    if (reussi) daily.done.push(id);
    const tous = reussi && !daily.bonus && daily.ids.every(x => daily.done.includes(x));
    if (tous) daily.bonus = true;
    Storage.saveEconomy(eco);
    if (!reussi) {
      this.refresh();
      return;
    }

    this.cache = null;
    Storage.addStars(DEFIS.etoilesParDefi);
    this.fresh.push({ defi });
    if (tous) {
      Storage.grantChest(DEFIS.coffreLesTrois);
      this.fresh.push({ bonus: true });
    }
    this.celebrate();
  },

  // Fête tout de suite si l'enfant n'est pas en plein travail
  celebrate() {
    if (this.ECRANS_CALMES.includes(AppState.currentScreen) || this.fresh.length === 0) return;
    const bonus = this.fresh.some(f => f.bonus);
    this.fresh = [];
    playStarSound();
    showFeedback(bonus ? 'Tous les défis réussis ! 🎁' : `Défi réussi ! +${DEFIS.etoilesParDefi} ⭐`, 'success');
    // Sur l'accueil, on ne redessine pas les kawaii : l'enfant est peut-être en train d'en caresser un
    if (AppState.currentScreen === 'home') {
      this.renderHomeCard();
      renderPalaceCard();
    }
  },

  refresh() {
    if (AppState.currentScreen === 'home') this.renderHomeCard();
  },

  // Bloc des écrans de fin : les défis réussis pendant la session
  celebrationHTML() {
    if (this.fresh.length === 0) return '';
    const fresh = this.fresh;
    this.fresh = [];
    const rows = fresh.filter(f => f.defi).map(f => `
      <div class="defi-won">
        <span class="defi-emoji">${f.defi.emoji}</span>
        <span class="defi-text">${escapeText(f.defi.texte)}</span>
        <span class="defi-gain">+${DEFIS.etoilesParDefi} ⭐</span>
      </div>`).join('');
    const bonus = fresh.some(f => f.bonus)
      ? '<div class="defi-won bonus"><span class="defi-emoji">🎁</span><span class="defi-text">Tous les défis du jour : un coffre t\'attend sur l\'accueil !</span></div>'
      : '';
    const n = fresh.filter(f => f.defi).length;
    return `
      <div class="defis-won">
        <div class="defis-won-title">🎯 Défi${n > 1 ? 's' : ''} du jour réussi${n > 1 ? 's' : ''} !</div>
        ${rows}${bonus}
      </div>`;
  },

  // Où aller pour réussir ce défi
  go(id) {
    if (id === 'travail') showStrugglingWordsScreen();
    else if (id === 'sticker') showPalaisScreen();
    else if (id === 'album') showAlbumScreen();
    else if (id === 'calin') {
      const main = document.querySelector('#team-card .team-main');
      if (main) main.scrollIntoView({ behavior: 'smooth', block: 'center' });
      Kawaii.react(main, 'saut');
    } else showListsScreen();
  },

  renderHomeCard() {
    const card = document.getElementById('defis-card');
    if (!card) return;
    const daily = this.state();
    card.classList.toggle('hidden', daily.ids.length === 0);
    if (daily.ids.length === 0) return;

    const done = daily.ids.filter(id => daily.done.includes(id)).length;
    const rows = daily.ids.map(id => {
      const defi = this.byId(id);
      const ok = daily.done.includes(id);
      const value = ok ? defi.cible : (daily.progress[id] || 0);
      const meter = defi.cible > 1
        ? `<span class="defi-meter"><span class="defi-meter-fill" style="width:${(value / defi.cible) * 100}%"></span></span>`
        : '';
      const state = ok
        ? '<span class="defi-state">✅</span>'
        : (defi.cible > 1 ? `<span class="defi-state">${value}/${defi.cible}</span>` : '<span class="defi-state go">→</span>');
      return `
        <button class="defi-row${ok ? ' done' : ''}" onclick="Defis.go('${id}')"${ok ? ' disabled' : ''}>
          <span class="defi-emoji">${defi.emoji}</span>
          <span class="defi-body"><span class="defi-text">${escapeText(defi.texte)}</span>${meter}</span>
          ${state}
        </button>`;
    }).join('');

    const all = done === daily.ids.length;
    card.innerHTML = `
      <div class="defis-head">
        <h2>🎯 Défis du jour</h2>
        <span class="defis-count${all ? ' all' : ''}">${done}/${daily.ids.length}</span>
      </div>
      ${rows}
      <p class="defis-foot">${all
        ? 'Bravo, tout est réussi ! De nouveaux défis arrivent demain 🌙'
        : `+${DEFIS.etoilesParDefi} ⭐ par défi · les ${daily.ids.length} réussis = 🎁 un coffre`}</p>
    `;
  }
};

// ───────────────────────────────────────────────────────────────
// ALBUM DE STICKERS
// ───────────────────────────────────────────────────────────────

const Album = {
  // Stickers différents trouvés au moins une fois (collés ou non)
  owned(eco = Storage.getEconomy()) {
    return STICKERS.filter(s => (eco.inventory[s.id] || 0) > 0);
  },

  // Paliers avec leur seuil réel : "tout" = tout le catalogue
  paliers() {
    return ALBUM.paliers
      .map(p => ({ id: String(p.n), seuil: p.n === 'tout' ? STICKERS.length : p.n, cadeau: p.cadeau }))
      .filter(p => p.seuil <= STICKERS.length)
      .sort((a, b) => a.seuil - b.seuil);
  },

  claimable(eco = Storage.getEconomy()) {
    const count = this.owned(eco).length;
    return this.paliers().filter(p => count >= p.seuil && !eco.albumClaimed.includes(p.id));
  },

  cadeauText(cadeau) {
    const parts = [];
    if (cadeau.etoiles) parts.push(`${cadeau.etoiles} ⭐`);
    const coffres = cadeau.coffres || [];
    const rares = coffres.filter(c => c === 'rare').length;
    const normaux = coffres.length - rares;
    if (normaux) parts.push(`${normaux} coffre${normaux > 1 ? 's' : ''} 🎁`);
    if (rares) parts.push(`${rares} coffre${rares > 1 ? 's' : ''} rare${rares > 1 ? 's' : ''} ✨`);
    return parts.join(' + ');
  },

  claim(id) {
    const eco = Storage.getEconomy();
    const palier = this.claimable(eco).find(p => p.id === id);
    if (!palier) return;
    eco.albumClaimed.push(palier.id);
    Storage.saveEconomy(eco);
    if (palier.cadeau.etoiles) Storage.addStars(palier.cadeau.etoiles);
    (palier.cadeau.coffres || []).forEach(tier => Storage.grantChest(tier));

    playChestSound();
    launchConfetti();
    if (palier.cadeau.etoiles) showFeedback(`+${palier.cadeau.etoiles} ⭐ pour ton album !`, 'success');
    // Les coffres du cadeau (et ceux gagnés grâce aux étoiles) s'ouvrent tout de suite
    setTimeout(() => openPendingChests(() => showAlbumScreen(true)), palier.cadeau.etoiles ? 900 : 200);
  }
};

function showAlbumScreen(keepScroll) {
  const y = window.scrollY;
  showScreen('album');
  Defis.track('album');

  const content = document.getElementById('album-content');
  if (!content) return;

  const eco = Storage.getEconomy();
  const owned = Album.owned(eco);
  const ownedIds = new Set(owned.map(s => s.id));
  const total = STICKERS.length;
  const paliers = Album.paliers();
  const next = paliers.find(p => owned.length < p.seuil);

  const chip = document.getElementById('album-count');
  if (chip) chip.textContent = `${owned.length}/${total}`;

  // ── Chemin des cadeaux ──
  const steps = paliers.map(p => {
    const claimed = eco.albumClaimed.includes(p.id);
    const reached = owned.length >= p.seuil;
    if (reached && !claimed) {
      return `
        <button class="album-step ready" onclick="Album.claim('${p.id}')">
          <span class="album-step-icon">🎁</span>
          <span class="album-step-n">${p.seuil}</span>
          <span class="album-step-label">Ouvrir !</span>
        </button>`;
    }
    return `
      <div class="album-step${claimed ? ' claimed' : ''}" title="${Album.cadeauText(p.cadeau)}">
        <span class="album-step-icon">${claimed ? '✅' : '🎁'}</span>
        <span class="album-step-n">${p.seuil}</span>
        <span class="album-step-label">${claimed ? 'reçu' : Album.cadeauText(p.cadeau)}</span>
      </div>`;
  }).join('');

  let html = `
    <div class="album-hero">
      <div class="album-hero-top">
        <div class="album-hero-count"><strong>${owned.length}</strong> / ${total} stickers trouvés</div>
        <div class="album-hero-next">${next
          ? `Encore ${next.seuil - owned.length} pour le prochain cadeau : ${Album.cadeauText(next.cadeau)}`
          : 'Album complet ! 🏆'}</div>
      </div>
      <div class="gauge-track album-gauge"><div class="gauge-fill" style="width:${(owned.length / total) * 100}%"></div></div>
      <div class="album-steps">${steps}</div>
    </div>
  `;

  // ── Une page par rareté ──
  ['commun', 'rare', 'legendaire', 'kawaii'].forEach(rarete => {
    const items = STICKERS.filter(s => s.rarete === rarete);
    if (items.length === 0) return;
    const found = items.filter(s => ownedIds.has(s.id)).length;
    const complete = found === items.length;
    html += `
      <div class="album-page ${rarete}${complete ? ' complete' : ''}">
        <div class="category-title">
          <span style="color:${RARETES[rarete].couleur}">●</span> ${RARETES[rarete].nom}
          <span class="price-tag">${found}/${items.length}</span>
          ${complete ? '<span class="album-complete">🏅 Page complète</span>' : ''}
        </div>
        <div class="album-grid">
          ${items.map(s => {
            const has = ownedIds.has(s.id);
            const count = eco.inventory[s.id] || 0;
            return `
              <button class="album-cell ${rarete}${has ? ' found' : ''}" onclick="showAlbumSticker('${s.id}')">
                ${has && count > 1 ? `<span class="item-owned">×${count}</span>` : ''}
                <span class="album-art">${stickerArt(s, 72)}</span>
                <span class="album-name">${has ? escapeText(s.nom) : '?'}</span>
              </button>`;
          }).join('')}
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
  if (keepScroll) window.scrollTo(0, y);
}

function showAlbumSticker(stickerId) {
  const sticker = getSticker(stickerId);
  if (!sticker) return;
  const eco = Storage.getEconomy();
  const count = eco.inventory[stickerId] || 0;
  const rarity = RARETES[sticker.rarete];
  const tag = `<div class="text-center"><span class="rarity-tag" style="background:${rarity.couleur}">${rarity.nom}</span></div>`;

  if (count === 0) {
    const price = ECONOMIE.prix[sticker.rarete];
    showSheet(`
      <div class="sheet-art album-mystery">${stickerArt(sticker, 110)}</div>
      <h3>Sticker mystère</h3>
      ${tag}
      <p class="text-center mt-10">Pas encore trouvé ! Il se cache dans les coffres, ou à la boutique pour ${price} ⭐.</p>
      <div class="sheet-actions">
        <button class="btn btn-ghost" onclick="closeSheet()">Fermer</button>
        <button class="btn btn-primary" onclick="closeSheet(); askBuySticker('${stickerId}')">🛍️ L'acheter</button>
      </div>
    `);
    return;
  }

  const free = Storage.getFreeCount(stickerId, eco);
  const placed = count - free;
  const where = placed === 0
    ? 'Pas encore collé dans ton palais.'
    : `${placed} collé${placed > 1 ? 's' : ''} dans ton palais${free > 0 ? `, ${free} dans ton sac` : ''}.`;
  showSheet(`
    <div class="sheet-art">${stickerArt(sticker, 110)}</div>
    <h3>${escapeText(sticker.nom)}${count > 1 ? ` ×${count}` : ''}</h3>
    ${tag}
    <p class="text-center mt-10">${where}</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Fermer</button>
      ${free > 0 ? '<button class="btn btn-primary" onclick="closeSheet(); showPalaisScreen()">🏠 Le coller</button>' : ''}
    </div>
  `);
}
