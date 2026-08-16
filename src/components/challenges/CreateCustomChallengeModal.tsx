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
  Check,
  Sandwich,
  TrendingUp,
  Footprints,
  FileCheck,
  Zap,
  Soup
} from 'lucide-react';
import { WeeklyChallengeType, ChallengeCategory } from '../../types';
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
    category?: ChallengeCategory;
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
  { id: 'Sandwich', label: 'ساندويتش وطعام', icon: Sandwich },
  { id: 'ShieldCheck', label: 'درع توفير', icon: ShieldCheck },
  { id: 'UtensilsCrossed', label: 'طبخ ومطاعم', icon: UtensilsCrossed },
  { id: 'TrendingUp', label: 'سلم وتصاعد', icon: TrendingUp },
  { id: 'Footprints', label: 'مشي ونقل', icon: Footprints },
  { id: 'ShoppingBag', label: 'تسوق وقفة', icon: ShoppingBag },
  { id: 'FileCheck', label: 'قائمة ومشتريات', icon: FileCheck },
  { id: 'Flame', label: 'انضباط ونار', icon: Flame },
  { id: 'Zap', label: 'طاقة وفواتير', icon: Zap },
  { id: 'Soup', label: 'طبخة بيت', icon: Soup },
  { id: 'PiggyBank', label: 'حصالة وفكة', icon: PiggyBank },
  { id: 'Award', label: 'وسام شرف', icon: Award }
];

const PRESETS = [
  {
    title: 'أسبوع الفواكه الموسمية 🍎',
    desc: 'شراء غلال موسمية محلية فقط بسقف اقتصادي وتجنب المستوردات الباهظة',
    icon: 'ShoppingBag',
    type: 'shopping_saving' as ChallengeCategory,
    saving: 25,
    points: 40,
    days: 7
  },
  {
    title: 'تحدي مقاطعة المشروبات الغازية 🥤',
    desc: 'استبدال المشروبات الغازية والعصائر المصنعة بالماء والشاي الأخضر',
    icon: 'ShieldCheck',
    type: 'daily_habits' as ChallengeCategory,
    saving: 30,
    points: 50,
    days: 7
  },
  {
    title: 'أسبوع صيانة وترشيد البيت 🔧',
    desc: 'إصلاح الأغراض البسيطة بالمنزل بدل استبدالها وترشيد الاستهلاك',
    icon: 'Zap',
    type: 'family_home' as ChallengeCategory,
    saving: 45,
    points: 60,
    days: 7
  }
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

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    hapticFeedback('light');
    setTitle(p.title);
    setDescription(p.desc);
    setSelectedIcon(p.icon);
    setEstimatedSaving(p.saving.toString());
    setRewardPoints(p.points);
    setTargetDays(p.days);
  };

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Target size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  ابتكار تحدي مالي مخصص 🎯
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  صمم تحدياً مالياً أسبوعياً يلائم عاداتك وأهدافك الشخصية
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="my-4">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              أفكار جاهزة سريعة للإلهام:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-800/50 text-right transition-all hover:scale-102 active:scale-98"
                >
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {p.title}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                    وفر ~{p.saving} د.ت
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                عنوان التحدي *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: أسبوع بدون أكلات سريعة 🍔"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                وصف التحدي وقواعده
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وضح الهدف من التحدي وكيف ستحققه هذا الأسبوع..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none font-medium"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-2">
                أيقونة التحدي
              </label>
              <div className="grid grid-cols-7 gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSel = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isSel
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                      title={item.label}
                    >
                      <IconComp size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Category & Spend Cap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                  ربط بفئة مصروفات (اختياري)
                </label>
                <select
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                >
                  <option value="">عام / بدون فئة محددة</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                  سقف المصروف الأسبوعي (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={targetSpendCap}
                    onChange={(e) => setTargetSpendCap(e.target.value)}
                    placeholder="مثال: 50.000"
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold pl-12"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                    {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Days & Estimated Saving */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                  الأيام المستهدفة
                </label>
                <select
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                >
                  <option value={2}>يومان (48 ساعة)</option>
                  <option value={3}>3 أيام</option>
                  <option value={5}>5 أيام عمل</option>
                  <option value={7}>7 أيام (أسبوع كامل)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                  الوفر التقديري
                </label>
                <input
                  type="number"
                  value={estimatedSaving}
                  onChange={(e) => setEstimatedSaving(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                  نقاط المكافأة
                </label>
                <input
                  type="number"
                  value={rewardPoints}
                  onChange={(e) => setRewardPoints(Number(e.target.value))}
                  placeholder="45"
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Check size={16} />
                تثبيت وبدء التحدي
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
