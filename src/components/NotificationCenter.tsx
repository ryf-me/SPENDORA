import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, CheckCheck, ChevronRight, Clock3 } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

const toneStyles = {
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
} as const;

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, inAppEnabled, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const visibleNotifications = notifications.slice(0, 8);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-2xl border p-3 transition-colors"
        style={{
          background: "var(--bg-surface)",
          borderColor: open ? "#2563eb" : "var(--border)",
          color: unreadCount > 0 ? "#2563eb" : "var(--text-muted)",
        }}
        title="Notifications"
      >
        {unreadCount > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unreadCount > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "#dc2626" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.75rem] border shadow-2xl"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Notifications
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {inAppEnabled
                    ? unreadCount > 0
                      ? `${unreadCount} unread reminder${unreadCount === 1 ? "" : "s"}`
                      : "All reminders are read"
                    : "In-app alerts are turned off"}
                </p>
              </div>

              {inAppEnabled && notifications.length > 0 && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                  style={{ color: "#2563eb" }}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {!inAppEnabled ? (
            <div className="px-5 py-6">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                In-app alerts are disabled.
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Enable `In-app Alerts` in Settings to receive recurring expense reminders here.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: "#2563eb" }}
              >
                Open settings
                <ChevronRight size={16} />
              </button>
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
                No reminders right now
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Recurring expense reminders will appear here based on your early warning settings.
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-[24rem] overflow-y-auto px-3 py-3">
                <div className="space-y-2">
                  {visibleNotifications.map((notification) => {
                    const tone = toneStyles[notification.tone];
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          markAsRead(notification.id);
                          setOpen(false);
                          navigate("/recurring");
                        }}
                        className="w-full rounded-2xl border px-4 py-3 text-left transition-colors"
                        style={{
                          background: notification.read ? "var(--bg-surface)" : "var(--bg-elevated)",
                          borderColor: tone.borderColor,
                          opacity: notification.read ? 0.78 : 1,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                                style={{ background: tone.chipBg, color: tone.chipColor }}
                              >
                                {notification.tone}
                              </span>
                              {!notification.read && (
                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#2563eb" }}>
                                  New
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                              {notification.message}
                            </p>
                            <p className="mt-2 text-[11px] font-medium" style={{ color: tone.chipColor }}>
                              {notification.dueDate} · {notification.amountLabel}
                            </p>
                          </div>

                          {!notification.read ? (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "#2563eb" }} />
                          ) : (
                            <CheckCheck size={14} className="mt-1 shrink-0" style={{ color: "var(--text-muted)" }} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/recurring");
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "#2563eb" }}
                >
                  View recurring expenses
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
