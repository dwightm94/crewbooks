"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboard, getJobs } from "@/lib/api";
import { money, moneyCompact, statusBadge, statusLabel, overdueSeverity, relDate } from "@/lib/utils";
import { DollarSign, Clock, TrendingUp, ArrowRight, Send, CheckCircle2, AlertTriangle, FileText, Wallet } from "lucide-react";
import { getConnectStatus, createConnectAccount, createOnboardLink, getConnectDashboard } from "@/lib/api";
import { useEffect as useEffectStripe, useState as useStateStripe } from "react";

const FILTERS = ["owed", "paid", "all"];

export default function MoneyPage() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("owed");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [stripeStatus, setStripeStatus] = useState(null);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getConnectStatus().then(setStripeStatus).catch(() => setStripeStatus({ connected: false }));
  }, []);

  const handleConnectStripe = async () => {
    setStripeConnecting(true);
    try {
      const { getProfile } = await import("@/lib/api");
      let email = "";
      try { const p = await getProfile(); email = p.email || ""; } catch {}
      if (!stripeStatus?.connected) await createConnectAccount(email);
      const link = await createOnboardLink();
      if (link.url) window.location.href = link.url;
    } catch(e) { alert("Error: " + e.message); }
    setStripeConnecting(false);
  };

  const openStripeDashboard = async () => {
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

  useEffect(() => {
    Promise.all([getJobs(), getDashboard().catch(() => null)])
      .then(([j, d]) => {
        setJobs(j.jobs || j || []);
        if (d) setStats(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    if (filter === "owed") return ["active", "complete"].includes(j.status);
    if (filter === "paid") return j.status === "paid";
    return true;
  });

  const totalOwed = filtered.filter(j => j.status !== "paid").reduce((s, j) => s + (Number(j.bidAmount) || 0), 0);
  const totalPaid = jobs.filter(j => j.status === "paid").reduce((s, j) => s + (Number(j.bidAmount) || 0), 0);

  return (
    <AppShell title="Money" subtitle="Track payments">

      {/* ── Stripe Status Card ── */}
      {stripeStatus !== null && (
        <div className="mt-4">
          {stripeStatus?.connected && stripeStatus?.onboarded ? (
            <button onClick={openStripeDashboard} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left"
              style={{background:"linear-gradient(135deg,#1A3A2A 0%,#0F2A1A 100%)",boxShadow:"0 4px 16px rgba(52,199,89,0.15)",border:"none",cursor:"pointer"}}>
              <div className="flex items-center justify-center flex-shrink-0" style={{width:44,height:44,borderRadius:12,background:"#34C759"}}>
                <Wallet size={22} color="#fff" strokeWidth={2}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">Stripe Connected</p>
                <p className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.55)"}}>Tap to open Stripe Dashboard</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full flex-shrink-0" style={{background:"rgba(52,199,89,0.18)"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#34C759",display:"inline-block"}}/>
                <span className="text-[11px] font-bold" style={{color:"#34C759"}}>Active</span>
              </div>
            </button>
          ) : stripeStatus?.connected && !stripeStatus?.onboarded ? (
            <button onClick={handleConnectStripe} disabled={stripeConnecting} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left"
              style={{background:"linear-gradient(135deg,#2C2010 0%,#1C1C1E 100%)",boxShadow:"0 4px 16px rgba(245,158,11,0.15)",border:"none",cursor:"pointer"}}>
              <div className="flex items-center justify-center flex-shrink-0" style={{width:44,height:44,borderRadius:12,background:"#FF9F0A"}}>
                <Wallet size={22} color="#fff" strokeWidth={2}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">Finish Stripe Setup</p>
                <p className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.55)"}}>Complete setup to accept payments</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full flex-shrink-0" style={{background:"rgba(255,159,10,0.18)"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#FF9F0A",display:"inline-block"}}/>
                <span className="text-[11px] font-bold" style={{color:"#FF9F0A"}}>{stripeConnecting ? "Loading..." : "Incomplete"}</span>
              </div>
            </button>
          ) : (
            <button onClick={handleConnectStripe} disabled={stripeConnecting} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left"
              style={{background:"linear-gradient(135deg,#1C1C1E 0%,#2C2C2E 100%)",boxShadow:"0 4px 20px rgba(245,158,11,0.2)",border:"none",cursor:"pointer"}}>
              <div className="flex items-center justify-center flex-shrink-0" style={{width:44,height:44,borderRadius:12,background:"var(--brand)"}}>
                <Wallet size={22} color="#0F172A" strokeWidth={2}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">Payments Setup</p>
                <p className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.55)"}}>Connect Stripe to get paid</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full flex-shrink-0" style={{background:"rgba(255,59,48,0.18)"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#FF3B30",display:"inline-block"}}/>
                <span className="text-[11px] font-bold" style={{color:"#FF3B30"}}>{stripeConnecting ? "Setting up..." : "Not set up"}</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card text-center py-5">
          <DollarSign size={24} style={{ color: "var(--red)", margin: "0 auto" }} />
          <p className="text-2xl font-extrabold mt-2" style={{ color: "var(--text)" }}>{money(totalOwed)}</p>
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Outstanding</p>
        </div>
        <div className="card text-center py-5">
          <CheckCircle2 size={24} style={{ color: "var(--green)", margin: "0 auto" }} />
          <p className="text-2xl font-extrabold mt-2" style={{ color: "var(--text)" }}>{money(totalPaid)}</p>
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Collected</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mt-4 p-1 rounded-xl" style={{ background: "var(--input)" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all capitalize"
            style={{ background: filter === f ? "var(--card)" : "transparent", color: filter === f ? "var(--text)" : "var(--muted)", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {f === "owed" ? `Owed (${jobs.filter(j=>["active","complete"].includes(j.status)).length})` : f === "paid" ? `Paid (${jobs.filter(j=>j.status==="paid").length})` : `All (${jobs.length})`}
          </button>
        ))}
      </div>

      {/* Job payment list */}
      {loading ? (
        <div className="space-y-3 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="empty-icon"><DollarSign size={40} style={{ color: "var(--muted)" }} /></div>
          <p className="font-bold" style={{ color: "var(--text)" }}>{filter === "paid" ? "No payments collected yet" : "Nobody owes you money"}</p>
          <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>{filter === "owed" ? "That's a good thing!" : "Create jobs and send invoices"}</p>
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {filtered.map(job => (
            <button key={job.jobId} onClick={() => router.push(`/jobs/${job.jobId}`)} className="card-hover w-full text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold" style={{ color: "var(--text)" }}>{job.clientName}</p>
                  <p className="text-sm" style={{ color: "var(--text2)" }}>{job.jobName}</p>
                  <span className={statusBadge(job.status) + " mt-2"}>{statusLabel(job.status)}</span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold" style={{ color: job.status === "paid" ? "var(--green)" : "var(--text)" }}>{money(job.bidAmount)}</p>
                  {job.status === "paid" && <p className="text-xs" style={{ color: "var(--green)" }}>✓ Collected</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
