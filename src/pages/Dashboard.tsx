import React from "react";
import { useData } from "../context/DataContext";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Clock, FileText, Calendar, RefreshCw, CreditCard, UserPlus, ClipboardList } from "lucide-react";
import { formatCurrency } from "../utils/format";

export default function Dashboard() {
  const { expenses, debtors, loading } = useData();
  const { theme, currency: preferredCurrency } = useApp();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  if (loading) {
    return <div style={{ color: "var(--text-primary)" }}>Loading dashboard...</div>;
  }

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOwed = debtors.reduce((acc, curr) => {
    if (curr.status === "paid") return acc;
    return acc + (curr.amount - (curr.paidAmount || 0));
  }, 0);

  // Aggregations
  const categoryTotals = expenses.reduce((acc, curr) => {
    const cat = curr.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const employeeTotals = expenses.reduce((acc, curr) => {
    const emp = curr.employee || "Unknown";
    acc[emp] = (acc[emp] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryTotals).map(([name, amount], index) => ({
    name,
    amount,
    color: `hsl(${(index * 137.5) % 360}, 70%, 65%)` // Dynamic attractive colors
  }));

  const employeeData = Object.entries(employeeTotals).map(([name, amount]) => ({
    name,
    amount
  }));

  const pendingDebtsCount = debtors.filter(d => d.status !== 'paid').length;
  const totalExpensesCount = expenses.length;

  const card: React.CSSProperties = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
  };

  const cardLabel: React.CSSProperties = {
    color: "var(--text-muted)",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  };

  const rowStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
  };

  const tooltipStyle = {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text-primary)",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <div className="flex space-x-4">
          <div className="rounded-xl px-4 py-2" style={card}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Total Expenses: </span>
            <span className="font-bold" style={{ color: "var(--accent)" }}>
              {formatCurrency(totalExpenses, preferredCurrency)}
            </span>
          </div>
          <div className="rounded-xl px-4 py-2" style={card}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Total Owed: </span>
            <span className="font-bold text-red-500">
              {formatCurrency(totalOwed, preferredCurrency)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Status */}
        <div className="rounded-2xl p-6" style={card}>
          <h3 className="text-sm font-semibold mb-4" style={cardLabel}>
            Financial Status
          </h3>
          <div className="space-y-4">
            {[
              { icon: Clock, label: "Pending Debts", value: pendingDebtsCount.toString(), color: "#f87171" },
              { icon: FileText, label: "Total Recorded Expenses", value: totalExpensesCount.toString(), color: "var(--accent)" },
              { icon: RefreshCw, label: "Unpaid Total", value: formatCurrency(totalOwed, preferredCurrency), color: "#f87171" },
              { icon: Calendar, label: "Recent Activity", value: expenses.length > 0 ? "Active" : "None", color: "var(--text-muted)" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="flex justify-between items-center transition-colors"
                style={rowStyle}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} style={{ color }} />
                  <span>{label}</span>
                </div>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="rounded-2xl p-6" style={card}>
          <h3 className="text-sm font-semibold mb-4" style={cardLabel}>
            Recent Expenses
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" style={{ color: "var(--text-secondary)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Subject", "Employee", "Category", "Amount"].map((h) => (
                    <th
                      key={h}
                      className={`pb-3 font-medium ${h === "Amount" ? "text-right" : ""}`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm italic" style={{ color: "var(--text-muted)" }}>
                      No expenses recorded yet
                    </td>
                  </tr>
                ) : (
                  expenses.slice(0, 5).map((expense) => (
                    <tr
                      key={expense.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td className="py-3">{expense.subject || expense.description || "No subject"}</td>
                      <td className="py-3 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {expense.employee || "Me"}
                      </td>
                      <td className="py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: isDark ? 'rgba(var(--accent-rgb), 0.2)' : 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)' }}
                        >
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                        {formatCurrency(expense.amount, preferredCurrency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="rounded-2xl p-6" style={card}>
        <h3 className="text-sm font-semibold mb-4" style={cardLabel}>
          Quick Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: CreditCard,
              label: "New Expense",
              iconBg: "bg-red-500/20",
              iconColor: "text-red-400",
              onClick: () => navigate("/expenses/add")
            },
            {
              icon: UserPlus,
              label: "New Debtor",
              iconBg: "bg-blue-500/20",
              iconColor: "text-blue-400",
              onClick: () => navigate("/debtors")
            },
            {
              icon: ClipboardList,
              label: "Create Report",
              iconBg: "bg-cyan-500/20",
              iconColor: "text-cyan-500",
              onClick: () => navigate("/reports")
            },
          ].map(({ icon: Icon, label, iconBg, iconColor, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex items-center justify-center space-x-3 rounded-xl p-5 transition-all border group"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div className={`${iconBg} p-3 rounded-xl ${iconColor} transition-transform group-hover:scale-110`}>
                <Icon size={20} />
              </div>
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="rounded-2xl p-6" style={card}>
        <h3 className="text-sm font-semibold mb-6" style={cardLabel}>
          Financial Analytics
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Spending by Employee
            </h4>
            <div className="h-48">
              {employeeData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm italic" style={{ color: "var(--text-muted)" }}>
                  Insufficient data for chart
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? "#6b7280" : "#374151", fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? "#6b7280" : "#374151", fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? "#2a2b2e" : "#e5e7eb" }}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Spending by Category
            </h4>
            <div className="h-48">
              {categoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm italic" style={{ color: "var(--text-muted)" }}>
                  Insufficient data for chart
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? "#6b7280" : "#374151", fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? "#6b7280" : "#374151", fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? "#2a2b2e" : "#e5e7eb" }}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
