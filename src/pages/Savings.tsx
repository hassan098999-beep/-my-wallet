import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback } from '../utils';
import { Skeleton } from '../components/Skeleton';
import { motion } from 'motion/react';
import { PiggyBank, Target, ArrowRight, TrendingUp, Percent } from 'lucide-react';

const SavingsPage = () => {
  const { income, expenses, goals, updateGoal, currency } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const [savingsPercentage, setSavingsPercentage] = useState(10);

  const totalIncome = useMemo(() => income.reduce((sum, i) => sum + i.amount, 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const potentialSavings = Math.max(0, totalIncome - totalExpenses);
  const calculatedSavings = (potentialSavings * savingsPercentage) / 100;

  const handleAllocate = () => {
    if (goals.length === 0) {
      hapticFeedback('error');
      return;
    }
    hapticFeedback('success');
    const allocationPerGoal = calculatedSavings / goals.length;
    goals.forEach(goal => {
      updateGoal(goal.id, { currentAmount: goal.currentAmount + allocationPerGoal });
    });
    toast.success(`تم تخصيص ${formatCurrency(calculatedSavings, currency)} بالتساوي بين ${goals.length} أهداف.`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-6 pb-12 max-w-5xl mx-auto px-2"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
            تخصيص <span className="text-emerald-500">الادخار</span>
          </h1>
          <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            احسب ووزع مدخراتك تلقائياً على أهدافك المالية
          </p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl md:rounded-3xl" />
      ) : (
        <motion.div 
          variants={itemVariants}
          className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shadow-sm">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">المدخرات المحتملة</h3>
            </div>
            <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <p className="text-[7px] md:text-[8px] font-bold text-slate-500 mb-1 md:mb-2 uppercase tracking-widest">الفرق بين الدخل والمصاريف</p>
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
              <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">نسبة الادخار المستهدفة</h3>
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

        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-xl shadow-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="space-y-1 md:space-y-2 text-center md:text-right">
              <p className="text-emerald-100 font-bold text-[8px] md:text-[10px] uppercase tracking-widest">المبلغ المخصص للادخار</p>
              <p className="text-2xl md:text-4xl font-black tracking-tighter">{formatCurrency(calculatedSavings, currency)}</p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAllocate}
              disabled={goals.length === 0 || calculatedSavings === 0}
              className="w-full md:w-auto bg-white text-emerald-600 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <PiggyBank size={18} /> 
              <span>توزيع على الأهداف ({goals.length})</span>
            </motion.button>
          </div>
          
          {goals.length === 0 && (
            <p className="text-center text-[10px] md:text-xs font-black text-rose-500 mt-4 md:mt-6">
              لا توجد أهداف ادخارية مسجلة. قم بإضافة أهداف أولاً.
            </p>
          )}
        </div>
      </motion.div>
    )}
    </motion.div>
  );
};

export default SavingsPage;
