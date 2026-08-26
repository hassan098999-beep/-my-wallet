import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, X, Calendar, Zap, RefreshCw, Wand2, 
  Lightbulb, Loader2, CheckCircle2, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BudgetPeriod } from '../../types';
import { cn, formatCurrency, hapticFeedback } from '../../utils';

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalBudget: string;
  setGlobalBudget: (val: string) => void;
  overallPeriod: BudgetPeriod;
  setOverallPeriod: (val: BudgetPeriod) => void;
  firstDayOfMonth: number;
  setFirstDayOfMonth?: (day: number) => void;
  rollingBudgetEnabled: boolean;
  setRollingBudgetEnabled: (enabled: boolean) => void;
  currency: string;
  autoAllocate: () => void;
  suggestFromHistory: () => void;
  isGenerating: boolean;
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  isOpen,
  onClose,
  globalBudget,
  setGlobalBudget,
  overallPeriod,
  setOverallPeriod,
  firstDayOfMonth,
  setFirstDayOfMonth,
  rollingBudgetEnabled,
  setRollingBudgetEnabled,
  currency,
  autoAllocate,
  suggestFromHistory,
  isGenerating,
}) => {
  if (!isOpen) return null;

  const isWeekly = overallPeriod === 'weekly';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-tajawal rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sliders size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">إعدادات الميزانية الذكية</h3>
                <p className="text-[10px] text-slate-400 font-medium">ضبط السقف المالي، الدورة، والميزانية المتدحرجة</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
            
            {/* Total Budget Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                سقف الميزانية الإجمالية:
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={globalBudget}
                  onChange={(e) => setGlobalBudget(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-black font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center transition-all"
                  placeholder="0.00"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {currency}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">المبلغ الإجمالي المخصص لكامل مصاريف الدورة</p>
            </div>

            {/* Period Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                دورة الميزانية:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('light');
                    setOverallPeriod('monthly');
                  }}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    !isWeekly ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Calendar size={13} className="text-indigo-500" />
                  <span>شهرية 🗓️</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('light');
                    setOverallPeriod('weekly');
                  }}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    isWeekly ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Zap size={13} className="text-amber-500" />
                  <span>أسبوعية ⚡</span>
                </button>
              </div>
            </div>

            {/* Start Day of the Month */}
            {setFirstDayOfMonth && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  يوم بداية الدورة المالية للشهر:
                </label>
                <select
                  value={firstDayOfMonth}
                  onChange={(e) => {
                    hapticFeedback('light');
                    setFirstDayOfMonth(Number(e.target.value));
                    toast.success(`دورتك المالية ستبدأ يوم ${e.target.value} من كل شهر.`);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>يوم {day} من كل شهر</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">اليوم الذي ينزل فيه الراتب أو يبدأ فيه احتساب ميزانيتك الشهرية</p>
              </div>
            )}

            {/* Rolling Budget Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-indigo-500" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">الميزانية المتدحرجة (Rolling)</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  تكييف الحد اليومي تلقائياً بناءً على ما وفرته أو تجاوزته في الأيام السابقة.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('medium');
                  setRollingBudgetEnabled(!rollingBudgetEnabled);
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                  rollingBudgetEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                    rollingBudgetEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Smart Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">أدوات التوزيع الذكية:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    suggestFromHistory();
                  }}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Lightbulb size={13} />}
                  <span>اقتراح من تاريخك</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    autoAllocate();
                  }}
                  disabled={isGenerating || !globalBudget || parseFloat(globalBudget) <= 0}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                  <span>توزيع ذكي للفئات</span>
                </button>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-150 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black transition-all cursor-pointer shadow-xs"
            >
              تم واعتماد الإعدادات
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
