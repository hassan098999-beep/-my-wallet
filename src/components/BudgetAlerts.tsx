import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn, getBudgetRange, getBudgetMonth, safeParseISO } from '../utils';
import { TriangleAlert, CircleAlert, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicIcon } from './DynamicIcon';

export const BudgetAlerts = () => {
  const { expenses, budget, currency, removeNotification, notifications = [], firstDayOfMonth, categories = [] } = useAppContext();

  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  
  const { start: rangeStart, end: rangeEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  const totalMonthlyExpense = useMemo(() => 
    expenses
      .filter(e => {
        const d = safeParseISO(e.date);
        return d >= rangeStart && d <= rangeEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0),
  [expenses, rangeStart, rangeEnd]);

  const categoryBudgets = budget?.categoryBudgets || {};

  // Calculate intelligent category specific alerts
  const categoryAlerts = useMemo(() => {
    if (!categoryBudgets || Object.keys(categoryBudgets).length === 0) return [];
    
    return Object.entries(categoryBudgets).map(([catId, limitAmountStr]) => {
      const limit = Number(limitAmountStr) || 0;
      if (limit <= 0) return null;

      const spent = expenses
        .filter(e => !e.isTransfer && e.categoryId === catId && safeParseISO(e.date) >= rangeStart && safeParseISO(e.date) <= rangeEnd)
        .reduce((sum, e) => sum + e.amount, 0);

      const percentage = (spent / limit) * 100;
      const cat = categories.find(c => c.id === catId);
      const name = cat ? cat.name : 'الفئة';
      const icon = cat ? cat.icon : 'Layers';

      if (percentage >= 100) {
        return {
          id: `cat-exceeded-${catId}`,
          categoryId: catId,
          name,
          icon,
          percentage,
          limit,
          spent,
          remaining: limit - spent,
          type: 'exceeded' as const
        };
      } else if (percentage >= 80) {
        return {
          id: `cat-near-${catId}`,
          categoryId: catId,
          name,
          icon,
          percentage,
          limit,
          spent,
          remaining: limit - spent,
          type: 'near' as const
        };
      }
      return null;
    }).filter(Boolean);
  }, [categoryBudgets, expenses, rangeStart, rangeEnd, categories]);

  if (!budget || budget.amount <= 0) return null;

  const percentSpent = (totalMonthlyExpense / budget.amount) * 100;
  const isExceeded = totalMonthlyExpense > budget.amount;
  const isNearLimit = percentSpent >= 80 && !isExceeded;

  // Filter budget notifications from the state
  const budgetNotifications = notifications.filter(n => n.type === 'budget');

  const hasNoAlerts = !isNearLimit && !isExceeded && budgetNotifications.length === 0 && categoryAlerts.length === 0;
  if (hasNoAlerts) return null;

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence mode="popLayout">
        {/* Overall Limit Exceeded */}
        {isExceeded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden bg-rose-500 text-white p-4 md:p-6 rounded-2xl shadow-sm group"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                <CircleAlert size={24} className="text-white" />
              </div>
              <div className="flex-1 text-right" dir="rtl">
                <h4 className="text-sm font-black uppercase tracking-widest mb-1">تجاوزت الميزانية الإجمالية! ⚠️</h4>
                <p className="text-xs font-bold opacity-90">
                  لقد تجاوزت ميزانيتك الشهرية بمقدار <span className="underline decoration-2 underline-offset-4">{formatCurrency(totalMonthlyExpense - budget.amount, currency)}</span>. يرجى مراجعة مصاريفك.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Overall Limit Near */}
        {isNearLimit && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden bg-amber-500 text-white p-4 md:p-6 rounded-2xl shadow-sm group"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                <TriangleAlert size={24} className="text-white" />
              </div>
              <div className="flex-1 text-right" dir="rtl">
                <h4 className="text-sm font-black uppercase tracking-widest mb-1">اقتربت من الحد الأقصى للميزانية!</h4>
                <p className="text-xs font-bold opacity-90">
                  لقد استهلكت <span className="text-lg font-black">{Math.round(percentSpent)}%</span> من ميزانيتك الشهرية. تبقى لك <span className="underline decoration-2 underline-offset-4">{formatCurrency(budget.amount - totalMonthlyExpense, currency)}</span> فقط.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category Budget smart alerts */}
        {categoryAlerts.map((alert) => {
          if (!alert) return null;
          const isExceededType = alert.type === 'exceeded';
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative overflow-hidden p-4 rounded-2xl shadow-sm border text-right",
                isExceededType
                  ? "bg-rose-50/80 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
                  : "bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50 text-amber-900 dark:text-amber-200"
              )}
              dir="rtl"
            >
              <div className="flex items-center gap-3.5">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                  isExceededType
                    ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                )}>
                  <DynamicIcon name={alert.icon || "AlertCircle"} size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-tight block">
                      {isExceededType ? "تجاوزت سقف الميزانية الفئوية! ⚠️" : "تنبيه ذكي: اقتربت من السقف! 🔔"}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                      isExceededType
                        ? "bg-rose-200/50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                        : "bg-amber-200/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    )}>
                      {Math.round(alert.percentage)}%
                    </span>
                  </div>
                  <p className="text-xs mt-1 font-semibold leading-relaxed">
                    فئة <strong className="font-black text-black dark:text-white">"{alert.name}"</strong>: 
                    {isExceededType ? (
                      <> لقد تجاوزت السقف المخصص ({formatCurrency(alert.limit, currency)}) بمقدار <span className="font-bold underline text-rose-600 dark:text-rose-400">{formatCurrency(Math.abs(alert.remaining), currency)}</span>!</>
                    ) : (
                      <> استهلكت {formatCurrency(alert.spent, currency)} من الميزانية المحددة ({formatCurrency(alert.limit, currency)}). المتبقي لديك: <span className="font-bold underline text-amber-600 dark:text-amber-400">{formatCurrency(alert.remaining, currency)}</span>.</>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Other custom budget notifications */}
        {budgetNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4 group text-right"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <TrendingUp size={20} />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{notification.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 mr-auto"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
