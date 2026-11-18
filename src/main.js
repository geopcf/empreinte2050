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
import './menu.js'
import './ajout-evenement.js'
import { afficherEvenements } from './evenements.js'

setWorkerUrl(workerUrl)

// Style vectoriel libre, sans clé d'API (https://openfreemap.org)
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

// Centre approximatif de la France métropolitaine
const FRANCE_CENTER = [2.2137, 46.2276]

function estMobile() {
  return window.innerWidth <= 640
}

// Sur mobile, on décale le centre et on dézoome pour que la France
// s'affiche sous le menu en haut à gauche.
function parametresVue() {
  if (estMobile()) {
    return { center: [2.2137, 51.5], zoom: 4.0 }
  }
  return { center: [0.8, FRANCE_CENTER[1]], zoom: 5.2 }
}

const vueInitiale = parametresVue()

function demarrerCompteARebours() {
  const conteneur = document.getElementById('compte-a-rebours')
  if (!conteneur) return

  const cible = new Date(2026, 11, 14, 18, 30, 0)
  const parties = {
    jours: conteneur.querySelector('[data-part="jours"]'),
    heures: conteneur.querySelector('[data-part="heures"]'),
    minutes: conteneur.querySelector('[data-part="minutes"]'),
    secondes: conteneur.querySelector('[data-part="secondes"]'),
  }

  function mettreAJour() {
    const maintenant = new Date()
    const difference = cible.getTime() - maintenant.getTime()

    if (difference <= 0) {
      conteneur.textContent = 'Événement en cours / terminé'
      return
    }

    const secondesTotales = Math.floor(difference / 1000)
    const jours = Math.floor(secondesTotales / 86400)
    const heures = Math.floor((secondesTotales % 86400) / 3600)
    const minutes = Math.floor((secondesTotales % 3600) / 60)
    const secondes = secondesTotales % 60

    if (parties.jours) parties.jours.textContent = String(jours).padStart(2, '0')
    if (parties.heures) parties.heures.textContent = String(heures).padStart(2, '0')
    if (parties.minutes) parties.minutes.textContent = String(minutes).padStart(2, '0')
    if (parties.secondes) parties.secondes.textContent = String(secondes).padStart(2, '0')
  }

  mettreAJour()
  window.setInterval(mettreAJour, 1000)
}

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

  afficherEvenements(map).catch((erreur) => {
    console.error('Erreur lors du chargement des événements :', erreur)
  })

  demarrerCompteARebours()
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
