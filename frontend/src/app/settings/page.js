"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePlan } from "@/hooks/usePlan";
import { createConnectAccount, getConnectStatus, createOnboardLink, getConnectDashboard } from "@/lib/api";
import { getProfile, updateProfile } from "@/lib/api";
import {
  Sun, Moon, Building2, Wrench, CreditCard, ExternalLink, Bell, Shield,
  ChevronRight, CheckCircle2, AlertTriangle, Zap, LogOut, ChevronDown, ChevronUp
} from "lucide-react";

const TRADES = ["Electrician","Plumber","HVAC","Carpenter","Painter","Roofer","Concrete","Framing","Drywall","Flooring","Landscaping","Masonry","General Contractor","Other"];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then(p => {
      setCompany(p.companyName || "");
      setTrade(p.trade || "");
    }).catch(() => {});
  }, []);

  const saveCompany = async () => {
    await updateProfile({ companyName: company, trade });
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditOpen(false); }, 1200);
  };

  const handleLogout = () => { logout(); window.location.href = "/auth/login"; };

  if (!user) return null;

  return (
    <AppShell title="Settings">
      <div className="py-4 space-y-5">

        {/* ── USER CARD ─────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3.5 p-4">
            <div className="w-13 h-13 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: "var(--brand)", width: 52, height: 52 }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate" style={{ color: "var(--text)" }}>{user?.name || "Contractor"}</p>
              <p className="text-sm truncate" style={{ color: "var(--text2)" }}>{user?.email}</p>
            </div>
          </div>
          {/* Company row */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2.5 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(var(--brand-rgb, 232,145,42), 0.1)" }}>
                <Building2 size={14} style={{ color: "var(--brand)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{company || "Add company name"}</p>
                <p className="text-[11px]" style={{ color: "var(--text3, var(--muted))" }}>{trade || "Set your trade"}{company && trade ? "" : ""}</p>
              </div>
              <button onClick={() => setEditOpen(!editOpen)} className="px-2.5 py-1 text-[11px] font-semibold rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text2)", background: "transparent" }}>
                {editOpen ? "Cancel" : "Edit"}
              </button>
            </div>

            {/* Edit form (collapsible) */}
            {editOpen && (
              <div className="mt-3 space-y-2.5">
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name"
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: "var(--bg2, var(--input))", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }} />
                <select value={trade} onChange={e => setTrade(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: "var(--bg2, var(--input))", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }}>
                  <option value="">Select your trade</option>
                  {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={saveCompany} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "var(--brand)" }}>
                  {saved ? "\u2713 Saved!" : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── BILLING ───────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text3, var(--muted))" }}>Billing</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <StripeRow email={user?.email} />
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <SubscriptionRow />
            </div>
          </div>
        </div>

        {/* ── INTEGRATIONS ──────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text3, var(--muted))" }}>Integrations</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#2CA01C" }}>
                <span className="text-white font-bold text-[11px]">QB</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>QuickBooks Online</p>
                <p className="text-xs" style={{ color: "var(--text3, var(--muted))" }}>Sync invoices & expenses</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "rgba(234,179,8,0.1)", color: "#D97706" }}>Coming soon</span>
            </div>
          </div>
        </div>

        {/* ── PREFERENCES ───────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text3, var(--muted))" }}>Preferences</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {/* Appearance */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg2, #F3F4F6)" }}>
                {dark ? <Moon size={16} style={{ color: "var(--brand)" }} /> : <Sun size={16} style={{ color: "var(--brand)" }} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Appearance</p>
                <p className="text-xs" style={{ color: "var(--text3, var(--muted))" }}>{dark ? "Dark mode \u00b7 easy on the eyes" : "Light mode \u00b7 best for outdoors"}</p>
              </div>
              <button onClick={toggle} className="relative flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, background: dark ? "var(--brand)" : "var(--input, #D1D5DB)", border: "none", cursor: "pointer", transition: "background .2s" }}>
                <div style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "#FFF", boxShadow: "0 1px 3px rgba(0,0,0,.12)", transition: "left .2s", left: dark ? 22 : 2 }} />
              </button>
            </div>
            {/* Payment Reminders */}
            <ToggleRow icon={Bell} label="Payment reminders" desc="Auto-remind overdue invoices" border />
            {/* Email Notifications */}
            <ToggleRow icon={MailIcon} label="Email notifications" desc="Invoice views & payments" />
          </div>
        </div>

        {/* ── SUPPORT ───────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text3, var(--muted))" }}>Support</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <a href="/privacy.html" target="_blank" rel="noopener" className="flex items-center gap-3 px-4 py-3.5" style={{ textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg2, #F3F4F6)" }}>
                <Shield size={16} style={{ color: "var(--brand)" }} />
              </div>
              <p className="flex-1 text-sm font-semibold" style={{ color: "var(--text)" }}>Privacy policy</p>
              <ChevronRight size={16} style={{ color: "var(--text3, #D1D5DB)" }} />
            </a>
            <a href="mailto:crewbookss@gmail.com" className="flex items-center gap-3 px-4 py-3.5" style={{ textDecoration: "none" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg2, #F3F4F6)" }}>
                <ExternalLink size={16} style={{ color: "var(--brand)" }} />
              </div>
              <p className="flex-1 text-sm font-semibold" style={{ color: "var(--text)" }}>Help & support</p>
              <ChevronRight size={16} style={{ color: "var(--text3, #D1D5DB)" }} />
            </a>
          </div>
        </div>

        {/* ── UPGRADE CTA ───────────────────────────────────── */}
        <UpgradeBanner />

        {/* ── FOOTER ────────────────────────────────────────── */}
        <div className="text-center pt-2 pb-4 space-y-3">
          <p className="text-xs" style={{ color: "var(--text3, var(--muted))" }}>CrewBooks v1.0 · Made for contractors</p>
          <button onClick={handleLogout} className="text-sm font-semibold" style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>
            <span className="flex items-center justify-center gap-1.5"><LogOut size={15} /> Log out</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}

/* ── Toggle Row ───────────────────────────────────────────────── */
function ToggleRow({ icon: Icon, label, desc, border }) {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center gap-3 px-4 py-3.5" style={border ? { borderBottom: "1px solid var(--border)" } : undefined}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg2, #F3F4F6)" }}>
        <Icon size={16} style={{ color: "var(--brand)" }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text3, var(--muted))" }}>{desc}</p>
      </div>
      <button onClick={() => setOn(!on)} className="relative flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, background: on ? "var(--brand)" : "var(--input, #D1D5DB)", border: "none", cursor: "pointer", transition: "background .2s" }}>
        <div style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "#FFF", boxShadow: "0 1px 3px rgba(0,0,0,.12)", transition: "left .2s", left: on ? 22 : 2 }} />
      </button>
    </div>
  );
}

function MailIcon({ size, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}

/* ── Stripe Row (inline in Billing section) ───────────────────── */
function StripeRow({ email }) {
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
    } catch (e) { alert("Error: " + e.message); }
    setConnecting(false);
  };

  const openDashboard = async () => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        window.location.href = isIOS
          ? "https://apps.apple.com/us/app/stripe-dashboard/id978516833"
          : "https://play.google.com/store/apps/details?id=com.stripe.android.dashboard";
        return;
      }
      const link = await getConnectDashboard();
      if (link.url) window.open(link.url, "_blank");
    } catch { alert("Error opening dashboard"); }
  };

  if (loading) return <div className="px-4 py-4"><div className="h-10 rounded-xl animate-pulse" style={{ background: "var(--bg2)" }} /></div>;

  // Fully onboarded
  if (status?.onboarded) {
    return (
      <button onClick={openDashboard} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.1)" }}>
          <CreditCard size={16} style={{ color: "#22C55E" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Payments</p>
          <p className="text-xs" style={{ color: "var(--text3, var(--muted))" }}>Stripe Connect</p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>Active</span>
      </button>
    );
  }

  // Needs to finish setup
  if (status?.connected && !status?.onboarded) {
    return (
      <button onClick={handleSetup} disabled={connecting} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(234,179,8,0.1)" }}>
          <AlertTriangle size={16} style={{ color: "#EAB308" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Payments</p>
          <p className="text-xs" style={{ color: "#D97706" }}>{connecting ? "Loading..." : "Finish Stripe setup \u2192"}</p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(234,179,8,0.1)", color: "#D97706" }}>Pending</span>
      </button>
    );
  }

  // Not connected
  return (
    <button onClick={handleSetup} disabled={connecting} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,91,255,0.1)" }}>
        <CreditCard size={16} style={{ color: "#635BFF" }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Payments</p>
        <p className="text-xs" style={{ color: "#635BFF" }}>{connecting ? "Setting up..." : "Connect with Stripe \u2192"}</p>
      </div>
      <ChevronRight size={16} style={{ color: "var(--text3, #D1D5DB)" }} />
    </button>
  );
}

/* ── Subscription Row (inline in Billing section) ─────────────── */
function SubscriptionRow() {
  const { isPro, loading } = usePlan();
  const router = useRouter();

  if (loading) return <div className="px-4 py-4"><div className="h-10 rounded-xl animate-pulse" style={{ background: "var(--bg2)" }} /></div>;

  if (isPro) {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
          <Zap size={16} color="white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Subscription</p>
          <p className="text-xs" style={{ color: "var(--text3, var(--muted))" }}>Pro plan · $39/mo</p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>Active</span>
      </div>
    );
  }

  return (
    <button onClick={() => router.push("/upgrade")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg2, #F3F4F6)" }}>
        <Zap size={16} style={{ color: "var(--brand)" }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Subscription</p>
        <p className="text-xs" style={{ color: "var(--text3, var(--muted))" }}>Free plan · 3 jobs, 3 invoices/mo</p>
      </div>
      <ChevronRight size={16} style={{ color: "var(--text3, #D1D5DB)" }} />
    </button>
  );
}

/* ── Upgrade Banner ───────────────────────────────────────────── */
function UpgradeBanner() {
  const { isPro } = usePlan();
  const router = useRouter();
  if (isPro) return null;

  return (
    <button onClick={() => router.push("/upgrade")} className="w-full flex items-center justify-between p-4 rounded-2xl text-left"
      style={{ background: "var(--card)", border: "2px solid var(--brand)", cursor: "pointer" }}>
      <div>
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Upgrade to Pro</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>$39/mo · Unlimited jobs & invoices</p>
      </div>
      <div className="px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0" style={{ background: "var(--brand)" }}>
        Upgrade
      </div>
    </button>
  );
}
