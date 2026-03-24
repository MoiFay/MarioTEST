# Super Plumber Sprint DX

Mini jeu de plateforme jouable dans le navigateur, inspire des sensations d'un Mario-like sans reprendre d'assets Nintendo.

## Lancer le jeu

Ouvre [index.html](./index.html) dans un navigateur moderne.

Si tu preferes servir le dossier en local:

```powershell
python -m http.server 8000
```

Puis ouvre `http://localhost:8000`.

## Commandes

- `Fleche gauche` ou `A`: aller a gauche
- `Fleche droite` ou `D`: aller a droite
- `Espace`, `W` ou `Fleche haut`: sauter
- `P`: pause
- `M`: couper ou remettre le son
- `R`: rejouer le niveau en cours
- `Entree`: demarrer une nouvelle partie

## Contenu

- 3 niveaux avec progression automatique
- score, vies, timer et compteur de pieces
- musique retro generee en Web Audio API
- sprites pixel-art originaux dessines dans le canvas
- interface adaptee Android/iPad avec commandes tactiles visibles sur tablette
- gros boutons tactiles fixes en bas d'ecran pour jouer sur mobile/tablette
- bouton plein ecran quand le navigateur le permet

Sur mobile, les boutons tactiles apparaissent sous le canvas.
