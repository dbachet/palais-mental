// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Compte et sauvegarde en ligne (Supabase)
// ═══════════════════════════════════════════════════════════════
// L'app reste « locale d'abord » : elle lit et écrit dans le
// localStorage comme avant, et fonctionne sans réseau. Ce fichier
// recopie les données vers le compte, et ramène celles des autres
// appareils.
//
// - Un compte = un enfant = une ligne de la table `palaces`.
// - Connexion par code reçu par email (pas de lien : sur iPad un lien
//   s'ouvre dans Safari, pas dans l'app de l'écran d'accueil).
// - Aucune modification à faire dans app.js quand on écrit une donnée :
//   les clés de SYNC_KEYS sont comparées à leur dernière empreinte
//   connue toutes les 5 secondes.
// - Fusion clé par clé : chaque clé porte l'heure de son dernier
//   changement, la plus récente gagne. Deux appareils qui changent
//   des clés différentes ne s'écrasent pas.
// - L'écriture en ligne vérifie le numéro de version de la ligne :
//   si un autre appareil a écrit entre-temps, on relit et on refusionne.
// - Avant tout remplacement en bloc, une copie est gardée dans
//   `syncBackup` ; le serveur garde en plus une copie par jour (30 jours).

function createSync({ storage, fetchFn, config, now = () => Date.now(), device = '' }) {
  // Données de l'enfant, envoyées dans le compte
  const SYNC_KEYS = ['wordLists', 'economy', 'kawaiiTeam', 'maison', 'mixSelection', 'animationSpeed'];
  // Clés techniques de ce fichier : jamais envoyées, jamais exportées
  const LOCAL_ONLY_KEYS = ['syncSession', 'syncMeta', 'syncBackup'];

  const TICK_MS = 5000;            // comparaison des données locales
  const PUSH_EVERY_MS = 15000;     // pas plus d'un envoi toutes les 15 s pendant une session
  const PULL_EVERY_MS = 300000;    // relecture du compte toutes les 5 min
  const KEEPALIVE_MAX = 60000;     // au-delà, le navigateur refuse keepalive

  const configured = !!(config && config.url && config.key);
  const baseUrl = configured ? config.url.replace(/\/+$/, '') : '';

  let session = readJSON('syncSession');
  let meta = readJSON('syncMeta') || freshMeta(null, null);
  let syncing = null;
  let refreshing = null;
  let leaving = false;
  let failures = 0;
  let nextAttemptAt = 0;
  let lastPushAt = 0;
  let lastPullAt = 0;
  let lastError = null;

  const api = {
    SYNC_KEYS,
    LOCAL_ONLY_KEYS,
    configured,
    onChange: null,      // l'état affiché a changé
    onRemoteData: null,  // des données d'un autre appareil viennent d'être écrites ici
    state,
    requestCode,
    verifyCode,
    resolveChoice,
    retryFirstSync: settleFirstSync,
    syncNow,
    logout,
    start
  };

  // ─────────────────────────────────────────────────────────────
  // Rangement local
  // ─────────────────────────────────────────────────────────────

  function readJSON(key) {
    try {
      return JSON.parse(storage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  function freshMeta(userId, email) {
    // keys : { clé: { h: empreinte, t: heure du dernier changement } }
    return { userId, email, version: 0, keys: {}, dirty: false, lastSyncAt: 0, pendingChoice: null };
  }

  function saveMeta() {
    storage.setItem('syncMeta', JSON.stringify(meta));
  }

  function setSession(data) {
    if (!data) {
      session = null;
      storage.removeItem('syncSession');
      return;
    }
    session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(now() / 1000) + (data.expires_in || 3600),
      user: { id: data.user.id, email: data.user.email }
    };
    storage.setItem('syncSession', JSON.stringify(session));
  }

  // Copie de secours avant un remplacement en bloc (une par raison)
  function backup(reason, values) {
    const all = readJSON('syncBackup') || {};
    all[reason] = { at: new Date(now()).toISOString(), data: values };
    try {
      storage.setItem('syncBackup', JSON.stringify(all));
    } catch (e) {
      // Stockage plein : la copie quotidienne du serveur reste disponible
    }
  }

  function localValues() {
    const values = {};
    SYNC_KEYS.forEach(key => {
      const value = storage.getItem(key);
      if (value !== null) values[key] = value;
    });
    return values;
  }

  function remoteValues(data) {
    const values = {};
    SYNC_KEYS.forEach(key => {
      if (data[key] && typeof data[key].v === 'string') values[key] = data[key].v;
    });
    return values;
  }

  // Résumé affiché quand il faut choisir entre l'appareil et le compte
  function summarize(values) {
    let lists = 0;
    let stars = 0;
    try {
      lists = JSON.parse(values.wordLists || '[]').length;
      const eco = JSON.parse(values.economy || '{}');
      stars = eco.stars || 0;
      if (!stars && eco.totalEarned) stars = eco.totalEarned;
    } catch (e) {
    }
    return { lists, stars };
  }

  function hasContent(values) {
    const s = summarize(values);
    return s.lists > 0 || s.stars > 0;
  }

  // ─────────────────────────────────────────────────────────────
  // Réseau
  // ─────────────────────────────────────────────────────────────

  function syncError(kind, message, status) {
    const error = new Error(message);
    error.kind = kind; // 'network' | 'auth' | 'http' | 'conflict' | 'unsynced'
    error.status = status || 0;
    return error;
  }

  async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    let response;
    try {
      response = await fetchFn(baseUrl + path, {
        method,
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${token || config.key}`,
          'Content-Type': 'application/json',
          ...headers
        },
        body: payload,
        // L'envoi doit survivre à la fermeture de l'app
        keepalive: leaving && (!payload || payload.length < KEEPALIVE_MAX)
      });
    } catch (e) {
      throw syncError('network', 'Pas de connexion internet');
    }
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
    }
    if (!response.ok) {
      const message = (json && (json.msg || json.message || json.error_description)) || `Erreur ${response.status}`;
      throw syncError(response.status === 401 ? 'auth' : 'http', message, response.status);
    }
    return json;
  }

  function refreshSession() {
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const data = await request('/auth/v1/token?grant_type=refresh_token', {
            method: 'POST',
            body: { refresh_token: session.refresh_token }
          });
          setSession(data);
          return data.access_token;
        } catch (e) {
          // Jeton refusé : il faudra redemander un code. Les données locales
          // et `meta` restent en place, rien n'est effacé.
          if (e.kind !== 'network' && e.status >= 400 && e.status < 500 && e.status !== 429) {
            setSession(null);
            e.kind = 'auth';
          }
          throw e;
        } finally {
          refreshing = null;
        }
      })();
    }
    return refreshing;
  }

  async function authed(path, options = {}) {
    if (!session) throw syncError('auth', 'Non connecté');
    const fresh = session.expires_at * 1000 - now() > 60000;
    const token = fresh ? session.access_token : await refreshSession();
    try {
      return await request(path, { ...options, token });
    } catch (e) {
      if (e.kind !== 'auth' || !session) throw e;
      return request(path, { ...options, token: await refreshSession() });
    }
  }

  async function fetchRow() {
    const rows = await authed(`/rest/v1/palaces?select=data,version,updated_at&user_id=eq.${session.user.id}`);
    return rows && rows[0] ? rows[0] : null;
  }

  // Renvoie la ligne écrite, ou null si un autre appareil a écrit entre-temps
  async function writeRow(row, data) {
    const headers = { Prefer: 'return=representation' };
    if (!row) {
      try {
        const rows = await authed('/rest/v1/palaces?select=version', {
          method: 'POST',
          headers,
          body: { user_id: session.user.id, data, version: 1, device }
        });
        return rows && rows[0] ? rows[0] : null;
      } catch (e) {
        if (e.status === 409) return null;
        throw e;
      }
    }
    const rows = await authed(
      `/rest/v1/palaces?select=version&user_id=eq.${session.user.id}&version=eq.${row.version}`,
      { method: 'PATCH', headers, body: { data, version: row.version + 1, device } }
    );
    return rows && rows[0] ? rows[0] : null;
  }

  // ─────────────────────────────────────────────────────────────
  // Comparaison et fusion
  // ─────────────────────────────────────────────────────────────

  // Empreinte d'une valeur : longueur + FNV-1a 32 bits
  function fingerprint(value) {
    if (value === null || value === undefined) return null;
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `${value.length}:${(h >>> 0).toString(36)}`;
  }

  // Repère les clés qui ont changé sur cet appareil depuis le dernier passage
  function scanLocal() {
    let changed = false;
    SYNC_KEYS.forEach(key => {
      const h = fingerprint(storage.getItem(key));
      const known = meta.keys[key];
      if (known ? known.h === h : h === null) return;
      // Toujours plus récent que ce qu'on connaissait, même si l'horloge de l'appareil retarde
      meta.keys[key] = { h, t: Math.max(now(), known ? known.t + 1 : 0) };
      changed = true;
    });
    if (changed) {
      meta.dirty = true;
      saveMeta();
    }
    return changed;
  }

  // Écrit ici ce qui est plus récent dans le compte ; dit s'il reste à envoyer
  function merge(remoteData) {
    const applied = [];
    let needPush = false;
    SYNC_KEYS.forEach(key => {
      const local = meta.keys[key];
      const remote = remoteData[key];
      if (remote && (!local || remote.t > local.t)) {
        if (typeof remote.v === 'string') storage.setItem(key, remote.v);
        else storage.removeItem(key);
        meta.keys[key] = { h: fingerprint(typeof remote.v === 'string' ? remote.v : null), t: remote.t };
        applied.push(key);
      } else if (local && (!remote || local.t > remote.t)) {
        needPush = true;
      }
    });
    return { applied, needPush };
  }

  // Document à envoyer. Les clés inconnues de cette version de l'app
  // (écrites par une version plus récente) sont conservées telles quelles.
  function buildDoc(remoteData) {
    const doc = { ...remoteData };
    SYNC_KEYS.forEach(key => {
      if (meta.keys[key]) doc[key] = { v: storage.getItem(key), t: meta.keys[key].t };
    });
    return doc;
  }

  function syncNow() {
    if (!configured || !session || meta.pendingChoice) return Promise.resolve(false);
    if (!syncing) {
      syncing = runSync().finally(() => {
        syncing = null;
        notify();
      });
      notify();
    }
    return syncing;
  }

  async function runSync() {
    let applied = [];
    try {
      let done = false;
      for (let attempt = 0; attempt < 4 && !done; attempt++) {
        const row = await fetchRow();
        lastPullAt = now();
        const remoteData = (row && row.data) || {};
        // À partir d'ici et jusqu'à l'envoi, tout est synchrone : ce qui est
        // comparé, fusionné et envoyé est le même état du localStorage.
        scanLocal();
        const result = merge(remoteData);
        applied = applied.concat(result.applied);
        if (result.applied.length) saveMeta();
        if (row && !result.needPush) {
          meta.version = row.version;
          done = true;
        } else {
          const saved = await writeRow(row, buildDoc(remoteData));
          if (saved) {
            meta.version = saved.version;
            lastPushAt = now();
            done = true;
          }
        }
      }
      if (!done) throw syncError('conflict', 'Trop d\'écritures en même temps');
      meta.dirty = false;
      meta.lastSyncAt = now();
      saveMeta();
      failures = 0;
      nextAttemptAt = 0;
      lastError = null;
      return true;
    } catch (e) {
      lastError = e;
      failures++;
      nextAttemptAt = now() + Math.min(PULL_EVERY_MS, TICK_MS * 2 ** failures);
      return false;
    } finally {
      if (applied.length && api.onRemoteData) api.onRemoteData(applied);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Connexion
  // ─────────────────────────────────────────────────────────────

  async function requestCode(email) {
    try {
      await request('/auth/v1/otp', { method: 'POST', body: { email, create_user: true } });
    } catch (e) {
      if (e.status === 429) e.message = 'Trop de demandes : attends une minute avant de redemander un code.';
      else if (e.kind === 'http') e.message = 'Impossible d\'envoyer le code. Vérifie l\'adresse email.';
      throw e;
    }
  }

  // Renvoie { status: 'ok' } ou { status: 'choice', local, remote } quand
  // l'appareil ET le compte ont déjà des données et qu'il faut choisir.
  async function verifyCode(email, code) {
    let data;
    try {
      data = await request('/auth/v1/verify', { method: 'POST', body: { type: 'email', email, token: code } });
    } catch (e) {
      if (e.kind !== 'network' && e.status !== 429) e.message = 'Code incorrect ou expiré.';
      throw e;
    }
    setSession(data);
    lastError = null;
    failures = 0;
    nextAttemptAt = 0;

    // Même compte qu'avant (session expirée) : fusion habituelle
    if (meta.userId === session.user.id && !meta.pendingChoice) {
      meta.email = session.user.email;
      saveMeta();
      await syncNow();
      return { status: 'ok' };
    }

    meta = freshMeta(session.user.id, session.user.email);
    // En attente tant que le compte n'a pas été lu : si la connexion coupe
    // ici, rien n'est fusionné à l'aveugle au prochain lancement.
    meta.pendingChoice = { local: summarize(localValues()), remote: null };
    saveMeta();
    return settleFirstSync();
  }

  async function settleFirstSync() {
    let row;
    try {
      row = await fetchRow();
    } catch (e) {
      lastError = e;
      notify();
      return { status: 'choice', ...meta.pendingChoice };
    }
    const remote = remoteValues((row && row.data) || {});
    const local = localValues();
    if (hasContent(remote) && hasContent(local)) {
      meta.pendingChoice = {
        local: summarize(local),
        remote: { ...summarize(remote), updatedAt: row.updated_at, device: row.device || '' }
      };
      saveMeta();
      notify();
      return { status: 'choice', ...meta.pendingChoice };
    }
    if (hasContent(remote)) adoptRemote((row && row.data) || {});
    meta.pendingChoice = null;
    saveMeta();
    await syncNow();
    return { status: 'ok' };
  }

  // Le compte remplace l'appareil : tout ce qui est local devient « plus ancien »
  function adoptRemote(remoteData) {
    backup('appareilAvantCompte', localValues());
    meta.keys = {};
    SYNC_KEYS.forEach(key => {
      if (remoteData[key]) meta.keys[key] = { h: fingerprint(storage.getItem(key)), t: 0 };
      else storage.removeItem(key);
    });
  }

  // L'appareil remplace le compte : tout ce qui est local devient « plus récent »
  function adoptLocal(remoteData) {
    backup('compteRemplace', remoteValues(remoteData));
    meta.keys = {};
    SYNC_KEYS.forEach(key => {
      const remote = remoteData[key];
      const h = fingerprint(storage.getItem(key));
      if (h === null && !remote) return;
      meta.keys[key] = { h, t: Math.max(now(), remote ? remote.t + 1 : 0) };
    });
  }

  // which : 'remote' (garder le compte) ou 'local' (garder cet appareil)
  async function resolveChoice(which) {
    if (!session || !meta.pendingChoice) return false;
    const row = await fetchRow();
    const remoteData = (row && row.data) || {};
    if (which === 'remote' && hasContent(remoteValues(remoteData))) adoptRemote(remoteData);
    else adoptLocal(remoteData);
    meta.pendingChoice = null;
    meta.dirty = true;
    saveMeta();
    return syncNow();
  }

  // Déconnexion : les données locales ne sont retirées de l'appareil que si
  // elles viennent d'être enregistrées dans le compte (sinon, on refuse).
  async function logout() {
    const merged = session && !meta.pendingChoice;
    if (merged) {
      const ok = await syncNow();
      scanLocal();
      if (!ok || meta.dirty) {
        throw syncError('unsynced', 'Des progrès ne sont pas encore enregistrés en ligne. Reconnecte l\'appareil à internet avant de te déconnecter.');
      }
      backup('avantDeconnexion', localValues());
      SYNC_KEYS.forEach(key => storage.removeItem(key));
    }
    if (session) {
      try {
        await authed('/auth/v1/logout?scope=local', { method: 'POST' });
      } catch (e) {
        // La session locale est oubliée de toute façon
      }
    }
    setSession(null);
    meta = freshMeta(null, null);
    storage.removeItem('syncMeta');
    lastError = null;
    notify();
    return merged; // true : l'appareil a été vidé, il faut recharger l'app
  }

  // ─────────────────────────────────────────────────────────────
  // État affiché et rythme
  // ─────────────────────────────────────────────────────────────

  function state() {
    let status;
    if (!configured) status = 'off';
    else if (!session) status = meta.userId ? 'expired' : 'signedOut';
    else if (meta.pendingChoice) status = 'choice';
    else if (syncing) status = 'syncing';
    else if (meta.dirty || !meta.lastSyncAt) status = lastError ? 'error' : 'pending';
    else status = 'synced';
    return {
      status,
      email: session ? session.user.email : meta.email,
      lastSyncAt: meta.lastSyncAt,
      choice: meta.pendingChoice,
      error: lastError ? lastError.message : ''
    };
  }

  function notify() {
    if (api.onChange) api.onChange();
  }

  function tick() {
    if (!session || meta.pendingChoice || document.hidden) return;
    const changed = scanLocal();
    if (changed) notify();
    if (now() < nextAttemptAt) return;
    const pushDue = meta.dirty && now() - lastPushAt > PUSH_EVERY_MS;
    const pullDue = now() - lastPullAt > PULL_EVERY_MS;
    if (pushDue || pullDue) syncNow();
  }

  function start() {
    if (!configured) return;
    setInterval(tick, TICK_MS);

    // App mise de côté ou fermée : on envoie tout de suite ce qui reste.
    // App rouverte : on regarde ce que les autres appareils ont fait.
    const flush = () => {
      if (!session || meta.pendingChoice) return;
      scanLocal();
      if (!meta.dirty) return;
      leaving = true;
      syncNow().finally(() => { leaving = false; });
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) flush();
      else syncNow();
    });
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', () => {
      nextAttemptAt = 0;
      syncNow();
    });

    if (session && meta.pendingChoice && !meta.pendingChoice.remote) settleFirstSync();
    else syncNow();
  }

  return api;
}

const Sync = typeof window === 'undefined' ? null : createSync({
  storage: window.localStorage,
  fetchFn: (url, options) => window.fetch(url, options),
  config: SUPABASE_CONFIG,
  // iPadOS se présente comme un Mac : on le reconnaît à son écran tactile
  device: /iPhone/.test(navigator.userAgent) ? 'iPhone'
    : /iPad/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) ? 'iPad'
    : /Android/.test(navigator.userAgent) ? 'Android'
    : /Macintosh/.test(navigator.userAgent) ? 'Mac'
    : 'ordinateur'
});

if (typeof module !== 'undefined') module.exports = { createSync };
