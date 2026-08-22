import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lightbulb, 
  Calendar, 
  ArrowLeft, 
  Sparkles, 
  X, 
  PlusCircle, 
  History,
  TrendingUp,
  ChevronLeft
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn, formatCurrency, hapticFeedback, safeStorage } from '../../utils';
import { Expense, Income } from '../../types';

interface SmartMonthAdviceBannerProps {
  selectedMonth: string; // yyyy-MM
  periodPreset: string;
  filteredExpensesCount: number;
  filteredIncomeCount: number;
  allExpenses: Expense[];
  allIncome: Income[];
  currency: string;
  onSelectMonth: (month: string) => void;
  onSelectPreset: (preset: 'last_month' | 'last_3_months') => void;
}

export const SmartMonthAdviceBanner: React.FC<SmartMonthAdviceBannerProps> = ({
  selectedMonth,
  periodPreset,
  filteredExpensesCount,
  filteredIncomeCount,
  allExpenses = [],
  allIncome = [],
  currency,
  onSelectMonth,
  onSelectPreset,
}) => {
  const [dismissedMonths, setDismissedMonths] = useState<Record<string, boolean>>(() => {
    try {
      const saved = safeStorage.getItem('masarifi_analytics_dismissed_advice_months');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const isDismissed = dismissedMonths[selectedMonth] || false;

  // 1. Determine if current viewed month/period is empty or incomplete
  const isDataIncomplete = filteredExpensesCount < 3;
  const isDataEmpty = filteredExpensesCount === 0 && filteredIncomeCount === 0;

  // 2. Scan historical expenses grouped by month to find the best previous month with rich data
  const historicalMonthStats = useMemo(() => {
    const monthMap: Record<string, { month: string; expenseCount: number; totalExpense: number; incomeCount: number; totalIncome: number }> = {};

    // Group expenses
    for (let i = 0; i < allExpenses.length; i++) {
      const exp = allExpenses[i];
      if (exp.isTransfer) continue;
      const m = exp.date ? exp.date.substring(0, 7) : '';
      if (!m || m.length !== 7) continue;

      if (!monthMap[m]) {
        monthMap[m] = { month: m, expenseCount: 0, totalExpense: 0, incomeCount: 0, totalIncome: 0 };
      }
      monthMap[m].expenseCount += 1;
      monthMap[m].totalExpense += exp.amount;
    }

    // Group income
    for (let i = 0; i < allIncome.length; i++) {
      const inc = allIncome[i];
      if (inc.isTransfer) continue;
      const m = inc.date ? inc.date.substring(0, 7) : '';
      if (!m || m.length !== 7) continue;

      if (!monthMap[m]) {
        monthMap[m] = { month: m, expenseCount: 0, totalExpense: 0, incomeCount: 0, totalIncome: 0 };
      }
      monthMap[m].incomeCount += 1;
      monthMap[m].totalIncome += inc.amount;
    }

    // Filter to only months other than current selectedMonth and with data
    const availablePastMonths = Object.values(monthMap)
      .filter(item => item.month !== selectedMonth && (item.expenseCount > 0 || item.incomeCount > 0))
      .sort((a, b) => b.month.localeCompare(a.month)); // most recent first

    return {
      availablePastMonths,
      hasHistoricalData: availablePastMonths.length > 0,
      bestPreviousMonth: availablePastMonths[0] || null, // latest active month with records
      totalHistoricalCount: availablePastMonths.reduce((sum, item) => sum + item.expenseCount, 0)
    };
  }, [allExpenses, allIncome, selectedMonth]);

  // If data is already rich/complete (>= 3 expenses), or user dismissed this month, don't show
  if (!isDataIncomplete || isDismissed) {
    return null;
  }

  // Format month names in Arabic
  const formatMonthLabel = (mStr: string) => {
    try {
      const d = parseISO(`${mStr}-01`);
      return format(d, 'MMMM yyyy', { locale: ar });
    } catch {
      return mStr;
    }
  };

  const currentMonthLabel = formatMonthLabel(selectedMonth);
  const bestPrevMonth = historicalMonthStats.bestPreviousMonth;
  const bestPrevMonthLabel = bestPrevMonth ? formatMonthLabel(bestPrevMonth.month) : '';

  const handleDismiss = () => {
    hapticFeedback('light');
    const updated = { ...dismissedMonths, [selectedMonth]: true };
    setDismissedMonths(updated);
    safeStorage.setItem('masarifi_analytics_dismissed_advice_months', JSON.stringify(updated));
  };

  const handleJumpToPreviousMonth = () => {
    if (!bestPrevMonth) return;
    hapticFeedback('medium');
    onSelectMonth(bestPrevMonth.month);
  };

  const handleJumpToLast3Months = () => {
    hapticFeedback('medium');
    onSelectPreset('last_3_months');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        className="relative overflow-hidden rounded-3xl border border-indigo-200/80 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-purple-50/80 dark:from-slate-900/95 dark:via-indigo-950/40 dark:to-purple-950/30 p-4 sm:p-5 shadow-sm text-right backdrop-blur-xs"
        dir="rtl"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Main Info */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                  <Sparkles size={11} className="text-indigo-600 dark:text-indigo-400" />
                  <span>نصيحة ذكية لتحليل أدق</span>
                </span>

                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isDataEmpty ? 'بيانات الشهر الحالي فارغة' : `تم تسجيل ${filteredExpensesCount} مصاريف فقط`}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                {isDataEmpty 
                  ? `بيانات شهر (${currentMonthLabel}) لا تحتوي على أي عمليات بعد`
                  : `بيانات شهر (${currentMonthLabel}) غير مكتملة بعد لمطابقة سلوكك المالي`
                }
              </h3>

              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {historicalMonthStats.hasHistoricalData && bestPrevMonth ? (
                  <>
                    للحصول على رؤية مالية واقعية ومؤشرات إنفاق دقيقة، نقترح عليك <strong className="text-indigo-600 dark:text-indigo-400 font-black">مراجعة بيانات الشهور السابقة</strong> مثل <span className="font-bold text-slate-800 dark:text-slate-200">({bestPrevMonthLabel})</span> حيث يتوفر لديك سجل مكتمل يحتوي على <strong className="text-slate-900 dark:text-white font-black">{bestPrevMonth.expenseCount} معاملة</strong> بقيمة <span className="font-bold font-mono">{formatCurrency(bestPrevMonth.totalExpense, currency)}</span>.
                  </>
                ) : (
                  <>
                    الرسوم البيانية وهيكل الميزانية يحتاجان إلى تسجيل مصاريفك اليومية لتقديم تحليلات دقيقة وتوصيات ترشيد مخصصة.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end shrink-0 flex-wrap sm:flex-nowrap">
            {historicalMonthStats.hasHistoricalData && bestPrevMonth && (
              <button
                type="button"
                onClick={handleJumpToPreviousMonth}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <History size={15} />
                <span>استعراض {bestPrevMonthLabel}</span>
                <ChevronLeft size={14} className="opacity-80" />
              </button>
            )}

            {historicalMonthStats.availablePastMonths.length >= 2 && (
              <button
                type="button"
                onClick={handleJumpToLast3Months}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer whitespace-nowrap"
              >
                <TrendingUp size={14} className="text-indigo-500" />
                <span>تحليل 3 أشهر</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              title="إخفاء النصيحة لهذا الشهر"
              aria-label="إخفاء النصيحة"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
