import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { X, Plus } from "lucide-react";

export default function AddExpense() {
  const navigate = useNavigate();
  const { addExpense, categories } = useData();
  const { currentUser } = useAuth();
  const { currency: preferredCurrency } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    subject: "",
    merchant: "",
    date: new Date().toISOString().split("T")[0],
    amount: "", // Renamed from total
    currency: preferredCurrency,
    reimbursable: false,
    category: "",
    description: "",
    splitWith: "", // Added
    addToReport: true,
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
        !formData.merchant ||
        !formData.date ||
        !formData.amount ||
        !formData.category
      ) {
        throw new Error("Please fill in all required fields");
      }

      await addExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        employee: currentUser?.displayName || currentUser?.email || "Unknown"
      });
      navigate("/history");
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    fontWeight: 500,
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-6 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            New expense
          </h2>
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              {/* Subject */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label style={labelStyle}>Subject*</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="rounded-xl px-4 py-2.5 outline-none transition-all w-full"
                  style={inputStyle}
                />
              </div>

              {/* Merchant */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label style={labelStyle}>Merchant*</label>
                <input
                  type="text"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleChange}
                  className="rounded-xl px-4 py-2.5 outline-none transition-all w-full"
                  style={inputStyle}
                />
              </div>

              {/* Date */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label style={labelStyle}>Date*</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="rounded-xl px-4 py-2.5 outline-none transition-all w-full"
                  style={inputStyle}
                />
              </div>

              {/* Total + Currency */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label style={labelStyle}>Total*</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="flex-1 rounded-xl px-4 py-2.5 outline-none transition-all"
                    style={inputStyle}
                  />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-32 rounded-xl px-4 py-2.5 outline-none transition-all appearance-none"
                    style={inputStyle}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="LKR">LKR</option>
                  </select>
                </div>
              </div>

              {/* Reimbursable */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div />
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      name="reimbursable"
                      checked={formData.reimbursable}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <div
                      className="w-5 h-5 border-2 rounded transition-all peer-checked:border-[var(--accent)]"
                      style={{
                        borderColor: "var(--text-muted)",
                        background: "transparent",
                      }}
                    />
                    <svg
                      className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Reimbursable
                  </span>
                </label>
              </div>

              {/* Category */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label style={labelStyle}>Category*</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="rounded-xl px-4 py-2.5 outline-none transition-all appearance-none w-full"
                  style={inputStyle}
                >
                  <option value="" disabled>Type</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="pt-3" style={labelStyle}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="rounded-xl px-4 py-2.5 outline-none transition-all resize-none w-full"
                  style={inputStyle}
                />
              </div>

              {/* Split With */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label style={labelStyle}>Split with</label>
                <input
                  type="text"
                  name="splitWith"
                  value={formData.splitWith}
                  onChange={handleChange}
                  placeholder="Employee name or ID"
                  className="rounded-xl px-4 py-2.5 outline-none transition-all w-full"
                  style={inputStyle}
                />
              </div>


              {/* Add to report */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label style={labelStyle}>Add to report</label>
                <div className="flex space-x-6">
                  {[
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                  ].map(({ value, label }) => (
                    <label key={label} className="flex items-center space-x-3 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="addToReport"
                          checked={formData.addToReport === value}
                          onChange={() =>
                            setFormData((prev) => ({ ...prev, addToReport: value }))
                          }
                          className="peer sr-only"
                        />
                        <div
                          className="w-5 h-5 border-2 rounded transition-all peer-checked:border-[var(--accent)]"
                          style={{ borderColor: "var(--text-muted)", background: "transparent" }}
                        />
                        <svg
                          className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Upload Area */}
            <div className="flex flex-col h-full">
              <div
                className="flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group min-h-[400px]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-elevated)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                }}
              >
                <div
                  className="p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: "var(--bg-muted)" }}
                >
                  <Plus size={32} style={{ color: "var(--text-muted)" }} />
                </div>
                <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                  Upload an invoice
                </span>
                <span className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  Drag and drop or click to browse
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="flex justify-end space-x-4 mt-12 pt-6 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-black transition-colors"
              style={{ background: "var(--accent)" }}
            >
              Save draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 border"
              style={{
                background: "var(--bg-muted)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
