# 🔌 Mode Offline - Mental Palace

## ✨ Fonctionnement Offline activé !

L'application Mental Palace fonctionne maintenant **complètement OFFLINE** grâce au Service Worker.

---

## 📱 Comment ça marche ?

### Première utilisation (ordi ALLUMÉ)

1. **Lance le serveur** sur ton Mac :
   ```bash
   cd /chemin/vers/palais-mental
   python3 -m http.server 8000
   ```

2. **Sur l'iPad**, ouvre Safari et va sur :
   ```
   http://[IP_DU_MAC]:8000
   ```

3. **Le Service Worker s'installe automatiquement** :
   - Tous les fichiers de l'app sont mis en cache sur l'iPad
   - Message dans la console Safari : "✅ Service Worker enregistré"
   - Message : "🔌 L'app fonctionne maintenant OFFLINE !"

4. **Ajoute l'app à l'écran d'accueil** :
   - Clique sur l'icône "Partager" (carré avec flèche)
   - "Ajouter à l'écran d'accueil"
   - Une icône "Mental Palace" apparaît

---

### Utilisations suivantes (ordi ÉTEINT ou ALLUMÉ)

**C'est magique, tout marche ! ✨**

- ✅ Lance l'app depuis l'icône sur l'écran d'accueil
- ✅ Fonctionne **même si ton ordi est éteint**
- ✅ Fonctionne **même sans WiFi** (une fois mis en cache)
- ✅ **Rechargement de la page OK** : charge depuis le cache
- ✅ Toutes les fonctionnalités marchent normalement
- ✅ Les données restent sauvegardées (localStorage)

**Ce qui fonctionne offline :**
- Toutes les listes de mots
- Tous les modes (apprentissage, interrogation progressive, interrogation complète)
- Toute la progression (mots maîtrisés, score)
- Toutes les récompenses débloquées
- Tout l'équipement de l'avatar
- Toutes les positions personnalisées des items

---

## 🔄 Mises à jour de l'application

**Quand tu fais des modifications au code :**

1. **Rallume ton Mac** et lance le serveur :
   ```bash
   python3 -m http.server 8000
   ```

2. **Sur l'iPad**, ouvre l'app normalement

3. **Le Service Worker détecte automatiquement** :
   - "🔄 Nouvelle version disponible !"
   - La nouvelle version se télécharge en arrière-plan
   - "✨ Nouvelle version prête. Rechargez pour l'activer."

4. **Recharge la page** (tire vers le bas ou bouton refresh) :
   - La nouvelle version s'active automatiquement
   - Tout est mis en cache à nouveau

**Note :** Les mises à jour se vérifient toutes les heures quand l'ordi est allumé.

---

## 🛠️ Debugging

**Voir les logs du Service Worker :**

1. Sur iPad : Réglages → Safari → Avancé → Inspecteur Web (activé)
2. Sur Mac : Safari → Développement → iPad → Mental Palace
3. Onglet Console : voir tous les logs
   - Installation du SW
   - Fichiers mis en cache
   - Requêtes interceptées
   - Mises à jour détectées

**Supprimer le cache (pour debug) :**

1. Dans la console Safari :
   ```javascript
   navigator.serviceWorker.getRegistrations().then(r => r.forEach(r => r.unregister()))
   ```
2. Recharge la page
3. Le Service Worker se réinstalle

**Voir les fichiers en cache :**

1. Console Safari → Application (ou Stockage)
2. Cache Storage → mental-palace-v1
3. Liste de tous les fichiers mis en cache

---

## 📊 Statistiques

**Taille du cache :**
- index.html : ~15 KB
- style.css : ~30 KB
- app.js : ~70 KB
- lieux.js : ~5 KB
- manifest.json : ~1 KB
- **Total : ~120 KB** (très léger !)

**Avantages :**
- ✅ Fonctionne offline
- ✅ Rechargement instantané (depuis le cache)
- ✅ Pas de consommation de données
- ✅ Pas de serveur nécessaire
- ✅ Vraie Progressive Web App (PWA)

---

## ⚠️ Important

**Les données utilisateur sont TOUJOURS sur l'iPad** :
- Listes de mots
- Progression
- Récompenses
- Équipement avatar
- Positions personnalisées

**Elles NE SONT PAS synchronisées** entre appareils.

Si tu réinstalles l'app ou vides le cache Safari, **les données seront perdues**.

Pour sauvegarder :
- Exporter les données (fonctionnalité à ajouter)
- Ou ne jamais vider le cache Safari pour cette app

---

## 🎯 Résumé pour l'utilisateur (ta fille)

**Simple :**

1. **Première fois** : Papa allume l'ordi, tu vas sur l'app
2. **Ajoute à l'écran d'accueil** : icône Mental Palace
3. **Ensuite** : Lance l'app quand tu veux, même si papa n'est pas là !
4. **Recharge** : Tu peux recharger autant que tu veux, ça marche toujours
5. **Tes données** : Elles restent toujours sur ton iPad

**C'est tout ! 🎉**
