import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Target, 
  Sparkles, 
  Calendar, 
  Coffee, 
  ShieldCheck, 
  UtensilsCrossed, 
  ShoppingBag, 
  Flame, 
  PiggyBank, 
  Award,
  Check
} from 'lucide-react';
import { WeeklyChallengeType } from '../../types';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, hapticFeedback } from '../../utils';
import toast from 'react-hot-toast';

interface CreateCustomChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (custom: {
    title: string;
    description: string;
    type: WeeklyChallengeType;
    icon: string;
    rewardPoints: number;
    estimatedSavingTND: number;
    targetDays: number;
    targetSpendCap?: number;
    targetCategoryId?: string;
    targetCategoryName?: string;
    tips?: string[];
  }) => void;
}

const AVAILABLE_ICONS = [
  { id: 'Target', label: 'هدف عام', icon: Target },
  { id: 'Coffee', label: 'مقهى وقهوة', icon: Coffee },
  { id: 'ShieldCheck', label: 'درع توفير', icon: ShieldCheck },
  { id: 'UtensilsCrossed', label: 'طعام ومطاعم', icon: UtensilsCrossed },
  { id: 'ShoppingBag', label: 'تسوق وقفة', icon: ShoppingBag },
  { id: 'Flame', label: 'انضباط ونار', icon: Flame },
  { id: 'PiggyBank', label: 'حصالة وفكة', icon: PiggyBank },
  { id: 'Award', label: 'وسام شرف', icon: Award }
];

export const CreateCustomChallengeModal: React.FC<CreateCustomChallengeModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const { categories, currency } = useAppContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WeeklyChallengeType>('custom');
  const [selectedIcon, setSelectedIcon] = useState('Target');
  const [targetDays, setTargetDays] = useState(7);
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [targetSpendCap, setTargetSpendCap] = useState<string>('');
  const [estimatedSaving, setEstimatedSaving] = useState<string>('30');
  const [rewardPoints, setRewardPoints] = useState<number>(45);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('يرجى كتابة اسم التحدي الأسبوعي');
      return;
    }

    const selectedCategory = categories.find(c => c.id === targetCategoryId);

    onCreate({
      title: title.trim(),
      description: description.trim() || 'تحدي أسبوعي مخصص لتحسين الانضباط المالي.',
      type,
      icon: selectedIcon,
      rewardPoints: Number(rewardPoints) || 40,
      estimatedSavingTND: Number(estimatedSaving) || 25,
      targetDays: Number(targetDays) || 7,
      targetSpendCap: targetSpendCap ? Number(targetSpendCap) : undefined,
      targetCategoryId: targetCategoryId || undefined,
      targetCategoryName: selectedCategory?.name,
      tips: [
        'سجل مصاريفك بانتظام وتابع مؤشر التقدم اليومي.',
        'احتفل بكل يوم تلتزم فيه بالهدف المحدد.'
      ]
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Target size={22} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  إنشاء تحدي مالي أسبوعي مخصص
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  حدد قواعد التحدي الخاص بك لأيام الأسبوع الحالي
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Challenge Title */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                اسم التحدي <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: أسبوع بدون تسوق إلكتروني / تحدي 3 أيام صفر مصاريف"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                وصف التحدي والهدف
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="اشرح باختصار ما الذي تهدف للالتزام به طوال أيام الأسبوع..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                اختر أيقونة التحدي
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_ICONS.map(item => {
                  const IconComp = item.icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        setSelectedIcon(item.id);
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <IconComp size={20} />
                      <span className="text-[10px] font-bold truncate max-w-full">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Category (Optional) */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                ربط بفئة مصروفات معينة (اختياري)
              </label>
              <select
                value={targetCategoryId}
                onChange={e => setTargetCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">كافة المصاريف (تحدي شامل)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Numeric Targets (Grid) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  الأيام المستهدفة (من 7)
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={targetDays}
                  onChange={e => setTargetDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  سقف الصرف (إن وجد)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="0 للمنع التام"
                  value={targetSpendCap}
                  onChange={e => setTargetSpendCap(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Estimated Saving & Reward Points */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  الوفر المتوقع ({currency})
                </label>
                <input
                  type="number"
                  value={estimatedSaving}
                  onChange={e => setEstimatedSaving(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  نقاط المكافأة 🌟
                </label>
                <input
                  type="number"
                  value={rewardPoints}
                  onChange={e => setRewardPoints(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                تفعيل التحدي المخصص للأسبوع
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
