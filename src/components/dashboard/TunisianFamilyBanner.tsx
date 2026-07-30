import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../../utils';

interface TunisianFamilyBannerProps {
  hasTunisianFamilyCategories: boolean;
  applyTunisianFamilyTemplate: () => Promise<void>;
}

export const TunisianFamilyBanner: React.FC<TunisianFamilyBannerProps> = ({
  hasTunisianFamilyCategories,
  applyTunisianFamilyTemplate,
}) => {
  if (hasTunisianFamilyCategories) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-cyan-600 via-emerald-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 shadow-md border border-white/10 relative overflow-hidden text-right"
    >
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🇹🇳</span>
            <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
              ميزة عائلية جديدة
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold leading-snug">
            تفعيل قالب ميزانية العائلة التونسية (أب، أم، ورضيع)
          </h3>
          <p className="text-xs md:text-sm text-white/90 max-w-2xl font-semibold leading-relaxed">
            لقد دخلت بنجاح في النسخة العائلية! اضغط هنا لتحديث جميع تصنيفاتك تلقائياً لتشمل: قفة العبار، كوش وحليب البيبي، طبيب الأطفال، وفواتير السكن (STEG/SONEDE) مع موازنة متكاملة بالمليمات التونسية.
          </p>
        </div>
        <button
          onClick={async () => {
            hapticFeedback('heavy');
            const loadingToast = toast.loading('جاري تطبيق القالب...');
            await applyTunisianFamilyTemplate();
            toast.dismiss(loadingToast);
          }}
          className="self-start md:self-auto bg-white text-emerald-600 hover:bg-neutral-100 font-extrabold text-xs md:text-sm px-6 py-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Sparkles size={16} />
          تحديث التصنيفات والميزانية الآن
        </button>
      </div>
    </motion.div>
  );
};
