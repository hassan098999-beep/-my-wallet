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
      className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
      dir="rtl"
    >
      {/* Card 1: Total Balance */}
      <div className="relative overflow-hidden p-4 md:p-5 bg-white dark:bg-slate-900/90 border border-slate-150 dark:border-slate-800/85 rounded-2xl shadow-md dark:shadow-black/10 flex flex-col justify-between text-right transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-bl-full pointer-events-none -mr-2 -mt-2" />
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Wallet size={18} />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-wide">الرصيد الإجمالي 💳</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm md:text-lg font-black text-slate-900 dark:text-white font-mono truncate">
            {formatCurrency(totalNetWorth, currency)}
          </span>
          {totalGoals > 0 && (
            <span className="text-[9px] text-slate-400 font-bold mt-0.5 border-t border-slate-100 dark:border-slate-800 pt-1">
              متاح للإنفاق: {formatCurrency(Math.max(0, totalNetWorth - totalGoals), currency)}
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Safe Remaining Today */}
      <div className="relative overflow-hidden p-4 md:p-5 bg-white dark:bg-slate-900/90 border border-slate-150 dark:border-slate-800/85 rounded-2xl shadow-md dark:shadow-black/10 flex flex-col justify-between text-right transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 dark:bg-amber-500/10 rounded-bl-full pointer-events-none -mr-2 -mt-2" />
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Zap size={18} className="animate-pulse" />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-wide">المتبقي الآمن اليوم ⚡</span>
        </div>
        <span className={cn(
          "text-sm md:text-lg font-black font-mono truncate",
          remainingToday > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
        )}>
          {formatCurrency(remainingToday, currency)}
        </span>
      </div>

      {/* Card 3: Monthly Expenses */}
      <div className="relative overflow-hidden p-4 md:p-5 bg-white dark:bg-slate-900/90 border border-slate-150 dark:border-slate-800/85 rounded-2xl shadow-md dark:shadow-black/10 flex flex-col justify-between text-right transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 dark:bg-rose-500/10 rounded-bl-full pointer-events-none -mr-2 -mt-2" />
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Activity size={18} />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-wide">مصاريف الشهر 📈</span>
        </div>
        <span className="text-sm md:text-lg font-black text-slate-900 dark:text-white font-mono truncate">
          {formatCurrency(totalMonthlyExpense, currency)}
        </span>
      </div>

      {/* Card 4: Global Budget */}
      <div className="relative overflow-hidden p-4 md:p-5 bg-white dark:bg-slate-900/90 border border-slate-150 dark:border-slate-800/85 rounded-2xl shadow-md dark:shadow-black/10 flex flex-col justify-between text-right transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-bl-full pointer-events-none -mr-2 -mt-2" />
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Target size={18} />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-wide">الميزانية الإجمالية 🎯</span>
        </div>
        <span className="text-sm md:text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono truncate">
          {formatCurrency(globalBudgetNum, currency)}
        </span>
      </div>
    </motion.div>
  );
};
