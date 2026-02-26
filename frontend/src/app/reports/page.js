"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getReports } from "@/lib/api";
import { usePlan } from "@/hooks/usePlan";
import { ProGate } from "@/components/ProGate";
import { money } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Briefcase, AlertTriangle, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const router = useRouter();
  const { isFree, features } = usePlan();

  useEffect(() => { getReports().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);

  if (!features.reports) return (<AppShell title="Reports"><ProGate feature="Reports & Analytics" title="Business Reports" description="See revenue trends, job profitability, expense breakdowns, and crew performance. Upgrade to Pro to unlock." /></AppShell>);

  if (loading) return (
    <AppShell title="Reports">
      <div className="space-y-4 mt-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
    </AppShell>
  );

  if (!data) return (
    <AppShell title="Reports">
      <div className="flex flex-col items-center justify-center py-16">
        <Briefcase size={48} style={{ color: "var(--muted)" }} />
        <p className="mt-4 font-bold" style={{ color: "var(--text)" }}>No data yet</p>
        <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>Complete some jobs to see your reports</p>
      </div>
    </AppShell>
  );

  const { summary, monthlyTrends, jobProfitability, statusCounts, expensesByCategory, clients } = data;
  const profitMargin = summary.totalRevenue > 0 ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) : 0;
  const isPositive = summary.totalProfit >= 0;
  const losingJobs = (jobProfitability || []).filter(j => j.margin < 0);
  const TABS = ["overview", "jobs", "expenses", "clients"];

  return (
    <AppShell title="Reports">
      <div className="flex gap-1 mt-3 p-1 rounded-xl" style={{ background: "var(--input)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === t ? "var(--card)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--muted)",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl p-5" style={{
            background: isPositive ? "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))" : "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))",
            border: "1px solid " + (isPositive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"),
          }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Net Profit</p>
            <div className="flex items-end justify-between mt-1">
              <div>
                <p className="text-3xl font-black" style={{ color: isPositive ? "#22C55E" : "#EF4444" }}>{money(summary.totalProfit)}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>{profitMargin}% margin on {money(summary.totalRevenue)} revenue</p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: isPositive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }}>
                {isPositive ? <ArrowUpRight size={14} style={{ color: "#22C55E" }} /> : <ArrowDownRight size={14} style={{ color: "#EF4444" }} />}
                <span className="text-xs font-bold" style={{ color: isPositive ? "#22C55E" : "#EF4444" }}>{profitMargin}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Revenue" value={money(summary.totalRevenue)} color="#22C55E" />
            <MetricCard label="Expenses" value={money(summary.totalExpenses)} color="#EF4444" />
            <MetricCard label="Avg Job" value={money(summary.avgJobValue)} color="#F59E0B" />
          </div>

          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Job Pipeline</p>
            <div className="flex items-center gap-1">
              {[
                { label: "Bid", count: statusCounts.bidding, color: "#8B5CF6" },
                { label: "Active", count: statusCounts.active, color: "#3B82F6" },
                { label: "Done", count: statusCounts.complete, color: "#F59E0B" },
                { label: "Paid", count: statusCounts.paid, color: "#22C55E" },
              ].map(s => {
                const total = (statusCounts.bidding||0) + (statusCounts.active||0) + (statusCounts.complete||0) + (statusCounts.paid||0);
                const pct = total > 0 ? Math.max((s.count / total) * 100, 8) : 25;
                return (
                  <div key={s.label} className="text-center" style={{ flex: pct }}>
                    <div className="h-10 rounded-lg flex items-center justify-center mb-1.5" style={{ background: s.color }}>
                      <span className="text-white font-black text-sm">{s.count}</span>
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: "var(--text2)" }}>{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Monthly Trend</p>
            <div className="space-y-2">
              {monthlyTrends.map(m => {
                const maxRev = Math.max(...monthlyTrends.map(x => Math.max(x.revenue, x.expenses)), 1);
                const revPct = Math.max((m.revenue / maxRev) * 100, 3);
                const expPct = Math.max((m.expenses / maxRev) * 100, 3);
                const net = m.revenue - m.expenses;
                return (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold w-8 shrink-0" style={{ color: "var(--text2)" }}>{m.label?.slice(0, 3)}</span>
                    <div className="flex-1"><div className="flex gap-0.5 h-3">
                      <div className="rounded-full h-full" style={{ width: revPct+"%", background: "#22C55E" }} />
                      <div className="rounded-full h-full" style={{ width: expPct+"%", background: "#EF4444", opacity: 0.5 }} />
                    </div></div>
                    <span className="text-[11px] font-bold w-16 text-right shrink-0" style={{ color: net >= 0 ? "#22C55E" : "#EF4444" }}>{net >= 0 ? "+" : ""}{money(net)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22C55E" }} /><span className="text-[10px] font-semibold" style={{ color: "var(--text2)" }}>Revenue</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: "#EF4444", opacity: 0.5 }} /><span className="text-[10px] font-semibold" style={{ color: "var(--text2)" }}>Expenses</span></div>
            </div>
          </div>

          {losingJobs.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} style={{ color: "#EF4444" }} />
                <p className="text-xs font-bold" style={{ color: "#EF4444" }}>{losingJobs.length} job{losingJobs.length > 1 ? "s" : ""} losing money</p>
              </div>
              {losingJobs.slice(0, 3).map(j => (
                <button key={j.jobId} onClick={() => router.push("/jobs/"+j.jobId)} className="flex items-center justify-between w-full py-1.5">
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{j.jobName}</span>
                  <span className="text-xs font-bold" style={{ color: "#EF4444" }}>{money(j.profit)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "jobs" && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Profitability Ranking</p>
            {(jobProfitability || []).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text2)" }}>No completed jobs yet</p>
            ) : (
              <div className="space-y-1">
                {jobProfitability.slice(0, 15).map((j, i) => (
                  <button key={j.jobId} onClick={() => router.push("/jobs/"+j.jobId)}
                    className="flex items-center w-full py-2.5 px-2 rounded-xl transition-colors"
                    style={{ background: i % 2 === 0 ? "transparent" : "var(--input)" }}>
                    <span className="w-6 text-xs font-black" style={{ color: i < 3 ? "#F59E0B" : "var(--muted)" }}>{i + 1}</span>
                    <div className="flex-1 text-left ml-2">
                      <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{j.jobName}</p>
                      <p className="text-[11px]" style={{ color: "var(--text2)" }}>{j.clientName}</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-black" style={{ color: j.margin >= 30 ? "#22C55E" : j.margin >= 10 ? "#F59E0B" : "#EF4444" }}>{j.margin}%</p>
                      <p className="text-[10px]" style={{ color: "var(--text2)" }}>{money(j.profit)}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--muted)" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "expenses" && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Total Expenses</p>
            <p className="text-2xl font-black mt-1" style={{ color: "#EF4444" }}>{money(summary.totalExpenses)}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>By Category</p>
            {Object.keys(expensesByCategory || {}).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text2)" }}>No expenses tracked yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                  const pct = summary.totalExpenses > 0 ? (amount / summary.totalExpenses * 100) : 0;
                  const colors = { Materials: "#3B82F6", Labor: "#8B5CF6", Equipment: "#F59E0B", Permits: "#22C55E", Fuel: "#EF4444", Subcontractor: "#EC4899", Disposal: "#6366F1", Rental: "#14B8A6", Other: "#6B7280" };
                  const color = colors[cat] || "#F59E0B";
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{money(amount)}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: color+"15", color }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--input)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: pct+"%", background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "clients" && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Client Revenue</p>
            {(clients || []).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text2)" }}>No client data yet</p>
            ) : (
              <div className="space-y-1">
                {clients.slice(0, 15).map((c, i) => {
                  const maxVal = clients[0]?.totalValue || 1;
                  const pct = (c.totalValue / maxVal) * 100;
                  return (
                    <div key={c.name} className="py-2.5 px-2 rounded-xl" style={{ background: i % 2 === 0 ? "transparent" : "var(--input)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{c.name}</p>
                          <p className="text-[11px]" style={{ color: "var(--text2)" }}>{c.jobCount} job{c.jobCount > 1 ? "s" : ""}</p>
                        </div>
                        <p className="text-sm font-black" style={{ color: "#F59E0B" }}>{money(c.totalValue)}</p>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: "var(--input)" }}>
                        <div className="h-full rounded-full" style={{ width: pct+"%", background: "linear-gradient(90deg, #F59E0B, #EF4444)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-4" />
    </AppShell>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="text-base font-black mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}
