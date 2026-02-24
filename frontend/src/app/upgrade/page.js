"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { usePlan } from "@/hooks/usePlan";
import { Check, X, Zap, Crown, Clock } from "lucide-react";

const FEATURES = [
  { label: "Active Jobs", free: "3", pro: "Unlimited", team: "Unlimited" },
  { label: "Crew Members", free: "3", pro: "Unlimited", team: "Unlimited" },
  { label: "Invoices / Month", free: "3", pro: "Unlimited", team: "Unlimited" },
  { label: "Users", free: "1", pro: "1", team: "Up to 10" },
  { label: "Scheduling", free: true, pro: true, team: true },
  { label: "Estimates & Bidding", free: true, pro: true, team: true },
  { label: "Daily Logs & Photos", free: "500 MB", pro: "5 GB", team: "25 GB" },
  { label: "Invoice PDF & Email", free: false, pro: true, team: true },
  { label: "Client CRM", free: false, pro: true, team: true },
  { label: "Compliance Tracking", free: false, pro: true, team: true },
  { label: "Reports & Analytics", free: false, pro: true, team: true },
  { label: "Payment Reminders", free: false, pro: true, team: true },
  { label: "Online Payments", free: false, pro: true, team: true },
  { label: "Priority Support", free: false, pro: true, team: true },
  { label: "QuickBooks Sync", free: false, pro: false, team: true },
];

export default function UpgradePage() {
  const { plan, isPro, refresh } = usePlan();
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { cognitoGetUser } = await import("@/lib/auth");
      const user = await cognitoGetUser();
      const BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${BASE}/subscription/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ plan: "pro" }),
      });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
      else alert(json.error || "Could not start checkout");
    } catch (e) { alert("Error: " + e.message); }
    setUpgrading(false);
  };

  const Val = ({ val }) => {
    if (val === true) return <Check size={18} style={{ color: "#22C55E" }} />;
    if (val === false) return <X size={18} style={{ color: "var(--muted)" }} />;
    return <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{val}</span>;
  };

  return (
    <AppShell title="Choose Your Plan" back="/settings">
      <div className="mt-4 space-y-4">
        {isPro && (
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <p className="font-bold text-sm" style={{ color: "#22C55E" }}>You are on the Pro plan</p>
          </div>
        )}
        <div className="space-y-3">
          <div className="card" style={{ borderColor: plan?.plan === "free" ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-extrabold text-lg" style={{ color: "var(--text)" }}>Free</p>
                <p className="text-xs" style={{ color: "var(--text2)" }}>Try it out</p>
              </div>
              <p className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>$0</p>
            </div>
            <div className="mt-2 text-xs space-y-1" style={{ color: "var(--text2)" }}>
              <p>3 jobs, 3 crew, 3 invoices</p>
              <p>Scheduling and estimates</p>
              <p>Basic daily logs (500 MB)</p>
            </div>
            {plan?.plan === "free" && (
              <div className="mt-2 px-2 py-1 rounded-lg inline-block" style={{ background: "var(--input)" }}>
                <p className="text-xs font-bold" style={{ color: "var(--text2)" }}>Current Plan</p>
              </div>
            )}
          </div>
          <div className="card relative overflow-hidden" style={{ borderColor: "#F59E0B", borderWidth: "2px" }}>
            <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>POPULAR</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap size={20} style={{ color: "#F59E0B" }} />
                  <p className="font-extrabold text-lg" style={{ color: "var(--text)" }}>Pro</p>
                </div>
                <p className="text-xs" style={{ color: "var(--text2)" }}>Everything to run your business</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>$39<span className="text-sm font-normal" style={{ color: "var(--text2)" }}>/mo</span></p>
              </div>
            </div>
            <div className="mt-2 text-xs space-y-1" style={{ color: "var(--text2)" }}>
              <p>Unlimited jobs, crew and invoices</p>
              <p>Invoice PDF, email and reminders</p>
              <p>Client CRM and compliance tracking</p>
              <p>Reports, analytics and 5 GB storage</p>
              <p>Online payments (2.5% fee)</p>
            </div>
            <div className="mt-3">
              {isPro ? (
                <div className="rounded-xl p-2 text-center" style={{ background: "rgba(34,197,94,0.1)" }}>
                  <p className="text-sm font-bold" style={{ color: "#22C55E" }}>Active</p>
                </div>
              ) : (
                <button onClick={handleUpgrade} disabled={upgrading} className="w-full py-3 rounded-xl text-white font-bold text-base" style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
                  {upgrading ? "Loading..." : "Upgrade to Pro"}
                </button>
              )}
            </div>
          </div>
          <div className="card relative opacity-75" style={{ borderColor: "var(--border)", borderWidth: "2px" }}>
            <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold text-white" style={{ background: "#6366F1" }}>COMING SOON</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crown size={20} style={{ color: "#6366F1" }} />
                  <p className="font-extrabold text-lg" style={{ color: "var(--text)" }}>Team</p>
                </div>
                <p className="text-xs" style={{ color: "var(--text2)" }}>For growing companies</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>$79<span className="text-sm font-normal" style={{ color: "var(--text2)" }}>/mo</span></p>
              </div>
            </div>
            <div className="mt-2 text-xs space-y-1" style={{ color: "var(--text2)" }}>
              <p>Everything in Pro</p>
              <p>Up to 10 users</p>
              <p>25 GB storage</p>
              <p>QuickBooks sync</p>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl" style={{ background: "var(--input)" }}>
                <Clock size={14} style={{ color: "var(--muted)" }} />
                <p className="text-sm font-bold" style={{ color: "var(--muted)" }}>Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card mt-4">
          <h3 className="font-extrabold mb-3" style={{ color: "var(--text)" }}>Compare Plans</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th className="text-left py-2 pr-2 font-semibold" style={{ color: "var(--text2)" }}>Feature</th>
                  <th className="text-center py-2 px-1 font-bold" style={{ color: "var(--text)" }}>Free</th>
                  <th className="text-center py-2 px-1 font-bold" style={{ color: "#F59E0B" }}>Pro</th>
                  <th className="text-center py-2 px-1 font-bold" style={{ color: "#6366F1" }}>Team</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map(f => (
                  <tr key={f.label} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-2 pr-2 text-xs font-medium" style={{ color: "var(--text2)" }}>{f.label}</td>
                    <td className="py-2 px-1 text-center"><Val val={f.free} /></td>
                    <td className="py-2 px-1 text-center"><Val val={f.pro} /></td>
                    <td className="py-2 px-1 text-center"><Val val={f.team} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card mt-4">
          <h3 className="font-extrabold mb-3" style={{ color: "var(--text)" }}>FAQ</h3>
          <div className="space-y-3">
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Can I cancel anytime?</p>
              <p className="text-xs" style={{ color: "var(--text2)" }}>Yes. Cancel in Settings anytime. You keep Pro until the end of your billing period.</p>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text)" }}>What happens to my data if I downgrade?</p>
              <p className="text-xs" style={{ color: "var(--text2)" }}>Nothing is deleted. You just cannot create new items beyond the Free limits or access Pro features until you upgrade again.</p>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Is there a transaction fee?</p>
              <p className="text-xs" style={{ color: "var(--text2)" }}>Online payments have a 2.5% processing fee (industry standard). This is separate from your subscription.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
