import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, BellOff, Volume2, CheckCircle2, AlertTriangle, Sparkles, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import toast from 'react-hot-toast';
import Card from './ui/Card';
import Badge from './ui/Badge';

export const RecurringNotificationManager: React.FC = () => {
  const { recurringExpenses, currency, categories } = useAppContext();

  // Local Storage state
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('masarifi_recurring_notifications_enabled') !== 'false';
  });
  
  const [noticeDays, setNoticeDays] = useState<number>(() => {
    const saved = localStorage.getItem('masarifi_recurring_notice_days');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Keep track of upcoming expenses matching notice criteria
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMs = new Date(todayStr).getTime();

  const upcomingDueItems = (recurringExpenses || []).filter(re => {
    try {
      const nextMs = new Date(re.nextDate).getTime();
      const diff = nextMs - todayMs;
      const maxNoticeMs = noticeDays * 24 * 60 * 60 * 1000;
      return diff >= 0 && diff <= maxNoticeMs;
    } catch {
      return false;
    }
  });

  // Check and trigger notifications on mount or when criteria changes
  useEffect(() => {
    if (!isEnabled || upcomingDueItems.length === 0) return;

    if (permission === 'granted') {
      upcomingDueItems.forEach(re => {
        const notifKey = `masarifi_notified_rec_${re.id}_${re.nextDate}`;
        const alreadyNotified = localStorage.getItem(notifKey);

        if (!alreadyNotified) {
          const cat = categories.find(c => c.id === re.categoryId);
          const catName = cat ? cat.name : '';
          const daysDiff = Math.round((new Date(re.nextDate).getTime() - todayMs) / (1000 * 60 * 60 * 24));
          const timeLabel = daysDiff === 0 ? 'مستحق اليوم' : daysDiff === 1 ? 'مستحق غداً' : `مستحق خلال ${daysDiff} أيام`;

          const title = `تذكير بمصروف متكرر: ${re.note || catName || 'مصروف مجدول'}`;
          const body = `المبلغ: ${re.amount} ${currency} | ${timeLabel} (${re.nextDate})`;

          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, {
                body,
                icon: '/icon-192.png',
                tag: `recurring-${re.id}`
              });
            }
          } catch (err) {
            console.warn('Native notification failed:', err);
          }

          localStorage.setItem(notifKey, new Date().toISOString());
        }
      });
    }
  }, [isEnabled, permission, upcomingDueItems, currency, categories, todayMs]);

  const handleToggleEnable = (value: boolean) => {
    hapticFeedback('light');
    setIsEnabled(value);
    localStorage.setItem('masarifi_recurring_notifications_enabled', value ? 'true' : 'false');
    toast.success(value ? 'تم تفعيل إشعارات التذكير للمصاريف المتكررة' : 'تم إيقاف إشعارات المصاريف المتكررة');
  };

  const handleNoticeDaysChange = (days: number) => {
    hapticFeedback('light');
    setNoticeDays(days);
    localStorage.setItem('masarifi_recurring_notice_days', days.toString());
    toast.success(`سيتم تذكيرك قبل ${days === 0 ? 'نفس اليوم' : days === 1 ? 'يوم واحد' : `${days} أيام`}`);
  };

  const handleRequestPermission = async () => {
    hapticFeedback('medium');
    if (!('Notification' in window)) {
      toast.error('متصفحك لا يدعم إشعارات المتصفح المباشرة');
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        toast.success('تم منح إذن الإشعارات بنجاح! 🔔');
      } else if (res === 'denied') {
        toast.error('تم رفض إذن الإشعارات. يمكنك تفعيلها من إعدادات المتصفح.');
      }
    } catch (e) {
      console.error(e);
      toast.error('تعذر طلب إذن الإشعارات');
    }
  };

  const handleTestNotification = () => {
    hapticFeedback('heavy');
    const sampleText = `إشعار تجريبي للمصاريف المتكررة 🇹🇳\nتذكير: فاتورة الكراء بقيمة 450 ${currency} تستحق غداً!`;

    // In-app Toast
    toast(sampleText, {
      icon: '🔔',
      duration: 5000,
      style: {
        borderRadius: '16px',
        background: '#0f172a',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '12px'
      }
    });

    // Native browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("تطبيق مساريفي 🇹🇳", {
          body: "هذا إشعار تجريبي لتأكيد عمل التنبيهات المحلية للمصاريف المتكررة بنجاح!",
          icon: '/icon-192.png'
        });
      } catch (err) {
        console.warn(err);
      }
    } else {
      toast('ملاحظة: للحصول على تنبيهات سطح المكتب أو الهاتف، يرجى السماح بالإشعارات من المتصفح.', {
        icon: '💡',
        duration: 4000
      });
    }
  };

  return (
    <Card className="p-5 md:p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white dark:via-slate-900 to-teal-500/5 relative overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Bell size={22} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                نظام إشعارات المصاريف المتكررة
              </h3>
              <Badge variant={isEnabled ? 'success' : 'info'}>
                {isEnabled ? 'مفعل محلياً' : 'معطل'}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              تذكير آلي مبكر بالفواتير والالتزامات المالية قبل تاريخ استحقاقها
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle size={14} />
              <span>طلب إذن المتصفح</span>
            </button>
          )}

          <button
            onClick={handleTestNotification}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Volume2 size={14} />
            <span>تجربة إشعار</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Toggle Switch */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-850/70 border border-slate-200/50 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {isEnabled ? <Bell size={14} className="text-emerald-500" /> : <BellOff size={14} className="text-slate-400" />}
              تفعيل التذكيرات المحلية
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              إرسال تنبيهات تلقائية في التطبيق والمتصفح
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => handleToggleEnable(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Days notice selector */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-850/70 border border-slate-200/50 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock size={14} className="text-emerald-500" />
            وقت التذكير قبل الاستحقاق:
          </span>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { days: 0, label: 'في اليوم' },
              { days: 1, label: 'قبل يوم' },
              { days: 2, label: 'قبل يومين' },
              { days: 3, label: 'قبل 3 أيام' }
            ].map(opt => (
              <button
                key={opt.days}
                disabled={!isEnabled}
                onClick={() => handleNoticeDaysChange(opt.days)}
                className={cn(
                  "py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center",
                  noticeDays === opt.days && isEnabled
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300",
                  !isEnabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Reminders Preview Section */}
      {isEnabled && upcomingDueItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-500" />
              فواتير ومصاريف مستحقة قريباً تتطلب التنبيه ({upcomingDueItems.length}):
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {upcomingDueItems.map(re => {
              const daysDiff = Math.round((new Date(re.nextDate).getTime() - todayMs) / (1000 * 60 * 60 * 24));
              const category = categories.find(c => c.id === re.categoryId);
              return (
                <div
                  key={re.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-emerald-500/20 flex items-center justify-between text-xs gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {re.note || category?.name || 'مصروف متكرر'}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {category?.name} • {re.nextDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <p className="font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(re.amount, currency)}
                    </p>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-md inline-block",
                      daysDiff === 0 ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"
                    )}>
                      {daysDiff === 0 ? 'مستحق اليوم ⚡' : daysDiff === 1 ? 'غداً' : `خلال ${daysDiff} أيام`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Permission Status Bar */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-2 border-t border-slate-200/40 dark:border-slate-800">
        <span className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-emerald-500" />
          حالة إذن إشعارات المتصفح:
        </span>
        <span className={cn(
          "font-bold",
          permission === 'granted' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
        )}>
          {permission === 'granted' ? 'مسموح به (نشط)' : permission === 'denied' ? 'مرفوض' : 'لم يتم تحديده بعد'}
        </span>
      </div>
    </Card>
  );
};

export default RecurringNotificationManager;
