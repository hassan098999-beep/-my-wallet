import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Income, Budget, Goal, Account, FinancialAdvice, FinancialForecast } from "../types";

const getApiKey = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY || '';
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
      model: "gemini-3-flash-preview",
      contents: `
        بصفتك مستشاراً مالياً ذكياً، قم بتحليل البيانات المالية التالية وقدم 3 نصائح عملية ومخصصة للمستخدم.
        العملة المستخدمة: ${currency}
        
        البيانات:
        - المصاريف الأخيرة: ${JSON.stringify(expenses.slice(0, 20))}
        - الدخل الأخير: ${JSON.stringify(income.slice(0, 10))}
        - الميزانية الشهرية: ${JSON.stringify(budget)}
        - الميزانية اليومية المحددة: ${dailyBudget} ${currency}
        - صرف اليوم حتى الآن: ${todaySpending} ${currency}
        - الأهداف المالية: ${JSON.stringify(goals)}
        - الحسابات: ${JSON.stringify(accounts)}
        
        يجب أن تكون النصائح باللغة العربية، مشجعة، وعملية.
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
    if (isQuotaError) {
      console.warn("Gemini API Quota Exceeded. Using fallback advice.");
      // Simple rule-based fallback advice
      return [
        {
          title: "تحسين المصاريف",
          advice: "بناءً على بياناتك، حاول مراجعة الفئات التي تستهلك أكبر قدر من ميزانيتك.",
          actionItem: "راجع تقرير المصاريف الشهري",
          priority: "medium"
        },
        {
          title: "الادخار للطوارئ",
          advice: "من الجيد دائماً تخصيص جزء من الدخل لصندوق الطوارئ.",
          actionItem: "حول 10% من دخلك للادخار",
          priority: "high"
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
      model: "gemini-3-flash-preview",
      contents: `
        بصفتك خبيراً في التنبؤ المالي، قم بتحليل البيانات التاريخية وتوقع الرصيد الإجمالي للأشهر الثلاثة القادمة.
        العملة المستخدمة: ${currency}
        الرصيد الحالي: ${accounts.reduce((sum, a) => sum + a.balance, 0)}
        
        البيانات التاريخية:
        - المصاريف: ${JSON.stringify(expenses.slice(0, 50))}
        - الدخل: ${JSON.stringify(income.slice(0, 20))}
        
        يجب أن يكون التنبؤ واقعياً بناءً على أنماط الإنفاق والدخل.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.STRING, description: "الشهر (مثلاً: 2024-05)" },
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
    const isQuotaError = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuotaError) {
      console.warn("Gemini API Quota Exceeded. Using fallback forecast.");
      const currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
      const avgIncome = income.length > 0 ? income.reduce((sum, i) => sum + i.amount, 0) / income.length : 0;
      const avgExpense = expenses.length > 0 ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0;
      const monthlyNet = avgIncome - avgExpense;
      
      const fallbackForecast: FinancialForecast[] = [];
      const now = new Date();
      for (let i = 1; i <= 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        fallbackForecast.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          predictedBalance: currentBalance + (monthlyNet * i),
          confidence: 0.5,
          reasoning: "توقع تقريبي بناءً على متوسط الدخل والمصاريف الحالي."
        });
      }
      return fallbackForecast;
    }
    console.error("Failed to get financial forecast:", error);
    throw error;
  }
};
