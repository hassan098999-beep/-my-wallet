import React, { useState, useRef, useEffect } from 'react';
import { Settings, Target, Repeat, Trophy, Flag, LogOut, User, PlusCircle, PiggyBank, Moon, Sun } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useAppContext } from '../store/AppContext';

const dropdownItems = [
  { path: '/budget', name: 'الميزانيات', icon: Target },
  { path: '/recurring', name: 'المصاريف المتكررة', icon: Repeat },
  { path: '/goals', name: 'الأهداف المالية', icon: Flag },
  { path: '/savings', name: 'تخصيص الادخار', icon: PiggyBank },
  { path: '/settings', name: 'الإعدادات', icon: Settings },
];

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setIsAddModalOpen, theme, setTheme } = useAppContext();
  const location = useLocation();

  const getPageName = () => {
    switch (location.pathname) {
      case '/': return 'الرئيسية';
      case '/transactions': return 'العمليات';
      case '/analytics': return 'الإحصائيات';
      case '/budget': return 'الميزانيات';
      case '/recurring': return 'المصاريف المتكررة';
      case '/goals': return 'الأهداف المالية';
      case '/savings': return 'تخصيص الادخار';
      case '/income': return 'الدخل';
      case '/settings': return 'الإعدادات';
      default: return 'مصاريفي';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 md:h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-4 md:px-6 z-[100] sticky top-0">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase">
          {getPageName()}
        </h2>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors backdrop-blur-md"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="sm:hidden p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <PlusCircle size={20} />
        </button>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <PlusCircle size={16} />
          <span className="font-black text-xs uppercase tracking-widest">إضافة</span>
        </button>
        
        <NotificationBell />
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors backdrop-blur-md"
          >
            <Settings size={18} className={cn("transition-transform duration-500", isDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute left-0 mt-3 w-64 glass-card rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100/50 dark:border-slate-700/50 overflow-hidden z-50"
              >
                <div className="p-5 border-b border-slate-100/50 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
                      <User size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">حسابي</p>
                      <p className="text-[10px] font-bold text-slate-500 truncate">hassan098999@gmail.com</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  {dropdownItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsDropdownOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all",
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon size={18} className={cn("transition-transform", isActive && "scale-110")} />
                          <span className="uppercase tracking-wider">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
                
                <div className="p-2 border-t border-slate-100/50 dark:border-slate-700/50">
                  <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all w-full text-right uppercase tracking-widest">
                    <LogOut size={18} />
                    تسجيل الخروج
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
