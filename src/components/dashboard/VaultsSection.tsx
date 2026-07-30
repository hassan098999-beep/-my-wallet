import React from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { PiggyBank, Wallet, Trash, Sparkles, Plus, Coins, Check, X } from 'lucide-react';
import Badge from '../ui/Badge';
import { cn, formatCurrency, hapticFeedback } from '../../utils';
import { Account, Goal, Expense } from '../../types';

interface VaultsSectionProps {
  accounts: Account[];
  physicalGoal: Goal | undefined;
  totalNetWorth: number;
  currency: string;
  fakkaPrecision: 'decimals' | 'nearest5' | 'nearest10';
  setFakkaPrecision: (val: 'decimals' | 'nearest5' | 'nearest10') => void;
  selectedSweepAccounts: Record<string, boolean>;
  setSelectedSweepAccounts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  sweepSuccessMessage: { amount: number; accountName: string; date: string } | null;
  setSweepSuccessMessage: (msg: { amount: number; accountName: string; date: string } | null) => void;
  isSweeping: boolean;
  isManualDepositOpen: boolean;
  setIsManualDepositOpen: (open: boolean) => void;
  depositAmount: string;
  setDepositAmount: (amt: string) => void;
  depositSource: 'account' | 'external';
  setDepositSource: (src: 'account' | 'external') => void;
  selectedDepositAccountId: string;
  setSelectedDepositAccountId: (id: string) => void;
  depositNote: string;
  setDepositNote: (note: string) => void;
  showResetConfirm: boolean;
  setShowResetConfirm: (show: boolean) => void;
  piggyBankHistory: Expense[];
  handleManualDeposit: (e: React.FormEvent) => Promise<void>;
  handleResetPiggyBank: () => Promise<void>;
  calculateFakka: (balance: number, mode: 'decimals' | 'nearest5' | 'nearest10') => number;
  handleCreatePhysicalGoal: () => Promise<void>;
  handleSweepAccount: (accountId: string, amount: number) => Promise<void>;
  handleSweepSelected: () => Promise<void>;
  itemVariants: Variants;
}

export const VaultsSection: React.FC<VaultsSectionProps> = ({
  accounts,
  physicalGoal,
  totalNetWorth,
  currency,
  fakkaPrecision,
  setFakkaPrecision,
  selectedSweepAccounts,
  setSelectedSweepAccounts,
  sweepSuccessMessage,
  setSweepSuccessMessage,
  isSweeping,
  isManualDepositOpen,
  setIsManualDepositOpen,
  depositAmount,
  setDepositAmount,
  depositSource,
  setDepositSource,
  selectedDepositAccountId,
  setSelectedDepositAccountId,
  depositNote,
  setDepositNote,
  showResetConfirm,
  setShowResetConfirm,
  piggyBankHistory,
  handleManualDeposit,
  handleResetPiggyBank,
  calculateFakka,
  handleCreatePhysicalGoal,
  handleSweepAccount,
  handleSweepSelected,
  itemVariants,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="border border-slate-150 dark:border-slate-800/85 rounded-[2.5rem] bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 dark:from-slate-900/60 dark:via-slate-900/30 dark:to-slate-950/40 p-5 md:p-8 shadow-xs overflow-hidden relative animate-fade-in"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-slate-100 dark:border-slate-800/60 pb-6 mb-6" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/10 shrink-0">
            <PiggyBank size={24} className="shrink-0" />
          </div>
          <div className="text-right">
            <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              حصالة الواقع الذكية المستقلة 🪙🏡
              <Badge variant="success" className="text-[9px] font-black">
                مستقلة وتراكمية
              </Badge>
            </h3>
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold">تحدي حصالة ملموسة في منزلك، تفريغ الفكة اليومية وضخ مالي رقمي يطابق واقعك</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left md:text-right">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">إجمالي الثروة الرقمية</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              {formatCurrency(totalNetWorth, currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10" dir="rtl">
        {/* Column 1: Digital Vaults & Accounts Breakdown (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">الخزائن الرقمية والحسابات النشطة 💳💵</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">اختر تفريغ الفكة اليومية لمطابقة الكاش</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {accounts.map((acc) => {
              const fakka = calculateFakka(acc.balance, fakkaPrecision);
              
              return (
                <div 
                  key={acc.id} 
                  className="p-4 rounded-2xl border bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 shadow-3xs flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-slate-200 dark:hover:border-slate-700 transition-all text-right"
                >
                  <div className="absolute top-0 right-0 left-0 h-[2px]" style={{ backgroundColor: acc.color }} />
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: acc.color }}>
                        <Wallet size={16} />
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">{acc.name}</h4>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">
                          •••• {acc.id === 'cash' ? 'نقود جيب' : acc.id === 'bank' ? 'بطاقة بريدية' : 'خزنة'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-sans shrink-0">
                      <span className="text-sm font-black text-slate-850 dark:text-white">
                        {formatCurrency(acc.balance, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/50 pt-2.5 flex justify-between items-center gap-2">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">فكة اليوم المتبقية</span>
                      <span className="text-[11px] font-black font-mono text-amber-600 dark:text-amber-400">
                        {fakka > 0 ? `+ ${formatCurrency(fakka, currency)}` : '0.000'}
                      </span>
                    </div>

                    {fakka > 0 ? (
                      <button
                        disabled={isSweeping}
                        onClick={() => handleSweepAccount(acc.id, fakka)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-black text-[10px] transition-all border border-amber-100/30 flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>تفريغ الفكة 🪙</span>
                      </button>
                    ) : (
                      <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">
                        مفرغة ونظيفة ✨
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Independent Piggy Bank Panel (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">وضعية الحصالة المادية الحقيقية بالمنزل 🏡</span>
            {physicalGoal && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowResetConfirm(!showResetConfirm)}
                  className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/25 text-rose-500 transition-all tooltip cursor-pointer"
                  title="تفريغ الحصالة وتصفيرها بالكامل"
                >
                  <Trash size={14} />
                </button>
              </div>
            )}
          </div>

          {!physicalGoal ? (
            <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-900/50 rounded-2xl text-center space-y-3">
              <Sparkles size={28} className="mx-auto text-amber-500 animate-pulse" />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ابدأ تحدي حصالة الواقع الملموسة! 🪙🏡</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal max-w-sm mx-auto">
                الحصالة الآن مستقلة تماماً ومفتوحة بدون سقف أهداف محدد! قم بإنشائها لتجميع مدخراتك المادية يدوياً وتفريغ الفكة اليومية.
              </p>
              <button
                onClick={handleCreatePhysicalGoal}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/10 hover:opacity-95 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <Plus size={14} />
                <span>تفعيل الحصالة المستقلة الآن</span>
              </button>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4 text-right relative overflow-hidden">
              {/* Reset Confirmation Overlay */}
              <AnimatePresence>
                {showResetConfirm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 z-35 flex flex-col justify-center items-center p-4 text-center rounded-2xl"
                  >
                    <span className="text-3xl">🔨🪙</span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2">تفريغ وكسر الحصالة؟</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs font-bold leading-normal">
                      هل تريد تصفير رصيد الحصالة بالتطبيق؟ هذا الإجراء لا يمس حساباتك الرقمية الأخرى ويجعل الحصالة جاهزة للتجميع من جديد.
                    </p>
                    <div className="flex gap-2.5 mt-4">
                      <button
                        onClick={handleResetPiggyBank}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded-lg cursor-pointer"
                      >
                        نعم، تفريغ وتصفير 🔨
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] rounded-lg cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Standalone Visual Container */}
              <div className="bg-gradient-to-b from-slate-100/50 to-slate-200/20 dark:from-slate-950/50 dark:to-slate-950/10 p-4 rounded-xl border border-slate-100 dark:border-slate-850/40 relative overflow-hidden flex items-center justify-between gap-4">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">رصيد الحصالة الحالي (في غرفتك) 🏡</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">
                    {formatCurrency(physicalGoal.currentAmount, currency)}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md inline-block mt-1">
                    حصالة مفتوحة غير مقيدة 📈
                  </span>
                </div>

                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center relative shrink-0">
                  <PiggyBank size={28} className="text-amber-500" />
                  <div className="absolute inset-0.5 rounded-full border-2 border-dashed border-amber-500/20 animate-spin-slow" />
                </div>
              </div>

              {/* Micro instructions feedback */}
              {sweepSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative text-right"
                >
                  <button 
                    onClick={() => setSweepSuccessMessage(null)}
                    className="absolute top-2 left-2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <X size={12} />
                  </button>
                  <div className="flex items-start gap-2 text-right">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">تم الخصم الرقمي بنجاح! 🎉</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold mt-0.5 leading-relaxed">
                        الآن 🏡: اسحب <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">{formatCurrency(sweepSuccessMessage.amount, currency)}</span> نقداً من محفظتك الحقيقية وضعها فوراً داخل حصالة غرفتك الفعلية!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Interactive Manual Deposit Form Button & Form */}
              <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3">
                <button
                  onClick={() => { setIsManualDepositOpen(!isManualDepositOpen); hapticFeedback('light'); }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer"
                >
                  <Coins size={14} className="text-amber-500" />
                  <span>{isManualDepositOpen ? 'إغلاق نافذة الإيداع' : 'ضخ ودفع مبالغ يدوية 💰➕'}</span>
                </button>

                <AnimatePresence>
                  {isManualDepositOpen && (
                    <motion.form
                      onSubmit={handleManualDeposit}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3 space-y-3 pt-2 text-right"
                    >
                      {/* Source selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 block">مصدر الأموال المدفوعة يدوياً:</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100/60 dark:bg-slate-950 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setDepositSource('account')}
                            className={cn(
                              "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                              depositSource === 'account' ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
                            )}
                          >
                            خصم من حسابي بالتطبيق
                          </button>
                          <button
                            type="button"
                            onClick={() => setDepositSource('external')}
                            className={cn(
                              "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                              depositSource === 'external' ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
                            )}
                          >
                            مال خارجي (نقدي إضافي)
                          </button>
                        </div>
                      </div>

                      {/* Account select (if source is account) */}
                      {depositSource === 'account' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 block">اختر الحساب الرقمي للخصم:</label>
                          <select
                            value={selectedDepositAccountId}
                            onChange={(e) => setSelectedDepositAccountId(e.target.value)}
                            className="w-full p-2 text-xs font-black bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                          >
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({formatCurrency(acc.balance, currency)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Amount & Tunisian quick buttons */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 block">قيمة المبلغ المراد ضخه:</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="0.000"
                            className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-left font-mono font-black text-sm outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                          <span className="absolute left-4 top-2.5 font-mono text-xs text-slate-400">{currency}</span>
                        </div>

                        {/* Quick Tunisian buttons (+1, +5, +10, +20 TND) */}
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 5, 10, 20].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                const current = parseFloat(depositAmount) || 0;
                                setDepositAmount((current + val).toString());
                                hapticFeedback('light');
                              }}
                              className="py-1 bg-slate-100 dark:bg-slate-950 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 text-[10px] font-bold rounded-lg transition-all border border-transparent hover:border-amber-200 cursor-pointer"
                            >
                              +{val} د.ت
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note */}
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={depositNote}
                          onChange={(e) => setDepositNote(e.target.value)}
                          placeholder="ملاحظة اختيارية (مثال: توفير قهوة اليوم ☕)"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSweeping || !depositAmount}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/10 hover:opacity-95 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Check size={14} />
                        <span>ضخ الأموال الآن في الحصالة 🪙</span>
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Sweep configuration (Rounding precision) */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">ميزة تفريغ الفكة (التقريب التلقائي للكسور):</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-slate-100/60 dark:bg-slate-950 p-1 rounded-xl">
                  <button
                    onClick={() => { setFakkaPrecision('decimals'); hapticFeedback('light'); }}
                    className={cn(
                      "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                      fakkaPrecision === 'decimals' ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-400"
                    )}
                  >
                    الكسور (فقط)
                  </button>
                  <button
                    onClick={() => { setFakkaPrecision('nearest5'); hapticFeedback('light'); }}
                    className={cn(
                      "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                      fakkaPrecision === 'nearest5' ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-400"
                    )}
                  >
                    أقرب 5 د.ت
                  </button>
                  <button
                    onClick={() => { setFakkaPrecision('nearest10'); hapticFeedback('light'); }}
                    className={cn(
                      "py-1.5 rounded-lg font-black text-[9px] transition-all cursor-pointer",
                      fakkaPrecision === 'nearest10' ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-400"
                    )}
                  >
                    أقرب 10 د.ت
                  </button>
                </div>

                {/* Multiselect checkboxes for sweeping */}
                <div className="flex gap-4 pt-1.5 items-center justify-start text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold">تضمين الحسابات:</span>
                  {accounts.map(acc => (
                    <label key={acc.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSweepAccounts[acc.id] || false}
                        onChange={(e) => setSelectedSweepAccounts(prev => ({ ...prev, [acc.id]: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-800 cursor-pointer"
                      />
                      <span className="font-bold">{acc.name}</span>
                    </label>
                  ))}
                </div>

                {/* Master sweep action button */}
                <button
                  disabled={isSweeping || accounts.filter(acc => selectedSweepAccounts[acc.id] && calculateFakka(acc.balance, fakkaPrecision) > 0).length === 0}
                  onClick={handleSweepSelected}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/10 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Coins size={14} />
                  <span>تفريغ الفكة المحددة دفعة واحدة 🚀</span>
                </button>
              </div>

              {/* History Ledger specifically for this piggy bank */}
              {piggyBankHistory.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-right">
                  <span className="text-[10px] font-black text-slate-400 block mb-1">سجل الحركات الأخيرة للحصالة 📜</span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {piggyBankHistory.map((hist) => (
                      <div key={hist.id} className="flex justify-between items-center bg-slate-100/30 dark:bg-slate-950/20 p-2 rounded-lg text-[10px]">
                        <div className="text-right">
                          <span className="font-black text-slate-700 dark:text-slate-300 block">{hist.note}</span>
                          <span className="text-[8px] text-slate-400">{hist.date}</span>
                        </div>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                          + {formatCurrency(hist.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
