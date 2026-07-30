import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CircleAlert } from "lucide-react";
import { cn, formatCurrency } from "../../utils";

interface DeleteConfirmModalProps {
  showDeleteConfirm: { id: string; type: "expense" | "income" } | null;
  transactionToDelete: any | null;
  categories: any[];
  currency: string;
  onClose: () => void;
  onDelete: (id: string, type: "expense" | "income") => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  showDeleteConfirm,
  transactionToDelete,
  categories,
  currency,
  onClose,
  onDelete,
}) => {
  return (
    <AnimatePresence>
      {showDeleteConfirm && transactionToDelete && (
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
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-white/20 dark:border-slate-800 p-5 md:p-6 overflow-hidden text-center"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-5 md:mb-6">
              <CircleAlert size={40} />
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
              تأكيد الحذف
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mb-6 md:mb-8">
              {(transactionToDelete as any).isTransfer
                ? "هل أنت متأكد من رغبتك في حذف هذا التحويل؟ سيتم حذف كل من عملية الخصم والإيداع المرتبطة به. لا يمكن التراجع عن هذا الإجراء."
                : "هل أنت متأكد من رغبتك في حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء."}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl md:rounded-2xl mb-6 md:mb-8 flex items-center justify-between border border-slate-100 dark:border-slate-700">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  العملية
                </p>
                <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  {(transactionToDelete as any).isTransfer
                    ? showDeleteConfirm.type === "expense"
                      ? (transactionToDelete as any).note
                      : (transactionToDelete as any).source
                    : showDeleteConfirm.type === "expense"
                      ? (transactionToDelete as any).note ||
                        categories.find(
                          (c) =>
                            c.id ===
                            (transactionToDelete as any).categoryId,
                        )?.name
                      : (transactionToDelete as any).source}
                </p>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-left mb-1">
                  المبلغ
                </p>
                <p
                  className={cn(
                    "text-sm md:text-base font-black",
                    (transactionToDelete as any).isTransfer
                      ? "text-indigo-500"
                      : showDeleteConfirm.type === "expense"
                        ? "text-rose-500"
                        : "text-emerald-500",
                  )}
                >
                  {formatCurrency(transactionToDelete.amount, currency)}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 md:gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  onDelete(showDeleteConfirm.id, showDeleteConfirm.type)
                }
                className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20 transition-all"
              >
                حذف نهائي
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
