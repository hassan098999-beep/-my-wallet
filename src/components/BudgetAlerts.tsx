import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn, getBudgetRange, getBudgetMonth, getWeekRange, safeParseISO, hapticFeedback } from '../utils';
import { TriangleAlert, CircleAlert, TrendingUp, X, Zap, Calendar, Flame, Gauge, ArrowDownRight, Clock, ArrowLeft, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicIcon } from './DynamicIcon';
import { BudgetPeriod } from '../types';
import { useBudgetStatus } from '../hooks/useBudgetStatus';

export const BudgetAlerts = () => {
  const navigate = useNavigate();
  const { expenses, budgets, currency, removeNotification, notifications = [], firstDayOfMonth, categories = [] } = useAppContext();
  const { categoryPaces = [], fastBurningPaces = [], remainingDays, remainingDaysInWeek } = useBudgetStatus();

  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const budget = useMemo(() => budgets?.find(b => b.month === currentMonth), [budgets, currentMonth]);
  
  const { start: rangeStart, end: rangeEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(new Date(), 1), []);

  const overallPeriod: BudgetPeriod = budget?.period || 'monthly';

  const totalMonthlyExpense = useMemo(() => 
    expenses
      .filter(e => {
        const d = safeParseISO(e.date);
        return !e.isTransfer && d >= rangeStart && d <= rangeEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0),
  [expenses, rangeStart, rangeEnd]);

  const totalWeeklyExpense = useMemo(() => 
    expenses
      .filter(e => {
        const d = safeParseISO(e.date);
        return !e.isTransfer && d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0),
  [expenses, weekStart, weekEnd]);

  const activeTotalExpense = overallPeriod === 'weekly' ? totalWeeklyExpense : totalMonthlyExpense;

  if (!budget || budget.amount <= 0) return null;

  const percentSpent = (activeTotalExpense / budget.amount) * 100;
  const isExceeded = activeTotalExpense > budget.amount;
  const isNearLimit = percentSpent >= 80 && !isExceeded;

  // Filter budget notifications from the state
  const budgetNotifications = notifications.filter(n => n.type === 'budget' || n.type === 'pace_warning');

  const hasNoAlerts = !isNearLimit && !isExceeded && budgetNotifications.length === 0 && fastBurningPaces.length === 0;
  if (hasNoAlerts) return null;

  return (
    <div className="space-y-3 mb-6" dir="rtl">
      <AnimatePresence mode="popLayout">
        {/* Overall Limit Exceeded */}
        {isExceeded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => {
              hapticFeedback('medium');
              navigate('/analytics?tab=weekly');
            }}
            className="relative overflow-hidden bg-rose-500 hover:bg-rose-600 text-white p-4 md:p-6 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all group text-right"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                  <CircleAlert size={24} className="text-white" />
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1">
                      {overallPeriod === 'weekly' ? 'تجاوزت الميزانية الأسبوعية الإجمالية! ⚠️' : 'تجاوزت الميزانية الشهرية الإجمالية! ⚠️'}
                    </h4>
                    <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold">
                      اضغط لعرض التقرير 📊
                    </span>
                  </div>
                  <p className="text-xs font-bold opacity-90">
                    لقد تجاوزت ميزانيتك {overallPeriod === 'weekly' ? 'لهذا الأسبوع' : 'لهذا الشهر'} بمقدار <span className="underline decoration-2 underline-offset-4">{formatCurrency(activeTotalExpense - budget.amount, currency)}</span>. يرجى ترشيد مصاريفك.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl shrink-0 self-end sm:self-center transition-colors">
                <BarChart3 size={15} />
                <span>عرض التقرير والمقارنة الأسبوعية ←</span>
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
            onClick={() => {
              hapticFeedback('medium');
              navigate('/analytics?tab=weekly');
            }}
            className="relative overflow-hidden bg-amber-500 hover:bg-amber-600 text-white p-4 md:p-6 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all group text-right"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                  <TriangleAlert size={24} className="text-white" />
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1">
                      {overallPeriod === 'weekly' ? 'اقتربت من الحد الأقصى للميزانية الأسبوعية!' : 'اقتربت من الحد الأقصى للميزانية الشهرية!'}
                    </h4>
                    <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold">
                      اضغط لعرض التقرير 📊
                    </span>
                  </div>
                  <p className="text-xs font-bold opacity-90">
                    لقد استهلكت <span className="text-lg font-black">{Math.round(percentSpent)}%</span> من ميزانيتك {overallPeriod === 'weekly' ? 'لهذا الأسبوع' : 'لهذا الشهر'}. تبقى لك <span className="underline decoration-2 underline-offset-4">{formatCurrency(budget.amount - activeTotalExpense, currency)}</span> فقط.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl shrink-0 self-end sm:self-center transition-colors">
                <BarChart3 size={15} />
                <span>عرض التقرير الأسبوعي المفصل ←</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Intelligent Category Daily Spending Pace and Overrun Alerts */}
        {fastBurningPaces.map((pace) => {
          const isCritical = pace.status === 'critical' || pace.status === 'exceeded';
          const isExceededType = pace.status === 'exceeded';
          const isWeeklyCat = pace.period === 'weekly';

          return (
            <motion.div
              key={pace.categoryId}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => {
                hapticFeedback('light');
                navigate('/analytics?tab=weekly');
              }}
              className={cn(
                "relative overflow-hidden p-4 rounded-2xl shadow-xs border text-right transition-all cursor-pointer hover:shadow-md group",
                isExceededType
                  ? "bg-rose-50/90 hover:bg-rose-100/90 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200"
                  : isCritical
                  ? "bg-amber-50/90 hover:bg-amber-100/90 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200"
                  : "bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/40 text-indigo-950 dark:text-indigo-200"
              )}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                <div className="flex items-start gap-3.5 flex-1">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                    isExceededType
                      ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300"
                      : isCritical
                      ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300"
                      : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300"
                  )}>
                    <DynamicIcon name={pace.categoryIcon || "Layers"} size={22} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black tracking-tight">
                        {pace.alertTitle}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                        isWeeklyCat 
                          ? "bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200" 
                          : "bg-indigo-200/60 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200"
                      )}>
                        <Clock size={10} />
                        {isWeeklyCat ? 'ميزانية أسبوعية' : 'ميزانية شهرية'}
                      </span>
                      {pace.daysUntilExhaustion !== null && pace.daysUntilExhaustion > 0 && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200 animate-pulse">
                          ⚡ نفاد متوقع خلال {pace.daysUntilExhaustion} أيام
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mr-auto group-hover:underline flex items-center gap-0.5">
                        عرض التقرير 📊 ←
                      </span>
                    </div>

                    <p className="text-xs mt-1 font-medium leading-relaxed opacity-90">
                      {pace.alertMessage}
                    </p>

                    {/* Actionable Advice & Daily Cap Guideline */}
                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        <span className="text-amber-600 dark:text-amber-400">💡 التوصية:</span>
                        <span>{pace.actionAdvice}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="text-slate-500 dark:text-slate-400 font-sans">
                          المعدل اليومي الحالي: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(pace.currentDailyRate, currency)}/يوم</strong>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-sans">
                          الحد اليومي الآمن: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(pace.adjustedDailyRate, currency)}/يوم</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Other custom budget notifications from context */}
        {budgetNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => {
              hapticFeedback('light');
              navigate('/analytics?tab=weekly');
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md cursor-pointer flex items-center justify-between gap-4 group text-right transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{notification.message}</p>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                  اضغط لعرض التقرير 📊 ←
                </span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 mr-auto cursor-pointer"
              title="إغلاق"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

