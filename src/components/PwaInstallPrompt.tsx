import React, { useEffect, useState } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(window.deferredPrompt || null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already installed/standalone
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isAppStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // If iOS and not standalone, show the manual instruction prompt after 3 seconds
    if (isIOSDevice && !isAppStandalone) {
      const timer = setTimeout(() => setShowIOSPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Handle Android/Chrome beforeinstallprompt
    const handleInstallPrompt = () => {
      setDeferredPrompt(window.deferredPrompt);
    };

    window.addEventListener('pwa-install-prompt', handleInstallPrompt);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('pwa-install-prompt', handleInstallPrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) return null;

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80">
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black">تثبيت التطبيق</p>
              <p className="text-[10px] opacity-80">ثبت التطبيق للوصول السريع</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              if (outcome === 'accepted') {
                setDeferredPrompt(null);
                window.deferredPrompt = null;
              }
            }}
            className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-50 shadow-sm transition-colors"
          >
            تثبيت
          </button>
        </div>
      </div>
    );
  }

  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80">
        <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl relative">
          <button 
            onClick={() => setShowIOSPrompt(false)}
            className="absolute top-2 left-2 text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-sm font-bold text-center">لتثبيت التطبيق على iPhone</p>
            <div className="text-xs text-gray-300 text-center flex flex-col items-center gap-2">
              <span>1. اضغط على زر المشاركة <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> في الأسفل</span>
              <span>2. اختر "إضافة إلى الشاشة الرئيسية"</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
