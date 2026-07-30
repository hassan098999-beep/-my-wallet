import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Layers, AlignLeft, Search, X, Plus, Sparkles, Check } from 'lucide-react';
import { cn, hapticFeedback } from '../../utils';
import { DynamicIcon } from '../DynamicIcon';
import { ColorPicker } from '../ColorPicker';
import { IconSelect } from '../IconSelect';
import { Category } from '../../types';

interface CategorySelectionModalProps {
  type: 'expense' | 'income' | 'transfer';
  bgColor: string;
  source: string;
  setSource: (src: string) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  setSubcategoryId: (sub: string) => void;
  setActiveView: (view: 'main' | 'category' | 'account' | 'toAccount' | 'details') => void;
  categorySearchQuery: string;
  setCategorySearchQuery: (q: string) => void;
  categories: Category[];
  favoriteCategories: Category[];
  isAddingCustomCategory: boolean;
  setIsAddingCustomCategory: (val: boolean) => void;
  newCatName: string;
  setNewCatName: (n: string) => void;
  newCatColor: string;
  setNewCatColor: (c: string) => void;
  newCatIcon: string;
  setNewCatIcon: (i: string) => void;
  newCatType: 'need' | 'want' | 'saving';
  setNewCatType: (t: 'need' | 'want' | 'saving') => void;
  handleCreateCustomCategory: () => void;
}

export const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({
  type,
  bgColor,
  source,
  setSource,
  categoryId,
  setCategoryId,
  setSubcategoryId,
  setActiveView,
  categorySearchQuery,
  setCategorySearchQuery,
  categories,
  favoriteCategories,
  isAddingCustomCategory,
  setIsAddingCustomCategory,
  newCatName,
  setNewCatName,
  newCatColor,
  setNewCatColor,
  newCatIcon,
  setNewCatIcon,
  newCatType,
  setNewCatType,
  handleCreateCustomCategory,
}) => {
  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0.5 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: '100%', opacity: 0.5 }} 
      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col"
    >
      <div className={cn("flex items-center p-4 text-white shrink-0 pt-[env(safe-area-inset-top)]", bgColor)}>
        <button onClick={() => { hapticFeedback('light'); setActiveView('main'); }} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold">{type === 'income' ? 'اختر المصدر' : 'اختر الفئة'}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {type === 'income' ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                <Layers size={16} /> مصادر شائعة
              </label>
              <div className="flex flex-wrap gap-2.5">
                {['راتب', 'عمل حر', 'مكافأة', 'هدية', 'استثمار', 'أخرى'].map(src => (
                  <button 
                    key={src}
                    onClick={() => { hapticFeedback('light'); setSource(src); setCategoryId(''); setActiveView('main'); }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border-2",
                      source === src 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/30"
                    )}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                <AlignLeft size={16} /> مصدر مخصص
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => { setSource(e.target.value); setCategoryId(''); }}
                placeholder="أدخل مصدر الدخل..."
                className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
              />
              <button 
                onClick={() => { hapticFeedback('light'); setActiveView('main'); }}
                disabled={!source.trim()}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm"
              >
                تأكيد المصدر
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full space-y-4">
            <div className="relative shrink-0">
              <input
                type="text"
                placeholder="ابحث عن فئة..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold outline-none focus:border-rose-500 transition-colors"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>

            {/* Inline Form to add custom category */}
            {isAddingCustomCategory ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl space-y-3 shrink-0"
                dir="rtl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">إنشاء تصنيف مخصص جديد 🎨</span>
                  <button 
                    type="button"
                    onClick={() => setIsAddingCustomCategory(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                    <input 
                      type="text" 
                      value={newCatName} 
                      onChange={(e) => setNewCatName(e.target.value)} 
                      placeholder="اسم التصنيف (مثل: مدرسة، سيارة)..."
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border-2 border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-rose-500 transition-all text-right"
                    />
                  </div>

                  {/* Quick Suggestion Templates */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-slate-400 block text-right">💡 اقتراحات سريعة جاهزة:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: 'مدرسة', icon: 'Book', color: '#3b82f6', type: 'need', label: '🏫 مدرسة' },
                        { name: 'سيارة', icon: 'Car', color: '#ef4444', type: 'need', label: '🚗 سيارة' },
                        { name: 'ديون', icon: 'Wallet', color: '#10b981', type: 'saving', label: '💸 ديون' },
                        { name: 'صحة', icon: 'HeartPulse', color: '#ec4899', type: 'need', label: '🏥 صحة' },
                        { name: 'سفر', icon: 'Plane', color: '#8b5cf6', type: 'want', label: '✈️ سفر' },
                        { name: 'تسوق', icon: 'ShoppingBag', color: '#f59e0b', type: 'want', label: '🛍️ تسوق' },
                      ].map((tmpl) => (
                        <button
                          type="button"
                          key={tmpl.name}
                          onClick={() => {
                            hapticFeedback('light');
                            setNewCatName(tmpl.name);
                            setNewCatIcon(tmpl.icon);
                            setNewCatColor(tmpl.color);
                            setNewCatType(tmpl.type as any);
                          }}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                            newCatName === tmpl.name
                              ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 block text-right">النوع</span>
                      <select 
                        value={newCatType}
                        onChange={(e) => setNewCatType(e.target.value as any)}
                        className="w-full px-2 py-2 text-xs font-bold rounded-xl border-2 border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none text-right"
                      >
                        <option value="need">احتياجات (50%)</option>
                        <option value="want">رغبات (30%)</option>
                        <option value="saving">ادخار (20%)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 block text-right">اللون</span>
                      <ColorPicker value={newCatColor} onChange={setNewCatColor} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 block text-right">الأيقونة</span>
                    <IconSelect value={newCatIcon} onChange={setNewCatIcon} className="w-full !h-[36px]" />
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateCustomCategory}
                    disabled={!newCatName.trim()}
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md shadow-rose-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>تأكيد وإنشاء التصنيف</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={() => { hapticFeedback('light'); setIsAddingCustomCategory(true); }}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-center gap-1.5 shrink-0"
                dir="rtl"
              >
                <Plus size={14} />
                <span>إنشاء تصنيف مخصص جديد ✨</span>
              </button>
            )}

            {/* Favorite Categories Quick Grid */}
            {type === 'expense' && favoriteCategories.length > 0 && !categorySearchQuery && (
              <div className="shrink-0 space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 px-1">
                  <Sparkles size={11} className="text-rose-500 fill-rose-500" />
                  التصنيفات الأكثر استخداماً (آخر 30 يوم)
                </span>
                <div className="grid grid-cols-4 gap-3.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-805/30">
                  {favoriteCategories.map((cat) => (
                    <button
                      key={`fav-${cat.id}`}
                      onClick={() => {
                        hapticFeedback('light');
                        setCategoryId(cat.id);
                        setSubcategoryId('');
                        setActiveView('main');
                      }}
                      className="flex flex-col items-center gap-1.5 group/fav cursor-pointer"
                    >
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all shadow-sm group-hover/fav:scale-105",
                          categoryId === cat.id ? "ring-2 ring-rose-500 ring-offset-2 scale-105" : "opacity-95"
                        )}
                        style={{ backgroundColor: cat.color, '--tw-ring-color': cat.color } as any}
                      >
                        <DynamicIcon name={cat.icon || 'Circle'} size={18} />
                      </div>
                      <span className="text-[9px] font-semibold text-center text-slate-600 dark:text-slate-400 truncate w-full px-0.5">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-2">
              {categories.filter(cat => cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { hapticFeedback('light'); setCategoryId(cat.id); setSubcategoryId(''); setActiveView('main'); }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div 
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all",
                      categoryId === cat.id ? "ring-4 ring-offset-2 ring-opacity-50 scale-110" : "opacity-80 group-hover:opacity-100"
                    )}
                    style={{ backgroundColor: cat.color, '--tw-ring-color': cat.color } as any}
                  >
                    <DynamicIcon name={cat.icon || 'Circle'} size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-center text-slate-700 dark:text-slate-300">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
