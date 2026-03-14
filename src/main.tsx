import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker
registerSW({
  onNeedRefresh() {
    if (confirm('يتوفر تحديث جديد، هل تريد التحديث؟')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('التطبيق جاهز للعمل بدون إنترنت');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
