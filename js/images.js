// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Images des leçons (IndexedDB)
// ═══════════════════════════════════════════════════════════════
// Les images des listes de révision sont trop lourdes pour le localStorage :
// elles vont dans IndexedDB (base `mp-images`, une entrée par image :
// { id → Blob JPEG }), redimensionnées à IMAGES.maxPx de côté.
// Une liste les retrouve par list.images = { n: id } ; le texte de la liste
// les place avec une ligne « [📷 n] ».
// Elles sont incluses dans le fichier de sauvegarde de l'espace parents,
// mais ne passent pas en ligne (sync) : sur un autre appareil, la leçon
// s'affiche sans son image.

const Images = (function () {

const BASE = 'mp-images';
const STORE = 'images';
let ouverture = null;
const urls = {}; // id → URL d'objet déjà créée

function base() {
  if (!ouverture) {
    ouverture = new Promise((resolve, reject) => {
      const req = indexedDB.open(BASE, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return ouverture;
}

// Une transaction ; fn(store) renvoie éventuellement une requête dont on veut le résultat
async function avec(mode, fn) {
  const db = await base();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
  });
}

// Fichier choisi → Blob JPEG d'au plus IMAGES.maxPx de côté
function reduire(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(src);
      const k = Math.min(1, IMAGES.maxPx / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * k));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * k));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; // fond blanc sous les PNG transparents
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Image illisible'))), 'image/jpeg', IMAGES.qualite);
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error('Image illisible'));
    };
    img.src = src;
  });
}

// Enregistre une photo choisie ; renvoie son id
async function enregistrer(file) {
  const blob = await reduire(file);
  const id = 'img' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  await avec('readwrite', s => { s.put(blob, id); });
  return id;
}

// URL affichable d'une image, ou null si elle n'est pas sur cet appareil
async function url(id) {
  if (!id) return null;
  if (urls[id]) return urls[id];
  try {
    const blob = await avec('readonly', s => s.get(id));
    if (!blob) return null;
    urls[id] = URL.createObjectURL(blob);
    return urls[id];
  } catch (e) {
    return null;
  }
}

async function supprimer(ids) {
  if (!ids.length) return;
  await avec('readwrite', s => { ids.forEach(id => s.delete(id)); });
  ids.forEach(id => {
    if (urls[id]) URL.revokeObjectURL(urls[id]);
    delete urls[id];
  });
}

// Ids des images utilisées par les listes
function utilisees() {
  const ids = new Set();
  Storage.getLists().forEach(l => Object.values(l.images || {}).forEach(id => ids.add(id)));
  return ids;
}

// Retire les images qu'aucune liste n'utilise plus
async function nettoyer() {
  try {
    const garder = utilisees();
    const toutes = await avec('readonly', s => s.getAllKeys());
    await supprimer((toutes || []).filter(id => !garder.has(id)));
  } catch (e) {
    console.warn('Nettoyage des images impossible', e);
  }
}

function enTexte(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// Sauvegarde : { id: 'data:image/jpeg;base64,…' } des images utilisées
async function exporter() {
  const sortie = {};
  try {
    for (const id of utilisees()) {
      const blob = await avec('readonly', s => s.get(id));
      if (blob) sortie[id] = await enTexte(blob);
    }
  } catch (e) {
    console.warn('Images non sauvegardées', e);
  }
  return sortie;
}

// Restauration : remplace les images par celles du fichier
async function importer(map) {
  const entrees = await Promise.all(Object.entries(map || {}).map(async ([id, data]) => [id, await (await fetch(data)).blob()]));
  await avec('readwrite', s => {
    s.clear();
    entrees.forEach(([id, blob]) => s.put(blob, id));
  });
}

return { enregistrer, url, supprimer, nettoyer, exporter, importer };
})();
