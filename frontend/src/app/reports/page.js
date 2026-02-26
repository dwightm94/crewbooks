"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getReports } from "@/lib/api";
import { usePlan } from "@/hooks/usePlan";
import { ProGate } from "@/components/ProGate";
import { money } from "@/lib/utils";
import { Briefcase, AlertTriangle, ChevronRight, ArrowUpRight, ArrowDownRight, Target, Clock, Users, TrendingUp, DollarSign } from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("kpis");
  const router = useRouter();
  const { features } = usePlan();

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

  const { summary, monthlyTrends, cashFlow, jobProfitability, bidAccuracy, statusCounts, expensesByCategory, invoiceAging, agingBuckets, agingAmounts, crewPerformance, clients } = data;
  const s = summary || {};
  const TABS = ["kpis", "money", "jobs", "crew"];

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
            {({ kpis: "Dashboard", money: "Cash Flow", jobs: "Job Costing", crew: "Crew" })[t]}
          </button>
        ))}
      </div>

      {tab === "kpis" && (
        <div className="mt-4 space-y-3">
          <KPIHero label="Net Profit" value={money(s.totalProfit || 0)} subtitle={`${s.totalRevenue > 0 ? ((s.totalProfit / s.totalRevenue) * 100).toFixed(1) : 0}% margin`} positive={(s.totalProfit || 0) >= 0} />
          <div className="grid grid-cols-2 gap-2">
            <KPICard icon={Target} label="Close Rate" value={s.closeRate !== null && s.closeRate !== undefined ? s.closeRate + "%" : "—"} subtitle={s.totalEstimates ? `${s.acceptedEstimates || 0} of ${s.totalEstimates} estimates` : "No estimates yet"} color={s.closeRate >= 50 ? "#22C55E" : s.closeRate >= 25 ? "#F59E0B" : "#EF4444"} />
            <KPICard icon={TrendingUp} label="Bid Accuracy" value={s.avgBidVariance !== null && s.avgBidVariance !== undefined ? (s.avgBidVariance >= 0 ? "+" : "") + s.avgBidVariance + "%" : "—"} subtitle={s.overBudgetJobs ? `${s.overBudgetJobs} job${s.overBudgetJobs > 1 ? "s" : ""} over budget` : "All on track"} color={s.avgBidVariance >= 0 ? "#22C55E" : "#EF4444"} />
            <KPICard icon={Clock} label="Outstanding" value={money(s.totalOutstanding || 0)} subtitle={`${(invoiceAging || []).length} unpaid invoice${(invoiceAging || []).length !== 1 ? "s" : ""}`} color={(s.totalOutstanding || 0) > 0 ? "#F59E0B" : "#22C55E"} />
            <KPICard icon={DollarSign} label="Avg Job Value" value={money(s.avgJobValue || 0)} subtitle={`${s.totalJobs || 0} total jobs`} color="#3B82F6" />
          </div>

          <Panel title="Pipeline">
            <div className="flex items-center gap-1">
              {[
                { label: "Bid", count: statusCounts?.bidding || 0, color: "#8B5CF6" },
                { label: "Active", count: statusCounts?.active || 0, color: "#3B82F6" },
                { label: "Done", count: statusCounts?.complete || 0, color: "#F59E0B" },
                { label: "Paid", count: statusCounts?.paid || 0, color: "#22C55E" },
              ].map(st => {
                const total = (statusCounts?.bidding||0) + (statusCounts?.active||0) + (statusCounts?.complete||0) + (statusCounts?.paid||0);
                const pct = total > 0 ? Math.max((st.count / total) * 100, 10) : 25;
                return (
                  <div key={st.label} className="text-center" style={{ flex: pct }}>
                    <div className="h-9 rounded-lg flex items-center justify-center mb-1" style={{ background: st.color }}>
                      <span className="text-white font-black text-sm">{st.count}</span>
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: "var(--text2)" }}>{st.label}</p>
                  </div>
                );
              })}
            </div>
          </Panel>

          {(invoiceAging || []).length > 0 && (
            <Panel title="Invoice Aging">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {["0-30", "31-60", "61-90", "90+"].map(bucket => {
                  const count = agingBuckets?.[bucket] || 0;
                  const amt = agingAmounts?.[bucket] || 0;
                  const isLate = bucket === "61-90" || bucket === "90+";
                  return (
                    <div key={bucket} className="text-center p-2 rounded-lg" style={{ background: isLate && count > 0 ? "rgba(239,68,68,0.06)" : "var(--input)" }}>
                      <p className="text-xs font-bold" style={{ color: isLate && count > 0 ? "#EF4444" : "var(--text2)" }}>{bucket}d</p>
                      <p className="text-base font-black" style={{ color: isLate && count > 0 ? "#EF4444" : "var(--text)" }}>{count}</p>
                      <p className="text-[10px]" style={{ color: "var(--muted)" }}>{money(amt)}</p>
                    </div>
                  );
                })}
              </div>
              {invoiceAging.slice(0, 5).map(inv => (
                <div key={inv.invoiceId} className="flex items-center justify-between py-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{inv.clientName}</p>
                    <p className="text-[11px]" style={{ color: "var(--text2)" }}>{inv.jobName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{money(inv.amount)}</p>
                    <p className="text-[10px] font-bold" style={{ color: inv.daysOutstanding > 60 ? "#EF4444" : inv.daysOutstanding > 30 ? "#F59E0B" : "var(--muted)" }}>{inv.daysOutstanding}d overdue</p>
                  </div>
                </div>
              ))}
            </Panel>
          )}

          {(bidAccuracy || []).filter(b => b.status === "over").length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={15} style={{ color: "#EF4444" }} />
                <p className="text-xs font-bold" style={{ color: "#EF4444" }}>{bidAccuracy.filter(b => b.status === "over").length} job{bidAccuracy.filter(b => b.status === "over").length > 1 ? "s" : ""} over budget</p>
              </div>
              {bidAccuracy.filter(b => b.status === "over").slice(0, 3).map(b => (
                <button key={b.jobId} onClick={() => router.push("/jobs/" + b.jobId)} className="flex items-center justify-between w-full py-1.5">
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{b.jobName}</span>
                  <span className="text-xs font-bold" style={{ color: "#EF4444" }}>{b.variancePct}% over</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "money" && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Revenue" value={money(s.totalRevenue || 0)} color="#22C55E" />
            <MetricCard label="Expenses" value={money(s.totalExpenses || 0)} color="#EF4444" />
            <MetricCard label="Profit" value={money(s.totalProfit || 0)} color={(s.totalProfit || 0) >= 0 ? "#22C55E" : "#EF4444"} />
          </div>
          <Panel title="Cash Flow (6 Months)">
            {(cashFlow || monthlyTrends || []).map(m => {
              const inAmt = m.cashIn || m.revenue || 0;
              const outAmt = m.cashOut || m.expenses || 0;
              const net = m.net || m.profit || inAmt - outAmt;
              const maxVal = Math.max(...(cashFlow || monthlyTrends || []).map(x => Math.max(x.cashIn || x.revenue || 0, x.cashOut || x.expenses || 0)), 1);
              return (
                <div key={m.month} className="flex items-center gap-3 py-1.5">
                  <span className="text-[11px] font-bold w-10 shrink-0" style={{ color: "var(--text2)" }}>{m.label?.slice(0, 3)}</span>
                  <div className="flex-1 space-y-0.5">
                    <div className="h-2 rounded-full" style={{ width: Math.max((inAmt / maxVal) * 100, 3) + "%", background: "#22C55E" }} />
                    <div className="h-2 rounded-full" style={{ width: Math.max((outAmt / maxVal) * 100, 3) + "%", background: "#EF4444", opacity: 0.5 }} />
                  </div>
                  <span className="text-[11px] font-bold w-16 text-right shrink-0" style={{ color: net >= 0 ? "#22C55E" : "#EF4444" }}>{net >= 0 ? "+" : ""}{money(net)}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-4 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <Legend color="#22C55E" label="Money In" />
              <Legend color="#EF4444" label="Money Out" opacity={0.5} />
            </div>
          </Panel>
          <Panel title="Expenses by Category">
            {Object.keys(expensesByCategory || {}).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text2)" }}>No expenses tracked yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                  const pct = (s.totalExpenses || 0) > 0 ? (amount / s.totalExpenses * 100) : 0;
                  const colors = { Materials: "#3B82F6", Labor: "#8B5CF6", Equipment: "#F59E0B", Permits: "#22C55E", Fuel: "#EF4444", Subcontractor: "#EC4899", Disposal: "#6366F1", Rental: "#14B8A6", Other: "#6B7280" };
                  const color = colors[cat] || "#F59E0B";
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{money(amount)}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: color + "15", color }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--input)" }}>
                        <div className="h-full rounded-full" style={{ width: pct + "%", background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === "jobs" && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <KPICard icon={Target} label="Avg Bid Accuracy" value={s.avgBidVariance !== null && s.avgBidVariance !== undefined ? (s.avgBidVariance >= 0 ? "+" : "") + s.avgBidVariance + "%" : "—"} subtitle="bid vs actual cost" color={s.avgBidVariance >= 0 ? "#22C55E" : "#EF4444"} />
            <KPICard icon={AlertTriangle} label="Over Budget" value={String(s.overBudgetJobs || 0)} subtitle={`of ${(bidAccuracy || []).length} completed`} color={(s.overBudgetJobs || 0) > 0 ? "#EF4444" : "#22C55E"} />
          </div>
          <Panel title="Bid vs Actual Cost">
            {(bidAccuracy || []).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text2)" }}>Complete jobs with expenses to see bid accuracy</p>
            ) : (
              <div className="space-y-1">
                {(bidAccuracy || []).slice(0, 15).map((b, i) => (
                  <button key={b.jobId} onClick={() => router.push("/jobs/" + b.jobId)} className="flex items-center w-full py-2.5 px-2 rounded-xl" style={{ background: i % 2 === 0 ? "transparent" : "var(--input)" }}>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{b.jobName}</p>
                      <p className="text-[11px]" style={{ color: "var(--text2)" }}>Bid {money(b.bidAmount)} · Actual {money(b.actualCost)}</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-black" style={{ color: b.status === "over" ? "#EF4444" : "#22C55E" }}>{b.variancePct >= 0 ? "+" : ""}{b.variancePct}%</p>
                      <p className="text-[10px]" style={{ color: "var(--text2)" }}>{b.status === "over" ? "over" : "under"} by {money(Math.abs(b.variance))}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--muted)" }} />
                  </button>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Profitability Ranking">
            {(jobProfitability || []).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text2)" }}>No jobs with bids yet</p>
            ) : (
              <div className="space-y-1">
                {jobProfitability.slice(0, 10).map((j, i) => (
                  <button key={j.jobId} onClick={() => router.push("/jobs/" + j.jobId)} className="flex items-center w-full py-2.5 px-2 rounded-xl" style={{ background: i % 2 === 0 ? "transparent" : "var(--input)" }}>
                    <span className="w-6 text-xs font-black" style={{ color: i < 3 ? "#F59E0B" : "var(--muted)" }}>{i + 1}</span>
                    <div className="flex-1 text-left ml-1">
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
          </Panel>
        </div>
      )}

      {tab === "crew" && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Crew Size" value={String(s.crewCount || 0)} color="#3B82F6" />
            <MetricCard label="Assignments" value={String(s.totalAssignments || 0)} color="#8B5CF6" />
          </div>
          <Panel title="Revenue per Crew Member">
            {(crewPerformance || []).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text2)" }}>Assign crew to jobs to see performance</p>
            ) : (
              <div className="space-y-1">
                {crewPerformance.map((c, i) => {
                  const maxRev = crewPerformance[0]?.revenue || 1;
                  const pct = (c.revenue / maxRev) * 100;
                  return (
                    <div key={c.crewId} className="py-2.5 px-2 rounded-xl" style={{ background: i % 2 === 0 ? "transparent" : "var(--input)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{c.name}</p>
                          <p className="text-[11px]" style={{ color: "var(--text2)" }}>{c.role || "Crew"} · {c.jobCount} job{c.jobCount !== 1 ? "s" : ""}</p>
                        </div>
                        <p className="text-sm font-black" style={{ color: "#F59E0B" }}>{money(c.revenue)}</p>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--input)" }}>
                        <div className="h-full rounded-full" style={{ width: pct + "%", background: "linear-gradient(90deg, #3B82F6, #8B5CF6)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
          <Panel title="Top Clients by Revenue">
            {(clients || []).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text2)" }}>No client data yet</p>
            ) : (
              <div className="space-y-1">
                {clients.slice(0, 10).map((c, i) => {
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
                        <div className="h-full rounded-full" style={{ width: pct + "%", background: "linear-gradient(90deg, #F59E0B, #EF4444)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      <div className="h-6" />
    </AppShell>
  );
}

function KPIHero({ label, value, subtitle, positive }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: positive ? "linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.01))" : "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.01))", border: "1px solid " + (positive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>{label}</p>
      <div className="flex items-end justify-between mt-1">
        <div>
          <p className="text-3xl font-black tracking-tight" style={{ color: positive ? "#22C55E" : "#EF4444" }}>{value}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: positive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
          {positive ? <ArrowUpRight size={13} style={{ color: "#22C55E" }} /> : <ArrowDownRight size={13} style={{ color: "#EF4444" }} />}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, subtitle, color }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: "var(--muted)" }} />
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</p>
      </div>
      <p className="text-xl font-black" style={{ color: color || "var(--text)" }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: "var(--text2)" }}>{subtitle}</p>
    </div>
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

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>{title}</p>
      {children}
    </div>
  );
}

function Legend({ color, label, opacity }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, opacity: opacity || 1 }} />
      <span className="text-[10px] font-semibold" style={{ color: "var(--text2)" }}>{label}</span>
    </div>
  );
}
