"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getDashboard } from "@/lib/api";
import { formatMoney, overdueSeverity } from "@/lib/utils";
export default function MoneyPage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const router = useRouter();
  useEffect(() => { getDashboard().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="px-4 max-w-lg mx-auto"><PageHeader title="Money" /><div className="space-y-4 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-28 rounded-2xl" />)}</div></div>;
  if (!data) return null;
  return (
    <div className="px-4 max-w-lg mx-auto">
      <PageHeader title="Money" subtitle="Financial overview" />
      <div className="card mt-4 bg-gradient-to-br from-brand-600 to-brand-800 border-brand-500 text-center"><p className="text-brand-200 text-sm uppercase tracking-wider">Total Owed</p><p className="text-5xl font-extrabold text-white mt-2">{formatMoney(data.totalOwed)}</p>{data.overdueInvoices?.length > 0 && <p className="text-brand-200 text-sm mt-2">{data.overdueInvoices.length} overdue</p>}</div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card text-center"><TrendingUp size={24} className="text-green-400 mx-auto mb-2" /><p className="text-xs text-navy-400">This Month</p><p className="text-xl font-bold text-green-400">{formatMoney(data.paidThisMonth)}</p></div>
        <div className="card text-center"><DollarSign size={24} className="text-purple-400 mx-auto mb-2" /><p className="text-xs text-navy-400">All Time</p><p className="text-xl font-bold text-purple-400">{formatMoney(data.totalEarned)}</p></div>
        <div className="card text-center"><TrendingDown size={24} className="text-amber-400 mx-auto mb-2" /><p className="text-xs text-navy-400">Total Costs</p><p className="text-xl font-bold text-amber-400">{formatMoney(data.profitability.totalActualCost)}</p></div>
        <div className="card text-center"><TrendingUp size={24} className="text-green-400 mx-auto mb-2" /><p className="text-xs text-navy-400">Margin</p><p className="text-xl font-bold text-green-400">{data.profitability.marginPercent}%</p></div>
      </div>
      {data.overdueInvoices?.length > 0 && <section className="mt-6"><h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle size={20} className="text-red-400" />Collect Now</h2><div className="space-y-2">{data.overdueInvoices.map(inv => { const sev = overdueSeverity(inv.daysOverdue); return (<button key={inv.invoiceId} onClick={() => router.push(`/jobs/${inv.jobId}`)} className={`card w-full text-left flex items-center justify-between ${sev.bg}`}><div><p className="font-semibold text-white">{inv.clientName}</p><p className="text-sm text-navy-400">{inv.jobName}</p><div className="flex items-center gap-1.5 mt-1"><Clock size={12} className={sev.color} /><span className={`text-xs font-semibold ${sev.color}`}>{inv.daysOverdue}d overdue</span></div></div><div className="text-right"><p className="text-xl font-bold text-white">{formatMoney(inv.amount)}</p></div></button>); })}</div></section>}
      <section className="mt-6 mb-8"><h2 className="text-lg font-bold text-white mb-3">Profit Summary</h2><div className="card space-y-3"><div className="flex justify-between"><span className="text-navy-300 text-sm">Total Bids</span><span className="text-green-400 font-medium">{formatMoney(data.profitability.totalBidValue)}</span></div><div className="flex justify-between"><span className="text-navy-300 text-sm">Total Costs</span><span className="text-red-400 font-medium">-{formatMoney(data.profitability.totalActualCost)}</span></div><div className="border-t border-navy-600 pt-3 flex justify-between"><span className="font-bold text-white">Net Profit</span><span className="text-lg font-bold text-green-400">{formatMoney(data.profitability.totalMargin)}</span></div></div></section>
    </div>
  );
}
