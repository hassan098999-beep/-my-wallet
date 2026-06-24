import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store/AppContext';
import { X, Baby, HeartPulse, Check, Sparkles, Coins, HelpCircle } from 'lucide-react';
import { formatCurrency, hapticFeedback } from '../utils';
import toast from 'react-hot-toast';

interface BabySavingTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BabySavingTargetModal: React.FC<BabySavingTargetModalProps> = ({ isOpen, onClose }) => {
  const { goals, addGoal, updateGoal, currency } = useAppContext();

  // Find the 'Baby Health & Emergency' goal if it exists
  const babyGoal = goals?.find(g => 
    g.name.toLowerCase().includes('baby health') || 
    g.name.includes('طوارئ وصحة الرضيع') || 
    g.name.includes('الرضيع والصحة') ||
    g.name.includes('صندوق طوارئ وصحة الرضيع')
  );

  const [monthlyTarget, setMonthlyTarget] = useState<string>('50');
  const [overallTarget, setOverallTarget] = useState<string>('1000');
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (babyGoal) {
        setMonthlyTarget(babyGoal.monthlySavingsTarget?.toString() || '50');
        setOverallTarget(babyGoal.targetAmount.toString());
      } else {
        setMonthlyTarget('50');
        setOverallTarget('1000');
      }
    }
  }, [isOpen, babyGoal]);

  const handleSave = () => {
    hapticFeedback('success');
    const monthlyNum = parseFloat(monthlyTarget);
    const overallNum = parseFloat(overallTarget);

    if (isNaN(monthlyNum) || monthlyNum <= 0) {
      toast.error('الرجاء إدخال مبلغ ادخار شهري صالح وموجب');
      return;
    }

    if (isNaN(overallNum) || overallNum <= 0) {
      toast.error('الرجاء إدخال مبلغ إجمالي مستهدف صالح وموجب');
      return;
    }

    if (babyGoal) {
      updateGoal(babyGoal.id, {
        monthlySavingsTarget: monthlyNum,
        targetAmount: overallNum,
      });
      toast.success('تم تحديث أهداف ادخار الرضيع بنجاح! 👶✨');
    } else {
      // Create new goal linked to health category if category ID 5 matches (صحة وطبيب الأطفال)
      addGoal({
        name: 'طوارئ وصحة الرضيع (Baby Health & Emergency)',
        targetAmount: overallNum,
        currentAmount: 0,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        linkedCategoryId: '5', // Health & pediatrics category
        monthlySavingsTarget: monthlyNum,
      });
      toast.success('تم تفعيل صندوق طوارئ وصحة الرضيع بنجاح! 🎯🍼');
    }
    onClose();
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 15,
      transition: { duration: 0.15, ease: "easeInOut" }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden relative z-10"
          dir="rtl"
        >
          {/* Top Decorative Header Block with gradient background and Baby Icon */}
          <div className="bg-gradient-to-br from-indigo-500 via-primary-500 to-cyan-500 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/10 rounded-full blur-xl -ml-6 -mb-6" />
            
            <button 
              onClick={onClose}
              className="absolute left-4 top-4 p-2 hover:bg-white/10 active:scale-95 rounded-full transition-all text-white/80 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mx-auto w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-3 border border-white/20 shadow-inner">
              <Baby size={32} className="animate-pulse" />
            </div>

            <h3 className="text-base md:text-lg font-black tracking-tight leading-snug">صندوق طوارئ وصحة الرضيع</h3>
            <p className="text-[10px] md:text-xs text-indigo-100 font-medium max-w-xs mx-auto mt-1">
              الادخار الموجه لحفظة العائلة وصحة طفلكم الرضيع لضمان حياة مستقرة ودعم فوري عند الحاجة.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-5 md:p-6 space-y-5">
            {/* Advice Callout Box */}
            <div className="bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 border border-cyan-500/10 rounded-2xl p-3.5 flex gap-3 text-right">
              <span className="text-xl shrink-0">🍼</span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">لماذا هذا الصندوق مهم؟</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  الرضيع يحتاج رعاية صحية دورية ومفاجئة (تلاقيح، مصاريف فيزيتا الطبيب، حليب خاص في الصيدلية، حفاضات الكوش). الادخار الشهري المخصص يحمي العائلة التونسية الشابة من غلاء الفواتير والضغوط.
                </p>
              </div>
            </div>

            {/* Field 1: Target Monthly Savings Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins size={14} className="text-primary-500" />
                  مبلغ الادخار الشهري المستهدف
                </label>
                <button 
                  type="button"
                  onClick={() => setIsTooltipOpen(!isTooltipOpen)} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <HelpCircle size={14} />
                </button>
              </div>

              {isTooltipOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-[9px] font-bold text-slate-400 leading-normal"
                >
                  المعدل المقترح للعائلة التونسية هو ما بين 50 د.ت و 100 د.ت لتأمين مصاريف طبيب الأطفال والحماية الصحية الكاملة بشكل منتظم.
                </motion.div>
              )}

              <div className="relative group">
                <input
                  type="number"
                  inputMode="decimal"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  onFocus={(e) => {
                    if (!monthlyTarget || monthlyTarget === '0' || parseFloat(monthlyTarget) === 0) {
                      setMonthlyTarget('');
                    } else {
                      e.target.select();
                    }
                  }}
                  onClick={(e) => {
                    if (!monthlyTarget || monthlyTarget === '0' || parseFloat(monthlyTarget) === 0) {
                      setMonthlyTarget('');
                    } else {
                      (e.target as HTMLInputElement).select();
                    }
                  }}
                  className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800/80 rounded-2xl text-slate-900 dark:text-white font-black text-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono shadow-inner"
                  dir="ltr"
                  placeholder="50"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-black text-xs">
                  {currency}
                </span>
              </div>

              {/* Quick Presets for Monthly Target */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['20', '50', '80', '120'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { hapticFeedback('light'); setMonthlyTarget(amt); }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                      monthlyTarget === amt
                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/20'
                    }`}
                  >
                    {amt} د.ت / شهر
                  </button>
                ))}
              </div>
            </div>

            {/* Field 2: Total Cushion Target Amount */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <HeartPulse size={14} className="text-cyan-500" />
                رصيد الأمان الإجمالي المستهدف للصندوق
              </label>

              <div className="relative group">
                <input
                  type="number"
                  inputMode="decimal"
                  value={overallTarget}
                  onChange={(e) => setOverallTarget(e.target.value)}
                  onFocus={(e) => {
                    if (!overallTarget || overallTarget === '0' || parseFloat(overallTarget) === 0) {
                      setOverallTarget('');
                    } else {
                      e.target.select();
                    }
                  }}
                  onClick={(e) => {
                    if (!overallTarget || overallTarget === '0' || parseFloat(overallTarget) === 0) {
                      setOverallTarget('');
                    } else {
                      (e.target as HTMLInputElement).select();
                    }
                  }}
                  className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800/80 rounded-2xl text-slate-900 dark:text-white font-black text-lg outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all font-mono shadow-inner"
                  dir="ltr"
                  placeholder="1000"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-black text-xs">
                  {currency}
                </span>
              </div>

              {/* Quick Presets for Overall Target */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['300', '500', '1000', '1500'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { hapticFeedback('light'); setOverallTarget(amt); }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                      overallTarget === amt
                        ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-500/20'
                    }`}
                  >
                    كاش {amt} د.ت
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button Block */}
            <div className="pt-4 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15"
              >
                <Check size={16} />
                <span>{babyGoal ? 'حفظ التحديثات' : 'تفعيل الصندوق الآن'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="py-3 px-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black text-xs"
              >
                إلغاء
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BabySavingTargetModal;
