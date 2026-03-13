import React, { useState, useRef, useEffect } from 'react';
import { Category } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils';

interface CategorySelectProps {
  categories: Category[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ categories, selectedId, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none group"
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: selectedCategory.color }}
            >
              {selectedCategory.icon ? (
                <DynamicIcon name={selectedCategory.icon} size={10} />
              ) : (
                <span className="text-[8px] font-black">{selectedCategory.name.charAt(0)}</span>
              )}
            </div>
            <span className="font-black text-[10px] uppercase tracking-tight">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">اختر فئة</span>
        )}
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 dark:border-slate-800/40 py-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onChange(cat.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group ${
                selectedId === cat.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon ? (
                  <DynamicIcon name={cat.icon} size={12} />
                ) : (
                  <span className="text-[9px] font-black">{cat.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center justify-between">
                  <span className={`block text-[10px] font-black uppercase tracking-tight ${selectedId === cat.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {cat.name}
                  </span>
                  {cat.type && (
                    <span className={cn(
                      "text-[6px] font-black px-1 py-0.5 rounded uppercase tracking-tighter",
                      cat.type === 'need' ? "bg-indigo-100 text-indigo-600" :
                      cat.type === 'want' ? "bg-amber-100 text-amber-600" :
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {cat.type === 'need' ? '50%' : cat.type === 'want' ? '30%' : '20%'}
                    </span>
                  )}
                </div>
                {selectedId === cat.id && (
                  <span className="text-[6px] font-black text-primary-500 uppercase tracking-widest">نشط حالياً</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
