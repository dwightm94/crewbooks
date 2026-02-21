"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { money } from "@/lib/utils";
import { CheckCircle2, FileText } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function EstimateViewPage() {
  const { token } = useParams();
  const [est, setEst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [signature, setSignature] = useState("");
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/estimate-view/${token}`).then(r => r.json())
      .then(data => { const d = data.data || data; setEst(d); if (d.status === "approved") setApproved(true); })
      .catch(() => setErr("Estimate not found"))
      .finally(() => setLoading(false));
  }, [token]);

  const doApprove = async () => {
    if (!signature.trim()) { alert("Please type your name to sign"); return; }
    setApproving(true);
    try {
      await fetch(`${BASE}/estimate-view/${token}/approve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      setApproved(true);
    } catch (e) { alert("Failed to approve"); }
    setApproving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
      <div className="animate-pulse text-center"><FileText size={40} style={{ color: "#94A3B8" }} /><p className="mt-2 text-sm" style={{ color: "#94A3B8" }}>Loading estimate...</p></div>
    </div>
  );
  if (err || !est) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
      <p className="text-lg font-bold" style={{ color: "#94A3B8" }}>Estimate not found</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <div className="max-w-lg mx-auto p-6 pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: "#FDB241", color: "#0F172A" }}>
            <FileText size={16} /><span className="font-bold text-sm">CrewBooks Estimate</span>
          </div>
          <h1 className="text-3xl font-extrabold" style={{ color: "#0F172A" }}>Estimate for {est.clientName}</h1>
          {est.jobDescription && <p className="mt-1" style={{ color: "#64748B" }}>{est.jobDescription}</p>}
        </div>

        {approved && (
          <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: "rgba(34,197,94,0.1)" }}>
            <CheckCircle2 size={32} style={{ color: "#22C55E", margin: "0 auto" }} />
            <p className="font-bold mt-2" style={{ color: "#22C55E" }}>Estimate Approved!</p>
            <p className="text-sm" style={{ color: "#64748B" }}>
              {est.approvedSignature ? `Signed by: ${est.approvedSignature}` : "Thank you for your approval."}
            </p>
          </div>
        )}

        {/* Line Items */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <h3 className="text-xs font-bold mb-3" style={{ color: "#94A3B8", letterSpacing: "0.05em" }}>LINE ITEMS</h3>
          <div className="space-y-3">
            {est.lineItems?.map((item, i) => (
              <div key={item.id || i} className="flex justify-between items-start pb-3" style={{ borderBottom: i < est.lineItems.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{item.description || "Item"}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{item.quantity} × {money(item.unitPrice)}</p>
                </div>
                <p className="font-bold text-sm" style={{ color: "#0F172A" }}>{money(item.total)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-2" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex justify-between text-sm"><span style={{ color: "#94A3B8" }}>Subtotal</span><span className="font-bold">{money(est.subtotal)}</span></div>
            {est.markup > 0 && <div className="flex justify-between text-sm"><span style={{ color: "#94A3B8" }}>Markup ({est.markupPercent}%)</span><span className="font-bold">{money(est.markup)}</span></div>}
            {est.tax > 0 && <div className="flex justify-between text-sm"><span style={{ color: "#94A3B8" }}>Tax ({est.taxPercent}%)</span><span className="font-bold">{money(est.tax)}</span></div>}
            <div className="flex justify-between pt-2" style={{ borderTop: "2px solid #E2E8F0" }}>
              <span className="text-xl font-extrabold" style={{ color: "#0F172A" }}>Total</span>
              <span className="text-xl font-extrabold" style={{ color: "#FDB241" }}>{money(est.total)}</span>
            </div>
          </div>
        </div>

        {est.notes && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <h3 className="text-xs font-bold mb-2" style={{ color: "#94A3B8", letterSpacing: "0.05em" }}>NOTES</h3>
            <p className="text-sm" style={{ color: "#64748B" }}>{est.notes}</p>
          </div>
        )}

        {est.validUntil && <p className="text-xs text-center mb-4" style={{ color: "#94A3B8" }}>This estimate is valid until {est.validUntil}</p>}

        {/* Approve section */}
        {!approved && (
          <div className="rounded-2xl p-4" style={{ background: "white", border: "2px solid #FDB241" }}>
            <h3 className="font-bold text-center mb-3" style={{ color: "#0F172A" }}>Approve this Estimate</h3>
            <div className="mb-3">
              <label className="text-xs font-bold block mb-1" style={{ color: "#94A3B8" }}>TYPE YOUR NAME TO SIGN</label>
              <input value={signature} onChange={e => setSignature(e.target.value)}
                placeholder="Your full name" className="w-full px-4 py-3 rounded-xl text-lg border"
                style={{ borderColor: "#E2E8F0", fontFamily: "cursive", fontSize: "1.25rem" }} />
            </div>
            <button onClick={doApprove} disabled={approving}
              className="w-full py-4 rounded-xl text-lg font-bold"
              style={{ background: "#22C55E", color: "white" }}>
              {approving ? "Approving..." : `✓ Approve — ${money(est.total)}`}
            </button>
            <p className="text-[10px] text-center mt-2" style={{ color: "#94A3B8" }}>By approving, you agree to the scope and pricing above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
