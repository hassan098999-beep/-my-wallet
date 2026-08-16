import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ChartPie, History, Settings, Plus, Sparkles, Wallet, RefreshCcw, Target, PiggyBank, SlidersHorizontal, Percent, Baby, Zap, HandCoins } from 'lucide-react';
import { cn, hapticFeedback } from '../utils';
import { motion } from 'motion/react';
import { useAppContext } from '../store/AppContext';

const mainNavItems = [
  { path: '/', name: 'الرئيسية العائلية', icon: Home },
  { path: '/budget', name: 'الميزانية والالتزامات', icon: ChartPie },
  { path: '/savings', name: 'منصة الادخار الذكي', icon: PiggyBank },
  { path: '/family', name: 'التقارير والتحليلات', icon: Baby },
];

const subNavItems = [
  { path: '/debts', name: 'الديون والقروض', icon: HandCoins },
  { path: '/transactions', name: 'سجل العمليات الكامل', icon: History },
  { path: '/assistant', name: 'المساعد الذكي AI', icon: Sparkles },
  { path: '/settings', name: 'إعدادات النظام', icon: SlidersHorizontal },
];

interface SidebarProps {
  onAddClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddClick }) => {
  const { userName } = useAppContext();

  const handleAddClick = () => {
    hapticFeedback('medium');
    onAddClick();
  };

  return (
    <div className="hidden md:flex flex-col w-64 h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200/50 dark:border-slate-800/50 relative z-40 shrink-0">
      <div className="p-6 flex items-center justify-center border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 overflow-hidden shadow-sm shrink-0">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0" alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-none mb-1 truncate">مرحباً بعودتك</p>
            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{userName || 'صديقي'} 👋</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        <div>
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">القائمة والتحليلات</p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">الأدوات والسجل</p>
          <nav className="space-y-1">
            {subNavItems.map((item) => (
              <NavItem key={item.path} item={item} isSubItem />
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 shrink-0">
        <motion.button
          onClick={handleAddClick}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all font-bold group cursor-pointer"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-xs uppercase tracking-widest">إضافة عملية جديدة ⚡</span>
        </motion.button>
      </div>
    </div>
  );
};

const NavItem = ({ item, isSubItem = false }: { item: typeof mainNavItems[0], isSubItem?: boolean }) => {
  const handleNavClick = () => hapticFeedback('light');

  return (
    <NavLink
      to={item.path}
      onClick={handleNavClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group",
          isActive
            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-500/10 shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
          isSubItem ? "py-2.5" : "py-3"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeSidebarIndicator"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-500 rounded-l-full"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <div className={cn(
            "transition-colors",
            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
          )}>
            <item.icon size={isSubItem ? 18 : 20} strokeWidth={isActive ? 2.5 : 2} />
          </div>
          <span className={cn(
            "font-black tracking-wide transition-transform duration-300",
            isActive ? "mr-1" : "group-hover:mr-1",
            isSubItem ? "text-xs" : "text-sm",
          )}>
            {item.name}
          </span>
        </>
      )}
    </NavLink>
  );
};

export default Sidebar;
