import { GoogleGenAI, Type } from "@google/genai";
import { 
  Expense, 
  Income, 
  Budget, 
  Goal, 
  Account, 
  FinancialAdvice, 
  FinancialForecast, 
  Category, 
  SmartSavingChallenge,
  FinancialHealthAssessment,
  AISavingPlan
} from "../types";
import { safeStorage } from "../utils";

const MODEL_NAME = "gemini-3.7-flash";

const getApiKey = () => {
  if (typeof window !== 'undefined') {
    return safeStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY || '';
  }
  return process.env.GEMINI_API_KEY || '';
};

export const getFinancialAdvice = async (
  expenses: Expense[],
  income: Income[],
  budget: Budget | null,
  goals: Goal[],
  accounts: Account[],
  currency: string,
  dailyBudget: number,
  todaySpending: number
): Promise<FinancialAdvice[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key is missing');
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        بصفتك مستشاراً مالياً ذكياً وخبيراً في الاقتصاد التونسي ومتخصصاً في مساعدة عائلة تونسية شابة تتكون من (أب وأم وطفل رضيع)، قم بتحليل البيانات المالية التالية وقدم 3 إلى 4 نصائح عملية ومخصصة لهذه العائلة التونسية.
        العملة المستخدمة: الدينار التونسي (TND) - تذكر أن 1 دينار = 1000 مليم (المليمات مهمة جداً في تونس).
        ركز على توازن ميزانية الرضيع (حفاظات، حليب، طبيب أطفال)، ترشيد قفة العائلة، فواتير الستاغ (STEG)، والصحة.
        
        البيانات:
        - المصاريف الأخيرة: ${JSON.stringify(expenses.slice(0, 30))}
        - الدخل الأخير: ${JSON.stringify(income.slice(0, 10))}
        - الميزانية الشهرية: ${JSON.stringify(budget)}
        - الميزانية اليومية المحددة: ${dailyBudget} TND
        - صرف اليوم حتى الآن: ${todaySpending} TND
        - الأهداف المالية: ${JSON.stringify(goals)}
        - الحسابات: ${JSON.stringify(accounts)}
        
        يجب أن تكون النصائح باللغة العربية، مشجعة، وعملية، وتأخذ بعين الاعتبار أن المبالغ تحتوي على 3 أرقام بعد الفاصلة (المليمات).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "عنوان النصيحة" },
              advice: { type: Type.STRING, description: "تفاصيل النصيحة" },
              actionItem: { type: Type.STRING, description: "خطوة عملية للقيام بها" },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"], description: "أولوية النصيحة" }
            },
            required: ["title", "advice", "actionItem", "priority"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuotaError || error) {
      console.warn("Gemini API Error or Quota Exceeded. Using smart fallback advice.");
      return [
        {
          title: "ترشيد قفة الأسبوع والمصاريف الاستهلاكية",
          advice: "مراجعة مشتريات السوق الأسبوعي والاعتماد على العبوات الكبيرة ومحلات الجملة يوفر ما يصل إلى 15% من نفقات الطعام.",
          actionItem: "حدد قائمة مشتريات محكمة والتزم بها قبل الذهاب للسوق",
          priority: "high"
        },
        {
          title: "صندوق أمان وطوارئ للرضيع",
          advice: "نفقات الأطفال الرضع متغيرة وتحتاج هامش أمان نقدي غير متوقع (زيارات طبيب الأطفال، صيدلية، لقاحات).",
          actionItem: "خصص 50 د.ت شهرياً كوديعة طوارئ مخصصة للطفل",
          priority: "high"
        },
        {
          title: "مراقبة استهلاك الطاقة والستاغ (STEG)",
          advice: "الفواتير التقديرية للكهرباء قد تفاجئ الميزانية إذا لم يتم الترشيد وتسجيل العداد بانتظام.",
          actionItem: "سجل قراءة العداد شهرياً في تطبيق الستاغ",
          priority: "medium"
        }
      ];
    }
    console.error("Failed to get financial advice:", error);
    throw error;
  }
};

export const getFinancialForecast = async (
  expenses: Expense[],
  income: Income[],
  accounts: Account[],
  currency: string
): Promise<FinancialForecast[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key is missing');
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        بصفتك خبيراً في التنبؤ المالي بالسوق التونسي، قم بتحليل البيانات التاريخية وتوقع الرصيد الإجمالي للأشهر الثلاثة القادمة بالدينار التونسي (TND).
        العملة المستخدمة: TND (1 دينار = 1000 مليم).
        الرصيد الحالي: ${accounts.reduce((sum, a) => sum + a.balance, 0)}
        
        البيانات التاريخية:
        - المصاريف: ${JSON.stringify(expenses.slice(0, 50))}
        - الدخل: ${JSON.stringify(income.slice(0, 20))}
        
        يجب أن يكون التنبؤ واقعياً بناءً على أنماط الإنفاق والدخل، مع مراعاة دقة المليمات (3 أرقام بعد الفاصلة).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.STRING, description: "الشهر (مثلاً: 2025-05)" },
              predictedBalance: { type: Type.NUMBER, description: "الرصيد المتوقع في نهاية الشهر" },
              confidence: { type: Type.NUMBER, description: "مستوى الثقة في التوقع (0-1)" },
              reasoning: { type: Type.STRING, description: "سبب هذا التوقع باللغة العربية" }
            },
            required: ["month", "predictedBalance", "confidence", "reasoning"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.warn("Gemini API Error or Quota Exceeded. Using smart algorithmic forecast.");
    const currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const nonTransferIncome = income.filter(i => !i.isTransfer);
    const nonTransferExpenses = expenses.filter(e => !e.isTransfer);
    const avgIncome = nonTransferIncome.length > 0 ? nonTransferIncome.reduce((sum, i) => sum + i.amount, 0) / Math.max(1, nonTransferIncome.length) : 0;
    const avgExpense = nonTransferExpenses.length > 0 ? nonTransferExpenses.reduce((sum, e) => sum + e.amount, 0) / Math.max(1, nonTransferExpenses.length) : 0;
    const monthlyNet = Math.max(-100, avgIncome - avgExpense);
    
    const fallbackForecast: FinancialForecast[] = [];
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      fallbackForecast.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        predictedBalance: Math.max(0, currentBalance + (monthlyNet * i)),
        confidence: 0.75,
        reasoning: `توقع استقراري مبني على متوسط التدفقات الصافية (${monthlyNet.toFixed(3)} د.ت شهرياً) مع مراعاة نمط الصرف المنتظم.`
      });
    }
    return fallbackForecast;
  }
};

export const calculateFinancialHealth = async (
  expenses: Expense[],
  income: Income[],
  budget: Budget | null,
  goals: Goal[],
  accounts: Account[],
  categories: Category[],
  currency: string
): Promise<FinancialHealthAssessment> => {
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const nonTransferIncome = income.filter(i => !i.isTransfer);
  const nonTransferExpenses = expenses.filter(e => !e.isTransfer);
  const totalIncome = nonTransferIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = nonTransferExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetAmount = budget?.amount || (totalIncome > 0 ? totalIncome * 0.9 : 1000);
  
  // Calculate local empirical baseline
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 10;
  const budgetDiscipline = budgetAmount > 0 ? Math.min(100, Math.max(0, Math.round(100 - ((totalExpenses - budgetAmount) / budgetAmount) * 100))) : 80;
  const avgMonthlyExpense = totalExpenses > 0 ? totalExpenses : 800;
  const emergencyMonths = avgMonthlyExpense > 0 ? Number((totalBalance / avgMonthlyExpense).toFixed(1)) : 1;

  const apiKey = getApiKey();
  if (!apiKey) {
    return buildFallbackHealthAssessment(savingsRate, budgetDiscipline, emergencyMonths, totalBalance, totalExpenses, budgetAmount);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        بصفتك كبير المستشارين الماليين ومدقق العافية المالية في تونس، قم بإجراء تقييم دقيق وشامل للصحة المالية (Financial Health Audit) لعائلة تونسية شابة.
        العملة: TND (الدينار التونسي = 1000 مليم).
        
        الأرقام المالية:
        - الرصيد الإجمالي في كل الحسابات: ${totalBalance.toFixed(3)} TND
        - إجمالي الدخل المسجل: ${totalIncome.toFixed(3)} TND
        - إجمالي المصاريف المسجلة: ${totalExpenses.toFixed(3)} TND
        - الميزانية المحددة: ${budgetAmount.toFixed(3)} TND
        - الأهداف والادخارات: ${JSON.stringify(goals)}
        - تفاصيل المصاريف الأخيرة: ${JSON.stringify(expenses.slice(0, 40))}
        
        احسب درجة العافية المالية من 0 إلى 100، وحدد نقاط القوة، المخاطر المحدقة، وخطة عمل عملية فورية للتنفيذ.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "الدرجة الكلية من 0 إلى 100" },
            grade: { type: Type.STRING, enum: ["ممتاز", "جيد جداً", "متوسط", "يحتاج تحسين", "حرج"] },
            summary: { type: Type.STRING, description: "ملخص تحليلي احترافي ومشجع للوضع المالي" },
            metrics: {
              type: Type.OBJECT,
              properties: {
                savingsRatePercent: { type: Type.NUMBER, description: "نسبة الادخار من الدخل" },
                budgetDisciplinePercent: { type: Type.NUMBER, description: "نسبة الالتزام بالميزانية" },
                emergencyFundMonths: { type: Type.NUMBER, description: "صندوق الطوارئ يغطي كم شهر من النفقات" },
                needsVsWantsRatio: { type: Type.STRING, description: "نسبة الضروريات إلى الكماليات مثل 70/30" }
              },
              required: ["savingsRatePercent", "budgetDisciplinePercent", "emergencyFundMonths", "needsVsWantsRatio"]
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "أهم 2-3 نقاط قوة مالية"
            },
            vulnerabilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "أهم 2-3 نقاط ضعف أو تسرب مالي"
            },
            actionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "عنوان الإجراء العملي" },
                  impact: { type: Type.STRING, description: "الأثر المالي المتوقع مثل توفير 50 د.ت شهرياً" },
                  actionType: { type: Type.STRING, enum: ["budget", "goal", "expense_cut", "general"] },
                  categoryTarget: { type: Type.STRING, description: "الفئة المستهدفة إن وجدت" },
                  amount: { type: Type.NUMBER, description: "المبلغ المقترح إن وجد" }
                },
                required: ["title", "impact", "actionType"]
              }
            }
          },
          required: ["score", "grade", "summary", "metrics", "strengths", "vulnerabilities", "actionPlan"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.warn("AI Health calculation fallback used.", error);
    return buildFallbackHealthAssessment(savingsRate, budgetDiscipline, emergencyMonths, totalBalance, totalExpenses, budgetAmount);
  }
};

const buildFallbackHealthAssessment = (
  savingsRate: number,
  budgetDiscipline: number,
  emergencyMonths: number,
  totalBalance: number,
  totalExpenses: number,
  budgetAmount: number
): FinancialHealthAssessment => {
  let score = 72;
  if (savingsRate > 20 && budgetDiscipline > 80 && emergencyMonths >= 3) score = 88;
  else if (savingsRate < 5 || budgetDiscipline < 50) score = 58;

  let grade: FinancialHealthAssessment['grade'] = 'متوسط';
  if (score >= 85) grade = 'ممتاز';
  else if (score >= 75) grade = 'جيد جداً';
  else if (score >= 60) grade = 'متوسط';
  else if (score >= 45) grade = 'يحتاج تحسين';
  else grade = 'حرج';

  return {
    score,
    grade,
    summary: `وضعك المالي مستقر إجمالاً مع قدرة جيدة على تغطية النفقات الأساسية. التركيز على بناء صندوق طوارئ يغطي 3 أشهر سيمنح عائلتك راحة بال كبرى.`,
    metrics: {
      savingsRatePercent: savingsRate,
      budgetDisciplinePercent: budgetDiscipline,
      emergencyFundMonths: emergencyMonths,
      needsVsWantsRatio: "75/25"
    },
    strengths: [
      "متابعة دورية مستمرة للمصاريف والدخل",
      "التحكم الجيد في المصاريف الأساسية للعائلة",
      "وعي مالي متنامي ورغبة في الادخار المستمر"
    ],
    vulnerabilities: [
      "صندوق الطوارئ بحاجة للتعزيز لمواجهة مصاريف الصحة المفاجئة",
      "بعض النفقات الصغيرة غير المصنفة قد تسبب تسرباً للمليمات دون انتباه"
    ],
    actionPlan: [
      {
        title: "تخصيص تحويل تلقائي للادخار أول الشهر",
        impact: "توفير مضمون لا يقل عن 10% من الراتب",
        actionType: "goal",
        amount: 80
      },
      {
        title: "وضع سقف صارم للطلبات الخارجية والكماليات",
        impact: "تقليص الهدر بما يقارب 40 د.ت شهرياً",
        actionType: "expense_cut",
        categoryTarget: "طعام خارج المنزل"
      },
      {
        title: "تفعيل تحدي التوفير الأسبوعي في التطبيق",
        impact: "تحقيق مكاسب توفير سريعة ومحفزة",
        actionType: "general"
      }
    ]
  };
};

export const generateSavingPlanAI = async (
  goalName: string,
  targetAmount: number,
  timeframeMonths: number,
  expenses: Expense[],
  income: Income[],
  categories: Category[],
  currency: string
): Promise<AISavingPlan> => {
  const apiKey = getApiKey();
  const monthlyReq = Number((targetAmount / Math.max(1, timeframeMonths)).toFixed(3));

  if (!apiKey) {
    return buildFallbackSavingPlan(goalName, targetAmount, timeframeMonths, monthlyReq);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        بصفتك مهندس تخطيط مالي ذكي، صمم خطة ادخار دقيقة ومحكمة لتحقيق الهدف المالي التالي:
        - اسم الهدف: ${goalName}
        - المبلغ الإجمالي المطلوب: ${targetAmount.toFixed(3)} TND
        - المدة الزمنية المرغوبة: ${timeframeMonths} شهر
        - التوفير الشهري المطلوب: ${monthlyReq.toFixed(3)} TND
        
        بيانات المصاريف الحالية للمستخدم:
        ${JSON.stringify(expenses.slice(0, 40))}
        
        المطلوب:
        1. حدد الفئات التي يمكن اقتطاع المبالغ منها بدون ألم كبير على العائلة.
        2. ضع محطات مرحلية شهرية (Milestones).
        3. قدم تقييماً لمدى واقعية الخطة.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goalName: { type: Type.STRING },
            targetAmount: { type: Type.NUMBER },
            timeframeMonths: { type: Type.INTEGER },
            monthlySavingsRequired: { type: Type.NUMBER },
            categoryReductions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "الفئة المقترح تخفيضها" },
                  currentSpend: { type: Type.NUMBER, description: "الصرف الحالي التقريبي" },
                  suggestedReduction: { type: Type.NUMBER, description: "قيمة التخفيض المقترحة شهرياً" },
                  newMonthlySpend: { type: Type.NUMBER, description: "السقف الجديد المقترح" },
                  tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "نصائح عملية للتخفيض" }
                },
                required: ["category", "currentSpend", "suggestedReduction", "newMonthlySpend", "tips"]
              }
            },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.INTEGER, description: "رقم الشهر" },
                  projectedAccumulated: { type: Type.NUMBER, description: "المبلغ التراكمي المحقق" },
                  encouragement: { type: Type.STRING, description: "عبارة تشجيعية" }
                },
                required: ["month", "projectedAccumulated", "encouragement"]
              }
            },
            feasibilityRating: { type: Type.STRING, enum: ["عالية جداً", "ممكنة مع التزام", "صعبة تحتاج تعديل"] }
          },
          required: ["goalName", "targetAmount", "timeframeMonths", "monthlySavingsRequired", "categoryReductions", "milestones", "feasibilityRating"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.warn("Using fallback saving plan", err);
    return buildFallbackSavingPlan(goalName, targetAmount, timeframeMonths, monthlyReq);
  }
};

const buildFallbackSavingPlan = (
  goalName: string,
  targetAmount: number,
  timeframeMonths: number,
  monthlyReq: number
): AISavingPlan => {
  const milestones: Array<{ month: number; projectedAccumulated: number; encouragement: string; }> = [];
  for (let m = 1; m <= timeframeMonths; m++) {
    milestones.push({
      month: m,
      projectedAccumulated: Number((monthlyReq * m).toFixed(3)),
      encouragement: m === timeframeMonths ? '🎉 الوصول للهدف بنجاح تام!' : `شهر ${m}: إنجاز ${Math.round((m / timeframeMonths) * 100)}% من الهدف.`
    });
  }

  return {
    goalName,
    targetAmount,
    timeframeMonths,
    monthlySavingsRequired: monthlyReq,
    categoryReductions: [
      {
        category: "المطاعم والوجبات السريعة",
        currentSpend: 150,
        suggestedReduction: 60,
        newMonthlySpend: 90,
        tips: ["الاعتماد على تحضير الوجبات منزلياً", "تقليل طلبات القهوة السريعة خارج المنزل"]
      },
      {
        category: "التسوق والكماليات",
        currentSpend: 120,
        suggestedReduction: 40,
        newMonthlySpend: 80,
        tips: ["تأجيل أي شراء غير ضروري لمدة 48 ساعة للتفكير", "مقارنة الأسعار والعروض الترويجية"]
      }
    ],
    milestones,
    feasibilityRating: "ممكنة مع التزام"
  };
};

export const scanReceipt = async (
  base64Image: string,
  mimeType: string
): Promise<{ 
  amount: number; 
  note: string; 
  date: string; 
  categoryRecommendation?: string;
  merchant?: string;
  items?: { name: string; price: number }[];
}> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key is missing');
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `
              استخرج المعلومات الكاملة بدقة من هذا الإيصال أو الفاتورة التونسية:
              - المبلغ الإجمالي بالدينار التونسي (amount) مع المليمات بدقة (مثلاً 24.850).
              - اسم المتجر أو المحل (merchant) مثل Carrefour, Monoprix, Géant, Mg, صيدلية, كشك, etc.
              - ملاحظة قصيرة واضحة (note) تلخص المشتريات.
              - التاريخ بصيغة YYYY-MM-DD (date). إذا لم يوجد تاريخ، استخدم تاريخ اليوم.
              - الفئة المقترحة (categoryRecommendation) مثل: طعام، صحة، بيبي، فواتير، تسوق، نقل.
              - قائمة الأصناف مع أسعارها إن أمكن (items).
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "المبلغ الإجمالي في الإيصال" },
            merchant: { type: Type.STRING, description: "اسم المتجر أو المؤسسة" },
            note: { type: Type.STRING, description: "وصف قصير للمشتريات" },
            date: { type: Type.STRING, description: "تاريخ الإيصال بصيغة YYYY-MM-DD" },
            categoryRecommendation: { type: Type.STRING, description: "التصنيف المقترح" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                },
                required: ["name", "price"]
              }
            }
          },
          required: ["amount", "note", "date"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Receipt scan error:", error);
    throw error;
  }
};

export const getSmartSavingChallenge = async (
  expenses: Expense[],
  categories: Category[],
  budget: Budget | null,
  currency: string
): Promise<SmartSavingChallenge> => {
  const apiKey = getApiKey();
  const categoryMap = new Map<string, string>();
  categories.forEach(c => categoryMap.set(c.id, c.name));

  const simplifiedExpenses = expenses.slice(0, 50).map(e => ({
    amount: e.amount,
    category: categoryMap.get(e.categoryId) || 'أخرى',
    date: e.date,
    note: e.note || ''
  }));

  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const catName = categoryMap.get(e.categoryId) || 'أخرى';
    categoryTotals[catName] = (categoryTotals[catName] || 0) + e.amount;
  });

  if (!apiKey) {
    return buildFallbackChallenge(categoryTotals);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        بصفتك مستشاراً مالياً ذكياً خبيراً في الاقتصاد التونسي ومخطط ميزانيات مبتكر، قم بتحليل نمط الإنفاق الشهري للمستخدم واقتراح "تحدي توفير ذكي ومخصص" (Smart Saving Challenge) لمساعدته على توفير المال بذكاء خلال الفترة القادمة.
        
        العملة المستخدمة: الدينار التونسي (TND) - يرجى تمثيل المبالغ بدقة مع المليمات (مثلاً: 15.000 د.ت).
        
        بيانات المستخدم الحالية:
        - الميزانية الإجمالية: ${budget ? JSON.stringify(budget) : "غير محددة"}
        - إجمالي المصاريف حسب الفئات: ${JSON.stringify(categoryTotals)}
        - آخر 50 عملية صرف بالتفصيل: ${JSON.stringify(simplifiedExpenses)}
        - جميع الفئات المتاحة: ${JSON.stringify(categories.map(c => c.name))}

        التعليمات:
        1. ابحث عن الفئة الأكثر استهلاكاً أو التي تعاني من تسرب مالي غير مبرر (مثل "أخرى"، "طعام"، "قهوة وتسلية"، "مستلزمات").
        2. صمم تحدياً تفاعلياً ومحفزاً يحمل اسماً جذاباً وتونسياً باللغة العربية (مثال: "تحدي كوش الجملة 👶"، "مطبخ البيت التونسي 🥘"، "أسبوع بدون دليفري 🚫"، "تحدي قهوة البيت والترشيد ☕").
        3. حدد مبلغاً مستهدفاً منطقياً وقابلاً للتحقيق للتوفير (مثال: 50.000 د.ت)، ومدة بالأيام (مثال: 7 أو 14 أو 30 يوماً).
        4. قدم 3 إلى 5 نصائح عملية ومباشرة جداً باللهجة التونسية المهذبة أو العربية المبسطة وموجهة خصيصاً للتفوق في هذا التحدي.
        5. أضف تحليلاً موجزاً (analysis) يشرح للمستخدم بوضوح سبب اختيار هذا التحدي بالذات بناءً على أرقام إنفاقه.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "اسم تحدي التوفير" },
            description: { type: Type.STRING, description: "تفاصيل ووصف التحدي" },
            targetAmount: { type: Type.NUMBER, description: "المبلغ المقدر توفيره بالدينار التونسي" },
            durationDays: { type: Type.INTEGER, description: "مدة التحدي بالأيام" },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "خطوات ونصائح عملية للنجاح بالتحدي"
            },
            categoryName: { type: Type.STRING, description: "الفئة المستهدفة" },
            difficulty: { type: Type.STRING, enum: ["سهل", "متوسط", "صعب"], description: "درجة الصعوبة" },
            analysis: { type: Type.STRING, description: "تحليل مالي مخصص لسبب اختيار التحدي بناءً على نمط الإنفاق" }
          },
          required: ["title", "description", "targetAmount", "durationDays", "tips", "categoryName", "difficulty", "analysis"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.warn("Gemini API error generating saving challenge. Using premium fallback.", error);
    return buildFallbackChallenge(categoryTotals);
  }
};

const buildFallbackChallenge = (categoryTotals: Record<string, number>): SmartSavingChallenge => {
  let highestCategory = "طعام";
  let highestAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > highestAmount) {
      highestAmount = amt;
      highestCategory = cat;
    }
  });

  if (highestCategory.includes("طعام") || highestCategory.includes("أغذية") || highestCategory.includes("مطاعم")) {
    return {
      title: "تحدي الطبخ المنزلي اللذيذ 🍳",
      description: "تقليص الاعتماد على الأكلات الجاهزة والمطاعم والاعتماد بنسبة 90% على وجبات محضرة بحب في البيت التونسي.",
      targetAmount: 60,
      durationDays: 14,
      tips: [
        "قم بتحضير جدول وجبات أسبوعي واشترِ الخضار والمستلزمات من السوق الأسبوعي بالجملة.",
        "صنف بقايا العشاء واستغلها كوجبة غداء ممتازة لليوم التالي في العمل.",
        "تجنب طلبات التوصيل السريعة التي تزيد من كلفة الوجبة بالضعف."
      ],
      categoryName: highestCategory,
      difficulty: "متوسط",
      analysis: `بما أن فئة "${highestCategory}" تمثل جزءاً كبيراً من مصاريفك الأخيرة، فإن تحدي الطبخ المنزلي هو الأسرع لتحقيق وفر مالي فوري.`
    };
  }

  return {
    title: "تحدي ترشيد قفة الأسبوع 🛒",
    description: "تنظيم مصاريف المشتريات والسلع الاستهلاكية بالاعتماد على التخطيط المسبق وتجنب الشراء غير المخطط له.",
    targetAmount: 40,
    durationDays: 7,
    tips: [
      "لا تذهب للتسوق جائعاً أبداً لتفادي شراء سلع إضافية غير ضرورية.",
      "اكتب قائمة تسوق دقيقة قبل الخروج والتزم بها بنسبة 100%.",
      "قارن أسعار السلع واشترِ العروض الترويجية والعبوات الاقتصادية الكبيرة."
    ],
    categoryName: highestCategory || "المشتريات",
    difficulty: "سهل",
    analysis: "تحليل ذكي لنمط إنفاقك يشير إلى أن وضع ميزانية محددة للتسوق الأسبوعي سيوفر لك مبالغ مهمة دون التأثير على جودة معيشتك."
  };
};
