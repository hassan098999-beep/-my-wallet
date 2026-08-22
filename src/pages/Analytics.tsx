import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth, safeStorage } from '../utils';
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
  Sparkles,
  BarChart3,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';
import { useBehavioralEngine } from '../hooks/useBehavioralEngine';

import PageHeader from '../components/ui/PageHeader';
import { SeptemberToAugustBanner } from '../components/SeptemberToAugustBanner';
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return safeStorage.getItem('masarifi_analytics_selected_month') || getBudgetMonth(new Date(), firstDayOfMonth);
  }); // YYYY-MM

  const updateSelectedMonth = (val: string) => {
    setSelectedMonth(val);
    safeStorage.setItem('masarifi_analytics_selected_month', val);
  };
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'budget' | 'weekly'>(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab') || 
                     new URLSearchParams(window.location.hash.split('?')[1] || '').get('tab');
    if (tabParam && ['overview', 'charts', 'budget', 'weekly'].includes(tabParam)) {
      return tabParam as 'overview' | 'charts' | 'budget' | 'weekly';
    }
    return 'overview';
  });
  const [chartSubTab, setChartSubTab] = useState<'daily' | 'monthly' | 'cumulative'>('daily');

  // React to search params or location state changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') || (location.state as any)?.tab;
    if (tabParam && ['overview', 'charts', 'budget', 'weekly'].includes(tabParam)) {
      setActiveTab(tabParam as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchParams, location.state]);

  const budget = useMemo(() => budgets?.find(b => b.month === selectedMonth), [budgets, selectedMonth]);

  const displayMonthName = useMemo(() => {
    try {
      const d = parseISO(`${selectedMonth}-01`);
      return format(d, 'MMMM yyyy', { locale: ar });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    try {
      const d = parseISO(`${selectedMonth}-01`);
      const prev = subMonths(d, 1);
      updateSelectedMonth(format(prev, 'yyyy-MM'));
      setPeriodPreset('custom');
      hapticFeedback('light');
    } catch {}
  };

  const handleNextMonth = () => {
    try {
      const d = parseISO(`${selectedMonth}-01`);
      const next = subMonths(d, -1);
      updateSelectedMonth(format(next, 'yyyy-MM'));
      setPeriodPreset('custom');
      hapticFeedback('light');
    } catch {}
  };

  // Handle Preset Changes
  const handlePresetSelect = (preset: PeriodPreset) => {
    hapticFeedback('light');
    setPeriodPreset(preset);
    const now = new Date();

    if (preset === 'this_month') {
      updateSelectedMonth(format(now, 'yyyy-MM'));
    } else if (preset === 'last_month') {
      const prev = subMonths(now, 1);
      updateSelectedMonth(format(prev, 'yyyy-MM'));
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
    if (periodPreset === 'this_month' || periodPreset === 'last_month' || periodPreset === 'custom') {
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const budgetMonthDate = new Date(year, month - 1, 1);
        const start = startOfMonth(budgetMonthDate);
        const end = endOfMonth(budgetMonthDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      } catch {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    } else {
      return {
        start: parseISO(startDate),
        end: parseISO(endDate)
      };
    }
  }, [periodPreset, selectedMonth, startDate, endDate]);

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
    const max = dailyData.reduce((max, day) => day.expenseAmount > max.expenseAmount ? day : max, dailyData[0]);
    if (!max || max.expenseAmount <= 0) {
      return { date: '-', expenseAmount: 0, fullDate: '-' };
    }
    return max;
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
    if (periodPreset === 'this_month' || periodPreset === 'last_month' || periodPreset === 'custom') {
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const prevMonthDate = subMonths(new Date(year, month - 1, 1), 1);
        const start = startOfMonth(prevMonthDate);
        const end = endOfMonth(prevMonthDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      } catch {
        const prev = subMonths(new Date(), 1);
        const start = startOfMonth(prev);
        const end = endOfMonth(prev);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    }
    
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.end.getTime() - duration)
    };
  }, [dateRange, periodPreset, selectedMonth]);

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
      const m = format(d, 'yyyy-MM');
      acc[m] = (acc[m] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const incomeMap = income.reduce((acc, i) => {
      if (i.isTransfer) return acc;
      const d = i.parsedDate || parseISO(i.date);
      const m = format(d, 'yyyy-MM');
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
  }, [expenses, income]);

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
      className="space-y-4 sm:space-y-6 px-3 sm:px-4 py-4 pb-32 relative text-right max-w-7xl mx-auto w-full"
      dir="rtl"
    >
      {/* 1. Header & Period Filters */}
      <PageHeader
        title="التحليل المالي والإحصائيات"
        subtitle="لوحة مؤشرات تنفيذية ورسوم بيانية ذكية لتتبع صحتك المالية وتدفقاتك"
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {/* Quick Period Presets */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 gap-1 overflow-x-auto no-scrollbar max-w-full">
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
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
                    periodPreset === p.id 
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            
            {/* Month Navigator with Next / Prev Controls */}
            {(periodPreset === 'this_month' || periodPreset === 'last_month' || periodPreset === 'custom') && (
              <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-2 py-1 shadow-xs">
                <button
                  onClick={handleNextMonth}
                  aria-label="الشهر التالي"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>

                <div className="relative flex items-center justify-center gap-1.5 px-2">
                  <Calendar size={13} className="text-indigo-500 shrink-0" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 whitespace-nowrap select-none">
                    {displayMonthName}
                  </span>
                  {/* Invisible native month picker overlay for quick jump */}
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) {
                        updateSelectedMonth(e.target.value);
                        setPeriodPreset('custom');
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="اختر شهراً محدداً"
                  />
                </div>

                <button
                  onClick={handlePrevMonth}
                  aria-label="الشهر السابق"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* September to August Date Correction Banner */}
      <SeptemberToAugustBanner />

      {/* 2. Unified Refined 4-Tab Navigation Bar with Full Mobile Horizontal Scroll Support */}
      <motion.div 
        variants={itemVariants} 
        className="w-full max-w-full overflow-x-auto no-scrollbar py-0.5"
      >
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 min-w-full sm:min-w-0 sm:max-w-2xl sm:mx-auto">
          {[
            { id: 'overview', label: 'النظرة التنفيذية', icon: Activity },
            { id: 'charts', label: 'الرسوم والتدفقات', icon: BarChart3 },
            { id: 'budget', label: 'هيكل الميزانية والنفقات', icon: Target },
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
                  "flex-1 min-w-[125px] sm:min-w-0 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black" 
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-semibold"
                )}
              >
                <Icon size={14} className={cn("shrink-0", activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 3. Active Tab Content Panel */}
      <div className="relative min-h-[420px] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="w-full"
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
