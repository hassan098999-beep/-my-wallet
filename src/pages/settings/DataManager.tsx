import React from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../store/AppContext';
import { Download, Upload, Smartphone, Trash2, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';

const DataManager = () => {
  const { exportData, importData, resetData } = useAppContext();
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(window.deferredPrompt || null);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  React.useEffect(() => {
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error('التطبيق مثبت بالفعل أو أن المتصفح لا يدعم التثبيت حالياً. (مستخدمي iPhone يجب عليهم استخدام زر المشاركة)');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      window.deferredPrompt = null;
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importData(content);
      };
      reader.readAsText(file);
    }
  };

  const checkPwaStatus = async () => {
    let status = 'حالة PWA:\n';
    
    // Check Standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    status += `- وضع Standalone: ${isStandalone ? 'نعم' : 'لا'}\n`;
    
    // Check Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      status += `- Service Worker: ${registrations.length > 0 ? 'مسجل' : 'غير مسجل'}\n`;
    } else {
      status += `- Service Worker: غير مدعوم\n`;
    }
    
    // Check deferredPrompt
    status += `- حدث التثبيت (deferredPrompt): ${window.deferredPrompt ? 'متاح' : 'غير متاح'}\n`;
    
    alert(status);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <button onClick={exportData} className="flex items-center justify-center gap-2 md:gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 md:px-6 md:py-6 rounded-xl md:rounded-2xl font-black transition-all border border-slate-100 dark:border-slate-800 text-sm md:text-base uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02]">
            <Download className="text-primary-500 size-5 md:size-6" />
            تصدير البيانات
          </button>
          
          <label className="flex items-center justify-center gap-2 md:gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 md:px-6 md:py-6 rounded-xl md:rounded-2xl font-black transition-all border border-slate-100 dark:border-slate-800 text-sm md:text-base uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer">
            <Upload className="text-primary-500 size-5 md:size-6" />
            استيراد البيانات
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <div className="mt-6 pt-6 md:mt-8 md:pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">تثبيت التطبيق</h3>
            <button onClick={checkPwaStatus} className="text-[10px] text-slate-500 underline">فحص حالة التثبيت</button>
          </div>
          <button 
            onClick={handleInstallClick}
            className={cn(
              "w-full flex items-center justify-center gap-2 md:gap-3 px-4 py-4 md:px-6 md:py-6 rounded-xl md:rounded-2xl font-black transition-all border text-sm md:text-base uppercase tracking-widest shadow-lg hover:scale-[1.01]",
              deferredPrompt 
                ? "bg-primary-600 text-white border-primary-500 shadow-primary-500/20" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60"
            )}
          >
            <Smartphone className={cn("size-5 md:size-6", deferredPrompt ? "text-white" : "text-slate-400")} />
            {deferredPrompt ? "تثبيت التطبيق على الهاتف" : "التطبيق مثبت بالفعل"}
          </button>
        </div>

        <div className="mt-6 md:mt-8 p-4 md:p-6 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center shadow-inner">
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
            يتم حفظ بياناتك محلياً في متصفحك. ننصح بأخذ نسخة احتياطية بشكل دوري لضمان عدم فقدان بياناتك.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-rose-100 dark:border-rose-900/30">
          <h3 className="text-[10px] md:text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-4">منطقة الخطر</h3>
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 md:gap-3 px-4 py-4 md:px-6 md:py-6 rounded-xl md:rounded-2xl font-black transition-all border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm md:text-base uppercase tracking-widest shadow-sm hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            <Trash2 className="size-5 md:size-6" />
            تصفير جميع البيانات
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={24} />
                </div>
                <button onClick={() => setShowResetConfirm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">هل أنت متأكد؟</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-8 leading-relaxed">
                سيتم حذف جميع المصاريف، الدخل، الميزانيات، والحسابات بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="py-4 rounded-2xl font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm uppercase tracking-widest"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    resetData();
                    setShowResetConfirm(false);
                  }}
                  className="py-4 rounded-2xl font-black bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all text-sm uppercase tracking-widest"
                >
                  نعم، احذف الكل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataManager;
