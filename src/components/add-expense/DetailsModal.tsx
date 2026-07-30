import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Calendar, Check, AlignLeft, Layers } from 'lucide-react';
import { cn, hapticFeedback } from '../../utils';
import { PaymentMethod, Goal } from '../../types';

interface DetailsModalProps {
  type: 'expense' | 'income' | 'transfer';
  bgColor: string;
  date: string;
  setDate: (d: string) => void;
  goals: Goal[];
  goalId: string;
  setGoalId: (id: string) => void;
  note: string;
  setNote: (n: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (pm: PaymentMethod) => void;
  setActiveView: (view: 'main' | 'category' | 'account' | 'toAccount' | 'details') => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  type,
  bgColor,
  date,
  setDate,
  goals,
  goalId,
  setGoalId,
  note,
  setNote,
  paymentMethod,
  setPaymentMethod,
  setActiveView,
}) => {
  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0.5 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: '100%', opacity: 0.5 }} 
      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col"
    >
      <div className={cn("flex items-center p-4 text-white shrink-0 pt-[env(safe-area-inset-top)]", bgColor)}>
        <button onClick={() => { hapticFeedback('light'); setActiveView('main'); }} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold">تفاصيل إضافية</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Date */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <Calendar size={16} /> التاريخ
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold outline-none focus:border-indigo-500"
          />
        </div>

        {/* Link to goal (only for income) */}
        {type === 'income' && goals && goals.length > 0 && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
              <Check size={16} className="text-emerald-500" /> ربط بهدف مالي (اختياري)
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold outline-none focus:border-indigo-500 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <option value="">-- اختر هدفاً لتخصيص هذا الدخل له --</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Note */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <AlignLeft size={16} /> ملاحظة
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظات إضافية..."
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold outline-none focus:border-indigo-500 min-h-[100px] resize-none"
          />
        </div>

        {/* Payment Method (only for expense) */}
        {type === 'expense' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
              <Layers size={16} /> طريقة الدفع
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'transfer'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    "py-3 rounded-xl text-xs font-semibold transition-all",
                    paymentMethod === method
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-rose-500/30"
                  )}
                >
                  {method === 'cash' ? 'كاش' : method === 'card' ? 'بطاقة' : 'تحويل'}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={() => { hapticFeedback('light'); setActiveView('main'); }}
          className={cn("w-full py-4 rounded-xl font-bold text-white shadow-lg", bgColor)}
        >
          حفظ والعودة
        </button>
      </div>
    </motion.div>
  );
};
