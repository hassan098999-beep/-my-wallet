import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';

export default function ShareAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIsAddModalOpen } = useAppContext();

  useEffect(() => {
    const text = searchParams.get('text') || searchParams.get('title') || searchParams.get('url') || '';
    
    if (text) {
      // Clean up text and parse amount
      // Replace commas with dots then match digits (allowing decimals like 120.5 or 45)
      const cleanText = text.replace(/,/g, '.');
      const numberMatch = cleanText.match(/\d+(?:\.\d+)?/);
      const parsedAmount = numberMatch ? parseFloat(numberMatch[0]) : 0;
      
      // Save to localStorage so AddExpenseModal can read it when it opens
      localStorage.setItem('masarifi_shared_intent', JSON.stringify({
        amount: parsedAmount > 0 ? parsedAmount : '',
        note: text.trim()
      }));
    }

    // Set AddModalOpen and navigate to dashboard with ?action=add
    setIsAddModalOpen(true);
    navigate('/?action=add', { replace: true });
  }, [searchParams, navigate, setIsAddModalOpen]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <h3 className="text-lg font-black text-slate-800 dark:text-white">جاري معالجة البيانات المشاركة...</h3>
      <p className="text-xs text-slate-500">قمنا باستخلاص تفاصيل العملية وتوجيه الميزانية بنجاح.</p>
    </div>
  );
}
