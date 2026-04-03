import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, Settings as SettingsIcon, Trash2, Lightbulb } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Type, FunctionDeclaration } from '@google/genai';
import { useAppContext } from '../store/AppContext';
import { cn, hapticFeedback, getBudgetMonth } from '../utils';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Assistant() {
  const { accounts, expenses, budget, currency, categories, addExpense, addIncome, deleteExpense, deleteIncome, setBudget, updateAccount, addGoal, goals, firstDayOfMonth } = useAppContext();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك المالي الذكي. يمكنني تحليل مصاريفك، تقديم نصائح، أو حتى إضافة وحذف المصاريف والدخول وتعديل الميزانية نيابة عنك. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
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

  const saveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('gemini_api_key', customApiKey.trim());
      setApiKeyMissing(false);
      setShowSettings(false);
      toast.success('تم حفظ مفتاح API بنجاح');
    } else {
      localStorage.removeItem('gemini_api_key');
      setApiKeyMissing(!process.env.GEMINI_API_KEY);
      toast.error('تم مسح مفتاح API');
    }
  };

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

      const deleteExpenseDeclaration: FunctionDeclaration = {
        name: 'deleteExpense',
        description: 'حذف مصروف موجود من سجلات المستخدم',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'معرف المصروف (ID) المراد حذفه' }
          },
          required: ['id']
        }
      };

      const setBudgetDeclaration: FunctionDeclaration = {
        name: 'setBudget',
        description: 'تحديد أو تحديث الميزانية الشهرية الإجمالية',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'قيمة الميزانية الإجمالية' }
          },
          required: ['amount']
        }
      };

      const updateAccountDeclaration: FunctionDeclaration = {
        name: 'updateAccount',
        description: 'تحديث بيانات حساب مالي (مثل الرصيد أو الاسم)',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'معرف الحساب (ID)' },
            balance: { type: Type.NUMBER, description: 'الرصيد الجديد' },
            name: { type: Type.STRING, description: 'الاسم الجديد للحساب' }
          },
          required: ['id']
        }
      };

      const addGoalDeclaration: FunctionDeclaration = {
        name: 'addGoal',
        description: 'إضافة هدف ادخار جديد',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'اسم الهدف' },
            targetAmount: { type: Type.NUMBER, description: 'المبلغ المستهدف' },
            currentAmount: { type: Type.NUMBER, description: 'المبلغ الحالي المدخر' },
            deadline: { type: Type.STRING, description: 'تاريخ الاستحقاق (YYYY-MM-DD)' },
            linkedCategoryId: { type: Type.STRING, description: 'معرف الفئة المرتبطة (اختياري)' }
          },
          required: ['name', 'targetAmount', 'currentAmount', 'deadline']
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
        - الأهداف الحالية: ${JSON.stringify(goals.map(g => ({ id: g.id, name: g.name, target: g.targetAmount, current: g.currentAmount })))}
        - آخر 10 مصاريف: ${JSON.stringify(expenses.slice(0, 10).map(e => ({ id: e.id, amount: e.amount, note: e.note, date: e.date })))}
        
        لديك القدرة على استدعاء دوال (Tools) لإدارة البيانات نيابة عن المستخدم.
        أجب باللغة العربية بأسلوب احترافي وودود.
      `;

      // Append user message to history
      chatHistoryRef.current.push({ role: 'user', parts: [{ text: userQuery }] });

      let response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: context }] },
          { role: 'model', parts: [{ text: 'فهمت السياق والتعليمات. أنا مستعد للمساعدة.' }] },
          ...chatHistoryRef.current
        ],
        config: {
          tools: [{ functionDeclarations: [addExpenseDeclaration, addIncomeDeclaration, deleteExpenseDeclaration, setBudgetDeclaration, updateAccountDeclaration, addGoalDeclaration] }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
            responseText += '\n\n✅ تم إضافة المصروف بنجاح.';
          } else if (call.name === 'addIncome') {
            addIncome({
              amount: Number(args.amount),
              source: args.source,
              accountId: args.accountId,
              date: args.date
            });
            responseText += '\n\n✅ تم إضافة الدخل بنجاح.';
          } else if (call.name === 'deleteExpense') {
            deleteExpense(args.id);
            responseText += '\n\n✅ تم حذف المصروف بنجاح.';
          } else if (call.name === 'setBudget') {
            setBudget({ 
              amount: Number(args.amount), 
              month: getBudgetMonth(new Date(), firstDayOfMonth),
              categoryBudgets: budget?.categoryBudgets || {} 
            });
            responseText += '\n\n✅ تم تحديث الميزانية بنجاح.';
          } else if (call.name === 'updateAccount') {
            updateAccount(args.id, { balance: args.balance, name: args.name });
            responseText += '\n\n✅ تم تحديث بيانات الحساب بنجاح.';
          } else if (call.name === 'addGoal') {
            addGoal({
              name: args.name,
              targetAmount: Number(args.targetAmount),
              currentAmount: Number(args.currentAmount),
              deadline: args.deadline,
              linkedCategoryId: args.linkedCategoryId
            });
            responseText += '\n\n✅ تم إضافة هدف الادخار بنجاح.';
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
    } catch (error: any) {
      console.error('Error calling Gemini:', error);
      let errorMessage = 'عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى التأكد من صحة مفتاح API والمحاولة مرة أخرى.';
      
      if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'لقد تجاوزت الحد المسموح به من الاستخدام المجاني للمساعد الذكي حالياً. يرجى المحاولة لاحقاً أو غداً.';
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (apiKeyMissing) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md text-center">
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
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
            <Sparkles className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">المساعد <span className="text-primary-500">الذكي</span></h1>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-tighter">مجاني</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">تحليل مالي متقدم وإدارة ذكية</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
        >
          <SettingsIcon className="size-5" />
        </button>
      </div>

      {showSettings && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">إعدادات API</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            إذا واجهت مشاكل في "حد الاستخدام"، يمكنك إضافة مفتاح API الخاص بك من Google AI Studio.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="أدخل مفتاح API الخاص بك..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              dir="ltr"
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-black hover:bg-primary-600 transition-colors"
            >
              حفظ
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-sm overflow-hidden relative">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">المستشار الذكي</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">متصل الآن</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setMessages([{ role: 'assistant', content: 'مرحباً! أنا مساعدك المالي الذكي. كيف يمكنني مساعدتك اليوم؟' }]);
              chatHistoryRef.current = [];
              hapticFeedback('warning');
            }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-90"
            title="مسح المحادثة"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
          {messages.length <= 1 && messages[0].role === 'assistant' && messages[0].content.includes('مرحباً') ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="w-32 h-32 md:w-48 md:h-48 bg-primary-500/5 dark:bg-primary-500/10 rounded-3xl flex items-center justify-center text-primary-500/20">
                  <Sparkles size={64} className="md:size-96 absolute opacity-10" />
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex items-center justify-center text-primary-500">
                    <Sparkles size={32} className="md:size-48" />
                  </div>
                </div>
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
                >
                  <Lightbulb size={24} />
                </motion.div>
              </motion.div>
              
              <div className="space-y-3 max-w-sm">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">كيف يمكنني مساعدتك؟</h3>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  أنا مستشارك المالي الذكي. يمكنني تحليل مصاريفك، تقديم نصائح للادخار، أو الإجابة على أي استفسار مالي.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                {[
                  "حلل نمط إنفاقي لهذا الشهر",
                  "كيف يمكنني توفير 500 ريال إضافية؟",
                  "هل ميزانيتي في وضع آمن؟",
                  "اقترح خطة لسداد ديوني"
                ].map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setQuery(suggestion);
                      // Trigger handleAsk manually or via useEffect
                    }}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-right text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-primary-500/50 hover:shadow-md transition-all shadow-sm"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] md:max-w-[75%] p-4 md:p-6 rounded-2xl shadow-sm relative group",
                    msg.role === 'user' 
                      ? "bg-primary-600 text-white rounded-tr-none shadow-primary-500/20" 
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                    )}
                    <div className={cn(
                      "text-[8px] font-black uppercase tracking-widest mt-3 opacity-50",
                      msg.role === 'user' ? "text-primary-100 text-left" : "text-slate-400 text-right"
                    )}>
                      {msg.role === 'user' ? 'أنت' : 'المستشار الذكي'}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <motion.span 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-primary-500"
                      />
                      <motion.span 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 rounded-full bg-primary-500"
                      />
                      <motion.span 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 rounded-full bg-primary-500"
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">جاري التحليل...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/50">
          <form 
            onSubmit={handleAsk}
            className="relative max-w-4xl mx-auto group"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اسأل عن أي شيء يخص ميزانيتك..."
              className="w-full pl-16 pr-6 py-4 md:pl-20 md:pr-8 md:py-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white text-sm md:text-base outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-bold"
              disabled={isLoading}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!query.trim() || isLoading}
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none transition-all hover:bg-primary-700 active:scale-90"
            >
              <Send size={20} className="md:size-24 rotate-180" />
            </motion.button>
          </form>
          <p className="text-center text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
            قد يخطئ الذكاء الاصطناعي أحياناً، يرجى مراجعة النصائح المالية الهامة.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
