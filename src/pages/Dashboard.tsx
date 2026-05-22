import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { Skeleton, TransactionSkeleton } from '../components/Skeleton';
import { parseISO, format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  Activity, 
  CalendarClock, 
  Flame, 
  Zap, 
  Repeat, 
  Clock, 
  Lightbulb, 
  Trash2, 
  ArrowRight, 
  Edit2, 
  Target, 
  Sparkles, 
  ArrowRightLeft, 
  ArrowUp, 
  ArrowDown, 
  PiggyBank,
  CheckCircle2,
  HelpCircle,
  Gem,
  Compass,
  BellRing,
  Award,
  Percent,
  Baby,
  UtensilsCrossed,
  House,
  HeartPulse,
  BusFront,
  Coffee,
  Check
} from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Expense, Category } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform, Variants } from 'motion/react';
import { Link } from 'react-router-dom';
import { useBehavioralEngine } from '../hooks/useBehavioralEngine';

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
    applyTunisianFamilyTemplate
  } = useAppContext();
  const { insights, rollingBudget } = useBehavioralEngine();

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddModalOpen(true);
  };

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
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
        const d = parseISO(e.date);
        return d >= startOfWeek && d <= now;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

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
      const d = parseISO(e.date);
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
      const d = parseISO(i.date);
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
    <div className="space-y-6 pb-12 relative mt-2 px-1">
      
      {/* Tunisian Family Template Migration Banner */}
      {!hasTunisianFamilyCategories && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-cyan-600 via-primary-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 shadow-md border border-white/10 relative overflow-hidden text-right"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🇹🇳</span>
                <span className="bg-white/20 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full backdrop-blur-md">
                  ميزة عائلية جديدة
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black leading-snug">
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
              className="self-start md:self-auto bg-white text-primary-600 hover:bg-neutral-100 font-extrabold text-xs md:text-sm px-6 py-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles size={16} />
              تحديث التصنيفات والميزانية الآن
            </button>
          </div>
        </motion.div>
      )}

      {/* 1. Header with Greeting & Hot Streak widget */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-14 h-14 rounded-2xl border-2 border-emerald-500/20 overflow-hidden shadow-md shrink-0 bg-slate-100 dark:bg-slate-800"
          >
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0" 
              alt="avatar" 
              className="w-full h-full object-cover" 
            />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                {format(new Date(), 'EEEE، d MMMM', { locale: ar })}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <Clock size={10} className="text-indigo-500" />
                <span>دورة الميزانية النشطة</span>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              مرحباً، {userName || 'صديقي الملتزم'} <span className="inline-block animate-bounce">👋</span>
            </h1>
          </div>
        </div>

        {/* Dynamic Interactive Streak Feature */}
        <motion.div 
          onClick={() => {
            hapticFeedback('medium');
            if(!streakCheckedIn) {
              setStreakCheckedIn(true);
              toast.success('تم احتساب نقاط التزام اليوم! حافظ على عادتك 🔥');
            }
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer border transition-all duration-300 shrink-0",
            streakCheckedIn 
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-md shadow-amber-500/5 glow"
              : "bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-amber-500/30 text-slate-700 dark:text-slate-300"
          )}
        >
          <div className="relative">
            <Flame className={cn("size-6 scale-110", streakCheckedIn ? "text-amber-500 fill-amber-500 animate-pulse" : "text-slate-400")} />
            {streakCheckedIn && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5">سلسلة الالتزام</div>
            <div className="text-xs font-black flex items-center gap-1">
              <span>{bestStreak ? `${bestStreak} يوم` : '0 أيام'}</span>
              <span className="text-[10px] font-black underline uppercase text-indigo-500">
                {streakCheckedIn ? 'تم التسجيل ✓' : 'تسجيل التزام اليوم'}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Promo banner for Savings Indicators */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-emerald-500/10 dark:bg-emerald-500/5 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
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

      {/* 🇹🇳 Quick Tunisian Family Ledger */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-5 md:p-6 rounded-3xl border border-slate-200/55 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md shadow-sm relative overflow-hidden text-right space-y-5"
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Title & Account Picker */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-0.5">
            <span className="bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[9px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full">
              تسجيل سريع فوري في ثانية ثانية
            </span>
            <h3 className="text-md font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5 justify-end">
              <span>الدفتر العائلي للتسجيل السريع لمصروف البيت</span>
              <Sparkles className="text-amber-500 size-4" />
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              اختر أحد الأزرار الجاهزة للمصاريف اليومية، أو أدخل مبلغاً مخصصاً واضغط لحفظه فورياً دون مغادرة اللوحة.
            </p>
          </div>
          
          {/* Account Selection Pills */}
          {accounts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end w-full sm:w-auto">
              <span className="text-[9px] font-bold text-slate-400 self-center ml-1">الدفع من:</span>
              {accounts.map(acc => {
                const isSelected = quickAccountId === acc.id;
                return (
                  <button
                    type="button"
                    key={acc.id}
                    onClick={() => { hapticFeedback('light'); setQuickAccountId(acc.id); }}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[9px] font-black transition-all cursor-pointer border",
                      isSelected 
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950"
                        : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                    )}
                  >
                    {acc.name} ({formatCurrency(acc.balance, currency)})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Ready Tunisian Presets */}
        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">نفقات متكررة مسبقة الضبط (اضغط للتعبئة وحفظ المعاملة فوراً)</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'قفة الخضار واللحم', amount: '25', desc: 'قضية من السوق الأسبوعي', categoryName: 'قضية السوق والقفة', icon: UtensilsCrossed, color: 'hover:border-emerald-500/30 hover:bg-emerald-500/5' },
              { label: 'كوش וחليب للبيبي', amount: '52', desc: 'مشتريات الصيدلية للرضيع', categoryName: 'لوازم ومصروف الرضيع', icon: Baby, color: 'hover:border-blue-500/30 hover:bg-blue-500/5' },
              { label: 'فاتورة ضوء ستاغ', amount: '65', desc: 'فاتورة STEG', categoryName: 'البيت والفواتير', icon: House, color: 'hover:border-amber-500/30 hover:bg-amber-500/5' },
              { label: 'فيزيتا طبيب الأطفال', amount: '50', desc: 'عيادة الطبيب وتلاقيح الرعاية الصحة', categoryName: 'صحة وطبيب الأطفال', icon: HeartPulse, color: 'hover:border-rose-500/30 hover:bg-rose-500/5' },
              { label: 'قهوة سريعة وشاي', amount: '4.5', desc: 'قهوة ومقهى فنجان', categoryName: 'ترفيه ومقهى ومواسم', icon: Coffee, color: 'hover:border-indigo-500/30 hover:bg-indigo-500/5' },
              { label: 'أجرة نقل أو لواج', amount: '12', desc: 'مواصلات أو وقود سيارة لواج', categoryName: 'نقل وتنقل', icon: BusFront, color: 'hover:border-purple-500/30 hover:bg-purple-500/5' },
            ].map((preset, index) => {
              const Icon = preset.icon;
              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => {
                    hapticFeedback('medium');
                    setQuickAmount(preset.amount);
                    setQuickDescription(preset.label);
                    setQuickSubcategory(preset.desc);
                    const matchingCat = categories.find(c => c.name.includes(preset.categoryName));
                    if (matchingCat) {
                      setQuickCategoryId(matchingCat.id);
                    }
                  }}
                  className={cn(
                    "p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-right flex flex-col justify-between space-y-1.5 transition-all text-ellipsis overflow-hidden duration-250 cursor-pointer hover:scale-102 hover:shadow-sm",
                    preset.color
                  )}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-mono font-black text-slate-800 dark:text-slate-200">{preset.amount} د.ت</span>
                    <Icon size={12} className="text-slate-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none truncate">{preset.label}</p>
                    <p className="text-[8px] text-slate-400 font-bold truncate">{preset.categoryName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form panel for details edit & instant save */}
        <form onSubmit={handleQuickAddSubmit} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          
          {/* Amount field (3 cols) */}
          <div className="space-y-1.5 md:col-span-3 text-right">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">المبلغ (د.ت)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              required
              placeholder="مثال: 15.500"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-right"
            />
          </div>

          {/* Description field (3 cols) */}
          <div className="space-y-1.5 md:col-span-3 text-right">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">البيان / الوصف</label>
            <input
              type="text"
              placeholder="مثال: قضية خضار"
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-right"
            />
          </div>

          {/* Category selection field (3 cols) */}
          <div className="space-y-1.5 md:col-span-3 text-right">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">التصنيف</label>
            <select
              value={quickCategoryId}
              onChange={(e) => {
                hapticFeedback('light');
                setQuickCategoryId(e.target.value);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-right"
            >
              <option value="" disabled>اختر فئة...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Button Submit (3 cols) */}
          <div className="md:col-span-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white dark:text-slate-950 dark:bg-primary-400 dark:hover:bg-primary-300 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer h-10"
            >
              <Plus size={14} />
              <span>تسجيل فوري للمصروف</span>
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* 2. Bento Grid Layout - Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bento Card 1: Main Sliding Portfolio Panel (left 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl min-h-[470px] flex flex-col justify-between">
            {/* Ambient FinTech Neon Glows */}
            <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse-soft" />
            <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-[110px] pointer-events-none" />
            
            {/* Fine Cybernetic Grid Pattern Overlay to add precision look */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Sliding Glassy Tab Menu Bar */}
              <div className="flex bg-slate-950/40 backdrop-blur-xl p-1 rounded-2xl border border-white/10 max-w-sm w-full sm:w-auto">
                {[
                  { id: 'wallet', label: 'المحفظة الذكية', icon: Wallet },
                  { id: 'anatomy', label: 'توزيع الميزانية', icon: Gem },
                  { id: 'savings', label: 'مؤشرات التوفير', icon: PiggyBank },
                ].map((tab) => {
                  const isActive = heroTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        hapticFeedback('light');
                        setHeroTab(tab.id as any);
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all relative overflow-hidden whitespace-nowrap",
                        isActive 
                          ? "bg-white text-slate-950 shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <tab.icon size={13} className={isActive ? "text-emerald-500" : "text-slate-400"} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Indicator */}
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-400 pl-4 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>عضوية المسار الممتاز</span>
              </div>
            </div>

            {/* Tab Contents with AnimatePresence */}
            <div className="relative z-10 my-6 flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {heroTab === 'wallet' && (
                  <motion.div
                    key="wallet"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 flex flex-col h-full justify-between"
                  >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-950/20 p-5 rounded-3xl border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1 block">إجمالي صافي الأصول</span>
                        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter shrink-0 flex items-center gap-2">
                          <AnimatedNumber value={totalNetWorth} currency={currency} />
                        </h2>
                      </div>

                      {/* Cashflow quick ratio */}
                      <div className="flex gap-4 border-r border-white/10 pr-6 rtl:md:border-r rtl:md:pr-6 rtl:md:border-l-0 rtl:md:pl-0">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 text-emerald-400">
                            <ArrowDown size={14} className="animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">مداخيل الدورة</span>
                          </div>
                          <p className="text-sm sm:text-base font-black text-white tracking-tight">{formatCurrency(totalMonthlyIncome, currency)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 text-rose-400">
                            <ArrowUp size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">تكاليف العمليات</span>
                          </div>
                          <p className="text-sm sm:text-base font-black text-white tracking-tight">{formatCurrency(totalMonthlyExpense, currency)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Bank Account Cards Deck */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">قائمة الخزائن والحسابات</span>
                        {activeAccount && (
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                            {((activeAccount.balance / (totalNetWorth || 1)) * 100).toFixed(0)}% من الثروة الكلية
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                        {accounts.map((acc, index) => {
                          const isSelected = selectedAccountId ? selectedAccountId === acc.id : accounts[0]?.id === acc.id;
                          
                          // Exquisite metallic layouts for account cards
                          const themes = [
                            { bg: "bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 border-white/10 text-white" },
                            { bg: "bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 border-indigo-500/20 text-indigo-100" },
                            { bg: "bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/25 text-emerald-100" },
                            { bg: "bg-gradient-to-tr from-amber-950 via-slate-900 to-slate-950 border-amber-500/20 text-amber-100" }
                          ];
                          const activeTheme = themes[index % themes.length];

                          return (
                            <motion.div
                              key={acc.id}
                              onClick={() => {
                                hapticFeedback('light');
                                setSelectedAccountId(acc.id);
                              }}
                              whileHover={{ y: -4, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "min-w-[150px] sm:min-w-[180px] p-4 rounded-2xl border text-right cursor-pointer shrink-0 transition-all duration-300 relative overflow-hidden",
                                isSelected 
                                  ? "bg-white text-slate-900 border-white shadow-xl shadow-emerald-500/5"
                                  : cn(activeTheme.bg, "hover:bg-slate-900/80")
                              )}
                            >
                              {/* Reflective light strip on top of selected card */}
                              {isSelected && (
                                <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />
                              )}
                              
                              <div className="absolute top-1/2 left-0 -translate-y-1/2 translate-x-12 w-24 h-24 bg-gradient-to-tr from-transparent to-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                              
                              <div className="flex items-center justify-between mb-4">
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center border",
                                  isSelected ? "bg-slate-100 text-slate-900 border-slate-200" : "bg-slate-800 text-white border-slate-700"
                                )}>
                                  <DynamicIcon name={acc.icon || 'Wallet'} size={14} />
                                </div>

                                {/* Custom Gold Credit Card Chip Mockup */}
                                <div className="w-6 h-4.5 rounded bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-400 border border-amber-600/30 flex flex-col justify-between p-1 opacity-75">
                                  <div className="w-full h-[0.5px] bg-amber-650/40" />
                                  <div className="w-1/2 h-full border-r border-amber-650/40" />
                                </div>
                              </div>

                              <div className="mt-4">
                                <h5 className={cn("text-[8px] font-black uppercase tracking-wider mb-0.5", isSelected ? "text-slate-500" : "text-slate-400")}>{acc.name} </h5>
                                <p className="text-sm font-black tracking-tight leading-none">{formatCurrency(acc.balance, currency)}</p>
                                <div className={cn("text-[7px] font-mono mt-1 tracking-widest opacity-60", isSelected ? "text-slate-400" : "text-slate-500")}>
                                  •••• {1200 + index * 452}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {heroTab === 'anatomy' && (
                  <motion.div
                    key="anatomy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        <Gem className="size-4.5 text-indigo-400 animate-pulse" />
                        الهيكل التوزيعي المتزن (50/30/20)
                      </h4>
                      <p className="text-[11px] text-slate-450 font-medium leading-relaxed mt-1">
                        تنظيم توزيع نفقاتك لضمان تحقيق كلي للتوافق التمويلي ورفع الادخار التراكمي.
                      </p>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Needs */}
                      <div className="space-y-1 bg-slate-950/25 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-indigo-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" /> الاحتياجات الضرورية (50%)
                          </span>
                          <span className="font-black text-white font-mono">{formatCurrency(typeSpent.need, currency)}</span>
                        </div>
                        <div className="h-2 bg-slate-950/70 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(100, (typeSpent.need / (totalMonthlyExpense || 1)) * 100)}%` }}
                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-lg" 
                          />
                        </div>
                      </div>

                      {/* Wants */}
                      <div className="space-y-1 bg-slate-950/25 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> الرغبات والكماليات (30%)
                          </span>
                          <span className="font-black text-white font-mono">{formatCurrency(typeSpent.want, currency)}</span>
                        </div>
                        <div className="h-2 bg-slate-950/70 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(100, (typeSpent.want / (totalMonthlyExpense || 1)) * 100)}%` }}
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-lg" 
                          />
                        </div>
                      </div>

                      {/* Savings */}
                      <div className="space-y-1 bg-slate-950/25 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-emerald-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> الادخار والاستثمار الذكي (20%)
                          </span>
                          <span className="font-black text-white font-mono">{formatCurrency(typeSpent.saving, currency)}</span>
                        </div>
                        <div className="h-2 bg-slate-950/70 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(100, (typeSpent.saving / (totalMonthlyExpense || 1)) * 100)}%` }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-lg" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/30 rounded-2xl border border-white/5 flex items-start gap-2 text-[10px] text-slate-300 leading-normal">
                      <HelpCircle size={13} className="shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        المقاييس تُبني على صافي الدخل. ننصح بعدم زيادة الرغبات عن 30% لدعم عجلة الادخار والاستثمار الفردي.
                      </span>
                    </div>
                  </motion.div>
                )}

                {heroTab === 'savings' && (
                  <motion.div
                    key="savings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        <Target className="size-4.5 text-emerald-450" />
                        مستهدفات الادخار النشطة
                      </h4>
                      <Link to="/goals" className="text-[9px] font-black text-emerald-400 underline uppercase tracking-widest">لوحة الأهداف</Link>
                    </div>

                    {goals.length > 0 ? (
                      <div className="space-y-4">
                        {goals.slice(0, 2).map((goal) => {
                          const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
                          return (
                            <div key={goal.id} className="p-3.5 bg-slate-950/30 rounded-2xl border border-white/5 space-y-2.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-white flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  {goal.name}
                                </span>
                                <span className="text-xs font-bold text-emerald-400 font-mono">{percentage.toFixed(0)}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-950/65 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                />
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>المحقق: {formatCurrency(goal.currentAmount, currency)}</span>
                                <span>الهدف: {formatCurrency(goal.targetAmount, currency)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-950/20 rounded-3xl border border-white/5">
                        <p className="text-xs font-bold text-slate-400 max-w-xs mx-auto mb-4">ليس لديك أهداف ادخار مسجلة حالياً. ابدأ بالتخطيط لمشاريعك المستقبلية!</p>
                        <Link to="/goals" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all inline-block shadow-md">إنشاء هدف ادخار</Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Actions Grid */}
            <div className="relative z-10 grid grid-cols-4 gap-2 pt-4 border-t border-slate-800/60">
              {[
                { icon: Plus, label: 'إضافة عملية', color: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/10', action: () => setIsAddModalOpen(true) },
                { icon: ArrowRightLeft, label: 'تحويل سريع', color: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/10', action: () => { setEditingExpense({ isTransfer: true } as any); setIsAddModalOpen(true); } },
                { icon: Target, label: 'الأهداف', color: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/10', link: '/goals' },
                { icon: Sparkles, label: 'المساعد', color: 'bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white border border-violet-500/10', link: '/assistant' },
              ].map((item, idx) => (
                <motion.div key={idx} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                  {item.link ? (
                    <Link to={item.link} className={cn("w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-black tracking-tight transition-all duration-300", item.color)}>
                      <item.icon size={15} />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <button onClick={item.action} className={cn("w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-black tracking-tight transition-all duration-300", item.color)}>
                      <item.icon size={15} />
                      <span>{item.label}</span>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bento Card 2: Interactive Smart Radar & Challenge speed dial (right 1 column) */}
        <div className="flex flex-col gap-6">
          <motion.div
            variants={itemVariants}
            className="bg-slate-900 border border-slate-800 p-6 sm:p-7 rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[470px]"
          >
            {/* Ambient Background Gradient based on limits */}
            <div className={cn(
              "absolute inset-0 opacity-15 blur-[100px] pointer-events-none transition-all duration-1000",
              budgetStatus === 'red' ? "bg-rose-500" : budgetStatus === 'orange' ? "bg-amber-500" : "bg-emerald-500"
            )} />

            {/* Title Block with Interactive Tooltip */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">مؤشرات الاستهلاك لليوم</span>
                <h3 className="text-lg font-black text-white mt-1">الرادار المالي النشط</h3>
              </div>
              <motion.button
                onClick={() => { hapticFeedback('light'); setShowChallengeHelp(!showChallengeHelp); }}
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400"
              >
                <HelpCircle size={15} />
              </motion.button>
            </div>

            {/* Circular glowing indicator */}
            <div className="relative z-10 py-2 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG glowing circle border */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="88" 
                    cy="88" 
                    r="76" 
                    className="stroke-slate-800/60 fill-none" 
                    strokeWidth="8"
                  />
                  <motion.circle 
                    cx="88" 
                    cy="88" 
                    r="76" 
                    className={cn(
                      "fill-none transition-all duration-1000",
                      budgetStatus === 'red' ? "stroke-rose-500" : budgetStatus === 'orange' ? "stroke-amber-500" : "stroke-emerald-500"
                    )}
                    style={{
                      filter: budgetStatus === 'red' 
                        ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.35))' 
                        : budgetStatus === 'orange'
                        ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.35))'
                        : 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.35))'
                    }}
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 76}`}
                    initial={{ strokeDashoffset: `${2 * Math.PI * 76}` }}
                    animate={{ strokeDashoffset: `${2 * Math.PI * 76 * (1 - Math.min(1, todaySpending / (rollingBudget || 1)))}` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Inner content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  {budgetStatus === 'green' ? (
                    <Award className="size-4.5 text-emerald-450 mb-0.5 animate-bounce" />
                  ) : budgetStatus === 'orange' ? (
                    <Compass className="size-4.5 text-amber-450 mb-0.5" />
                  ) : (
                    <Flame className="size-4.5 text-rose-455 mb-0.5 animate-pulse" />
                  )}
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 leading-none">مجموع المنصرف</span>
                  <div className="text-2xl font-black text-white leading-tight my-0.5 tracking-tight font-sans">
                    <AnimatedNumber value={todaySpending} currency={currency} />
                  </div>
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                    الحد المرن: {formatCurrency(dailyBudget, currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Gamified Challenge Box */}
            <div className="relative z-10 space-y-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-300 tracking-wider">
                  <Zap size={12} className="text-amber-500" />
                  <span>تحدي الحد اليومي المرن</span>
                </div>
                {rollingBudgetEnabled && (
                  <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest pl-3">
                    ميزانية تراكمية نشطة
                  </span>
                )}
              </div>

              <div className={cn(
                "p-3.5 rounded-2xl border transition-all duration-500",
                budgetStatus === 'red' 
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-200" 
                  : budgetStatus === 'orange'
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                  : "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
              )}>
                <h5 className="text-xs font-black">{currentChallenge.title}</h5>
                <p className="text-[10px] text-slate-400 leading-normal mt-1">{currentChallenge.desc}</p>
              </div>

              {/* Remaining progress slider stats */}
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-slate-400 font-bold">المتبقي الصافي لليوم:</span>
                <span className={cn(
                  "font-black text-sm font-mono tracking-tight",
                  budgetStatus === 'red' ? "text-rose-400" : "text-emerald-400"
                )}>
                  {formatCurrency(remainingDailyBudget, currency)}
                </span>
              </div>
            </div>

            {/* Interactive help tooltip */}
            <AnimatePresence>
              {showChallengeHelp && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-x-4 top-16 z-30 p-4 bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-800 rounded-2xl shadow-2xl text-xs text-slate-300 leading-relaxed space-y-2 text-right pointer-events-auto"
                >
                  <p className="font-black text-white">📈 كيف يعمل الرادار المالي النشط؟</p>
                  <p>اللون الأخضر يعني أنك في منطقة الأمان اليومية التامة. البرتقالي جرس تحذير خفيف، والأحمر يوضح أنك تخطيت الحد المسموح.</p>
                  <button 
                    onClick={() => setShowChallengeHelp(false)} 
                    className="w-full text-center py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors border border-white/5"
                  >
                    مفهوم!
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

      </div>

      {/* 3. Interactive AI Behavioral Advisor Banner Row */}
      {insights.length > 0 && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-transparent border border-indigo-500/15 p-6 rounded-[2rem] shadow-md relative overflow-hidden"
        >
          {/* Animated sparkles element */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 pointer-events-none text-indigo-500/20">
            <Sparkles size={100} className="animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <Lightbulb size={24} className="animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">المستشار المالي الذكي (AI Insight)</h4>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">سلوكي مخصص</span>
                </div>
                {/* Active Insight displaying */}
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-2">
                  {insights[activeInsightIdx]?.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold mt-1 max-w-2xl">
                  {insights[activeInsightIdx]?.description} {insights[activeInsightIdx]?.impact && <span className="font-black text-slate-500 dark:text-indigo-300"> ({insights[activeInsightIdx]?.impact})</span>}
                </p>
              </div>
            </div>

            {/* Quick Action Interactive Slides */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              {insights.length > 1 && (
                <button
                  onClick={() => {
                    hapticFeedback('light');
                    setActiveInsightIdx((prev) => (prev + 1) % insights.length);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-black transition-all"
                >
                  التالي ({activeInsightIdx + 1}/{insights.length})
                </button>
              )}
              <Link
                to="/assistant"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-500/20 flex-1 md:flex-none text-center"
              >
                استشارة كاملة
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. Interactive Transaction List with live Filters */}
      <motion.div 
        variants={itemVariants}
        className="premium-card p-6 sm:p-7 rounded-[2.5rem] flex flex-col min-h-[500px]"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/65">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">آخر العمليات المكتملة</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">اسحب على أي معاملة لتكرارها أو حذفها</p>
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
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all",
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
        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
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
                  <MemoizedSwipeableTransactionItem 
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
              <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 rounded-2xl flex items-center justify-center mb-4">
                  <Activity size={28} />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">لا تتوفر أي معاملات ضمن الفئة</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1 font-semibold leading-relaxed">
                  ابدأ بإنشاء أولى المصاريف لتبدأ عجائب الذكاء المالي وسلوكيات الادخار بالعمل معك!
                </p>
              </div>
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
      </motion.div>

    </div>
  );
};

interface SwipeableTransactionItemProps {
  expense: Expense;
  category: Category | undefined;
  currency: string;
  accountName?: string;
  onDelete: () => void;
  onRepeat: () => void;
  onEdit: () => void;
}

const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({ 
  expense, 
  category, 
  currency, 
  accountName,
  onDelete,
  onRepeat,
  onEdit
}) => {
  const x = useMotionValue(0);
  
  // Dynamic action values based on drag gesture
  const opacity = useTransform(x, [-160, -120, 0], [1, 0.8, 0]);
  const scale = useTransform(x, [-160, -120, 0], [1, 0.9, 0.8]);
  const editX = useTransform(x, [-160, 0], [0, 60]);
  const repeatX = useTransform(x, [-160, 0], [0, 40]);
  const deleteX = useTransform(x, [-160, 0], [0, 20]);

  return (
    <div className="relative overflow-hidden rounded-2xl group/item shadow-xs border border-transparent hover:border-slate-100 dark:hover:border-slate-800/80 transition-all duration-350">
      {/* Background Actions Drawer */}
      <div className="absolute inset-0 flex justify-end items-center px-4 gap-2.5 bg-slate-50 dark:bg-slate-800/30">
        {!expense.isTransfer && (
          <>
            <motion.button
              style={{ opacity, scale, x: editX }}
              onClick={onEdit}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="تعديل العملية"
            >
              <Edit2 size={15} />
            </motion.button>
            <motion.button
              style={{ opacity, scale, x: repeatX }}
              onClick={onRepeat}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="تكرار المعاملة"
            >
              <Repeat size={15} />
            </motion.button>
          </>
        )}
        <motion.button
          style={{ opacity, scale, x: deleteX }}
          onClick={onDelete}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 hover:scale-105 active:scale-95 transition-transform shrink-0"
          title="حذف العملية"
        >
          <Trash2 size={15} />
        </motion.button>
      </div>

      {/* Main Swipeable Item */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.06}
        onDragEnd={(_, info) => {
          if (info.offset.x > -40) {
            x.set(0);
          } else if (info.offset.x < -80) {
            x.set(-160);
          }
        }}
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 p-4 flex items-center justify-between group cursor-grab active:cursor-grabbing z-10 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
      >
        {/* Visual Swipe Left Hint line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-slate-100 dark:bg-slate-800 rounded-r-lg opacity-0 group-hover/item:opacity-100 transition-all duration-300" />

        <div className="flex items-center gap-4">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shrink-0"
            style={{ backgroundColor: expense.isTransfer ? '#6366f1' : (category?.color || '#94a3b8') }}
          >
            {expense.isTransfer ? (
              <ArrowRightLeft size={18} />
            ) : (
              <DynamicIcon name={category?.icon || 'HelpCircle'} size={18} />
            )}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1 leading-snug">
              {expense.note || (expense.isTransfer ? 'عملية تحويل' : category?.name)}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              <span>{expense.isTransfer ? 'حساب في الحساب' : (category?.name || 'غير مجدول')}</span>
              {accountName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>{accountName}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-left flex flex-col items-end shrink-0">
          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(expense.amount, currency)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            {format(parseISO(expense.date), 'dd MMM', { locale: ar })}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

const MemoizedSwipeableTransactionItem = React.memo(SwipeableTransactionItem, (prevProps, nextProps) => {
  return (
    prevProps.expense.id === nextProps.expense.id &&
    prevProps.expense.amount === nextProps.expense.amount &&
    prevProps.expense.date === nextProps.expense.date &&
    prevProps.expense.categoryId === nextProps.expense.categoryId &&
    prevProps.expense.note === nextProps.expense.note &&
    prevProps.currency === nextProps.currency &&
    prevProps.accountName === nextProps.accountName &&
    prevProps.category?.id === nextProps.category?.id
  );
});

export default Dashboard;
