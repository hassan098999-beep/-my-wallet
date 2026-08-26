import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, Sparkles, TrendingDown, Info, ShieldCheck, 
  Calendar, Zap, Sliders, RefreshCw, Lightbulb, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Edit3
} from 'lucide-react';
import { parseISO, subMonths, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BudgetPeriod, Budget, Expense } from '../../types';
import { cn, formatCurrency, hapticFeedback, getBudgetMonth } from '../../utils';

interface BudgetOverviewProps {
  globalBudget: string;
  setGlobalBudget: (val: string) => void;
  overallPeriod: BudgetPeriod;
  setOverallPeriod: (val: BudgetPeriod) => void;
  currency: string;
  totalSpent: number;
  remainingBudget: number;
  overallPercentage: number;
  dailyLimit: number;
  remainingDays: number;
  remainingDaysInWeek: number;
  daysInMonth: number;
  rollingBudgetEnabled: boolean;
  setRollingBudgetEnabled: (enabled: boolean) => void;
  globalBudgetNum: number;
  suggestFromHistory: () => void;
  autoAllocate: () => void;
  isGenerating: boolean;
  selectedMonth?: string;
  firstDayOfMonth?: number;
  expenses?: Expense[];
  budgets?: Budget[];
  onOpenSettings?: () => void;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  globalBudget,
  setGlobalBudget,
  overallPeriod,
  currency,
  totalSpent,
  remainingBudget,
  overallPercentage,
  dailyLimit,
  remainingDays,
  remainingDaysInWeek,
  daysInMonth,
  rollingBudgetEnabled,
  globalBudgetNum,
  selectedMonth,
  firstDayOfMonth = 1,
  expenses = [],
  budgets = [],
  onOpenSettings,
}) => {
  const isWeekly = overallPeriod === 'weekly';
  const activeRemainingDays = isWeekly ? remainingDaysInWeek : remainingDays;
  const totalPeriodDays = isWeekly ? 7 : daysInMonth;

  // Status Evaluation
  const isOver = globalBudgetNum > 0 && totalSpent > globalBudgetNum;
  const isDanger = !isOver && globalBudgetNum > 0 && (overallPercentage > 80);
  const isHealthy = !isOver && !isDanger && globalBudgetNum > 0;
  const isUnset = globalBudgetNum === 0;

  // Dynamic Rollover Calculation from previous month
  const rolloverInfo = useMemo(() => {
    if (!selectedMonth) return null;
    try {
      const currentDate = parseISO(`${selectedMonth}-01`);
      const prevDate = subMonths(currentDate, 1);
      const prevMonthKey = format(prevDate, 'yyyy-MM');
      
      const prevBudgetObj = budgets.find(b => b.month === prevMonthKey);
      const prevBudgetAmount = prevBudgetObj?.amount || 0;
      
      const prevExpenses = expenses.filter(e => {
        if (e.isTransfer) return false;
        const eMonth = getBudgetMonth(parseISO(e.date), firstDayOfMonth);
        return eMonth === prevMonthKey;
      });
      const prevSpent = prevExpenses.reduce((sum, e) => sum + e.amount, 0);

      if (prevBudgetAmount > 0) {
        const diff = prevBudgetAmount - prevSpent;
        return {
          hasPrevData: true,
          amount: diff,
          isSurplus: diff >= 0,
          prevMonthName: format(prevDate, 'MMMM', { locale: ar }),
        };
      }
    } catch {
      // Ignore parse issues
    }
    return null;
  }, [selectedMonth, budgets, expenses, firstDayOfMonth]);

  // Smart Insight Line
  const smartInsight = useMemo(() => {
    if (isUnset) {
      return {
        text: 'عيّن مبلغ الميزانية المرصودة لتفعيل الرؤية الذكية والتنبؤ بسرعة استنزاف النفقات.',
        tone: 'neutral' as const
      };
    }

    if (isOver) {
      const overAmount = totalSpent - globalBudgetNum;
      return {
        text: `تجاوزت الميزانية بـ ${formatCurrency(overAmount, currency)}. يُنصح بوقف المصاريف غير الضرورية لحماية توازن الشهر.`,
        tone: 'danger' as const
      };
    }

    const daysElapsed = Math.max(1, totalPeriodDays - activeRemainingDays + 1);
    const currentDailyRate = totalSpent > 0 ? totalSpent / daysElapsed : 0;
    const projectedTotal = totalSpent + (currentDailyRate * Math.max(0, activeRemainingDays - 1));
    const plannedDaily = globalBudgetNum / totalPeriodDays;

    if (projectedTotal > globalBudgetNum && currentDailyRate > 0) {
      const daysUntilExhaustion = Math.floor((globalBudgetNum - totalSpent) / currentDailyRate);
      const earlyDays = Math.max(1, activeRemainingDays - daysUntilExhaustion);
      return {
        text: `بمعدل صرفك الحالي (${formatCurrency(currentDailyRate, currency)}/يوم) ستنفد الميزانية قبل ${earlyDays} أيام. خفّض وتيرة الصرف لـ ${formatCurrency(dailyLimit, currency)}/يوم.`,
        tone: 'warning' as const
      };
    }

    if (currentDailyRate <= plannedDaily && totalSpent > 0) {
      const projectedSavings = Math.max(0, globalBudgetNum - projectedTotal);
      return {
        text: `ممتاز! وتيرة صرفك متوازنة وأقل من السقف اليومي، مع توفير متوقع يقارب ${formatCurrency(projectedSavings, currency)} نهاية الدورة.`,
        tone: 'success' as const
      };
    }

    return {
      text: `أنت في بداية الدورة المالية. الحد اليومي الآمن هو ${formatCurrency(dailyLimit, currency)} للبقاء تحت السقف المحدد.`,
      tone: 'neutral' as const
    };
  }, [isUnset, isOver, totalSpent, globalBudgetNum, currency, totalPeriodDays, activeRemainingDays, dailyLimit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 text-right font-tajawal rtl"
    >
      {/* Master Hero Summary Card */}
      <div className={cn(
        "bg-white dark:bg-slate-900 border rounded-3xl p-5 md:p-6 shadow-xs relative overflow-hidden transition-all duration-300",
        isOver 
          ? "border-rose-200/90 dark:border-rose-900/50 bg-gradient-to-b from-rose-50/25 via-white to-white dark:from-rose-950/15 dark:via-slate-900 dark:to-slate-900" 
          : isDanger
          ? "border-amber-200/90 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/20 via-white to-white dark:from-amber-950/15 dark:via-slate-900 dark:to-slate-900"
          : "border-slate-200/80 dark:border-slate-800"
      )}>
        
        {/* Top Header: Badge, Period, Rollover & Quick Settings */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-150/70 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs",
              isOver ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" :
              isDanger ? "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" :
              "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            )}>
              <Wallet size={16} />
            </div>
            
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {isWeekly ? 'الميزانية الأسبوعية' : 'الميزانية الشهرية'}
              </h2>
              
              {/* Status Pill */}
              <span className={cn(
                "text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0",
                isOver ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50" :
                isDanger ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50" :
                isHealthy ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50" :
                "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              )}>
                {isOver ? 'تجاوزت الميزانية 🚨' :
                 isDanger ? 'في خطر استنزاف ⚠️' :
                 isHealthy ? 'منضبط وعلى المسار 🛡️' : 'غير محددة'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Rollover badge */}
            {rollingBudgetEnabled && rolloverInfo?.hasPrevData && (
              <span 
                className={cn(
                  "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border",
                  rolloverInfo.isSurplus 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40"
                )}
              >
                <RefreshCw size={10} />
                <span>{rolloverInfo.isSurplus ? `+${formatCurrency(rolloverInfo.amount, currency)} فائض` : `-${formatCurrency(Math.abs(rolloverInfo.amount), currency)} عجز`}</span>
              </span>
            )}

            {/* Settings shortcut */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Sliders size={13} className="text-slate-400" />
                <span>الضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Stats: Remaining vs Budgeted vs Spent */}
        <div className="my-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          
          {/* Main Hero Metric: Remaining */}
          <div className="sm:col-span-1 space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 block">
              {isOver ? 'المبلغ المتجاوز' : 'المتبقي للإنفاق'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-3xl sm:text-4xl font-black font-mono tracking-tight",
                isOver ? "text-rose-600 dark:text-rose-400" :
                isDanger ? "text-amber-600 dark:text-amber-400" :
                "text-slate-900 dark:text-white"
              )}>
                {isOver 
                  ? `+${formatCurrency(totalSpent - globalBudgetNum, currency)}`
                  : formatCurrency(remainingBudget, currency)
                }
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">{currency}</span>
            </div>
          </div>

          {/* Sub Stats: Total Budget & Actual Spent */}
          <div className="sm:col-span-2 flex items-center gap-3">
            
            {/* Total Budget Card / Click to Edit */}
            <div 
              onClick={onOpenSettings}
              className="flex-1 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-150 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
              title="انقر لتعديل سقف الميزانية"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold block">الميزانية المرصودة</span>
                <Edit3 size={11} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black font-mono text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {formatCurrency(globalBudgetNum, currency)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{currency}</span>
              </div>
            </div>

            {/* Spent Card */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-150 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block">المصروف الفعلي</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={cn(
                  "text-base font-black font-mono",
                  isOver ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"
                )}>
                  {formatCurrency(totalSpent, currency)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{currency}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="space-y-1.5 my-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500 dark:text-slate-400">
              نسبة الاستهلاك
            </span>
            <span className={cn(
              "font-black font-mono",
              isOver ? "text-rose-600 dark:text-rose-400" :
              isDanger ? "text-amber-600 dark:text-amber-400" :
              "text-emerald-600 dark:text-emerald-400"
            )}>
              {overallPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOver ? "bg-rose-500" :
                isDanger ? "bg-amber-500" :
                "bg-emerald-500"
              )}
            />
          </div>
        </div>

        {/* Bottom Bar: Days remaining + Allowed Daily Spend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            <span>
              {activeRemainingDays} {activeRemainingDays === 1 ? 'يوم متبقٍ' : 'أيام متبقية'}
              <span className="text-[10px] opacity-70"> (من أصل {totalPeriodDays} يوم)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <Zap size={13} className="text-amber-500" />
            <span>الحد اليومي الآمن:</span>
            <span className="font-black text-slate-800 dark:text-white">
              {formatCurrency(dailyLimit, currency)}
            </span>
            <span className="text-[9px] text-slate-400 font-tajawal">/ يوم</span>
          </div>
        </div>

        {/* Insight Line */}
        <div className={cn(
          "mt-3 p-3 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5",
          smartInsight.tone === 'danger'
            ? "bg-rose-50/70 border-rose-200/80 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300"
            : smartInsight.tone === 'warning'
            ? "bg-amber-50/70 border-amber-200/80 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300"
            : smartInsight.tone === 'success'
            ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300"
            : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-300"
        )}>
          <div className="shrink-0 mt-0.5">
            {smartInsight.tone === 'danger' ? <TrendingDown size={15} className="text-rose-500" /> :
             smartInsight.tone === 'warning' ? <Info size={15} className="text-amber-500" /> :
             smartInsight.tone === 'success' ? <ShieldCheck size={15} className="text-emerald-500" /> :
             <Lightbulb size={15} className="text-indigo-500" />}
          </div>
          <p className="font-medium text-[11.5px]">{smartInsight.text}</p>
        </div>

      </div>
    </motion.div>
  );
};

export default BudgetOverview;
