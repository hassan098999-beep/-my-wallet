import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Calendar, ShieldCheck, Link2, Sparkles, Check, Baby, HeartPulse } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';
import { Category, Goal } from '../../types';
import { hapticFeedback, cn } from '../../utils';
import toast from 'react-hot-toast';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
}

const PRESET_GOALS = [
  { name: 'صندوق طوارئ الأسرة 🛡️', icon: 'Shield', isEmergency: true, defaultTarget: 3000 },
  { name: 'طوارئ وصحة الرضيع 👶', icon: 'Baby', isBaby: true, defaultTarget: 1200 },
  { name: 'صيانة وتأمين السيارة 🚗', icon: 'Car', defaultTarget: 1500 },
  { name: 'عطلة وسفر العائلة ✈️', icon: 'Plane', defaultTarget: 2000 },
  { name: 'مصاريف الأعياد والمناسبات 🎁', icon: 'Gift', defaultTarget: 800 },
];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const { addGoal, updateGoal, categories, currency } = useAppContext();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [linkedCategoryId, setLinkedCategoryId] = useState<string>('');
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [goalPriority, setGoalPriority] = useState<'essential' | 'family' | 'personal'>('personal');
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setName(goalToEdit.name);
        setTargetAmount(goalToEdit.targetAmount.toString());
        setCurrentAmount(goalToEdit.currentAmount.toString());
        setDeadline(goalToEdit.deadline ? goalToEdit.deadline.split('T')[0] : '');
        setLinkedCategoryId(goalToEdit.linkedCategoryId || '');
        const isEmerg = Boolean(goalToEdit.isEmergencyFund);
        setIsEmergencyFund(isEmerg);
        setGoalPriority(goalToEdit.goalPriority || (isEmerg ? 'essential' : 'personal'));
        setMonthlySavingsTarget(goalToEdit.monthlySavingsTarget ? goalToEdit.monthlySavingsTarget.toString() : '');
      } else {
        // Default new goal: 6 months ahead
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 6);
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setDeadline(defaultDate.toISOString().split('T')[0]);
        setLinkedCategoryId('');
        setIsEmergencyFund(false);
        setGoalPriority('personal');
        setMonthlySavingsTarget('');
      }
    }
  }, [isOpen, goalToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم الهدف');
      return;
    }
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      toast.error('يرجى إدخال مبلغ هدف صحيح');
      return;
    }
    const current = parseFloat(currentAmount) || 0;
    const monthlyTarget = monthlySavingsTarget ? parseFloat(monthlySavingsTarget) : undefined;
    const finalIsEmergency = isEmergencyFund || goalPriority === 'essential';

    hapticFeedback('success');

    if (goalToEdit) {
      updateGoal(goalToEdit.id, {
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        deadline: deadline || new Date().toISOString().split('T')[0],
        linkedCategoryId: linkedCategoryId || undefined,
        isEmergencyFund: finalIsEmergency,
        goalPriority,
        monthlySavingsTarget: monthlyTarget,
      });
      toast.success('تم تحديث الهدف الادخاري بنجاح 🎯');
    } else {
      addGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        deadline: deadline || new Date().toISOString().split('T')[0],
        linkedCategoryId: linkedCategoryId || undefined,
        isEmergencyFund: finalIsEmergency,
        goalPriority,
        monthlySavingsTarget: monthlyTarget,
      });
      toast.success('تم إنشاء الهدف الادخاري بنجاح! 🚀');
    }

    onClose();
  };

  const handleSelectPreset = (preset: typeof PRESET_GOALS[0]) => {
    hapticFeedback('light');
    setName(preset.name);
    setTargetAmount(preset.defaultTarget.toString());
    if (preset.isEmergency) {
      setIsEmergencyFund(true);
      setGoalPriority('essential');
    } else if (preset.isBaby) {
      setGoalPriority('family');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {goalToEdit ? 'تعديل الهدف الادخاري' : 'إنشاء هدف ادخاري جديد'}
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">
                  حدد وجهة أموالك وتابع تقدمك خطوة بخطوة
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                hapticFeedback('light');
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Presets (Only on Add) */}
          {!goalToEdit && (
            <div className="mb-4">
              <label className="text-[11px] font-black text-slate-400 mb-2 block">
                أهداف شائعة سريعة (اضغط للملء التلقائي):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_GOALS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-slate-200/50 dark:border-slate-700/50 cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Goal Name */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 block">
                اسم الهدف الادخاري *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: شراء حاسوب جديد، صندوق الطوارئ..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            {/* Target Amount & Initial Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 block">
                  المبلغ المستهدف ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-left"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 block">
                  الرصيد الابتدائي المتوفر ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-left"
                />
              </div>
            </div>

            {/* Target Date & Monthly Contribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 block">
                  تاريخ الإنجاز المستهدف
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pr-9 pl-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 block">
                  القسط الشهري المقترح ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="مثال: 50"
                  value={monthlySavingsTarget}
                  onChange={(e) => setMonthlySavingsTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-left"
                />
              </div>
            </div>

            {/* Goal Priority Selector */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 block">
                أولوية الهدف المالي
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'essential', label: 'ضروري / طارئ', icon: '🚨', desc: 'أولوية قصوى' },
                  { id: 'family', label: 'عائلي مشترك', icon: '👨‍👩‍👧', desc: 'للأسرة' },
                  { id: 'personal', label: 'شخصي / تطويري', icon: '🎯', desc: 'مرن' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      hapticFeedback('light');
                      setGoalPriority(p.id as any);
                      if (p.id === 'essential') setIsEmergencyFund(true);
                      else if (isEmergencyFund && p.id !== 'essential') setIsEmergencyFund(false);
                    }}
                    className={cn(
                      "p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer",
                      goalPriority === p.id
                        ? p.id === 'essential'
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-black shadow-2xs"
                          : p.id === 'family'
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-black shadow-2xs"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <span className="text-base leading-none">{p.icon}</span>
                    <span className="text-[11px] font-bold mt-1">{p.label}</span>
                    <span className="text-[9px] opacity-70">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Category Link */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Link2 size={13} className="text-indigo-500" />
                <span>ربط الهدف بفائض فئة معينة (اختياري)</span>
              </label>
              <select
                value={linkedCategoryId}
                onChange={(e) => setLinkedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
              >
                <option value="">بدون ربط (توفير عام مستقل)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    فائض ميزانية: {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Emergency Checkbox */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between cursor-pointer"
              onClick={() => {
                const next = !isEmergencyFund;
                setIsEmergencyFund(next);
                if (next) setGoalPriority('essential');
              }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">اعتباره صندوق طوارئ وأمان مالي</span>
                  <span className="text-[10px] text-slate-400 font-semibold">يحظى بالأولوية القصوى في التوزيع الذكي للفائض</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEmergencyFund}
                onChange={(e) => {
                  setIsEmergencyFund(e.target.checked);
                  if (e.target.checked) setGoalPriority('essential');
                }}
                className="w-4 h-4 text-emerald-600 rounded-md accent-emerald-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="pt-3 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-black text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={15} />
                <span>{goalToEdit ? 'حفظ التعديلات' : 'إنشاء الهدف الآن'}</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddGoalModal;
