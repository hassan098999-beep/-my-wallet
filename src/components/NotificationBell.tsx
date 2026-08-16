import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Zap, AlertTriangle, Flame, ShieldAlert, BarChart3, Sparkles } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import { notifyPaceAlertIfAppropriate } from '../utils/paceAnalysis';
import toast from 'react-hot-toast';

const DISMISSED_BELL_KEY = 'masarifi_dismissed_bell_alerts';

const getDismissedBellToday = (): string[] => {
  try {
    const raw = localStorage.getItem(DISMISSED_BELL_KEY);
    if (!raw) return [];
    const parsed: Record<string, string> = JSON.parse(raw);
    const todayStr = new Date().toISOString().split('T')[0];
    return Object.entries(parsed)
      .filter(([_, dateStr]) => dateStr === todayStr)
      .map(([id]) => id);
  } catch {
    return [];
  }
};

const saveDismissedBellToday = (id: string) => {
  try {
    const raw = localStorage.getItem(DISMISSED_BELL_KEY);
    const parsed: Record<string, string> = raw ? JSON.parse(raw) : {};
    const todayStr = new Date().toISOString().split('T')[0];
    parsed[id] = todayStr;
    localStorage.setItem(DISMISSED_BELL_KEY, JSON.stringify(parsed));
  } catch (err) {
    console.warn('Failed to save dismissed bell item:', err);
  }
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, removeNotification, recurringExpenses, expenses, income, currency, categories } = useAppContext();
  const { overallPercentage, totalSpent, globalBudgetNum, categoryStatuses, categoryPaces, fastBurningPaces, remainingDays } = useBudgetStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => getDismissedBellToday());

  // Smart Daily Spending Pace Alerts for Categories
  const paceAlerts = useMemo(() => {
    if (!categoryPaces || categoryPaces.length === 0) return [];

    return categoryPaces
      .filter(p => p.status === 'critical' || p.status === 'warning' || p.status === 'exceeded')
      .map(p => {
        return {
          id: `virtual-pace-${p.categoryId}-${p.status}`,
          message: `${p.alertTitle}: ${p.alertMessage} 💡 ${p.actionAdvice}`,
          type: (p.status === 'critical' || p.status === 'exceeded' ? 'unusual_expense' : 'budget') as 'unusual_expense' | 'budget',
          createdAt: new Date().toISOString(),
          paceData: p
        };
      });
  }, [categoryPaces]);

  // Trigger push notifications for critical/warning pace items
  useEffect(() => {
    if (!categoryPaces || categoryPaces.length === 0) return;
    categoryPaces.forEach(p => {
      if (p.status === 'critical' || p.status === 'warning' || p.status === 'exceeded') {
        notifyPaceAlertIfAppropriate(p, currency);
      }
    });
  }, [categoryPaces, currency]);

  // 4. Category-specific sub-budget limit alerts (fallback for general threshold)
  const subBudgetAlerts = useMemo(() => {
    if (!categoryStatuses || categoryStatuses.length === 0) return [];

    return categoryStatuses
      .filter(cs => cs.percentage >= 90 && !categoryPaces?.some(cp => cp.categoryId === cs.categoryId && (cp.status === 'critical' || cp.status === 'warning' || cp.status === 'exceeded')))
      .map(cs => {
        const cat = categories.find(c => c.id === cs.categoryId);
        const name = cat ? cat.name : 'الفئة';
        const formattedRemaining = cs.remaining < 0 
          ? `عجز بقيمة ${Math.abs(cs.remaining).toFixed(1)}` 
          : `متبقي ${cs.remaining.toFixed(1)}`;

        return {
          id: `virtual-subbudget-${cs.categoryId}`,
          message: `تنبيه موازنة: اقتربت ميزانية الفئة "${name}" من السقف المخصص (%${cs.percentage.toFixed(0)}). الحالة: ${formattedRemaining} ${currency}.`,
          type: 'budget' as const,
          createdAt: new Date().toISOString()
        };
      });
  }, [categoryStatuses, categoryPaces, categories, currency]);

  // 1. Budget 80% limit warning
  const budgetAlert = useMemo(() => {
    if (globalBudgetNum > 0 && overallPercentage >= 80) {
      return {
        id: 'virtual-budget-alert',
        message: `تنبيه ميزانية: لقد تجاوزت %${overallPercentage.toFixed(0)} من ميزانيتك الإجمالية (${formatCurrency(totalSpent, currency)} من أصل ${formatCurrency(globalBudgetNum, currency)})! ⚠️`,
        type: 'unusual_expense' as const,
        createdAt: new Date().toISOString()
      };
    }
    return null;
  }, [globalBudgetNum, overallPercentage, totalSpent, currency]);

  // 2. Due recurring expenses according to user local notification settings
  const recurringAlerts = useMemo(() => {
    const isEnabled = localStorage.getItem('masarifi_recurring_notifications_enabled') !== 'false';
    if (!isEnabled || !recurringExpenses || recurringExpenses.length === 0) return [];

    const noticeDays = parseInt(localStorage.getItem('masarifi_recurring_notice_days') || '1', 10);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayMs = new Date(todayStr).getTime();
    const noticeMs = noticeDays * 24 * 60 * 60 * 1000;

    return recurringExpenses
      .filter(re => {
        try {
          const nextMs = new Date(re.nextDate).getTime();
          const diff = nextMs - todayMs;
          return diff >= 0 && diff <= noticeMs;
        } catch (e) {
          return false;
        }
      })
      .map(re => {
        const nextDateObj = new Date(re.nextDate);
        const daysDiff = Math.round((nextDateObj.getTime() - todayMs) / (1000 * 60 * 60 * 24));
        const timeText = daysDiff === 0 ? 'اليوم' : daysDiff === 1 ? 'غداً' : `خلال ${daysDiff} أيام`;

        return {
          id: `virtual-recurring-${re.id}`,
          message: `تنبيه مصروف دوري: المصروف المتكرر "${re.note || 'مصروف مجدول'}" بقيمة ${re.amount} ${currency} مستحق ${timeText} (${nextDateObj.toLocaleDateString('ar-TN', { day: 'numeric', month: 'long' })}). ⏱️`,
          type: 'budget' as const,
          createdAt: re.nextDate
        };
      });
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

  // 5. Daily 24h reminder at end of day
  const dailyReminderAlert = useMemo(() => {
    const isEnabled = localStorage.getItem('masarifi_daily_reminder_enabled') !== 'false';
    if (!isEnabled) return null;

    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Filter to see if any expenses or incomes exist from the last 24 hours
    const hasRecentExpense = expenses.some(e => {
      const d = new Date(e.createdAt || e.date);
      return (now.getTime() - d.getTime()) < oneDayInMs;
    });
    const hasRecentIncome = (expenses.length === 0 && (income || []).some(i => {
      const d = new Date(i.createdAt || i.date);
      return (now.getTime() - d.getTime()) < oneDayInMs;
    }));

    const hasRecent = hasRecentExpense || hasRecentIncome;
    const currentHour = now.getHours();
    const isEndOfDay = currentHour >= 20; // 8:00 PM onwards

    if (!hasRecent && isEndOfDay) {
      return {
        id: 'virtual-daily-reminder-24h',
        message: `تذكير نهاية اليوم: لم تقم بتسجيل أي مصروفات أو دخل خلال الـ 24 ساعة الماضية. يرجى تسجيل معاملاتك الآن لترشيد ميزانيتك اليومية والحفاظ على دقتها! 📝🔔`,
        type: 'unusual_expense' as const,
        createdAt: now.toISOString()
      };
    }
    return null;
  }, [expenses, income]);

  // Interactive toast for weekly summary report
  const showInteractiveWeeklyToast = (msg: string) => {
    toast.custom((t) => (
      <div
        onClick={() => {
          hapticFeedback('medium');
          toast.dismiss(t.id);
          navigate('/analytics?tab=weekly');
        }}
        className={cn(
          "max-w-md w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl rounded-2xl border-2 border-indigo-500/60 p-4 text-right cursor-pointer transition-all hover:scale-[1.02] hover:border-indigo-600 group pointer-events-auto",
          t.visible ? 'animate-enter' : 'animate-leave'
        )}
        dir="rtl"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
            <BarChart3 size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">تذكير الميزانية الأسبوعية 🔔</span>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                اضغط لعرض التقرير 👈
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
              {msg}
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-black text-indigo-600 dark:text-indigo-400 group-hover:underline">
              <span>انقر للانتقال مباشرة لتقرير المقارنة الأسبوعي 📊</span>
              <span>←</span>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-center'
    });
  };

  // Toast dynamic weekly report on load if Sunday
  useEffect(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    if (isSunday && weeklySummaryAlert) {
      const todayStr = today.toISOString().split('T')[0];
      const hasToasted = sessionStorage.getItem(`masarifi_weekly_toast_${todayStr}`);
      if (!hasToasted) {
        showInteractiveWeeklyToast(weeklySummaryAlert.message);
        sessionStorage.setItem(`masarifi_weekly_toast_${todayStr}`, 'true');
      }
    }
  }, [weeklySummaryAlert]);

  // Toast and Push Notification for Daily 24h Reminder
  useEffect(() => {
    if (!dailyReminderAlert) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const hasNotifiedToday = localStorage.getItem(`masarifi_daily_reminder_toast_${todayStr}`);
    
    if (!hasNotifiedToday) {
      // 1. Show nice in-app toast
      toast(dailyReminderAlert.message, {
        icon: '🔔',
        duration: 8000,
        position: 'top-center',
        style: {
          border: '1px solid #fecaca',
          padding: '16px',
          color: '#991b1b',
          background: '#fef2f2',
          fontWeight: '900',
        }
      });

      // 2. Trigger browser notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification("تذكير ميزانية مساريفي 🇹🇳", {
            body: "لم تقم بتسجيل أي مصروف اليوم. اضغط لتسجيل معاملاتك ومتابعة ميزانيتك!",
            icon: '/icon-192.png'
          });
        } catch (e) {
          navigator.serviceWorker?.ready.then(registration => {
            registration.showNotification("تذكير ميزانية مساريفي 🇹🇳", {
              body: "لم تقم بتسجيل أي مصروف اليوم. اضغط لتسجيل معاملاتك ومتابعة ميزانيتك!",
              icon: '/icon-192.png'
            });
          });
        }
      }

      // Mark as notified today
      localStorage.setItem(`masarifi_daily_reminder_toast_${todayStr}`, 'true');
    }
  }, [dailyReminderAlert]);

  // Combine real notifications with local virtual alerts
  const visibleNotifications = useMemo(() => {
    const list = [...notifications];
    paceAlerts.forEach(pa => list.unshift(pa));
    if (budgetAlert) list.unshift(budgetAlert);
    recurringAlerts.forEach(re => list.unshift(re));
    subBudgetAlerts.forEach(sba => list.unshift(sba));
    if (weeklySummaryAlert) list.unshift(weeklySummaryAlert);
    if (dailyReminderAlert) list.unshift(dailyReminderAlert);

    return list.filter(n => !dismissedIds.includes(n.id));
  }, [notifications, paceAlerts, budgetAlert, recurringAlerts, subBudgetAlerts, weeklySummaryAlert, dailyReminderAlert, dismissedIds]);

  const handleDismiss = (id: string) => {
    hapticFeedback('light');
    saveDismissedBellToday(id);
    setDismissedIds(prev => [...prev, id]);
    if (!id.startsWith('virtual-')) {
      removeNotification(id);
    }
  };

  const handleNotificationClick = (n: any) => {
    hapticFeedback('light');
    setIsOpen(false);
    if (n.type === 'debt_due' || n.debtId) {
      navigate('/debts');
    } else if (n.id === 'virtual-weekly-summary' || n.id.startsWith('virtual-pace-') || n.id === 'virtual-budget-alert' || n.id.startsWith('virtual-subbudget-')) {
      navigate('/analytics?tab=weekly');
    } else if (n.id.startsWith('virtual-recurring-')) {
      navigate('/recurring');
    } else if (n.id === 'virtual-daily-reminder-24h') {
      navigate('/transactions');
    } else {
      navigate('/analytics?tab=weekly');
    }
  };

  return (
    <div className="relative">
      <button aria-label="الإشعارات" onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative cursor-pointer">
        <Bell size={20} className="text-slate-600 dark:text-slate-400" />
        {visibleNotifications.length > 0 && (
          <span className="absolute top-1 right-1 size-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 text-right"
          >
            <div className="flex justify-between items-center mb-3">
              <button aria-label="إغلاق الإشعارات" onClick={() => setIsOpen(false)} className="hover:text-rose-500 transition-colors cursor-pointer"><X size={16} /></button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                  {visibleNotifications.length} تنبيه
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white">نظام التنبيهات الذكي</h3>
              </div>
            </div>

            {/* Quick action bar for weekly report / test trigger */}
            <div className="mb-3 p-2 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/analytics?tab=weekly');
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <BarChart3 size={13} />
                <span>فتح التقرير والمقارنة الأسبوعية 📊</span>
              </button>
              <button
                onClick={() => {
                  showInteractiveWeeklyToast(
                    weeklySummaryAlert?.message || "تقرير الأحد الأسبوعي: مقارنة أداء ميزانيتك ومصاريفك جاهزة للتحليل!"
                  );
                }}
                className="text-[10px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 px-2 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
                title="معاينة إشعار التذكير التفاعلي"
              >
                <Sparkles size={11} className="text-amber-500" />
                <span>تجربة التنبيه</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
              {visibleNotifications.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center mx-auto mb-2">
                    <span className="text-base">✨</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">كل شيء تحت السيطرة!</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">معدل إنفاقك وميزانياتك ضمن الحدود الآمنة.</p>
                </div>
              ) : (
                visibleNotifications.map(n => {
                  const isPace = n.id.startsWith('virtual-pace-') || n.type === 'pace_warning';
                  const isWeekly = n.id === 'virtual-weekly-summary';
                  const isRecurring = n.id.startsWith('virtual-recurring-');

                  return (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-3 rounded-xl text-xs font-medium leading-relaxed shadow-xs border text-right relative group/item transition-all cursor-pointer hover:shadow-md",
                        isWeekly ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200' :
                        isPace ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200' :
                        n.type === 'budget' ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-950 dark:text-indigo-200' :
                        n.type === 'achievement' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-950 dark:text-emerald-200' :
                        'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-950 dark:text-rose-200'
                      )}
                    >
                      {isPace && (
                        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-black text-amber-700 dark:text-amber-400">
                          <Zap size={12} className="text-amber-500 fill-amber-500 animate-pulse" />
                          <span>تحليل سرعة الإنفاق اليومي</span>
                        </div>
                      )}
                      {isWeekly && (
                        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                          <BarChart3 size={12} className="text-indigo-600" />
                          <span>تذكير الميزانية والمقارنة الأسبوعية</span>
                        </div>
                      )}
                      <div className="pl-6">
                        <p className="text-[11px] leading-relaxed font-semibold">{n.message}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(n.id);
                        }}
                        className="absolute left-2.5 top-2.5 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="إغلاق"
                      >
                        <X size={12} />
                      </button>

                      <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover/item:underline">
                          {isWeekly ? '📊 اضغط لفتح التقرير الأسبوعي ←' : 
                           isRecurring ? '⏱️ عرض المصاريف المتكررة ←' : 
                           '📊 عرض التقرير والتحليلات ←'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(n.id);
                            }} 
                            className="text-[10px] font-bold text-slate-500 hover:text-rose-500 cursor-pointer"
                          >
                            تجاهل
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default NotificationBell;
