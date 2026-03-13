import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { PaymentMethod } from '../types';
import { CategorySelect } from './CategorySelect';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, CreditCard, Banknote, Landmark, FileText, Wallet, X, ListTree, Target, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '../utils';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { categories, accounts, goals, expenses, income, addExpense, currency } = useAppContext();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const selectedCategory = categories.find(c => c.id === categoryId);

  // Real-time 50/30/20 Alert Logic
  const alertInfo = useMemo(() => {
    if (!selectedCategory || !selectedCategory.type || !amount || isNaN(Number(amount))) return null;
    
    const expDate = parseISO(date);
    const monthStart = startOfMonth(expDate);
    const monthEnd = endOfMonth(expDate);

    const monthlyIncome = income
      .filter(i => {
        const d = parseISO(i.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, i) => sum + i.amount, 0);

    if (monthlyIncome === 0) return null;

    const currentTypeExpenses = expenses
      .filter(e => {
        const d = parseISO(e.date);
        const cat = categories.find(c => c.id === e.categoryId);
        return d >= monthStart && d <= monthEnd && cat?.type === selectedCategory.type;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const newTotal = currentTypeExpenses + Number(amount);
    const newPercentage = (newTotal / monthlyIncome) * 100;

    const limits = { need: 50, want: 30, saving: 20 };
    const limit = limits[selectedCategory.type as keyof typeof limits];

    if (newPercentage > limit) {
      const typeLabel = selectedCategory.type === 'need' ? 'الاحتياجات' : selectedCategory.type === 'want' ? 'الرغبات' : 'الادخار';
      return {
        typeLabel,
        limit,
        newPercentage: Math.round(newPercentage),
        exceededBy: formatCurrency(newTotal - (monthlyIncome * (limit / 100)), currency)
      };
    }

    return null;
  }, [amount, selectedCategory, date, expenses, income, categories, currency]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCategoryId(categories[0]?.id || '');
      setSubcategoryId('');
      setAccountId(accounts[0]?.id || '');
      setGoalId('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setPaymentMethod('cash');
    }
  }, [isOpen, categories, accounts]);

  useEffect(() => {
    setSubcategoryId('');
  }, [categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }
    if (!accountId) {
      toast.error('الرجاء اختيار الحساب');
      return;
    }

    addExpense({
      amount: Number(amount),
      categoryId,
      subcategoryId: subcategoryId || undefined,
      accountId,
      goalId: goalId || undefined,
      date,
      note,
      paymentMethod,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[500px] bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl z-[70] shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">إضافة مصروف</h2>
                  <p className="text-[10px] text-slate-500 font-bold">تسجيل عملية مالية جديدة</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
              <form id="add-expense-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Hero Amount Section */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="relative w-full max-w-xs">
                    <input
                      type="number"
                      step="0.001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-slate-900 dark:text-white text-center font-mono font-black text-5xl md:text-6xl tracking-tighter placeholder:text-slate-200 dark:placeholder:text-slate-800 focus:ring-0 border-none transition-all"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                    <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                      <div className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-xl">
                        {currency}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                      <ListTree size={12} className="text-primary-500" />
                      الفئة الأساسية
                    </label>
                    <CategorySelect
                      categories={categories}
                      selectedId={categoryId}
                      onChange={setCategoryId}
                      className="!h-[50px] !rounded-xl !border-none !bg-slate-50 dark:!bg-slate-800/50 !shadow-none focus-within:!bg-white dark:focus-within:!bg-slate-800 transition-all"
                    />
                    <AnimatePresence>
                      {alertInfo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-2">
                            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-black text-amber-700 dark:text-amber-500">تنبيه 50/30/20</p>
                              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                                هذا المصروف سيجعل قسم <strong>{alertInfo.typeLabel}</strong> يصل إلى <strong>{alertInfo.newPercentage}%</strong> من دخلك (المستهدف {alertInfo.limit}%).
                                لقد تجاوزت الحد بمقدار {alertInfo.exceededBy}.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Account Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Wallet size={12} className="text-primary-500" />
                      مصدر الأموال
                    </label>
                    <div className="relative group">
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full px-4 h-[50px] rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-black text-sm appearance-none"
                        required
                      >
                        <option value="">اختر الحساب</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Plus size={16} className="rotate-45" />
                      </div>
                    </div>
                  </div>

                  {/* Goal Linking */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Target size={12} className="text-primary-500" />
                      الهدف المرتبط
                    </label>
                    <div className="relative group">
                      <select
                        value={goalId}
                        onChange={(e) => setGoalId(e.target.value)}
                        className="w-full px-4 h-[50px] rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-black text-sm appearance-none"
                      >
                        <option value="">بدون ربط (مصروف عادي)</option>
                        {goals.map((goal) => (
                          <option key={goal.id} value={goal.id}>{goal.name}</option>
                        ))}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Plus size={16} className="rotate-45" />
                      </div>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Calendar size={12} className="text-primary-500" />
                      تاريخ العملية
                    </label>
                    <div className="relative group">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 h-[50px] rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-black text-sm font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Methods - Modern Pills */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 text-center block">
                    طريقة الدفع المستخدمة
                  </label>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1">
                    {[
                      { id: 'cash', label: 'نقدي', icon: Banknote },
                      { id: 'card', label: 'بطاقة', icon: CreditCard },
                      { id: 'transfer', label: 'تحويل', icon: Landmark }
                    ].map(method => (
                      <label key={method.id} className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="peer sr-only"
                        />
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-slate-500 peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-slate-900 dark:peer-checked:text-white peer-checked:shadow-sm transition-all font-black text-[10px] uppercase tracking-widest">
                          <method.icon size={14} />
                          {method.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Note Field - Minimalist */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                    <FileText size={12} className="text-primary-500" />
                    ملاحظات إضافية
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-bold text-sm"
                    placeholder="أين صرفت هذا المبلغ؟"
                  />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-3xl">
              <button
                type="submit"
                form="add-expense-form"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 active:scale-95 text-sm uppercase tracking-widest"
              >
                <Wallet size={18} />
                حفظ العملية المالية
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;
