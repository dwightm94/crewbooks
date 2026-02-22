"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getReports } from "@/lib/api";
import { money } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Users, PieChart } from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { getReports().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <AppShell title="Reports"><div className="space-y-4 mt-4">{[1,2,3].map(i => <div key={i} className="skeleton h-28" />)}</div></AppShell>;
  if (!data) return <AppShell title="Reports"><p className="mt-8 text-center" style={{ color: "var(--text2)" }}>No data yet.</p></AppShell>;

  const { summary, monthlyTrends, jobProfitability, statusCounts, expensesByCategory, clients } = data;
  const maxRev = Math.max(...monthlyTrends.map(m => Math.max(m.revenue, m.expenses)), 1);

  return (
    <AppShell title="Reports" subtitle="Business Analytics">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <SummaryCard label="Total Revenue" value={money(summary.totalRevenue)} icon={DollarSign} color="var(--green)" />
        <SummaryCard label="Total Expenses" value={money(summary.totalExpenses)} icon={TrendingDown} color="var(--red)" />
        <SummaryCard label="Net Profit" value={money(summary.totalProfit)} icon={TrendingUp} color={summary.totalProfit >= 0 ? "var(--green)" : "var(--red)"} />
        <SummaryCard label="Avg Job Value" value={money(summary.avgJobValue)} icon={Briefcase} color="var(--brand)" />
      </div>

      {/* Monthly Revenue Chart */}
      <section className="mt-6">
        <h3 className="section-title">Revenue vs Expenses (6 months)</h3>
        <div className="card">
          <div className="space-y-3">
            {monthlyTrends.map(m => (
              <div key={m.month}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold" style={{ color: "var(--text)" }}>{m.label}</span>
                  <span style={{ color: "var(--text2)" }}>{money(m.revenue)} rev / {money(m.expenses)} exp</span>
                </div>
                <div className="flex gap-1 h-5">
                  <div className="rounded-full h-full transition-all" style={{ width: `${Math.max((m.revenue / maxRev) * 100, 2)}%`, background: "var(--green)", minWidth: "4px" }} />
                  <div className="rounded-full h-full transition-all" style={{ width: `${Math.max((m.expenses / maxRev) * 100, 2)}%`, background: "var(--red)", opacity: 0.6, minWidth: "4px" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ background: "var(--green)" }} /><span className="text-[10px] font-bold" style={{ color: "var(--text2)" }}>Revenue</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ background: "var(--red)", opacity: 0.6 }} /><span className="text-[10px] font-bold" style={{ color: "var(--text2)" }}>Expenses</span></div>
          </div>
        </div>
      </section>

      {/* Job Status Breakdown */}
      <section className="mt-6">
        <h3 className="section-title">Job Pipeline</h3>
        <div className="card">
          <div className="flex justify-between">
            {[
              { label: "Bidding", count: statusCounts.bidding, color: "var(--purple)" },
              { label: "Active", count: statusCounts.active, color: "var(--blue)" },
              { label: "Complete", count: statusCounts.complete, color: "var(--brand)" },
              { label: "Paid", count: statusCounts.paid, color: "var(--green)" },
            ].map(s => (
              <div key={s.label} className="text-center flex-1">
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.count}</p>
                <p className="text-[10px] font-bold" style={{ color: "var(--text2)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Profitability Ranking */}
      {jobProfitability.length > 0 && (
        <section className="mt-6">
          <h3 className="section-title">Job Profitability</h3>
          <div className="space-y-2">
            {jobProfitability.slice(0, 10).map((j, i) => (
              <button key={j.jobId} onClick={() => router.push(`/jobs/${j.jobId}`)} className="card-hover w-full text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold w-6" style={{ color: i < 3 ? "var(--brand)" : "var(--muted)" }}>#{i + 1}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{j.jobName}</p>
                      <p className="text-xs" style={{ color: "var(--text2)" }}>{j.clientName} • {money(j.bidAmount)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold" style={{ color: j.margin >= 30 ? "var(--green)" : j.margin >= 10 ? "var(--brand)" : "var(--red)" }}>{j.margin}%</p>
                    <p className="text-xs" style={{ color: "var(--text2)" }}>{money(j.profit)} profit</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Expense Categories */}
      {Object.keys(expensesByCategory).length > 0 && (
        <section className="mt-6">
          <h3 className="section-title">Expenses by Category</h3>
          <div className="card">
            <div className="space-y-2">
              {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                const pct = summary.totalExpenses > 0 ? (amount / summary.totalExpenses * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold" style={{ color: "var(--text)" }}>{cat}</span>
                      <span className="font-bold" style={{ color: "var(--text)" }}>{money(amount)} <span style={{ color: "var(--muted)" }}>({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full mt-1" style={{ background: "var(--input)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Top Clients */}
      {clients.length > 0 && (
        <section className="mt-6 mb-4">
          <h3 className="section-title">Top Clients</h3>
          <div className="space-y-2">
            {clients.slice(0, 10).map((c, i) => (
              <div key={c.name} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold" style={{ color: "var(--text)" }}>{c.name}</p>
                    <p className="text-xs" style={{ color: "var(--text2)" }}>{c.jobCount} job{c.jobCount > 1 ? "s" : ""} • Last: {c.lastJob}</p>
                  </div>
                  <p className="font-extrabold" style={{ color: "var(--brand)" }}>{money(c.totalValue)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <p className="text-[10px] font-bold" style={{ color: "var(--muted)" }}>{label}</p>
          <p className="text-lg font-extrabold" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  );
}
