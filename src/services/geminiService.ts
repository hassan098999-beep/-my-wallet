import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Income, Budget, Goal, Account, FinancialAdvice, FinancialForecast } from "../types";
import { safeStorage } from "../utils";

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
      model: "gemini-3.5-flash",
      contents: `
        بصفتك مستشاراً مالياً ذكياً وخبيراً في الاقتصاد التونسي ومتخصصاً في مساعدة عائلة تونسية شابة تتكون من (أب وأم وطفل رضيع)، قم بتحليل البيانات المالية التالية وقدم 3 نصائح عملية ومخصصة لهذه العائلة التونسية.
        العملة المستخدمة: الدينار التونسي (TND) - تذكر أن 1 دينار = 1000 مليم (المليمات مهمة جداً في تونس).
        ركز على توازن ميزانية الرضيع (حفاظات، حليب، طبيب أطفال)، ترشيد قفة العائلة، فواتير الستاغ (STEG)، والصحة.
        
        البيانات:
        - المصاريف الأخيرة: ${JSON.stringify(expenses.slice(0, 20))}
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
      console.warn("Gemini API Error or Quota Exceeded. Using fallback advice.");
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
      model: "gemini-3.5-flash",
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
    if (isQuotaError || error) {
      console.warn("Gemini API Error or Quota Exceeded. Using fallback forecast.");
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

export const chatWithFinancialAdvisor = async (
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  contextData: any
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key is missing');
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    أنت مساعد مالي شخصي ذكي وودود، خبير في الاقتصاد التونسي ومصمم خصيصاً لمساعدة عائلة تونسية تتكون من أب وأم وطفل رضيع حديث الولادة على إدارة أموالهم بالدينار التونسي (TND).
    مهمتك هي تقديم المشورة الملائمة لوضعهم العائلي كزوجين مع رضيع صغير يمر بنمو وتطور مستمرين ومصاريف محددة (كوش، حليب أطفال، طبيب أطفال وعيادات، فواتير الستاغ والصوناد، قفة السوق لتأمين وجبات عائلية مغذية بميزانيات تونسية واقعية).
    تحدث باللغة العربية الدارجة التونسية المهذبة الممزوجة بالفصحى لتكون قريباً جداً من قلب ومخاوف العائلة التونسية، بأسلوب دافئ ومبسط وذكي.
    
    ملاحظات هامة حول العملة:
    - العملة هي الدينار التونسي (TND).
    - 1 دينار = 1000 مليم.
    - عند عرض المبالغ، استخدم دائماً 3 أرقام بعد الفاصلة لتمثيل المليمات (مثلاً: 10.500 د.ت أو 25.300 د.ت).
    
    البيانات المالية الحالية للمستخدمين (العائلة):
    ${JSON.stringify(contextData)}
    
    أجب على سؤال المستخدم بدقة بناءً على هذه البيانات. وجههم لترشيد الصرف واقترح بدائل تونسية صديقة للميزانية عائلية (مثل اقتناء مستلزمات البيبي بالجملة، سوق الخضار الأسبوعي، تجنب قروض الاستهلاك غير الضرورية).
  `;

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // Send history first if any
    for (const msg of history) {
      await chat.sendMessage({ message: msg.parts[0].text });
    }

    const response = await chat.sendMessage({ message });
    return response.text || "عذراً، لم أتمكن من معالجة طلبك.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

export const scanReceipt = async (
  base64Image: string,
  mimeType: string
): Promise<{ amount: number, note: string, date: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key is missing');
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "استخرج المعلومات التالية من هذا الإيصال التونسي: المبلغ الإجمالي بالدينار (amount)، ملاحظة قصيرة تصف المشتريات (note)، والتاريخ بصيغة YYYY-MM-DD (date). تذكر أن العملة هي الدينار التونسي والمبالغ قد تحتوي على 3 أرقام بعد الفاصلة للمليمات.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "المبلغ الإجمالي في الإيصال" },
            note: { type: Type.STRING, description: "وصف قصير للمشتريات أو اسم المتجر" },
            date: { type: Type.STRING, description: "تاريخ الإيصال بصيغة YYYY-MM-DD" },
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
