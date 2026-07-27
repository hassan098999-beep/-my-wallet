import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, PlusSquare, ExternalLink, MoreVertical, CheckCircle2, Smartphone } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    // Check if running inside iframe
    const isIframeEnv = window.self !== window.top;
    setInIframe(isIframeEnv);

    // Check if app is already installed/standalone
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isAppStandalone);

    // Detect iOS vs Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen to install prompt
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

  if (isStandalone || isDismissed) return null;

  // Render Iframe preview helper banner
  if (inIframe) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-88 dir-rtl"
          dir="rtl"
        >
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex flex-col gap-3 relative">
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute top-3 left-3 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">تثبيت "مصاريفي" كتطبيق PWA</h4>
                <p className="text-[11px] text-slate-300 font-medium leading-tight">
                  لتثبيت التطبيق على هاتف كروم، يرجى فتحه خارج نافذة المعاينة.
                </p>
              </div>
            </div>

            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
            >
              <span>افتح في نافذة مستقلة للتثبيت</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96 dir-rtl"
        dir="rtl"
      >
        {deferredPrompt ? (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between relative overflow-hidden group pl-8">
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute top-2 left-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-1.5 transition-all z-20 cursor-pointer"
              title="إغلاق"
            >
              <X size={14} strokeWidth={3} />
            </button>
            <div className="flex items-center gap-3 relative z-10">
              <div className="bg-white/20 p-2.5 rounded-xl shrink-0">
                <Download size={22} />
              </div>
              <div>
                <p className="text-sm font-black">تثبيت التطبيق على الهاتف</p>
                <p className="text-[11px] opacity-90 font-medium">سريع، يعمل بدون إنترنت، وبدون إعلانات</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                try {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === 'accepted') {
                    setDeferredPrompt(null);
                    window.deferredPrompt = null;
                  }
                } catch (e) {
                  console.warn('Install prompt error', e);
                }
              }}
              className="relative z-10 bg-white text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-50 shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
            >
              تثبيت الآن
            </button>
          </div>
        ) : isIOS ? (
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl relative border border-slate-800">
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute top-3 left-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400">
                  <Download size={16} />
                </div>
                <p className="text-sm font-black">تثبيت التطبيق على آيفون (Safari)</p>
              </div>
              <div className="text-xs text-slate-300 flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>اضغط على زر المشاركة <Share size={14} className="inline mx-1 text-blue-400" /> أسفل المتصفح</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>اختر "الإضافة إلى الشاشة الرئيسية" <PlusSquare size={14} className="inline mx-1 text-slate-300" /></span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl relative border border-slate-800">
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute top-3 left-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">تثبيت "مصاريفي" في كروم</p>
                    <p className="text-[10px] text-slate-400 font-medium">خطوات التثبيت المباشر على أندرويد</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="bg-emerald-500/20 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                  <span>افتح قائمة خيارات متصفح كروم <MoreVertical size={14} className="inline mx-1 text-emerald-400" /> (الثلاث نقاط بالخيارات)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="bg-emerald-500/20 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <span>اختر <strong>"التثبيت" (Install App)</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية"</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

