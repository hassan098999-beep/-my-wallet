import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyBank, Target, Sliders, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { parseISO } from 'date-fns';

import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth, cn } from '../utils';
import { Goal } from '../types';

import PageHeader from '../components/ui/PageHeader';
import SavingsHeader from '../components/savings/SavingsHeader';
import GoalsGridView from '../components/savings/GoalsGridView';
import CashPiggySection from '../components/savings/CashPiggySection';
import SavingsSimulatorSection from '../components/savings/SavingsSimulatorSection';
import AddGoalModal from '../components/savings/AddGoalModal';
import QuickAllocateModal from '../components/savings/QuickAllocateModal';
import toast from 'react-hot-toast';

export const SavingsPage = () => {
  const { 
    income, 
    expenses, 
    goals, 
    updateGoal, 
    deleteGoal,
    addExpense,
    categories, 
    currency, 
    firstDayOfMonth, 
    accounts
  } = useAppContext();

  // Tab State: 'goals' | 'piggy'
  const [activeTab, setActiveTab] = useState<'goals' | 'piggy'>('goals');

  // Collapsible Simulator state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Modals state
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isQuickAllocateOpen, setIsQuickAllocateOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  // Month date range based on app settings
  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  // Goals separation
  const standardGoals = useMemo(() => (goals || []).filter(g => !g.isPhysicalPiggyBank), [goals]);
  const physicalGoal = useMemo(() => (goals || []).find(g => g.isPhysicalPiggyBank), [goals]);

  // Monthly totals
  const monthlyTotals = useMemo(() => {
    const totalExpense = expenses
      .filter(e => !e.isTransfer && parseISO(e.date) >= monthStart && parseISO(e.date) <= monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalIncome = income
      .filter(i => !i.isTransfer && parseISO(i.date) >= monthStart && parseISO(i.date) <= monthEnd)
      .reduce((sum, i) => sum + i.amount, 0);

    return { totalExpense, totalIncome };
  }, [expenses, income, monthStart, monthEnd]);

  // Key metrics
  const totalSaved = useMemo(() => {
    return (goals || []).reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [goals]);

  const monthlySurplus = Math.max(0, monthlyTotals.totalIncome - monthlyTotals.totalExpense);
  const savingRate = monthlyTotals.totalIncome > 0 
    ? (monthlySurplus / monthlyTotals.totalIncome) * 100 
    : 0;

  const completedGoalsCount = useMemo(() => {
    return standardGoals.filter(g => (g.currentAmount || 0) >= (g.targetAmount || 1)).length;
  }, [standardGoals]);

  // Handle fast contribution to a goal
  const handleContribute = async (goalId: string, amount: number) => {
    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;

    try {
      // Record as saving expense and update goal
      await addExpense({
        amount,
        categoryId: categories.find(c => c.type === 'saving')?.id || categories[0]?.id || 'saving',
        accountId: accounts[0]?.id || 'cash',
        goalId: goalId,
        date: new Date().toISOString().split('T')[0],
        note: `مساهمة ادخارية في هدف: ${targetGoal.name} 🎯`,
        paymentMethod: 'cash'
      });

      await updateGoal(goalId, {
        currentAmount: (targetGoal.currentAmount || 0) + amount
      });

      toast.success(
        <div className="flex flex-col gap-0.5 text-right" dir="rtl">
          <span className="font-bold">تم إيداع {formatCurrency(amount, currency)} بنجاح! 🎯</span>
          <span className="text-[11px] opacity-90">أنت الآن أقرب لتحقيق هدفك: {targetGoal.name}</span>
        </div>
      );
    } catch {
      toast.error('حدث خطأ أثناء الإيداع');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsAddGoalOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      toast.success('تم حذف الهدف بنجاح');
    } catch {
      toast.error('فشل حذف الهدف');
    }
  };

  return (
    <div 
      className="space-y-6 w-full max-w-full p-2 sm:p-4 pb-28 relative"
      dir="rtl"
    >
      {/* Page Header */}
      <PageHeader
        title="منصة الادخار والأهداف المالية"
        subtitle="خطط لأهدافك المستقبلية، وزع الفائض الشهري، وتابع حصالتك النقدية بسهولة"
      />

      {/* Top Executive Master KPI Header */}
      <SavingsHeader
        totalSaved={totalSaved}
        monthlySurplus={monthlySurplus}
        savingRate={savingRate}
        totalGoalsCount={standardGoals.length + (physicalGoal ? 1 : 0)}
        completedGoalsCount={completedGoalsCount}
        currency={currency}
        onOpenAddGoal={() => {
          setGoalToEdit(null);
          setIsAddGoalOpen(true);
        }}
        onOpenQuickAllocate={() => setIsQuickAllocateOpen(true)}
      />

      {/* Collapsible Smart Savings Simulator Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
        <button
          onClick={() => {
            hapticFeedback('light');
            setIsSimulatorOpen(!isSimulatorOpen);
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-right"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sliders size={16} />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                محاكي الترشيد والتوفير الذكي ⚡
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                اكتشف كم يمكنك ادخاره عبر خفض مصاريف القفة أو الترفيه بنسب بسيطة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
            <span className="text-[11px] hidden sm:inline">{isSimulatorOpen ? 'إخفاء المحاكي' : 'فتح المحاكي'}</span>
            {isSimulatorOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        <AnimatePresence>
          {isSimulatorOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-slate-100 dark:border-slate-800 p-4 pt-2 overflow-hidden"
            >
              <SavingsSimulatorSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clean 2-Tab Navigation Switcher */}
      <div className="flex bg-slate-200/70 dark:bg-slate-800/70 p-1 rounded-2xl max-w-lg mx-auto">
        <button
          onClick={() => {
            hapticFeedback('light');
            setActiveTab('goals');
          }}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === 'goals'
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Target size={15} />
          <span>الأهداف الادخارية ({standardGoals.length})</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback('light');
            setActiveTab('piggy');
          }}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === 'piggy'
              ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <PiggyBank size={15} />
          <span>الحصالة النقدية وفكة المعاملات</span>
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <GoalsGridView
              goals={standardGoals}
              categories={categories}
              currency={currency}
              onEditGoal={handleEditGoal}
              onDeleteGoal={handleDeleteGoal}
              onContribute={handleContribute}
              onOpenAddGoal={() => {
                setGoalToEdit(null);
                setIsAddGoalOpen(true);
              }}
            />
          </motion.div>
        )}

        {activeTab === 'piggy' && (
          <motion.div
            key="piggy"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <CashPiggySection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Goal Modal */}
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => {
          setIsAddGoalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
      />

      {/* Quick Allocate Surplus Modal */}
      <QuickAllocateModal
        isOpen={isQuickAllocateOpen}
        onClose={() => setIsQuickAllocateOpen(false)}
        monthlySurplus={monthlySurplus}
      />

    </div>
  );
};

export default SavingsPage;
