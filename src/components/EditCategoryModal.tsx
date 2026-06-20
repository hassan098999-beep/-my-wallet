import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Eye, Trash, Sparkles } from 'lucide-react';
import { IconSelect } from './IconSelect';
import { ColorPicker } from './ColorPicker';
import { DynamicIcon } from './DynamicIcon';
import { cn } from '../utils';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (id: string, updates: Partial<Category>) => void;
  onDelete?: (id: string) => void;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSave,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Circle');
  const [type, setType] = useState<'need' | 'want' | 'saving'>('need');

  // Load initial value on open
  useEffect(() => {
    if (isOpen && category) {
      setName(category.name || '');
      setColor(category.color || '#3b82f6');
      setIcon(category.icon || 'Circle');
      setType(category.type || 'need');
    }
  }, [isOpen, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category && name.trim()) {
      onSave(category.id, {
        name: name.trim(),
        color,
        icon,
        type
      });
      onClose();
    }
  };

  if (!category) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden z-10 text-right"
          >
            {/* Visual background glow */}
            <div 
              className="absolute -right-32 -top-32 w-64 h-64 rounded-full blur-[100px] opacity-25"
              style={{ backgroundColor: color }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50 dark:border-slate-800/60 relative z-10">
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">تعديل فئة الصرف</span>
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: color }}
                >
                  <DynamicIcon name={icon} size={16} animate={false} />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">اسم الفئة</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-white font-bold text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                  placeholder="مثال: مطاعم ومقاهي"
                  required
                />
              </div>

              {/* Category Type (Allocation 50/30/20 Cards) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                  النوع وتصنيف الميزانية (حسب قاعدة 50/30/20)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Need */}
                  <button
                    type="button"
                    onClick={() => setType('need')}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center space-y-1 group relative",
                      type === 'need'
                        ? 'border-indigo-500 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.02]'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <span className={cn(
                      "text-sm font-bold",
                      type === 'need' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                    )}>
                      احتياجات (50%)
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
                      أساسيات البيت والمعيشة
                    </span>
                  </button>

                  {/* Want */}
                  <button
                    type="button"
                    onClick={() => setType('want')}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center space-y-1 group relative",
                      type === 'want'
                        ? 'border-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/[0.02]'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <span className={cn(
                      "text-sm font-bold",
                      type === 'want' ? 'text-amber-500 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                    )}>
                      رغبات (30%)
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
                      كماليات ونمط الحياة
                    </span>
                  </button>

                  {/* Saving */}
                  <button
                    type="button"
                    onClick={() => setType('saving')}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center space-y-1 group relative",
                      type === 'saving'
                        ? 'border-emerald-500 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02]'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <span className={cn(
                      "text-sm font-bold",
                      type === 'saving' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                    )}>
                      الادخار (20%)
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
                      الاستثمار وحصالة الطفل
                    </span>
                  </button>
                </div>
              </div>

              {/* Interactive Color Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">اللون المميز للمعرف</label>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <ColorPicker value={color} onChange={setColor} />
                </div>
              </div>

              {/* Extended Icon Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">رمز الأيقونة التعبيرية</label>
                <IconSelect value={icon} onChange={setIcon} className="w-full" />
              </div>

              {/* Real-time Category Visual Preview Card */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block flex items-center justify-end gap-1">
                  <span>معاينة بصرية فورية للفئة</span>
                  <Eye size={11} />
                </span>
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm max-w-xs w-full">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10 transition-transform scale-105"
                      style={{ 
                        backgroundColor: color,
                        boxShadow: `0 8px 16px -4px ${color}40`
                      }}
                    >
                      <DynamicIcon name={icon} size={20} />
                    </div>
                    <div className="flex-1 text-right">
                      <span className="block font-black text-sm text-slate-800 dark:text-white truncate">
                        {name || 'اسم الفئة'}
                      </span>
                      <span className={cn(
                        "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest mt-1 inline-block",
                        type === 'need' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' :
                        type === 'want' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' :
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      )}>
                        {type === 'need' ? 'احتياجات' : type === 'want' ? 'رغبات' : 'ادخار'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-50 dark:border-slate-800/60">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذه الفئة بأكملها؟')) {
                        onDelete(category.id);
                        onClose();
                      }
                    }}
                    className="px-4 h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                    title="حذف الفئة"
                  >
                    <Trash size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="flex-[2] h-12 rounded-2xl btn-primary text-white font-bold text-xs shadow-md shadow-primary-500/10 hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
