"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getEstimate, sendEstimate, convertEstimateToJob } from "@/lib/api";
import { money } from "@/lib/utils";
import { Send, Briefcase, Copy, CheckCircle2, Eye, Clock, FileText, ExternalLink } from "lucide-react";

const STATUS = {
  draft: { label: "Draft", color: "var(--text2)", bg: "var(--input)" },
  sent: { label: "Sent", color: "var(--blue)", bg: "rgba(59,130,246,0.1)" },
  viewed: { label: "Viewed", color: "var(--purple)", bg: "rgba(139,92,246,0.1)" },
  approved: { label: "Approved", color: "var(--green)", bg: "rgba(34,197,94,0.1)" },
  declined: { label: "Declined", color: "var(--red)", bg: "rgba(239,68,68,0.1)" },
};

export default function EstimateDetailPage() {
  const { estimateId } = useParams();
  const [est, setEst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getEstimate(estimateId).then(setEst).catch(console.error).finally(() => setLoading(false));
  }, [estimateId]);

  const doSend = async () => {
    setSending(true);
    try {
      const res = await sendEstimate(estimateId);
      setEst({ ...est, status: "sent", token: res.token || est.token });
    } catch (e) { alert(e.message); }
    setSending(false);
  };

  const doConvert = async () => {
    if (!confirm("Convert this estimate to an active job?")) return;
    setConverting(true);
    try {
      const res = await convertEstimateToJob(estimateId);
      router.push(`/jobs/${res.job.jobId}`);
    } catch (e) { alert(e.message); setConverting(false); }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/estimate-view/${est.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <AppShell title="Loading..."><div className="space-y-4 mt-4">{[1,2].map(i=><div key={i} className="skeleton h-28" />)}</div></AppShell>;
  if (!est) return <AppShell title="Not Found" back="/estimates"><p className="mt-8 text-center" style={{color:"var(--text2)"}}>Estimate not found.</p></AppShell>;

  const st = STATUS[est.status] || STATUS.draft;

  return (
    <AppShell title={`Estimate`} subtitle={est.clientName} back="/estimates">
      {/* Status + Total */}
      <div className="card mt-4" style={{ background: "var(--brand)", borderColor: "var(--brand)" }}>
        <div className="text-center py-2">
          <p className="text-sm font-bold" style={{ color: "#0F172A", opacity: 0.7 }}>ESTIMATE TOTAL</p>
          <p className="text-4xl font-extrabold" style={{ color: "#0F172A" }}>{money(est.total)}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(0,0,0,0.15)", color: "#0F172A" }}>
            {st.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {est.status === "draft" && (
          <button onClick={doSend} disabled={sending} className="btn btn-brand flex-1"><Send size={16} />{sending ? "Sending..." : "Mark as Sent"}</button>
        )}
        {(est.status === "sent" || est.status === "viewed" || est.token) && (
          <button onClick={copyLink} className="btn btn-outline flex-1"><Copy size={16} />{copied ? "Copied!" : "Copy Link"}</button>
        )}
        {(est.status === "approved" || est.status === "sent" || est.status === "viewed") && !est.convertedJobId && (
          <button onClick={doConvert} disabled={converting} className="btn btn-brand flex-1"><Briefcase size={16} />{converting ? "Converting..." : "→ Job"}</button>
        )}
        {est.convertedJobId && (
          <button onClick={() => router.push(`/jobs/${est.convertedJobId}`)} className="btn btn-outline flex-1"><ExternalLink size={16} />View Job</button>
        )}
      </div>

      {/* Client share link */}
      {est.token && (
        <div className="card mt-4">
          <h3 className="section-title">Client Approval Link</h3>
          <p className="text-xs break-all" style={{ color: "var(--blue)" }}>
            {typeof window !== "undefined" ? `${window.location.origin}/estimate-view/${est.token}` : ""}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Share this link — client can view and approve the estimate</p>
        </div>
      )}

      {/* Client Info */}
      <div className="card mt-4">
        <h3 className="section-title">Client</h3>
        <p className="font-bold" style={{ color: "var(--text)" }}>{est.clientName}</p>
        {est.clientPhone && <p className="text-sm" style={{ color: "var(--text2)" }}>{est.clientPhone}</p>}
        {est.clientEmail && <p className="text-sm" style={{ color: "var(--text2)" }}>{est.clientEmail}</p>}
        {est.clientAddress && <p className="text-sm" style={{ color: "var(--text2)" }}>{est.clientAddress}</p>}
      </div>

      {/* Line Items */}
      <div className="card mt-4">
        <h3 className="section-title">Line Items</h3>
        <div className="space-y-3">
          {est.lineItems?.map((item, i) => (
            <div key={item.id || i} className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.description || "Item"}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{item.quantity} × {money(item.unitPrice)}</p>
              </div>
              <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{money(item.total)}</p>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 space-y-1" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between text-sm"><span style={{ color: "var(--text2)" }}>Subtotal</span><span className="font-bold">{money(est.subtotal)}</span></div>
          {est.markup > 0 && <div className="flex justify-between text-sm"><span style={{ color: "var(--text2)" }}>Markup ({est.markupPercent}%)</span><span className="font-bold">{money(est.markup)}</span></div>}
          {est.tax > 0 && <div className="flex justify-between text-sm"><span style={{ color: "var(--text2)" }}>Tax ({est.taxPercent}%)</span><span className="font-bold">{money(est.tax)}</span></div>}
          <div className="flex justify-between text-lg font-extrabold pt-1"><span>Total</span><span style={{ color: "var(--brand)" }}>{money(est.total)}</span></div>
        </div>
      </div>

      {est.notes && <div className="card mt-4"><h3 className="section-title">Notes</h3><p className="text-sm" style={{ color: "var(--text2)" }}>{est.notes}</p></div>}
      {est.validUntil && <p className="text-xs text-center mt-4" style={{ color: "var(--muted)" }}>Valid until {est.validUntil}</p>}
    </AppShell>
  );
}
