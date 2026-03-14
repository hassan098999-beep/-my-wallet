import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DynamicIcon } from './DynamicIcon';
import { ChevronDown, Search } from 'lucide-react';

interface IconSelectProps {
  value: string;
  onChange: (icon: string) => void;
  availableIcons: string[];
  className?: string;
}

const ICON_CATEGORIES: Record<string, string[]> = {
  'عام': ['Circle', 'Star', 'Award', 'Target', 'Zap', 'Bell', 'Mail', 'Clock', 'Calendar'],
  'تسوق': ['ShoppingBag', 'ShoppingCard', 'Gift', 'CreditCard', 'Wallet'],
  'طعام': ['Coffee', 'Utensils', 'Pizza', 'Beer', 'Wine'],
  'نقل': ['Car', 'Plane', 'MapPin', 'Globe', 'Truck', 'Bike'],
  'منزل': ['Home', 'FileText', 'Zap', 'Trash2', 'Wrench'],
  'ترفيه': ['Gamepad2', 'Music', 'Camera', 'Video', 'Mic', 'Headphones', 'Tv'],
  'صحة': ['HeartPulse', 'Stethoscope', 'Activity', 'Thermometer'],
  'عمل': ['Briefcase', 'Smartphone', 'Book', 'Users', 'TrendingUp', 'TrendingDown']
};

export const IconSelect: React.FC<IconSelectProps> = ({ value, onChange, availableIcons, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const allIcons = useMemo(() => {
    const icons = new Set<string>();
    Object.values(ICON_CATEGORIES).forEach(list => list.forEach(icon => icons.add(icon)));
    availableIcons.forEach(icon => icons.add(icon));
    return Array.from(icons);
  }, [availableIcons]);

  const filteredIcons = allIcons.filter(icon => 
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
      >
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <DynamicIcon name={value} size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium truncate max-w-[80px]">{value}</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">بدون أيقونة</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 mt-2 -right-2 sm:right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 animate-in fade-in slide-in-from-top-2">
          <div className="relative mb-3">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن أيقونة..."
              className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
            />
          </div>

          <div className="max-h-64 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-center py-2 mb-2 rounded-lg text-xs font-medium transition-colors ${
                !value ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              بدون أيقونة
            </button>

            {searchQuery ? (
              <div className="grid grid-cols-5 gap-2">
                {filteredIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      onChange(icon);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                      value === icon 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    title={icon}
                  >
                    <DynamicIcon name={icon} size={18} />
                  </button>
                ))}
              </div>
            ) : (
              Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                <div key={category} className="mb-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">{category}</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => {
                          onChange(icon);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                          value === icon 
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                        title={icon}
                      >
                        <DynamicIcon name={icon} size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
