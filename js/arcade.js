// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Salle de jeux : de vrais jeux, gagnés avec les étoiles
// ═══════════════════════════════════════════════════════════════
// Serpent, Blocs (tetris) et Bonbons (match-3). Un jeu se débloque une
// fois, puis chaque partie coûte un jeton (ARCADE dans data/lieux.js).
// Les jeux ne rapportent pas d'étoiles ; ils gardent le record de l'enfant.
// Tout est dessiné par le code (canvas ou DOM), le kawaii principal joue
// dedans. Rangé dans economy.arcade = { unlocked, records, parties }.
// Chargé après js/app.js.

const Arcade = {
  current: null,   // moteur de la partie en cours : { stop() }
  jeuId: null,
  run: 0,          // numéro de partie : les minuteries d'une partie quittée ne font rien

  state() {
    const a = Storage.getEconomy().arcade || {};
    return { unlocked: a.unlocked || [], records: a.records || {}, parties: a.parties || 0 };
  },

  save(arcade) {
    const eco = Storage.getEconomy();
    eco.arcade = arcade;
    Storage.saveEconomy(eco);
  },

  jeu(id) {
    return ARCADE.jeux.find(j => j.id === id) || null;
  },

  isUnlocked(id) {
    return this.state().unlocked.includes(id);
  },

  record(id) {
    return this.state().records[id] || 0;
  },

  // ── Débloquer et jouer ──

  askUnlock(id) {
    const jeu = this.jeu(id);
    if (!jeu || this.isUnlocked(id)) return;
    const eco = Storage.getEconomy();
    if (eco.stars < jeu.prix) {
      showSheet(`
        <div class="sheet-art arcade-sheet-emoji">${jeu.emoji}</div>
        <h3>${jeu.nom}</h3>
        <p class="text-center">Il te manque ${jeu.prix - eco.stars} ⭐ pour débloquer ce jeu. Continue à t'entraîner !</p>
        <div class="sheet-actions"><button class="btn btn-primary" onclick="closeSheet()">D'accord</button></div>
      `);
      return;
    }
    const jeton = ARCADE.prixJeton > 0 ? ` Ensuite, chaque partie coûte ${ARCADE.prixJeton} ⭐.` : '';
    showSheet(`
      <div class="sheet-art arcade-sheet-emoji">${jeu.emoji}</div>
      <h3>${jeu.nom}</h3>
      <p class="text-center">${escapeText(jeu.desc)}</p>
      <p class="text-center mt-10">Débloquer pour ${jeu.prix} ⭐ ? Il te restera ${eco.stars - jeu.prix} ⭐.${jeton}</p>
      <div class="sheet-actions">
        <button class="btn btn-ghost" onclick="closeSheet()">Non</button>
        <button class="btn btn-primary" onclick="Arcade.unlock('${id}')">Oui, je débloque !</button>
      </div>
    `);
  },

  unlock(id) {
    closeSheet();
    const jeu = this.jeu(id);
    if (!jeu || this.isUnlocked(id) || !Storage.spendStars(jeu.prix)) return;
    const arcade = this.state();
    arcade.unlocked.push(id);
    this.save(arcade);
    playChestSound();
    launchConfetti();
    showFeedback(`${jeu.nom} : débloqué ! 🕹️`, 'success');
    if (AppState.currentScreen === 'shop') showShopScreen();
    else showArcadeScreen();
  },

  askPlay(id) {
    const jeu = this.jeu(id);
    if (!jeu || !this.isUnlocked(id)) return;
    const prix = ARCADE.prixJeton;
    if (prix <= 0) {
      this.play(id);
      return;
    }
    const eco = Storage.getEconomy();
    if (eco.stars < prix) {
      showSheet(`
        <div class="sheet-art arcade-sheet-emoji">🎟️</div>
        <h3>Plus assez d'étoiles</h3>
        <p class="text-center">Une partie coûte ${prix} ⭐ et il t'en reste ${eco.stars}. Va t'entraîner un peu, et reviens jouer !</p>
        <div class="sheet-actions"><button class="btn btn-primary" onclick="closeSheet()">D'accord</button></div>
      `);
      return;
    }
    showSheet(`
      <div class="sheet-art arcade-sheet-emoji">${jeu.emoji}</div>
      <h3>${jeu.nom}</h3>
      <p class="text-center">Une partie pour ${prix} ⭐ ? Il te restera ${eco.stars - prix} ⭐.</p>
      <div class="sheet-actions">
        <button class="btn btn-ghost" onclick="closeSheet()">Non</button>
        <button class="btn btn-primary" onclick="Arcade.play('${id}')">🎟️ C'est parti !</button>
      </div>
    `);
  },

  play(id) {
    closeSheet();
    const jeu = this.jeu(id);
    if (!jeu || !this.isUnlocked(id)) return;
    if (ARCADE.prixJeton > 0 && !Storage.spendStars(ARCADE.prixJeton)) return;
    const arcade = this.state();
    arcade.parties++;
    this.save(arcade);

    this.stop();
    this.run++;
    this.jeuId = id;
    if (AppState.currentScreen !== 'arcade') showScreen('arcade');
    initAudio();

    const main = Storage.getTeam().main;
    const content = document.getElementById('arcade-content');
    content.innerHTML = `
      <div class="arcade-stage" id="arcade-stage">
        <div class="arcade-top">
          <span class="arcade-title">${jeu.emoji} ${jeu.nom}</span>
          <span class="arcade-score">Score <b id="arcade-score">0</b></span>
          <span class="arcade-record">Record ${this.record(id)}</span>
          <div class="quiz-buddy${main ? '' : ' hidden'}" id="arcade-buddy">${main ? Kawaii.draw(main, 58, { alive: true, mood: 'jour' }) : ''}</div>
        </div>
        <div class="arcade-board" id="arcade-board"></div>
        <div class="arcade-controls" id="arcade-controls"></div>
      </div>
    `;
    window.scrollTo(0, 0);

    const run = this.run;
    const api = {
      board: document.getElementById('arcade-board'),
      controls: document.getElementById('arcade-controls'),
      main,
      score: (n) => {
        const el = document.getElementById('arcade-score');
        if (el) el.textContent = n;
      },
      cheer: () => Kawaii.react(document.getElementById('arcade-buddy'), 'bravo'),
      end: (score) => { if (run === this.run) this.endGame(score); },
      alive: () => run === this.run && AppState.currentScreen === 'arcade',
      sfx: ArcadeSfx
    };
    const engines = { serpent: createSerpent, blocs: createBlocs, bonbons: createBonbons };
    this.current = engines[id](api);
  },

  stop() {
    if (this.current) {
      try { this.current.stop(); } catch (e) { }
      this.current = null;
    }
  },

  endGame(score) {
    this.stop();
    const id = this.jeuId;
    const jeu = this.jeu(id);
    const arcade = this.state();
    const before = arcade.records[id] || 0;
    const isRecord = score > before;
    if (isRecord) {
      arcade.records[id] = score;
      this.save(arcade);
    }
    const buddy = document.getElementById('arcade-buddy');
    if (isRecord && score > 0) {
      launchConfetti();
      playChestSound();
      setTimeout(() => Kawaii.react(buddy, 'pirouette'), 300);
    } else {
      Kawaii.react(buddy, 'oups');
    }

    const stage = document.getElementById('arcade-stage');
    if (!stage) return;
    const canReplay = this.isUnlocked(id) && (ARCADE.prixJeton <= 0 || Storage.getEconomy().stars >= ARCADE.prixJeton);
    const replay = ARCADE.prixJeton > 0 ? `🎟️ Rejouer (${ARCADE.prixJeton} ⭐)` : '🔁 Rejouer';
    const overlay = document.createElement('div');
    overlay.className = 'arcade-over';
    overlay.innerHTML = `
      <div class="arcade-over-card">
        <div class="arcade-over-emoji">${isRecord && score > 0 ? '🏆' : jeu.emoji}</div>
        <h2>${isRecord && score > 0 ? 'Nouveau record !' : 'Partie terminée'}</h2>
        <p class="arcade-over-score">${score}</p>
        <p class="result-sub">${isRecord && score > 0 ? (before > 0 ? `Ton ancien record : ${before}` : 'Ton premier record !') : `Ton record : ${before}`}</p>
        <div class="result-actions">
          <button class="btn btn-primary btn-big" onclick="Arcade.askPlay('${id}')"${canReplay ? '' : ' disabled'}>${replay}</button>
          <button class="btn btn-ghost" onclick="showArcadeScreen()">🕹️ Salle de jeux</button>
        </div>
      </div>
    `;
    stage.appendChild(overlay);
  },

  // Bouton retour : on ne quitte pas une partie sans prévenir
  quit() {
    if (!this.current) {
      showScreen('home');
      return;
    }
    showSheet(`
      <h3>Arrêter la partie ?</h3>
      <p class="text-center">Le score ne sera pas gardé.</p>
      <div class="sheet-actions">
        <button class="btn btn-ghost" onclick="closeSheet()">Je continue</button>
        <button class="btn btn-secondary" onclick="closeSheet(); Arcade.stop(); showArcadeScreen()">Arrêter</button>
      </div>
    `);
  }
};

// Petits sons des jeux, synthétisés comme les autres
const ArcadeSfx = {
  miam:  () => { playTone(659.25, 0, 0.09, 0.12); playTone(880, 0.07, 0.12, 0.1); },
  pose:  () => playTone(261.63, 0, 0.08, 0.1),
  ligne: (n) => [523.25, 659.25, 783.99, 1046.5].slice(0, Math.max(1, n)).forEach((f, i) => playTone(f, i * 0.06, 0.18, 0.12)),
  pop:   (k = 0) => playTone(600 + k * 120, 0, 0.12, 0.1),
  raté:  () => playTone(220, 0, 0.16, 0.1),
  fin:   () => { playTone(392, 0, 0.18, 0.12); playTone(330, 0.16, 0.18, 0.12); playTone(262, 0.32, 0.36, 0.12); }
};

// Image d'un kawaii pour les dessins sur canvas
function kawaiiImage(config, size) {
  const svg = Kawaii.draw({ ...Kawaii.DEFAULT_CONFIG, ...config, bg: 'aucun' }, size)
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img;
}

// Couleur de pelage du kawaii (pour le corps du serpent)
function kawaiiFurColor(config) {
  const ch = Kawaii.CHARS.find(c => c.id === config.char) || Kawaii.CHARS[0];
  const fur = Kawaii.FURS.find(f => f.id === config.fur);
  return (fur && fur.c) || ch.fur;
}

// Canvas net sur écran Retina ; retourne { canvas, ctx } en unités CSS
function makeCanvas(host, width, height) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.className = 'arcade-canvas';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Glissements du doigt sur un élément : onSwipe('gauche'|'droite'|'haut'|'bas'), onTap()
function swipes(el, onSwipe, onTap) {
  let start = null;
  el.addEventListener('pointerdown', (e) => {
    start = { x: e.clientX, y: e.clientY, t: Date.now() };
    e.preventDefault();
  });
  const end = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
      if (onTap) onTap();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'droite' : 'gauche');
    else onSwipe(dy > 0 ? 'bas' : 'haut');
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', () => { start = null; });
}

// Bouton de manette : appui = action tout de suite, maintenu = répétition
function padButton(label, aria, onPress, { repeat = 0 } = {}) {
  const b = document.createElement('button');
  b.className = 'pad-btn';
  b.innerHTML = label;
  b.setAttribute('aria-label', aria);
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; };
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onPress();
    if (repeat) {
      stop();
      timer = setInterval(onPress, repeat);
    }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, stop));
  return b;
}

// ───────────────────────────────────────────────────────────────
// SERPENT
// ───────────────────────────────────────────────────────────────

function createSerpent(api) {
  const COLS = 13;
  const ROWS = 17;
  const maxW = Math.min(api.board.clientWidth || 400, 440);
  const cell = Math.floor(Math.min(maxW / COLS, (window.innerHeight * 0.55) / ROWS));
  const W = cell * COLS;
  const H = cell * ROWS;
  const { canvas, ctx } = makeCanvas(api.board, W, H);

  const main = api.main || Kawaii.DEFAULT_CONFIG;
  const ch = Kawaii.CHARS.find(c => c.id === main.char) || Kawaii.CHARS[0];
  const foods = ch.objets || ['⭐'];
  const bodyColor = kawaiiFurColor(main);
  const head = kawaiiImage(main, 120);

  let snake = [{ x: 6, y: 9 }, { x: 5, y: 9 }, { x: 4, y: 9 }];
  let dir = { x: 1, y: 0 };
  const queue = [];
  let food = null;
  let score = 0;
  let interval = 230;
  let timer = null;
  let over = false;

  function placeFood() {
    const free = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
      }
    }
    const spot = free[Math.floor(Math.random() * free.length)];
    food = { ...spot, emoji: foods[Math.floor(Math.random() * foods.length)] };
  }

  function turn(d) {
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (d.x === -last.x && d.y === -last.y) return; // pas de demi-tour
    if (d.x === last.x && d.y === last.y) return;
    if (queue.length < 2) queue.push(d);
  }

  function step() {
    if (queue.length) dir = queue.shift();
    const next = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const hitWall = next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS;
    const hitSelf = snake.some((s, i) => i < snake.length - 1 && s.x === next.x && s.y === next.y);
    if (hitWall || hitSelf) {
      finish();
      return;
    }
    snake.unshift(next);
    if (food && next.x === food.x && next.y === food.y) {
      score++;
      api.score(score);
      api.sfx.miam();
      if (score % 5 === 0) api.cheer();
      placeFood();
      interval = Math.max(105, interval - 6);
      clearInterval(timer);
      timer = setInterval(tick, interval);
    } else {
      snake.pop();
    }
    draw();
  }

  function tick() {
    if (!api.alive()) { stop(); return; }
    step();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Damier doux
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#FFF6FA' : '#FBEFF6';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    // Nourriture
    if (food) {
      ctx.font = `${Math.round(cell * 0.72)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(food.emoji, food.x * cell + cell / 2, food.y * cell + cell / 2 + 1);
    }
    // Corps : segments reliés, contour sombre comme les kawaii
    const pad = cell * 0.1;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3A2B3F';
    ctx.fillStyle = bodyColor;
    for (let i = snake.length - 1; i >= 1; i--) {
      const s = snake[i];
      const p = snake[i - 1];
      const x0 = Math.min(s.x, p.x) * cell + pad;
      const y0 = Math.min(s.y, p.y) * cell + pad;
      const w = (Math.abs(s.x - p.x) + 1) * cell - pad * 2;
      const h = (Math.abs(s.y - p.y) + 1) * cell - pad * 2;
      roundRect(ctx, x0, y0, w, h, cell * 0.32);
      ctx.fill();
      ctx.stroke();
    }
    // Tête : le kawaii
    const hd = snake[0];
    const size = cell * 1.55;
    if (head.complete && head.naturalWidth) {
      ctx.drawImage(head, hd.x * cell + cell / 2 - size / 2, hd.y * cell + cell / 2 - size / 2 - cell * 0.08, size, size);
    } else {
      roundRect(ctx, hd.x * cell + pad, hd.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.32);
      ctx.fill();
      ctx.stroke();
    }
  }

  function finish() {
    if (over) return;
    over = true;
    clearInterval(timer);
    api.sfx.fin();
    draw();
    setTimeout(() => api.end(score), 400);
  }

  function stop() {
    over = true;
    clearInterval(timer);
    document.removeEventListener('keydown', onKey);
  }

  const DIRS = { gauche: { x: -1, y: 0 }, droite: { x: 1, y: 0 }, haut: { x: 0, y: -1 }, bas: { x: 0, y: 1 } };
  swipes(canvas, d => turn(DIRS[d]));

  function onKey(e) {
    const map = { ArrowLeft: 'gauche', ArrowRight: 'droite', ArrowUp: 'haut', ArrowDown: 'bas' };
    if (map[e.key]) { e.preventDefault(); turn(DIRS[map[e.key]]); }
  }
  document.addEventListener('keydown', onKey);

  // Croix directionnelle
  const pad = document.createElement('div');
  pad.className = 'dpad';
  pad.appendChild(padButton('▲', 'Haut', () => turn(DIRS.haut)));
  const row = document.createElement('div');
  row.className = 'dpad-row';
  row.appendChild(padButton('◀', 'Gauche', () => turn(DIRS.gauche)));
  row.appendChild(padButton('▶', 'Droite', () => turn(DIRS.droite)));
  pad.appendChild(row);
  pad.appendChild(padButton('▼', 'Bas', () => turn(DIRS.bas)));
  api.controls.appendChild(pad);
  const hint = document.createElement('p');
  hint.className = 'hint text-center';
  hint.textContent = 'Glisse le doigt sur le jeu, ou appuie sur les flèches';
  api.controls.appendChild(hint);

  placeFood();
  draw();
  head.onload = draw;
  timer = setInterval(tick, interval);
  return { stop };
}

// ───────────────────────────────────────────────────────────────
// BLOCS (tetris)
// ───────────────────────────────────────────────────────────────

function createBlocs(api) {
  const COLS = 10;
  const ROWS = 16;
  const maxW = Math.min(api.board.clientWidth || 400, 360);
  const cell = Math.floor(Math.min(maxW / COLS, (window.innerHeight * 0.55) / ROWS));
  const W = cell * COLS;
  const H = cell * ROWS;

  const wrap = document.createElement('div');
  wrap.className = 'blocs-wrap';
  api.board.appendChild(wrap);
  const { canvas, ctx } = makeCanvas(wrap, W, H);
  const side = document.createElement('div');
  side.className = 'blocs-side';
  side.innerHTML = '<div class="blocs-label">Suivant</div>';
  wrap.appendChild(side);
  const preview = makeCanvas(side, cell * 4, cell * 4);
  const lines = document.createElement('div');
  lines.className = 'blocs-lines';
  side.appendChild(lines);

  const PIECES = {
    I: { c: '#5FD3CE', s: [[0, 1], [1, 1], [2, 1], [3, 1]] },
    O: { c: '#FFD466', s: [[1, 0], [2, 0], [1, 1], [2, 1]] },
    T: { c: '#B48CDB', s: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    S: { c: '#7ED99A', s: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    Z: { c: '#FF8A80', s: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    J: { c: '#7FB3F5', s: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    L: { c: '#F2A26A', s: [[2, 0], [0, 1], [1, 1], [2, 1]] }
  };
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let bag = [];
  let piece = null;
  let next = null;
  let score = 0;
  let cleared = 0;
  let timer = null;
  let over = false;

  function fromBag() {
    if (bag.length === 0) bag = shuffleArray(Object.keys(PIECES));
    const k = bag.pop();
    return { k, c: PIECES[k].c, cells: PIECES[k].s.map(([x, y]) => [x, y]), x: 3, y: -1 };
  }

  function fits(p, dx = 0, dy = 0, cells = p.cells) {
    return cells.every(([x, y]) => {
      const gx = p.x + x + dx;
      const gy = p.y + y + dy;
      return gx >= 0 && gx < COLS && gy < ROWS && (gy < 0 || !grid[gy][gx]);
    });
  }

  function spawn() {
    piece = next || fromBag();
    next = fromBag();
    drawPreview();
    if (!fits(piece)) {
      piece = null;
      finish();
    }
  }

  function level() {
    return Math.floor(cleared / 8);
  }

  function speed() {
    return Math.max(120, 700 - level() * 70);
  }

  function move(dx) {
    if (!piece || over) return;
    if (fits(piece, dx, 0)) { piece.x += dx; draw(); }
  }

  function rotate() {
    if (!piece || over || piece.k === 'O') return;
    const size = piece.k === 'I' ? 4 : 3;
    const cells = piece.cells.map(([x, y]) => [size - 1 - y, x]);
    for (const dx of [0, -1, 1, -2, 2]) {
      if (fits(piece, dx, 0, cells)) {
        piece.cells = cells;
        piece.x += dx;
        draw();
        return;
      }
    }
  }

  function softDrop() {
    if (!piece || over) return;
    if (fits(piece, 0, 1)) { piece.y++; score++; api.score(score); draw(); }
    else lock();
  }

  function hardDrop() {
    if (!piece || over) return;
    let n = 0;
    while (fits(piece, 0, 1)) { piece.y++; n++; }
    score += n * 2;
    api.score(score);
    lock();
  }

  function lock() {
    if (!piece) return;
    let outside = false;
    piece.cells.forEach(([x, y]) => {
      const gy = piece.y + y;
      if (gy < 0) outside = true;
      else grid[gy][piece.x + x] = piece.c;
    });
    piece = null;
    if (outside) {
      finish();
      return;
    }
    const full = [];
    for (let y = 0; y < ROWS; y++) if (grid[y].every(Boolean)) full.push(y);
    if (full.length) {
      cleared += full.length;
      score += [0, 100, 300, 500, 800][full.length] * (level() + 1);
      api.score(score);
      api.sfx.ligne(full.length);
      if (full.length >= 2) api.cheer();
      lines.textContent = `${cleared} ligne${cleared > 1 ? 's' : ''} · vitesse ${level() + 1}`;
      // Flash des lignes puis chute
      draw(full);
      full.forEach(y => { grid.splice(y, 1); grid.unshift(Array(COLS).fill(null)); });
      restart();
      setTimeout(() => { if (!over) { spawn(); draw(); } }, 160);
      return;
    }
    api.sfx.pose();
    spawn();
    draw();
  }

  function tick() {
    if (!api.alive()) { stop(); return; }
    if (!piece) return;
    if (fits(piece, 0, 1)) piece.y++;
    else lock();
    draw();
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(tick, speed());
  }

  // Un bloc arrondi avec son reflet ; ghost = ombre de la pièce (sans reflet)
  function block(c, x, y, size, color, ghost = false) {
    const g = size * 0.08;
    c.fillStyle = ghost ? 'rgba(58,43,63,0.10)' : color;
    c.strokeStyle = ghost ? 'rgba(58,43,63,0.15)' : '#3A2B3F';
    roundRect(c, x + g, y + g, size - g * 2, size - g * 2, size * 0.22);
    c.fill();
    c.stroke();
    if (ghost) return;
    c.fillStyle = 'rgba(255,255,255,0.45)';
    roundRect(c, x + size * 0.22, y + size * 0.18, size * 0.28, size * 0.16, size * 0.08);
    c.fill();
  }

  function draw(flash = []) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#FBEFF6';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(58,43,63,0.06)';
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, H); ctx.stroke(); }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * cell); ctx.lineTo(W, y * cell); ctx.stroke(); }
    ctx.lineWidth = 2;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!grid[y][x]) continue;
        block(ctx, x * cell, y * cell, cell, flash.includes(y) ? '#FFFFFF' : grid[y][x]);
      }
    }
    if (piece) {
      // Ombre : où la pièce va tomber
      let dy = 0;
      while (fits(piece, 0, dy + 1)) dy++;
      piece.cells.forEach(([x, y]) => {
        if (piece.y + y + dy >= 0) block(ctx, (piece.x + x) * cell, (piece.y + y + dy) * cell, cell, null, true);
      });
      piece.cells.forEach(([x, y]) => {
        if (piece.y + y >= 0) block(ctx, (piece.x + x) * cell, (piece.y + y) * cell, cell, piece.c);
      });
    }
  }

  function drawPreview() {
    const c = preview.ctx;
    c.clearRect(0, 0, cell * 4, cell * 4);
    if (!next) return;
    c.lineWidth = 2;
    const w = Math.max(...next.cells.map(([x]) => x)) + 1;
    const h = Math.max(...next.cells.map(([, y]) => y)) + 1;
    const ox = (4 - w) / 2;
    const oy = (4 - h) / 2;
    next.cells.forEach(([x, y]) => block(c, (x + ox) * cell, (y + oy) * cell, cell, next.c));
  }

  function finish() {
    if (over) return;
    over = true;
    clearInterval(timer);
    api.sfx.fin();
    draw();
    setTimeout(() => api.end(score), 400);
  }

  function stop() {
    over = true;
    clearInterval(timer);
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    const actions = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowUp: rotate, ArrowDown: softDrop, ' ': hardDrop };
    if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
  }
  document.addEventListener('keydown', onKey);

  // Sur le jeu : glisser à gauche/droite déplace, taper tourne, glisser en bas laisse tomber
  swipes(canvas, (d) => {
    if (d === 'gauche') move(-1);
    else if (d === 'droite') move(1);
    else if (d === 'bas') hardDrop();
    else rotate();
  }, rotate);

  const pad = document.createElement('div');
  pad.className = 'pad-row';
  pad.appendChild(padButton('◀', 'Gauche', () => move(-1), { repeat: 130 }));
  pad.appendChild(padButton('↻', 'Tourner', rotate));
  pad.appendChild(padButton('▶', 'Droite', () => move(1), { repeat: 130 }));
  pad.appendChild(padButton('▼', 'Descendre', softDrop, { repeat: 60 }));
  pad.appendChild(padButton('⤓', 'Laisser tomber', hardDrop));
  api.controls.appendChild(pad);
  const hint = document.createElement('p');
  hint.className = 'hint text-center';
  hint.textContent = 'Tape sur le jeu pour tourner, glisse pour déplacer ou laisser tomber';
  api.controls.appendChild(hint);

  lines.textContent = '0 ligne · vitesse 1';
  spawn();
  draw();
  restart();
  return { stop };
}

// ───────────────────────────────────────────────────────────────
// BONBONS (match-3)
// ───────────────────────────────────────────────────────────────

function createBonbons(api) {
  const N = 7;
  const TYPES = ['🍓', '🍬', '🍭', '🧁', '🍩', '🍪'];
  const MOVES = 20;
  const size = Math.floor(Math.min(api.board.clientWidth || 400, 440) / N);

  const board = document.createElement('div');
  board.className = 'candy-board';
  board.style.width = `${size * N}px`;
  board.style.height = `${size * N}px`;
  api.board.appendChild(board);

  const status = document.createElement('div');
  status.className = 'candy-status';
  api.controls.appendChild(status);

  const grid = Array.from({ length: N }, () => Array(N).fill(null)); // { t, el }
  let moves = MOVES;
  let score = 0;
  let busy = true;
  let over = false;
  let selected = null;
  let hintTimer = null;
  let hinted = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function put(el, r, c) {
    el.style.transform = `translate(${c * size}px, ${r * size}px)`;
    el.dataset.r = r;
    el.dataset.c = c;
  }

  function make(t, r, c, fromAbove = 0) {
    const el = document.createElement('div');
    el.className = 'candy';
    el.style.width = el.style.height = `${size}px`;
    el.style.fontSize = `${Math.round(size * 0.62)}px`;
    // L'emoji dans un enfant : ses effets (grossir, tourner, disparaître) ne
    // se mélangent pas à la translation de la case
    el.innerHTML = `<span>${t}</span>`;
    if (fromAbove) {
      put(el, r - fromAbove, c);
      board.appendChild(el);
      void el.offsetWidth;
    } else {
      board.appendChild(el);
    }
    put(el, r, c);
    return { t, el };
  }

  function randomType(r, c) {
    // Pas de trio au départ
    let t;
    do {
      t = TYPES[Math.floor(Math.random() * TYPES.length)];
    } while (
      (c >= 2 && grid[r][c - 1] && grid[r][c - 2] && grid[r][c - 1].t === t && grid[r][c - 2].t === t) ||
      (r >= 2 && grid[r - 1][c] && grid[r - 2][c] && grid[r - 1][c].t === t && grid[r - 2][c].t === t)
    );
    return t;
  }

  function findMatches() {
    const hit = new Set();
    const runs = [];
    const scan = (get, key) => {
      for (let a = 0; a < N; a++) {
        let start = 0;
        for (let b = 1; b <= N; b++) {
          if (b < N && get(a, b) && get(a, start) && get(a, b).t === get(a, start).t) continue;
          if (b - start >= 3) {
            runs.push(b - start);
            for (let k = start; k < b; k++) hit.add(key(a, k));
          }
          start = b;
        }
      }
    };
    scan((r, c) => grid[r][c], (r, c) => `${r},${c}`);
    scan((c, r) => grid[r][c], (c, r) => `${r},${c}`);
    return { hit: [...hit].map(k => k.split(',').map(Number)), runs };
  }

  function wouldMatch(r1, c1, r2, c2) {
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
    const ok = findMatches().hit.length > 0;
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
    return ok;
  }

  function anyMove() {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (c + 1 < N && wouldMatch(r, c, r, c + 1)) return [[r, c], [r, c + 1]];
        if (r + 1 < N && wouldMatch(r, c, r + 1, c)) return [[r, c], [r + 1, c]];
      }
    }
    return null;
  }

  async function reshuffle() {
    const types = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) types.push(grid[r][c].t);
    let tries = 0;
    do {
      shuffleArray(types);
      let i = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c].t = types[i++];
    } while ((findMatches().hit.length > 0 || !anyMove()) && tries++ < 200);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      grid[r][c].el.firstChild.textContent = grid[r][c].t;
      grid[r][c].el.classList.add('shuffled');
    }
    status.textContent = 'Plus de coup possible : on mélange !';
    await sleep(500);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c].el.classList.remove('shuffled');
  }

  async function resolve() {
    let cascade = 0;
    for (;;) {
      const { hit, runs } = findMatches();
      if (hit.length === 0) break;
      cascade++;
      score += hit.length * 10 * cascade + runs.filter(n => n >= 4).length * 30;
      api.score(score);
      api.sfx.pop(cascade);
      if (cascade >= 2 || hit.length >= 5) api.cheer();
      hit.forEach(([r, c]) => grid[r][c].el.classList.add('gone'));
      await sleep(220);
      if (!api.alive()) return;
      hit.forEach(([r, c]) => { grid[r][c].el.remove(); grid[r][c] = null; });
      // Chute colonne par colonne
      for (let c = 0; c < N; c++) {
        let write = N - 1;
        for (let r = N - 1; r >= 0; r--) {
          if (!grid[r][c]) continue;
          if (write !== r) {
            grid[write][c] = grid[r][c];
            grid[r][c] = null;
            put(grid[write][c].el, write, c);
          }
          write--;
        }
        let above = 1;
        for (let r = write; r >= 0; r--) {
          grid[r][c] = make(TYPES[Math.floor(Math.random() * TYPES.length)], r, c, write + 1 + above);
          above++;
        }
      }
      await sleep(300);
      if (!api.alive()) return;
    }
  }

  async function trySwap(a, b) {
    if (busy || over) return;
    const [r1, c1] = a;
    const [r2, c2] = b;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
    busy = true;
    clearSelection();
    const A = grid[r1][c1];
    const B = grid[r2][c2];
    grid[r1][c1] = B;
    grid[r2][c2] = A;
    put(A.el, r2, c2);
    put(B.el, r1, c1);
    await sleep(200);
    if (!api.alive()) return;
    if (findMatches().hit.length === 0) {
      grid[r1][c1] = A;
      grid[r2][c2] = B;
      put(A.el, r1, c1);
      put(B.el, r2, c2);
      api.sfx.raté();
      await sleep(200);
      busy = false;
      armHint();
      return;
    }
    moves--;
    updateStatus();
    await resolve();
    if (!api.alive()) return;
    if (moves <= 0) {
      finish();
      return;
    }
    if (!anyMove()) await reshuffle();
    updateStatus();
    busy = false;
    armHint();
  }

  function updateStatus() {
    status.innerHTML = `<span class="candy-moves">${moves}</span> coup${moves > 1 ? 's' : ''} restant${moves > 1 ? 's' : ''}`;
  }

  function clearSelection() {
    if (selected) grid[selected[0]][selected[1]] && grid[selected[0]][selected[1]].el.classList.remove('selected');
    selected = null;
  }

  function clearHint() {
    clearTimeout(hintTimer);
    hinted.forEach(el => el.classList.remove('hint-wiggle'));
    hinted = [];
  }

  // Sans rien faire pendant un moment : deux bonbons à échanger se dandinent
  function armHint() {
    clearHint();
    hintTimer = setTimeout(() => {
      if (busy || over || !api.alive()) return;
      const m = anyMove();
      if (!m) return;
      hinted = m.map(([r, c]) => grid[r][c].el);
      hinted.forEach(el => el.classList.add('hint-wiggle'));
    }, 6000);
  }

  // Toucher : taper deux bonbons voisins, ou glisser un bonbon vers son voisin
  let drag = null;
  board.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.candy');
    if (!el || busy || over) return;
    e.preventDefault();
    drag = { r: +el.dataset.r, c: +el.dataset.c, x: e.clientX, y: e.clientY, moved: false };
    clearHint();
  });
  board.addEventListener('pointermove', (e) => {
    if (!drag || drag.moved) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) < size * 0.35 && Math.abs(dy) < size * 0.35) return;
    drag.moved = true;
    const target = Math.abs(dx) > Math.abs(dy)
      ? [drag.r, drag.c + (dx > 0 ? 1 : -1)]
      : [drag.r + (dy > 0 ? 1 : -1), drag.c];
    if (target[0] < 0 || target[1] < 0 || target[0] >= N || target[1] >= N) return;
    trySwap([drag.r, drag.c], target);
  });
  const release = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.moved || busy || over) return;
    // Simple appui : sélection, puis échange avec le voisin touché ensuite
    if (selected && Math.abs(selected[0] - d.r) + Math.abs(selected[1] - d.c) === 1) {
      trySwap(selected, [d.r, d.c]);
      return;
    }
    clearSelection();
    selected = [d.r, d.c];
    grid[d.r][d.c].el.classList.add('selected');
    armHint();
  };
  board.addEventListener('pointerup', release);
  board.addEventListener('pointercancel', () => { drag = null; });

  function finish() {
    if (over) return;
    over = true;
    clearHint();
    api.sfx.fin();
    setTimeout(() => api.end(score), 500);
  }

  function stop() {
    over = true;
    clearHint();
  }

  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = make(randomType(r, c), r, c);
  (async () => {
    if (!anyMove()) await reshuffle();
    updateStatus();
    busy = false;
    armHint();
  })();
  // hint() et check() : un coup possible et l'état de la grille, pour les tests
  const check = () => {
    let ok = document.querySelectorAll('.candy-board .candy').length === N * N;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell = grid[r][c];
      if (!cell || cell.el.style.transform !== `translate(${c * size}px, ${r * size}px)` || cell.el.textContent !== cell.t) ok = false;
    }
    return { ok, busy, moves, score };
  };
  return { stop, hint: anyMove, check };
}

// ───────────────────────────────────────────────────────────────
// ÉCRAN SALLE DE JEUX
// ───────────────────────────────────────────────────────────────

function showArcadeScreen() {
  Arcade.stop();
  showScreen('arcade');
  const content = document.getElementById('arcade-content');
  if (!content) return;
  const eco = Storage.getEconomy();
  const arcade = Arcade.state();
  const chip = document.getElementById('arcade-stars');
  if (chip) chip.textContent = `⭐ ${eco.stars}`;

  const jeton = ARCADE.prixJeton > 0 ? `Une partie coûte ${ARCADE.prixJeton} ⭐.` : 'Les parties sont gratuites.';
  let html = `<p class="intro">Des jeux à débloquer avec tes étoiles. ${jeton} Les étoiles, elles, se gagnent en apprenant !</p>`;
  html += '<div class="arcade-grid">';
  ARCADE.jeux.forEach(jeu => {
    const unlocked = arcade.unlocked.includes(jeu.id);
    const record = arcade.records[jeu.id] || 0;
    const canPlay = ARCADE.prixJeton <= 0 || eco.stars >= ARCADE.prixJeton;
    html += `
      <div class="arcade-card${unlocked ? ' unlocked' : ' locked'}">
        <div class="arcade-emoji">${jeu.emoji}</div>
        <div class="arcade-name">${jeu.nom}</div>
        <p class="arcade-desc">${escapeText(jeu.desc)}</p>
        ${unlocked
          ? `<div class="arcade-record-line">${record > 0 ? `🏆 Record : ${record}` : 'Pas encore de record'}</div>
             <button class="btn btn-primary" onclick="Arcade.askPlay('${jeu.id}')"${canPlay ? '' : ' disabled'}>▶️ Jouer${ARCADE.prixJeton > 0 ? ` · ${ARCADE.prixJeton} ⭐` : ''}</button>`
          : `<button class="btn ${eco.stars >= jeu.prix ? 'btn-secondary' : 'btn-ghost'}" onclick="Arcade.askUnlock('${jeu.id}')">🔒 Débloquer · ${jeu.prix} ⭐</button>`}
      </div>
    `;
  });
  html += '</div>';
  if (arcade.parties > 0) html += `<p class="hint text-center mt-20">🎟️ ${arcade.parties} partie${arcade.parties > 1 ? 's' : ''} jouée${arcade.parties > 1 ? 's' : ''}</p>`;
  content.innerHTML = html;
}
