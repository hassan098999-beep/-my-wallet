import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, BrainCircuit, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Type, FunctionDeclaration } from '@google/genai';
import { useAppContext } from '../store/AppContext';
import { hapticFeedback } from '../utils';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

export default function Assistant() {
  const { accounts, expenses, budget, currency, categories, addExpense, addIncome } = useAppContext();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك المالي الذكي. يمكنني تحليل مصاريفك، تقديم نصائح، أو حتى إضافة مصاريف ودخول جديدة نيابة عنك. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<any[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY;
    if (!key) {
      setApiKeyMissing(true);
    } else {
      setApiKeyMissing(false);
    }
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const apiKey = localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      setApiKeyMissing(true);
      return;
    }

    const userQuery = query.trim();
    hapticFeedback('medium');
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });

      const addExpenseDeclaration: FunctionDeclaration = {
        name: 'addExpense',
        description: 'إضافة مصروف جديد إلى حساب المستخدم',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'قيمة المصروف (رقم موجب)' },
            categoryId: { type: Type.STRING, description: 'معرف الفئة (ID). يجب اختياره من قائمة الفئات المتاحة.' },
            note: { type: Type.STRING, description: 'ملاحظة أو وصف للمصروف' },
            accountId: { type: Type.STRING, description: 'معرف الحساب (ID). يجب اختياره من قائمة الحسابات المتاحة.' },
            date: { type: Type.STRING, description: 'تاريخ المصروف بصيغة YYYY-MM-DD. استخدم تاريخ اليوم إذا لم يحدد المستخدم.' }
          },
          required: ['amount', 'categoryId', 'note', 'accountId', 'date']
        }
      };

      const addIncomeDeclaration: FunctionDeclaration = {
        name: 'addIncome',
        description: 'إضافة دخل جديد إلى حساب المستخدم',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'قيمة الدخل (رقم موجب)' },
            source: { type: Type.STRING, description: 'مصدر الدخل (مثال: راتب، مكافأة، إلخ)' },
            accountId: { type: Type.STRING, description: 'معرف الحساب (ID). يجب اختياره من قائمة الحسابات المتاحة.' },
            date: { type: Type.STRING, description: 'تاريخ الدخل بصيغة YYYY-MM-DD. استخدم تاريخ اليوم إذا لم يحدد المستخدم.' }
          },
          required: ['amount', 'source', 'accountId', 'date']
        }
      };

      const context = `
        أنت مساعد مالي ذكي وخبير في إدارة الميزانية الشخصية.
        العملة: ${currency}
        تاريخ اليوم: ${new Date().toISOString().split('T')[0]}
        
        بيانات المستخدم الحالية:
        - إجمالي الرصيد: ${accounts.reduce((sum, acc) => sum + acc.balance, 0)}
        - الحسابات المتاحة: ${JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance })))}
        - الفئات المتاحة: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
        - الميزانية الشهرية: ${budget?.amount || 'غير محددة'}
        
        لديك القدرة على استدعاء دوال (Tools) لإضافة مصاريف أو دخول نيابة عن المستخدم إذا طلب ذلك صراحة.
        إذا طلب المستخدم إضافة مصروف، استخدم أداة addExpense. وإذا طلب إضافة دخل، استخدم أداة addIncome.
        تأكد من استخدام معرفات الحسابات والفئات (IDs) الصحيحة من القوائم أعلاه.
        
        أجب باللغة العربية بأسلوب احترافي وودود.
      `;

      // Append user message to history
      chatHistoryRef.current.push({ role: 'user', parts: [{ text: userQuery }] });

      let response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          { role: 'user', parts: [{ text: context }] },
          { role: 'model', parts: [{ text: 'فهمت السياق والتعليمات. أنا مستعد للمساعدة.' }] },
          ...chatHistoryRef.current
        ],
        config: {
          tools: [{ functionDeclarations: [addExpenseDeclaration, addIncomeDeclaration] }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        }
      });

      let responseText = response.text || '';

      // Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        hapticFeedback('success');
        for (const call of response.functionCalls) {
          const args = call.args as any;
          if (call.name === 'addExpense') {
            addExpense({
              amount: Number(args.amount),
              categoryId: args.categoryId,
              note: args.note,
              accountId: args.accountId,
              date: args.date,
              paymentMethod: 'cash'
            });
            responseText += '\n\n✅ تم إضافة المصروف بنجاح إلى سجلاتك.';
          } else if (call.name === 'addIncome') {
            addIncome({
              amount: Number(args.amount),
              source: args.source,
              accountId: args.accountId,
              date: args.date
            });
            responseText += '\n\n✅ تم إضافة الدخل بنجاح إلى سجلاتك.';
          }
        }
        
        // Append model's function call to history
        chatHistoryRef.current.push({ role: 'model', parts: [{ functionCall: response.functionCalls[0] }] });
        // Append function response to history
        chatHistoryRef.current.push({ role: 'user', parts: [{ functionResponse: { name: response.functionCalls[0].name, response: { success: true } } }] });
      } else {
        // Append normal text response to history
        chatHistoryRef.current.push({ role: 'model', parts: [{ text: responseText }] });
      }

      setMessages(prev => [...prev, { role: 'assistant', content: responseText || 'تم تنفيذ العملية.' }]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى التأكد من صحة مفتاح API والمحاولة مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (apiKeyMissing) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <SettingsIcon className="size-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">مفتاح API مفقود</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          لتشغيل المساعد الذكي خارج منصة التطوير، يرجى إضافة مفتاح Gemini API الخاص بك في صفحة الإعدادات.
        </p>
        <Link 
          to="/settings" 
          className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-black hover:bg-primary-600 transition-colors w-full"
        >
          <SettingsIcon className="size-5" />
          الذهاب إلى الإعدادات
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
          <BrainCircuit className="size-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">المساعد <span className="text-primary-500">الذكي</span></h1>
          <p className="text-xs text-slate-500 font-medium">تحليل مالي متقدم وإدارة ذكية</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 size-8 md:size-10 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              }`}>
                {msg.role === 'user' ? <User className="size-4 md:size-5" /> : <Bot className="size-4 md:size-5" />}
              </div>
              
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-tl-none'
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-none'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="markdown-body text-sm leading-relaxed prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 md:gap-4">
              <div className="shrink-0 size-8 md:size-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <Bot className="size-4 md:size-5" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tr-none p-4 flex items-center gap-3">
                <Loader2 className="size-4 text-primary-500 animate-spin" />
                <span className="text-xs font-bold text-slate-500 animate-pulse">جاري التفكير والتحليل العميق...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700">
          <form onSubmit={handleAsk} className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اطلب إضافة مصروف، أو اسأل عن ميزانيتك..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl py-3 md:py-4 pr-4 pl-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="absolute left-2 p-2 md:p-2.5 bg-primary-500 text-white rounded-lg md:rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500 transition-colors"
            >
              <Send className="size-4 md:size-5 rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
