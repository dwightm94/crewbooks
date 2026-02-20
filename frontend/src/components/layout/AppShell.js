"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Hammer, DollarSign, Settings, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Hammer },
  { href: "/money", label: "Money", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, title, subtitle, back, action }) {
  const { user, loading, init } = useAuth();
  const { init: themeInit } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { init(); themeInit(); }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
    </div>
  );

  if (!user) { if (typeof window !== "undefined") router.replace("/auth/login"); return null; }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
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
            {action}
          </div>
        </header>
      )}

      {/* Content */}
      <main className="pb-24 max-w-lg mx-auto px-4">{children}</main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-b" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
        <div className="flex justify-around max-w-lg mx-auto">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <button key={href} onClick={() => router.push(href)}
                className="flex-1 flex flex-col items-center py-2.5 transition-colors"
                style={{ color: active ? "var(--brand)" : "var(--muted)" }}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[11px] mt-0.5 font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
