// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Créer ta maison
// ═══════════════════════════════════════════════════════════════
// L'enfant construit ses propres maisons (un modèle de data/monde.js, de 1 à
// 3 étages), puis les meuble avec les meubles de son inventaire. Une maison
// peut accueillir une liste (choix du lieu, à la création ou à l'édition) :
// chaque meuble posé porte alors un élément de la liste. S'il y a moins de
// meubles que d'éléments, un bandeau dit combien il en manque, et en
// attendant certains meubles portent plusieurs éléments.
// Aménager une maison (Scene.ouvrirAtelier) ne consomme pas de temps de jeu ;
// y coller des stickers se fait en jouant (🧸 Jouer), comme ailleurs.
// Données : localStorage `maisons` (Storage.getMaisons, js/app.js).

const Maisons = (function () {

const dessin = (m, taille) => {
  const b = Monde.lieuModele({ kind: 'maison', id: m.id });
  return `<svg viewBox="-110 -232 220 240" width="${taille}" height="${Math.round(taille * 1.09)}" aria-hidden="true">${Monde.facade(b, b.etages.length, 0, 0)}</svg>`;
};

// ── L'écran « Mes maisons » ──
function afficher() {
  showScreen('maisons');
  const box = document.getElementById('maisons-content');
  const maisons = Storage.getMaisons();
  const cartes = maisons.map(m => {
    const mod = Monde.modele(m.modele);
    const habitant = Storage.listeDeMaison(m.id);
    const n = m.objets.length;
    const manque = habitant ? Monde.objetsManquants(habitant) : 0;
    return `
      <div class="card maison-card">
        <div class="maison-dessin">${dessin(m, 110)}</div>
        <div class="maison-infos">
          <h3>${escapeText(m.nom)}</h3>
          <p class="list-meta">${escapeText(mod.nom)} · ${mod.etages.length} étage${mod.etages.length > 1 ? 's' : ''} · ${n} meuble${n > 1 ? 's' : ''}</p>
          <p class="list-meta">${habitant ? `🏠 Habitée par « ${escapeText(habitant.name)} »${manque ? ` · il manque ${manque} objet${manque > 1 ? 's' : ''}` : ''}` : 'Libre : choisis-la pour une liste'}</p>
          <div class="maison-actions">
            <button class="btn btn-primary" onclick="Maisons.amenager(${m.id})">🛠️ Aménager</button>
            <button class="btn-icon" onclick="Maisons.renommer(${m.id})" title="Renommer" aria-label="Renommer">✏️</button>
            <button class="btn-icon" onclick="Maisons.supprimer(${m.id})" title="Supprimer" aria-label="Supprimer">🗑️</button>
          </div>
        </div>
      </div>`;
  }).join('');
  box.innerHTML = `
    <p class="intro">Construis ta maison, meuble-la, puis choisis-la comme lieu d'une liste : chaque meuble portera un mot ou une question.</p>
    ${cartes || '<div class="empty-state"><div class="empty-icon">🏡</div>Tu n\'as pas encore de maison.</div>'}
    <button class="btn btn-success btn-block mt-20" onclick="Maisons.creer()">🏡 Construire une maison</button>`;
}

// ── Construire : le modèle, puis le nom ──
// onDone(id) : après la construction (par défaut, on va l'aménager)
let apres = null;

function creer(onDone) {
  apres = onDone || null;
  showSheet(`
    <h3>Quelle maison ?</h3>
    <div class="lieu-choix-grid">
      ${MODELES.map(mod => {
        const b = { id: 'm-' + mod.id, nom: mod.nom, couleurs: mod.couleurs, etages: mod.etages, embleme: null };
        return `<button type="button" class="lieu-choix" onclick="Maisons.choisirModele('${mod.id}')">
          <svg viewBox="-110 -232 220 240" width="92" height="100" aria-hidden="true">${Monde.facade(b, mod.etages.length, 0, 0)}</svg>
          <span>${escapeText(mod.nom)}<small>${mod.etages.length} étage${mod.etages.length > 1 ? 's' : ''}</small></span>
        </button>`;
      }).join('')}
    </div>
    <div class="sheet-actions"><button class="btn btn-ghost" onclick="closeSheet()">Annuler</button></div>
  `);
}

function choisirModele(id) {
  const mod = Monde.modele(id);
  askName('Comment s\'appelle ta maison ?', capitalizeFirst(mod.nom.replace(/^(la|le|les) /i, 'Ma ')), (nom) => {
    const m = Storage.addMaison(nom.slice(0, 30), id);
    playChestSound();
    showFeedback(`${m.nom} est construite ! 🏡`, 'success');
    const cb = apres;
    apres = null;
    if (cb) cb(m.id);
    else amenager(m.id);
  });
}

function amenager(id) {
  closeSheet();
  Scene.ouvrirAtelier(id);
}

function renommer(id) {
  const m = Storage.getMaison(id);
  if (!m) return;
  askName('Nouveau nom de la maison', m.nom, (nom) => {
    Storage.renameMaison(id, nom.slice(0, 30));
    afficher();
  });
}

function supprimer(id) {
  const m = Storage.getMaison(id);
  if (!m) return;
  const habitant = Storage.listeDeMaison(id);
  if (habitant) {
    showSheet(`
      <h3>${escapeText(m.nom)} est habitée</h3>
      <p class="text-center">La liste « ${escapeText(habitant.name)} » y est rangée. Change d'abord le lieu de cette liste (✏️ dans Mes listes).</p>
      <div class="sheet-actions"><button class="btn btn-primary" onclick="closeSheet()">D'accord</button></div>
    `);
    return;
  }
  showSheet(`
    <div class="sheet-art">${dessin(m, 110)}</div>
    <h3>Démolir ${escapeText(m.nom)} ?</h3>
    <p class="text-center">Ses meubles et ses stickers reviennent dans ton inventaire.</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" onclick="closeSheet()">Non</button>
      <button class="btn btn-secondary" onclick="closeSheet(); Maisons.confirmerSuppression(${id})">Oui, démolir</button>
    </div>
  `);
}

function confirmerSuppression(id) {
  Storage.deleteMaison(id);
  afficher();
}

return { afficher, creer, choisirModele, amenager, renommer, supprimer, confirmerSuppression };
})();
