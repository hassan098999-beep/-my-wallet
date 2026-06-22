import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { PaymentMethod, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Zap, Coins, Building2, Calendar, Sparkles } from 'lucide-react';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import { DynamicIcon } from './DynamicIcon';
import toast from 'react-hot-toast';

interface QuickAddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPEED_VALS = [5, 10, 20, 50, 100];

export const QuickAddExpenseModal: React.FC<QuickAddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { categories = [], accounts = [], addExpense, currency = 'TND' } = useAppContext();

  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Set default account and category on open
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSelectedCategoryId(categories[0]?.id || '');
      setAccountId(accounts[0]?.id || '');
      setPaymentMethod('cash');
      setNote('مصروف سريع ⚡');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, categories, accounts]);

  const handleSpeedAdd = (val: number) => {
    hapticFeedback('light');
    const curr = Number(amount) || 0;
    setAmount((curr + val).toString());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = Number(amount);
    if (!amount || isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('الرجاء إدخال قيمة صحيحة أكبر من الصفر');
      return;
    }
    if (!selectedCategoryId) {
      toast.error('الرجاء اختيار فئة للمصروف');
      return;
    }

    hapticFeedback('success');
    addExpense({
      amount: finalAmount,
      categoryId: selectedCategoryId,
      accountId: accountId || undefined,
      paymentMethod,
      date,
      note: note.trim() || 'مصروف سريع ⚡',
    });

    toast.success('تم تسجيل المصروف السريع بنجاح! ⚡🎉');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
        {/* Backdrop background click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Modal Panel container */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Top beautiful lightning grabber/header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
            <button
              onClick={onClose}
              className="p-2 cursor-pointer text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-[#eab308] bg-[#eab308]/10 border border-[#eab308]/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                سريع ⚡
              </span>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">قيد مصروف مستعجل</h3>
            </div>
          </div>

          {/* Modal Content Scrollable Area */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar pb-10">
            {/* Amount input block */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">مبلغ المصروف والنفقة</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.000"
                  className="w-full pl-16 pr-5 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 focus:border-[#eab308] rounded-2xl text-center text-2xl font-black text-slate-900 dark:text-white outline-none transition-all font-mono"
                  autoFocus
                  required
                  dir="ltr"
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-emerald-500 font-mono">
                  {currency}
                </span>
              </div>
            </div>

            {/* Quick addition shortcuts */}
            <div className="flex flex-wrap gap-2 justify-center">
              {SPEED_VALS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleSpeedAdd(val)}
                  className="px-3 py-1.5 text-xs font-black rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-[#eab308]/10 hover:text-[#eab308] hover:border-[#eab308]/30 border border-slate-200 dark:border-slate-800/80 active:scale-95 transition-all cursor-pointer font-mono"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { hapticFeedback('light'); setAmount(''); }}
                className="px-3 py-1.5 text-xs font-black rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 border border-rose-200/50 dark:border-rose-900/30 active:scale-95 transition-all cursor-pointer"
              >
                تعبئة جديدة
              </button>
            </div>

            {/* Category Select visual grid */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">حدد تصنيف المصروف 📂</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        hapticFeedback('light');
                        setSelectedCategoryId(cat.id);
                      }}
                      className={cn(
                        "p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all relative overflow-hidden group cursor-pointer",
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/5"
                          : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-500 hover:border-slate-350 dark:hover:border-slate-700"
                      )}
                    >
                      {/* Smooth indicator dot */}
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      
                      <div className={cn(
                        "p-2 rounded-xl transition-all",
                        isSelected 
                          ? "bg-emerald-500/15 text-emerald-500" 
                          : "bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-slate-100"
                      )}>
                        <DynamicIcon name={cat.icon || 'Circle'} animate={false} size={16} />
                      </div>

                      <span className="text-[10px] font-black truncate max-w-full">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">مصدر الخصم (الحساب)</label>
                <div className="relative">
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-black text-slate-755 dark:text-white focus:border-[#eab308] outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">كاش / بدون حساب</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                  <Building2 size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">طريقة الدفع</label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-black text-slate-755 dark:text-white focus:border-[#eab308] outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="cash">💵 كاش / نقدي</option>
                    <option value="card">💳 بطاقة بنكية</option>
                    <option value="bank">🏦 تحويل بنكي</option>
                  </select>
                  <Coins size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Simple Note/memo and optional date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">تاريخ المصروف</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none transition-all cursor-pointer text-center"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">مذكرات أو بيان مختصر</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مصروف سريع ⚡"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Action buttons save/cancel */}
            <div className="flex gap-3 justify-end pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 hover:text-slate-650 rounded-xl transition-all cursor-pointer"
              >
                تراجع
              </button>
              
              <button
                type="submit"
                className="flex-[2] py-3 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 shadow-lg shadow-amber-400/20 active:scale-95 transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap size={14} />
                <span>حفظ المصروف ⚡</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
