"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboard, getJobs } from "@/lib/api";
import { money, moneyCompact, statusBadge, statusLabel, overdueSeverity, relDate } from "@/lib/utils";
import { DollarSign, Clock, TrendingUp, ArrowRight, Send, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

const FILTERS = ["owed", "paid", "all"];

export default function MoneyPage() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("owed");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const router = useRouter();

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
    <AppShell title="Billing" subtitle="Track payments">
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
