import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { DynamicIcon } from '../DynamicIcon';
import { PaymentMethod, Category, Account } from '../../types';

interface AddExpenseFormProps {
  type: 'expense' | 'income' | 'transfer';
  expression: string;
  setExpression: (val: string) => void;
  handleAmountChange: (val: string) => void;
  handleSpeedAdd: (val: number) => void;
  currency: string;
  categories: Category[];
  categoryId: string;
  setCategoryId: (id: string) => void;
  subcategoryId: string;
  setSubcategoryId: (sub: string) => void;
  selectedCategory: Category | undefined;
  source: string;
  setSource: (src: string) => void;
  accounts: Account[];
  accountId: string;
  setAccountId: (id: string) => void;
  toAccountId: string;
  setToAccountId: (id: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  date: string;
  setDate: (d: string) => void;
  note: string;
  setNote: (n: string) => void;
  isAutoMatched: boolean;
  handleSelectShortcut: (amount: number, noteText: string, searchKey: string) => void;
  currentCategoryBudgetInsight: {
    limit: number;
    spentThisMonth: number;
    remainingBefore: number;
    remainingAfter: number;
    enteredAmount: number;
  } | null;
  handleSubmit: () => void;
  loading: boolean;
}

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  type,
  expression,
  setExpression,
  handleAmountChange,
  handleSpeedAdd,
  currency,
  categories,
  categoryId,
  setCategoryId,
  subcategoryId,
  setSubcategoryId,
  selectedCategory,
  source,
  setSource,
  accounts,
  accountId,
  setAccountId,
  toAccountId,
  setToAccountId,
  paymentMethod,
  setPaymentMethod,
  date,
  setDate,
  note,
  setNote,
  isAutoMatched,
  handleSelectShortcut,
  currentCategoryBudgetInsight,
  handleSubmit,
  loading,
}) => {
  return (
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
  );
};
