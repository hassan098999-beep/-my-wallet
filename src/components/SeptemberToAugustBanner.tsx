import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarSync, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SeptemberToAugustBannerProps {
  onMigrateSuccess?: (targetMonth: string) => void;
}

export const SeptemberToAugustBanner: React.FC<SeptemberToAugustBannerProps> = ({ onMigrateSuccess }) => {
  const { expenses = [], income = [], budgets = [], migrateSeptemberDataToAugust } = useAppContext();
  const [isMigrating, setIsMigrating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check September pattern across dates and months
  const isSep = (d?: string | null) => {
    if (!d || typeof d !== 'string') return false;
    return d.includes('-09-') || d.includes('/09/') || d.endsWith('-09') || d.includes('2026-09') || d.includes('2026/09');
  };

  // Count operations with date in September (-09- or /09/)
  const sepExpensesCount = (expenses || []).filter(e => isSep(e.date)).length;
  const sepIncomeCount = (income || []).filter(i => isSep(i.date)).length;
  const sepBudgetsCount = (budgets || []).filter(b => isSep(b.month)).length;
  const totalSepCount = sepExpensesCount + sepIncomeCount + sepBudgetsCount;

  // If no operations in September or dismissed, don't show
  if (totalSepCount === 0 || isDismissed) {
    return null;
  }

  const handleFixDates = async () => {
    setIsMigrating(true);
    try {
      if (migrateSeptemberDataToAugust) {
        await migrateSeptemberDataToAugust();
        setIsDismissed(true);
        if (onMigrateSuccess) {
          onMigrateSuccess('2026-08');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء نقل التواريخ');
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
        className="relative overflow-hidden rounded-2xl border-2 border-amber-300 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-100/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/30 p-4 md:p-5 shadow-lg shadow-amber-500/10 mb-5"
        dir="rtl"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <div className="p-3 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <CalendarSync className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>تنبيه تصحيح التواريخ: تم رصد {totalSepCount} عملية ومخصصات في شهر سبتمبر</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300">
                    أوت فارغ حالياً
                  </span>
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                بسبب تسجيل العمليات سابقاً في شهر سبتمبر، تظهر ميزانية شهر أوت الحالي بدون عمليات. يمكنك بنقرة واحدة تعديل تواريخ جميع هذه العمليات ({sepExpensesCount} مصاريف، {sepIncomeCount} مداخيل{sepBudgetsCount > 0 ? `، وميزانية شهر سبتمبر` : ''}) ونقلها بالكامل إلى <strong className="text-amber-700 dark:text-amber-300 font-black">شهر أوت (أغسطس) الحالي</strong> لتظهر في صفحة الميزانية ولوحاتك الإحصائية فوراً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end shrink-0">
            <button
              type="button"
              onClick={handleFixDates}
              disabled={isMigrating}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs md:text-sm font-bold shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isMigrating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ نقل العمليات والميزانية...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ تصحيح ونقل العمليات إلى شهر أوت الآن</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="إغلاق التنبيه"
              className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/40 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
