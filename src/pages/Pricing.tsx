import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, Check, ShieldCheck, Zap, Sparkles, Key, 
  Smartphone, Building, Globe, ArrowRight, Star, HelpCircle,
  Lock, CheckCircle2, Gift, ChevronLeft, Award, Ticket
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency } from '../utils';
import toast from 'react-hot-toast';

export default function PricingPage() {
  const { currency, isLicensed, licensePlan, activationCode: currentActivationCode, activateLicense } = useAppContext();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [activePlanObj, setActivePlanObj] = useState<{ name: string; price: number; id: string } | null>(null);
  const [inputActivationCode, setInputActivationCode] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'الباقة المجانية',
      tagline: 'للاستخدام الشخصي الأساسي وتتبع النفقات اليومية',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        'تسجيل النفقات والدخل اليومي',
        'ميزانية شهرية أساسية',
        'حسابات الكاش والبنك',
        'المزامنة السحابية المحلية',
        'دعم عبر المجتمع'
      ],
      badge: 'مجاني دائماً',
      isPopular: false,
      buttonText: 'الخطة الحالية',
      color: 'from-slate-500 to-slate-700'
    },
    {
      id: 'pro',
      name: 'الباقة الاحترافية (Pro)',
      tagline: 'للأفراد الباحثين عن ذكاء مالي متقدم وتحليلات عميقة',
      priceMonthly: 19,
      priceYearly: 150,
      features: [
        'كل ميزات الباقة المجانية',
        'مؤشر الصحة المالية الشامل (100 نقطة)',
        'توقعات استنزاف الميزانية والإنذار المبكر',
        'إدارة الالتزامات والاشتراكات الدورية مع زر الدفع السريع',
        'تحليلات الوتيرة اليومية ومعدل الحرق المالي',
        'توصيات توفير ذكية ومخصصة',
        'دعم فني أولوي'
      ],
      badge: 'الأكثر طلباً ⭐',
      isPopular: true,
      buttonText: 'تفعيل باقة Pro',
      color: 'from-emerald-600 to-teal-500'
    },
    {
      id: 'family',
      name: 'باقة الأسرة والشركاء',
      tagline: 'للعائلات والفرق الصغيرة لإدارة مالية جماعية متكاملة',
      priceMonthly: 39,
      priceYearly: 320,
      features: [
        'كل ميزات الباقة الاحترافية (Pro)',
        'إدارة أفراد العائلة والمصاريف المشتركة',
        'الجمعيات التعاونية (الجماعة / الديون)',
        'تقارير عائلية تفصيلية ومقارنة شهرية',
        'مزامنة سحابية فورية متعددة الأجهزة',
        'استشارات وتوجيه مالي غير محدود',
        'تصدير التقارير بصيغة PDF و Excel'
      ],
      badge: 'شامل ومميز 👑',
      isPopular: false,
      buttonText: 'تفعيل باقة الأسرة',
      color: 'from-indigo-600 to-purple-600'
    }
  ];

  const enterpriseOption = {
    title: 'ترخيص العلامة التجارية (White-Label / SaaS License)',
    description: 'هل أنت رائد أعمال أو شركة تود بيع هذا التطبيق باسمك وشعارك الخاص لعملائك؟ نوفر لك الترخيص التجاري الكامل مع الكود المصدر، التخصيص الكامل والدعم التقني المستمر.',
    price: 'اتصل بنا للاستفسار',
    features: [
      'امتلاك كامل لحقوق التشغيل تحت علامتك التجارية',
      'تخصيص الواجهات، الشعار والألوان بالكامل',
      'لوحة تحكم للإدارة المركزية للعملاء والمشتركين',
      'تحديثات مستمرة ودعم هندسي مباشر'
    ]
  };

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.id === 'free') {
      toast.success('أنت بالفعل تستخدم الباقة المجانية الأساسية');
      return;
    }
    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
    setActivePlanObj({ name: plan.name, price, id: plan.id });
    setIsActivateModalOpen(true);
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputActivationCode.trim()) {
      toast.error('الرجاء إدخال كود التفعيل');
      return;
    }

    setIsSubmittingCode(true);
    const success = await activateLicense(inputActivationCode);
    setIsSubmittingCode(false);

    if (success) {
      setIsActivateModalOpen(false);
      setInputActivationCode('');
    }
  };

  return (
    <div className="space-y-10 md:space-y-14 max-w-6xl mx-auto pb-24 font-tajawal text-right" dir="rtl">
      {/* Hero Section */}
      <div className="text-center space-y-4 pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>نظام التفعيل بكود حقيقي (دفع واقعي وتفعيل فوري)</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          خطط الأسعار والباقات التجاريّة
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          اشتري الترخيص بالطريقة التي تفضلها في الواقع (نقداً، تحويل بنكي، أو وسائل دفع محلية)، وسنمنحك <span className="text-emerald-600 dark:text-emerald-400 font-bold">كود تفعيل خاص</span> تفتحه هنا لتتمتع بالنسخة الكاملة فوراً.
        </p>

        {/* Current License Status Banner if licensed */}
        {isLicensed && (
          <div className="max-w-md mx-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-100">حالتك الحالية</h4>
                <p className="text-sm font-black">
                  {licensePlan === 'family' ? 'باقة الأسرة والشركاء مفعلة 👑' : licensePlan === 'enterprise' ? 'رخصة العلامة التجارية مفعلة' : 'الباقة الاحترافية Pro مفعلة ⭐'}
                </p>
              </div>
            </div>
            {currentActivationCode && (
              <span className="text-[11px] font-mono bg-black/30 px-2.5 py-1 rounded-lg text-emerald-300">
                {currentActivationCode}
              </span>
            )}
          </div>
        )}

        {/* Real-life purchase instructions */}
        <div className="max-w-3xl mx-auto bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-right space-y-3">
          <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-600" />
            <span>كيف تحصل على كود التفعيل؟</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
              <span className="font-black text-emerald-600">1. الدفع في الواقع</span>
              <p>قم بالدفع بالطريقة المناسبة لك (نقداً للموزع المعتمد أو عبر التحويل البنكي).</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
              <span className="font-black text-emerald-600">2. استلام الكود</span>
              <p>تواصل معنا عبر واتساب أو الهاتف لتستلم كود التفعيل الخاص بك (مثال: PRO-2026-XXXX).</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
              <span className="font-black text-emerald-600">3. إدخال الكود</span>
              <p>اضغط على زر التفعيل لأي باقة وأدخل الكود ليتم ترقية حسابك فوراً ودون انتظار.</p>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={cn("text-xs font-bold", billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400')}>
            فوترة شهرية
          </span>
          <button
            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-8 rounded-full bg-slate-200 dark:bg-slate-800 p-1 transition-colors relative"
          >
            <div className={cn(
              "w-6 h-6 rounded-full bg-emerald-600 shadow-md transition-transform",
              billingCycle === 'yearly' ? 'translate-x-0' : '-translate-x-6'
            )} />
          </button>
          <span className={cn("text-xs font-bold flex items-center gap-1.5", billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-400')}>
            فوترة سنوية <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-md font-black">وفر 25%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
        {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              className={cn(
                "relative bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border flex flex-col justify-between shadow-sm transition-all",
                plan.isPopular 
                  ? 'border-emerald-500 shadow-emerald-500/10 ring-2 ring-emerald-500/20' 
                  : 'border-slate-200 dark:border-slate-800'
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[11px] font-black px-4 py-1 rounded-full shadow-md">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  {!plan.isPopular && (
                    <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">{plan.tagline}</p>
                </div>

                <div className="flex items-baseline gap-1 py-2 border-y border-slate-100 dark:border-slate-800">
                  <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-mono">
                    {price === 0 ? 'مجاناً' : formatCurrency(price, currency)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {price > 0 ? (billingCycle === 'monthly' ? '/ شهرياً' : '/ سنوياً') : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">ما تحصله في هذه الباقة:</span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={cn(
                    "w-full py-3.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2",
                    plan.id === 'free'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      : plan.isPopular
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:opacity-95 shadow-emerald-500/20'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-95'
                  )}
                >
                  <Key className="w-4 h-4" />
                  <span>{plan.id === 'free' ? plan.buttonText : 'أدخل كود التفعيل'}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enterprise / White-Label Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-3xl p-8 md:p-10 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black">
              <Building className="w-4 h-4" />
              <span>ترخيص الشركات وإعادة البيع (White-Label)</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight">{enterpriseOption.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {enterpriseOption.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {enterpriseOption.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center space-y-4">
            <span className="text-xs font-bold text-indigo-200">تواصل معنا للتعاقد</span>
            <div className="text-xl font-black text-white font-mono">{enterpriseOption.price}</div>
            <a
              href="mailto:contact@masarifi.app"
              className="block w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-colors shadow-lg"
            >
              اطلب عرض سعر تجاري
            </a>
          </div>
        </div>
      </div>

      {/* Activation Code Modal */}
      <AnimatePresence>
        {isActivateModalOpen && activePlanObj && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-600" />
                    <span>إدخال كود التفعيل</span>
                  </h3>
                  <p className="text-xs text-slate-500">أدخل كود التفعيل الخاص بـ {activePlanObj.name}</p>
                </div>
                <button
                  onClick={() => setIsActivateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleActivateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">كود التفعيل (Activation Code)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="مثال: PRO-2026-HASSAN أو FAMILY-9988"
                      value={inputActivationCode}
                      onChange={(e) => setInputActivationCode(e.target.value)}
                      className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                      required
                    />
                    <Ticket className="w-5 h-5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    يمكنك الحصول على كود التفعيل فوراً بعد إتمام الدفع نقداً أو بالتحويل البنكي مع خدمة العملاء.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsActivateModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCode}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-black text-xs shadow-md hover:opacity-95 flex items-center justify-center gap-2"
                  >
                    {isSubmittingCode ? (
                      <span>جاري التحقق...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تفعيل فوري</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
