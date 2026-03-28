import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ArrowRight, ChevronLeft, ChevronRight, CreditCard, Repeat2, Users, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import type { Debtor, Expense } from "../context/DataContext";
import { formatCurrency } from "../utils/format";
import { buildRecurringOccurrences, isRecurringExpense } from "../utils/recurring";

type RecurringOccurrence = ReturnType<typeof buildRecurringOccurrences>[number];

interface CalendarDayDetails {
  date: Date;
  expenses: Expense[];
  recurringExpenses: RecurringOccurrence[];
  debtors: Debtor[];
}

export default function Calendar() {
  const { expenses, debtors, loading } = useData();
  const { currency: preferredCurrency } = useApp();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  const recurringOccurrences = useMemo(
    () => buildRecurringOccurrences(expenses.filter((expense) => isRecurringExpense(expense)), monthStart, monthEnd),
    [expenses, monthEnd, monthStart],
  );

  const calendarDays = useMemo<CalendarDayDetails[]>(
    () =>
      days.map((day) => ({
        date: day,
        expenses: expenses.filter((expense) => !expense.isRecurring && isSameDay(new Date(expense.date), day)),
        recurringExpenses: recurringOccurrences.filter((occurrence) => isSameDay(occurrence.date, day)),
        debtors: debtors.filter((debtor) => isSameDay(new Date(debtor.date), day)),
      })),
    [days, debtors, expenses, recurringOccurrences],
  );

  const selectedDayDetails = useMemo<CalendarDayDetails | null>(() => {
    if (!selectedDate) {
      return null;
    }

    return (
      calendarDays.find((day) => isSameDay(day.date, selectedDate)) ?? {
        date: selectedDate,
        expenses: [],
        recurringExpenses: [],
        debtors: [],
      }
    );
  }, [calendarDays, selectedDate]);

  const selectedExpenseTotal = selectedDayDetails?.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) ?? 0;
  const selectedRecurringTotal =
    selectedDayDetails?.recurringExpenses.reduce((sum, occurrence) => sum + Number(occurrence.expense.amount || 0), 0) ?? 0;
  const selectedDebtorBalance =
    selectedDayDetails?.debtors.reduce(
      (sum, debtor) => sum + Math.max(0, Number(debtor.amount || 0) - Number(debtor.paidAmount || 0)),
      0,
    ) ?? 0;

  useEffect(() => {
    if (selectedDate && !isSameMonth(selectedDate, monthStart)) {
      setSelectedDate(monthStart);
    }
  }, [monthStart, selectedDate]);

  useEffect(() => {
    if (!isDetailsOpen || !modalRoot) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isDetailsOpen, modalRoot]);

  const navBtnStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
  };

  const openDayDetails = (day: Date) => {
    setSelectedDate(day);
    setIsDetailsOpen(true);
  };

  const closeDayDetails = () => {
    setIsDetailsOpen(false);
  };

  if (loading) {
    return <div style={{ color: "var(--text-primary)" }}>Loading calendar...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Calendar
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            View one-time expenses, recurring bills, and due debts by date
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

      <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: "var(--bg-surface)" }}>
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          One-time expenses
        </div>
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: "var(--bg-surface)" }}>
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Recurring expenses
        </div>
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: "var(--bg-surface)" }}>
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Debtor balances
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden shadow-xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
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

        <div className="grid grid-cols-7 auto-rows-fr">
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

          {calendarDays.map(({ date: day, expenses: dayExpenses, recurringExpenses: dayRecurringExpenses, debtors: dayDebtors }) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const hasEvents = dayExpenses.length > 0 || dayRecurringExpenses.length > 0 || dayDebtors.length > 0;

            return (
              <button
                key={day.toString()}
                type="button"
                className="min-h-[120px] p-2 transition-colors cursor-pointer text-left"
                style={{
                  borderBottom: "1px solid var(--border)",
                  borderRight: "1px solid var(--border)",
                  opacity: !isSameMonth(day, monthStart) ? 0.5 : 1,
                  background: isSelected ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                  boxShadow: isSelected ? "inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent)" : "none",
                }}
                onClick={() => openDayDetails(day)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "var(--bg-elevated)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <span
                    className="text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full"
                    style={isToday ? { background: "var(--accent)", color: "#000" } : { color: "var(--text-muted)" }}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEvents && (
                    <span
                      className="text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                    >
                      {dayExpenses.length + dayRecurringExpenses.length + dayDebtors.length}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {dayExpenses.slice(0, 2).map((expense) => (
                    <div
                      key={expense.id}
                      className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded px-2 py-1 truncate flex items-center space-x-1"
                    >
                      <CreditCard size={10} />
                      <span className="truncate">
                        {formatCurrency(expense.amount, expense.currency || preferredCurrency)} - {expense.merchant}
                      </span>
                    </div>
                  ))}
                  {dayExpenses.length > 2 && (
                    <div className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
                      + {dayExpenses.length - 2} more
                    </div>
                  )}

                  {dayRecurringExpenses.slice(0, 2).map((occurrence) => (
                    <div
                      key={occurrence.key}
                      className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded px-2 py-1 truncate flex items-center space-x-1"
                    >
                      <Repeat2 size={10} />
                      <span className="truncate">
                        {formatCurrency(occurrence.expense.amount, occurrence.expense.currency || preferredCurrency)} - {occurrence.expense.subject}
                      </span>
                    </div>
                  ))}
                  {dayRecurringExpenses.length > 2 && (
                    <div className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
                      + {dayRecurringExpenses.length - 2} more recurring
                    </div>
                  )}

                  {dayDebtors.slice(0, 2).map((debtor) => {
                    const balance = debtor.amount - (debtor.paidAmount || 0);
                    return (
                      <div
                        key={debtor.id}
                        className={`text-xs border rounded px-2 py-1 truncate flex items-center space-x-1 ${
                          debtor.status === "paid"
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
              </button>
            );
          })}
        </div>
      </div>

      {isDetailsOpen && selectedDayDetails && modalRoot
        ? createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/60 p-4 sm:p-6" onClick={closeDayDetails}>
              <div className="flex min-h-full items-center justify-center">
                <div
                  className="w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6"
                    style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
                  >
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                        {format(selectedDayDetails.date, "EEEE, MMMM d, yyyy")}
                      </h2>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        Full activity for the selected date
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeDayDetails}
                      className="h-10 w-10 rounded-xl border flex items-center justify-center"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-surface)" }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="rounded-full px-3 py-1" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                        One-time: {selectedDayDetails.expenses.length} ({formatCurrency(selectedExpenseTotal, preferredCurrency)})
                      </div>
                      <div className="rounded-full px-3 py-1" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                        Recurring: {selectedDayDetails.recurringExpenses.length} ({formatCurrency(selectedRecurringTotal, preferredCurrency)})
                      </div>
                      <div className="rounded-full px-3 py-1" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                        Debtors: {selectedDayDetails.debtors.length} ({formatCurrency(selectedDebtorBalance, preferredCurrency)} open)
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[70vh] overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
                    {selectedDayDetails.expenses.length === 0 &&
                    selectedDayDetails.recurringExpenses.length === 0 &&
                    selectedDayDetails.debtors.length === 0 ? (
                      <div
                        className="rounded-2xl border border-dashed px-4 py-10 text-center"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                      >
                        No calendar items for this date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <div className="rounded-2xl border p-4 space-y-3" style={cardStyle}>
                          <div className="flex items-center gap-2">
                            <CreditCard size={18} className="text-purple-400" />
                            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                              One-time Expenses
                            </h3>
                          </div>
                          {selectedDayDetails.expenses.length === 0 ? (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                              No one-time expenses.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {selectedDayDetails.expenses.map((expense) => (
                                <button
                                  key={expense.id}
                                  type="button"
                                  onClick={() => navigate(`/expenses/${expense.id}`)}
                                  className="w-full rounded-xl border p-3 text-left transition-colors hover:bg-purple-500/5"
                                  style={{ borderColor: "var(--border)" }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                                        {expense.subject || expense.merchant || "Expense"}
                                      </p>
                                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                        {expense.merchant || "No merchant"} - {expense.category || "Uncategorized"}
                                      </p>
                                    </div>
                                    <span className="font-semibold text-purple-400">
                                      {formatCurrency(expense.amount, expense.currency || preferredCurrency)}
                                    </span>
                                  </div>
                                  {(expense.description || expense.paymentMethod) && (
                                    <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                                      {expense.description || `Payment method: ${expense.paymentMethod}`}
                                    </p>
                                  )}
                                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-purple-400">
                                    Open expense
                                    <ArrowRight size={12} />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border p-4 space-y-3" style={cardStyle}>
                          <div className="flex items-center gap-2">
                            <Repeat2 size={18} className="text-blue-500" />
                            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                              Recurring Expenses
                            </h3>
                          </div>
                          {selectedDayDetails.recurringExpenses.length === 0 ? (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                              No recurring expenses.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {selectedDayDetails.recurringExpenses.map((occurrence) => (
                                <div key={occurrence.key} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                                        {occurrence.expense.subject || "Recurring expense"}
                                      </p>
                                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                        {occurrence.expense.category || "Uncategorized"} - {occurrence.expense.frequency || "Recurring"}
                                      </p>
                                    </div>
                                    <span className="font-semibold text-blue-500">
                                      {formatCurrency(occurrence.expense.amount, occurrence.expense.currency || preferredCurrency)}
                                    </span>
                                  </div>
                                  {occurrence.expense.description && (
                                    <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                                      {occurrence.expense.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border p-4 space-y-3" style={cardStyle}>
                          <div className="flex items-center gap-2">
                            <Users size={18} className="text-red-400" />
                            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                              Debtors
                            </h3>
                          </div>
                          {selectedDayDetails.debtors.length === 0 ? (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                              No debtors due on this date.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {selectedDayDetails.debtors.map((debtor) => {
                                const balance = Math.max(0, Number(debtor.amount || 0) - Number(debtor.paidAmount || 0));
                                return (
                                  <button
                                    key={debtor.id}
                                    type="button"
                                    onClick={() => navigate(`/debtors/${debtor.id}`)}
                                    className="w-full rounded-xl border p-3 text-left transition-colors hover:bg-red-500/5"
                                    style={{ borderColor: "var(--border)" }}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                                          {debtor.debtorName}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                          Status: {debtor.status} - Paid {formatCurrency(debtor.paidAmount || 0, preferredCurrency)}
                                        </p>
                                      </div>
                                      <span className={debtor.status === "paid" ? "font-semibold text-green-500" : "font-semibold text-red-400"}>
                                        {formatCurrency(balance, preferredCurrency)}
                                      </span>
                                    </div>
                                    {debtor.notes && (
                                      <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                                        {debtor.notes}
                                      </p>
                                    )}
                                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-red-400">
                                      Open debtor
                                      <ArrowRight size={12} />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            modalRoot,
          )
        : null}
    </div>
  );
}
