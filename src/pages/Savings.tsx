import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { PiggyBank, Target, Percent } from 'lucide-react';
import { parseISO } from 'date-fns';

import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth, cn } from '../utils';
import { Goal } from '../types';

import PageHeader from '../components/ui/PageHeader';
import BabySavingTargetModal from '../components/BabySavingTargetModal';
import GoalsPage from './Goals';
import SavingsIndicators from './SavingsIndicators';

// Sub-components extracted for modularity
import SavingsSummary from '../components/savings/SavingsSummary';
import BabySavingsTracker from '../components/savings/BabySavingsTracker';
import AutoRoundUpsWidget from '../components/savings/AutoRoundUpsWidget';
import PhysicalPiggyBank from '../components/savings/PhysicalPiggyBank';
import SavingsPieChart from '../components/savings/SavingsPieChart';
import SavingsGoalAllocations from '../components/savings/SavingsGoalAllocations';

const SavingsPage = () => {
  const { 
    income, 
    expenses, 
    goals, 
    updateGoal, 
    currency, 
    budgets, 
    categories, 
    firstDayOfMonth, 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'savings' | 'goals' | 'indicators'>('savings');
  const [savingsPercentage, setSavingsPercentage] = useState(10);
  const [customAllocations, setCustomAllocations] = useState<Record<string, number | string>>({});
  const [isBabyModalOpen, setIsBabyModalOpen] = useState(false);

  const standardGoals = useMemo(() => (goals || []).filter(g => !g.isPhysicalPiggyBank), [goals]);
  const appCurrentMonth = getBudgetMonth(new Date(), firstDayOfMonth);
  const budget = budgets?.find(b => b.month === appCurrentMonth);

  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(appCurrentMonth, firstDayOfMonth), [appCurrentMonth, firstDayOfMonth]);

  const pieData = useMemo(() => {
    return (standardGoals || [])
      .map((g, idx) => {
        const colors = [
          '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', 
          '#06b6d4', '#14b8a6', '#f43f5e', '#a855f7', '#64748b'
        ];
        return {
          name: g.name,
          value: g.currentAmount || 0,
          color: colors[idx % colors.length]
        };
      })
      .filter(item => item.value > 0);
  }, [standardGoals]);

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
    const unlinkedGoalsCount = standardGoals.filter(g => !g.isLinkedToOverallBudget && !g.linkedCategoryId).length;
    return unlinkedGoalsCount > 0 ? calculatedSavings / unlinkedGoalsCount : 0;
  };

  const getEffectiveAllocation = (goal: Goal) => {
    if (customAllocations[goal.id] !== undefined) {
      const val = customAllocations[goal.id];
      return typeof val === 'string' ? (parseFloat(val) || 0) : val;
    }
    return getSuggestedAllocation(goal);
  };

  const handleCustomAllocationChange = (goalId: string, value: string) => {
    setCustomAllocations(prev => ({
      ...prev,
      [goalId]: value
    }));
  };

  const handleAllocateAll = () => {
    if (standardGoals.length === 0) {
      hapticFeedback('error');
      return;
    }
    hapticFeedback('success');
    let totalAllocated = 0;
    standardGoals.forEach(goal => {
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

  const renderTabSwitcher = () => (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between" dir="rtl">
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('savings'); }}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'savings'
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <PiggyBank size={16} />
          <span>حصالة الواقع والادخار 🪙</span>
        </button>
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('goals'); }}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'goals'
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Target size={16} />
          <span>الأهداف المالية للأسرة 🎯</span>
        </button>
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('indicators'); }}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'indicators'
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Percent size={16} />
          <span>مؤشرات وتحديات التوفير 📈</span>
        </button>
      </div>
    </div>
  );

  if (activeTab === 'goals') {
    return (
      <div className="space-y-6">
        {renderTabSwitcher()}
        <GoalsPage />
      </div>
    );
  }

  if (activeTab === 'indicators') {
    return (
      <div className="space-y-6">
        {renderTabSwitcher()}
        <SavingsIndicators />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 pb-32 w-full max-w-full"
    >
      <PageHeader 
        title="الادخار والأهداف المالية"
        subtitle="حاسبة الفائض، توزيع الادخار، وحصالة الواقع المادية"
      />

      {renderTabSwitcher()}

      <SavingsSummary 
        potentialSavings={potentialSavings}
        savingsPercentage={savingsPercentage}
        setSavingsPercentage={setSavingsPercentage}
        currency={currency}
        itemVariants={itemVariants}
      />

      <BabySavingsTracker 
        setIsBabyModalOpen={setIsBabyModalOpen}
        itemVariants={itemVariants}
      />

      <AutoRoundUpsWidget 
        itemVariants={itemVariants}
      />

      <PhysicalPiggyBank 
        itemVariants={itemVariants}
      />

      <SavingsPieChart 
        pieData={pieData}
        currency={currency}
        itemVariants={itemVariants}
      />

      <SavingsGoalAllocations 
        standardGoals={standardGoals}
        customAllocations={customAllocations}
        savingsPercentage={savingsPercentage}
        currency={currency}
        categories={categories}
        getSuggestedAllocation={getSuggestedAllocation}
        getEffectiveAllocation={getEffectiveAllocation}
        calculateSurplus={calculateSurplus}
        handleCustomAllocationChange={handleCustomAllocationChange}
        handleAllocateAll={handleAllocateAll}
        handleAllocateSingle={handleAllocateSingle}
      />

      <BabySavingTargetModal 
        isOpen={isBabyModalOpen} 
        onClose={() => setIsBabyModalOpen(false)} 
      />
    </motion.div>
  );
};

export default SavingsPage;
