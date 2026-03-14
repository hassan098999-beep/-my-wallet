import React from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../store/AppContext';
import { Download, Upload, Smartphone } from 'lucide-react';
import { cn } from '../../utils';

const DataManager = () => {
  const { exportData, importData } = useAppContext();
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error('التطبيق مثبت بالفعل أو أن المتصفح لا يدعم التثبيت حالياً.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
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
          <h3 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 md:mb-6">تثبيت التطبيق</h3>
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
      </div>
    </div>
  );
};

export default DataManager;
