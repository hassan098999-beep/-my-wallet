import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Search } from "lucide-react";
import { TransactionItem } from "../TransactionItem";
import EmptyState from "../ui/EmptyState";
import { PaymentMethod } from "../../types";

interface TransactionsListProps {
  filteredTransactions: any[];
  visibleTransactions: any[];
  categories: any[];
  accounts: any[];
  currency: string;
  hasMore: boolean;
  loadMore: () => void;
  onEdit: (transaction: any) => void;
  onDeleteConfirm: (id: string, type: "expense" | "income") => void;
  onDuplicate: (transaction: any) => void;
  getPaymentIcon: (method: PaymentMethod) => React.ReactNode;
  getPaymentLabel: (method: PaymentMethod) => string;
  onResetFilters: () => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  filteredTransactions,
  visibleTransactions,
  categories,
  accounts,
  currency,
  hasMore,
  loadMore,
  onEdit,
  onDeleteConfirm,
  onDuplicate,
  getPaymentIcon,
  getPaymentLabel,
  onResetFilters,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="card p-0 overflow-hidden"
    >
      <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <FileText className="size-5 md:size-6" />
          </div>
          <h2 className="text-[--text-h2] font-semibold text-slate-900 dark:text-white">
            قائمة العمليات
          </h2>
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          <AnimatePresence>
            {visibleTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                categories={categories}
                accounts={accounts}
                currency={currency}
                index={index}
                onEdit={onEdit}
                onDelete={(id, type) => onDeleteConfirm(id, type)}
                onDuplicate={onDuplicate}
                getPaymentIcon={getPaymentIcon}
                getPaymentLabel={getPaymentLabel}
              />
            ))}
          </AnimatePresence>

          {hasMore && (
            <div className="p-8 text-center">
              <button
                onClick={loadMore}
                className="btn-secondary px-10 py-4 rounded-2xl text-sm font-semibold"
              >
                تحميل المزيد
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20">
          <EmptyState
            icon={Search}
            title="لا توجد نتائج مطابقة"
            description="لم نجد أي عمليات تطابق معايير البحث أو فلاتر التصفية الحالية. جرّب تعديل الفلاتر أو إعادة تعيينها بالكامل لتظهر العمليات مجدداً."
            actionLabel="إعادة تعيين كافة الفلاتر"
            onAction={onResetFilters}
          />
        </div>
      )}
    </motion.div>
  );
};
