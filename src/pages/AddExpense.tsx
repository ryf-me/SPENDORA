import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData, Expense } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { X, Plus, Calendar, ChevronDown, Info, Tag as TagIcon, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import { format } from "date-fns";
import IconSelector from "../components/IconSelector";

export default function AddExpense() {
  const navigate = useNavigate();
  const { addExpense, expenses, categories } = useData();
  const { currentUser } = useAuth();
  const { currency: preferredCurrency, theme } = useApp();

  const currencySymbols: Record<string, string> = {
    USD: "$",
    LKR: "Rs.",
    EUR: "€",
    GBP: "£",
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    subject: "", // Reusing subject for Expense Name
    merchant: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    currency: preferredCurrency,
    category: "",
    description: "",
    isRecurring: false,
    frequency: "Monthly",
    endDate: "",
    reimbursable: false, // Default value
    addToReport: true, // Default value
    icon: "", // Added for icon selection
    paymentMethod: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (
        !formData.subject ||
        !formData.amount ||
        !formData.category ||
        !formData.date ||
        !formData.merchant
      ) {
        throw new Error("Please fill in all required fields");
      }

      await addExpense({
        ...formData,
        tags: [],
        amount: parseFloat(formData.amount),
        employee: currentUser?.displayName || currentUser?.email || "Unknown",
        reimbursable: formData.reimbursable,
        addToReport: formData.addToReport,
        icon: formData.icon,
      });
      navigate("/history");
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 4);
  }, [expenses]);

  const isDark = theme === "dark";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Add New Expense
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Fill in the details below to record a new transaction in your ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        {/* Main Form Section */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div 
              className="rounded-2xl p-8 border shadow-sm"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expense Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Expense Name
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Weekly Groceries, Office Supplies"
                    className="w-full rounded-xl px-4 py-3 outline-none border transition-all focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Amount
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium" style={{ color: "var(--text-muted)" }}>
                        {currencySymbols[formData.currency] || "$"}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full rounded-xl pl-10 pr-4 py-3 outline-none border transition-all focus:ring-2 focus:ring-blue-500/20 text-blue-600 font-semibold"
                        style={{ background: "var(--bg-base)", borderColor: "var(--border)" }}
                      />
                    </div>
                    <div className="relative w-28">
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="w-full h-full rounded-xl px-4 py-3 outline-none border appearance-none transition-all focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold"
                        style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      >
                        <option value="USD">USD</option>
                        <option value="LKR">LKR</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Category
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full rounded-xl px-4 py-3 outline-none border appearance-none transition-all focus:ring-2 focus:ring-blue-500/20"
                      style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>

                {/* Icon */}
                <div>
                  <IconSelector
                    selectedIcon={formData.icon}
                    onIconSelect={(icon) => setFormData(prev => ({ ...prev, icon }))}
                    category={formData.category}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full rounded-xl px-4 py-3 outline-none border transition-all focus:ring-2 focus:ring-blue-500/20"
                      style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                {/* Merchant */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Merchant
                  </label>
                  <input
                    type="text"
                    name="merchant"
                    value={formData.merchant}
                    onChange={handleChange}
                    placeholder="e.g. Starbucks, Amazon"
                    className="w-full rounded-xl px-4 py-3 outline-none border transition-all focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full rounded-xl px-4 py-3 outline-none border appearance-none transition-all focus:ring-2 focus:ring-blue-500/20"
                      style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    >
                      <option value="" disabled>Select payment method</option>
                      <option value="credit_card">💳 Credit Card</option>
                      <option value="debit_card">🏧 Debit Card</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="cash">💵 Cash</option>
                      <option value="cheque">📝 Cheque</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>

                <div className="hidden md:block" />
              </div>

              {/* Recurring Section */}
              <div 
                className="mt-6 p-6 rounded-2xl border bg-opacity-30"
                style={{ background: "var(--bg-muted)", borderColor: "var(--border)" }}
              >
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-1">
                    <input
                      type="checkbox"
                      name="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 rounded transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600" style={{ borderColor: "var(--border)" }} />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 left-1 top-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="block font-semibold" style={{ color: "var(--text-primary)" }}>Recurring Expense</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Automatically create this expense on a regular schedule</span>
                  </div>
                </label>

                {formData.isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Frequency</label>
                      <div className="relative">
                        <select
                          name="frequency"
                          value={formData.frequency}
                          onChange={handleChange}
                          className="w-full rounded-xl px-4 py-2.5 outline-none border appearance-none text-sm"
                          style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                        >
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>End Date (Optional)</label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full rounded-xl px-4 py-2.5 outline-none border text-sm"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="w-5 h-5 border-2 rounded transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600" style={{ borderColor: "var(--border)" }} />
                          <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 left-1 top-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>Notify me</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add notes about this expense..."
                  rows={4}
                  className="w-full rounded-xl px-4 py-3 outline-none border transition-all focus:ring-2 focus:ring-blue-500/20 resize-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 pb-12">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-8 py-3 rounded-xl font-semibold transition-all border hover:bg-opacity-80"
                style={{ background: isDark ? "transparent" : "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 rounded-xl font-semibold transition-all bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          {/* Recent Expenses */}
          <div 
            className="rounded-2xl p-6 border shadow-sm"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Recent Expenses</h3>
              <button onClick={() => navigate("/history")} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
            </div>
            
            <div className="space-y-6">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <div 
                    key={expense.id} 
                    className="flex gap-4 cursor-pointer hover:bg-gray-50/50 p-2 -m-2 rounded-xl transition-all"
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100" style={{ background: "var(--bg-muted)" }}>
                      {expense.icon ? (
                        React.createElement(Icons[expense.icon as keyof typeof Icons] || TagIcon, { size: 18, style: { color: "var(--text-muted)" } })
                      ) : (
                        <TagIcon size={18} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-sm truncate pr-2" style={{ color: "var(--text-primary)" }}>{expense.subject}</h4>
                        <span className="font-bold text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
                          {currencySymbols[expense.currency] || "$"}{expense.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
                        <span className="flex items-center gap-1 lowercase">
                          <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                          {expense.category}
                        </span>
                        <span>{format(new Date(expense.date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs italic" style={{ color: "var(--text-muted)" }}>No recent expenses</div>
              )}
            </div>
          </div>

          {/* Pro Tip Box */}
          <div 
            className="rounded-2xl p-6 border relative overflow-hidden group"
            style={{ background: "var(--bg-surface)", borderColor: "#e0e7ff" }}
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <Info size={40} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-2 mb-3 text-blue-600">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">i</div>
              <h3 className="font-bold text-sm">Pro Tip</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Use the receipt upload feature to automatically extract merchant name and amount using our AI assistant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
