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
  app: {
    head: {
      title: 'yt2mp3',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'description', content: 'Extract audio from any YouTube video. Paste a URL and download in YouTube\'s native format — no sign-up required.' },
        { name: 'theme-color', content: '#0d1117' },
        { name: 'application-name', content: 'yt2mp3' },
        { property: 'og:title', content: 'yt2mp3' },
        { property: 'og:description', content: 'Extract audio from any YouTube video. Paste a URL and download in YouTube\'s native format.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://yt2mp3.ex-it.nl' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'yt2mp3' },
        { name: 'twitter:description', content: 'Extract audio from any YouTube video. Paste a URL and download in YouTube\'s native format.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
  devtools: {
    enabled: false,
  },
  compatibilityDate: '2026-05-22',
})
