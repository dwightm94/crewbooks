"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Plus, Search, Briefcase } from "lucide-react";
import { getJobs } from "@/lib/api";
import { money, statusBadge, statusLabel, margin, marginColor, relDate } from "@/lib/utils";

const FILTERS = ["all", "bidding", "active", "complete", "paid"];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { getJobs().then(r => setJobs(r.jobs || r || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = jobs.filter(j => {
    if (filter !== "all" && j.status !== filter) return false;
    if (search && !j.jobName?.toLowerCase().includes(search.toLowerCase()) && !j.clientName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = FILTERS.reduce((a, f) => { a[f] = f === "all" ? jobs.length : jobs.filter(j => j.status === f).length; return a; }, {});
  const addBtn = <button onClick={() => router.push("/jobs/new")} className="btn btn-brand btn-sm"><Plus size={18} />Add</button>;

  return (
    <AppShell title="Jobs" subtitle={`${jobs.length} total`} action={addBtn}>
      {/* Search */}
      <div className="mt-4 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs or clients..." className="field pl-11" />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mt-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: filter === f ? "var(--brand)" : "var(--input)",
              color: filter === f ? "#0F172A" : "var(--text2)",
            }}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Job list */}
      {loading ? (
        <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="empty-icon"><Briefcase size={40} style={{ color: "var(--muted)" }} /></div>
          <p className="font-bold text-lg" style={{ color: "var(--text)" }}>{search ? "No matching jobs" : "No jobs yet"}</p>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text2)" }}>Tap + to create your first job</p>
          <button onClick={() => router.push("/jobs/new")} className="btn btn-brand mx-auto"><Plus size={20} />Create Job</button>
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {filtered.map(job => {
            const m = margin(job.bidAmount, job.totalExpenses);
            return (
              <button key={job.jobId} onClick={() => router.push(`/jobs/${job.jobId}`)} className="card-hover w-full text-left">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate" style={{ color: "var(--text)" }}>{job.jobName}</p>
                    <p className="text-sm truncate" style={{ color: "var(--text2)" }}>{job.clientName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={statusBadge(job.status)}>{statusLabel(job.status)}</span>
                      {job.updatedAt && <span className="text-xs" style={{ color: "var(--muted)" }}>{relDate(job.updatedAt)}</span>}
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{money(job.bidAmount)}</p>
                    {job.bidAmount > 0 && (
                      <>
                        <p className="text-xs" style={{ color: "var(--text2)" }}>Spent: {money(job.totalExpenses || 0)}</p>
                        <p className="text-xs font-bold" style={{ color: marginColor(m.percent) }}>{m.percent}% margin</p>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
