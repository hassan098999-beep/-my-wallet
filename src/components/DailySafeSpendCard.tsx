import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Info, 
  HelpCircle, 
  X, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  Wallet
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../utils';

interface DailySafeSpendCardProps {
  dailyLimit: number;
  todaySpent: number;
  remainingToday: number;
  globalBudgetNum: number;
  currency: string;
  remainingDays: number;
  daysInMonth: number;
  rollingBudgetEnabled?: boolean;
  totalSpentMonth?: number;
  onOpenAddExpense?: () => void;
  className?: string;
}

export const DailySafeSpendCard: React.FC<DailySafeSpendCardProps> = ({
  dailyLimit,
  todaySpent,
  remainingToday,
  globalBudgetNum,
  currency,
  remainingDays,
  daysInMonth,
  rollingBudgetEnabled = true,
  totalSpentMonth = 0,
  onOpenAddExpense,
  className
}) => {
  const [showHelp, setShowHelp] = useState(false);

  // Safe Math Calculations
  const validDailyLimit = Math.max(0, dailyLimit || 0);
  const percentSpent = validDailyLimit > 0 
    ? Math.min(100, Math.round((todaySpent / validDailyLimit) * 100)) 
    : (todaySpent > 0 ? 100 : 0);

  const rawPercent = validDailyLimit > 0 ? (todaySpent / validDailyLimit) * 100 : 0;
  const isOverBudget = rawPercent > 100;
  const isNearLimit = rawPercent >= 75 && rawPercent <= 100;
  const isSafe = rawPercent < 75;

  // Status badge styling and text
  const statusConfig = isOverBudget
    ? {
        label: 'تجاوزت الحد اليومي',
        badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
        barBg: 'bg-rose-500',
        glowBg: 'from-rose-500/20 to-rose-600/5',
        icon: Flame,
        desc: 'لقد استهلكت كامل المبلغ المسموح به لهذا اليوم.'
      }
    : isNearLimit
    ? {
        label: 'اقتربت من الحد اليومي',
        badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
        barBg: 'bg-amber-500',
        glowBg: 'from-amber-500/20 to-amber-600/5',
        icon: AlertTriangle,
        desc: 'تبقى قليل فقط من ميزانيتك المتاحة لليوم.'
      }
    : {
        label: 'في النطاق الآمن',
        badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        barBg: 'bg-emerald-500',
        glowBg: 'from-emerald-500/20 to-teal-600/5',
        icon: ShieldCheck,
        desc: 'معدل صرف ممتاز يضمن لك البقاء ضمن الميزانية الشهرية.'
      };

  const StatusIcon = statusConfig.icon;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 md:p-6 shadow-sm transition-all text-right dir-rtl",
        "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800",
        className
      )}
      dir="rtl"
    >
      {/* Background Subtle Ambient Glow */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
        isOverBudget ? "from-rose-500 via-pink-500 to-rose-600" :
        isNearLimit ? "from-amber-500 via-orange-400 to-amber-600" :
        "from-emerald-500 via-teal-400 to-indigo-500"
      )} />
      
      <div className={cn(
        "absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none bg-gradient-to-br opacity-40",
        statusConfig.glowBg
      )} />

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs",
            statusConfig.badgeBg
          )}>
            <StatusIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                مشر الميزانية اليومية الآمنة
              </h3>
              <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1", statusConfig.badgeBg)}>
                <span>{statusConfig.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              محسوب ديناميكياً من الميزانية الشهرية الإجمالية ({formatCurrency(globalBudgetNum, currency)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              hapticFeedback('light');
              setShowHelp(prev => !prev);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="طريقة الحساب"
          >
            <HelpCircle size={14} className="text-emerald-500" />
            <span className="hidden sm:inline">طريقة الحساب</span>
          </button>

          {onOpenAddExpense && (
            <button
              type="button"
              onClick={() => {
                hapticFeedback('medium');
                onOpenAddExpense();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span>تسجيل مصروف</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Display Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Card 1: Safe Remaining Today */}
        <div className={cn(
          "p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden",
          isOverBudget 
            ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/20" 
            : "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20"
        )}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              المتبقي الآمن للصرف اليوم ⚡
            </span>
            <Sparkles size={14} className={isOverBudget ? "text-rose-500" : "text-emerald-500"} />
          </div>
          <p className={cn(
            "text-2xl font-black font-mono tracking-tight",
            isOverBudget ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
          )}>
            {formatCurrency(remainingToday, currency)}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 block">
            {isOverBudget ? 'تجاوزت المسموح بـ ' + formatCurrency(todaySpent - validDailyLimit, currency) : 'متاح للصرف دون الإخلال بمهدف الشهر'}
          </span>
        </div>

        {/* Card 2: Safe Daily Allocation Limit */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              الحد المسموح لليوم
            </span>
            <TrendingUp size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(validDailyLimit, currency)}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 block">
            بناءً على {remainingDays} يوماً متبقياً في الشهر
          </span>
        </div>

        {/* Card 3: Spent Today */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              تم صرفه اليوم 💸
            </span>
            <Wallet size={14} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight text-slate-800 dark:text-slate-200">
            {formatCurrency(todaySpent, currency)}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 block">
            استهلكت {percentSpent}% من حصة اليوم
          </span>
        </div>
      </div>

      {/* Visual Progress Bar Section */}
      <div className="space-y-2 bg-slate-50/70 dark:bg-slate-850/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800">
        <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span>نسبة استهلاك ميزانية اليوم:</span>
            <span className={cn(
              "font-mono font-black px-2 py-0.5 rounded-lg text-[11px]",
              statusConfig.badgeBg
            )}>
              {rawPercent.toFixed(1)}%
            </span>
          </span>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {formatCurrency(todaySpent, currency)} / {formatCurrency(validDailyLimit, currency)}
          </span>
        </div>

        {/* Bar Container */}
        <div className="relative w-full bg-slate-200 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, rawPercent)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn(
              "h-full rounded-full transition-all duration-500 relative",
              statusConfig.barBg
            )}
          >
            {/* Glossy highlight on top of bar */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-white/40" />
          </motion.div>
        </div>

        {/* Milestone Markers */}
        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 px-0.5 pt-0.5">
          <span>0% (بدء اليوم)</span>
          <span>50% (نصف الحصة)</span>
          <span>75% (تحذير)</span>
          <span>100% (الحد الأقصى)</span>
        </div>
      </div>

      {/* Explanation Tooltip Drawer / Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-4"
          >
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 text-xs border border-slate-800 shadow-lg">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Info size={14} />
                  طريقة احتساب الميزانية اليومية الآمنة 🧮
                </span>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-slate-300 leading-relaxed text-[11px]">
                نظام **مساريفي** يحسب لك يومياً المبلغ الذي يمكنك صرفه بأمان دون أن تتجاوز سقف ميزانيتك الشهرية المحدد بـ <strong className="text-white font-mono">{formatCurrency(globalBudgetNum, currency)}</strong>:
              </p>

              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">1. الميزانية المتبقية للشهر:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(Math.max(0, globalBudgetNum - totalSpentMonth), currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">2. الأيام المتبقية في الشهر:</span>
                  <span className="text-amber-400 font-bold">{remainingDays} يوم</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 text-white font-bold">
                  <span>3. الحصة اليومية المتاحة:</span>
                  <span className="text-emerald-400">{formatCurrency(validDailyLimit, currency)} / يوم</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-300">
                  <span>4. المصروف المسجل اليوم:</span>
                  <span className="text-rose-400">-{formatCurrency(todaySpent, currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-1.5 text-white font-black">
                  <span>المتبقي الآمن لليوم:</span>
                  <span className="text-emerald-400">{formatCurrency(remainingToday, currency)}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                💡 في حال لم تصرف كامل حصتك اليوم، يتم تدوير الفائض تلقائياً ليزيد من المتاح لك في الأيام القادمة!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailySafeSpendCard;
