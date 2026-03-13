import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { Layers, Plus, Trash2, Edit2, Search, X } from 'lucide-react';
import { DynamicIcon } from '../DynamicIcon';
import { IconSelect } from '../IconSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';

const CategoryManager = () => {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useAppContext();
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newCatIcon, setNewCatIcon] = useState('Circle');
  const [newCatType, setNewCatType] = useState<'need' | 'want' | 'saving'>('need');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [newSubcatName, setNewSubcatName] = useState<Record<string, string>>({});

  const availableIcons = [
    'Circle', 'ShoppingBag', 'Coffee', 'Utensils', 'Car', 'Home', 'FileText', 
    'Gamepad2', 'HeartPulse', 'Plane', 'Smartphone', 'Gift', 'Briefcase', 'Zap',
    'Music', 'Camera', 'Book', 'Users', 'ShoppingCard', 'CreditCard', 'Wallet',
    'TrendingUp', 'TrendingDown', 'Target', 'Award', 'Star', 'Bell', 'Mail',
    'MapPin', 'Globe', 'Clock', 'Calendar', 'Video', 'Mic', 'Headphones'
  ];

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory({ name: newCatName, color: newCatColor, icon: newCatIcon, type: newCatType });
      setNewCatName('');
      setNewCatColor('#3b82f6');
      setNewCatIcon('Circle');
      setNewCatType('need');
    }
  };

  const addSubcategory = (catId: string) => {
    const subcatName = newSubcatName[catId];
    if (subcatName && subcatName.trim()) {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        const updatedSubcategories = [...(cat.subcategories || []), subcatName.trim()];
        updateCategory(catId, { subcategories: updatedSubcategories });
        setNewSubcatName(prev => ({ ...prev, [catId]: '' }));
      }
    }
  };

  const deleteSubcategory = (catId: string, subcatIndex: number) => {
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.subcategories) {
      const updatedSubcategories = cat.subcategories.filter((_, index) => index !== subcatIndex);
      updateCategory(catId, { subcategories: updatedSubcategories });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
            <Layers className="size-4 md:size-5" />
          </div>
          <h2 className="text-sm md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">إضافة فئة جديدة</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 items-end">
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1">اسم الفئة</label>
            <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-xs md:text-sm shadow-sm" placeholder="مثال: تسوق" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1">النوع</label>
            <select value={newCatType} onChange={(e) => setNewCatType(e.target.value as any)} className="w-full px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-xs md:text-sm shadow-sm">
              <option value="need">احتياجات</option>
              <option value="want">رغبات</option>
              <option value="saving">ادخار</option>
            </select>
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1">الأيقونة</label>
            <IconSelect value={newCatIcon} onChange={setNewCatIcon} availableIcons={availableIcons} className="w-full !h-[38px] md:!h-[48px] rounded-xl md:rounded-2xl" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1">اللون</label>
            <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="w-full h-[38px] md:h-[48px] rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer p-1 md:p-1.5 bg-white/50 dark:bg-slate-800/50 shadow-sm" />
          </div>
          <button onClick={handleAddCategory} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 md:py-3 rounded-xl md:rounded-2xl font-black transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 h-[38px] md:h-[48px] uppercase tracking-widest text-xs md:text-sm">إضافة</button>
        </div>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 size-4 md:size-5" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث عن فئة..." className="w-full pr-10 md:pr-12 pl-3 md:pl-4 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-xs md:text-sm shadow-sm" />
      </div>

      <div className="space-y-6 md:space-y-8">
        {[
          { id: 'need', title: 'الاحتياجات الأساسية', color: 'bg-indigo-500', items: filteredCategories.filter(c => c.type === 'need' || !c.type) },
          { id: 'want', title: 'الرغبات والكماليات', color: 'bg-amber-500', items: filteredCategories.filter(c => c.type === 'want') },
          { id: 'saving', title: 'الادخار والاستثمار', color: 'bg-emerald-500', items: filteredCategories.filter(c => c.type === 'saving') },
        ].map(group => (
          <div key={group.id} className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 md:gap-3 px-1 md:px-2">
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${group.color} shadow-lg`} />
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm md:text-base">{group.title}</h3>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl shadow-sm">{group.items.length}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {group.items.map((cat) => (
                  <motion.div key={cat.id} layout className="flex flex-col p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: cat.color }}>
                          <DynamicIcon name={cat.icon || 'Circle'} className="size-4 md:size-5" />
                        </div>
                        <div className="flex flex-col">
                          {editingCatId === cat.id ? (
                            <input type="text" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} onBlur={() => {updateCategory(cat.id, { name: editingCatName }); setEditingCatId(null)}} autoFocus className="w-24 md:w-28 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs md:text-sm font-bold" />
                          ) : (
                            <span className="font-black text-sm md:text-base text-slate-900 dark:text-white">{cat.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-0.5 md:gap-1">
                        <button onClick={() => {setEditingCatId(cat.id); setEditingCatName(cat.name)}} className="p-1 md:p-1.5 text-slate-400 hover:text-primary-500"><Edit2 className="size-3.5 md:size-4" /></button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-1 md:p-1.5 text-rose-400 hover:text-rose-600"><Trash2 className="size-3.5 md:size-4" /></button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex flex-wrap gap-1 md:gap-1.5">
                        {cat.subcategories?.map((sub, i) => (
                          <span key={i} className="flex items-center gap-1 md:gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {sub}
                            <button onClick={() => deleteSubcategory(cat.id, i)} className="text-rose-500"><X className="size-2.5 md:size-3" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1 md:gap-1.5">
                        <input type="text" value={newSubcatName[cat.id] || ''} onChange={(e) => setNewSubcatName(prev => ({ ...prev, [cat.id]: e.target.value }))} placeholder="إضافة فرعي..." className="flex-1 px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-[8px] md:text-[10px] font-bold outline-none" />
                        <button onClick={() => addSubcategory(cat.id)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 md:px-2 rounded-md md:rounded-lg"><Plus className="size-3 md:size-4" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
