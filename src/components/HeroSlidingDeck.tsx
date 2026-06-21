import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Gem, 
  PiggyBank, 
  ArrowDown, 
  ArrowUp, 
  HelpCircle, 
  Target, 
  Plus, 
  ArrowRightLeft, 
  Sparkles,
  Shield
} from 'lucide-react';
import { Account, Goal } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { AnimatedNumber } from './AnimatedNumber';
import { formatCurrency, cn, hapticFeedback } from '../utils';

interface HeroSlidingDeckProps {
  heroTab: 'wallet' | 'anatomy' | 'savings';
  setHeroTab: (tab: 'wallet' | 'anatomy' | 'savings') => void;
  totalNetWorth: number;
  currency: string;
  totalMonthlyIncome: number;
  totalMonthlyExpense: number;
  accounts: Account[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  activeAccount: Account | undefined;
  typeSpent: { need: number; want: number; saving: number };
  goals: Goal[];
  setIsAddModalOpen: (open: boolean) => void;
  setEditingExpense: (expense: any) => void;
}

const HeroSlidingDeck: React.FC<HeroSlidingDeckProps> = ({
  heroTab,
  setHeroTab,
  totalNetWorth,
  currency,
  totalMonthlyIncome,
  totalMonthlyExpense,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  activeAccount,
  typeSpent,
  goals,
  setIsAddModalOpen,
  setEditingExpense
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl min-h-[470px] flex flex-col justify-between text-right" dir="rtl">
      {/* Ambient FinTech Neon Glows */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-[110px] pointer-events-none" />
      
      {/* Fine Cybernetic Grid Pattern Overlay to add precision look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Sliding Glassy Tab Menu Bar */}
        <div className="flex bg-slate-950/40 backdrop-blur-xl p-1 rounded-2xl border border-white/10 max-w-sm w-full sm:w-auto">
          {[
            { id: 'wallet', label: 'المحفظة الذكية', icon: Wallet },
            { id: 'anatomy', label: 'توزيع الميزانية', icon: Gem },
            { id: 'savings', label: 'مؤشرات التوفير', icon: PiggyBank },
          ].map((tab) => {
            const isActive = heroTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  hapticFeedback('light');
                  setHeroTab(tab.id as any);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all relative overflow-hidden whitespace-nowrap cursor-pointer",
                  isActive 
                    ? "bg-white text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <tab.icon size={13} className={isActive ? "text-emerald-500" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-400 pl-4 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>عضوية المسار الممتاز</span>
        </div>
      </div>

      {/* Tab Contents with AnimatePresence */}
      <div className="relative z-10 my-6 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {heroTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 flex flex-col h-full justify-between"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-950/20 p-5 rounded-3xl border border-white/5">
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1 block">إجمالي صافي الأصول</span>
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter shrink-0 flex items-center gap-2 justify-end">
                    <AnimatedNumber value={totalNetWorth} currency={currency} />
                  </h2>
                </div>

                {/* Cashflow quick ratio */}
                <div className="flex gap-4 border-r border-white/10 pr-6 rtl:md:border-r rtl:md:pr-6 rtl:md:border-l-0 rtl:md:pl-0 justify-end">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 mb-1 text-emerald-450 justify-end">
                      <ArrowDown size={14} className="animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">مداخيل الدورة</span>
                    </div>
                    <p className="text-sm sm:text-base font-black text-white tracking-tight">{formatCurrency(totalMonthlyIncome, currency)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 mb-1 text-rose-450 justify-end">
                      <ArrowUp size={14} />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">تكاليف العمليات</span>
                    </div>
                    <p className="text-sm sm:text-base font-black text-white tracking-tight">{formatCurrency(totalMonthlyExpense, currency)}</p>
                  </div>
                </div>
              </div>

              {/* Interactive Bank Account Cards Deck */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">قائمة الخزائن والحسابات</span>
                  {activeAccount && (
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                      {((activeAccount.balance / (totalNetWorth || 1)) * 100).toFixed(0)}% من الثروة الكلية
                    </span>
                  )}
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                  {accounts.map((acc, index) => {
                    const isSelected = selectedAccountId ? selectedAccountId === acc.id : accounts[0]?.id === acc.id;
                    
                    // Exquisite metallic layouts for account cards
                    const themes = [
                      { bg: "bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 border-white/10 text-white" },
                      { bg: "bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 border-indigo-500/20 text-indigo-100" },
                      { bg: "bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/25 text-emerald-100" },
                      { bg: "bg-gradient-to-tr from-amber-950 via-slate-900 to-slate-950 border-amber-500/20 text-amber-100" }
                    ];
                    const activeTheme = themes[index % themes.length];

                    return (
                      <motion.div
                        key={acc.id}
                        onClick={() => {
                          hapticFeedback('light');
                          setSelectedAccountId(acc.id);
                        }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "min-w-[150px] sm:min-w-[180px] p-4 rounded-2xl border text-right cursor-pointer shrink-0 transition-all duration-300 relative overflow-hidden",
                          isSelected 
                            ? "bg-white text-slate-900 border-white shadow-xl shadow-emerald-500/5"
                            : cn(activeTheme.bg, "hover:bg-slate-900/80")
                        )}
                      >
                        {/* Reflective light strip on top of selected card */}
                        {isSelected && (
                          <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />
                        )}
                        
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 translate-x-12 w-24 h-24 bg-gradient-to-tr from-transparent to-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center border",
                            isSelected ? "bg-slate-100 text-slate-900 border-slate-200" : "bg-slate-800 text-white border-slate-700"
                          )}>
                            <DynamicIcon name={acc.icon || 'Wallet'} size={14} />
                          </div>

                          {/* Custom Gold Credit Card Chip Mockup */}
                          <div className="w-6 h-4.5 rounded bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-405 border border-amber-600/30 flex flex-col justify-between p-1 opacity-75">
                            <div className="w-full h-[0.5px] bg-amber-600/40" />
                            <div className="w-1/2 h-full border-r border-amber-600/40" />
                          </div>
                        </div>

                        <div className="mt-4 text-right">
                          <h5 className={cn("text-[8px] font-black uppercase tracking-wider mb-0.5", isSelected ? "text-slate-500" : "text-slate-400")}>{acc.name} </h5>
                          <p className="text-sm font-black tracking-tight leading-none">{formatCurrency(acc.balance, currency)}</p>
                          <div className={cn("text-[7px] font-mono mt-1 tracking-widest opacity-60", isSelected ? "text-slate-400" : "text-slate-505")}>
                            •••• {1200 + index * 452}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {heroTab === 'anatomy' && (
            <motion.div
              key="anatomy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-right"
            >
              <div>
                <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 justify-end">
                  <Gem className="size-4.5 text-indigo-400 animate-pulse" />
                  الهيكل التوزيعي المتزن (50/30/20)
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                  تنظيم توزيع نفقاتك لضمان تحقيق كلي للتوافق التمويلي ورفع الادخار التراكمي.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* Needs */}
                <div className="space-y-1 bg-slate-950/25 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-indigo-300 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" /> الاحتياجات الضرورية (50%)
                    </span>
                    <span className="font-black text-white font-mono">{formatCurrency(typeSpent.need, currency)}</span>
                  </div>
                  <div className="h-2 bg-slate-950/70 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(100, (typeSpent.need / (totalMonthlyExpense || 1)) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-lg" 
                    />
                  </div>
                </div>

                {/* Wants */}
                <div className="space-y-1 bg-slate-950/25 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> الرغبات والكماليات (30%)
                    </span>
                    <span className="font-black text-white font-mono">{formatCurrency(typeSpent.want, currency)}</span>
                  </div>
                  <div className="h-2 bg-slate-950/70 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(100, (typeSpent.want / (totalMonthlyExpense || 1)) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-lg" 
                    />
                  </div>
                </div>

                {/* Savings */}
                <div className="space-y-1 bg-slate-950/25 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> الادخار والاستثمار الذكي (20%)
                    </span>
                    <span className="font-black text-white font-mono">{formatCurrency(typeSpent.saving, currency)}</span>
                  </div>
                  <div className="h-2 bg-slate-950/70 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(100, (typeSpent.saving / (totalMonthlyExpense || 1)) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-lg" 
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/30 rounded-2xl border border-white/5 flex items-start gap-2 text-[10px] text-slate-300 leading-normal justify-end">
                <HelpCircle size={13} className="shrink-0 text-amber-400 mt-0.5" />
                <span>
                  المقاييس تُبني على صافي الدخل. ننصح بعدم زيادة الرغبات عن 30% لدعم عجلة الادخار والاستثمار الفردي.
                </span>
              </div>
            </motion.div>
          )}

          {heroTab === 'savings' && (
            <motion.div
              key="savings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5 text-right"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 justify-end">
                  <Target className="size-4.5 text-emerald-450" />
                  مستهدفات الادخار النشطة
                </h4>
                <Link to="/goals" className="text-[9px] font-black text-emerald-400 underline uppercase tracking-widest">لوحة الأهداف</Link>
              </div>

              {goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.slice(0, 2).map((goal) => {
                    const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
                    return (
                      <div key={goal.id} className="p-3.5 bg-slate-950/30 rounded-2xl border border-white/5 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {goal.name}
                            {goal.isEmergencyFund && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <Shield size={8} />
                                طوارئ
                              </span>
                            )}
                          </span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-950/65 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          <span>المحقق: {formatCurrency(goal.currentAmount, currency)}</span>
                          <span>الهدف: {formatCurrency(goal.targetAmount, currency)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-950/20 rounded-3xl border border-white/5">
                  <p className="text-xs font-bold text-slate-400 max-w-xs mx-auto mb-4">ليس لديك أهداف ادخار مسجلة حالياً. ابدأ بالتخطيط لمشاريعك المستقبلية!</p>
                  <Link to="/goals" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all inline-block shadow-md">إنشاء هدف ادخار</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions Grid */}
      <div className="relative z-10 grid grid-cols-4 gap-2 pt-4 border-t border-slate-800/60">
        {[
          { icon: Plus, label: 'إضافة عملية', color: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/10', action: () => setIsAddModalOpen(true) },
          { icon: ArrowRightLeft, label: 'تحويل سريع', color: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/10', action: () => { setEditingExpense({ isTransfer: true } as any); setIsAddModalOpen(true); } },
          { icon: Target, label: 'الأهداف', color: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/10', link: '/goals' },
          { icon: Sparkles, label: 'المساعد', color: 'bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white border border-violet-500/10', link: '/assistant' },
        ].map((item, idx) => (
          <motion.div key={idx} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            {item.link ? (
              <Link to={item.link} className={cn("w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-black tracking-tight transition-all duration-300 cursor-pointer", item.color)}>
                <item.icon size={15} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button onClick={item.action} className={cn("w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-black tracking-tight transition-all duration-300 cursor-pointer", item.color)}>
                <item.icon size={15} />
                <span>{item.label}</span>
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HeroSlidingDeck;
