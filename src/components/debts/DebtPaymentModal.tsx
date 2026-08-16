import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Debt, DebtPayment } from '../../types';
import { formatCurrency, hapticFeedback } from '../../utils';

interface DebtPaymentModalProps {
  isOpen: boolean;
  debt: Debt | null;
  currency: string;
  onClose: () => void;
  onSubmit: (debtId: string, payment: Omit<DebtPayment, 'id'>) => void;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  debt,
  currency,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !debt) return null;

  const [amount, setAmount] = useState(debt.remainingAmount.toString());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    hapticFeedback('success');
    onSubmit(debt.id, {
      amount: numAmount,
      date,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const handleQuickAmount = (ratio: number) => {
    hapticFeedback('light');
    const calculated = (debt.remainingAmount * ratio).toFixed(2);
    setAmount(calculated.endsWith('.00') ? Math.round(Number(calculated)).toString() : calculated);
  };

  const isFullPayment = Number(amount) >= debt.remainingAmount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">تسجيل دفعة جديدة</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {debt.direction === 'owed_to_me'
                  ? `استلام دفعة من: ${debt.personName}`
                  : `سداد دفعة إلى: ${debt.personName}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Remaining Amount Info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المبلغ المتبقي حالياً:</span>
              <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">
                {formatCurrency(debt.remainingAmount, currency)}
              </span>
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                مبلغ الدفعة ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  max={debt.remainingAmount * 2}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded-xl text-base font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <DollarSign size={18} />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(1)}
                  className="flex-1 py-1.5 px-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  كامل المبلغ (100%)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.5)}
                  className="flex-1 py-1.5 px-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  النصف (50%)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.25)}
                  className="flex-1 py-1.5 px-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  الربع (25%)
                </button>
              </div>
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                تاريخ الدفعة
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar size={18} />
                </div>
              </div>
            </div>

            {/* Note Field */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                ملاحظة (اختياري)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثلاً: دفعة نقداً، تحويل بنكي..."
                  className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <FileText size={18} />
                </div>
              </div>
            </div>

            {isFullPayment && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>سيتم تسوية الدين بالكامل ونقله لقسم الديون المسدَّدة! 🎉</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Check size={18} />
                <span>تأكيد الدفعة</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
