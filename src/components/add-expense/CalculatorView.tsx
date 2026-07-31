import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronUp } from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { DynamicIcon } from '../DynamicIcon';
import CalculatorKeypad from '../CalculatorKeypad';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PaymentMethod, Expense, Category, Account } from '../../types';
import { evaluateExpression } from './utils';

interface CalculatorViewProps {
  type: 'expense' | 'income' | 'transfer';
  expression: string;
  setExpression: React.Dispatch<React.SetStateAction<string>>;
  currency: string;
  bgColor: string;
  lastExpense: Expense | null;
  lastExpenseCategory: Category | null | undefined;
  selectedCategory: Category | undefined;
  selectedAccount: Account | undefined;
  selectedToAccount: Account | undefined;
  subcategoryId: string;
  setSubcategoryId: (sub: string) => void;
  setCategoryId: (catId: string) => void;
  setAccountId: (accId: string) => void;
  setPaymentMethod: (pm: PaymentMethod) => void;
  setNote: (note: string) => void;
  setActiveView: (view: 'main' | 'category' | 'account' | 'toAccount' | 'details') => void;
  date: string;
  source: string;
  setSource: (src: string) => void;
  note: string;
  currentCategoryBudgetInsight: {
    limit: number;
    spentThisMonth: number;
    remainingBefore: number;
    remainingAfter: number;
    enteredAmount: number;
  } | null;
  paymentMethod: PaymentMethod;
  handleKeyPress: (key: string) => void;
  handleDelete: () => void;
  handleCalculate: () => void;
  categories: Category[];
  accounts: Account[];
  favoriteCategories: Category[];
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  type,
  expression,
  setExpression,
  currency,
  bgColor,
  lastExpense,
  lastExpenseCategory,
  selectedCategory,
  selectedAccount,
  selectedToAccount,
  subcategoryId,
  setSubcategoryId,
  setCategoryId,
  setAccountId,
  setPaymentMethod,
  setNote,
  setActiveView,
  date,
  source,
  setSource,
  note,
  currentCategoryBudgetInsight,
  paymentMethod,
  handleKeyPress,
  handleDelete,
  handleCalculate,
  categories,
  accounts,
  favoriteCategories
}) => {
  const [quickSelect, setQuickSelect] = useState<'none' | 'account' | 'toAccount' | 'category'>('none');

  const getQuickCategories = () => {
    if (type === 'income') {
      return ['راتب', 'عمل حر', 'مكافأة', 'هدية', 'استثمار', 'أخرى'].map((src, i) => ({
        id: src,
        name: src,
        color: '#10b981', // emerald-500
        icon: 'Briefcase'
      }));
    }
    const list = [...favoriteCategories, ...categories].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // unique
    return list.slice(0, 8);
  };

  const quickCategories = getQuickCategories();
  const quickAccounts = accounts.slice(0, 8);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key;
      if (/[0-9]/.test(key)) {
        handleKeyPress(key);
      } else if (['+', '-', '*', '/', '.'].includes(key)) {
        handleKeyPress(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleCalculate, handleDelete]);

  return (
    <>
      {/* Amount Display (Calculator Style) */}
      <div 
        className={cn(
          "flex-1 flex flex-col items-center justify-center px-6 py-6 text-white min-h-[100px] max-h-[160px] transition-all shrink", 
          bgColor,
          !(type === 'expense' && selectedCategory?.subcategories && selectedCategory.subcategories.length > 0) && "rounded-b-[2rem] shadow-sm mb-2"
        )} 
        onClick={() => setQuickSelect('none')}
      >
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
        <div className={cn("px-6 pb-6 pt-2 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 rounded-b-[2rem] shadow-sm mb-2", bgColor)}>
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
      <div className="relative">
        <AnimatePresence>
          {quickSelect !== 'none' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 shadow-lg border-t border-slate-100 dark:border-slate-800 rounded-t-2xl z-10 max-h-60 overflow-y-auto"
            >
              <div className="p-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(quickSelect === 'category' ? quickCategories : quickAccounts).map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      hapticFeedback('light');
                      if (quickSelect === 'category') {
                        if (type === 'income') {
                          setSource(item.id);
                        } else {
                          setCategoryId(item.id);
                        }
                      }
                      if (quickSelect === 'account') setAccountId(item.id);
                      if (quickSelect === 'toAccount') {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        setActiveView('toAccount');
                      }
                      setQuickSelect('none');
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-right"
                  >
                    {quickSelect === 'category' && item.color && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: item.color }}>
                        <DynamicIcon name={item.icon || 'Circle'} size={14} />
                      </div>
                    )}
                    {quickSelect !== 'category' && item.color && (
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                  </button>
                ))}
                
                <button
                  onClick={() => {
                    hapticFeedback('light');
                    setActiveView(quickSelect === 'category' ? 'category' : (quickSelect === 'account' ? 'account' : 'toAccount'));
                    setQuickSelect('none');
                  }}
                  className="flex items-center justify-center gap-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold"
                >
                  عرض المزيد...
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-4 rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => {
              hapticFeedback('light');
              setQuickSelect(quickSelect === 'account' ? 'none' : 'account');
            }}
            className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">الحساب <ChevronUp size={10}/></span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{selectedAccount?.name || 'اختر الحساب'}</span>
          </button>
          
          {type === 'transfer' ? (
            <button 
              onClick={() => { hapticFeedback('light'); setActiveView('toAccount'); }}
              className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 mb-1">إلى حساب</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{selectedToAccount?.name || 'اختر الحساب'}</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                hapticFeedback('light');
                setQuickSelect(quickSelect === 'category' ? 'none' : 'category');
              }}
              className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">{type === 'income' ? 'المصدر' : 'الفئة'} <ChevronUp size={10}/></span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{type === 'income' ? (source || 'اختر المصدر') : (selectedCategory?.name || 'اختر الفئة')}</span>
            </button>
          )}

          <button 
            onClick={() => { hapticFeedback('light'); setActiveView('details'); }}
            className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 mb-1">تفاصيل</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{format(parseISO(date), 'dd MMM', { locale: ar })}</span>
            {note && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
          </button>
        </div>
      </div>

      {/* Real-time Category Budget Insight Bar (Calculator Mode) */}
      {type === 'expense' && currentCategoryBudgetInsight && (
        <div className={cn(
          "mx-4 mt-3 px-4 py-2.5 text-[10px] font-bold flex items-center justify-between rounded-xl shrink-0 shadow-sm",
          currentCategoryBudgetInsight.remainingAfter < 0 
            ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400" 
            : "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
        )}>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              currentCategoryBudgetInsight.remainingAfter < 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
            )} />
            <span>ميزانية {selectedCategory?.name}: المتبقي</span>
          </div>
          <span className="font-mono text-xs">
            {formatCurrency(currentCategoryBudgetInsight.remainingAfter, currency)}
          </span>
        </div>
      )}

      {/* Quick Payment Method Selector on main screen (only for expense) */}
      {type === 'expense' && (
        <div className="flex flex-col items-center justify-center mt-3 mb-1 shrink-0">
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/80">
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
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                    isSelected 
                      ? info.color + " shadow-sm border"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900 border border-transparent"
                  )}
                >
                  <DynamicIcon name={info.icon} size={12} />
                  <span>{info.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Keypad Section */}
      <div className="flex-1 bg-white dark:bg-slate-900 min-h-0 flex flex-col shrink" onClick={() => setQuickSelect('none')}>
        <CalculatorKeypad 
          onPress={handleKeyPress}
          onDelete={handleDelete}
          onCalculate={handleCalculate}
        />
      </div>
    </>
  );
};
