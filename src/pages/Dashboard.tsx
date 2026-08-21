import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth, safeStorage, safeParseISO } from '../utils';
import { format, addDays, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Expense } from '../types';
import { Variants } from 'motion/react';
import { useBehavioralEngine } from '../hooks/useBehavioralEngine';
import { useBudgetStatus } from '../hooks/useBudgetStatus';

import { BudgetAlerts } from '../components/BudgetAlerts';
import PageHeader from '../components/ui/PageHeader';

// Refactored Dashboard Subcomponents
import { SeptemberToAugustBanner } from '../components/SeptemberToAugustBanner';
import { TunisianFamilyBanner } from '../components/dashboard/TunisianFamilyBanner';
import { SummaryKpiRow } from '../components/dashboard/SummaryKpiRow';
import { MarketBasketCard } from '../components/dashboard/MarketBasketCard';
import { DashboardTabSwitcher, DashboardTab } from '../components/dashboard/DashboardTabSwitcher';
import { VaultsSection } from '../components/dashboard/VaultsSection';
import { TodayOperationsPanel } from '../components/dashboard/TodayOperationsPanel';
import { InsightsSection } from '../components/dashboard/InsightsSection';

const Dashboard = () => {
  const { 
    expenses, 
    categories, 
    accounts, 
    goals, 
    currency, 
    addExpense, 
    setIsAddModalOpen, 
    budgets, 
    setBudget,
    income = [], 
    recurringExpenses = [], 
    userName, 
    firstDayOfMonth, 
    dailyBudget, 
    rollingBudgetEnabled, 
    bestStreak, 
    repeatExpense,
    deleteExpense,
    setEditingExpense,
    setInitialGoalId,
    applyTunisianFamilyTemplate,
    addGoal,
    updateGoal
  } = useAppContext();

  // States for Physical Piggy Bank Sweep
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

  // Handler for manual piggy bank deposit (manual injection)
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

  // Create Physical Goal automatically
  const handleCreatePhysicalGoal = async () => {
    hapticFeedback('success');
    try {
      await addGoal({
        name: 'حصالة الواقع الفعلية 🪙',
        targetAmount: 500, // standard target
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        isPhysicalPiggyBank: true
      });
      toast.success('تم إنشاء حصالة الواقع الفعلية بنجاح! 🪙');
    } catch (err) {
      toast.error('حدث خطأ أثناء إنشاء الحصالة');
    }
  };

  // Perform the sweep action for a single account
  const handleSweepAccount = async (accountId: string, amount: number) => {
    if (amount <= 0) return;
    
    let activePhysicalGoal = physicalGoal;
    
    if (!activePhysicalGoal) {
      hapticFeedback('light');
      const confirmCreate = window.confirm('لم يتم العثور على حصالة واقع مخصصة. هل تريد إنشاء "حصالة الواقع الفعلية 🪙" تلقائياً لحفظ هذه المبالغ؟');
      if (!confirmCreate) return;
      
      const newGoalId = crypto.randomUUID();
      const newGoal = {
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

    const savingCategory = categories.find(c => c.type === 'saving') || 
                          categories.find(c => c.name.includes('ادخار')) || 
                          categories[0];

    try {
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

  // Perform the sweep action for selected accounts
  const handleSweepSelected = async () => {
    let activePhysicalGoal = physicalGoal;
    
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
      const newGoal = {
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

  const { insights, rollingBudget } = useBehavioralEngine();
  const { 
    remainingToday, 
    todaySpent, 
    globalBudgetNum, 
    totalSpent, 
    daysInMonth: budgetDaysInMonth, 
    remainingDays, 
    remainingBudget,
    dailyLimit 
  } = useBudgetStatus();

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddModalOpen(true);
  };

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const todayExpenses = useMemo(() => {
    return expenses.filter(e => e.date === today);
  }, [expenses, today]);
  
  const todaySpending = useMemo(() => 
    expenses.filter(e => !e.isTransfer && e.date === today).reduce((sum, e) => sum + e.amount, 0),
  [expenses, today]);

  const remainingDailyBudget = useMemo(() => 
    Math.max(0, rollingBudget - todaySpending),
  [rollingBudget, todaySpending]);

  const budgetStatus = useMemo(() => {
    if (rollingBudget <= 0) return todaySpending > 0 ? 'red' : 'green';
    const ratio = todaySpending / rollingBudget;
    if (ratio > 1) return 'red';
    if (ratio > 0.8) return 'orange';
    return 'green';
  }, [todaySpending, rollingBudget]);

  const weeklyTotal = useMemo(() => {
    const now = new Date();
    const startOfWeek = addDays(now, -now.getDay());
    return expenses
      .filter(e => {
        if (e.isTransfer) return false;
        const d = safeParseISO(e.date);
        return d >= startOfWeek && d <= now;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Active Tab for refactored clutter-free dashboard
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>(() => {
    const saved = safeStorage.getItem('dashboard_active_tab') as DashboardTab;
    if (saved && ['daily', 'vaults', 'insights'].includes(saved)) {
      return saved;
    }
    return 'daily';
  });

  const handleQuickPresetClick = async (preset: { label: string; amount: string; desc: string; categoryName: string; }) => {
    const amountNum = parseFloat(preset.amount);
    const targetAccountId = accounts[0]?.id || 'cash';
    
    if (!targetAccountId) {
      toast.error('الرجاء إعداد حساب مالي أولاً من صفحة الإعدادات');
      return;
    }

    const matchingCat = categories.find(c => c.name.includes(preset.categoryName)) || categories[0];
    if (!matchingCat) {
      toast.error('الرجاء تعيين الفئات أولاً من صفحة الإعدادات');
      return;
    }

    hapticFeedback('heavy');
    const loadingToast = toast.loading(`جاري تسجيل ${preset.label} فوراً...`);

    let savedPaymentMethod: any = 'cash';
    try {
      const raw = localStorage.getItem('masarifi_last_used');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.paymentMethod) savedPaymentMethod = parsed.paymentMethod;
      }
    } catch (e) {
      console.error(e);
    }

    try {
      await addExpense({
        amount: amountNum,
        categoryId: matchingCat.id,
        accountId: targetAccountId,
        date: new Date().toISOString().split('T')[0],
        note: preset.label,
        subcategoryId: preset.desc || '',
        paymentMethod: savedPaymentMethod,
        isTransfer: false
      });
      
      toast.dismiss(loadingToast);
      toast.success(`تم تسجيل ${preset.label} (${amountNum.toFixed(3)} د.ت) بنجاح! 🇹🇳✨`);
    } catch(err) {
      toast.dismiss(loadingToast);
      console.error(err);
      toast.error('حدث خطأ أثناء التسجيل السريع');
    }
  };

  // Tab Control for Hero Card
  const [heroTab, setHeroTab] = useState<'wallet' | 'anatomy' | 'savings'>('wallet');

  // Selected Bank Account in Deck
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // Transaction filter inside Home
  const [txFilter, setTxFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Interactive UI features
  const [showChallengeHelp, setShowChallengeHelp] = useState(false);
  const [activeInsightIdx, setActiveInsightIdx] = useState(0);

  // 🇹🇳 Tunisian Quick Board states
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickCategoryId, setQuickCategoryId] = useState<string>('');
  const [quickDescription, setQuickDescription] = useState<string>('');
  const [quickSubcategory, setQuickSubcategory] = useState<string>('');
  const [quickAccountId, setQuickAccountId] = useState<string>('');

  // Auto-set defaults when lists are ready
  useEffect(() => {
    if (accounts.length > 0 && !quickAccountId) {
      setQuickAccountId(accounts[0].id);
    }
  }, [accounts, quickAccountId]);

  useEffect(() => {
    if (categories.length > 0 && !quickCategoryId) {
      const foodCat = categories.find(c => c.name.includes('القفة') || c.name.includes('السوق'));
      setQuickCategoryId(foodCat?.id || categories[0].id);
    }
  }, [categories, quickCategoryId]);

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(quickAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح بالدينار');
      return;
    }
    if (!quickCategoryId) {
      toast.error('الرجاء اختيار فئة المصروف');
      return;
    }
    const targetAccountId = quickAccountId || (accounts[0]?.id || '');
    if (!targetAccountId) {
      toast.error('الرجاء إعداد حساب مالي أولاً من صفحة الإعدادات أو الحسابات');
      return;
    }

    hapticFeedback('heavy');
    const loadingToast = toast.loading('جاري حفظ العملية فوراً...');

    let savedPaymentMethod: any = 'cash';
    try {
      const raw = localStorage.getItem('masarifi_last_used');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.paymentMethod) savedPaymentMethod = parsed.paymentMethod;
      }
    } catch (e) {
      console.error(e);
    }

    try {
      await addExpense({
        amount: amountNum,
        categoryId: quickCategoryId,
        accountId: targetAccountId,
        date: new Date().toISOString().split('T')[0],
        note: quickDescription.trim() || 'تسجيل عائلي سريع',
        subcategoryId: quickSubcategory || '',
        paymentMethod: savedPaymentMethod,
        isTransfer: false
      });
      
      toast.dismiss(loadingToast);
      toast.success(`تم حفظ ${amountNum.toFixed(3)} د.ت في الحساب بنجاح! 🇹🇳`);
      
      // Reset input values
      setQuickAmount('');
      setQuickDescription('');
      setQuickSubcategory('');
    } catch(err) {
      toast.dismiss(loadingToast);
      console.error(err);
      toast.error('حدث خطأ أثناء التسجيل السريع');
    }
  };

  const activeAccount = useMemo(() => {
    if (selectedAccountId) return accounts.find(a => a.id === selectedAccountId);
    return accounts[0] || undefined;
  }, [accounts, selectedAccountId]);

  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const { start: rangeStart, end: rangeEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  const monthlyExpenses = useMemo(() => 
    expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = safeParseISO(e.date);
      return d >= rangeStart && d <= rangeEnd;
    }),
  [expenses, rangeStart, rangeEnd]);

  const totalMonthlyExpense = useMemo(() => 
    monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
  [monthlyExpenses]);

  // Smart Calculations
  const daysInMonth = useMemo(() => 
    differenceInDays(rangeEnd, rangeStart) + 1,
  [rangeStart, rangeEnd]);
  
  const currentDayInCycle = useMemo(() => {
    const todayDate = new Date();
    if (todayDate < rangeStart) return 0;
    if (todayDate > rangeEnd) return daysInMonth;
    return differenceInDays(todayDate, rangeStart) + 1;
  }, [rangeStart, rangeEnd, daysInMonth]);
  
  const dailyAverage = useMemo(() => 
    totalMonthlyExpense / (currentDayInCycle || 1),
  [totalMonthlyExpense, currentDayInCycle]);

  const totalMonthlyIncome = useMemo(() => 
    income.filter(i => {
      if (i.isTransfer) return false;
      const d = safeParseISO(i.date);
      return d >= rangeStart && d <= rangeEnd;
    }).reduce((sum, i) => sum + i.amount, 0),
  [income, rangeStart, rangeEnd]);

  // Recent filtered Transactions
  const recentTransactions = useMemo(() => {
    let list = [...expenses];
    if (txFilter === 'expense') {
      list = list.filter(e => !e.isTransfer);
    } else if (txFilter === 'income') {
      list = list.filter(e => e.isTransfer);
    }
    return list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses, txFilter]);

  const totalNetWorth = useMemo(() => 
    accounts.reduce((sum, acc) => sum + acc.balance, 0),
  [accounts]);

  const totalGoals = useMemo(() => 
    (goals || []).reduce((sum, g) => sum + (g.currentAmount || 0), 0),
  [goals]);

  // Expense Anatomy 50-30-20
  const typeSpent = useMemo(() => {
    const totals = { need: 0, want: 0, saving: 0 };
    monthlyExpenses.forEach(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      if (cat?.type) {
        totals[cat.type] += e.amount;
      }
    });
    return totals;
  }, [monthlyExpenses, categories]);

  // Gamified challenges
  const currentChallenge = useMemo(() => {
    if (todaySpending === 0) {
      return { 
        title: 'تحدي البداية البيضاء 🕊️', 
        desc: 'لم تقم بصرف أي فلس اليوم حتى الآن! حافظ على نظافة سجلك لأطول فترة ممكنة.' 
      };
    }
    if (todaySpending < dailyBudget * 0.4) {
      return { 
        title: 'بطل التوفير الفعّال 🛡️', 
        desc: 'رائع! استهلاكك اليومي تحت 40%. أنت تبلي بلاءً استثنائياً في حماية محفظتك.' 
      };
    }
    if (todaySpending < dailyBudget) {
      return { 
        title: 'الاستقرار الذكي 🎯', 
        desc: 'أنت ضمن نطاق الأمان اليومي المسموح به. واصل مراقبة عملياتك بوعي.' 
      };
    }
    return { 
      title: 'تحدي الاستدراك السريع ⚡', 
      desc: 'لقد تجاوزت ميزانية اليوم المرصودة. ننصحك بتقليل مصروف الغد لإعادة التوازن.' 
    };
  }, [todaySpending, dailyBudget]);

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" as any }
    }
  };

  const hasTunisianFamilyCategories = useMemo(() => 
    categories.some(cat => cat.name === 'قضية السوق والقفة' || cat.name === 'لوازم ومصروف الرضيع'),
  [categories]);

  return (
    <div className="space-y-6 p-4 pb-32 relative mt-2">
      
      {/* September to August Date Correction Banner */}
      <SeptemberToAugustBanner />

      {/* Tunisian Family Template Migration Banner */}
      <TunisianFamilyBanner
        hasTunisianFamilyCategories={hasTunisianFamilyCategories}
        applyTunisianFamilyTemplate={applyTunisianFamilyTemplate}
      />

      {/* 1. Header with Greeting & Hot Streak widget */}
      <PageHeader
        title={`مرحباً، ${userName || 'صديقي'} 👋`}
        subtitle={`${format(new Date(), 'EEEE، d MMMM', { locale: ar })} • دورة الميزانية النشطة`}
      />

      {/* Category and global smart budget alerts */}
      <BudgetAlerts />

      {/* 2. Intelligent Segmented KPI Row */}
      <SummaryKpiRow
        totalNetWorth={totalNetWorth}
        totalGoals={totalGoals}
        remainingToday={remainingToday}
        totalMonthlyExpense={totalMonthlyExpense}
        globalBudgetNum={globalBudgetNum}
        currency={currency}
        itemVariants={itemVariants}
      />

      {/* 3. Smart Market & Grocery Basket Widget (ميزانية قضية السوق والقفة - للقراءة فقط) */}
      <MarketBasketCard
        categories={categories}
        expenses={expenses}
        budgets={budgets}
        currency={currency}
        firstDayOfMonth={firstDayOfMonth}
        itemVariants={itemVariants}
      />

      {/* 4. Intelligent Segmented Tab Switcher */}
      <DashboardTabSwitcher
        activeDashboardTab={activeDashboardTab}
        setActiveDashboardTab={setActiveDashboardTab}
        itemVariants={itemVariants}
      />

      {activeDashboardTab === 'vaults' && (
        <VaultsSection
          accounts={accounts}
          physicalGoal={physicalGoal}
          totalNetWorth={totalNetWorth}
          currency={currency}
          fakkaPrecision={fakkaPrecision}
          setFakkaPrecision={setFakkaPrecision}
          selectedSweepAccounts={selectedSweepAccounts}
          setSelectedSweepAccounts={setSelectedSweepAccounts}
          sweepSuccessMessage={sweepSuccessMessage}
          setSweepSuccessMessage={setSweepSuccessMessage}
          isSweeping={isSweeping}
          isManualDepositOpen={isManualDepositOpen}
          setIsManualDepositOpen={setIsManualDepositOpen}
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
          depositSource={depositSource}
          setDepositSource={setDepositSource}
          selectedDepositAccountId={selectedDepositAccountId}
          setSelectedDepositAccountId={setSelectedDepositAccountId}
          depositNote={depositNote}
          setDepositNote={setDepositNote}
          showResetConfirm={showResetConfirm}
          setShowResetConfirm={setShowResetConfirm}
          piggyBankHistory={piggyBankHistory}
          handleManualDeposit={handleManualDeposit}
          handleResetPiggyBank={handleResetPiggyBank}
          calculateFakka={calculateFakka}
          handleCreatePhysicalGoal={handleCreatePhysicalGoal}
          handleSweepAccount={handleSweepAccount}
          handleSweepSelected={handleSweepSelected}
          itemVariants={itemVariants}
        />
      )}

      {activeDashboardTab === 'daily' && (
        <TodayOperationsPanel
          dailyLimit={dailyLimit}
          todaySpent={todaySpent}
          remainingToday={remainingToday}
          globalBudgetNum={globalBudgetNum}
          currency={currency}
          remainingDays={remainingDays}
          budgetDaysInMonth={budgetDaysInMonth}
          rollingBudgetEnabled={rollingBudgetEnabled}
          totalSpent={totalSpent}
          categories={categories}
          accounts={accounts}
          goals={goals}
          remainingDailyBudget={remainingDailyBudget}
          todaySpending={todaySpending}
          dailyBudget={dailyBudget}
          rollingBudget={rollingBudget}
          totalNetWorth={totalNetWorth}
          totalMonthlyExpense={totalMonthlyExpense}
          dailyAverage={dailyAverage}
          budgetStatus={budgetStatus}
          setIsAddModalOpen={setIsAddModalOpen}
          itemVariants={itemVariants}
        />
      )}

      {activeDashboardTab === 'insights' && (
        <InsightsSection
          expenses={expenses}
          categories={categories}
          currency={currency}
          heroTab={heroTab}
          setHeroTab={setHeroTab}
          totalNetWorth={totalNetWorth}
          totalMonthlyIncome={totalMonthlyIncome}
          totalMonthlyExpense={totalMonthlyExpense}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          setSelectedAccountId={setSelectedAccountId}
          activeAccount={activeAccount}
          typeSpent={typeSpent}
          goals={goals}
          setIsAddModalOpen={setIsAddModalOpen}
          setEditingExpense={setEditingExpense}
          budgetStatus={budgetStatus}
          todaySpending={todaySpending}
          rollingBudget={rollingBudget}
          rollingBudgetEnabled={rollingBudgetEnabled}
          dailyBudget={dailyBudget}
          remainingDailyBudget={remainingDailyBudget}
          showChallengeHelp={showChallengeHelp}
          setShowChallengeHelp={setShowChallengeHelp}
          currentChallenge={currentChallenge}
          insights={insights}
          activeInsightIdx={activeInsightIdx}
          setActiveInsightIdx={setActiveInsightIdx}
          itemVariants={itemVariants}
        />
      )}

    </div>
  );
};

export default Dashboard;
