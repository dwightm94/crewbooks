"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, AlertTriangle, TrendingUp, Briefcase, Plus, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getDashboard } from "@/lib/api";
import { formatMoney, formatMoneyCompact, statusBadge, statusLabel, overdueSeverity, calcMargin, marginColor } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => { getDashboard().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return (
    <div className="px-4">
      <PageHeader title="Dashboard" />
      <div className="space-y-4 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
    </div>
  );

  if (!data) return (
    <div className="px-4">
      <PageHeader title="Dashboard" />
      <div className="mt-24 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{backgroundColor: "var(--bg-input)"}}>
          <Briefcase size={44} style={{color: "var(--text-muted)"}} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{color: "var(--text-primary)"}}>No jobs yet</h2>
        <p className="mb-8" style={{color: "var(--text-secondary)"}}>Create your first job to start tracking.</p>
        <button onClick={() => router.push("/jobs/new")} className="btn-primary mx-auto"><Plus size={20} />Create First Job</button>
      </div>
    </div>
  );

  return (
    <div className="px-4">
      <PageHeader title="Dashboard" action={<button onClick={() => router.push("/jobs/new")} className="p-2.5 rounded-2xl active:scale-95 transition-transform" style={{backgroundColor: "var(--brand)"}}><Plus size={20} className="text-white" /></button>} />

      {/* Hero — total owed */}
      <div className="card mt-4 text-center py-8" style={{background: "linear-gradient(135deg, var(--brand), var(--brand-dark))", border: "none"}}>
        <p className="text-sm font-semibold uppercase tracking-wider text-white/80">You're Owed</p>
        <p className="text-5xl font-extrabold text-white mt-2 tracking-tight">{formatMoney(data.totalOwed)}</p>
        {data.totalOverdue > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 text-white/90">
            <AlertTriangle size={16} />
            <span className="text-sm font-bold">{formatMoney(data.totalOverdue)} overdue</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[
          {l:"This Month", v:formatMoneyCompact(data.paidThisMonth), icon:TrendingUp, color:"var(--success)"},
          {l:"Active Jobs", v:data.counts?.active || 0, icon:Briefcase, color:"var(--info)"},
          {l:"Total Earned", v:formatMoneyCompact(data.totalEarned), icon:DollarSign, color:"#A855F7"},
          {l:"Margin", v:`${data.profitability?.marginPercent || 0}%`, icon:ArrowUpRight, color:"var(--success)"},
        ].map(({l,v,icon:Icon,color})=>(
          <div key={l} className="card flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{backgroundColor: `${color}15`}}>
              <Icon size={20} style={{color}} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{color: "var(--text-muted)"}}>{l}</p>
              <p className="text-lg font-bold" style={{color}}>{v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue */}
      {data.overdueInvoices?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{color: "var(--text-primary)"}}>
            <AlertTriangle size={18} style={{color: "var(--danger)"}} />Overdue
          </h2>
          <div className="space-y-2">{data.overdueInvoices.map(inv => {
            const sev = overdueSeverity(inv.daysOverdue);
            return (
              <button key={inv.invoiceId} onClick={() => router.push(`/jobs/${inv.jobId}`)} className="card w-full text-left flex items-center justify-between">
                <div>
                  <p className="font-semibold" style={{color: "var(--text-primary)"}}>{inv.clientName}</p>
                  <p className="text-sm" style={{color: "var(--text-secondary)"}}>{inv.jobName}</p>
                  <p className="text-xs font-bold mt-1" style={{color: "var(--danger)"}}>{inv.daysOverdue}d overdue</p>
                </div>
                <p className="text-xl font-extrabold" style={{color: "var(--text-primary)"}}>{formatMoney(inv.amount)}</p>
              </button>
            );
          })}</div>
        </section>
      )}

      {/* Recent Jobs */}
      {data.recentJobs?.length > 0 && (
        <section className="mt-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{color: "var(--text-primary)"}}>Recent Jobs</h2>
            <button onClick={() => router.push("/jobs")} className="text-sm font-bold" style={{color: "var(--brand)"}}>See All</button>
          </div>
          <div className="space-y-2">{data.recentJobs.map(job => (
            <button key={job.jobId} onClick={() => router.push(`/jobs/${job.jobId}`)} className="card w-full text-left flex items-center justify-between">
              <div>
                <p className="font-semibold" style={{color: "var(--text-primary)"}}>{job.jobName}</p>
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>{job.clientName}</p>
                <span className={statusBadge(job.status)}>{statusLabel(job.status)}</span>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{color: "var(--text-primary)"}}>{formatMoney(job.bidAmount)}</p>
                {job.margin && <p className={`text-xs font-bold ${marginColor(parseFloat(job.margin))}`}>{job.margin}%</p>}
              </div>
            </button>
          ))}</div>
        </section>
      )}
    </div>
  );
}
