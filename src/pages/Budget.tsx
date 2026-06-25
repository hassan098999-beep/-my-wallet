import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { cn, formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { parseISO, differenceInDays, startOfDay } from 'date-fns';
import { 
  Save, CircleAlert, TrendingUp, Target, Wallet, Activity, 
  CircleCheckBig, Calendar, Wand2, Loader2, Info, Lightbulb, Zap,
  TrendingDown, PieChart, ShieldCheck, Sparkles, Clock, HelpCircle,
  RefreshCw, Check, Percent
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { DynamicIcon } from '../components/DynamicIcon';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { BudgetAlerts } from '../components/BudgetAlerts';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const BudgetPage = () => {
  const { 
    budget, 
    setBudget, 
    categories, 
    expenses, 
    currency, 
    firstDayOfMonth, 
    setFirstDayOfMonth, 
    rollingBudgetEnabled,
    setRollingBudgetEnabled 
  } = useAppContext();

  const [globalBudget, setGlobalBudget] = useState(budget?.amount.toString() || '');
  const [selectedMonth, setSelectedMonth] = useState(budget?.month || getBudgetMonth(new Date(), firstDayOfMonth));
  const [isSaved, setIsSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRuleInfo, setShowRuleInfo] = useState(false);
  
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(
    budget?.categoryBudgets 
      ? Object.fromEntries(Object.entries(budget.categoryBudgets).map(([k, v]) => [k, v.toString()]))
      : {}
  );

  // Sync state if budget changes externally
  useEffect(() => {
    if (budget) {
      setGlobalBudget(budget.amount.toString());
      setCategoryBudgets(Object.fromEntries(Object.entries(budget.categoryBudgets).map(([k, v]) => [k, v.toString()])));
    }
  }, [budget]);

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

  // Categories Categorization mapped to standard system categories
  const groupedCategories = [
    { 
      id: 'need', 
      title: 'الاحتياجات الضرورية والمصاريف الأساسية', 
      percentNum: 50,
      description: 'الفواتير، الأكل والشرب، النقل، الكراء ومصاريف التداوي. نوصي بتخصيص %50 كحد أقصى للتحكم في قفة العائلة.',
      color: 'bg-rose-500', 
      items: categories.filter(c => c.type === 'need' || !c.type) 
    },
    { 
      id: 'want', 
      title: 'الرغبات ومصاريف الرفاهية والكماليات', 
      percentNum: 30,
      description: 'القهوة، المطاعم، الشوبينغ، السفر والاشتراكات الترفيهية. نوصي ألا تتخطى مصاريف الرفاهية %30.',
      color: 'bg-amber-500', 
      items: categories.filter(c => c.type === 'want') 
    },
    { 
      id: 'saving', 
      title: 'الادخار الشخصي والاستثمار وبناء المستقبل', 
      percentNum: 20,
      description: 'حسابات الإدخار، حصالة الأطفال، الاستثمار أو تسديد الديون الطارئة. حافظ على %20 على الأقل لبناء غدٍ أضمن.',
      color: 'bg-emerald-500', 
      items: categories.filter(c => c.type === 'saving') 
    },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-4 pb-32 w-full max-w-full text-right font-tajawal rtl"
    >
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

      {/* Main Intelligent Budget Dashboard Dashboard and Progress */}
      <motion.div variants={itemVariants}>
        <div className="card relative overflow-hidden p-6 md:p-8 shadow-xs">
          
          {/* Subtle decorative background light */}
          <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 -ml-20 -mb-20 w-80 h-80 bg-primary-500/5 dark:bg-primary-400/5 rounded-full blur-3xl pointer-events-none" />

          {/* Interactive header of Dashboard */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800/60 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 shrink-0">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 dark:text-white">الميزانية الإجمالية وحالة الصرف</h2>
                <p className="text-[10px] text-slate-400 font-bold">عيّن سقف مصروفاتك للشهر الحالي لتنظيم الميزانية الذكية</p>
              </div>
            </div>

            {/* Quick Allocator and Information clicker */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowRuleInfo(!showRuleInfo)}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/10 px-3 py-1.5 rounded-lg border border-indigo-150/15"
              >
                <HelpCircle size={13} />
                <span>شرح قاعدة 50/30/20</span>
              </button>
              
              <button 
                onClick={autoAllocate}
                disabled={isGenerating || !globalBudget}
                className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-1.5 rounded-lg border border-emerald-500/10 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
              >
                {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                توزيع تلقائي للمخصصات
              </button>
            </div>
          </div>

          {/* 50/30/20 explanation panel */}
          <AnimatePresence>
            {showRuleInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 space-y-2 text-xs leading-relaxed"
              >
                <p className="font-black text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  ما هي قاعدة الميزانية المثالية 50/30/20؟
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  قاعدة مالية بسيطة وفعالة تقسم دخلك أو ميزانيتك الكلية إلى ثلاثة روافد لتضمن العيش السليم وتجنّب الديون والاستهلاك السلبي لـ قفة العائلة:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100/30">
                    <p className="font-black text-red-600 dark:text-red-400 flex items-center gap-1">%50 للاحتياجات الأساسية</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">كل المصاريف الحتمية التي لا مفر منها للمعيشة اليومية لتسيير حياتك بسلاسة.</p>
                  </div>
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-100/30">
                    <p className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">%30 للرغبات والكماليات</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium font-tajawal">النشاطات الترفيهية، الشوبينغ، القهوة والموائد الخارجية والأشياء التي تحبها.</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/30">
                    <p className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">%20 للإدخار والاستثمار المستقبل</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">بناء الوسادة الطارئة، الاستثمار العقلي أو تزويد حصالة الأهداف والتحصين المالي.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Budget Input & Progress Gauge Block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Portion of Block: Raw Input and Balance Indicators */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">مبلغ الميزانية المستهدف</span>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={globalBudget}
                    onChange={(e) => setGlobalBudget(e.target.value)}
                    onFocus={(e) => {
                      if (!globalBudget || globalBudget === '0' || globalBudget === '0.00' || parseFloat(globalBudget) === 0) {
                        setGlobalBudget('');
                      } else {
                        const target = e.target;
                        setTimeout(() => {
                          try {
                            target.setSelectionRange(0, target.value.length);
                          } catch (err) {
                            target.select();
                          }
                        }, 50);
                      }
                    }}
                    onClick={(e) => {
                      if (!globalBudget || globalBudget === '0' || globalBudget === '0.00' || parseFloat(globalBudget) === 0) {
                        setGlobalBudget('');
                      } else {
                        const target = e.target as HTMLInputElement;
                        setTimeout(() => {
                          try {
                            target.setSelectionRange(0, target.value.length);
                          } catch (err) {
                            target.select();
                          }
                        }, 50);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-3xl font-black text-center font-mono text-slate-800 dark:text-white transition-all focus:border-emerald-500 outline-none"
                    placeholder="0.00"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-black">{currency}</span>
                </div>
              </div>

              {/* Dynamic summary counts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">ما تم صرفه فعلياً</p>
                  <p className="text-sm font-black text-rose-500">{formatCurrency(totalSpent, currency)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">المبلغ المتبقي</p>
                  <p className={cn(
                    "text-sm font-black",
                    remainingBudget > 0 ? "text-emerald-500" : "text-rose-500"
                  )}>{formatCurrency(remainingBudget, currency)}</p>
                </div>
              </div>
            </div>

            {/* Right Portion of Block: Visual Progress, Daily Limit calculation, Rolling switch */}
            <div className="lg:col-span-7 space-y-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/40">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">نسبة استهلاك الميزانية الكلية</span>
                  <span className={cn(
                    "text-xs font-black px-2.5 py-1 rounded-lg",
                    overallPercentage > 100 ? "bg-rose-50/50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400" :
                    overallPercentage > 85 ? "bg-amber-50/50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" :
                    "bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                  )}>
                    {overallPercentage.toFixed(1)}% المستهلك
                  </span>
                </div>
                
                {/* Custom glowing progress bar */}
                <div className="h-4 bg-slate-150 dark:bg-slate-900 rounded-full p-0.5 border border-slate-200/40 dark:border-slate-800 shadow-inner relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full transition-colors duration-500",
                      overallPercentage > 100 ? "bg-rose-500" : overallPercentage > 85 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                    )}
                  />
                </div>
              </div>

              {/* Auxiliary calculation summary */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="bg-white dark:bg-slate-900/60 rounded-xl p-3 shadow-xs border border-slate-100/30">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">الميزانية اليومية المقترحة ⚡</p>
                  <p className="text-base font-black text-slate-800 dark:text-white">{formatCurrency(dailyLimit, currency)}</p>
                  <p className="text-[8px] text-slate-400 font-medium mt-0.5">
                    {rollingBudgetEnabled ? "تتكيف يومياً بناءً على ما أنفقته" : "موزعة بالتساوي على الأيام"}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/60 rounded-xl p-3 shadow-xs border border-slate-100/30">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">دورتك المالية المتبقية ⏳</p>
                  <p className="text-base font-black text-slate-800 dark:text-white">{remainingDays} <span className="text-xs text-slate-400">أيّام</span></p>
                  <p className="text-[8px] text-slate-400 font-medium mt-0.5">من أصل {daysInMonth} يوم في دورتك</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </motion.div>

      {/* Embedded rolling budget toggle manager */}
      <motion.div variants={itemVariants}>
        <Card className="p-5 border-l-4 border-l-primary-500 text-right bg-gradient-to-br from-indigo-50/20 via-white to-white dark:from-indigo-950/5 dark:via-slate-900 dark:to-slate-900">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                <Sparkles size={14} className="text-amber-500 animate-pulse" />
                الميزانية المتدحرجة (Rolling Budget)
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-2xl font-medium">
                ميزة ذكية تعيد حساب مسموح صرفك اليومي تلقائياً كل 24 ساعة. إذا صرفت أقل من حدك اليومي، يرتفع حدك غداً مفسحاً لك المجال للترفيه الآمن، والعكس بالعكس لتبقى منضبطاً!
              </p>
            </div>
            
            {/* Elegant Toggle switch */}
            <div className="flex items-center gap-3 self-end md:self-center">
              <span className="text-xs font-black text-slate-500 dark:text-slate-300">
                {rollingBudgetEnabled ? 'مفعلة تلقائياً ✅' : 'الميزانية الثابتة ⚠️'}
              </span>
              <button
                onClick={() => {
                  hapticFeedback('medium');
                  setRollingBudgetEnabled(!rollingBudgetEnabled);
                  toast.success(
                    rollingBudgetEnabled 
                      ? 'تم التحول للمود الثابت للميزانية اليومية.' 
                      : 'تم تفعيل حساب الميزانية المتدحرجة! استمتع بنصائح يومية ذكية هادفة.'
                  );
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                  rollingBudgetEnabled ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                    rollingBudgetEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Advisory and Alert Box based on current status */}
      <motion.div variants={itemVariants}>
        <div className={cn(
          "p-4 rounded-2xl border flex items-start gap-3.5 transition-all",
          overallPercentage > 100 ? "bg-rose-50/40 border-rose-100 text-rose-800 dark:bg-rose-950/10 dark:border-rose-900/30" :
          overallPercentage > 80 ? "bg-amber-50/40 border-amber-100 text-amber-800 dark:bg-amber-950/10 dark:border-amber-900/30" :
          globalBudgetNum === 0 ? "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/10 dark:border-slate-800" :
          "bg-emerald-50/40 border-emerald-100 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/30"
        )}>
          <div className="shrink-0 mt-0.5">
            {overallPercentage > 100 ? <TrendingDown size={18} className="text-rose-500 animate-[bounce_2s_infinite]" /> :
             overallPercentage > 80 ? <Info size={18} className="text-amber-500 animate-pulse" /> :
             globalBudgetNum === 0 ? <HelpCircle size={18} className="text-slate-500" /> :
             <ShieldCheck size={18} className="text-emerald-500" />}
          </div>
          <div className="space-y-1.5 flex-1 text-right">
            <h4 className="text-xs font-black">
              {overallPercentage > 100 ? 'لقد تخطيت الميزانية المحددة بالكامل! 🚨' :
               overallPercentage > 80 ? 'لقد شارفت ميزانيتك على النفاد! ⚠️' :
               globalBudgetNum === 0 ? 'ابدأ بإعداد ميزانيتك المالية للتحكم بمصاريفك.' :
               'وضعك المالي متميز ومنضبط! 🛡️'}
            </h4>
            <p className="text-[11px] leading-relaxed opacity-95">
              {overallPercentage > 100 ? 'ننصحك بشدة بوقف الصرف غير الطارئ فوراً وتفعيل الميزانية المتدحرجة لتخفيض الصدمة والحد من التأثير السلبي لقفة العائلة.' :
               overallPercentage > 80 ? `المبلغ المتبقي لدورتك هو (${formatCurrency(remainingBudget, currency)}) الموزع على ${remainingDays} أيام. أي بمعدل ${formatCurrency(dailyLimit, currency)} لليوم الواحد.` :
               globalBudgetNum === 0 ? 'ضع مبلغاً تقديرياً تود ألا تتخطاه هذا الشهر، ثم انقر على "توزيع ذكي" لنوزعه تلقائياً على كل فئة حسب أهميتها.' :
               'أنت تصرف بمعدل صحي ومقنن تحت وطأة التحكم المالي. التزامك بقاعدة 50/30/20 سيحمي أهداف إدخارك.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Graphical Comparison Dashboard */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Activity size={18} className="text-emerald-500 animate-pulse" />
            <span>التحليل والمقارنة الرسومية للفئات المحددة</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-bold">تقرير بصري مقارن يوضح نفقاتك الفعلية بموازاة السقف المحدد لكل فئة من دورتك الحالية</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Comparative horizontal Bar Chart */}
          <div className="lg:col-span-8 card p-5 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 text-right">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">الميزانية المرصودة مقابل المصروف المنجز</h4>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">مقارنة ثنائية بصرية لكافة فئات الدفتر العائلي</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 bg-indigo-500/80 rounded-full" />
                <span className="text-[9px] text-slate-500 font-black pl-2">الميزانية</span>
                <span className="w-2 h-2 bg-rose-500/90 rounded-full" />
                <span className="text-[9px] text-slate-500 font-black">المصروف</span>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="w-full" style={{ height: `${Math.max(240, chartData.length * 40)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.3} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 750, fill: '#94a3b8' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      orientation="right"
                      tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                      width={110}
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                      contentStyle={{ borderRadius: '14px', background: '#0f172a', border: '1px solid #1e293b', direction: 'rtl' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', fontFamily: 'Tajawal, sans-serif' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif', textAlign: 'right' }}
                      formatter={(value: any, name: any) => [
                        `${value} ${currency}`,
                        name === 'budgeted' ? 'الميزانية المخصصة' : 'المصروف الفعلي'
                      ]}
                    />
                    <Bar dataKey="budgeted" name="budgeted" fill="#6366f1" radius={[0, 3, 3, 0]} barSize={8}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-budgeted-${index}`} fill={entry.color ? `${entry.color}35` : '#6366f135'} stroke={entry.color || '#6366f1'} strokeWidth={1.5} />
                      ))}
                    </Bar>
                    <Bar dataKey="spent" name="spent" fill="#ef4444" radius={[0, 3, 3, 0]} barSize={8}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-spent-${index}`} 
                          fill={entry.spent > entry.budgeted && entry.budgeted > 0 ? '#f43f5e' : `${entry.color || '#10b981'}bb`} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center text-slate-400">
                  <TrendingUp size={22} />
                </div>
                <p className="text-xs font-black text-slate-500">لا توجد مخصصات أو مصاريف لتمثيلها حالياً.</p>
                <p className="text-[10px] text-slate-400">حدد ميزانية لبعض الفئات في الأسفل أو أضف نفقات جديدة للشهر الحالي لتفعيل الرسم البياني التفاعلي.</p>
              </div>
            )}
          </div>

          {/* Allocation Gauge cards */}
          <div className="lg:col-span-4 card p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">توزيع النفقات حسب قاعدة 50/30/20</h4>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">حالة توازن النفقات حسب طبيعة كل فئة</p>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-5 py-2">
              {/* Needs Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-rose-500 font-mono">
                    {formatCurrency(chartData.filter(i => {
                      const found = categories.find(c => c.name === i.name);
                      return found?.type === 'need' || !found?.type;
                    }).reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => {
                      const found = categories.find(c => c.name === i.name);
                      return found?.type === 'need' || !found?.type;
                    }).reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-650 dark:text-slate-350">الاحتياجات الحتمية (%50 المقترح)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgets = chartData.filter(i => {
                          const found = categories.find(c => c.name === i.name);
                          return found?.type === 'need' || !found?.type;
                        }).reduce((s, x) => s + x.budgeted, 0);
                        const spents = chartData.filter(i => {
                          const found = categories.find(c => c.name === i.name);
                          return found?.type === 'need' || !found?.type;
                        }).reduce((s, x) => s + x.spent, 0);
                        return budgets > 0 ? (spents / budgets) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>

              {/* Wants Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-amber-500 font-mono">
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-650 dark:text-slate-350">الكماليات والترفيه (%30 المقترح)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgets = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.budgeted, 0);
                        const spents = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.spent, 0);
                        return budgets > 0 ? (spents / budgets) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>

              {/* Savings Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-emerald-500 font-mono">
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-650 dark:text-slate-350">الادخار والتأمين (%20 المقترح)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgets = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.budgeted, 0);
                        const spents = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.spent, 0);
                        return budgets > 0 ? (spents / budgets) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 font-bold leading-relaxed">
              إذا تجاوز المصروف الفعلي حاجز الميزانية، سيظهر شريط فئة المعاملات باللون الأحمر المنبّه لحمايتك من الاستهلاك الزائد للقفة الأسبوعية.
            </div>
          </div>
        </div>
      </motion.div>


      {/* Category Breakdown list */}
      <div className="space-y-10">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <PieChart size={18} className="text-indigo-500" />
            <span>تنظيم وتفصيل ميزانية الفئات الفردية</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-bold">خصّص ميزانية دقيقة لكل فئة والمسؤوليات المصاحبة ككل</p>
        </div>

        {groupedCategories.map((group, groupIdx) => (
          <motion.div 
            key={group.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.12 }}
            className="space-y-4"
          >
            {/* Header of Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-3.5 h-3.5 rounded-full shadow-xs", group.color)} />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{group.title}</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">%{group.percentNum} المقترح</span>
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold max-w-3xl leading-relaxed">
                  {group.description}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 shrink-0 self-start md:self-center bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800 font-mono">{group.items.length} فئات فعالة</span>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {group.items.length > 0 ? (
                group.items.map((cat) => {
                  const spent = currentMonthExpenses
                    .filter(e => e.categoryId === cat.id)
                    .reduce((sum, e) => sum + e.amount, 0);
                  
                  const catBudgetStr = categoryBudgets[cat.id] || '';
                  const catBudgetNum = Number(catBudgetStr) || 0;
                  const percentage = catBudgetNum > 0 ? (spent / catBudgetNum) * 100 : 0;
                  const isOver = catBudgetNum > 0 && spent > catBudgetNum;

                  return (
                    <Card
                      key={cat.id}
                      className={cn(
                        "p-5 border-2 transition-all relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs",
                        isOver 
                          ? "border-rose-200 dark:border-rose-800/40 bg-rose-50/20 dark:bg-rose-950/10" 
                          : "border-slate-100 dark:border-slate-800/60"
                      )}
                      interactive
                    >
                      {/* Top components of Card */}
                      <div className="flex items-center gap-4 mb-4">
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <DynamicIcon name={cat.icon || 'Circle'} size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">{cat.name}</h5>
                              <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">
                                {cat.type === 'need' ? 'احتياج ضروري' : cat.type === 'want' ? 'رفاهية وكماليات' : 'إدخار واستثمار'}
                              </p>
                            </div>
                            <div className="text-left font-sans shrink-0">
                              <p className="text-[9px] font-bold text-slate-400 mb-0.5">صرف فعلي</p>
                              <p className={cn("text-xs font-black", spent > 0 ? "text-slate-700 dark:text-slate-300" : "text-slate-400")}>
                                {formatCurrency(spent, currency)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Display Progress Indicator */}
                      <div className="space-y-3.5">
                        <div className="space-y-1.5 shadow-5xs p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100/30">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-bold">الحالة ومعدل الصرف:</span>
                            <span className={cn(
                              "font-black font-sans px-1.5 py-0.5 rounded-md text-[9px]",
                              isOver ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" :
                              percentage > 85 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                              catBudgetNum > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                              {catBudgetNum === 0 ? 'غير محدد' : `${Math.round(percentage)}%`}
                            </span>
                          </div>

                          <div className="h-2 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                            {catBudgetNum > 0 && (
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, percentage)}%` }}
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  isOver ? "bg-rose-500" : percentage > 85 ? "bg-amber-500" : "bg-primary-600"
                                )}
                              />
                            )}
                          </div>
                        </div>

                        {/* Input allocation and remaining display */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={catBudgetStr}
                              onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                              onFocus={(e) => {
                                if (!catBudgetStr || catBudgetStr === '0' || catBudgetStr === '0.00' || parseFloat(catBudgetStr) === 0) {
                                  handleCategoryBudgetChange(cat.id, '');
                                } else {
                                  const target = e.target;
                                  setTimeout(() => {
                                    try {
                                      target.setSelectionRange(0, target.value.length);
                                    } catch (err) {
                                      target.select();
                                    }
                                  }, 50);
                                }
                              }}
                              onClick={(e) => {
                                if (!catBudgetStr || catBudgetStr === '0' || catBudgetStr === '0.00' || parseFloat(catBudgetStr) === 0) {
                                  handleCategoryBudgetChange(cat.id, '');
                                } else {
                                  const target = e.target as HTMLInputElement;
                                  setTimeout(() => {
                                    try {
                                      target.setSelectionRange(0, target.value.length);
                                    } catch (err) {
                                      target.select();
                                    }
                                  }, 50);
                                }
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all text-center font-mono"
                              placeholder="حدد الميزانية"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{currency}</span>
                          </div>
                          
                          <div className="text-left shrink-0 font-sans">
                            <p className="text-[9px] font-bold text-slate-400 mb-0.5">الباقي الآمن</p>
                            <p className={cn(
                              "text-xs font-black",
                              (catBudgetNum - spent) >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {formatCurrency(catBudgetNum - spent, currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    icon={CircleAlert}
                    title="لا توجد فئات مخصصة لهذا التصنيف حالياً"
                    description="انتقل لقسم الفئات لتفعيل أو تعديل تصنيفات الميزانية الذكية وتأمينها."
                  />
                </div>
              )}
            </div>

          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default BudgetPage;
