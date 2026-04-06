import React, { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { Skeleton, TransactionSkeleton, CardSkeleton } from '../components/Skeleton';
import { parseISO, format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, CircleCheckBig, Wallet, CreditCard, Banknote, Building2, TrendingUp, Activity, CalendarClock, Flame, Zap, Repeat, Clock, Lightbulb, Trash2, ArrowRight, Edit2, RefreshCw, Target, Sparkles, ArrowRightLeft, ArrowUp, ArrowDown, PiggyBank } from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';
import { AIAdvisor } from '../components/AIAdvisor';
import { BudgetAlerts } from '../components/BudgetAlerts';
import { PaymentMethod, Expense, Category } from '../types';
import { motion, Variants, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'motion/react';
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
    setInitialGoalId
  } = useAppContext();
  const { insights, rollingBudget } = useBehavioralEngine();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const controls = useAnimation();
  const y = useMotionValue(0);
  const refreshOpacity = useTransform(y, [0, 100], [0, 1]);
  const refreshRotate = useTransform(y, [0, 100], [0, 360]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback('medium');
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    controls.start({ y: 0 });
    hapticFeedback('success');
  };

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.y > 100) {
      handleRefresh();
    } else {
      controls.start({ y: 0 });
    }
  };

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

  const recentTransactions = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses]);
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

  const forecastExpense = useMemo(() => 
    dailyAverage * daysInMonth,
  [dailyAverage, daysInMonth]);
  
  const totalMonthlyIncome = useMemo(() => 
    income.filter(i => {
      if (i.isTransfer) return false;
      const d = parseISO(i.date);
      return d >= rangeStart && d <= rangeEnd;
    }).reduce((sum, i) => sum + i.amount, 0),
  [income, rangeStart, rangeEnd]);

  const potentialSavings = useMemo(() => 
    Math.max(0, totalMonthlyIncome - totalMonthlyExpense),
  [totalMonthlyIncome, totalMonthlyExpense]);

  const upcomingBills = useMemo(() => 
    recurringExpenses
      .filter(r => isAfter(parseISO(r.nextDate), new Date()) && isBefore(parseISO(r.nextDate), addDays(new Date(), 14)))
      .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
      .slice(0, 3),
  [recurringExpenses]);

  const totalNetWorth = useMemo(() => 
    accounts.reduce((sum, acc) => sum + acc.balance, 0),
  [accounts]);

  const containerVariants = {
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
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="space-y-8 pb-10 relative">
      {/* Pull to refresh indicator */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center h-16 -mt-16 z-50"
        style={{ opacity: refreshOpacity }}
      >
        <motion.div
          style={{ rotate: refreshRotate }}
          className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg"
        >
          <RefreshCw size={24} className={cn("text-emerald-500", isRefreshing && "animate-spin")} />
        </motion.div>
      </motion.div>

      {/* Atmospheric Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0],
            y: [0, 60, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/5 blur-[100px]"
        />
      </div>

      {/* Monthly Financial Summary */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
      >
        {/* Income Card */}
        <motion.div variants={itemVariants} className="premium-card p-6 rounded-3xl relative overflow-hidden group flex flex-col justify-center">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <ArrowUp size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">الدخل الشهري</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                {formatCurrency(totalMonthlyIncome, currency)}
              </h3>
            </div>
          </div>
        </motion.div>

        {/* Expenses Card */}
        <motion.div variants={itemVariants} className="premium-card p-6 rounded-3xl relative overflow-hidden group flex flex-col justify-center">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-colors duration-500" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <ArrowDown size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">المصاريف الشهرية</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                {formatCurrency(totalMonthlyExpense, currency)}
              </h3>
            </div>
          </div>
        </motion.div>

        {/* Net Balance Card */}
        <motion.div variants={itemVariants} className="premium-card p-6 rounded-3xl relative overflow-hidden group flex flex-col justify-center">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <PiggyBank size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">الصافي (المتبقي)</p>
              <h3 className={cn(
                "text-2xl md:text-3xl font-black tracking-tighter",
                (totalMonthlyIncome - totalMonthlyExpense) >= 0 ? "text-slate-900 dark:text-white" : "text-rose-500"
              )}>
                {formatCurrency(totalMonthlyIncome - totalMonthlyExpense, currency)}
              </h3>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Financial Overview Dashboard */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        
        {/* Total Net Worth & Accounts (Takes 2 columns) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-slate-950 dark:bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-md flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10 mb-8">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-80">إجمالي الرصيد</span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mt-2">
              {formatCurrency(totalNetWorth, currency)}
            </h2>
          </div>

          <div className="relative z-10 flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
            {accounts.map((acc, idx) => (
              <motion.div 
                key={acc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="snap-start shrink-0 w-44 p-5 rounded-2xl bg-white/5 dark:bg-white/10 border border-white/10 backdrop-blur-md flex flex-col gap-4 shadow-xl cursor-pointer group/acc"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover/acc:rotate-12"
                    style={{ backgroundColor: acc.color }}
                  >
                    <DynamicIcon name={acc.icon || 'Wallet'} size={20} />
                  </div>
                  <span className="text-xs font-black text-slate-300 truncate uppercase tracking-widest">{acc.name}</span>
                </div>
                <div>
                  <p className="text-xl font-black text-white tracking-tighter">
                    {formatCurrency(acc.balance, currency)}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/acc:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Daily Budget & Spending (Takes 1 column) */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5 }}
          className="relative overflow-hidden rounded-3xl bg-slate-950 dark:bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl flex flex-col justify-between group"
        >
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors duration-700" />
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] group-hover:bg-emerald-500/10 transition-colors duration-700" />
          
          <div className="relative z-10 mb-8 flex flex-col items-start gap-4">
            <div className="w-full flex justify-between items-start">
              <div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-80">إنفاق اليوم</span>
                <h2 className={cn(
                  "text-4xl md:text-5xl font-black tracking-tighter mt-2 transition-all duration-500",
                  budgetStatus === 'red' ? "text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]" : budgetStatus === 'orange' ? "text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                )}>
                  {formatCurrency(todaySpending, currency)}
                </h2>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <Zap size={20} className={cn(
                  "transition-colors",
                  budgetStatus === 'red' ? "text-rose-500" : "text-emerald-500"
                )} />
              </div>
            </div>
            <div className="text-right w-full">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الميزانية اليومية</span>
              <p className="text-xl font-black text-white mt-1 tracking-tight">{formatCurrency(dailyBudget, currency)}</p>
            </div>
          </div>

          <div className="relative z-10 w-full space-y-5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-2">
                <Clock size={12} /> المتبقي لليوم
              </span>
              <span className={cn(
                "font-black text-sm",
                budgetStatus === 'red' ? "text-rose-500" : "text-emerald-500"
              )}>{formatCurrency(remainingDailyBudget, currency)}</span>
            </div>
            <div className="h-5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30 p-1 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (todaySpending / rollingBudget) * 100)}%` }}
                transition={{ duration: 1, ease: "circOut" }}
                className={cn(
                  "h-full rounded-full transition-all duration-500 relative overflow-hidden",
                  budgetStatus === 'red' ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" : budgetStatus === 'orange' ? "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                )}
              >
                <motion.div 
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
            
            {rollingBudgetEnabled && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 mt-4">
                <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">المتوفر فعلياً (تراكمي)</span>
                <span className="text-base font-black text-emerald-400 tracking-tight">{formatCurrency(rollingBudget, currency)}</span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Bento Grid Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Target Budget Card */}
        <motion.div variants={itemVariants} className="premium-card p-5 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative z-10 flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
              <Target size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">الهدف</span>
          </div>
          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">الميزانية المستهدفة</p>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              {formatCurrency(dailyBudget, currency)}
            </h4>
          </div>
        </motion.div>

        {/* Daily Average Card */}
        <motion.div variants={itemVariants} className="premium-card p-5 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
          <div className="relative z-10 flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
              <Activity size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">معدل</span>
          </div>
          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">معدل الإنفاق اليومي</p>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              {formatCurrency(dailyAverage, currency)}
            </h4>
          </div>
        </motion.div>

        {/* Weekly Total Card */}
        <motion.div variants={itemVariants} className="premium-card p-5 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
          <div className="relative z-10 flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 shadow-inner">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">أسبوعي</span>
          </div>
          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">إجمالي الأسبوع</p>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              {formatCurrency(weeklyTotal, currency)}
            </h4>
          </div>
        </motion.div>

        {/* No-Spend Streak Card */}
        <motion.div variants={itemVariants} className="premium-card p-5 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="relative z-10 flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shadow-inner">
              <Flame size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">إنجاز</span>
          </div>
          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">سلسلة توفير</p>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              {bestStreak} أيام
            </h4>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: AI & Insights (Takes 2 columns on XL) */}
        <div className="xl:col-span-2 space-y-6">
          {/* AI Advisor Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="w-full"
          >
            <motion.div variants={itemVariants}>
              <AIAdvisor />
            </motion.div>
          </motion.div>

          {/* Behavioral Insights Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="flex justify-between items-center px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">رؤى سلوكية</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تحليل ذكي لأنماط صرفك</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.slice(0, 2).map((insight, idx) => (
                <motion.div
                  key={insight.id || idx}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[180px]"
                >
                  <div className={cn(
                    "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity",
                    insight.type === 'warning' ? 'bg-rose-500' : 
                    insight.type === 'positive' ? 'bg-emerald-500' : 'bg-indigo-500'
                  )} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:rotate-6",
                        insight.type === 'warning' ? 'bg-rose-500 text-white shadow-rose-500/20' : 
                        insight.type === 'positive' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-indigo-500 text-white shadow-indigo-500/20'
                      )}>
                        {insight.type === 'warning' ? <Activity size={24} /> : <Zap size={24} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">{insight.title}</h4>
                      </div>
                    </div>
                    
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>

                  {insight.impact && (
                    <div className="relative z-10 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                      <div className="flex items-center gap-2 text-indigo-500">
                        <TrendingUp size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{insight.impact}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Transactions & Goals */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-6"
        >
          {/* Transactions Section */}
          <motion.div variants={itemVariants} className="premium-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm dark:shadow-none flex flex-col h-full max-h-[600px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">آخر العمليات</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أحدث 5 عمليات</p>
                </div>
              </div>
              <Link 
                to="/transactions" 
                className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group"
              >
                <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
              <AnimatePresence mode="popLayout">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((expense, idx) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
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
                          toast.success('تم تكرار العملية');
                        }}
                        onEdit={() => {
                          hapticFeedback('medium');
                          handleEdit(expense);
                        }}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-200 mb-4 animate-pulse">
                      <Activity size={32} />
                    </div>
                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">لا توجد عمليات مسجلة حالياً</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Savings Goals Overview - Bottom Row */}
      {goals.length > 0 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">أهداف الادخار</h3>
            </div>
            <Link to="/goals" className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl uppercase tracking-widest">إدارة الأهداف</Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.slice(0, 3).map(goal => {
              const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              const isCompleted = percentage >= 100;
              return (
                <motion.div 
                  key={goal.id} 
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="premium-card p-8 group transition-all duration-500 relative overflow-hidden"
                >
                  {isCompleted && (
                    <div className="absolute top-0 right-0 p-4">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="text-emerald-500 size-6" />
                      </motion.div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-8">
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-900 dark:text-white truncate max-w-[180px] tracking-tight">{goal.name}</h4>
                      <div className="flex items-center gap-2 text-slate-400">
                        <CalendarClock size={14} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">{goal.deadline}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-3xl font-black tracking-tighter leading-none",
                        isCompleted ? "text-emerald-500" : "text-primary-600"
                      )}>{Math.round(percentage)}%</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">مكتمل</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-5 rounded-full overflow-hidden p-1.5 shadow-inner border border-slate-200/5 dark:border-slate-700/5 relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={cn(
                          "h-full rounded-full relative overflow-hidden",
                          isCompleted ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "bg-primary-500 shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
                        )}
                      >
                        <motion.div 
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                      </motion.div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">تم تجميعه</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(goal.currentAmount, currency)}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الهدف</p>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-tighter">{formatCurrency(goal.targetAmount, currency)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setInitialGoalId(goal.id);
                        setIsAddModalOpen(true);
                      }}
                      className={cn(
                        "w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm",
                        isCompleted 
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" 
                          : "bg-primary-500/10 text-primary-600 hover:bg-primary-500/20"
                      )}
                    >
                      إضافة مساهمة
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
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
  
  // Dynamic values for buttons based on swipe
  const opacity = useTransform(x, [-180, -120, 0], [1, 0.8, 0]);
  const scale = useTransform(x, [-180, -120, 0], [1, 0.9, 0.8]);
  const editX = useTransform(x, [-180, 0], [0, 60]);
  const repeatX = useTransform(x, [-180, 0], [0, 40]);
  const deleteX = useTransform(x, [-180, 0], [0, 20]);

  return (
    <div className="relative overflow-hidden rounded-2xl group/item shadow-sm">
      {/* Action Buttons (Hidden behind) */}
      <div className="absolute inset-0 flex justify-end items-center px-4 gap-2 bg-slate-50 dark:bg-slate-800/50">
        {!expense.isTransfer && (
          <>
            <motion.button
              style={{ opacity, scale, x: editX }}
              onClick={onEdit}
              className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-95 transition-transform"
              title="تعديل"
            >
              <Edit2 size={16} />
            </motion.button>
            <motion.button
              style={{ opacity, scale, x: repeatX }}
              onClick={onRepeat}
              className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 active:scale-95 transition-transform"
              title="تكرار"
            >
              <Repeat size={16} />
            </motion.button>
          </>
        )}
        <motion.button
          style={{ opacity, scale, x: deleteX }}
          onClick={onDelete}
          className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 active:scale-95 transition-transform"
          title="حذف"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>

      {/* Main Content (Swipeable) */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x > -40) {
            x.set(0);
          } else if (info.offset.x < -80) {
            x.set(-160);
          }
        }}
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 p-4 flex items-center justify-between group active:bg-slate-50 dark:active:bg-slate-800/30 transition-all cursor-grab active:cursor-grabbing z-10"
      >
        {/* Swipe Hint Indicator */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-r-full opacity-0 group-hover/item:opacity-100 transition-opacity" />

        <div className="flex items-center gap-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-700 group-hover:scale-110 group-hover:rotate-6"
            style={{ backgroundColor: expense.isTransfer ? '#6366f1' : (category?.color || '#94a3b8') }}
          >
            {expense.isTransfer ? (
              <ArrowRightLeft size={20} />
            ) : (
              <DynamicIcon name={category?.icon || 'CircleHelp'} size={20} />
            )}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mb-0.5">{expense.note || (expense.isTransfer ? 'تحويل' : category?.name)}</h4>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{expense.isTransfer ? 'تحويل مالي' : (category?.name || 'غير مصنف')}</span>
              {accountName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>{accountName}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-left flex flex-col items-end">
          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">
            {formatCurrency(expense.amount, currency)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {format(parseISO(expense.date), 'dd MMM', { locale: ar })}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
