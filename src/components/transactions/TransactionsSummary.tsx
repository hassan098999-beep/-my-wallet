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
    <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-600 rounded-3xl p-5 text-white shadow-md shadow-emerald-500/10 relative overflow-hidden group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      >
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <ArrowUp className="size-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              إجمالي الدخل
            </span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black leading-none font-mono">
              {formatCurrency(totalIncome, currency)}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between opacity-75">
          <span className="text-[10px] font-black uppercase tracking-widest">
            معدل النمو
          </span>
          {formatDiff(incomeDiff)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-rose-600 rounded-3xl p-5 text-white shadow-md shadow-rose-500/10 relative overflow-hidden group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      >
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <ArrowDown className="size-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              إجمالي المصاريف
            </span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black leading-none font-mono">
              {formatCurrency(totalExpenses, currency)}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between opacity-75">
          <span className="text-[10px] font-black uppercase tracking-widest">
            معدل الإنفاق
          </span>
          {formatExpenseDiff(expenseDiff)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-indigo-600 rounded-3xl p-5 text-white shadow-md shadow-indigo-500/10 relative overflow-hidden group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      >
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <CalendarDays className="size-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              متوسط الإنفاق اليومي
            </span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black leading-none font-mono">
              {formatCurrency(dailyAverageExpense, currency)}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between opacity-75">
          <span className="text-[10px] font-black uppercase tracking-widest">
            النطاق الزمني
          </span>
          <span className="text-xs font-bold font-mono">
            {daysCount} {daysCount === 1 ? "يوم" : "أيام"}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-purple-600 rounded-3xl p-5 text-white shadow-md shadow-purple-500/10 relative overflow-hidden group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      >
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Trophy className="size-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              أعلى عملية
            </span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black leading-none font-mono">
              {topTransaction ? formatCurrency(topTransaction.amount, currency) : formatCurrency(0, currency)}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between opacity-75 gap-2 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest shrink-0">
            التصنيف
          </span>
          <span className="text-xs font-bold truncate dir-rtl" title={topTransaction?.categoryName || "لا توجد عمليات"}>
            {topTransaction ? topTransaction.categoryName : "لا توجد عمليات"}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
