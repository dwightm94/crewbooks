"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Hammer, Users, Calendar, Receipt, Settings,
  ChevronLeft, Bell, LogOut, Shield, BarChart3, Plus, Search,
  UserCircle, Menu, X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

/* ── Navigation Items ── */
const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Hammer },
  { href: "/crew", label: "Crew", icon: Users },
  { href: "/schedule", label: "Plan", icon: Calendar },
  { href: "/billing", label: "Billing", icon: Receipt },
];

const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/jobs", label: "Jobs", icon: Hammer },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/billing", label: "Invoices", icon: Receipt },
  { href: "/crew", label: "Crew", icon: UserCircle },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/compliance", label: "Compliance", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

/* ── Notification Bell (unchanged) ── */
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
        const res = await fetch(BASE + "/notifications", {
          headers: { Authorization: "Bearer " + token },
        });
        const json = await res.json();
        setCount(json.data?.unreadCount || 0);
      } catch {}
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);
  return (
    <button
      onClick={() => (window.location.href = "/notifications")}
      className="relative p-2 rounded-xl"
      style={{ color: "var(--text2)" }}
    >
      <Bell size={22} />
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
          style={{ background: "#EF4444" }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

/* ── Main AppShell ── */
export function AppShell({ children, title, subtitle, back, action }) {
  const { user, loading, init, logout } = useAuth();
  const { init: themeInit } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    init();
    themeInit();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = `https://crewbooks-auth.auth.us-east-1.amazoncognito.com/logout?client_id=48bj43ff24j0li5vsp15guk81s&logout_uri=${encodeURIComponent(
      "https://crewbooksapp.com/auth/login"
    )}`;
  };

  /* Loading */
  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{
            borderColor: "var(--brand)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );

  /* Not logged in */
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    return null;
  }

  const isActive = (href) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <style>{`
        /* Sidebar — desktop only */
        .cb-sidebar {
          display: none;
          width: 232px;
          min-height: 100vh;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          background: var(--card);
          border-right: 1px solid var(--border);
          z-index: 30;
        }
        .cb-layout { display: flex; min-height: 100vh; }
        .cb-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        /* Desktop header */
        .cb-d-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 28px;
          background: var(--card);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        /* Mobile header — same as before */
        .cb-m-header {
          display: block;
        }

        /* Mobile bottom nav — same as before */
        .cb-m-nav {
          display: block;
        }

        /* Desktop overrides */
        @media (min-width: 769px) {
          .cb-sidebar { display: flex; }
          .cb-d-header { display: flex; }
          .cb-m-header { display: none !important; }
          .cb-m-nav { display: none !important; }
          .cb-content { padding: 24px 28px; }
          .cb-content-inner { max-width: 900px; }
        }

        /* Mobile overrides */
        @media (max-width: 768px) {
          .cb-content { padding-bottom: 96px; }
          .cb-content-inner { max-width: 480px; margin: 0 auto; padding: 0 16px; }
        }

        /* Sidebar nav item */
        .sb-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 500;
          font-family: inherit;
          margin-bottom: 1px;
          transition: all 0.12s;
          text-decoration: none;
          background: transparent;
          color: var(--text2);
        }
        .sb-item:hover { background: var(--bg2); }
        .sb-item.active {
          background: var(--brand-light);
          color: var(--brand);
          font-weight: 600;
        }
      `}</style>

      <div className="cb-layout">
        {/* ═══ SIDEBAR (desktop) ═══ */}
        <aside className="cb-sidebar">
          {/* Logo */}
          <div
            style={{
              padding: "18px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background:
                  "linear-gradient(135deg, var(--brand), var(--brand-hover))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0F172A",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 2px 10px rgba(245,158,11,0.3)",
              }}
            >
              CB
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                }}
              >
                CrewBooks
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Job Management
              </div>
            </div>
          </div>

          {/* New Job button */}
          <div style={{ padding: "14px 10px 4px" }}>
            <Link
              href="/jobs/new"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "10px",
                borderRadius: 10,
                background: "var(--brand)",
                color: "#0F172A",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(245,158,11,0.25)",
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              New Job
            </Link>
          </div>

          {/* Nav items */}
          <nav style={{ padding: "8px 10px", flex: 1 }}>
            {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={`sb-item ${isActive(href) ? "active" : ""}`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive(href) ? 2.2 : 1.6}
                />
                {label}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div
            style={{
              padding: "14px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background:
                  "linear-gradient(135deg, var(--brand), var(--brand-hover))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0F172A",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "U"}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                }}
              >
                {user?.name || "User"}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Owner</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg"
              style={{ color: "var(--muted)" }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* ═══ MAIN AREA ═══ */}
        <div className="cb-main">
          {/* Desktop header */}
          <header className="cb-d-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {back && (
                <button
                  onClick={() => router.push(back)}
                  className="p-2 rounded-xl active:scale-95"
                  style={{ color: "var(--text2)" }}
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              <div>
                {title && title !== "CrewBooks" && (
                  <h1
                    className="text-xl font-extrabold"
                    style={{ color: "var(--text)" }}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm" style={{ color: "var(--text2)" }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              
              <NotifBellInline />
              <button onClick={handleLogout} className="p-2 rounded-xl" style={{color:"var(--text2)"}} title="Sign Out"><LogOut size={20}/></button>
            </div>
          </header>

          {/* Mobile header (same as original) */}
          {title && (
            <header
              className="cb-m-header sticky top-0 z-40 px-4 py-3"
              style={{
                background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between max-w-xl mx-auto">
                <div className="flex items-center gap-1">
                  {back && (
                    <button
                      onClick={() => router.push(back)}
                      className="-ml-2 p-2 rounded-xl active:scale-95"
                      style={{ color: "var(--text2)" }}
                    >
                      <ChevronLeft size={26} />
                    </button>
                  )}
                  <div>
                    <h1
                      className="text-xl font-extrabold"
                      style={{ color: "var(--text)" }}
                    >
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-sm" style={{ color: "var(--text2)" }}>
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {action}
                  <NotifBellInline />
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl"
                    style={{ color: "var(--text2)" }}
                    title="Sign Out"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </header>
          )}

          {/* Content */}
          <main className="cb-content flex-1">
            <div className="cb-content-inner">{children}</div>
          </main>

          {/* Mobile bottom nav (same as original) */}
          <nav
            className="cb-m-nav fixed bottom-0 left-0 right-0 z-50 safe-b"
            style={{
              background: "var(--card)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div className="flex justify-around max-w-xl mx-auto">
              {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={true}
                    className="flex-1 flex flex-col items-center py-2 transition-colors"
                    style={{
                      color: active ? "var(--brand)" : "var(--muted)",
                    }}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                    <span className="text-[10px] mt-0.5 font-bold">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
