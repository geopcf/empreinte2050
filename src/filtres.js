import { fermerPopup } from './evenements.js'

function dateDepuisISO(valeur) {
  const correspondance = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valeur ?? '').trim())
  if (!correspondance) return null

  const [, annee, mois, jour] = correspondance
  return new Date(Number(annee), Number(mois) - 1, Number(jour))
}

/**
 * Branche le menu de filtres (période + type) sur les épingles affichées.
 * @param {Array<{evenement: object, marker: import('maplibre-gl').Marker}>} elements
 */
export function creerMenuFiltres(elements) {
  const menu = document.getElementById('menu')
  const boutonsPeriode = [...document.querySelectorAll('[data-periode]')]
  const selectType = document.getElementById('filtre-type')
  const compteur = document.getElementById('menu-compteur')

  if (!menu || !selectType || !compteur) return

  const types = [
    ...new Set(
      elements
        .map(({ evenement }) => String(evenement.type ?? '').trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, 'fr'))

  types.forEach((type) => {
    const option = document.createElement('option')
    option.value = type
    option.textContent = type
    selectType.appendChild(option)
  })

  let periode = 'avenir'

  function appliquerFiltres() {
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)

    const typeChoisi = selectType.value
    let visibles = 0

    elements.forEach(({ evenement, marker }) => {
      const date = dateDepuisISO(evenement.date)
      const correspondPeriode =
        periode === 'tous' || (date !== null && date >= aujourdhui)

      const type = String(evenement.type ?? '').trim()
      const correspondType = !typeChoisi || type === typeChoisi

      const visible = correspondPeriode && correspondType
      marker.getElement().style.display = visible ? '' : 'none'

      if (visible) visibles += 1
    })

    fermerPopup()

    compteur.textContent =
      visibles === 0
        ? 'Aucun événement'
        : `${visibles} événement${visibles > 1 ? 's' : ''} affiché${visibles > 1 ? 's' : ''}`
  }

  boutonsPeriode.forEach((bouton) => {
    bouton.addEventListener('click', () => {
      periode = bouton.dataset.periode

      boutonsPeriode.forEach((autre) => {
        const actif = autre === bouton
        autre.classList.toggle('est-actif', actif)
        autre.setAttribute('aria-pressed', String(actif))
      })

      appliquerFiltres()
    })
  })

  selectType.addEventListener('change', appliquerFiltres)

  appliquerFiltres()
}
