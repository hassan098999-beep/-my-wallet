import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn, hapticFeedback, getBudgetRange, getBudgetMonth, safeStorage, safeParseISO } from '../utils';
import { Skeleton, TransactionSkeleton } from '../components/Skeleton';
import { parseISO, format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Plus, 
  Wallet, 
  Activity, 
  Clock, 
  ArrowRight, 
  Target, 
  Sparkles, 
  ArrowRightLeft, 
  Percent,
  Flame,
  Zap,
  PiggyBank,
  Coins,
  Check,
  X,
  Info,
  HelpCircle,
  ArrowDown,
  Trash
} from 'lucide-react';
import { Expense, Category } from '../types';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Link } from 'react-router-dom';
import { useBehavioralEngine } from '../hooks/useBehavioralEngine';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import DailySimpleView from '../components/DailySimpleView';

// Import newly refactored modular components for smart architecture
import SwipeableTransactionItem from '../components/SwipeableTransactionItem';
import TunisianLedger from '../components/TunisianLedger';
import HeroSlidingDeck from '../components/HeroSlidingDeck';
import FinancialRadar from '../components/FinancialRadar';
import BehavioralAdvisor from '../components/BehavioralAdvisor';
import { SmartSavingChallengeCard } from '../components/SmartSavingChallengeCard';
import { BudgetAlerts } from '../components/BudgetAlerts';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const Dashboard = () => {
  const { 
    expenses, 
    categories, 
    accounts, 
    goals, 
    currency, 
    addExpense, 
    setIsAddModalOpen, 
    budget, 
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

      await updateGoal(activePhysicalGoal.id, {
        currentAmount: activePhysicalGoal.currentAmount + amount
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

        await updateGoal(activePhysicalGoal.id, {
          currentAmount: activePhysicalGoal.currentAmount + amount
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
  const { remainingToday, todaySpent } = useBudgetStatus();

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

  // View Mode switcher ('daily' = simple mode, 'pro' = advanced mode)
  const [viewMode, setViewMode] = useState<'daily' | 'pro'>(() => {
    return (safeStorage.getItem('dashboard_view_mode') as 'daily' | 'pro') || 'daily';
  });

  const handleViewChange = (mode: 'daily' | 'pro') => {
    hapticFeedback('medium');
    setViewMode(mode);
    safeStorage.setItem('dashboard_view_mode', mode);
  };

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

    try {
      await addExpense({
        amount: amountNum,
        categoryId: matchingCat.id,
        accountId: targetAccountId,
        date: new Date().toISOString().split('T')[0],
        note: preset.label,
        subcategoryId: preset.desc || '',
        paymentMethod: 'cash',
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
  const [isCChipHovered, setIsCChipHovered] = useState(false);
  const [streakCheckedIn, setStreakCheckedIn] = useState(false);
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

    try {
      await addExpense({
        amount: amountNum,
        categoryId: quickCategoryId,
        accountId: targetAccountId,
        date: new Date().toISOString().split('T')[0],
        note: quickDescription.trim() || 'تسجيل عائلي سريع',
        subcategoryId: quickSubcategory || '',
        paymentMethod: 'cash',
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
    return accounts[0] || null;
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
    const today = new Date();
    if (today < rangeStart) return 0;
    if (today > rangeEnd) return daysInMonth;
    return differenceInDays(today, rangeStart) + 1;
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
      // Show transfer with positive amounts OR filter from actual incomes
      list = list.filter(e => e.isTransfer); // Note: simplify based on transaction flags
    }
    return list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses, txFilter]);

  const totalNetWorth = useMemo(() => 
    accounts.reduce((sum, acc) => sum + acc.balance, 0),
  [accounts]);

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

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
      
      {/* Tunisian Family Template Migration Banner */}
      {!hasTunisianFamilyCategories && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-cyan-600 via-emerald-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 shadow-md border border-white/10 relative overflow-hidden text-right"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🇹🇳</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                  ميزة عائلية جديدة
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold leading-snug">
                تفعيل قالب ميزانية العائلة التونسية (أب، أم، ورضيع)
              </h3>
              <p className="text-xs md:text-sm text-white/90 max-w-2xl font-semibold leading-relaxed">
                لقد دخلت بنجاح في النسخة العائلية! اضغط هنا لتحديث جميع تصنيفاتك تلقائياً لتشمل: قفة العبار، كوش وحليب البيبي، طبيب الأطفال، وفواتير السكن (STEG/SONEDE) مع موازنة متكاملة بالمليمات التونسية.
              </p>
            </div>
            <button
              onClick={async () => {
                hapticFeedback('heavy');
                const loadingToast = toast.loading('جاري تطبيق القالب...');
                await applyTunisianFamilyTemplate();
                toast.dismiss(loadingToast);
              }}
              className="self-start md:self-auto bg-white text-emerald-600 hover:bg-neutral-100 font-extrabold text-xs md:text-sm px-6 py-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles size={16} />
              تحديث التصنيفات والميزانية الآن
            </button>
          </div>
        </motion.div>
      )}

      {/* 1. Header with Greeting & Hot Streak widget */}
      <PageHeader
        title={`مرحباً، ${userName || 'صديقي'} 👋`}
        subtitle={`${format(new Date(), 'EEEE، d MMMM', { locale: ar })} • دورة الميزانية النشطة`}
      />

      {/* Category and global smart budget alerts */}
      <BudgetAlerts />

      {/* 🇹🇳 Standalone Physical Piggy Bank Board (لوحة الحصالة المستقلة وأرصدة الخزائن) */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="border border-slate-150 dark:border-slate-800/85 rounded-[2.5rem] bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 dark:from-slate-900/60 dark:via-slate-900/30 dark:to-slate-950/40 p-5 md:p-8 shadow-xs overflow-hidden relative animate-fade-in"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-slate-100 dark:border-slate-800/60 pb-6 mb-6" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/10 shrink-0">
              <PiggyBank size={24} className="shrink-0" />
            </div>
            <div className="text-right">
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                حصالة الواقع الذكية المستقلة 🪙🏡
                <Badge variant="success" className="text-[9px] font-black">
                  مستقلة وتراكمية
                </Badge>
              </h3>
              <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold">تحدي حصالة ملموسة في منزلك، تفريغ الفكة اليومية وضخ مالي رقمي يطابق واقعك</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left md:text-right">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">إجمالي الثروة الرقمية</span>
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                {formatCurrency(totalNetWorth, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10" dir="rtl">
          {/* Column 1: Digital Vaults & Accounts Breakdown (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">الخزائن الرقمية والحسابات النشطة 💳💵</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">اختر تفريغ الفكة اليومية لمطابقة الكاش</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {accounts.map((acc) => {
                const fakka = calculateFakka(acc.balance, fakkaPrecision);
                
                return (
                  <div 
                    key={acc.id} 
                    className="p-4 rounded-2xl border bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 shadow-3xs flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-slate-200 dark:hover:border-slate-700 transition-all text-right"
                  >
                    <div className="absolute top-0 right-0 left-0 h-[2px]" style={{ backgroundColor: acc.color }} />
                    
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: acc.color }}>
                          <Wallet size={16} />
                        </div>
                        <div className="text-right">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">{acc.name}</h4>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">
                            •••• {acc.id === 'cash' ? 'نقود جيب' : acc.id === 'bank' ? 'بطاقة بريدية' : 'خزنة'}
                          </span>
                        </div>
                      </div>

                      <div className="text-left font-sans shrink-0">
                        <span className="text-sm font-black text-slate-850 dark:text-white">
                          {formatCurrency(acc.balance, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/50 pt-2.5 flex justify-between items-center gap-2">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">فكة اليوم المتبقية</span>
                        <span className="text-[11px] font-black font-mono text-amber-600 dark:text-amber-400">
                          {fakka > 0 ? `+ ${formatCurrency(fakka, currency)}` : '0.000'}
                        </span>
                      </div>

                      {fakka > 0 ? (
                        <button
                          disabled={isSweeping}
                          onClick={() => handleSweepAccount(acc.id, fakka)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-black text-[10px] transition-all border border-amber-100/30 flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <span>تفريغ الفكة 🪙</span>
                        </button>
                      ) : (
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">
                          مفرغة ونظيفة ✨
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Independent Piggy Bank Panel (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">وضعية الحصالة المادية الحقيقية بالمنزل 🏡</span>
              {physicalGoal && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowResetConfirm(!showResetConfirm)}
                    className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/25 text-rose-500 transition-all tooltip cursor-pointer"
                    title="تفريغ الحصالة وتصفيرها بالكامل"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              )}
            </div>

            {!physicalGoal ? (
              <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-900/50 rounded-2xl text-center space-y-3">
                <Sparkles size={28} className="mx-auto text-amber-500 animate-pulse" />
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ابدأ تحدي حصالة الواقع الملموسة! 🪙🏡</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal max-w-sm mx-auto">
                  الحصالة الآن مستقلة تماماً ومفتوحة بدون سقف أهداف محدد! قم بإنشائها لتجميع مدخراتك المادية يدوياً وتفريغ الفكة اليومية.
                </p>
                <button
                  onClick={handleCreatePhysicalGoal}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/10 hover:opacity-95 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Plus size={14} />
                  <span>تفعيل الحصالة المستقلة الآن</span>
                </button>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4 text-right relative overflow-hidden">
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

                {/* Standalone Visual Container */}
                <div className="bg-gradient-to-b from-slate-100/50 to-slate-200/20 dark:from-slate-950/50 dark:to-slate-950/10 p-4 rounded-xl border border-slate-100 dark:border-slate-850/40 relative overflow-hidden flex items-center justify-between gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">رصيد الحصالة الحالي (في غرفتك) 🏡</span>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">
                      {formatCurrency(physicalGoal.currentAmount, currency)}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md inline-block mt-1">
                      حصالة مفتوحة غير مقيدة 📈
                    </span>
                  </div>

                  <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center relative shrink-0">
                    <PiggyBank size={28} className="text-amber-500" />
                    <div className="absolute inset-0.5 rounded-full border-2 border-dashed border-amber-500/20 animate-spin-slow" />
                  </div>
                </div>

                {/* Micro instructions feedback */}
                {sweepSuccessMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative text-right"
                  >
                    <button 
                      onClick={() => setSweepSuccessMessage(null)}
                      className="absolute top-2 left-2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <X size={12} />
                    </button>
                    <div className="flex items-start gap-2 text-right">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                        <Check size={14} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">تم الخصم الرقمي بنجاح! 🎉</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold mt-0.5 leading-relaxed">
                          الآن 🏡: اسحب <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">{formatCurrency(sweepSuccessMessage.amount, currency)}</span> نقداً من محفظتك الحقيقية وضعها فوراً داخل حصالة غرفتك الفعلية!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Interactive Manual Deposit Form Button & Form */}
                <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3">
                  <button
                    onClick={() => { setIsManualDepositOpen(!isManualDepositOpen); hapticFeedback('light'); }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer"
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

                {/* Sweep configuration (Rounding precision) */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">ميزة تفريغ الفكة (التقريب التلقائي للكسور):</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100/60 dark:bg-slate-950 p-1 rounded-xl">
                    <button
                      onClick={() => { setFakkaPrecision('decimals'); hapticFeedback('light'); }}
                      className={cn(
                        "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                        fakkaPrecision === 'decimals' ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-400"
                      )}
                    >
                      الكسور (فقط)
                    </button>
                    <button
                      onClick={() => { setFakkaPrecision('nearest5'); hapticFeedback('light'); }}
                      className={cn(
                        "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                        fakkaPrecision === 'nearest5' ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-400"
                      )}
                    >
                      أقرب 5 د.ت
                    </button>
                    <button
                      onClick={() => { setFakkaPrecision('nearest10'); hapticFeedback('light'); }}
                      className={cn(
                        "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                        fakkaPrecision === 'nearest10' ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-400"
                      )}
                    >
                      أقرب 10 د.ت
                    </button>
                  </div>

                  {/* Multiselect checkboxes for sweeping */}
                  <div className="flex gap-4 pt-1.5 items-center justify-start text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold">تضمين الحسابات:</span>
                    {accounts.map(acc => (
                      <label key={acc.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSweepAccounts[acc.id] || false}
                          onChange={(e) => setSelectedSweepAccounts(prev => ({ ...prev, [acc.id]: e.target.checked }))}
                          className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-800 cursor-pointer"
                        />
                        <span className="font-bold">{acc.name}</span>
                      </label>
                    ))}
                  </div>

                  {/* Master sweep action button */}
                  <button
                    disabled={isSweeping || accounts.filter(acc => selectedSweepAccounts[acc.id] && calculateFakka(acc.balance, fakkaPrecision) > 0).length === 0}
                    onClick={handleSweepSelected}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/10 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Coins size={14} />
                    <span>تفريغ الفكة المحددة دفعة واحدة 🚀</span>
                  </button>
                </div>

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
          </div>
        </div>
      </motion.div>

      {/* 2. Cozy View Mode Switcher */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex justify-center"
      >
        <div className="bg-slate-100 dark:bg-slate-800/85 p-1 rounded-2xl flex items-center gap-1 shadow-inner border border-slate-200/20 w-full max-w-md">
          <button
            type="button"
            onClick={() => handleViewChange('daily')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
              viewMode === 'daily'
                ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-md border border-slate-200/5"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Zap size={14} className={cn(viewMode === 'daily' ? "text-amber-500 fill-amber-500 animate-pulse" : "text-slate-400")} />
            <span>الاستخدام اليومي المبسط ⚡</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleViewChange('pro')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
              viewMode === 'pro'
                ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-md border border-slate-200/5"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Activity size={14} className={cn(viewMode === 'pro' ? "text-emerald-500" : "text-slate-400")} />
            <span>لوحة التحكم الشاملة 📊</span>
          </button>
        </div>
      </motion.div>

      {/* 3. Today Panel ("لوحة اليوم") */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 max-w-5xl mx-auto w-full text-right"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
              {new Date().toLocaleDateString('ar-TN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h2 className="text-[--text-h2] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock size={16} className="text-emerald-500" />
            <span>لوحة عمليات اليوم</span>
          </h2>
        </div>

        {/* Financial Progress Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/10 rounded-2xl flex justify-between items-center">
            <div className="text-left font-sans">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(remainingToday, currency)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">باقي مسموح الصرف لليوم ⚡</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-black mt-0.5">المبلغ المتبقي الآمن</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100/5 rounded-2xl flex justify-between items-center">
            <div className="text-left font-sans">
              <span className="text-lg font-black text-slate-800 dark:text-white">
                {formatCurrency(todaySpent, currency)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">ما تم صرفه اليوم 💸</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-black mt-0.5">مجموع المعاملات</p>
            </div>
          </div>
        </div>

        {/* Transaction list for today */}
        <div className="space-y-2">
          {todayExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50/50 dark:bg-slate-850/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">لم تسجل أي عملية صرف اليوم بعد. حافظ على الانضباط!</p>
              <button
                onClick={() => {
                  hapticFeedback('medium');
                  setIsAddModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={14} />
                <span>سجل أول عملية لليوم 🚀</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {todayExpenses.map(exp => {
                const cat = categories.find(c => c.id === exp.categoryId);
                return (
                  <div key={exp.id} className="py-3 flex justify-between items-center gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-colors">
                    {/* Action buttons (Delete / Edit) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          hapticFeedback('medium');
                          handleEdit(exp);
                        }}
                        className="p-1.5 text-xs font-black text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg cursor-pointer"
                        title="تعديل"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={async () => {
                          hapticFeedback('heavy');
                          if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
                            try {
                              await deleteExpense(exp.id);
                              toast.success('تم حذف العملية بنجاح');
                            } catch(e) {
                              toast.error('حدث خطأ أثناء الحذف');
                            }
                          }
                        }}
                        className="p-1.5 text-xs font-black text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg cursor-pointer"
                        title="حذف"
                      >
                        حذف
                      </button>
                    </div>

                    {/* Left: Amount & Payment info */}
                    <div className="text-left flex flex-col shrink-0 font-sans">
                      <span className={cn(
                        "text-sm font-black",
                        exp.isTransfer ? "text-slate-500" : "text-rose-500 dark:text-rose-400"
                      )}>
                        {exp.isTransfer ? '' : '-'}{formatCurrency(exp.amount, currency)}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 font-tajawal">
                        {exp.paymentMethod === 'cash' ? 'نقداً 💵' : exp.paymentMethod === 'card' ? 'بطاقة بنكية 💳' : 'آخر'}
                      </span>
                    </div>

                    {/* Right: Category Icon, Name, and Note */}
                    <div className="flex items-center gap-3 text-right flex-1 min-w-0">
                      <div className="hidden sm:block shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300">
                          {cat?.name.substring(0, 2) || '📦'}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                          {exp.note || cat?.name || 'مصروف عام'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate mt-0.5">
                          {cat?.name || 'بدون تصنيف'} {exp.subcategoryId ? `• ${exp.subcategoryId}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Conditional Rendering of Dashboard Mode */}
      {viewMode === 'daily' ? (
        <DailySimpleView
          categories={categories}
          accounts={accounts}
          expenses={expenses}
          goals={goals}
          currency={currency}
          remainingDailyBudget={remainingDailyBudget}
          todaySpending={todaySpending}
          dailyBudget={dailyBudget}
          rollingBudget={rollingBudget}
          totalNetWorth={totalNetWorth}
          totalMonthlyExpense={totalMonthlyExpense}
          dailyAverage={dailyAverage}
          recentTransactions={recentTransactions}
          budgetStatus={budgetStatus}
          handleQuickPresetClick={handleQuickPresetClick}
          handleQuickAddSubmit={handleQuickAddSubmit}
          quickAmount={quickAmount}
          setQuickAmount={setQuickAmount}
          quickDescription={quickDescription}
          setQuickDescription={setQuickDescription}
          quickCategoryId={quickCategoryId}
          setQuickCategoryId={setQuickCategoryId}
          setIsAddModalOpen={setIsAddModalOpen}
          handleEdit={handleEdit}
          deleteExpense={deleteExpense}
          repeatExpense={repeatExpense}
        />
      ) : (
        <div className="space-y-6">
          {/* Promo banner for Savings Indicators */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-emerald-505/10 bg-emerald-500/10 dark:bg-emerald-500/5 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Percent size={18} />
          </div>
          <div className="text-right">
            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-snug">مؤشرات وفرص التوفير العائلية 🇹🇳</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed mt-0.5">
              اكتشف نسبة ادخارك الحقيقية وجرّب محاكاة ترشيد قفة السوق ومستلزمات البيبي للحصول على نصائح تونسية عملية.
            </p>
          </div>
        </div>
        <Link
          to="/savings-indicators"
          className="self-start sm:self-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95 duration-200 cursor-pointer"
        >
          <span>تصفح المؤشرات والذكاء المالي</span>
          <ArrowRight size={12} className="rotate-180" />
        </Link>
      </motion.div>

      {/* 🇹🇳 Quick Tunisian Family Ledger Form */}
      <TunisianLedger
        categories={categories}
        accounts={accounts}
        currency={currency}
        quickAmount={quickAmount}
        setQuickAmount={setQuickAmount}
        quickCategoryId={quickCategoryId}
        setQuickCategoryId={setQuickCategoryId}
        quickDescription={quickDescription}
        setQuickDescription={setQuickDescription}
        quickSubcategory={quickSubcategory}
        setQuickSubcategory={setQuickSubcategory}
        quickAccountId={quickAccountId}
        setQuickAccountId={setQuickAccountId}
        handleQuickAddSubmit={handleQuickAddSubmit}
      />

      {/* 2. Bento Grid Layout - Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bento Card 1: Sliding Portfolio Deck (left 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <HeroSlidingDeck
            heroTab={heroTab}
            setHeroTab={setHeroTab}
            totalNetWorth={totalNetWorth}
            currency={currency}
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
          />
        </div>

        {/* Bento Card 2: Interactive Smart Radar & Challenge speed dial (right 1 column) */}
        <div className="flex flex-col gap-6">
          <FinancialRadar
            budgetStatus={budgetStatus}
            todaySpending={todaySpending}
            rollingBudget={rollingBudget}
            rollingBudgetEnabled={rollingBudgetEnabled}
            currency={currency}
            dailyBudget={dailyBudget}
            remainingDailyBudget={remainingDailyBudget}
            showChallengeHelp={showChallengeHelp}
            setShowChallengeHelp={setShowChallengeHelp}
            currentChallenge={currentChallenge}
            itemVariants={itemVariants}
          />
          <SmartSavingChallengeCard />
        </div>

      </div>

      {/* 3. Interactive AI Behavioral Advisor Banner Row */}
      <BehavioralAdvisor
        insights={insights}
        activeInsightIdx={activeInsightIdx}
        setActiveInsightIdx={setActiveInsightIdx}
        itemVariants={itemVariants}
      />

      {/* 4. Interactive Transaction List with live Filters */}
      <motion.div variants={itemVariants}>
        <Card className="flex flex-col min-h-[500px] p-6 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/65">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-button flex items-center justify-center text-indigo-600 shadow-inner">
                <Clock size={22} />
              </div>
              <div>
                <h2 className="text-[--text-h2] font-semibold text-slate-900 dark:text-white">آخر العمليات المكتملة</h2>
                <p className="text-[--text-body] font-medium text-slate-500 mt-0.5">اسحب على أي معاملة لتكرارها أو حذفها</p>
              </div>
            </div>

            {/* Sliging Filter Indicator pills */}
            <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/5">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'expense', label: 'المصاريف' },
                { id: 'income', label: 'التحويلات/المداخيل' },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    hapticFeedback('light');
                    setTxFilter(op.id as any);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                    txFilter === op.id 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1 text-right" dir="rtl">
            <AnimatePresence mode="popLayout">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((expense, idx) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <SwipeableTransactionItem 
                      expense={expense} 
                      category={categories.find(c => c.id === expense.categoryId)}
                      currency={currency}
                      accountName={accounts.find(a => a.id === expense.accountId)?.name}
                      onDelete={() => {
                        hapticFeedback('medium');
                        deleteExpense(expense.id);
                        toast.success('تم حذف العملية');
                      }}
                      onRepeat={() => {
                        hapticFeedback('medium');
                        repeatExpense(expense.id);
                        toast.success('تم تكرار العملية بنجاح');
                      }}
                      onEdit={() => {
                        hapticFeedback('medium');
                        handleEdit(expense);
                      }}
                    />
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  icon={Activity}
                  title="لا تتوفر أي معاملات ضمن الفئة"
                  description="ابدأ بإنشاء أولى المصاريف لتبدأ عجائب الذكاء المالي وسلوكيات الادخار بالعمل معك!"
                  actionLabel="إضافة أول عملية"
                  onAction={() => setIsAddModalOpen(true)}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-850 text-center">
            <Link 
              to="/transactions" 
              className="inline-flex items-center gap-2 hover:gap-3 text-xs font-black text-indigo-500 hover:text-indigo-600 transition-all py-2 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span>استعراض شامل وجدولة كافة الفلاتر للعمليات</span>
              <ArrowRight size={14} className="rtl:rotate-180" />
            </Link>
          </div>
        </Card>
      </motion.div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
