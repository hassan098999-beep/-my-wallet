import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Sparkles, 
  UtensilsCrossed, 
  Baby, 
  House, 
  HeartPulse, 
  Coffee, 
  BusFront, 
  Clock, 
  ArrowRight,
  Edit2,
  Repeat,
  Trash2,
  Wallet
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../utils';
import { Category, Account, Expense, Goal } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DailySimpleViewProps {
  categories: Category[];
  accounts: Account[];
  expenses: Expense[];
  goals: Goal[];
  currency: string;
  remainingDailyBudget: number;
  todaySpending: number;
  dailyBudget: number;
  rollingBudget: number;
  totalNetWorth: number;
  totalMonthlyExpense: number;
  dailyAverage: number;
  recentTransactions: Expense[];
  budgetStatus: 'red' | 'orange' | 'green';
  handleQuickPresetClick: (preset: any) => void;
  handleQuickAddSubmit: (e: React.FormEvent) => void;
  quickAmount: string;
  setQuickAmount: (v: string) => void;
  quickDescription: string;
  setQuickDescription: (v: string) => void;
  quickCategoryId: string;
  setQuickCategoryId: (v: string) => void;
  setIsAddModalOpen: (v: boolean) => void;
  handleEdit: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  repeatExpense: (id: string) => void;
}

const DailySimpleView: React.FC<DailySimpleViewProps> = ({
  categories,
  accounts,
  currency,
  remainingDailyBudget,
  todaySpending,
  dailyBudget,
  rollingBudget,
  totalNetWorth,
  totalMonthlyExpense,
  recentTransactions,
  budgetStatus,
  handleQuickPresetClick,
  handleQuickAddSubmit,
  quickAmount,
  setQuickAmount,
  quickDescription,
  setQuickDescription,
  quickCategoryId,
  setQuickCategoryId,
  setIsAddModalOpen,
  handleEdit,
  deleteExpense,
  repeatExpense
}) => {
  const formatExpenseDate = (dateString?: string) => {
    if (!dateString) return 'تاريخ غير محدد';
    try {
      const parsed = parseISO(dateString);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'dd MMM', { locale: ar });
      }
    } catch (err) {
      console.error('Invalid date format:', dateString, err);
    }
    return dateString || 'تاريخ غير محدد';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-right" dir="rtl">
      
      {/* A. Elegant Daily Budget Capsule */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-white/5"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full inline-block">
              الميزانية اليومية النشطة
            </span>
            <p className="text-xs text-slate-400 font-bold leading-none mt-2">المبلغ المتبقي المتاح للصرف اليوم دون قلق:</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter pt-1 font-mono">
              {formatCurrency(remainingDailyBudget, currency)}
            </h2>
            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1 justify-start">
              <span className={cn(
                "w-2 h-2 rounded-full",
                budgetStatus === 'red' ? "bg-rose-500" : budgetStatus === 'orange' ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <span>تَم صرف {formatCurrency(todaySpending, currency)} من أصل {formatCurrency(dailyBudget, currency)}</span>
            </div>
          </div>

          <div className="space-y-4 md:border-r md:border-white/10 md:pr-8 md:rtl:border-r md:rtl:pr-8 md:rtl:border-l-0 md:rtl:pl-0 flex-1">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span>معدل الصرف اليومي</span>
                <span>{Math.min(100, Math.round((todaySpending / (rollingBudget || 1)) * 100))}%</span>
              </div>
              <div className="w-full bg-slate-900/60 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner animate-pulse-soft">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (todaySpending / (rollingBudget || 1)) * 100)}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    budgetStatus === 'red' ? "bg-rose-500 animate-pulse" : budgetStatus === 'orange' ? "bg-amber-500" : "bg-emerald-555"
                  )}
                  style={{
                    backgroundColor: budgetStatus === 'red' ? '#ef4444' : budgetStatus === 'orange' ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1 text-right">
              <div>
                <span className="text-[9px] font-black text-slate-400 block uppercase">الرصيد الجملي المتوفر</span>
                <p className="text-sm font-black text-white font-mono mt-0.5">{formatCurrency(totalNetWorth, currency)}</p>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 block uppercase">المصروف الشهري</span>
                <p className="text-sm font-black text-rose-300 font-mono mt-0.5">{formatCurrency(totalMonthlyExpense, currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* B. One-Tap Instant Logging Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-5"
      >
        <div className="space-y-1.5">
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full inline-block">
            الدفتر الذهبي للتسجيل السريع
          </span>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-1 justify-start">
            <span>كبسة سريعة ونقرة للتسجيل الفوري</span>
            <Sparkles size={14} className="text-amber-500 animate-pulse" />
          </h3>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
            اضغط مرة واحدة على أي معاملة أدناه وسنقوم بحفظها وإدخالها فورياً في السجل المالي، دون الحاجة لكتابة أي بيان أو تعبئة حقول!
          </p>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { label: 'قفة قضية السوق 🥕', amount: '25', desc: 'قضية خضار من السوق', categoryName: 'قضية السوق والقفة', icon: UtensilsCrossed, color: 'hover:border-emerald-500/40 hover:bg-emerald-500/5 text-emerald-650 dark:text-emerald-400 border-emerald-100/30' },
            { label: 'حليب وحفاضات الرضيع 🍼', amount: '52', desc: 'لوازم وكوش وحليب الرضيع', categoryName: 'لوازم ومصروف الرضيع', icon: Baby, color: 'hover:border-indigo-500/40 hover:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-100/30' },
            { label: 'فاتورة السكن ستاغ 💡', amount: '65', desc: 'فاتورة STEG/SONEDE سكن', categoryName: 'البيت والفواتير', icon: House, color: 'hover:border-amber-500/40 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-100/30' },
            { label: 'طبيب وتلاقيح 🩺', amount: '50', desc: 'فيزيتا طبيب الأطفال وعيادة صحية', categoryName: 'صحة وطبيب الأطفال', icon: HeartPulse, color: 'hover:border-rose-500/40 hover:bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-100/30' },
            { label: 'قهوة وشاي عائلي ☕', amount: '4.5', desc: 'شرب قهوة وجلسة عائلية بالمقهى', categoryName: 'ترفيه ومقهى ومواسم', icon: Coffee, color: 'hover:border-cyan-500/40 hover:bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 border-cyan-100/30' },
            { label: 'أجرة مواصلات أو وقود 🚌', amount: '12', desc: 'تعريفة لواج أو نقل أو وقود سيارة', categoryName: 'نقل وتنقل', icon: BusFront, color: 'hover:border-purple-500/40 hover:bg-purple-500/5 text-purple-650 dark:text-purple-400 border-purple-100/30' },
          ].map((preset, index) => {
            const Icon = preset.icon;
            return (
              <button
                type="button"
                key={index}
                onClick={() => {
                  hapticFeedback('medium');
                  handleQuickPresetClick(preset);
                }}
                className={cn(
                  "p-3 rounded-2xl border bg-slate-50/45 dark:bg-slate-950/25 text-right flex flex-col justify-between space-y-2 transition-all duration-250 cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs border-slate-100 dark:border-slate-800/80 hover:scale-[1.02]",
                  preset.color
                )}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] font-mono font-black">{preset.amount} د.ت</span>
                  <Icon size={14} className="opacity-80 shrink-0" />
                </div>
                <div className="space-y-0.5 text-ellipsis overflow-hidden">
                  <p className="text-[10px] font-black leading-snug line-clamp-1">{preset.label}</p>
                  <p className="text-[8px] text-slate-400 font-bold truncate">{preset.categoryName}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Simple Custom Amount Fast Register form */}
        <div className="pt-2">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">أو قم بتسجيل مبلغ مخصص بسرعة عائلية</p>
            <form onSubmit={handleQuickAddSubmit} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
              
              <div className="flex-1 space-y-1 block text-right">
                <span className="text-[8px] font-black text-slate-400 block pr-0.5">المبلغ المحدد (د.ت)</span>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  placeholder="0.000"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  dir="ltr"
                />
              </div>

              <div className="flex-1 space-y-1 block text-right">
                <span className="text-[8px] font-black text-slate-400 block pr-0.5">البيان / الوصف</span>
                <input
                  type="text"
                  placeholder="مثال: خبز وحليب للبيت"
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="flex-1 space-y-1 block text-right">
                <span className="text-[8px] font-black text-slate-400 block pr-0.5 font-bold">التصنيف الموجه له</span>
                <select
                  value={quickCategoryId}
                  onChange={(e) => setQuickCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus size={14} />
                <span>إدخال المعاملة</span>
              </button>
            </form>
          </div>

          <div className="flex justify-center items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                hapticFeedback('medium');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={12} />
              <span>فتح دفتر الحسابات الكامل والآلة الحاسبة</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* C. Clean Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800/60">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">آخر الحركات المالية المنجزة</h3>
            <p className="text-[10px] text-slate-400 font-extrabold leading-tight">كبسات تحرك سريعة تظهر بجانب المصروف للعمل الفوري</p>
          </div>
          <Link to="/transactions" className="text-[10px] font-black text-indigo-500 hover:underline">عرض جميع الحركات</Link>
        </div>

        <div className="space-y-2">
          {recentTransactions.slice(0, 4).map((expense) => {
            const expenseCategory = categories.find(c => c.id === expense.categoryId);
            const expenseAccount = accounts.find(a => a.id === expense.accountId);
            
            return (
              <div 
                key={expense.id}
                className="bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-850/80 rounded-2xl flex items-center justify-between gap-4 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-3xs shrink-0"
                    style={{ backgroundColor: expense.isTransfer ? '#6366f1' : (expenseCategory?.color || '#94a3b8') }}
                  >
                    {expense.isTransfer ? <ArrowRight className="rotate-45" size={16} /> : <DynamicIcon name={expenseCategory?.icon || 'HelpCircle'} size={16} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      {expense.note || (expense.isTransfer ? 'عملية تحويل' : expenseCategory?.name)}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1">
                      <span>{expense.isTransfer ? 'عملية تحويل' : (expenseCategory?.name || 'غير مصنف')}</span>
                      {expenseAccount && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <span>{expenseAccount.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left font-sans">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(expense.amount, currency)}
                    </span>
                    <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                      {formatExpenseDate(expense.date)}
                    </span>
                  </div>

                  {/* Accessible inline tactile operations instead of hidden swipe mechanics */}
                  <div className="flex items-center gap-1 border-r border-slate-200/50 dark:border-slate-805/50 pr-3 rtl:border-r-0 rtl:pl-0 rtl:border-l rtl:pl-3">
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('medium');
                        handleEdit(expense);
                      }}
                      className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                      title="تعديل"
                    >
                      <Edit2 size={11} />
                    </button>
                    {!expense.isTransfer && (
                      <button
                        type="button"
                        onClick={() => {
                          hapticFeedback('medium');
                          repeatExpense(expense.id);
                          toast.success('تم تكرار العملية');
                        }}
                        className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                        title="تكرار"
                      >
                        <Repeat size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('medium');
                        deleteExpense(expense.id);
                        toast.success('تم حذف العملية');
                      }}
                      className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {recentTransactions.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl">
              لا تتوفر أي معاملات مسجلة حتى الآن. ابدأ بكافة كبسات الدفتر السريع! 🍼🥖
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
};

export default DailySimpleView;
