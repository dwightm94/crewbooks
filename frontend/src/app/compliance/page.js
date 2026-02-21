"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getComplianceDocs, deleteComplianceDoc } from "@/lib/api";
import { Plus, Shield, FileText, AlertTriangle, CheckCircle2, XCircle, Trash2, ExternalLink } from "lucide-react";

const DOC_TYPES = {
  license: { label: "License", icon: "📋", color: "var(--blue)" },
  insurance: { label: "Insurance", icon: "🛡️", color: "var(--purple)" },
  certification: { label: "Certification", icon: "🎓", color: "var(--green)" },
  vehicle: { label: "Vehicle", icon: "🚛", color: "var(--yellow)" },
  permit: { label: "Permit", icon: "📄", color: "var(--brand)" },
};

const STATUS_STYLES = {
  active: { bg: "rgba(34,197,94,0.1)", color: "var(--green)", icon: CheckCircle2, label: "Valid" },
  "expiring-soon": { bg: "rgba(234,179,8,0.1)", color: "var(--yellow)", icon: AlertTriangle, label: "Expiring Soon" },
  expiring: { bg: "rgba(239,68,68,0.15)", color: "var(--red)", icon: AlertTriangle, label: "Expiring!" },
  expired: { bg: "rgba(239,68,68,0.2)", color: "var(--red)", icon: XCircle, label: "EXPIRED" },
};

export default function CompliancePage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  const load = () => { getComplianceDocs().then(r => setDocs(r.docs || r || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const doDelete = async (docId, name) => {
    if (confirm(`Delete "${name}"?`)) {
      await deleteComplianceDoc(docId); load();
    }
  };

  const filtered = filter === "all" ? docs : docs.filter(d => {
    if (filter === "urgent") return d.status === "expired" || d.status === "expiring";
    return d.docType === filter;
  });

  const expiredCount = docs.filter(d => d.status === "expired").length;
  const expiringCount = docs.filter(d => d.status === "expiring" || d.status === "expiring-soon").length;

  const addBtn = <button onClick={() => router.push("/compliance/new")} className="btn btn-brand btn-sm"><Plus size={18} />Add</button>;

  return (
    <AppShell title="Compliance" subtitle={`${docs.length} documents`} action={addBtn}>
      {/* Alert banner */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="mt-4 rounded-2xl p-4" style={{ background: expiredCount > 0 ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)" }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} style={{ color: expiredCount > 0 ? "var(--red)" : "var(--yellow)" }} />
            <div>
              {expiredCount > 0 && <p className="font-bold" style={{ color: "var(--red)" }}>{expiredCount} document{expiredCount > 1 ? "s" : ""} expired!</p>}
              {expiringCount > 0 && <p className="font-semibold text-sm" style={{ color: "var(--yellow)" }}>{expiringCount} expiring soon</p>}
            </div>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mt-4">
        {[
          { value: "all", label: `All (${docs.length})` },
          { value: "urgent", label: `⚠️ Urgent (${expiredCount + expiringCount})` },
          ...Object.entries(DOC_TYPES).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` })),
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: filter === f.value ? "var(--brand)" : "var(--input)", color: filter === f.value ? "#0F172A" : "var(--text2)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 mt-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="empty-icon"><Shield size={40} style={{ color: "var(--muted)" }} /></div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>No documents yet</h2>
          <p className="mb-8" style={{ color: "var(--text2)" }}>Track your licenses, insurance, and certifications.</p>
          <button onClick={() => router.push("/compliance/new")} className="btn btn-brand mx-auto"><Plus size={20} />Add Document</button>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map(doc => {
            const type = DOC_TYPES[doc.docType] || DOC_TYPES.license;
            const st = STATUS_STYLES[doc.status] || STATUS_STYLES.active;
            const StIcon = st.icon;
            return (
              <div key={doc.docId} className="card" style={{ borderLeft: `4px solid ${st.color}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <p className="font-bold" style={{ color: "var(--text)" }}>{doc.docName}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                        <StIcon size={10} className="inline mr-1" />{st.label}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{type.label}</span>
                    </div>
                    {doc.issuer && <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>Issuer: {doc.issuer}</p>}
                    {doc.number && <p className="text-xs" style={{ color: "var(--text2)" }}>#{doc.number}</p>}
                    {doc.expirationDate && (
                      <p className="text-xs font-bold mt-1" style={{ color: st.color }}>
                        {doc.daysLeft !== null && doc.daysLeft <= 0 ? `Expired ${Math.abs(doc.daysLeft)} days ago` :
                         doc.daysLeft !== null ? `Expires in ${doc.daysLeft} days` : ""}
                        {doc.expirationDate && ` (${doc.expirationDate})`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" className="p-2 rounded-lg" style={{ color: "var(--blue)" }}>
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button onClick={() => doDelete(doc.docId, doc.docName)} className="p-2 rounded-lg" style={{ color: "var(--red)" }}>
                      <Trash2 size={16} />
                    </button>
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
