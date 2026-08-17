import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp, 
  Store,
  ArrowUpRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, cn, hapticFeedback, safeStorage, getBudgetRange, getBudgetMonth, getWeekRange, safeParseISO } from '../../utils';
import { Category, Expense, Budget, BudgetPeriod } from '../../types';
import { differenceInDays, startOfDay, format } from 'date-fns';
import { useBudgetStatus } from '../../hooks/useBudgetStatus';
import { useAppContext } from '../../store/AppContext';

interface MarketBasketCardProps {
  categories: Category[];
  expenses: Expense[];
  budgets: Budget[];
  currency: string;
  firstDayOfMonth: number;
  itemVariants?: Variants;
}

export const MarketBasketCard: React.FC<MarketBasketCardProps> = ({
  categories,
  expenses,
  budgets,
  currency,
  firstDayOfMonth,
  itemVariants,
}) => {
  // Persistence for compact/expanded mode
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = safeStorage.getItem('masarifi_basket_card_expanded');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleExpanded = () => {
    hapticFeedback('light');
    const next = !isExpanded;
    setIsExpanded(next);
    safeStorage.setItem('masarifi_basket_card_expanded', String(next));
  };

  // 1. Identify Market & Basket Category
  const basketCategory = useMemo(() => {
    return categories.find(c => 
      c.name.includes('القفة') || 
      c.name.includes('السوق') || 
      c.name.includes('خضار') || 
      c.name.includes('بقالة') ||
      c.name.includes('غذاء') ||
      c.id === '1'
    ) || categories.find(c => c.type === 'need') || categories[0];
  }, [categories]);

  // 2. Budget Month and Periods
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);
  const activeMonth = useMemo(() => getBudgetMonth(today, firstDayOfMonth), [today, firstDayOfMonth]);
  const currentBudget = useMemo(() => budgets.find(b => b.month === activeMonth), [budgets, activeMonth]);

  const categoryPeriod: BudgetPeriod = useMemo(() => {
    if (!basketCategory) return 'monthly';
    return currentBudget?.categoryPeriods?.[basketCategory.id] || 'monthly';
  }, [currentBudget, basketCategory]);

  const allocatedLimit = useMemo(() => {
    if (!basketCategory || !currentBudget?.categoryBudgets) return 0;
    return Number(currentBudget.categoryBudgets[basketCategory.id]) || 0;
  }, [currentBudget, basketCategory]);

  const { categoryStatusesLookup } = useBudgetStatus();
  const { rollingBudgetEnabled } = useAppContext();
  const catStatus = basketCategory ? categoryStatusesLookup?.[basketCategory.id] : undefined;
  const effectiveLimit = (rollingBudgetEnabled && categoryPeriod === 'weekly' && catStatus?.effectiveLimit !== undefined)
    ? catStatus.effectiveLimit
    : allocatedLimit;

  // Date range depending on weekly or monthly
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(activeMonth, firstDayOfMonth), [activeMonth, firstDayOfMonth]);
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(today, 1), [today]);

  const { periodStart, periodEnd, remainingDays } = useMemo(() => {
    const todayStart = startOfDay(today);
    if (categoryPeriod === 'weekly') {
      const rem = Math.max(1, differenceInDays(startOfDay(weekEnd), todayStart) + 1);
      return { periodStart: weekStart, periodEnd: weekEnd, remainingDays: rem };
    } else {
      const days = differenceInDays(monthEnd, monthStart) + 1;
      let rem = 0;
      if (todayStart <= startOfDay(monthEnd)) {
        if (todayStart < startOfDay(monthStart)) {
          rem = days;
        } else {
          rem = differenceInDays(startOfDay(monthEnd), todayStart) + 1;
        }
      }
      return { periodStart: monthStart, periodEnd: monthEnd, remainingDays: Math.max(1, rem) };
    }
  }, [categoryPeriod, today, weekStart, weekEnd, monthStart, monthEnd]);

  // 3. Filter Expenses for this cycle
  const periodExpenses = useMemo(() => {
    if (!basketCategory) return [];
    return expenses.filter(e => {
      if (e.isTransfer) return false;
      if (e.categoryId !== basketCategory.id) return false;
      const d = safeParseISO(e.date);
      return d >= periodStart && d <= periodEnd;
    });
  }, [expenses, basketCategory, periodStart, periodEnd]);

  const totalSpent = useMemo(() => 
    periodExpenses.reduce((sum, e) => sum + e.amount, 0),
  [periodExpenses]);

  // Spending for Today specifically in this category
  const todayBasketSpent = useMemo(() => {
    if (!basketCategory) return 0;
    return expenses
      .filter(e => !e.isTransfer && e.categoryId === basketCategory.id && (e.date || '').split('T')[0] === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, basketCategory, todayStr]);

  const hasBudget = effectiveLimit > 0;
  const remainingAmount = effectiveLimit - totalSpent;
  const percentSpent = hasBudget ? Math.min(100, Math.round((totalSpent / effectiveLimit) * 100)) : 0;
  const isOverBudget = hasBudget && totalSpent > effectiveLimit;
  const isNearLimit = hasBudget && totalSpent >= effectiveLimit * 0.8 && !isOverBudget;
  const safeDailyAllowance = hasBudget && remainingAmount > 0 && remainingDays > 0 
    ? remainingAmount / remainingDays 
    : 0;

  // Subcategories breakdown (Read-only analysis)
  const subcategoryStats = useMemo(() => {
    if (!basketCategory) return [];
    const subs = basketCategory.subcategories || [
      'قضية السوق (خضار وغلال)',
      'العطار وعزيزة والمغازات',
      'خبز وحليب الصباح',
      'لحوم وأسماك'
    ];
    
    return subs.map(sub => {
      const matching = periodExpenses.filter(e => e.subcategoryId === sub || (e.note || '').includes(sub));
      const spent = matching.reduce((sum, e) => sum + e.amount, 0);
      const count = matching.length;
      const percentage = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
      return { name: sub, spent, count, percentage };
    });
  }, [basketCategory, periodExpenses, totalSpent]);

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative overflow-hidden rounded-3xl border transition-all text-right select-none shadow-xs max-w-5xl mx-auto w-full",
        "bg-white dark:bg-slate-900",
        isOverBudget 
          ? "border-rose-200/90 dark:border-rose-900/50 shadow-rose-500/5" 
          : isNearLimit 
          ? "border-amber-200/90 dark:border-amber-900/50 shadow-amber-500/5" 
          : "border-emerald-200/80 dark:border-emerald-900/40 shadow-emerald-500/5"
      )}
      dir="rtl"
    >
      {/* Top Accent Strip */}
      <div className={cn(
        "h-1.5 w-full bg-gradient-to-r",
        isOverBudget 
          ? "from-rose-500 via-pink-500 to-rose-600" 
          : isNearLimit 
          ? "from-amber-500 via-orange-400 to-amber-600" 
          : "from-emerald-500 via-teal-400 to-emerald-600"
      )} />

      {/* Main Header / KPI Row */}
      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Right side: Icon + Title + Period badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border transition-transform",
              isOverBudget 
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60" 
                : isNearLimit 
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60" 
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
            )}>
              <ShoppingBag size={22} className="stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>ميزانية قضية السوق والقفة</span>
                  <span className="text-xs">🧺</span>
                </h3>
                
                {hasBudget ? (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1",
                    isOverBudget 
                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800" 
                      : isNearLimit 
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800" 
                      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  )}>
                    {categoryPeriod === 'weekly' ? 'دورة أسبوعية' : 'دورة شهرية'}
                    <span>•</span>
                    {isOverBudget ? 'تجاوز السقف' : isNearLimit ? 'قريب من السقف' : 'تحت السيطرة'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    تقرير استهلاك
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                {hasBudget 
                  ? `السقف المحدد: ${formatCurrency(allocatedLimit, currency)} • المستهلك: ${formatCurrency(totalSpent, currency)} (${percentSpent}%)`
                  : `إجمالي مصروف القفة في هذه الفترة: ${formatCurrency(totalSpent, currency)}`}
              </p>
            </div>
          </div>

          {/* Left side: Highlight remaining amount & Expand Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {hasBudget && (
              <div className="text-left font-mono flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {remainingAmount >= 0 ? 'المتبقي في القفة' : 'تجاوز القفة بمقدار'}
                </span>
                <span className={cn(
                  "text-sm md:text-base font-black",
                  remainingAmount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {formatCurrency(Math.abs(remainingAmount), currency)}
                </span>
              </div>
            )}

            <button
              onClick={toggleExpanded}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={isExpanded ? 'عرض مصغر' : 'عرض التفاصيل'}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Dynamic Visual Progress Bar */}
        {hasBudget && (
          <div className="mt-3.5 space-y-1.5">
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, percentSpent)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-all",
                  isOverBudget 
                    ? "bg-rose-500" 
                    : isNearLimit 
                    ? "bg-amber-500" 
                    : "bg-emerald-500"
                )}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 dark:text-slate-400 px-0.5">
              <span>مصروف اليوم: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(todayBasketSpent, currency)}</strong></span>
              <span>المتاح اليومي للقفة: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(safeDailyAllowance, currency)}</strong> / يوم ({remainingDays} يوم متبقي)</span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Read-Only Breakdown Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-4 md:p-5 space-y-3.5"
          >
            {/* Subcategories Breakdown Pills (Read-only Analysis) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Store size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>توزيع مصاريف القفة في هذه الدورة:</span>
                </span>
                <Link 
                  to="/budget" 
                  className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  <span>إدارة الميزانية</span>
                  <ArrowUpRight size={11} />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {subcategoryStats.map((stat, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {stat.name}
                      </span>
                      {stat.percentage > 0 && (
                        <span className="text-[9px] font-black text-slate-400 font-mono bg-slate-100 dark:bg-slate-700/80 px-1 py-0.2 rounded">
                          {stat.percentage}%
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(stat.spent, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Read-Only Status & Advice Banner */}
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                  isOverBudget 
                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600" 
                    : isNearLimit 
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600" 
                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
                )}>
                  {isOverBudget ? (
                    <AlertTriangle size={16} />
                  ) : isNearLimit ? (
                    <Clock size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-800 dark:text-slate-200 text-[11px]">
                    {isOverBudget 
                      ? 'تجاوزت سقف القفة المحدد لهذه الدورة — يرجى ترشيد المشتريات القادمة' 
                      : isNearLimit 
                      ? 'استهلكت أكثر من 80% من مخصصات القفة — ينصح بالتركيز على الضروريات فقط' 
                      : 'وتيرة إنفاق القفة منتظمة وممتازة ضمن الحدود المستهدفة 🎯'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    {periodExpenses.length} عمليات شراء مسجلة في هذه الدورة
                  </p>
                </div>
              </div>

              <Link
                to="/transactions"
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-black transition-colors"
              >
                عرض العمليات
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
