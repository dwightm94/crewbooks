"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Building2, Wrench, CreditCard, LogOut, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/useAuth";
const TRADES = ["Electrician","Plumber","HVAC","Carpenter","Painter","Roofer","Concrete","Framing","Drywall","Flooring","Landscaping","Masonry","General Contractor","Other"];
export default function SettingsPage() {
  const { user, logout } = useAuth(); const router = useRouter();
  const [company, setCompany] = useState(""); const [trade, setTrade] = useState("");
  const handleLogout = () => { logout(); router.replace("/auth/login"); };
  return (
    <div className="px-4 max-w-lg mx-auto">
      <PageHeader title="Settings" />
      <div className="card mt-4"><div className="flex items-center gap-4"><div className="w-14 h-14 bg-brand-500 rounded-full flex items-center justify-center"><User size={28} className="text-white" /></div><div><p className="font-bold text-white text-lg">{user?.name || "Contractor"}</p><p className="text-sm text-navy-400">{user?.email}</p></div></div></div>
      <section className="mt-6"><h3 className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-3">Company</h3><div className="space-y-3"><div><label className="block text-sm text-navy-300 mb-1.5"><Building2 size={14} className="inline mr-1" />Company Name</label><input type="text" value={company} onChange={e=>setCompany(e.target.value)} placeholder="Mike's Electric LLC" className="input-field" /></div><div><label className="block text-sm text-navy-300 mb-1.5"><Wrench size={14} className="inline mr-1" />Trade</label><select value={trade} onChange={e=>setTrade(e.target.value)} className="input-field"><option value="">Select trade</option>{TRADES.map(t=><option key={t} value={t}>{t}</option>)}</select></div><button className="btn-primary w-full">Save</button></div></section>
      <section className="mt-6"><h3 className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-3">Plan</h3><div className="card"><div className="flex items-center justify-between"><div><p className="font-bold text-white">Free Plan</p><p className="text-sm text-navy-400">3 active jobs</p></div><CreditCard size={24} className="text-navy-500" /></div><button className="btn-primary w-full mt-4">Upgrade to Pro — $39/mo</button><p className="text-xs text-navy-400 text-center mt-2">Unlimited jobs, invoicing, reminders</p></div></section>
      <section className="mt-6 mb-8 space-y-2"><button className="card w-full text-left flex items-center justify-between"><span className="text-navy-300">Help & Support</span><ExternalLink size={16} className="text-navy-500" /></button><button onClick={handleLogout} className="card w-full text-left flex items-center gap-3 text-red-400"><LogOut size={18} /><span>Sign Out</span></button></section>
    </div>
  );
}
