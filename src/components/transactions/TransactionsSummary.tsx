import React from "react";
import { motion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "../../utils";

interface TransactionsSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  currency: string;
  incomeDiff?: number | null;
  expenseDiff?: number | null;
}

export const TransactionsSummary: React.FC<TransactionsSummaryProps> = ({
  totalIncome,
  totalExpenses,
  currency,
  incomeDiff,
  expenseDiff,
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
    <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-600 rounded-3xl p-6 text-white shadow-md shadow-emerald-500/10 relative overflow-hidden group flex-1 flex flex-col justify-between border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <ArrowUp className="size-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              إجمالي الدخل
            </span>
          </div>
          <div>
            <div className="text-3xl font-black leading-none font-mono">
              {formatCurrency(totalIncome, currency)}
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between opacity-60">
          <span className="text-[10px] font-black uppercase tracking-widest">
            معدل النمو
          </span>
          {formatDiff(incomeDiff)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-rose-600 rounded-3xl p-6 text-white shadow-md shadow-rose-500/10 relative overflow-hidden group flex-1 flex flex-col justify-between border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <ArrowDown className="size-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              إجمالي المصاريف
            </span>
          </div>
          <div>
            <div className="text-3xl font-black leading-none font-mono">
              {formatCurrency(totalExpenses, currency)}
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between opacity-60">
          <span className="text-[10px] font-black uppercase tracking-widest">
            معدل الإنفاق
          </span>
          {formatExpenseDiff(expenseDiff)}
        </div>
      </motion.div>
    </div>
  );
};
