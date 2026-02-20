"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, User, Building2, Wrench, CreditCard, LogOut, ExternalLink, Bell, Shield, ChevronRight } from "lucide-react";

const TRADES = ["Electrician","Plumber","HVAC","Carpenter","Painter","Roofer","Concrete","Framing","Drywall","Flooring","Landscaping","Masonry","General Contractor","Other"];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState("");

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
          <button className="btn btn-brand w-full">Save Company Info</button>
        </div>
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
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{ color: "var(--text)" }}>Free Plan</p>
              <p className="text-sm" style={{ color: "var(--text2)" }}>3 active jobs • 3 invoices/month</p>
            </div>
            <CreditCard size={28} style={{ color: "var(--muted)" }} />
          </div>
          <div className="divider" />
          <button className="btn btn-brand w-full">Upgrade to Pro — $39/mo</button>
          <p className="text-xs text-center mt-2" style={{ color: "var(--muted)" }}>Unlimited jobs, invoicing, reminders & reports</p>
        </div>
      </section>

      {/* Links */}
      <section className="mt-6 space-y-2">
        <SettingsLink icon={Shield} label="Privacy Policy" />
        <SettingsLink icon={ExternalLink} label="Help & Support" />
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

function SettingsLink({ icon: Icon, label }) {
  return (
    <button className="card-hover w-full text-left flex items-center justify-between">
      <div className="flex items-center gap-3"><Icon size={18} style={{ color: "var(--text2)" }} /><span className="font-medium" style={{ color: "var(--text)" }}>{label}</span></div>
      <ChevronRight size={18} style={{ color: "var(--muted)" }} />
    </button>
  );
}

function Mail({ size, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}
