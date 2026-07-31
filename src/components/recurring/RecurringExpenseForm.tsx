import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Plus, RefreshCcw, Calendar, Wallet, CreditCard, ArrowRightLeft } from 'lucide-react';
import { PaymentMethod, RecurringInterval, Category, Account } from '../../types';
import { cn, formatTunisianAmount } from '../../utils';
import Card from '../ui/Card';
import { CategorySelect } from '../CategorySelect';

interface RecurringExpenseFormProps {
  isAdding: boolean;
  editingId: string | null;
  amount: string;
  setAmount: (val: string) => void;
  categoryId: string;
  setCategoryId: (val: string) => void;
  subcategoryId: string;
  setSubcategoryId: (val: string) => void;
  accountId: string;
  setAccountId: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (val: PaymentMethod) => void;
  interval: RecurringInterval;
  setInterval: (val: RecurringInterval) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  selectedDayOfWeek: number;
  setSelectedDayOfWeek: (val: number) => void;
  selectedDayOfMonth: number;
  setSelectedDayOfMonth: (val: number) => void;
  selectedMonthOfYear: number;
  setSelectedMonthOfYear: (val: number) => void;
  handleAdd: (e: React.FormEvent) => void;
  categories: Category[];
  accounts: Account[];
  currency: string;
  intervalLabels: Record<RecurringInterval, string>;
  daysOfWeek: Array<{ id: number; label: string }>;
  monthsOfYear: string[];
}

const RecurringExpenseForm: React.FC<RecurringExpenseFormProps> = ({
  isAdding,
  editingId,
  amount,
  setAmount,
  categoryId,
  setCategoryId,
  subcategoryId,
  setSubcategoryId,
  accountId,
  setAccountId,
  note,
  setNote,
  paymentMethod,
  setPaymentMethod,
  interval,
  setInterval,
  startDate,
  setStartDate,
  selectedDayOfWeek,
  setSelectedDayOfWeek,
  selectedDayOfMonth,
  setSelectedDayOfMonth,
  selectedMonthOfYear,
  setSelectedMonthOfYear,
  handleAdd,
  categories,
  accounts,
  currency,
  intervalLabels,
  daysOfWeek,
  monthsOfYear,
}) => {
  return (
    <AnimatePresence>
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          className="overflow-hidden px-2"
        >
          <Card className="p-6 md:p-8 mb-8 border border-white/40 dark:border-slate-800/40 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                {editingId ? <Pencil size={24} /> : <Plus size={24} />}
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                  {editingId ? 'تعديل المصروف الدوري' : 'إضافة مصروف دوري جديد'}
                </h2>
                <p className="text-xs font-semibold text-slate-500">قم بجدولة مدفوعاتك القادمة بدقة</p>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">المبلغ ({currency})</label>
                  <div className="relative group">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(formatTunisianAmount(e.target.value))}
                      onFocus={(e) => {
                        if (!amount || amount === '0' || amount === '0.000' || parseFloat(amount) === 0) {
                          setAmount('');
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
                        if (!amount || amount === '0' || amount === '0.000' || parseFloat(amount) === 0) {
                          setAmount('');
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
                      placeholder="0.000"
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                      required
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{currency}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الفئة</label>
                  <CategorySelect
                    categories={categories}
                    selectedId={categoryId}
                    onChange={(id) => {
                      setCategoryId(id);
                      setSubcategoryId('');
                    }}
                    className="!h-[56px] !rounded-2xl"
                  />
                </div>

                {categories.find(c => c.id === categoryId)?.subcategories && categories.find(c => c.id === categoryId)!.subcategories!.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">التصنيف الفرعي</label>
                    <select
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
                    >
                      <option value="">اختر تصنيفاً فرعياً (اختياري)</option>
                      {categories.find(c => c.id === categoryId)?.subcategories?.map((sub, idx) => (
                        <option key={idx} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">دورة التكرار</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringInterval[]).map((int) => (
                      <button
                        key={int}
                        type="button"
                        onClick={() => setInterval(int)}
                        className={cn(
                          "py-4 rounded-2xl border-2 border-dashed text-xs font-semibold transition-all",
                          interval === int
                            ? "border-primary-500 bg-primary-500/5 text-primary-600 shadow-lg shadow-primary-500/5"
                            : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        {intervalLabels[int]}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {interval === 'weekly' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2 lg:col-span-3"
                    >
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">يوم التكرار</label>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => setSelectedDayOfWeek(day.id)}
                            className={cn(
                              "px-4 py-3 rounded-xl border-2 border-dashed text-xs font-semibold transition-all",
                              selectedDayOfWeek === day.id
                                ? "border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                                : "border-slate-100 dark:border-slate-800 text-slate-400"
                            )}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {interval === 'monthly' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2 lg:col-span-3"
                    >
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">يوم الشهر</label>
                      <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setSelectedDayOfMonth(day)}
                            className={cn(
                              "w-10 h-10 rounded-xl border-2 border-dashed text-xs font-semibold transition-all flex items-center justify-center",
                              selectedDayOfMonth === day
                                ? "border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                                : "border-slate-100 dark:border-slate-800 text-slate-400"
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {interval === 'yearly' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-3"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الشهر</label>
                        <select
                          value={selectedMonthOfYear}
                          onChange={(e) => setSelectedMonthOfYear(Number(e.target.value))}
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
                        >
                          {monthsOfYear.map((month, idx) => (
                            <option key={idx} value={idx}>{month}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">اليوم</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={selectedDayOfMonth}
                          onChange={(e) => setSelectedDayOfMonth(Number(e.target.value))}
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الحساب</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">تاريخ البدء</label>
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pr-12 pl-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                    placeholder="مثال: اشتراك نتفليكس..."
                  />
                </div>

                <div className="md:col-span-3 space-y-4">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">طريقة الدفع</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'cash', label: 'نقدي', icon: Wallet },
                      { id: 'card', label: 'بطاقة', icon: CreditCard },
                      { id: 'transfer', label: 'تحويل', icon: ArrowRightLeft }
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all group",
                          paymentMethod === method.id
                            ? "border-primary-500 bg-primary-500/5 text-primary-600 shadow-lg shadow-primary-500/5"
                            : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                          paymentMethod === method.id ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          <method.icon size={20} />
                        </div>
                        <span className="font-semibold text-xs leading-none">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-primary w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 text-base transition-all shadow-md shadow-primary-500/20"
              >
                {editingId ? <Pencil size={20} /> : <RefreshCcw size={20} />}
                {editingId ? 'حفظ التعديلات' : 'إضافة المصروف المتكرر'}
              </motion.button>
            </form>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecurringExpenseForm;
