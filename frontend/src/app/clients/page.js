"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getReports } from "@/lib/api";
import { money } from "@/lib/utils";
import { Users, Phone, Mail, Briefcase, Clock, Copy, CheckCircle2, ExternalLink } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    getReports().then(r => setClients(r.clients || []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    return Math.floor((new Date() - new Date(dateStr)) / 86400000);
  };

  const copyPayLink = (client) => {
    const id = client.latestInvoiceId;
    if (!id) { alert("No invoice found for this client. Create an invoice first."); return; }
    const url = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(client.name);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppShell title="Clients" subtitle={`${clients.length} clients`}>
      {loading ? (
        <div className="space-y-3 mt-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20" />)}</div>
      ) : clients.length === 0 ? (
        <div className="mt-16 text-center">
          <Users size={40} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <h2 className="text-2xl font-extrabold mb-2 mt-4" style={{ color: "var(--text)" }}>No clients yet</h2>
          <p style={{ color: "var(--text2)" }}>Clients are auto-added when you create jobs.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {clients.map((c, i) => {
            const days = daysSince(c.lastJobDate);
            const needsFollowUp = days !== null && days > 90;
            const isCopied = copiedId === c.name;
            return (
              <div key={c.name} className="card" style={needsFollowUp ? { borderLeft: "4px solid var(--brand)" } : {}}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: "var(--brand)" }}>
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: "var(--text)" }}>{c.name}</p>
                        <p className="text-xs" style={{ color: "var(--text2)" }}>
                          {c.jobCount} job{c.jobCount > 1 ? "s" : ""} • {money(c.totalValue)} total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 ml-11">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--blue)" }}>
                          <Phone size={12} />{c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--blue)" }}>
                          <Mail size={12} />Email
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 ml-11">
                      {days !== null && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                          background: needsFollowUp ? "rgba(251,191,36,0.15)" : "rgba(34,197,94,0.1)",
                          color: needsFollowUp ? "var(--brand)" : "var(--green)",
                        }}>
                          <Clock size={10} className="inline mr-1" />
                          {needsFollowUp ? `${days}d since last job` : `Last job ${days}d ago`}
                        </span>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3 ml-11">
                      <button onClick={() => copyPayLink(c)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ background: isCopied ? "rgba(34,197,94,0.1)" : "rgba(99,91,255,0.1)", color: isCopied ? "var(--green)" : "#635BFF" }}>
                        {isCopied ? <><CheckCircle2 size={12} />Copied!</> : <><Copy size={12} />Pay Link</>}
                      </button>
                      {c.latestJobId && (
                        <button onClick={() => router.push(`/jobs/${c.latestJobId}`)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: "var(--input)", color: "var(--text2)" }}>
                          <ExternalLink size={12} />View Job
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-extrabold text-lg" style={{ color: "var(--brand)" }}>{money(c.totalValue)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
