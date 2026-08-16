import React, { useState, useRef, useEffect } from 'react';
import { Settings2, Target, RefreshCcw, Trophy, Flag, LogOut, LogIn, UserCircle, PlusCircle, PiggyBank, Moon, Sun, Wallet, SlidersHorizontal, ChartPie, Baby, Loader2, HandCoins } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useAppContext } from '../store/AppContext';

const dropdownItems = [
  { path: '/debts', name: 'الديون والقروض (لي / علي)', icon: HandCoins },
  { path: '/income', name: 'إدارة الدخل', icon: Wallet },
  { path: '/budget', name: 'الميزانيات', icon: ChartPie },
  { path: '/family', name: 'تفريرة العيلة', icon: Baby },
  { path: '/recurring', name: 'المصاريف المتكررة', icon: RefreshCcw },
  { path: '/goals', name: 'الأهداف المالية', icon: Target },
  { path: '/savings', name: 'الادخار والأهداف', icon: PiggyBank },
  { path: '/settings', name: 'الإعدادات', icon: SlidersHorizontal },
];

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, user, login, logout, isAuthReady } = useAppContext();
  const location = useLocation();

  const getPageName = () => {
    switch (location.pathname) {
      case '/': return 'الرئيسية';
      case '/debts': return 'الديون والقروض الشخصية';
      case '/transactions': return 'العمليات';
      case '/analytics': return 'الإحصائيات';
      case '/budget': return 'الميزانيات';
      case '/recurring': return 'المصاريف المتكررة';
      case '/goals': return 'الأهداف المالية';
      case '/savings': return 'الادخار والأهداف';
      case '/income': return 'الدخل';
      case '/family': return 'تفريرة العيلة';
      case '/settings': return 'الإعدادات';
      case '/assistant': return 'المساعد الذكي';
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
    <header className="h-[calc(3rem+env(safe-area-inset-top))] md:h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-3 md:px-5 z-[100] sticky top-0">
      <div className="flex items-center gap-3">
        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
          {getPageName()}
        </h2>
      </div>
      
      <div className="flex items-center gap-1.5">
        <div className="relative group">
          <button
            aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="absolute top-full right-0 mt-2 w-max px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
            {theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          </div>
        </div>
        
        <NotificationBell />
        
        <div className="relative" ref={dropdownRef}>
          <button
            aria-label="القائمة الإضافية"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Settings2 size={16} className={cn("transition-transform duration-500", isDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute left-0 mt-3 w-64 glass-card rounded-2xl shadow-md border border-slate-100/50 dark:border-slate-700/50 overflow-hidden z-50"
              >
                <div className="p-5 border-b border-slate-100/50 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                      <UserCircle size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">حسابي</p>
                      {!isAuthReady ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-500">
                          <Loader2 size={12} className="animate-spin shrink-0" />
                          <span>جاري التحقق من الهوية...</span>
                        </div>
                      ) : (
                        <p className="text-[10px] font-semibold text-slate-400 truncate">{user ? user.email : 'حساب محلي (غير متصل)'}</p>
                      )}
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
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all",
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon size={18} className={cn("transition-transform", isActive && "scale-110")} />
                          <span>{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
                
                <div className="p-2 border-t border-slate-100/50 dark:border-slate-700/50">
                  {!isAuthReady ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-slate-400">
                      <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" />
                      <span>جاري التحقق...</span>
                    </div>
                  ) : user ? (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); logout(); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all w-full text-right cursor-pointer"
                    >
                      <LogOut size={18} />
                      تسجيل الخروج
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); login(); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all w-full text-right cursor-pointer"
                    >
                      <LogIn size={18} />
                      تسجيل الدخول (Google)
                    </button>
                  )}
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
