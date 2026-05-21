import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { format, parseISO, eachDayOfInterval, startOfYear, endOfYear, eachMonthOfInterval, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Activity, Target, ChartPie as PieChartIcon } from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';
import { useBehavioralEngine } from '../hooks/useBehavioralEngine';

import { OverviewSection } from '../components/analytics/OverviewSection';
import { BudgetSection } from '../components/analytics/BudgetSection';
import { ChartsSection } from '../components/analytics/ChartsSection';

const Analytics = () => {
  const { expenses, income = [], categories, currency, budget, dailyBudget, firstDayOfMonth, aiInsights } = useAppContext();
  const { width } = useWindowSize();
  const { insights } = useBehavioralEngine();
  const [rangeType, setRangeType] = useState<'monthly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(getBudgetMonth(new Date(), firstDayOfMonth)); // YYYY-MM
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'charts'>('overview');
  const [chartSubTab, setChartSubTab] = useState<'daily' | 'monthly' | 'performance'>('daily');

  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 400); // Small delay to show smooth transitions
    return () => clearTimeout(timer);
  }, [rangeType, selectedMonth, startDate, endDate, expenses.length, income.length]);

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

  const dailyPerformance = useMemo(() => {
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
        status: dayExpenses > dailyBudget ? 'over' : dayExpenses > dailyBudget * 0.82 ? 'near' : 'under'
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
      d.setDate(d.getDate() - 15);
      return getBudgetRange(format(d, 'yyyy-MM'), firstDayOfMonth);
    }
    
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

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-8 pb-20 relative text-right"
      dir="rtl"
    >
      {/* Upper header section with Title & Range pickers */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-slate-100 dark:border-slate-850">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            التحليل <span className="text-primary-500">المالي</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            نظرة مبسطة ومقسمة على تدفقاتك المالية والتزامات الميزانية
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-2xl border border-slate-200/40 dark:border-slate-700/40">
            <button
              onClick={() => { hapticFeedback('light'); setRangeType('monthly'); }}
              className={cn(
                "flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                rangeType === 'monthly' ? "bg-white dark:bg-slate-705 text-primary-600 dark:text-primary-400 shadow-xs" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              شهري
            </button>
            <button
              onClick={() => { hapticFeedback('light'); setRangeType('custom'); }}
              className={cn(
                "flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                rangeType === 'custom' ? "bg-white dark:bg-slate-705 text-primary-600 dark:text-primary-400 shadow-xs" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              مخصص
            </button>
          </div>
          
          {rangeType === 'monthly' ? (
            <div className="relative group flex-1 sm:flex-none">
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-500 pointer-events-none" size={14} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-2xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-[10px] font-black uppercase tracking-wider shadow-xs font-mono"
              />
            </div>
          ) : (
            <div className="flex gap-1.5 flex-1 sm:flex-none">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-2xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-[10px] font-black tracking-wider shadow-xs font-mono"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-2xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-[10px] font-black tracking-wider shadow-xs font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Segmented Tab Switche Controls */}
      <motion.div 
        variants={itemVariants} 
        className="flex p-1 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-200/40 dark:border-slate-800/40 max-w-md mx-auto w-full transition-all"
      >
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('overview'); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all",
            activeTab === 'overview' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          )}
        >
          <Activity size={14} />
          <span>نظرة عامة</span>
        </button>
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('budget'); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all",
            activeTab === 'budget' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          )}
        >
          <Target size={14} />
          <span>الميزانية والنسب</span>
        </button>
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('charts'); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all",
            activeTab === 'charts' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          )}
        >
          <PieChartIcon size={14} />
          <span>التحليل البياني</span>
        </button>
      </motion.div>

      {/* Active Tab Panel with Transition */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <OverviewSection
                netBalance={netBalance}
                totalMonthlyIncome={totalMonthlyIncome}
                totalMonthlyExpense={totalMonthlyExpense}
                currency={currency}
                filteredExpensesLength={filteredExpenses.length}
                filteredIncomeLength={filteredIncome.length}
                prevMonthExpenses={prevMonthExpenses}
                prevMonthIncome={prevMonthIncome}
                expenseDiff={expenseDiff}
                incomeDiff={incomeDiff}
                averageDailyExpense={averageDailyExpense}
                highestExpenseDay={highestExpenseDay}
                categoryData={categoryData}
                insights={insights}
                aiInsights={aiInsights}
                itemVariants={itemVariants}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetSection
                budget={budget}
                rangeType={rangeType}
                selectedMonth={selectedMonth}
                totalMonthlyExpense={totalMonthlyExpense}
                totalMonthlyIncome={totalMonthlyIncome}
                currency={currency}
                categories={categories}
                categoryData={categoryData}
                filteredExpenses={filteredExpenses}
                itemVariants={itemVariants}
              />
            )}

            {activeTab === 'charts' && (
              <ChartsSection
                chartSubTab={chartSubTab}
                setChartSubTab={setChartSubTab}
                isReady={isReady}
                dailyData={dailyData}
                monthlyData={monthlyData}
                dailyPerformance={dailyPerformance}
                categoryData={categoryData}
                incomeSourceData={incomeSourceData}
                totalMonthlyExpense={totalMonthlyExpense}
                totalMonthlyIncome={totalMonthlyIncome}
                dailyBudget={dailyBudget}
                currency={currency}
                width={width}
                itemVariants={itemVariants}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Analytics;
