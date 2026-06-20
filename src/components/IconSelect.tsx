import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DynamicIcon } from './DynamicIcon';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';

interface IconSelectProps {
  value: string;
  onChange: (icon: string) => void;
  availableIcons?: string[];
  className?: string;
}

// Extensive, curated, and highly relevant category icons
const ICON_CATEGORIES: Record<string, string[]> = {
  'عام ومقترحات': [
    'Circle', 'Star', 'Award', 'Target', 'Zap', 'Bell', 'Mail', 'Clock', 'Calendar', 
    'Heart', 'Smile', 'Flame', 'Compass', 'HelpCircle', 'Info', 'Lock', 'Shield', 'Sparkles'
  ],
  'طعام وشراب': [
    'Utensils', 'UtensilsCrossed', 'Coffee', 'Pizza', 'GlassWater', 'ChefHat', 'Cookie', 'Candy', 'Apple', 'Store'
  ],
  'تسوق وقفة العيش': [
    'ShoppingBag', 'ShoppingCart', 'Gift', 'Shirt', 'Sparkles', 'Tag', 'Footprints', 'Glasses'
  ],
  'مواصلات وسفر': [
    'Car', 'Bus', 'Plane', 'Bike', 'MapPin', 'Globe', 'Train', 'Fuel', 'Navigation', 'Ship'
  ],
  'منزل وعقارات': [
    'Home', 'Key', 'Sofa', 'Tv', 'Trash2', 'Wrench', 'Hammer', 'Lightbulb', 'Wifi', 'Plug', 'ShowerHead', 'Bed'
  ],
  'ترفيه ومقهى': [
    'Ticket', 'Gamepad2', 'Music', 'Camera', 'Video', 'Mic', 'Headphones', 'Dribbble', 'Clapperboard', 'Theater', 'Dice5', 'Crown'
  ],
  'رضيع وصحة العائلة': [
    'Baby', 'HeartPulse', 'Stethoscope', 'Activity', 'Thermometer', 'Pill', 'Syringe', 'Bandage', 'Dna', 'Users'
  ],
  'عمل وتعليم': [
    'Briefcase', 'Laptop', 'Notebook', 'Calculator', 'FileText', 'GraduationCap', 'PenTool', 'Languages'
  ],
  'مال وميزانية': [
    'Wallet', 'CreditCard', 'Coins', 'Banknote', 'TrendingUp', 'TrendingDown', 'PiggyBank', 'Percent', 'Scale', 'Receipt'
  ]
};

// Map Arabic keywords to Lucide icon names for semantic search
const ARABIC_SEARCH_MAP: Record<string, string[]> = {
  'طعام': ['Coffee', 'UtensilsCrossed', 'Utensils', 'Pizza', 'GlassWater', 'ChefHat', 'Cookie', 'Candy'],
  'أكل': ['Coffee', 'UtensilsCrossed', 'Utensils', 'Pizza', 'GlassWater', 'ChefHat', 'Cookie', 'Candy'],
  'اكل': ['Coffee', 'UtensilsCrossed', 'Utensils', 'Pizza', 'GlassWater', 'ChefHat', 'Cookie', 'Candy'],
  'قهوة': ['Coffee'],
  'تاي': ['Coffee'],
  'شاي': ['Coffee'],
  'شراب': ['Coffee', 'GlassWater'],
  'شرب': ['Coffee', 'GlassWater'],
  'تسوق': ['ShoppingBag', 'ShoppingCart', 'Gift', 'Tag', 'Store'],
  'قضية': ['ShoppingBag', 'ShoppingCart', 'Store'],
  'سوق': ['ShoppingBag', 'ShoppingCart', 'Store'],
  'شراء': ['ShoppingBag', 'ShoppingCart', 'Gift', 'Tag', 'Store', 'CreditCard', 'Wallet'],
  'محل': ['Store', 'ShoppingBag'],
  'نقل': ['Car', 'Bus', 'Plane', 'Bike', 'MapPin', 'Globe', 'Train', 'Fuel', 'Navigation'],
  'سيارة': ['Car'],
  'كراهب': ['Car'],
  'كرهبة': ['Car'],
  'كار': ['Bus'],
  'حافلة': ['Bus'],
  'بنزين': ['Fuel', 'Car'],
  'مازوط': ['Fuel', 'Car'],
  'شحن': ['Fuel'],
  'سفر': ['Plane', 'MapPin', 'Globe', 'Compass'],
  'طيارة': ['Plane'],
  'وتيل': ['MapPin'],
  'فندق': ['MapPin'],
  'بيت': ['Home', 'Key', 'Sofa', 'Lightbulb', 'Wifi', 'Plug', 'ShowerHead', 'Bed'],
  'دار': ['Home', 'Key', 'Sofa', 'Lightbulb', 'Wifi', 'Plug', 'ShowerHead', 'Bed'],
  'سكن': ['Home', 'Key', 'Sofa', 'Lightbulb', 'Wifi'],
  'إيجار': ['Home', 'Key', 'Receipt'],
  'كراء': ['Home', 'Key', 'Receipt'],
  'فاتورة': ['Receipt', 'ReceiptText', 'FileText', 'Calculator', 'CreditCard'],
  'فواتير': ['Receipt', 'ReceiptText', 'FileText', 'Calculator', 'CreditCard'],
  'ضوء': ['Zap', 'Lightbulb'],
  'كهرباء': ['Zap', 'Lightbulb'],
  'ماء': ['GlassWater', 'ShowerHead'],
  'انترنت': ['Wifi'],
  'إنترنت': ['Wifi'],
  'برود': ['Wifi'],
  'ترفيه': ['Ticket', 'Gamepad2', 'Music', 'Camera', 'Video', 'Mic', 'Headphones', 'Dribbble', 'Clapperboard', 'Theater', 'Dice5', 'Crown'],
  'لعب': ['Gamepad2', 'Dice5'],
  'تلفزة': ['Tv'],
  'موسيقى': ['Music', 'Headphones'],
  'سينما': ['Clapperboard', 'Ticket', 'Theater'],
  'صحة': ['HeartPulse', 'Stethoscope', 'Activity', 'Thermometer', 'Pill', 'Syringe', 'Bandage', 'Baby', 'Users'],
  'طبيب': ['Stethoscope', 'HeartPulse', 'Pill'],
  'سبيطار': ['HeartPulse', 'Stethoscope'],
  'عيادة': ['Stethoscope'],
  'مرض': ['Pill', 'Thermometer', 'HeartPulse'],
  'دواء': ['Pill', 'Bandage'],
  'رضيع': ['Baby'],
  'بيبي': ['Baby'],
  'صغير': ['Baby'],
  'عائلة': ['Users', 'Heart'],
  'عمل': ['Briefcase', 'Laptop', 'Notebook', 'Calculator', 'FileText'],
  'شغل': ['Briefcase', 'Laptop', 'Notebook'],
  'طريق': ['Navigation', 'MapPin'],
  'مكتب': ['Briefcase', 'Laptop'],
  'خدمة': ['Briefcase'],
  'دراسة': ['Book', 'GraduationCap', 'PenTool', 'Languages'],
  'قراية': ['Book', 'GraduationCap', 'PenTool'],
  'مدرسة': ['GraduationCap', 'Book'],
  'روضة': ['Baby', 'GraduationCap'],
  'تعليم': ['Book', 'GraduationCap'],
  'مال': ['Wallet', 'CreditCard', 'Coins', 'Banknote', 'TrendingUp', 'TrendingDown', 'PiggyBank', 'Percent', 'Scale', 'Receipt'],
  'فلوس': ['Wallet', 'CreditCard', 'Coins', 'Banknote', 'PiggyBank'],
  'توفير': ['PiggyBank', 'Coins', 'TrendingUp', 'Target'],
  'ادخار': ['PiggyBank', 'Coins', 'TrendingUp', 'Target'],
  'بنك': ['CreditCard', 'Wallet', 'Banknote', 'Coins'],
  'بوسطة': ['Mail', 'CreditCard'],
  'ميزانية': ['Calculator', 'Scale', 'Receipt'],
  'شخصي': ['User', 'Smile', 'Heart', 'Fingerprint', 'Shirt', 'Footprints', 'Glasses'],
  'لباس': ['Shirt'],
  'كسوة': ['Shirt'],
  'عطر': ['Sparkles'],
  'تجميل': ['Smile', 'Sparkles', 'Heart']
};

export const IconSelect: React.FC<IconSelectProps> = ({ value, onChange, availableIcons = [], className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Collect all unique icons across categories and custom list
  const allIcons = useMemo(() => {
    const icons = new Set<string>();
    Object.values(ICON_CATEGORIES).forEach(list => list.forEach(icon => icons.add(icon)));
    availableIcons.forEach(icon => icons.add(icon));
    return Array.from(icons);
  }, [availableIcons]);

  // Handle smart filtering supporting English and Arabic query lookup
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return allIcons;
    }
    const cleanQuery = searchQuery.trim().toLowerCase();
    const matches = new Set<string>();

    // 1. Direct English substring matches
    allIcons.forEach(icon => {
      if (icon.toLowerCase().includes(cleanQuery)) {
        matches.add(icon);
      }
    });

    // 2. Arabic map semantic matches
    Object.entries(ARABIC_SEARCH_MAP).forEach(([key, icons]) => {
      if (key.includes(cleanQuery) || cleanQuery.includes(key)) {
        icons.forEach(icon => {
          if (allIcons.includes(icon)) {
            matches.add(icon);
          }
        });
      }
    });

    return Array.from(matches);
  }, [allIcons, searchQuery]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="icon-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 h-10 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          {value ? (
            <>
              <div className="size-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <DynamicIcon name={value} size={15} animate={false} />
              </div>
              <span className="text-xs font-semibold truncate">{value}</span>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <HelpCircle size={15} />
              <span className="text-xs font-medium">اختر أيقونة</span>
            </div>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-primary-500' : ''}`} />
      </button>

      {isOpen && (
        <div 
          id="icon-dropdown-panel"
          className="absolute z-50 w-80 mt-2 right-0 sm:right-auto sm:left-0 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-3.5 animate-in fade-in slide-in-from-top-3 duration-250"
        >
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'all') setActiveTab('all'); // fallback to all on typing
              }}
              placeholder="ابحث بالعربية أو الإنجليزية (مثال: طعام، طيارة)..."
              className="w-full pr-9 pl-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          {/* Quick Filter tabs when not searching */}
          {!searchQuery && (
            <div className="flex gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none scroll-smooth">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                الكل
              </button>
              {Object.keys(ICON_CATEGORIES).map(catKey => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setActiveTab(catKey)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${
                    activeTab === catKey
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {catKey}
                </button>
              ))}
            </div>
          )}

          {/* Icons Grid Container */}
          <div className="max-h-56 overflow-y-auto pr-1 select-none">
            {/* Without Icon option */}
            <button
              type="button"
              onClick={() => {
                onChange('Circle');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-2 mb-2.5 rounded-xl text-xs font-bold transition-all border border-dashed ${
                value === 'Circle' || !value
                  ? 'bg-primary-50/50 dark:bg-primary-950/20 text-primary-500 dark:text-primary-400 border-primary-200 dark:border-primary-800'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800'
              }`}
            >
              <HelpCircle size={14} />
              بدون تحديد مخصص (أيقونة افتراضية)
            </button>

            {/* Grid rendering */}
            {searchQuery ? (
              filteredIcons.length > 0 ? (
                <div className="grid grid-cols-6 gap-1.5 p-0.5">
                  {filteredIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => {
                        onChange(icon);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-center aspect-square rounded-xl transition-all border ${
                        value === icon
                          ? 'bg-primary-500 text-white border-primary-500 scale-105'
                          : 'border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-950 hover:text-primary-500 dark:hover:text-primary-400 hover:scale-105'
                      }`}
                      title={icon}
                    >
                      <DynamicIcon name={icon} size={20} animate={false} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  لم نجد أيقونة مطابقة للبحث
                </div>
              )
            ) : activeTab === 'all' ? (
              Object.entries(ICON_CATEGORIES).map(([catHeading, icons]) => (
                <div key={catHeading} className="mb-4 last:mb-0">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-950 px-2 py-0.5 rounded-md mb-2 inline-block">
                    {catHeading}
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => {
                          onChange(icon);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-center aspect-square rounded-xl transition-all border ${
                          value === icon
                            ? 'bg-primary-500 text-white border-primary-500 scale-105'
                            : 'border-slate-50 dark:border-slate-800/55 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-950 hover:text-primary-500 dark:hover:text-primary-400 hover:scale-105'
                        }`}
                        title={icon}
                      >
                        <DynamicIcon name={icon} size={20} animate={false} />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-6 gap-1.5">
                {ICON_CATEGORIES[activeTab]?.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      onChange(icon);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-center aspect-square rounded-xl transition-all border ${
                      value === icon
                        ? 'bg-primary-500 text-white border-primary-500 scale-105'
                        : 'border-slate-50 dark:border-slate-800/10 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-950 hover:text-primary-500 dark:hover:text-primary-400 hover:scale-105'
                    }`}
                    title={icon}
                  >
                    <DynamicIcon name={icon} size={20} animate={false} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
