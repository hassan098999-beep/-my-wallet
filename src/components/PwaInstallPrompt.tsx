import React, { useEffect, useState, useRef } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const isIframe = window.self !== window.top;
    setInIframe(isIframe);

    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;
    setIsStandalone(isAppStandalone);

    if (isAppStandalone || isIframe) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      const t = setTimeout(() => setShowIOSPrompt(true), 3000);
      return () => clearTimeout(t);
    }

    // قرأ مباشرة إذا كان موجود
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      return;
    }

    // استمع للـ custom event من main.tsx
    const onCustom = () => {
      if (window.deferredPrompt) setDeferredPrompt(window.deferredPrompt);
    };
    window.addEventListener('pwa-install-prompt', onCustom);

    // استمع مباشرة كـ fallback
    const onBefore = (e: any) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBefore);

    // polling fallback — 10 ثواني
    pollingRef.current = setInterval(() => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    }, 500);
    const pollTimeout = setTimeout(() => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }, 10000);

    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('pwa-install-prompt', onCustom);
      window.removeEventListener('beforeinstallprompt', onBefore);
      if (pollingRef.current) clearInterval(pollingRef.current);
      clearTimeout(pollTimeout);
    };
  }, []);

  if (isStandalone || isDismissed || inIframe) return null;

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between relative">
          <button onClick={() => setIsDismissed(true)}
            className="absolute -top-2 -right-2 bg-white text-emerald-600 rounded-full p-1 shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black">تثبيت مصاريفي</p>
              <p className="text-[10px] opacity-80">وصول سريع + يشتغل بدون إنترنت</p>
            </div>
          </div>
          <button onClick={async () => {
              if (!deferredPrompt) return;
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              if (outcome === 'accepted') { setDeferredPrompt(null); window.deferredPrompt = null; }
            }}
            className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-black mr-2">
            تثبيت
          </button>
        </div>
      </div>
    );
  }

  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[100]">
        <div className="bg-gray-900 border border-emerald-500/30 text-white p-4 rounded-2xl shadow-xl relative">
          <button onClick={() => setShowIOSPrompt(false)}
            className="absolute top-2 left-2 text-gray-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div className="flex flex-col gap-2 pt-2 text-center">
            <p className="text-sm font-bold">تثبيت مصاريفي على iPhone</p>
            <p className="text-xs text-gray-300">1. اضغط زر المشاركة في الأسفل</p>
            <p className="text-xs text-gray-300">2. اختر "إضافة إلى الشاشة الرئيسية"</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
