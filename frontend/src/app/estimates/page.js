"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getEstimates, deleteEstimate } from "@/lib/api";
import { money } from "@/lib/utils";
import { Plus, FileText, Trash2, CheckCircle2, Send, Eye, Clock, XCircle } from "lucide-react";

const STATUS = {
  draft: { label: "Draft", color: "var(--text2)", bg: "var(--input)", icon: FileText },
  sent: { label: "Sent", color: "var(--blue)", bg: "rgba(59,130,246,0.1)", icon: Send },
  viewed: { label: "Viewed", color: "var(--purple)", bg: "rgba(139,92,246,0.1)", icon: Eye },
  approved: { label: "Approved", color: "var(--green)", bg: "rgba(34,197,94,0.1)", icon: CheckCircle2 },
  declined: { label: "Declined", color: "var(--red)", bg: "rgba(239,68,68,0.1)", icon: XCircle },
};

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  const load = () => { getEstimates().then(r => setEstimates(r.estimates || r || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const doDelete = async (id, name) => {
    if (confirm(`Delete estimate for "${name}"?`)) { await deleteEstimate(id); load(); }
  };

  const filtered = filter === "all" ? estimates : estimates.filter(e => e.status === filter);
  const counts = { all: estimates.length, draft: 0, sent: 0, viewed: 0, approved: 0 };
  estimates.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });

  const addBtn = <button onClick={() => router.push("/estimates/new")} className="btn btn-brand btn-sm"><Plus size={18} />New</button>;

  return (
    <AppShell title="Estimates" subtitle={`${estimates.length} total`} action={addBtn}>
      <div className="flex flex-wrap gap-2 mt-4">
        {["all", "draft", "sent", "viewed", "approved"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize"
            style={{ background: filter === f ? "var(--brand)" : "var(--input)", color: filter === f ? "#0F172A" : "var(--text2)" }}>
            {f} ({counts[f] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 mt-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <FileText size={40} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <h2 className="text-2xl font-extrabold mb-2 mt-4" style={{ color: "var(--text)" }}>No estimates yet</h2>
          <p className="mb-8" style={{ color: "var(--text2)" }}>Create professional estimates and send to clients.</p>
          <button onClick={() => router.push("/estimates/new")} className="btn btn-brand mx-auto"><Plus size={20} />Create Estimate</button>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map(est => {
            const st = STATUS[est.status] || STATUS.draft;
            const StIcon = st.icon;
            return (
              <div key={est.estimateId} className="card" style={{ borderLeft: `4px solid ${st.color}` }}>
                <div className="flex items-start justify-between">
                  <button onClick={() => router.push(`/estimates/${est.estimateId}`)} className="flex-1 text-left">
                    <p className="font-bold" style={{ color: "var(--text)" }}>{est.clientName}</p>
                    <p className="text-sm" style={{ color: "var(--text2)" }}>{est.jobDescription || "No description"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: st.bg, color: st.color }}>
                        <StIcon size={10} />{st.label}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{est.lineItems?.length || 0} items</span>
                    </div>
                  </button>
                  <div className="text-right ml-3">
                    <p className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{money(est.total)}</p>
                    {est.status === "draft" && (
                      <button onClick={() => doDelete(est.estimateId, est.clientName)} className="mt-2 p-1" style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
