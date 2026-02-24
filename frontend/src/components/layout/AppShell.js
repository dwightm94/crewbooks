"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Hammer, Users, Calendar, Receipt, Settings, ChevronLeft, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Hammer },
  { href: "/crew", label: "Crew", icon: Users },
  { href: "/schedule", label: "Plan", icon: Calendar },
  { href: "/billing", label: "Billing", icon: Receipt },
];

function NotifBellInline() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const check = async () => {
      try {
        const stored = localStorage.getItem("crewbooks_tokens");
        if (!stored) return;
        const tokens = JSON.parse(stored);
        const token = tokens?.idToken || tokens?.IdToken || tokens?.token;
        if (!token) return;
        const BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(BASE + "/notifications", { headers: { Authorization: "Bearer " + token } });
        const json = await res.json();
        setCount(json.data?.unreadCount || 0);
      } catch {}
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);
  return (
    <button onClick={() => window.location.href = "/notifications"} className="relative p-2 rounded-xl" style={{ color: "var(--text2)" }}>
      <Bell size={22} />
      {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1" style={{ background: "#EF4444" }}>{count > 9 ? "9+" : count}</span>}
    </button>
  );
}

export function AppShell({ children, title, subtitle, back, action }) {
  const { user, loading, init, logout } = useAuth();
  const { init: themeInit } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => { init(); themeInit(); }, []);

  const handleLogout = () => { logout(); window.location.href = "/auth/login"; };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
    </div>
  );
  if (!user) { if (typeof window !== "undefined") window.location.href = "/auth/login"; return null; }
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {title && (
        <header className="sticky top-0 z-40 px-4 py-3" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-1">
              {back && <button onClick={() => router.push(back)} className="-ml-2 p-2 rounded-xl active:scale-95" style={{ color: "var(--text2)" }}><ChevronLeft size={26} /></button>}
              <div>
                <h1 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>{title}</h1>
                {subtitle && <p className="text-sm" style={{ color: "var(--text2)" }}>{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {action}
              <NotifBellInline />
              <button onClick={handleLogout} className="p-2 rounded-xl" style={{ color: "var(--text2)" }} title="Sign Out"><LogOut size={20} /></button>
            </div>
          </div>
        </header>
      )}
      <main className="pb-24 max-w-lg mx-auto px-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-b" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
        <div className="flex justify-around max-w-lg mx-auto">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} prefetch={true}
                className="flex-1 flex flex-col items-center py-2 transition-colors"
                style={{ color: active ? "var(--brand)" : "var(--muted)" }}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] mt-0.5 font-bold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
