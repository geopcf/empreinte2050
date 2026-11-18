const bouton = document.getElementById('a-propos-ctrl')
const panneau = document.getElementById('a-propos')

if (bouton && panneau) {
  bouton.addEventListener('click', () => {
    panneau.showModal()
  })

  panneau
    .querySelector('.a-propos-fermer')
    ?.addEventListener('click', () => panneau.close())

  // Fermeture au clic sur le fond assombri
  panneau.addEventListener('click', (event) => {
    if (event.target === panneau) {
      panneau.close()
    }
  })
}
