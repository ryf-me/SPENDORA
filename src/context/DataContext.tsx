import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "./AuthContext";

export type RecurringFrequency = "Weekly" | "Monthly" | "Yearly";
export type RecurringStatus = "active" | "paused";

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  receiptUrl?: string;
  splitWith?: string;
  createdAt?: any;
  subject: string;
  merchant: string;
  currency: string;
  reimbursable: boolean;
  employee: string;
  addToReport: boolean;
  tags: string[];
  isRecurring: boolean;
  frequency?: RecurringFrequency | "";
  endDate?: string;
  recurringStatus?: RecurringStatus;
  recurringNotifications?: boolean;
  icon?: string;
  paymentMethod?: "" | "credit_card" | "debit_card" | "bank_transfer" | "cash" | "cheque";
}

export interface Debtor {
  id: string;
  userId: string;
  debtorName: string;
  phoneNumber?: string;
  email?: string;
  amount: number;
  paidAmount: number;
  expenseId?: string;
  notes?: string;
  status: "pending" | "paid";
  date: string;
  createdAt?: any;
  paidAt?: any;
}

export interface Payment {
  id: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  date: string;
  method?: string;
  userId: string;
  createdAt: any;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt?: any;
}

interface DataContextType {
  expenses: Expense[];
  debtors: Debtor[];
  categories: Category[];
  payments: Payment[];
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  addDebtor: (debtor: Omit<Debtor, "id" | "userId">) => Promise<void>;
  updateDebtor: (id: string, debtor: Partial<Debtor>) => Promise<void>;
  markDebtorPaid: (id: string) => Promise<void>;
  recordDebtorPayment: (id: string, paymentAmount: number, method?: string, date?: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  deleteDebtor: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  sendFeedback: (data: { name: string; email: string; message: string }) => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function mapExpense(row: Record<string, any>): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount || 0),
    category: row.category || "",
    description: row.description || "",
    date: row.date,
    receiptUrl: row.receipt_url || "",
    splitWith: row.split_with || "",
    createdAt: row.created_at,
    subject: row.subject || "",
    merchant: row.merchant || "",
    currency: row.currency || "LKR",
    reimbursable: Boolean(row.reimbursable),
    employee: row.employee || "",
    addToReport: Boolean(row.add_to_report),
    tags: Array.isArray(row.tags) ? row.tags : [],
    isRecurring: Boolean(row.is_recurring),
    frequency: row.frequency || "",
    endDate: row.end_date || "",
    recurringStatus: row.recurring_status || "active",
    recurringNotifications: row.recurring_notifications ?? true,
    icon: row.icon || "",
    paymentMethod: row.payment_method || "",
  };
}

function mapDebtor(row: Record<string, any>): Debtor {
  return {
    id: row.id,
    userId: row.user_id,
    debtorName: row.debtor_name,
    phoneNumber: row.phone_number || "",
    email: row.email || "",
    amount: Number(row.amount || 0),
    paidAmount: Number(row.paid_amount || 0),
    expenseId: row.expense_id || "",
    notes: row.notes || "",
    status: row.status,
    date: row.date,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

function mapCategory(row: Record<string, any>): Category {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

function mapPayment(row: Record<string, any>): Payment {
  return {
    id: row.id,
    debtorId: row.debtor_id,
    debtorName: row.debtor_name,
    amount: Number(row.amount || 0),
    date: row.date,
    method: row.method || "",
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

function buildExpensePayload(expense: Omit<Expense, "id" | "userId">, userId: string) {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    amount: Number(expense.amount) || 0,
    category: expense.category,
    description: expense.description,
    date: expense.date,
    receipt_url: expense.receiptUrl || "",
    split_with: expense.splitWith || "",
    subject: expense.subject,
    merchant: expense.merchant,
    currency: expense.currency,
    reimbursable: expense.reimbursable,
    employee: expense.employee,
    add_to_report: expense.addToReport,
    tags: expense.tags || [],
    is_recurring: expense.isRecurring || false,
    frequency: expense.isRecurring ? expense.frequency || "Monthly" : "",
    end_date: expense.endDate || null,
    recurring_status: expense.isRecurring ? expense.recurringStatus || "active" : "active",
    recurring_notifications: expense.isRecurring ? expense.recurringNotifications ?? true : false,
    icon: expense.icon || "",
    payment_method: expense.paymentMethod || "",
  };
}

function buildExpenseUpdatePayload(expense: Partial<Expense>) {
  const payload: Record<string, unknown> = {};

  if ("amount" in expense) payload.amount = Number(expense.amount || 0);
  if ("category" in expense) payload.category = expense.category || "";
  if ("description" in expense) payload.description = expense.description || "";
  if ("date" in expense) payload.date = expense.date || null;
  if ("receiptUrl" in expense) payload.receipt_url = expense.receiptUrl || "";
  if ("splitWith" in expense) payload.split_with = expense.splitWith || "";
  if ("subject" in expense) payload.subject = expense.subject || "";
  if ("merchant" in expense) payload.merchant = expense.merchant || "";
  if ("currency" in expense) payload.currency = expense.currency || "LKR";
  if ("reimbursable" in expense) payload.reimbursable = Boolean(expense.reimbursable);
  if ("employee" in expense) payload.employee = expense.employee || "";
  if ("addToReport" in expense) payload.add_to_report = Boolean(expense.addToReport);
  if ("tags" in expense) payload.tags = expense.tags || [];
  if ("isRecurring" in expense) payload.is_recurring = Boolean(expense.isRecurring);
  if ("frequency" in expense) payload.frequency = expense.frequency || "";
  if ("endDate" in expense) payload.end_date = expense.endDate || null;
  if ("recurringStatus" in expense) payload.recurring_status = expense.recurringStatus || "active";
  if ("recurringNotifications" in expense) payload.recurring_notifications = expense.recurringNotifications ?? true;
  if ("icon" in expense) payload.icon = expense.icon || "";
  if ("paymentMethod" in expense) payload.payment_method = expense.paymentMethod || "";

  return payload;
}

function buildDebtorUpdatePayload(debtor: Partial<Debtor>) {
  const payload: Record<string, unknown> = {};

  if ("debtorName" in debtor) payload.debtor_name = debtor.debtorName || "";
  if ("phoneNumber" in debtor) payload.phone_number = debtor.phoneNumber || "";
  if ("email" in debtor) payload.email = debtor.email || "";
  if ("amount" in debtor) payload.amount = Number(debtor.amount || 0);
  if ("paidAmount" in debtor) payload.paid_amount = Number(debtor.paidAmount || 0);
  if ("expenseId" in debtor) payload.expense_id = debtor.expenseId || null;
  if ("notes" in debtor) payload.notes = debtor.notes || "";
  if ("status" in debtor) payload.status = debtor.status || "pending";
  if ("date" in debtor) payload.date = debtor.date || null;
  if ("paidAt" in debtor) payload.paid_at = debtor.paidAt || null;

  return payload;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = currentUser?.uid;
    if (!userId) {
      setExpenses([]);
      setDebtors([]);
      setCategories([]);
      setPayments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const loadExpenses = async () => {
      const { data, error } = await supabase.from("expenses").select("*").eq("user_id", userId);
      if (error) {
        console.error("Expenses query error:", error);
        return;
      }
      if (!cancelled) {
        setExpenses((data || []).map(mapExpense).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    };

    const loadDebtors = async () => {
      const { data, error } = await supabase.from("debtors").select("*").eq("user_id", userId);
      if (error) {
        console.error("Debtors query error:", error);
        return;
      }
      if (!cancelled) {
        setDebtors((data || []).map(mapDebtor).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    };

    const loadCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId);
      if (error) {
        console.error("Categories query error:", error);
        return;
      }
      if (!cancelled) {
        setCategories((data || []).map(mapCategory).sort((a, b) => a.name.localeCompare(b.name)));
      }
    };

    const loadPayments = async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("user_id", userId);
      if (error) {
        console.error("Payments query error:", error);
        return;
      }
      if (!cancelled) {
        setPayments((data || []).map(mapPayment).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    };

    const initializeDefaults = async () => {
      const { error } = await supabase.rpc("initialize_default_categories");
      if (error) {
        console.error("Failed to initialize categories:", error);
      }
    };

    const expensesChannel = supabase.channel(`expenses-${userId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${userId}` },
      () => void loadExpenses(),
    );

    const debtorsChannel = supabase.channel(`debtors-${userId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "debtors", filter: `user_id=eq.${userId}` },
      () => void loadDebtors(),
    );

    const categoriesChannel = supabase.channel(`categories-${userId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${userId}` },
      () => void loadCategories(),
    );

    const paymentsChannel = supabase.channel(`payments-${userId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${userId}` },
      () => void loadPayments(),
    );

    const initialize = async () => {
      await initializeDefaults();
      await Promise.all([loadExpenses(), loadDebtors(), loadCategories(), loadPayments()]);
      expensesChannel.subscribe();
      debtorsChannel.subscribe();
      categoriesChannel.subscribe();
      paymentsChannel.subscribe();
      if (!cancelled) {
        setLoading(false);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      void supabase.removeChannel(expensesChannel);
      void supabase.removeChannel(debtorsChannel);
      void supabase.removeChannel(categoriesChannel);
      void supabase.removeChannel(paymentsChannel);
    };
  }, [currentUser?.uid]);

  const addCategory = async (name: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from("categories").insert({
      id: crypto.randomUUID(),
      name,
      user_id: currentUser.uid,
    });
    if (error) throw error;
  };

  const deleteCategory = async (id: string) => {
    if (!currentUser) return;
    const category = categories.find((item) => item.id === id);
    if (!category || category.userId !== currentUser.uid) {
      throw new Error("Unauthorized category deletion attempt.");
    }

    const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", currentUser.uid);
    if (error) throw error;
  };

  const deleteDebtor = async (id: string) => {
    if (!currentUser) return;
    const debtor = debtors.find((item) => item.id === id);
    if (!debtor || debtor.userId !== currentUser.uid) {
      throw new Error("Unauthorized debtor deletion attempt.");
    }

    const { error } = await supabase.rpc("delete_debtor_with_payments", { p_debtor_id: id });
    if (error) throw error;
  };

  const addExpense = async (expense: Omit<Expense, "id" | "userId">) => {
    if (!currentUser) return;
    const { error } = await supabase.from("expenses").insert(buildExpensePayload(expense, currentUser.uid));
    if (error) throw error;
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) return;
    const expense = expenses.find((item) => item.id === id);
    if (!expense || expense.userId !== currentUser.uid) {
      throw new Error("Unauthorized expense deletion attempt.");
    }

    const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", currentUser.uid);
    if (error) throw error;
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    if (!currentUser) return;
    const existingExpense = expenses.find((item) => item.id === id);
    if (!existingExpense || existingExpense.userId !== currentUser.uid) {
      throw new Error("Unauthorized expense update attempt.");
    }

    const { error } = await supabase
      .from("expenses")
      .update(buildExpenseUpdatePayload(expense))
      .eq("id", id)
      .eq("user_id", currentUser.uid);

    if (error) throw error;
  };

  const addDebtor = async (debtor: Omit<Debtor, "id" | "userId">) => {
    if (!currentUser) return;
    const { error } = await supabase.from("debtors").insert({
      id: crypto.randomUUID(),
      user_id: currentUser.uid,
      debtor_name: debtor.debtorName,
      phone_number: debtor.phoneNumber || "",
      email: debtor.email || "",
      amount: Number(debtor.amount) || 0,
      paid_amount: 0,
      expense_id: debtor.expenseId || null,
      notes: debtor.notes || "",
      status: "pending",
      date: debtor.date,
    });
    if (error) throw error;
  };

  const updateDebtor = async (id: string, debtor: Partial<Debtor>) => {
    if (!currentUser) return;
    const existingDebtor = debtors.find((item) => item.id === id);
    if (!existingDebtor || existingDebtor.userId !== currentUser.uid) {
      throw new Error("Unauthorized debtor update attempt.");
    }

    const { error } = await supabase
      .from("debtors")
      .update(buildDebtorUpdatePayload(debtor))
      .eq("id", id)
      .eq("user_id", currentUser.uid);

    if (error) throw error;
  };

  const recordDebtorPayment = async (id: string, paymentAmount: number, method = "cash", date?: string) => {
    if (!currentUser) return;
    const { error } = await supabase.rpc("record_debtor_payment", {
      p_debtor_id: id,
      p_payment_amount: paymentAmount,
      p_method: method,
      p_date: date || new Date().toISOString().split("T")[0],
    });
    if (error) throw error;
  };

  const markDebtorPaid = async (id: string) => {
    if (!currentUser) return;
    const { error } = await supabase.rpc("mark_debtor_paid", { p_debtor_id: id });
    if (error) throw error;
  };

  const sendFeedback = async (data: { name: string; email: string; message: string }) => {
    if (!currentUser) return;
    const { error } = await supabase.from("feedback").insert({
      id: crypto.randomUUID(),
      ...data,
      type: "Spendora Feeds",
      user_id: currentUser.uid,
    });
    if (error) throw error;
  };

  return (
    <DataContext.Provider
      value={{
        expenses,
        debtors,
        categories,
        payments,
        addExpense,
        addDebtor,
        updateDebtor,
        markDebtorPaid,
        recordDebtorPayment,
        addCategory,
        deleteCategory,
        deleteDebtor,
        deleteExpense,
        updateExpense,
        sendFeedback,
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
