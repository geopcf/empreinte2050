import { csvParse } from 'd3-dsv'

const dialog = document.getElementById('ajout-evenement')
const form = document.getElementById('form-ajout')
const message = document.getElementById('ajout-message')
const boutonOuvrir = document.getElementById('ouvrir-ajout')
const boutonAnnuler = document.getElementById('annuler-ajout')
const boutonFermer = dialog?.querySelector('.a-propos-fermer')

function ouvrir() {
  message.hidden = true
  dialog?.showModal()
}

function fermer() {
  dialog?.close()
  form?.reset()
  message.hidden = true
}

boutonOuvrir?.addEventListener('click', ouvrir)
boutonAnnuler?.addEventListener('click', fermer)
boutonFermer?.addEventListener('click', fermer)

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) fermer()
})

// Alimente la liste des types existants à partir du CSV
async function chargerTypes() {
  const datalist = document.getElementById('types-existants')
  if (!datalist) return

  try {
    const reponse = await fetch('/data/data.csv')
    if (!reponse.ok) return
    const evenements = csvParse(await reponse.text())
    const types = [
      ...new Set(
        evenements
          .map((ligne) => String(ligne.type ?? ligne.Type ?? '').trim())
          .filter(Boolean)
      ),
    ]

    types.forEach((type) => {
      const option = document.createElement('option')
      option.value = type
      datalist.appendChild(option)
    })
  } catch {
    // silencieux
  }
}

chargerTypes()

function echapperCsv(valeur) {
  const texte = String(valeur ?? '')
  if (/[",\n\r]/.test(texte)) {
    return `"${texte.replaceAll('"', '""')}"`
  }
  return texte
}

function construireMail(donnees) {
  const sujet = '[empreinte 2050] ajouter un évènement'

  // Ligne CSV dans le même ordre que public/data/data.csv,
  // pour copier-coller directement dans le tableau.
  const valeurs = [
    donnees.titre,
    donnees.type,
    donnees.date,
    donnees.heure,
    donnees.localisation,
    donnees.lieu,
    donnees.inscription_obloigatoire ? 'oui' : '',
    donnees.inscription,
    donnees.presentiel ? 'oui' : 'non',
    donnees.distanciel ? 'oui' : 'non',
    donnees.lien_distanciel,
    donnees.description,
  ]

  const corps = valeurs.map(echapperCsv).join(',')

  return `mailto:section.briesenart@seineetmarne.pcf.fr?subject=${encodeURIComponent(
    sujet
  )}&body=${encodeURIComponent(corps)}`
}

form?.addEventListener('submit', (event) => {
  event.preventDefault()

  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const formData = new FormData(form)
  const donnees = Object.fromEntries(formData.entries())
  donnees.presentiel = formData.has('presentiel')
  donnees.distanciel = formData.has('distanciel')
  donnees.inscription_obloigatoire = formData.has('inscription_obloigatoire')

  const url = construireMail(donnees)

  // Ouverture du client mail avec le message prérempli
  window.location.href = url

  message.innerHTML =
    'Votre client mail s’est ouvert avec le message prérempli. Envoyez-le pour proposer l’événement. Si rien ne s’ouvre, copiez l’adresse : <strong>section.briesenart@seineetmarne.pcf.fr</strong>'
  message.hidden = false
})
