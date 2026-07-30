import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  X,
  DownloadCloud,
  UploadCloud,
  FileText,
} from "lucide-react";
import { hapticFeedback } from "../../utils";

interface BackupModalProps {
  showBackupModal: boolean;
  onClose: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  exportData: (format?: "json" | "csv") => void;
  exportToCSV: () => void;
  handleJsonImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  showBackupModal,
  onClose,
  fileInputRef,
  exportData,
  exportToCSV,
  handleJsonImport,
}) => {
  return (
    <AnimatePresence>
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-5 md:p-6 text-right z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Database className="size-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    إدارة البيانات والنسخ الاحتياطي
                  </h2>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">
                    قم بحفظ واستعادة مصاريفك وملفك المالي محلياً بأمان تام
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Info Box */}
            <div className="p-3.5 mb-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              يتم حفظ جميع عملياتك المالية محلياً على جهازك. ننصحك دائماً بأخذ نسخة احتياطية من ملفاتك بشكل دوري لتجنب فقدان البيانات عند مسح ذاكرة التخزين المؤقت للمتصفح.
            </div>

            {/* Action Cards */}
            <div className="space-y-3 mb-6">
              {/* Export JSON Card */}
              <button
                onClick={() => {
                  hapticFeedback("medium");
                  exportData("json");
                }}
                className="w-full flex items-start gap-4 p-4 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl text-right transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                  <DownloadCloud className="size-5" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                    <span>تصدير نسخة احتياطية كاملة (JSON)</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                      موصى به
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    قم بتحميل ملف JSON يحتوي على كافة المصاريف، الميزانيات، الفئات والحسابات لاسترجاعها لاحقاً.
                  </p>
                </div>
              </button>

              {/* Import JSON Card */}
              <button
                onClick={() => {
                  hapticFeedback("medium");
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-start gap-4 p-4 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl text-right transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <UploadCloud className="size-5" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    استيراد نسخة احتياطية (JSON)
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    قم برفع ملف JSON المحفوظ مسبقاً لاستبدال واستعادة كافة تفاصيل الدفتر المالي محلياً وسحابياً.
                  </p>
                </div>
              </button>

              {/* Export CSV Card */}
              <button
                onClick={() => {
                  hapticFeedback("medium");
                  exportToCSV();
                  onClose();
                }}
                className="w-full flex items-start gap-4 p-4 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl text-right transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    تصدير كملف Excel (CSV)
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    تصدير المعاملات المصفاة حالياً كجدول بيانات CSV ملائم للفتح ببرامج Excel أو Google Sheets.
                  </p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
              >
                إغلاق النافذة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
