import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Calendar, 
  Filter, 
  Search, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  MoveRight, 
  Sliders, 
  Plus, 
  Layers, 
  X, 
  Check, 
  Info,
  CalendarDays,
  Coins
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAppContext } from '../../store/AppContext';
import { cn, formatCurrency, hapticFeedback } from '../../utils';
import { Expense, Income, Budget, Category, Account } from '../../types';
import toast from 'react-hot-toast';

interface BudgetHistoryTabProps {
  onSelectMonthForBudget: (month: string) => void;
  currentSelectedMonth: string;
}

export const BudgetHistoryTab: React.FC<BudgetHistoryTabProps> = ({
  onSelectMonthForBudget,
  currentSelectedMonth,
}) => {
  const { 
    expenses = [], 
    income = [], 
    budgets = [], 
    categories = [], 
    accounts = [], 
    currency,
    updateExpense,
    updateIncome,
    deleteExpense,
    deleteIncome,
    setBudget
  } = useAppContext();

  // Search & Filter States
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  // Modals & Popovers
  const [editingTransaction, setEditingTransaction] = useState<{
    tx: any;
    type: 'expense' | 'income';
    amount: number;
    date: string;
    note: string;
    categoryId?: string;
    accountId?: string;
    source?: string;
  } | null>(null);

  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const [batchMoveTargetMonth, setBatchMoveTargetMonth] = useState<string>(() => currentMonthKey);
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);
  const [quickMoveTx, setQuickMoveTx] = useState<{ tx: any; type: 'expense' | 'income' } | null>(null);
  const [editingBudgetMonth, setEditingBudgetMonth] = useState<Budget | null>(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState<string>('');

  // 1. Compile Month Summaries (from budgets, expenses, income)
  const monthSummaries = useMemo(() => {
    const monthMap: Record<string, {
      month: string;
      budgetAmount: number;
      totalExpense: number;
      totalIncome: number;
      expenseCount: number;
      incomeCount: number;
      categoriesSpent: Record<string, number>;
    }> = {};

    // Helper to extract yyyy-MM
    const getMonthKey = (dateStr?: string) => {
      if (!dateStr || typeof dateStr !== 'string') return '';
      // Support ISO strings and formatted yyyy-MM-dd
      if (dateStr.length >= 7) {
        const m = dateStr.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) return m;
        if (/^\d{4}\/\d{2}$/.test(m)) return m.replace('/', '-');
      }
      return '';
    };

    // Initialize with all existing budgets
    budgets.forEach(b => {
      if (b.month) {
        if (!monthMap[b.month]) {
          monthMap[b.month] = {
            month: b.month,
            budgetAmount: b.amount || 0,
            totalExpense: 0,
            totalIncome: 0,
            expenseCount: 0,
            incomeCount: 0,
            categoriesSpent: {}
          };
        } else {
          monthMap[b.month].budgetAmount = b.amount || 0;
        }
      }
    });

    // Aggregate Expenses
    expenses.forEach(e => {
      if (e.isTransfer) return;
      const m = getMonthKey(e.date);
      if (!m) return;

      if (!monthMap[m]) {
        monthMap[m] = {
          month: m,
          budgetAmount: 0,
          totalExpense: 0,
          totalIncome: 0,
          expenseCount: 0,
          incomeCount: 0,
          categoriesSpent: {}
        };
      }

      monthMap[m].totalExpense += e.amount;
      monthMap[m].expenseCount += 1;
      monthMap[m].categoriesSpent[e.categoryId] = (monthMap[m].categoriesSpent[e.categoryId] || 0) + e.amount;
    });

    // Aggregate Income
    income.forEach(inc => {
      if (inc.isTransfer) return;
      const m = getMonthKey(inc.date);
      if (!m) return;

      if (!monthMap[m]) {
        monthMap[m] = {
          month: m,
          budgetAmount: 0,
          totalExpense: 0,
          totalIncome: 0,
          expenseCount: 0,
          incomeCount: 0,
          categoriesSpent: {}
        };
      }

      monthMap[m].totalIncome += inc.amount;
      monthMap[m].incomeCount += 1;
    });

    // Sort descending by month
    return Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));
  }, [budgets, expenses, income]);

  // Available unique month list for selector
  const availableMonths = useMemo(() => {
    const list = monthSummaries.map(m => m.month);
    if (!list.includes(currentMonthKey)) list.unshift(currentMonthKey);
    return Array.from(new Set(list)).sort((a, b) => b.localeCompare(a));
  }, [monthSummaries, currentMonthKey]);

  // 2. Flatten and filter transactions for manual audit & editing
  const filteredTransactions = useMemo(() => {
    const allList: Array<{
      id: string;
      type: 'expense' | 'income';
      amount: number;
      date: string;
      note: string;
      categoryId?: string;
      accountId?: string;
      source?: string;
      isTransfer?: boolean;
      raw: any;
    }> = [];

    // Add Expenses
    expenses.forEach(e => {
      if (e.isTransfer) return;
      allList.push({
        id: e.id,
        type: 'expense',
        amount: e.amount,
        date: e.date,
        note: e.note || 'مصروف بدون وصف',
        categoryId: e.categoryId,
        accountId: e.accountId,
        raw: e
      });
    });

    // Add Income
    income.forEach(inc => {
      if (inc.isTransfer) return;
      allList.push({
        id: inc.id,
        type: 'income',
        amount: inc.amount,
        date: inc.date,
        note: inc.source || 'دخل بدون وصف',
        source: inc.source,
        accountId: inc.accountId,
        raw: inc
      });
    });

    // Filter by Month
    let result = allList;
    if (selectedHistoryMonth !== 'all') {
      result = result.filter(tx => {
        if (!tx.date) return false;
        return tx.date.startsWith(selectedHistoryMonth) || tx.date.includes(selectedHistoryMonth.replace('-', '/'));
      });
    }

    // Filter by Type
    if (filterType !== 'all') {
      result = result.filter(tx => tx.type === filterType);
    }

    // Filter by Category
    if (filterCategoryId !== 'all') {
      result = result.filter(tx => tx.categoryId === filterCategoryId);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(tx => {
        const noteMatch = tx.note.toLowerCase().includes(q);
        const amountMatch = tx.amount.toString().includes(q);
        const cat = categories.find(c => c.id === tx.categoryId);
        const catMatch = cat?.name.toLowerCase().includes(q);
        return noteMatch || amountMatch || catMatch;
      });
    }

    // Sort by date descending
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, income, selectedHistoryMonth, filterType, filterCategoryId, searchQuery, categories]);

  // Arabic Month Formatter
  const formatMonthName = (mStr: string) => {
    try {
      const d = parseISO(`${mStr}-01`);
      if (isValid(d)) {
        return format(d, 'MMMM yyyy', { locale: ar });
      }
    } catch {
      // fallback
    }
    return mStr;
  };

  // Format full date nicely
  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (isValid(d)) {
        return format(d, 'EEEE, d MMMM yyyy', { locale: ar });
      }
    } catch {
      // fallback
    }
    return dateStr.split('T')[0] || dateStr;
  };

  // Multi-selection handlers
  const handleToggleSelectTx = (id: string) => {
    hapticFeedback('light');
    setSelectedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    hapticFeedback('medium');
    if (selectedTxIds.size === filteredTransactions.length) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(filteredTransactions.map(tx => tx.id)));
    }
  };

  // Quick Move Single Transaction to a Target Month
  const handleQuickMoveMonth = async (txObj: { tx: any; type: 'expense' | 'income' }, targetMonth: string) => {
    hapticFeedback('medium');
    const { tx, type } = txObj;
    
    // Calculate new date: preserve day if possible, or use day 15
    let targetDate = `${targetMonth}-15T12:00:00.000Z`;
    try {
      const oldDate = parseISO(tx.date);
      if (isValid(oldDate)) {
        const day = String(oldDate.getDate()).padStart(2, '0');
        targetDate = `${targetMonth}-${day}T${oldDate.toTimeString().split(' ')[0]}.000Z`;
      }
    } catch {
      targetDate = `${targetMonth}-01T12:00:00.000Z`;
    }

    try {
      if (type === 'expense') {
        updateExpense(tx.id, {
          date: targetDate
        });
      } else {
        updateIncome(tx.id, {
          date: targetDate
        });
      }

      toast.success(`تم نقل العملية بنجاح إلى شهر ${formatMonthName(targetMonth)}! ✨`);
      setQuickMoveTx(null);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء نقل العملية.');
    }
  };

  // Batch Move Selected Transactions
  const handleExecuteBatchMove = async () => {
    if (selectedTxIds.size === 0) return;
    hapticFeedback('success');

    let count = 0;
    try {
      filteredTransactions.forEach(item => {
        if (!selectedTxIds.has(item.id)) return;
        count++;

        let newDate = `${batchMoveTargetMonth}-15T12:00:00.000Z`;
        try {
          const oldDate = parseISO(item.date);
          if (isValid(oldDate)) {
            const day = String(oldDate.getDate()).padStart(2, '0');
            newDate = `${batchMoveTargetMonth}-${day}T${oldDate.toTimeString().split(' ')[0]}.000Z`;
          }
        } catch {
          newDate = `${batchMoveTargetMonth}-01T12:00:00.000Z`;
        }

        if (item.type === 'expense') {
          updateExpense(item.id, {
            date: newDate
          });
        } else {
          updateIncome(item.id, {
            date: newDate
          });
        }
      });

      toast.success(`تم بنجاح نقل ${count} عملية إلى شهر ${formatMonthName(batchMoveTargetMonth)}! 🎉`);
      setSelectedTxIds(new Set());
      setIsBatchMoveModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء النقل الجماعي للعمليات.');
    }
  };

  // Save edited transaction details
  const handleSaveTransactionEdit = async () => {
    if (!editingTransaction) return;
    hapticFeedback('success');

    try {
      const { tx, type, amount, date, note, categoryId, accountId, source } = editingTransaction;
      
      if (type === 'expense') {
        updateExpense(tx.id, {
          amount: Number(amount) || 0,
          date,
          note,
          categoryId: categoryId || tx.categoryId,
          accountId: accountId || tx.accountId
        });
      } else {
        updateIncome(tx.id, {
          amount: Number(amount) || 0,
          date,
          source: source || note,
          accountId: accountId || tx.accountId
        });
      }

      toast.success('تم حفظ تعديل العملية بنجاح! 💾');
      setEditingTransaction(null);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ التعديل.');
    }
  };

  // Delete transaction with confirm
  const handleDeleteTransaction = async (tx: any, type: 'expense' | 'income') => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه العملية نهائياً؟')) return;
    hapticFeedback('medium');

    try {
      if (type === 'expense') {
        await deleteExpense(tx.id);
      } else {
        await deleteIncome(tx.id);
      }
      toast.success('تم حذف العملية بنجاح.');
    } catch (err) {
      console.error(err);
      toast.error('تعذر حذف العملية.');
    }
  };

  // Quick edit monthly budget cap
  const handleSaveMonthlyBudgetCap = () => {
    if (!editingBudgetMonth) return;
    hapticFeedback('success');

    const newAmount = Number(editBudgetAmount) || 0;
    setBudget({
      ...editingBudgetMonth,
      amount: newAmount
    });

    toast.success(`تم تحديث سقف ميزانية شهر ${formatMonthName(editingBudgetMonth.month)} إلى ${formatCurrency(newAmount, currency)}`);
    setEditingBudgetMonth(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      
      {/* Header Info Banner */}
      <div className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/60 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 shrink-0">
              <History size={24} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  سجل الميزانية وتعديل عمليات الشهور
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {monthSummaries.length} شهور مسجلة
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                استعرض ميزانيات الشهور السابقة، وقارن الإنفاق الفعلي بالسقف المحدد، وعدّل أي عملية دخلت في الشهر الخاطئ لنقلها فورياً للشهر الصحيح.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {selectedTxIds.size > 0 && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                type="button"
                onClick={() => setIsBatchMoveModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <ArrowRightLeft size={16} />
                <span>نقل {selectedTxIds.size} عمليات محددة إلى شهر آخر</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Part 1: Historical Month Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              سجل أداء الميزانيات الشهرية
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            انقر على أي شهر لعرض عملياته أو اعتماده
          </span>
        </div>

        {monthSummaries.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">لا يوجد سجل شهور سابق بعد</h4>
            <p className="text-xs text-slate-500">ستظهر هنا الشهور المسجلة فور بدء إضافة العمليات وسقوف الميزانية.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthSummaries.map((summary) => {
              const isCurrentViewed = currentSelectedMonth === summary.month;
              const hasBudget = summary.budgetAmount > 0;
              const remaining = summary.budgetAmount - summary.totalExpense;
              const isOver = hasBudget && remaining < 0;
              const percentage = hasBudget ? Math.min(Math.round((summary.totalExpense / summary.budgetAmount) * 100), 200) : 0;

              return (
                <motion.div
                  key={summary.month}
                  whileHover={{ y: -3 }}
                  className={cn(
                    "relative rounded-2xl border p-4.5 sm:p-5 transition-all bg-white dark:bg-slate-900 shadow-2xs space-y-4 flex flex-col justify-between",
                    isCurrentViewed 
                      ? "border-emerald-500/80 ring-2 ring-emerald-500/20 dark:border-emerald-500/60" 
                      : "border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {formatMonthName(summary.month)}
                        </span>
                        {isCurrentViewed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            الشهر النشط
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        {summary.month}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {!hasBudget ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          بدون سقف
                        </span>
                      ) : isOver ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                          <TrendingUp size={11} />
                          <span>تجاوز ({percentage}%)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>التزام ({percentage}%)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">الميزانية:</span>
                      <span className="font-black text-slate-900 dark:text-white font-mono">
                        {hasBudget ? formatCurrency(summary.budgetAmount, currency) : 'غير محددة'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">المصروف الفعلي:</span>
                      <span className="font-black text-rose-600 dark:text-rose-400 font-mono">
                        {formatCurrency(summary.totalExpense, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">المداخيل:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(summary.totalIncome, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">الفارق / الوفر:</span>
                      <span className={cn(
                        "font-black font-mono",
                        hasBudget ? (remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400") : "text-slate-500"
                      )}>
                        {hasBudget ? formatCurrency(remaining, currency) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar if budget set */}
                  {hasBudget && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span>نسبة الاستهلاك</span>
                        <span className={isOver ? "text-rose-600 dark:text-rose-400 font-black" : ""}>{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", isOver ? "bg-rose-500" : percentage > 80 ? "bg-amber-500" : "bg-emerald-500")}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        setSelectedHistoryMonth(summary.month);
                        // Scroll down to transactions table
                        document.getElementById('transactions-audit-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Filter size={12} />
                      <span>عرض العمليات ({summary.expenseCount + summary.incomeCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('medium');
                        onSelectMonthForBudget(summary.month);
                        toast.success(`تم اختيار ميزانية شهر ${formatMonthName(summary.month)} لعرضها في اللوحة الرئيسية.`);
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-all cursor-pointer"
                      title="اعتماد هذا الشهر في لوحة الميزانية"
                    >
                      <Layers size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        const b = budgets.find(item => item.month === summary.month) || { amount: summary.budgetAmount, month: summary.month };
                        setEditingBudgetMonth(b);
                        setEditBudgetAmount(summary.budgetAmount.toString());
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                      title="تعديل سقف ميزانية هذا الشهر"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Part 2: Transactions Audit & Manual Month Fixer Table */}
      <div id="transactions-audit-section" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        
        {/* Section Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تدقيق وتعديل العمليات يدوياً
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              يمكنك تعديل أي عملية أو نقلها بنقرة واحدة إلى الشهر المستهدف الصحيح.
            </p>
          </div>

          {/* Quick Filter Info & Count */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              {selectedTxIds.size === filteredTransactions.length && filteredTransactions.length > 0 ? (
                <>
                  <CheckSquare size={14} className="text-indigo-600" />
                  <span>إلغاء تحديد الكل</span>
                </>
              ) : (
                <>
                  <Square size={14} className="text-slate-400" />
                  <span>تحديد الكل ({filteredTransactions.length})</span>
                </>
              )}
            </button>

            {selectedTxIds.size > 0 && (
              <button
                type="button"
                onClick={() => setIsBatchMoveModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <ArrowRightLeft size={13} />
                <span>نقل {selectedTxIds.size} محددة</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs">
          
          {/* Month Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-1">الشهر:</label>
            <select
              value={selectedHistoryMonth}
              onChange={(e) => {
                hapticFeedback('light');
                setSelectedHistoryMonth(e.target.value);
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">كافة الشهور ({filteredTransactions.length} عملية)</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthName(m)} ({m})</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-1">نوع العملية:</label>
            <select
              value={filterType}
              onChange={(e) => {
                hapticFeedback('light');
                setFilterType(e.target.value as any);
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">الكل (مصاريف ومداخيل)</option>
              <option value="expense">مصاريف فقط</option>
              <option value="income">مداخيل فقط</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-1">الفئة:</label>
            <select
              value={filterCategoryId}
              onChange={(e) => {
                hapticFeedback('light');
                setFilterCategoryId(e.target.value);
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">كافة الفئات</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-1">بحث بالنص أو المبلغ:</label>
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              <input
                type="text"
                placeholder="ابحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-8 pl-3 py-2 font-bold text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

        </div>

        {/* Transactions Table / List */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
            <Info className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">لا توجد عمليات تطابق الفلتر المحدد</h4>
            <p className="text-xs text-slate-500">جرّب اختيار شهر آخر أو إزالة معايير البحث.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTxIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                        onChange={handleSelectAll}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">العملية / الوصف</th>
                    <th className="py-3 px-3">الفئة / المصدر</th>
                    <th className="py-3 px-3">المبلغ</th>
                    <th className="py-3 px-3">التاريخ المسجل</th>
                    <th className="py-3 px-3 text-center">إجراءات النقل والتعديل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredTransactions.map((item) => {
                    const isSelected = selectedTxIds.has(item.id);
                    const isExpense = item.type === 'expense';
                    const category = isExpense ? categories.find(c => c.id === item.categoryId) : null;
                    return (
                      <tr 
                        key={item.id}
                        className={cn(
                          "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors",
                          isSelected && "bg-indigo-50/50 dark:bg-indigo-950/30"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectTx(item.id)}
                            className="rounded cursor-pointer"
                          />
                        </td>

                        {/* Title & Type Badge */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              isExpense ? "bg-rose-500" : "bg-emerald-500"
                            )} />
                            <span className="font-black text-slate-800 dark:text-slate-100 max-w-xs truncate">
                              {item.note}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {isExpense ? (
                            <span className="inline-flex items-center gap-1">
                              <span 
                                className="w-2.5 h-2.5 rounded-full inline-block" 
                                style={{ backgroundColor: category?.color || '#94a3b8' }} 
                              />
                              <span>{category?.name || 'بدون فئة'}</span>
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {item.source || 'دخل'}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3">
                          <span className={cn(
                            "font-mono font-black",
                            isExpense ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {isExpense ? '-' : '+'}{formatCurrency(item.amount, currency)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {formatDateDisplay(item.date)}
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Quick Move to Month Button */}
                            <button
                              type="button"
                              onClick={() => {
                                hapticFeedback('light');
                                setQuickMoveTx({ tx: item.raw, type: item.type });
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[11px] font-bold transition-all cursor-pointer"
                              title="نقل هذه العملية إلى شهر آخر"
                            >
                              <ArrowRightLeft size={11} />
                              <span>نقل لشهر...</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                hapticFeedback('light');
                                setEditingTransaction({
                                  tx: item.raw,
                                  type: item.type,
                                  amount: item.amount,
                                  date: item.date.split('T')[0] || item.date,
                                  note: item.note,
                                  categoryId: item.categoryId,
                                  accountId: item.accountId,
                                  source: item.source
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                              title="تعديل تفاصيل العملية"
                            >
                              <Edit3 size={13} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(item.raw, item.type)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                              title="حذف العملية"
                            >
                              <Trash2 size={13} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: Quick Move Single Transaction to a Target Month */}
      <AnimatePresence>
        {quickMoveTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="text-indigo-600" size={20} />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    نقل العملية إلى شهر آخر
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickMoveTx(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="font-black text-slate-800 dark:text-slate-100">
                  {quickMoveTx.tx.note || quickMoveTx.tx.source || 'عملية بدون وصف'}
                </div>
                <div className="text-slate-500 flex justify-between font-mono">
                  <span>المبلغ: {formatCurrency(quickMoveTx.tx.amount, currency)}</span>
                  <span>التاريخ الحالي: {quickMoveTx.tx.date?.split('T')[0]}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 dark:text-slate-300 block">
                  اختر الشهر المستهدف:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableMonths.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleQuickMoveMonth(quickMoveTx, m)}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-black transition-all text-center cursor-pointer",
                        m === currentMonthKey
                          ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200"
                          : "bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      )}
                    >
                      <span>{formatMonthName(m)}</span>
                      <span className="block text-[10px] opacity-70 font-mono mt-0.5">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Batch Move Selected Transactions */}
      <AnimatePresence>
        {isBatchMoveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="text-indigo-600" size={20} />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    نقل {selectedTxIds.size} عمليات جماعياً
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchMoveModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                سيتم تعديل تواريخ جميع العمليات المحددة ({selectedTxIds.size} عملية) وترحيلها بالكامل إلى الشهر الذي تختاره أدناه.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                  الشهر المستهدف:
                </label>
                <select
                  value={batchMoveTargetMonth}
                  onChange={(e) => setBatchMoveTargetMonth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-black text-slate-800 dark:text-slate-100 outline-none"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>
                      {formatMonthName(m)} ({m})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleExecuteBatchMove}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  تأكيد النقل إلى {formatMonthName(batchMoveTargetMonth)}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchMoveModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Edit Full Transaction Details */}
      <AnimatePresence>
        {editingTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 text-right max-h-[90vh] overflow-y-auto custom-scrollbar"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="text-indigo-600" size={20} />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    تعديل تفاصيل العملية وتاريخها
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">المبلغ ({currency}):</label>
                <input
                  type="number"
                  step="any"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-black text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Note / Source */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">الوصف / البيان:</label>
                <input
                  type="text"
                  value={editingTransaction.type === 'expense' ? editingTransaction.note : (editingTransaction.source || editingTransaction.note)}
                  onChange={(e) => setEditingTransaction({ 
                    ...editingTransaction, 
                    note: e.target.value,
                    source: e.target.value
                  })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Exact Date Picker */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">التاريخ:</label>
                <input
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Category (if expense) */}
              {editingTransaction.type === 'expense' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الفئة:</label>
                  <select
                    value={editingTransaction.categoryId}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, categoryId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Account */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">الحساب:</label>
                <select
                  value={editingTransaction.accountId || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, accountId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white outline-none"
                >
                  <option value="">بدون حساب محدد</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              {/* Save & Cancel */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveTransactionEdit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  حفظ التعديلات 💾
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Quick Edit Monthly Budget Cap */}
      <AnimatePresence>
        {editingBudgetMonth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="text-indigo-600" size={20} />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    تعديل سقف ميزانية شهر {formatMonthName(editingBudgetMonth.month)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBudgetMonth(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">سقف الميزانية الإجمالي ({currency}):</label>
                <input
                  type="number"
                  step="any"
                  value={editBudgetAmount}
                  onChange={(e) => setEditBudgetAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-black text-slate-900 dark:text-white outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveMonthlyBudgetCap}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  حفظ سقف الميزانية 💾
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBudgetMonth(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
