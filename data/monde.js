// ═══════════════════════════════════════════════════════════════
// LE MONDE : bâtiments, étages et objets
// ═══════════════════════════════════════════════════════════════
// Une liste = un lieu (bâtiment tout prêt ou maison construite).
// Un élément de la liste = un objet du lieu.
//
// Chaque bâtiment a au moins 6 étages de 12 objets, soit 72 emplacements.
// Un étage n'est montré que si la liste en a besoin (12 éléments par étage).
// Les objets sont dessinés par js/objets.js : un objet = l'id d'une forme
// ('four'), ou { f: forme, c: couleur, nom } pour changer sa couleur ou son
// nom. Dans un même bâtiment, une forme ne sert qu'une fois, pour que chaque
// emplacement reste bien distinct. L'ordre des objets d'un étage est l'ordre
// du parcours (de gauche à droite).
// Les emojis et les stickers ne servent que de décor : jamais d'objet ici.
//
// Décor d'un étage (dessiné par js/monde.js, sans image) :
//   mur, sol : couleurs ; motif : rayures | pois | losanges | briques | pierre
//   | etoiles | carreaux | vagues | uni ; solType : parquet | carrelage | tapis
//   | pierre | herbe | damier ; fenetre : carree | ronde | arche | vitrail | ciel
//
// Ajouter un bâtiment = ajouter une entrée ici (6 étages × 12 objets).

const BATIMENTS = [
  {
    id: 'boulangerie', nom: 'Boulangerie', embleme: 'croissant',
    couleurs: { facade: '#FFE3C2', toit: '#E8875A', accent: '#FFB3D6' },
    etages: [
      { nom: 'le fournil', mur: '#FCE2C4', sol: '#B98556', motif: 'briques', solType: 'parquet', fenetre: 'ronde',
        objets: ['four', 'pain', 'baguette', 'balance', 'tonneau', 'caisse', 'seau', 'horloge', 'etagere', 'table', 'marmite', 'echelle'] },
      { nom: 'la boutique', mur: '#FFE9F2', sol: '#E8C7A0', motif: 'rayures', solType: 'damier', fenetre: 'carree',
        objets: ['croissant', 'gateau', 'cupcake', 'donut', 'tarte', 'bocal', 'panier', 'sac_or', 'plante', 'cloche', 'tableau', 'lampadaire'] },
      { nom: 'le salon de thé', mur: '#E6F4EA', sol: '#C99A6E', motif: 'pois', solType: 'parquet', fenetre: 'arche',
        objets: ['theiere', 'tasse', 'glace', 'sucette', 'fraise', 'fauteuil', 'chaise', 'vase', 'miroir', 'coussin', 'lampe', 'chandelier'] },
      { nom: 'la pâtisserie', mur: '#FFF1D6', sol: '#F2B8C6', motif: 'losanges', solType: 'carrelage', fenetre: 'carree',
        objets: ['fromage', 'pomme', 'frigo', 'commode', 'cadeau', 'coeur', 'bougie', 'couronne', 'ballons', 'etoile', 'lanterne', 'pendule'] },
      { nom: 'la réserve', mur: '#E9E2D8', sol: '#9C8B78', motif: 'pierre', solType: 'pierre', fenetre: 'ronde',
        objets: ['armoire', 'coffre', 'valise', 'parapluie', 'arrosoir', 'boussole', 'sablier', 'radio', 'telephone', 'nounours', 'cubes', 'toupie'] },
      { nom: 'la terrasse sur le toit', mur: '#CFE8FF', sol: '#A8DDA0', motif: 'uni', solType: 'herbe', fenetre: 'ciel',
        objets: ['parasol', 'banc', 'soleil', 'nuage', 'arbre', 'fleur', 'tournesol', 'fontaine', 'buisson', 'cactus', 'nichoir', 'cerf_volant'] }
    ]
  },
  {
    id: 'coiffure', nom: 'Salon de coiffure', embleme: 'ciseaux',
    couleurs: { facade: '#F6D8FF', toit: '#B48CDB', accent: '#FF7EB9' },
    etages: [
      { nom: "l'accueil", mur: '#FBE7FF', sol: '#D9B8E8', motif: 'rayures', solType: 'damier', fenetre: 'carree',
        objets: ['canape', 'fauteuil', 'plante', 'horloge', 'telephone', 'tableau', 'lampadaire', 'vase', 'cadeau', 'pouf', 'coussin', 'aquarium'] },
      { nom: 'les fauteuils', mur: '#E3F6F5', sol: '#BFD9D8', motif: 'carreaux', solType: 'carrelage', fenetre: 'arche',
        objets: ['chaise', 'miroir', 'seche_cheveux', 'ciseaux', 'peigne', 'lavabo', 'seau', 'etagere', 'lampe', 'tasse', 'radio', 'sablier'] },
      { nom: 'le maquillage', mur: '#FFE4EC', sol: '#F0B9CB', motif: 'pois', solType: 'tapis', fenetre: 'ronde',
        objets: ['vernis', 'rouge_levres', 'parfum', 'diamant', 'coeur', 'etoile', 'lune', 'pinceaux', 'palette', 'bougie', 'bocal', 'coquillage'] },
      { nom: 'les bijoux et chapeaux', mur: '#FFF6D9', sol: '#D6B979', motif: 'losanges', solType: 'parquet', fenetre: 'vitrail',
        objets: ['collier', 'couronne', 'chapeau', 'sac_main', 'coffre', 'commode', 'boule_cristal', 'sac_or', 'masque', 'baton_magique', 'ballons', 'lanterne'] },
      { nom: 'le dressing', mur: '#E8EEFF', sol: '#B7C4EA', motif: 'rayures', solType: 'tapis', fenetre: 'carree',
        objets: ['robe', 'chaussure', 'mannequin', 'armoire', 'valise', 'parapluie', 'cartable', 'nounours', 'lit', 'television', 'table', 'bureau'] },
      { nom: 'le spa sur le toit', mur: '#D4F2EE', sol: '#9ED9C9', motif: 'vagues', solType: 'herbe', fenetre: 'ciel',
        objets: ['baignoire', 'fontaine', 'arbre', 'fleur', 'tournesol', 'buisson', 'cactus', 'parasol', 'banc', 'soleil', 'nuage', 'theiere'] }
    ]
  },
  {
    id: 'chateau', nom: 'Château', embleme: 'couronne',
    couleurs: { facade: '#E9E3F5', toit: '#8E7CC3', accent: '#FFD466' },
    etages: [
      { nom: 'la grande salle', mur: '#E4DCCF', sol: '#A88F74', motif: 'pierre', solType: 'pierre', fenetre: 'arche',
        objets: ['epee', 'bouclier', 'armure', 'drapeau', 'chandelier', 'cheminee', 'tambour', 'trompette', 'table', 'tonneau', 'lanterne', 'tableau'] },
      { nom: 'la salle du trône', mur: '#F3E0E8', sol: '#C0394B', motif: 'losanges', solType: 'tapis', fenetre: 'vitrail',
        objets: ['trone', 'couronne', 'sac_or', 'coffre', 'diamant', 'collier', 'miroir', 'cloche', 'carte_tresor', 'masque', 'statue', 'colonne'] },
      { nom: 'la chambre de la princesse', mur: '#FFE4F1', sol: '#E9B6D0', motif: 'pois', solType: 'tapis', fenetre: 'arche',
        objets: ['lit', 'nounours', 'coeur', 'commode', 'coussin', 'fauteuil', 'violon', 'horloge', 'vase', 'parfum', 'robe', 'chaussure'] },
      { nom: 'la cuisine du château', mur: '#F2E6D2', sol: '#8C6A4F', motif: 'briques', solType: 'pierre', fenetre: 'carree',
        objets: ['four', 'marmite', 'pain', 'fromage', 'pomme', 'fraise', 'panier', 'balance', 'tarte', 'gateau', 'seau', 'caisse'] },
      { nom: 'la tour du magicien', mur: '#DCD3F5', sol: '#5E4E8C', motif: 'etoiles', solType: 'parquet', fenetre: 'ronde',
        objets: ['boule_cristal', 'potion', 'chaudron', 'parchemin', 'baton_magique', 'livres', 'telescope', 'sablier', 'lune', 'etoile', 'planete', 'globe'] },
      { nom: 'le donjon', mur: '#CFCAD6', sol: '#77707F', motif: 'pierre', solType: 'pierre', fenetre: 'ronde',
        objets: ['echelle', 'cage', 'os', 'amphore', 'pendule', 'bougie', 'valise', 'champignon', { f: 'dinosaure', c: 'violet', nom: 'le dragon' }, 'boussole', 'engrenage', 'armoire'] }
    ]
  },
  {
    id: 'musee', nom: 'Musée', embleme: 'colonne',
    couleurs: { facade: '#F4EFE6', toit: '#C9B79C', accent: '#7FB3F5' },
    etages: [
      { nom: 'le hall', mur: '#F5F0E8', sol: '#D8CBB4', motif: 'uni', solType: 'damier', fenetre: 'arche',
        objets: ['colonne', 'statue', 'banc', 'plante', 'horloge', 'carte_tresor', 'boussole', 'valise', 'parapluie', 'cloche', 'lampadaire', 'telephone'] },
      { nom: 'les dinosaures', mur: '#E2F0D9', sol: '#B7A27F', motif: 'vagues', solType: 'herbe', fenetre: 'carree',
        objets: ['dinosaure', 'os', 'coquillage', 'cactus', 'arbre', 'sapin', 'buisson', 'champignon', 'fontaine', 'nichoir', 'arrosoir', 'seau'] },
      { nom: "l'Égypte", mur: '#FBE9C4', sol: '#E0C08A', motif: 'losanges', solType: 'pierre', fenetre: 'arche',
        objets: ['pyramide', 'amphore', 'sablier', 'masque', 'couronne', 'trone', 'sac_or', 'diamant', 'parchemin', 'collier', 'coffre', 'chaudron'] },
      { nom: 'les peintures', mur: '#FFF7EC', sol: '#B98556', motif: 'uni', solType: 'parquet', fenetre: 'vitrail',
        objets: ['tableau', 'chevalet', 'palette', 'pinceaux', 'miroir', 'vase', 'fleur', 'tournesol', 'pomme', 'fraise', 'fauteuil', 'lampe'] },
      { nom: 'les sciences', mur: '#E3EEFF', sol: '#9DB2D6', motif: 'carreaux', solType: 'carrelage', fenetre: 'ronde',
        objets: ['telescope', 'microscope', 'eprouvette', 'robot', 'fusee', 'planete', 'aimant', 'ampoule', 'engrenage', 'ordinateur', 'antenne', 'globe'] },
      { nom: 'les jouets anciens', mur: '#FFE9DC', sol: '#C99A6E', motif: 'pois', solType: 'parquet', fenetre: 'ciel',
        objets: ['nounours', 'cubes', 'toupie', 'quilles', 'velo', 'trottinette', 'cerf_volant', 'ballons', 'ballon', 'tambour', 'trompette', 'radio'] }
    ]
  },
  {
    id: 'labo', nom: 'Labo', embleme: 'potion',
    couleurs: { facade: '#DDF6F3', toit: '#5FD3CE', accent: '#B48CDB' },
    etages: [
      { nom: "l'accueil du labo", mur: '#EEF7F6', sol: '#C3D6D4', motif: 'carreaux', solType: 'carrelage', fenetre: 'carree',
        objets: ['bureau', 'ordinateur', 'telephone', 'horloge', 'plante', 'chaise', 'crayon', 'livres', 'cartable', 'lampe', 'tableau_noir', 'radio'] },
      { nom: 'la chimie', mur: '#E9F9E4', sol: '#A9CFA0', motif: 'pois', solType: 'carrelage', fenetre: 'ronde',
        objets: ['eprouvette', 'potion', 'chaudron', 'bocal', 'balance', 'aimant', 'ampoule', 'lavabo', 'frigo', 'seau', 'sablier', 'etagere'] },
      { nom: 'les robots', mur: '#E4E8F2', sol: '#8C96AD', motif: 'carreaux', solType: 'damier', fenetre: 'carree',
        objets: ['robot', 'engrenage', 'antenne', 'television', 'cubes', 'toupie', 'echelle', 'caisse', 'boussole', 'micro', 'cadeau', 'coffre'] },
      { nom: 'la biologie', mur: '#F1FBE6', sol: '#B7D69A', motif: 'vagues', solType: 'herbe', fenetre: 'arche',
        objets: ['microscope', 'aquarium', 'cactus', 'champignon', 'arbre', 'fleur', 'buisson', 'nichoir', 'cage', 'coquillage', 'os', 'pomme'] },
      { nom: "l'espace", mur: '#2E2A5C', sol: '#4A4580', motif: 'etoiles', solType: 'damier', fenetre: 'ronde',
        objets: ['fusee', 'planete', 'telescope', 'lune', 'etoile', 'soleil', 'nuage', 'globe', 'boule_cristal', 'diamant', 'ballons', 'lanterne'] },
      { nom: 'la serre sur le toit', mur: '#DDF5E3', sol: '#8FCB7E', motif: 'losanges', solType: 'herbe', fenetre: 'ciel',
        objets: ['tournesol', 'sapin', 'arrosoir', 'parasol', 'banc', 'fontaine', 'fraise', 'panier', 'tonneau', 'table', 'chapeau', 'cerf_volant'] }
    ]
  },
  {
    id: 'ecole', nom: 'École', embleme: 'crayon',
    couleurs: { facade: '#FFF0C9', toit: '#F5B21B', accent: '#7FB3F5' },
    etages: [
      { nom: 'la classe', mur: '#FFF8E1', sol: '#C99A6E', motif: 'uni', solType: 'parquet', fenetre: 'carree',
        objets: ['tableau_noir', 'bureau', 'chaise', 'cartable', 'crayon', 'globe', 'livres', 'horloge', 'cloche', 'etagere', 'plante', 'lampe'] },
      { nom: 'la bibliothèque', mur: '#F3E7DA', sol: '#9C6B45', motif: 'rayures', solType: 'tapis', fenetre: 'arche',
        objets: ['fauteuil', 'canape', 'coussin', 'pouf', 'lampadaire', 'parchemin', 'carte_tresor', 'boussole', 'tableau', 'vase', 'commode', 'sablier'] },
      { nom: 'la cantine', mur: '#E6F6FF', sol: '#C9DCEB', motif: 'carreaux', solType: 'damier', fenetre: 'carree',
        objets: ['table', 'four', 'frigo', 'marmite', 'pomme', 'fraise', 'fromage', 'pain', 'tarte', 'glace', 'tasse', 'panier'] },
      { nom: 'la salle de musique', mur: '#F4E6FF', sol: '#B88FD0', motif: 'vagues', solType: 'parquet', fenetre: 'ronde',
        objets: ['piano', 'guitare', 'tambour', 'trompette', 'violon', 'micro', 'radio', 'television', 'masque', 'coeur', 'etoile', 'chapeau'] },
      { nom: 'le gymnase', mur: '#FFE9DC', sol: '#E3A86B', motif: 'rayures', solType: 'parquet', fenetre: 'carree',
        objets: ['ballon', 'quilles', 'velo', 'trottinette', 'echelle', 'seau', 'caisse', 'coffre', 'valise', 'drapeau', 'toupie', 'cubes'] },
      { nom: 'la cour de récré', mur: '#D3EDFF', sol: '#A8DDA0', motif: 'uni', solType: 'herbe', fenetre: 'ciel',
        objets: ['toboggan', 'arbre', 'fleur', 'banc', 'cerf_volant', 'ballons', 'nichoir', 'soleil', 'nuage', 'arrosoir', 'buisson', 'fontaine'] }
    ]
  }
];

// Objets par étage (le décor en prévoit 12 emplacements)
const OBJETS_PAR_ETAGE = 12;
