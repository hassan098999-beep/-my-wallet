import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, DollarSign, Calendar, FileText, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { Debt, DebtDirection, Account } from '../../types';
import { hapticFeedback } from '../../utils';

interface DebtFormModalProps {
  isOpen: boolean;
  editingDebt?: Debt | null;
  defaultDirection?: DebtDirection;
  accounts: Account[];
  currency: string;
  onClose: () => void;
  onSubmit: (debtData: {
    personName: string;
    direction: DebtDirection;
    totalAmount: number;
    dueDate?: string;
    note?: string;
    accountId?: string;
  }) => void;
}

export const DebtFormModal: React.FC<DebtFormModalProps> = ({
  isOpen,
  editingDebt,
  defaultDirection = 'owed_to_me',
  accounts,
  currency,
  onClose,
  onSubmit,
}) => {
  const [personName, setPersonName] = useState('');
  const [direction, setDirection] = useState<DebtDirection>(defaultDirection);
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    if (editingDebt) {
      setPersonName(editingDebt.personName);
      setDirection(editingDebt.direction);
      setTotalAmount(editingDebt.totalAmount.toString());
      setDueDate(editingDebt.dueDate || '');
      setNote(editingDebt.note || '');
      setAccountId(editingDebt.accountId || '');
    } else {
      setPersonName('');
      setDirection(defaultDirection);
      setTotalAmount('');
      setDueDate('');
      setNote('');
      setAccountId('');
    }
  }, [editingDebt, defaultDirection, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(totalAmount);
    if (!personName.trim() || !amount || amount <= 0) return;

    hapticFeedback('success');
    onSubmit({
      personName: personName.trim(),
      direction,
      totalAmount: amount,
      dueDate: dueDate ? dueDate : undefined,
      note: note.trim() ? note.trim() : undefined,
      accountId: accountId ? accountId : undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editingDebt ? 'تعديل بيانات الدين' : 'إضافة التزام / دين جديد'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Direction Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                نوع الالتزام
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('light');
                    setDirection('owed_to_me');
                  }}
                  className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                    direction === 'owed_to_me'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <ArrowDownLeft size={18} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">لي عند الناس</p>
                    <p className="text-[10px] opacity-75">مبلغ ينتظر استلامه</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('light');
                    setDirection('i_owe');
                  }}
                  className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                    direction === 'i_owe'
                      ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <ArrowUpRight size={18} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">علي للناس</p>
                    <p className="text-[10px] opacity-75">دين علي سداده</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Person Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                اسم الشخص / الجهة
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="مثلاً: محمد الطرابلسي، صاحب المحل..."
                  className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                المبلغ الإجمالي ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded-xl text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <DollarSign size={18} />
                </div>
              </div>
            </div>

            {/* Grid for Due Date & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  تاريخ الاستحقاق (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar size={16} />
                  </div>
                </div>
              </div>

              {/* Linked Account */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  الحساب المرتبط (اختياري)
                </label>
                <div className="relative">
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">بدون حساب محدد</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Wallet size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                ملاحظات أو تفاصيل إضافية
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثلاً: سلفة لشراء أجهزة، قرض عائلي..."
                  className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <FileText size={16} />
                </div>
              </div>
            </div>

            {/* Actions */}
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
                className={`flex-1 py-3 px-4 rounded-xl text-white font-black text-sm shadow-lg transition-all ${
                  direction === 'owed_to_me'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {editingDebt ? 'حفظ التعديلات' : 'إضافة الدين'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
