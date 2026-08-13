import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, cn, getBudgetMonth } from '../utils';
import { 
  Baby, Calculator, Sparkles, ShoppingCart, Heart, Plus, Check, Info, ShieldCheck, HelpCircle, 
  ChevronLeft, AlertCircle, TrendingUp, TrendingDown, RefreshCcw, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const BabyBudget: React.FC = () => {
  const { 
    expenses, 
    categories, 
    accounts, 
    budgets, 
    firstDayOfMonth,
    addExpense, 
    setBudget, 
    currency = 'TND' 
  } = useAppContext();

  const currentMonth = getBudgetMonth(new Date(), firstDayOfMonth);
  const budget = budgets?.find(b => b.month === currentMonth);

  // Find Baby Category in state
  const babyCategory = useMemo(() => {
    return categories.find(c => 
      c.id === '2' || 
      c.name === 'لوازم ومصروف الرضيع' || 
      c.name.toLowerCase().includes('baby') || 
      c.name.includes('رضيع') || 
      c.name.includes('طفل') ||
      c.name.includes('أطفال')
    ) || categories[0]; // Fallback to first if not found
  }, [categories]);

  // Account fallback
  const defaultAccount = useMemo(() => {
    return accounts?.[0] || { id: 'cash', name: 'نقداً / كاش' };
  }, [accounts]);

  // Current Month Expenses under Baby Category
  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);
  
  const babyExpensesCurrentMonth = useMemo(() => {
    return expenses.filter(e => 
      !e.isTransfer &&
      e.categoryId === babyCategory?.id && 
      e.date && 
      e.date.startsWith(currentMonthStr)
    );
  }, [expenses, babyCategory, currentMonthStr]);

  // Total spent this month on Baby Category
  const babyTotalSpent = useMemo(() => {
    return babyExpensesCurrentMonth.reduce((sum, e) => sum + e.amount, 0);
  }, [babyExpensesCurrentMonth]);

  // Budget for Baby Category
  const babyCategoryBudget = useMemo(() => {
    if (!budget || !budget.categoryBudgets || !babyCategory) return 0;
    return budget.categoryBudgets[babyCategory.id] || 0;
  }, [budget, babyCategory]);

  // Classify Baby Expenses into Diapers, Milk, Healthcare, Clothing/Gear
  const classifiedExpenses = useMemo(() => {
    let diapers = 0;
    let milk = 0;
    let healthcare = 0;
    let clothing = 0;

    const diapersList: typeof expenses = [];
    const milkList: typeof expenses = [];
    const healthcareList: typeof expenses = [];
    const clothingList: typeof expenses = [];

    babyExpensesCurrentMonth.forEach(e => {
      const note = (e.note || '').toLowerCase();
      
      const isDiapers = note.includes('حفاظ') || note.includes('حفاض') || note.includes('كوش') || 
                        note.includes('diaper') || note.includes('pampers') || note.includes('peaudouce') || 
                        note.includes('libero') || note.includes('بامبرز');
                        
      const isMilk = note.includes('حليب') || note.includes('نيدو') || note.includes('بريمالاك') || 
                     note.includes('ابتاميل') || note.includes('غذاء') || note.includes('سيريال') || 
                     note.includes('milk') || note.includes('formula') || note.includes('aptamil') || 
                     note.includes('بيوميل') || note.includes('رينولاك') || note.includes('علبة');
                     
      const isHealthcare = note.includes('طبيب') || note.includes('دواء') || note.includes('تلقيح') || 
                           note.includes('مرطب') || note.includes('زيت') || note.includes('شامبو') || 
                           note.includes('بودرة') || note.includes('فيزيتا') || note.includes('دكتور') || 
                           note.includes('صيدلية') || note.includes('دوا') || note.includes('لقاح') || 
                           note.includes('cream') || note.includes('shampoo') || note.includes('physio') ||
                           note.includes('فيزيول');

      if (isDiapers) {
        diapers += e.amount;
        diapersList.push(e);
      } else if (isMilk) {
        milk += e.amount;
        milkList.push(e);
      } else if (isHealthcare) {
        healthcare += e.amount;
        healthcareList.push(e);
      } else {
        clothing += e.amount;
        clothingList.push(e);
      }
    });

    return {
      diapers: { total: diapers, items: diapersList },
      milk: { total: milk, items: milkList },
      healthcare: { total: healthcare, items: healthcareList },
      clothing: { total: clothing, items: clothingList }
    };
  }, [babyExpensesCurrentMonth]);

  // Calculator inputs
  const [diaperPacks, setDiaperPacks] = useState(3);
  const [diaperPrice, setDiaperPrice] = useState(36); // Typical TND price for peaudouce / libero / pampers jumbo pack
  
  const [milkTins, setMilkTins] = useState(4);
  const [milkPrice, setMilkPrice] = useState(26); // Typical TND price for baby milk formula in Tunisia
  
  const [healthcareBuffer, setHealthcareBuffer] = useState(40); // Buffer for pediatric visits and vitamins/physiol
  const [clothingBuffer, setClothingBuffer] = useState(30); // Clothes / general accessories

  const calculatedBabyTotal = useMemo(() => {
    return (diaperPacks * diaperPrice) + (milkTins * milkPrice) + healthcareBuffer + clothingBuffer;
  }, [diaperPacks, diaperPrice, milkTins, milkPrice, healthcareBuffer, clothingBuffer]);

  // Quick log confirmation state
  const [isQuickLogLoading, setIsQuickLogLoading] = useState(false);

  // Quick Logging Shortcuts Handler
  const handleQuickLog = async (item: { name: string, amount: number, note: string }) => {
    hapticFeedback('medium');
    setIsQuickLogLoading(true);

    let savedPaymentMethod: any = 'cash';
    try {
      const raw = localStorage.getItem('masarifi_last_used');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.paymentMethod) savedPaymentMethod = parsed.paymentMethod;
      }
    } catch (e) {
      console.error(e);
    }

    try {
      addExpense({
        amount: item.amount,
        categoryId: babyCategory.id,
        accountId: defaultAccount.id,
        date: new Date().toISOString().substring(0, 10),
        note: item.note,
        paymentMethod: savedPaymentMethod
      });

      toast.success(
        <div className="flex flex-col gap-1 text-right font-tajawal">
          <span className="font-bold text-sm">تم تسجيل مصروف يحيى بنجاح 🍼</span>
          <span className="text-xs opacity-90">{item.name} بمبلغ {formatCurrency(item.amount, currency)}</span>
        </div>,
        { duration: 3500 }
      );
    } catch (err) {
      toast.error('فشل تسجيل العملية');
    } finally {
      setIsQuickLogLoading(false);
    }
  };

  // Set the calculated baby budget as the official budget limit
  const applyCalculatedBudget = () => {
    hapticFeedback('success');
    if (!budget || !babyCategory) return;

    const currentCategoryBudgets = budget.categoryBudgets || {};
    const updatedCategoryBudgets = {
      ...currentCategoryBudgets,
      [babyCategory.id]: calculatedBabyTotal
    };

    setBudget({
      ...budget,
      categoryBudgets: updatedCategoryBudgets
    });

    toast.success(
      <div className="flex flex-col gap-1 text-right font-tajawal">
        <span className="font-black text-sm">تم اعتماد ميزانية يحيى! ✨🍼</span>
        <span className="text-xs opacity-90">تم تحديث سقف مصروف الرضيع المقدر بـ {formatCurrency(calculatedBabyTotal, currency)}</span>
      </div>,
      { duration: 4000 }
    );
  };

  const quickLogItems = [
    { name: 'باكيت حفاضات جامبو', amount: 36, note: 'شراء حفاضات للرضيع يحيى 🧷' },
    { name: 'علبة حليب الأطفال الرضع', amount: 26, note: 'علبة حليب للرضيع يحيى 🍼' },
    { name: 'زيارة طبيب الأطفال العادية', amount: 60, note: 'معاينة طبيب الأطفال ليحيى 🩺' },
    { name: 'علبة سيروم فيزيولوجي وقطن', amount: 12, note: 'مستلزمات صحية ونظافة للرضيع يحيى 🧴' },
    { name: 'لهاية جديدة وألعاب معقمة', amount: 15, note: 'ألعاب ولهاية ليحيى 🧸' }
  ];

  // Progress Bar color helper
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-rose-500';
    if (percent >= 85) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const babyBudgetPercent = babyCategoryBudget > 0 ? (babyTotalSpent / babyCategoryBudget) * 100 : 0;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Upper Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        
        {/* Baby Info / Avatar Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Baby size={28} className="animate-bounce" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">بطاقة يحيى 💳</span>
          </div>
          
          <div className="mt-4">
            <h4 className="text-lg font-black text-slate-800 dark:text-white">الرضيع يحيى الرياحي 👶</h4>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              السن: شهر واحد و 18 يوماً 🍼
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">
              يحتاج الرضع في هذا السن إلى رعاية مركزة، حفاضات ناعمة، ومعاينة دورية للوزن والنمو.
            </p>
          </div>
        </motion.div>

        {/* Baby Expenses This Month */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المصروف الفعلي للطفل 📊</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-3 font-mono">
              {formatCurrency(babyTotalSpent, currency)}
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-550 dark:text-slate-400">سقف ميزانية يحيى:</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono">
              {babyCategoryBudget > 0 ? formatCurrency(babyCategoryBudget, currency) : 'لم يتم الضبط'}
            </span>
          </div>
        </motion.div>

        {/* Budget Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نسبة استهلاك الميزانية 📈</span>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                {babyBudgetPercent.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 font-bold">من المخصص</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500 rounded-full", getProgressColor(babyBudgetPercent))}
                style={{ width: `${Math.min(100, babyBudgetPercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold">
              {babyBudgetPercent >= 100 
                ? '⚠️ تنبيه: لقد تجاوزت الميزانية المحددة لمستلزمات الرضيع!' 
                : babyBudgetPercent >= 80 
                ? '⚡ تنبيه: اقتربت من بلوغ سقف مصروفات الرضيع لهذا الشهر.'
                : '✅ رائع! الاستهلاك معتدل وضمن نطاق الأمان المالي.'
              }
            </p>
          </div>
        </motion.div>

      </div>

      {/* Main Grid: Subgroups and Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        
        {/* Baby Subgroups Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingCart size={18} className="text-emerald-500" />
              <span>تحليل مصروفات يحيى بالتفصيل 🍼📊</span>
            </h3>
          </div>

          <div className="space-y-4">
            
            {/* 1. Diapers Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">🧷</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-white">الحفاضات والنظافة العامة</h5>
                    <p className="text-[10px] text-slate-400 font-bold">{classifiedExpenses.diapers.items.length} عمليات شراء</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">
                  {formatCurrency(classifiedExpenses.diapers.total, currency)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-500">
                  <span>الاستهلاك التقديري</span>
                  <span>{babyCategoryBudget > 0 ? `${((classifiedExpenses.diapers.total / (babyCategoryBudget * 0.4 || 1)) * 100).toFixed(0)}% من الموصى به` : '-'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${Math.min(100, babyCategoryBudget > 0 ? (classifiedExpenses.diapers.total / (babyCategoryBudget * 0.4 || 1)) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Milk Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs">🍼</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-white">الحليب والرضاعة والأغذية</h5>
                    <p className="text-[10px] text-slate-400 font-bold">{classifiedExpenses.milk.items.length} عمليات شراء</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">
                  {formatCurrency(classifiedExpenses.milk.total, currency)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-500">
                  <span>الاستهلاك التقديري</span>
                  <span>{babyCategoryBudget > 0 ? `${((classifiedExpenses.milk.total / (babyCategoryBudget * 0.4 || 1)) * 100).toFixed(0)}% من الموصى به` : '-'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded-full" 
                    style={{ width: `${Math.min(100, babyCategoryBudget > 0 ? (classifiedExpenses.milk.total / (babyCategoryBudget * 0.4 || 1)) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Healthcare & Hygiene Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">🩺</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-white">الصحة والعناية بالطفل</h5>
                    <p className="text-[10px] text-slate-400 font-bold">{classifiedExpenses.healthcare.items.length} عمليات شراء</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">
                  {formatCurrency(classifiedExpenses.healthcare.total, currency)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-500">
                  <span>الاستهلاك التقديري</span>
                  <span>{babyCategoryBudget > 0 ? `${((classifiedExpenses.healthcare.total / (babyCategoryBudget * 0.15 || 1)) * 100).toFixed(0)}% من الموصى به` : '-'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${Math.min(100, babyCategoryBudget > 0 ? (classifiedExpenses.healthcare.total / (babyCategoryBudget * 0.15 || 1)) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 4. Clothing & Gear Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-xs">🧸</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-white">الكسوة والمستلزمات والألعاب</h5>
                    <p className="text-[10px] text-slate-400 font-bold">{classifiedExpenses.clothing.items.length} عمليات شراء</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">
                  {formatCurrency(classifiedExpenses.clothing.total, currency)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-500">
                  <span>الاستهلاك التقديري</span>
                  <span>{babyCategoryBudget > 0 ? `${((classifiedExpenses.clothing.total / (babyCategoryBudget * 0.15 || 1)) * 100).toFixed(0)}% من الموصى به` : '-'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full" 
                    style={{ width: `${Math.min(100, babyCategoryBudget > 0 ? (classifiedExpenses.clothing.total / (babyCategoryBudget * 0.15 || 1)) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Smart Calculator Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="px-1">
            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Calculator size={18} className="text-emerald-500" />
              <span>محاكي ميزانية الرضيع يحيى الذكي 🎯💬</span>
            </h3>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm space-y-5">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              تتيح لك هذه الحاسبة محاكاة الاستهلاك التقديري للرضيع يحيى (البالغ من العمر شهراً واحداً) لتخصيص سقف مالي دقيق يحمي ميزانيتك العائلية وتثبيته بضغطة زر.
            </p>

            <div className="space-y-4">
              
              {/* Diapers Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-700 dark:text-slate-300">الحفاضات (باكيت جامبو شهرياً)</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">{diaperPacks} علب × {diaperPrice} {currency}</span>
                </div>
                <div className="grid grid-cols-5 gap-3 items-center">
                  <input 
                    type="range" 
                    min="1" 
                    max="6" 
                    value={diaperPacks}
                    onChange={(e) => { hapticFeedback('light'); setDiaperPacks(Number(e.target.value)); }}
                    className="col-span-3 accent-indigo-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="col-span-2 text-left">
                    <input 
                      type="number" 
                      value={diaperPrice}
                      onChange={(e) => setDiaperPrice(Number(e.target.value) || 0)}
                      className="w-full p-1.5 rounded-xl text-center font-mono text-xs font-bold border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Milk Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-700 dark:text-slate-300">حليب الرضع (علبة 400g شهرياً)</span>
                  <span className="text-sky-600 dark:text-sky-400 font-mono">{milkTins} علب × {milkPrice} {currency}</span>
                </div>
                <div className="grid grid-cols-5 gap-3 items-center">
                  <input 
                    type="range" 
                    min="1" 
                    max="8" 
                    value={milkTins}
                    onChange={(e) => { hapticFeedback('light'); setMilkTins(Number(e.target.value)); }}
                    className="col-span-3 accent-sky-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="col-span-2 text-left">
                    <input 
                      type="number" 
                      value={milkPrice}
                      onChange={(e) => setMilkPrice(Number(e.target.value) || 0)}
                      className="w-full p-1.5 rounded-xl text-center font-mono text-xs font-bold border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Healthcare Buffer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-700 dark:text-slate-300">الصحة والزيارات الطبية والتطعيمات</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">{healthcareBuffer} {currency}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="150" 
                  step="5"
                  value={healthcareBuffer}
                  onChange={(e) => { hapticFeedback('light'); setHealthcareBuffer(Number(e.target.value)); }}
                  className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Clothing / Gear Buffer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-700 dark:text-slate-300">الملابس، الألعاب والمستلزمات الموسمية</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono">{clothingBuffer} {currency}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="150" 
                  step="5"
                  value={clothingBuffer}
                  onChange={(e) => { hapticFeedback('light'); setClothingBuffer(Number(e.target.value)); }}
                  className="w-full accent-rose-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

            </div>

            {/* Simulated Total */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي الميزانية التقديرية المقترحة 📊</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-mono">
                  {formatCurrency(calculatedBabyTotal, currency)}
                </p>
              </div>

              <button
                onClick={applyCalculatedBudget}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Check size={14} />
                <span>اعتماد كميزانية للرضيع 🎯</span>
              </button>
            </div>

          </div>
        </motion.div>

      </div>

      {/* Sleep-Deprived Parent 1-Click Logging Shortcut Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-5 rounded-3xl bg-gradient-to-br from-slate-100/60 via-emerald-500/5 to-transparent border border-slate-200/50 dark:border-slate-800/50 space-y-4"
      >
        <div className="flex items-center justify-between px-1">
          <div className="text-right">
            <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <Sparkles size={16} className="text-emerald-500 animate-pulse" />
              <span>لوحة التسجيل السريع لسهير وحسن (ضغطة واحدة) 🍼⚡</span>
            </h4>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
              نعلم كم هو مجهد الشهر الأول مع الرضيع! بنقرة واحدة سريعة يمكنك تدوين المصروف مباشرة دون تعبئة حقول طويلة.
            </p>
          </div>
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">سهل ومريح 🛋️</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickLogItems.map((item, index) => (
            <button
              key={index}
              disabled={isQuickLogLoading}
              onClick={() => handleQuickLog(item)}
              className="p-3.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 hover:border-emerald-500/30 rounded-2xl flex flex-col items-center justify-between text-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.96] cursor-pointer shadow-sm disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-lg shrink-0">
                {index === 0 ? '🧷' : index === 1 ? '🍼' : index === 2 ? '🩺' : index === 3 ? '🧴' : '🧸'}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">
                  {item.name}
                </p>
                <p className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(item.amount, currency)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Developmental and Financial Advice for Month 1 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm space-y-4"
      >
        <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
          <BookOpen size={16} className="text-emerald-500" />
          <span>مرشد رعاية يحيى وتدابير توفير قفة الرضيع في الشهر الأول 🍼📖</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-400">
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <h5 className="font-black text-slate-800 dark:text-white flex items-center gap-1.5 text-[11px]">
              <span className="text-emerald-500">🍼</span>
              <span>الحليب والرضاعة الطبيعية</span>
            </h5>
            <p className="text-[10px] text-slate-500 dark:text-slate-450">
              في الشهر الأول، الرضاعة الطبيعية هي الخيار الأوفر والأصح ليحيى. إذا تم استخدام حليب رضع اصطناعي، يوصى دائماً بشراء العلب من الصيدلية باستعمال اشتراكات أو عبوات عائلية للاستفادة من تخفيضات الأوفياء.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <h5 className="font-black text-slate-800 dark:text-white flex items-center gap-1.5 text-[11px]">
              <span className="text-indigo-500">🧷</span>
              <span>شراءات الحفاضات الذكية</span>
            </h5>
            <p className="text-[10px] text-slate-500 dark:text-slate-450">
              الحفاضات من قياس 1 و 2 يمر منها يحيى سريعاً جداً هذا الشهر! تجنب تخزين كميات هائلة من قياس 1 لأن وزنه سيزداد بسرعة فائقة. اشترِ علباً جامبو اقتصادية بدلاً من الأكياس الصغيرة لتوفير ما يقارب 15% من السعر الإجمالي.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <h5 className="font-black text-slate-800 dark:text-white flex items-center gap-1.5 text-[11px]">
              <span className="text-emerald-500">🩺</span>
              <span>التلقيح وصحة الرضيع</span>
            </h5>
            <p className="text-[10px] text-slate-550 dark:text-slate-450">
              التلقيحات الأساسية متوفرة مجاناً في مستوصفات ومراكز الصحة الأساسية بتونس وتحت رقابة صارمة. يمكنك توفير قيمة فيزيتا عيادة الطبيب الخاص للمراجعات البسيطة، واستخدام دفاتر الرعاية الحكومية المجانية كخيار آمن وصحي تماماً.
            </p>
          </div>

        </div>
      </motion.div>

    </div>
  );
};

export default BabyBudget;
