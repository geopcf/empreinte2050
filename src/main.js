import {
  Map,
  NavigationControl,
  GeolocateControl,
  setWorkerUrl,
} from 'maplibre-gl'
// Le worker doit être servi explicitement (sinon Vite le résout mal en dev/build)
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import './a-propos.js'
import './ajout-evenement.js'
import { afficherEvenements } from './evenements.js'
import { creerMenuFiltres } from './filtres.js'

setWorkerUrl(workerUrl)

// Style vectoriel libre, sans clé d'API (https://openfreemap.org)
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

// Centre approximatif de la France métropolitaine
const FRANCE_CENTER = [2.2137, 46.2276]

function estMobile() {
  return window.innerWidth <= 640
}

// Sur mobile, on décale le centre vers le sud et on dézoome pour que la France
// s'affiche sous le menu de filtres (en haut à gauche).
function parametresVue() {
  if (estMobile()) {
    return { center: [2.2137, 50.5], zoom: 4.0 }
  }
  return { center: FRANCE_CENTER, zoom: 5.2 }
}

const vueInitiale = parametresVue()

const map = new Map({
  container: 'map',
  style: STYLE_URL,
  center: vueInitiale.center,
  zoom: vueInitiale.zoom,
  minZoom: 3,
  maxZoom: 18,
  attributionControl: false,
})

map.addControl(new NavigationControl(), 'top-right')

// Réadapte la vue lors du passage mobile <-> bureau
let etaitMobile = estMobile()
window.addEventListener('resize', () => {
  const mobile = estMobile()
  if (mobile !== etaitMobile) {
    etaitMobile = mobile
    const vue = parametresVue()
    map.easeTo({ center: vue.center, zoom: vue.zoom, duration: 400 })
  }
})

map.on('load', () => {
  map.addControl(
    new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    }),
    'top-right'
  )

  afficherEvenements(map)
    .then((elements) => creerMenuFiltres(elements))
    .catch((erreur) => {
      console.error('Erreur lors du chargement des événements :', erreur)

      const compteur = document.getElementById('menu-compteur')
      if (compteur) {
        compteur.textContent = 'Impossible de charger les événements.'
      }
    })
})

/**
 * Ajoute un fichier GeoJSON déposé dans public/data/.
 * Exemple : loadGeoJSON('/data/regions.geojson', '#3b82f6')
 */
export async function loadGeoJSON(url, color = '#3b82f6', id = 'data') {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Impossible de charger ${url} (${response.status})`)
  }
  const geojson = await response.json()

  if (map.getLayer(`${id}-fill`)) map.removeLayer(`${id}-fill`)
  if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`)
  if (map.getSource(id)) map.removeSource(id)

  map.addSource(id, { type: 'geojson', data: geojson })

  map.addLayer({
    id: `${id}-fill`,
    type: 'fill',
    source: id,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': color, 'fill-opacity': 0.35 },
  })

  map.addLayer({
    id: `${id}-line`,
    type: 'line',
    source: id,
    paint: { 'line-color': color, 'line-width': 1.5 },
  })

  return geojson
}

// Utile pour bricoler depuis la console du navigateur
window.map = map
window.loadGeoJSON = loadGeoJSON
