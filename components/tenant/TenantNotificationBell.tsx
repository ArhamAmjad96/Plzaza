"use client";

import { useState, useEffect, useRef } from "react";
import { TenantNotificationItem } from "@/lib/notifications/service";
import {
  Bell,
  CheckCheck,
  Zap,
  CreditCard,
  AlertTriangle,
  AlertCircle,
  Clock,
  Wrench,
  Info,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface TenantNotificationBellProps {
  tenantId?: string | number | null;
}

export default function TenantNotificationBell({ tenantId }: TenantNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<TenantNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    if (!tenantId) return;
    try {
      const res = await fetch("/api/tenant/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [tenantId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAsRead(id: string | number) {
    try {
      await fetch(`/api/tenant/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id.toString() === id.toString() ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }

  async function handleMarkAllAsRead() {
    setLoading(true);
    try {
      await fetch("/api/tenant/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "RENT_CREATED":
        return <CreditCard size={15} className="text-[#8FA66B]" />;
      case "RENT_REMINDER":
        return <Clock size={15} className="text-[#E0A96D]" />;
      case "RENT_DUE_TODAY":
        return <AlertCircle size={15} className="text-[#FF704D]" />;
      case "RENT_OVERDUE":
        return <AlertTriangle size={15} className="text-[#E63946]" />;
      case "ELECTRICITY_BILL_AVAILABLE":
        return <Zap size={15} className="text-[#8FA66B]" />;
      case "MAINTENANCE_UPDATE":
        return <Wrench size={15} className="text-[#64B5F6]" />;
      default:
        return <Info size={15} className="text-[#CBD4BC]" />;
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-[#CBD4BC] hover:text-[#F4F7F2] hover:bg-[#24332D] transition cursor-pointer"
        title="Tenant Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#FF704D] text-[10px] font-bold text-[#17211D]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#1B2521] border border-[#32433B] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 bg-[#24332D] border-b border-[#32433B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F4F7F2]">Resident Alerts</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF704D]/20 text-[#FF704D] text-[10px] font-mono font-bold">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[11px] text-[#8FA66B] hover:text-[#B8C3A4] flex items-center gap-1 cursor-pointer font-mono"
              >
                {loading ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={13} />}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#32433B]/50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A0B0A5]">
                <Bell size={24} className="mx-auto mb-2 opacity-30 text-[#CBD4BC]" />
                <p>No notifications at this time.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`p-3.5 px-4 transition flex gap-3 items-start cursor-pointer ${
                    n.read ? "bg-[#1B2521] hover:bg-[#24332D]/50" : "bg-[#24332D]/70 hover:bg-[#24332D]"
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[#17211D] border border-[#32433B] shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          n.read ? "text-[#CBD4BC] font-medium" : "text-[#F4F7F2] font-bold"
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#FF704D] shrink-0" />}
                    </div>
                    <p className="text-[11px] text-[#A0B0A5] line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] font-mono text-[#58655E]">
                        {new Date(n.created_at).toLocaleDateString("en-PK", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {n.href && (
                        <Link
                          href={n.href}
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] text-[#8FA66B] hover:underline flex items-center gap-0.5"
                        >
                          <span>View</span>
                          <ChevronRight size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
