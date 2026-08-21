import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { 
  Wallet, Sparkles, TrendingDown, Info, HelpCircle, 
  ShieldCheck, Activity, TrendingUp, Calendar, Zap, 
  Settings, ChevronDown, ChevronUp, CheckCircle2,
  Sliders, ArrowUpRight, ArrowDownRight, RefreshCw,
  Lightbulb, Wand2, Loader2, BarChart2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';
import { parseISO, subMonths, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Card from '../ui/Card';
import { Category, BudgetPeriod, Budget, Expense } from '../../types';
import { cn, formatCurrency, hapticFeedback, getBudgetMonth } from '../../utils';

interface BudgetOverviewProps {
  globalBudget: string;
  setGlobalBudget: (val: string) => void;
  overallPeriod: BudgetPeriod;
  setOverallPeriod: (val: BudgetPeriod) => void;
  currency: string;
  totalSpent: number;
  monthSpent: number;
  weekSpent: number;
  remainingBudget: number;
  overallPercentage: number;
  dailyLimit: number;
  remainingDays: number;
  remainingDaysInWeek: number;
  daysInMonth: number;
  rollingBudgetEnabled: boolean;
  setRollingBudgetEnabled: (enabled: boolean) => void;
  globalBudgetNum: number;
  chartData: Array<{ name: string; spent: number; budgeted: number; color?: string }>;
  categories: Category[];
  showRuleInfo: boolean;
  setShowRuleInfo: React.Dispatch<React.SetStateAction<boolean>>;
  suggestFromHistory: () => void;
  autoAllocate: () => void;
  isGenerating: boolean;
  itemVariants?: any;
  selectedMonth?: string;
  firstDayOfMonth?: number;
  setFirstDayOfMonth?: (day: number) => void;
  expenses?: Expense[];
  budgets?: Budget[];
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  globalBudget,
  setGlobalBudget,
  overallPeriod,
  setOverallPeriod,
  currency,
  totalSpent,
  remainingBudget,
  overallPercentage,
  dailyLimit,
  remainingDays,
  remainingDaysInWeek,
  daysInMonth,
  rollingBudgetEnabled,
  setRollingBudgetEnabled,
  globalBudgetNum,
  chartData,
  categories,
  showRuleInfo,
  setShowRuleInfo,
  suggestFromHistory,
  autoAllocate,
  isGenerating,
  itemVariants,
  selectedMonth,
  firstDayOfMonth = 1,
  setFirstDayOfMonth,
  expenses = [],
  budgets = [],
}) => {
  const isWeekly = overallPeriod === 'weekly';
  const activeRemainingDays = isWeekly ? remainingDaysInWeek : remainingDays;
  const totalPeriodDays = isWeekly ? 7 : daysInMonth;
  const [showSettings, setShowSettings] = useState(false);
  const [showTrendChart, setShowTrendChart] = useState(false);

  // Status Evaluation
  const isOver = globalBudgetNum > 0 && totalSpent > globalBudgetNum;
  const isDanger = !isOver && globalBudgetNum > 0 && (overallPercentage > 80);
  const isHealthy = !isOver && !isDanger && globalBudgetNum > 0;
  const isUnset = globalBudgetNum === 0;

  // 1. Dynamic Rollover Calculation from previous month
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

  // 2. Smart Insight Line Logic
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
        text: `لقد تجاوزت الميزانية بـ ${formatCurrency(overAmount, currency)}. يُنصح بوقف المصاريف غير الأساسية لحماية توازن الشهر.`,
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
        text: `بمعدل صرفك الحالي (${formatCurrency(currentDailyRate, currency)}/يوم) ستنفد الميزانية قبل ${earlyDays} أيام من نهاية الدورة. خفّض وتيرة الصرف لـ ${formatCurrency(dailyLimit, currency)}/يوم.`,
        tone: 'warning' as const
      };
    }

    if (currentDailyRate <= plannedDaily && totalSpent > 0) {
      const projectedSavings = Math.max(0, globalBudgetNum - projectedTotal);
      return {
        text: `ممتاز! أنت تصرف بانضباط أقل من المعدل المخطط، مع توفير متوقع يقارب ${formatCurrency(projectedSavings, currency)} نهاية الدورة.`,
        tone: 'success' as const
      };
    }

    return {
      text: `أنت في بداية الدورة المالية. الحد اليومي الآمن المسموح به هو ${formatCurrency(dailyLimit, currency)} لضمان البقاء تحت السقف المحدد.`,
      tone: 'neutral' as const
    };
  }, [isUnset, isOver, totalSpent, globalBudgetNum, currency, totalPeriodDays, activeRemainingDays, dailyLimit]);

  // 3. 6-Month Trend Data for Sparkline
  const trendData = useMemo(() => {
    if (!selectedMonth) return [];
    try {
      const baseDate = parseISO(`${selectedMonth}-01`);
      const monthsList: Array<{ monthKey: string; monthName: string; budgeted: number; spent: number }> = [];

      for (let i = 5; i >= 0; i--) {
        const d = subMonths(baseDate, i);
        const mKey = format(d, 'yyyy-MM');
        const mName = format(d, 'MMM', { locale: ar });

        const bObj = budgets.find(b => b.month === mKey);
        const bAmount = bObj?.amount || 0;

        const mExpenses = expenses.filter(e => {
          if (e.isTransfer) return false;
          const eMonth = getBudgetMonth(parseISO(e.date), firstDayOfMonth);
          return eMonth === mKey;
        });
        const mSpent = mExpenses.reduce((s, e) => s + e.amount, 0);

        monthsList.push({
          monthKey: mKey,
          monthName: mName,
          budgeted: Number(bAmount.toFixed(1)),
          spent: Number(mSpent.toFixed(1)),
        });
      }
      return monthsList;
    } catch {
      return [];
    }
  }, [selectedMonth, budgets, expenses, firstDayOfMonth]);

  return (
    <div className="space-y-6 text-right font-tajawal">
      {/* 1. Unified Clean Status Card */}
      <motion.div variants={itemVariants}>
        <div className={cn(
          "bg-white dark:bg-slate-900 border rounded-3xl p-6 md:p-7 relative overflow-hidden transition-all duration-300 shadow-sm",
          isOver 
            ? "border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-b from-rose-50/20 via-white to-white dark:from-rose-950/10 dark:via-slate-900 dark:to-slate-900" 
            : isDanger
            ? "border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/15 via-white to-white dark:from-amber-950/10 dark:via-slate-900 dark:to-slate-900"
            : "border-slate-200/80 dark:border-slate-800"
        )}>
          
          {/* Card Top Row: Title, Rollover Badge, Status Badge & Settings Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-150/70 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                isOver ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" :
                isDanger ? "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" :
                "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
              )}>
                <Wallet size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                    {isWeekly ? 'الميزانية الأسبوعية' : 'الميزانية الشهرية'}
                  </h2>
                  
                  {/* Status Badge */}
                  <span className={cn(
                    "text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0",
                    isOver ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50" :
                    isDanger ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50" :
                    isHealthy ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50" :
                    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  )}>
                    {isOver ? 'تجاوزت الميزانية 🚨' :
                     isDanger ? 'في خطر استنزاف ⚠️' :
                     isHealthy ? 'على المسار الصحيح 🛡️' : 'غير محددة'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side controls: Rollover indicator, Trend toggle & Foldable Settings Toggle */}
            <div className="flex items-center gap-2">
              {/* Dynamic Rollover Badge */}
              {rollingBudgetEnabled && (
                <div 
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-2xs",
                    rolloverInfo && rolloverInfo.hasPrevData
                      ? rolloverInfo.isSurplus
                        ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40"
                        : "bg-rose-50/80 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40"
                      : "bg-indigo-50/70 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/40"
                  )}
                  title={rolloverInfo && rolloverInfo.hasPrevData
                    ? `ترحيل تلقائي من شهر ${rolloverInfo.prevMonthName}: ${rolloverInfo.isSurplus ? '+' : ''}${formatCurrency(rolloverInfo.amount, currency)}`
                    : 'الميزانية المتدحرجة مفعلة: تتكيف يومياً بناءً على صرفك'
                  }
                >
                  <RefreshCw size={11} className={cn("shrink-0", rolloverInfo?.hasPrevData && !rolloverInfo.isSurplus && "text-rose-500")} />
                  <span>
                    {rolloverInfo && rolloverInfo.hasPrevData
                      ? (rolloverInfo.isSurplus 
                          ? `+${formatCurrency(rolloverInfo.amount, currency)} فائض` 
                          : `-${formatCurrency(Math.abs(rolloverInfo.amount), currency)} عجز`)
                      : 'متدحرجة 🔄'
                    }
                  </span>
                </div>
              )}

              {/* Toggle 6-Month Trend Chart */}
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setShowTrendChart(!showTrendChart);
                }}
                className={cn(
                  "p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                  showTrendChart 
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800" 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                )}
                title="عرض مسار وتطور الصرف لـ 6 أشهر سابقة"
              >
                <BarChart2 size={15} />
                <span className="hidden sm:inline text-[10px]">المسار (6 أشهر)</span>
              </button>

              {/* Foldable Settings Gear Button */}
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setShowSettings(!showSettings);
                }}
                className={cn(
                  "p-1.5 px-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                  showSettings 
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900" 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                )}
                title="إعدادات وأدوات الميزانية المتقدمة"
              >
                <Settings size={15} className={cn("transition-transform duration-300", showSettings && "rotate-90")} />
                <span className="text-[10px]">الإعدادات</span>
                {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Card Middle: One Prominent Number & Spending Stats */}
          <div className="my-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                {isOver ? 'المبلغ المتجاوز عن الميزانية المحددة' : 'المبلغ المتبقي من الميزانية'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl md:text-4xl font-black font-mono tracking-tight",
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

            <div className="flex items-center gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">الميزانية المرصودة</span>
                <span className="font-black text-slate-800 dark:text-slate-200 font-mono">
                  {formatCurrency(globalBudgetNum, currency)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">المصروف الفعلي</span>
                <span className={cn("font-black font-mono", isOver ? "text-rose-500" : "text-slate-800 dark:text-slate-200")}>
                  {formatCurrency(totalSpent, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Single Clear Progress Bar */}
          <div className="space-y-1.5 my-4">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-slate-500 dark:text-slate-400">
                {isWeekly ? 'نسبة استهلاك ميزانية الأسبوع' : 'نسبة استهلاك الميزانية'}
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

            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
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

          {/* Sub-line: Days Remaining & Daily Limit */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>
                {activeRemainingDays} {activeRemainingDays === 1 ? 'يوم متبقٍ' : 'أيام متبقية'}
                <span className="text-[10px] opacity-70"> (من أصل {totalPeriodDays} يوم)</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <Zap size={13} className="text-amber-500" />
              <span>معدلك اليومي المسموح:</span>
              <span className="font-black text-slate-800 dark:text-white">
                {formatCurrency(dailyLimit, currency)}
              </span>
              <span className="text-[9px] text-slate-400 font-tajawal">/ يوم</span>
            </div>
          </div>

          {/* 2. Smart Insight Line */}
          <div className={cn(
            "mt-4 p-3 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 transition-all",
            smartInsight.tone === 'danger'
              ? "bg-rose-50/60 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300"
              : smartInsight.tone === 'warning'
              ? "bg-amber-50/60 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300"
              : smartInsight.tone === 'success'
              ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300"
              : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-300"
          )}>
            <div className="shrink-0 mt-0.5">
              {smartInsight.tone === 'danger' ? <TrendingDown size={16} className="text-rose-500" /> :
               smartInsight.tone === 'warning' ? <Info size={16} className="text-amber-500" /> :
               smartInsight.tone === 'success' ? <ShieldCheck size={16} className="text-emerald-500" /> :
               <Lightbulb size={16} className="text-indigo-500" />}
            </div>
            <p className="font-medium text-[11.5px]">{smartInsight.text}</p>
          </div>

          {/* 4. 6-Month Trend Sparkline Chart (Collapsible / Toggleable) */}
          <AnimatePresence>
            {showTrendChart && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-5 pt-4 border-t border-slate-150 dark:border-slate-800 space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-indigo-500" />
                    <span className="font-black text-slate-800 dark:text-white">اتجاه الصرف والميزانية (آخر 6 أشهر)</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      الميزانية
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      المصروف الفعلي
                    </span>
                  </div>
                </div>

                <div className="h-36 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendBudgetGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="trendSpentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                      <XAxis 
                        dataKey="monthName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', direction: 'rtl' }}
                        itemStyle={{ color: '#fff', fontSize: '10px', fontFamily: 'Tajawal, sans-serif' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif', textAlign: 'right' }}
                        formatter={(value: any, name: any) => [
                          `${value} ${currency}`,
                          name === 'budgeted' ? 'الميزانية المرصودة' : 'المصروف الفعلي'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="budgeted" 
                        stroke="#6366f1" 
                        strokeWidth={2} 
                        strokeDasharray="4 4"
                        fill="url(#trendBudgetGrad)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spent" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        fill="url(#trendSpentGrad)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      {/* 5. Foldable Settings & Advanced Controls Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-5 md:p-6 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-500" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">إعدادات وأدوات الميزانية المتقدمة</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
                >
                  إغلاق ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* Setting 1: Total Budget Amount */}
                <div className="space-y-1.5 bg-white dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    مبلغ الميزانية الإجمالية:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={globalBudget}
                      onChange={(e) => setGlobalBudget(e.target.value)}
                      onFocus={(e) => {
                        if (!globalBudget || globalBudget === '0' || globalBudget === '0.00' || parseFloat(globalBudget) === 0) {
                          setGlobalBudget('');
                        } else {
                          const target = e.target;
                          setTimeout(() => {
                            try { target.setSelectionRange(0, target.value.length); } catch {}
                          }, 50);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-base font-black font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all text-center"
                      placeholder="0.00"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currency}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">سقف الصرف الإجمالي المطلوب للتحكم بنفقاتك</p>
                </div>

                {/* Setting 2: Period Type Selector */}
                <div className="space-y-1.5 bg-white dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    نوع دورة الميزانية:
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        setOverallPeriod('monthly');
                      }}
                      className={cn(
                        "py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer",
                        !isWeekly ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      <Calendar size={12} />
                      <span>شهرية 🗓️</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        setOverallPeriod('weekly');
                      }}
                      className={cn(
                        "py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer",
                        isWeekly ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      <Zap size={12} />
                      <span>أسبوعية ⚡</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">اختر الدورة الإجمالية المناسبة لإيقاع دخلك ونفقاتك</p>
                </div>

                {/* Setting 3: Rolling Budget Toggle */}
                <div className="space-y-1.5 bg-white dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                      الميزانية المتدحرجة 🔄:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('medium');
                        setRollingBudgetEnabled(!rollingBudgetEnabled);
                        toast.success(
                          rollingBudgetEnabled 
                            ? 'تم التحول للمود الثابت للميزانية اليومية.' 
                            : 'تم تفعيل حساب الميزانية المتدحرجة! استمتع بنصائح يومية ذكية هادفة.'
                        );
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                        rollingBudgetEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                          rollingBudgetEnabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    ترحيل وتكييف الفائض أو العجز يومياً للحفاظ على سلامة الصرف دون الشعور بالضغط.
                  </p>
                </div>

              </div>

              {/* Quick Smart Tools: 50/30/20 & History suggestions */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-500">أدوات التوزيع الذكي:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRuleInfo(!showRuleInfo)}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-xl border border-indigo-200/50 dark:border-indigo-800/40 cursor-pointer"
                    >
                      <HelpCircle size={13} />
                      <span>شرح قاعدة 50/30/20</span>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={suggestFromHistory}
                      disabled={isGenerating}
                      className="flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-3.5 py-1.5 rounded-xl border border-blue-500/15 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
                    >
                      {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Lightbulb size={13} />}
                      <span>اقتراح من التاريخ</span>
                    </button>

                    <button 
                      type="button"
                      onClick={autoAllocate}
                      disabled={isGenerating || !globalBudget}
                      className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1.5 rounded-xl border border-emerald-500/15 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
                    >
                      {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                      <span>توزيع 50/30/20 الذكي</span>
                    </button>
                  </div>
                </div>

                {/* 50/30/20 Rule Explanation Box */}
                <AnimatePresence>
                  {showRuleInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-4 bg-white dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-2 text-xs leading-relaxed"
                    >
                      <p className="font-black text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" />
                        ما هي قاعدة الميزانية المثالية 50/30/20؟
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        قاعدة مالية عالمية تقسم ميزانيتك الكلية إلى ثلاثة روافد متوازنة:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <p className="font-black text-rose-600 dark:text-rose-400">%50 للاحتياجات الأساسية</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">الأكل، الشرب، الفواتير، الكراء ومصاريف التداوي الحتمية.</p>
                        </div>
                        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                          <p className="font-black text-amber-600 dark:text-amber-400">%30 للرغبات والكماليات</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">المطاعم، القهوة، الترفيه، الشوبينغ والأنشطة الترويحية.</p>
                        </div>
                        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <p className="font-black text-emerald-600 dark:text-emerald-400">%20 للادخار والمستقبل</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">بناء وسادة الطوارئ، تمويل الأهداف الادخارية والتحصين المالي.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graphical Comparison & 50/30/20 Dashboard */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white">التحليل والمقارنة الرسومية للفئات</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">مقارنة بصرية بين الميزانية المرصودة والمصروف الفعلي</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Comparative horizontal Bar Chart */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 text-right">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">الميزانية المرصودة مقابل المصروف المنجز</h4>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">مقارنة ثنائية بصرية لكافة الفئات النشطة</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 bg-indigo-500/80 rounded-full" />
                <span className="text-[9px] text-slate-500 font-black pl-2">الميزانية</span>
                <span className="w-2 h-2 bg-rose-500/90 rounded-full" />
                <span className="text-[9px] text-slate-500 font-black">المصروف</span>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="w-full" style={{ height: `${Math.max(220, chartData.length * 36)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.3} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      orientation="right"
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }}
                      width={110}
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                      contentStyle={{ borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', direction: 'rtl' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', fontFamily: 'Tajawal, sans-serif' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif', textAlign: 'right' }}
                      formatter={(value: any, name: any) => [
                        `${value} ${currency}`,
                        name === 'budgeted' ? 'الميزانية المخصصة' : 'المصروف الفعلي'
                      ]}
                    />
                    <Bar dataKey="budgeted" name="budgeted" fill="#6366f1" radius={[0, 3, 3, 0]} barSize={7}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-budgeted-${index}`} fill={entry.color ? `${entry.color}35` : '#6366f135'} stroke={entry.color || '#6366f1'} strokeWidth={1.5} />
                      ))}
                    </Bar>
                    <Bar dataKey="spent" name="spent" fill="#ef4444" radius={[0, 3, 3, 0]} barSize={7}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-spent-${index}`} 
                          fill={entry.spent > entry.budgeted && entry.budgeted > 0 ? '#f43f5e' : `${entry.color || '#10b981'}bb`} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                  <TrendingUp size={18} />
                </div>
                <p className="text-xs font-black text-slate-500">لا توجد مخصصات أو مصاريف لتمثيلها حالياً.</p>
                <p className="text-[10px] text-slate-400">حدد ميزانية لبعض الفئات في الأسفل لتفعيل الرسم البياني التفاعلي.</p>
              </div>
            )}
          </div>

          {/* Allocation Gauge cards: 50/30/20 */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">توزيع النفقات حسب قاعدة 50/30/20</h4>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">حالة توازن النفقات الفعلية مع الميزانية</p>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4 py-1">
              {/* Needs Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-rose-500 font-mono">
                    {formatCurrency(chartData.filter(i => {
                      const found = categories.find(c => c.name === i.name);
                      return found?.type === 'need' || !found?.type;
                    }).reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => {
                      const found = categories.find(c => c.name === i.name);
                      return found?.type === 'need' || !found?.type;
                    }).reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">الاحتياجات (%50)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgetsTotal = chartData.filter(i => {
                          const found = categories.find(c => c.name === i.name);
                          return found?.type === 'need' || !found?.type;
                        }).reduce((s, x) => s + x.budgeted, 0);
                        const spentsTotal = chartData.filter(i => {
                          const found = categories.find(c => c.name === i.name);
                          return found?.type === 'need' || !found?.type;
                        }).reduce((s, x) => s + x.spent, 0);
                        return budgetsTotal > 0 ? (spentsTotal / budgetsTotal) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>

              {/* Wants Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-amber-500 font-mono">
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">الرغبات (%30)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgetsTotal = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.budgeted, 0);
                        const spentsTotal = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.spent, 0);
                        return budgetsTotal > 0 ? (spentsTotal / budgetsTotal) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>

              {/* Savings Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-emerald-500 font-mono">
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">الادخار (%20)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgetsTotal = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.budgeted, 0);
                        const spentsTotal = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.spent, 0);
                        return budgetsTotal > 0 ? (spentsTotal / budgetsTotal) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 font-bold leading-relaxed">
              إذا تجاوز المصروف الميزانية، سيظهر شريط الفئة باللون الأحمر لحمايتك من الاستهلاك الزائد.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BudgetOverview;
