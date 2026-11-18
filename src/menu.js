const menu = document.getElementById('menu')
const bouton = document.getElementById('menu-reduire')

if (menu && bouton) {
  bouton.addEventListener('click', () => {
    const reduit = menu.classList.toggle('est-reduit')
    bouton.setAttribute('aria-expanded', String(!reduit))
    bouton.setAttribute('aria-label', reduit ? 'Agrandir le menu' : 'Réduire le menu')
    bouton.title = reduit ? 'Agrandir le menu' : 'Réduire le menu'
  })
}
