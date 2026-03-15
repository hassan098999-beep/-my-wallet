import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Income, Budget, Goal, Account } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface FinancialAdvice {
  title: string;
  advice: string;
  actionItem: string;
  priority: 'low' | 'medium' | 'high';
}

export interface FinancialForecast {
  month: string;
  predictedBalance: number;
  confidence: number;
  reasoning: string;
}

export const getFinancialAdvice = async (
  expenses: Expense[],
  income: Income[],
  budget: Budget | null,
  goals: Goal[],
  accounts: Account[],
  currency: string
): Promise<FinancialAdvice[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `
        بصفتك مستشاراً مالياً ذكياً، قم بتحليل البيانات المالية التالية وقدم 3 نصائح عملية ومخصصة للمستخدم.
        العملة المستخدمة: ${currency}
        
        البيانات:
        - المصاريف الأخيرة: ${JSON.stringify(expenses.slice(0, 20))}
        - الدخل الأخير: ${JSON.stringify(income.slice(0, 10))}
        - الميزانية الحالية: ${JSON.stringify(budget)}
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
  } catch (error) {
    console.error("Failed to get financial advice:", error);
    return [];
  }
};

export const getFinancialForecast = async (
  expenses: Expense[],
  income: Income[],
  accounts: Account[],
  currency: string
): Promise<FinancialForecast[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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
  } catch (error) {
    console.error("Failed to get financial forecast:", error);
    return [];
  }
};
