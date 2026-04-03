import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm('يتوفر تحديث جديد للتطبيق. هل تريد التحديث الآن؟')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('التطبيق جاهز للعمل بدون إنترنت');
  },
});

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

// Capture beforeinstallprompt globally
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ beforeinstallprompt event fired!');
  e.preventDefault();
  window.deferredPrompt = e;
  // Dispatch a custom event so React components can listen to it
  window.dispatchEvent(new Event('pwa-install-prompt'));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
