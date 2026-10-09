import { parseISO } from 'date-fns';
import { Expense, Income, Budget, Account, Category, Goal, RecurringExpense } from '../types';
import { getBudgetRange } from '../utils';

export interface HealthPillar {
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  displayValue: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  feedback: string;
  benchmark: string;
}

export interface HealthRecommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  impactAmount?: number;
  categoryName?: string;
  actionType: 'budget' | 'recurring' | 'goal' | 'income' | 'simulator';
  actionLabel: string;
  actionLink: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DetailedHealthReport {
  score: number; // 0 - 100
  grade: 'ممتاز' | 'متزن ومستقر' | 'يحتاج انتباه' | 'حرج';
  gradeDescription: string;
  gradeColor: string;
  gradeBg: string;
  gradeBorder: string;
  totalIncome: number;
  totalExpense: number;
  actualSavings: number;
  savingsRate: number;
  totalLiquidBalance: number;
  monthlyAverageBurn: number;
  emergencyRunwayMonths: number;
  budgetUtilizationPct: number;
  needsVsWants: {
    needsSpent: number;
    wantsSpent: number;
    savingsSpent: number;
    needsPct: number;
    wantsPct: number;
    savingsPct: number;
  };
  pillars: {
    savingsRate: HealthPillar;
    budgetDiscipline: HealthPillar;
    emergencyRunway: HealthPillar;
    needsVsWants: HealthPillar;
  };
  recommendations: HealthRecommendation[];
}

export function calculateDetailedHealthReport({
  income,
  expenses,
  budgets,
  accounts,
  categories,
  goals,
  recurringExpenses,
  currentMonth,
  firstDayOfMonth = 1,
  currency = 'د.ت'
}: {
  income: Income[];
  expenses: Expense[];
  budgets: Budget[];
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
  recurringExpenses: RecurringExpense[];
  currentMonth: string;
  firstDayOfMonth?: number;
  currency?: string;
}): DetailedHealthReport {
  const { start: monthStart, end: monthEnd } = getBudgetRange(currentMonth, firstDayOfMonth);

  // 1. Current month expenses and income
  const monthExpenses = expenses.filter(e => {
    if (e.isTransfer) return false;
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  });

  const monthIncome = income.filter(i => {
    if (i.isTransfer) return false;
    const d = parseISO(i.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = monthIncome.reduce((s, i) => s + i.amount, 0);
  const actualSavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? (actualSavings / totalIncome) * 100 : 0;

  // Liquid balance across accounts
  const totalLiquidBalance = (accounts || []).reduce((s, a) => s + Math.max(0, a.balance), 0);

  // Active budget limit
  const currentBudgetObj = (budgets || []).find(b => b.month === currentMonth);
  const currentBudgetAmount = currentBudgetObj?.amount || 0;

  // Breakdown by Category type: Need vs Want vs Saving
  let needsSpent = 0;
  let wantsSpent = 0;
  let savingsSpent = 0;

  monthExpenses.forEach(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    const catType = cat?.type || 'need';
    if (catType === 'need') needsSpent += e.amount;
    else if (catType === 'want') wantsSpent += e.amount;
    else if (catType === 'saving') savingsSpent += e.amount;
  });

  const totalCategorized = needsSpent + wantsSpent + savingsSpent || 1;
  const needsPct = totalIncome > 0 ? (needsSpent / totalIncome) * 100 : (needsSpent / totalCategorized) * 100;
  const wantsPct = totalIncome > 0 ? (wantsSpent / totalIncome) * 100 : (wantsSpent / totalCategorized) * 100;
  const effectiveSavingsPct = Math.max(savingsRate, totalIncome > 0 ? (savingsSpent / totalIncome) * 100 : 0);

  // Estimated monthly average burn rate (either current expenses or budget or 500 minimum)
  const monthlyAverageBurn = Math.max(totalExpense, currentBudgetAmount, 300);
  const emergencyRunwayMonths = monthlyAverageBurn > 0 ? totalLiquidBalance / monthlyAverageBurn : 0;

  // -----------------------------------------------------------------
  // Pillar 1: Savings Rate (30 Points Max)
  // -----------------------------------------------------------------
  let savingsRateScore = 0;
  let savingsStatus: HealthPillar['status'] = 'critical';
  let savingsFeedback = '';

  if (totalIncome === 0) {
    savingsRateScore = 10;
    savingsStatus = 'warning';
    savingsFeedback = 'سجّل مصادر الدخل الشهرية لحساب نسبة الادخار الدقيقة.';
  } else if (savingsRate >= 25) {
    savingsRateScore = 30;
    savingsStatus = 'excellent';
    savingsFeedback = `ممتاز جداً! نسبة ادخار استثنائية (${savingsRate.toFixed(1)}%) تفوق المعايير المالية وتؤمن مستقبلاً صلباً.`;
  } else if (savingsRate >= 18) {
    savingsRateScore = 26;
    savingsStatus = 'good';
    savingsFeedback = `معدل ادخار صحي (${savingsRate.toFixed(1)}%) يلبي التوصيات الاقتصادية للعائلات.`;
  } else if (savingsRate >= 10) {
    savingsRateScore = 18;
    savingsStatus = 'warning';
    savingsFeedback = `معدل ادخار مقبول (${savingsRate.toFixed(1)}%)، لكن يُفضّل رفع النسبة إلى 15-20% لتعزيز الأمان.`;
  } else if (savingsRate > 0) {
    savingsRateScore = 10;
    savingsStatus = 'warning';
    savingsFeedback = `معدل ادخار ضئيل (${savingsRate.toFixed(1)}%) لا يكفي لتغطية الطوارئ الصحية أو متطلبات الرضيع.`;
  } else {
    savingsRateScore = 3;
    savingsStatus = 'critical';
    savingsFeedback = 'عجز أو استهلاك كامل للمدخول (0% ادخار)؛ المصاريف تبتلع كامل المداخيل دون هامش أمان.';
  }

  const savingsPillar: HealthPillar = {
    title: 'نسبة الادخار الصافي',
    score: Math.round(savingsRateScore),
    maxScore: 30,
    percentage: Math.min(100, (savingsRateScore / 30) * 100),
    displayValue: totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : 'غير محدد',
    status: savingsStatus,
    feedback: savingsFeedback,
    benchmark: 'المعيار الموصى به: 15% - 20% فأكثر'
  };

  // -----------------------------------------------------------------
  // Pillar 2: Budget Discipline & Overrun Prevention (30 Points Max)
  // -----------------------------------------------------------------
  let budgetScore = 0;
  let budgetStatus: HealthPillar['status'] = 'good';
  let budgetFeedback = '';
  let budgetUtilizationPct = 0;

  if (currentBudgetAmount <= 0) {
    budgetScore = 18;
    budgetStatus = 'warning';
    budgetFeedback = 'لم تقم بتحديد سقف ميزانية شهري بعد؛ تحديد الميزانية يمنحك السيطرة الكاملة.';
  } else {
    budgetUtilizationPct = (totalExpense / currentBudgetAmount) * 100;
    if (budgetUtilizationPct <= 85) {
      budgetScore = 30;
      budgetStatus = 'excellent';
      budgetFeedback = `انضباط مثالي! استهلكت ${budgetUtilizationPct.toFixed(0)}% فقط من سقف الميزانية، وتبقى لك هامش أمان ممتاز.`;
    } else if (budgetUtilizationPct <= 100) {
      budgetScore = 24;
      budgetStatus = 'good';
      budgetFeedback = `ضمن الحدود الآمنة (${budgetUtilizationPct.toFixed(0)}%)؛ راقب وتيرة الصرف للأيام القادمة.`;
    } else if (budgetUtilizationPct <= 115) {
      budgetScore = 14;
      budgetStatus = 'warning';
      budgetFeedback = `تجاوز طفيف لسقف الميزانية (${budgetUtilizationPct.toFixed(0)}%)؛ يُرجى كبح الكماليات فوراً.`;
    } else {
      budgetScore = 4;
      budgetStatus = 'critical';
      budgetFeedback = `تجاوز حاد للميزانية (${budgetUtilizationPct.toFixed(0)}%)؛ هناك نزيف مالي يحتاج تدخلاً سريعاً.`;
    }
  }

  const budgetPillar: HealthPillar = {
    title: 'الانضباط بسقف الميزانية',
    score: Math.round(budgetScore),
    maxScore: 30,
    percentage: Math.min(100, (budgetScore / 30) * 100),
    displayValue: currentBudgetAmount > 0 ? `${budgetUtilizationPct.toFixed(0)}%` : 'بدون سقف',
    status: budgetStatus,
    feedback: budgetFeedback,
    benchmark: 'المعيار الموصى به: عدم تجاوز 100%'
  };

  // -----------------------------------------------------------------
  // Pillar 3: Emergency Fund Runway (20 Points Max)
  // -----------------------------------------------------------------
  let runwayScore = 0;
  let runwayStatus: HealthPillar['status'] = 'critical';
  let runwayFeedback = '';

  if (emergencyRunwayMonths >= 6) {
    runwayScore = 20;
    runwayStatus = 'excellent';
    runwayFeedback = `درع أمان حديدي! سيولتكم المتاحة تكفي لتغطية نفقات ${emergencyRunwayMonths.toFixed(1)} شهراً في حال انقطاع الدخل.`;
  } else if (emergencyRunwayMonths >= 3) {
    runwayScore = 17;
    runwayStatus = 'good';
    runwayFeedback = `صندوق طوارئ صلب يغطي ${emergencyRunwayMonths.toFixed(1)} أشهر؛ وهو الدرع الذهبي لحماية العائلة.`;
  } else if (emergencyRunwayMonths >= 1) {
    runwayScore = 11;
    runwayStatus = 'warning';
    runwayFeedback = `سيولتكم تكفي لشهر واحد (${emergencyRunwayMonths.toFixed(1)} شهر)؛ ننصح برفع الصندوق ليغطي 3 أشهر على الأقل.`;
  } else if (emergencyRunwayMonths > 0.3) {
    runwayScore = 6;
    runwayStatus = 'warning';
    runwayFeedback = `صندوق طوارئ هش لا يغطي سوى بضعة أسابيع (${emergencyRunwayMonths.toFixed(1)} شهر)؛ أي طارئ قد يضطرك للاستدانة.`;
  } else {
    runwayScore = 2;
    runwayStatus = 'critical';
    runwayFeedback = 'لا يوجد أي احتياطي نقدي أو صندوق طوارئ مرئي؛ وضع حساس جداً تجاه الأزمات.';
  }

  const runwayPillar: HealthPillar = {
    title: 'صندوق الطوارئ ودرع الأمان',
    score: Math.round(runwayScore),
    maxScore: 20,
    percentage: Math.min(100, (runwayScore / 20) * 100),
    displayValue: `${emergencyRunwayMonths.toFixed(1)} شهر`,
    status: runwayStatus,
    feedback: runwayFeedback,
    benchmark: 'المعيار الموصى به: 3 - 6 أشهر نفقات'
  };

  // -----------------------------------------------------------------
  // Pillar 4: 50/30/20 Needs vs Wants Ratio (20 Points Max)
  // -----------------------------------------------------------------
  let balanceScore = 0;
  let balanceStatus: HealthPillar['status'] = 'good';
  let balanceFeedback = '';

  // Ideal: Needs <= 55%, Wants <= 30%, Savings >= 15%
  if (wantsPct <= 30 && needsPct <= 65) {
    balanceScore = 20;
    balanceStatus = 'excellent';
    balanceFeedback = 'توزيع مثالي للمصروف يتبع قاعدة 50/30/20 الاقتصادية؛ تحكم ممتاز في الكماليات والترفيه.';
  } else if (wantsPct <= 40) {
    balanceScore = 15;
    balanceStatus = 'good';
    balanceFeedback = `الكماليات تمثل (${wantsPct.toFixed(0)}%) وهي قريبة من المقبول، لكن يمكن تقليصها قليلاً لزيادة الادخار.`;
  } else if (wantsPct <= 55) {
    balanceScore = 9;
    balanceStatus = 'warning';
    balanceFeedback = `نفقات الرغبات والكماليات مرتفعة (${wantsPct.toFixed(0)}%)؛ هناك استهلاك مفرط للمقاهي والمواسم.`;
  } else {
    balanceScore = 4;
    balanceStatus = 'critical';
    balanceFeedback = `الكماليات تبتلع (${wantsPct.toFixed(0)}%) من مصاريفكم! هذا يخل بتوازن العائلة المالي ويهدر المدخرات.`;
  }

  const balancePillar: HealthPillar = {
    title: 'توازن الضروريات والكماليات (50/30/20)',
    score: Math.round(balanceScore),
    maxScore: 20,
    percentage: Math.min(100, (balanceScore / 20) * 100),
    displayValue: `${Math.round(needsPct)}% ضروري / ${Math.round(wantsPct)}% كمالي`,
    status: balanceStatus,
    feedback: balanceFeedback,
    benchmark: 'المعيار الموصى به: 50% ضروريات، 30% كماليات، 20% ادخار'
  };

  // -----------------------------------------------------------------
  // Total Score & Grade Calculation
  // -----------------------------------------------------------------
  const totalScore = Math.min(100, Math.max(0, savingsRateScore + budgetScore + runwayScore + balanceScore));
  
  let grade: DetailedHealthReport['grade'] = 'يحتاج انتباه';
  let gradeDescription = '';
  let gradeColor = 'text-amber-500';
  let gradeBg = 'bg-amber-50 dark:bg-amber-950/30';
  let gradeBorder = 'border-amber-200 dark:border-amber-900/40';

  if (totalScore >= 85) {
    grade = 'ممتاز';
    gradeDescription = 'صحة مالية قوية واستقرار عالٍ؛ قدرة ممتازة على التوفير وحماية مستقبل العائلة ومواجهة أي طارئ بثقة.';
    gradeColor = 'text-emerald-600 dark:text-emerald-400';
    gradeBg = 'bg-emerald-50 dark:bg-emerald-950/30';
    gradeBorder = 'border-emerald-200 dark:border-emerald-900/40';
  } else if (totalScore >= 70) {
    grade = 'متزن ومستقر';
    gradeDescription = 'موقع مالي آمن ومتوازن؛ التزام جيد بالميزانية مع إمكانية تحسين صندوق الطوارئ وترشيد بعض الكماليات.';
    gradeColor = 'text-blue-600 dark:text-blue-400';
    gradeBg = 'bg-blue-50 dark:bg-blue-950/30';
    gradeBorder = 'border-blue-200 dark:border-blue-900/40';
  } else if (totalScore >= 50) {
    grade = 'يحتاج انتباه';
    gradeDescription = 'توازن هش؛ نسبة الادخار أو احتياطي الطوارئ بحاجة لدعم سريع لتفادي الانكشاف المالي عند حدوث مصاريف غير متوقعة.';
    gradeColor = 'text-amber-600 dark:text-amber-400';
    gradeBg = 'bg-amber-50 dark:bg-amber-950/30';
    gradeBorder = 'border-amber-200 dark:border-amber-900/40';
  } else {
    grade = 'حرج';
    gradeDescription = 'وضع مالي ضاغط يستوجب إعادة ترتيب الأولويات ووقف النفقات غير الأساسية فوراً والبدء بضبط ميزانية حازمة.';
    gradeColor = 'text-rose-600 dark:text-rose-400';
    gradeBg = 'bg-rose-50 dark:bg-rose-950/30';
    gradeBorder = 'border-rose-200 dark:border-rose-900/40';
  }

  // -----------------------------------------------------------------
  // Actionable Personalized Recommendations
  // -----------------------------------------------------------------
  const recommendations: HealthRecommendation[] = [];

  // Recommendation 1: Emergency Fund
  const hasEmergencyGoal = (goals || []).some(g => g.isEmergencyFund || g.name.includes('طوارئ') || g.name.includes('أمان'));
  if (!hasEmergencyGoal || emergencyRunwayMonths < 3) {
    const targetFund = Math.round(monthlyAverageBurn * 3);
    recommendations.push({
      id: 'emergency-fund',
      title: 'بناء درع الأمان وصندوق الطوارئ العائلي',
      description: `يُوصى بتأمين صندوق طوارئ بقيمة ${targetFund} ${currency} يغطي نفقات 3 أشهر تحسباً لأي طارئ صحي للرضيع أو صيانة للمنزل.`,
      impact: `يرفع مؤشر الأمان بـ +15 نقطة فور تحقيق أول شهر`,
      impactAmount: targetFund,
      actionType: 'goal',
      actionLabel: 'تفعيل هدف ادخار الطوارئ 🛡️',
      actionLink: '/savings',
      priority: 'high'
    });
  }

  // Recommendation 2: Recurring Commitments
  if ((recurringExpenses || []).length < 2) {
    recommendations.push({
      id: 'recurring-setup',
      title: 'جدولة الالتزامات والفواتير الثابتة (ستاغ، صوناد، إيجار)',
      description: 'نسيان الفواتير الثابتة يؤدي إلى مفاجآت مالية وغرامات تأخير؛ جدولة الفواتير دورياً توفر راحة بال وتحسب التكلفة بدقة.',
      impact: 'أتمتة الخصم والتنبيه قبل الاستحقاق بـ 3 أيام',
      actionType: 'recurring',
      actionLabel: 'جدولة التزام دوري 🔄',
      actionLink: '/recurring',
      priority: 'high'
    });
  }

  // Recommendation 3: Groceries & Market optimization
  const foodCat = categories.find(c => c.name.includes('سوق') || c.name.includes('قفة') || c.id === '1');
  if (foodCat) {
    const foodSpent = monthExpenses.filter(e => e.categoryId === foodCat.id).reduce((s, e) => s + e.amount, 0);
    if (foodSpent > 0 && totalIncome > 0 && (foodSpent / totalIncome) > 0.28) {
      const suggestedSave = Math.round(foodSpent * 0.15);
      recommendations.push({
        id: 'food-optimization',
        title: 'ترشيد قفة السوق ومواد العطارة',
        description: `قفة السوق تستهلك ${((foodSpent / totalIncome) * 100).toFixed(0)}% من الدخل. التسوق الأسبوعي الموحد من السوق الشعبي بالجملة يوفر ما يقارب ${suggestedSave} ${currency} شهرياً.`,
        impact: `توفير شهري تقديري: ${suggestedSave} ${currency}`,
        impactAmount: suggestedSave,
        categoryName: foodCat.name,
        actionType: 'simulator',
        actionLabel: 'محاكاة وفر القفة 🛒',
        actionLink: '/savings-indicators',
        priority: 'medium'
      });
    }
  }

  // Recommendation 4: Leisure and Coffee reduction
  const leisureCat = categories.find(c => c.name.includes('مقهى') || c.name.includes('ترفيه') || c.type === 'want');
  if (leisureCat) {
    const leisureSpent = monthExpenses.filter(e => e.categoryId === leisureCat.id).reduce((s, e) => s + e.amount, 0);
    if (leisureSpent > 80) {
      const suggestedCut = Math.round(leisureSpent * 0.25);
      recommendations.push({
        id: 'leisure-cut',
        title: 'ترشيد مصاريف المقاهي والخرجات الترفيهية',
        description: `إنفاق ${leisureSpent} ${currency} على المقاهي والكماليات؛ تخفيض 25% يوفر ${suggestedCut} ${currency} شهرياً تكفي لتغطية فاتورة الإنترنت أو الصوناد.`,
        impact: `وفر شهري مباشر: ${suggestedCut} ${currency}`,
        impactAmount: suggestedCut,
        categoryName: leisureCat.name,
        actionType: 'budget',
        actionLabel: 'ضبط سقف الترفيه ☕',
        actionLink: '/budget',
        priority: 'medium'
      });
    }
  }

  // Recommendation 5: Budget ceiling set
  if (!currentBudgetObj || currentBudgetAmount === 0) {
    recommendations.push({
      id: 'set-budget',
      title: 'تحديد سقف الميزانية الشهري الإجمالي',
      description: 'وضع سقف أعلى للمصاريف يحميك من الصرف العشوائي ويفعّل خوارزمية وتيرة الصرف اليومية الآمنة.',
      impact: 'تفعيل مؤشر الصرف اليومي وتنبيهات الاستهلاك',
      actionType: 'budget',
      actionLabel: 'تحديد الميزانية الآن 🎯',
      actionLink: '/budget',
      priority: 'high'
    });
  }

  return {
    score: Math.round(totalScore),
    grade,
    gradeDescription,
    gradeColor,
    gradeBg,
    gradeBorder,
    totalIncome,
    totalExpense,
    actualSavings,
    savingsRate,
    totalLiquidBalance,
    monthlyAverageBurn,
    emergencyRunwayMonths,
    budgetUtilizationPct,
    needsVsWants: {
      needsSpent,
      wantsSpent,
      savingsSpent,
      needsPct,
      wantsPct,
      savingsPct: effectiveSavingsPct
    },
    pillars: {
      savingsRate: savingsPillar,
      budgetDiscipline: budgetPillar,
      emergencyRunway: runwayPillar,
      needsVsWants: balancePillar
    },
    recommendations
  };
}
