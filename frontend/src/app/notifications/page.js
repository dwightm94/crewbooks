"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getNotifications, markNotificationsRead } from "@/lib/api";
import { Bell, DollarSign, Send, AlertCircle, Info, CheckCircle2 } from "lucide-react";

const ICONS = {
  payment_received: { icon: DollarSign, color: "#22C55E" },
  invoice_sent: { icon: Send, color: "#3B82F6" },
  reminder: { icon: AlertCircle, color: "#F59E0B" },
  system: { icon: Info, color: "#8B5CF6" },
  info: { icon: Info, color: "#6B7280" },
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getNotifications();
      setNotifs(data.notifications || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (notifId) => {
    try { await markNotificationsRead({ notifId }); load(); } catch {}
  };

  const markAllRead = async () => {
    try { await markNotificationsRead({ markAll: true }); load(); } catch {}
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <AppShell title="Notifications" action={unread > 0 ? { label: "Mark All Read", icon: CheckCircle2, onClick: markAllRead } : null}>
      {loading ? (
        <div className="flex justify-center py-12"><span className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin" style={{ color: "var(--brand)" }} /></div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
          <p className="font-bold text-lg" style={{ color: "var(--text)" }}>No notifications</p>
          <p style={{ color: "var(--muted)" }}>You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => {
            const cfg = ICONS[n.type] || ICONS.info;
            const Icon = cfg.icon;
            return (
              <div key={n.notifId} onClick={() => !n.read && markRead(n.notifId)}
                className="card flex items-start gap-3 cursor-pointer"
                style={{ opacity: n.read ? 0.6 : 1, borderLeft: n.read ? "none" : "3px solid var(--brand)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: cfg.color + "15" }}>
                  <Icon size={20} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{n.title}</p>
                  <p className="text-sm" style={{ color: "var(--text2)" }}>{n.message}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2" style={{ background: "var(--brand)" }} />}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
