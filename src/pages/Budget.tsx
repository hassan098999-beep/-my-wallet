import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency } from '../utils';
import { isThisMonth, parseISO, format, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Save, AlertCircle, TrendingUp, Target, Wallet, Activity, ArrowUpRight, ArrowDownRight, CheckCircle2, Calendar, ChevronDown, Wand2, Loader2 } from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';
import { motion, AnimatePresence } from 'motion/react';

const BudgetPage = () => {
  const { budget, setBudget, categories, expenses, income, currency } = useAppContext();

  const [globalBudget, setGlobalBudget] = useState(budget?.amount.toString() || '');
  const [selectedMonth, setSelectedMonth] = useState(budget?.month || new Date().toISOString().slice(0, 7));
  const [isSaved, setIsSaved] = useState(false);
  const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(
    budget?.categoryBudgets 
      ? Object.fromEntries(Object.entries(budget.categoryBudgets).map(([k, v]) => [k, v.toString()]))
      : {}
  );

  const handleSave = () => {
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

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const globalBudgetNum = Number(globalBudget) || 0;
  const overallPercentage = globalBudgetNum > 0 ? (totalSpent / globalBudgetNum) * 100 : 0;

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
      className="space-y-4 md:space-y-6 pb-20 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            إدارة <span className="text-primary-500">الميزانية</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            خطط لمصاريفك وراقب استهلاكك الشهري بذكاء
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Month Selector Dropdown */}
          <div className="relative group flex-1 md:flex-none">
            <div className="absolute -top-2 right-4 px-1.5 bg-slate-50 dark:bg-slate-900 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10 flex items-center gap-1">
              <Calendar className="size-2.5" />
              الشهر
            </div>
            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 pr-10 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono tracking-widest cursor-pointer shadow-sm"
              />
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary-500 transition-colors size-4" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className={cn(
              "relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm transition-all shadow-lg overflow-hidden group flex-1 md:flex-none",
              isSaved 
                ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"
            )}
          >
            <AnimatePresence mode="wait">
              {isSaved ? (
                <motion.div
                  key="saved"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>تم الحفظ</span>
                </motion.div>
              ) : (
                <motion.div
                  key="save"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <Save className="size-3.5" />
                  <span>حفظ التغييرات</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Global Budget Card - Compact */}
      <motion.div variants={itemVariants} className="bg-slate-900 rounded-3xl p-5 md:p-6 text-white relative overflow-hidden group shadow-xl shadow-slate-900/10">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-1000" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8 items-center">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 opacity-60">
              <TrendingUp className="size-4 md:size-5" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">الميزانية الكلية</span>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
                المبلغ الإجمالي ({currency})
              </label>
              <div className="relative group/input">
                <input
                  type="number"
                  value={globalBudget}
                  onChange={(e) => setGlobalBudget(e.target.value)}
                  className="w-full bg-white/5 border border-dashed border-white/20 rounded-2xl px-4 py-3 text-2xl md:text-3xl font-black tracking-tighter focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-white/10 font-mono group-hover/input:border-white/40 shadow-inner"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            <div className="flex justify-between items-end">
              <div className="space-y-1.5">
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest block">نسبة الاستهلاك</span>
                <span className="text-2xl md:text-4xl font-black tracking-tighter">{overallPercentage.toFixed(1)}%</span>
              </div>
              <div className="text-left space-y-1.5">
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest block">المصروف الفعلي</span>
                <span className="text-xl md:text-3xl font-black tracking-tighter text-emerald-400">
                  {formatCurrency(totalSpent, currency)}
                </span>
              </div>
            </div>
            <div className="h-3 md:h-4 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] relative overflow-hidden",
                  overallPercentage > 90 ? "bg-rose-500" : overallPercentage > 70 ? "bg-amber-500" : "bg-primary-500"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
            <div className="flex justify-between items-center text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
              <span>0.00</span>
              <span className={cn(overallPercentage > 100 && "text-rose-400")}>
                {overallPercentage > 100 ? 'تجاوزت الميزانية!' : `المتبقي: ${formatCurrency(Math.max(0, globalBudgetNum - totalSpent), currency)}`}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Smart Allocation Section */}
      {/* Category Budgets Grouped */}
      <div className="space-y-5 md:space-y-8">
        {groupedCategories.map(group => (
          <div key={group.id} className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className={`w-3 h-3 rounded-full ${group.color} shadow-sm animate-pulse`} />
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs md:text-sm">{group.title}</h3>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-xl shadow-sm">{group.items.length} فئات</span>
            </div>

            {group.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {group.items.map(cat => {
                  const spent = currentMonthExpenses
                    .filter(e => e.categoryId === cat.id)
                    .reduce((sum, e) => sum + e.amount, 0);
                  
                  const catBudgetStr = categoryBudgets[cat.id] || '';
                  const catBudgetNum = Number(catBudgetStr) || 0;
                  const percentage = catBudgetNum > 0 ? (spent / catBudgetNum) * 100 : 0;
                  const isOverBudget = catBudgetNum > 0 && spent > catBudgetNum;
                  const remaining = catBudgetNum - spent;

                  return (
                    <motion.div 
                      key={cat.id} 
                      variants={itemVariants}
                      className={cn(
                        "flex items-center justify-between gap-3 md:gap-4 p-4 md:p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden group",
                        isOverBudget 
                          ? "border-rose-500/50 dark:border-rose-500/50 bg-rose-50/80 dark:bg-rose-900/30" 
                          : "glass-card hover:border-primary-500/30"
                      )}
                    >
                      {isOverBudget && (
                        <div className="absolute top-0 right-0 w-1 h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
                      )}
                      {/* Category Info & Progress */}
                      <div className="flex-1 flex items-center gap-3 md:gap-4 min-w-0">
                        <div 
                          className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform" 
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.icon ? <DynamicIcon name={cat.icon} className="size-5 md:size-6" /> : <span className="text-base md:text-lg font-black">{cat.name.charAt(0)}</span>}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white truncate pr-2 md:pr-3">{cat.name}</h4>
                            <div className="flex items-center gap-2 text-slate-400 shrink-0">
                              <span className="text-xs md:text-sm font-bold uppercase tracking-widest">
                                {formatCurrency(spent, currency)}
                              </span>
                            </div>
                          </div>
                          
                          {catBudgetNum > 0 ? (
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="flex-1 h-2 md:h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, percentage)}%` }}
                                  className={cn(
                                    "h-full rounded-full relative overflow-hidden",
                                    isOverBudget ? "bg-rose-500" : percentage > 85 ? "bg-amber-500" : "bg-primary-500"
                                  )}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                </motion.div>
                              </div>
                              <span className={cn(
                                "text-xs md:text-sm font-bold shrink-0",
                                isOverBudget ? "text-rose-500" : "text-slate-400"
                              )}>
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          ) : (
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full w-full shadow-inner" />
                          )}
                        </div>
                      </div>

                      {/* Budget Input */}
                      <div className="w-24 md:w-32 shrink-0">
                        <div className="relative group/input">
                          <input
                            type="number"
                            value={catBudgetStr}
                            onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                            className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm md:text-base font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono text-left shadow-inner"
                            placeholder="0"
                            dir="ltr"
                          />
                          <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-primary-500 text-xs md:text-sm font-black font-mono">{currency}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 md:p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 shadow-inner">
                <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">لا توجد فئات في هذا القسم</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default BudgetPage;
