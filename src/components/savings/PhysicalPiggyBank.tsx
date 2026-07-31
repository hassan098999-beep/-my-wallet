import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyBank, Sparkles, Trash, X, Check, Coins, Wallet, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, hapticFeedback, cn } from '../../utils';
import { Goal } from '../../types';
import SavingsHistory from './SavingsHistory';

interface PhysicalPiggyBankProps {
  itemVariants?: any;
}

export const PhysicalPiggyBank: React.FC<PhysicalPiggyBankProps> = ({ itemVariants }) => {
  const { goals, expenses, updateGoal, currency, categories, addExpense, addGoal, accounts } = useAppContext();

  // States for Physical Piggy Bank (حصالة الواقع)
  const [fakkaPrecision, setFakkaPrecision] = useState<'decimals' | 'nearest5' | 'nearest10'>('decimals');
  const [selectedSweepAccounts, setSelectedSweepAccounts] = useState<Record<string, boolean>>({ cash: true, bank: false });
  const [sweepSuccessMessage, setSweepSuccessMessage] = useState<{ amount: number; accountName: string; date: string } | null>(null);
  const [isSweeping, setIsSweeping] = useState(false);

  // Standalone piggy bank manual deposit and reset states
  const [isManualDepositOpen, setIsManualDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSource, setDepositSource] = useState<'account' | 'external'>('account');
  const [selectedDepositAccountId, setSelectedDepositAccountId] = useState('cash');
  const [depositNote, setDepositNote] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Find or determine the physical piggy bank goal
  const physicalGoal = useMemo(() => {
    return (goals || []).find(g => 
      g.isPhysicalPiggyBank === true || 
      g.name.includes('حصالة الواقع') || 
      g.name.includes('الحصالة الفعلية')
    );
  }, [goals]);

  // Filter history of deposits/sweeps for this specific piggy bank
  const piggyBankHistory = useMemo(() => {
    if (!physicalGoal) return [];
    return (expenses || [])
      .filter(e => e.goalId === physicalGoal.id)
      .slice(0, 5);
  }, [expenses, physicalGoal]);

  // Handler for manual piggy bank deposit
  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!physicalGoal) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح للضخ');
      return;
    }

    hapticFeedback('success');
    setIsSweeping(true);

    try {
      const selectedAcc = depositSource === 'account' ? accounts.find(a => a.id === selectedDepositAccountId) : null;
      
      if (depositSource === 'account' && selectedAcc && selectedAcc.balance < amount) {
        toast.error('رصيد الحساب غير كافٍ للضخ');
        setIsSweeping(false);
        return;
      }

      await addExpense({
        amount: amount,
        categoryId: categories.find(c => c.type === 'saving')?.id || categories[0]?.id || 'saving',
        accountId: depositSource === 'account' ? selectedDepositAccountId : undefined,
        goalId: physicalGoal.id,
        date: new Date().toISOString().split('T')[0],
        note: depositNote.trim() || (depositSource === 'account' ? `ضخ يدوِي من حساب ${selectedAcc?.name}` : 'ضخ يدوي خارجي مستقل 🪙'),
        paymentMethod: depositSource === 'account' ? (selectedDepositAccountId === 'cash' ? 'cash' : 'card') : 'cash'
      });

      toast.success(
        <div className="flex flex-col gap-1 text-right" dir="rtl">
          <span className="font-bold">تم ضخ الأموال بنجاح! 🪙🎉</span>
          <span className="text-xs">
            {depositSource === 'account' 
              ? `تم الخصم رقمياً من حساب "${selectedAcc?.name}". اسحب الآن ${formatCurrency(amount, currency)} نقداً وضعها في حصالتك المادية!`
              : `تم تسجيل إدخال مالي خارجي بقيمة ${formatCurrency(amount, currency)}. ضع المبلغ الآن في حصالتك المادية!`}
          </span>
        </div>,
        { duration: 5500 }
      );

      setDepositAmount('');
      setDepositNote('');
      setIsManualDepositOpen(false);
    } catch (err) {
      toast.error('فشل ضخ الأموال في الحصالة');
    } finally {
      setIsSweeping(false);
    }
  };

  // Handler for resetting piggy bank
  const handleResetPiggyBank = async () => {
    if (!physicalGoal) return;
    hapticFeedback('warning');
    try {
      await updateGoal(physicalGoal.id, { currentAmount: 0 });
      toast.success(
        <div className="flex flex-col gap-1 text-right" dir="rtl">
          <span className="font-bold">تم تفريغ (كسر) الحصالة بنجاح! 🔨💰</span>
          <span className="text-xs">تم تصفير الرصيد رقمياً بالتطبيق، يمكنك الآن الاستمتاع بمدخراتك المادية في الواقع! 🎉</span>
        </div>
      );
      setShowResetConfirm(false);
    } catch (err) {
      toast.error('فشل تفريغ الحصالة');
    }
  };

  // Helper to calculate "fakka" based on mode
  const calculateFakka = (balance: number, mode: 'decimals' | 'nearest5' | 'nearest10'): number => {
    if (balance <= 0) return 0;
    if (mode === 'decimals') {
      const remainder = balance - Math.floor(balance);
      return Number(remainder.toFixed(3));
    } else if (mode === 'nearest5') {
      const remainder = balance % 5;
      return Number(remainder.toFixed(3));
    } else { // 'nearest10'
      const remainder = balance % 10;
      return Number(remainder.toFixed(3));
    }
  };

  // Create Physical Goal automatically if it doesn't exist
  const handleCreatePhysicalGoal = async () => {
    hapticFeedback('success');
    try {
      await addGoal({
        name: 'حصالة الواقع الفعلية 🪙',
        targetAmount: 500, // target is 500 TND as standard
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(), // December 31 of current year
        isPhysicalPiggyBank: true
      });
      toast.success('تم إنشاء حصالة الواقع الفعلية بنجاح! 🪙');
    } catch (err) {
      toast.error('حدث خطأ أثناء إنشاء الحصالة');
    }
  };

  // Perform the sweep action for single account
  const handleSweepAccount = async (accountId: string, amount: number) => {
    if (amount <= 0) return;
    
    let activePhysicalGoal = physicalGoal;
    
    if (!activePhysicalGoal) {
      hapticFeedback('light');
      const confirmCreate = window.confirm('لم يتم العثور على حصالة واقع مخصصة. هل تريد إنشاء "حصالة الواقع الفعلية 🪙" تلقائياً لحفظ هذه المبالغ؟');
      if (!confirmCreate) return;
      
      const newGoalId = crypto.randomUUID();
      const newGoal: Goal = {
        id: newGoalId,
        name: 'حصالة الواقع الفعلية 🪙',
        targetAmount: 500,
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        createdAt: new Date().toISOString(),
        isPhysicalPiggyBank: true
      };
      
      try {
        await addGoal(newGoal);
        activePhysicalGoal = newGoal;
      } catch (err) {
        toast.error('حدث خطأ أثناء إنشاء الحصالة');
        return;
      }
    }

    setIsSweeping(true);
    hapticFeedback('success');

    const account = accounts.find(a => a.id === accountId);
    const accountName = account ? account.name : 'الحساب المالي';

    const savingCategory = categories.find(c => c.type === 'saving') || 
                          categories.find(c => c.name.includes('ادخار')) || 
                          categories[0];

    try {
      await addExpense({
        amount: amount,
        categoryId: savingCategory.id,
        accountId: accountId,
        goalId: activePhysicalGoal.id,
        date: new Date().toISOString().split('T')[0],
        note: `تفريغ الفكة اليومية لحصالة الواقع (${accountName}) 🪙`,
        paymentMethod: accountId === 'bank' ? 'card' : 'cash',
        isTransfer: true
      });

      setSweepSuccessMessage({
        amount: amount,
        accountName: accountName,
        date: new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })
      });
      
      toast.success(`تم تفريغ الفكة بقيمة ${formatCurrency(amount, currency)} بنجاح! 🎉`);
    } catch (err) {
      console.error(err);
      toast.error('فشلت عملية تفريغ الفكة');
    } finally {
      setIsSweeping(false);
    }
  };

  const handleSweepSelected = async () => {
    let activePhysicalGoal = physicalGoal;
    
    const accountsToSweep = accounts.filter(acc => selectedSweepAccounts[acc.id] && calculateFakka(acc.balance, fakkaPrecision) > 0);
    if (accountsToSweep.length === 0) {
      toast.error('لا توجد فكة متبقية في الحسابات المحددة لتفريغها!');
      return;
    }

    if (!activePhysicalGoal) {
      hapticFeedback('light');
      const confirmCreate = window.confirm('لم يتم العثور على حصالة واقع مخصصة. هل تريد إنشاء "حصالة الواقع الفعلية 🪙" تلقائياً لحفظ هذه المبالغ؟');
      if (!confirmCreate) return;
      
      const newGoalId = crypto.randomUUID();
      const newGoal: Goal = {
        id: newGoalId,
        name: 'حصالة الواقع الفعلية 🪙',
        targetAmount: 500,
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        createdAt: new Date().toISOString(),
        isPhysicalPiggyBank: true
      };
      
      try {
        await addGoal(newGoal);
        activePhysicalGoal = newGoal;
      } catch (err) {
        toast.error('حدث خطأ أثناء إنشاء الحصالة');
        return;
      }
    }

    setIsSweeping(true);
    hapticFeedback('success');

    const savingCategory = categories.find(c => c.type === 'saving') || 
                          categories.find(c => c.name.includes('ادخار')) || 
                          categories[0];

    let totalSwept = 0;
    try {
      for (const acc of accountsToSweep) {
        const amount = calculateFakka(acc.balance, fakkaPrecision);
        await addExpense({
          amount: amount,
          categoryId: savingCategory.id,
          accountId: acc.id,
          goalId: activePhysicalGoal.id,
          date: new Date().toISOString().split('T')[0],
          note: `تفريغ الفكة اليومية لحصالة الواقع (${acc.name}) 🪙`,
          paymentMethod: acc.id === 'bank' ? 'card' : 'cash',
          isTransfer: true
        });

        totalSwept += amount;
      }

      setSweepSuccessMessage({
        amount: totalSwept,
        accountName: accountsToSweep.map(a => a.name).join(' و '),
        date: new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })
      });
      
      toast.success(`تم تفريغ الفكة الكلية بقيمة ${formatCurrency(totalSwept, currency)} بنجاح! 🎉`);
    } catch (err) {
      console.error(err);
      toast.error('فشلت العملية المتعددة');
    } finally {
      setIsSweeping(false);
    }
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="mt-6 border border-amber-100 dark:border-amber-950/40 rounded-3xl bg-gradient-to-br from-amber-50/20 via-white to-orange-50/10 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/30 p-5 md:p-6 shadow-sm overflow-hidden relative animate-fade-in"
    >
      <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -ml-6 -mt-6 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-8 -mb-8 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/10 shrink-0">
            <PiggyBank size={24} className="shrink-0" />
          </div>
          <div className="text-right">
            <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              حصالة الواقع الملموسة المستقلة 🪙🏡
              {physicalGoal && (
                <Badge variant="success" className="text-[8px] font-black">
                  تراكمية مفتوحة
                </Badge>
              )}
            </h3>
            <p className="text-[9px] text-slate-400 font-bold">تطابق الرصيد الرقمي بطرح الفكة المتبقية يدوياً ونقلها للحصالة الفعلية في غرفتك</p>
          </div>
        </div>

        {physicalGoal && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/25 text-rose-500 transition-all cursor-pointer"
              title="تفريغ وتصفير الحصالة"
            >
              <Trash size={14} />
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100/30 text-[10px] md:text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
              رصيد الحصالة بالتطبيق: <span className="font-mono">{formatCurrency(physicalGoal.currentAmount, currency)}</span>
            </div>
          </div>
        )}
      </div>

      {!physicalGoal ? (
        <div className="mt-5 p-5 bg-amber-50/50 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-900/50 rounded-2xl text-center relative z-10" dir="rtl">
          <Sparkles size={28} className="mx-auto text-amber-500 mb-2 animate-pulse" />
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ابدأ تحدي حصالة الواقع الملموسة! 🪙</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-md mx-auto">
            الحصالة الآن مستقلة تماماً ومفتوحة بدون سقف أهداف محدد! قم بإنشائها لتجميع مدخراتك المادية يدوياً وتفريغ الفكة اليومية.
          </p>
          <button
            onClick={handleCreatePhysicalGoal}
            className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md shadow-amber-500/10 hover:opacity-90 transition-all flex items-center gap-1.5 mx-auto"
          >
            <Plus size={16} />
            <span>إنشاء وتفعيل حصالة الواقع الآن</span>
          </button>
        </div>
      ) : (
        <div className="mt-5 relative z-10 space-y-4" dir="rtl">
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

          {/* Sweep success feedback instructions */}
          {sweepSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl text-slate-800 dark:text-slate-200 relative"
            >
              <button 
                onClick={() => setSweepSuccessMessage(null)}
                className="absolute top-3 left-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
              >
                <X size={14} />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                  <Check size={18} />
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">تم تحديث الأرصدة الرقمية بالتطبيق! 🎉</p>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">
                    توجيه الغرفة الهام 🏡:
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 leading-relaxed">
                    قم الآن فوراً بسحب <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-xs">{formatCurrency(sweepSuccessMessage.amount, currency)}</span> نقداً من محفظة جيبك الحقيقية وضعها ملموسة بيدك داخل حصالتك الفعلية في الغرفة!
                  </p>
                  <span className="text-[8px] text-slate-400 font-mono mt-1 block">توقيت الحركة: {sweepSuccessMessage.date}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Interactive Manual Deposit Form Button & Form */}
          <div className="border-t border-slate-100 dark:border-slate-800/40 pt-1">
            <button
              onClick={() => { setIsManualDepositOpen(!isManualDepositOpen); hapticFeedback('light'); }}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900/25 hover:bg-slate-50 dark:hover:bg-slate-900/45 transition-all cursor-pointer"
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

          {/* Rounding precision controls */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/40">
            <p className="text-[9px] text-slate-400 font-bold">اختر قوة إفراغ وتفريغ الفكة المفضلة:</p>
            <div className="grid grid-cols-3 gap-2 bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-xl">
              <button
                onClick={() => { setFakkaPrecision('decimals'); hapticFeedback('light'); }}
                className={`py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${fakkaPrecision === 'decimals' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                الكسور والمليمات (فقط)
              </button>
              <button
                onClick={() => { setFakkaPrecision('nearest5'); hapticFeedback('light'); }}
                className={`py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${fakkaPrecision === 'nearest5' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                أقرب 5 د.ت
              </button>
              <button
                onClick={() => { setFakkaPrecision('nearest10'); hapticFeedback('light'); }}
                className={`py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${fakkaPrecision === 'nearest10' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                أقرب 10 د.ت
              </button>
            </div>
          </div>

          {/* Accounts list with calculated change */}
          <div className="space-y-2.5">
            {accounts.map(acc => {
              const fakka = calculateFakka(acc.balance, fakkaPrecision);
              const isSelected = selectedSweepAccounts[acc.id] || false;
              
              return (
                <div 
                  key={acc.id} 
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${fakka > 0 ? 'bg-white/75 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/60' : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100/40 dark:border-slate-800/20 opacity-70'}`}
                >
                  <div className="flex items-center gap-3">
                    {fakka > 0 && (
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => setSelectedSweepAccounts(prev => ({ ...prev, [acc.id]: e.target.checked }))}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                    )}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: acc.color }}>
                      <Wallet size={16} />
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-black text-slate-700 dark:text-slate-200">{acc.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">الرصيد: {formatCurrency(acc.balance, currency)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="text-[9px] text-slate-400 font-bold">الفكة المتبقية</p>
                      <p className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                        {fakka > 0 ? `+ ${formatCurrency(fakka, currency)}` : '0.000'}
                      </p>
                    </div>

                    {fakka > 0 ? (
                      <button
                        disabled={isSweeping}
                        onClick={() => handleSweepAccount(acc.id, fakka)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-black text-[10px] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all border border-amber-100/20 cursor-pointer"
                      >
                        تفريغ الفردي 🪙
                      </button>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black text-[9px]">
                        نظيف ✨
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Master sweep action */}
          <button
            disabled={isSweeping || accounts.filter(acc => selectedSweepAccounts[acc.id] && calculateFakka(acc.balance, fakkaPrecision) > 0).length === 0}
            onClick={handleSweepSelected}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md shadow-amber-500/10 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Coins size={16} />
            <span>تفريغ الفكة المحددة دفعة واحدة 🚀</span>
          </button>

          {/* History Ledger specifically for this piggy bank */}
          <SavingsHistory history={piggyBankHistory} currency={currency} />
        </div>
      )}
    </motion.div>
  );
};

export default PhysicalPiggyBank;
