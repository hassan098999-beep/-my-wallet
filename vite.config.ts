import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isGitHubPages = process.env.VITE_GITHUB_PAGES === 'true';
  const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
  const repoName = pkg.homepage?.split('/').pop() || '';
  const basePath = isGitHubPages ? `/${repoName}/` : '/';

  return {
    base: basePath,
    build: { minify: 'esbuild' },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icon-192.png', 'icon-512.png', 'icon.svg'],
        devOptions: { enabled: true, type: 'module' },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        manifest: {
          id: '/',
          name: 'مصاريفي - إدارة المصاريف',
          short_name: 'مصاريفي',
          description: 'تطبيق لإدارة المصاريف الشخصية وتتبع الميزانية',
          start_url: '/',
          scope: '/',
          theme_color: '#10b981',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'ar',
          dir: 'rtl',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    server: { hmr: process.env.DISABLE_HMR !== 'true' },
  };
});
