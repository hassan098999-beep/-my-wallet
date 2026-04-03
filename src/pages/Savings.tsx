import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { parseISO } from 'date-fns';
import { Skeleton } from '../components/Skeleton';
import { motion } from 'motion/react';
import { PiggyBank, Target, ArrowRight, TrendingUp, Percent, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Goal } from '../types';

const SavingsPage = () => {
  const { income, expenses, goals, updateGoal, currency, budget, categories, firstDayOfMonth } = useAppContext();

  const [savingsPercentage, setSavingsPercentage] = useState(10);
  const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({});

  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  const monthlyTotals = useMemo(() => {
    const totalExpense = expenses
      .filter(e => {
        if (e.isTransfer) return false;
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income
      .filter(i => {
        if (i.isTransfer) return false;
        const d = parseISO(i.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, i) => sum + i.amount, 0);
    
    const categoryExpenses = expenses
      .filter(e => {
        if (e.isTransfer) return false;
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((acc, e) => {
        acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

    return { totalExpense, totalIncome, categoryExpenses };
  }, [expenses, income, monthStart, monthEnd]);

  const potentialSavings = Math.max(0, monthlyTotals.totalIncome - monthlyTotals.totalExpense);
  const calculatedSavings = (potentialSavings * savingsPercentage) / 100;

  const calculateSurplus = (goal: Goal) => {
    if (goal.isLinkedToOverallBudget) {
      return Math.max(0, monthlyTotals.totalIncome - monthlyTotals.totalExpense);
    }
    if (goal.linkedCategoryId && budget?.categoryBudgets?.[goal.linkedCategoryId]) {
      const categoryExpense = monthlyTotals.categoryExpenses[goal.linkedCategoryId] || 0;
      const categoryBudget = budget.categoryBudgets[goal.linkedCategoryId];
      return Math.max(0, categoryBudget - categoryExpense);
    }
    return 0;
  };

  const getSuggestedAllocation = (goal: Goal) => {
    if (goal.isLinkedToOverallBudget || goal.linkedCategoryId) {
      const surplus = calculateSurplus(goal);
      return (surplus * savingsPercentage) / 100;
    }
    // For unlinked goals, distribute the overall calculated savings equally
    const unlinkedGoalsCount = goals.filter(g => !g.isLinkedToOverallBudget && !g.linkedCategoryId).length;
    return unlinkedGoalsCount > 0 ? calculatedSavings / unlinkedGoalsCount : 0;
  };

  const getEffectiveAllocation = (goal: Goal) => {
    if (customAllocations[goal.id] !== undefined) {
      return customAllocations[goal.id];
    }
    return getSuggestedAllocation(goal);
  };

  const handleCustomAllocationChange = (goalId: string, value: string) => {
    const numValue = parseFloat(value);
    setCustomAllocations(prev => ({
      ...prev,
      [goalId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleAllocateAll = () => {
    if (goals.length === 0) {
      hapticFeedback('error');
      return;
    }
    hapticFeedback('success');
    
    let totalAllocated = 0;
    
    goals.forEach(goal => {
      const allocation = getEffectiveAllocation(goal);
      
      if (allocation > 0) {
        updateGoal(goal.id, { currentAmount: goal.currentAmount + allocation });
        totalAllocated += allocation;
      }
    });
    
    setCustomAllocations({});
    toast.success(`تم تخصيص ${formatCurrency(totalAllocated, currency)} بنجاح.`);
  };

  const handleAllocateSingle = (goal: Goal) => {
    const allocation = getEffectiveAllocation(goal);
    if (allocation > 0) {
      hapticFeedback('success');
      updateGoal(goal.id, { currentAmount: goal.currentAmount + allocation });
      setCustomAllocations(prev => {
        const next = { ...prev };
        delete next[goal.id];
        return next;
      });
      toast.success(`تم تخصيص ${formatCurrency(allocation, currency)} للهدف: ${goal.name}`);
    }
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

      <motion.div 
        variants={itemVariants}
        className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shadow-sm">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">المدخرات المحتملة (الفائض الكلي)</h3>
            </div>
            <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner text-center">
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
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-md shadow-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="space-y-1 md:space-y-2 text-center">
              <p className="text-emerald-100 font-bold text-[8px] md:text-[10px] uppercase tracking-widest">إجمالي التخصيص المقترح</p>
              <p className="text-2xl md:text-4xl font-black tracking-tighter">
                {formatCurrency(goals.reduce((sum, g) => sum + getEffectiveAllocation(g), 0), currency)}
              </p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAllocateAll}
              disabled={goals.length === 0 || goals.reduce((sum, g) => sum + getEffectiveAllocation(g), 0) === 0}
              className="w-full md:w-auto bg-white text-emerald-600 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <PiggyBank size={18} /> 
              <span>توزيع على كل الأهداف ({goals.length})</span>
            </motion.button>
          </div>
          
          {goals.length === 0 && (
            <p className="text-center text-[10px] md:text-xs font-black text-rose-500 mt-4 md:mt-6">
              لا توجد أهداف ادخارية مسجلة. قم بإضافة أهداف أولاً.
            </p>
          )}

          {goals.length > 0 && (
            <div className="mt-8 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التخصيص المقترح لكل هدف</p>
              <div className="grid grid-cols-1 gap-4">
                {goals.map(goal => {
                  const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
                  const suggestedAllocation = getSuggestedAllocation(goal);
                  const effectiveAllocation = getEffectiveAllocation(goal);
                  const surplus = calculateSurplus(goal);
                  const isLinked = goal.isLinkedToOverallBudget || goal.linkedCategoryId;
                  
                  return (
                    <div key={goal.id} className="p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">{goal.name}</span>
                            {isLinked && (
                              <span className="flex items-center gap-1 bg-primary-500/10 text-primary-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                <LinkIcon size={10} />
                                {goal.isLinkedToOverallBudget ? 'الميزانية العامة' : categories.find(c => c.id === goal.linkedCategoryId)?.name}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-black text-emerald-600">{Math.round(percentage)}%</span>
                        </div>
                        
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>الحالي: {formatCurrency(goal.currentAmount, currency)}</span>
                          <span>الهدف: {formatCurrency(goal.targetAmount, currency)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center md:justify-center gap-4 md:w-1/2 md:pl-4 md:border-l border-slate-200 dark:border-slate-700 text-center">
                        <div className="space-y-1 text-center flex-1 flex flex-col items-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المقترح ({savingsPercentage}%)</p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-slate-400 text-xs font-bold">+</span>
                            <input
                              type="number"
                              value={customAllocations[goal.id] !== undefined ? customAllocations[goal.id] : suggestedAllocation}
                              onChange={(e) => handleCustomAllocationChange(goal.id, e.target.value)}
                              className="w-24 p-1 text-lg font-black text-emerald-600 dark:text-emerald-400 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none text-center"
                              dir="ltr"
                            />
                          </div>
                          {isLinked && (
                            <p className="text-[8px] text-slate-400">من فائض {formatCurrency(surplus, currency)}</p>
                          )}
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAllocateSingle(goal)}
                          disabled={effectiveAllocation <= 0}
                          className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                          title="تخصيص هذا المبلغ"
                        >
                          <Sparkles size={18} />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SavingsPage;
