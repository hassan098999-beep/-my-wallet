import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ChartPie, History, Plus, Sparkles, SlidersHorizontal, Baby, HandCoins, BarChart3, PiggyBank, User, ShieldCheck, RefreshCcw } from 'lucide-react';
import { cn, hapticFeedback } from '../utils';
import { motion } from 'motion/react';
import { useAppContext } from '../store/AppContext';

const mainNavItems = [
  { path: '/', name: 'الرئيسية العائلية', icon: Home },
  { path: '/savings-indicators', name: 'مؤشر الصحة والتوفير 🛡️', icon: ShieldCheck },
  { path: '/recurring', name: 'الالتزامات والفواتير 🔄', icon: RefreshCcw },
  { path: '/budget', name: 'الميزانية ووتيرة الصرف', icon: ChartPie },
  { path: '/savings', name: 'منصة الادخار الذكي', icon: PiggyBank },
  { path: '/family', name: 'التقارير العائلية', icon: Baby },
];

const subNavItems = [
  { path: '/analytics', name: 'التحليلات والإحصائيات', icon: BarChart3 },
  { path: '/transactions', name: 'سجل العمليات الكامل', icon: History },
  { path: '/debts', name: 'الديون والقروض', icon: HandCoins },
  { path: '/assistant', name: 'المساعد الذكي AI', icon: Sparkles },
  { path: '/profile', name: 'الملف الشخصي', icon: User },
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
    <div className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-[#0c121e] border-l border-slate-200/80 dark:border-slate-800/80 relative z-40 shrink-0 font-tajawal">
      {/* Brand & Workspace Zone */}
      <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <span className="font-black text-lg">م</span>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">مصاريفي</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-md">PRO</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {userName ? `مرحباً، ${userName}` : 'المنصة المالية العائلية'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3.5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">القوائم الرئيسية</p>
          <nav className="space-y-0.5">
            {mainNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">الأدوات والسجلات</p>
          <nav className="space-y-0.5">
            {subNavItems.map((item) => (
              <NavItem key={item.path} item={item} isSubItem />
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/70 shrink-0">
        <motion.button
          onClick={handleAddClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all font-bold group cursor-pointer"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
          <span className="text-xs font-black">إضافة عملية جديدة ⚡</span>
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
          "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 relative group",
          isActive
            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-bold"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium",
          isSubItem ? "text-xs py-2" : "text-sm py-2.5"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            "transition-colors shrink-0",
            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
          )}>
            <item.icon size={isSubItem ? 17 : 19} strokeWidth={isActive ? 2.5 : 2} />
          </div>
          <span className="truncate">
            {item.name}
          </span>
          {isActive && (
            <motion.div
              layoutId="activeSidebarIndicator"
              className="mr-auto w-1.5 h-4 bg-emerald-500 rounded-full"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
};

export default Sidebar;
