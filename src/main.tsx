import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker
registerSW({
  onNeedRefresh() {
    console.log('تحديث جديد متاح');
    if (confirm('يتوفر تحديث جديد، هل تريد التحديث؟')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('التطبيق جاهز للعمل بدون إنترنت');
  },
  onRegistered(r) {
    console.log('تم تسجيل Service Worker بنجاح:', r);
  },
  onRegisterError(error) {
    console.error('خطأ في تسجيل Service Worker:', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
