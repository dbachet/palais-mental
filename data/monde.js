// ═══════════════════════════════════════════════════════════════
// LE MONDE : bâtiments, étages et objets
// ═══════════════════════════════════════════════════════════════
// Une liste = un lieu (bâtiment tout prêt ou maison construite).
// Un élément de la liste = un objet du lieu.
//
// Chaque bâtiment a au moins 6 étages de 12 objets, soit 72 emplacements.
// Un étage n'est montré que si la liste en a besoin (12 éléments par étage).
// Les objets sont dessinés par js/objets.js. Chaque pièce est composée à la
// main : des objets qui vont ensemble, chacun à sa place de départ.
//   'four 110 470'      forme, x, y du pied (scène de 1000 × 640, sol à 430)
//   'four 110 470 1.3'  … et une taille (1 = taille normale de la forme)
//   'pain 500 s0'       posé sur le support n° 0 de l'étage
//   { f, c, nom, at: '770 575 1.4' }  pour changer la couleur ou le nom
// Supports (meubles du décor, qu'on ne touche pas) :
//   'comptoir x1 x2' (contre le mur), 'etagere x1 x2 y' (au mur),
//   'table x1 x2 y' (y = pied), 'socle x y' (y = pied).
// Dans un même étage, une forme ne sert qu'une fois, pour que chaque
// emplacement reste bien distinct. L'enfant peut ensuite tout déplacer.
// Les emojis et les stickers ne servent que de décor : jamais d'objet ici.
//
// Décor d'un étage (dessiné par js/monde.js, sans image) :
//   mur, sol : couleurs ; motif : rayures | pois | losanges | briques | pierre
//   | etoiles | carreaux | vagues | uni ; solType : parquet | carrelage | tapis
//   | pierre | herbe | damier ; fenetre : carree | ronde | arche | vitrail
//   | aucune ; ciel (toit : ciel et rambarde) ; champ (dehors : ciel et barrière)
//
// Ajouter un bâtiment = ajouter une entrée ici (6 étages × 12 objets).
// Fenêtres à x = 230 et 770 : rien d'accroché au mur entre 150 et 310, ni
// entre 690 et 850.

const BATIMENTS = [
  {
    id: 'boulangerie', nom: 'Boulangerie', embleme: 'croissant',
    couleurs: { facade: '#FFE3C2', toit: '#E8875A', accent: '#FFB3D6' },
    etages: [
      { nom: 'le fournil', mur: '#FCE2C4', sol: '#B98556', motif: 'briques', solType: 'parquet', fenetre: 'ronde',
        supports: ['comptoir 380 700', 'etagere 840 990 260'],
        objets: ['lanterne 70 255', 'four 110 470 1.3', 'tonneau 300 560', 'balance 420 s0', 'horloge 500 205', 'pain 500 s0',
          'baguette 580 s0', 'tarte 660 s0', 'panier 600 610', 'frigo 765 470', 'caisse 900 480', 'marmite 905 s1'] },
      { nom: 'la boutique', mur: '#FFE9F2', sol: '#E8C7A0', motif: 'rayures', solType: 'damier', fenetre: 'carree',
        supports: ['etagere 30 150 270', 'comptoir 300 720', 'etagere 850 990 270'],
        objets: ['bocal 60 s0', 'plante 75 475', 'sucette 120 s0', 'croissant 340 s1', 'donut 420 s1', 'cupcake 500 s1',
          'cloche 500 205', 'tarte 580 s1', 'gateau 660 s1', 'pain 885 s2', 'panier 955 s2', 'parapluie 930 480'] },
      { nom: 'le salon de thé', mur: '#E6F4EA', sol: '#C99A6E', motif: 'pois', solType: 'parquet', fenetre: 'arche',
        supports: ['table 240 430 570', 'table 590 780 570', 'etagere 860 990 260'],
        objets: ['tableau 70 230', 'fauteuil 150 575', 'theiere 290 s0', 'tasse 375 s0', 'chaise 500 575', 'miroir 500 250',
          'glace 640 s1', 'cupcake 725 s1', 'pouf 860 610', 'vase 890 s2', 'bougie 955 s2', 'lampadaire 930 480'] },
      { nom: 'la pâtisserie', mur: '#FFF1D6', sol: '#F2B8C6', motif: 'losanges', solType: 'carrelage', fenetre: 'carree',
        supports: ['comptoir 330 670', 'table 420 600 610'],
        objets: ['coeur 70 250', 'frigo 95 470', 'bocal 370 s0', 'pomme 445 s0', 'gateau 470 s1', 'horloge 500 205',
          'fraise 520 s0', 'bougie 555 s1', 'tarte 600 s0', 'cadeau 800 610', 'etagere 920 470', 'ballons 925 255'] },
      { nom: 'la réserve', mur: '#E9E2D8', sol: '#9C8B78', motif: 'pierre', solType: 'pierre', fenetre: 'ronde',
        supports: ['etagere 380 640 270'],
        objets: ['armoire 90 470 1.1', 'seau 230 615', 'echelle 330 470', 'bocal 420 s0', 'marmite 480 s0', 'theiere 545 s0',
          'tasse 605 s0', 'panier 560 615', 'tonneau 730 470', 'arrosoir 760 615', 'caisse 890 480', 'lanterne 930 255'] },
      { nom: 'la terrasse sur le toit', mur: '#CFE8FF', sol: '#A8DDA0', motif: 'uni', solType: 'herbe', fenetre: 'ciel',
        supports: ['table 230 420 585'],
        objets: ['arbre 90 470 1.3', 'pomme 280 s0', 'parasol 325 500 1.2', 'glace 370 s0', 'nuage 430 175', 'fleur 480 470',
          'cactus 520 615', 'banc 640 480', 'cerf_volant 650 215', 'fontaine 760 600', 'tournesol 840 470', 'buisson 935 600'] }
    ]
  },
  {
    id: 'coiffure', nom: 'Salon de coiffure', embleme: 'ciseaux',
    couleurs: { facade: '#F6D8FF', toit: '#B48CDB', accent: '#FF7EB9' },
    etages: [
      { nom: "l'accueil", mur: '#FBE7FF', sol: '#D9B8E8', motif: 'rayures', solType: 'damier', fenetre: 'carree',
        supports: ['comptoir 580 820', 'table 380 560 600'],
        objets: ['plante 75 470', 'fauteuil 200 605', 'canape 300 480 1.1', 'livres 420 s1', 'tableau 470 225', 'tasse 510 s1',
          'telephone 620 s0', 'vase 700 s0', 'lampe 780 s0', 'pouf 690 615', 'lampadaire 910 475', 'horloge 925 250'] },
      { nom: 'les fauteuils', mur: '#E3F6F5', sol: '#BFD9D8', motif: 'carreaux', solType: 'carrelage', fenetre: 'arche',
        supports: ['comptoir 560 840', 'table 620 790 615'],
        objets: ['lavabo 110 470', 'pouf 250 610', 'miroir 430 270', 'chaise 430 480', 'ciseaux 600 s0', 'peigne 670 s0',
          'livres 665 s1', 'seche_cheveux 740 s0', 'tasse 745 s1', 'radio 810 s0', 'horloge 920 250', 'plante 935 470'] },
      { nom: 'le maquillage', mur: '#FFE4EC', sol: '#F0B9CB', motif: 'pois', solType: 'tapis', fenetre: 'ronde',
        supports: ['comptoir 330 670'],
        objets: ['lampadaire 90 475', 'coussin 230 615', 'vernis 370 s0', 'rouge_levres 440 s0', 'miroir 500 300', 'parfum 510 s0',
          'chaise 500 610', 'pinceaux 580 s0', 'bougie 650 s0', 'pouf 790 610', 'commode 890 470', 'coeur 925 255'] },
      { nom: 'les bijoux et chapeaux', mur: '#FFF6D9', sol: '#D6B979', motif: 'losanges', solType: 'parquet', fenetre: 'vitrail',
        supports: ['etagere 30 140 285', 'comptoir 330 650'],
        objets: ['chaussure 75 s0', 'coffre 100 480', 'pouf 250 610', 'couronne 370 s1', 'diamant 450 s1', 'collier 500 250',
          'chapeau 530 s1', 'plante 570 610', 'sac_main 610 s1', 'fauteuil 760 605', 'commode 890 475', 'masque 925 250'] },
      { nom: 'le dressing', mur: '#E8EEFF', sol: '#B7C4EA', motif: 'rayures', solType: 'tapis', fenetre: 'carree',
        supports: ['etagere 30 150 285'],
        objets: ['chapeau 60 s0', 'lampadaire 100 480', 'sac_main 120 s0', 'pouf 280 610', 'robe 400 225', 'mannequin 400 490',
          'chaussure 520 615', 'miroir 600 255', 'commode 620 480', 'valise 770 610', 'parapluie 790 475', 'armoire 920 475 1.1'] },
      { nom: 'le spa sur le toit', mur: '#D4F2EE', sol: '#9ED9C9', motif: 'vagues', solType: 'herbe', fenetre: 'ciel',
        supports: ['table 510 680 600'],
        objets: ['arbre 90 470 1.2', 'pouf 190 615', 'baignoire 320 520 1.3', 'coquillage 380 625', 'nuage 450 170', 'fleur 520 470',
          'theiere 555 s0', 'tasse 635 s0', 'fontaine 700 470', 'cactus 790 615', 'parasol 870 490', 'buisson 935 610'] }
    ]
  },
  {
    id: 'chateau', nom: 'Château', embleme: 'couronne',
    couleurs: { facade: '#E9E3F5', toit: '#8E7CC3', accent: '#FFD466' },
    etages: [
      { nom: 'la grande salle', mur: '#E4DCCF', sol: '#A88F74', motif: 'pierre', solType: 'pierre', fenetre: 'arche',
        supports: ['table 190 430 605'],
        objets: ['lanterne 70 255', 'armure 90 480', 'pain 235 s0', 'chandelier 310 s0 0.6', 'pomme 385 s0', 'bouclier 385 225',
          'cheminee 500 470 1.3', 'epee 615 225', 'tambour 640 610', 'tonneau 800 610', 'drapeau 920 480', 'tableau 930 250'] },
      { nom: 'la salle du trône', mur: '#F3E0E8', sol: '#C0394B', motif: 'losanges', solType: 'tapis', fenetre: 'vitrail',
        supports: ['socle 220 590', 'socle 780 590'],
        objets: ['drapeau 90 480', 'couronne 220 s0', 'colonne 340 475', 'sac_or 420 615', 'tableau 500 205', 'trone 500 475 1.3',
          'coussin 585 615', 'statue 660 475', 'diamant 780 s1', 'coffre 880 610', 'chandelier 935 480', 'cloche 930 245'] },
      { nom: 'la chambre de la princesse', mur: '#FFE4F1', sol: '#E9B6D0', motif: 'pois', solType: 'tapis', fenetre: 'arche',
        supports: ['etagere 30 150 300', 'table 640 780 525'],
        objets: ['parfum 65 s0', 'commode 90 475', 'vase 125 s0', 'coffre 220 610', 'nounours 340 615', 'coeur 500 235',
          'lit 500 525 1.4', 'lampe 680 s1', 'couronne 745 s1', 'pouf 680 615', 'chaussure 820 615', 'armoire 920 475 1.1'] },
      { nom: 'la cuisine du château', mur: '#F2E6D2', sol: '#8C6A4F', motif: 'briques', solType: 'pierre', fenetre: 'carree',
        supports: ['comptoir 330 700', 'etagere 840 990 270'],
        objets: ['four 110 475 1.2', 'chaudron 260 615', 'pain 370 s0', 'fromage 445 s0', 'lanterne 500 210', 'pomme 520 s0',
          'tarte 595 s0', 'panier 665 s0', 'tonneau 780 480', 'marmite 880 s1', 'bocal 950 s1', 'caisse 920 615'] },
      { nom: 'la tour du magicien', mur: '#DCD3F5', sol: '#5E4E8C', motif: 'etoiles', solType: 'parquet', fenetre: 'ronde',
        supports: ['etagere 340 660 300', 'table 380 620 605'],
        objets: ['planete 70 255', 'etagere 90 470', 'chaudron 250 615', 'potion 380 s0', 'boule_cristal 460 s0', 'parchemin 450 s1',
          'lune 500 195', 'sablier 540 s0', 'baton_magique 550 s1', 'livres 620 s0', 'telescope 800 480', 'etoile 930 250'] },
      { nom: 'le donjon', mur: '#CFCAD6', sol: '#77707F', motif: 'pierre', solType: 'pierre', fenetre: 'ronde',
        objets: ['echelle 90 475 1.1', 'champignon 200 615', 'carte_tresor 230 330', 'cage 320 480', 'os 420 615', 'lanterne 470 245',
          'amphore 560 480', 'engrenage 640 225', { f: 'dinosaure', c: 'violet', nom: 'le dragon', at: '770 575 1.4' },
          'tonneau 925 480', 'bouclier 930 250', 'coffre 935 615'] }
    ]
  },
  {
    id: 'musee', nom: 'Musée', embleme: 'colonne',
    couleurs: { facade: '#F4EFE6', toit: '#C9B79C', accent: '#7FB3F5' },
    etages: [
      { nom: 'le hall', mur: '#F5F0E8', sol: '#D8CBB4', motif: 'uni', solType: 'damier', fenetre: 'arche',
        supports: ['comptoir 640 860'],
        objets: ['colonne 90 475 1.2', 'valise 230 615', 'parapluie 300 475', 'carte_tresor 380 245', 'statue 500 480 1.2', 'banc 500 615',
          'lanterne 620 225', 'telephone 680 s0', 'livres 750 s0', 'globe 820 s0', 'plante 930 475', 'horloge 930 255'] },
      { nom: 'les dinosaures', mur: '#E2F0D9', sol: '#B7A27F', motif: 'vagues', solType: 'herbe', fenetre: 'carree',
        supports: ['socle 200 580', 'socle 830 580', 'socle 945 625'],
        objets: ['nichoir 70 255', 'sapin 90 470', 'os 200 s0', 'arbre 250 470', 'fleur 365 470', 'champignon 400 620',
          'dinosaure 560 545 1.7', 'cactus 700 620', 'coquillage 830 s1', 'buisson 935 480', 'carte_tresor 935 260', 'boussole 945 s2'] },
      { nom: "l'Égypte", mur: '#FBE9C4', sol: '#E0C08A', motif: 'losanges', solType: 'pierre', fenetre: 'arche',
        supports: ['socle 390 615', 'socle 660 575'],
        objets: ['collier 70 250', 'amphore 110 475', 'cactus 240 615', 'trone 300 480', 'parchemin 390 s0', 'masque 500 210',
          'pyramide 510 480 2', 'sablier 660 s1', 'colonne 770 475', 'coffre 870 615', 'statue 930 475', 'carte_tresor 930 255'] },
      { nom: 'les peintures', mur: '#FFF7EC', sol: '#B98556', motif: 'uni', solType: 'parquet', fenetre: 'vitrail',
        supports: ['socle 370 575', 'table 600 780 605'],
        objets: ['lampadaire 90 475', 'chevalet 240 520', 'miroir 365 245', 'vase 370 s0', 'tableau 500 255 1.3', 'banc 500 615',
          'pinceaux 630 s1', 'crayon 690 s1', 'pomme 750 s1', 'tournesol 790 475', 'plante 935 475', 'palette 930 255'] },
      { nom: 'les sciences', mur: '#E3EEFF', sol: '#9DB2D6', motif: 'carreaux', solType: 'carrelage', fenetre: 'ronde',
        supports: ['socle 330 570', 'table 510 730 610', 'socle 860 600'],
        objets: ['robot 110 480', 'antenne 260 475', 'globe 330 s0', 'engrenage 380 230', 'planete 500 200', 'microscope 550 s1',
          'eprouvette 620 s1', 'tableau 620 225', 'telescope 680 470', 'ordinateur 690 s1', 'aimant 860 s2', 'fusee 930 475 1.2'] },
      { nom: 'les jouets anciens', mur: '#FFE9DC', sol: '#C99A6E', motif: 'pois', solType: 'parquet', fenetre: 'carree',
        supports: ['etagere 380 620 290'],
        objets: ['ballons 70 250', 'nounours 110 480', 'tambour 240 480', 'cubes 300 615', 'trompette 420 s0', 'radio 500 s0',
          'quilles 560 605', 'toupie 580 s0', 'ballon 700 615', 'velo 760 480', 'trottinette 925 480', 'cerf_volant 930 255'] }
    ]
  },
  {
    id: 'labo', nom: 'Labo', embleme: 'potion',
    couleurs: { facade: '#DDF6F3', toit: '#5FD3CE', accent: '#B48CDB' },
    etages: [
      { nom: "l'accueil du labo", mur: '#EEF7F6', sol: '#C3D6D4', motif: 'carreaux', solType: 'carrelage', fenetre: 'carree',
        supports: ['table 400 620 495', 'table 700 830 610'],
        objets: ['plante 75 475', 'canape 260 480 1.1', 'cartable 330 615', 'ordinateur 440 s0', 'tableau_noir 500 215', 'telephone 520 s0',
          'crayon 590 s0', 'chaise 500 610', 'aquarium 735 s1', 'lampe 795 s1', 'etagere 920 470', 'horloge 925 250'] },
      { nom: 'la chimie', mur: '#E9F9E4', sol: '#A9CFA0', motif: 'pois', solType: 'carrelage', fenetre: 'ronde',
        supports: ['comptoir 300 700'],
        objets: ['lavabo 110 475', 'chaudron 250 615', 'eprouvette 340 s0', 'potion 420 s0', 'horloge 500 200', 'bocal 500 s0',
          'balance 580 s0', 'sablier 660 s0', 'chaise 600 615', 'plante 780 610', 'frigo 900 470', 'tableau 930 255'] },
      { nom: 'les robots', mur: '#E4E8F2', sol: '#8C96AD', motif: 'carreaux', solType: 'damier', fenetre: 'carree',
        supports: ['table 600 790 610'],
        objets: ['horloge 70 250', 'antenne 120 475', 'cubes 250 615', 'echelle 320 475', 'engrenage 380 220', 'robot 500 500 1.4',
          'tableau 620 225', 'radio 635 s0', 'aimant 700 s0', 'telephone 760 s0', 'caisse 790 480', 'television 920 475'] },
      { nom: 'la biologie', mur: '#F1FBE6', sol: '#B7D69A', motif: 'vagues', solType: 'herbe', fenetre: 'arche',
        supports: ['table 380 620 565', 'table 720 830 610'],
        objets: ['cactus 90 475', 'fleur 220 475', 'champignon 300 615', 'microscope 420 s0', 'tableau_noir 500 220', 'coquillage 500 s0',
          'pomme 580 s0', 'arrosoir 640 615', 'tournesol 760 475', 'aquarium 775 s1', 'cage 900 475', 'nichoir 930 250'] },
      { nom: "l'espace", mur: '#2E2A5C', sol: '#4A4580', motif: 'etoiles', solType: 'damier', fenetre: 'ronde',
        supports: ['socle 250 590', 'socle 350 625', 'table 620 760 615'],
        objets: ['soleil 70 255', 'robot 120 480', 'globe 250 s0', 'diamant 350 s1', 'planete 400 225', 'fusee 500 475 1.5',
          'lune 600 205', 'ordinateur 655 s2', 'boussole 725 s2', 'telescope 800 480', 'antenne 950 480', 'etoile 930 255'] },
      { nom: 'la serre sur le toit', mur: '#DDF5E3', sol: '#8FCB7E', motif: 'losanges', solType: 'herbe', fenetre: 'ciel',
        supports: ['table 520 720 565'],
        objets: ['tournesol 100 475', 'fleur 300 480', 'panier 300 615', 'nuage 400 165', 'arrosoir 450 615', 'fraise 560 s0',
          'pomme 620 s0', 'chapeau 680 s0', 'cerf_volant 700 205', 'buisson 800 480', 'tonneau 900 610', 'arbre 945 470'] }
    ]
  },
  {
    id: 'ecole', nom: 'École', embleme: 'crayon',
    couleurs: { facade: '#FFF0C9', toit: '#F5B21B', accent: '#7FB3F5' },
    etages: [
      { nom: 'la classe', mur: '#FFF8E1', sol: '#C99A6E', motif: 'uni', solType: 'parquet', fenetre: 'carree',
        supports: ['table 400 620 480'],
        objets: ['etagere 90 470', 'chaise 190 610', 'bureau 320 605', 'carte_tresor 370 245', 'globe 440 s0', 'cartable 440 620',
          'tableau_noir 500 225 1.3', 'livres 510 s0', 'pomme 580 s0', 'pouf 760 610', 'plante 930 475', 'horloge 930 255'] },
      { nom: 'la bibliothèque', mur: '#F3E7DA', sol: '#9C6B45', motif: 'rayures', solType: 'tapis', fenetre: 'arche',
        supports: ['table 440 620 580'],
        objets: ['etagere 100 470 1.1', 'fauteuil 280 570', 'lampadaire 390 470', 'livres 475 s0', 'carte_tresor 500 230', 'lampe 545 s0',
          'coussin 540 620', 'parchemin 600 s0', 'canape 720 500 1.1', 'pouf 880 615', 'commode 925 475', 'tableau 930 250'] },
      { nom: 'la cantine', mur: '#E6F6FF', sol: '#C9DCEB', motif: 'carreaux', solType: 'damier', fenetre: 'carree',
        supports: ['comptoir 330 690', 'table 300 620 620'],
        objets: ['frigo 100 470', 'chaise 200 615', 'tasse 360 s1', 'marmite 365 s0', 'pain 440 s0', 'pomme 440 s1',
          'horloge 500 210', 'fromage 515 s0', 'tarte 590 s0', 'glace 665 s0', 'panier 800 615', 'four 880 475 1.1'] },
      { nom: 'la salle de musique', mur: '#F4E6FF', sol: '#B88FD0', motif: 'vagues', solType: 'parquet', fenetre: 'ronde',
        supports: ['table 820 970 480'],
        objets: ['piano 140 480 1.2', 'chaise 300 615', 'guitare 340 480', 'masque 380 235', 'violon 500 230', 'tambour 500 615',
          'etoile 620 225', 'micro 700 480', 'pouf 780 615', 'radio 855 s0', 'trompette 930 s0', 'cloche 930 250'] },
      { nom: 'le gymnase', mur: '#FFE9DC', sol: '#E3A86B', motif: 'rayures', solType: 'parquet', fenetre: 'carree',
        objets: ['echelle 90 470 1.2', 'cubes 230 615', 'coffre 320 475', 'etoile 380 230', 'ballon 400 615', 'banc 490 470',
          'horloge 500 210', 'quilles 600 605', 'ballons 620 225', 'trottinette 680 480', 'velo 800 610', 'drapeau 925 480'] },
      { nom: 'la cour de récré', mur: '#D3EDFF', sol: '#A8DDA0', motif: 'uni', solType: 'herbe', fenetre: 'ciel',
        objets: ['arbre 100 470 1.3', 'trottinette 200 615', 'toboggan 320 490 1.4', 'nuage 380 160', 'ballon 460 615', 'ballons 540 215',
          'velo 610 610', 'cerf_volant 640 175', 'banc 700 480', 'fleur 860 480', 'fontaine 820 615', 'buisson 945 615'] }
    ]
  }
];

// ── Bâtiments des quartiers : débloqués par les étoiles gagnées (QUARTIERS) ──
BATIMENTS.push(
  {
    id: 'theatre', nom: 'Théâtre', embleme: 'masque', quartier: 'spectacles',
    couleurs: { facade: '#FFE1E6', toit: '#C0394B', accent: '#FFD466' },
    etages: [
      { nom: "le hall d'entrée", mur: '#FFF0F3', sol: '#E3C7A6', motif: 'losanges', solType: 'damier', fenetre: 'arche',
        supports: ['comptoir 600 840'],
        objets: ['plante 75 470', 'banc 300 480', 'cloche 380 235', 'valise 450 615', 'tableau 500 225', 'parapluie 560 475',
          'billet 640 s0', 'telephone 720 s0', 'pouf 740 615', 'bocal 800 s0', 'lampadaire 920 475', 'horloge 925 250'] },
      { nom: 'la scène', mur: '#3E2F5B', sol: '#B98556', motif: 'etoiles', solType: 'parquet', fenetre: 'aucune',
        supports: ['socle 800 615'],
        objets: ['etoile 120 230', 'piano 150 480 1.2', 'masque 300 230', 'tambour 330 615', 'guitare 340 480', 'rideau 500 300 2.4',
          'micro 500 490', 'chaise 640 615', 'violon 700 230', 'vase 800 s0', 'projecteur 870 480', 'ballons 920 230'] },
      { nom: 'les coulisses', mur: '#E9E2D8', sol: '#9C7A5A', motif: 'briques', solType: 'parquet', fenetre: 'ronde',
        supports: ['table 760 900 600'],
        objets: ['echelle 90 475 1.1', 'chaise 200 615', 'caisse 300 480', 'valise 400 615', 'epee 400 230', 'coffre 520 480',
          'radio 560 615', 'bouclier 600 230', 'armure 690 480', 'baton_magique 790 s0', 'couronne 865 s0', 'lanterne 930 255'] },
      { nom: 'la loge', mur: '#FFE4EC', sol: '#F0B9CB', motif: 'pois', solType: 'tapis', fenetre: 'ronde',
        supports: ['comptoir 330 670'],
        objets: ['robe 100 230', 'mannequin 110 480', 'rouge_levres 370 s0', 'parfum 440 s0', 'miroir 500 290', 'peigne 510 s0',
          'chaise 500 610', 'vernis 580 s0', 'pinceaux 645 s0', 'canape 800 500 1.1', 'etoile 930 250', 'lampadaire 945 480'] },
      { nom: 'les costumes', mur: '#E8EEFF', sol: '#B7C4EA', motif: 'rayures', solType: 'tapis', fenetre: 'carree',
        supports: ['etagere 470 650 280'],
        objets: ['armoire 90 475 1.1', 'pouf 260 615', 'mannequin 330 490', 'robe 400 230', 'couronne 500 s0', 'chaussure 520 615',
          'chapeau 560 s0', 'sac_main 620 s0', 'commode 770 480', 'valise 760 615', 'parapluie 940 480', 'masque 930 250'] },
      { nom: 'la salle de spectacle', mur: '#4A3B6B', sol: '#C0394B', motif: 'etoiles', solType: 'tapis', fenetre: 'aucune',
        objets: ['projecteur 120 470', 'fauteuil 120 600', 'etoile 250 200', 'pouf 270 615', 'canape 420 610 1.1', 'rideau 500 330 2.2',
          'chaise 620 610', 'lune 750 200', 'coussin 760 620', 'tambour 860 480', 'banc 900 610', 'ballons 920 250'] }
    ]
  },
  {
    id: 'ferme', nom: 'Ferme', embleme: 'vache', quartier: 'campagne',
    couleurs: { facade: '#FBE3C8', toit: '#C0504D', accent: '#9BDB8A' },
    etages: [
      { nom: "l'étable", mur: '#E9D3B4', sol: '#E8C77A', motif: 'rayures', solType: 'herbe', fenetre: 'carree',
        objets: ['botte_foin 110 480', 'brouette 150 610', 'vache 300 525 1.4', 'cloche 380 230', 'seau 470 615', 'lanterne 500 230',
          'bidon 560 615', 'echelle 640 475', 'mouton 770 530 1.1', 'panier 870 615', 'tonneau 930 480', 'nichoir 930 250'] },
      { nom: 'le poulailler', mur: '#FFF1D6', sol: '#E8C77A', motif: 'pois', solType: 'herbe', fenetre: 'ronde',
        supports: ['etagere 380 620 290'],
        objets: ['lanterne 70 250', 'cage 110 480', 'canard 250 615', 'tonneau 320 480', 'oeufs 410 s0', 'brouette 450 610',
          'poule 490 s0', 'panier 570 s0', 'echelle 650 475', 'arrosoir 700 615', 'botte_foin 860 480', 'nichoir 930 250'] },
      { nom: 'la grange', mur: '#D9A982', sol: '#B98556', motif: 'briques', solType: 'parquet', fenetre: 'arche',
        objets: ['velo 110 480', 'tracteur 300 520 1.3', 'cloche 385 230', 'arrosoir 450 615', 'echelle 500 475 1.2', 'lanterne 500 210',
          'citrouille 560 615', 'epouvantail 640 480', 'caisse 760 480', 'seau 830 615', 'tonneau 920 480', 'nichoir 930 250'] },
      { nom: 'la cuisine de la ferme', mur: '#FFF8E1', sol: '#C98F6B', motif: 'carreaux', solType: 'carrelage', fenetre: 'carree',
        supports: ['comptoir 330 700', 'table 300 600 620'],
        objets: ['four 110 475 1.2', 'chaise 220 615', 'pain 370 s0', 'tarte 380 s1', 'fromage 445 s0', 'tasse 470 s1',
          'horloge 500 205', 'bidon 520 s0', 'theiere 550 s1', 'oeufs 595 s0', 'pomme 665 s0', 'frigo 900 470'] },
      { nom: 'le potager', mur: '#CFE8FF', sol: '#9BC97A', motif: 'uni', solType: 'herbe', fenetre: 'champ',
        objets: ['tournesol 100 470', 'carotte 180 615', 'citrouille 300 615 1.3', 'nuage 300 160', 'fraise 420 615', 'epouvantail 500 480 1.1',
          'arrosoir 560 615', 'panier 660 615', 'arbre 700 470 1.1', 'brouette 800 610', 'buisson 880 480', 'lapin 920 615'] },
      { nom: 'le verger', mur: '#CFE8FF', sol: '#A8DDA0', motif: 'uni', solType: 'herbe', fenetre: 'champ',
        objets: ['arbre 100 470 1.3', 'champignon 170 615', 'panier 260 615', 'fontaine 300 480', 'pomme 340 615', 'fleur 420 470',
          'nuage 450 150', 'canard 520 615', 'banc 540 480', 'cerf_volant 650 180', 'cochon 700 560 1.1', 'mouton 870 520'] }
    ]
  }
);

// Quartiers : en gagnant des étoiles (total depuis le début, economy.totalEarned),
// la ville s'agrandit d'un quartier, avec de nouveaux bâtiments à choisir.
// decor : formes de js/objets.js dessinées sur son morceau de carte.
const QUARTIERS = [
  { id: 'spectacles', nom: 'Le quartier des spectacles', seuil: 150, sol: '#F6D6E4',
    decor: ['projecteur', 'ballons', 'rideau', 'etoile', 'micro', 'billet'] },
  { id: 'campagne', nom: 'La campagne', seuil: 400, sol: '#BFE5A8',
    decor: ['arbre', 'vache', 'botte_foin', 'tracteur', 'poule', 'citrouille'] }
];

// La salle de jeux : un bâtiment de la ville sans liste (js/arcade.js)
const SALLE_JEUX = {
  id: 'salle', nom: 'Salle de jeux', embleme: null,
  couleurs: { facade: '#5B4E92', toit: '#FF7EB9', accent: '#5FD3CE' }
};

// Objets par étage (le décor en prévoit 12 emplacements)
const OBJETS_PAR_ETAGE = 12;
