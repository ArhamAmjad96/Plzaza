use client;

import { useState, useEffect, useRef } from react;
import Link from next/link;
import { useRouter } from next/navigation;
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Building2,
  Users,
  CreditCard,
  Zap,
  Wrench,
  Receipt,
  Sparkles,
  Sliders,
  X,
  History,
} from lucide-react;
import { markNotificationsAsReadAction } from @/app/logs/actions;

interface NotificationItem {
  id: string | number;
  category: string;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  initialNotifications?: NotificationItem[];
  initialUnreadCount?: number;
}

export default function NotificationBell({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [marking, setMarking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener(mousedown, handleClickOutside);
    }
    return () => {
      document.removeEventListener(mousedown, handleClickOutside);
    };
  }, [isOpen]);

  async function handleMarkAllAsRead() {
    setMarking(true);
    try {
      await markNotificationsAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      router.refresh();
    } finally {
      setMarking(false);
    }
  }

  async function handleNotificationClick(notif: NotificationItem) {
    if (!notif.read) {
      await markNotificationsAsReadAction(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
  }

  function getCategoryIcon(cat: string) {
    switch (cat?.toUpperCase()) {
      case PLAZA:
        return <Building2 size={16} className=text-[#FF704D] />;
      case UNITS:
        return <Building2 size={16} className=text-[#2D5A27] />;
      case TENANTS:
        return <Users size={16} className=text-[#3B82F6] />;
      case PAYMENTS:
        return <CreditCard size={16} className=text-[#10B981] />;
      case ELECTRICITY:
        return <Zap size={16} className=text-[#F59E0B] />;
      case MAINTENANCE:
        return <Wrench size={16} className=text-[#EF4444] />;
      case EXPENSES:
        return <Receipt size={16} className=text-[#8B5CF6] />;
      default:
        return <Sparkles size={16} className=text-[#FF704D] />;
    }
  }

  function formatTimeAgo(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return Just now;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return ${diffMin}m ago;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return ${diffHours}h ago;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return Yesterday;
    if (diffDays < 7) return ${diffDays}d ago;
    return d.toLocaleDateString();
  }

  return (
    <div className=relative ref={dropdownRef}>
      {/* ─── Notification Trigger Bell ─── */}
      <button
        type=button
        onClick={() => setIsOpen(!isOpen)}
        aria-label=View notifications
        className=relative h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] hover:border-[#8FA66B] flex items-center justify-center text-[#17211D] transition-all hover:bg-[#E8EDD9] shadow-xs active:scale-95
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className=absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF704D] px-1 text-[10px] font-bold font-mono text-white shadow-xs animate-pulse>
            {unreadCount > 9 ? 9+ : unreadCount}
          </span>
        )}
      </button>

      {/* ─── Notification Dropdown Panel ─── */}
      {isOpen && (
        <div className=absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-2xl z-50 overflow-hidden text-[#17211D] animate-in fade-in zoom-in-95 duration-150>
          {/* Header */}
          <div className=flex items-center justify-between px-5 py-4 border-b border-[#CBD4BC]/70 bg-[#F4F7F2]>
            <div className=flex items-center gap-2>
              <div className=h-7 w-7 rounded-xl bg-[#24332D] text-[#FF704D] flex items-center justify-center>
                <Bell size={14} />
              </div>
              <h3 className=text-sm font-bold text-[#17211D]>Notifications</h3>
              {unreadCount > 0 && (
                <span className=px-2 py-0.5 rounded-full bg-[#FF704D]/15 text-[#FF704D] text-[10.5px] font-bold font-mono>
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type=button
                onClick={handleMarkAllAsRead}
                disabled={marking}
                className=text-[11px] font-medium text-[#58655E] hover:text-[#17211D] flex items-center gap-1 transition
              >
                <CheckCheck size={13} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className=max-h-80 overflow-y-auto divide-y divide-[#CBD4BC]/40>
            {notifications.length === 0 ? (
              <div className=py-10 px-4 text-center space-y-2>
                <div className=h-10 w-10 rounded-2xl bg-[#E8EDD9] text-[#58655E] mx-auto flex items-center justify-center>
                  <Check size={20} />
                </div>
                <p className=text-sm font-bold text-[#17211D]>All caught up!</p>
                <p className=text-xs text-[#58655E]>No new notifications to show.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.href || /logs}
                  onClick={() => handleNotificationClick(notif)}
                  className={lock p-4 transition hover:bg-[#E8EDD9]/60 }
                >
                  <div className=flex items-start gap-3>
                    <div className=mt-0.5 h-8 w-8 rounded-xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-center shrink-0>
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div className=flex-1 min-w-0 space-y-1>
                      <div className=flex items-center justify-between gap-1>
                        <span className=text-[10px] font-mono font-bold uppercase tracking-wider text-[#8FA66B]>
                          {notif.category}
                        </span>
                        <span className=text-[10px] text-[#85918A] shrink-0 font-mono>
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className=text-xs font-bold text-[#17211D] leading-tight truncate>
                        {notif.title}
                      </p>
                      <p className=text-[11.5px] text-[#58655E] line-clamp-2 leading-relaxed>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer View All Logs */}
          <div className=p-3 border-t border-[#CBD4BC]/70 bg-[#F4F7F2] text-center>
            <Link
              href=/logs
              onClick={() => setIsOpen(false)}
              className=w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-[#17211D] bg-[#E8EDD9] hover:bg-[#CBD4BC] transition
            >
              <History size={13} />
              <span>View Full Audit Logs</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
