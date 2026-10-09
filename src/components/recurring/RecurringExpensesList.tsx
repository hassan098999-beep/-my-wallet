import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Clock, Pencil, Trash, Calendar, AlertCircle, RefreshCcw, 
  CheckCircle2, Zap, Droplets, Home, Baby, Wifi, ShieldAlert,
  ArrowRight, CreditCard, Wallet, Sparkles, AlertTriangle
} from 'lucide-react';
import { RecurringExpense, Category, RecurringInterval } from '../../types';
import { cn, formatCurrency, hapticFeedback } from '../../utils';
import { useAppContext } from '../../store/AppContext';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { DynamicIcon } from '../DynamicIcon';

interface RecurringExpensesListProps {
  recurringExpenses: RecurringExpense[];
  categories: Category[];
  currency: string;
  handleEdit: (expense: RecurringExpense) => void;
  deleteRecurringExpense: (id: string) => void;
  intervalLabels: Record<RecurringInterval, string>;
  setIsAdding: (val: boolean) => void;
  onApplyPreset?: (preset: { note: string; categoryId: string; subcategoryId?: string; amount?: string; interval: RecurringInterval }) => void;
}

const COMMON_PRESETS = [
  { id: 'steg', name: 'فاتورة الستاغ (STEG)', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50', categoryName: 'البيت والفواتير', subcategory: 'فاتورة الستاغ (STEG)', interval: 'monthly' as RecurringInterval, defaultAmount: '65' },
  { id: 'sonede', name: 'فاتورة الصوناد (SONEDE)', icon: Droplets, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50', categoryName: 'البيت والفواتير', subcategory: 'فاتورة الصوناد (SONEDE)', interval: 'monthly' as RecurringInterval, defaultAmount: '35' },
  { id: 'rent', name: 'إيجار المنزل', icon: Home, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50', categoryName: 'البيت والفواتير', subcategory: 'إيجار المنزل', interval: 'monthly' as RecurringInterval, defaultAmount: '450' },
  { id: 'baby-care', name: 'روضة ومحضنة الرضيع', icon: Baby, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/50', categoryName: 'لوازم ومصروف الرضيع', subcategory: 'روضة ومحضنة', interval: 'monthly' as RecurringInterval, defaultAmount: '120' },
  { id: 'internet', name: 'اشتراك الإنترنت والهاتف', icon: Wifi, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50', categoryName: 'البيت والفواتير', subcategory: 'إنترنت واشتراك هاتف', interval: 'monthly' as RecurringInterval, defaultAmount: '45' },
];

const RecurringExpensesList: React.FC<RecurringExpensesListProps> = ({
  recurringExpenses,
  categories,
  currency,
  handleEdit,
  deleteRecurringExpense,
  intervalLabels,
  setIsAdding,
  onApplyPreset,
}) => {
  const { payRecurringExpenseNow, accounts } = useAppContext();
  
  // Payment modal state
  const [payingExpense, setPayingExpense] = useState<RecurringExpense | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'cash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleOpenPay = (expense: RecurringExpense) => {
    hapticFeedback('light');
    setPayingExpense(expense);
    setSelectedAccountId(expense.accountId || accounts[0]?.id || 'cash');
  };

  const handleConfirmPay = async () => {
    if (!payingExpense) return;
    setIsProcessingPayment(true);
    hapticFeedback('success');
    try {
      await payRecurringExpenseNow(payingExpense.id, selectedAccountId);
      setPayingExpense(null);
    } catch (err) {
      toast.error('تعذر إتمام الدفع');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const today = new Date();

  // Sort expenses: nearest due date first
  const sortedExpenses = [...(recurringExpenses || [])].sort((a, b) => {
    return parseISO(a.nextDate).getTime() - parseISO(b.nextDate).getTime();
  });

  return (
    <div className="space-y-6 px-2 font-tajawal" dir="rtl">
      {/* Header and Quick Presets Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">قائمة الالتزامات والفواتير المجدولة</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">تتبع مواعيد الاستحقاق وسداد الفواتير بنقرة واحدة</p>
            </div>
          </div>

          <button
            onClick={() => {
              hapticFeedback('light');
              setIsAdding(true);
            }}
            className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer select-none flex items-center gap-1.5 self-end sm:self-auto"
          >
            <Sparkles size={13} />
            <span>إضافة التزام مخصص</span>
          </button>
        </div>

        {/* Quick Tunisian Bill Presets */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            <span>قوالب فواتير والتزامات سريعة الإضافة للعائلة:</span>
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
            {COMMON_PRESETS.map((preset) => {
              const IconComp = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    hapticFeedback('light');
                    const targetCat = categories.find(c => c.name.includes(preset.categoryName)) || categories[0];
                    if (onApplyPreset) {
                      onApplyPreset({
                        note: preset.name,
                        categoryId: targetCat.id,
                        subcategoryId: preset.subcategory,
                        amount: preset.defaultAmount,
                        interval: preset.interval
                      });
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold shrink-0 transition-all hover:scale-102 cursor-pointer shadow-2xs select-none",
                    preset.color
                  )}
                >
                  <IconComp size={14} />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* List of Recurring Expenses */}
      {sortedExpenses && sortedExpenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedExpenses.map(expense => {
            const category = categories.find(c => c.id === expense.categoryId);
            const expenseNextDate = parseISO(expense.nextDate);
            const daysUntil = differenceInCalendarDays(expenseNextDate, today);
            
            const isOverdue = daysUntil < 0;
            const isToday = daysUntil === 0;
            const isSoon = daysUntil > 0 && daysUntil <= 3;

            // Status Badge Config
            let statusBadge = {
              text: `متبقي ${daysUntil} يوم`,
              bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
              icon: Calendar
            };

            if (isOverdue) {
              statusBadge = {
                text: `متأخر بـ ${Math.abs(daysUntil)} يوم! ⚠️`,
                bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-black',
                icon: AlertTriangle
              };
            } else if (isToday) {
              statusBadge = {
                text: 'مستحق اليوم! ⚡',
                bg: 'bg-rose-500 text-white border-rose-600 font-black animate-pulse shadow-xs',
                icon: Zap
              };
            } else if (isSoon) {
              statusBadge = {
                text: `يستحق خلال ${daysUntil} أيام ⏳`,
                bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold',
                icon: AlertCircle
              };
            }

            const StatusIcon = statusBadge.icon;
            const linkedAccount = accounts.find(a => a.id === expense.accountId);

            return (
              <motion.div 
                key={expense.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <Card className={cn(
                  "p-5 md:p-6 w-full group relative overflow-hidden transition-all duration-300 border",
                  (isToday || isOverdue) 
                    ? "border-rose-300 dark:border-rose-900/50 shadow-md shadow-rose-500/5" 
                    : isSoon 
                    ? "border-amber-300 dark:border-amber-900/50 shadow-xs" 
                    : "border-slate-200/80 dark:border-slate-800/80"
                )}>
                  <div className="relative z-10 flex flex-col gap-4">
                    {/* Top Row: Category, Title & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs shrink-0 text-white"
                          style={{ backgroundColor: category?.color || '#059669' }}
                        >
                          {category?.icon ? (
                            <DynamicIcon name={category.icon} size={24} />
                          ) : (
                            <Clock size={24} />
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                            {expense.note || (expense.subcategoryId ? `${category?.name} - ${expense.subcategoryId}` : category?.name)}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/30">
                              {intervalLabels[expense.interval]}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                              {category?.name}
                            </span>
                            {linkedAccount && (
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Wallet size={10} />
                                <span>{linkedAccount.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleEdit(expense)}
                          aria-label="تعديل الالتزام"
                          className="text-slate-400 hover:text-emerald-600 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button 
                          onClick={() => {
                            deleteRecurringExpense(expense.id);
                            toast.success('تم حذف المصروف المتكرر');
                          }}
                          aria-label="حذف الالتزام"
                          className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                          <Trash className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Amount & Due Date Banner */}
                    <div className="flex items-end justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Calendar size={13} />
                          <span className="text-xs font-medium">
                            الاستحقاق: <span className="font-bold font-mono">{format(expenseNextDate, 'dd MMMM yyyy', { locale: ar })}</span>
                          </span>
                        </div>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] border",
                          statusBadge.bg
                        )}>
                          <StatusIcon size={12} />
                          <span>{statusBadge.text}</span>
                        </div>
                      </div>

                      <div className="text-left">
                        <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {formatCurrency(expense.amount, currency)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Quick Pay / Confirm Payment Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleOpenPay(expense)}
                        className={cn(
                          "w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs select-none",
                          (isToday || isOverdue)
                            ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25"
                            : isSoon
                            ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                        )}
                      >
                        <CheckCircle2 size={16} />
                        <span>تسديد الآن وتحديث السجل ⚡</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={RefreshCcw}
          title="لا توجد التزامات أو فواتير مجدولة حالياً"
          description="أضف فواتيرك الثابتة (مثل الستاغ، الصوناد، الإيجار، أو روضة الرضيع) لضمان عدم نسيانها وتتبع مواعيد السداد تلقائياً!"
          actionLabel="إضافة أول التزام دوري"
          onAction={() => {
            hapticFeedback('medium');
            setIsAdding(true);
          }}
        />
      )}

      {/* Direct Payment Confirmation Modal */}
      <AnimatePresence>
        {payingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-right font-tajawal"
              dir="rtl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">تأكيد سداد الالتزام</h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">سيتم تسجيل العملية فوراً وخصمها وترقية الموعد القادم</p>
                </div>
              </div>

              {/* Bill Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">اسم الالتزام:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{payingExpense.note || 'التزام دوري'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">المبلغ المستحق:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-base">
                    {formatCurrency(payingExpense.amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">دورية السداد:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{intervalLabels[payingExpense.interval]}</span>
                </div>
              </div>

              {/* Account Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  خصم المبلغ من الحساب:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={cn(
                        "p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col gap-1",
                        selectedAccountId === acc.id
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <Wallet size={14} className={selectedAccountId === acc.id ? "text-emerald-600" : "text-slate-400"} />
                        <span>{acc.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        الرصيد: {formatCurrency(acc.balance, currency)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingExpense(null)}
                  disabled={isProcessingPayment}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  disabled={isProcessingPayment}
                  className="flex-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <span>جاري التأكيد...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>تأكيد السداد والخصم الآن</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecurringExpensesList;
