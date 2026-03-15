"use client";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText, Users, BarChart3, ShieldCheck, Settings, CreditCard,
  Receipt, Calculator, ChevronRight, Sparkles
} from "lucide-react";

const SECTIONS = [
  {
    label: "Work",
    items: [
      { href: "/invoices", icon: FileText, label: "Invoices", desc: "Create & send invoices" },
      { href: "/crew", icon: Users, label: "Crew", desc: "Manage your team" },
      { href: "/estimates", icon: Calculator, label: "Estimates / Bids", desc: "Quotes & proposals" },
      { href: "/clients", icon: Receipt, label: "Clients", desc: "Client directory" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/reports", icon: BarChart3, label: "Reports", desc: "Revenue & job analytics" },
      { href: "/compliance", icon: ShieldCheck, label: "Compliance", desc: "Licenses & certifications" },
      { href: "/money", icon: CreditCard, label: "Billing & Payments", desc: "Stripe, subscriptions" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings", icon: Settings, label: "Settings", desc: "Profile, company, theme" },
      { href: "/upgrade", icon: Sparkles, label: "Upgrade Plan", desc: "Pro $39/mo · Team $69/mo" },
    ],
  },
];

export default function MorePage() {
  const router = useRouter();
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppShell title="More">
      <div className="py-4 space-y-6">
        {/* User card */}
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "var(--brand)", color: "#FFF" }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style={{ color: "var(--text)" }}>{user?.name || "Contractor"}</p>
            <p className="text-sm truncate" style={{ color: "var(--text2)" }}>{user?.email}</p>
          </div>
          <button onClick={() => router.push("/settings")} className="p-2 rounded-xl" style={{ color: "var(--text2)" }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* QuickBooks Coming Soon */}
        <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #2CA01C 0%, #108000 100%)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: "rgba(255,255,255,0.2)", color: "#FFF" }}>QB</div>
              <div>
                <p className="font-bold text-white text-sm">QuickBooks Integration</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>Sync invoices, expenses & payments</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "#FFF" }}>Coming Soon</span>
          </div>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute -right-2 -bottom-8 w-16 h-16 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Nav sections */}
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-bold uppercase tracking-wider px-1 mb-2" style={{ color: "var(--text3, #9CA3AF)" }}>{section.label}</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {section.items.map((item, i) => (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99] transition-transform"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg2, #F3F4F6)" }}>
                    <item.icon size={18} style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "var(--text3, #9CA3AF)" }}>{item.desc}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text3, #D1D5DB)", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs py-4" style={{ color: "var(--text3, #9CA3AF)" }}>CrewBooks v1.0 · Made for contractors</p>
      </div>
    </AppShell>
  );
}
