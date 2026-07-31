import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { parseISO } from 'date-fns';

import { useAppContext } from '../store/AppContext';
import { formatCurrency, getBudgetRange, getBudgetMonth } from '../utils';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';

// Sub-components extracted for modularity
import GoalSimulator from '../components/goals/GoalSimulator';
import GoalForm from '../components/goals/GoalForm';
import GoalsList from '../components/goals/GoalsList';

const GoalsPage = () => {
  const { 
    goals, 
    addGoal, 
    deleteGoal, 
    updateGoal, 
    currency, 
    expenses, 
    income, 
    categories, 
    budgets, 
    firstDayOfMonth, 
    addIncome, 
    accounts, 
    setIsAddModalOpen, 
    setInitialGoalId 
  } = useAppContext();

  const appCurrentMonth = getBudgetMonth(new Date(), firstDayOfMonth);
  const budget = budgets?.find(b => b.month === appCurrentMonth);
  const standardGoals = useMemo(() => (goals || []).filter(g => !g.isPhysicalPiggyBank), [goals]);

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
      className="space-y-8 w-full max-w-full p-4 pb-32 relative"
    >
      {/* Atmospheric Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          animate={{ 
            x: [0, 30, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]"
        />
      </div>

      <PageHeader
        title="أهداف الادخار"
        subtitle="حدد أهدافك المالية وداوم بذكاء لتتبع تقدمك نحو تحقيقها بسلاسة"
      />

      {/* Goals Summary Stats */}
      {standardGoals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-center group cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">إجمالي المستهدف</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:scale-105 transition-transform font-mono">
              {formatCurrency(standardGoals.reduce((sum, g) => sum + g.targetAmount, 0), currency)}
            </p>
          </motion.div>
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-center group cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">إجمالي المدخرات</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter group-hover:scale-105 transition-transform font-mono">
              {formatCurrency(standardGoals.reduce((sum, g) => sum + g.currentAmount, 0), currency)}
            </p>
          </motion.div>
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-center group cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">نسبة الإنجاز الكلية</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter group-hover:scale-105 transition-transform font-mono">
              {standardGoals.reduce((sum, g) => sum + g.targetAmount, 0) > 0 
                ? Math.round((standardGoals.reduce((sum, g) => sum + g.currentAmount, 0) / standardGoals.reduce((sum, g) => sum + g.targetAmount, 0)) * 100) 
                : 0}%
            </p>
          </motion.div>
        </div>
      )}

      {/* Intelligent Interactive Savings Simulator Card */}
      <GoalSimulator 
        standardGoals={standardGoals}
        currency={currency}
        itemVariants={itemVariants}
      />

      {/* Add Goal Form */}
      <GoalForm 
        addGoal={addGoal}
        categories={categories}
        currency={currency}
        itemVariants={itemVariants}
      />

      {/* Goals List */}
      <GoalsList 
        standardGoals={standardGoals}
        currency={currency}
        expenses={expenses}
        income={income}
        categories={categories}
        budget={budget}
        monthlyTotals={monthlyTotals}
        updateGoal={updateGoal}
        deleteGoal={deleteGoal}
        addIncome={addIncome}
        accounts={accounts}
        setIsAddModalOpen={setIsAddModalOpen}
        setInitialGoalId={setInitialGoalId}
      />
    </motion.div>
  );
};

export default GoalsPage;
