"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Building2, Wrench, CreditCard, LogOut, ExternalLink, Sun, Moon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const TRADES = ["Electrician","Plumber","HVAC","Carpenter","Painter","Roofer","Concrete","Framing","Drywall","Flooring","Landscaping","Masonry","General Contractor","Other"];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState("");
  const handleLogout = () => { logout(); router.replace("/auth/login"); };

  return (
    <div className="px-4">
      <PageHeader title="Settings" />

      {/* Profile */}
      <div className="card mt-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{backgroundColor: "var(--brand)"}}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-lg font-bold" style={{color: "var(--text-primary)"}}>{user?.name || "Contractor"}</p>
            <p className="text-sm" style={{color: "var(--text-secondary)"}}>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <section className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{color: "var(--text-muted)"}}>Appearance</h3>
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dark ? <Moon size={20} style={{color: "var(--brand)"}} /> : <Sun size={20} style={{color: "var(--brand)"}} />}
              <div>
                <p className="font-semibold" style={{color: "var(--text-primary)"}}>{dark ? "Dark Mode" : "Light Mode"}</p>
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>{dark ? "Easy on the eyes" : "Great for job sites"}</p>
              </div>
            </div>
            <button onClick={toggle} className="relative w-14 h-8 rounded-full transition-colors" style={{backgroundColor: dark ? "var(--brand)" : "var(--bg-input)"}}>
              <div className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform" style={{left: dark ? "calc(100% - 28px)" : "4px"}} />
            </button>
          </div>
        </div>
      </section>

      {/* Company */}
      <section className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{color: "var(--text-muted)"}}>Company</h3>
        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>
              <Building2 size={14} />Company Name
            </label>
            <input type="text" value={company} onChange={e=>setCompany(e.target.value)} placeholder="Mike's Electric LLC" className="input-field" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>
              <Wrench size={14} />Trade
            </label>
            <select value={trade} onChange={e=>setTrade(e.target.value)} className="input-field">
              <option value="">Select trade</option>
              {TRADES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn-primary w-full">Save</button>
        </div>
      </section>

      {/* Plan */}
      <section className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{color: "var(--text-muted)"}}>Plan</h3>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold" style={{color: "var(--text-primary)"}}>Free Plan</p>
              <p className="text-sm" style={{color: "var(--text-secondary)"}}>3 active jobs</p>
            </div>
            <CreditCard size={24} style={{color: "var(--text-muted)"}} />
          </div>
          <button className="btn-primary w-full mt-4">Upgrade to Pro — $39/mo</button>
          <p className="text-xs text-center mt-2" style={{color: "var(--text-muted)"}}>Unlimited jobs, invoicing, reminders</p>
        </div>
      </section>

      {/* Actions */}
      <section className="mt-6 mb-8 space-y-2">
        <button className="card w-full text-left flex items-center justify-between">
          <span style={{color: "var(--text-secondary)"}}>Help & Support</span>
          <ExternalLink size={16} style={{color: "var(--text-muted)"}} />
        </button>
        <button onClick={handleLogout} className="card w-full text-left flex items-center gap-3" style={{color: "var(--danger)"}}>
          <LogOut size={18} /><span className="font-semibold">Sign Out</span>
        </button>
      </section>
    </div>
  );
}
