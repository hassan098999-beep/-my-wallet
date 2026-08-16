import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Edit3, 
  History, 
  MoreVertical, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Debt } from '../../types';
import { formatCurrency, hapticFeedback } from '../../utils';

interface DebtCardProps {
  debt: Debt;
  currency: string;
  onRecordPayment: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  currency,
  onRecordPayment,
  onEdit,
  onDelete,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwedToMe = debt.direction === 'owed_to_me';
  const totalPaid = (debt.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const progressPercent = debt.totalAmount > 0 
    ? Math.min(100, Math.round((totalPaid / debt.totalAmount) * 100))
    : 0;

  // Due Date calculation
  const getDueDateStatus = () => {
    if (!debt.dueDate) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(debt.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          text: `متأخر بـ ${Math.abs(diffDays)} يوم`,
          type: 'overdue',
          color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
        };
      } else if (diffDays === 0) {
        return {
          text: 'يستحق اليوم',
          type: 'today',
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        };
      } else if (diffDays <= 3) {
        return {
          text: `يستحق خلال ${diffDays} أيام`,
          type: 'soon',
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        };
      } else {
        return {
          text: `يستحق في ${debt.dueDate}`,
          type: 'normal',
          color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
        };
      }
    } catch (e) {
      return null;
    }
  };

  const dueStatus = getDueDateStatus();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 md:p-6 transition-all duration-300 relative shadow-sm hover:shadow-md ${
        debt.isSettled
          ? 'border-slate-200/80 dark:border-slate-800 opacity-80'
          : isOwedToMe
          ? 'border-emerald-200/70 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-700'
          : 'border-rose-200/70 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-700'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              debt.isSettled
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                : isOwedToMe
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {debt.isSettled ? (
              <CheckCircle2 size={22} className="text-emerald-500" />
            ) : isOwedToMe ? (
              <ArrowDownLeft size={22} />
            ) : (
              <ArrowUpRight size={22} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {debt.personName}
              </h4>
              {debt.isSettled && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                  تم السداد ✓
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isOwedToMe ? 'مستحق لك' : 'مطلوب منك'} • أضيف في{' '}
              {new Date(debt.createdAt).toLocaleDateString('ar-TN')}
            </p>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute left-0 mt-1 w-36 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-750 py-1.5 z-30 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(debt);
                    }}
                    className="w-full px-3.5 py-2 text-right text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Edit3 size={14} className="text-slate-400" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الدين؟')) {
                        onDelete(debt.id);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-right text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    <span>حذف</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Amounts and Progress */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">
              المتبقي
            </span>
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                debt.isSettled
                  ? 'text-slate-400 line-through'
                  : isOwedToMe
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(debt.remainingAmount, currency)}
            </span>
          </div>

          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-400 block">
              الإجمالي
            </span>
            <span className="text-sm font-black font-mono text-slate-700 dark:text-slate-300">
              {formatCurrency(debt.totalAmount, currency)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              debt.isSettled
                ? 'bg-emerald-500'
                : isOwedToMe
                ? 'bg-emerald-500'
                : 'bg-rose-500'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
          <span>تم سداد: {formatCurrency(totalPaid, currency)}</span>
          <span className="font-mono">{progressPercent}%</span>
        </div>
      </div>

      {/* Note & Due Date Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {dueStatus && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${dueStatus.color}`}
          >
            <Clock size={13} />
            <span>{dueStatus.text}</span>
          </span>
        )}

        {debt.note && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <FileText size={13} className="text-slate-400" />
            <span className="truncate max-w-[200px]">{debt.note}</span>
          </span>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        {/* Payment History Toggle */}
        <button
          onClick={() => {
            hapticFeedback('light');
            setShowHistory(!showHistory);
          }}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <History size={14} />
          <span>سجل الدفعات ({debt.payments?.length || 0})</span>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Record Payment Button (if not settled) */}
        {!debt.isSettled && (
          <button
            onClick={() => {
              hapticFeedback('medium');
              onRecordPayment(debt);
            }}
            className={`py-2 px-3.5 rounded-xl font-black text-xs text-white shadow-md flex items-center gap-1.5 transition-all active:scale-95 ${
              isOwedToMe
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            <DollarSign size={14} />
            <span>تسجيل دفعة</span>
          </button>
        )}
      </div>

      {/* Expandable Payment History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
              سجل الدفعات المسجلة:
            </h5>
            {debt.payments && debt.payments.length > 0 ? (
              <div className="space-y-2">
                {debt.payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {p.date}
                      </div>
                      {p.note && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.note}
                        </p>
                      )}
                    </div>
                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(p.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2 text-center">
                لا توجد دفعات مسجلة بعد لهذا الدين.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
