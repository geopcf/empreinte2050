import { Marker, Popup } from 'maplibre-gl'
import { csvParse } from 'd3-dsv'

// Icônes SVG (style Lucide, licence ISC)
const ICONES = {
  epingle:
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  presentiel:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
}

function icone(nom) {
  return `<svg class="popup-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONES[nom]}</svg>`
}

function echapper(texte) {
  return String(texte ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function estUrl(valeur) {
  return /^https?:\/\//i.test(String(valeur).trim())
}

function estEmail(valeur) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(valeur).trim())
}

function formaterLieu(lieu) {
  return String(lieu ?? '')
    .split(/[·.]/)
    .map((partie) => partie.trim())
    .filter(Boolean)
    .join(' · ')
}

function contactEnHtml(contact) {
  if (!contact) return 'non communiqué'
  if (estEmail(contact)) {
    return `<a href="mailto:${echapper(contact)}">${echapper(contact)}</a>`
  }
  if (estUrl(contact)) {
    return `<a href="${echapper(contact)}" target="_blank" rel="noopener noreferrer">${echapper(contact)}</a>`
  }
  return echapper(contact)
}

function creerHtmlPopup(evenement) {
  const { lieu, titre } = evenement
  const contact = String(evenement.contact ?? '').trim()
  const precisions = String(evenement['précisions'] ?? evenement.precisions ?? '').trim()
  const titreEvenement = String(titre ?? '').trim()

  // Cas particulier : présentation du plan climat
  if (titreEvenement === 'Présentation du plan climat') {
    const adresse = formaterLieu(lieu) || 'adresse non communiquée'
    const email = echapper(contact || 'contact@ecologie.pcf.fr')
    return `
      <div class="popup-evenement">
        <h3 class="popup-titre" style="color: var(--accent)">Présentation en présentiel du plan climat Empreinte 2050</h3>
        <hr class="popup-separateur">
        <p class="popup-sous-titre">${icone('epingle')}${echapper(adresse)}</p>
        <ul class="popup-details"><li>${icone('presentiel')}<span><a href="mailto:${email}">${email}</a> <span class="popup-inscription">(inscription obligatoire)</span></span></li></ul>
      </div>
    `
  }

  // Écoutes collectives : le titre est l'organisateur
  const organisateur = String(evenement.organisateur ?? '').trim()
  const nomLieu = organisateur || (titreEvenement === 'Ecoute collective' ? '' : titreEvenement)
  const adresse = formaterLieu(lieu) || 'adresse non communiquée'

  return `
    <div class="popup-evenement">
      ${nomLieu ? `<h3 class="popup-titre" style="color: var(--accent)">${echapper(nomLieu)}</h3><hr class="popup-separateur">` : ''}
      <p class="popup-sous-titre">${icone('epingle')}${echapper(adresse)}</p>
      <ul class="popup-details"><li>${icone('presentiel')}<span>${contactEnHtml(contact)}</span></li></ul>
      ${
        precisions
          ? `<p class="popup-precisions">${echapper(precisions).replaceAll('\\n', '<br>')}</p>`
          : ''
      }
    </div>
  `
}

function normaliserCles(objet) {
  const resultat = {}
  for (const [cle, valeur] of Object.entries(objet ?? {})) {
    resultat[String(cle).trim().toLowerCase()] = valeur
  }
  return resultat
}

function parserEvenement(ligne) {
  const donnees = normaliserCles(ligne)

  const [latitude, longitude] = String(donnees.localisation ?? '')
    .split(',')
    .map((valeur) => Number.parseFloat(valeur.trim()))

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    console.warn('Coordonnées invalides pour :', donnees.adresse || donnees.type)
    return null
  }

  // La colonne `type` du CSV sert de titre, `adresse` de lieu.
  const titre = String(donnees.type ?? '').trim()
  const lieu = String(donnees.adresse ?? donnees.lieu ?? '').trim()

  return { ...donnees, latitude, longitude, titre, lieu }
}

let popupActif = null

/**
 * Charge public/data/data.csv et affiche une épingle par événement.
 * Retourne la liste { evenement, marker }.
 */
export async function afficherEvenements(map, url = `${import.meta.env.BASE_URL}data/data.csv`) {
  const reponse = await fetch(url)
  if (!reponse.ok) {
    throw new Error(`Impossible de charger ${url} (${reponse.status})`)
  }

  const evenements = csvParse(await reponse.text())
    .map(parserEvenement)
    .filter(Boolean)

  const elements = []

  evenements.forEach((evenement) => {
    const element = document.createElement('div')
    element.className = 'pin'
    element.setAttribute('role', 'button')
    element.tabIndex = 0
    element.title = evenement.titre || evenement.lieu || 'Événement'

    const image = document.createElement('img')
    image.src = `${import.meta.env.BASE_URL}images/pin.svg`
    image.alt = evenement.lieu || 'Événement'
    image.width = 30
    image.height = 40
    image.draggable = false

    element.appendChild(image)

    const ouvrirPopup = () => {
      popupActif?.remove()

      popupActif = new Popup({
        offset: 44,
        closeButton: true,
        closeOnClick: true,
        maxWidth: '310px',
      })
        .setLngLat([evenement.longitude, evenement.latitude])
        .setHTML(creerHtmlPopup(evenement))
        .addTo(map)

      popupActif.on('close', () => {
        popupActif = null
      })
    }

    element.addEventListener('click', (event) => {
      event.stopPropagation()
      ouvrirPopup()
    })

    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        ouvrirPopup()
      }
    })

    const marker = new Marker({ element, anchor: 'bottom' })
      .setLngLat([evenement.longitude, evenement.latitude])
      .addTo(map)

    elements.push({ evenement, marker })
  })

  return elements
}
