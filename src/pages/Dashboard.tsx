import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  differenceInCalendarDays,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowRight,
  BanknoteArrowDown,
  CalendarRange,
  ClipboardList,
  CreditCard,
  FileText,
  HandCoins,
  Landmark,
  ReceiptText,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  X,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useApp } from "../context/AppContext";
import { formatCurrency } from "../utils/format";

function parseRecordDate(value?: string, fallback?: any) {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (fallback?.toDate) {
    const parsed = fallback.toDate();
    if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function getRemainingAmount(amount: number, paidAmount: number) {
  return Math.max(0, Number(amount || 0) - Number(paidAmount || 0));
}

function isWithinRange(date: Date | null, start: Date, end: Date) {
  if (!date) {
    return false;
  }

  return !isAfter(start, date) && !isAfter(date, end);
}

function formatRangeLabel(start: Date, end: Date) {
  const sameMonth = format(start, "MMM yyyy") === format(end, "MMM yyyy");
  return sameMonth ? format(start, "MMM yyyy") : `${format(start, "MMM yyyy")} - ${format(end, "MMM yyyy")}`;
}

function buildDelta(current: number, previous: number, higherIsBetter: boolean) {
  if (previous === 0) {
    if (current === 0) {
      return {
        label: "No change vs previous period",
        value: 0,
        tone: "neutral" as const,
      };
    }

    return {
      label: "New compared with previous period",
      value: 100,
      tone: higherIsBetter ? ("positive" as const) : ("negative" as const),
    };
  }

  const difference = current - previous;
  const percent = Math.abs((difference / previous) * 100);
  const improved = higherIsBetter ? difference >= 0 : difference <= 0;

  return {
    label: `${percent.toFixed(1)}% vs previous period`,
    value: percent,
    tone: difference === 0 ? ("neutral" as const) : improved ? ("positive" as const) : ("negative" as const),
  };
}

function getDeltaColor(tone: "positive" | "negative" | "neutral") {
  if (tone === "positive") {
    return "#16a34a";
  }

  if (tone === "negative") {
    return "#dc2626";
  }

  return "var(--text-muted)";
}

export default function Dashboard() {
  const { expenses, debtors, payments, loading } = useData();
  const { theme, currency: preferredCurrency } = useApp();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const today = startOfDay(new Date());
  const defaultRangeStartDate = startOfDay(subMonths(today, 1));
  const defaultRangeEndDate = today;
  const defaultRangeStart = format(defaultRangeStartDate, "yyyy-MM-dd");
  const defaultRangeEnd = format(defaultRangeEndDate, "yyyy-MM-dd");

  const [rangeStart, setRangeStart] = useState(defaultRangeStart);
  const [rangeEnd, setRangeEnd] = useState(defaultRangeEnd);
  const [draftRangeStart, setDraftRangeStart] = useState(defaultRangeStart);
  const [draftRangeEnd, setDraftRangeEnd] = useState(defaultRangeEnd);
  const [showRangePicker, setShowRangePicker] = useState(false);

  const dashboardData = useMemo(() => {
    const parsedStart = parseRecordDate(rangeStart) ?? defaultRangeStartDate;
    const parsedEnd = parseRecordDate(rangeEnd) ?? defaultRangeEndDate;

    const safeStart = startOfDay(isAfter(parsedStart, parsedEnd) ? parsedEnd : parsedStart);
    const safeEnd = endOfDay(isAfter(parsedStart, parsedEnd) ? parsedStart : parsedEnd);
    const rangeLabel = formatRangeLabel(safeStart, safeEnd);
    const periodLength = Math.max(1, differenceInCalendarDays(safeEnd, safeStart) + 1);
    const previousPeriodEnd = endOfDay(subDays(safeStart, 1));
    const previousPeriodStart = startOfDay(subDays(previousPeriodEnd, periodLength - 1));
    const referenceDate = isAfter(safeEnd, today) ? today : safeEnd;

    const rangeExpenses = expenses.filter((expense) =>
      isWithinRange(parseRecordDate(expense.date, expense.createdAt), safeStart, safeEnd),
    );
    const previousRangeExpenses = expenses.filter((expense) =>
      isWithinRange(parseRecordDate(expense.date, expense.createdAt), previousPeriodStart, previousPeriodEnd),
    );

    const rangePayments = payments.filter((payment) =>
      isWithinRange(parseRecordDate(payment.date, payment.createdAt), safeStart, safeEnd),
    );
    const previousRangePayments = payments.filter((payment) =>
      isWithinRange(parseRecordDate(payment.date, payment.createdAt), previousPeriodStart, previousPeriodEnd),
    );

    const totalOutstanding = debtors.reduce((sum, debtor) => {
      const openedAt = parseRecordDate(debtor.date, debtor.createdAt);
      if (!openedAt || isAfter(openedAt, referenceDate)) {
        return sum;
      }

      return sum + getRemainingAmount(debtor.amount, debtor.paidAmount);
    }, 0);

    const previousOutstanding = debtors.reduce((sum, debtor) => {
      const openedAt = parseRecordDate(debtor.date, debtor.createdAt);
      if (!openedAt || isAfter(openedAt, previousPeriodEnd)) {
        return sum;
      }

      return sum + getRemainingAmount(debtor.amount, debtor.paidAmount);
    }, 0);

    const totalCollected = rangePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const previousCollected = previousRangePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const totalExpenses = rangeExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const previousExpenses = previousRangeExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const netCashFlow = totalCollected - totalExpenses;
    const previousNetCashFlow = previousCollected - previousExpenses;

    const monthlySeries = eachMonthOfInterval({
      start: startOfMonth(safeStart),
      end: startOfMonth(safeEnd),
    }).map((monthDate) => {
      const monthEnd = endOfMonth(monthDate);

      const collections = payments.reduce((sum, payment) => {
        const paymentDate = parseRecordDate(payment.date, payment.createdAt);
        if (!isWithinRange(paymentDate, monthDate, monthEnd)) {
          return sum;
        }

        return sum + Number(payment.amount || 0);
      }, 0);

      const outflows = expenses.reduce((sum, expense) => {
        const expenseDate = parseRecordDate(expense.date, expense.createdAt);
        if (!isWithinRange(expenseDate, monthDate, monthEnd)) {
          return sum;
        }

        return sum + Number(expense.amount || 0);
      }, 0);

      return {
        month: format(monthDate, "MMM").toUpperCase(),
        collections,
        expenses: outflows,
      };
    });

    const overdueDebtors = debtors
      .map((debtor) => {
        const dueDate = parseRecordDate(debtor.date, debtor.createdAt);
        const remaining = getRemainingAmount(debtor.amount, debtor.paidAmount);

        if (!dueDate || remaining <= 0 || !isAfter(referenceDate, dueDate)) {
          return null;
        }

        const daysOverdue = Math.max(
          0,
          Math.floor((referenceDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        );

        return {
          ...debtor,
          daysOverdue,
          remaining,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) {
          return 0;
        }

        return b.daysOverdue - a.daysOverdue || b.remaining - a.remaining;
      })
      .slice(0, 3) as Array<{
        id: string;
        debtorName: string;
        remaining: number;
        daysOverdue: number;
      }>;

    const recentOutflows = [...rangeExpenses]
      .sort((a, b) => {
        const aDate = parseRecordDate(a.date, a.createdAt)?.getTime() || 0;
        const bDate = parseRecordDate(b.date, b.createdAt)?.getTime() || 0;
        return bDate - aDate;
      })
      .slice(0, 4)
      .map((expense) => ({
        ...expense,
        parsedDate: parseRecordDate(expense.date, expense.createdAt),
      }));

    const debtorsInScope = debtors.filter((debtor) => {
      const openedAt = parseRecordDate(debtor.date, debtor.createdAt);
      return openedAt && !isAfter(openedAt, referenceDate);
    });

    const totalDebtBook = debtorsInScope.reduce((sum, debtor) => sum + Number(debtor.amount || 0), 0);
    const totalRecovered = debtorsInScope.reduce((sum, debtor) => sum + Number(debtor.paidAmount || 0), 0);
    const recoveryRate = totalDebtBook > 0 ? Math.round((totalRecovered / totalDebtBook) * 100) : 0;
    const liquidityMessage =
      recoveryRate >= 70
        ? "Strong liquidity position"
        : recoveryRate >= 40
          ? "Recovery momentum is stable"
          : "Collections need closer attention";

    const topPendingDebtor =
      overdueDebtors[0] ??
      debtorsInScope
        .map((debtor) => ({ ...debtor, remaining: getRemainingAmount(debtor.amount, debtor.paidAmount) }))
        .filter((debtor) => debtor.remaining > 0)
        .sort((a, b) => b.remaining - a.remaining)[0] ??
      null;

    return {
      rangeLabel,
      monthlySeries,
      overdueDebtors,
      recentOutflows,
      totalOutstanding,
      totalCollected,
      totalExpenses,
      netCashFlow,
      totalDebtBook,
      totalRecovered,
      recoveryRate,
      liquidityMessage,
      topPendingDebtor,
      outstandingDelta: buildDelta(totalOutstanding, previousOutstanding, false),
      collectionsDelta: buildDelta(totalCollected, previousCollected, true),
      expensesDelta: buildDelta(totalExpenses, previousExpenses, false),
      cashFlowDelta: buildDelta(netCashFlow, previousNetCashFlow, true),
    };
  }, [defaultRangeEndDate, defaultRangeStartDate, debtors, expenses, payments, rangeEnd, rangeStart, today]);

  const panelStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    boxShadow: isDark ? "0 22px 50px rgba(0, 0, 0, 0.28)" : "0 18px 40px rgba(15, 23, 42, 0.08)",
  };

  const applyRange = () => {
    const parsedDraftStart = parseRecordDate(draftRangeStart) ?? defaultRangeStartDate;
    const parsedDraftEnd = parseRecordDate(draftRangeEnd) ?? defaultRangeEndDate;
    const safeStart = format(
      startOfDay(isAfter(parsedDraftStart, parsedDraftEnd) ? parsedDraftEnd : parsedDraftStart),
      "yyyy-MM-dd",
    );
    const safeEnd = format(
      startOfDay(isAfter(parsedDraftStart, parsedDraftEnd) ? parsedDraftStart : parsedDraftEnd),
      "yyyy-MM-dd",
    );

    setRangeStart(safeStart);
    setRangeEnd(safeEnd);
    setDraftRangeStart(safeStart);
    setDraftRangeEnd(safeEnd);
    setShowRangePicker(false);
  };

  const resetRange = () => {
    setRangeStart(defaultRangeStart);
    setRangeEnd(defaultRangeEnd);
    setDraftRangeStart(defaultRangeStart);
    setDraftRangeEnd(defaultRangeEnd);
    setShowRangePicker(false);
  };

  if (loading) {
    return <div style={{ color: "var(--text-primary)" }}>Loading dashboard...</div>;
  }

  const topCards = [
    {
      label: "Total Outstanding Debt",
      value: formatCurrency(dashboardData.totalOutstanding, preferredCurrency),
      note: dashboardData.outstandingDelta.label,
      icon: HandCoins,
      color: "#16a34a",
      onClick: () => navigate("/debtors"),
      solid: false,
    },
    {
      label: "Collections",
      value: formatCurrency(dashboardData.totalCollected, preferredCurrency),
      note: dashboardData.collectionsDelta.label,
      icon: BanknoteArrowDown,
      color: "#22c55e",
      onClick: () => navigate("/history"),
      solid: false,
    },
    {
      label: "Total Expenses",
      value: formatCurrency(dashboardData.totalExpenses, preferredCurrency),
      note: dashboardData.expensesDelta.label,
      icon: ReceiptText,
      color: "#ef4444",
      onClick: () => navigate("/history"),
      solid: false,
    },
    {
      label: "Net Cash Flow",
      value: formatCurrency(dashboardData.netCashFlow, preferredCurrency),
      note: dashboardData.cashFlowDelta.label,
      icon: Landmark,
      color: "#ffffff",
      onClick: () => navigate("/reports"),
      solid: true,
    },
  ];

  const commandActions = [
    {
      label: "Log New Payment",
      description: dashboardData.topPendingDebtor
        ? `Open ${dashboardData.topPendingDebtor.debtorName}`
        : "Open debtor ledger",
      icon: HandCoins,
      onClick: () =>
        navigate(dashboardData.topPendingDebtor ? `/debtors/${dashboardData.topPendingDebtor.id}` : "/debtors"),
      accent: "#16a34a",
    },
    {
      label: "Add New Expense",
      description: "Capture a fresh outflow",
      icon: CreditCard,
      onClick: () => navigate("/expenses"),
      accent: "#ef4444",
    },
    {
      label: "Generate Report",
      description: `Use ${dashboardData.rangeLabel}`,
      icon: FileText,
      onClick: () => navigate("/reports"),
      accent: "#1d4ed8",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="rounded-[2rem] border p-6 md:p-8" style={panelStyle}>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--text-muted)" }}
        >
          Financial Overview
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl" style={{ color: "var(--text-primary)" }}>
              System Health
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              Your sovereign financial narrative. Real-time monitoring of ledger positions, debt liquidity, and
              operational outflows.
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRangePicker((value) => !value)}
              className="inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-transform hover:-translate-y-0.5"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
              }}
            >
              <CalendarRange size={18} />
              <span>Reporting window: {dashboardData.rangeLabel}</span>
            </button>

            {showRangePicker ? (
              <div
                className="absolute right-0 z-20 mt-3 w-[min(92vw,340px)] rounded-[1.5rem] border p-4"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  boxShadow: isDark ? "0 18px 36px rgba(0, 0, 0, 0.35)" : "0 18px 36px rgba(15, 23, 42, 0.12)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Choose reporting period
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Select a start and end date to update the dashboard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRangePicker(false)}
                    className="rounded-full p-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Start Date
                    </span>
                    <input
                      type="date"
                      value={draftRangeStart}
                      onChange={(event) => setDraftRangeStart(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </label>

                  <label className="block">
                    <span
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      End Date
                    </span>
                    <input
                      type="date"
                      value={draftRangeEnd}
                      onChange={(event) => setDraftRangeEnd(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetRange}
                    className="rounded-2xl border px-4 py-2.5 text-sm font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={applyRange}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white"
                    style={{ background: "#13357c" }}
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topCards.map((card) => {
            const Icon = card.icon;
            const deltaTone =
              card.label === "Total Outstanding Debt"
                ? dashboardData.outstandingDelta.tone
                : card.label === "Collections"
                  ? dashboardData.collectionsDelta.tone
                  : card.label === "Total Expenses"
                    ? dashboardData.expensesDelta.tone
                    : dashboardData.cashFlowDelta.tone;

            return (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className="rounded-[1.6rem] border p-5 text-left transition-transform hover:-translate-y-1"
                style={
                  card.solid
                    ? {
                        background: "linear-gradient(180deg, #13357c 0%, #0b2454 100%)",
                        borderColor: "#12316f",
                        color: "#ffffff",
                        boxShadow: "0 20px 36px rgba(11, 36, 84, 0.34)",
                      }
                    : {
                        background: "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.18em]"
                      style={{ color: card.solid ? "rgba(255,255,255,0.68)" : card.color }}
                    >
                      {card.label}
                    </p>
                    <p className="mt-5 text-3xl font-black tracking-tight">{card.value}</p>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{
                      background: card.solid ? "rgba(255,255,255,0.12)" : `${card.color}18`,
                      color: card.solid ? "#ffffff" : card.color,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: card.solid ? "#c7d2fe" : getDeltaColor(deltaTone) }}
                  >
                    {deltaTone === "positive" ? (
                      <TrendingUp size={14} />
                    ) : deltaTone === "negative" ? (
                      <TrendingDown size={14} />
                    ) : (
                      <ShieldCheck size={14} />
                    )}
                    {card.note}
                  </span>
                  <ArrowRight size={15} style={{ color: card.solid ? "#cbd5e1" : "var(--text-muted)" }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <section className="rounded-[2rem] border p-5 md:p-6" style={panelStyle}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Cash Flow Trends
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Collections vs. operational expenses for {dashboardData.rangeLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.12em]">
              <span className="inline-flex items-center gap-2" style={{ color: "#15803d" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#15803d" }} />
                Collections
              </span>
              <span className="inline-flex items-center gap-2" style={{ color: "#991b1b" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#991b1b" }} />
                Expenses
              </span>
            </div>
          </div>

          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.monthlySeries}
                margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                barGap={10}
              >
                <CartesianGrid vertical={false} stroke={isDark ? "rgba(148,163,184,0.12)" : "#e2e8f0"} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
                  tickFormatter={(value) => {
                    if (Number(value) >= 1000) {
                      return `${Math.round(Number(value) / 1000)}k`;
                    }
                    return `${value}`;
                  }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(Number(value), preferredCurrency),
                    name === "collections" ? "Collections" : "Expenses",
                  ]}
                  contentStyle={{
                    background: isDark ? "#12151d" : "#ffffff",
                    border: `1px solid ${isDark ? "#2f3747" : "#dbe2ea"}`,
                    borderRadius: "14px",
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.03)" }}
                />
                <Bar dataKey="collections" fill="#15803d" radius={[10, 10, 0, 0]} maxBarSize={26} />
                <Bar dataKey="expenses" fill="#991b1b" radius={[10, 10, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[2rem] border p-5 md:p-6" style={panelStyle}>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Command Center
            </h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Execute priority ledger operations and fiscal reporting
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {commandActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ background: `${action.accent}18`, color: action.accent }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {action.label}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              );
            })}
          </div>

          <div
            className="mt-5 rounded-2xl border px-4 py-4"
            style={{
              background: "linear-gradient(180deg, rgba(37,99,235,0.1) 0%, rgba(37,99,235,0.03) 100%)",
              borderColor: "rgba(37,99,235,0.2)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#2563eb" }}>
              Window Snapshot
            </p>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              {dashboardData.netCashFlow >= 0
                ? `${dashboardData.rangeLabel} is running with a positive operating swing. Collections are covering outflows in this reporting window.`
                : `${dashboardData.rangeLabel} is under pressure. Review outflows and overdue debtors from this reporting window to restore liquidity.`}
            </p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border p-5 md:p-6" style={panelStyle}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Overdue Portfolio
            </h2>
            <button
              type="button"
              onClick={() => navigate("/debtors")}
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--text-muted)" }}
            >
              View All Debtors
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {dashboardData.overdueDebtors.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate("/debtors")}
                className="w-full rounded-2xl border border-dashed px-4 py-10 text-center"
                style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                No overdue debtors for this reporting window. Open the debtor ledger to monitor balances.
              </button>
            ) : (
              dashboardData.overdueDebtors.map((debtor) => (
                <button
                  key={debtor.id}
                  type="button"
                  onClick={() => navigate(`/debtors/${debtor.id}`)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                      <TriangleAlert size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {debtor.debtorName}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-500">
                        Overdue {debtor.daysOverdue} day{debtor.daysOverdue === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(debtor.remaining, preferredCurrency)}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Open balance
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border p-5 md:p-6" style={panelStyle}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Recent Outflows
            </h2>
            <button
              type="button"
              onClick={() => navigate("/history")}
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--text-muted)" }}
            >
              Audit Full Log
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {dashboardData.recentOutflows.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate("/expenses")}
                className="w-full rounded-2xl border border-dashed px-4 py-10 text-center"
                style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                No expenses recorded for this reporting window. Open the expense form to log a fresh outflow.
              </button>
            ) : (
              dashboardData.recentOutflows.map((expense) => (
                <button
                  key={expense.id}
                  type="button"
                  onClick={() => navigate(`/expenses/${expense.id}`)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-500/12 text-slate-500">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {expense.subject || expense.merchant || "Expense entry"}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                        Category: {expense.category || "Uncategorized"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-500">
                      -{formatCurrency(Number(expense.amount || 0), expense.currency || preferredCurrency)}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {expense.parsedDate ? format(expense.parsedDate, "MMM dd, yyyy") : "No date"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <section
        className="rounded-[2rem] border p-6 md:p-8"
        style={{
          background: "linear-gradient(135deg, #163f96 0%, #0f2d6c 55%, #0a1f4c 100%)",
          borderColor: "#153776",
          color: "#ffffff",
          boxShadow: "0 24px 48px rgba(15, 45, 108, 0.34)",
        }}
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr_auto] xl:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
              Liquidity Recovery Horizon
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/85">
              Across {dashboardData.rangeLabel}, {dashboardData.recoveryRate}% of booked debt has already been
              recovered. Continue pressing overdue accounts and monitoring recent outflows to preserve cash discipline.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
              <span>Recovery Progress</span>
              <span>{dashboardData.recoveryRate}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, dashboardData.recoveryRate))}%`,
                  background: "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-blue-100/85">
              <span>{formatCurrency(dashboardData.totalRecovered, preferredCurrency)} recovered</span>
              <span>Total debt: {formatCurrency(dashboardData.totalDebtBook, preferredCurrency)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="text-right">
              <p className="text-3xl font-black">{dashboardData.recoveryRate}%</p>
              <p className="text-xs uppercase tracking-[0.16em] text-blue-100/80">
                {dashboardData.liquidityMessage}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/debtors")}
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold"
                style={{ background: "#ffffff", color: "#0f2d6c" }}
              >
                Review Debtors
              </button>
              <button
                type="button"
                onClick={() => navigate("/reports")}
                className="rounded-2xl border px-4 py-2.5 text-sm font-semibold text-white"
                style={{ borderColor: "rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)" }}
              >
                Open Reports
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
