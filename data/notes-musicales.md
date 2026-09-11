# Système de Notes Musicales

## Concept

Chaque caractère du mot est mappé à une note musicale de la **gamme pentatonique majeure**. Cette gamme est choisie car toutes ses notes sonnent bien ensemble, sans dissonance.

## Gamme Pentatonique Majeure

Sur 2 octaves (C4 à E6) - limitée à ~1400 Hz pour rester agréable :

### Octave 4 (grave)
- C4 (Do) = 261.63 Hz
- D4 (Ré) = 293.66 Hz
- E4 (Mi) = 329.63 Hz
- G4 (Sol) = 392.00 Hz
- A4 (La) = 440.00 Hz

### Octave 5 (médium)
- C5 (Do) = 523.25 Hz
- D5 (Ré) = 587.33 Hz
- E5 (Mi) = 659.25 Hz
- G5 (Sol) = 783.99 Hz
- A5 (La) = 880.00 Hz

### Octave 6 (aigu doux)
- C6 (Do) = 1046.50 Hz
- D6 (Ré) = 1174.66 Hz
- E6 (Mi) = 1318.51 Hz

**Total : 13 notes (max 1318 Hz)**

**Note importante :** Les notes au-delà de 1500 Hz deviennent stridents et désagréables, surtout pour les enfants. La gamme est donc limitée à E6 (1318 Hz) pour un son doux et musical.

## Mapping Caractères → Notes

L'algorithme utilise l'ordre alphabétique des caractères :

```
abcdefghijklmnopqrstuvwxyzàâäéèêëïîôùûüÿç'-_ 
```

Chaque caractère prend la note correspondant à sa position modulo 20.

### Exemples

**Mot : "alors"**
- a → C4 (Do grave)
- l → E5 (Mi médium)
- o → A5 (La médium)
- r → D6 (Ré aigu)
- s → G6 (Sol aigu)

**Mélodie** : Do, Mi, La, Ré, Sol (mélodie ascendante)

**Mot : "aujourd'hui"**
- a → C4
- u → A6
- j → E5
- o → A5
- u → A6
- r → D6
- d → D4
- ' → C7
- h → E4
- u → A6
- i → G4

**Mélodie** : Une mélodie unique et reconnaissable !

## Avantages Pédagogiques

1. **Mémorisation multi-sensorielle** : Vue + Son
2. **Signature sonore unique** : Chaque mot a sa "chanson"
3. **Gamme agréable** : Jamais de dissonance (pentatonique)
4. **Constance** : Même mot = même mélodie à chaque fois
5. **Ancrage mnémotechnique** : L'enfant peut "chanter" le mot dans sa tête

## Caractéristiques Techniques

- **Type d'onde** : Sine (onde sinusoïdale douce)
- **Enveloppe ADSR** :
  - Attack : 50ms (montée progressive)
  - Decay : 50ms (légère baisse)
  - Sustain : 200ms (maintien)
  - Release : 100ms (extinction douce)
- **Durée totale** : 400ms par note
- **Volume** : 0.2-0.3 (doux, pas agressif)

## Modification de la Gamme

Pour changer la gamme musicale, modifier la constante `PENTATONIC_SCALE` dans `js/app.js`.

**Gamme pentatonique mineure** (plus mélancolique) :
```javascript
const PENTATONIC_SCALE = [
  261.63, // C4
  311.13, // Eb4
  349.23, // F4
  392.00, // G4
  466.16, // Bb4
  // ... (multiplier par 2 pour octaves suivantes)
];
```

**Gamme majeure complète** (7 notes au lieu de 5) :
```javascript
const MAJOR_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  // ... (multiplier par 2 pour octaves suivantes)
];
```
