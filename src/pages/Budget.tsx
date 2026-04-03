import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { isThisMonth, parseISO, format, startOfMonth, endOfMonth, differenceInDays, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Save, CircleAlert, TrendingUp, Target, Wallet, Activity, 
  ArrowUpRight, ArrowDownRight, CircleCheckBig, Calendar, 
  ChevronDown, Wand2, Loader2, Info, Lightbulb, Zap,
  TrendingDown, PieChart, BarChart3, ShieldCheck
} from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';
import { motion } from 'motion/react';

const BudgetPage = () => {
  const { budget, setBudget, categories, expenses, income, currency, firstDayOfMonth, setFirstDayOfMonth, rollingBudgetEnabled } = useAppContext();

  const [globalBudget, setGlobalBudget] = useState(budget?.amount.toString() || '');
  const [selectedMonth, setSelectedMonth] = useState(budget?.month || getBudgetMonth(new Date(), firstDayOfMonth));
  const [isSaved, setIsSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
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
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCategoryBudgetChange = (id: string, value: string) => {
    setCategoryBudgets(prev => ({ ...prev, [id]: value }));
  };

  const autoAllocate = () => {
    setIsGenerating(true);
    hapticFeedback('medium');
    
    setTimeout(() => {
      const totalBudget = Number(globalBudget) || 0;
      if (totalBudget <= 0) {
        setIsGenerating(false);
        return;
      }

      const newBudgets: Record<string, string> = {};
      
      const needs = categories.filter(c => c.type === 'need' || !c.type);
      const wants = categories.filter(c => c.type === 'want');
      const savings = categories.filter(c => c.type === 'saving');

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
    }, 800);
  };

  const currentMonthExpenses = useMemo(() => {
    const { start, end } = getBudgetRange(selectedMonth, firstDayOfMonth);
    return expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = parseISO(e.date);
      return d >= start && d <= end;
    });
  }, [expenses, selectedMonth, firstDayOfMonth]);

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const globalBudgetNum = Number(globalBudget) || 0;
  const overallPercentage = globalBudgetNum > 0 ? (totalSpent / globalBudgetNum) * 100 : 0;

  // Calculate daily limit
  const { start: rangeStart, end: rangeEnd } = useMemo(() => getBudgetRange(selectedMonth, firstDayOfMonth), [selectedMonth, firstDayOfMonth]);
  const daysInMonth = useMemo(() => differenceInDays(rangeEnd, rangeStart) + 1, [rangeStart, rangeEnd]);

  const today = new Date();
  
  const remainingDays = useMemo(() => {
    const todayStart = startOfDay(today);
    const end = startOfDay(rangeEnd);
    const start = startOfDay(rangeStart);
    
    if (todayStart > end) return 0;
    if (todayStart < start) return daysInMonth;
    return differenceInDays(end, todayStart) + 1; // +1 to include today
  }, [today, rangeStart, rangeEnd, daysInMonth]);

  const remainingBudget = Math.max(0, globalBudgetNum - totalSpent);
  
  const dailyLimit = useMemo(() => {
    const todayStart = startOfDay(today);
    const end = startOfDay(rangeEnd);
    
    if (todayStart > end) return 0; // Past month

    if (!rollingBudgetEnabled) {
      return globalBudgetNum / daysInMonth;
    }
    return remainingDays > 0 ? remainingBudget / remainingDays : 0;
  }, [rollingBudgetEnabled, globalBudgetNum, daysInMonth, remainingBudget, remainingDays, today, rangeEnd]);

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

  // Group categories
  const groupedCategories = [
    { id: 'need', title: 'الاحتياجات الأساسية (50%)', color: 'bg-indigo-500', items: categories.filter(c => c.type === 'need' || !c.type) },
    { id: 'want', title: 'الرغبات والكماليات (30%)', color: 'bg-amber-500', items: categories.filter(c => c.type === 'want') },
    { id: 'saving', title: 'الادخار والاستثمار (20%)', color: 'bg-emerald-500', items: categories.filter(c => c.type === 'saving') },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-32 max-w-5xl mx-auto px-4 md:px-6"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            إدارة <span className="text-primary-500">الميزانية</span>
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            خطط لمستقبلك المالي بذكاء ودقة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">بداية الشهر</span>
              <select
                value={firstDayOfMonth}
                onChange={(e) => setFirstDayOfMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none cursor-pointer min-w-[40px]"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative flex-1 md:flex-none">
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-4 pr-11 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg",
              isSaved ? "bg-emerald-500 text-white" : "bg-primary-600 text-white"
            )}
          >
            {isSaved ? <CircleCheckBig size={20} /> : <Save size={20} />}
            {isSaved ? 'تم الحفظ' : 'حفظ'}
          </motion.button>
        </div>
      </div>

      {/* Main Budget Dashboard Card */}
      <motion.div variants={itemVariants} className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-3xl blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
        <div className="relative bg-slate-900 dark:bg-black rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-md border border-white/5">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
            {/* Left: Input & Main Stat */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-primary-400">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                      <Wallet size={20} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">الميزانية المستهدفة</span>
                  </div>
                  <button 
                    onClick={autoAllocate}
                    disabled={isGenerating || !globalBudget}
                    className="flex items-center gap-2 text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    توزيع ذكي (50/30/20)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={globalBudget}
                    onChange={(e) => setGlobalBudget(e.target.value)}
                    className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl px-6 py-6 text-4xl md:text-5xl font-black tracking-tighter focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-center font-mono"
                    placeholder="0.00"
                  />
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-white/20 text-2xl font-black">{currency}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">المصروف الفعلي</p>
                  <p className="text-2xl font-black text-emerald-400">{formatCurrency(totalSpent, currency)}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">المتبقي</p>
                  <p className={cn(
                    "text-2xl font-black",
                    remainingBudget > 0 ? "text-primary-400" : "text-rose-400"
                  )}>{formatCurrency(remainingBudget, currency)}</p>
                </div>
              </div>
            </div>

            {/* Right: Progress & Health */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">معدل الاستهلاك</p>
                    <p className="text-6xl md:text-7xl font-black tracking-tighter">{overallPercentage.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="h-6 bg-white/5 rounded-full p-1.5 border border-white/10 shadow-inner relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn(
                      "h-full rounded-full relative overflow-hidden transition-colors duration-500",
                      overallPercentage > 100 ? "bg-rose-500" : overallPercentage > 85 ? "bg-amber-500" : "bg-gradient-to-r from-primary-500 to-emerald-500"
                    )}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[shimmer_2s_linear_infinite]" />
                  </motion.div>
                </div>
              </div>

              {/* Budget Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3 text-amber-400">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">الميزانية اليومية المقترحة</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black tracking-tighter">{formatCurrency(dailyLimit, currency)}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold">
                    {rollingBudgetEnabled ? "بناءً على المبلغ المتبقي" : "ميزانية يومية ثابتة"}
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3 text-primary-400">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Calendar size={16} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">الأيام المتبقية</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black tracking-tighter">{remainingDays} <span className="text-sm text-slate-400">يوم</span></p>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold">حتى نهاية الدورة المالية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>


      {/* Category Breakdown Sections */}
      <div className="space-y-10">
        {groupedCategories.map((group, groupIdx) => (
          <motion.div 
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <div className={cn("w-5 h-5 rounded-full shadow-lg ring-4 ring-white/10", group.color)} />
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{group.title}</h3>
              </div>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 mx-6 hidden md:block" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.items.length} فئات</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <motion.div
                      key={cat.id}
                      whileHover={{ y: -6 }}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all relative overflow-hidden group shadow-sm",
                        isOver 
                          ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50" 
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-500/30 shadow-sm hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center gap-5 mb-6">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform"
                          style={{ backgroundColor: cat.color }}
                        >
                          <DynamicIcon name={cat.icon || 'Circle'} size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">{cat.name}</h4>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المصروف</p>
                              <p className="text-base font-black">{formatCurrency(spent, currency)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, percentage)}%` }}
                              className={cn(
                                "h-full rounded-full relative",
                                isOver ? "bg-rose-500" : percentage > 85 ? "bg-amber-500" : "bg-primary-500"
                              )}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                            </motion.div>
                          </div>
                          <span className={cn(
                            "text-xs font-black w-12 text-right",
                            isOver ? "text-rose-500" : "text-slate-400"
                          )}>{Math.round(percentage)}%</span>
                        </div>

                        <div className="flex items-center justify-between gap-6">
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={catBudgetStr}
                              onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-3 text-base font-black text-slate-900 dark:text-white focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-center font-mono"
                              placeholder="حدد الميزانية"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400">{currency}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المتبقي</p>
                            <p className={cn(
                              "text-sm font-black",
                              (catBudgetNum - spent) > 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {formatCurrency(Math.max(0, catBudgetNum - spent), currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-base font-bold text-slate-400">لا توجد فئات مخصصة لهذا القسم</p>
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
