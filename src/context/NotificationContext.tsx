import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import { formatCurrency } from "../utils/format";
import { getNextRecurringDate, getRecurringStatus, isRecurringExpense } from "../utils/recurring";

type NotificationTone = "upcoming" | "due" | "review";

export interface AppNotification {
  id: string;
  expenseId: string;
  title: string;
  message: string;
  dueDate: string;
  amountLabel: string;
  tone: NotificationTone;
  daysUntilDue: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  inAppEnabled: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function storageKeyForUser(userId?: string) {
  return userId ? `spendora-read-notifications:${userId}` : null;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, profileData } = useAuth();
  const { expenses } = useData();
  const [readMap, setReadMap] = useState<Record<string, true>>({});

  const inAppEnabled = profileData?.notifications?.inApp ?? true;
  const earlyWarningDays = Number.parseInt(profileData?.notifications?.earlyWarning || "3", 10) || 3;
  const paymentDay = profileData?.notifications?.paymentDay || "due";

  useEffect(() => {
    const key = storageKeyForUser(currentUser?.uid);
    if (!key) {
      setReadMap({});
      return;
    }

    const raw = localStorage.getItem(key);
    if (!raw) {
      setReadMap({});
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, true>;
      setReadMap(parsed || {});
    } catch {
      setReadMap({});
    }
  }, [currentUser?.uid]);

  const notifications = useMemo(() => {
    if (!currentUser || !inAppEnabled) return [];

    const today = startOfDay(new Date());

    return expenses
      .filter((expense) => isRecurringExpense(expense))
      .filter((expense) => getRecurringStatus(expense) === "active")
      .filter((expense) => expense.recurringNotifications ?? true)
      .map((expense) => {
        const nextDate = getNextRecurringDate(expense, today);
        if (!nextDate) return null;

        const daysUntilDue = differenceInCalendarDays(nextDate, today);
        if (daysUntilDue < 0 || daysUntilDue > earlyWarningDays) return null;

        let tone: NotificationTone = "upcoming";
        let title = `${expense.subject} is due soon`;
        let message = `${expense.merchant} will charge ${formatCurrency(expense.amount, expense.currency)} on ${format(nextDate, "MMM d, yyyy")}.`;

        if (daysUntilDue === 0) {
          if (paymentDay === "processed") {
            tone = "review";
            title = `${expense.subject} needs a payment check today`;
            message = `Review ${expense.merchant} after today's scheduled payment of ${formatCurrency(expense.amount, expense.currency)} is processed.`;
          } else {
            tone = "due";
            title = `${expense.subject} is due today`;
            message = `${expense.merchant} is scheduled to charge ${formatCurrency(expense.amount, expense.currency)} today.`;
          }
        } else if (daysUntilDue === 1) {
          title = `${expense.subject} is due tomorrow`;
          message = `${expense.merchant} is scheduled to charge ${formatCurrency(expense.amount, expense.currency)} tomorrow.`;
        } else {
          title = `${expense.subject} is due in ${daysUntilDue} days`;
        }

        const id = `${expense.id}:${format(nextDate, "yyyy-MM-dd")}:${tone}`;

        return {
          id,
          expenseId: expense.id,
          title,
          message,
          dueDate: format(nextDate, "MMM d, yyyy"),
          amountLabel: formatCurrency(expense.amount, expense.currency),
          tone,
          daysUntilDue,
          read: Boolean(readMap[id]),
        } satisfies AppNotification;
      })
      .filter((item): item is AppNotification => Boolean(item))
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue || a.title.localeCompare(b.title));
  }, [currentUser, earlyWarningDays, expenses, inAppEnabled, paymentDay, readMap]);

  useEffect(() => {
    const key = storageKeyForUser(currentUser?.uid);
    if (!key) return;

    const validIds = new Set(notifications.map((notification) => notification.id));
    const nextReadMap = Object.fromEntries(
      Object.entries(readMap).filter(([id]) => validIds.has(id)),
    ) as Record<string, true>;

    const changed =
      Object.keys(nextReadMap).length !== Object.keys(readMap).length ||
      Object.keys(nextReadMap).some((id) => !readMap[id]);

    if (changed) {
      setReadMap(nextReadMap);
      localStorage.setItem(key, JSON.stringify(nextReadMap));
    }
  }, [currentUser?.uid, notifications, readMap]);

  const persistReadMap = (nextReadMap: Record<string, true>) => {
    setReadMap(nextReadMap);
    const key = storageKeyForUser(currentUser?.uid);
    if (key) {
      localStorage.setItem(key, JSON.stringify(nextReadMap));
    }
  };

  const markAsRead = (id: string) => {
    if (readMap[id]) return;
    persistReadMap({ ...readMap, [id]: true });
  };

  const markAllAsRead = () => {
    const nextReadMap = notifications.reduce<Record<string, true>>((acc, notification) => {
      acc[notification.id] = true;
      return acc;
    }, {});
    persistReadMap(nextReadMap);
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        inAppEnabled,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
