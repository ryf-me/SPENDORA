import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Filter, Search, Download, Calendar, Tag, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { formatCurrency } from "../utils/format";

export default function ExpenseHistory() {
  const navigate = useNavigate();
  const { expenses, payments, loading } = useData();
  const { currency: preferredCurrency } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const paymentMethodLabel = (method?: string) => {
    switch (method) {
      case "credit_card":
        return "Credit Card";
      case "debit_card":
        return "Debit Card";
      case "bank_transfer":
        return "Bank Transfer";
      case "cash":
        return "Cash";
      case "cheque":
        return "Cheque";
      case "online_payment":
        return "Online Payment";
      case "full_settlement":
        return "Full Settlement";
      default:
        return "Not set";
    }
  };

  if (loading) {
    return <div style={{ color: "var(--text-primary)" }}>Loading history...</div>;
  }

  // Unified records
  const unifiedHistory = [
    ...expenses.map(e => ({ ...e, type: "Expense" as const })),
    ...payments.map(p => ({
      ...p,
      type: "Payment" as const,
      subject: `Debt Payment: ${p.debtorName}`,
      merchant: "Income",
      category: "Debt Collection",
      employee: "N/A"
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredHistory = unifiedHistory.filter((item) => {
    const subject = item.subject || "";
    const merchant = item.merchant || "";
    const matchesSearch =
      subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paymentMethodLabel(((item as any).paymentMethod || (item as any).method)).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchesType = typeFilter ? item.type === typeFilter : true;
    const matchesDate = dateFilter ? item.date === dateFilter : true;
    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  const categories = Array.from(new Set(unifiedHistory.map((e) => e.category)));

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  const card: React.CSSProperties = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Financial History
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            View expenses and debt payments in one place
          </p>
        </div>
        <button
          className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-colors border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 border" style={card}>
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all text-xs"
            style={inputStyle}
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 outline-none transition-all appearance-none text-xs"
            style={inputStyle}
          >
            <option value="">All Types</option>
            <option value="Expense">Expense</option>
            <option value="Payment">Debt Payment</option>
          </select>
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 outline-none transition-all appearance-none text-xs"
            style={inputStyle}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date filter */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 outline-none transition-all text-xs"
            style={inputStyle}
          />
        </div>

        {(searchTerm || categoryFilter || typeFilter || dateFilter) && (
          <button
            onClick={() => { setSearchTerm(""); setCategoryFilter(""); setTypeFilter(""); setDateFilter(""); }}
            className="md:col-span-4 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors font-medium text-xs"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow-xl border" style={card}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ color: "var(--text-secondary)" }}>
            <thead style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              <tr>
                {["Date", "Type", "Details", "Category", "Payment Method", "Amount"].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-4 font-medium ${h === "Amount" ? "text-right" : ""}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    <div className="flex flex-col items-center justify-center">
                      <Filter size={48} className="mb-4 opacity-30" />
                      <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
                        No records found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (item.type === "Expense") {
                        navigate(`/expenses/${item.id}`);
                      }
                    }}
                    className={`transition-all ${item.type === "Expense" ? "cursor-pointer hover:shadow-md" : ""}`}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {item.type === "Expense" ? (
                          <ArrowUpCircle size={16} className="text-red-400" />
                        ) : (
                          <ArrowDownCircle size={16} className="text-green-500" />
                        )}
                        <span className="font-medium">{item.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.subject}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {item.merchant}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${item.type === "Payment"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
                          }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {paymentMethodLabel(((item as any).paymentMethod || (item as any).method))}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${item.type === "Payment" ? "text-green-500" : "text-red-400"}`}>
                      {item.type === "Payment" ? "+" : "-"} {formatCurrency(item.amount, preferredCurrency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

