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

function construireMail(donnees) {
  const sujet = "[empreinte 2050] ajouter d'une écoute collective"

  const lignes = [
    `Organisateur / section : ${donnees.organisateur || ''}`,
    `Lieu de l\'écoute : ${donnees.adresse || ''}`,
    `Contact : ${donnees.contact || ''}`,
    `Précisions : ${donnees.précisions || donnees.description || ''}`,
  ]

  const corps = lignes.join('\n')

  return `mailto:contact@ecologie.pcf.fr?cc=section.briesenart@seineetmarne.pcf.fr&subject=${encodeURIComponent(
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
    'Votre client mail s’est ouvert avec le message prérempli. Envoyez-le pour ajouter une épingle sur la carte. Si rien ne s’ouvre, écrivez à l’adresse suivante : <strong>contact@ecologie.pcf.fr</strong>'
  message.hidden = false
})
