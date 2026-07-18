import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../store/AppContext';
import { Category } from '../../types';
import { Layers, Plus, Trash, Pencil, Search, X, ShieldCheck, TrendingUp, Target, Sparkles } from 'lucide-react';
import { DynamicIcon } from '../../components/DynamicIcon';
import { IconSelect } from '../../components/IconSelect';
import { ColorPicker } from '../../components/ColorPicker';
import { EditCategoryModal } from '../../components/EditCategoryModal';
import { motion, AnimatePresence } from 'motion/react';
import { cn, hapticFeedback } from '../../utils';

const CategoryManager = () => {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories, applyTunisianFamilyTemplate } = useAppContext();
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newCatIcon, setNewCatIcon] = useState('Circle');
  const [newCatType, setNewCatType] = useState<'need' | 'want' | 'saving'>('need');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatForEdit, setSelectedCatForEdit] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleSyncSubcategories = () => {
    hapticFeedback('success');
    let updatedCount = 0;
    
    const DEFAULT_SUBCATS: Record<string, string[]> = {
      'طعام': ['بقالة', 'مطاعم', 'وجبات سريعة'],
      'قهوة': ['مقهى', 'عمل', 'منزل'],
      'نقل': ['تاكسي', 'نقل عمومي', 'وقود', 'صيانة'],
      'بيت': ['إيجار', 'كهرباء', 'ماء', 'إنترنت'],
      'شخصي': ['ملابس', 'صحة', 'رياضة']
    };

    categories.forEach(cat => {
      const defaults = DEFAULT_SUBCATS[cat.name];
      if (defaults) {
        const currentSubcats = cat.subcategories || [];
        const missingSubcats = defaults.filter(d => !currentSubcats.includes(d));
        
        if (missingSubcats.length > 0) {
          updateCategory(cat.id, { 
            subcategories: [...currentSubcats, ...missingSubcats] 
          });
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      toast.success('تم تحديث الفئات الفرعية المقترحة');
    } else {
      toast.error('الفئات الفرعية محدثة بالفعل');
    }
  };

  const availableIcons = [
    'Circle', 'ShoppingBag', 'Coffee', 'Utensils', 'Car', 'Home', 'FileText', 
    'Gamepad2', 'HeartPulse', 'Plane', 'Smartphone', 'Gift', 'Briefcase', 'Zap',
    'Music', 'Camera', 'Book', 'Users', 'ShoppingCard', 'CreditCard', 'Wallet',
    'TrendingUp', 'TrendingDown', 'Target', 'Award', 'Star', 'Bell', 'Mail',
    'MapPin', 'Globe', 'Clock', 'Calendar', 'Video', 'Mic', 'Headphones'
  ];

  const filteredCategories = localCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      hapticFeedback('success');
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
      hapticFeedback('medium');
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        const updatedSubcategories = [...(cat.subcategories || []), subcatName.trim()];
        updateCategory(catId, { subcategories: updatedSubcategories });
        setNewSubcatName(prev => ({ ...prev, [catId]: '' }));
      }
    }
  };

  const deleteSubcategory = (catId: string, subcatIndex: number) => {
    hapticFeedback('warning');
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.subcategories) {
      const updatedSubcategories = cat.subcategories.filter((_, index) => index !== subcatIndex);
      updateCategory(catId, { subcategories: updatedSubcategories });
    }
  };

  const groups = [
    { 
      id: 'need', 
      title: 'الاحتياجات الأساسية (50%)', 
      description: 'المصاريف الضرورية للحياة مثل السكن، الطعام، الفواتير، والمواصلات.',
      color: 'bg-indigo-500', 
      lightColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      items: filteredCategories.filter(c => c.type === 'need' || !c.type) 
    },
    { 
      id: 'want', 
      title: 'الرغبات والكماليات (30%)', 
      description: 'المصاريف غير الضرورية مثل الترفيه، الهدايا، والمطاعم.',
      color: 'bg-amber-500', 
      lightColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400',
      items: filteredCategories.filter(c => c.type === 'want') 
    },
    { 
      id: 'saving', 
      title: 'الادخار والاستثمار (20%)', 
      description: 'المبالغ المخصصة للمستقبل مثل الادخار، الاستثمار، وسداد الديون.',
      color: 'bg-emerald-500', 
      lightColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      items: filteredCategories.filter(c => c.type === 'saving') 
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-10"
    >
      {/* Header & Add Section */}
      <div className="glass-card p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
              <Layers className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">إدارة الفئات</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">نظم مصاريفك بذكاء وفق مبدأ 50/30/20</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <button 
              onClick={handleSyncSubcategories}
              className="px-4 py-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              تحديث المقترحات
            </button>
            <button 
              onClick={async () => {
                hapticFeedback('heavy');
                const loadingToast = toast.loading('جاري تطبيق قالب ميزانية العائلة التونسية...');
                await applyTunisianFamilyTemplate();
                toast.dismiss(loadingToast);
              }}
              className="px-4 py-2 rounded-xl border-2 border-primary-500/30 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-xs">🇹🇳</span>
              تطبيق قالب العائلة التونسية
            </button>
            <div className="relative group w-full md:w-56">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="بحث عن فئة..." 
                className="w-full pr-10 pl-3 py-2 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none" 
              />
            </div>
          </div>
        </div>
        
        {/* Quick Suggestions Block */}
        <div className="mb-5 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/80">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right mb-2.5">💡 اقتراحات سريعة لإنشاء تصنيفات مخصصة:</span>
          <div className="flex flex-wrap gap-2.5 justify-start md:justify-end" dir="rtl">
            {[
              { name: 'مدرسة', icon: 'Book', color: '#3b82f6', type: 'need', label: '🏫 مدرسة' },
              { name: 'سيارة', icon: 'Car', color: '#ef4444', type: 'need', label: '🚗 سيارة' },
              { name: 'ديون', icon: 'Wallet', color: '#10b981', type: 'saving', label: '💸 ديون' },
              { name: 'صحة', icon: 'HeartPulse', color: '#ec4899', type: 'need', label: '🏥 صحة' },
              { name: 'سفر', icon: 'Plane', color: '#8b5cf6', type: 'want', label: '✈️ سفر' },
              { name: 'تسوق', icon: 'ShoppingBag', color: '#f59e0b', type: 'want', label: '🛍️ تسوق' },
            ].map((tmpl) => {
              const exists = categories.some(c => c.name === tmpl.name);
              return (
                <button
                  type="button"
                  key={tmpl.name}
                  disabled={exists}
                  onClick={() => {
                    hapticFeedback('light');
                    setNewCatName(tmpl.name);
                    setNewCatIcon(tmpl.icon);
                    setNewCatColor(tmpl.color);
                    setNewCatType(tmpl.type as any);
                  }}
                  className={cn(
                    "px-3.5 py-2 rounded-xl border text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer relative",
                    exists 
                      ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-transparent text-slate-400 dark:text-slate-500"
                      : newCatName === tmpl.name
                      ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <span>{tmpl.label}</span>
                  {exists && <span className="text-[8px] font-bold text-emerald-500">(مضافة)</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end relative z-10">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">اسم الفئة</label>
            <input 
              type="text" 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)} 
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none" 
              placeholder="مثال: تسوق" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">النوع (50/30/20)</label>
            <select 
              value={newCatType} 
              onChange={(e) => setNewCatType(e.target.value as any)} 
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none appearance-none"
            >
              <option value="need">احتياجات (50%)</option>
              <option value="want">رغبات (30%)</option>
              <option value="saving">ادخار (20%)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الأيقونة</label>
              <IconSelect value={newCatIcon} onChange={setNewCatIcon} availableIcons={availableIcons} className="w-full !h-[40px] rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">اللون</label>
              <ColorPicker value={newCatColor} onChange={setNewCatColor} />
            </div>
          </div>
          <button 
            onClick={handleAddCategory} 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-black transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95"
          >
            <Plus size={16} />
            إضافة فئة
          </button>
        </div>
      </div>

      {/* 50/30/20 Info Section */}
      <motion.div variants={itemVariants} className="bg-slate-900 dark:bg-black rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md mb-8">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest">
              <ShieldCheck size={10} className="text-primary-400" />
              دليلك للتخطيط المالي
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-none">قاعدة 50/30/20 الذكية</h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
              نظام بسيط وفعال لتنظيم دخلك الشهري يضمن لك تغطية احتياجاتك، الاستمتاع بحياتك، وتأمين مستقبلك المالي في آن واحد.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'احتياجات', percent: '50%', color: 'text-indigo-400', desc: 'أساسيات الحياة' },
              { label: 'رغبات', percent: '30%', color: 'text-amber-400', desc: 'نمط الحياة' },
              { label: 'ادخار', percent: '20%', color: 'text-emerald-400', desc: 'المستقبل' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 md:p-4 flex flex-col items-center text-center space-y-1">
                <span className={cn("text-xl md:text-3xl font-black tracking-tighter", item.color)}>{item.percent}</span>
                <div className="space-y-0.5">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-tight">{item.label}</p>
                  <p className="text-[7px] font-bold opacity-40 uppercase tracking-widest hidden md:block">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Groups Section */}
      <div className="space-y-12">
        {groups.map(group => (
          <div key={group.id} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${group.color} shadow-lg shadow-${group.id}-500/20`} />
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xl">{group.title}</h3>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-black px-3 py-1 rounded-xl">{group.items.length}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 max-w-md">{group.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {group.items.map((cat) => (
                  <motion.div 
                    key={cat.id} 
                    layout 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group flex flex-col p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-50 dark:border-slate-800/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform flex-shrink-0" style={{ backgroundColor: cat.color }}>
                          <DynamicIcon name={cat.icon || 'Circle'} size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-slate-800 dark:text-white truncate">{cat.name}</span>
                          <span className={`text-[9px] font-semibold tracking-tight mt-0.5 ${group.textColor}`}>
                            {group.id === 'need' ? 'احتياجات' : group.id === 'want' ? 'رغبات' : 'ادخار'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedCatForEdit(cat);
                            setIsEditModalOpen(true);
                          }} 
                          className="p-1 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="تعديل الفئة"
                        >
                          <Pencil size={10} />
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"><Trash size={10} /></button>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1 max-h-10 overflow-y-auto custom-scrollbar">
                        {cat.subcategories?.map((sub, i) => (
                          <span key={i} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md text-[7px] font-black text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                            {sub}
                            <button onClick={() => deleteSubcategory(cat.id, i)} className="text-rose-400 hover:text-rose-600"><X size={8} /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input 
                          type="text" 
                          value={newSubcatName[cat.id] || ''} 
                          onChange={(e) => setNewSubcatName(prev => ({ ...prev, [cat.id]: e.target.value }))} 
                          onKeyDown={(e) => e.key === 'Enter' && addSubcategory(cat.id)}
                          placeholder="إضافة..." 
                          className="flex-1 px-1.5 py-1 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[7px] font-bold outline-none focus:border-primary-500 transition-all" 
                        />
                        <button 
                          onClick={() => addSubcategory(cat.id)} 
                          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 rounded-md hover:scale-105 active:scale-95 transition-all"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCatForEdit(null);
        }}
        category={selectedCatForEdit}
        onSave={(id, updates) => {
          updateCategory(id, updates);
          toast.success('تم تحديث الفئة بنجاح');
        }}
        onDelete={deleteCategory}
      />
    </motion.div>
  );
};

export default CategoryManager;
