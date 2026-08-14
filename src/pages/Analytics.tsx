import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { 
  format, 
  parseISO, 
  eachDayOfInterval, 
  startOfYear, 
  endOfYear, 
  eachMonthOfInterval, 
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  Calendar, 
  Activity, 
  Target, 
  ChartPie as PieChartIcon, 
  Sparkles,
  TrendingUp,
  BarChart3,
  Sliders,
  Wallet,
  Clock
} from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';
import { useBehavioralEngine } from '../hooks/useBehavioralEngine';

import PageHeader from '../components/ui/PageHeader';
import { OverviewSection } from '../components/analytics/OverviewSection';
import { BudgetSection } from '../components/analytics/BudgetSection';
import { ChartsSection } from '../components/analytics/ChartsSection';
import { WeeklySection } from '../components/analytics/WeeklySection';

type PeriodPreset = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom';

const Analytics = () => {
  const { expenses, income = [], categories, currency, budgets, dailyBudget, firstDayOfMonth, aiInsights } = useAppContext();
  const { width } = useWindowSize();
  const { insights } = useBehavioralEngine();

  // Period Preset State
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_month');
  const [selectedMonth, setSelectedMonth] = useState(getBudgetMonth(new Date(), firstDayOfMonth)); // YYYY-MM
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'budget' | 'weekly'>('overview');
  const [chartSubTab, setChartSubTab] = useState<'daily' | 'monthly' | 'cumulative'>('daily');

  const budget = useMemo(() => budgets?.find(b => b.month === selectedMonth), [budgets, selectedMonth]);

  // Handle Preset Changes
  const handlePresetSelect = (preset: PeriodPreset) => {
    hapticFeedback('light');
    setPeriodPreset(preset);
    const now = new Date();

    if (preset === 'this_month') {
      setSelectedMonth(getBudgetMonth(now, firstDayOfMonth));
    } else if (preset === 'last_month') {
      const prev = subMonths(now, 1);
      setSelectedMonth(getBudgetMonth(prev, firstDayOfMonth));
    } else if (preset === 'last_3_months') {
      setStartDate(format(subMonths(now, 3), 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'this_year') {
      setStartDate(format(startOfYear(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfYear(now), 'yyyy-MM-dd'));
    }
  };

  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [periodPreset, selectedMonth, startDate, endDate, expenses.length, income.length]);

  const dateRange = useMemo(() => {
    if (periodPreset === 'this_month' || periodPreset === 'last_month') {
      return getBudgetRange(selectedMonth, firstDayOfMonth);
    } else {
      return {
        start: parseISO(startDate),
        end: parseISO(endDate)
      };
    }
  }, [periodPreset, selectedMonth, startDate, endDate, firstDayOfMonth]);

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
    try {
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
    } catch {
      return [];
    }
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

  const noSpendDaysCount = useMemo(() => {
    return dailyData.filter(d => d.expenseAmount === 0).length;
  }, [dailyData]);

  const prevMonthDateRange = useMemo(() => {
    if (periodPreset === 'this_month' || periodPreset === 'last_month') {
      const d = new Date(dateRange.start);
      d.setDate(d.getDate() - 15);
      return getBudgetRange(format(d, 'yyyy-MM'), firstDayOfMonth);
    }
    
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.end.getTime() - duration)
    };
  }, [dateRange, periodPreset, firstDayOfMonth]);

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
      const d = e => (e.parsedDate || parseISO(e.date));
      const m = getBudgetMonth(d(i), firstDayOfMonth);
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 p-4 pb-32 relative text-right max-w-7xl mx-auto"
      dir="rtl"
    >
      {/* 1. Header & Period Filters */}
      <PageHeader
        title="التحليل المالي والإحصائيات"
        subtitle="لوحة مؤشرات تنفيذية ورسوم بيانية ذكية لتتبع صحتك المالية وتدفقاتك"
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* Quick Period Presets */}
            <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 gap-1 select-none">
              {[
                { id: 'this_month', label: 'هذا الشهر' },
                { id: 'last_month', label: 'الشهر الماضي' },
                { id: 'last_3_months', label: '3 أشهر' },
                { id: 'this_year', label: 'السنة' },
                { id: 'custom', label: 'مخصص' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id as PeriodPreset)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    periodPreset === p.id 
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            
            {/* Date Picker Input (Only shown for month or custom) */}
            {(periodPreset === 'this_month' || periodPreset === 'last_month') ? (
              <div className="relative group">
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={13} />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="pr-9 pl-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold shadow-xs font-mono cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            ) : periodPreset === 'custom' ? (
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold shadow-xs font-mono cursor-pointer outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold shadow-xs font-mono cursor-pointer outline-none"
                />
              </div>
            ) : null}
          </div>
        }
      />

      {/* 2. Unified Refined 4-Tab Navigation Bar */}
      <motion.div 
        variants={itemVariants} 
        className="flex p-1 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-2xl mx-auto w-full"
      >
        {[
          { id: 'overview', label: 'النظرة التنفيذية', icon: Activity },
          { id: 'charts', label: 'الرسوم والتدفقات', icon: BarChart3 },
          { id: 'budget', label: 'قاعدة 50/30/20', icon: Target },
          { id: 'weekly', label: 'المقارنة الأسبوعية', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                hapticFeedback('light');
                setActiveTab(tab.id as any);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === tab.id 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              )}
            >
              <Icon size={14} className={activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : ""} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* 3. Active Tab Content Panel */}
      <div className="relative min-h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
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
                dailyBudget={dailyBudget}
                overBudgetDaysCount={dailyPerformance.overBudgetDays}
                noSpendDaysCount={noSpendDaysCount}
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

            {activeTab === 'budget' && (
              <BudgetSection
                budget={budget}
                rangeType={periodPreset === 'this_month' || periodPreset === 'last_month' ? 'monthly' : 'custom'}
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

            {activeTab === 'weekly' && (
              <WeeklySection
                expenses={expenses}
                categories={categories}
                currency={currency}
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
