import React from "react";
import { motion } from "motion/react";
import { ArrowUp, ArrowDown, CalendarDays, Trophy } from "lucide-react";
import { formatCurrency } from "../../utils";

interface TransactionsSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  currency: string;
  incomeDiff?: number | null;
  expenseDiff?: number | null;
  dailyAverageExpense?: number;
  daysCount?: number;
  topTransaction?: {
    amount: number;
    categoryName: string;
    type: "expense" | "income";
    note?: string;
  } | null;
}

export const TransactionsSummary: React.FC<TransactionsSummaryProps> = ({
  totalIncome,
  totalExpenses,
  currency,
  incomeDiff,
  expenseDiff,
  dailyAverageExpense = 0,
  daysCount = 1,
  topTransaction = null,
}) => {
  const formatDiff = (val?: number | null) => {
    if (val === undefined || val === null) return <span className="text-xs font-black opacity-50">-</span>;
    if (val === 0) return <span className="text-xs font-black">0%</span>;
    
    const isPositive = val > 0;
    const absVal = Math.abs(val).toFixed(1);
    const colorClass = isPositive ? "text-emerald-400" : "text-rose-400";
    const Icon = isPositive ? ArrowUp : ArrowDown;
    
    return (
      <span className={`text-xs font-black flex items-center gap-1 ${colorClass}`}>
        <Icon size={12} strokeWidth={3} />
        {absVal}%
      </span>
    );
  };

  // For expenses, a decrease (negative) is good (green), an increase (positive) is bad (red)
  const formatExpenseDiff = (val?: number | null) => {
    if (val === undefined || val === null) return <span className="text-xs font-black opacity-50">-</span>;
    if (val === 0) return <span className="text-xs font-black">0%</span>;
    
    const isPositive = val > 0;
    const absVal = Math.abs(val).toFixed(1);
    const colorClass = isPositive ? "text-rose-400" : "text-emerald-400";
    const Icon = isPositive ? ArrowUp : ArrowDown;
    
    return (
      <span className={`text-xs font-black flex items-center gap-1 ${colorClass}`}>
        <Icon size={12} strokeWidth={3} />
        {absVal}%
      </span>
    );
  };

  return (
    <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 sm:gap-4 font-tajawal">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs relative overflow-hidden group flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <ArrowUp className="size-4 text-white" />
            </div>
            <span className="text-[11px] font-bold text-emerald-100">
              إجمالي الدخل
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black leading-tight font-mono tabular-nums">
              {formatCurrency(totalIncome, currency)}
            </div>
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-emerald-100 text-[11px]">
          <span className="font-medium">
            معدل النمو
          </span>
          {formatDiff(incomeDiff)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-rose-600 to-red-700 dark:from-rose-700 dark:to-red-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs relative overflow-hidden group flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <ArrowDown className="size-4 text-white" />
            </div>
            <span className="text-[11px] font-bold text-rose-100">
              إجمالي المصاريف
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black leading-tight font-mono tabular-nums">
              {formatCurrency(totalExpenses, currency)}
            </div>
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-rose-100 text-[11px]">
          <span className="font-medium">
            معدل الإنفاق
          </span>
          {formatExpenseDiff(expenseDiff)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-indigo-600 to-slate-700 dark:from-indigo-700 dark:to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs relative overflow-hidden group flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <CalendarDays className="size-4 text-white" />
            </div>
            <span className="text-[11px] font-bold text-indigo-100">
              متوسط الإنفاق اليومي
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black leading-tight font-mono tabular-nums">
              {formatCurrency(dailyAverageExpense, currency)}
            </div>
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-indigo-100 text-[11px]">
          <span className="font-medium">
            النطاق الزمني
          </span>
          <span className="font-bold font-mono">
            {daysCount} {daysCount === 1 ? "يوم" : "أيام"}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-purple-600 to-violet-800 dark:from-purple-700 dark:to-violet-950 rounded-2xl p-4 sm:p-5 text-white shadow-xs relative overflow-hidden group flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Trophy className="size-4 text-white" />
            </div>
            <span className="text-[11px] font-bold text-purple-100">
              أعلى عملية مسجلة
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black leading-tight font-mono tabular-nums truncate">
              {topTransaction ? formatCurrency(topTransaction.amount, currency) : formatCurrency(0, currency)}
            </div>
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-purple-100 text-[11px] gap-2 min-w-0">
          <span className="font-medium shrink-0">
            التصنيف
          </span>
          <span className="font-bold truncate" title={topTransaction?.categoryName || "لا توجد عمليات"}>
            {topTransaction ? topTransaction.categoryName : "لا توجد عمليات"}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
