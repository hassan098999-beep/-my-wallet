import React, { useState } from 'react';
import { useAppContext } from './store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Building2, Coins, CircleCheckBig, ArrowRight, ArrowLeft, Sparkles, PlusCircle, PieChart, ShieldCheck } from 'lucide-react';
import { cn } from './utils';

const OnboardingModal: React.FC = () => {
  const { hasCompletedOnboarding, completeOnboarding, setCurrency, updateAccount, accounts } = useAppContext();
  const [step, setStep] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState('TND');
  const [initialBalances, setInitialBalances] = useState<Record<string, string>>({
    cash: '0',
    bank: '0'
  });

  if (hasCompletedOnboarding) return null;

  const handleNext = () => {
    if (step < 4) {
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
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="p-8 md:p-10">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                    s <= step ? "bg-emerald-500" : "bg-slate-100 dark:bg-slate-800"
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
                  <div className="space-y-3">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
                      <Sparkles size={28} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">مرحباً بك في <span className="text-emerald-500">التطبيق المالي</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed">رفيقك الذكي لإدارة مصاريف العائلة، تتبع القفة، الفواتير، ومراقبة المصاريف بكل احترافية.</p>
                    
                    <div className="space-y-3 mt-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-500/30 flex items-center gap-4 text-right">
                      <span className="text-3xl">🇹🇳</span>
                      <div>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">العملة المحلية</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">الدينار التونسي (TND / مليم)</p>
                      </div>
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
                  <div className="space-y-3">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
                      <PlusCircle size={28} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">كيفية <span className="text-blue-500">إضافة المصاريف</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed">تسجيل المصاريف أسرع وأسهل مما تتخيل!</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">اضغط على زر <span className="text-blue-500 font-black">"إضافة مصروف"</span> في أي وقت من شاشة العمليات أو لوحة التحكم.</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">اختر التصنيف (مثل: قفة، فواتير STEG، حليب وصحة الطفل، مواصلات) وحدد المبلغ والحساب (كاش أو بنك).</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">احفظ المعاملة ليتم خصمها تلقائياً من رصيدك وتحديث لوحة التحليلات فوراً.</p>
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
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 shadow-inner">
                      <PieChart size={28} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">استخدام <span className="text-purple-500">لوحة التحليلات</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed">تابع أين تذهب أموالك بدقة متناهية.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">📊</div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">تعرض لك الرسوم البيانية توزيع المصاريف حسب الأقسام (قفة، فواتير، ترفيه) بنسب مئوية واضحة.</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">💡</div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">المستشار الذكي يحلل مصاريفك ويعطيك تنبيهات فورية إذا تجاوزت ميزانية القسم المحدد.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2"
                    >
                      <CircleCheckBig size={40} />
                    </motion.div>
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">أرصدتك <span className="text-emerald-500">وانطلاق الرحلة</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">حدد الأرصدة الأولية لحساباتك للبدء.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المبلغ النقدي (كاش)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={initialBalances.cash}
                          onChange={(e) => setInitialBalances(prev => ({ ...prev, cash: e.target.value }))}
                          className="w-full px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-lg outline-none focus:border-emerald-500"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">{selectedCurrency}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الحساب البنكي</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={initialBalances.bank}
                          onChange={(e) => setInitialBalances(prev => ({ ...prev, bank: e.target.value }))}
                          className="w-full px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-lg outline-none focus:border-emerald-500"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">{selectedCurrency}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 mt-8">
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
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 text-sm uppercase tracking-widest"
              >
                {step === 4 ? 'ابدأ الآن' : 'التالي'}
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
