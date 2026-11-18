import { defineConfig } from 'vite'

export default defineConfig({
  base: '/empreinte2050/',
  // maplibre-gl représente l'essentiel du bundle (~1,1 MB minifié) :
  // on élève le seuil d'avertissement pour ce projet centré sur la carte.
  build: {
    outDir: 'docs',
    chunkSizeWarningLimit: 1200,
  },
})
