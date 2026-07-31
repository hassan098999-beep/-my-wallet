import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Baby, Sparkles, CalendarDays, HeartPulse, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, hapticFeedback, getBudgetMonth, getBudgetRange } from '../../utils';
import { parseISO } from 'date-fns';

interface BabySavingsTrackerProps {
  setIsBabyModalOpen: (open: boolean) => void;
  itemVariants?: any;
}

export const BabySavingsTracker: React.FC<BabySavingsTrackerProps> = ({
  setIsBabyModalOpen,
  itemVariants,
}) => {
  const { goals, income, currency, firstDayOfMonth, updateGoal } = useAppContext();

  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  const babyGoal = useMemo(() => {
    return (goals || []).find(g => 
      g.name.toLowerCase().includes('baby health') || 
      g.name.includes('طوارئ وصحة الرضيع') || 
      g.name.includes('الرضيع والصحة') ||
      g.name.includes('صندوق طوارئ وصحة الرضيع')
    );
  }, [goals]);

  const babyMonthlyTarget = babyGoal?.monthlySavingsTarget || 50;

  const monthlyBabyContribution = useMemo(() => {
    if (!babyGoal) return 0;
    return income
      .filter(i => i.goalId === babyGoal.id && i.date && parseISO(i.date) >= monthStart && parseISO(i.date) <= monthEnd)
      .reduce((sum, i) => sum + i.amount, 0);
  }, [income, babyGoal, monthStart, monthEnd]);

  const handleQuickContributeBaby = async () => {
    if (!babyGoal) return;
    const amountToSave = babyGoal.monthlySavingsTarget || 50;
    hapticFeedback('success');
    
    await updateGoal(babyGoal.id, {
      currentAmount: babyGoal.currentAmount + amountToSave
    });
    
    toast.success(`تم تحويل ${formatCurrency(amountToSave, currency)} بنجاح لحصالة طوارئ البيبي! 👶🍼`);
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="mt-6 border border-indigo-100 dark:border-indigo-950/40 rounded-3xl bg-gradient-to-br from-indigo-50/20 via-white to-cyan-50/10 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/30 p-5 md:p-6 shadow-sm overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -ml-6 -mt-6 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-8 -mb-8 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/10 shrink-0">
            <Baby size={22} className="shrink-0" />
          </div>
          <div className="text-right">
            <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              توفير الرضيع والصحة 👶
              <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[8px] font-black px-1.5 py-0.5 rounded-full">خاص بالعائلة</span>
            </h3>
            <p className="text-[9px] text-slate-400 font-bold">صندوق الأمان ووقاية الرضيع من التكاليف الطبية واللوازم العاجلة</p>
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { hapticFeedback('light'); setIsBabyModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-[10px] md:text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-all shadow-md shadow-indigo-500/10"
          >
            <span>ضبط الهدف والمبلغ الشهري</span>
          </motion.button>
        </div>
      </div>

      {!babyGoal ? (
        <div className="p-6 bg-slate-50/80 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 relative z-10">
          <p className="text-xs font-black text-slate-600 dark:text-slate-400">صندوق طوارئ وصحة الرضيع (Baby Health & Emergency) غير مفعّل حالياً في الأهداف.</p>
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto font-medium">تنشيط هذا الهدف يساعدك في جدولة ادخار ثابت لتأمين حفاظات وحليب الرضيع، وتكلفة فيزيتا طبيب الأطفال والتلاقيح دون أعباء مفاجئة.</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { hapticFeedback('medium'); setIsBabyModalOpen(true); }}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black text-[10px] md:text-xs rounded-xl shadow-md inline-flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>تنشيط صندوق الرضيع الآن 🍼</span>
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10" dir="rtl">
          {/* Monthly Savings Target Tracker */}
          <div className="p-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between space-y-4 shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <CalendarDays size={13} />
                  تتبع الادخار الشهري للرضيع
                </span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {Math.min(100, Math.round((monthlyBabyContribution / babyMonthlyTarget) * 100))}%
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mb-3">مستهدف التوفير لهذا الشهر لعلاج البيبي ومستلزماته وعيشه السليم</p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (monthlyBabyContribution / babyMonthlyTarget) * 100)}%` }}
                  className="h-full bg-gradient-to-l from-indigo-500 to-indigo-600 rounded-full"
                />
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">المُدخر هذا الشهر</p>
                <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-none font-mono">
                  {formatCurrency(monthlyBabyContribution, currency)} <span className="text-xs text-slate-400 font-bold">/ {formatCurrency(babyMonthlyTarget, currency)}</span>
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleQuickContributeBaby}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-black text-[10px] flex items-center gap-1 transition-all border border-indigo-100/30 font-sans"
              >
                <Coins size={12} />
                <span>ادخار سريع (+{formatCurrency(babyMonthlyTarget, currency)})</span>
              </motion.button>
            </div>
          </div>

          {/* Overall Cushion Target Tracker */}
          <div className="p-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between space-y-4 shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                  <HeartPulse size={13} />
                  رصيد الأمان التراكمي الإجمالي
                </span>
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {Math.min(100, Math.round((babyGoal.currentAmount / babyGoal.targetAmount) * 100))}%
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mb-3">الحصالة التراكمية الكلية لحماية صحة طفلك الرضيع ضد الأزمات</p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (babyGoal.currentAmount / babyGoal.targetAmount) * 100)}%` }}
                  className="h-full bg-gradient-to-l from-cyan-500 to-cyan-600 rounded-full"
                />
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">الرصيد التراكمي حالياً</p>
              <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-none font-mono">
                {formatCurrency(babyGoal.currentAmount, currency)} <span className="text-xs text-slate-400 font-bold">/ {formatCurrency(babyGoal.targetAmount, currency)}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BabySavingsTracker;
