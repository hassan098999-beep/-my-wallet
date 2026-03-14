import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency } from '../utils';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Trash2, Repeat, Calendar, CreditCard, Wallet, ArrowRightLeft, AlertCircle, Clock, X } from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';
import { PaymentMethod, RecurringInterval } from '../types';
import { CategorySelect } from '../components/CategorySelect';
import { motion, AnimatePresence } from 'motion/react';

const RecurringExpenses = () => {
  const { recurringExpenses, categories, currency, addRecurringExpense, deleteRecurringExpense } = useAppContext();

  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [interval, setInterval] = useState<RecurringInterval>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const intervalLabels: Record<RecurringInterval, string> = {
    daily: 'يومياً',
    weekly: 'أسبوعياً',
    monthly: 'شهرياً',
    yearly: 'سنوياً'
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    addRecurringExpense({
      amount: Number(amount),
      categoryId: categoryId || categories[0]?.id,
      subcategoryId: subcategoryId || undefined,
      note,
      paymentMethod,
      interval,
      startDate,
      nextDate: startDate,
    });

    setAmount('');
    setNote('');
    setSubcategoryId('');
    setIsAdding(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-8 max-w-5xl mx-auto pb-12"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 px-2">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
            المصاريف <span className="text-primary-500">المتكررة</span>
          </h1>
          <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            أتمتة مصاريفك الدورية لتوفير الوقت والجهد
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-black text-[9px] md:text-xs transition-all shadow-lg",
            isAdding 
              ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400" 
              : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"
          )}
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          <span>{isAdding ? 'إلغاء' : 'إضافة مصروف متكرر'}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-white/40 dark:bg-slate-900/20 backdrop-blur-3xl p-3 md:p-5 rounded-xl md:rounded-2xl border-2 border-dashed border-primary-500/30 shadow-xl shadow-primary-500/5">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                  <Plus size={16} />
                </div>
                <h2 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">إضافة مصروف متكرر جديد</h2>
              </div>

              <form onSubmit={handleAdd} className="space-y-3 md:space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                  <div className="space-y-1">
                    <label className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary-500 rounded-full animate-pulse"></div>
                      المبلغ ({currency})
                    </label>
                    <div className="relative group">
                      <input
                        type="number"
                        step="0.001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 md:pl-9 md:pr-4 md:py-2.2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono font-black text-sm md:text-base"
                        placeholder="0.000"
                        required
                      />
                      <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-primary-500 text-[9px] md:text-[10px] font-black font-mono">{currency}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                      الفئة
                    </label>
                    <CategorySelect
                      categories={categories}
                      selectedId={categoryId}
                      onChange={(id) => {
                        setCategoryId(id);
                        setSubcategoryId('');
                      }}
                      className="!h-[36px] md:!h-[42px]"
                    />
                  </div>

                  {categories.find(c => c.id === categoryId)?.subcategories && categories.find(c => c.id === categoryId)!.subcategories!.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1">
                        <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                        التصنيف الفرعي
                      </label>
                      <select
                        value={subcategoryId}
                        onChange={(e) => setSubcategoryId(e.target.value)}
                        className="w-full px-3 py-2 md:px-4 md:py-2.2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-black text-[9px] md:text-xs appearance-none"
                      >
                        <option value="">اختر تصنيفاً فرعياً (اختياري)</option>
                        {categories.find(c => c.id === categoryId)?.subcategories?.map((sub, idx) => (
                          <option key={idx} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                      دورة التكرار
                    </label>
                    <div className="relative group">
                      <Repeat className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors size-3" />
                      <select
                        value={interval}
                        onChange={(e) => setInterval(e.target.value as RecurringInterval)}
                        className="w-full pr-8 md:pr-10 pl-3 md:pl-4 py-2 md:py-2.2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none appearance-none font-black text-[9px] md:text-xs uppercase tracking-widest"
                      >
                        <option value="daily">يومياً</option>
                        <option value="weekly">أسبوعياً</option>
                        <option value="monthly">شهرياً</option>
                        <option value="yearly">سنوياً</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                      تاريخ البدء
                    </label>
                    <div className="relative group">
                      <Calendar className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors size-3" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pr-8 md:pr-10 pl-3 md:pl-4 py-2 md:py-2.2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-mono font-black text-[9px] md:text-xs tracking-widest"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                      ملاحظة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 md:px-4 md:py-2.2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold text-[9px] md:text-xs"
                      placeholder="مثال: اشتراك نتفليكس، فاتورة الكهرباء..."
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                      طريقة الدفع
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
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
                            "flex items-center gap-2 md:gap-3 p-2 md:p-2 rounded-xl border-2 border-dashed transition-all group",
                            paymentMethod === method.id
                              ? "border-primary-500 bg-primary-500/5 text-primary-600 shadow-md"
                              : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                            paymentMethod === method.id ? "bg-primary-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                          )}>
                            <method.icon size={14} />
                          </div>
                          <span className="font-black text-[9px] md:text-[10px] uppercase tracking-widest">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-2.5 md:py-3 rounded-xl transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-95 text-xs md:text-sm uppercase tracking-widest"
                >
                  <Repeat size={16} />
                  إضافة المصروف المتكرر
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 md:space-y-4 px-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
            <Clock size={14} md:size={16} />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">قائمة المصاريف المتكررة</h3>
            <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest">إدارة وجدولة مدفوعاتك الدورية</p>
          </div>
        </div>
        
        {recurringExpenses && recurringExpenses.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:gap-3">
            {recurringExpenses.map(expense => {
              const category = categories.find(c => c.id === expense.categoryId);
              return (
                <motion.div 
                  key={expense.id} 
                  variants={itemVariants}
                  whileHover={{ y: -1 }}
                  className="group bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-2.5 md:p-3 rounded-xl border border-white/40 dark:border-slate-800/40 shadow-sm hover:border-primary-500/30 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row gap-2 md:gap-4 items-start lg:items-center">
                    {/* Category Info */}
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-full lg:min-w-[200px]">
                      <div 
                        className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300" 
                        style={{ backgroundColor: category?.color || '#ccc' }}
                      >
                        {category?.icon ? (
                          <DynamicIcon name={category.icon} className="size-[16px] md:size-[18px]" />
                        ) : (
                          <span className="text-[10px] md:text-xs font-black">{category?.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[150px]">
                          {expense.note || (expense.subcategoryId ? `${category?.name} - ${expense.subcategoryId}` : category?.name)}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[6px] md:text-[8px] font-black text-primary-500 uppercase tracking-widest bg-primary-500/10 px-1 py-0.5 rounded-md">
                            {category?.name}
                          </span>
                          <span className="text-[6px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            {expense.paymentMethod === 'cash' ? 'نقدي' : expense.paymentMethod === 'card' ? 'بطاقة' : 'تحويل'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Schedule Info */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 w-full">
                      <div className="space-y-0.5">
                        <span className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest block">دورة التكرار</span>
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                          <Repeat size={10} className="text-primary-500" />
                          <span className="text-[9px] md:text-[10px] font-black">{intervalLabels[expense.interval]}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <span className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest block">الدفعة القادمة</span>
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                          <Calendar size={10} className="text-primary-500" />
                          <span className="text-[9px] md:text-[10px] font-black font-mono tracking-tight">
                            {format(parseISO(expense.nextDate), 'dd MMM yyyy', { locale: ar })}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5 hidden sm:block">
                        <span className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest block">طريقة الدفع</span>
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                          {expense.paymentMethod === 'cash' ? <Wallet size={10} className="text-emerald-500" /> : 
                           expense.paymentMethod === 'card' ? <CreditCard size={10} className="text-blue-500" /> : 
                           <ArrowRightLeft size={10} className="text-indigo-500" />}
                          <span className="text-[9px] md:text-[10px] font-black">
                            {expense.paymentMethod === 'cash' ? 'نقدي' : expense.paymentMethod === 'card' ? 'بطاقة' : 'تحويل'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-3 md:gap-4 pt-1.5 md:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <span className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">المبلغ</span>
                        <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tighter font-mono">
                          {formatCurrency(expense.amount, currency)}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا المصروف المتكرر؟')) {
                            deleteRecurringExpense(expense.id);
                          }
                        }}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        title="حذف"
                      >
                        <Trash2 size={12} md:size={14} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 md:py-12 bg-white/40 dark:bg-slate-900/20 backdrop-blur-3xl rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 text-slate-400">
              <Repeat size={24} md:size={32} />
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">لا توجد مصاريف متكررة</h3>
            <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-medium max-w-[180px] md:max-w-xs mx-auto">قم بإضافة مصاريفك الثابتة (مثل الإيجار أو الاشتراكات) ليتم تسجيلها تلقائياً</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RecurringExpenses;
