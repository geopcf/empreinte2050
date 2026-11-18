import { Marker, Popup } from 'maplibre-gl'
import { csvParse } from 'd3-dsv'

// Petites icônes SVG (style Lucide, licence ISC)
const ICONES = {
  calendrier:
    '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  horloge: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  epingle:
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  etiquette:
    '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  courriel:
    '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  visio:
    '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  presentiel:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  lien: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
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

function capitaliser(texte) {
  const valeur = String(texte)
  return valeur.charAt(0).toUpperCase() + valeur.slice(1)
}

/**
 * Formate une date ISO (AAAA-MM-JJ) en français : « Lundi 14 décembre 2026 ».
 * Toute autre valeur est renvoyée telle quelle.
 */
export function formaterDate(valeur) {
  const correspondance = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valeur ?? '').trim())
  if (!correspondance) return String(valeur ?? '')

  const [, annee, mois, jour] = correspondance
  const date = new Date(Number(annee), Number(mois) - 1, Number(jour))

  return capitaliser(
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  )
}

/**
 * Formate une heure ISO (HH:MM) à la française : « 18 h 30 ».
 * Accepte aussi « 18:30 », « 18h30 » ou « 18 h 30 ».
 */
export function formaterHeure(valeur) {
  const correspondance = /^(\d{1,2})\s*(?:[:hH]\s*(\d{2}))?/.exec(
    String(valeur ?? '').trim()
  )
  if (!correspondance) return String(valeur ?? '')

  const heures = correspondance[1].padStart(2, '0')
  const minutes = correspondance[2]

  return !minutes || minutes === '00'
    ? `${heures} h`
    : `${heures} h ${minutes}`
}

function creerHtmlPopup(evenement) {
  const { type, lieu, presentiel, distanciel, titre } = evenement

  const contact = String(
    evenement.inscription ?? evenement.contact ?? ''
  ).trim()
  const inscriptionObligatoire = String(
    evenement.inscription_obloigatoire ??
      evenement.inscription_obligatoire ??
      ''
  ).trim()
  const contactObligatoire = /^(oui|yes|true|1)$/i.test(inscriptionObligatoire)
  const precisions = String(
    evenement['précisions'] ?? evenement.precisions ?? ''
  ).trim()

  const titreEvenement = String(titre ?? '').trim()

  let nomLieu = titreEvenement
  let complements = []

  if (nomLieu) {
    complements = String(lieu ?? '')
      .split('·')
      .map((partie) => partie.trim())
      .filter(Boolean)
  } else {
    const segments = String(lieu ?? '')
      .split('·')
      .map((partie) => partie.trim())
      .filter(Boolean)
    nomLieu = segments[0] || ''
    complements = segments.slice(1)
  }

  const lignes = []

  if (evenement.date) {
    lignes.push(
      `<li>${icone('calendrier')}<span>${echapper(formaterDate(evenement.date))}</span></li>`
    )
  }

  if (evenement.heure) {
    lignes.push(
      `<li>${icone('horloge')}<span>${echapper(formaterHeure(evenement.heure))}</span></li>`
    )
  }

  // Mention de contact / inscription sous forme de lien
  let mentionInscription = ''
  if (contact) {
    const libelle = contactObligatoire ? 'inscription obligatoire' : 'contact'
    if (estEmail(contact)) {
      mentionInscription = `<a href="mailto:${echapper(contact)}">${libelle}</a>`
    } else if (estUrl(contact)) {
      mentionInscription = `<a href="${echapper(contact)}" target="_blank" rel="noopener noreferrer">${libelle}</a>`
    } else {
      mentionInscription = `<span>${libelle} — ${echapper(contact)}</span>`
    }
  }

  const modePresentiel = String(presentiel ?? '').trim()
  if (modePresentiel && modePresentiel.toLowerCase() !== 'non') {
    const libelle =
      modePresentiel.toLowerCase() === 'oui' ? 'Présentiel' : capitaliser(modePresentiel)
    const suffixe =
      mentionInscription ? ` <span class="popup-inscription">(${mentionInscription})</span>` : ''
    lignes.push(
      `<li>${icone('presentiel')}<span>${echapper(libelle)}${suffixe}</span></li>`
    )
  } else if (mentionInscription) {
    // Pas de mode présentiel : on affiche la mention seule
    lignes.push(`<li>${icone('presentiel')}<span>${mentionInscription}</span></li>`)
  }

  const distancielBrut = String(distanciel ?? '').trim()
  const lienDistanciel = String(
    evenement.lien_distanciel ?? evenement.lienDistanciel ?? ''
  ).trim()
  const distancielActif =
    distancielBrut &&
    distancielBrut.toLowerCase() !== 'non' &&
    distancielBrut.toLowerCase() !== 'false'

  if (distancielActif) {
    const url = lienDistanciel || (estUrl(distancielBrut) ? distancielBrut : '')
    lignes.push(
      url
        ? `<li>${icone('visio')}<a href="${echapper(url)}" target="_blank" rel="noopener noreferrer">Participer en distanciel</a></li>`
        : `<li>${icone('visio')}<span>${echapper(distancielBrut)}</span></li>`
    )
  }

  return `
    <div class="popup-evenement">
      ${
        type
          ? `<span class="popup-type">${icone('etiquette')}${echapper(type)}</span>`
          : ''
      }
      ${nomLieu ? `<h3 class="popup-titre">${echapper(nomLieu)}</h3>` : ''}
      ${
        complements.length
          ? `<p class="popup-sous-titre">${icone('epingle')}${echapper(
              complements.join(' · ')
            )}</p>`
          : ''
      }
      ${lignes.length ? `<ul class="popup-details">${lignes.join('')}</ul>` : ''}
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
    console.warn('Coordonnées invalides pour :', donnees.lieu || donnees.titre)
    return null
  }

  return { ...donnees, latitude, longitude }
}

let popupActif = null

export function fermerPopup() {
  popupActif?.remove()
  popupActif = null
}

/**
 * Charge public/data/data.csv et affiche une épingle par événement.
 * Retourne la liste { evenement, marker } pour pouvoir la filtrer ensuite.
 */
export async function afficherEvenements(map, url = '/data/data.csv') {
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
    element.title = [evenement.type, evenement.titre || evenement.lieu].filter(Boolean).join(' — ')

    const image = document.createElement('img')
    image.src = '/images/pin.svg'
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
