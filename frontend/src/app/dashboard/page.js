"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, AlertTriangle, TrendingUp, Briefcase, ChevronRight, Plus, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getDashboard } from "@/lib/api";
import { formatMoney, formatMoneyCompact, statusBadge, statusLabel, overdueSeverity, calcMargin, marginColor } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => { getDashboard().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="px-4 max-w-lg mx-auto"><PageHeader title="Dashboard" /><div className="space-y-4 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-24 rounded-2xl" />)}</div></div>;
  if (!data) return <div className="px-4 max-w-lg mx-auto"><PageHeader title="Dashboard" /><div className="mt-20 text-center"><div className="w-20 h-20 bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-6"><Briefcase size={40} className="text-navy-500" /></div><h2 className="text-2xl font-bold text-white mb-2">No jobs yet</h2><p className="text-navy-400 mb-8">Create your first job to start tracking.</p><button onClick={() => router.push("/jobs/new")} className="btn-primary mx-auto"><Plus size={20} />Create First Job</button></div></div>;

  return (
    <div className="px-4 max-w-lg mx-auto">
      <PageHeader title="Dashboard" action={<button onClick={() => router.push("/jobs/new")} className="bg-brand-500 text-white p-2 rounded-xl"><Plus size={20} /></button>} />
      {/* Big owed number */}
      <div className="card mt-4 text-center">
        <p className="text-navy-400 text-sm font-medium uppercase tracking-wider">You're Owed</p>
        <p className="money-big text-white mt-1">{formatMoney(data.totalOwed)}</p>
        {data.totalOverdue > 0 && <div className="flex items-center justify-center gap-1.5 mt-2 text-red-400"><AlertTriangle size={16} /><span className="text-sm font-semibold">{formatMoney(data.totalOverdue)} overdue</span></div>}
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[{l:"Earned This Month",v:formatMoneyCompact(data.paidThisMonth),i:TrendingUp,c:"text-green-400"},{l:"Active Jobs",v:data.counts.active,i:Briefcase,c:"text-blue-400"},{l:"Total Earned",v:formatMoneyCompact(data.totalEarned),i:DollarSign,c:"text-purple-400"},{l:"Margin",v:`${data.profitability.marginPercent}%`,i:ArrowUpRight,c:marginColor(parseFloat(data.profitability.marginPercent))}].map(({l,v,i:Icon,c})=>(
          <div key={l} className="card flex items-center gap-3"><div className={`p-2 rounded-xl bg-navy-700 ${c}`}><Icon size={20} /></div><div><p className="text-xs text-navy-400">{l}</p><p className={`text-lg font-bold ${c}`}>{v}</p></div></div>
        ))}
      </div>
      {/* Overdue invoices */}
      {data.overdueInvoices?.length > 0 && <section className="mt-6"><h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle size={20} className="text-red-400" />Overdue Payments</h2><div className="space-y-2">{data.overdueInvoices.map(inv => { const sev = overdueSeverity(inv.daysOverdue); return (<button key={inv.invoiceId} onClick={() => router.push(`/jobs/${inv.jobId}`)} className={`card w-full text-left flex items-center justify-between ${sev.bg}`}><div><p className="font-semibold text-white">{inv.clientName}</p><p className="text-sm text-navy-400">{inv.jobName}</p><p className={`text-xs font-semibold mt-1 ${sev.color}`}>{inv.daysOverdue}d overdue</p></div><div className="text-right"><p className="text-xl font-bold text-white">{formatMoney(inv.amount)}</p></div></button>); })}</div></section>}
      {/* Recent jobs */}
      {data.recentJobs?.length > 0 && <section className="mt-6 mb-6"><div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-white">Recent Jobs</h2><button onClick={() => router.push("/jobs")} className="text-brand-500 text-sm font-semibold">See All</button></div><div className="space-y-2">{data.recentJobs.map(job => (<button key={job.jobId} onClick={() => router.push(`/jobs/${job.jobId}`)} className="card w-full text-left flex items-center justify-between"><div><p className="font-semibold text-white">{job.jobName}</p><p className="text-sm text-navy-400">{job.clientName}</p><span className={statusBadge(job.status)}>{statusLabel(job.status)}</span></div><div className="text-right"><p className="font-bold text-white">{formatMoney(job.bidAmount)}</p>{job.margin && <p className={`text-xs font-semibold ${marginColor(parseFloat(job.margin))}`}>{job.margin}% margin</p>}</div></button>))}</div></section>}
    </div>
  );
}
