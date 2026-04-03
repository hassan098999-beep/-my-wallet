import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { PaymentMethod, Mood, Expense } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, CreditCard, Banknote, Building2, X, TriangleAlert, CircleAlert, Check, ChevronDown, ChevronUp, ArrowDownCircle, ArrowUpCircle, Smile, Meh, Frown, Heart, AlertCircle, Zap, Sliders, AlignLeft, Layers } from 'lucide-react';
import { getBudgetRange, getBudgetMonth, formatCurrency, cn } from '../utils';
import { parseISO } from 'date-fns';
import { DynamicIcon } from './DynamicIcon';
import NumericKeypad from './NumericKeypad';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpenseData?: Expense;
  initialGoalId?: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, editExpenseData, initialGoalId }) => {
  const { categories, accounts, goals, expenses, income, addExpense, addIncome, updateExpense, updateIncome, transferAccount, currency, budget, firstDayOfMonth } = useAppContext();

  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [source, setSource] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(c => c.id === categoryId);

  const incomeSources = useMemo(() => {
    const sources = new Set(income.map(i => i.source));
    return Array.from(sources).filter(Boolean);
  }, [income]);

  // Real-time 50/30/20 Alert Logic
  const alertInfo = useMemo(() => {
    if (type !== 'expense' || !selectedCategory || !selectedCategory.type || !amount || isNaN(Number(amount))) return null;
    
    const expDate = parseISO(date);
    const currentMonth = getBudgetMonth(expDate, firstDayOfMonth);
    const { start: monthStart, end: monthEnd } = getBudgetRange(currentMonth, firstDayOfMonth);

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

    let budgetAlert = null;
    if (budget && budget.amount > 0) {
      const currentMonth = getBudgetMonth(expDate, firstDayOfMonth);
      const totalMonthlyExpense = expenses
        .filter(e => {
          const d = parseISO(e.date);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      const newTotalMonthly = totalMonthlyExpense + Number(amount);
      const monthlyPercent = (newTotalMonthly / budget.amount) * 100;

      if (newTotalMonthly > budget.amount) {
        budgetAlert = {
          type: 'exceeded',
          message: `هذا المصروف سيجعلك تتجاوز ميزانيتك الشهرية الإجمالية!`,
          amount: formatCurrency(newTotalMonthly - budget.amount, currency)
        };
      } else if (monthlyPercent >= 80) {
        budgetAlert = {
          type: 'near',
          message: `ستصل إلى ${Math.round(monthlyPercent)}% من ميزانيتك الشهرية الإجمالية.`,
          remaining: formatCurrency(budget.amount - newTotalMonthly, currency)
        };
      }
    }

    if (newPercentage > limit) {
      const typeLabel = selectedCategory.type === 'need' ? 'الاحتياجات' : selectedCategory.type === 'want' ? 'الرغبات' : 'الادخار';
      return {
        typeLabel,
        limit,
        newPercentage: Math.round(newPercentage),
        exceededBy: formatCurrency(newTotal - (monthlyIncome * (limit / 100)), currency),
        budgetAlert
      };
    }

    return budgetAlert ? { budgetAlert } : null;
  }, [type, amount, selectedCategory, date, expenses, income, categories, currency, budget]);

  useEffect(() => {
    if (isOpen) {
      if (editExpenseData) {
        setType('expense');
        setAmount(editExpenseData.amount.toString());
        setCategoryId(editExpenseData.categoryId);
        setSubcategoryId(editExpenseData.subcategoryId || '');
        setAccountId(editExpenseData.accountId || '');
        setGoalId(editExpenseData.goalId || '');
        setDate(editExpenseData.date);
        setNote(editExpenseData.note || '');
        setPaymentMethod(editExpenseData.paymentMethod || 'cash');
        setShowAdvanced(true);
      } else {
        setType('expense');
        setAmount('');
        setCategoryId(categories[0]?.id || '');
        setSubcategoryId('');
        setAccountId(accounts[0]?.id || '');
        setGoalId(initialGoalId || '');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
        setSource('');
        setPaymentMethod('cash');
        setShowAdvanced(false);
      }
      
      // Focus amount input after a short delay to allow animation to start
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, categories, accounts, editExpenseData]);

  useEffect(() => {
    setSubcategoryId('');
  }, [categoryId]);

  const handleKeyPress = (val: string) => {
    setPulseKey(prev => prev + 1);
    if (val === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev === '' ? '0.' : prev + '.');
      }
    } else if (val.startsWith('+')) {
      const addVal = Number(val.replace('+', ''));
      setAmount(prev => (Number(prev || 0) + addVal).toString());
    } else {
      setAmount(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setPulseKey(prev => prev + 1);
    setAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPulseKey(prev => prev + 1);
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }
    
    setLoading(true);
    try {
      if (type === 'transfer') {
        if (!accountId) {
          toast.error('الرجاء اختيار الحساب المحول منه');
          setLoading(false);
          return;
        }
        if (!toAccountId) {
          toast.error('الرجاء اختيار الحساب المحول إليه');
          setLoading(false);
          return;
        }
        if (accountId === toAccountId) {
          toast.error('لا يمكن التحويل لنفس الحساب');
          setLoading(false);
          return;
        }
        
        const fromAcc = accounts.find(a => a.id === accountId);
        if (fromAcc && fromAcc.balance < Number(amount)) {
          toast.error('رصيد الحساب غير كافٍ');
          setLoading(false);
          return;
        }

        await transferAccount(accountId, toAccountId, Number(amount), date, note);
        toast.success('تم التحويل بنجاح');
      } else if (type === 'expense') {
        if (!accountId) {
          toast.error('الرجاء اختيار الحساب');
          setLoading(false);
          return;
        }
        if (!categoryId) {
          toast.error('الرجاء اختيار الفئة');
          setLoading(false);
          return;
        }

        const expenseData = {
          amount: Number(amount),
          categoryId,
          subcategoryId: subcategoryId || undefined,
          accountId,
          goalId: goalId || undefined,
          date,
          note,
          paymentMethod,
        };

        if (editExpenseData) {
          await updateExpense(editExpenseData.id, expenseData);
          toast.success('تم تحديث المصروف بنجاح');
        } else {
          await addExpense(expenseData);
          toast.success('تمت إضافة المصروف بنجاح');
        }
      } else {
        if (!source.trim()) {
          toast.error('الرجاء إدخال مصدر الدخل');
          setLoading(false);
          return;
        }
        
        const incomeData = {
          source,
          amount: Number(amount),
          accountId: accountId || undefined,
          goalId: goalId || undefined,
          date,
        };

        if (editExpenseData) {
          await updateIncome(editExpenseData.id, incomeData);
          toast.success('تم تحديث الدخل بنجاح');
        } else {
          await addIncome(incomeData);
          toast.success('تمت إضافة الدخل بنجاح');
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140]"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '100%', scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300, 
              mass: 0.8,
              opacity: { duration: 0.2 }
            }}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[420px] bg-white dark:bg-slate-900 rounded-t-[2rem] md:rounded-[2rem] z-[150] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-800/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    type === 'expense' 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  مصروف
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    type === 'income' 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  دخل
                </button>
                <button
                  type="button"
                  onClick={() => setType('transfer')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    type === 'transfer' 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  تحويل
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              
              {/* Amount Display */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Banknote size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">المبلغ</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-400">{currency}</span>
                  <span className={cn(
                    "text-6xl font-black tracking-tighter dir-ltr",
                    type === 'expense' ? "text-slate-900 dark:text-white" : "text-emerald-500"
                  )}>
                    {amount || '0'}
                  </span>
                </div>
              </div>

              {/* Keypad */}
              <div className="w-full max-w-[280px] mx-auto">
                <NumericKeypad 
                  onPress={handleKeyPress}
                  onDelete={handleDelete}
                  onClear={handleClear}
                  type={type}
                  hideQuickAdd={true}
                  variant="default"
                />
              </div>

              <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

              {/* Categories (Expense Only) */}
              {type === 'expense' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers size={16} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">الفئة</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div 
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-300",
                            categoryId === cat.id 
                              ? "shadow-lg scale-110 ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-opacity-20" 
                              : "opacity-60 hover:opacity-100 hover:scale-105"
                          )}
                          style={{ 
                            backgroundColor: cat.color,
                            '--tw-ring-color': cat.color
                          } as any}
                        >
                          <DynamicIcon name={cat.icon || 'Circle'} size={20} />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold truncate w-full text-center transition-colors",
                          categoryId === cat.id ? "text-slate-900 dark:text-white" : "text-slate-500"
                        )}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Subcategories */}
                  <AnimatePresence>
                    {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 overflow-x-auto pb-2 pt-2 no-scrollbar"
                      >
                        {selectedCategory.subcategories.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setSubcategoryId(sub)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border",
                              subcategoryId === sub
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md"
                                : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                            )}
                          >
                            {sub}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Income Source (Income Only) */}
              {type === 'income' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مصدر الدخل</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="مثال: راتب، عمل حر..."
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              )}

              {/* Accounts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">
                    {type === 'transfer' ? 'من حساب' : 'الحساب'}
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className={cn(
                        "snap-start shrink-0 w-28 p-3 rounded-2xl border-2 transition-all flex flex-col items-start gap-2",
                        accountId === acc.id 
                          ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-md" 
                          : "bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: acc.color }}
                      >
                        <DynamicIcon name={acc.icon || 'Wallet'} size={16} />
                      </div>
                      <div className="flex flex-col items-start w-full">
                        <span className={cn(
                          "text-[10px] font-bold truncate w-full text-right",
                          accountId === acc.id ? "text-slate-900 dark:text-white" : "text-slate-500"
                        )}>
                          {acc.name}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 mt-0.5">
                          {formatCurrency(acc.balance, currency)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {type === 'transfer' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 size={16} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">إلى حساب</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setToAccountId(acc.id)}
                        className={cn(
                          "snap-start shrink-0 w-28 p-3 rounded-2xl border-2 transition-all flex flex-col items-start gap-2",
                          toAccountId === acc.id 
                            ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-md" 
                            : "bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-70 hover:opacity-100"
                        )}
                      >
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: acc.color }}
                        >
                          <DynamicIcon name={acc.icon || 'Wallet'} size={16} />
                        </div>
                        <div className="flex flex-col items-start w-full">
                          <span className={cn(
                            "text-[10px] font-bold truncate w-full text-right",
                            toAccountId === acc.id ? "text-slate-900 dark:text-white" : "text-slate-500"
                          )}>
                            {acc.name}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 mt-0.5">
                            {formatCurrency(acc.balance, currency)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Savings Goals */}
              {goals.length > 0 && type !== 'transfer' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ربط بهدف ادخار</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                    <button
                      type="button"
                      onClick={() => setGoalId('')}
                      className={cn(
                        "snap-start shrink-0 w-28 p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2",
                        goalId === '' 
                          ? "bg-white dark:bg-slate-800 border-slate-900 dark:border-white shadow-md" 
                          : "bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500">
                        <X size={16} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold truncate w-full text-center",
                        goalId === '' ? "text-slate-900 dark:text-white" : "text-slate-500"
                      )}>
                        بدون هدف
                      </span>
                    </button>
                    {goals.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setGoalId(goal.id)}
                        className={cn(
                          "snap-start shrink-0 w-28 p-3 rounded-2xl border-2 transition-all flex flex-col items-start gap-2",
                          goalId === goal.id 
                            ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-md" 
                            : "bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-70 hover:opacity-100"
                        )}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm">
                          <Zap size={16} />
                        </div>
                        <div className="flex flex-col items-start w-full">
                          <span className={cn(
                            "text-[10px] font-bold truncate w-full text-right",
                            goalId === goal.id ? "text-slate-900 dark:text-white" : "text-slate-500"
                          )}>
                            {goal.name}
                          </span>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Note */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-500 shrink-0">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none flex-1"
                  />
                </div>
                <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-500 shrink-0">
                    <AlignLeft size={16} />
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ملاحظات إضافية..."
                    className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none flex-1 resize-none h-20 pt-1.5"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !amount || parseFloat(amount) === 0}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-base shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3",
                  type === 'expense' 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
                    : "bg-emerald-600 text-white"
                )}
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={20} />
                    <span>تأكيد {type === 'expense' ? 'المصروف' : type === 'income' ? 'الدخل' : 'التحويل'}</span>
                  </>
                )}
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;
