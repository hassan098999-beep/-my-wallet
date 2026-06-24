import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const isGithubPages = env.VITE_GITHUB_PAGES === 'true';
  const basePath = isGithubPages ? '/-my-wallet/' : '/';

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: ["icon-192.png", "icon-512.png", "icon.svg", "screenshot-mobile.jpg", "screenshot-desktop.jpg"],
        devOptions: {
          enabled: false,
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webmanifest}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: isGithubPages ? '/-my-wallet/index.html' : '/index.html',
        },
        manifest: {
          id: isGithubPages ? '/-my-wallet/' : '/',
          start_url: isGithubPages ? '/-my-wallet/' : '/',
          name: "مصاريفي - إدارة المصاريف الشخصية",
          short_name: "مصاريفي",
          description: "تطبيق لإدارة المصاريف الشخصية وتتبع الميزانية وتخطيط الأهداف المالية في تونس",
          theme_color: "#10b981",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          lang: "ar",
          dir: "rtl",
          categories: ["finance", "utilities"],
          iarc_rating_id: "e840a1b8-20dd-4cb9-91bc-0e42d765b263",
          screenshots: [
            {
              src: `${basePath}screenshot-mobile.jpg`,
              sizes: "1080x1920",
              type: "image/jpeg",
              form_factor: "narrow",
              label: "تطبيق مصاريفي على الهاتف - تتبع المصاريف والتحكم بالميزانية"
            },
            {
              src: `${basePath}screenshot-desktop.jpg`,
              sizes: "1920x1080",
              type: "image/jpeg",
              form_factor: "wide",
              label: "تطبيق مصاريفي على الحاسوب - لوحة تحكم تفصيلية للميزانية والمدخرات"
            }
          ],
          share_target: {
            action: `${basePath}share-add`,
            method: "GET",
            enctype: "application/x-www-form-urlencoded",
            params: {
              title: "title",
              text: "text",
              url: "url"
            }
          },
          shortcuts: [
            {
              name: "إضافة مصروف",
              short_name: "إضافة مصروف",
              description: "تسجيل مصروف جديد بسرعة وسلاسة",
              url: `${basePath}?action=add`,
              icons: [
                {
                  src: `${basePath}icon-192.png`,
                  sizes: "192x192",
                  type: "image/png"
                }
              ]
            }
          ],
          icons: [
            {
              src: `${basePath}icon-192.png`,
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: `${basePath}icon-192.png`,
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: `${basePath}icon-512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: `${basePath}icon-512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
    ],
    build: {
      minify: "esbuild",
      target: "esnext",
      outDir: "dist",
    },
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.API_KEY": JSON.stringify(env.API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
