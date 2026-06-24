import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Sparkles, 
  UtensilsCrossed, 
  Baby, 
  House, 
  HeartPulse, 
  Coffee, 
  BusFront 
} from 'lucide-react';
import { Category, Account } from '../types';
import { formatCurrency, cn, hapticFeedback, formatTunisianAmount } from '../utils';

interface TunisianLedgerProps {
  categories: Category[];
  accounts: Account[];
  currency: string;
  quickAmount: string;
  setQuickAmount: (v: string) => void;
  quickCategoryId: string;
  setQuickCategoryId: (v: string) => void;
  quickDescription: string;
  setQuickDescription: (v: string) => void;
  quickSubcategory: string;
  setQuickSubcategory: (v: string) => void;
  quickAccountId: string;
  setQuickAccountId: (v: string) => void;
  handleQuickAddSubmit: (e: React.FormEvent) => void;
}

const TunisianLedger: React.FC<TunisianLedgerProps> = ({
  categories,
  accounts,
  currency,
  quickAmount,
  setQuickAmount,
  quickCategoryId,
  setQuickCategoryId,
  quickDescription,
  setQuickDescription,
  quickSubcategory,
  setQuickSubcategory,
  quickAccountId,
  setQuickAccountId,
  handleQuickAddSubmit
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 md:p-6 rounded-3xl border border-slate-200/55 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md shadow-sm relative overflow-hidden text-right space-y-5"
      dir="rtl"
    >
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Title & Account Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5 text-right">
          <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-450 text-[9px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full">
            تسجيل سريع فوري في ثانية ثانية
          </span>
          <h3 className="text-md font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5 justify-end">
            <span>الدفتر العائلي للتسجيل السريع لمصروف البيت</span>
            <Sparkles className="text-amber-500 size-4" />
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            اختر أحد الأزرار الجاهزة للمصاريف اليومية، أو أدخل مبلغاً مخصصاً واضغط لحفظه فورياً دون مغادرة اللوحة.
          </p>
        </div>
        
        {/* Account Selection Pills */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end w-full sm:w-auto">
            <span className="text-[9px] font-bold text-slate-400 self-center ml-1">الدفع من:</span>
            {accounts.map(acc => {
              const isSelected = quickAccountId === acc.id;
              return (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => { hapticFeedback('light'); setQuickAccountId(acc.id); }}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[9px] font-black transition-all cursor-pointer border",
                    isSelected 
                      ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950"
                      : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                  )}
                >
                  {acc.name} ({formatCurrency(acc.balance, currency)})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Ready Tunisian Presets */}
      <div className="space-y-2">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right">نفقات متكررة مسبقة الضبط (اضغط للتعبئة وحفظ المعاملة فوراً)</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'قفة الخضار واللحم', amount: '25', desc: 'قضية من السوق الأسبوعي', categoryName: 'قضية السوق والقفة', icon: UtensilsCrossed, color: 'hover:border-emerald-500/30 hover:bg-emerald-500/5' },
            { label: 'كوش וחليب للبيبي', amount: '52', desc: 'مشتريات الصيدلية للرضيع', categoryName: 'لوازم ومصروف الرضيع', icon: Baby, color: 'hover:border-blue-500/30 hover:bg-blue-500/5' },
            { label: 'فاتورة ضوء ستاغ', amount: '65', desc: 'فاتورة STEG', categoryName: 'البيت والفواتير', icon: House, color: 'hover:border-amber-500/30 hover:bg-amber-500/5' },
            { label: 'فيزيتا طبيب الأطفال', amount: '50', desc: 'عيادة الطبيب وتلاقيح الرعاية الصحة', categoryName: 'صحة وطبيب الأطفال', icon: HeartPulse, color: 'hover:border-rose-500/30 hover:bg-rose-500/5' },
            { label: 'قهوة سريعة وشاي', amount: '4.5', desc: 'قهوة ومقهى فنجان', categoryName: 'ترفيه ومقهى ومواسم', icon: Coffee, color: 'hover:border-indigo-500/30 hover:bg-indigo-500/5' },
            { label: 'أجرة نقل أو لواج', amount: '12', desc: 'مواصلات أو وقود سيارة لواج', categoryName: 'نقل وتنقل', icon: BusFront, color: 'hover:border-purple-500/30 hover:bg-purple-500/5' },
          ].map((preset, index) => {
            const Icon = preset.icon;
            return (
              <button
                type="button"
                key={index}
                onClick={() => {
                  hapticFeedback('medium');
                  setQuickAmount(preset.amount);
                  setQuickDescription(preset.label);
                  setQuickSubcategory(preset.desc);
                  const matchingCat = categories.find(c => c.name.includes(preset.categoryName));
                  if (matchingCat) {
                    setQuickCategoryId(matchingCat.id);
                  }
                }}
                className={cn(
                  "p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-right flex flex-col justify-between space-y-1.5 transition-all text-ellipsis overflow-hidden duration-250 cursor-pointer hover:scale-102 hover:shadow-xs",
                  preset.color
                )}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-mono font-black text-slate-800 dark:text-slate-200">{preset.amount} د.ت</span>
                  <Icon size={12} className="text-slate-400" />
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none truncate">{preset.label}</p>
                  <p className="text-[8px] text-slate-400 font-bold truncate">{preset.categoryName}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form panel for details edit & instant save */}
      <form onSubmit={handleQuickAddSubmit} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        
        {/* Amount field (3 cols) */}
        <div className="space-y-1.5 md:col-span-3 text-right">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right">المبلغ (د.ت)</label>
          <input
            type="text"
            inputMode="decimal"
            required
            placeholder="مثال: 15.500"
            value={quickAmount}
            onChange={(e) => setQuickAmount(formatTunisianAmount(e.target.value))}
            onFocus={(e) => {
              if (!quickAmount || quickAmount === '0' || quickAmount === '0.000' || parseFloat(quickAmount) === 0) {
                setQuickAmount('');
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
              if (!quickAmount || quickAmount === '0' || quickAmount === '0.000' || parseFloat(quickAmount) === 0) {
                setQuickAmount('');
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
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-right"
          />
        </div>

        {/* Description field (3 cols) */}
        <div className="space-y-1.5 md:col-span-3 text-right">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right">البيان / الوصف</label>
          <input
            type="text"
            placeholder="مثال: قضية خضار"
            value={quickDescription}
            onChange={(e) => setQuickDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-right"
          />
        </div>

        {/* Category selection field (3 cols) */}
        <div className="space-y-1.5 md:col-span-3 text-right">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-right">التصنيف</label>
          <select
            value={quickCategoryId}
            onChange={(e) => {
              hapticFeedback('light');
              setQuickCategoryId(e.target.value);
            }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-right"
          >
            <option value="" disabled>اختر فئة...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Button Submit (3 cols) */}
        <div className="md:col-span-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white dark:text-slate-950 dark:bg-primary-450 dark:hover:bg-primary-350 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer h-10"
          >
            <Plus size={14} />
            <span>تسجيل فوري للمصروف</span>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default TunisianLedger;
