import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";

export interface Expense {
  id: string;
  userId: string;
  amount: number; // Renamed from total
  category: string;
  description: string;
  date: string;
  receiptUrl?: string; // Included in schema
  splitWith?: string; // Added to schema
  createdAt?: any;
  // Legacy/UI fields (keeping for app function)
  subject: string;
  merchant: string;
  currency: string;
  reimbursable: boolean;
  employee: string;
  addToReport: boolean;
  tags: string[]; // Added
  isRecurring: boolean; // Added
  frequency?: string; // Added
  endDate?: string; // Added
  icon?: string; // Added for custom icon selection
  paymentMethod?: "credit_card" | "debit_card" | "bank_transfer" | "cash" | "cheque";
}

export interface Debtor {
  id: string;
  userId: string;
  debtorName: string;
  phoneNumber?: string; // Added
  email?: string;
  amount: number;
  paidAmount: number; // Added for partial payments
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
  payments: Payment[]; // Added
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]); // Added
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setExpenses([]);
      setDebtors([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Expenses listener - removed orderBy to avoid composite index requirement
    const qExpenses = query(
      collection(db, "expenses"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      // Sort in memory - date descending
      data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setExpenses(data);
    }, (error) => {
      console.error("Expenses onSnapshot error:", error);
    });

    // Debtors listener - removed orderBy to avoid composite index requirement
    const qDebtors = query(
      collection(db, "debtors"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeDebtors = onSnapshot(qDebtors, (snapshot) => {
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Debtor[];

      // Sort in memory - date descending
      data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDebtors(data);
      setLoading(false);
    }, (error) => {
      console.error("Debtors onSnapshot error:", error);
      setLoading(false);
    });

    // Categories listener - removing orderBy from query to avoid composite index requirement
    // Sorting will be done in memory
    const qCategories = query(
      collection(db, "categories"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeCategories = onSnapshot(qCategories, async (snapshot) => {
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      // Sort in memory by name
      data = data.sort((a, b) => a.name.localeCompare(b.name));

      // Initialize defaults if none exist
      // We check if it's truly empty. Sometimes fromCache can be empty initially.
      if (data.length === 0) {
        try {
          const defaults = ["Marketing", "Sales", "Operations", "Finance", "Travel", "Meals"];
          const batch = writeBatch(db);
          defaults.forEach(catName => {
            const newDocRef = doc(collection(db, "categories"));
            batch.set(newDocRef, {
              name: catName,
              userId: currentUser.uid,
              createdAt: serverTimestamp()
            });
          });
          await batch.commit();
        } catch (err) {
          console.error("Failed to initialize categories:", err);
        }
      }

      setCategories(data);
      setLoading(false);
    }, (error) => {
      console.error("Categories onSnapshot error:", error);
      setLoading(false);
    });

    // Payments listener
    const qPayments = query(
      collection(db, "payments"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Payment[];

      data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPayments(data);
    }, (error) => {
      console.error("Payments onSnapshot error:", error);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeDebtors();
      unsubscribeCategories();
      unsubscribePayments();
    };
  }, [currentUser]);

  const addCategory = async (name: string) => {
    if (!currentUser) return;
    await addDoc(collection(db, "categories"), {
      name,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
  };

  const deleteCategory = async (id: string) => {
    if (!currentUser) return;
    const category = categories.find((item) => item.id === id);
    if (!category || category.userId !== currentUser.uid) {
      throw new Error("Unauthorized category deletion attempt.");
    }

    const catRef = doc(db, "categories", id);
    const batch = writeBatch(db);
    batch.delete(catRef);
    await batch.commit();
  };

  const deleteDebtor = async (id: string) => {
    if (!currentUser) return;
    const debtor = debtors.find((item) => item.id === id);
    if (!debtor || debtor.userId !== currentUser.uid) {
      throw new Error("Unauthorized debtor deletion attempt.");
    }

    try {
      const batch = writeBatch(db);

      // Remove related payment history entries for this debtor
      const qDebtorPayments = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid),
        where("debtorId", "==", id)
      );
      const paymentSnapshot = await getDocs(qDebtorPayments);
      paymentSnapshot.forEach((paymentDoc) => {
        batch.delete(doc(db, "payments", paymentDoc.id));
      });

      // Remove debtor document
      batch.delete(doc(db, "debtors", id));
      await batch.commit();
    } catch (err) {
      console.error("Error deleting debtor:", err);
      throw err;
    }
  };

  const addExpense = async (expense: Omit<Expense, "id" | "userId">) => {
    if (!currentUser) return;
    await addDoc(collection(db, "expenses"), {
      ...expense,
      splitWith: expense.splitWith || "",
      tags: expense.tags || [],
      isRecurring: expense.isRecurring || false,
      frequency: expense.frequency || "",
      endDate: expense.endDate || "",
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) return;
    const expense = expenses.find((item) => item.id === id);
    if (!expense || expense.userId !== currentUser.uid) {
      throw new Error("Unauthorized expense deletion attempt.");
    }

    try {
      await writeBatch(db).delete(doc(db, "expenses", id)).commit();
    } catch (err) {
      console.error("Error deleting expense:", err);
      throw err;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    if (!currentUser) return;
    const existingExpense = expenses.find((item) => item.id === id);
    if (!existingExpense || existingExpense.userId !== currentUser.uid) {
      throw new Error("Unauthorized expense update attempt.");
    }

    try {
      const expenseRef = doc(db, "expenses", id);
      await updateDoc(expenseRef, {
        ...expense,
      });
    } catch (err) {
      console.error("Error updating expense:", err);
      throw err;
    }
  };

  const addDebtor = async (debtor: Omit<Debtor, "id" | "userId">) => {
    if (!currentUser) return;
    await addDoc(collection(db, "debtors"), {
      ...debtor,
      paidAmount: 0,
      expenseId: debtor.expenseId || "",
      notes: debtor.notes || "",
      phoneNumber: debtor.phoneNumber || "",
      email: debtor.email || "",
      userId: currentUser.uid,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  };

  const updateDebtor = async (id: string, debtor: Partial<Debtor>) => {
    if (!currentUser) return;
    const existingDebtor = debtors.find((item) => item.id === id);
    if (!existingDebtor || existingDebtor.userId !== currentUser.uid) {
      throw new Error("Unauthorized debtor update attempt.");
    }

    try {
      const debtorRef = doc(db, "debtors", id);
      await updateDoc(debtorRef, {
        ...debtor,
      });
    } catch (err) {
      console.error("Error updating debtor:", err);
      throw err;
    }
  };

  const recordDebtorPayment = async (id: string, paymentAmount: number, method = "cash", date?: string) => {
    if (!currentUser) return;
    try {
      const debtorRef = doc(db, "debtors", id);
      const debtor = debtors.find(d => d.id === id);
      if (!debtor || debtor.userId !== currentUser.uid) {
        throw new Error("Unauthorized debtor payment attempt.");
      }

      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        throw new Error("Payment amount must be greater than zero.");
      }

      const newPaidAmount = (Number(debtor.paidAmount) || 0) + Number(paymentAmount);
      if (newPaidAmount > Number(debtor.amount)) {
        throw new Error("Payment amount exceeds remaining balance.");
      }

      const isFullyPaid = newPaidAmount >= Number(debtor.amount);

      const batch = writeBatch(db);
      batch.update(debtorRef, {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? "paid" : "pending",
        paidAt: isFullyPaid ? serverTimestamp() : null
      });

      // Add payment record for history
      const paymentRef = doc(collection(db, "payments"));
      batch.set(paymentRef, {
        debtorId: id,
        debtorName: debtor.debtorName,
        amount: Number(paymentAmount),
        date: date || new Date().toISOString().split("T")[0],
        method,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (err) {
      console.error("Error in recordDebtorPayment:", err);
      throw err;
    }
  };

  const markDebtorPaid = async (id: string) => {
    if (!currentUser) return;
    try {
      const debtor = debtors.find(d => d.id === id);
      if (!debtor || debtor.userId !== currentUser.uid) {
        throw new Error("Unauthorized debtor settlement attempt.");
      }

      const remainingToPay = Number(debtor.amount) - (Number(debtor.paidAmount) || 0);
      if (remainingToPay <= 0) return;

      const debtorRef = doc(db, "debtors", id);
      const batch = writeBatch(db);

      batch.update(debtorRef, {
        paidAmount: Number(debtor.amount),
        status: "paid",
        paidAt: serverTimestamp(),
      });

      // Add payment record for history
      const paymentData = {
        debtorId: id,
        debtorName: debtor.debtorName,
        amount: remainingToPay,
        date: new Date().toISOString().split("T")[0],
        method: "Full Settlement",
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      };
      const paymentRef = doc(collection(db, "payments"));
      batch.set(paymentRef, paymentData);

      await batch.commit();
    } catch (err) {
      console.error("Error in markDebtorPaid:", err);
      throw err;
    }
  };

  const sendFeedback = async (data: { name: string; email: string; message: string }) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "feedback"), {
        ...data,
        type: "Spendora Feeds",
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending feedback:", err);
      throw err;
    }
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
