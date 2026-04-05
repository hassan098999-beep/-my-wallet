import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { PaymentMethod, Expense } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronLeft, Calendar, AlignLeft, Layers, Building2 } from 'lucide-react';
import { formatCurrency, cn } from '../utils';
import { DynamicIcon } from './DynamicIcon';
import CalculatorKeypad from './CalculatorKeypad';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpenseData?: Expense;
  initialGoalId?: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, editExpenseData, initialGoalId }) => {
  const { categories, accounts, expenses, income, addExpense, addIncome, updateExpense, updateIncome, transferAccount, currency } = useAppContext();

  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [expression, setExpression] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [source, setSource] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);

  // Sub-modals state
  const [activeView, setActiveView] = useState<'main' | 'category' | 'account' | 'toAccount' | 'details'>('main');

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedToAccount = accounts.find(a => a.id === toAccountId);

  useEffect(() => {
    if (isOpen) {
      if (editExpenseData) {
        setType('expense');
        setExpression(editExpenseData.amount.toString());
        setCategoryId(editExpenseData.categoryId);
        setSubcategoryId(editExpenseData.subcategoryId || '');
        setAccountId(editExpenseData.accountId || '');
        setDate(editExpenseData.date);
        setNote(editExpenseData.note || '');
        setPaymentMethod(editExpenseData.paymentMethod || 'cash');
      } else {
        setType('expense');
        setExpression('0');
        setCategoryId(categories[0]?.id || '');
        setSubcategoryId('');
        setAccountId(accounts[0]?.id || '');
        setToAccountId(accounts.length > 1 ? accounts[1].id : '');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
        setSource('');
        setPaymentMethod('cash');
      }
      setActiveView('main');
    }
  }, [isOpen, categories, accounts, editExpenseData]);

  const evaluateExpression = (expr: string): number => {
    try {
      let cleanExpr = expr.replace(/[^0-9+\-*/.]/g, '');
      // Remove trailing operators
      cleanExpr = cleanExpr.replace(/[+\-*/.]+$/, '');
      if (!cleanExpr) return 0;
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${cleanExpr}`)();
      return isNaN(result) || !isFinite(result) ? 0 : result;
    } catch {
      return 0;
    }
  };

  const handleKeyPress = (key: string) => {
    setExpression(prev => {
      if (prev === '0' && !['+', '-', '*', '/'].includes(key) && key !== '.') {
        return key;
      }
      // Prevent multiple operators
      const lastChar = prev.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar) && ['+', '-', '*', '/'].includes(key)) {
        return prev.slice(0, -1) + key;
      }
      return prev + key;
    });
  };

  const handleDelete = () => {
    setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleCalculate = () => {
    const result = evaluateExpression(expression);
    setExpression(result.toString());
  };

  const handleSubmit = async () => {
    const finalAmount = evaluateExpression(expression);
    
    if (finalAmount <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    
    setLoading(true);
    try {
      if (type === 'transfer') {
        if (!accountId || !toAccountId) {
          toast.error('الرجاء اختيار الحسابات');
          setLoading(false);
          return;
        }
        if (accountId === toAccountId) {
          toast.error('لا يمكن التحويل لنفس الحساب');
          setLoading(false);
          return;
        }
        
        const fromAcc = accounts.find(a => a.id === accountId);
        if (fromAcc && fromAcc.balance < finalAmount) {
          toast.error('رصيد الحساب غير كافٍ');
          setLoading(false);
          return;
        }

        await transferAccount(accountId, toAccountId, finalAmount, date, note);
        toast.success('تم التحويل بنجاح');
      } else if (type === 'expense') {
        if (!accountId || !categoryId) {
          toast.error('الرجاء استكمال البيانات');
          setLoading(false);
          return;
        }

        const expenseData = {
          amount: finalAmount,
          categoryId,
          subcategoryId: subcategoryId || undefined,
          accountId,
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
        if (!source.trim() && !categoryId) {
          toast.error('الرجاء اختيار الفئة أو المصدر');
          setLoading(false);
          return;
        }
        
        const incomeData = {
          source: source || (selectedCategory?.name ?? 'دخل'),
          amount: finalAmount,
          accountId: accountId || undefined,
          date,
          note,
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

  const bgColor = type === 'expense' ? 'bg-rose-600' : type === 'income' ? 'bg-emerald-600' : 'bg-indigo-600';
  const activeTabColor = type === 'expense' ? 'bg-rose-700' : type === 'income' ? 'bg-emerald-700' : 'bg-indigo-700';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[150] bg-white dark:bg-slate-900 flex flex-col overflow-hidden"
        >
          {activeView === 'main' && (
            <div className="flex flex-col h-full">
              {/* Top Section */}
              <div className={cn("flex flex-col text-white transition-colors duration-300 flex-1 min-h-[45%]", bgColor)}>
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={28} strokeWidth={3} />}
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex w-full px-4 mb-6">
                  <button
                    onClick={() => setType('income')}
                    className={cn("flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors rounded-r-lg", type === 'income' ? activeTabColor : "bg-black/10 hover:bg-black/20")}
                  >
                    دخل
                  </button>
                  <button
                    onClick={() => setType('expense')}
                    className={cn("flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors", type === 'expense' ? activeTabColor : "bg-black/10 hover:bg-black/20")}
                  >
                    مصروف
                  </button>
                  <button
                    onClick={() => setType('transfer')}
                    className={cn("flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors rounded-l-lg", type === 'transfer' ? activeTabColor : "bg-black/10 hover:bg-black/20")}
                  >
                    تحويل
                  </button>
                </div>

                {/* Amount Display */}
                <div className="flex-1 flex items-center justify-center px-6">
                  <div className="flex items-baseline gap-2 w-full justify-center overflow-hidden">
                    <span className="text-4xl font-light opacity-80 shrink-0">
                      {type === 'expense' ? '-' : type === 'income' ? '+' : ''}
                    </span>
                    <span className="text-6xl sm:text-8xl font-light tracking-tighter truncate dir-ltr">
                      {expression}
                    </span>
                    <span className="text-2xl font-light opacity-80 shrink-0">{currency}</span>
                  </div>
                </div>

                {/* Selectors */}
                <div className="grid grid-cols-2 gap-px bg-black/10 mt-auto">
                  <button 
                    onClick={() => setActiveView('account')}
                    className="flex flex-col items-center justify-center py-4 px-2 hover:bg-black/10 transition-colors"
                  >
                    <span className="text-[10px] uppercase tracking-widest opacity-70 mb-1">الحساب</span>
                    <span className="text-sm font-bold truncate w-full text-center">{selectedAccount?.name || 'اختر الحساب'}</span>
                  </button>
                  
                  {type === 'transfer' ? (
                    <button 
                      onClick={() => setActiveView('toAccount')}
                      className="flex flex-col items-center justify-center py-4 px-2 hover:bg-black/10 transition-colors"
                    >
                      <span className="text-[10px] uppercase tracking-widest opacity-70 mb-1">إلى حساب</span>
                      <span className="text-sm font-bold truncate w-full text-center">{selectedToAccount?.name || 'اختر الحساب'}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveView('category')}
                      className="flex flex-col items-center justify-center py-4 px-2 hover:bg-black/10 transition-colors"
                    >
                      <span className="text-[10px] uppercase tracking-widest opacity-70 mb-1">الفئة</span>
                      <span className="text-sm font-bold truncate w-full text-center">{selectedCategory?.name || (type === 'income' && source ? source : 'اختر الفئة')}</span>
                    </button>
                  )}
                </div>
                
                {/* Details Bar */}
                <button 
                  onClick={() => setActiveView('details')}
                  className="w-full py-3 bg-black/20 hover:bg-black/30 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Calendar size={14} />
                  <span>التاريخ والملاحظات</span>
                </button>
              </div>

              {/* Keypad Section */}
              <div className="flex-1 min-h-[55%] bg-white dark:bg-slate-900">
                <CalculatorKeypad 
                  onPress={handleKeyPress}
                  onDelete={handleDelete}
                  onCalculate={handleCalculate}
                />
              </div>
            </div>
          )}

          {/* Category Selection Modal */}
          {activeView === 'category' && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.2 }}
              className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col"
            >
              <div className={cn("flex items-center p-4 text-white shrink-0", bgColor)}>
                <button onClick={() => setActiveView('main')} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-lg font-bold">اختر الفئة</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {type === 'income' && (
                  <div className="mb-6 space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">مصدر الدخل (نص حر)</label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="مثال: راتب، عمل حر..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold outline-none focus:border-emerald-500"
                    />
                    <button 
                      onClick={() => setActiveView('main')}
                      className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold"
                    >
                      تأكيد المصدر
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setCategoryId(cat.id); setSubcategoryId(''); setActiveView('main'); }}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div 
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all",
                          categoryId === cat.id ? "ring-4 ring-offset-2 ring-opacity-50 scale-110" : "opacity-80 group-hover:opacity-100"
                        )}
                        style={{ backgroundColor: cat.color, '--tw-ring-color': cat.color } as any}
                      >
                        <DynamicIcon name={cat.icon || 'Circle'} size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-center text-slate-700 dark:text-slate-300">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Account Selection Modal */}
          {(activeView === 'account' || activeView === 'toAccount') && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.2 }}
              className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col"
            >
              <div className={cn("flex items-center p-4 text-white shrink-0", bgColor)}>
                <button onClick={() => setActiveView('main')} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-lg font-bold">{activeView === 'account' ? 'اختر الحساب' : 'إلى حساب'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => { 
                      if (activeView === 'account') setAccountId(acc.id);
                      else setToAccountId(acc.id);
                      setActiveView('main'); 
                    }}
                    className="w-full flex items-center p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white ml-4" style={{ backgroundColor: acc.color }}>
                      <DynamicIcon name={acc.icon || 'Wallet'} size={24} />
                    </div>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-bold text-slate-900 dark:text-white">{acc.name}</span>
                      <span className="text-xs text-slate-500">{formatCurrency(acc.balance, currency)}</span>
                    </div>
                    {(activeView === 'account' ? accountId : toAccountId) === acc.id && (
                      <Check className="text-indigo-500" size={24} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Details Modal (Date & Note) */}
          {activeView === 'details' && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.2 }}
              className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col"
            >
              <div className={cn("flex items-center p-4 text-white shrink-0", bgColor)}>
                <button onClick={() => setActiveView('main')} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-lg font-bold">التاريخ والملاحظات</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={16} /> التاريخ
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <AlignLeft size={16} /> ملاحظات
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="أضف ملاحظاتك هنا..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold outline-none focus:border-indigo-500 resize-none h-32"
                  />
                </div>
                <button 
                  onClick={() => setActiveView('main')}
                  className={cn("w-full py-4 rounded-xl font-bold text-white shadow-lg", bgColor)}
                >
                  حفظ والعودة
                </button>
              </div>
            </motion.div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;
