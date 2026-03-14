import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

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

// Register Service Worker manually for better control and debugging
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 تحديث جديد متاح');
    if (confirm('يتوفر تحديث جديد، هل تريد التحديث؟')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('📶 التطبيق جاهز للعمل بدون إنترنت');
  },
  onRegistered(r) {
    console.log('✅ تم تسجيل Service Worker بنجاح:', r);
  },
  onRegisterError(error) {
    console.error('❌ خطأ في تسجيل Service Worker:', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
