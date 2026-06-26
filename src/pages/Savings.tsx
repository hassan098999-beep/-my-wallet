import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth, cn } from '../utils';
import { parseISO } from 'date-fns';
import { Skeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyBank, Target, ArrowRight, TrendingUp, Percent, Sparkles, Link as LinkIcon, Baby, CalendarDays, Coins, HeartPulse, Activity, Check, Plus, X, Info, Wallet, Trash } from 'lucide-react';
import { Goal } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import BabySavingTargetModal from '../components/BabySavingTargetModal';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const SavingsPage = () => {
  const { 
    income, 
    expenses, 
    goals, 
    updateGoal, 
    currency, 
    budget, 
    categories, 
    firstDayOfMonth, 
    addIncome, 
    addExpense, 
    addGoal, 
    accounts, 
    autoRoundUpSetting 
  } = useAppContext();

  const standardGoals = useMemo(() => (goals || []).filter(g => !g.isPhysicalPiggyBank), [goals]);

  const [savingsPercentage, setSavingsPercentage] = useState(10);
  const [customAllocations, setCustomAllocations] = useState<Record<string, number | string>>({});
  const [isBabyModalOpen, setIsBabyModalOpen] = useState(false);

  // States for Physical Piggy Bank (حصالة الواقع)
  const [fakkaPrecision, setFakkaPrecision] = useState<'decimals' | 'nearest5' | 'nearest10'>('decimals');
  const [selectedSweepAccounts, setSelectedSweepAccounts] = useState<Record<string, boolean>>({ cash: true, bank: false });
  const [sweepSuccessMessage, setSweepSuccessMessage] = useState<{ amount: number; accountName: string; date: string } | null>(null);
  const [isSweeping, setIsSweeping] = useState(false);

  // Standalone piggy bank manual deposit and reset states
  const [isManualDepositOpen, setIsManualDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSource, setDepositSource] = useState<'account' | 'external'>('account');
  const [selectedDepositAccountId, setSelectedDepositAccountId] = useState('cash');
  const [depositNote, setDepositNote] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Find or determine the physical piggy bank goal
  const physicalGoal = useMemo(() => {
    return (goals || []).find(g => 
      g.isPhysicalPiggyBank === true || 
      g.name.includes('حصالة الواقع') || 
      g.name.includes('الحصالة الفعلية')
    );
  }, [goals]);

  // Filter history of deposits/sweeps for this specific piggy bank
  const piggyBankHistory = useMemo(() => {
    if (!physicalGoal) return [];
    return (expenses || [])
      .filter(e => e.goalId === physicalGoal.id)
      .slice(0, 5);
  }, [expenses, physicalGoal]);

  // Handler for manual piggy bank deposit
  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!physicalGoal) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح للضخ');
      return;
    }

    hapticFeedback('success');
    setIsSweeping(true);

    try {
      const selectedAcc = depositSource === 'account' ? accounts.find(a => a.id === selectedDepositAccountId) : null;
      
      if (depositSource === 'account' && selectedAcc && selectedAcc.balance < amount) {
        toast.error('رصيد الحساب غير كافٍ للضخ');
        setIsSweeping(false);
        return;
      }

      await addExpense({
        amount: amount,
        categoryId: categories.find(c => c.type === 'saving')?.id || categories[0]?.id || 'saving',
        accountId: depositSource === 'account' ? selectedDepositAccountId : undefined,
        goalId: physicalGoal.id,
        date: new Date().toISOString().split('T')[0],
        note: depositNote.trim() || (depositSource === 'account' ? `ضخ يدوِي من حساب ${selectedAcc?.name}` : 'ضخ يدوي خارجي مستقل 🪙'),
        paymentMethod: depositSource === 'account' ? (selectedDepositAccountId === 'cash' ? 'cash' : 'card') : 'cash'
      });

      toast.success(
        <div className="flex flex-col gap-1 text-right" dir="rtl">
          <span className="font-bold">تم ضخ الأموال بنجاح! 🪙🎉</span>
          <span className="text-xs">
            {depositSource === 'account' 
              ? `تم الخصم رقمياً من حساب "${selectedAcc?.name}". اسحب الآن ${formatCurrency(amount, currency)} نقداً وضعها في حصالتك المادية!`
              : `تم تسجيل إدخال مالي خارجي بقيمة ${formatCurrency(amount, currency)}. ضع المبلغ الآن في حصالتك المادية!`}
          </span>
        </div>,
        { duration: 5500 }
      );

      setDepositAmount('');
      setDepositNote('');
      setIsManualDepositOpen(false);
    } catch (err) {
      toast.error('فشل ضخ الأموال في الحصالة');
    } finally {
      setIsSweeping(false);
    }
  };

  // Handler for resetting piggy bank
  const handleResetPiggyBank = async () => {
    if (!physicalGoal) return;
    hapticFeedback('warning');
    try {
      await updateGoal(physicalGoal.id, { currentAmount: 0 });
      toast.success(
        <div className="flex flex-col gap-1 text-right" dir="rtl">
          <span className="font-bold">تم تفريغ (كسر) الحصالة بنجاح! 🔨💰</span>
          <span className="text-xs">تم تصفير الرصيد رقمياً بالتطبيق، يمكنك الآن الاستمتاع بمدخراتك المادية في الواقع! 🎉</span>
        </div>
      );
      setShowResetConfirm(false);
    } catch (err) {
      toast.error('فشل تفريغ الحصالة');
    }
  };

  // Helper to calculate "fakka" based on mode
  const calculateFakka = (balance: number, mode: 'decimals' | 'nearest5' | 'nearest10'): number => {
    if (balance <= 0) return 0;
    if (mode === 'decimals') {
      const remainder = balance - Math.floor(balance);
      return Number(remainder.toFixed(3));
    } else if (mode === 'nearest5') {
      const remainder = balance % 5;
      return Number(remainder.toFixed(3));
    } else { // 'nearest10'
      const remainder = balance % 10;
      return Number(remainder.toFixed(3));
    }
  };

  // Create Physical Goal automatically if it doesn't exist
  const handleCreatePhysicalGoal = async () => {
    hapticFeedback('success');
    try {
      await addGoal({
        name: 'حصالة الواقع الفعلية 🪙',
        targetAmount: 500, // target is 500 TND as standard
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(), // December 31 of current year
        isPhysicalPiggyBank: true
      });
      toast.success('تم إنشاء حصالة الواقع الفعلية بنجاح! 🪙');
    } catch (err) {
      toast.error('حدث خطأ أثناء إنشاء الحصالة');
    }
  };

  // Perform the sweep action
  const handleSweepAccount = async (accountId: string, amount: number) => {
    if (amount <= 0) return;
    
    let activePhysicalGoal = physicalGoal;
    
    // Auto-create physical goal if it does not exist
    if (!activePhysicalGoal) {
      hapticFeedback('light');
      const confirmCreate = window.confirm('لم يتم العثور على حصالة واقع مخصصة. هل تريد إنشاء "حصالة الواقع الفعلية 🪙" تلقائياً لحفظ هذه المبالغ؟');
      if (!confirmCreate) return;
      
      const newGoalId = crypto.randomUUID();
      const newGoal: Goal = {
        id: newGoalId,
        name: 'حصالة الواقع الفعلية 🪙',
        targetAmount: 500,
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        createdAt: new Date().toISOString(),
        isPhysicalPiggyBank: true
      };
      
      try {
        await addGoal(newGoal);
        activePhysicalGoal = newGoal;
      } catch (err) {
        toast.error('حدث خطأ أثناء إنشاء الحصالة');
        return;
      }
    }

    setIsSweeping(true);
    hapticFeedback('success');

    const account = accounts.find(a => a.id === accountId);
    const accountName = account ? account.name : 'الحساب المالي';

    // Find saving category
    const savingCategory = categories.find(c => c.type === 'saving') || 
                          categories.find(c => c.name.includes('ادخار')) || 
                          categories[0];

    try {
      // 1. Add expense entry to deduct money from the account
      await addExpense({
        amount: amount,
        categoryId: savingCategory.id,
        accountId: accountId,
        goalId: activePhysicalGoal.id,
        date: new Date().toISOString().split('T')[0],
        note: `تفريغ الفكة اليومية لحصالة الواقع (${accountName}) 🪙`,
        paymentMethod: accountId === 'bank' ? 'card' : 'cash',
        isTransfer: true
      });

      setSweepSuccessMessage({
        amount: amount,
        accountName: accountName,
        date: new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })
      });
      
      toast.success(`تم تفريغ الفكة بقيمة ${formatCurrency(amount, currency)} بنجاح! 🎉`);
    } catch (err) {
      console.error(err);
      toast.error('فشلت عملية تفريغ الفكة');
    } finally {
      setIsSweeping(false);
    }
  };

  const handleSweepSelected = async () => {
    let activePhysicalGoal = physicalGoal;
    
    // Check if any change exists
    const accountsToSweep = accounts.filter(acc => selectedSweepAccounts[acc.id] && calculateFakka(acc.balance, fakkaPrecision) > 0);
    if (accountsToSweep.length === 0) {
      toast.error('لا توجد فكة متبقية في الحسابات المحددة لتفريغها!');
      return;
    }

    if (!activePhysicalGoal) {
      hapticFeedback('light');
      const confirmCreate = window.confirm('لم يتم العثور على حصالة واقع مخصصة. هل تريد إنشاء "حصالة الواقع الفعلية 🪙" تلقائياً لحفظ هذه المبالغ؟');
      if (!confirmCreate) return;
      
      const newGoalId = crypto.randomUUID();
      const newGoal: Goal = {
        id: newGoalId,
        name: 'حصالة الواقع الفعلية 🪙',
        targetAmount: 500,
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        createdAt: new Date().toISOString(),
        isPhysicalPiggyBank: true
      };
      
      try {
        await addGoal(newGoal);
        activePhysicalGoal = newGoal;
      } catch (err) {
        toast.error('حدث خطأ أثناء إنشاء الحصالة');
        return;
      }
    }

    setIsSweeping(true);
    hapticFeedback('success');

    const savingCategory = categories.find(c => c.type === 'saving') || 
                          categories.find(c => c.name.includes('ادخار')) || 
                          categories[0];

    let totalSwept = 0;
    try {
      for (const acc of accountsToSweep) {
        const amount = calculateFakka(acc.balance, fakkaPrecision);
        await addExpense({
          amount: amount,
          categoryId: savingCategory.id,
          accountId: acc.id,
          goalId: activePhysicalGoal.id,
          date: new Date().toISOString().split('T')[0],
          note: `تفريغ الفكة اليومية لحصالة الواقع (${acc.name}) 🪙`,
          paymentMethod: acc.id === 'bank' ? 'card' : 'cash',
          isTransfer: true
        });

        totalSwept += amount;
      }

      setSweepSuccessMessage({
        amount: totalSwept,
        accountName: accountsToSweep.map(a => a.name).join(' و '),
        date: new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })
      });
      
      toast.success(`تم تفريغ الفكة الكلية بقيمة ${formatCurrency(totalSwept, currency)} بنجاح! 🎉`);
    } catch (err) {
      console.error(err);
      toast.error('فشلت العملية المتعددة');
    } finally {
      setIsSweeping(false);
    }
  };

  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  // Find the 'Baby Health & Emergency' goal if it exists
  const babyGoal = useMemo(() => {
    return (goals || []).find(g => 
      g.name.toLowerCase().includes('baby health') || 
      g.name.includes('طوارئ وصحة الرضيع') || 
      g.name.includes('الرضيع والصحة') ||
      g.name.includes('صندوق طوارئ وصحة الرضيع')
    );
  }, [goals]);

  const babyMonthlyTarget = babyGoal?.monthlySavingsTarget || 50;

  // Calculate monthly contributions specifically for this goal
  const monthlyBabyContribution = useMemo(() => {
    if (!babyGoal) return 0;
    return income
      .filter(i => i.goalId === babyGoal.id && i.date && parseISO(i.date) >= monthStart && parseISO(i.date) <= monthEnd)
      .reduce((sum, i) => sum + i.amount, 0);
  }, [income, babyGoal, monthStart, monthEnd]);

  const handleQuickContributeBaby = async () => {
    if (!babyGoal) return;
    const amountToSave = babyGoal.monthlySavingsTarget || 50;
    hapticFeedback('success');
    
    // Add real transaction stream
    await addIncome({
      source: `ادخار شهري: طوارئ وصحة الرضيع`,
      amount: amountToSave,
      goalId: babyGoal.id,
      accountId: accounts[0]?.id || 'cash',
      date: new Date().toISOString().split('T')[0],
    });
    
    // Update goal balance directly
    await updateGoal(babyGoal.id, {
      currentAmount: babyGoal.currentAmount + amountToSave
    });
    
    toast.success(`تم تحويل ${formatCurrency(amountToSave, currency)} بنجاح لحصالة طوارئ البيبي! 👶🍼`);
  };

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
    // For unlinked goals, distribute the overall calculated savings equally
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 pb-32 w-full max-w-full"
    >
      <PageHeader
        title="تخصيص الادخار"
        subtitle="احسب ووزع مدخراتك تلقائياً وبأمان على أهدافك المالية والأسئلة العائلية"
      />

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

        {/* Baby Savings Goal Tracker Section */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 border border-indigo-100 dark:border-indigo-950/40 rounded-3xl bg-gradient-to-br from-indigo-50/20 via-white to-cyan-50/10 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/30 p-5 md:p-6 shadow-sm overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -ml-6 -mt-6 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-8 -mb-8 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/10 shrink-0">
                <Baby size={22} className="shrink-0" />
              </div>
              <div className="text-right">
                <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  توفير الرضيع والصحة 👶
                  <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[8px] font-black px-1.5 py-0.5 rounded-full">خاص بالعائلة</span>
                </h3>
                <p className="text-[9px] text-slate-400 font-bold">صندوق الأمان ووقاية الرضيع من التكاليف الطبية واللوازم العاجلة</p>
              </div>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { hapticFeedback('light'); setIsBabyModalOpen(true); }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-[10px] md:text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-all shadow-md shadow-indigo-500/10"
              >
                <span>ضبط الهدف والمبلغ الشهري</span>
              </motion.button>
            </div>
          </div>

          {!babyGoal ? (
            <div className="p-6 bg-slate-50/80 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 relative z-10">
              <p className="text-xs font-black text-slate-600 dark:text-slate-400">صندوق طوارئ وصحة الرضيع (Baby Health & Emergency) غير مفعّل حالياً في الأهداف.</p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto font-medium">تنشيط هذا الهدف يساعدك في جدولة ادخار ثابت لتأمين حفاظات وحليب الرضيع، وتكلفة فيزيتا طبيب الأطفال والتلاقيح دون أعباء مفاجئة.</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { hapticFeedback('medium'); setIsBabyModalOpen(true); }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black text-[10px] md:text-xs rounded-xl shadow-md inline-flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>تنشيط صندوق الرضيع الآن 🍼</span>
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10" dir="rtl">
              {/* Monthly Savings Target Tracker */}
              <div className="p-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <CalendarDays size={13} />
                      تتبع الادخار الشهري للرضيع
                    </span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {Math.min(100, Math.round((monthlyBabyContribution / babyMonthlyTarget) * 100))}%
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold mb-3">مستهدف التوفير لهذا الشهر لعلاج البيبي ومستلزماته وعيشه السليم</p>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (monthlyBabyContribution / babyMonthlyTarget) * 100)}%` }}
                      className="h-full bg-gradient-to-l from-indigo-500 to-indigo-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">المُدخر هذا الشهر</p>
                    <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-none font-mono">
                      {formatCurrency(monthlyBabyContribution, currency)} <span className="text-xs text-slate-400 font-bold">/ {formatCurrency(babyMonthlyTarget, currency)}</span>
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleQuickContributeBaby}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-black text-[10px] flex items-center gap-1 transition-all border border-indigo-100/30"
                  >
                    <Coins size={12} />
                    <span>ادخار سريع (+{formatCurrency(babyMonthlyTarget, currency)})</span>
                  </motion.button>
                </div>
              </div>

              {/* Overall Cushion Target Tracker */}
              <div className="p-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                      <HeartPulse size={13} />
                      رصيد الأمان التراكمي الإجمالي
                    </span>
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-mono">
                      {Math.min(100, Math.round((babyGoal.currentAmount / babyGoal.targetAmount) * 100))}%
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold mb-3">الحصالة التراكمية الكلية لحماية صحة طفلك الرضيع ضد الأزمات</p>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (babyGoal.currentAmount / babyGoal.targetAmount) * 100)}%` }}
                      className="h-full bg-gradient-to-l from-cyan-500 to-cyan-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">الرصيد التراكمي حالياً</p>
                  <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-none font-mono">
                    {formatCurrency(babyGoal.currentAmount, currency)} <span className="text-xs text-slate-400 font-bold">/ {formatCurrency(babyGoal.targetAmount, currency)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Auto Round-ups Widget */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 border border-teal-100 dark:border-teal-950/40 rounded-3xl bg-gradient-to-br from-teal-50/20 via-white to-emerald-50/10 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/30 p-5 md:p-6 shadow-sm overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl -ml-6 -mt-6 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-8 -mb-8 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/10 shrink-0">
                <Coins size={22} className="shrink-0" />
              </div>
              <div className="text-right">
                <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  حصالة التوفير وفكة المعاملات الكلية 🪙
                  <Badge variant={autoRoundUpSetting?.enabled ? 'success' : 'info'} className="text-[8px] font-black">
                    {autoRoundUpSetting?.enabled ? 'مفعّلة ونشطة' : 'غير نشطة'}
                  </Badge>
                </h3>
                <p className="text-[9px] text-slate-400 font-bold">تقريب النفقات تلقائياً لأقرب {autoRoundUpSetting?.multiplier || 1} د.ت وتحويل الفارق لحصالة الأهداف</p>
              </div>
            </div>

            <Link
              to="/settings"
              onClick={() => hapticFeedback('light')}
              className="px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 font-black text-[10px] md:text-xs hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all border border-teal-100/30 shrink-0"
            >
              <span>إدارة الخدمة والتحكم الذكي ⚙️</span>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10" dir="rtl">
            <div className="p-3 bg-white/75 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-bold">الحصالة المستهدفة</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1 truncate">
                {goals.find(g => g.id === autoRoundUpSetting?.targetGoalId)?.name || 'لم تحدد حصالة بعد'}
              </p>
            </div>
            
            <div className="p-3 bg-white/75 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-bold">قوة التقريب المعتمدة</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1">
                أقرب {autoRoundUpSetting?.multiplier || 1} {currency}
              </p>
            </div>

            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl">
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">إجمالي التوفير التلقائي (التاريخي)</p>
              <p className="text-xs font-sans font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(
                  expenses
                    .filter(e => e.isTransfer && (e.note || '').includes('حصالة التوفير التلقائي'))
                    .reduce((sum, e) => sum + e.amount, 0),
                  currency
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Real-world Physical Piggy Bank (حصالة الواقع الملموسة المستقلة) */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 border border-amber-100 dark:border-amber-950/40 rounded-3xl bg-gradient-to-br from-amber-50/20 via-white to-orange-50/10 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/30 p-5 md:p-6 shadow-sm overflow-hidden relative animate-fade-in"
        >
          <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -ml-6 -mt-6 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-8 -mb-8 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/10 shrink-0">
                <PiggyBank size={24} className="shrink-0" />
              </div>
              <div className="text-right">
                <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  حصالة الواقع الملموسة المستقلة 🪙🏡
                  {physicalGoal && (
                    <Badge variant="success" className="text-[8px] font-black">
                      تراكمية مفتوحة
                    </Badge>
                  )}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold">تطابق الرصيد الرقمي بطرح الفكة المتبقية يدوياً ونقلها للحصالة الفعلية في غرفتك</p>
              </div>
            </div>

            {physicalGoal && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetConfirm(!showResetConfirm)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/25 text-rose-500 transition-all cursor-pointer"
                  title="تفريغ وتصفير الحصالة"
                >
                  <Trash size={14} />
                </button>
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100/30 text-[10px] md:text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
                  رصيد الحصالة بالتطبيق: <span className="font-mono">{formatCurrency(physicalGoal.currentAmount, currency)}</span>
                </div>
              </div>
            )}
          </div>

          {!physicalGoal ? (
            <div className="mt-5 p-5 bg-amber-50/50 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-900/50 rounded-2xl text-center relative z-10" dir="rtl">
              <Sparkles size={28} className="mx-auto text-amber-500 mb-2 animate-pulse" />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ابدأ تحدي حصالة الواقع الملموسة! 🪙</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-md mx-auto">
                الحصالة الآن مستقلة تماماً ومفتوحة بدون سقف أهداف محدد! قم بإنشائها لتجميع مدخراتك المادية يدوياً وتفريغ الفكة اليومية.
              </p>
              <button
                onClick={handleCreatePhysicalGoal}
                className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md shadow-amber-500/10 hover:opacity-90 transition-all flex items-center gap-1.5 mx-auto"
              >
                <Plus size={16} />
                <span>إنشاء وتفعيل حصالة الواقع الآن</span>
              </button>
            </div>
          ) : (
            <div className="mt-5 relative z-10 space-y-4" dir="rtl">
              {/* Reset Confirmation Overlay */}
              <AnimatePresence>
                {showResetConfirm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 z-35 flex flex-col justify-center items-center p-4 text-center rounded-2xl"
                  >
                    <span className="text-3xl">🔨🪙</span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2">تفريغ وكسر الحصالة؟</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs font-bold leading-normal">
                      هل تريد تصفير رصيد الحصالة بالتطبيق؟ هذا الإجراء لا يمس حساباتك الرقمية الأخرى ويجعل الحصالة جاهزة للتجميع من جديد.
                    </p>
                    <div className="flex gap-2.5 mt-4">
                      <button
                        onClick={handleResetPiggyBank}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded-lg cursor-pointer"
                      >
                        نعم، تفريغ وتصفير 🔨
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] rounded-lg cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sweep success feedback instructions */}
              {sweepSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl text-slate-800 dark:text-slate-200 relative"
                >
                  <button 
                    onClick={() => setSweepSuccessMessage(null)}
                    className="absolute top-3 left-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                      <Check size={18} />
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">تم تحديث الأرصدة الرقمية بالتطبيق! 🎉</p>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">
                        توجيه الغرفة الهام 🏡:
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 leading-relaxed">
                        قم الآن فوراً بسحب <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-xs">{formatCurrency(sweepSuccessMessage.amount, currency)}</span> نقداً من محفظة جيبك الحقيقية وضعها ملموسة بيدك داخل حصالتك الفعلية في الغرفة!
                      </p>
                      <span className="text-[8px] text-slate-400 font-mono mt-1 block">توقيت الحركة: {sweepSuccessMessage.date}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Interactive Manual Deposit Form Button & Form */}
              <div className="border-t border-slate-100 dark:border-slate-800/40 pt-1">
                <button
                  onClick={() => { setIsManualDepositOpen(!isManualDepositOpen); hapticFeedback('light'); }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900/25 hover:bg-slate-50 dark:hover:bg-slate-900/45 transition-all cursor-pointer"
                >
                  <Coins size={14} className="text-amber-500" />
                  <span>{isManualDepositOpen ? 'إغلاق نافذة الإيداع' : 'ضخ ودفع مبالغ يدوية 💰➕'}</span>
                </button>

                <AnimatePresence>
                  {isManualDepositOpen && (
                    <motion.form
                      onSubmit={handleManualDeposit}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3 space-y-3 pt-2 text-right"
                    >
                      {/* Source selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 block">مصدر الأموال المدفوعة يدوياً:</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100/60 dark:bg-slate-950 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setDepositSource('account')}
                            className={cn(
                              "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                              depositSource === 'account' ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
                            )}
                          >
                            خصم من حسابي بالتطبيق
                          </button>
                          <button
                            type="button"
                            onClick={() => setDepositSource('external')}
                            className={cn(
                              "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                              depositSource === 'external' ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
                            )}
                          >
                            مال خارجي (نقدي إضافي)
                          </button>
                        </div>
                      </div>

                      {/* Account select (if source is account) */}
                      {depositSource === 'account' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 block">اختر الحساب الرقمي للخصم:</label>
                          <select
                            value={selectedDepositAccountId}
                            onChange={(e) => setSelectedDepositAccountId(e.target.value)}
                            className="w-full p-2 text-xs font-black bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                          >
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({formatCurrency(acc.balance, currency)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Amount & Tunisian quick buttons */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 block">قيمة المبلغ المراد ضخه:</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="0.000"
                            className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-left font-mono font-black text-sm outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                          <span className="absolute left-4 top-2.5 font-mono text-xs text-slate-400">{currency}</span>
                        </div>

                        {/* Quick Tunisian buttons (+1, +5, +10, +20 TND) */}
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 5, 10, 20].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                const current = parseFloat(depositAmount) || 0;
                                setDepositAmount((current + val).toString());
                                hapticFeedback('light');
                              }}
                              className="py-1 bg-slate-100 dark:bg-slate-950 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 text-[10px] font-bold rounded-lg transition-all border border-transparent hover:border-amber-200 cursor-pointer"
                            >
                              +{val} د.ت
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note */}
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={depositNote}
                          onChange={(e) => setDepositNote(e.target.value)}
                          placeholder="ملاحظة اختيارية (مثال: توفير قهوة اليوم ☕)"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSweeping || !depositAmount}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/10 hover:opacity-95 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Check size={14} />
                        <span>ضخ الأموال الآن في الحصالة 🪙</span>
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Rounding precision controls */}
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                <p className="text-[9px] text-slate-400 font-bold">اختر قوة إفراغ وتفريغ الفكة المفضلة:</p>
                <div className="grid grid-cols-3 gap-2 bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-xl">
                  <button
                    onClick={() => { setFakkaPrecision('decimals'); hapticFeedback('light'); }}
                    className={`py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${fakkaPrecision === 'decimals' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    الكسور والمليمات (فقط)
                  </button>
                  <button
                    onClick={() => { setFakkaPrecision('nearest5'); hapticFeedback('light'); }}
                    className={`py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${fakkaPrecision === 'nearest5' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    أقرب 5 د.ت
                  </button>
                  <button
                    onClick={() => { setFakkaPrecision('nearest10'); hapticFeedback('light'); }}
                    className={`py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${fakkaPrecision === 'nearest10' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    أقرب 10 د.ت
                  </button>
                </div>
              </div>

              {/* Accounts list with calculated change */}
              <div className="space-y-2.5">
                {accounts.map(acc => {
                  const fakka = calculateFakka(acc.balance, fakkaPrecision);
                  const isSelected = selectedSweepAccounts[acc.id] || false;
                  
                  return (
                    <div 
                      key={acc.id} 
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${fakka > 0 ? 'bg-white/75 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/60' : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100/40 dark:border-slate-800/20 opacity-70'}`}
                    >
                      <div className="flex items-center gap-3">
                        {fakka > 0 && (
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => setSelectedSweepAccounts(prev => ({ ...prev, [acc.id]: e.target.checked }))}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          />
                        )}
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: acc.color }}>
                          <Wallet size={16} />
                        </div>
                        <div className="text-right">
                          <h4 className="text-xs font-black text-slate-700 dark:text-slate-200">{acc.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">الرصيد: {formatCurrency(acc.balance, currency)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <p className="text-[9px] text-slate-400 font-bold">الفكة المتبقية</p>
                          <p className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                            {fakka > 0 ? `+ ${formatCurrency(fakka, currency)}` : '0.000'}
                          </p>
                        </div>

                        {fakka > 0 ? (
                          <button
                            disabled={isSweeping}
                            onClick={() => handleSweepAccount(acc.id, fakka)}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-black text-[10px] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all border border-amber-100/20 cursor-pointer"
                          >
                            تفريغ الفردي 🪙
                          </button>
                        ) : (
                          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black text-[9px]">
                            نظيف ✨
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Master sweep action */}
              <button
                disabled={isSweeping || accounts.filter(acc => selectedSweepAccounts[acc.id] && calculateFakka(acc.balance, fakkaPrecision) > 0).length === 0}
                onClick={handleSweepSelected}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md shadow-amber-500/10 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Coins size={16} />
                <span>تفريغ الفكة المحددة دفعة واحدة 🚀</span>
              </button>

              {/* History Ledger specifically for this piggy bank */}
              {piggyBankHistory.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-right">
                  <span className="text-[10px] font-black text-slate-400 block mb-1">سجل الحركات الأخيرة للحصالة 📜</span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {piggyBankHistory.map((hist) => (
                      <div key={hist.id} className="flex justify-between items-center bg-slate-100/30 dark:bg-slate-950/20 p-2 rounded-lg text-[10px]">
                        <div className="text-right">
                          <span className="font-black text-slate-700 dark:text-slate-300 block">{hist.note}</span>
                          <span className="text-[8px] text-slate-400">{hist.date}</span>
                        </div>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                          + {formatCurrency(hist.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Target Allocation Visual Breakdown */}
        {pieData.length > 0 && (
          <motion.div 
            variants={itemVariants}
            className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shadow-sm mt-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
                <Target size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">تحليل حصة الأهداف</h2>
                <p className="text-[10px] text-slate-400 font-bold">نسبة كل هدف من إجمالي المبالغ الادخارية المتراكمة</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="w-full lg:w-1/2 h-44 md:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="55%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value, currency), 'المدخرات']} 
                      contentStyle={{ borderRadius: '1rem', background: '#1e293b', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full lg:w-1/2 grid grid-cols-2 gap-3">
                {pieData.map((item, index) => {
                  const totalCalculated = pieData.reduce((sum, item) => sum + item.value, 0);
                  const percent = totalCalculated > 0 ? ((item.value / totalCalculated) * 100).toFixed(0) : 0;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-300 truncate leading-none mb-1">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-400">
                          {percent}% ({formatCurrency(item.value, currency)})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-md shadow-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="space-y-1 md:space-y-2 text-center">
              <p className="text-emerald-100 font-bold text-[8px] md:text-[10px] uppercase tracking-widest">إجمالي التخصيص المقترح</p>
              <p className="text-2xl md:text-4xl font-black tracking-tighter">
                {formatCurrency(standardGoals.reduce((sum, g) => sum + getEffectiveAllocation(g), 0), currency)}
              </p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAllocateAll}
              disabled={standardGoals.length === 0 || standardGoals.reduce((sum, g) => sum + getEffectiveAllocation(g), 0) === 0}
              className="w-full md:w-auto bg-white text-emerald-600 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <PiggyBank size={18} /> 
              <span>توزيع على كل الأهداف ({standardGoals.length})</span>
            </motion.button>
          </div>
          
          {standardGoals.length === 0 && (
            <div className="mt-8">
              <EmptyState
                icon={Target}
                title="لا توجد أهداف ادخارية مسجلة حالياً"
                description="أضف أهدافك الادخارية المحددة لتقوم بربط حركة ميزانيتك المباشرة واستخراج الفائض المالي!"
                actionLabel="إنشاء وتحديد هدف ادخاري الآن"
                onAction={() => window.location.hash = '#/goals'}
              />
            </div>
          )}

          {standardGoals.length > 0 && (
            <div className="mt-8 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التخصيص المقترح لكل هدف</p>
              <div className="grid grid-cols-1 gap-4">
                {standardGoals.map(goal => {
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
                              onFocus={(e) => {
                                const currentVal = customAllocations[goal.id] !== undefined ? customAllocations[goal.id] : suggestedAllocation;
                                if (!currentVal || currentVal === 0 || currentVal === '0') {
                                  handleCustomAllocationChange(goal.id, '');
                                } else {
                                  const target = e.target;
                                  setTimeout(() => {
                                    try {
                                      target.setSelectionRange(0, target.value.length);
                                    } catch (err) {
                                      target.select();
                                    }
                                  }, 50);
                                }
                              }}
                              onClick={(e) => {
                                const currentVal = customAllocations[goal.id] !== undefined ? customAllocations[goal.id] : suggestedAllocation;
                                if (!currentVal || currentVal === 0 || currentVal === '0') {
                                  handleCustomAllocationChange(goal.id, '');
                                } else {
                                  const target = e.target as HTMLInputElement;
                                  setTimeout(() => {
                                    try {
                                      target.setSelectionRange(0, target.value.length);
                                    } catch (err) {
                                      target.select();
                                    }
                                  }, 50);
                                }
                              }}
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
      </Card>
    </motion.div>

      {/* Baby Saving Targets Configuration Modal */}
      <BabySavingTargetModal 
        isOpen={isBabyModalOpen} 
        onClose={() => setIsBabyModalOpen(false)} 
      />
    </motion.div>
  );
};

export default SavingsPage;
