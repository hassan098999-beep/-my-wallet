import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { PaymentMethod } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, CreditCard, Banknote, Landmark, X, AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, cn } from '../utils';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { DynamicIcon } from './DynamicIcon';

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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      setShowAdvanced(false);
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
    if (!categoryId) {
      toast.error('الرجاء اختيار الفئة');
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
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[500px] bg-white dark:bg-slate-900 rounded-t-[2.5rem] md:rounded-[2.5rem] z-[70] shadow-2xl max-h-[95vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">إضافة مصروف جديد</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-6">
              <form id="add-expense-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Amount Section - Prominent Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 flex flex-col items-center justify-center relative border border-slate-100 dark:border-slate-800 shadow-inner">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-slate-400">{currency}</span>
                    <div className="relative inline-block">
                      <input
                        type="number"
                        step="0.001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-transparent text-slate-900 dark:text-white text-center font-mono font-black text-5xl md:text-6xl tracking-tighter placeholder:text-slate-200 dark:placeholder:text-slate-700 focus:ring-0 border-none w-full max-w-[240px]"
                        placeholder="0.000"
                        required
                        autoFocus
                      />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary-500 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Account Selection - Chips */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                    الحساب
                  </label>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccountId(acc.id)}
                        className={cn(
                          "snap-start shrink-0 px-4 py-3 rounded-2xl flex items-center gap-3 transition-all border-2",
                          accountId === acc.id
                            ? "bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400 shadow-md shadow-primary-500/10"
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-200 dark:hover:border-primary-800"
                        )}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: acc.color }}>
                          <DynamicIcon name={acc.icon || 'Wallet'} size={16} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black">{acc.name}</p>
                          <p className="text-[10px] font-bold opacity-70">{formatCurrency(acc.balance, currency)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-right">
                      الفئة
                    </label>
                    {categoryId && (
                      <button 
                        type="button"
                        onClick={() => { setCategoryId(''); setSubcategoryId(''); }}
                        className="text-[10px] font-black text-primary-500 hover:text-primary-600 transition-colors bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-lg"
                      >
                        إعادة تعيين
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className="flex flex-col items-center gap-2 group relative"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center text-white transition-all relative shadow-md",
                            categoryId === cat.id 
                              ? "ring-4 ring-primary-500/30 scale-110 z-10 shadow-primary-500/20" 
                              : "opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"
                          )}
                          style={{ backgroundColor: cat.color }}
                        >
                          <DynamicIcon name={cat.icon || 'Circle'} size={24} className="md:size-7" />
                          
                          <AnimatePresence>
                            {categoryId === cat.id && (
                              <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-md border-2 border-primary-500"
                              >
                                <Check size={12} className="text-primary-500" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        
                        <span className={cn(
                          "text-[9px] md:text-[10px] font-black transition-all tracking-tight text-center",
                          categoryId === cat.id 
                            ? "text-slate-900 dark:text-white scale-110" 
                            : "text-slate-400 group-hover:text-slate-600"
                        )}>
                          {cat.name}
                        </span>

                        {categoryId === cat.id && (
                          <motion.div 
                            layoutId="active-cat-bg"
                            className="absolute -inset-1.5 bg-primary-500/5 dark:bg-primary-500/10 rounded-[2rem] -z-10"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Subcategory Selection */}
                  <AnimatePresence mode="wait">
                    {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            الفئات الفرعية لـ {selectedCategory.name}
                          </label>
                          <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 justify-center">
                          {selectedCategory.subcategories.map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => setSubcategoryId(sub)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 flex items-center gap-1.5",
                                subcategoryId === sub
                                  ? "bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/20 scale-105"
                                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary-500/30 hover:text-primary-500"
                              )}
                            >
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                subcategoryId === sub ? "bg-white" : "bg-slate-300 dark:bg-slate-600"
                              )} />
                              {sub}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {alertInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-3 mt-4">
                          <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black text-amber-700 dark:text-amber-500">تنبيه الميزانية</p>
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
                              هذا المصروف سيجعل قسم <strong>{alertInfo.typeLabel}</strong> يصل إلى <strong>{alertInfo.newPercentage}%</strong> من دخلك.
                              لقد تجاوزت الحد بمقدار {alertInfo.exceededBy}.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
                >
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showAdvanced ? 'إخفاء التفاصيل الإضافية' : 'إضافة تفاصيل أخرى (التاريخ، ملاحظات...)'}
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 overflow-hidden pt-2"
                    >
                      {/* Payment Method & Date Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Payment Method */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                            طريقة الدفع
                          </label>
                          <div className="flex p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            {[
                              { id: 'cash', label: 'نقد', icon: Banknote },
                              { id: 'card', label: 'بطاقة', icon: CreditCard },
                              { id: 'transfer', label: 'تحويل', icon: Landmark }
                            ].map(method => (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                className={cn(
                                  "flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all",
                                  paymentMethod === method.id 
                                    ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                <method.icon size={14} />
                                <span className="text-[9px] font-black">{method.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                            التاريخ
                          </label>
                          <div className="relative h-[52px]">
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full h-full px-3 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-black text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Goal Selection */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                          الهدف (اختياري)
                        </label>
                        <select
                          value={goalId}
                          onChange={(e) => setGoalId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-black text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none"
                        >
                          <option value="">بدون ربط</option>
                          {goals.map((goal) => (
                            <option key={goal.id} value={goal.id}>{goal.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Note Section */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                          ملاحظة (اختياري)
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none h-20"
                          placeholder="تفاصيل إضافية..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Footer Action */}
            <div className="p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                form="add-expense-form"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-3.5 md:py-4 rounded-2xl transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 active:scale-95 text-sm md:text-base uppercase tracking-widest"
              >
                <Plus size={20} className="md:size-6" />
                إضافة العملية
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;
