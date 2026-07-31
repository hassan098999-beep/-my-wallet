import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { cn, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { parseISO } from 'date-fns';
import { Save, Wallet, Activity, CircleCheckBig, Calendar, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { BudgetAlerts } from '../components/BudgetAlerts';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';
import IncomePage from './settings/Income';
import RecurringExpenses from './RecurringExpenses';

// Import sub-components
import BudgetOverview from '../components/budget/BudgetOverview';
import BudgetCategoryList from '../components/budget/BudgetCategoryList';

const BudgetPage = () => {
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

  const [activeTab, setActiveTab] = useState<'budget' | 'income' | 'recurring'>('budget');
  const [selectedMonth, setSelectedMonth] = useState(getBudgetMonth(new Date(), firstDayOfMonth));
  
  const currentBudget = useMemo(() => budgets.find(b => b.month === selectedMonth), [budgets, selectedMonth]);

  const [globalBudget, setGlobalBudget] = useState(currentBudget?.amount.toString() || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRuleInfo, setShowRuleInfo] = useState(false);
  
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(
    currentBudget?.categoryBudgets 
      ? Object.fromEntries(Object.entries(currentBudget.categoryBudgets).map(([k, v]) => [k, v.toString()]))
      : {}
  );

  // Sync state if budget changes externally or selected month changes
  useEffect(() => {
    if (currentBudget) {
      setGlobalBudget(currentBudget.amount?.toString() || '');
      setCategoryBudgets(Object.fromEntries(Object.entries(currentBudget.categoryBudgets || {}).map(([k, v]) => [k, v.toString()])));
    } else {
      setGlobalBudget('');
      setCategoryBudgets({});
    }
  }, [currentBudget]);

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
      categoryBudgets: parsedCategories
    });
    
    setIsSaved(true);
    toast.success(
      <div className="flex flex-col gap-1 text-right font-tajawal">
        <span className="font-bold text-sm">تم حفظ الميزانية الذكية! 💾</span>
        <span className="text-xs opacity-90">تم تحديث المخصصات والميزانية اليومية بنجاح.</span>
      </div>,
      { duration: 3000 }
    );
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCategoryBudgetChange = (id: string, value: string) => {
    setCategoryBudgets(prev => ({ ...prev, [id]: value }));
  };

  // One-click 50/30/20 Tuning
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
      
      const needs = categories.filter(c => c.type === 'need' || !c.type);
      const wants = categories.filter(c => c.type === 'want');
      const savings = categories.filter(c => c.type === 'saving');

      // 50% for Needs, 30% for Wants, 20% for Savings
      const needsPool = totalBudget * 0.5;
      const wantsPool = totalBudget * 0.3;
      const savingsPool = totalBudget * 0.2;

      if (needs.length > 0) {
        const perNeed = (needsPool / needs.length).toFixed(0);
        needs.forEach(c => newBudgets[c.id] = perNeed);
      }
      if (wants.length > 0) {
        const perWant = (wantsPool / wants.length).toFixed(0);
        wants.forEach(c => newBudgets[c.id] = perWant);
      }
      if (savings.length > 0) {
        const perSaving = (savingsPool / savings.length).toFixed(0);
        savings.forEach(c => newBudgets[c.id] = perSaving);
      }

      setCategoryBudgets(newBudgets);
      setIsGenerating(false);
      
      toast.success(
        <div className="flex flex-col gap-1 text-right font-tajawal">
          <span className="font-black text-sm">تم مواءمة الميزانية حسب قاعدة 50/30/20 ✨</span>
          <span className="text-xs opacity-90">قمنا بتقسيم المجموع تلقائياً على فئات الاحتياجات، الكماليات والادخار.</span>
        </div>,
        { duration: 4000 }
      );
    }, 700);
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
      const avgTotal = Object.values(monthGroups).reduce((a, b) => a + b, 0) / numMonths;

      const newCategoryBudgets: Record<string, string> = {};
      Object.entries(categoryAverages).forEach(([catId, total]) => {
        const avg = Math.round(total / numMonths);
        if (avg > 0) {
          newCategoryBudgets[catId] = avg.toString();
        }
      });

      setGlobalBudget(Math.round(avgTotal).toString());
      setCategoryBudgets(newCategoryBudgets);
      
      setIsGenerating(false);
      toast.success(
        <div className="flex flex-col gap-1 text-right font-tajawal">
          <span className="font-black text-sm">تم استلهام ميزانية من تاريخك 🧠📊</span>
          <span className="text-xs opacity-90">استندنا على متوسط إنفاقك الفعلي في الأشهر الماضية لاقتراح ميزانية واقعية.</span>
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

  const chartData = useMemo(() => {
    return categories.map(cat => {
      const spent = currentMonthExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const budgeted = Number(categoryBudgets[cat.id]) || 0;
      return {
        name: cat.name,
        spent: Number(spent.toFixed(2)),
        budgeted: Number(budgeted.toFixed(2)),
        color: cat.color,
      };
    }).filter(item => item.spent > 0 || item.budgeted > 0);
  }, [categories, currentMonthExpenses, categoryBudgets]);

  const {
    totalSpent,
    globalBudgetNum,
    overallPercentage,
    remainingDays,
    remainingBudget,
    dailyLimit,
    daysInMonth
  } = useBudgetStatus(selectedMonth);

  // Stagger Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const renderTabSwitcher = () => (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between" dir="rtl">
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('budget'); }}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'budget'
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Activity size={16} />
          <span>الميزانية الذكية 📊</span>
        </button>
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('income'); }}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'income'
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Wallet size={16} />
          <span>إدارة الدخل الوارد 💰</span>
        </button>
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('recurring'); }}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'recurring'
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <RefreshCw size={16} />
          <span>المصاريف المتكررة والجمعيات 🔄</span>
        </button>
      </div>
    </div>
  );

  if (activeTab === 'income') {
    return (
      <div className="space-y-6">
        {renderTabSwitcher()}
        <IncomePage />
      </div>
    );
  }

  if (activeTab === 'recurring') {
    return (
      <div className="space-y-6">
        {renderTabSwitcher()}
        <RecurringExpenses />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-4 pb-32 w-full max-w-full text-right font-tajawal rtl"
    >
      {renderTabSwitcher()}
      {/* Header Section */}
      <PageHeader
        title="مخطط الميزانية الذكي"
        subtitle="وزّع ميزانيتك الشهرية بذكاء، فعّل الصرف المتدحرج، ورشّد نفقاتك لضمان عيش متوازن"
        action={
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {/* Cycle day component */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500">بداية الدورة:</span>
              <select
                value={firstDayOfMonth}
                onChange={(e) => {
                  hapticFeedback('light');
                  setFirstDayOfMonth(Number(e.target.value));
                  toast.success(`دورتك المالية الجديدة ستبدأ يوم ${e.target.value} من كل شهر.`);
                }}
                className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {/* Custom Month Selector */}
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5 pointer-events-none" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  hapticFeedback('light');
                  setSelectedMonth(e.target.value);
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer active:scale-95",
                isSaved ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              )}
            >
              {isSaved ? <CircleCheckBig size={14} className="animate-bounce" /> : <Save size={14} />}
              <span>{isSaved ? 'تم الحفظ والمواءمة' : 'حفظ المخصّصات'}</span>
            </motion.button>
          </div>
        }
      />

      {/* Category smart budget warnings */}
      <BudgetAlerts />

      {/* Overview component */}
      <BudgetOverview
        globalBudget={globalBudget}
        setGlobalBudget={setGlobalBudget}
        currency={currency}
        totalSpent={totalSpent}
        remainingBudget={remainingBudget}
        overallPercentage={overallPercentage}
        dailyLimit={dailyLimit}
        remainingDays={remainingDays}
        daysInMonth={daysInMonth}
        rollingBudgetEnabled={rollingBudgetEnabled}
        setRollingBudgetEnabled={setRollingBudgetEnabled}
        globalBudgetNum={globalBudgetNum}
        chartData={chartData}
        categories={categories}
        showRuleInfo={showRuleInfo}
        setShowRuleInfo={setShowRuleInfo}
        suggestFromHistory={suggestFromHistory}
        autoAllocate={autoAllocate}
        isGenerating={isGenerating}
        itemVariants={itemVariants}
      />

      {/* Category List component */}
      <BudgetCategoryList
        categories={categories}
        currentMonthExpenses={currentMonthExpenses}
        categoryBudgets={categoryBudgets}
        handleCategoryBudgetChange={handleCategoryBudgetChange}
        remainingDays={remainingDays}
        currency={currency}
      />
    </motion.div>
  );
};

export default BudgetPage;
