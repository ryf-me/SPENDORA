import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck, ChevronRight, Clock3 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NotificationTone = "default" | "upcoming" | "due" | "review";

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  badgeLabel?: string;
  meta?: string;
  tone?: NotificationTone;
};

type EmptyState = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onSelect: (notification: Notification) => void;
}

const toneConfig: Record<NotificationTone, { chipBg: string; chipColor: string; borderColor: string }> = {
  default: {
    chipBg: "rgba(148, 163, 184, 0.15)",
    chipColor: "var(--text-primary)",
    borderColor: "var(--border)",
  },
  upcoming: {
    chipBg: "rgba(37, 99, 235, 0.12)",
    chipColor: "#2563eb",
    borderColor: "rgba(37, 99, 235, 0.16)",
  },
  due: {
    chipBg: "rgba(239, 68, 68, 0.12)",
    chipColor: "#dc2626",
    borderColor: "rgba(239, 68, 68, 0.16)",
  },
  review: {
    chipBg: "rgba(245, 158, 11, 0.15)",
    chipColor: "#d97706",
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, index, onSelect }) => {
  const tone = toneConfig[notification.tone ?? "default"];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.24, delay: index * 0.05 }}
      className="w-full rounded-2xl border px-4 py-3 text-left transition-colors"
      style={{
        background: notification.read ? "var(--bg-surface)" : "var(--bg-elevated)",
        borderColor: tone.borderColor,
        opacity: notification.read ? 0.8 : 1,
      }}
      onClick={() => onSelect(notification)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {notification.badgeLabel && (
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ background: tone.chipBg, color: tone.chipColor }}
              >
                {notification.badgeLabel}
              </span>
            )}
            {!notification.read && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#2563eb" }}>
                New
              </span>
            )}
          </div>

          <div className="mt-2 flex items-start gap-2">
            {!notification.read && (
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#2563eb" }} />
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {notification.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {notification.description}
              </p>
              {notification.meta && (
                <p className="mt-2 text-[11px] font-medium" style={{ color: tone.chipColor }}>
                  {notification.meta}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            {notification.timestamp.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
          {notification.read ? (
            <CheckCheck size={14} className="ml-auto mt-2" style={{ color: "var(--text-muted)" }} />
          ) : null}
        </div>
      </div>
    </motion.button>
  );
};

interface NotificationPopoverProps {
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  buttonClassName?: string;
  popoverClassName?: string;
  headerTitle?: string;
  headerDescription?: string;
  footerActionLabel?: string;
  onFooterAction?: () => void;
  emptyState?: EmptyState;
  disabled?: boolean;
  disabledState?: EmptyState;
  maxVisible?: number;
}

const dummyNotifications: Notification[] = [
  {
    id: "1",
    title: "New Message",
    description: "You have received a new message from John Doe",
    timestamp: new Date(),
    read: false,
  },
  {
    id: "2",
    title: "System Update",
    description: "System maintenance scheduled for tomorrow",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: false,
  },
];

export const NotificationPopover = ({
  notifications = dummyNotifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  buttonClassName,
  popoverClassName,
  headerTitle = "Notifications",
  headerDescription,
  footerActionLabel,
  onFooterAction,
  emptyState,
  disabled = false,
  disabledState,
  maxVisible = 8,
}: NotificationPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  const visibleNotifications = useMemo(
    () => notifications.slice(0, maxVisible),
    [maxVisible, notifications],
  );
  const derivedUnreadCount = unreadCount ?? notifications.filter((notification) => !notification.read).length;

  const handleToggle = () => setIsOpen((value) => !value);

  const handleSelect = (notification: Notification) => {
    onMarkAsRead?.(notification.id);
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  const handleMarkAll = () => {
    onMarkAllAsRead?.();
  };

  const description =
    headerDescription ??
    (disabled
      ? "Notifications are currently unavailable."
      : derivedUnreadCount > 0
        ? `${derivedUnreadCount} unread reminder${derivedUnreadCount === 1 ? "" : "s"}`
        : "All reminders are read");

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        onClick={handleToggle}
        size="icon"
        variant="outline"
        className={cn(
          "relative h-11 w-11 rounded-2xl border transition-colors",
          buttonClassName,
        )}
        style={{
          background: "var(--bg-surface)",
          borderColor: isOpen ? "#2563eb" : "var(--border)",
          color: derivedUnreadCount > 0 ? "#2563eb" : "var(--text-muted)",
        }}
      >
        {derivedUnreadCount > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {derivedUnreadCount > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "#111827", border: "1px solid rgba(17,24,39,0.7)" }}
          >
            {derivedUnreadCount > 9 ? "9+" : derivedUnreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute right-0 top-full z-50 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.75rem] border shadow-2xl",
              popoverClassName,
            )}
            style={{
              background: "color-mix(in srgb, var(--bg-surface) 92%, transparent)",
              borderColor: "var(--border)",
              backdropFilter: "blur(18px)",
            }}
          >
            <div className="flex items-center justify-between gap-4 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {headerTitle}
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {description}
                </p>
              </div>

              {!disabled && visibleNotifications.length > 0 && derivedUnreadCount > 0 && (
                <Button
                  onClick={handleMarkAll}
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 py-0 text-xs font-semibold text-blue-600 hover:bg-transparent hover:text-blue-500"
                >
                  Mark all as read
                </Button>
              )}
            </div>

            {disabled ? (
              <div className="px-5 py-6">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {disabledState?.title ?? "Notifications are disabled."}
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {disabledState?.description ?? "Enable notifications to see alerts here."}
                </p>
                {disabledState?.actionLabel && disabledState.onAction && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      disabledState.onAction?.();
                      setIsOpen(false);
                    }}
                    className="mt-4 h-auto px-0 py-0 text-sm font-semibold text-blue-600 hover:bg-transparent hover:text-blue-500"
                  >
                    {disabledState.actionLabel}
                    <ChevronRight size={16} />
                  </Button>
                )}
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                >
                  <Clock3 size={20} />
                </div>
                <p className="mt-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {emptyState?.title ?? "No notifications right now"}
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {emptyState?.description ?? "You are all caught up."}
                </p>
                {emptyState?.actionLabel && emptyState.onAction && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      emptyState.onAction?.();
                      setIsOpen(false);
                    }}
                    className="mt-4 h-auto px-0 py-0 text-sm font-semibold text-blue-600 hover:bg-transparent hover:text-blue-500"
                  >
                    {emptyState.actionLabel}
                    <ChevronRight size={16} />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="max-h-[24rem] space-y-2 overflow-y-auto px-3 py-3">
                  {visibleNotifications.map((notification, index) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      index={index}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>

                {footerActionLabel && onFooterAction && (
                  <div className="border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        onFooterAction();
                        setIsOpen(false);
                      }}
                      className="h-auto px-0 py-0 text-sm font-semibold text-blue-600 hover:bg-transparent hover:text-blue-500"
                    >
                      {footerActionLabel}
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
