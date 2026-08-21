import { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Expense, Category } from '../types';
import { startOfDay, endOfDay, subDays, isWithinInterval, format, parseISO, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth } from 'date-fns';

export interface BehavioralInsight {
  id: string;
  title: string;
  description: string;
  type: 'pattern' | 'warning' | 'positive' | 'prediction';
  impact?: string;
}

export const useBehavioralEngine = () => {
  const { expenses, dailyBudget, rollingBudgetEnabled, categories, income } = useAppContext();

  const insights = useMemo(() => {
    const list: BehavioralInsight[] = [];

    // Default high-quality Tunisian financial advisor tips when there is no data
    const defaultInsights: BehavioralInsight[] = [
      {
        id: 'childbirth-saving',
        title: 'شراء الكوش وحليب الرضيع 👶',
        description: 'اقتناء حفاظات الرضع والمستلزمات الأساسية بالعلب الكبيرة ومن مغازات الجملة أو الصيدليات المركزية يوفر ما بين 15% إلى 20% شهرياً.',
        type: 'positive',
        impact: 'توفير مقدر بـ 30 د.ت شهرياً.'
      },
      {
        id: 'weekly-market',
        title: 'قانون قفة السوق الأسبوعي 🛒',
        description: 'التسوق الأسبوعي المخطط له من الأسواق الشعبية للخضراء واللحوم أفضل بكثير من الشراء الفردي اليومي من المغازات الكبرى.',
        type: 'pattern',
        impact: 'تخفيض تكلفة القفة بنسبة 35%.'
      },
      {
        id: 'steg-optimization',
        title: 'ترشيد استهلاك طاقة الستاغ (STEG) ⚡',
        description: 'مراقبة استهلاك الكهرباء وتسجيل قراءة العداد بانتظام يضمن بقاء استهلاكك في شريحة الدعم الاقتصادية وتجنب فاتورة STEG المرتفعة.',
        type: 'warning',
        impact: 'تفادي الفواتير التقديرية المفاجئة.'
      }
    ];

    const validExpenses = expenses.filter(e => !e.isTransfer);
    if (validExpenses.length === 0) return defaultInsights;

    // 1. Time-based analysis
    const timeSlots = {
      morning: 0,   // 5am - 12pm
      afternoon: 0, // 12pm - 6pm
      evening: 0,   // 6pm - 10pm
      night: 0      // 10pm - 5am
    };

    validExpenses.forEach(e => {
      // استخدم createdAt للوقت الفعلي، وليس date الذي هو تاريخ فقط بدون ساعة
      const hour = new Date(e.createdAt || e.date).getHours();
      if (hour >= 5 && hour < 12) timeSlots.morning += e.amount;
      else if (hour >= 12 && hour < 18) timeSlots.afternoon += e.amount;
      else if (hour >= 18 && hour < 22) timeSlots.evening += e.amount;
      else timeSlots.night += e.amount;
    });

    const maxTime = Object.entries(timeSlots).reduce((a, b) => a[1] > b[1] ? a : b);
    const timeLabels: Record<string, string> = {
      morning: 'الصباح',
      afternoon: 'الظهيرة',
      evening: 'المساء',
      night: 'الليل'
    };

    if (maxTime[1] > 0) {
      list.push({
        id: 'time-pattern',
        title: `نمط الإنفاق الزمني`,
        description: `أنت تنفق معظم أموالك في فترة ${timeLabels[maxTime[0]]}.`,
        type: 'pattern'
      });
    }

    // 2. Category Projections (Real Cost Awareness)
    const categoryTotals: Record<string, number> = {};
    const last30Days = subDays(new Date(), 30);
    
    validExpenses
      .filter(e => e.categoryId && isWithinInterval(parseISO(e.date), { start: last30Days, end: new Date() }))
      .forEach(e => {
        categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amount;
      });

    Object.entries(categoryTotals).forEach(([catId, total]) => {
      if (total > 50) { // Only show significant costs
        const category = categories.find(c => c.id === catId);
        if (category) {
          list.push({
            id: `cost-awareness-${catId}`,
            title: `تكلفة حقيقية: ${category.name}`,
            description: `أنت تنفق حوالي ${total.toFixed(1)} TND شهرياً على ${category.name}.`,
            type: 'warning',
            impact: (dailyBudget * 30) > 0 ? `هذا يمثل ${( (total / (dailyBudget * 30)) * 100 ).toFixed(1)}% من ميزانيتك الشهرية.` : `هذا يمثل ${total.toFixed(1)} TND من نفقاتك الشهرية.`
          });
        }
      }
    });

    // 3. Trend Prediction
    const thisWeek = validExpenses.filter(e => isWithinInterval(parseISO(e.date), { start: startOfWeek(new Date()), end: new Date() }))
      .reduce((sum, e) => sum + e.amount, 0);
    const lastWeek = validExpenses.filter(e => isWithinInterval(parseISO(e.date), { start: startOfWeek(subWeeks(new Date(), 1)), end: endOfWeek(subWeeks(new Date(), 1)) }))
      .reduce((sum, e) => sum + e.amount, 0);

    if (thisWeek > lastWeek && lastWeek > 0) {
      const diff = ((thisWeek - lastWeek) / lastWeek) * 100;
      list.push({
        id: 'trend-warning',
        title: `تحذير الاتجاه`,
        description: `إنفاقك هذا الأسبوع أعلى بنسبة ${diff.toFixed(0)}% من الأسبوع الماضي.`,
        type: 'warning'
      });
    }

    // 4. Uncategorized / 'Other' Category Alert
    const otherCategory = categories.find(c => c.name === 'أخرى' || c.name === 'اخرى' || c.name === 'Other');
    if (otherCategory) {
      const otherTotal = validExpenses
        .filter(e => e.categoryId === otherCategory.id && isWithinInterval(parseISO(e.date), { start: last30Days, end: new Date() }))
        .reduce((sum, e) => sum + e.amount, 0);
      
      if (otherTotal > (dailyBudget * 30 * 0.1)) { // More than 10% of monthly budget
        list.push({
          id: 'uncategorized-warning',
          title: 'مصاريف غير مصنفة',
          description: `لقد أنفقت ${otherTotal.toFixed(1)} في فئة "أخرى" مؤخراً.`,
          type: 'warning',
          impact: 'نقترح إنشاء فئات جديدة لتتبع هذه المصاريف بدقة أكبر.'
        });
      }
    }

    // 5. Large Single Expense Alert
    const recentExpenses = validExpenses.filter(e => isWithinInterval(parseISO(e.date), { start: subDays(new Date(), 7), end: new Date() }));
    if (recentExpenses.length > 0) {
      const largestExpense = recentExpenses.reduce((max, e) => e.amount > max.amount ? e : max, recentExpenses[0]);
      if (largestExpense.amount > (dailyBudget * 30 * 0.2)) { // More than 20% of monthly budget
        const catName = categories.find(c => c.id === largestExpense.categoryId)?.name || 'غير معروف';
        list.push({
          id: 'large-expense-warning',
          title: 'مصروف كبير مؤخراً',
          description: `قمت بصرف مبلغ كبير (${largestExpense.amount.toFixed(1)}) على ${catName}.`,
          type: 'warning',
          impact: 'تأكد من أن هذا المصروف الاستثنائي لا يؤثر على ميزانيتك لبقية الشهر.'
        });
      }
    }

    return list;
  }, [expenses, categories, dailyBudget]);

  const rollingBudget = useMemo(() => {
    if (!rollingBudgetEnabled) return dailyBudget;

    const today = startOfDay(new Date());
    const monthStart = startOfMonth(new Date());
    
    // Find the first activity date to avoid accumulating budget for days before the user started using the app
    const allDates = [
      ...expenses.filter(e => !e.isTransfer).map(e => parseISO(e.date).getTime()),
      ...(income || []).filter(i => !i.isTransfer).map(i => parseISO(i.date).getTime())
    ];
    const firstActivityDate = allDates.length > 0 ? startOfDay(new Date(Math.min(...allDates))) : today;
    
    // The accumulation should start from either the start of the month or the first activity date, whichever is later
    const accumulationStartDate = new Date(Math.max(monthStart.getTime(), firstActivityDate.getTime()));
    
    // Calculate total budget for the month so far (from accumulation start date)
    const daysPassed = Math.floor((today.getTime() - accumulationStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalBudgetSoFar = dailyBudget * daysPassed;
    
    // Calculate total spent this month so far (excluding today)
    const yesterday = subDays(today, 1);
    let totalSpentThisMonth = 0;
    if (accumulationStartDate <= yesterday) {
      totalSpentThisMonth = expenses
        .filter(e => {
          if (e.isTransfer) return false;
          const d = parseISO(e.date);
          return isWithinInterval(d, { start: accumulationStartDate, end: yesterday });
        })
        .reduce((sum, e) => sum + e.amount, 0);
    }

    // Adjusted budget for today = (Total budget so far) - (Total spent so far)
    // This effectively carries over the remaining balance from previous days
    return Math.max(0, totalBudgetSoFar - totalSpentThisMonth);
  }, [expenses, income, dailyBudget, rollingBudgetEnabled]);

  return { insights, rollingBudget };
};
