"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePlan } from "@/hooks/usePlan";
import { createConnectAccount, getConnectStatus, createOnboardLink, getConnectDashboard, getQBStatus, connectQuickBooks, syncQuickBooks, disconnectQuickBooks } from "@/lib/api";
import { Sun, Moon, User, Building2, Wrench, CreditCard, ExternalLink, Bell, Shield, ChevronRight, CheckCircle2, AlertTriangle, Zap, Crown } from "lucide-react";

const TRADES = ["Electrician","Plumber","HVAC","Carpenter","Painter","Roofer","Concrete","Framing","Drywall","Flooring","Landscaping","Masonry","General Contractor","Other"];

export default function SettingsPage() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCompany(localStorage.getItem("crewbooks_company") || "");
      setTrade(localStorage.getItem("crewbooks_trade") || "");
    }
  }, []);

  const saveCompany = () => {
    localStorage.setItem("crewbooks_company", company);
    localStorage.setItem("crewbooks_trade", trade);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell title="Settings">
      {/* Profile & Company */}
      <div className="card mt-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "var(--brand)" }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{user?.name || "Contractor"}</p>
            <p className="text-sm" style={{ color: "var(--text2)" }}>{user?.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="field-label"><Building2 size={14} className="inline mr-1" />Company Name</label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your Company LLC" className="field" />
          </div>
          <div>
            <label className="field-label"><Wrench size={14} className="inline mr-1" />Trade</label>
            <select value={trade} onChange={e => setTrade(e.target.value)} className="field">
              <option value="">Select your trade</option>
              {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={saveCompany} className="btn btn-brand w-full">{saved ? "\u2713 Saved!" : "Save Company Info"}</button>
        </div>
      </div>

      {/* Theme */}
      <section className="mt-6">
        <h3 className="section-title">Appearance</h3>
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dark ? <Moon size={22} style={{ color: "var(--brand)" }} /> : <Sun size={22} style={{ color: "var(--brand)" }} />}
              <div>
                <p className="font-bold" style={{ color: "var(--text)" }}>{dark ? "Dark Mode" : "Light Mode"}</p>
                <p className="text-sm" style={{ color: "var(--text2)" }}>{dark ? "Easy on the eyes" : "Best for outdoors"}</p>
              </div>
            </div>
            <button onClick={toggle} className="relative w-14 h-8 rounded-full transition-colors" style={{ background: dark ? "var(--brand)" : "var(--input)" }}>
              <div className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform" style={{ left: dark ? "calc(100% - 28px)" : "4px" }} />
            </button>
          </div>
        </div>
      </section>

      {/* Payments */}
      <section className="mt-6">
        <h3 className="section-title">Payments</h3>
        <StripeConnectSection email={user?.email} />
      </section>

      {/* Subscription */}
      <section className="mt-6">
        <h3 className="section-title">Subscription</h3>
        <SubscriptionSection />
      </section>

      {/* Integrations */}
      <section className="mt-6">
        <h3 className="section-title">Integrations</h3>
        <QuickBooksSection />
      </section>

      {/* Notifications */}
      <section className="mt-6">
        <h3 className="section-title">Notifications</h3>
        <div className="card space-y-4">
          <ToggleRow icon={Bell} label="Payment Reminders" desc="Auto-remind clients about overdue invoices" />
          <ToggleRow icon={MailIcon} label="Email Notifications" desc="Get notified when invoices are viewed" />
        </div>
      </section>

      {/* Privacy & Help */}
      <section className="mt-6 space-y-2 mb-8">
        <h3 className="section-title">Support</h3>
        <SettingsLink icon={Shield} label="Privacy Policy" href="https://crewbooks.app/privacy" />
        <SettingsLink icon={ExternalLink} label="Help & Support" href="mailto:support@crewbooks.app" />
      </section>
    </AppShell>
  );
}

function ToggleRow({ icon: Icon, label, desc }) {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon size={18} style={{ color: "var(--text2)" }} />
        <div><p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{label}</p><p className="text-xs" style={{ color: "var(--muted)" }}>{desc}</p></div>
      </div>
      <button onClick={() => setOn(!on)} className="relative w-12 h-7 rounded-full transition-colors" style={{ background: on ? "var(--brand)" : "var(--input)" }}>
        <div className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform" style={{ left: on ? "calc(100% - 26px)" : "2px" }} />
      </button>
    </div>
  );
}

function SettingsLink({ icon: Icon, label, href }) {
  return (
    <a href={href || "#"} target="_blank" rel="noopener" className="card-hover w-full text-left flex items-center justify-between" style={{ display: "flex", textDecoration: "none" }}>
      <div className="flex items-center gap-3"><Icon size={18} style={{ color: "var(--text2)" }} /><span className="font-medium" style={{ color: "var(--text)" }}>{label}</span></div>
      <ChevronRight size={18} style={{ color: "var(--muted)" }} />
    </a>
  );
}

function MailIcon({ size, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}

function StripeConnectSection({ email }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getConnectStatus().then(setStatus).catch(() => setStatus({ connected: false })).finally(() => setLoading(false));
  }, []);

  const handleSetup = async () => {
    setConnecting(true);
    try {
      if (!status?.connected) await createConnectAccount(email);
      const link = await createOnboardLink();
      if (link.url) window.location.href = link.url;
    } catch (e) { alert("Error setting up payments: " + e.message); }
    setConnecting(false);
  };

  const openDashboard = async () => {
    try {
      const link = await getConnectDashboard();
      if (link.url) window.open(link.url, "_blank");
    } catch (e) { alert("Error opening dashboard"); }
  };

  if (loading) return <div className="card"><div className="skeleton h-16" /></div>;

  if (status?.onboarded) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
            <CheckCircle2 size={20} style={{ color: "#22C55E" }} />
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: "var(--text)" }}>Payments Active</p>
            <p className="text-xs" style={{ color: "var(--text2)" }}>Clients can pay invoices online</p>
          </div>
        </div>
        <div className="divider" />
        <button onClick={openDashboard} className="btn w-full text-sm font-bold" style={{ background: "#635BFF", color: "white" }}>
          Open Stripe Dashboard →
        </button>
      </div>
    );
  }

  if (status?.connected && !status?.onboarded) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.1)" }}>
            <AlertTriangle size={20} style={{ color: "#EAB308" }} />
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: "var(--text)" }}>Finish Setup</p>
            <p className="text-xs" style={{ color: "var(--text2)" }}>Complete Stripe verification to accept payments</p>
          </div>
        </div>
        <div className="divider" />
        <button onClick={handleSetup} disabled={connecting} className="btn w-full text-sm font-bold" style={{ background: "#635BFF", color: "white" }}>
          {connecting ? "Loading..." : "Complete Stripe Setup →"}
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,91,255,0.1)" }}>
          <CreditCard size={20} style={{ color: "#635BFF" }} />
        </div>
        <div className="flex-1">
          <p className="font-bold" style={{ color: "var(--text)" }}>Accept Online Payments</p>
          <p className="text-xs" style={{ color: "var(--text2)" }}>Let clients pay invoices with credit card</p>
        </div>
      </div>
      <div className="divider" />
      <button onClick={handleSetup} disabled={connecting} className="btn w-full text-sm font-bold" style={{ background: "#635BFF", color: "white" }}>
        {connecting ? "Setting up..." : "Connect with Stripe →"}
      </button>
    </div>
  );
}

// === Subscription Section ===
function SubscriptionSection() {
  const { plan, isPro, loading } = usePlan();
  const router = useRouter();

  if (loading) return <div className="card animate-pulse h-24" />;

  if (isPro) {
    return (
      <div className="card" style={{ borderColor: "#F59E0B", borderWidth: "2px" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
              <Zap size={20} color="white" />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: "var(--text)" }}>Pro Plan</p>
              <p className="text-sm" style={{ color: "#22C55E" }}>Active</p>
            </div>
          </div>
          <CheckCircle2 size={24} style={{ color: "#22C55E" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-lg" style={{ color: "var(--text)" }}>Free Plan</p>
          <p className="text-sm" style={{ color: "var(--text2)" }}>3 active jobs • 3 invoices/month</p>
        </div>
      </div>
      <div className="divider" />
      <button onClick={() => router.push("/upgrade")} className="w-full py-3 rounded-xl text-white font-bold"
        style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
        <span className="flex items-center justify-center gap-2"><Zap size={18} />Upgrade to Pro — $39/mo</span>
      </button>
    </div>
  );
}

// === QuickBooks Section ===
function QuickBooksSection() {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#2CA01C" }}>
          <span className="text-white font-bold text-sm">QB</span>
        </div>
        <div>
          <p className="font-bold" style={{ color: "var(--text)" }}>QuickBooks Online</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Sync invoices & expenses</p>
        </div>
      </div>
      <div className="w-full py-3 rounded-xl text-center font-bold text-sm" style={{ background: "var(--input)", color: "var(--muted)" }}>
        Coming Soon
      </div>
    </div>
  );
}
