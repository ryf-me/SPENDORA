import { addDays, addMonths, addWeeks, addYears, endOfDay, isAfter, isBefore, startOfDay } from "date-fns";
import type { Expense, RecurringFrequency, RecurringStatus } from "../context/DataContext";

export interface RecurringOccurrence {
  expense: Expense;
  date: Date;
  key: string;
}

const MAX_RECURRENCE_ITERATIONS = 600;

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
}

function addRecurringInterval(date: Date, frequency: RecurringFrequency) {
  switch (frequency) {
    case "Weekly":
      return addWeeks(date, 1);
    case "Yearly":
      return addYears(date, 1);
    case "Monthly":
    default:
      return addMonths(date, 1);
  }
}

export function getRecurringFrequency(expense: Expense): RecurringFrequency {
  switch (expense.frequency) {
    case "Weekly":
    case "Yearly":
      return expense.frequency;
    case "Monthly":
    default:
      return "Monthly";
  }
}

export function getRecurringStatus(expense: Expense): RecurringStatus {
  return expense.recurringStatus === "paused" ? "paused" : "active";
}

export function isRecurringExpense(expense: Expense) {
  return Boolean(expense.isRecurring);
}

export function getRecurringEndDate(expense: Expense) {
  const endDate = parseDate(expense.endDate);
  return endDate ? endOfDay(endDate) : null;
}

export function getNextRecurringDate(expense: Expense, referenceDate = new Date()) {
  if (!expense.isRecurring) return null;

  const anchorDate = parseDate(expense.date);
  if (!anchorDate) return null;

  const frequency = getRecurringFrequency(expense);
  const reference = startOfDay(referenceDate);
  const endDate = getRecurringEndDate(expense);

  let current = anchorDate;
  let iterationCount = 0;

  while (isBefore(current, reference) && iterationCount < MAX_RECURRENCE_ITERATIONS) {
    current = addRecurringInterval(current, frequency);
    iterationCount += 1;
  }

  if (endDate && isAfter(current, endDate)) {
    return null;
  }

  return current;
}

export function getRecurringOccurrencesInRange(expense: Expense, rangeStart: Date, rangeEnd: Date) {
  if (!expense.isRecurring) return [];

  const anchorDate = parseDate(expense.date);
  if (!anchorDate) return [];

  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);
  const frequency = getRecurringFrequency(expense);
  const endDate = getRecurringEndDate(expense);

  let current = anchorDate;
  let iterationCount = 0;

  while (isBefore(current, start) && iterationCount < MAX_RECURRENCE_ITERATIONS) {
    current = addRecurringInterval(current, frequency);
    iterationCount += 1;
  }

  const occurrences: Date[] = [];

  while (!isAfter(current, end) && iterationCount < MAX_RECURRENCE_ITERATIONS) {
    if (!endDate || !isAfter(current, endDate)) {
      occurrences.push(current);
    }

    current = addRecurringInterval(current, frequency);
    iterationCount += 1;
  }

  return occurrences;
}

export function getUpcomingRecurringOccurrences(
  expenses: Expense[],
  referenceDate = new Date(),
  daysAhead = 30,
) {
  const start = startOfDay(referenceDate);
  const end = endOfDay(addDays(start, Math.max(daysAhead - 1, 0)));

  return buildRecurringOccurrences(expenses, start, end);
}

export function buildRecurringOccurrences(
  expenses: Expense[],
  rangeStart: Date,
  rangeEnd: Date,
  options?: { includePaused?: boolean },
) {
  return expenses.flatMap((expense) => {
    if (!expense.isRecurring) return [];
    if (!options?.includePaused && getRecurringStatus(expense) === "paused") return [];

    return getRecurringOccurrencesInRange(expense, rangeStart, rangeEnd).map((date) => ({
      expense,
      date,
      key: `${expense.id}-${date.toISOString().split("T")[0]}`,
    }));
  });
}

export function getRecurringStatusLabel(expense: Expense, referenceDate = new Date()) {
  if (!expense.isRecurring) return "One-time";
  if (getRecurringStatus(expense) === "paused") return "Paused";
  if (!getNextRecurringDate(expense, referenceDate)) return "Completed";
  return "Active";
}

export function toMonthlyRecurringAmount(expense: Expense) {
  const amount = Number(expense.amount) || 0;
  switch (getRecurringFrequency(expense)) {
    case "Weekly":
      return (amount * 52) / 12;
    case "Yearly":
      return amount / 12;
    case "Monthly":
    default:
      return amount;
  }
}
