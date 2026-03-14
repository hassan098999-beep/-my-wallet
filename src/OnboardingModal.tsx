import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Landmark, Coins, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '../utils';

const OnboardingModal: React.FC = () => {
  const { hasCompletedOnboarding, completeOnboarding, setCurrency, updateAccount, accounts } = useAppContext();
  const [step, setStep] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState('TND');
  const [initialBalances, setInitialBalances] = useState<Record<string, string>>({
    cash: '0',
    bank: '0'
  });

  if (hasCompletedOnboarding) return null;

  const currencies = [
    { code: 'TND', name: 'دينار تونسي', flag: '🇹🇳' },
    { code: 'SAR', name: 'ريال سعودي', flag: '🇸🇦' },
    { code: 'AED', name: 'درهم إماراتي', flag: '🇦🇪' },
    { code: 'USD', name: 'دولار أمريكي', flag: '🇺🇸' },
    { code: 'EUR', name: 'يورو', flag: '🇪🇺' },
    { code: 'EGP', name: 'جنيه مصري', flag: '🇪🇬' },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Finalize
      setCurrency(selectedCurrency);
      
      // Update initial accounts
      const cashAcc = accounts.find(a => a.id === 'cash');
      const bankAcc = accounts.find(a => a.id === 'bank');
      
      if (cashAcc && initialBalances.cash !== '0') {
        updateAccount(cashAcc.id, { balance: Number(initialBalances.cash) });
      }
      if (bankAcc && initialBalances.bank !== '0') {
        updateAccount(bankAcc.id, { balance: Number(initialBalances.bank) });
      }
      
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="p-8 md:p-12">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-10">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                    s <= step ? "bg-primary-500" : "bg-slate-100 dark:bg-slate-800"
                  )}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                      <Sparkles size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">مرحباً بك في <span className="text-primary-500">مصاريفي</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">لنقم بإعداد تطبيقك في ثوانٍ معدودة لنبدأ رحلة تنظيم أموالك.</p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">اختر عملتك الأساسية</label>
                    <div className="grid grid-cols-2 gap-3">
                      {currencies.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => setSelectedCurrency(c.code)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-right",
                            selectedCurrency === c.code
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400"
                              : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                          )}
                        >
                          <span className="text-2xl">{c.flag}</span>
                          <div className="flex flex-col">
                            <span className="font-black text-sm">{c.code}</span>
                            <span className="text-[10px] font-bold opacity-70">{c.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                      <Wallet size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">أرصدتك <span className="text-emerald-500">الحالية</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">كم تملك من المال حالياً في حساباتك الأساسية؟</p>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Coins size={14} className="text-emerald-500" />
                        المبلغ النقدي (كاش)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={initialBalances.cash}
                          onChange={(e) => setInitialBalances(prev => ({ ...prev, cash: e.target.value }))}
                          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white font-black text-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                          placeholder="0.00"
                        />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">{selectedCurrency}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Landmark size={14} className="text-blue-500" />
                        الحساب البنكي
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={initialBalances.bank}
                          onChange={(e) => setInitialBalances(prev => ({ ...prev, bank: e.target.value }))}
                          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white font-black text-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                          placeholder="0.00"
                        />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">{selectedCurrency}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 text-center"
                >
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6">
                      <CheckCircle2 size={48} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">أنت جاهز <span className="text-primary-500">للانطلاق!</span></h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto">لقد تم إعداد حسابك بنجاح. يمكنك الآن البدء في تسجيل مصاريفك ومتابعة أهدافك المالية.</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 mt-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">نصيحة سريعة</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">استخدم ميزة "المستشار الذكي" في لوحة التحكم للحصول على نصائح مالية مخصصة بناءً على صرفك.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 mt-12">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm uppercase tracking-widest"
                >
                  <ArrowRight size={18} className="rotate-180" />
                  السابق
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-95 text-sm uppercase tracking-widest"
              >
                {step === 3 ? 'ابدأ الآن' : 'التالي'}
                <ArrowLeft size={18} className="rotate-180" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
