# Empreinte 2050 — Carte

Carte [MapLibre GL JS](https://maplibre.org/) centrée sur la France, servie par [Vite](https://vite.dev/).

Le fond de carte vectoriel provient d'[OpenFreeMap](https://openfreemap.org) (gratuit, sans clé d'API).

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (par défaut http://localhost:5173).

## Build

```bash
npm run build     # génère dist/
npm run preview   # sert le build localement
```

## Structure

```
index.html          # page unique + bouton « i » et panneau À propos
src/main.js         # création de la carte + helper de chargement
src/a-propos.js     # ouverture / fermeture du panneau latéral
src/evenements.js   # lecture du CSV, épingles et infobulles
src/style.css       # styles (carte, bouton, panneau, épingles, popups)
public/data/        # vos données (data.csv, GeoJSON…)
public/images/      # images (pin.svg…)
```

## Formulaire « Ajouter une écoute collective »

Le bouton du menu ouvre un formulaire qui prépare un courriel prérempli :

- **Destinataire** : `contact@ecologie.pcf.fr`
- **Copie** : `section.briesenart@seineetmarne.pcf.fr`
- **Objet** : `[empreinte 2050] ajouter d'une écoute collective`

Le message contient les champs saisis (section/fédération, lieu, contact, précisions).

## Événements (`public/data/data.csv`)

Chaque ligne du CSV devient une épingle (`public/images/pin.svg`). Un clic sur
une épingle ouvre une infobulle avec les informations de l'événement.

Colonnes attendues :

| Colonne | Exemple | Remarque |
|---|---|---|
| `type` | `Ecoute collective` | utilisé comme titre de l'événement |
| `localisation` | `"48.8779, 2.3720"` | latitude, longitude séparées par une virgule |
| `adresse` | `Sous la Coupole · Paris` | affichée avec l'icône épingle |
| `organisateur` | `Section PCF Brie Sénart` | sert de titre pour les écoutes |
| `contact` | `contact@exemple.fr` | e-mail cliquable (`mailto:`) |
| `précisions` | `texte libre` | affichées en bas de l'infobulle |

Un cas particulier est prévu pour la présentation du plan climat.

## Panneau « À propos »

Le contrôle d'attribution MapLibre est remplacé par un bouton **i** en bas à
droite (fermé par défaut). Un clic ouvre un panneau latéral qui contient les
crédits du fond de carte, la description du projet et les liens utiles.

Le contenu se modifie directement dans `index.html` (bloc `<dialog id="a-propos">`).

## Ajouter des données

Déposez un fichier dans `public/data/`, puis chargez-le :

```js
map.on('load', () => {
  loadGeoJSON('/data/mon-fichier.geojson', '#2e7d5b')
})
```

`loadGeoJSON(url, couleur, id)` ajoute les polygones en remplissage et tous les
tracés en ligne. `map` et `loadGeoJSON` sont aussi exposés sur `window` pour
expérimenter depuis la console du navigateur.
