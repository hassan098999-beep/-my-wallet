import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [inIframe, setInIframe] = useState(false);

  const [installProgress, setInstallProgress] = useState(() => {
    return sessionStorage.getItem('hasSeenInstallProgress') ? 100 : 0;
  });
  const [isReadyToInstall, setIsReadyToInstall] = useState(() => {
    return !!sessionStorage.getItem('hasSeenInstallProgress');
  });

  useEffect(() => {
    // Check if in iframe
    const isIframe = window.self !== window.top;
    setInIframe(isIframe);

    // Check if app is already installed/standalone
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isAppStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Handle Android/Chrome beforeinstallprompt
    const handleInstallPrompt = () => {
      setDeferredPrompt((window as any).deferredPrompt);
    };

    window.addEventListener('pwa-install-prompt', handleInstallPrompt);
    
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    return () => {
      window.removeEventListener('pwa-install-prompt', handleInstallPrompt);
    };
  }, []);

  // Progress simulation
  useEffect(() => {
    if (isStandalone || isDismissed || inIframe || isReadyToInstall) return;
    
    // Only start progress if we can actually install (have prompt or is iOS)
    if (!deferredPrompt && !isIOS) return;

    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReadyToInstall(true);
          sessionStorage.setItem('hasSeenInstallProgress', 'true');
          return 100;
        }
        return prev + 2; // Fills in 5 seconds (50 * 100ms)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isStandalone, isDismissed, inIframe, deferredPrompt, isIOS, isReadyToInstall]);

  if (isStandalone || isDismissed || inIframe) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      {!isReadyToInstall ? (
        <motion.div 
          key="progress"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col gap-3">
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400">جاري تجهيز التطبيق للتثبيت...</span>
               <span className="text-xs font-bold text-primary-500">{installProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${installProgress}%` }}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="prompt"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80"
        >
          {deferredPrompt ? (
            <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <button 
                onClick={() => setIsDismissed(true)}
                className="absolute -top-2 -right-2 bg-white text-emerald-600 rounded-full p-1 shadow-md hover:bg-gray-100 z-10"
              >
                <X size={14} strokeWidth={3} />
              </button>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Download size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold">تثبيت التطبيق</p>
                  <p className="text-[10px] opacity-90 font-medium">ثبت التطبيق للوصول السريع</p>
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
                className="relative z-10 bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-50 shadow-sm transition-colors mr-2 active:scale-95"
              >
                تثبيت
              </button>
            </div>
          ) : isIOS ? (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl relative border border-slate-800">
              <button 
                onClick={() => setIsDismissed(true)}
                className="absolute top-3 left-3 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 p-1.5 rounded-lg">
                    <Download size={16} className="text-primary-400" />
                  </div>
                  <p className="text-sm font-bold">تثبيت التطبيق على iPhone</p>
                </div>
                <div className="text-xs text-slate-300 flex flex-col gap-2.5 bg-white/5 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-black/30 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>اضغط على زر المشاركة <Share size={14} className="inline mx-1 text-blue-400" /> في الأسفل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-black/30 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>اختر "إضافة إلى الشاشة الرئيسية" <PlusSquare size={14} className="inline mx-1 text-slate-400" /></span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
