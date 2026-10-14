import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Key, Plus, Trash2, CheckCircle2, XCircle, 
  Copy, RefreshCw, Sparkles, Lock, UserCheck, Database, ArrowRight
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { cn } from '../utils';

interface ActivationCodeRecord {
  id: string;
  code: string;
  plan: 'pro' | 'family' | 'enterprise';
  isActive: boolean;
  isUsed: boolean;
  usedBy?: string;
  createdAt?: any;
}

export default function AdminDashboard() {
  const [codes, setCodes] = useState<ActivationCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [planType, setPlanType] = useState<'pro' | 'family' | 'enterprise'>('pro');
  const [customPrefix, setCustomPrefix] = useState('');

  // Fetch codes from Firestore
  const fetchCodes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'activation_codes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: ActivationCodeRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ActivationCodeRecord);
      });
      setCodes(list);
    } catch (error) {
      console.error('Failed to fetch activation codes:', error);
      // Fallback to local storage if offline or permissions error
      const local = localStorage.getItem('masarifi_admin_codes');
      if (local) {
        setCodes(JSON.parse(local));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Generate random code
  const handleGenerateCode = async () => {
    setGenerating(true);
    const prefix = customPrefix.trim() ? customPrefix.trim().toUpperCase() : planType === 'family' ? 'FAM' : planType === 'enterprise' ? 'ENT' : 'PRO';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${prefix}-${randomNum}-${randomSuffix}`;

    const newRecord = {
      code: newCode,
      plan: planType,
      isActive: true,
      isUsed: false,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'activation_codes'), {
        ...newRecord,
        serverTime: serverTimestamp()
      });
      const item: ActivationCodeRecord = { id: docRef.id, ...newRecord };
      setCodes(prev => [item, ...prev]);
      
      // Also update local fallback
      localStorage.setItem('masarifi_admin_codes', JSON.stringify([item, ...codes]));
      
      toast.success(`تم توليد الكود بنجاح: ${newCode}`);
    } catch (error) {
      console.error('Failed to save code to Firestore:', error);
      // Save locally if Firestore fails
      const fallbackItem: ActivationCodeRecord = { id: Date.now().toString(), ...newRecord };
      const updated = [fallbackItem, ...codes];
      setCodes(updated);
      localStorage.setItem('masarifi_admin_codes', JSON.stringify(updated));
      toast.success(`تم توليد الكود محلياً: ${newCode}`);
    } finally {
      setGenerating(false);
      setCustomPrefix('');
    }
  };

  // Toggle active state
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'activation_codes', id), { isActive: !currentStatus });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
      toast.success(currentStatus ? 'تم إلغاء تفعيل الكود' : 'تم تفعيل الكود بنجاح');
    } catch (error) {
      console.error('Failed to update code status:', error);
      setCodes(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
      toast.success('تم تحديث حالة الكود محلياً');
    }
  };

  // Delete code
  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكود نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'activation_codes', id));
      setCodes(prev => prev.filter(c => c.id !== id));
      toast.success('تم حذف الكود بنجاح');
    } catch (error) {
      console.error('Failed to delete code:', error);
      setCodes(prev => prev.filter(c => c.id !== id));
      toast.success('تم حذف الكود محلياً');
    }
  };

  // Copy to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`تم نسخ الكود: ${code}`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 font-tajawal text-right" dir="rtl">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-black border border-red-500/30">
            <ShieldAlert className="w-4 h-4" />
            <span>لوحة التحكم الإدارية (Admin Master Panel)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">إدارة أكواد التفعيل والاشتراكات</h1>
          <p className="text-xs text-slate-300">
            توليد وإدارة أكواد التفعيل للعملاء والمشتركين مع التحكم الكامل بالحالة والصلاحيات.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/pricing"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <span>صفحة الباقات</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
          <button
            onClick={fetchCodes}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Code Generation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <span>توليد كود تفعيل جديد</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع الباقة المستهدفة</label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="pro">الباقة الاحترافية (Pro)</option>
              <option value="family">باقة الأسرة والشركاء (Family)</option>
              <option value="enterprise">رخصة العلامة التجارية (Enterprise)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">بادئة مخصصة (اختياري)</label>
            <input
              type="text"
              placeholder="مثال:VIP, HASSAN, SUMMER"
              value={customPrefix}
              onChange={(e) => setCustomPrefix(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none uppercase"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateCode}
              disabled={generating}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{generating ? 'جاري التوليد...' : 'توليد وحفظ في Firebase'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Codes Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>قائمة الأكواد المُولدة ({codes.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">مزامنة تلقائية مع Firestore</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل الأكواد من قاعدة البيانات...</div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">لا توجد أكواد مُولدة بعد. ابدأ بتوليد أول كود تفعيل أعلاه.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400">
                  <th className="py-3 px-4">كود التفعيل</th>
                  <th className="py-3 px-4">الباقة</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">تاريخ الإنشاء</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {codes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.code}</span>
                      <button
                        onClick={() => handleCopyCode(item.code)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        title="نسخ الكود"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px]",
                        item.plan === 'family' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                        item.plan === 'enterprise' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      )}>
                        {item.plan === 'family' ? 'باقة الأسرة' : item.plan === 'enterprise' ? 'العلامة التجارية' : 'Pro احترافية'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>فعال</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>معطل</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-TN') : 'حديث'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleActive(item.id, item.isActive)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors",
                            item.isActive 
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300' 
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                          )}
                        >
                          {item.isActive ? 'إلغاء تفعيل' : 'تفعيل'}
                        </button>
                        <button
                          onClick={() => handleDeleteCode(item.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                          title="حذف الكود"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
