import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { PaymentMethod, Expense } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatTunisianAmount, hapticFeedback, getBudgetMonth } from '../utils';
import { evaluateExpression } from './add-expense/utils';
import { AddExpenseTypeSelector } from './add-expense/AddExpenseTypeSelector';
import { CalculatorView } from './add-expense/CalculatorView';
import { CategorySelectionModal } from './add-expense/CategorySelectionModal';
import { AccountSelectionModal } from './add-expense/AccountSelectionModal';
import { DetailsModal } from './add-expense/DetailsModal';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpenseData?: Expense;
  initialGoalId?: string;
  initialMode?: 'quick' | 'calculator';
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, editExpenseData, initialGoalId, initialMode }) => {
  const { categories, accounts, expenses, goals, addExpense, addIncome, updateExpense, updateIncome, transferAccount, addCategory, currency, budgets, firstDayOfMonth } = useAppContext();
  
  const currentMonth = getBudgetMonth(new Date(), firstDayOfMonth || 1);
  const budget = budgets?.find(b => b.month === currentMonth) || null;

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

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

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
    const hasOperator = /[+\-*/]/.test(expression);
    if (hasOperator) {
      const result = evaluateExpression(expression);
      setExpression(result.toString());
    } else {
      handleSubmit();
    }
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
          accountId: accountId || (accounts[0]?.id || 'cash'),
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
            className="w-full h-[100dvh] sm:h-[85vh] sm:max-h-[850px] sm:max-w-lg bg-white dark:bg-slate-900 flex flex-col overflow-hidden sm:rounded-3xl sm:shadow-2xl z-20 relative border-0 sm:border border-slate-100 dark:border-slate-800 min-h-0"
          >
            {activeView === 'main' && (
              <div className="flex flex-col h-full bg-white dark:bg-slate-900 min-h-0">
                <AddExpenseTypeSelector
                  type={type}
                  setType={setType}
                  loading={loading}
                  onClose={onClose}
                  onSubmit={handleSubmit}
                  bgColor={bgColor}
                  activeTabColor={activeTabColor}
                />

                <CalculatorView
                  type={type}
                  expression={expression}
                  setExpression={setExpression}
                  currency={currency}
                  bgColor={bgColor}
                  lastExpense={lastExpense}
                  lastExpenseCategory={lastExpenseCategory}
                  selectedCategory={selectedCategory}
                  selectedAccount={selectedAccount}
                  selectedToAccount={selectedToAccount}
                  subcategoryId={subcategoryId}
                  setSubcategoryId={setSubcategoryId}
                  setCategoryId={setCategoryId}
                  setAccountId={setAccountId}
                  setPaymentMethod={setPaymentMethod}
                  setNote={setNote}
                  setActiveView={setActiveView}
                  date={date}
                  source={source}
                  setSource={setSource}
                  note={note}
                  currentCategoryBudgetInsight={currentCategoryBudgetInsight}
                  paymentMethod={paymentMethod}
                  handleKeyPress={handleKeyPress}
                  handleDelete={handleDelete}
                  handleCalculate={handleCalculate}
                  categories={categories}
                  accounts={accounts}
                  favoriteCategories={favoriteCategories}
                />
              </div>
            )}

            {activeView === 'category' && (
              <CategorySelectionModal
                type={type}
                bgColor={bgColor}
                source={source}
                setSource={setSource}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                setSubcategoryId={setSubcategoryId}
                setActiveView={setActiveView}
                categorySearchQuery={categorySearchQuery}
                setCategorySearchQuery={setCategorySearchQuery}
                categories={categories}
                favoriteCategories={favoriteCategories}
                isAddingCustomCategory={isAddingCustomCategory}
                setIsAddingCustomCategory={setIsAddingCustomCategory}
                newCatName={newCatName}
                setNewCatName={setNewCatName}
                newCatColor={newCatColor}
                setNewCatColor={setNewCatColor}
                newCatIcon={newCatIcon}
                setNewCatIcon={setNewCatIcon}
                newCatType={newCatType}
                setNewCatType={setNewCatType}
                handleCreateCustomCategory={handleCreateCustomCategory}
              />
            )}

            {(activeView === 'account' || activeView === 'toAccount') && (
              <AccountSelectionModal
                activeView={activeView}
                bgColor={bgColor}
                accounts={accounts}
                accountId={accountId}
                setAccountId={setAccountId}
                toAccountId={toAccountId}
                setToAccountId={setToAccountId}
                currency={currency}
                setActiveView={setActiveView}
              />
            )}

            {activeView === 'details' && (
              <DetailsModal
                type={type}
                bgColor={bgColor}
                date={date}
                setDate={setDate}
                goals={goals}
                goalId={goalId}
                setGoalId={setGoalId}
                note={note}
                setNote={setNote}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                setActiveView={setActiveView}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;
