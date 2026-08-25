import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Sparkles, Calendar, Heart, ShieldCheck, 
  ShoppingCart, Home, Baby, Stethoscope, Coffee,
  Download, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { 
  formatCurrency, getBudgetMonth, getBudgetRange, 
  hapticFeedback, cn, safeStorage 
} from '../utils';
import { parseISO, subMonths, addMonths, format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Components
import { FamilyHeroCard } from '../components/family/FamilyHeroCard';
import { FamilyLivingPillars, LivingPillar } from '../components/family/FamilyLivingPillars';
import { FamilyBalanceMatrix } from '../components/family/FamilyBalanceMatrix';
import { FamilyGoalsTracker } from '../components/family/FamilyGoalsTracker';
import { WeeklyMarketBasketPlanner } from '../components/family/WeeklyMarketBasketPlanner';
import { RecentFamilyTransactions } from '../components/family/RecentFamilyTransactions';
import AddExpenseModal from '../components/AddExpenseModal';

export const FamilyReport: React.FC = () => {
  const { 
    expenses, 
    income, 
    categories, 
    budgets, 
    firstDayOfMonth, 
    currency, 
    goals 
  } = useAppContext();

  // State for selected month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const saved = safeStorage.getItem('masarifi_family_selected_month');
    return saved || getBudgetMonth(new Date(), firstDayOfMonth);
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Month Range
  const { start: monthStart, end: monthEnd } = useMemo(() => {
    return getBudgetRange(selectedMonth, firstDayOfMonth);
  }, [selectedMonth, firstDayOfMonth]);

  // Current Month Expenses
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (e.isTransfer || !e.date) return false;
      const d = parseISO(e.date);
      return d >= monthStart && d <= monthEnd;
    });
  }, [expenses, monthStart, monthEnd]);

  // Current Month Income
  const currentMonthIncome = useMemo(() => {
    return income.filter(i => {
      if (!i.date) return false;
      const d = parseISO(i.date);
      return d >= monthStart && d <= monthEnd;
    }).reduce((sum, i) => sum + i.amount, 0);
  }, [income, monthStart, monthEnd]);

  // Current Budget
  const currentBudget = useMemo(() => {
    return budgets?.find(b => b.month === selectedMonth) || null;
  }, [budgets, selectedMonth]);

  // Helper map for categories
  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  // Build the 5 Tunisian Living Pillars
  const pillars: LivingPillar[] = useMemo(() => {
    // 1. Groceries & Market Basket
    const foodCatIds = categories.filter(c => {
      const n = c.name.toLowerCase();
      return n.includes('أكل') || n.includes('شرب') || n.includes('طعام') || 
             n.includes('قفة') || n.includes('سوق') || n.includes('تموين') || 
             n.includes('grocery') || n.includes('food') || n.includes('market') || 
             n.includes('مرشي') || n.includes('خضار') || n.includes('لحوم');
    }).map(c => c.id);

    // 2. Housing & Utilities (STEG, SONEDE, Internet, Rent)
    const housingCatIds = categories.filter(c => {
      const n = c.name.toLowerCase();
      return n.includes('سكن') || n.includes('كراء') || n.includes('فاتورة') || 
             n.includes('فواتير') || n.includes('كهرباء') || n.includes('ماء') || 
             n.includes('steg') || n.includes('sonede') || n.includes('أنترنات') || 
             n.includes('housing') || n.includes('bills') || n.includes('utilities');
    }).map(c => c.id);

    // 3. Baby & Children Care
    const babyCatIds = categories.filter(c => {
      const n = c.name.toLowerCase();
      return n.includes('رضيع') || n.includes('أطفال') || n.includes('طفل') || 
             n.includes('baby') || n.includes('child') || n.includes('حفاض') || 
             n.includes('كوش') || n.includes('حليب') || n.includes('روضة');
    }).map(c => c.id);

    // 4. Healthcare & Prevention
    const healthCatIds = categories.filter(c => {
      const n = c.name.toLowerCase();
      return (n.includes('صحة') || n.includes('تداوي') || n.includes('طبيب') || 
              n.includes('دواء') || n.includes('صيدلية') || n.includes('health') || 
              n.includes('doctor') || n.includes('pharmacy')) && !babyCatIds.includes(c.id);
    }).map(c => c.id);

    // 5. Social & Family Lifestyle
    const lifestyleCatIds = categories.filter(c => {
      return !foodCatIds.includes(c.id) && 
             !housingCatIds.includes(c.id) && 
             !babyCatIds.includes(c.id) && 
             !healthCatIds.includes(c.id);
    }).map(c => c.id);

    const makePillarData = (
      id: string, 
      title: string, 
      subtitle: string, 
      icon: any, 
      color: string, 
      bgGradient: string, 
      textColor: string, 
      catIds: string[]
    ): LivingPillar => {
      const catDetails = catIds.map(cid => {
        const cat = categoryMap.get(cid);
        const spent = currentMonthExpenses
          .filter(e => e.categoryId === cid)
          .reduce((sum, e) => sum + e.amount, 0);
        const budgeted = Number(currentBudget?.categoryBudgets?.[cid]) || 0;
        return {
          id: cid,
          name: cat?.name || 'فئة',
          spent,
          budgeted,
          color: cat?.color
        };
      });

      const totalSpent = catDetails.reduce((sum, c) => sum + c.spent, 0);
      const totalBudgeted = catDetails.reduce((sum, c) => sum + c.budgeted, 0);

      return {
        id,
        title,
        subtitle,
        icon,
        color,
        bgGradient,
        textColor,
        spent: totalSpent,
        budgeted: totalBudgeted,
        categories: catDetails
      };
    };

    return [
      makePillarData(
        'groceries',
        'قفة السوق والتموين',
        'الخضار، الغلال، اللحوم، البقالة والمؤونة اليومية',
        ShoppingCart,
        'bg-emerald-500',
        'from-emerald-500/20 to-teal-500/10',
        'text-emerald-600 dark:text-emerald-400',
        foodCatIds
      ),
      makePillarData(
        'housing',
        'السكن، الطاقة والمرافق',
        'الكراء، فواتير الستاغ، الصوناد والأنترنات',
        Home,
        'bg-indigo-500',
        'from-indigo-500/20 to-blue-500/10',
        'text-indigo-600 dark:text-indigo-400',
        housingCatIds
      ),
      makePillarData(
        'baby',
        'رعاية الأبناء والرضيع',
        'الكوش، الحليب، زيارات طبيب الأطفال واللوازم',
        Baby,
        'bg-teal-500',
        'from-teal-500/20 to-cyan-500/10',
        'text-teal-600 dark:text-teal-400',
        babyCatIds
      ),
      makePillarData(
        'healthcare',
        'الصحة، التداوي والوقاية',
        'الصيدلية، الأطباء، الفحوصات والوقاية الأسرية',
        Stethoscope,
        'bg-rose-500',
        'from-rose-500/20 to-pink-500/10',
        'text-rose-600 dark:text-rose-400',
        healthCatIds
      ),
      makePillarData(
        'lifestyle',
        'الزيارات ونمط الحياة الأسري',
        'الضيافة، الخروج، المناسبات والمصاريف المتفرقة',
        Coffee,
        'bg-amber-500',
        'from-amber-500/20 to-orange-500/10',
        'text-amber-600 dark:text-amber-400',
        lifestyleCatIds
      )
    ];
  }, [categories, categoryMap, currentMonthExpenses, currentBudget]);

  // Overall KPI Metrics
  const totalLivingExpenses = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthExpenses]);

  const memberCount = 3; // Hassan, Souhir, Baby Yahya
  const perCapitaCost = totalLivingExpenses / memberCount;

  // Needs vs Wants calculation
  const needsAmount = useMemo(() => {
    return currentMonthExpenses.filter(e => {
      const cat = categoryMap.get(e.categoryId);
      return cat?.type === 'need' || !cat?.type;
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthExpenses, categoryMap]);

  const wantsAmount = useMemo(() => {
    return currentMonthExpenses.filter(e => {
      const cat = categoryMap.get(e.categoryId);
      return cat?.type === 'want';
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthExpenses, categoryMap]);

  const savingsAmount = useMemo(() => {
    return goals?.reduce((sum, g) => sum + g.currentAmount, 0) || 0;
  }, [goals]);

  const needsPercentage = totalLivingExpenses > 0 ? (needsAmount / totalLivingExpenses) * 100 : 0;

  // Living Health Score (0 - 100)
  const healthScore = useMemo(() => {
    let score = 85;
    if (needsPercentage > 75) score -= 15;
    else if (needsPercentage > 60) score -= 5;
    if (currentMonthIncome > 0 && totalLivingExpenses > currentMonthIncome) score -= 25;
    return Math.max(20, Math.min(100, score));
  }, [needsPercentage, currentMonthIncome, totalLivingExpenses]);

  // Month navigation
  const handlePrevMonth = () => {
    hapticFeedback('light');
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const prev = subMonths(d, 1);
    const newMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
    safeStorage.setItem('masarifi_family_selected_month', newMonth);
  };

  const handleNextMonth = () => {
    hapticFeedback('light');
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const next = addMonths(d, 1);
    const newMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
    safeStorage.setItem('masarifi_family_selected_month', newMonth);
  };

  const formattedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return format(d, 'MMMM yyyy', { locale: ar });
  }, [selectedMonth]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-16 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 font-tajawal text-right"
      dir="rtl"
    >
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>مركز التخطيط والمالية الأسرية</span>
            <span className="text-2xl">🏡</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            إدارة متكاملة لقفة البيت التونسي، موازنة المعيشة، وحماية الاستقرار المالي للأسرة
          </p>
        </div>

        {/* Month Navigation Control */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1.5 rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="الشهر السابق"
          >
            <ChevronRight size={18} />
          </button>
          
          <div className="px-3 text-xs font-black text-slate-800 dark:text-white min-w-[120px] text-center">
            {formattedMonthLabel}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="الشهر التالي"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* 1. Family Identity & Health Score Hero */}
      <FamilyHeroCard
        totalLivingExpenses={totalLivingExpenses}
        perCapitaCost={perCapitaCost}
        needsPercentage={needsPercentage}
        householdSavings={savingsAmount}
        healthScore={healthScore}
        currency={currency}
        memberCount={memberCount}
      />

      {/* 2. The 5 Living Pillars */}
      <FamilyLivingPillars
        pillars={pillars}
        currency={currency}
        totalLivingSpent={totalLivingExpenses}
      />

      {/* 3. 50/30/20 Balance Matrix & Smart Guidance */}
      <FamilyBalanceMatrix
        needsAmount={needsAmount}
        wantsAmount={wantsAmount}
        savingsAmount={savingsAmount}
        totalIncome={currentMonthIncome}
        currency={currency}
      />

      {/* 4. Family Protection Funds & Goals */}
      <FamilyGoalsTracker
        currency={currency}
      />

      {/* 5. Tunisian Weekly Market Basket Estimator */}
      <WeeklyMarketBasketPlanner
        currency={currency}
      />

      {/* 6. Recent Family Transactions */}
      <RecentFamilyTransactions
        expenses={currentMonthExpenses}
        categories={categories}
        currency={currency}
        onAddExpenseClick={() => setIsAddModalOpen(true)}
      />

      {/* Standard Add Expense Modal if triggered */}
      {isAddModalOpen && (
        <AddExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </motion.div>
  );
};

export default FamilyReport;
