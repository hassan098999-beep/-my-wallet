import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, BrainCircuit, Loader2 } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { useAppContext } from '../store/AppContext';
import ReactMarkdown from 'react-markdown';

export default function Assistant() {
  const { accounts, expenses, budget, currency } = useAppContext();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string, isThinking?: boolean}[]>([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك المالي الذكي. يمكنني تحليل مصاريفك، تقديم نصائح لتوفير المال، أو الإجابة على أي أسئلة مالية معقدة. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userQuery = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('مفتاح API غير متوفر');
      }

      const ai = new GoogleGenAI({ apiKey });

      // Build context from user data
      const context = `
        أنت مساعد مالي ذكي وخبير في إدارة الميزانية الشخصية.
        العملة: ${currency}
        
        بيانات المستخدم الحالية:
        - إجمالي الرصيد: ${accounts.reduce((sum, acc) => sum + acc.balance, 0)}
        - عدد المعاملات: ${expenses.length}
        - الميزانية الشهرية: ${budget?.amount || 'غير محددة'}
        
        المعاملات الأخيرة (آخر 10):
        ${JSON.stringify(expenses.slice(0, 10))}
        
        أجب باللغة العربية بأسلوب احترافي وودود. قدم نصائح عملية ومخصصة بناءً على بيانات المستخدم.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `السياق:\n${context}\n\nسؤال المستخدم: ${userQuery}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'عذراً، لم أتمكن من توليد إجابة.' }]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى لاحقاً.' }]);
    } finally {
      setIsLoading(false);
    }
  };

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
          <p className="text-xs text-slate-500 font-medium">تحليل مالي متقدم ونصائح مخصصة</p>
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
              placeholder="اسأل عن مصاريفك، ميزانيتك، أو اطلب نصيحة مالية..."
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
