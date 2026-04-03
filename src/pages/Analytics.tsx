import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { Skeleton, CardSkeleton } from '../components/Skeleton';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, endOfYear, eachMonthOfInterval, subDays, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Brush, AreaChart, Area } from 'recharts';
import { DynamicIcon } from '../components/DynamicIcon';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, ChartPie as PieChartIcon, ChartColumn as BarChart3, ArrowUpRight, ArrowDownRight, Activity, Target, ShieldCheck, TriangleAlert, Lightbulb, Sparkles } from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';
import { useBehavioralEngine } from '../hooks/useBehavioralEngine';

const Analytics = () => {
  const { expenses, income = [], categories, currency, budget, dailyBudget, firstDayOfMonth } = useAppContext();
  const { width } = useWindowSize();
  const { insights } = useBehavioralEngine();
  const [isReady, setIsReady] = useState(true);

  const [rangeType, setRangeType] = useState<'monthly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(getBudgetMonth(new Date(), firstDayOfMonth)); // YYYY-MM
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const dateRange = useMemo(() => {
    if (rangeType === 'monthly') {
      return getBudgetRange(selectedMonth, firstDayOfMonth);
    } else {
      return {
        start: parseISO(startDate),
        end: parseISO(endDate)
      };
    }
  }, [rangeType, selectedMonth, startDate, endDate, firstDayOfMonth]);

  const filteredExpenses = useMemo(() => {
    const { start, end } = dateRange;
    return expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = e.parsedDate || parseISO(e.date);
      return d >= start && d <= end;
    });
  }, [expenses, dateRange]);

  const filteredIncome = useMemo(() => {
    const { start, end } = dateRange;
    return income.filter(i => {
      if (i.isTransfer) return false;
      const d = i.parsedDate || parseISO(i.date);
      return d >= start && d <= end;
    });
  }, [income, dateRange]);

  const totalMonthlyExpense = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  const totalMonthlyIncome = useMemo(() => filteredIncome.reduce((sum, i) => sum + i.amount, 0), [filteredIncome]);
  const netBalance = useMemo(() => totalMonthlyIncome - totalMonthlyExpense, [totalMonthlyIncome, totalMonthlyExpense]);

  const categoryData = useMemo(() => {
    const categorySums = filteredExpenses.reduce((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      value: categorySums[cat.id] || 0,
      color: cat.color,
      icon: cat.icon
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [filteredExpenses, categories]);

  const incomeSourceData = useMemo(() => {
    const sourceSums = filteredIncome.reduce((acc, i) => {
      const source = i.source || 'أخرى';
      acc[source] = (acc[source] || 0) + i.amount;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

    return Object.entries(sourceSums)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredIncome]);

  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    const expenseMap = filteredExpenses.reduce((acc, e) => {
      const dateStr = e.date.split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const incomeMap = filteredIncome.reduce((acc, i) => {
      const dateStr = i.date.split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + i.amount;
      return acc;
    }, {} as Record<string, number>);

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'dd', { locale: ar }),
        fullDate: format(day, 'dd MMMM', { locale: ar }),
        expenseAmount: expenseMap[dateStr] || 0,
        incomeAmount: incomeMap[dateStr] || 0
      };
    });
  }, [filteredExpenses, filteredIncome, dateRange]);

  const highestExpenseDay = useMemo(() => {
    if (dailyData.length === 0) return { date: '-', expenseAmount: 0, fullDate: '-' };
    return dailyData.reduce((max, day) => day.expenseAmount > max.expenseAmount ? day : max, dailyData[0]);
  }, [dailyData]);

  const averageDailyExpense = useMemo(() => 
    totalMonthlyExpense / (dailyData.length || 1), 
  [totalMonthlyExpense, dailyData.length]);

  // Daily Budget Performance - Optimized
  const dailyPerformance = useMemo(() => {
    // Group expenses by date once for O(N) lookup
    const expenseMap: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.isTransfer) return;
      const dateStr = e.date.split('T')[0];
      expenseMap[dateStr] = (expenseMap[dateStr] || 0) + e.amount;
    });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayExpenses = expenseMap[dateStr] || 0;
      
      return {
        date: format(d, 'MMM dd', { locale: ar }),
        spent: dayExpenses,
        budget: dailyBudget,
        status: dayExpenses > dailyBudget ? 'over' : dayExpenses > dailyBudget * 0.8 ? 'near' : 'under'
      };
    }).reverse();

    const overBudgetDays = last30Days.filter(d => d.spent > dailyBudget).length;
    const avgDailySpending = last30Days.reduce((sum, d) => sum + d.spent, 0) / 30;

    return {
      data: last30Days,
      overBudgetDays,
      avgDailySpending,
      performanceScore: Math.max(0, 100 - (overBudgetDays * 3.33))
    };
  }, [expenses, dailyBudget]);

  const prevMonthDateRange = useMemo(() => {
    if (rangeType === 'monthly') {
      const d = new Date(dateRange.start);
      // Move to middle of previous budget month to avoid edge cases
      d.setDate(d.getDate() - 15);
      return getBudgetRange(format(d, 'yyyy-MM'), firstDayOfMonth);
    }
    
    // For other ranges, just shift the interval back
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.end.getTime() - duration)
    };
  }, [dateRange, rangeType, firstDayOfMonth]);

  const prevMonthExpenses = useMemo(() => {
    const { start, end } = prevMonthDateRange;
    return expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = e.parsedDate || parseISO(e.date);
      return d >= start && d <= end;
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, prevMonthDateRange]);

  const prevMonthIncome = useMemo(() => {
    const { start, end } = prevMonthDateRange;
    return income.filter(i => {
      if (i.isTransfer) return false;
      const d = i.parsedDate || parseISO(i.date);
      return d >= start && d <= end;
    }).reduce((sum, i) => sum + i.amount, 0);
  }, [income, prevMonthDateRange]);

  const expenseDiff = useMemo(() => 
    prevMonthExpenses > 0 ? ((totalMonthlyExpense - prevMonthExpenses) / prevMonthExpenses) * 100 : 0,
  [totalMonthlyExpense, prevMonthExpenses]);

  const incomeDiff = useMemo(() => 
    prevMonthIncome > 0 ? ((totalMonthlyIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0,
  [totalMonthlyIncome, prevMonthIncome]);

  const monthlyData = useMemo(() => {
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    const expenseMap = expenses.reduce((acc, e) => {
      if (e.isTransfer) return acc;
      const d = e.parsedDate || parseISO(e.date);
      const m = getBudgetMonth(d, firstDayOfMonth);
      acc[m] = (acc[m] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const incomeMap = income.reduce((acc, i) => {
      if (i.isTransfer) return acc;
      const d = i.parsedDate || parseISO(i.date);
      const m = getBudgetMonth(d, firstDayOfMonth);
      acc[m] = (acc[m] || 0) + i.amount;
      return acc;
    }, {} as Record<string, number>);

    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const expenseAmount = expenseMap[monthStr] || 0;
      const incomeAmount = incomeMap[monthStr] || 0;
      
      return {
        month: format(month, 'MMM', { locale: ar }),
        fullMonth: format(month, 'MMMM yyyy', { locale: ar }),
        expense: expenseAmount,
        income: incomeAmount,
        net: incomeAmount - expenseAmount
      };
    });
  }, [expenses, income, firstDayOfMonth]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-10 pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            التحليل <span className="text-primary-500">المالي</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
            نظرة عميقة على مصاريفك ودخلك وتوزيع ميزانيتك
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setRangeType('monthly')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
                rangeType === 'monthly' ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              شهري
            </button>
            <button
              onClick={() => setRangeType('custom')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
                rangeType === 'custom' ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              مخصص
            </button>
          </div>
          
          {rangeType === 'monthly' ? (
            <div className="relative group flex-1 sm:flex-none">
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-500 group-focus-within:text-primary-600 transition-colors" size={16} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pr-12 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-xs font-black uppercase tracking-widest shadow-sm font-mono"
              />
            </div>
          ) : (
            <div className="flex gap-2 flex-1 sm:flex-none">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 pr-3 pl-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-[10px] font-black uppercase tracking-widest shadow-sm font-mono"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 pr-3 pl-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-[10px] font-black uppercase tracking-widest shadow-sm font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* 1. Top Level Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div variants={itemVariants} className={cn(
          "rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden group",
          netBalance >= 0 ? "bg-slate-900 dark:bg-black border border-slate-800" : "bg-gradient-to-br from-rose-500 to-red-700"
        )}>
          {netBalance >= 0 && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-transparent opacity-50" />
          )}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative z-10 space-y-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-3 opacity-60">
              <Target className="size-5" />
              <span className="text-xs font-black uppercase tracking-widest">الصافي (التوفير المحتمل)</span>
            </div>
            <div className="text-4xl md:text-5xl font-black tracking-tighter">
              {formatCurrency(Math.abs(netBalance), currency)}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-widest">
              <Activity className="size-3.5" />
              <span>{netBalance >= 0 ? 'فائض مالي ممتاز' : 'عجز مالي يحتاج انتباه'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative z-10 space-y-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
              <ArrowDownRight className="size-5 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest">إجمالي الدخل</span>
            </div>
            <div className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
              {formatCurrency(totalMonthlyIncome, currency)}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">
              <TrendingUp className="size-3.5" />
              <span>{filteredIncome.length} مصادر</span>
              {prevMonthIncome > 0 && (
                <span className="mr-1 font-black">
                  {incomeDiff >= 0 ? '+' : ''}{incomeDiff.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative z-10 space-y-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
              <ArrowUpRight className="size-5 text-rose-500" />
              <span className="text-xs font-black uppercase tracking-widest">إجمالي المصاريف</span>
            </div>
            <div className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
              {formatCurrency(totalMonthlyExpense, currency)}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-1.5 rounded-full uppercase tracking-widest border border-rose-100 dark:border-rose-800/50">
              <Activity className="size-3.5" />
              <span>{filteredExpenses.length} عمليات</span>
              {prevMonthExpenses > 0 && (
                <span className="mr-1 font-black">
                  {expenseDiff >= 0 ? '+' : ''}{expenseDiff.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. Quick Insights Mini-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'متوسط الصرف اليومي', value: formatCurrency(averageDailyExpense, currency), color: 'text-primary-500' },
          { label: 'أعلى يوم صرفاً', value: highestExpenseDay.date !== '-' ? highestExpenseDay.fullDate : '-', color: 'text-rose-500' },
          { label: 'أكثر فئة استهلاكاً', value: categoryData.length > 0 ? categoryData[0].name : '-', color: 'text-indigo-500' },
          { label: 'معدل الادخار', value: `${totalMonthlyIncome > 0 ? Math.max(0, Math.round((netBalance / totalMonthlyIncome) * 100)) : 0}%`, color: 'text-emerald-500' }
        ].map((insight, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-sm text-center group hover:shadow-md transition-all duration-300"
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{insight.label}</span>
            <span className={cn("text-base md:text-xl font-black tracking-tight", insight.color)}>{insight.value}</span>
          </motion.div>
        ))}
      </div>

      {/* 3. Smart Tips / Behavioral Insights */}
      {insights.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">نصائح ذكية</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">رؤى مخصصة بناءً على نشاطك المالي</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <motion.div
                key={insight.id}
                variants={itemVariants}
                className={cn(
                  "p-6 rounded-3xl border shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md",
                  insight.type === 'warning' ? "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/50" :
                  insight.type === 'positive' ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50" :
                  insight.type === 'prediction' ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50" :
                  "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/50"
                )}
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0 shadow-sm",
                    insight.type === 'warning' ? "bg-rose-100 dark:bg-rose-800/50 text-rose-600 dark:text-rose-400" :
                    insight.type === 'positive' ? "bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400" :
                    insight.type === 'prediction' ? "bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400" :
                    "bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400"
                  )}>
                    {insight.type === 'warning' ? <TriangleAlert size={24} /> :
                     insight.type === 'positive' ? <TrendingUp size={24} /> :
                     insight.type === 'prediction' ? <Sparkles size={24} /> :
                     <Activity size={24} />}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{insight.title}</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{insight.description}</p>
                    {insight.impact && (
                      <div className="mt-3 inline-block bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{insight.impact}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 4. 50/30/20 Budgeting Strategy */}
      <div className="space-y-6">
        {/* Daily Budget Performance Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group"
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-xl text-primary-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
                أداء الميزانية اليومية
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">تحليل التزامك بميزانية {dailyBudget} {currency} خلال آخر 30 يوم</p>
            </div>
            
            <div className="flex items-center gap-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <div className="text-center px-2">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">أيام التجاوز</p>
                <p className={cn("text-2xl font-black tracking-tighter", dailyPerformance.overBudgetDays > 10 ? 'text-rose-500' : 'text-emerald-500')}>
                  {dailyPerformance.overBudgetDays} <span className="text-[10px] font-bold text-slate-400 uppercase">أيام</span>
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center px-2">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">درجة الالتزام</p>
                <p className={cn("text-2xl font-black tracking-tighter", dailyPerformance.performanceScore < 60 ? 'text-rose-500' : dailyPerformance.performanceScore < 85 ? 'text-amber-500' : 'text-emerald-500')}>
                  {Math.round(dailyPerformance.performanceScore)}%
                </p>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {isReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPerformance.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                    interval={4}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 8 }}
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '16px',
                      backgroundColor: '#fff'
                    }}
                    formatter={(value: number) => [formatCurrency(value, currency), 'صرفت']}
                  />
                  <Bar 
                    dataKey="spent" 
                    radius={[6, 6, 0, 0]}
                    barSize={width < 640 ? 6 : 12}
                  >
                    {dailyPerformance.data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.spent > dailyBudget ? '#f43f5e' : entry.spent > dailyBudget * 0.8 ? '#f59e0b' : '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl animate-pulse">
                <BarChart3 className="size-8 text-slate-300 dark:text-slate-700" />
              </div>
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group/card hover:bg-white dark:hover:bg-slate-800 transition-all duration-300">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">متوسط الصرف اليومي</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(dailyPerformance.avgDailySpending, currency)}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", dailyPerformance.avgDailySpending > dailyBudget ? "bg-rose-500" : "bg-emerald-500")} />
                <p className="text-[10px] font-bold text-slate-500 uppercase">بناءً على آخر 30 يوم</p>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group/card hover:bg-white dark:hover:bg-slate-800 transition-all duration-300">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">الحالة العامة</p>
              <p className={cn("text-2xl font-black tracking-tighter", dailyPerformance.avgDailySpending > dailyBudget ? 'text-rose-500' : 'text-emerald-500')}>
                {dailyPerformance.avgDailySpending > dailyBudget ? 'فوق الميزانية' : 'تحت الميزانية'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Activity size={12} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-500 uppercase">مقارنة بمتوسط صرفك</p>
              </div>
            </div>

            <div className="p-6 bg-primary-500/5 dark:bg-primary-500/10 rounded-3xl border border-primary-500/10 group/card hover:bg-primary-500/10 transition-all duration-300">
              <p className="text-[10px] text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest mb-2">نصيحة ذكية</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                {dailyPerformance.overBudgetDays > 10 
                  ? 'أنت تتجاوز ميزانيتك كثيراً. حاول تقليل المصاريف غير الضرورية لتحسين استقرارك المالي.' 
                  : 'أداؤك ممتاز! استمر في هذا الانضباط المالي لتحقيق أهدافك بشكل أسرع.'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div className="space-y-1">
            <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">استراتيجية 50/30/20</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">توزيع ميزانيتك الذكي بناءً على دخلك الحالي</p>
          </div>
          <div className="bg-primary-500/10 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary-500/20">
            مبني على إجمالي دخل: {formatCurrency(totalMonthlyIncome, currency)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Financial Health Score Card */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-1 bg-slate-900 dark:bg-black rounded-3xl p-6 text-white relative overflow-hidden shadow-md group"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">مؤشر الصحة المالية</p>
                <h3 className="text-2xl font-black tracking-tight">درجة التزامك</h3>
              </div>
              
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/5"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="364.4"
                      initial={{ strokeDashoffset: 364.4 }}
                      animate={{ strokeDashoffset: 364.4 - (364.4 * (
                        (() => {
                          const needAmt = filteredExpenses.filter(e => categories.find(c => c.id === e.categoryId)?.type === 'need').reduce((sum, e) => sum + e.amount, 0);
                          const wantAmt = filteredExpenses.filter(e => categories.find(c => c.id === e.categoryId)?.type === 'want').reduce((sum, e) => sum + e.amount, 0);
                          const savingAmt = filteredExpenses.filter(e => categories.find(c => c.id === e.categoryId)?.type === 'saving').reduce((sum, e) => sum + e.amount, 0);
                          
                          const needScore = Math.max(0, 100 - Math.max(0, (needAmt / (totalMonthlyIncome * 0.5 || 1) - 1) * 100));
                          const wantScore = Math.max(0, 100 - Math.max(0, (wantAmt / (totalMonthlyIncome * 0.3 || 1) - 1) * 100));
                          const savingScore = Math.min(100, (savingAmt / (totalMonthlyIncome * 0.2 || 1)) * 100);
                          
                          return (needScore + wantScore + savingScore) / 300;
                        })()
                      )) }}
                      transition={{ duration: 2, ease: "circOut" }}
                      className="text-primary-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black tracking-tighter">
                      {Math.round(((() => {
                        const needAmt = filteredExpenses.filter(e => categories.find(c => c.id === e.categoryId)?.type === 'need').reduce((sum, e) => sum + e.amount, 0);
                        const wantAmt = filteredExpenses.filter(e => categories.find(c => c.id === e.categoryId)?.type === 'want').reduce((sum, e) => sum + e.amount, 0);
                        const savingAmt = filteredExpenses.filter(e => categories.find(c => c.id === e.categoryId)?.type === 'saving').reduce((sum, e) => sum + e.amount, 0);
                        
                        const needScore = Math.max(0, 100 - Math.max(0, (needAmt / (totalMonthlyIncome * 0.5 || 1) - 1) * 100));
                        const wantScore = Math.max(0, 100 - Math.max(0, (wantAmt / (totalMonthlyIncome * 0.3 || 1) - 1) * 100));
                        const savingScore = Math.min(100, (savingAmt / (totalMonthlyIncome * 0.2 || 1)) * 100);
                        
                        return (needScore + wantScore + savingScore) / 3;
                      })()))}
                    </span>
                    <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest">من 100</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed">
                هذه الدرجة تعبر عن مدى توافق مصاريفك مع قاعدة 50/30/20.
              </p>
            </div>
          </motion.div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
            { 
              type: 'need', 
              label: 'الاحتياجات', 
              target: 50, 
              color: 'bg-indigo-500', 
              textColor: 'text-indigo-600 dark:text-indigo-400',
              lightColor: 'bg-indigo-50 dark:bg-indigo-900/20',
              icon: ShieldCheck,
              description: 'السكن، الفواتير، الطعام الأساسي، المواصلات.'
            },
            { 
              type: 'want', 
              label: 'الرغبات', 
              target: 30, 
              color: 'bg-amber-500', 
              textColor: 'text-amber-600 dark:text-amber-400',
              lightColor: 'bg-amber-50 dark:bg-amber-900/20',
              icon: Target,
              description: 'المطاعم، الترفيه، التسوق غير الضروري، الهدايا.'
            },
            { 
              type: 'saving', 
              label: 'الادخار', 
              target: 20, 
              color: 'bg-emerald-500', 
              textColor: 'text-emerald-600 dark:text-emerald-400',
              lightColor: 'bg-emerald-50 dark:bg-emerald-900/20',
              icon: TrendingUp,
              description: 'الادخار للطوارئ، الاستثمارات، سداد الديون.'
            }
          ].map((bucket) => {
            const amount = filteredExpenses
              .filter(e => categories.find(c => c.id === e.categoryId)?.type === bucket.type)
              .reduce((sum, e) => sum + e.amount, 0);
            const percent = totalMonthlyIncome > 0 ? (amount / totalMonthlyIncome) * 100 : 0;
            const isOver = percent > bucket.target;
            const targetAmount = totalMonthlyIncome * (bucket.target / 100);
            
            return (
              <motion.div 
                key={bucket.type} 
                variants={itemVariants} 
                className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Background Accent */}
                <div className={cn("absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity", bucket.color)} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform", bucket.color)}>
                      <bucket.icon size={28} />
                    </div>
                    <div className="text-right">
                      <span className={cn("text-3xl font-black tracking-tighter", isOver ? "text-rose-500" : bucket.textColor)}>
                        {Math.round(percent)}%
                      </span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المستهدف: {bucket.target}%</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{bucket.label}</h3>
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">{bucket.description}</p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                          {formatCurrency(amount, currency)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          من {formatCurrency(targetAmount, currency)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-50 dark:bg-slate-800/50 h-3 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-800 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, percent)}%` }}
                          transition={{ duration: 1, ease: "circOut" }}
                          className={cn(
                            "h-full rounded-full shadow-sm relative overflow-hidden",
                            isOver ? "bg-rose-500" : bucket.color
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </motion.div>
                      </div>
                    </div>

                    {isOver && (
                      <div className="flex items-center gap-2 text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-800/50">
                        <TriangleAlert size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tight">تجاوزت الحد الموصى به</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>

      {/* 5. Charts */}
      <div className="space-y-6 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div className="space-y-1">
            <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                <BarChart3 className="w-6 h-6" />
              </div>
              التحليل البياني
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">تتبع تدفقاتك المالية وتوزيع مصاريفك بدقة</p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Daily Spending Bar Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 group relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                <BarChart3 className="size-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">التدفق المالي اليومي</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مقارنة الدخل والمصاريف</p>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full relative z-10">
            {isReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
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
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={15}
                    interval={width < 640 ? 3 : 0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 12 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const income = payload.find(p => p.dataKey === 'incomeAmount')?.value as number || 0;
                        const expense = payload.find(p => p.dataKey === 'expenseAmount')?.value as number || 0;
                        
                        return (
                          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 backdrop-blur-xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">{payload[0].payload.fullDate}</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase">الدخل</span>
                                <span className="text-sm font-black text-emerald-500">{formatCurrency(income, currency)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase">المصاريف</span>
                                <span className="text-sm font-black text-rose-500">{formatCurrency(expense, currency)}</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase">الصافي</span>
                                <span className={cn("text-sm font-black", income - expense >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                  {formatCurrency(income - expense, currency)}
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
                    dataKey="incomeAmount" 
                    fill="url(#incomeGradient)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={width < 640 ? 6 : 16}
                    animationDuration={1500}
                  />
                  <Bar 
                    dataKey="expenseAmount" 
                    fill="url(#expenseGradient)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={width < 640 ? 6 : 16}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl animate-pulse">
                <Activity className="size-8 text-slate-300 dark:text-slate-700" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Comparison Bar Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 group relative overflow-hidden">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                <Activity className="size-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">المقارنة الشهرية السنوية</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">الدخل مقابل المصاريف لعام {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
          <div className="h-48 md:h-64 w-full">
            {isReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 7, fontWeight: 700, fill: '#94a3b8' }}
                    dy={8}
                    interval={width < 480 ? 1 : 0}
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
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 backdrop-blur-md">
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
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl animate-pulse">
                <TrendingUp className="size-8 text-slate-300 dark:text-slate-700" />
              </div>
            )}
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
              {isReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={width < 640 ? 35 : 70}
                      outerRadius={width < 640 ? 60 : 100}
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
                          const value = payload[0].value as number;
                          const percentage = totalMonthlyExpense > 0 ? ((value / totalMonthlyExpense) * 100).toFixed(1) : 0;
                          return (
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 backdrop-blur-md">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(value, currency)}</p>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{percentage}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-full animate-pulse">
                  <PieChartIcon className="size-8 text-slate-300 dark:text-slate-700" />
                </div>
              )}
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

        {/* Income Source Distribution Pie Chart */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                <PieChartIcon className="size-4 md:size-5" />
              </div>
              <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">مصادر الدخل</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-center">
            <div className="h-40 md:h-56 relative">
              {isReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={width < 640 ? 35 : 70}
                      outerRadius={width < 640 ? 60 : 100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {incomeSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const value = payload[0].value as number;
                          const percentage = totalMonthlyIncome > 0 ? ((value / totalMonthlyIncome) * 100).toFixed(1) : 0;
                          return (
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 backdrop-blur-md">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(value, currency)}</p>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{percentage}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-full animate-pulse">
                  <PieChartIcon className="size-8 text-slate-300 dark:text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجمالي</span>
                <span className="text-xs md:text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                  {formatCurrency(totalMonthlyIncome, currency)}
                </span>
              </div>
            </div>

            <div className="space-y-1 md:space-y-1.5 max-h-40 md:max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {incomeSourceData.map((source, i) => (
                <div key={i} className="group flex items-center justify-between p-1 md:p-2 rounded-lg md:rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                  <div className="flex items-center gap-2 md:gap-2.5">
                    <div 
                      className="w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform" 
                      style={{ backgroundColor: source.color }}
                    >
                      <span className="text-[9px] md:text-[10px] font-black">{source.name.charAt(0)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white block leading-none">{source.name}</span>
                      <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {totalMonthlyIncome > 0 ? ((source.value / totalMonthlyIncome) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white">{formatCurrency(source.value, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Income Trend Area Chart */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                <TrendingUp className="size-4 md:size-5" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">نمو الدخل</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">تطور الدخل بمرور الوقت</p>
              </div>
            </div>
          </div>
          <div className="h-36 sm:h-48 md:h-64 w-full">
            {isReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: width < 768 ? 7 : 8, fontWeight: 700, fill: '#94a3b8' }}
                    dy={8}
                    interval={width < 640 ? 3 : 0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: width < 768 ? 7 : 8, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const income = payload[0].value as number || 0;
                        
                        return (
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 backdrop-blur-md">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.fullDate}</p>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black text-emerald-600">
                                الدخل: {formatCurrency(income, currency)}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="incomeAmount" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#incomeAreaGradient)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl animate-pulse">
                <TrendingUp className="size-8 text-slate-300 dark:text-slate-700" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
);
};

export default Analytics;
