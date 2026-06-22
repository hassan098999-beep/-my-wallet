import React, { useState, useMemo, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const { notifications, removeNotification, recurringExpenses, expenses, currency, categories } = useAppContext();
  const { overallPercentage, totalSpent, globalBudgetNum, categoryStatuses, remainingDays } = useBudgetStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // 4. Category-specific sub-budget limit alerts
  const subBudgetAlerts = useMemo(() => {
    if (!categoryStatuses || categoryStatuses.length === 0) return [];

    return categoryStatuses
      .filter(cs => cs.percentage >= 85) // Warning at 85% or more
      .map(cs => {
        const cat = categories.find(c => c.id === cs.categoryId);
        const name = cat ? cat.name : 'الفئة';
        const formattedRemaining = cs.remaining < 0 
          ? `عجز بقيمة ${Math.abs(cs.remaining).toFixed(1)}` 
          : `متبقي ${cs.remaining.toFixed(1)}`;

        return {
          id: `virtual-subbudget-${cs.categoryId}`,
          message: `تنبیه موازنة العائلة: اقتربت ميزانية الفئة "${name}" من النفاد (${cs.percentage.toFixed(0)}%). الحالة: ${formattedRemaining} ${currency}، الأيام المتبقية بالشهر لربط قشور الدفتر: ${remainingDays} أيام.`,
          type: 'budget' as const,
          createdAt: new Date().toISOString()
        };
      });
  }, [categoryStatuses, categories, currency, remainingDays]);

  // 1. Budget 80% limit warning
  const budgetAlert = useMemo(() => {
    if (globalBudgetNum > 0 && overallPercentage >= 80) {
      return {
        id: 'virtual-budget-alert',
        message: `تنبيه ميزانية: لقد تجاوزت %${overallPercentage.toFixed(0)} من ميزانيتك الشهرية لهذا الشهر (${totalSpent} من أصل ${globalBudgetNum} ${currency})! ⚠️`,
        type: 'unusual_expense' as const,
        createdAt: new Date().toISOString()
      };
    }
    return null;
  }, [globalBudgetNum, overallPercentage, totalSpent, currency]);

  // 2. Due recurring expenses within 24 hours
  const recurringAlerts = useMemo(() => {
    if (!recurringExpenses || recurringExpenses.length === 0) return [];
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    return recurringExpenses
      .filter(re => {
        const next = new Date(re.nextDate);
        const diff = next.getTime() - now.getTime();
        return diff > 0 && diff <= oneDayInMs;
      })
      .map(re => ({
        id: `virtual-recurring-${re.id}`,
        message: `تنبيه مصروف دوري: المصروف المتكرر "${re.note}" بقيمة ${re.amount} ${currency} مستحق خلال الـ 24 ساعة القادمة (${new Date(re.nextDate).toLocaleDateString('ar-TN', { day: 'numeric', month: 'long' })}). ⏱️`,
        type: 'budget' as const,
        createdAt: re.nextDate
      }));
  }, [recurringExpenses, currency]);

  // 3. Sunday weekly summary comparisons
  const weeklySummaryAlert = useMemo(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    if (!isSunday) return null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const currentWeekExpenses = expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = new Date(e.date);
      return d >= sevenDaysAgo;
    });
    const currentWeekTotal = currentWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    const previousWeeksExpenses = expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = new Date(e.date);
      return d >= twentyEightDaysAgo && d < sevenDaysAgo;
    });
    const previousWeeksTotal = previousWeeksExpenses.reduce((sum, e) => sum + e.amount, 0);
    const averageWeeklySpend = previousWeeksTotal / 3;

    let compareMsg = '';
    if (averageWeeklySpend > 0) {
      const diff = currentWeekTotal - averageWeeklySpend;
      const diffPct = (Math.abs(diff) / averageWeeklySpend) * 100;
      if (diff > 0) {
        compareMsg = `صرف هذا الأسبوع زاد بنسبة %${diffPct.toFixed(0)} مقارنة بمعدل الأسابيع الماضية. 📈`;
      } else {
        compareMsg = `صرف هذا الأسبوع انخفض بنسبة %${diffPct.toFixed(0)} مقارنة بمعدل الأسابيع الماضية. أحسنت! 📉`;
      }
    } else {
      compareMsg = `إجمالي صرفك للأسبوع الحالي: ${currentWeekTotal} ${currency}.`;
    }

    return {
      id: 'virtual-weekly-summary',
      message: `تقرير الأحد الأسبوعي: ${compareMsg}`,
      type: 'achievement' as const,
      createdAt: today.toISOString()
    };
  }, [expenses, currency]);

  // Toast dynamic weekly report on load if Sunday
  useEffect(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    if (isSunday && weeklySummaryAlert) {
      const todayStr = today.toISOString().split('T')[0];
      const hasToasted = sessionStorage.getItem(`masarifi_weekly_toast_${todayStr}`);
      if (!hasToasted) {
        toast(weeklySummaryAlert.message, {
          icon: '📊',
          duration: 7000,
          position: 'top-center'
        });
        sessionStorage.setItem(`masarifi_weekly_toast_${todayStr}`, 'true');
      }
    }
  }, [weeklySummaryAlert]);

  // Combine real notifications with local virtual alerts
  const visibleNotifications = useMemo(() => {
    const list = [...notifications];
    if (budgetAlert) list.unshift(budgetAlert);
    recurringAlerts.forEach(re => list.unshift(re));
    subBudgetAlerts.forEach(sba => list.unshift(sba));
    if (weeklySummaryAlert) list.unshift(weeklySummaryAlert);

    return list.filter(n => !dismissedIds.includes(n.id));
  }, [notifications, budgetAlert, recurringAlerts, subBudgetAlerts, weeklySummaryAlert, dismissedIds]);

  const handleDismiss = (id: string) => {
    if (id.startsWith('virtual-')) {
      setDismissedIds(prev => [...prev, id]);
    } else {
      removeNotification(id);
    }
  };

  return (
    <div className="relative">
      <button aria-label="الإشعارات" onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative cursor-pointer">
        <Bell size={20} className="text-slate-600 dark:text-slate-400" />
        {visibleNotifications.length > 0 && (
          <span className="absolute top-1 right-1 size-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md z-50 p-4 text-right"
          >
            <div className="flex justify-between items-center mb-4">
              <button aria-label="إغلاق الإشعارات" onClick={() => setIsOpen(false)} className="hover:text-rose-500 transition-colors"><X size={16} /></button>
              <h3 className="font-bold text-slate-900 dark:text-white">الإشعارات الذكية</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {visibleNotifications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">لا توجد تنبيهات حالياً</p>
              ) : (
                visibleNotifications.map(n => (
                  <div key={n.id} className={cn(
                    "p-3 rounded-xl text-xs font-medium leading-relaxed shadow-xs border text-right relative group/item",
                    n.type === 'budget' ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-200' :
                    n.type === 'achievement' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200' :
                    'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-900 dark:text-rose-200'
                  )}>
                    <div className="pl-6">
                      <p>{n.message}</p>
                    </div>
                    <button
                      onClick={() => handleDismiss(n.id)}
                      className="absolute left-2.5 top-2.5 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="إغلاق"
                    >
                      <X size={12} />
                    </button>
                    <div className="flex justify-start items-center mt-2.5">
                      <button onClick={() => handleDismiss(n.id)} className="text-[10px] font-semibold underline cursor-pointer hover:no-underline opacity-80 hover:opacity-100">مسح التنبيه</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default NotificationBell;
