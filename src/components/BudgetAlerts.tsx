import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn, getBudgetRange, getBudgetMonth } from '../utils';
import { TriangleAlert, CircleAlert, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseISO } from 'date-fns';

export const BudgetAlerts = () => {
  const { expenses, budget, currency, removeNotification, notifications = [], firstDayOfMonth } = useAppContext();

  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  
  const { start: rangeStart, end: rangeEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  const totalMonthlyExpense = useMemo(() => 
    expenses
      .filter(e => {
        const d = parseISO(e.date);
        return d >= rangeStart && d <= rangeEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0),
  [expenses, rangeStart, rangeEnd]);

  if (!budget || budget.amount <= 0) return null;

  const percentSpent = (totalMonthlyExpense / budget.amount) * 100;
  const isExceeded = totalMonthlyExpense > budget.amount;
  const isNearLimit = percentSpent >= 80 && !isExceeded;

  // Filter budget notifications from the state
  const budgetNotifications = notifications.filter(n => n.type === 'budget');

  if (!isNearLimit && !isExceeded && budgetNotifications.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence mode="popLayout">
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
              <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-widest mb-1">تجاوزت الميزانية!</h4>
                <p className="text-xs font-bold opacity-90">
                  لقد تجاوزت ميزانيتك الشهرية بمقدار <span className="underline decoration-2 underline-offset-4">{formatCurrency(totalMonthlyExpense - budget.amount, currency)}</span>. يرجى مراجعة مصاريفك.
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
              <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-widest mb-1">اقتربت من الحد!</h4>
                <p className="text-xs font-bold opacity-90">
                  لقد استهلكت <span className="text-lg font-black">{Math.round(percentSpent)}%</span> من ميزانيتك الشهرية. تبقى لك <span className="underline decoration-2 underline-offset-4">{formatCurrency(budget.amount - totalMonthlyExpense, currency)}</span> فقط.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {budgetNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <TrendingUp size={20} />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{notification.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
