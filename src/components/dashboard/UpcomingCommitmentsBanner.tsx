import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, AlertTriangle, Zap, CheckCircle2, ArrowRight, Wallet, Calendar } from 'lucide-react';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import toast from 'react-hot-toast';

export const UpcomingCommitmentsBanner: React.FC = () => {
  const { recurringExpenses, categories, currency, accounts, payRecurringExpenseNow } = useAppContext();
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'cash');

  const today = new Date();

  // Find bills due in <= 5 days or overdue
  const urgentBills = (recurringExpenses || [])
    .map(exp => {
      const dueDate = parseISO(exp.nextDate);
      const daysUntil = differenceInCalendarDays(dueDate, today);
      return { exp, dueDate, daysUntil };
    })
    .filter(item => item.daysUntil <= 5)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (urgentBills.length === 0) return null;

  const topUrgent = urgentBills[0];
  const { exp, dueDate, daysUntil } = topUrgent;
  const category = categories.find(c => c.id === exp.categoryId);

  const isOverdue = daysUntil < 0;
  const isToday = daysUntil === 0;

  const handleQuickPay = async () => {
    hapticFeedback('success');
    try {
      await payRecurringExpenseNow(exp.id, selectedAccountId);
      setPayingExpenseId(null);
    } catch {
      toast.error('فشل تأكيد الدفع');
    }
  };

  return (
    <div className="w-full font-tajawal" dir="rtl">
      <div className={cn(
        "rounded-3xl p-4 md:p-5 border shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
        isToday || isOverdue
          ? "bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
          : "bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
      )}>
        <div className="flex items-center gap-3.5">
          <div className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-white",
            isToday || isOverdue ? "bg-rose-600 animate-pulse" : "bg-amber-500"
          )}>
            {isToday ? <Zap size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-md",
                isToday || isOverdue
                  ? "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                  : "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              )}>
                {isOverdue 
                  ? `فاتورة متأخرة بـ ${Math.abs(daysUntil)} يوم! ⚠️` 
                  : isToday 
                  ? 'فاتورة مستحقة اليوم! ⚡' 
                  : `تستحق بعد ${daysUntil} أيام ⏳`}
              </span>
              <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white">
                {exp.note || category?.name || 'التزام دوري'}
              </h4>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              موعد الاستحقاق: <span className="font-bold font-mono">{format(dueDate, 'dd MMMM yyyy', { locale: ar })}</span> • المبلغ: <strong className="font-mono text-slate-900 dark:text-white font-black">{formatCurrency(exp.amount, currency)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Link
            to="/recurring"
            className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
          >
            عرض الكل ({urgentBills.length})
          </Link>
          <button
            onClick={() => setPayingExpenseId(exp.id)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95",
              isToday || isOverdue ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25" : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
            )}
          >
            <CheckCircle2 size={14} />
            <span>تسديد الآن ⚡</span>
          </button>
        </div>
      </div>

      {/* Account select modal on pay */}
      <AnimatePresence>
        {payingExpenseId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-black text-slate-900 dark:text-white">خصم الفاتورة من أي حساب؟</h3>
              <p className="text-xs text-slate-500">
                المبلغ: <strong>{formatCurrency(exp.amount, currency)}</strong> لـ {exp.note || category?.name}
              </p>
              
              <div className="space-y-2">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={cn(
                      "w-full p-3 rounded-2xl border text-right flex justify-between items-center text-xs font-bold cursor-pointer transition-all",
                      selectedAccountId === acc.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>{acc.name}</span>
                    <span className="font-mono text-slate-500">{formatCurrency(acc.balance, currency)}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPayingExpenseId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleQuickPay}
                  className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20"
                >
                  تأكيد الخصم والدفع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
