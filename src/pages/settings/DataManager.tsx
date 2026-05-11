import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../store/AppContext';
import { DownloadCloud, UploadCloud, Smartphone, Trash, TriangleAlert, X, Save, Clock, Cloud, Database, WifiOff } from 'lucide-react';
import { cn, hapticFeedback } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';
import { getBackupsFromDB, saveBackupToDB, deleteBackupFromDB } from '../../utils/indexedDB';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { BackupRecord } from '../../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const DataManager = () => {
  const { 
    exportData, importData, resetData, user,
    expenses, recurringExpenses, categories, accounts, budget,
    dailyBudget, rollingBudgetEnabled, theme, currency, achievements,
    goals, income, notifications, hasCompletedOnboarding, userName,
    firstDayOfMonth, bestStreak, offlineMode, toggleOfflineMode
  } = useAppContext();
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(window.deferredPrompt || null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  useEffect(() => {
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

  const loadBackups = async () => {
    try {
      let localList = await getBackupsFromDB();
      if (user) {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'backups'));
          const cloudList = snap.docs.map(doc => doc.data() as BackupRecord);
          const mergedMap = new Map();
          localList.forEach(b => mergedMap.set(b.id, b));
          cloudList.forEach(b => mergedMap.set(b.id, b));
          localList = Array.from(mergedMap.values()).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
        } catch(err) {
          console.error("Failed to load cloud backups", err);
        }
      }
      setBackups(localList);
    } catch(err) {
      console.error("Failed to load local backups", err);
    }
  };

  useEffect(() => {
    loadBackups();
  }, [user]);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    hapticFeedback('medium');
    const currentData = {
      expenses, recurringExpenses, categories, accounts, budget,
      dailyBudget, rollingBudgetEnabled, theme, currency, achievements,
      goals, income, notifications, hasCompletedOnboarding, userName,
      firstDayOfMonth, bestStreak
    };
    
    const newBackup: BackupRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: `نسخة ${format(new Date(), 'd MMMM yyyy HH:mm', { locale: ar })}`,
      version: '1.0',
      data: JSON.stringify(currentData),
    };
    
    try {
      await saveBackupToDB(newBackup);
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'backups', newBackup.id), newBackup);
      }
      toast.success('تم إنشاء نسخة احتياطية بنجاح');
      loadBackups();
    } catch(error) {
      toast.error('حدث خطأ أثناء حفظ النسخة الاحتياطية');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = (backup: BackupRecord) => {
    hapticFeedback('medium');
    if(window.confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية.')) {
      importData(backup.data);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    hapticFeedback('light');
    if(window.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية نهائياً؟')) {
      try {
        await deleteBackupFromDB(id);
        if (user) {
          await deleteDoc(doc(db, 'users', user.uid, 'backups', id));
        }
        toast.success('تم حذف النسخة الاحتياطية');
        loadBackups();
      } catch(err) {
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  };


  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      hapticFeedback('warning');
      toast.error('التطبيق مثبت بالفعل أو أن المتصفح لا يدعم التثبيت حالياً. (مستخدمي iPhone يجب عليهم استخدام زر المشاركة)');
      return;
    }
    hapticFeedback('medium');
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
      hapticFeedback('medium');
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importData(content);
      };
      reader.readAsText(file);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    hapticFeedback('medium');
    exportData(format);
  };

  const checkPwaStatus = async () => {
    hapticFeedback('light');
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
    
    // Check iframe
    const inIframe = window.self !== window.top;
    status += `- داخل إطار (iframe): ${inIframe ? 'نعم' : 'لا'}\n`;

    alert(status);
  };

  const handleReset = () => {
    hapticFeedback('error');
    resetData();
    setShowResetConfirm(false);
  };

  const inIframe = window.self !== window.top;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <button onClick={() => handleExport('json')} className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 rounded-xl font-black transition-all border border-slate-100 dark:border-slate-800 text-xs uppercase tracking-widest shadow-sm hover:shadow-md hover:scale-[1.02]">
            <DownloadCloud className="text-primary-500 size-5" />
            تصدير JSON
          </button>

          <button onClick={() => handleExport('csv')} className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 rounded-xl font-black transition-all border border-slate-100 dark:border-slate-800 text-xs uppercase tracking-widest shadow-sm hover:shadow-md hover:scale-[1.02]">
            <DownloadCloud className="text-emerald-500 size-5" />
            تصدير CSV
          </button>
          
          <label className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 rounded-xl font-black transition-all border border-slate-100 dark:border-slate-800 text-xs uppercase tracking-widest shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer">
            <UploadCloud className="text-primary-500 size-5" />
            استيراد JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <div className="mt-6 pt-6 md:mt-8 md:pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              النسخ الاحتياطية
            </h3>
            <button 
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase font-black tracking-widest rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={14} />
              {isCreatingBackup ? 'جاري الحفظ...' : 'حفظ نسخة جديدة'}
            </button>
          </div>

          <div className="space-y-3">
            {backups.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400">لا توجد نسخ احتياطية محفوظة حالياً</p>
              </div>
            ) : (
              backups.map(backup => (
                <div key={backup.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{backup.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-bold">
                        {user ? <Cloud size={10} className="text-indigo-400" /> : <Database size={10} className="text-slate-400" />}
                        {format(new Date(backup.createdAt), 'dd MMM yyyy, HH:mm')} - {(new Blob([backup.data]).size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleRestoreBackup(backup)}
                      className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-primary-200 dark:hover:bg-primary-900/50 flex-1 sm:flex-none text-center"
                    >
                      استعادة
                    </button>
                    <button 
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg transition-all hover:bg-rose-100 dark:hover:bg-rose-900/40"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 md:mt-8 md:pt-8 border-t border-slate-100 dark:border-slate-800">

          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">تثبيت التطبيق</h3>
            <button onClick={checkPwaStatus} className="text-[10px] text-slate-500 underline">فحص حالة التثبيت</button>
          </div>
          
          {inIframe ? (
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-400 text-sm font-bold text-center">
                لا يمكن تثبيت التطبيق من داخل نافذة العرض الحالية. يرجى فتح التطبيق في نافذة مستقلة لتتمكن من تثبيته.
              </div>
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full flex items-center justify-center gap-2 md:gap-3 px-4 py-4 md:px-6 md:py-6 rounded-xl md:rounded-2xl font-black transition-all border text-sm md:text-base uppercase tracking-widest shadow-lg hover:scale-[1.01] bg-primary-600 text-white border-primary-500 shadow-primary-500/20"
              >
                <Smartphone className="size-5 md:size-6 text-white" />
                فتح في نافذة مستقلة للتثبيت
              </button>
            </div>
          ) : (
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
          )}
        </div>

        <div className="mt-6 md:mt-8 p-4 md:p-6 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center shadow-inner">
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
            يتم حفظ بياناتك محلياً في متصفحك. ننصح بأخذ نسخة احتياطية بشكل دوري لضمان عدم فقدان بياناتك.
          </p>
        </div>

        <div className="mt-6 pt-6 md:mt-8 md:pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <WifiOff size={20} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">وضع عدم الاتصال</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[200px]">
                  إيقاف المزامنة السحابية والعمل محلياً بالكامل.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                hapticFeedback('medium');
                toggleOfflineMode(!offlineMode);
              }}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                offlineMode ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  offlineMode ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-rose-100 dark:border-rose-900/30">
          <h3 className="text-[10px] md:text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-4">منطقة الخطر</h3>
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 md:gap-3 px-4 py-4 md:px-6 md:py-6 rounded-xl md:rounded-2xl font-black transition-all border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm md:text-base uppercase tracking-widest shadow-sm hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            <Trash className="size-5 md:size-6" />
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
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-md border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <TriangleAlert size={24} />
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
                  onClick={handleReset}
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
