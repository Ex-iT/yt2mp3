export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  eslint: {
    config: {
      standalone: false,
    },
  },
  colorMode: {
    preference: 'dark',
  },
  nitro: {
    preset: 'vercel',
  },
  compatibilityDate: '2026-05-22',
})
