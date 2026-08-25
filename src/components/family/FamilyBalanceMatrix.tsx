import React from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, Shield, Lightbulb, AlertTriangle, 
  CheckCircle2, TrendingDown, Sparkles, Zap, HeartHandshake
} from 'lucide-react';
import { formatCurrency, cn } from '../../utils';

interface FamilyBalanceMatrixProps {
  needsAmount: number;
  wantsAmount: number;
  savingsAmount: number;
  totalIncome: number;
  currency: string;
}

export const FamilyBalanceMatrix: React.FC<FamilyBalanceMatrixProps> = ({
  needsAmount,
  wantsAmount,
  savingsAmount,
  totalIncome,
  currency,
}) => {
  const totalLivingSpend = needsAmount + wantsAmount;
  const baseIncome = totalIncome > 0 ? totalIncome : (totalLivingSpend + savingsAmount) || 1000;

  const needsRatio = (needsAmount / baseIncome) * 100;
  const wantsRatio = (wantsAmount / baseIncome) * 100;
  const savingsRatio = (savingsAmount / baseIncome) * 100;

  const matrix = [
    {
      id: 'needs',
      title: 'الاحتياجات الأساسية والمعيشة',
      rule: '50%',
      idealRatio: 50,
      actualAmount: needsAmount,
      actualRatio: needsRatio,
      color: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
      desc: 'المؤونة، قفة السوق، الستاغ/الصوناد، الكراء، لوازم الرضيع، التداوي.',
      status: needsRatio <= 55 ? 'ممتاز' : needsRatio <= 65 ? 'مقبول' : 'مرتفع',
    },
    {
      id: 'wants',
      title: 'جودة الحياة والرفاهية الأسرية',
      rule: '30%',
      idealRatio: 30,
      actualAmount: wantsAmount,
      actualRatio: wantsRatio,
      color: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      desc: 'الفسحات، المطاعم، الزيارات، الألعاب والهدايا، الاشتراكات.',
      status: wantsRatio <= 30 ? 'ممتاز' : wantsRatio <= 40 ? 'مقبول' : 'مرتفع',
    },
    {
      id: 'savings',
      title: 'حصالة الطوارئ ومستقبل الأبناء',
      rule: '20%',
      idealRatio: 20,
      actualAmount: savingsAmount,
      actualRatio: savingsRatio,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      desc: 'صندوق طوارئ العائلة، تأمين صحة الرضيع، المناسبات.',
      status: savingsRatio >= 20 ? 'ممتاز' : savingsRatio >= 10 ? 'جيد' : 'يحتاج تعزيز',
    },
  ];

  // Smart Family Insights
  const insights = [
    {
      title: 'صندوق طوارئ الأسرة والأبناء',
      desc: savingsRatio >= 15 
        ? 'ما شاء الله! وعاؤكم الادخاري متماسك ويؤمن للأسرة شبكة أمان كافية لمواجهة أي مصاريف غير متوقعة.'
        : 'نوصي بتخصيص 10% إلى 15% على الأقل من الدخل لبناء صمام أمان معيشي يغطي 3 أشهر على الأقل.',
      icon: Shield,
      type: savingsRatio >= 15 ? 'success' : 'warning',
    },
    {
      title: 'ترشيد قفة التموين الأسبوعية',
      desc: 'الشراء بالكميات للأغذية الأساسية (السميد، الفارينة، الزيت، الحليب) يوفر قرابة 12% شهرياً مقارنة بالشراء اليومي المتفرق.',
      icon: Lightbulb,
      type: 'info',
    },
    {
      title: 'فواتير الطاقة والمرافق (STEG/SONEDE)',
      desc: 'تثبيت استهلاك المكيفات وسخانات الماء في الفترات غير الذروية يحمي الأسرة من الانتقال للشريحة الأغلى سعراً.',
      icon: Zap,
      type: 'info',
    },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart size={18} className="text-indigo-500" />
            <span>مصفوفة التوازن المعيشي (قاعدة 50/30/20 الأسرية)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            النسبة الذهبية لتوزيع دخل الأسرة بين الأساسيات، جودة الحياة، وبناء الأمان المستقبلي
          </p>
        </div>
      </div>

      {/* 3 Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matrix.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full shrink-0", item.color)} />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.title}</h4>
              </div>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md font-mono", item.badgeBg)}>
                المقترح {item.rule}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              {item.desc}
            </p>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">المصروف الفعلي:</span>
                <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">
                  {formatCurrency(item.actualAmount, currency)}
                </span>
              </div>
              <div className="text-left">
                <span className="text-[9px] text-slate-400 font-bold block">النسبة من الدخل:</span>
                <span className={cn("text-xs font-black font-mono", item.textColor)}>
                  {Math.round(item.actualRatio)}%
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (item.actualRatio / item.idealRatio) * 100)}%` }}
                className={cn("h-full rounded-full", item.color)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Actionable Insights */}
      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/40 bg-gradient-to-br from-indigo-50/30 via-white to-teal-50/20 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60 p-4 md:p-5 space-y-3 shadow-2xs">
        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span>توصيات ذكية لتحسين الاستقرار المالي للأسرة</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((ins, idx) => {
            const Icon = ins.icon;
            return (
              <div
                key={idx}
                className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon size={13} />
                  </div>
                  <h5 className="text-[11px] font-black text-slate-800 dark:text-white">{ins.title}</h5>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {ins.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FamilyBalanceMatrix;
