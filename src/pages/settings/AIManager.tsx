import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AIManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsSaved(true);
      toast.success('تم حفظ مفتاح API بنجاح');
    } else {
      localStorage.removeItem('gemini_api_key');
      setIsSaved(false);
      toast.success('تم إزالة مفتاح API');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
            <Key className="size-5 md:size-6" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white">إعدادات المساعد الذكي</h2>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
              أدخل مفتاح Gemini API الخاص بك لتفعيل المساعد الذكي عند استخدام التطبيق خارج منصة التطوير.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              مفتاح Gemini API
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsSaved(false);
              }}
              placeholder="AIzaSy..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-white"
              dir="ltr"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-primary-500 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
            >
              {isSaved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
              {isSaved ? 'تم الحفظ' : 'حفظ المفتاح'}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
          <h3 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2">كيف أحصل على مفتاح API؟</h3>
          <ol className="text-[10px] md:text-xs text-blue-700 dark:text-blue-400 space-y-2 list-decimal list-inside">
            <li>اذهب إلى موقع <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a></li>
            <li>قم بتسجيل الدخول بحساب Google الخاص بك</li>
            <li>اضغط على "Create API key"</li>
            <li>انسخ المفتاح والصقه في الحقل أعلاه</li>
          </ol>
          <p className="text-[10px] text-blue-600 dark:text-blue-500 mt-3 font-medium">
            ملاحظة: يتم حفظ المفتاح محلياً في متصفحك فقط ولا يتم إرساله لأي جهة خارجية سوى خوادم Google لتشغيل الذكاء الاصطناعي.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIManager;
