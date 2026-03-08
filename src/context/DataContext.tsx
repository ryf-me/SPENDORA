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
  orderBy,
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
}

export interface Debtor {
  id: string;
  userId: string;
  debtorName: string;
  phoneNumber?: string; // Added
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
  markDebtorPaid: (id: string) => Promise<void>;
  recordDebtorPayment: (id: string, paymentAmount: number) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
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
    const isDefault = ["Marketing", "Sales", "Operations", "Finance", "Travel", "Meals"].includes(id); // Simple check, or use id
    // We'll just allow deleting any category by ID
    const catRef = doc(db, "categories", id);
    // Be careful with deleting categories used in expenses, but for now we just delete
    const batch = writeBatch(db);
    batch.delete(catRef);
    await batch.commit();
  };

  const addExpense = async (expense: Omit<Expense, "id" | "userId">) => {
    if (!currentUser) return;
    await addDoc(collection(db, "expenses"), {
      ...expense,
      splitWith: expense.splitWith || "",
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
  };

  const addDebtor = async (debtor: Omit<Debtor, "id" | "userId">) => {
    if (!currentUser) return;
    await addDoc(collection(db, "debtors"), {
      ...debtor,
      paidAmount: 0,
      expenseId: debtor.expenseId || "",
      notes: debtor.notes || "",
      phoneNumber: debtor.phoneNumber || "",
      userId: currentUser.uid,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  };

  const recordDebtorPayment = async (id: string, paymentAmount: number) => {
    if (!currentUser) return;
    try {
      console.log(`Recording payment for debtor ${id}: ${paymentAmount}`);
      const debtorRef = doc(db, "debtors", id);
      const debtor = debtors.find(d => d.id === id);
      if (!debtor) {
        console.error("Debtor not found in state:", id);
        return;
      }

      const newPaidAmount = (Number(debtor.paidAmount) || 0) + Number(paymentAmount);
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
        date: new Date().toISOString().split("T")[0],
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      console.log("Payment recorded successfully");
    } catch (err) {
      console.error("Error in recordDebtorPayment:", err);
      throw err;
    }
  };

  const markDebtorPaid = async (id: string) => {
    if (!currentUser) return;
    try {
      const debtor = debtors.find(d => d.id === id);
      if (!debtor) return;

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
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      };
      console.log("Adding payment record:", paymentData);
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
        markDebtorPaid,
        recordDebtorPayment,
        addCategory,
        deleteCategory,
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
