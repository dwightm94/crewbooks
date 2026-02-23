"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Bell, DollarSign, FileText, AlertTriangle, CheckCircle2, Clock, ChevronRight } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function authFetch(path, opts = {}) {
  const { cognitoGetUser } = await import("@/lib/auth");
  const user = await cognitoGetUser();
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}`, ...opts.headers } });
  return res.json();
}

const ICONS = {
  payment_received: { icon: DollarSign, color: "var(--green)", bg: "rgba(34,197,94,0.1)" },
  invoice_sent: { icon: FileText, color: "var(--blue)", bg: "rgba(59,130,246,0.1)" },
  reminder: { icon: AlertTriangle, color: "var(--brand)", bg: "rgba(245,158,11,0.1)" },
  system: { icon: Bell, color: "var(--purple)", bg: "rgba(139,92,246,0.1)" },
  info: { icon: Bell, color: "var(--muted)", bg: "var(--input)" },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  const load = async () => {
    try {
      const data = await authFetch("/notifications");
      setNotifs(data.data?.notifications || []);
      setUnread(data.data?.unreadCount || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await authFetch("/notifications/read", { method: "PUT", body: JSON.stringify({ markAll: true }) });
    load();
  };

  const relTime = (d) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const action = unread > 0 ? (
    <button onClick={markAllRead} className="text-xs font-bold" style={{ color: "var(--brand)" }}>Mark all read</button>
  ) : null;

  return (
    <AppShell title="Notifications" back="/dashboard" action={action}>
      {loading ? (
        <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-20" />)}</div>
      ) : notifs.length === 0 ? (
        <div className="text-center mt-16">
          <Bell size={48} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <p className="mt-3 font-bold" style={{ color: "var(--text2)" }}>No notifications yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>You'll see payment alerts and reminders here</p>
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {notifs.map(n => {
            const { icon: Icon, color, bg } = ICONS[n.type] || ICONS.info;
            return (
              <button key={n.notifId}
                onClick={() => n.jobId ? router.push(`/jobs/${n.jobId}`) : null}
                className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all"
                style={{ background: n.read ? "var(--card)" : "rgba(245,158,11,0.04)", border: n.read ? "1px solid var(--border)" : "1px solid rgba(245,158,11,0.15)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>{n.title}</p>
                    <span className="text-[10px] font-medium shrink-0" style={{ color: "var(--muted)" }}>{relTime(n.createdAt)}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>{n.message}</p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ background: "var(--brand)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
