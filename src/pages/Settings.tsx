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

  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'accounts' | 'data' | 'ai'>('profile');

  // Smooth scroll container wrapper to top when active tab changes.
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
      className="max-w-6xl mx-auto p-4 pb-32 space-y-8"
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

      {/* Main Grid: Responsive Tab Control + Active Tab Manager View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TAB CONTROLS (Vertical sidebar on desktop, horizontal scrollable bar on mobile) */}
        <div className="col-span-1 lg:col-span-4 space-y-4">
          <div className="hidden lg:block space-y-1 mb-2 pr-1">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400">أقسام وجوانب الضبط</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">تفضيلات عائلية متكاملة لبرمجة الدفتر</p>
          </div>

          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2.5 lg:pb-0 scrollbar-none snap-x snap-mandatory bg-slate-50/50 dark:bg-slate-950/20 p-2 lg:p-3 rounded-2xl lg:rounded-3xl border border-slate-100 dark:border-slate-800">
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
                    "flex lg:flex-row items-center gap-2 lg:gap-3.5 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all text-right group relative overflow-hidden border cursor-pointer snap-center shrink-0 min-w-[135px] lg:min-w-0 flex-1 justify-center lg:justify-start",
                    isActive 
                      ? "bg-slate-900 border-slate-950 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-md" 
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:bg-slate-100/80 dark:hover:bg-slate-900/60"
                  )}
                >
                  {/* Icon Container */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 border",
                    isActive 
                      ? "bg-white/15 border-white/14 text-white dark:bg-slate-900/10 dark:border-slate-900/15 dark:text-slate-950" 
                      : "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800"
                  )}>
                    <Icon size={16} />
                  </div>
                  
                  {/* Label & Description */}
                  <div className="text-right min-w-0 pr-0.5">
                    <div className="flex items-center gap-2 justify-start">
                      <span className={cn(
                        "text-[10px] lg:text-xs font-black tracking-tight block truncate",
                        isActive ? "text-white dark:text-slate-950" : "text-slate-850 dark:text-slate-250"
                      )}>
                        {tab.name}
                      </span>
                      <span className={cn(
                        "hidden lg:inline-block text-[8px] font-black px-1.5 py-0.5 rounded-md min-w-[16px] text-center shrink-0",
                        isActive
                          ? "bg-white/10 text-white dark:bg-slate-950/10 dark:text-slate-950"
                          : tab.badgeColor
                      )}>
                        {getTabBadge(tab.id)}
                      </span>
                    </div>
                    <p className={cn(
                      "hidden lg:block text-[9px] font-semibold truncate leading-normal mt-0.5 max-w-[210px]",
                      isActive ? "text-slate-300 dark:text-slate-600" : "text-slate-400 dark:text-slate-500"
                    )}>
                      {tab.description}
                    </p>
                  </div>

                  <ChevronLeft 
                    size={14} 
                    className={cn(
                      "hidden lg:block mr-auto transition-transform",
                      isActive ? "text-white dark:text-slate-950 translate-x-1" : "text-slate-350 dark:text-slate-650 group-hover:translate-x-0.5"
                    )} 
                  />
                </button>
              );
            })}
          </div>

          {/* Decorative Advice widget */}
          <div className="hidden lg:block p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 text-right">
            <div className="flex items-center gap-1.5 justify-end text-[10px] font-black text-slate-500">
              <span>معلومة الأمان المالي</span>
              <Info size={12} className="text-primary-500" />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              جميع النفقات، الحسابات الشخصية والفئات المتخصصة تونسياً لحماية طفلك وتأمين طفولته محفوظة محلياً وتعمل بدون إنترنت بالكامل.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Active settings content container */}
        <div className="col-span-1 lg:col-span-8 w-full min-h-[480px] lg:min-h-[580px] transition-all relative flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.99, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2rem] p-4 md:p-6 lg:p-8 shadow-xs border border-slate-150 dark:border-slate-800/80 w-full flex-1 flex flex-col min-h-[460px] lg:min-h-[560px]"
            >
              {activeTab === 'profile' && <ProfileManager />}
              {activeTab === 'categories' && <CategoryManager />}
              {activeTab === 'accounts' && <AccountManager />}
              {activeTab === 'data' && <DataManager />}
              {activeTab === 'ai' && <AIManager />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* 3. Secondary Launcher Directory (Financial Tools Quick Access Hub) */}
      <div className="pt-8 border-t border-slate-150 dark:border-slate-800 space-y-4">
        <div className="space-y-1 text-right pr-1">
          <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 justify-end">
            <span>لوحة التنقل السريع والأدوات المالية</span>
            <SettingsIcon size={12} className="text-primary-500" />
          </h3>
          <p className="text-[10px] text-slate-400 font-bold">قم بالوصول السريع لمختلف جوانب التخطيط المالي لعائلتك</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LAUNCHER_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={index}
                to={item.path}
                onClick={() => hapticFeedback('light')}
                className={cn(
                  "p-4 rounded-2xl bg-gradient-to-tr border text-right flex items-start gap-4 transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] hover:shadow-xs active:scale-98",
                  item.bg
                )}
              >
                {/* Icon Container with glowing theme */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xs",
                  item.iconColor
                )}>
                  <Icon size={18} />
                </div>
                
                {/* Launcher Title & Description */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="text-xs font-black text-slate-850 dark:text-white leading-tight">{item.name}</h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                </div>
                
                {/* Left visual arrow pointing to next screen */}
                <ChevronLeft size={14} className="text-slate-400 shrink-0 self-center" />
              </NavLink>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
