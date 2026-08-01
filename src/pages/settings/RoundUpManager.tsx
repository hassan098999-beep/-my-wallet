import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { 
  PiggyBank, Info, Save, ToggleLeft, ToggleRight, 
  Sparkles, Coins, Check, ArrowLeftRight, 
  TrendingUp, Edit3, ArrowUpRight, ShieldCheck, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, hapticFeedback } from '../../utils';

const RoundUpManager = () => {
  const { 
    autoRoundUpSetting, 
    updateAutoRoundUpSetting, 
    goals, 
    expenses, 
    currency,
    updateGoal,
    addGoal,
    accounts,
    addExpense,
    categories
  } = useAppContext();

  // State for the interactive simulator
  const [simulatorAmount, setSimulatorAmount] = useState('12.350');
  
  // Settings state initialized from context
  const enabled = autoRoundUpSetting?.enabled || false;
  const targetGoalId = autoRoundUpSetting?.targetGoalId || '';
  const multiplier = autoRoundUpSetting?.multiplier || 1;

  // Filter goals that are savings goals
  const savingGoals = goals || [];

  // Find the physical piggy bank goal or target goal
  const physicalGoal = (goals || []).find(g => 
    g.isPhysicalPiggyBank === true || 
    g.name.includes('حصالة الواقع') || 
    g.name.includes('الحصالة الفعلية')
  );

  const targetGoal = (goals || []).find(g => g.id === targetGoalId) || physicalGoal || savingGoals[0];

  // Manual piggy bank amount state
  const [manualAmount, setManualAmount] = useState<string>('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  useEffect(() => {
    if (targetGoal) {
      setManualAmount(targetGoal.currentAmount.toString());
    }
  }, [targetGoal?.id, targetGoal?.currentAmount]);

  // Calculate total saved via round-up / sweep
  const roundUpTransactions = (expenses || []).filter(
    (e) => e.isTransfer && (e.note || '').includes('حصالة')
  );

  const totalSavedViaRoundUp = roundUpTransactions.reduce(
    (sum, e) => sum + e.amount, 
    0
  );

  // Manual sweep logic
  const [isSweeping, setIsSweeping] = useState(false);

  const calculateFakka = (balance: number): number => {
    if (balance <= 0) return 0;
    const decimals = balance % 1;
    return Number(decimals.toFixed(3));
  };

  const totalAccountFakka = (accounts || []).reduce((sum, acc) => sum + calculateFakka(acc.balance), 0);

  const handleToggle = () => {
    hapticFeedback('medium');
    if (!enabled && savingGoals.length === 0) {
      toast.error('الرجاء إنشاء هدف ادخار أو حصالة أولاً في صفحة الأهداف لتتمكن من تحديدها كوجهة للفكة.');
      return;
    }

    const defaultGoalId = targetGoalId || (savingGoals[0]?.id || '');
    updateAutoRoundUpSetting({
      enabled: !enabled,
      targetGoalId: defaultGoalId,
      multiplier: multiplier
    });
    
    if (!enabled) {
      toast.success('تم تفعيل خدمة الحصالة وحساب الفكة المتاحة! 🪙');
    } else {
      toast.success('تم إيقاف خدمة الفكة.');
    }
  };

  const handleGoalChange = (goalId: string) => {
    hapticFeedback('light');
    updateAutoRoundUpSetting({
      enabled,
      targetGoalId: goalId,
      multiplier
    });
    const selected = savingGoals.find(g => g.id === goalId);
    if (selected) {
      setManualAmount(selected.currentAmount.toString());
    }
    toast.success('تم تحديث الحصالة المستهدفة.');
  };

  const handleMultiplierChange = (mult: number) => {
    hapticFeedback('light');
    updateAutoRoundUpSetting({
      enabled,
      targetGoalId,
      multiplier: mult
    });
    toast.success(`تم ضبط حساب الفكة لأقرب ${mult} دينار.`);
  };

  // Handler to manually edit piggy bank balance
  const handleSaveManualAmount = async () => {
    let activeGoal = targetGoal;
    if (!activeGoal) {
      hapticFeedback('light');
      const confirmCreate = window.confirm('لم يتم العثور على حصالة أهداف. هل تريد إنشاء "حصالة الفكة والواقع 🪙" جديدة الآن؟');
      if (!confirmCreate) return;
      const newGoalId = crypto.randomUUID();
      const newGoal = {
        id: newGoalId,
        name: 'حصالة الفكة والواقع 🪙',
        targetAmount: 500,
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        createdAt: new Date().toISOString(),
        isPhysicalPiggyBank: true
      };
      await addGoal(newGoal);
      activeGoal = newGoal;
    }

    const val = parseFloat(manualAmount);
    if (isNaN(val) || val < 0) {
      toast.error('يرجى إدخال مبلغ صحيح لرصيد الحصالة.');
      return;
    }

    setIsSavingManual(true);
    hapticFeedback('success');
    try {
      await updateGoal(activeGoal.id, { currentAmount: val });
      toast.success(`تم تحديث رصيد ${activeGoal.name} يدوياً إلى ${formatCurrency(val, currency)} بنجاح! 🪙`);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ المبلغ المعدل');
    } finally {
      setIsSavingManual(false);
    }
  };

  // Manual Sweep execution
  const handleManualSweep = async () => {
    let activeGoal = targetGoal;
    if (!activeGoal) {
      hapticFeedback('light');
      const confirmCreate = window.confirm('لم يتم العثور على حصالة. هل تريد إنشاء "حصالة الفكة والواقع 🪙" لحفظ المبالغ؟');
      if (!confirmCreate) return;
      const newGoalId = crypto.randomUUID();
      const newGoal = {
        id: newGoalId,
        name: 'حصالة الفكة والواقع 🪙',
        targetAmount: 500,
        currentAmount: 0,
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        createdAt: new Date().toISOString(),
        isPhysicalPiggyBank: true
      };
      await addGoal(newGoal);
      activeGoal = newGoal;
    }

    const accountsWithFakka = (accounts || []).filter(acc => calculateFakka(acc.balance) > 0);
    if (accountsWithFakka.length === 0) {
      toast.error('لا توجد فكة متبقية في الحسابات لتفريغها حالياً!');
      return;
    }

    setIsSweeping(true);
    hapticFeedback('success');
    const savingCategory = (categories || []).find(c => c.type === 'saving') || 
                          (categories || []).find(c => c.name.includes('ادخار')) || 
                          (categories || [])[0];

    let sweptTotal = 0;
    try {
      for (const acc of accountsWithFakka) {
        const amount = calculateFakka(acc.balance);
        if (amount > 0) {
          await addExpense({
            amount: amount,
            categoryId: savingCategory?.id || '',
            accountId: acc.id,
            goalId: activeGoal.id,
            date: new Date().toISOString().split('T')[0],
            note: `تفريغ الفكة يدوياً لحصالة الواقع (${acc.name}) 🪙`,
            paymentMethod: acc.id === 'bank' ? 'card' : 'cash',
            isTransfer: true
          });
          sweptTotal += amount;
        }
      }
      toast.success(`تم تفريغ الفكة يدوياً بقيمة ${formatCurrency(sweptTotal, currency)} إلى الحصالة! 🎉`);
    } catch (err) {
      console.error(err);
      toast.error('فشلت عملية تفريغ الفكة');
    } finally {
      setIsSweeping(false);
    }
  };

  // Simulator calculations
  const simVal = parseFloat(simulatorAmount) || 0;
  const simRemainder = simVal % multiplier;
  const simSaved = simRemainder > 0 ? Number((multiplier - simRemainder).toFixed(3)) : 0;
  const simTotal = simVal + simSaved;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header section */}
      <div className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/5 border border-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
          <PiggyBank size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-slate-800 dark:text-white">إعدادات الحصالة وتفريغ الفكة يدوياً</h2>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">
            يتم تفريغ الفكة في الحصالة يدوياً بناءً على طلبك (وليس بعد كل معاملة). يمكنك أيضاً تعديل رصيد الحصالة يدوياً مباشرة من هنا في أي وقت.
          </p>
        </div>
      </div>

      {/* Main Switcher Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="text-right flex-1">
          <p className="text-xs font-black text-slate-800 dark:text-white">خدمة حساب فكة المعاملات والحصالة</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            {enabled 
              ? "الخدمة مفعلة. يمكنك تفريغ الفكة يدوياً أو ضبط وتعديل رصيد الحصالة." 
              : "الخدمة متوقفة حالياً. قم بتفعيلها لحساب الفكة وتفريغها عند الرغبة."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="text-primary-600 dark:text-primary-400 focus:outline-none transition-colors cursor-pointer shrink-0"
        >
          {enabled ? (
            <ToggleRight className="w-14 h-8 text-primary-500 dark:text-primary-400" />
          ) : (
            <ToggleLeft className="w-14 h-8 text-slate-400 dark:text-slate-600" />
          )}
        </button>
      </div>

      {/* SECTION 1: Manual Edit Piggy Bank Balance Direct Card */}
      <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-amber-500/10 pb-3">
          <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400">
            <Edit3 size={16} />
            <span>تعديل رصيد الحصالة يدوياً</span>
          </div>
          <span className="text-[9px] font-bold text-amber-600/80 dark:text-amber-400/80 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
            إدخال يدوي مباشر ✍️
          </span>
        </div>

        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          يمكنك هنا تعديل مبلغ الحصالة مباشرة ليتطابق مع ما تم تجميعه في الواقع أو ما تحتفظ به في حصالتك المنزلية:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-8 space-y-1">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400">
              المبلغ الحالي في {targetGoal ? targetGoal.name : 'الحصالة'} ({currency}):
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.100"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="أدخل المبلغ الجديد هنا"
                className="w-full bg-white dark:bg-slate-950 border border-amber-300/60 dark:border-amber-500/30 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono text-right"
                dir="ltr"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currency}
              </span>
            </div>
          </div>

          <div className="sm:col-span-4">
            <button
              type="button"
              onClick={handleSaveManualAmount}
              disabled={isSavingManual}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSavingManual ? 'جاري الحفظ...' : 'حفظ المبلغ المعدل'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Manual Sweep Action (تفريغ الفكة المتبقية يدوياً) */}
      <div className="p-5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-500/10 pb-3">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400">
            <Coins size={16} />
            <span>تفريغ الفكة المتبقية في الحسابات يدوياً</span>
          </div>
          <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400">
            فكة متاحة: {formatCurrency(totalAccountFakka, currency)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed flex-1">
            يقوم بتجميع الكسور المالية الفائضة من حساباتك البنكية والكاش وتحويلها دفعة واحدة إلى الحصالة بضغطة زر واحدة.
          </p>

          <button
            type="button"
            onClick={handleManualSweep}
            disabled={isSweeping || totalAccountFakka <= 0}
            className="w-full sm:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={14} className={isSweeping ? "animate-spin" : ""} />
            <span>{isSweeping ? 'جاري التفريغ...' : 'تفريغ الفكة يدوياً الآن 🚀'}</span>
          </button>
        </div>
      </div>

      {/* Settings Options (Target Goal & Multiplier Selector) */}
      <div className={`space-y-6 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-60'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Target Goal Selector */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 justify-start text-[10px] font-black text-slate-500">
              <Coins size={14} className="text-primary-500" />
              <span>الحصالة / الهدف المستهدف للتوفير</span>
            </div>
            
            {savingGoals.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-[10px] text-rose-500 font-bold">لا يوجد أهداف ادخار مفعلة</p>
                <p className="text-[9px] text-slate-400 mt-1">الرجاء الانتقال إلى صفحة الأهداف لإنشاء حصالة.</p>
              </div>
            ) : (
              <select
                value={targetGoalId}
                onChange={(e) => handleGoalChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary-500 font-bold"
              >
                <option value="" disabled>-- حدد حصالة --</option>
                {savingGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name} (الرصيد: {formatCurrency(goal.currentAmount, currency)})
                  </option>
                ))}
              </select>
            )}
            <p className="text-[9px] text-slate-400 leading-normal">
              هذه الحصالة هي التي سيتجه إليها تحويل الفكة أو التعديل اليدوي للمبلغ.
            </p>
          </div>

          {/* Multiplier Selector */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 justify-start text-[10px] font-black text-slate-500">
              <ArrowLeftRight size={14} className="text-primary-500" />
              <span>مضاعف حساب الفكة عند المحاكاة</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[1, 5, 10].map((num) => {
                const isSelected = multiplier === num;
                return (
                  <button
                    type="button"
                    key={num}
                    onClick={() => handleMultiplierChange(num)}
                    className={`px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    أقرب {num} {currency}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">
              يُستخدم في حساب مقدار الفكة المتراكمة في الحسابات عند الضغط على تفريغ الفكة.
            </p>
          </div>

        </div>

        {/* Dynamic Interactive Simulator */}
        <div className="p-4 bg-gradient-to-tr from-primary-500/5 to-transparent border border-primary-500/10 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1.5 justify-start text-[10px] font-black text-primary-600 dark:text-primary-400">
              <Sparkles size={14} />
              <span>محاكي الفكة التفاعلي</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400">حساب تقديري</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Input field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">مصروف للتجربة</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.050"
                  value={simulatorAmount}
                  onChange={(e) => setSimulatorAmount(e.target.value)}
                  placeholder="12.350"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary-500 text-right font-sans"
                  dir="ltr"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">د.ت</span>
              </div>
            </div>

            {/* Calculations Visualiser */}
            <div className="md:col-span-2 grid grid-cols-3 gap-2 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60 text-center">
              <div className="space-y-0.5 border-l border-slate-100 dark:border-slate-800">
                <p className="text-[9px] text-slate-400 font-bold">تقريب إلى</p>
                <p className="text-xs font-sans font-black text-slate-800 dark:text-white">
                  {formatCurrency(simTotal, currency)}
                </p>
              </div>
              <div className="space-y-0.5 border-l border-slate-100 dark:border-slate-800">
                <p className="text-[9px] text-emerald-500 font-black">فكة المتبقية</p>
                <p className="text-xs font-sans font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(simSaved, currency)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-400 font-bold">المبلغ الفعلي</p>
                <p className="text-xs font-sans font-black text-slate-800 dark:text-white">
                  {formatCurrency(simVal, currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Round-up Savings Statistics */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
        <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 justify-start">
          <TrendingUp size={14} className="text-emerald-500" />
          <span>إحصائيات وحصاد تفريغ الفكة</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Accumulated card */}
          <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-500/15 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <PiggyBank size={24} className="text-amber-500" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">رصيد الحصالة الحالي 🏡</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-sans mt-0.5">
                {formatCurrency(targetGoal ? targetGoal.currentAmount : 0, currency)}
              </p>
              <p className="text-[9px] text-slate-400 font-bold mt-1">
                إجمالي المحول للحصالة: <span className="font-sans text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(totalSavedViaRoundUp, currency)}</span> (من {roundUpTransactions.length} عملية تفريغ)
              </p>
            </div>
          </div>

          {/* Value of faka advice */}
          <div className="p-4 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-500/10 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={16} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[10px] text-slate-850 dark:text-slate-200 font-bold">تجميع الفكة يدوياً</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                الآن تصبح عملية التفريغ تحت سيطرتك الكاملة! يمكنك الضغط على "تفريغ الفكة يدوياً" في نهاية كل أسبوع أو شهر، أو تعديل مبلغ الحصالة مباشرة متى ما شئت.
              </p>
            </div>
          </div>

        </div>

        {/* List of recent round-ups / sweeps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span>سجل عمليات تفريغ الفكة</span>
            <span className="font-mono">{roundUpTransactions.length} عمليات</span>
          </div>

          {roundUpTransactions.length === 0 ? (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
              <p className="text-[10px] text-slate-400 font-bold">لم يتم تفريغ الفكة يدوياً بعد.</p>
              <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-1">اضغط على زر "تفريغ الفكة يدوياً الآن" لتحويل المبالغ المتبقية إلى الحصالة.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {roundUpTransactions.slice(0, 5).map((tx) => (
                <div 
                  key={tx.id} 
                  className="px-3 py-2 bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-350 font-bold truncate max-w-[220px]">
                      {tx.note || 'تفريغ فكة'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[9px] text-slate-400">
                      {tx.date}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      +{formatCurrency(tx.amount, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoundUpManager;
