import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, CircleAlert, Calendar, Zap, AlertTriangle, 
  Search, Wand2, Lightbulb, Loader2, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import { DynamicIcon } from '../DynamicIcon';
import EmptyState from '../ui/EmptyState';
import { Category, Expense, BudgetPeriod } from '../../types';
import { cn, formatCurrency, hapticFeedback } from '../../utils';

interface BudgetCategoryListProps {
  categories: Category[];
  currentMonthExpenses: Expense[];
  currentWeekExpenses: Expense[];
  categoryBudgets: Record<string, string>;
  categoryPeriods: Record<string, BudgetPeriod>;
  handleCategoryBudgetChange: (id: string, value: string) => void;
  handleCategoryPeriodChange: (id: string, period: BudgetPeriod) => void;
  remainingDays: number;
  remainingDaysInWeek: number;
  currency: string;
  categoryStatusesLookup?: Record<string, any>;
  rollingBudgetEnabled?: boolean;
  onAutoAllocate?: () => void;
  onSuggestFromHistory?: () => void;
  isGenerating?: boolean;
}

type FilterType = 'all' | 'over' | 'danger' | 'need' | 'want' | 'saving' | 'weekly';

export const BudgetCategoryList: React.FC<BudgetCategoryListProps> = ({
  categories,
  currentMonthExpenses,
  currentWeekExpenses,
  categoryBudgets,
  categoryPeriods,
  handleCategoryBudgetChange,
  handleCategoryPeriodChange,
  remainingDays,
  remainingDaysInWeek,
  currency,
  categoryStatusesLookup,
  rollingBudgetEnabled = true,
  onAutoAllocate,
  onSuggestFromHistory,
  isGenerating = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filter & Search Logic
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!cat.name.toLowerCase().includes(query)) return false;
      }

      // 2. Quick Filter
      if (activeFilter === 'all') return true;

      const period: BudgetPeriod = categoryPeriods[cat.id] || 'monthly';
      const isWeekly = period === 'weekly';

      const monthSpent = currentMonthExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const weekSpent = currentWeekExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const spent = isWeekly ? weekSpent : monthSpent;
      const catBudgetNum = Number(categoryBudgets[cat.id]) || 0;
      const status = categoryStatusesLookup?.[cat.id];
      const effectiveLimit = (rollingBudgetEnabled && isWeekly && status?.effectiveLimit !== undefined) ? status.effectiveLimit : catBudgetNum;
      const percentage = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : 0;
      const isOver = effectiveLimit > 0 && spent > effectiveLimit;

      if (activeFilter === 'over') return isOver;
      if (activeFilter === 'danger') return !isOver && percentage >= 80;
      if (activeFilter === 'weekly') return isWeekly;
      if (activeFilter === 'need') return cat.type === 'need' || !cat.type;
      if (activeFilter === 'want') return cat.type === 'want';
      if (activeFilter === 'saving') return cat.type === 'saving';

      return true;
    });
  }, [
    categories, 
    searchQuery, 
    activeFilter, 
    categoryPeriods, 
    categoryBudgets, 
    currentMonthExpenses, 
    currentWeekExpenses, 
    categoryStatusesLookup, 
    rollingBudgetEnabled
  ]);

  return (
    <div className="space-y-4 text-right font-tajawal rtl">
      
      {/* Header with Search & Quick Tool Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart size={16} className="text-indigo-500" />
              <span>مخصصات الفئات ({filteredCategories.length})</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              اضبط سقف الصرف لكل فئة واختر بين الدورة الأسبوعية أو الشهرية
            </p>
          </div>

          {/* Quick AI Allocation buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onSuggestFromHistory && (
              <button
                type="button"
                onClick={onSuggestFromHistory}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-[11px] font-bold hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                title="اقتراح ميزانية بالاعتماد على متوسط صرفك السابق"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
                <span>اقتراح ذكي</span>
              </button>
            )}

            {onAutoAllocate && (
              <button
                type="button"
                onClick={onAutoAllocate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="توزيع المبلغ الإجمالي تناسبياً على الفئات"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                <span>توزيع متوازن</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن فئة (مثل: قفة السوق، بنزين، كراء...)"
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => { hapticFeedback('light'); setActiveFilter('all'); }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer",
                activeFilter === 'all'
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              الكل
            </button>

            <button
              type="button"
              onClick={() => { hapticFeedback('light'); setActiveFilter('over'); }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer flex items-center gap-1",
                activeFilter === 'over'
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100"
              )}
            >
              <span>🚨 تجاوزت</span>
            </button>

            <button
              type="button"
              onClick={() => { hapticFeedback('light'); setActiveFilter('danger'); }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer flex items-center gap-1",
                activeFilter === 'danger'
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100"
              )}
            >
              <span>⚠️ في خطر</span>
            </button>

            <button
              type="button"
              onClick={() => { hapticFeedback('light'); setActiveFilter('need'); }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer",
                activeFilter === 'need'
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              )}
            >
              أساسيات
            </button>

            <button
              type="button"
              onClick={() => { hapticFeedback('light'); setActiveFilter('want'); }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer",
                activeFilter === 'want'
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              )}
            >
              كماليات
            </button>

            <button
              type="button"
              onClick={() => { hapticFeedback('light'); setActiveFilter('weekly'); }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer",
                activeFilter === 'weekly'
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              )}
            >
              ⚡ أسبوعية
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCategories.map((cat) => {
            const period: BudgetPeriod = categoryPeriods[cat.id] || 'monthly';
            const isWeekly = period === 'weekly';

            const monthSpent = currentMonthExpenses
              .filter(e => e.categoryId === cat.id)
              .reduce((sum, e) => sum + e.amount, 0);

            const weekSpent = currentWeekExpenses
              .filter(e => e.categoryId === cat.id)
              .reduce((sum, e) => sum + e.amount, 0);

            const spent = isWeekly ? weekSpent : monthSpent;
            const catBudgetStr = categoryBudgets[cat.id] || '';
            const catBudgetNum = Number(catBudgetStr) || 0;

            const status = categoryStatusesLookup?.[cat.id];
            const effectiveLimit = (rollingBudgetEnabled && isWeekly && status?.effectiveLimit !== undefined) ? status.effectiveLimit : catBudgetNum;
            const percentage = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : (spent > 0 ? 100 : 0);
            const isOver = effectiveLimit > 0 && spent > effectiveLimit;
            const remaining = effectiveLimit - spent;

            return (
              <div
                key={cat.id}
                className={cn(
                  "bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700",
                  isOver 
                    ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/15 dark:bg-rose-950/10" 
                    : "border-slate-200/80 dark:border-slate-800"
                )}
              >
                <div className="space-y-3">
                  
                  {/* Category Header: Icon, Name & Weekly/Monthly Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.color || '#6366f1' }}
                      >
                        <DynamicIcon name={cat.icon || 'Circle'} size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{cat.name}</h4>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {cat.type === 'need' ? 'احتياج ضروري' : cat.type === 'want' ? 'رغبة وكماليات' : 'ادخار'}
                        </span>
                      </div>
                    </div>

                    {/* Weekly / Monthly Toggle Pill */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          hapticFeedback('light');
                          handleCategoryPeriodChange(cat.id, 'weekly');
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black transition-all cursor-pointer",
                          isWeekly ? "bg-amber-500 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        )}
                        title="ميزانية أسبوعية"
                      >
                        أسبوعي
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          hapticFeedback('light');
                          handleCategoryPeriodChange(cat.id, 'monthly');
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black transition-all cursor-pointer",
                          !isWeekly ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        )}
                        title="ميزانية شهرية"
                      >
                        شهري
                      </button>
                    </div>
                  </div>

                  {/* Spending & Progress Bar */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold">
                        {isWeekly ? 'المصروف هذا الأسبوع:' : 'المصروف هذا الشهر:'}
                        <span className="text-slate-800 dark:text-slate-200 font-mono font-black mr-1">
                          {formatCurrency(spent, currency)}
                        </span>
                      </span>
                      <span className={cn(
                        "font-black font-mono px-1.5 py-0.5 rounded text-[9px]",
                        isOver ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" :
                        percentage > 85 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                        catBudgetNum > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {catBudgetNum === 0 ? 'غير محدد' : `${Math.round(percentage)}%`}
                      </span>
                    </div>

                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      {catBudgetNum > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, percentage)}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isOver ? "bg-rose-500" : percentage > 85 ? "bg-amber-500" : isWeekly ? "bg-amber-500" : "bg-indigo-600"
                          )}
                        />
                      )}
                    </div>
                  </div>

                </div>

                {/* Input for Budget & Remaining Balance */}
                <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
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
                            try { target.setSelectionRange(0, target.value.length); } catch { target.select(); }
                          }, 50);
                        }
                      }}
                      className={cn(
                        "w-full bg-slate-50 dark:bg-slate-950/60 border rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white outline-none transition-all text-center font-mono",
                        isWeekly 
                          ? "focus:border-amber-500 border-amber-200/60 dark:border-amber-900/30" 
                          : "focus:border-indigo-500 border-slate-200 dark:border-slate-800"
                      )}
                      placeholder={isWeekly ? "الميزانية الأسبوعية" : "الميزانية الشهرية"}
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">
                      {currency}
                    </span>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 block">المتبقي</span>
                    <span className={cn(
                      "text-xs font-black font-mono",
                      remaining >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {formatCurrency(remaining, currency)}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CircleAlert}
          title="لا توجد فئات مطابقة للبحث أو التصفية"
          description="جرب كتابة اسم فئة أخرى أو اختر مرشحاً مختلفاً."
        />
      )}

    </div>
  );
};

export default BudgetCategoryList;
