import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { cn, hapticFeedback, getBudgetRange, getBudgetMonth, getWeekRange, safeStorage } from '../utils';
import { parseISO, addDays, startOfDay, endOfDay } from 'date-fns';
import { Save, Wallet, CircleCheckBig, Calendar, ArrowLeftRight, RefreshCw, Layers, Sliders, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { BudgetAlerts } from '../components/BudgetAlerts';
import { SeptemberToAugustBanner } from '../components/SeptemberToAugustBanner';
import { BudgetPeriod } from '../types';

// Sub-components
import BudgetOverview from '../components/budget/BudgetOverview';
import BudgetCategoryList from '../components/budget/BudgetCategoryList';

const BudgetPage = () => {
  const location = useLocation();
  const { 
    budgets, 
    setBudget, 
    categories, 
    expenses, 
    currency, 
    firstDayOfMonth, 
    setFirstDayOfMonth, 
    rollingBudgetEnabled,
    setRollingBudgetEnabled 
  } = useAppContext();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return safeStorage.getItem('masarifi_budget_selected_month') || getBudgetMonth(new Date(), firstDayOfMonth);
  });

  // Listen for month migration events across the app
  useEffect(() => {
    const handleMonthMigrated = (e: any) => {
      const targetMonth = e?.detail?.targetMonth || '2026-08';
      setSelectedMonth(targetMonth);
      safeStorage.setItem('masarifi_budget_selected_month', targetMonth);
    };

    window.addEventListener('masarifi:monthMigrated', handleMonthMigrated);
    return () => {
      window.removeEventListener('masarifi:monthMigrated', handleMonthMigrated);
    };
  }, []);
  
  const currentBudget = useMemo(() => budgets.find(b => b.month === selectedMonth), [budgets, selectedMonth]);

  const [globalBudget, setGlobalBudget] = useState(currentBudget?.amount?.toString() || '');
  const [overallPeriod, setOverallPeriod] = useState<BudgetPeriod>(currentBudget?.period || 'monthly');
  const [isSaved, setIsSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(() => !currentBudget?.amount || currentBudget.amount === 0);
  
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(
    currentBudget?.categoryBudgets 
      ? Object.fromEntries(Object.entries(currentBudget.categoryBudgets).map(([k, v]) => [k, v.toString()]))
      : {}
  );

  const [categoryWeeklyBudgets, setCategoryWeeklyBudgets] = useState<Record<string, Record<number, number>>>(
    currentBudget?.categoryWeeklyBudgets || {}
  );

  const [categoryPeriods, setCategoryPeriods] = useState<Record<string, BudgetPeriod>>(
    currentBudget?.categoryPeriods || {}
  );

  const currentWeekIndex = useMemo(() => {
    const today = new Date();
    const { start: monthStart, end: monthEnd } = getBudgetRange(selectedMonth, firstDayOfMonth);
    const weeks: { start: Date; end: Date }[] = [];
    let curStart = new Date(monthStart);
    while (curStart <= monthEnd) {
      const curEnd = new Date(Math.min(monthEnd.getTime(), addDays(curStart, 6).getTime()));
      weeks.push({ start: curStart, end: curEnd });
      curStart = addDays(curEnd, 1);
    }
    return weeks.findIndex(w => today >= startOfDay(w.start) && today <= endOfDay(w.end));
  }, [selectedMonth, firstDayOfMonth]);

  // Sync state if budget changes externally or selected month changes
  useEffect(() => {
    if (currentBudget) {
      setGlobalBudget(currentBudget.amount?.toString() || '');
      setOverallPeriod(currentBudget.period || 'monthly');
      setCategoryBudgets(Object.fromEntries(Object.entries(currentBudget.categoryBudgets || {}).map(([k, v]) => [k, v.toString()])));
      setCategoryWeeklyBudgets(currentBudget.categoryWeeklyBudgets || {});
      setCategoryPeriods(currentBudget.categoryPeriods || {});
    } else {
      setGlobalBudget('');
      setOverallPeriod('monthly');
      setCategoryBudgets({});
      setCategoryWeeklyBudgets({});
      setCategoryPeriods({});
    }
  }, [currentBudget]);

  const handleCategoryBudgetChange = (id: string, val: string) => {
    setCategoryBudgets(prev => ({ ...prev, [id]: val }));
    const num = Number(val) || 0;
    if (currentWeekIndex >= 0) {
      setCategoryWeeklyBudgets(prev => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          [currentWeekIndex]: num
        }
      }));
    }
  };

  const handleSave = () => {
    hapticFeedback('success');
    const parsedGlobal = Number(globalBudget) || 0;
    const parsedCategories: Record<string, number> = {};
    
    Object.entries(categoryBudgets).forEach(([id, val]) => {
      const num = Number(val);
      if (num > 0) {
        parsedCategories[id] = num;
      }
    });

    setBudget({
      amount: parsedGlobal,
      month: selectedMonth,
      period: overallPeriod,
      categoryBudgets: parsedCategories,
      categoryWeeklyBudgets,
      categoryPeriods: categoryPeriods
    });
    
    setIsSaved(true);
    toast.success(
      <div className="flex flex-col gap-1 text-right font-tajawal">
        <span className="font-bold text-sm">تم حفظ الميزانية الذكية وتحديث الفترات! 💾</span>
        <span className="text-xs opacity-90">تم تحديث المخصصات الشهرية والأسبوعية والميزانية اليومية بنجاح.</span>
      </div>,
      { duration: 3000 }
    );
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCategoryPeriodChange = (id: string, period: BudgetPeriod) => {
    setCategoryPeriods(prev => ({ ...prev, [id]: period }));
  };

  // One-click Smart Fluid Allocation (Proportional to habits and categories)
  const autoAllocate = () => {
    const totalBudget = Number(globalBudget) || 0;
    if (totalBudget <= 0) {
      toast.error('الرجاء كتابة مبلغ الميزانية أولاً لتنفيذ التوزيع الذكي!');
      return;
    }

    setIsGenerating(true);
    hapticFeedback('medium');
    
    setTimeout(() => {
      const newBudgets: Record<string, string> = {};
      const monthlyTotal = overallPeriod === 'weekly' ? totalBudget * 4.333 : totalBudget;
      
      const activeCats = categories.filter(c => !c.id.startsWith('archived_'));
      if (activeCats.length === 0) {
        setIsGenerating(false);
        return;
      }

      // Check if we have past expenses to allocate by actual spending proportions
      const pastExpenses = expenses.filter(e => !e.isTransfer);
      const catSpentMap: Record<string, number> = {};
      pastExpenses.forEach(e => {
        catSpentMap[e.categoryId] = (catSpentMap[e.categoryId] || 0) + e.amount;
      });
      const totalPastSpent = Object.values(catSpentMap).reduce((a, b) => a + b, 0);

      if (totalPastSpent > 0 && activeCats.some(c => (catSpentMap[c.id] || 0) > 0)) {
        activeCats.forEach(c => {
          const spent = catSpentMap[c.id] || 0;
          const weight = spent > 0 ? (spent / totalPastSpent) : (1 / (activeCats.length * 4));
          const catMonthly = monthlyTotal * weight;
          const isWeeklyCat = categoryPeriods[c.id] === 'weekly';
          const finalVal = isWeeklyCat ? Math.round(catMonthly / 4.333) : Math.round(catMonthly);
          if (finalVal > 0) {
            newBudgets[c.id] = finalVal.toString();
          }
        });
      } else {
        // Equal balanced distribution
        const perItemMonthly = monthlyTotal / activeCats.length;
        activeCats.forEach(c => {
          const isWeeklyCat = categoryPeriods[c.id] === 'weekly';
          const finalVal = isWeeklyCat ? Math.round(perItemMonthly / 4.333) : Math.round(perItemMonthly);
          if (finalVal > 0) {
            newBudgets[c.id] = finalVal.toString();
          }
        });
      }

      setCategoryBudgets(newBudgets);
      setIsGenerating(false);
      
      toast.success(
        <div className="flex flex-col gap-1 text-right font-tajawal">
          <span className="font-black text-sm">تم التوزيع التناسبي المرن للميزانية ✨</span>
          <span className="text-xs opacity-90">تم تقسيم السقف المالي بمرونة كاملة تتناسب مع احتياجاتك وفئاتك.</span>
        </div>,
        { duration: 3500 }
      );
    }, 500);
  };

  const suggestFromHistory = () => {
    setIsGenerating(true);
    hapticFeedback('medium');
    
    setTimeout(() => {
      const pastExpenses = expenses.filter(e => {
        if (e.isTransfer) return false;
        const eMonth = getBudgetMonth(parseISO(e.date), firstDayOfMonth);
        return eMonth < selectedMonth;
      });
      
      if (pastExpenses.length === 0) {
        toast.error('لا يوجد تاريخ إنفاق سابق كافٍ لاقتراح ميزانية. 🤷‍♂️');
        setIsGenerating(false);
        return;
      }

      const monthGroups: Record<string, number> = {};
      const categoryAverages: Record<string, number> = {};

      pastExpenses.forEach(e => {
        const monthKey = getBudgetMonth(parseISO(e.date), firstDayOfMonth);
        monthGroups[monthKey] = (monthGroups[monthKey] || 0) + e.amount;
        categoryAverages[e.categoryId] = (categoryAverages[e.categoryId] || 0) + e.amount;
      });

      const numMonths = Object.keys(monthGroups).length;
      const avgTotalMonthly = Object.values(monthGroups).reduce((a, b) => a + b, 0) / numMonths;

      const newCategoryBudgets: Record<string, string> = {};
      Object.entries(categoryAverages).forEach(([catId, total]) => {
        const avgMonthly = Math.round(total / numMonths);
        const isWeeklyCat = categoryPeriods[catId] === 'weekly';
        const finalVal = isWeeklyCat ? Math.round(avgMonthly / 4.333) : avgMonthly;
        if (finalVal > 0) {
          newCategoryBudgets[catId] = finalVal.toString();
        }
      });

      const finalGlobal = overallPeriod === 'weekly' ? Math.round(avgTotalMonthly / 4.333) : Math.round(avgTotalMonthly);
      setGlobalBudget(finalGlobal.toString());
      setCategoryBudgets(newCategoryBudgets);
      
      setIsGenerating(false);
      toast.success(
        <div className="flex flex-col gap-1 text-right font-tajawal">
          <span className="font-black text-sm">تم استلهام ميزانية من تاريخك 🧠📊</span>
          <span className="text-xs opacity-90">استندنا على متوسط إنفاقك الفعلي مع مراعاة التقسيم الأسبوعي والشهري.</span>
        </div>,
        { duration: 4000 }
      );
    }, 700);
  };

  const currentMonthExpenses = useMemo(() => {
    const { start, end } = getBudgetRange(selectedMonth, firstDayOfMonth);
    return expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = parseISO(e.date);
      return d >= start && d <= end;
    });
  }, [expenses, selectedMonth, firstDayOfMonth]);

  const currentWeekExpenses = useMemo(() => {
    const { start, end } = getWeekRange(new Date(), 1);
    return expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = parseISO(e.date);
      return d >= start && d <= end;
    });
  }, [expenses]);

  const {
    totalSpent,
    monthSpent,
    weekSpent,
    globalBudgetNum,
    overallPercentage,
    remainingDays,
    remainingDaysInWeek,
    remainingBudget,
    dailyLimit,
    daysInMonth,
    categoryStatusesLookup
  } = useBudgetStatus(selectedMonth);

  const chartData = useMemo(() => {
    return categories.map(cat => {
      const isWeeklyCat = categoryPeriods[cat.id] === 'weekly';
      const catSpent = isWeeklyCat
        ? currentWeekExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0)
        : currentMonthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);

      const budgeted = Number(categoryBudgets[cat.id]) || 0;
      return {
        name: isWeeklyCat ? `${cat.name} (أس)` : cat.name,
        spent: Number(catSpent.toFixed(2)),
        budgeted: Number(budgeted.toFixed(2)),
        color: cat.color,
      };
    }).filter(item => item.spent > 0 || item.budgeted > 0);
  }, [categories, currentMonthExpenses, currentWeekExpenses, categoryBudgets, categoryPeriods]);

  // Stagger Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-3 sm:p-4 md:p-6 pb-28 w-full max-w-7xl mx-auto text-right font-tajawal rtl"
    >
      {/* Top Header & Navigation Tabs */}
      <div className="space-y-4">
        {/* Page Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              لوحة الميزانية الذكية
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              تتبع السقف المالي، الميزانية المتدحرجة، ومخصصات الفئات اليومية والأسبوعية
            </p>
          </div>

          {/* Action controls: Month picker, Start day & Save Button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
            {/* Cycle day */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400">الدورة:</span>
              <select
                value={firstDayOfMonth}
                onChange={(e) => {
                  hapticFeedback('light');
                  setFirstDayOfMonth(Number(e.target.value));
                  toast.success(`دورتك المالية ستبدأ يوم ${e.target.value} من كل شهر.`);
                }}
                className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {/* Custom Month Selector */}
            <div className="relative">
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 size-3.5 pointer-events-none" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  hapticFeedback('light');
                  const val = e.target.value;
                  setSelectedMonth(val);
                  safeStorage.setItem('masarifi_budget_selected_month', val);
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-2.5 pr-8 py-1.5 text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Quick Switch to August 2026 if September is selected */}
            {selectedMonth === '2026-09' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  hapticFeedback('medium');
                  setSelectedMonth('2026-08');
                  safeStorage.setItem('masarifi_budget_selected_month', '2026-08');
                  toast.success('تم الانتقال إلى ميزانية شهر أوت (أغسطس) 2026');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/20 animate-pulse"
                title="التبديل الفوري إلى شهر أوت 2026"
              >
                <Sparkles size={13} />
                <span>عرض شهر أوت 2026 الحالي</span>
              </motion.button>
            )}

            {/* Settings Quick Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                hapticFeedback('light');
                const next = !showSettings;
                setShowSettings(next);
                if (next) {
                  setTimeout(() => {
                    document.getElementById('global-budget-input')?.focus();
                    document.getElementById('budget-settings-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 shadow-2xs",
                showSettings 
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900" 
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
              )}
              title="إعدادات وتعديل الميزانية"
            >
              <Sliders size={13} />
              <span>{showSettings ? 'إخفاء الإعدادات' : 'الإعدادات'}</span>
            </motion.button>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className={cn(
                "flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl font-black text-xs transition-all shadow-2xs cursor-pointer active:scale-95",
                isSaved ? "bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {isSaved ? <CircleCheckBig size={14} className="animate-bounce" /> : <Save size={14} />}
              <span>{isSaved ? 'تم الحفظ' : 'حفظ الميزانية'}</span>
            </motion.button>
          </div>
        </div>

        {/* Navigation Tabs: (الميزانية / مصادر الدخل / المصاريف المتكررة) */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
          <Link
            to="/budget"
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0",
              location.pathname === '/budget'
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <Layers size={13} />
            <span>الميزانية الذكية</span>
          </Link>

          <Link
            to="/income"
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0",
              location.pathname === '/income'
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <ArrowLeftRight size={13} />
            <span>مصادر الدخل</span>
          </Link>

          <Link
            to="/recurring"
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0",
              location.pathname === '/recurring'
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <RefreshCw size={13} />
            <span>المصاريف المتكررة</span>
          </Link>
        </div>
      </div>

      {/* Migration banner if September data or budget is detected */}
      <SeptemberToAugustBanner
        onMigrateSuccess={(newMonth) => {
          setSelectedMonth(newMonth);
          safeStorage.setItem('masarifi_budget_selected_month', newMonth);
        }}
      />

      {/* Category smart budget warnings */}
      <BudgetAlerts />

      {/* Overview component */}
      <BudgetOverview
        globalBudget={globalBudget}
        setGlobalBudget={setGlobalBudget}
        overallPeriod={overallPeriod}
        setOverallPeriod={setOverallPeriod}
        currency={currency}
        totalSpent={totalSpent}
        monthSpent={monthSpent}
        weekSpent={weekSpent}
        remainingBudget={remainingBudget}
        overallPercentage={overallPercentage}
        dailyLimit={dailyLimit}
        remainingDays={remainingDays}
        remainingDaysInWeek={remainingDaysInWeek}
        daysInMonth={daysInMonth}
        rollingBudgetEnabled={rollingBudgetEnabled}
        setRollingBudgetEnabled={setRollingBudgetEnabled}
        globalBudgetNum={globalBudgetNum}
        chartData={chartData}
        categories={categories}
        suggestFromHistory={suggestFromHistory}
        autoAllocate={autoAllocate}
        isGenerating={isGenerating}
        itemVariants={itemVariants}
        selectedMonth={selectedMonth}
        firstDayOfMonth={firstDayOfMonth}
        setFirstDayOfMonth={setFirstDayOfMonth}
        expenses={expenses}
        budgets={budgets}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />

      {/* Category List component */}
      <BudgetCategoryList
        categories={categories}
        currentMonthExpenses={currentMonthExpenses}
        currentWeekExpenses={currentWeekExpenses}
        categoryBudgets={categoryBudgets}
        categoryPeriods={categoryPeriods}
        handleCategoryBudgetChange={handleCategoryBudgetChange}
        handleCategoryPeriodChange={handleCategoryPeriodChange}
        remainingDays={remainingDays}
        remainingDaysInWeek={remainingDaysInWeek}
        currency={currency}
        categoryStatusesLookup={categoryStatusesLookup}
        rollingBudgetEnabled={rollingBudgetEnabled}
      />
    </motion.div>
  );
};

export default BudgetPage;
