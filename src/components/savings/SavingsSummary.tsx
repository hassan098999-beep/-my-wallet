import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Percent } from 'lucide-react';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils';

interface SavingsSummaryProps {
  potentialSavings: number;
  savingsPercentage: number;
  setSavingsPercentage: (value: number) => void;
  currency: string;
  itemVariants?: any;
}

export const SavingsSummary: React.FC<SavingsSummaryProps> = ({
  potentialSavings,
  savingsPercentage,
  setSavingsPercentage,
  currency,
  itemVariants,
}) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className="p-4 md:p-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shadow-sm">
                <TrendingUp size={18} />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">المدخرات المحتملة (الفائض الكلي)</h2>
            </div>
            <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner text-center">
              <p className="text-[10px] font-semibold text-slate-500 mb-1">الفرق بين الدخل والمصاريف</p>
              <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                {formatCurrency(potentialSavings, currency)}
              </p>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 shadow-sm">
                <Percent size={18} />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">نسبة الادخار المستهدفة</h2>
            </div>
            <div className="relative group">
              <input
                type="number"
                value={savingsPercentage}
                onChange={(e) => setSavingsPercentage(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full pl-10 pr-6 py-3 md:pl-12 md:pr-8 md:py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xl md:text-2xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono text-center shadow-inner"
                dir="ltr"
              />
              <span className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm md:text-lg">%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={savingsPercentage} 
              onChange={(e) => setSavingsPercentage(Number(e.target.value))}
              className="w-full h-2 md:h-3 accent-primary-500 cursor-pointer"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SavingsSummary;
