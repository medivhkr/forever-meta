/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Сайт живёт на GitHub Pages по адресу https://medivhkr.github.io/forever-meta/,
// поэтому все пути собираются от /forever-meta/.
const BASE = '/forever-meta/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    // PWA: сайт можно установить на телефон как приложение, и он открывается без интернета
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Forever Meta — тир-лист и база предметов WoW',
        short_name: 'Forever Meta',
        description: 'Тир-лист спеков, персонажи с экипировкой и база рейдовых предметов World of Warcraft TBC.',
        lang: 'ru',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#08090c',
        theme_color: '#08090c',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Код и стили — в предварительный кеш; JSON с данными — по сети, а без сети из кеша
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith(`${BASE}data/`),
            handler: 'NetworkFirst',
            options: { cacheName: 'fm-data', networkTimeoutSeconds: 4, matchOptions: { ignoreSearch: true } },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'render.worldofwarcraft.com' || url.hostname === 'wow.zamimg.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fm-icons',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fm-fonts', cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
