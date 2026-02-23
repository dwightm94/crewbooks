"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePlan } from "@/hooks/usePlan";
import { createConnectAccount, getConnectStatus, createOnboardLink, getConnectDashboard } from "@/lib/api";
import { Sun, Moon, User, Building2, Wrench, CreditCard, LogOut, ExternalLink, Bell, Shield, ChevronRight, CheckCircle2, AlertTriangle, Zap, Crown, Mail } from "lucide-react";

const TRADES = ["Electrician","Plumber","HVAC","Carpenter","Painter","Roofer","Concrete","Framing","Drywall","Flooring","Landscaping","Masonry","General Contractor","Other"];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState("");
  const [saved, setSaved] = useState(false);

  // Load saved company info
  useState(() => {
    if (typeof window !== "undefined") {
      setCompany(localStorage.getItem("crewbooks_company") || "");
      setTrade(localStorage.getItem("crewbooks_trade") || "");
    }
  });

  const saveCompany = () => {
    localStorage.setItem("crewbooks_company", company);
    localStorage.setItem("crewbooks_trade", trade);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => { logout(); router.replace("/auth/login"); };

  return (
    <AppShell title="Settings">
      {/* Profile card */}
      <div className="card mt-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "var(--brand)" }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{user?.name || "Contractor"}</p>
            <p className="text-sm" style={{ color: "var(--text2)" }}>{user?.email}</p>
          </div>
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

      {/* Company */}
      <section className="mt-6">
        <h3 className="section-title">Company</h3>
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
          <button onClick={saveCompany} className="btn btn-brand w-full">{saved ? "✓ Saved!" : "Save Company Info"}</button>
        </div>
      </section>

      {/* Stripe Connect */}
      <section className="mt-6">
        <h3 className="section-title">💳 Payments</h3>
        <StripeConnectSection email={user?.email} />
      </section>

      {/* Notifications */}
      <section className="mt-6">
        <h3 className="section-title">Notifications</h3>
        <div className="card space-y-4">
          <ToggleRow icon={Bell} label="Payment Reminders" desc="Auto-remind clients about overdue invoices" />
          <ToggleRow icon={Mail} label="Email Notifications" desc="Get notified when invoices are viewed" />
        </div>
      </section>

      {/* Plan */}
      <section className="mt-6">
        <h3 className="section-title">Subscription</h3>
        <SubscriptionSection />
      </section>

      {/* QuickBooks */}
      <section className="mt-6">
        <h3 className="section-title">Integrations</h3>
        <QuickBooksSection />
      </section>

      {/* Links */}
      <section className="mt-6 space-y-2">
        <SettingsLink icon={Shield} label="Privacy Policy" href="https://crewbooks.app/privacy" />
        <SettingsLink icon={ExternalLink} label="Help & Support" href="mailto:support@crewbooks.app" />
      </section>

      {/* Logout */}
      <button onClick={handleLogout} className="btn btn-danger w-full mt-6 mb-8"><LogOut size={18} />Sign Out</button>
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

function StripeConnectSection({ email }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useState(() => {
    getConnectStatus().then(setStatus).catch(() => setStatus({ connected: false })).finally(() => setLoading(false));
  });

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
            <p className="text-xs" style={{ color: "var(--text2)" }}>Clients can pay invoices online • 2.5% platform fee</p>
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
          <p className="text-xs" style={{ color: "var(--text2)" }}>Let clients pay invoices with credit card • 2.5% fee</p>
        </div>
      </div>
      <div className="divider" />
      <button onClick={handleSetup} disabled={connecting} className="btn w-full text-sm font-bold" style={{ background: "#635BFF", color: "white" }}>
        {connecting ? "Setting up..." : "Connect with Stripe →"}
      </button>
      <p className="text-[10px] text-center mt-2" style={{ color: "var(--muted)" }}>Powered by Stripe • Bank-level security</p>
    </div>
  );
}

// === Subscription Section ===
function SubscriptionSection() {
  const { plan, isPro, loading } = usePlan();
  const router = useRouter();
  const [managing, setManaging] = useState(false);

  const handleManage = async () => {
    setManaging(true);
    try {
      const { cognitoGetUser } = await import("@/lib/auth");
      const user = await cognitoGetUser();
      const BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${BASE}/subscription/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
      else alert(json.error || "Could not open billing portal");
    } catch (e) { alert("Error: " + e.message); }
    setManaging(false);
  };

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
              <p className="text-sm" style={{ color: "#22C55E" }}>Active • $39/month</p>
            </div>
          </div>
          <CheckCircle2 size={24} style={{ color: "#22C55E" }} />
        </div>
        <div className="divider" />
        <p className="text-xs mb-3" style={{ color: "var(--text2)" }}>Unlimited jobs • Unlimited invoices • Online payments • Full reports</p>
        <button onClick={handleManage} disabled={managing} className="btn w-full text-sm">
          {managing ? "Loading..." : "Manage Subscription"}
        </button>
      </div>
    );
  }

  // Free plan
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-lg" style={{ color: "var(--text)" }}>Free Plan</p>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            {plan?.usage?.activeJobs || 0}/3 active jobs • {plan?.usage?.monthlyInvoices || 0}/3 invoices this month
          </p>
        </div>
        <CreditCard size={28} style={{ color: "var(--muted)" }} />
      </div>
      <div className="divider" />
      <button onClick={() => router.push("/upgrade")} className="w-full py-3 rounded-xl text-white font-bold"
        style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
        <span className="flex items-center justify-center gap-2"><Zap size={18} />Upgrade to Pro — $39/mo</span>
      </button>
      <p className="text-xs text-center mt-2" style={{ color: "var(--muted)" }}>Unlimited jobs, invoicing, payments & reports</p>
    </div>
  );
}

// === QuickBooks Section ===
function QuickBooksSection() {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { isPro } = usePlan();
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const { cognitoGetUser } = await import("@/lib/auth");
        const user = await cognitoGetUser();
        const BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${BASE}/quickbooks/status`, { headers: { Authorization: `Bearer ${user.token}` } });
        const json = await res.json();
        setStatus(json.data);
      } catch { setStatus({ configured: false, connected: false }); }
    };
    check();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { cognitoGetUser } = await import("@/lib/auth");
      const user = await cognitoGetUser();
      const BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${BASE}/quickbooks/connect`, { headers: { Authorization: `Bearer ${user.token}` } });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
      else alert(json.error || "Could not connect to QuickBooks");
    } catch (e) { alert("Error: " + e.message); }
    setConnecting(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { cognitoGetUser } = await import("@/lib/auth");
      const user = await cognitoGetUser();
      const BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${BASE}/quickbooks/sync`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ type: "all" }),
      });
      const json = await res.json();
      if (json.data) alert(`Synced! ${json.data.invoices} invoices, ${json.data.expenses} expenses${json.data.errors?.length ? ` (${json.data.errors.length} errors)` : ""}`);
    } catch (e) { alert("Sync error: " + e.message); }
    setSyncing(false);
  };

  if (!isPro) {
    return (
      <div className="card" style={{ opacity: 0.7 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#2CA01C", color: "white", fontWeight: 900, fontSize: 12 }}>QB</div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: "var(--text)" }}>QuickBooks</p>
            <p className="text-xs" style={{ color: "var(--text2)" }}>Sync invoices & expenses</p>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>Team Plan</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#2CA01C", color: "white", fontWeight: 900, fontSize: 12 }}>QB</div>
        <div className="flex-1">
          <p className="font-bold" style={{ color: "var(--text)" }}>QuickBooks Online</p>
          {status?.connected ? (
            <p className="text-xs" style={{ color: "var(--green)" }}>Connected{status.lastSync ? ` • Last sync: ${new Date(status.lastSync).toLocaleDateString()}` : ""}</p>
          ) : (
            <p className="text-xs" style={{ color: "var(--text2)" }}>Sync invoices & expenses automatically</p>
          )}
        </div>
      </div>
      <div className="divider" />
      {status?.connected ? (
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing} className="btn btn-brand flex-1" style={{ background: "#2CA01C" }}>
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
          <button onClick={async () => {
            const { cognitoGetUser } = await import("@/lib/auth");
            const user = await cognitoGetUser();
            const BASE = process.env.NEXT_PUBLIC_API_URL || "";
            await fetch(`${BASE}/quickbooks/disconnect`, { method: "POST", headers: { Authorization: `Bearer ${user.token}` } });
            setStatus({ ...status, connected: false });
          }} className="btn" style={{ background: "var(--input)", color: "var(--text2)" }}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnect} disabled={connecting} className="btn w-full text-sm font-bold" style={{ background: "#2CA01C", color: "white" }}>
          {connecting ? "Connecting..." : "Connect QuickBooks →"}
        </button>
      )}
    </div>
  );
}
