import React, { useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../store/AppContext";
import { hapticFeedback } from "../utils";
import { parseISO, isBefore, isSameDay, format } from "date-fns";
import { DownloadCloud, Banknote, CreditCard, ArrowDownUp } from "lucide-react";
import { motion } from "motion/react";
import { PaymentMethod } from "../types";

import { useWindowSize } from "../hooks/useWindowSize";
import { useDebounce } from "../hooks/useDebounce";

import PageHeader from "../components/ui/PageHeader";
import { TransactionsSummary } from "../components/transactions/TransactionsSummary";
import { TransactionsFilters } from "../components/transactions/TransactionsFilters";
import { TransactionsChart } from "../components/transactions/TransactionsChart";
import { TransactionsList } from "../components/transactions/TransactionsList";
import { EditTransactionModal } from "../components/transactions/EditTransactionModal";
import { DeleteConfirmModal } from "../components/transactions/DeleteConfirmModal";
import { BackupModal } from "../components/transactions/BackupModal";

const Transactions = () => {
  const { width } = useWindowSize();
  const [displayLimit, setDisplayLimit] = useState(20);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [transactionType, setTransactionType] = useState<
    "all" | "expense" | "income"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [accountFilter, setAccountFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    PaymentMethod | "all"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    expenses,
    income,
    categories,
    accounts,
    currency,
    updateExpense,
    deleteExpense,
    updateIncome,
    deleteIncome,
    addExpense,
    addIncome,
    exportData,
    importData,
  } = useAppContext()!;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    id: string;
    type: "expense" | "income";
  } | null>(null);

  const transactionToDelete = useMemo(() => {
    if (!showDeleteConfirm) return null;
    return showDeleteConfirm.type === "expense"
      ? expenses.find((e) => e.id === showDeleteConfirm.id)
      : income.find((i) => i.id === showDeleteConfirm.id);
  }, [showDeleteConfirm, expenses, income]);

  const [editingTransaction, setEditingTransaction] = useState<any | null>(
    null,
  );

  const [editAmount, setEditAmount] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editSubcategoryId, setEditSubcategoryId] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] =
    useState<PaymentMethod>("cash");
  const [editNote, setEditNote] = useState("");

  const filteredTransactions = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({ ...e, type: "expense" as const })),
      ...income.map((i) => ({ ...i, type: "income" as const })),
    ];

    const parsedStartDate = startDate ? parseISO(startDate) : null;
    const parsedEndDate = endDate ? parseISO(endDate) : null;
    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();

    return all
      .filter((t) => {
        const isExpense = t.type === "expense";
        const matchesSearch = isExpense
          ? ((t as any).note || "").toLowerCase().includes(lowerSearchTerm) ||
            (categories.find((c) => c.id === (t as any).categoryId)?.name || "")
              .toLowerCase()
              .includes(lowerSearchTerm)
          : (t as any).source.toLowerCase().includes(lowerSearchTerm);

        const matchesType =
          transactionType === "all" || t.type === transactionType;
        const matchesCategory =
          !categoryFilter ||
          (isExpense && (t as any).categoryId === categoryFilter);
        const matchesTypeFilter =
          !typeFilter ||
          (isExpense &&
            categories.find((c) => c.id === (t as any).categoryId)?.type ===
              typeFilter);
        const matchesAccount = !accountFilter || t.accountId === accountFilter;
        const matchesPaymentMethod =
          paymentMethodFilter === "all" ||
          (isExpense && (t as any).paymentMethod === paymentMethodFilter);

        const tDate = t.parsedDate || parseISO(t.date);
        const matchesStartDate =
          !parsedStartDate ||
          isBefore(parsedStartDate, tDate) ||
          isSameDay(parsedStartDate, tDate);
        const matchesEndDate =
          !parsedEndDate ||
          isBefore(tDate, parsedEndDate) ||
          isSameDay(tDate, parsedEndDate);

        const matchesMinAmount =
          !minAmount || t.amount >= parseFloat(minAmount);
        const matchesMaxAmount =
          !maxAmount || t.amount <= parseFloat(maxAmount);

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory &&
          matchesTypeFilter &&
          matchesAccount &&
          matchesPaymentMethod &&
          matchesStartDate &&
          matchesEndDate &&
          matchesMinAmount &&
          matchesMaxAmount
        );
      })
      .sort((a, b) => {
        if (sortField === "amount") {
          return sortOrder === "desc"
            ? b.amount - a.amount
            : a.amount - b.amount;
        } else {
          const dateA = (a.parsedDate || parseISO(a.date)).getTime();
          const dateB = (b.parsedDate || parseISO(b.date)).getTime();
          return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        }
      });
  }, [
    expenses,
    income,
    debouncedSearchTerm,
    transactionType,
    categoryFilter,
    typeFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortOrder,
    sortField,
    accountFilter,
    paymentMethodFilter,
    categories,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (typeFilter) count++;
    if (startDate) count++;
    if (endDate) count++;
    if (accountFilter) count++;
    if (paymentMethodFilter !== "all") count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    return count;
  }, [
    categoryFilter,
    typeFilter,
    startDate,
    endDate,
    accountFilter,
    paymentMethodFilter,
    minAmount,
    maxAmount,
  ]);

  const activeFiltersList = useMemo(() => {
    const list: { id: string; label: string; clear: () => void }[] = [];
    if (categoryFilter) {
      const catName =
        categories.find((c) => c.id === categoryFilter)?.name || "فئة";
      list.push({
        id: "category",
        label: `الفئة: ${catName}`,
        clear: () => setCategoryFilter(""),
      });
    }
    if (typeFilter) {
      const typeLabel =
        typeFilter === "need"
          ? "احتياجات"
          : typeFilter === "want"
            ? "رغبات"
            : "ادخار";
      list.push({
        id: "type",
        label: `النوع: ${typeLabel}`,
        clear: () => setTypeFilter(""),
      });
    }
    if (startDate) {
      list.push({
        id: "startDate",
        label: `من: ${startDate}`,
        clear: () => setStartDate(""),
      });
    }
    if (endDate) {
      list.push({
        id: "endDate",
        label: `إلى: ${endDate}`,
        clear: () => setEndDate(""),
      });
    }
    if (accountFilter) {
      const accName =
        accounts.find((a) => a.id === accountFilter)?.name || "حساب";
      list.push({
        id: "account",
        label: `الحساب: ${accName}`,
        clear: () => setAccountFilter(""),
      });
    }
    if (paymentMethodFilter !== "all") {
      const payLabel =
        paymentMethodFilter === "cash"
          ? "كاش"
          : paymentMethodFilter === "card"
            ? "بطاقة"
            : "تحويل";
      list.push({
        id: "payment",
        label: `الدفع: ${payLabel}`,
        clear: () => setPaymentMethodFilter("all"),
      });
    }
    if (minAmount) {
      list.push({
        id: "minAmount",
        label: `أدنى: ${minAmount}`,
        clear: () => setMinAmount(""),
      });
    }
    if (maxAmount) {
      list.push({
        id: "maxAmount",
        label: `أقصى: ${maxAmount}`,
        clear: () => setMaxAmount(""),
      });
    }
    return list;
  }, [
    categoryFilter,
    typeFilter,
    startDate,
    endDate,
    accountFilter,
    paymentMethodFilter,
    minAmount,
    maxAmount,
    categories,
    accounts,
  ]);

  const handleDatePreset = (
    preset: "today" | "week" | "month" | "year" | "all",
  ) => {
    hapticFeedback("light");
    const today = new Date();
    switch (preset) {
      case "today": {
        const todayStr = today.toISOString().split("T")[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      }
      case "week": {
        const first = today.getDate() - today.getDay();
        const firstDay = new Date(today.setDate(first));
        const lastDay = new Date(today.setDate(first + 6));
        setStartDate(firstDay.toISOString().split("T")[0]);
        setEndDate(lastDay.toISOString().split("T")[0]);
        break;
      }
      case "month": {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        );
        setStartDate(firstDay.toISOString().split("T")[0]);
        setEndDate(lastDay.toISOString().split("T")[0]);
        break;
      }
      case "year": {
        const currentYear = today.getFullYear();
        setStartDate(`${currentYear}-01-01`);
        setEndDate(`${currentYear}-12-31`);
        break;
      }
      case "all":
      default:
        setStartDate("");
        setEndDate("");
        break;
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setTypeFilter("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setSortField("date");
    setSortOrder("desc");
    setAccountFilter("");
    setPaymentMethodFilter("all");
  };

  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const categoryData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    const relevantTransactions = filteredTransactions.filter(
      (t) => t.type === (transactionType === "income" ? "income" : "expense"),
    );

    if (transactionType === "income") {
      const sources: { [key: string]: number } = {};
      relevantTransactions.forEach((t) => {
        const source = (t as any).source || "أخرى";
        sources[source] = (sources[source] || 0) + t.amount;
      });
      Object.entries(sources).forEach(([name, value]) => {
        data.push({ name, value, color: "#10b981" });
      });
    } else {
      const cats: {
        [key: string]: { value: number; color: string; name: string };
      } = {};
      relevantTransactions.forEach((t) => {
        const cat = categories.find((c) => c.id === (t as any).categoryId);
        if (cat) {
          if (!cats[cat.id]) {
            cats[cat.id] = { value: 0, color: cat.color, name: cat.name };
          }
          cats[cat.id].value += t.amount;
        }
      });
      Object.values(cats).forEach((c) => data.push(c));
    }

    return data.sort((a, b) => b.value - a.value);
  }, [filteredTransactions, transactionType, categories]);

  const visibleTransactions = useMemo(
    () => filteredTransactions.slice(0, displayLimit),
    [filteredTransactions, displayLimit],
  );

  const hasMore = filteredTransactions.length > displayLimit;

  const loadMore = () => {
    setDisplayLimit((prev) => prev + 20);
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "كاش";
      case "card":
        return "بطاقة";
      case "transfer":
        return "تحويل";
      default:
        return method;
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return <Banknote size={14} />;
      case "card":
        return <CreditCard size={14} />;
      case "transfer":
        return <ArrowDownUp size={14} />;
      default:
        return <CreditCard size={14} />;
    }
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("لا توجد بيانات لتصديرها");
      return;
    }

    const headers = [
      "التاريخ",
      "النوع",
      "الفئة",
      "المصدر/الملاحظة",
      "المبلغ",
      "الحساب",
      "طريقة الدفع",
    ];
    const rows = filteredTransactions.map((t) => {
      const isExpense = t.type === "expense";
      const category = isExpense
        ? categories.find((c) => c.id === (t as any).categoryId)?.name
        : "دخل";
      const detail = isExpense
        ? (t as any).note || category
        : (t as any).source;
      const account =
        accounts.find((a) => a.id === t.accountId)?.name || "بدون حساب";
      const payment = isExpense
        ? getPaymentLabel((t as any).paymentMethod)
        : "-";

      return [
        format(parseISO(t.date), "yyyy-MM-dd"),
        isExpense ? "مصروف" : "دخل",
        category,
        detail,
        t.amount,
        account,
        payment,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleDelete = async (id: string, type: "expense" | "income") => {
    try {
      if (type === "expense") {
        await deleteExpense(id);
      } else {
        await deleteIncome(id);
      }
      toast.success("تم حذف العملية بنجاح");
      setShowDeleteConfirm(null);
      hapticFeedback("success");
    } catch (error) {
      toast.error("فشل حذف العملية");
    }
  };

  const handleEditClick = (transaction: any) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDate(transaction.date);
    setEditAccountId(transaction.accountId || "");

    if (transaction.type === "expense") {
      setEditCategoryId(transaction.categoryId);
      setEditSubcategoryId(transaction.subcategoryId || "");
      setEditPaymentMethod(transaction.paymentMethod);
      setEditNote(transaction.note || "");
    } else {
      setEditSource(transaction.source);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const updates = {
        amount: parseFloat(editAmount),
        date: editDate,
        accountId: editAccountId || undefined,
      };

      if (editingTransaction.type === "expense") {
        await updateExpense(editingTransaction.id, {
          ...updates,
          categoryId: editCategoryId,
          subcategoryId: editSubcategoryId || undefined,
          paymentMethod: editPaymentMethod,
          note: editNote,
        });
      } else {
        await updateIncome(editingTransaction.id, {
          ...updates,
          source: editSource,
        });
      }

      toast.success("تم تحديث العملية بنجاح");
      setEditingTransaction(null);
      hapticFeedback("success");
    } catch (error) {
      toast.error("فشل تحديث العملية");
    }
  };

  const handleDuplicate = async (transaction: any) => {
    try {
      const { id, createdAt, ...rest } = transaction;
      if (transaction.type === "expense") {
        await addExpense({
          ...rest,
          date: new Date().toISOString().split("T")[0],
        });
      } else {
        await addIncome({
          ...rest,
          date: new Date().toISOString().split("T")[0],
        });
      }
      toast.success("تم تكرار العملية بنجاح");
      hapticFeedback("success");
    } catch (error) {
      toast.error("فشل تكرار العملية");
    }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      hapticFeedback("medium");
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          await importData(content);
          setShowBackupModal(false);
        } catch (err) {
          toast.error("فشل استيراد النسخة الاحتياطية");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 p-4 pb-32 relative">
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleJsonImport}
        className="hidden"
      />
      <motion.div className="space-y-3 md:space-y-6">
        <PageHeader
          title="سجل العمليات"
          subtitle="تتبع وإدارة جميع مصاريفك ودخلك بدقة وسلاسة في مكان واحد موحد"
          action={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 w-full md:w-auto"
            >
              <button
                onClick={() => setShowBackupModal(true)}
                className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl md:rounded-3xl cursor-pointer"
              >
                <DownloadCloud
                  size={18}
                  className="group-hover:translate-y-0.5 transition-transform"
                />
                <span className="font-bold text-sm">
                  النسخ الاحتياطي والملفات
                </span>
              </button>
            </motion.div>
          }
        />

        {/* Summary Stats & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <TransactionsSummary
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            currency={currency}
          />

          <TransactionsFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            activeFiltersCount={activeFiltersCount}
            sortField={sortField}
            setSortField={setSortField}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            activeFiltersList={activeFiltersList}
            handleDatePreset={handleDatePreset}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            categories={categories}
            accountFilter={accountFilter}
            setAccountFilter={setAccountFilter}
            accounts={accounts}
            paymentMethodFilter={paymentMethodFilter}
            setPaymentMethodFilter={setPaymentMethodFilter}
            minAmount={minAmount}
            setMinAmount={setMinAmount}
            maxAmount={maxAmount}
            setMaxAmount={setMaxAmount}
            currency={currency}
            clearAllFilters={clearAllFilters}
          />
        </div>

        {/* Spending Summary Chart */}
        <TransactionsChart
          categoryData={categoryData}
          transactionType={transactionType}
          currency={currency}
          width={width}
        />

        {/* Transactions List */}
        <TransactionsList
          filteredTransactions={filteredTransactions}
          visibleTransactions={visibleTransactions}
          categories={categories}
          accounts={accounts}
          currency={currency}
          hasMore={hasMore}
          loadMore={loadMore}
          onEdit={handleEditClick}
          onDeleteConfirm={(id, type) => setShowDeleteConfirm({ id, type })}
          onDuplicate={handleDuplicate}
          getPaymentIcon={getPaymentIcon}
          getPaymentLabel={getPaymentLabel}
          onResetFilters={() => {
            hapticFeedback("heavy");
            clearAllFilters();
          }}
        />

        {/* Edit Modal */}
        <EditTransactionModal
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          currency={currency}
          editAmount={editAmount}
          setEditAmount={setEditAmount}
          editCategoryId={editCategoryId}
          setEditCategoryId={setEditCategoryId}
          editAccountId={editAccountId}
          setEditAccountId={setEditAccountId}
          editSubcategoryId={editSubcategoryId}
          setEditSubcategoryId={setEditSubcategoryId}
          editSource={editSource}
          setEditSource={setEditSource}
          editDate={editDate}
          setEditDate={setEditDate}
          editPaymentMethod={editPaymentMethod}
          setEditPaymentMethod={setEditPaymentMethod}
          editNote={editNote}
          setEditNote={setEditNote}
          categories={categories}
          accounts={accounts}
          handleUpdate={handleUpdate}
          getPaymentIcon={getPaymentIcon}
          getPaymentLabel={getPaymentLabel}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          showDeleteConfirm={showDeleteConfirm}
          transactionToDelete={transactionToDelete}
          categories={categories}
          currency={currency}
          onClose={() => setShowDeleteConfirm(null)}
          onDelete={handleDelete}
        />

        {/* Backup & Import/Export Modal */}
        <BackupModal
          showBackupModal={showBackupModal}
          onClose={() => setShowBackupModal(false)}
          fileInputRef={fileInputRef}
          exportData={exportData}
          exportToCSV={exportToCSV}
          handleJsonImport={handleJsonImport}
        />
      </motion.div>
    </div>
  );
};

export default Transactions;
