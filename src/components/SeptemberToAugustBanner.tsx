import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarSync, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SeptemberToAugustBannerProps {
  onMigrateSuccess?: (targetMonth: string) => void;
}

export const SeptemberToAugustBanner: React.FC<SeptemberToAugustBannerProps> = ({ onMigrateSuccess }) => {
  const { expenses = [], income = [], migrateAugustDataToSeptember } = useAppContext();
  const [isMigrating, setIsMigrating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Detect operations that were added in September 2026 but converted to August 2026
  const isForcedAug = (item: any) => {
    if (!item || !item.date) return false;
    const isAug = item.date.startsWith('2026-08') || item.date.includes('-08-') || item.date.includes('/08/');
    const createdInSep = item.createdAt && (item.createdAt.includes('2026-09') || item.createdAt.includes('-09-'));
    return isAug && Boolean(createdInSep);
  };

  const forcedExpensesCount = (expenses || []).filter(isForcedAug).length;
  const forcedIncomeCount = (income || []).filter(isForcedAug).length;
  const totalForcedCount = forcedExpensesCount + forcedIncomeCount;

  // If no mistakenly converted operations or dismissed, don't show
  if (totalForcedCount === 0 || isDismissed) {
    return null;
  }

  const handleRestoreToSeptember = async () => {
    setIsMigrating(true);
    try {
      if (migrateAugustDataToSeptember) {
        await migrateAugustDataToSeptember(true);
        setIsDismissed(true);
        if (onMigrateSuccess) {
          onMigrateSuccess('2026-09');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء نقل العمليات');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        className="relative overflow-hidden rounded-2xl border-2 border-emerald-300 dark:border-emerald-500/40 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 p-4 md:p-5 shadow-lg shadow-emerald-500/10 mb-5"
        dir="rtl"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <div className="p-3 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <CalendarSync className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>تصحيح التواريخ: تم رصد {totalForcedCount} عملية أُدخلت حديثاً في سبتمبر وتحولت إلى أوت</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300">
                    سبتمبر هو الشهر الحالي
                  </span>
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                بسبب التحويل السابق، تم تحويل تواريخ {forcedExpensesCount} مصاريف و{forcedIncomeCount} مداخيل مسجلة حديثاً إلى شهر أوت. يمكنك بنقرة واحدة إعادتها إلى مكانها الصحيح في <strong className="text-emerald-700 dark:text-emerald-300 font-black">شهر سبتمبر الحالي (2026-09)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end shrink-0">
            <button
              type="button"
              onClick={handleRestoreToSeptember}
              disabled={isMigrating}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs md:text-sm font-bold shadow-md shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isMigrating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ نقل العمليات إلى سبتمبر...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ إعادة العمليات لشهر سبتمبر الآن</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="إغلاق التنبيه"
              className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
