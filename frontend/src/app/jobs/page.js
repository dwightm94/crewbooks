"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useJobs } from "@/hooks/useJobs";
import { formatMoney, statusBadge, statusLabel, calcMargin, marginColor, cn } from "@/lib/utils";
const FILTERS = ["all", "bidding", "active", "complete", "paid"];
export default function JobsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { jobs, loading, fetchJobs } = useJobs();
  const router = useRouter();
  useEffect(() => { fetchJobs(filter === "all" ? undefined : filter); }, [filter]);
  const filtered = jobs.filter(j => !search || j.jobName?.toLowerCase().includes(search.toLowerCase()) || j.clientName?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="px-4 max-w-lg mx-auto">
      <PageHeader title="Jobs" subtitle={`${filtered.length} job${filtered.length !== 1 ? "s" : ""}`} action={<button onClick={() => router.push("/jobs/new")} className="bg-brand-500 text-white p-2 rounded-xl"><Plus size={20} /></button>} />
      <div className="relative mt-4"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" /><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search jobs..." className="input-field pl-10" /></div>
      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">{FILTERS.map(f => (<button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap", filter === f ? "bg-brand-500 text-white" : "bg-navy-800 text-navy-400")}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>))}</div>
      <div className="space-y-3 mt-4 mb-6">
        {loading ? [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />) : filtered.length === 0 ? <div className="text-center py-12"><p className="text-navy-400">No jobs found</p><button onClick={() => router.push("/jobs/new")} className="btn-primary mx-auto mt-4"><Plus size={18} /> Create Job</button></div> :
        filtered.map(job => { const margin = calcMargin(job.bidAmount, job.actualCost); return (
          <button key={job.jobId} onClick={() => router.push(`/jobs/${job.jobId}`)} className="card w-full text-left flex items-center justify-between">
            <div className="min-w-0 flex-1"><p className="font-semibold text-white truncate">{job.jobName}</p><p className="text-sm text-navy-400 truncate">{job.clientName}</p><div className="flex items-center gap-2 mt-1.5"><span className={statusBadge(job.status)}>{statusLabel(job.status)}</span></div></div>
            <div className="text-right ml-3"><p className="font-bold text-white">{formatMoney(job.bidAmount)}</p>{job.actualCost > 0 && <p className={`text-xs font-semibold ${marginColor(margin)}`}>{margin.toFixed(0)}% margin</p>}<ChevronRight size={18} className="text-navy-500 ml-auto mt-1" /></div>
          </button>); })}
      </div>
    </div>
  );
}
