import React from 'react';
import { motion, Variants } from 'motion/react';
import { Wallet, Zap, Activity, Target } from 'lucide-react';
import { formatCurrency, cn } from '../../utils';

interface SummaryKpiRowProps {
  totalNetWorth: number;
  totalGoals?: number;
  remainingToday: number;
  totalMonthlyExpense: number;
  globalBudgetNum: number;
  currency: string;
  itemVariants: Variants;
}

export const SummaryKpiRow: React.FC<SummaryKpiRowProps> = ({
  totalNetWorth,
  totalGoals = 0,
  remainingToday,
  totalMonthlyExpense,
  globalBudgetNum,
  currency,
  itemVariants,
}) => {
  return (
    <motion.div 
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
      dir="rtl"
    >
      {/* Card 1: Total Balance */}
      <div className="relative overflow-hidden p-4 sm:p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs flex flex-col justify-between text-right transition-all hover:border-emerald-300 dark:hover:border-emerald-700/60 group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <Wallet size={18} />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">الرصيد الإجمالي</span>
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight truncate">
            {formatCurrency(totalNetWorth, currency)}
          </span>
          {totalGoals > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate pt-1 border-t border-slate-100 dark:border-slate-800/80">
              حر للإنفاق: {formatCurrency(Math.max(0, totalNetWorth - totalGoals), currency)}
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Safe Remaining Today */}
      <div className="relative overflow-hidden p-4 sm:p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs flex flex-col justify-between text-right transition-all hover:border-amber-300 dark:hover:border-amber-700/60 group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <Zap size={18} />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">المتبقي الآمن اليوم</span>
        </div>
        <div className="flex flex-col space-y-1">
          <span className={cn(
            "text-base sm:text-xl md:text-2xl font-black font-mono tabular-nums tracking-tight truncate",
            remainingToday > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {formatCurrency(remainingToday, currency)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {remainingToday > 0 ? 'ضمن حد الأمان اليومي' : 'تجاوز حد اليوم'}
          </span>
        </div>
      </div>

      {/* Card 3: Monthly Expenses */}
      <div className="relative overflow-hidden p-4 sm:p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs flex flex-col justify-between text-right transition-all hover:border-rose-300 dark:hover:border-rose-700/60 group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <Activity size={18} />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">مصاريف الشهر</span>
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight truncate">
            {formatCurrency(totalMonthlyExpense, currency)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate pt-1 border-t border-slate-100 dark:border-slate-800/80">
            إجمالي المدفوعات المسجلة
          </span>
        </div>
      </div>

      {/* Card 4: Global Budget */}
      <div className="relative overflow-hidden p-4 sm:p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs flex flex-col justify-between text-right transition-all hover:border-indigo-300 dark:hover:border-indigo-700/60 group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <Target size={18} />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">الميزانية المرصودة</span>
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-base sm:text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums tracking-tight truncate">
            {formatCurrency(globalBudgetNum, currency)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate pt-1 border-t border-slate-100 dark:border-slate-800/80">
            السقف المحدد للشهر
          </span>
        </div>
      </div>
    </motion.div>
  );
};
