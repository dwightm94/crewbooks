"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { money } from "@/lib/utils";
import { CreditCard, CheckCircle2, FileText, AlertTriangle } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function PayInvoicePage() {
  const { invoiceId } = useParams();
  const searchParams = useSearchParams();
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState(null);
  const cancelled = searchParams.get("cancelled");

  useEffect(() => {
    fetch(`${BASE}/pay/${invoiceId}`).then(r => r.json())
      .then(data => { const d = data.data || data; setInv(d); })
      .catch(() => setErr("Invoice not found"))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handlePay = async () => {
    setPaying(true); setErr(null);
    try {
      const res = await fetch(`${BASE}/pay/${invoiceId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      const d = data.data || data;
      if (d.url) window.location.href = d.url;
      else setErr("Payment setup failed");
    } catch (e) { setErr("Payment failed — try again"); }
    setPaying(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
      <div className="animate-pulse text-center"><CreditCard size={40} style={{ color: "#94A3B8" }} /><p className="mt-2 text-sm" style={{ color: "#94A3B8" }}>Loading invoice...</p></div>
    </div>
  );

  if (err && !inv) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
      <p className="text-lg font-bold" style={{ color: "#94A3B8" }}>Invoice not found</p>
    </div>
  );

  const isPaid = inv?.status === "paid";

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <div className="max-w-lg mx-auto p-6 pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: "#FDB241", color: "#0F172A" }}>
            <FileText size={16} /><span className="font-bold text-sm">CrewBooks Invoice</span>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#0F172A" }}>Invoice for {inv?.clientName}</h1>
          {inv?.jobName && <p className="mt-1" style={{ color: "#64748B" }}>{inv.jobName}</p>}
        </div>

        {cancelled && !isPaid && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: "rgba(234,179,8,0.1)" }}>
            <AlertTriangle size={20} style={{ color: "#EAB308" }} />
            <p className="text-sm font-semibold" style={{ color: "#92400E" }}>Payment cancelled. You can try again below.</p>
          </div>
        )}

        {isPaid ? (
          <div className="rounded-2xl p-6 text-center mb-4" style={{ background: "rgba(34,197,94,0.1)" }}>
            <CheckCircle2 size={48} style={{ color: "#22C55E", margin: "0 auto" }} />
            <p className="text-2xl font-extrabold mt-3" style={{ color: "#22C55E" }}>Paid!</p>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>This invoice has been paid. Thank you!</p>
          </div>
        ) : (
          <>
            {/* Amount */}
            <div className="rounded-2xl p-6 text-center mb-4" style={{ background: "white", border: "2px solid #E2E8F0" }}>
              <p className="text-sm font-bold" style={{ color: "#94A3B8" }}>AMOUNT DUE</p>
              <p className="text-5xl font-extrabold mt-1" style={{ color: "#0F172A" }}>{money(inv?.amount)}</p>
              {inv?.dueDate && <p className="text-sm mt-2" style={{ color: "#94A3B8" }}>Due by {inv.dueDate}</p>}
            </div>

            {err && (
              <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>{err}</p>
              </div>
            )}

            {/* Pay Button */}
            <button onClick={handlePay} disabled={paying}
              className="w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2"
              style={{ background: "#635BFF", color: "white" }}>
              <CreditCard size={20} />
              {paying ? "Setting up payment..." : `Pay ${money(inv?.amount)}`}
            </button>
            <div className="flex items-center justify-center gap-2 mt-3">
              <svg width="40" height="16" viewBox="0 0 40 16"><text x="0" y="13" fontSize="13" fontWeight="bold" fill="#635BFF" fontFamily="sans-serif">stripe</text></svg>
              <span className="text-[10px]" style={{ color: "#94A3B8" }}>Secure payment powered by Stripe</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
