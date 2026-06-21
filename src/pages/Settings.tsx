import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, hapticFeedback, formatCurrency } from '../utils';
import { 
  Layers, Wallet, Database, Sparkles, UserCircle, 
  ChevronLeft, Award, HelpCircle, CheckCircle, ShieldAlert,
  Settings as SettingsIcon, Landmark, Info, Percent, Target, RefreshCw, PiggyBank
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import CategoryManager from './settings/CategoryManager';
import AccountManager from './settings/AccountManager';
import DataManager from './settings/DataManager';
import AIManager from './settings/AIManager';
import ProfileManager from './settings/ProfileManager';
import { NavLink } from 'react-router-dom';

// Import PageHeader component
import PageHeader from '../components/ui/PageHeader';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const LAUNCHER_ITEMS = [
  { path: '/budget', name: 'مخطط ومقارنة الميزانية الكلية', icon: Layers, desc: 'تحديد الميزانية الشهرية والتحليل الرسومي المباشر للفئات 📊', bg: 'from-rose-500/10 to-rose-500/5 hover:border-rose-500/30 border-rose-500/15', iconColor: 'text-rose-600' },
  { path: '/savings-indicators', name: 'مؤشرات وفرص التوفير', icon: Percent, desc: 'حساب نسبة الادخار من الراتب ومحاكاة القفة 🇹🇳', bg: 'from-emerald-500/10 to-emerald-500/5 hover:border-emerald-500/30 border-emerald-500/15', iconColor: 'text-emerald-600' },
  { path: '/savings', name: 'حصالة الادخار العائلية', icon: PiggyBank, desc: 'توفير مبالغ مخصصة للبيبي ومراجعة الأرصدة', bg: 'from-blue-500/10 to-blue-500/5 hover:border-blue-500/30 border-blue-500/15', iconColor: 'text-blue-600' },
  { path: '/goals', name: 'الأهداف المالية الكبرى', icon: Target, desc: 'خطط ادخار مصروف الرعاية، الصحة، والتعليم الكلي', bg: 'from-indigo-500/10 to-indigo-500/5 hover:border-indigo-500/30 border-indigo-500/15', iconColor: 'text-indigo-600' },
  { path: '/recurring', name: 'الفواتير والالتزامات المتكررة', icon: RefreshCw, desc: 'تنظيم مصاريف الكراء، فواتير STEG والصوناد شهرياً', bg: 'from-cyan-500/10 to-cyan-500/5 hover:border-cyan-500/30 border-cyan-500/15', iconColor: 'text-cyan-600' },
  { path: '/assistant', name: 'مستشار مالي بالذكاء الاصطناعي', icon: Sparkles, desc: 'استشارة المساعد العائلي لترشيد ميزانيتكم اليومية', bg: 'from-purple-500/10 to-purple-500/5 hover:border-purple-500/30 border-purple-500/15', iconColor: 'text-purple-600' },
];

const Settings = () => {
  const { 
    userName, 
    dailyBudget, 
    currency, 
    accounts, 
    categories,
    offlineMode 
  } = useAppContext();

  // Determine if it's a large screen reactively
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Detect mobile screen width & set default active tab accordingly
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'accounts' | 'data' | 'ai' | null>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return null;
    }
    return 'profile';
  });

  // Track window resizing and update screen state and default tab on desktop scale-up
  useEffect(() => {
    const handleResize = () => {
      const isLg = window.innerWidth >= 1024;
      setIsLargeScreen(isLg);
      if (isLg && activeTab === null) {
        setActiveTab('profile');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  // Smooth scroll container wrapper to top when active tab changes.
  // This solves scroll locks, dynamic height collapses, and scroll-down traps on mobile
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Dynamic count or status for tabs
  const getTabBadge = (id: string) => {
    switch(id) {
      case 'categories':
        return `${categories.length || 0}`;
      case 'accounts':
        return `${accounts.length || 0}`;
      case 'data':
        return offlineMode ? 'أوفلاين' : 'سحابي';
      case 'profile':
        return 'عائلتي';
      default:
        return 'ذكي';
    }
  };

  const TABS = [
    { id: 'profile', name: 'الملف الشخصي والجوائز', icon: UserCircle, description: 'الاسم والميزانية اليومية والجوائز العائلية', badgeColor: 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400' },
    { id: 'categories', name: 'إدارة فئات المصروف', icon: Layers, description: 'تنظيم قفة السوق والصحة وقاعدة 50/30/20', badgeColor: 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { id: 'accounts', name: 'الحسابات البنكية والمالية', icon: Wallet, description: 'تحديث أرصدة الحسابات وطرق الدفع الكاش', badgeColor: 'bg-blue-50 text-blue-650 dark:bg-blue-950/40 dark:text-blue-400' },
    { id: 'data', name: 'البيانات والأمان المالي', icon: Database, description: 'النسخ الاحتياطي التلقائي والصناعي والتحكم', badgeColor: 'bg-amber-50 text-amber-650 dark:bg-amber-950/40 dark:text-amber-400' },
    { id: 'ai', name: 'المساعد الذكي (Gemini API)', icon: Sparkles, description: 'خيارات المساعد والتوجيه الآلي للأسرة بالدينار التونسي', badgeColor: 'bg-pink-50 text-pink-650 dark:bg-pink-950/40 dark:text-pink-400' },
  ] as const;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto p-4 pb-32 space-y-6"
    >
      <PageHeader
        title="الإعدادات والتحكم الذكي"
        subtitle="تخصيص الدفتر المالي لعائلتك التونسية. اضبط الميزانيات، حدّث الحسابات، المزامنة السحابية وضبط المساعد الذكي."
        action={
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col gap-1 w-full md:w-auto text-right min-w-[220px] shadow-xs">
            <p className="text-[9px] font-bold text-slate-400">المستخدم الحالي النشط</p>
            <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">{userName || 'رب العائلة التونسية'}</p>
            <div className="my-1.5 border-t border-slate-250 dark:border-slate-800" />
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(dailyBudget || 14, currency)}</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold">الميزانية اليومية المقدرة:</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold mt-1">
              <span className="text-blue-600 dark:text-blue-400 font-mono">{accounts.length} حسابات</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold">الحقيبة المالية:</span>
            </div>
          </div>
        }
      />

      {/* 2. Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Sidebar Navigation List (Shows only on desktop OR on mobile when no tab is selected) */}
        <AnimatePresence mode="wait">
          {(activeTab === null || isLargeScreen) && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "lg:col-span-4 space-y-5 text-right",
                activeTab !== null ? "hidden lg:block animate-none" : "w-full"
              )}
            >
              {/* Section Heading for Settings */}
              <div className="space-y-1 pr-1">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">أقسام وجوانب الضبط</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">اختر حقلاً لتعديله ومراجعته فورياً</p>
              </div>

              {/* Sidebar List */}
              <div className="flex flex-col gap-2 bg-white/45 dark:bg-slate-950/35 p-3 rounded-3xl border border-slate-150 dark:border-slate-850">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => {
                        hapticFeedback('light');
                        setActiveTab(tab.id);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all text-right group relative overflow-hidden border cursor-pointer",
                        isActive 
                          ? "bg-slate-900 border-slate-950 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-md" 
                          : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-100/50 dark:border-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-900/60 hover:border-slate-200 dark:hover:border-slate-800"
                      )}
                    >
                      {/* Icon Container with color accent */}
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border",
                        isActive 
                          ? "bg-white/15 border-white/10 text-white dark:bg-slate-900/10 dark:border-slate-900/15 dark:text-slate-950" 
                          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800"
                      )}>
                        <Icon size={18} className="group-hover:scale-105 transition-transform" />
                      </div>
                      
                      {/* Tab label and info */}
                      <div className="flex-1 min-w-0 text-right pr-0.5">
                        <div className="flex items-center gap-2 justify-start">
                          <span className={cn(
                            "text-xs font-black tracking-tight transition-colors truncate",
                            isActive ? "text-white dark:text-slate-950" : "text-slate-850 dark:text-slate-200"
                          )}>
                            {tab.name}
                          </span>
                          <span className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded-md min-w-[16px] text-center shrink-0",
                            isActive
                              ? "bg-white/10 text-white dark:bg-slate-950/10 dark:text-slate-950"
                              : tab.badgeColor
                          )}>
                            {getTabBadge(tab.id)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-[9px] font-semibold truncate leading-normal mt-0.5 max-w-[210px]",
                          isActive ? "text-slate-300 dark:text-slate-600" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {tab.description}
                        </p>
                      </div>

                      <ChevronLeft 
                        size={14} 
                        className={cn(
                          "mr-auto transition-transform",
                          isActive ? "text-white dark:text-slate-950 translate-x-1" : "text-slate-300 dark:text-slate-600 group-hover:text-slate-400 font-bold"
                        )} 
                      />
                    </button>
                  );
                })}
              </div>

              {/* Decorative Tip Box for users */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 text-right">
                <div className="flex items-center gap-1.5 justify-end text-[10px] font-black text-slate-500">
                  <span>معلومة الأمان المالي</span>
                  <Info size={12} className="text-primary-500" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  جميع النفقات، الحسابات الشخصية والفئات المتخصصة تونسياً لحماية طفلك وتأمين طفولته محفوظة محلياً وتعمل بدون إنترنت بالكامل.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT COLUMN: Active settings content OR Mobile Hub Launcher if no tab is selected */}
        <div className={cn(
          "space-y-6 text-right lg:col-span-8 w-full min-h-[520px] lg:min-h-[620px] transition-all relative flex flex-col",
          activeTab === null ? "block" : "block"
        )}>
          <AnimatePresence mode="wait">
            {activeTab !== null ? (
              /* ACTIVE MANAGER WINDOW */
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 lg:p-8 shadow-sm border border-slate-200/55 dark:border-slate-800/80 w-full flex-1 flex flex-col min-h-[500px] lg:min-h-[600px]"
              >
                {/* Mobile Back Button built beautifully into container top */}
                <div className="flex items-center gap-2 lg:hidden pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 justify-between">
                  <button 
                    type="button"
                    onClick={() => { hapticFeedback('medium'); setActiveTab(null); }}
                    className="flex items-center gap-1.5 text-[10px] font-black text-primary-650 dark:text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-xl transition-all border border-primary-500/10 active:scale-95 shrink-0"
                  >
                    <ChevronLeft size={14} className="rotate-180" />
                    <span>الرجوع للوحة التوجيه</span>
                  </button>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">الدفتر المالي التونسي</span>
                </div>

                {activeTab === 'profile' && <ProfileManager />}
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'accounts' && <AccountManager />}
                {activeTab === 'data' && <DataManager />}
                {activeTab === 'ai' && <AIManager />}
              </motion.div>
            ) : (
              /* MOBILE LAUNCHER/DIRECT HUB (Active when activeTab is null) */
              <motion.div
                key="launcher-hub"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 w-full flex-1 flex flex-col min-h-[500px]"
              >
                {/* Launchpad Grid Column of options */}
                <div className="space-y-1 pr-1 text-right">
                  <h3 className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1.5 justify-end">
                    <span>لوحة التوجيه والتنقل السلس</span>
                    <SettingsIcon size={12} className="rotate-45" />
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">وصول فوري كامل لعيون تيسير وادخار العائلة التونسية</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LAUNCHER_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={index}
                        to={item.path}
                        onClick={() => hapticFeedback('light')}
                        className={({ isActive }) => cn(
                          "p-4 rounded-3xl bg-gradient-to-tr border text-right flex items-start gap-4 transition-all duration-200 cursor-pointer shadow-xs hover:scale-101 hover:shadow-sm active:scale-98",
                          item.bg
                        )}
                      >
                        {/* Icon Container with glowing theme */}
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xs",
                          item.iconColor
                        )}>
                          <Icon size={20} className="w-5 h-5" />
                        </div>
                        
                        {/* Launcher Title & Description */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="text-xs font-black text-slate-850 dark:text-white leading-tight">{item.name}</h4>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                        </div>
                        
                        {/* Left visual arrow pointing to next screen */}
                        <ChevronLeft size={16} className="text-slate-400 shrink-0 self-center" />
                      </NavLink>
                    );
                  })}
                </div>

                {/* Mobile Extra Help visual widget */}
                <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 p-5 rounded-2xl md:rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-4 text-right">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">هل تواجه غموضاً في تتبع ميزانية البيت؟</h4>
                    <p className="text-[9px] text-slate-400 font-bold">يمكنك دائماً الاعتماد على المساعد المالي عالي الكفاءة المدعوم بـ Gemini لتقديم توجيهات أسبوعية مخصصة.</p>
                  </div>
                  <NavLink
                    to="/assistant"
                    className="px-4 py-2 bg-indigo-600 dark:bg-indigo-400 text-white dark:text-slate-950 font-black text-[10px] rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    التحدث مع المساعد الذكي
                  </NavLink>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default Settings;
