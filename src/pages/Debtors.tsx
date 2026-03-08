import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useApp } from "../context/AppContext";
import { UserPlus, CheckCircle2, Clock, Phone, Banknote } from "lucide-react";
import { formatCurrency } from "../utils/format";

export default function Debtors() {
  const { debtors, addDebtor, markDebtorPaid, recordDebtorPayment, loading } = useData();
  const { currency: preferredCurrency } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentInputs, setPaymentInputs] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    debtorName: "",
    phoneNumber: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  if (loading) {
    return <div style={{ color: "var(--text-primary)" }}>Loading debtors...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.debtorName || !formData.amount || !formData.date) return;
    await addDebtor({
      debtorName: formData.debtorName,
      phoneNumber: formData.phoneNumber,
      amount: parseFloat(formData.amount),
      paidAmount: 0,
      date: formData.date,
      notes: formData.notes,
      status: "pending",
    });
    setFormData({ debtorName: "", phoneNumber: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setShowAddForm(false);
  };

  const handlePayment = async (id: string) => {
    const amount = parseFloat(paymentInputs[id]);
    if (isNaN(amount) || amount <= 0) return;
    await recordDebtorPayment(id, amount);
    setPaymentInputs({ ...paymentInputs, [id]: "" });
  };

  const totalOwed = debtors.reduce((acc, curr) => {
    if (curr.status === "paid") return acc;
    return acc + (curr.amount - (curr.paidAmount || 0));
  }, 0);

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
            Debtors
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Track who owes you money and their phone contact
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="rounded-xl px-4 py-2" style={card}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Remaining Balance: </span>
            <span className="font-bold text-red-500">
              {formatCurrency(totalOwed, preferredCurrency)}
            </span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 text-black px-4 py-2 rounded-xl font-medium transition-colors"
            style={{ background: "var(--accent)" }}
          >
            <UserPlus size={18} />
            <span>Add Debtor</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="rounded-2xl p-6 animate-in slide-in-from-top-4 border" style={card}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            New Debtor
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.debtorName}
                onChange={(e) => setFormData({ ...formData, debtorName: e.target.value })}
                className="w-full rounded-xl px-4 py-2 outline-none transition-all"
                style={inputStyle}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Phone Number</label>
              <input
                type="tel"
                placeholder="+1 234 567 890"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full rounded-xl px-4 py-2 outline-none transition-all"
                style={inputStyle}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Amount</label>
              <input
                type="number"
                required
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-xl px-4 py-2 outline-none transition-all"
                style={inputStyle}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Due Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl px-4 py-2 outline-none transition-all"
                style={inputStyle}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Notes</label>
              <input
                type="text"
                placeholder="Brief description"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-xl px-4 py-2 outline-none transition-all"
                style={inputStyle}
              />
            </div>
            <div className="md:col-span-3 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl text-sm font-medium text-black transition-colors"
                style={{ background: "var(--accent)" }}
              >
                Save Debtor
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border" style={card}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ color: "var(--text-secondary)" }}>
            <thead style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              <tr>
                {["Status", "Debtor Details", "Total", "Paid", "Balance", "Action"].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-4 font-medium ${h === "Action" ? "text-right" : ""}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {debtors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center" style={{ color: "var(--text-muted)" }}>
                    No debtors found. You're all settled up!
                  </td>
                </tr>
              ) : (
                debtors.map((debtor) => {
                  const balance = debtor.amount - (debtor.paidAmount || 0);
                  return (
                    <tr
                      key={debtor.id}
                      className="transition-colors group"
                      style={{
                        opacity: debtor.status === "paid" ? 0.6 : 1,
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      <td className="px-6 py-4">
                        {debtor.status === "paid" ? (
                          <span className="flex items-center space-x-2 text-green-500">
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-medium uppercase tracking-wider">Paid</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-2 text-yellow-500">
                            <Clock size={16} />
                            <span className="text-xs font-medium uppercase tracking-wider">Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {debtor.debtorName}
                        </div>
                        {debtor.phoneNumber && (
                          <div className="flex items-center text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            <Phone size={10} className="mr-1" />
                            {debtor.phoneNumber}
                          </div>
                        )}
                        {debtor.notes && (
                          <div className="text-xs italic mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {debtor.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(debtor.amount, preferredCurrency)}
                      </td>
                      <td className="px-6 py-4 text-green-500 font-medium">
                        {formatCurrency(debtor.paidAmount || 0, preferredCurrency)}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-500">
                        {formatCurrency(balance, preferredCurrency)}
                      </td>
                      <td className="px-6 py-4">
                        {debtor.status !== "paid" && (
                          <div className="flex items-center justify-end space-x-2">
                            <div className="relative">
                              <input
                                type="number"
                                placeholder="Amount"
                                value={paymentInputs[debtor.id] || ""}
                                onChange={(e) => setPaymentInputs({ ...paymentInputs, [debtor.id]: e.target.value })}
                                className="w-24 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                style={inputStyle}
                              />
                            </div>
                            <button
                              onClick={() => handlePayment(debtor.id)}
                              className="p-2 rounded-lg text-black hover:opacity-80 transition-all bg-[var(--accent)]"
                              title="Record Partial Payment"
                            >
                              <Banknote size={16} />
                            </button>
                            <button
                              onClick={() => markDebtorPaid(debtor.id)}
                              className="p-2 rounded-lg text-green-500 hover:bg-green-500/10 transition-all border border-green-500/20"
                              title="Mark Fully Paid"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
