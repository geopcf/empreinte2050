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
src/filtres.js      # menu de filtres (période + type)
src/style.css       # styles (carte, bouton, panneau, épingles, popups)
public/data/        # vos données (data.csv, GeoJSON…)
public/images/      # images (pin.svg…)
```

## Filtres

Le menu en haut à gauche permet de filtrer les épingles :

- **Période** : « À venir » (par défaut, inclut les événements du jour) ou « Tous ».
  La comparaison se fait sur la colonne `date` au format ISO.
- **Type** : liste déroulante alimentée automatiquement par les valeurs de la
  colonne `type`.

Le compteur sous les filtres indique le nombre d'événements affichés. Une
infobulle ouverte est refermée dès qu'un filtre change.

Le bouton **« Ajouter un événement »** ouvre un e-mail prérempli vers
`section.briesenart@seineetmarne.pcf.fr` avec l'objet
`[empreinte 2050] ajouter un évènement`.

## Événements (`public/data/data.csv`)

Chaque ligne du CSV devient une épingle (`public/images/pin.svg`). Un clic sur
une épingle ouvre une infobulle avec les informations de l'événement.

Colonnes attendues :

| Colonne | Exemple | Remarque |
|---|---|---|
| `date` | `2026-12-14` | **format ISO** `AAAA-MM-JJ` |
| `heure` | `18:30` | **format ISO** `HH:MM` (24 h) |
| `localisation` | `"48.8779, 2.3720"` | latitude, longitude séparées par une virgule |
| `type` | `Présentation` | affiché en pastille |
| `lieu` | `Sous la Coupole · Siège national du PCF · Paris` | le premier segment sert de titre, les suivants de sous-titre |
| `inscription_obloigatoire` | `oui` | indique si l'inscription est obligatoire |
| `inscription` | `contact@exemple.fr` | e-mail (`mailto:`) ou URL (affiché dans l'infobulle) |
| `presentiel` | `oui`/`non` | affiche « Présentiel » si `oui` |
| `distanciel` | `oui`/`non` | affiche le lien distanciel si `oui` |
| `lien_distanciel` | `https://…` | URL de participation en distanciel |
| `précisions` | `texte libre` | affichées en bas de l'infobulle |

Les dates et heures sont stockées en ISO dans le fichier, puis mises en forme en
français dans les infobulles (`Lundi 14 décembre 2026`, `18 h 30`). Ce format
évite toute ambiguïté et permet de trier les événements facilement.

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
