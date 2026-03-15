"use client";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Receipt, Users, BarChart3, Shield, Settings } from "lucide-react";

const ITEMS = [
  { href: "/billing", label: "Invoices", sub: "Send & track payments", icon: Receipt, color: "var(--brand)", bg: "var(--brand-light)" },
  { href: "/crew", label: "Crew", sub: "Manage your team", icon: Users, color: "var(--blue)", bg: "var(--blue-bg)" },
  { href: "/reports", label: "Reports", sub: "Revenue & profitability", icon: BarChart3, color: "var(--green)", bg: "var(--green-bg)" },
  { href: "/compliance", label: "Compliance", sub: "Licenses & documents", icon: Shield, color: "var(--purple)", bg: "var(--purple-bg)" },
  { href: "/settings", label: "Settings", sub: "Profile & preferences", icon: Settings, color: "var(--text2)", bg: "var(--bg2)" },
];

export default function MorePage() {
  const router = useRouter();
  return (
    <AppShell title="More">
      <div className="mt-4 space-y-2">
        {ITEMS.map(({ href, label, sub, icon: Icon, color, bg }) => (
          <button key={href} onClick={() => router.push(href)} className="card-hover w-full text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
