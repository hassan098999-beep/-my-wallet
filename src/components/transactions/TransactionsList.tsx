import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Search, Calendar, CheckSquare } from "lucide-react";
import { parseISO, format, isToday, isYesterday } from "date-fns";
import { ar } from "date-fns/locale";
import { TransactionItem } from "../TransactionItem";
import EmptyState from "../ui/EmptyState";
import { PaymentMethod } from "../../types";
import { formatCurrency, cn, hapticFeedback } from "../../utils";

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
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  selectedKeys?: Set<string>;
  onToggleSelectTransaction?: (transaction: any) => void;
  onSelectAllVisible?: () => void;
}

interface GroupedTransactions {
  dateKey: string;
  title: string;
  transactions: any[];
  netTotal: number;
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
  isSelectionMode,
  onToggleSelectionMode,
  selectedKeys,
  onToggleSelectTransaction,
  onSelectAllVisible,
}) => {
  const groupedTransactions = useMemo(() => {
    const groups: GroupedTransactions[] = [];
    const groupMap = new Map<string, GroupedTransactions>();

    for (const transaction of visibleTransactions) {
      let dateObj: Date;
      if (transaction.parsedDate instanceof Date && !isNaN(transaction.parsedDate.getTime())) {
        dateObj = transaction.parsedDate;
      } else if (transaction.date) {
        try {
          dateObj = parseISO(transaction.date);
        } catch {
          dateObj = new Date(transaction.date);
        }
      } else {
        dateObj = new Date();
      }

      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      let dateKey: string;
      try {
        dateKey = format(dateObj, "yyyy-MM-dd");
      } catch {
        dateKey = "unknown";
      }

      let group = groupMap.get(dateKey);
      if (!group) {
        let title = "تاريخ غير معروف";
        try {
          if (isToday(dateObj)) {
            title = "اليوم";
          } else if (isYesterday(dateObj)) {
            title = "أمس";
          } else {
            const currentYear = new Date().getFullYear();
            if (dateObj.getFullYear() === currentYear) {
              title = format(dateObj, "d MMMM", { locale: ar });
            } else {
              title = format(dateObj, "d MMMM yyyy", { locale: ar });
            }
          }
        } catch {
          title = "تاريخ غير معروف";
        }

        group = {
          dateKey,
          title,
          transactions: [],
          netTotal: 0,
        };
        groupMap.set(dateKey, group);
        groups.push(group);
      }

      group.transactions.push(transaction);

      if (!transaction.isTransfer) {
        if (transaction.type === "income") {
          group.netTotal += transaction.amount || 0;
        } else if (transaction.type === "expense") {
          group.netTotal -= transaction.amount || 0;
        }
      }
    }

    return groups;
  }, [visibleTransactions]);

  let globalIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="card p-0 overflow-hidden"
    >
      <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <FileText className="size-5 md:size-6" />
          </div>
          <h2 className="text-[--text-h2] font-semibold text-slate-900 dark:text-white">
            قائمة العمليات
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          {onToggleSelectionMode && (
            <button
              type="button"
              onClick={() => {
                hapticFeedback("light");
                onToggleSelectionMode();
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all border cursor-pointer",
                isSelectionMode
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <CheckSquare size={16} />
              <span>{isSelectionMode ? "إلغاء التحديد" : "تحديد"}</span>
            </button>
          )}

          {isSelectionMode && onSelectAllVisible && visibleTransactions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                hapticFeedback("light");
                onSelectAllVisible();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              تحديد الكل
            </button>
          )}

          <span className="px-3 py-1 rounded-full text-xs md:text-sm font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 font-mono">
            {filteredTransactions.length} <span className="font-sans">عملية</span>
          </span>
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          <AnimatePresence>
            {groupedTransactions.map((group) => {
              const isPositive = group.netTotal > 0;
              const isNegative = group.netTotal < 0;
              const netColorClass = isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : isNegative
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400";

              const formattedNet = isPositive
                ? `+${formatCurrency(group.netTotal, currency)}`
                : isNegative
                ? `-${formatCurrency(Math.abs(group.netTotal), currency)}`
                : formatCurrency(0, currency);

              return (
                <div key={group.dateKey} className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {/* Daily Header */}
                  <div className="px-6 py-3 bg-slate-50/90 dark:bg-slate-900/60 flex items-center justify-between border-y border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Calendar className="size-3.5 text-slate-400" />
                      <span>{group.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-normal">
                        الصافي:
                      </span>
                      <span className={netColorClass}>{formattedNet}</span>
                    </div>
                  </div>

                  {/* Daily Transactions */}
                  {group.transactions.map((transaction) => {
                    const currentIndex = globalIndex++;
                    return (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        categories={categories}
                        accounts={accounts}
                        currency={currency}
                        index={currentIndex}
                        onEdit={onEdit}
                        onDelete={(id, type) => onDeleteConfirm(id, type)}
                        onDuplicate={onDuplicate}
                        getPaymentIcon={getPaymentIcon}
                        getPaymentLabel={getPaymentLabel}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedKeys?.has(`${transaction.type}-${transaction.id}`)}
                        onToggleSelect={onToggleSelectTransaction}
                      />
                    );
                  })}
                </div>
              );
            })}
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
