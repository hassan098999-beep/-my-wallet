import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/-my-wallet/',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['icon-192.png', 'icon-512.png'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
        },
        manifest: {
          name: 'مصاريفي - إدارة المصاريف الشخصية',
          short_name: 'مصاريفي',
          description: 'تطبيق لإدارة المصاريف الشخصية وتتبع الميزانية',
          theme_color: '#10b981',
          background_color: '#f9fafb',
          display: 'standalone',
          start_url: '/-my-wallet/',
          scope: '/-my-wallet/',
          shortcuts: [
            {
              name: "إضافة مصروف",
              short_name: "مصروف",
              url: "/-my-wallet/?action=add-expense",
              icons: [{ src: "icon-192.png", sizes: "192x192" }]
            },
            {
              name: "لوحة التحكم",
              short_name: "الرئيسية",
              url: "/-my-wallet/",
              icons: [{ src: "icon-192.png", sizes: "192x192" }]
            }
          ],
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
