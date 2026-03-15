import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { PaymentMethod } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, CreditCard, Banknote, Landmark, X, AlertTriangle, Check, ChevronDown, ChevronUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatCurrency, cn } from '../utils';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { DynamicIcon } from './DynamicIcon';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { categories, accounts, goals, expenses, income, addExpense, addIncome, currency } = useAppContext();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [source, setSource] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedCategory = categories.find(c => c.id === categoryId);

  // Real-time 50/30/20 Alert Logic
  const alertInfo = useMemo(() => {
    if (type !== 'expense' || !selectedCategory || !selectedCategory.type || !amount || isNaN(Number(amount))) return null;
    
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
  }, [type, amount, selectedCategory, date, expenses, income, categories, currency]);

  useEffect(() => {
    if (isOpen) {
      setType('expense');
      setAmount('');
      setCategoryId(categories[0]?.id || '');
      setSubcategoryId('');
      setAccountId(accounts[0]?.id || '');
      setGoalId('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setSource('');
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
    
    if (type === 'expense') {
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
      toast.success('تمت إضافة المصروف بنجاح');
    } else {
      if (!source.trim()) {
        toast.error('الرجاء إدخال مصدر الدخل');
        return;
      }
      addIncome({
        source,
        amount: Number(amount),
        accountId: accountId || undefined,
        date,
      });
      toast.success('تمت إضافة الدخل بنجاح');
    }

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
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">إضافة عملية جديدة</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-6">
              {/* Type Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                    type === 'expense' 
                      ? "bg-white dark:bg-slate-700 text-rose-500 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <ArrowUpCircle size={18} />
                  مصروف
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                    type === 'income' 
                      ? "bg-white dark:bg-slate-700 text-emerald-500 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <ArrowDownCircle size={18} />
                  دخل
                </button>
              </div>

              <form id="add-expense-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Amount Section - Prominent Card */}
                <div className={cn(
                  "rounded-[2rem] p-6 flex flex-col items-center justify-center relative border shadow-inner transition-colors",
                  type === 'expense' 
                    ? "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/50" 
                    : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50"
                )}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={cn(
                      "text-2xl font-black",
                      type === 'expense' ? "text-rose-400" : "text-emerald-400"
                    )}>{currency}</span>
                    <div className="relative inline-block">
                      <input
                        type="number"
                        step="0.001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={cn(
                          "bg-transparent text-center font-mono font-black text-5xl md:text-6xl tracking-tighter focus:ring-0 border-none w-full max-w-[240px]",
                          type === 'expense' 
                            ? "text-rose-600 dark:text-rose-400 placeholder:text-rose-200 dark:placeholder:text-rose-900/50" 
                            : "text-emerald-600 dark:text-emerald-400 placeholder:text-emerald-200 dark:placeholder:text-emerald-900/50"
                        )}
                        placeholder="0.000"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                {/* Source for Income */}
                {type === 'income' && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                      مصدر الدخل
                    </label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                      placeholder="مثال: راتب، عمل حر، مكافأة..."
                      required={type === 'income'}
                    />
                  </div>
                )}

                {/* Account Selection - Chips */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                    {type === 'expense' ? 'الحساب' : 'إيداع في الحساب (اختياري)'}
                  </label>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar">
                    {type === 'income' && (
                      <button
                        type="button"
                        onClick={() => setAccountId('')}
                        className={cn(
                          "snap-start shrink-0 px-4 py-3 rounded-2xl flex items-center gap-3 transition-all border-2",
                          !accountId
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10"
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-200 dark:hover:border-emerald-800"
                        )}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 shadow-sm">
                          <Landmark size={16} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black">بدون حساب</p>
                        </div>
                      </button>
                    )}
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccountId(acc.id)}
                        className={cn(
                          "snap-start shrink-0 px-4 py-3 rounded-2xl flex items-center gap-3 transition-all border-2",
                          accountId === acc.id
                            ? (type === 'expense' ? "bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-600 dark:text-rose-400 shadow-md shadow-rose-500/10" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10")
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
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

                {/* Category Grid (Only for Expense) */}
                {type === 'expense' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-right">
                        الفئة
                      </label>
                      {categoryId && (
                        <button 
                          type="button"
                          onClick={() => { setCategoryId(''); setSubcategoryId(''); }}
                          className="text-[10px] font-black text-rose-500 hover:text-rose-600 transition-colors bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg"
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
                                ? "ring-4 ring-rose-500/30 scale-110 z-10 shadow-rose-500/20" 
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
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-md border-2 border-rose-500"
                                >
                                  <Check size={12} className="text-rose-500" />
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
                              className="absolute -inset-1.5 bg-rose-500/5 dark:bg-rose-500/10 rounded-[2rem] -z-10"
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
                                    ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20 scale-105"
                                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-rose-500/30 hover:text-rose-500"
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
                )}

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
                        {/* Payment Method (Only for Expense) */}
                        {type === 'expense' && (
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
                                      ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm" 
                                      : "text-slate-400 hover:text-slate-600"
                                  )}
                                >
                                  <method.icon size={14} />
                                  <span className="text-[9px] font-black">{method.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Date Picker */}
                        <div className={cn("space-y-2", type === 'income' ? "col-span-2" : "")}>
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                            التاريخ
                          </label>
                          <div className="relative h-[52px]">
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className={cn(
                                "w-full h-full px-3 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-black text-xs outline-none transition-all",
                                type === 'expense' ? "focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500" : "focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                              )}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Goal Selection (Only for Expense) */}
                      {type === 'expense' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                            الهدف (اختياري)
                          </label>
                          <select
                            value={goalId}
                            onChange={(e) => setGoalId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-black text-xs focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all appearance-none"
                          >
                            <option value="">بدون ربط</option>
                            {goals.map((goal) => (
                              <option key={goal.id} value={goal.id}>{goal.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Note Section (Only for Expense) */}
                      {type === 'expense' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">
                            ملاحظة (اختياري)
                          </label>
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-xs focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none h-20"
                            placeholder="تفاصيل إضافية..."
                          />
                        </div>
                      )}
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
                className={cn(
                  "w-full text-white font-black py-3.5 md:py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm md:text-base uppercase tracking-widest",
                  type === 'expense' 
                    ? "bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-500/30" 
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/30"
                )}
              >
                <Plus size={20} className="md:size-6" />
                {type === 'expense' ? 'إضافة المصروف' : 'إضافة الدخل'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;
