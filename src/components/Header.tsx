import React, { useState, useRef, useEffect } from 'react';
import { Settings2, PiggyBank, RefreshCcw, LogOut, LogIn, UserCircle, Moon, Sun, Wallet, SlidersHorizontal, Loader2, HandCoins, BarChart3, History } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useAppContext } from '../store/AppContext';

const dropdownItems = [
  { path: '/analytics', name: 'التحليلات والإحصائيات 📊', icon: BarChart3 },
  { path: '/transactions', name: 'سجل العمليات 📜', icon: History },
  { path: '/debts', name: 'الديون والقروض (لي / علي) 🤝', icon: HandCoins },
  { path: '/income', name: 'إدارة الدخل 💰', icon: Wallet },
  { path: '/recurring', name: 'المصاريف المتكررة 🔄', icon: RefreshCcw },
  { path: '/savings', name: 'الادخار والأهداف 🎯', icon: PiggyBank },
  { path: '/settings', name: 'الإعدادات والتحكم ⚙️', icon: SlidersHorizontal },
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
      case '/savings': return 'الادخار والأهداف';
      case '/income': return 'الدخل';
      case '/family': return 'تفريرة العيلة';
      case '/profile': return 'الملف الشخصي والإنجازات';
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
    <header className="h-[calc(3.25rem+env(safe-area-inset-top))] md:h-14 pt-[env(safe-area-inset-top)] bg-white/90 dark:bg-[#0c121e]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-3 md:px-6 z-[100] sticky top-0 shrink-0 font-tajawal">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <span>مصاريفي</span>
          <span>/</span>
        </div>
        <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {getPageName()}
        </h2>
      </div>
      
      {/* Zone 3: Actions (Theme, Notifications, Settings/Profile) */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <div className="relative group">
          <button
            aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-xs cursor-pointer flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-md">
            {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          </div>
        </div>
        
        {/* Notification Bell */}
        <NotificationBell />
        
        {/* Settings & Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            aria-label="القائمة الإضافية"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-xs cursor-pointer flex items-center justify-center"
          >
            <Settings2 size={17} className={cn("transition-transform duration-300", isDropdownOpen && "rotate-90 text-emerald-600 dark:text-emerald-400")} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 mt-2.5 w-68 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
                      <UserCircle size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">الحساب والمزامنة</p>
                      {!isAuthReady ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500">
                          <Loader2 size={11} className="animate-spin shrink-0" />
                          <span>التحقق من الهوية...</span>
                        </div>
                      ) : (
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                          {user ? user.email : 'حساب محلي (بيانات آمنة)'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-1.5 space-y-0.5">
                  {dropdownItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsDropdownOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon size={16} className={cn("shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")} />
                          <span className="truncate">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
                
                <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  {!isAuthReady ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400">
                      <Loader2 size={14} className="animate-spin text-emerald-500 shrink-0" />
                      <span>جاري التحقق...</span>
                    </div>
                  ) : user ? (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); logout(); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all w-full text-right cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>تسجيل الخروج</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); login(); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all w-full text-right cursor-pointer"
                    >
                      <LogIn size={16} />
                      <span>تسجيل الدخول (Google)</span>
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
