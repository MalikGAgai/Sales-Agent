"use client";

import { useState } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success" | "security";
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New API Key Generated",
    message: "Key 'Production-Gateway-V2' was created by Alex Morgan.",
    timestamp: "10 mins ago",
    type: "security",
    read: false,
  },
  {
    id: "notif-2",
    title: "New Project Provisioned",
    message: "Client website 'Acme E-Commerce Portal' onboarded.",
    timestamp: "42 mins ago",
    type: "success",
    read: false,
  },
  {
    id: "notif-3",
    title: "Rate Limit Threshold Warning",
    message: "API Key 'Staging-Tester' hit 85% of rate limit capacity.",
    timestamp: "2 hours ago",
    type: "warning",
    read: false,
  },
  {
    id: "notif-4",
    title: "Team Invitation Accepted",
    message: "Sarah Connor joined organization as Admin.",
    timestamp: "5 hours ago",
    type: "info",
    read: true,
  },
];

export function NotificationsTray() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredList = notifications.filter((n) => (filter === "unread" ? !n.read : true));

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getTypeStyle = (type: NotificationItem["type"]) => {
    switch (type) {
      case "security":
        return "bg-purple-500/15 text-purple-400 ring-purple-500/30";
      case "warning":
        return "bg-amber-500/15 text-amber-400 ring-amber-500/30";
      case "success":
        return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30";
      default:
        return "bg-blue-500/15 text-blue-400 ring-blue-500/30";
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md ring-2 ring-slate-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Tray */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400 ring-1 ring-blue-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="my-3 flex gap-1 rounded-lg bg-slate-800/50 p-1">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition ${
                  filter === "all" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition ${
                  filter === "unread" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No {filter === "unread" ? "unread" : ""} notifications
                </div>
              ) : (
                filteredList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`group relative flex items-start gap-3 rounded-xl p-3 transition cursor-pointer border ${
                      item.read
                        ? "border-slate-800/40 bg-slate-900/40 text-slate-400 hover:bg-slate-800/40"
                        : "border-blue-500/20 bg-slate-800/70 text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {!item.read && (
                      <span className="absolute left-1.5 top-3.5 h-2 w-2 rounded-full bg-blue-400" />
                    )}
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${getTypeStyle(
                        item.type
                      )}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 pr-4">
                      <p className="text-xs font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{item.message}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{item.timestamp}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="absolute right-2 top-2 rounded-md p-1 text-slate-500 opacity-0 transition hover:bg-slate-700 hover:text-slate-300 group-hover:opacity-100"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
