import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useApp } from "../context/AppContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, CreditCard, Users } from "lucide-react";
import { formatCurrency } from "../utils/format";

export default function Calendar() {
  const { expenses, debtors, loading } = useData();
  const { theme, currency: preferredCurrency } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  if (loading) {
    return <div style={{ color: "var(--text-primary)" }}>Loading calendar...</div>;
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navBtnStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Calendar
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            View expenses and due debts by date
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-xl transition-colors"
            style={navBtnStyle}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xl font-bold w-48 text-center" style={{ color: "var(--text-primary)" }}>
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-xl transition-colors"
            style={navBtnStyle}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden shadow-xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        {/* Day headers */}
        <div
          className="grid grid-cols-7 border-b"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {/* Padding for start of month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[120px] p-2"
              style={{
                borderBottom: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                opacity: 0.5,
              }}
            />
          ))}

          {days.map((day) => {
            const dayExpenses = expenses.filter((e) => isSameDay(new Date(e.date), day));
            const dayDebtors = debtors.filter((d) => isSameDay(new Date(d.date), day));
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className="min-h-[120px] p-2 transition-colors"
                style={{
                  borderBottom: "1px solid var(--border)",
                  borderRight: "1px solid var(--border)",
                  opacity: !isSameMonth(day, monthStart) ? 0.5 : 1,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                <div className="flex justify-between items-start">
                  <span
                    className="text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full"
                    style={
                      isToday
                        ? { background: "var(--accent)", color: "#000" }
                        : { color: "var(--text-muted)" }
                    }
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  {dayExpenses.slice(0, 2).map((expense) => (
                    <div
                      key={expense.id}
                      className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded px-2 py-1 truncate flex items-center space-x-1"
                    >
                      <CreditCard size={10} />
                      <span className="truncate">{formatCurrency(expense.amount, preferredCurrency)} - {expense.merchant}</span>
                    </div>
                  ))}
                  {dayExpenses.length > 2 && (
                    <div className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
                      + {dayExpenses.length - 2} more
                    </div>
                  )}

                  {dayDebtors.slice(0, 2).map((debtor) => {
                    const balance = debtor.amount - (debtor.paidAmount || 0);
                    return (
                      <div
                        key={debtor.id}
                        className={`text-xs border rounded px-2 py-1 truncate flex items-center space-x-1 ${debtor.status === "paid"
                          ? "bg-green-500/10 border-green-500/20 text-green-500"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                          }`}
                      >
                        <Users size={10} />
                        <span className="truncate">{formatCurrency(balance, preferredCurrency)} - {debtor.debtorName}</span>
                      </div>
                    );
                  })}
                  {dayDebtors.length > 2 && (
                    <div className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
                      + {dayDebtors.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
