# ☁️ Mise en ligne et comptes - Mental Palace

Objectif : l'app est hébergée (plus besoin du Mac allumé), chaque enfant a un compte, et son palais se retrouve tout seul sur l'iPad, le téléphone et l'ordinateur.

- **Hébergement** : GitHub Pages (gratuit, HTTPS → le mode hors-ligne fonctionne enfin vraiment).
- **Comptes et données** : Supabase (gratuit). Connexion par code à 6 chiffres reçu par email.
- **Envoi des emails** : Maileroo, depuis le domaine `yosanami.fr`.

L'app reste « locale d'abord » : elle marche sans réseau, et envoie les progrès dès que la connexion revient. Tant que `js/config.js` est vide, rien ne change par rapport à avant.

---

## 1. Créer le projet Supabase

1. [supabase.com](https://supabase.com) → New project. Région : **West EU (Paris)** ou Frankfurt.
2. **SQL Editor** → coller tout le contenu de `supabase/schema.sql` → **Run**.
3. **Project Settings → API** : copier l'URL du projet et la clé **anon** (ou **publishable**) dans `js/config.js`.
   Cette clé est faite pour être publique. Ne jamais y mettre la clé `service_role` / `secret`.

## 2. Connexion par code

**Authentication → Sign In / Providers → Email** :

- Email activé, **Confirm email** activé
- **Email OTP Length** : 6
- **Email OTP Expiration** : 900 (15 minutes)

**Authentication → Emails → Templates** : remplacer le contenu des **deux** modèles « Confirm signup » (première connexion) et « Magic Link » (connexions suivantes). Le point important est `{{ .Token }}` : c'est lui qui affiche le code à la place d'un lien.

Objet : `Ton code Mental Palace : {{ .Token }}`

```html
<h2>🏰 Mental Palace</h2>
<p>Voici le code à taper dans l'espace parents :</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Il est valable 15 minutes. Si tu n'as rien demandé, ignore cet email.</p>
```

## 3. Envoi des emails par Maileroo

Sans cela, Supabase n'envoie qu'aux membres du projet, et quelques emails par heure.

1. Maileroo → domaine `yosanami.fr` → **SMTP Accounts** → créer un compte (ex. `palais@yosanami.fr`).
2. Supabase → **Authentication → Emails → SMTP Settings** → Enable custom SMTP :
   - Sender email : `palais@yosanami.fr` · Sender name : `Mental Palace`
   - Host : `smtp.maileroo.com` · Port : `587`
   - Username / Password : ceux du compte SMTP Maileroo
3. **Authentication → Rate Limits** : « emails per hour » à 30 suffit largement.

## 4. Héberger sur GitHub Pages

1. Pousser le dépôt (avec `js/config.js` rempli).
2. GitHub → dépôt → **Settings → Pages** → Source : *Deploy from a branch* → `main` / `/ (root)`.
3. L'app est à `https://dbachet.github.io/palais-mental/`.
4. Supabase → **Authentication → URL Configuration** → Site URL : cette adresse.

Le fichier `.github/workflows/keepalive.yml` lit une ligne de la base deux fois par semaine : un projet Supabase gratuit se met sinon en pause après 7 jours sans activité (vacances). Si cela arrivait quand même : l'app continue hors-ligne, et un clic sur « Restore » dans Supabase relance tout, sans perte.

> `dbachet.github.io` est partagé par tous les sites Pages du compte : ils voient le même localStorage. À garder en tête si un autre site y utilise les clés `wordLists`, `economy`…

## 5. Déménager le palais (à faire une seule fois, dans cet ordre)

Changer d'adresse = nouveau stockage vide. Le palais passe par un dernier fichier.

1. **iPad, ancienne adresse** (Mac allumé) : Espace parents → 💾 **Sauvegarder dans un fichier** → Enregistrer dans Fichiers.
2. **iPad, nouvelle adresse** dans Safari → Partager → **Sur l'écran d'accueil**. Puis **ouvrir l'app depuis cette nouvelle icône** : sur iPad, l'app de l'écran d'accueil et Safari n'ont pas le même stockage. Tout ce qui suit se fait dans l'app.
3. Espace parents → ☁️ **Compte** → email → code. Le compte est créé.
4. Espace parents → 📂 **Restaurer depuis un fichier** → le fichier de l'étape 1. L'app recharge et envoie tout dans le compte.
5. Vérifier sous « Espace parents », sur l'accueil : **☁️ Enregistré en ligne le …**
6. **Téléphone / ordinateur** : ouvrir la nouvelle adresse → Espace parents → même email → code. Le palais arrive tout seul.
7. Supprimer l'ancienne icône de l'iPad. Garder le fichier JSON quelque part, par précaution.

Un autre enfant : il ouvre l'adresse, joue, et un parent crée son compte avec **une autre adresse email** (un compte = un enfant).

## Comment ça se comporte

- La session reste ouverte sur l'appareil : l'enfant ne tape jamais de code.
- Les progrès partent en ligne quelques secondes après chaque changement, et quand l'app est mise de côté. Hors-ligne, ils attendent.
- Deux appareils : la fusion se fait **donnée par donnée** (listes, étoiles/stickers, kawaii, maison). Ajouter une liste sur le téléphone pendant qu'elle gagne des étoiles sur l'iPad ne pose pas de problème. Si les **deux** modifient les listes en même temps sans réseau, la version la plus récente des listes l'emporte.
- Si des listes arrivent d'un autre appareil pendant une session, l'app attend le retour à l'accueil pour se recharger.
- Connexion sur un appareil qui a déjà un palais, à un compte qui en a un autre : l'app **demande lequel garder**, et ne touche à rien tant que le choix n'est pas fait.
- **Se déconnecter** retire le palais de l'appareil (il reste dans le compte). C'est refusé s'il reste des progrès non envoyés.
- Son et volume restent propres à chaque appareil.

## Filets de sécurité

- **Fichier JSON** de l'espace parents : fonctionne comme avant (sans la session du compte).
- **Copie quotidienne côté serveur** : table `palace_history`, 30 jours. Procédure de restauration à la fin de `supabase/schema.sql`.
- **Copies locales** avant tout remplacement en bloc, dans la clé `syncBackup` du localStorage : `appareilAvantCompte`, `compteRemplace`, `avantDeconnexion`.
