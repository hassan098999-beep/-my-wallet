import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { parseISO, differenceInDays } from 'date-fns';
import { Target, Trophy, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

import { useAppContext } from '../store/AppContext';
import { formatCurrency, getBudgetRange, getBudgetMonth, cn } from '../utils';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

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

  // Overall Goal Metrics
  const { totalTarget, totalSaved, totalPercentage, smartInsight } = useMemo(() => {
    const target = standardGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const saved = standardGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const percentage = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

    if (standardGoals.length === 0) {
      return {
        totalTarget: 0,
        totalSaved: 0,
        totalPercentage: 0,
        smartInsight: {
          type: 'neutral' as const,
          text: 'لم تقم بتسجيل أي هدف بعد. ابدأ بإضافة هدف مالي لتنظيم وتوجيه مدخراتك.',
        }
      };
    }

    if (percentage >= 100) {
      return {
        totalTarget: target,
        totalSaved: saved,
        totalPercentage: percentage,
        smartInsight: {
          type: 'success' as const,
          text: '🎉 جميع أهدافك الادخارية مكتملة بنسبة 100%! إنجاز مالي رائع للأسرة.',
        }
      };
    }

    const incompleteGoals = standardGoals.filter(g => g.currentAmount < g.targetAmount);

    // Check for critical / urgent goals with close or passed deadlines
    const now = new Date();
    const urgentGoal = incompleteGoals
      .map(g => {
        const d = parseISO(g.deadline);
        const days = differenceInDays(d, now);
        const remainingAmount = g.targetAmount - g.currentAmount;
        const goalPercent = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) : 0;
        return { goal: g, days, remainingAmount, goalPercent };
      })
      .find(item => item.days <= 30 && item.goalPercent < 0.8);

    if (urgentGoal) {
      if (urgentGoal.days < 0) {
        return {
          totalTarget: target,
          totalSaved: saved,
          totalPercentage: percentage,
          smartInsight: {
            type: 'warning' as const,
            text: `⏳ هدف "${urgentGoal.goal.name}" تجاوز موعده المحدد ويحتاج ${formatCurrency(urgentGoal.remainingAmount, currency)} لاكتماله.`,
          }
        };
      }
      return {
        totalTarget: target,
        totalSaved: saved,
        totalPercentage: percentage,
        smartInsight: {
          type: 'warning' as const,
          text: `⚠️ هدف "${urgentGoal.goal.name}" متبقي له ${urgentGoal.days} يوم فقط ويحتاج ${formatCurrency(urgentGoal.remainingAmount, currency)} لبلوغ المستهدف.`,
        }
      };
    }

    // Find the goal closest to completion
    const closestGoal = [...incompleteGoals].sort((a, b) => {
      const remA = a.targetAmount - a.currentAmount;
      const remB = b.targetAmount - b.currentAmount;
      return remA - remB;
    })[0];

    if (closestGoal) {
      const rem = closestGoal.targetAmount - closestGoal.currentAmount;
      return {
        totalTarget: target,
        totalSaved: saved,
        totalPercentage: percentage,
        smartInsight: {
          type: 'highlight' as const,
          text: `🎯 أنت قريب جداً من إتمام هدف "${closestGoal.name}"! تحتاج ${formatCurrency(rem, currency)} فقط لإكماله.`,
        }
      };
    }

    return {
      totalTarget: target,
      totalSaved: saved,
      totalPercentage: percentage,
      smartInsight: {
        type: 'highlight' as const,
        text: `💡 داوم على توفير فائض الميزانية شهرياً للوصول إلى كامل مستهدفاتك بسلاسة.`,
      }
    };
  }, [standardGoals, currency]);

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

      {/* Unified Intelligent Savings Summary Card */}
      {standardGoals.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl relative overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Primary Highlights */}
              <div className="lg:col-span-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 shrink-0">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">إجمالي المدخرات المحققة</p>
                      <p className="text-2xl md:text-3xl font-black text-emerald-500 tracking-tight font-mono">
                        {formatCurrency(totalSaved, currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-left sm:text-right">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">إجمالي المستهدف</p>
                      <p className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-200 font-mono">
                        {formatCurrency(totalTarget, currency)}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">المتبقي للإنجاز</p>
                      <p className="text-lg md:text-xl font-bold text-primary-500 font-mono">
                        {formatCurrency(Math.max(0, totalTarget - totalSaved), currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">نسبة التقدم الإجمالي</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{totalPercentage}%</span>
                  </div>
                  <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${totalPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        totalPercentage >= 100 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                          : "bg-gradient-to-r from-primary-500 via-indigo-500 to-emerald-500"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Status Pill & Counter */}
              <div className="lg:col-span-4 flex flex-col justify-center items-center lg:items-end lg:border-r border-slate-100 dark:border-slate-800 lg:pr-6 space-y-2">
                <span className="text-[11px] font-bold text-slate-400">عدد الأهداف النشطة</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-mono">
                    {standardGoals.filter(g => g.currentAmount >= g.targetAmount).length}
                  </span>
                  <span className="text-slate-400 font-bold text-sm">/ {standardGoals.length} مكتملة</span>
                </div>
              </div>

            </div>

            {/* Smart Insight Line */}
            <div className={cn(
              "mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5 text-xs font-bold",
              smartInsight.type === 'success' 
                ? "text-emerald-600 dark:text-emerald-400"
                : smartInsight.type === 'warning'
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-700 dark:text-slate-300"
            )}>
              {smartInsight.type === 'success' && <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />}
              {smartInsight.type === 'warning' && <AlertCircle size={16} className="shrink-0 text-amber-500" />}
              {smartInsight.type === 'highlight' && <Sparkles size={16} className="shrink-0 text-primary-500" />}
              {smartInsight.type === 'neutral' && <Target size={16} className="shrink-0 text-slate-400" />}
              <span>{smartInsight.text}</span>
            </div>
          </Card>
        </motion.div>
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
