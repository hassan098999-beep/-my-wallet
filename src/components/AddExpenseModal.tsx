import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { PaymentMethod, Expense } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronLeft, Calendar, Layers, Building2, AlignLeft, Search, Sparkles, Zap, Coins, Plus } from 'lucide-react';
import { formatCurrency, cn, hapticFeedback, formatTunisianAmount } from '../utils';
import { DynamicIcon } from './DynamicIcon';
import CalculatorKeypad from './CalculatorKeypad';
import { ColorPicker } from './ColorPicker';
import { IconSelect } from './IconSelect';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpenseData?: Expense;
  initialGoalId?: string;
  initialMode?: 'quick' | 'calculator';
}

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

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, editExpenseData, initialGoalId, initialMode }) => {
  const { categories, accounts, expenses, income, goals, addExpense, addIncome, updateExpense, updateIncome, transferAccount, addCategory, currency, budget } = useAppContext();

  const [inputMode, setInputMode] = useState<'quick' | 'calculator'>('quick');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [expression, setExpression] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [goalId, setGoalId] = useState('');

  // States for custom category creation
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#ef4444');
  const [newCatIcon, setNewCatIcon] = useState('Circle');
  const [newCatType, setNewCatType] = useState<'need' | 'want' | 'saving'>('need');

  // Sub-modals state
  const [activeView, setActiveView] = useState<'main' | 'category' | 'account' | 'toAccount' | 'details'>('main');

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedToAccount = accounts.find(a => a.id === toAccountId);

  // Find last expense to duplicate
  const lastExpense = useMemo(() => {
    if (!expenses || expenses.length === 0) return null;
    return [...expenses].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return timeB - timeA;
    })[0];
  }, [expenses]);

  const lastExpenseCategory = useMemo(() => {
    if (!lastExpense) return null;
    return categories.find(c => c.id === lastExpense.categoryId);
  }, [lastExpense, categories]);

  const favoriteCategories = useMemo(() => {
    if (type !== 'expense' || !expenses || expenses.length === 0) return [];
    
    // Filter expenses in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= thirtyDaysAgo;
    });

    // If we don't have enough recent expenses, find from all
    const targetExpenses = recentExpenses.length > 0 ? recentExpenses : expenses;

    // Count occurrences of each categoryId
    const counts: Record<string, number> = {};
    targetExpenses.forEach(exp => {
      if (exp.categoryId) {
        counts[exp.categoryId] = (counts[exp.categoryId] || 0) + 1;
      }
    });

    // Sort categories by usage count
    const sortedCategoryIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    
    // Return top 4 unique category details
    return sortedCategoryIds
      .map(id => categories.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .slice(0, 4);
  }, [expenses, categories, type]);

  const currentCategoryBudgetInsight = useMemo(() => {
    if (type !== 'expense' || !categoryId) return null;
    const limit = budget?.categoryBudgets?.[categoryId] || 0;
    if (limit <= 0) return null;

    // Filter current month expenses for this category
    const currentMonthStr = new Date().toISOString().substring(0, 7); // yyyy-MM
    const spentThisMonth = expenses
      .filter(e => e.categoryId === categoryId && e.date && e.date.startsWith(currentMonthStr))
      .reduce((sum, e) => sum + e.amount, 0);

    const enteredAmount = evaluateExpression(expression);
    const remainingBefore = limit - spentThisMonth;
    const remainingAfter = remainingBefore - enteredAmount;

    return {
      limit,
      spentThisMonth,
      remainingBefore,
      remainingAfter,
      enteredAmount
    };
  }, [type, categoryId, expression, expenses, budget]);

  useEffect(() => {
    if (isOpen) {
      if (editExpenseData) {
        setInputMode('calculator');
      } else if (initialMode) {
        setInputMode(initialMode);
      } else {
        const savedMode = localStorage.getItem('masarifi_input_mode') as 'quick' | 'calculator' | null;
        setInputMode(savedMode || 'quick');
      }

      if (editExpenseData) {
        setType('expense');
        setExpression(editExpenseData.amount.toString());
        setCategoryId(editExpenseData.categoryId);
        setSubcategoryId(editExpenseData.subcategoryId || '');
        setAccountId(editExpenseData.accountId || '');
        setDate(editExpenseData.date);
        setNote(editExpenseData.note || '');
        setPaymentMethod(editExpenseData.paymentMethod || 'cash');
        setGoalId('');
      } else {
        // Load last used settings from localStorage if available
        let savedLastUsed = { accountId: '', paymentMethod: 'cash' };
        try {
          const raw = localStorage.getItem('masarifi_last_used');
          if (raw) savedLastUsed = JSON.parse(raw);
        } catch (e) {
          console.error('Failed to parse last used from localStorage:', e);
        }

        // Check if there is a shared intent parsed
        let sharedAmount = '';
        let sharedNote = '';
        try {
          const rawShared = localStorage.getItem('masarifi_shared_intent');
          if (rawShared) {
            const parsed = JSON.parse(rawShared);
            if (parsed.amount) sharedAmount = parsed.amount.toString();
            if (parsed.note) sharedNote = parsed.note;
            // Clean it so it doesn't run on every subsequent modal toggle
            localStorage.removeItem('masarifi_shared_intent');
          }
        } catch (e) {
          console.error('Failed to load shared intent:', e);
        }

        setType(initialGoalId ? 'income' : 'expense');
        setExpression(sharedAmount || '0');
        // If there is a shared text intent, leave categoryId blank for user selection
        setCategoryId(sharedAmount ? '' : (categories[0]?.id || ''));
        setSubcategoryId('');
        setAccountId(savedLastUsed.accountId || accounts[0]?.id || '');
        setToAccountId(accounts.length > 1 ? accounts[1].id : '');
        setDate(new Date().toISOString().split('T')[0]);
        setSource('');
        setNote(sharedNote);
        setPaymentMethod((savedLastUsed.paymentMethod as PaymentMethod) || 'cash');
        setGoalId(initialGoalId || '');
      }
      setActiveView('main');
    }
  }, [isOpen, categories, accounts, editExpenseData, initialGoalId, initialMode]);

  const [isAutoMatched, setIsAutoMatched] = useState(false);

  // Automatic Category Matching based on Note content
  useEffect(() => {
    if (!note || type !== 'expense') {
      setIsAutoMatched(false);
      return;
    }
    
    const noteLower = note.toLowerCase();
    
    // Find Baby category
    const babyCat = categories.find(c => 
      c.id === '2' || 
      c.name.includes('رضيع') || 
      c.name.includes('طفل') || 
      c.name.includes('أطفال') || 
      c.name.toLowerCase().includes('baby')
    );
    
    // Find Food/Groceries category
    const foodCat = categories.find(c => 
      c.id === '1' || 
      c.name.includes('مأكل') || 
      c.name.includes('مشرب') || 
      c.name.includes('قفة') || 
      c.name.includes('خضار') || 
      c.name.toLowerCase().includes('food') || 
      c.name.toLowerCase().includes('grocery')
    );

    // Find Transport category
    const transportCat = categories.find(c => 
      c.name.includes('نقل') || 
      c.name.includes('سيارة') || 
      c.name.includes('بنزين') || 
      c.name.toLowerCase().includes('trans') || 
      c.name.toLowerCase().includes('car')
    );

    // Find Bills / Commitments category
    const billsCat = categories.find(c => 
      c.name.includes('التزام') || 
      c.name.includes('فاتورة') || 
      c.name.includes('كراء') || 
      c.name.includes('إنترنت') || 
      c.name.toLowerCase().includes('bill') || 
      c.name.toLowerCase().includes('rent')
    );

    // Find Health/Care category (if separate from baby)
    const healthCat = categories.find(c => 
      c.name.includes('صحة') || 
      c.name.includes('دواء') || 
      c.name.includes('طبيب') || 
      c.name.toLowerCase().includes('health') || 
      c.name.toLowerCase().includes('medical')
    );

    // 1. Check for Baby terms
    const babyTerms = ['حفاظ', 'حفاض', 'كوش', 'حليب', 'يحيى', 'رضيع', 'بيبي', 'baby', 'pampers', 'peaudouce', 'libero', 'ابتاميل', 'بريمالاك', 'العاب يحيى', 'لهاية'];
    if (babyTerms.some(term => noteLower.includes(term)) && babyCat) {
      if (categoryId !== babyCat.id) {
        setCategoryId(babyCat.id);
        setSubcategoryId('');
        setIsAutoMatched(true);
      }
      return;
    }

    // 2. Check for Food terms
    const foodTerms = ['لحم', 'دجاج', 'خضار', 'مغازة', 'عشاء', 'غداء', 'قهوة', 'حوت', 'خبز', 'حليب كامل', 'فرينة', 'روز', 'سكر', 'زيت نباتي', 'مقرونة', 'كسكسي', 'تن', 'طماطم', 'دلاع', 'مطبخ', 'مطعم'];
    if (foodTerms.some(term => noteLower.includes(term)) && foodCat) {
      if (categoryId !== foodCat.id) {
        setCategoryId(foodCat.id);
        setSubcategoryId('');
        setIsAutoMatched(true);
      }
      return;
    }

    // 3. Check for Transport terms
    const transportTerms = ['بنزين', 'تاكسي', 'كيران', 'مترو', 'لوام', 'كار', 'مازوت', 'كيوسك', 'شل', 'عجلة', 'تصليح سيارة', 'شهادة فحص', 'عمار لوان'];
    if (transportTerms.some(term => noteLower.includes(term)) && transportCat) {
      if (categoryId !== transportCat.id) {
        setCategoryId(transportCat.id);
        setSubcategoryId('');
        setIsAutoMatched(true);
      }
      return;
    }

    // 4. Check for Bills terms
    const billsTerms = ['كراء', 'فاتورة', 'انترنت', 'اوريدو', 'اتصالات', 'اورنج', 'تيليكوم', 'ماء', 'ضو', 'ستاغ', 'صوناد', 'غاز', 'بلدية', 'اداءات'];
    if (billsTerms.some(term => noteLower.includes(term)) && billsCat) {
      if (categoryId !== billsCat.id) {
        setCategoryId(billsCat.id);
        setSubcategoryId('');
        setIsAutoMatched(true);
      }
      return;
    }

    // 5. Check for Health terms
    const healthTerms = ['صيدلية', 'دواء', 'طبيب', 'عيادة', 'تحليل', 'دوا', 'فيزيتا'];
    if (healthTerms.some(term => noteLower.includes(term)) && healthCat) {
      if (categoryId !== healthCat.id) {
        setCategoryId(healthCat.id);
        setSubcategoryId('');
        setIsAutoMatched(true);
      }
      return;
    }

    setIsAutoMatched(false);
  }, [note, type, categories, categoryId]);

  const handleAmountChange = (val: string) => {
    const formatted = formatTunisianAmount(val);
    setExpression(formatted);
  };

  const handleCreateCustomCategory = async () => {
    if (!newCatName.trim()) return;
    hapticFeedback('success');
    const loadingToast = toast.loading('جاري إنشاء التصنيف المخصص...');
    try {
      const newCat = await addCategory({
        name: newCatName.trim(),
        color: newCatColor,
        icon: newCatIcon,
        type: newCatType,
        subcategories: []
      });
      toast.dismiss(loadingToast);
      toast.success('تم إنشاء التصنيف بنجاح! 🎉');
      
      // Auto-select the newly created category
      if (newCat && newCat.id) {
        setCategoryId(newCat.id);
        setSubcategoryId('');
      }
      
      // Reset state
      setNewCatName('');
      setNewCatColor('#ef4444');
      setNewCatIcon('Circle');
      setNewCatType('need');
      setIsAddingCustomCategory(false);
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error('حدث خطأ أثناء إنشاء التصنيف');
    }
  };

  const handleSpeedAdd = (val: number) => {
    hapticFeedback('light');
    const currentAmount = evaluateExpression(expression);
    setExpression((currentAmount + val).toString());
  };

  const handleSelectShortcut = (amount: number, noteText: string, searchKey: string) => {
    hapticFeedback('medium');
    setExpression(amount.toString());
    setNote(noteText);
    
    // Find matching category
    const foundCat = categories.find(c => 
      c.name.toLowerCase().includes(searchKey.toLowerCase()) ||
      (searchKey === 'baby' && (c.id === '2' || c.name.includes('رضيع') || c.name.includes('طفل'))) ||
      (searchKey === 'food' && (c.id === '1' || c.name.includes('مأكل') || c.name.includes('مشرب') || c.name.includes('قفة'))) ||
      (searchKey === 'transport' && (c.name.includes('نقل') || c.name.includes('سيارة') || c.name.includes('بنزين'))) ||
      (searchKey === 'bills' && (c.name.includes('فاتورة') || c.name.includes('كراء') || c.name.includes('التزام')))
    );

    if (foundCat) {
      setCategoryId(foundCat.id);
      setSubcategoryId('');
    }
    toast.success(`تم ملء بيانات: ${noteText} ⚡`);
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
    hapticFeedback('medium');
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

        await transferAccount(accountId, toAccountId, finalAmount, date, note.trim());
        toast.success('تم التحويل بنجاح');
        hapticFeedback('success');
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
          note: note.trim(),
          paymentMethod,
        };

        if (editExpenseData) {
          await updateExpense(editExpenseData.id, expenseData);
          toast.success('تم تحديث المصروف بنجاح');
          hapticFeedback('success');
        } else {
          // Save last used parameters to localStorage
          try {
            localStorage.setItem('masarifi_last_used', JSON.stringify({ accountId, paymentMethod }));
          } catch (e) {
            console.error('Failed to save last used values:', e);
          }
          await addExpense(expenseData);
          toast.success('تمت إضافة المصروف بنجاح');
          hapticFeedback('success');
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
          goalId: goalId || undefined,
          date,
          note: note.trim(),
        };

        if (editExpenseData) {
          await updateIncome(editExpenseData.id, incomeData);
          toast.success('تم تحديث الدخل بنجاح');
          hapticFeedback('success');
        } else {
          await addIncome(incomeData);
          toast.success('تمت إضافة الدخل بنجاح');
          hapticFeedback('success');
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('حدث خطأ أثناء الحفظ');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  const bgColors = {
    expense: 'bg-gradient-to-br from-rose-500 to-rose-700',
    income: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    transfer: 'bg-gradient-to-br from-indigo-500 to-indigo-700'
  };
  const activeTabColors = {
    expense: 'bg-white/20 shadow-inner backdrop-blur-md',
    income: 'bg-white/20 shadow-inner backdrop-blur-md',
    transfer: 'bg-white/20 shadow-inner backdrop-blur-md'
  };

  const bgColor = bgColors[type];
  const activeTabColor = activeTabColors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-6 md:p-10 overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => { hapticFeedback('light'); onClose(); }}
            className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Main Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: '50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '100%', scale: 0.95 }}
            transition={{ 
              type: 'spring',
              damping: 26,
              stiffness: 280,
              mass: 0.9
            }}
            className="w-full h-full sm:h-[85vh] sm:max-h-[850px] sm:max-w-lg bg-white dark:bg-slate-900 flex flex-col overflow-hidden sm:rounded-3xl sm:shadow-2xl z-20 relative border-0 sm:border border-slate-100 dark:border-slate-800"
          >
          {activeView === 'main' && (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900">
              {/* Header */}
              <div className={cn("flex flex-col text-white transition-colors duration-300 pb-3 pt-[env(safe-area-inset-top)] shrink-0", bgColor)}>
                <div className="flex items-center justify-between p-4">
                  <button type="button" onClick={() => { hapticFeedback('light'); onClose(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer mr-1">
                    <X size={24} />
                  </button>
                  
                  {/* Mode Shifter Segmented Control inside Header! */}
                  <div className="inline-flex bg-black/20 p-0.5 rounded-xl border border-white/5 mx-auto shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => { 
                        hapticFeedback('light'); 
                        setInputMode('quick'); 
                        localStorage.setItem('masarifi_input_mode', 'quick'); 
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer",
                        inputMode === 'quick' 
                          ? "bg-white text-slate-900 shadow-sm" 
                          : "text-white/70 hover:text-white"
                      )}
                    >
                      <Zap size={11} className={cn("shrink-0", inputMode === 'quick' ? "text-amber-500 fill-amber-500" : "")} />
                      <span>إدخال سريع⚡</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { 
                        hapticFeedback('light'); 
                        setInputMode('calculator'); 
                        localStorage.setItem('masarifi_input_mode', 'calculator'); 
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer",
                        inputMode === 'calculator' 
                          ? "bg-white text-slate-900 shadow-sm" 
                          : "text-white/70 hover:text-white"
                      )}
                    >
                      <span className="shrink-0 text-[10px]">🧮</span>
                      <span>آلة حاسبة</span>
                    </button>
                  </div>

                  <button type="button" onClick={handleSubmit} disabled={loading} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer ml-1">
                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={28} strokeWidth={3} />}
                  </button>
                </div>

                {/* Main Tabs (إيراد / مصروف / تحويل) */}
                <div className="flex w-full px-4 mb-1">
                  <div className="flex w-full bg-black/20 p-1 rounded-2xl backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => { hapticFeedback('light'); setType('income'); }}
                      className={cn("flex-1 py-1.5 text-xs sm:text-sm font-semibold transition-all rounded-xl cursor-pointer", type === 'income' ? activeTabColor : "text-white/70 hover:text-white")}
                    >
                      دخل
                    </button>
                    <button
                      type="button"
                      onClick={() => { hapticFeedback('light'); setType('expense'); }}
                      className={cn("flex-1 py-1.5 text-xs sm:text-sm font-semibold transition-all rounded-xl cursor-pointer", type === 'expense' ? activeTabColor : "text-white/70 hover:text-white")}
                    >
                      مصروف
                    </button>
                    <button
                      type="button"
                      onClick={() => { hapticFeedback('light'); setType('transfer'); }}
                      className={cn("flex-1 py-1.5 text-xs sm:text-sm font-semibold transition-all rounded-xl cursor-pointer", type === 'transfer' ? activeTabColor : "text-white/70 hover:text-white")}
                    >
                      تحويل
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Viewport based on inputMode */}
              {inputMode === 'calculator' ? (
                <>
                  {/* Amount Display (Calculator Style) */}
                  <div className={cn("flex-1 flex flex-col items-center justify-center px-6 py-4 text-white min-h-[140px] max-h-[220px]", bgColor)}>
                    <div className="flex items-baseline gap-2 w-full justify-center overflow-hidden drop-shadow-sm">
                      <span className="text-4xl sm:text-5xl font-light opacity-80 shrink-0">
                        {type === 'expense' ? '-' : type === 'income' ? '+' : ''}
                      </span>
                      <span 
                        className={cn(
                          "font-light tracking-tighter truncate dir-ltr transition-all duration-200", 
                          expression.length > 8 ? "text-5xl sm:text-6xl" : "text-7xl sm:text-8xl"
                        )}
                      >
                        {expression}
                      </span>
                      <span className="text-2xl sm:text-3xl font-light opacity-80 shrink-0">{currency}</span>
                    </div>
                    {/* Subtle info if expression has operators */}
                    {/[+\-*/]/.test(expression) && (
                      <div className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full mt-2 backdrop-blur-sm animate-pulse">
                        ={formatCurrency(evaluateExpression(expression), currency)}
                      </div>
                    )}

                    {/* Duplicate Last Transaction Button */}
                    {lastExpense && type === 'expense' && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          hapticFeedback('medium');
                          setExpression(lastExpense.amount.toString());
                          setCategoryId(lastExpense.categoryId);
                          setSubcategoryId(lastExpense.subcategoryId || '');
                          if (lastExpense.accountId) {
                            setAccountId(lastExpense.accountId);
                          }
                          setPaymentMethod(lastExpense.paymentMethod || 'cash');
                          setNote(lastExpense.note || '');
                          toast.success('تم تكرار آخر عملية وتحديث البيانات بنجاح!');
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[11px] font-semibold rounded-full transition-all border border-white/10 shadow-md select-none cursor-pointer"
                      >
                        <Sparkles size={11} className="text-amber-300 fill-amber-300 animate-pulse" />
                        <span>تكرار آخر مصروف: {lastExpenseCategory?.name || 'مصروف'} ({lastExpense.amount} {currency})</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Subcategories (if applicable) */}
                  {type === 'expense' && selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
                    <div className={cn("px-6 pb-4 flex gap-2 overflow-x-auto custom-scrollbar shrink-0", bgColor)}>
                      {selectedCategory.subcategories.map(sub => (
                        <button
                          key={sub}
                          onClick={() => { hapticFeedback('light'); setSubcategoryId(subcategoryId === sub ? '' : sub); }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border border-transparent shrink-0",
                            subcategoryId === sub 
                              ? "bg-white text-rose-600 shadow-sm" 
                              : "bg-black/10 text-white hover:bg-black/20"
                          )}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selectors */}
                  <div className="grid grid-cols-3 gap-px bg-slate-250 dark:bg-slate-800 shrink-0">
                    <button 
                      onClick={() => { hapticFeedback('light'); setActiveView('account'); }}
                      className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] text-slate-400 mb-1">الحساب</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{selectedAccount?.name || 'اختر الحساب'}</span>
                    </button>
                    
                    {type === 'transfer' ? (
                      <button 
                        onClick={() => { hapticFeedback('light'); setActiveView('toAccount'); }}
                        className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <span className="text-[10px] text-slate-400 mb-1">إلى حساب</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{selectedToAccount?.name || 'اختر الحساب'}</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => { hapticFeedback('light'); setActiveView('category'); }}
                        className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <span className="text-[10px] text-slate-400 mb-1">{type === 'income' ? 'المصدر' : 'الفئة'}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{type === 'income' ? (source || 'اختر المصدر') : (selectedCategory?.name || 'اختر الفئة')}</span>
                      </button>
                    )}

                    <button 
                      onClick={() => { hapticFeedback('light'); setActiveView('details'); }}
                      className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                    >
                      <span className="text-[10px] text-slate-400 mb-1">تفاصيل</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{format(parseISO(date), 'dd MMM', { locale: ar })}</span>
                      {note && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                    </button>
                  </div>

                  {/* Real-time Category Budget Insight Bar (Calculator Mode) */}
                  {type === 'expense' && currentCategoryBudgetInsight && (
                    <div className={cn(
                      "px-4 py-2 text-[10px] font-bold flex items-center justify-between border-t border-b border-slate-200/40 dark:border-slate-800/60 shrink-0",
                      currentCategoryBudgetInsight.remainingAfter < 0 
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                        : "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                    )}>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          currentCategoryBudgetInsight.remainingAfter < 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                        )} />
                        <span>ميزانية {selectedCategory?.name}: المتبقي بعد العملية</span>
                      </div>
                      <span className="font-mono">
                        {formatCurrency(currentCategoryBudgetInsight.remainingAfter, currency)}
                      </span>
                    </div>
                  )}

                  {/* Quick Payment Method Selector on main screen (only for expense) */}
                  {type === 'expense' && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800/80 shrink-0">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">طريقة الدفع:</span>
                      <div className="flex gap-1">
                        {(['cash', 'card', 'transfer'] as PaymentMethod[]).map((method) => {
                          const isSelected = paymentMethod === method;
                          const labels = {
                            cash: { text: 'نقداً', icon: 'Coins', color: 'text-amber-500 bg-amber-500/10 border-amber-400/50' },
                            card: { text: 'بطاقة', icon: 'CreditCard', color: 'text-blue-500 bg-blue-500/10 border-blue-400/50' },
                            transfer: { text: 'تحويل', icon: 'ArrowRightLeft', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-400/50' }
                          };
                          const info = labels[method];
                          return (
                            <button
                              key={`calc-pm-${method}`}
                              type="button"
                              onClick={() => { hapticFeedback('light'); setPaymentMethod(method); }}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                                isSelected 
                                  ? info.color
                                  : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900"
                              )}
                            >
                              <DynamicIcon name={info.icon} size={11} />
                              <span>{info.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Keypad Section */}
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900 pb-[env(safe-area-inset-bottom)]">
                    <CalculatorKeypad 
                      onPress={handleKeyPress}
                      onDelete={handleDelete}
                      onCalculate={handleCalculate}
                    />
                  </div>
                </>
              ) : (
                /* SMART INTEGRATED QUICK ADD WORKSPACE */
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 space-y-4 custom-scrollbar pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-right" dir="rtl">
                  
                  {/* 1. Large Direct Amount Input */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        مبلغ العملية الفعلي
                      </span>
                      {/[+\-*/]/.test(expression) && (
                        <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono">
                          حاسبة نشطة: {expression}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={expression}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        onFocus={(e) => {
                          if (!expression || expression === '0' || expression === '0.000' || expression === '0.00' || parseFloat(expression) === 0) {
                            setExpression('');
                          } else {
                            const target = e.target;
                            setTimeout(() => {
                              try {
                                target.setSelectionRange(0, target.value.length);
                              } catch (err) {
                                target.select();
                              }
                            }, 50);
                          }
                        }}
                        onClick={(e) => {
                          if (!expression || expression === '0' || expression === '0.000' || expression === '0.00' || parseFloat(expression) === 0) {
                            setExpression('');
                          } else {
                            const target = e.target as HTMLInputElement;
                            setTimeout(() => {
                              try {
                                target.setSelectionRange(0, target.value.length);
                              } catch (err) {
                                target.select();
                              }
                            }, 50);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full pl-16 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800/80 focus:border-amber-400 focus:outline-[#f59e0b] rounded-xl text-center text-3xl font-black text-slate-800 dark:text-white transition-all font-mono"
                        dir="ltr"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#10b981] font-mono">
                        {currency}
                      </span>
                    </div>
                    
                    {/* Speed addition badge short buttons */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[1, 5, 10, 20, 50, 100].map((val) => (
                        <button
                          type="button"
                          key={`speed-${val}`}
                          onClick={() => handleSpeedAdd(val)}
                          className="px-3 py-1.5 text-[11px] font-black rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-[#eab308]/15 hover:text-[#d97706] border border-slate-200/60 dark:border-slate-800/80 active:scale-95 transition-all cursor-pointer font-mono text-slate-600 dark:text-slate-400"
                        >
                          +{val}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { hapticFeedback('light'); setExpression('0'); }}
                        className="px-3 py-1.5 text-[11px] font-black rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200/40 active:scale-95 transition-all cursor-pointer"
                      >
                        صفر
                      </button>
                    </div>
                  </div>

                  {/* 2. Embedded Smart Grid Selection */}
                  {type === 'expense' && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">حدد تصنيف المصروف 📁</span>
                      <div className="grid grid-cols-4 gap-2">
                        {categories.map((cat) => {
                          const isSelected = categoryId === cat.id;
                          return (
                            <button
                              type="button"
                              key={`quick-cat-${cat.id}`}
                              onClick={() => {
                                hapticFeedback('light');
                                setCategoryId(cat.id);
                                setSubcategoryId('');
                              }}
                              className={cn(
                                "p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all relative cursor-pointer",
                                isSelected
                                  ? "bg-rose-500/10 border-rose-400 text-rose-600 dark:text-rose-400 shadow-sm"
                                  : "border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950 text-slate-500 hover:border-slate-350 dark:hover:border-slate-700"
                              )}
                            >
                              {isSelected && (
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                              )}
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                                style={{ backgroundColor: cat.color }}
                              >
                                <DynamicIcon name={cat.icon || 'Circle'} size={15} />
                              </div>
                              <span className="text-[10px] font-bold truncate max-w-full">{cat.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Compact Subcategories inline inside Quick mode if chosen */}
                      {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto custom-scrollbar pr-1">
                          {selectedCategory.subcategories.map(sub => {
                            const isSubSelected = subcategoryId === sub;
                            return (
                              <button
                                type="button"
                                key={`quick-sub-${sub}`}
                                onClick={() => { hapticFeedback('light'); setSubcategoryId(subcategoryId === sub ? '' : sub); }}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-black whitespace-nowrap transition-all shrink-0 cursor-pointer border",
                                  isSubSelected 
                                    ? "bg-rose-500 text-white border-rose-500" 
                                    : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-150 dark:border-slate-850 hover:bg-slate-100"
                                )}
                              >
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Income Source embedded list */}
                  {type === 'income' && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">حدد مصدر الدخل والمقبوضات 💼</span>
                      <div className="flex flex-wrap gap-2 justify-start font-sans">
                        {['راتب', 'عمل حر', 'مكافأة', 'هدية', 'استثمار', 'أخرى'].map((src) => {
                          const isSelected = source === src;
                          return (
                            <button
                              type="button"
                              key={`quick-src-${src}`}
                              onClick={() => {
                                hapticFeedback('light');
                                setSource(src);
                                setCategoryId(''); 
                              }}
                              className={cn(
                                "px-3.5 py-2 text-xs font-black rounded-xl border transition-all active:scale-95 cursor-pointer",
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                  : "border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-650 dark:text-slate-350"
                              )}
                            >
                              {src}
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <input
                          type="text"
                          value={source}
                          onChange={(e) => { setSource(e.target.value); setCategoryId(''); }}
                          placeholder="أو اكتب مصدراً مخصصاً للدخل المالي هنا..."
                          className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-colors text-right"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. Account / Bank Wallet direct select grid */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">
                      {type === 'transfer' ? 'الحساب الـمُحوِل منه (الخصم)' : 'حساب الخصم أو الإيداع 🏦'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {accounts.map((acc) => {
                        const isSelected = accountId === acc.id;
                        return (
                          <button
                            type="button"
                            key={`quick-acc-${acc.id}`}
                            onClick={() => {
                              hapticFeedback('light');
                              setAccountId(acc.id);
                            }}
                            className={cn(
                              "p-3 rounded-xl border flex items-center justify-start text-right gap-3 cursor-pointer transition-all w-full",
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950 text-slate-500 hover:border-slate-200"
                            )}
                          >
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: acc.color }}
                            >
                              <DynamicIcon name={acc.icon || 'Wallet'} size={15} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[11px] font-black truncate">{acc.name}</span>
                              <span className="text-[9px] font-extrabold opacity-85 font-mono">{formatCurrency(acc.balance, currency)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* If Transfer, show the destination account directly! */}
                  {type === 'transfer' && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">
                        الحساب الـمُحول إليه (الإيداع) 📥
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {accounts.map((acc) => {
                          const isSelected = toAccountId === acc.id;
                          return (
                            <button
                              type="button"
                              key={`quick-toacc-${acc.id}`}
                              onClick={() => {
                                hapticFeedback('light');
                                setToAccountId(acc.id);
                              }}
                              className={cn(
                                "p-3 rounded-xl border flex items-center justify-start text-right gap-3 cursor-pointer transition-all w-full",
                                isSelected
                                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                  : "border-slate-100 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-955 text-slate-500 hover:border-slate-200"
                              )}
                            >
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                                style={{ backgroundColor: acc.color }}
                              >
                                <DynamicIcon name={acc.icon || 'Wallet'} size={15} />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[11px] font-black truncate">{acc.name}</span>
                                <span className="text-[9px] font-extrabold opacity-85 font-mono">{formatCurrency(acc.balance, currency)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Payment method selector card (only for expense) */}
                  {type === 'expense' && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">طريقة دفع المصروف 💳</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['cash', 'card', 'transfer'] as PaymentMethod[]).map((method) => {
                          const isSelected = paymentMethod === method;
                          const labels = {
                            cash: { text: 'نقداً', icon: 'Coins' },
                            card: { text: 'بطاقة', icon: 'CreditCard' },
                            transfer: { text: 'تحويل', icon: 'ArrowRightLeft' }
                          };
                          const info = labels[method];
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => { hapticFeedback('light'); setPaymentMethod(method); }}
                              className={cn(
                                "py-2 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer",
                                isSelected
                                  ? "border-amber-400 bg-amber-400/10 text-amber-500"
                                  : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950 text-slate-500 hover:border-slate-200"
                              )}
                            >
                              <DynamicIcon name={info.icon} size={14} />
                              <span className="text-[10px] font-black">{info.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5. Date & Memo/Note combined in a single card row */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 flex flex-col justify-start items-stretch">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">تاريخ المعاملة</label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none transition-all cursor-pointer text-center"
                        />
                      </div>
                      <div className="space-y-1.5 flex flex-col justify-start items-stretch">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right pr-1">بيان أو مذكرات</label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="ملاحظات توضيحية..."
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-400 transition-all text-right"
                        />
                      </div>
                    </div>
                    {isAutoMatched && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-3 py-1.5 rounded-xl justify-center animate-pulse mt-1">
                        <Sparkles size={11} className="fill-amber-500 shrink-0" />
                        <span>تم التعرف على الفئة وتحديدها تلقائياً بذكاء 🪄</span>
                      </div>
                    )}
                  </div>

                  {/* 6. Smart Family Templates Panel */}
                  {type === 'expense' && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مجموعات سريعة جاهزة لعائلتك 🏡</span>
                        <span className="text-[9px] font-black text-amber-500">توفير الوقت والجهد</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: '🧷 حفاظات يحيى', amount: 36, note: 'حفاظات يحيى الرضيع', key: 'baby' },
                          { label: '🍼 حليب يحيى', amount: 26, note: 'علبة حليب يحيى', key: 'baby' },
                          { label: '🥦 قفة الخضار', amount: 45, note: 'قفة الخضار والغلال الأسبوعية', key: 'food' },
                          { label: '🛒 المغازة العامة', amount: 65, note: 'مقتنيات المغازة العامة', key: 'food' },
                          { label: '🚗 بنزين سيارة', amount: 30, note: 'بنزين سيارة العائلة', key: 'transport' },
                          { label: '⚡ فاتورة ستاغ', amount: 55, note: 'فاتورة كهرباء وغاز STEG', key: 'bills' }
                        ].map((sh, idx) => (
                          <button
                            type="button"
                            key={`fam-sh-${idx}`}
                            onClick={() => handleSelectShortcut(sh.amount, sh.note, sh.key)}
                            className="p-2 bg-slate-50 dark:bg-slate-955 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-slate-150 dark:border-slate-850 hover:border-amber-400/50 rounded-xl text-right transition-all flex flex-col justify-start gap-1 cursor-pointer"
                          >
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{sh.label}</span>
                            <span className="text-[9px] font-black text-slate-400 font-mono">{sh.amount} د.ت</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Smart Budget Insight Widget */}
                  {currentCategoryBudgetInsight && (
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-3 text-right font-sans" dir="rtl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            currentCategoryBudgetInsight.remainingAfter < 0 ? "bg-rose-500" : "bg-emerald-500"
                          )} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مؤشر الميزانية الذكي 📊</span>
                        </div>
                        {currentCategoryBudgetInsight.remainingAfter < 0 ? (
                          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">تنبيه بالخروج عن السقف ⚠️</span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">المصروف آمن وضمن الحدود ✅</span>
                        )}
                      </div>

                      {/* Real-time Category Budget Progress Bar */}
                      {(() => {
                        const limit = currentCategoryBudgetInsight.limit;
                        const spentThisMonth = currentCategoryBudgetInsight.spentThisMonth;
                        const enteredAmount = currentCategoryBudgetInsight.enteredAmount;
                        
                        const percentUsedBefore = limit > 0 ? Math.min(100, (spentThisMonth / limit) * 100) : 0;
                        const percentUsedAfter = limit > 0 ? Math.min(100, ((spentThisMonth + enteredAmount) / limit) * 100) : 0;
                        
                        return (
                          <div className="space-y-1.5 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
                            <div className="flex justify-between text-[9px] font-black text-slate-500">
                              <span>معدل استهلاك ميزانية الفئة ({selectedCategory?.name})</span>
                              <span className="font-mono">{percentUsedAfter.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden relative">
                              {/* Before amount */}
                              <div 
                                className="h-full bg-slate-350 dark:bg-slate-755 absolute top-0 right-0 rounded-full transition-all duration-300"
                                style={{ width: `${percentUsedBefore}%` }}
                              />
                              {/* After amount with color shift */}
                              <div 
                                className={cn(
                                  "h-full absolute top-0 right-0 rounded-full transition-all duration-300",
                                  currentCategoryBudgetInsight.remainingAfter < 0 ? "bg-rose-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${percentUsedAfter}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-400 font-extrabold pt-0.5">
                              <span>المستهلك: {spentThisMonth + enteredAmount} د.ت</span>
                              <span>السقف الأقصى: {limit} د.ت</span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                          <p className="text-[8px] font-black text-slate-400 mb-0.5">المتبقي حالياً</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">
                            {formatCurrency(currentCategoryBudgetInsight.remainingBefore, currency)}
                          </p>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                          <p className="text-[8px] font-black text-slate-400 mb-0.5">المتبقي بعد العملية</p>
                          <p className={cn(
                            "text-xs font-black font-mono",
                            currentCategoryBudgetInsight.remainingAfter < 0 ? "text-rose-500" : "text-emerald-500"
                          )}>
                            {formatCurrency(currentCategoryBudgetInsight.remainingAfter, currency)}
                          </p>
                        </div>
                      </div>

                      {currentCategoryBudgetInsight.remainingAfter < 0 ? (
                        <p className="text-[9px] text-rose-500 font-black pr-1 leading-relaxed">
                          ⚠️ الميزانية المقدرة لهذا الشهر لن تغطي كامل هذا المصروف. فكر في تأجيله أو تقليله لحماية مدخراتك.
                        </p>
                      ) : (
                        <p className="text-[9px] text-slate-550 dark:text-slate-400 font-bold pr-1 leading-relaxed">
                          💡 ممتاز! هذا المصروف يتناسب تماماً مع سقف الميزانية التونسية المخططة لعائلتك.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Done button specifically for Quick mode at bottom */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className={cn(
                      "w-full py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2",
                      type === 'expense' 
                        ? "bg-amber-400 hover:bg-amber-500 shadow-amber-400/20 text-slate-950" 
                        : type === 'income' 
                        ? "bg-emerald-400 hover:bg-emerald-500 shadow-emerald-400/20 text-slate-950" 
                        : "bg-indigo-400 hover:bg-indigo-500 shadow-indigo-400/20 text-slate-950"
                    )}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap size={13} className="fill-slate-950" />
                        <span>تسجيل وحفظ العملية فوراً ⚡</span>
                      </>
                    )}
                  </button>

                </div>
              )}
            </div>
          )}

          {/* Category Selection Modal */}
          {activeView === 'category' && (
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
                <h2 className="text-lg font-bold">{type === 'income' ? 'اختر المصدر' : 'اختر الفئة'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {type === 'income' ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                        <Layers size={16} /> مصادر شائعة
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {['راتب', 'عمل حر', 'مكافأة', 'هدية', 'استثمار', 'أخرى'].map(src => (
                      <button 
                        key={src}
                        onClick={() => { hapticFeedback('light'); setSource(src); setCategoryId(''); setActiveView('main'); }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border-2",
                          source === src 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/30"
                        )}
                      >
                        {src}
                      </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                        <AlignLeft size={16} /> مصدر مخصص
                      </label>
                      <input
                        type="text"
                        value={source}
                        onChange={(e) => { setSource(e.target.value); setCategoryId(''); }}
                        placeholder="أدخل مصدر الدخل..."
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button 
                        onClick={() => { hapticFeedback('light'); setActiveView('main'); }}
                        disabled={!source.trim()}
                        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm"
                      >
                        تأكيد المصدر
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full space-y-4">
                    <div className="relative shrink-0">
                      <input
                        type="text"
                        placeholder="ابحث عن فئة..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full pl-3 pr-10 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold outline-none focus:border-rose-500 transition-colors"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>

                    {/* Inline Form to add custom category */}
                    {isAddingCustomCategory ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl space-y-3 shrink-0"
                        dir="rtl"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">إنشاء تصنيف مخصص جديد 🎨</span>
                          <button 
                            type="button"
                            onClick={() => setIsAddingCustomCategory(false)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-2.5">
                            <input 
                              type="text" 
                              value={newCatName} 
                              onChange={(e) => setNewCatName(e.target.value)} 
                              placeholder="اسم التصنيف (مثل: مدرسة، سيارة)..."
                              className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border-2 border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-rose-500 transition-all text-right"
                            />
                          </div>

                          {/* Quick Suggestion Templates */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-400 block text-right">💡 اقتراحات سريعة جاهزة:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { name: 'مدرسة', icon: 'Book', color: '#3b82f6', type: 'need', label: '🏫 مدرسة' },
                                { name: 'سيارة', icon: 'Car', color: '#ef4444', type: 'need', label: '🚗 سيارة' },
                                { name: 'ديون', icon: 'Wallet', color: '#10b981', type: 'saving', label: '💸 ديون' },
                                { name: 'صحة', icon: 'HeartPulse', color: '#ec4899', type: 'need', label: '🏥 صحة' },
                                { name: 'سفر', icon: 'Plane', color: '#8b5cf6', type: 'want', label: '✈️ سفر' },
                                { name: 'تسوق', icon: 'ShoppingBag', color: '#f59e0b', type: 'want', label: '🛍️ تسوق' },
                              ].map((tmpl) => (
                                <button
                                  type="button"
                                  key={tmpl.name}
                                  onClick={() => {
                                    hapticFeedback('light');
                                    setNewCatName(tmpl.name);
                                    setNewCatIcon(tmpl.icon);
                                    setNewCatColor(tmpl.color);
                                    setNewCatType(tmpl.type as any);
                                  }}
                                  className={cn(
                                    "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                                    newCatName === tmpl.name
                                      ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                                      : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  )}
                                >
                                  {tmpl.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 block text-right">النوع</span>
                              <select 
                                value={newCatType}
                                onChange={(e) => setNewCatType(e.target.value as any)}
                                className="w-full px-2 py-2 text-xs font-bold rounded-xl border-2 border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none text-right"
                              >
                                <option value="need">احتياجات (50%)</option>
                                <option value="want">رغبات (30%)</option>
                                <option value="saving">ادخار (20%)</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 block text-right">اللون</span>
                              <ColorPicker value={newCatColor} onChange={setNewCatColor} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 block text-right">الأيقونة</span>
                            <IconSelect value={newCatIcon} onChange={setNewCatIcon} className="w-full !h-[36px]" />
                          </div>

                          <button
                            type="button"
                            onClick={handleCreateCustomCategory}
                            disabled={!newCatName.trim()}
                            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md shadow-rose-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} />
                            <span>تأكيد وإنشاء التصنيف</span>
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { hapticFeedback('light'); setIsAddingCustomCategory(true); }}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-center gap-1.5 shrink-0"
                        dir="rtl"
                      >
                        <Plus size={14} />
                        <span>إنشاء تصنيف مخصص جديد ✨</span>
                      </button>
                    )}

                    {/* Favorite Categories Quick Grid */}
                    {type === 'expense' && favoriteCategories.length > 0 && !categorySearchQuery && (
                      <div className="shrink-0 space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 px-1">
                          <Sparkles size={11} className="text-rose-500 fill-rose-500" />
                          التصنيفات الأكثر استخداماً (آخر 30 يوم)
                        </span>
                        <div className="grid grid-cols-4 gap-3.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-805/30">
                          {favoriteCategories.map((cat) => (
                            <button
                              key={`fav-${cat.id}`}
                              onClick={() => {
                                hapticFeedback('light');
                                setCategoryId(cat.id);
                                setSubcategoryId('');
                                setActiveView('main');
                              }}
                              className="flex flex-col items-center gap-1.5 group/fav cursor-pointer"
                            >
                              <div
                                className={cn(
                                  "w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all shadow-sm group-hover/fav:scale-105",
                                  categoryId === cat.id ? "ring-2 ring-rose-500 ring-offset-2 scale-105" : "opacity-95"
                                )}
                                style={{ backgroundColor: cat.color, '--tw-ring-color': cat.color } as any}
                              >
                                <DynamicIcon name={cat.icon || 'Circle'} size={18} />
                              </div>
                              <span className="text-[9px] font-semibold text-center text-slate-600 dark:text-slate-400 truncate w-full px-0.5">
                                {cat.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-2">
                      {categories.filter(cat => cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).map((cat) => (
                        <button
                          key={cat.id}
                        onClick={() => { hapticFeedback('light'); setCategoryId(cat.id); setSubcategoryId(''); setActiveView('main'); }}
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
                )}
              </div>
            </motion.div>
          )}

          {/* Account Selection Modal */}
          {(activeView === 'account' || activeView === 'toAccount') && (
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
                <h2 className="text-lg font-bold">{activeView === 'account' ? 'اختر الحساب' : 'إلى حساب'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => { 
                      hapticFeedback('light');
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

          {/* Details Modal */}
          {activeView === 'details' && (
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
          )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;
