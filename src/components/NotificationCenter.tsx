import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  NotificationPopover,
  type Notification as PopoverNotification,
} from "@/components/ui/notification-popover";
import { useNotifications } from "../context/NotificationContext";

function titleCaseTone(tone: string) {
  return tone.charAt(0).toUpperCase() + tone.slice(1);
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, inAppEnabled, markAsRead, markAllAsRead } = useNotifications();

  const visibleNotifications = useMemo<PopoverNotification[]>(
    () =>
      notifications.slice(0, 8).map((notification) => ({
        id: notification.id,
        title: notification.title,
        description: notification.message,
        timestamp: new Date(Date.now() + notification.daysUntilDue * 24 * 60 * 60 * 1000),
        read: notification.read,
        badgeLabel: titleCaseTone(notification.tone),
        meta: `${notification.dueDate} · ${notification.amountLabel}`,
        tone: notification.tone,
      })),
    [notifications],
  );

  return (
    <NotificationPopover
      notifications={visibleNotifications}
      unreadCount={unreadCount}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onNotificationClick={(notification) => {
        markAsRead(notification.id);
        navigate("/recurring");
      }}
      headerDescription={
        inAppEnabled
          ? unreadCount > 0
            ? `${unreadCount} unread reminder${unreadCount === 1 ? "" : "s"}`
            : "All reminders are read"
          : "In-app alerts are turned off"
      }
      disabled={!inAppEnabled}
      disabledState={{
        title: "In-app alerts are disabled.",
        description:
          "Enable In-app Alerts in Settings to receive recurring expense reminders here.",
        actionLabel: "Open settings",
        onAction: () => navigate("/settings"),
      }}
      emptyState={{
        title: "No reminders right now",
        description:
          "Recurring expense reminders will appear here based on your early warning settings.",
      }}
      footerActionLabel={visibleNotifications.length > 0 ? "View recurring expenses" : undefined}
      onFooterAction={visibleNotifications.length > 0 ? () => navigate("/recurring") : undefined}
    />
  );
}
