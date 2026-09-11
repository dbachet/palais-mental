# Guide de Debug - Mental Palace

## Problème de blocage en mode interrogation

Si le mode interrogation bloque lors de la validation, suivez ces étapes pour diagnostiquer :

### 1. Ouvrir la console JavaScript

**Sur Mac (Safari) :**
1. Safari > Préférences > Avancées
2. Cocher "Afficher le menu Développement"
3. Développement > Afficher la console JavaScript

**Sur iPad (Safari) :**
1. Connecter l'iPad au Mac via câble
2. Sur Mac : Safari > Développement > [Nom de l'iPad] > [Onglet Mental Palace]
3. La console s'ouvre sur le Mac

### 2. Reproduire le problème

1. Dans l'app, lancez une interrogation
2. Répondez à une question
3. Cliquez sur "Valider"
4. Observez la console

### 3. Logs à vérifier

La console devrait afficher dans cet ordre :

```
validateAnswer appelé
isValidating = true
Timer arrêté
Question 1, mot: alors
Lettres attendues: "al", saisie: "al"
Réponse correcte !
setTimeout pour nextWordInInterrogation dans 2500ms
```

Puis après 2.5 secondes :

```
Appel de nextWordInInterrogation
nextWordInInterrogation appelé
Index actuel: 0, total mots niveau: 10
Nouvel index: 1
Mot suivant, appel showInterrogationScreen
showInterrogationScreen appelé
Index mot: 1, total: 10
Mot à afficher: "après"
```

### 4. Identifier le problème

**Si les logs s'arrêtent à :**

- **"setTimeout pour nextWordInInterrogation"** → Le setTimeout ne se déclenche pas
  - Vérifier si l'écran change (retour accueil, etc.)
  - Le timer peut être annulé par cleanupCurrentScreen

- **"Appel de nextWordInInterrogation"** → Erreur dans nextWordInInterrogation
  - Regarder s'il y a une erreur rouge dans la console
  - Vérifier `AppState.currentLevelWords`

- **"Nouvel index: X"** → Problème avec la condition if/else
  - Vérifier les valeurs de index et length
  - Problème possible avec AppState.currentLevelWords

- **"showInterrogationScreen appelé"** → Erreur dans showInterrogationScreen
  - Regarder s'il y a une erreur rouge
  - Vérifier si le mot existe dans wordLocations

### 5. Erreurs courantes

**Erreur : "Cannot read property 'X' of undefined"**
- Un élément DOM n'existe pas
- Vérifier que l'écran d'interrogation est bien affiché

**Erreur : "AppState.currentLevelWords[X] is undefined"**
- Problème avec les niveaux
- Vérifier que allInterrogationLevels est bien rempli

**Pas d'erreur mais rien ne se passe**
- Le setTimeout peut être annulé
- Vérifier si cleanupCurrentScreen est appelé

### 6. Rapporter le problème

Si le problème persiste, copier :
1. Les logs complets de la console
2. Le dernier log affiché avant le blocage
3. Les éventuelles erreurs en rouge

## Logs de démarrage d'interrogation

Au démarrage, vous devriez voir :

```
Interrogation sur TOUS les mots
Mots randomisés : [liste]
Niveaux créés : X niveaux
Niveau 0 : Y mots
```

Ou pour une interrogation après apprentissage :

```
Interrogation après apprentissage
Mots appris : [liste]
Mots randomisés : [liste]
Niveaux créés : X niveaux
```

## Désactiver les logs

Une fois le problème résolu, vous pouvez retirer tous les `console.log()` du fichier `js/app.js`.

Ou ajouter en début de fichier :

```javascript
const DEBUG = false;
```

Et remplacer `console.log()` par :

```javascript
if (DEBUG) console.log()
```
