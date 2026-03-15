import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import { Skeleton, CardSkeleton } from '../components/Skeleton';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Brush } from 'recharts';
import { DynamicIcon } from '../components/DynamicIcon';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3, ArrowUpRight, ArrowDownRight, Activity, Target, ShieldCheck } from 'lucide-react';

const Analytics = () => {
  const { expenses, income = [], categories, currency, budget } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const [rangeType, setRangeType] = useState<'monthly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const dateRange = useMemo(() => {
    if (rangeType === 'monthly') {
      const [year, month] = selectedMonth.split('-').map(Number);
      return {
        start: startOfMonth(new Date(year, month - 1)),
        end: endOfMonth(new Date(year, month - 1))
      };
    } else {
      return {
        start: parseISO(startDate),
        end: parseISO(endDate)
      };
    }
  }, [rangeType, selectedMonth, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = parseISO(e.date);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [expenses, dateRange]);

  const filteredIncome = useMemo(() => {
    return income.filter(i => {
      const d = parseISO(i.date);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [income, dateRange]);

  const totalMonthlyExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMonthlyIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
  const netBalance = totalMonthlyIncome - totalMonthlyExpense;

  const categoryData = useMemo(() => {
    return categories.map(cat => {
      const amount = filteredExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return { id: cat.id, name: cat.name, value: amount, color: cat.color, icon: cat.icon };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [filteredExpenses, categories]);

  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const expenseAmount = filteredExpenses
        .filter(e => e.date.startsWith(dateStr))
        .reduce((sum, e) => sum + e.amount, 0);
      const incomeAmount = filteredIncome
        .filter(i => i.date.startsWith(dateStr))
        .reduce((sum, i) => sum + i.amount, 0);
      return {
        date: format(day, 'dd', { locale: ar }),
        fullDate: format(day, 'dd MMMM', { locale: ar }),
        expenseAmount,
        incomeAmount
      };
    });
  }, [filteredExpenses, filteredIncome, dateRange]);

  const highestExpenseDay = useMemo(() => {
    if (dailyData.length === 0) return { date: '-', expenseAmount: 0, fullDate: '-' };
    return dailyData.reduce((max, day) => day.expenseAmount > max.expenseAmount ? day : max, dailyData[0]);
  }, [dailyData]);

  const averageDailyExpense = totalMonthlyExpense / (dailyData.length || 1);

  const prevMonthDateRange = useMemo(() => {
    const d = new Date(dateRange.start);
    d.setMonth(d.getMonth() - 1);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d)
    };
  }, [dateRange]);

  const prevMonthExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = parseISO(e.date);
      return d >= prevMonthDateRange.start && d <= prevMonthDateRange.end;
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, prevMonthDateRange]);

  const prevMonthIncome = useMemo(() => {
    return income.filter(i => {
      const d = parseISO(i.date);
      return d >= prevMonthDateRange.start && d <= prevMonthDateRange.end;
    }).reduce((sum, i) => sum + i.amount, 0);
  }, [income, prevMonthDateRange]);

  const expenseDiff = prevMonthExpenses > 0 ? ((totalMonthlyExpense - prevMonthExpenses) / prevMonthExpenses) * 100 : 0;
  const incomeDiff = prevMonthIncome > 0 ? ((totalMonthlyIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0;

  const monthlyData = useMemo(() => {
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const expenseAmount = expenses
        .filter(e => e.date.startsWith(monthStr))
        .reduce((sum, e) => sum + e.amount, 0);
      const incomeAmount = income
        .filter(i => i.date.startsWith(monthStr))
        .reduce((sum, i) => sum + i.amount, 0);
      
      return {
        month: format(month, 'MMM', { locale: ar }),
        fullMonth: format(month, 'MMMM yyyy', { locale: ar }),
        expense: expenseAmount,
        income: incomeAmount,
        net: incomeAmount - expenseAmount
      };
    });
  }, [expenses, income]);

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
      className="space-y-3 md:space-y-6 pb-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
        <div className="space-y-0.5 md:space-y-1">
          <h1 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            التحليل <span className="text-primary-500">المالي</span>
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
            نظرة عميقة على مصاريفك ودخلك وتوزيع ميزانيتك
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <button
              onClick={() => setRangeType('monthly')}
              className={cn(
                "px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all",
                rangeType === 'monthly' ? "bg-primary-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              )}
            >
              شهري
            </button>
            <button
              onClick={() => setRangeType('custom')}
              className={cn(
                "px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all",
                rangeType === 'custom' ? "bg-primary-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              )}
            >
              مخصص
            </button>
          </div>
          
          {rangeType === 'monthly' ? (
            <div className="relative group">
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary-500 group-focus-within:text-primary-600 transition-colors" size={14} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pr-8 pl-2.5 py-1.5 md:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-[9px] md:text-[11px] font-black uppercase tracking-widest shadow-sm font-mono"
              />
            </div>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 md:px-3 md:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-[9px] md:text-[11px] font-black uppercase tracking-widest shadow-sm font-mono"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 md:px-3 md:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-[9px] md:text-[11px] font-black uppercase tracking-widest shadow-sm font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* 1. Top Level Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px] md:h-[160px] rounded-2xl md:rounded-3xl" />
            <Skeleton className="h-[120px] md:h-[160px] rounded-2xl md:rounded-3xl" />
            <Skeleton className="h-[120px] md:h-[160px] rounded-2xl md:rounded-3xl" />
          </>
        ) : (
          <>
            <motion.div variants={itemVariants} className={cn(
          "rounded-2xl md:rounded-3xl p-3 md:p-5 text-white shadow-lg relative overflow-hidden group",
          netBalance >= 0 ? "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200/20" : "bg-gradient-to-br from-rose-500 to-red-700 shadow-rose-200/20"
        )}>
          <div className="absolute -right-10 -top-10 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-1 md:space-y-2">
            <div className="flex items-center gap-2 opacity-80">
              <Target className="size-3.5 md:size-4" />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest">الصافي (التوفير المحتمل)</span>
            </div>
            <div className="text-xl md:text-3xl font-black tracking-tighter">
              {formatCurrency(Math.abs(netBalance), currency)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold bg-white/20 backdrop-blur-md w-fit px-2 py-0.5 rounded-full">
                <Activity className="size-2.5 md:size-3" />
                <span>{netBalance >= 0 ? 'فائض مالي ممتاز' : 'عجز مالي يحتاج انتباه'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl md:rounded-3xl p-3 md:p-5 text-white shadow-lg shadow-emerald-200/20 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-1 md:space-y-2">
            <div className="flex items-center gap-2 opacity-80">
              <ArrowDownRight className="size-3.5 md:size-4" />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest">إجمالي الدخل</span>
            </div>
            <div className="text-xl md:text-2xl font-black tracking-tighter">
              {formatCurrency(totalMonthlyIncome, currency)}
            </div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold bg-white/20 backdrop-blur-md w-fit px-2 py-0.5 rounded-full">
              <TrendingUp className="size-2.5 md:size-3" />
              <span>{filteredIncome.length} مصادر دخل</span>
              {prevMonthIncome > 0 && (
                <span className={cn("mr-1 px-1 py-0.5 rounded-lg", incomeDiff >= 0 ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100")}>
                  {incomeDiff >= 0 ? '+' : ''}{incomeDiff.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-800 dark:to-black rounded-2xl md:rounded-3xl p-3 md:p-5 text-white shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-1 md:space-y-2">
            <div className="flex items-center gap-2 opacity-80">
              <ArrowUpRight className="size-3.5 md:size-4 text-rose-400" />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest">إجمالي المصاريف</span>
            </div>
            <div className="text-xl md:text-2xl font-black tracking-tighter">
              {formatCurrency(totalMonthlyExpense, currency)}
            </div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold bg-white/10 backdrop-blur-md w-fit px-2 py-0.5 rounded-full">
              <Activity className="size-2.5 md:size-3 text-rose-400" />
              <span>{filteredExpenses.length} عملية شرائية</span>
              {prevMonthExpenses > 0 && (
                <span className={cn("mr-1 px-1 py-0.5 rounded-lg", expenseDiff <= 0 ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100")}>
                  {expenseDiff >= 0 ? '+' : ''}{expenseDiff.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </div>

      {/* 2. Quick Insights Mini-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-center shadow-md">
          <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">متوسط الصرف اليومي</span>
          <span className="text-sm md:text-lg font-black text-slate-900 dark:text-white">{formatCurrency(averageDailyExpense, currency)}</span>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-center shadow-md">
          <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">أعلى يوم صرفاً</span>
          <span className="text-sm md:text-lg font-black text-rose-600">{highestExpenseDay.date !== '-' ? highestExpenseDay.fullDate : '-'}</span>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-center shadow-md">
          <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">أكثر فئة استهلاكاً</span>
          <span className="text-sm md:text-lg font-black text-indigo-600">{categoryData.length > 0 ? categoryData[0].name : '-'}</span>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-center shadow-md">
          <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">معدل الادخار</span>
          <span className="text-sm md:text-lg font-black text-emerald-600">
            {totalMonthlyIncome > 0 ? Math.max(0, Math.round((netBalance / totalMonthlyIncome) * 100)) : 0}%
          </span>
        </motion.div>
      </div>

      {/* 4. Budget & Planning */}
      <div className="space-y-3 md:space-y-4">
        <h2 className="text-[11px] md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 px-2">
          <Target className="text-rose-500 size-4 md:size-5" />
          التخطيط والميزانية
        </h2>
        
        {budget && (
          <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 md:p-6 rounded-2xl md:rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-3 md:mb-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 shadow-inner">
                  <Target className="size-4 md:size-6" />
                </div>
                <div>
                  <h3 className="text-xs md:text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">استهلاك الميزانية</h3>
                  <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">مقارنة المصاريف بالميزانية</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {formatCurrency(totalMonthlyExpense, currency)}
                </div>
                <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  من أصل {formatCurrency(budget.amount, currency)}
                </p>
              </div>
            </div>
            
            <div className="mt-3 md:mt-6">
              <div className="flex justify-between text-[9px] md:text-xs font-black uppercase tracking-widest mb-1.5 md:mb-3">
                <span className="text-slate-500">الاستهلاك</span>
                <span className={cn(
                  "font-bold",
                  totalMonthlyExpense > budget.amount ? "text-rose-500" : "text-indigo-500"
                )}>
                  {Math.min(100, Math.round((totalMonthlyExpense / budget.amount) * 100))}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 md:h-3 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (totalMonthlyExpense / budget.amount) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    totalMonthlyExpense > budget.amount ? "bg-gradient-to-r from-rose-500 to-rose-600" : 
                    totalMonthlyExpense > budget.amount * 0.8 ? "bg-gradient-to-r from-amber-500 to-amber-600" : 
                    "bg-gradient-to-r from-indigo-500 to-indigo-600"
                  )} 
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 md:mt-3 px-1">
                <span className={cn(
                  "text-[9px] md:text-xs font-black uppercase tracking-widest",
                  totalMonthlyExpense > budget.amount ? "text-rose-500" : "text-slate-400"
                )}>
                  {totalMonthlyExpense > budget.amount ? 'تجاوزت الميزانية' : `المتبقي: ${formatCurrency(budget.amount - totalMonthlyExpense, currency)}`}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { type: 'need', label: 'الاحتياجات', color: 'bg-indigo-500', icon: ShieldCheck, target: 50 },
            { type: 'want', label: 'الرغبات', color: 'bg-amber-500', icon: Target, target: 30 },
            { type: 'saving', label: 'الادخار', color: 'bg-emerald-500', icon: TrendingUp, target: 20 }
          ].map((bucket) => {
            const amount = filteredExpenses
              .filter(e => categories.find(c => c.id === e.categoryId)?.type === bucket.type)
              .reduce((sum, e) => sum + e.amount, 0);
            const percent = totalMonthlyIncome > 0 ? (amount / totalMonthlyIncome) * 100 : 0;
            
            return (
        <motion.div key={bucket.type} variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 md:p-6 rounded-2xl md:rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-md">
                <div className="flex items-center justify-between mb-2 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={cn("w-7 h-7 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white shadow-md", bucket.color)}>
                      <bucket.icon className="size-3.5 md:size-5" />
                    </div>
                    <div>
                      <h4 className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{bucket.label}</h4>
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">المستهدف: {bucket.target}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[9px] md:text-xs font-black",
                      percent > bucket.target ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {Math.round(percent)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-3">
                  <div className="text-base md:text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {formatCurrency(amount, currency)}
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 md:h-2 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percent)}%` }}
                      className={cn("h-full rounded-full", bucket.color)}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 5. Charts */}
      <div className="space-y-2 md:space-y-3">
        <h2 className="text-[11px] md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 px-2">
          <BarChart3 className="text-emerald-500 size-4 md:size-5" />
          التحليل البياني
        </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Daily Spending Bar Chart */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
                <BarChart3 className="size-4 md:size-5" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">التدفق المالي اليومي</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">مقارنة الدخل والمصاريف</p>
              </div>
            </div>
          </div>
          <div className="h-36 sm:h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e11d48" stopOpacity={1} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: window.innerWidth < 768 ? 7 : 8, fontWeight: 700, fill: '#94a3b8' }}
                  dy={8}
                  interval={window.innerWidth < 640 ? 3 : 0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: window.innerWidth < 768 ? 7 : 8, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', radius: 6 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const income = payload.find(p => p.dataKey === 'incomeAmount')?.value as number || 0;
                      const expense = payload.find(p => p.dataKey === 'expenseAmount')?.value as number || 0;
                      
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 backdrop-blur-md">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.fullDate}</p>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-emerald-600">
                              الدخل: {formatCurrency(income, currency)}
                            </p>
                            <p className="text-[10px] font-black text-rose-600">
                              المصاريف: {formatCurrency(expense, currency)}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Brush dataKey="date" height={20} stroke="#94a3b8" fill="#f1f5f9" />
                <Bar 
                  dataKey="incomeAmount" 
                  fill="url(#incomeGradient)" 
                  radius={[2, 2, 0, 0]} 
                  barSize={window.innerWidth < 640 ? 3 : 8}
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="expenseAmount" 
                  fill="url(#expenseGradient)" 
                  radius={[2, 2, 0, 0]} 
                  barSize={window.innerWidth < 640 ? 3 : 8}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Comparison Bar Chart */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                <Activity className="size-4 md:size-5" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">المقارنة الشهرية السنوية</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">الدخل مقابل المصاريف لعام {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 7, fontWeight: 700, fill: '#94a3b8' }}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 7, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', radius: 6 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isProfit = data.net >= 0;
                      
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 backdrop-blur-md">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{data.fullMonth}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-[9px] font-bold text-slate-500">الدخل:</span>
                              <span className="text-[9px] font-black text-emerald-600">{formatCurrency(data.income, currency)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[9px] font-bold text-slate-500">المصاريف:</span>
                              <span className="text-[9px] font-black text-rose-600">{formatCurrency(data.expense, currency)}</span>
                            </div>
                            <div className="pt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-4">
                              <span className="text-[9px] font-bold text-slate-900 dark:text-white">الصافي:</span>
                              <span className={cn("text-[9px] font-black", isProfit ? "text-blue-600" : "text-rose-600")}>
                                {isProfit ? '+' : ''}{formatCurrency(data.net, currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="income" 
                  name="الدخل"
                  fill="#10b981" 
                  radius={[2, 2, 0, 0]} 
                  barSize={10}
                />
                <Bar 
                  dataKey="expense" 
                  name="المصاريف"
                  fill="#e11d48" 
                  radius={[2, 2, 0, 0]} 
                  barSize={10}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution Pie Chart */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                <PieChartIcon className="size-4 md:size-5" />
              </div>
              <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">توزيع الفئات</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-center">
            <div className="h-40 md:h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={window.innerWidth < 640 ? 35 : 70}
                    outerRadius={window.innerWidth < 640 ? 60 : 100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 backdrop-blur-md">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(payload[0].value as number, currency)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجمالي</span>
                <span className="text-xs md:text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                  {formatCurrency(totalMonthlyExpense, currency)}
                </span>
              </div>
            </div>

            <div className="space-y-1 md:space-y-1.5 max-h-40 md:max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {categoryData.map((cat, i) => (
                <div key={i} className="group flex items-center justify-between p-1 md:p-2 rounded-lg md:rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                  <div className="flex items-center gap-2 md:gap-2.5">
                    <div 
                      className="w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform" 
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.icon ? <DynamicIcon name={cat.icon} className="size-3 md:size-3.5" /> : <span className="text-[9px] md:text-[10px] font-black">{cat.name.charAt(0)}</span>}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white block leading-none">{cat.name}</span>
                      <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {((cat.value / totalMonthlyExpense) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white">{formatCurrency(cat.value, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
);
};

export default Analytics;
