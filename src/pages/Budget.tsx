import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { cn, hapticFeedback, getBudgetRange, getBudgetMonth, getWeekRange, safeStorage } from '../utils';
import { parseISO, addDays, startOfDay, endOfDay } from 'date-fns';
import { 
  Save, CircleCheckBig, Calendar, ArrowLeftRight, RefreshCw, 
  Layers, Sliders, Sparkles, History, BarChart2, Baby, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { BudgetAlerts } from '../components/BudgetAlerts';
import { SeptemberToAugustBanner } from '../components/SeptemberToAugustBanner';
import { BudgetPeriod } from '../types';

// Sub-components
import BudgetOverview from '../components/budget/BudgetOverview';
import BudgetCategoryList from '../components/budget/BudgetCategoryList';
import { BudgetAnalyticsTab } from '../components/budget/BudgetAnalyticsTab';
import { BudgetHistoryTab } from '../components/budget/BudgetHistoryTab';
import { BabyBudgetAssistant } from '../components/budget/BabyBudgetAssistant';
import { BudgetSettingsModal } from '../components/budget/BudgetSettingsModal';

type ActiveViewTab = 'current' | 'analytics' | 'baby' | 'history';

const BudgetPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Tab State: 'current' | 'analytics' | 'baby' | 'history'
  const [activeTab, setActiveTab] = useState<ActiveViewTab>(() => {
    const tabParam = searchParams.get('tab') as ActiveViewTab;
    if (tabParam && ['current', 'analytics', 'baby', 'history'].includes(tabParam)) {
      return tabParam;
    }
    return 'current';
  });

  // Sync tab with URL search params if changed externally
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ActiveViewTab;
    if (tabParam && tabParam !== activeTab && ['current', 'analytics', 'baby', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam && activeTab !== 'current') {
      setActiveTab('current');
    }
  }, [searchParams]);

  const handleTabChange = (tab: ActiveViewTab) => {
    hapticFeedback('light');
    setActiveTab(tab);
    if (tab !== 'current') {
      setSearchParams({ tab });
    } else {
      setSearchParams({});
    }
  };

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
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

  // One-click Smart Allocation
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

      // Check past expenses
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
          <span className="text-xs opacity-90">تم تقسيم السقف المالي بمرونة تتناسب مع احتياجاتك وفئاتك.</span>
        </div>,
        { duration: 3500 }
      );
    }, 450);
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
    }, 500);
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

  return (
    <div className="space-y-5 p-3 sm:p-4 md:p-6 pb-28 w-full max-w-7xl mx-auto text-right font-tajawal rtl">
      
      {/* Top Header Bar: Clean & High-Clarity */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-150 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            الميزانية والإنفاق
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            تتبع وضبط سقف الصرف ومخصصات الفئات اليومية والأسبوعية
          </p>
        </div>

        {/* Action Controls: Month Picker, Quick Switch, Settings & Save */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
          
          {/* Month Selector */}
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-2.5 pr-8 py-1.5 text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/20"
              title="التبديل الفوري إلى شهر أوت 2026"
            >
              <Sparkles size={13} />
              <span>شهر أوت الحالي</span>
            </motion.button>
          )}

          {/* Settings Modal Button */}
          <button
            type="button"
            onClick={() => {
              hapticFeedback('light');
              setIsSettingsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
            title="إعدادات الميزانية الشاملة"
          >
            <Sliders size={13} className="text-slate-400" />
            <span>الإعدادات</span>
          </button>

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

      {/* Smart Segmented Views Bar (تبويبات التنقل الذكية المدمجة) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-150 dark:border-slate-800 pb-2">
        
        {/* Main Tab Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          
          <button
            type="button"
            onClick={() => handleTabChange('current')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              activeTab === 'current'
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <Layers size={13} />
            <span>الميزانية والإنفاق</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('analytics')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              activeTab === 'analytics'
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900/60 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <BarChart2 size={13} />
            <span>التحليل البياني</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('baby')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              activeTab === 'baby'
                ? "bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-900/60 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <Baby size={13} className="text-pink-500" />
            <span>مساعد الرضيع 🍼</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('history')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              activeTab === 'history'
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <History size={13} />
            <span>سجل وتعديل الشهور</span>
          </button>

        </div>

        {/* Quick Links to Income and Recurring */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Link
            to="/income"
            className="hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <ArrowLeftRight size={11} />
            <span>مصادر الدخل</span>
          </Link>
          <span>•</span>
          <Link
            to="/recurring"
            className="hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={11} />
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

      {/* View Content Rendering */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Master Summary Hero Card */}
          <BudgetOverview
            globalBudget={globalBudget}
            setGlobalBudget={setGlobalBudget}
            overallPeriod={overallPeriod}
            setOverallPeriod={setOverallPeriod}
            currency={currency}
            totalSpent={totalSpent}
            remainingBudget={remainingBudget}
            overallPercentage={overallPercentage}
            dailyLimit={dailyLimit}
            remainingDays={remainingDays}
            remainingDaysInWeek={remainingDaysInWeek}
            daysInMonth={daysInMonth}
            rollingBudgetEnabled={rollingBudgetEnabled}
            setRollingBudgetEnabled={setRollingBudgetEnabled}
            globalBudgetNum={globalBudgetNum}
            suggestFromHistory={suggestFromHistory}
            autoAllocate={autoAllocate}
            isGenerating={isGenerating}
            selectedMonth={selectedMonth}
            firstDayOfMonth={firstDayOfMonth}
            expenses={expenses}
            budgets={budgets}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />

          {/* Clean, Filterable Category Budgets List */}
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
            onAutoAllocate={autoAllocate}
            onSuggestFromHistory={suggestFromHistory}
            isGenerating={isGenerating}
          />
        </div>
      )}

      {activeTab === 'analytics' && (
        <BudgetAnalyticsTab
          chartData={chartData}
          categories={categories}
          currency={currency}
          selectedMonth={selectedMonth}
          firstDayOfMonth={firstDayOfMonth}
          expenses={expenses}
          budgets={budgets}
          globalBudgetNum={globalBudgetNum}
          totalSpent={totalSpent}
        />
      )}

      {activeTab === 'baby' && (
        <div className="space-y-4">
          <BabyBudgetAssistant
            selectedMonth={selectedMonth}
            onBudgetApplied={(catId, amount) => {
              handleCategoryBudgetChange(catId, amount.toString());
            }}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <BudgetHistoryTab
          currentSelectedMonth={selectedMonth}
          onSelectMonthForBudget={(month) => {
            setSelectedMonth(month);
            safeStorage.setItem('masarifi_budget_selected_month', month);
            handleTabChange('current');
          }}
        />
      )}

      {/* Global Settings & AI Allocator Modal */}
      <BudgetSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        globalBudget={globalBudget}
        setGlobalBudget={setGlobalBudget}
        overallPeriod={overallPeriod}
        setOverallPeriod={setOverallPeriod}
        firstDayOfMonth={firstDayOfMonth}
        setFirstDayOfMonth={setFirstDayOfMonth}
        rollingBudgetEnabled={rollingBudgetEnabled}
        setRollingBudgetEnabled={setRollingBudgetEnabled}
        currency={currency}
        autoAllocate={autoAllocate}
        suggestFromHistory={suggestFromHistory}
        isGenerating={isGenerating}
      />

    </div>
  );
};

export default BudgetPage;
