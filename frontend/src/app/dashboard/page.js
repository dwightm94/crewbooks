"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Plus, AlertTriangle, TrendingUp, Briefcase, DollarSign, Clock, ArrowRight } from "lucide-react";
import { getDashboard } from "@/lib/api";
import { usePlan } from "@/hooks/usePlan";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { money, moneyCompact, statusBadge, statusLabel, overdueSeverity, margin, marginColor, relDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(null);
  const router = useRouter();
  const { canDo } = usePlan();

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(e => { console.error(e); setErr(e.message); })
      .finally(() => setLoading(false));
  }, []);

  const handleNewJob = () => {
    const check = canDo("create_job");
    if (!check.allowed) { setShowUpgrade(check.message); return; }
    router.push("/jobs/new");
  };

  const addBtn = <button onClick={handleNewJob} className="btn btn-brand btn-sm"><Plus size={18} />New Job</button>;

  return (
    <AppShell title="CrewBooks" action={addBtn}>
      {showUpgrade && <UpgradePrompt message={showUpgrade} onClose={() => setShowUpgrade(null)} />}
      {loading ? (
        <div className="space-y-4 mt-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-28" />)}</div>
      ) : err || !data ? (
        <EmptyDashboard onNewJob={handleNewJob} />
      ) : (
        <FilledDashboard data={data} router={router} />
      )}
    </AppShell>
  );
}
}

function EmptyDashboard({ onNewJob }) {
  return (
    <div className="mt-16 text-center">
      <div className="empty-icon"><Briefcase size={40} style={{ color: "var(--muted)" }} /></div>
      <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>No jobs yet</h2>
      <p className="mb-8 text-base" style={{ color: "var(--text2)" }}>Create your first job to start tracking money.</p>
      <button onClick={onNewJob} className="btn btn-brand mx-auto"><Plus size={20} />Create First Job</button>
    </div>
  );
}
}

function FilledDashboard({ data, router }) {
  const { totalOwed = 0, totalOverdue = 0, totalEarned = 0, paidThisMonth = 0, counts = {}, overdueInvoices = [], recentJobs: rawJobs = [], profitability = {} } = data;
  const recentJobs = rawJobs.filter(j => j.jobName);
  return (
    <div className="mt-4 space-y-5">
      {/* Hero: Total Owed */}
      <div className="rounded-3xl p-6 text-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-hover))" }}>
        <p className="text-sm font-bold uppercase tracking-wider text-white/80">You're Owed</p>
        <p className="text-5xl font-extrabold text-white mt-1 tracking-tight">{money(totalOwed)}</p>
        {totalOverdue > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 bg-white/20 rounded-full px-4 py-1.5 mx-auto w-fit">
            <AlertTriangle size={16} className="text-white" />
            <span className="text-sm font-bold text-white">{money(totalOverdue)} overdue</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This Month" value={moneyCompact(paidThisMonth)} icon={TrendingUp} color="var(--green)" />
        <StatCard label="Active Jobs" value={counts.active || 0} icon={Briefcase} color="var(--blue)" />
        <StatCard label="Total Earned" value={moneyCompact(totalEarned)} icon={DollarSign} color="var(--purple)" />
        <StatCard label="Avg Margin" value={`${profitability?.avgMargin || profitability?.marginPercent || 0}%`} icon={TrendingUp} color={marginColor(Number(profitability?.avgMargin || profitability?.marginPercent || 0))} />
      </div>

      {/* Overdue Invoices */}
      {overdueInvoices.length > 0 && (
        <section>
          <h2 className="section-title flex items-center gap-2"><AlertTriangle size={14} style={{ color: "var(--red)" }} />Overdue Payments</h2>
          <div className="space-y-2">
            {overdueInvoices.map(inv => {
              const sev = overdueSeverity(inv.daysOverdue);
              return (
                <button key={inv.invoiceId} onClick={() => router.push(`/jobs/${inv.jobId}`)} className="card-hover w-full text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-base" style={{ color: "var(--text)" }}>{inv.clientName}</p>
                      <p className="text-sm" style={{ color: "var(--text2)" }}>{inv.jobName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: sev.bg, color: sev.color }}>
                          <Clock size={12} className="mr-1" />{inv.daysOverdue}d overdue
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold" style={{ color: sev.color }}>{money(inv.amount)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Jobs</h2>
            <button onClick={() => router.push("/jobs")} className="text-sm font-bold flex items-center gap-1" style={{ color: "var(--brand)" }}>See All <ArrowRight size={14} /></button>
          </div>
          <div className="space-y-2">
            {recentJobs.map(job => {
              const m = margin(job.bidAmount, job.totalExpenses);
              return (
                <button key={job.jobId} onClick={() => router.push(`/jobs/${job.jobId}`)} className="card-hover w-full text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold" style={{ color: "var(--text)" }}>{job.jobName}</p>
                      <p className="text-sm" style={{ color: "var(--text2)" }}>{job.clientName}</p>
                      <span className={statusBadge(job.status) + " mt-2"}>{statusLabel(job.status)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{money(job.bidAmount)}</p>
                      {job.totalExpenses > 0 && (
                        <p className="text-xs font-bold" style={{ color: marginColor(m.percent) }}>{m.percent}% margin</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => router.push("/reports")} className="card-hover text-left">
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <div><p className="font-bold text-sm" style={{ color: "var(--text)" }}>Reports</p><p className="text-xs" style={{ color: "var(--text2)" }}>Analytics & Trends</p></div>
            </div>
          </button>
          <button onClick={() => router.push("/clients")} className="card-hover text-left">
            <div className="flex items-center gap-3">
              <span className="text-xl">👥</span>
              <div><p className="font-bold text-sm" style={{ color: "var(--text)" }}>Clients</p><p className="text-xs" style={{ color: "var(--text2)" }}>CRM & Follow-ups</p></div>
            </div>
          </button>
          <button onClick={() => router.push("/compliance")} className="card-hover text-left">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <div><p className="font-bold text-sm" style={{ color: "var(--text)" }}>Compliance</p><p className="text-xs" style={{ color: "var(--text2)" }}>Licenses & Docs</p></div>
            </div>
          </button>
          <button onClick={() => router.push("/settings")} className="card-hover text-left">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <div><p className="font-bold text-sm" style={{ color: "var(--text)" }}>Settings</p><p className="text-xs" style={{ color: "var(--text2)" }}>Profile & Preferences</p></div>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{label}</p>
        <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}
}
