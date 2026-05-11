import React, { useState, useRef, useEffect } from 'react';
import { Category } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface CategorySelectProps {
  categories: Category[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ categories, selectedId, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(c => c.id === selectedId) || categories[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none group shadow-inner"
      >
        {selectedCategory ? (
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: selectedCategory.color,
                boxShadow: `0 8px 16px -4px ${selectedCategory.color}40`
              }}
            >
              {selectedCategory.icon ? (
                <DynamicIcon name={selectedCategory.icon} size={20} />
              ) : (
                <span className="text-sm font-black">{selectedCategory.name.charAt(0)}</span>
              )}
            </div>
            <div className="text-right">
              <span className="block font-black text-sm uppercase tracking-tight leading-none">{selectedCategory.name}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">الفئة المختارة</span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">اختر فئة</span>
        )}
        <ChevronDown size={20} className={cn("text-slate-400 transition-transform duration-500", isOpen ? 'rotate-180 text-emerald-500' : '')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute z-50 w-full mt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/20 py-3 max-h-80 flex flex-col"
          >
            <div className="px-4 mb-2 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن فئة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-transparent bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none focus:border-emerald-500 transition-colors"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">جميع الفئات</span>
            </div>
            <div className="overflow-y-auto custom-scrollbar overflow-x-hidden flex-1">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group relative",
                  selectedId === cat.id ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                )}
              >
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform shrink-0"
                  style={{ 
                    backgroundColor: cat.color,
                    boxShadow: `0 10px 20px -5px ${cat.color}30`
                  }}
                >
                  {cat.icon ? (
                    <DynamicIcon name={cat.icon} size={24} />
                  ) : (
                    <span className="text-base font-black">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "block text-base font-black uppercase tracking-tight transition-colors",
                      selectedId === cat.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'
                    )}>
                      {cat.name}
                    </span>
                    {cat.type && (
                      <span className={cn(
                        "text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                        cat.type === 'need' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" :
                        cat.type === 'want' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {cat.type === 'need' ? 'احتياج' : cat.type === 'want' ? 'رغبة' : 'ادخار'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {cat.subcategories?.length || 0} فئات فرعية
                  </p>
                </div>
                {selectedId === cat.id && (
                  <div className="absolute left-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <Check size={14} strokeWidth={4} />
                  </div>
                )}
              </button>
            ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
