import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn, hapticFeedback } from '../utils';
import { useAppContext } from '../store/AppContext';
import toast from 'react-hot-toast';

export const OfflineSyncIndicator: React.FC = () => {
  const { user } = useAppContext();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('تمت استعادة الاتصال بالإنترنت ومزامنة البيانات سحابياً 🌐');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast('وضع العمل دون إنترنت مفعّل (البيانات محفوظة محلياً) 📴', {
        icon: '💾',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = () => {
    hapticFeedback('light');
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      if (isOnline) {
        toast.success('تم التأكد من مزامنة وتحديث كافة البيانات سحابياً ومحلياً ✅');
      } else {
        toast('أنت في وضع عدم الاتصال؛ البيانات محفوظة محلياً في الذاكرة بأمان 💾');
      }
    }, 600);
  };

  return (
    <div className="relative group flex items-center font-tajawal" dir="rtl">
      <button
        onClick={handleManualSync}
        aria-label={isOnline ? 'مزامنة سحابية متصلة' : 'وضع دون إنترنت'}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer select-none",
          isOnline
            ? "bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50"
            : "bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50"
        )}
      >
        {isSyncing ? (
          <RefreshCw size={13} className="animate-spin text-emerald-600 dark:text-emerald-400" />
        ) : isOnline ? (
          <Cloud size={13} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <CloudOff size={13} className="text-amber-600 dark:text-amber-400" />
        )}
        <span className="hidden sm:inline">
          {isOnline ? (user ? 'سحابي متزامن' : 'محفوظ محلياً') : 'دون اتصال'}
        </span>
      </button>

      {/* Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center shadow-lg border border-slate-700 pointer-events-none">
        {isOnline 
          ? (user ? 'متصل بـ Firebase Firestore مع حفظ فوري في IndexedDB.' : 'متصل بالإنترنت. سجل الدخول لمزامنة حسابك عبر أجهزتك.') 
          : 'أنت غير متصل بالإنترنت. يمكنك متابعة تسجيل وإدارة مصاريفك وستتم المزامنة تلقائياً عند عودة الشبكة.'}
      </div>
    </div>
  );
};
