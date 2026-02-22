"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

function PaySuccessContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.1)" }}>
          <CheckCircle2 size={48} style={{ color: "#22C55E" }} />
        </div>
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#0F172A" }}>Payment Successful!</h1>
        <p className="text-lg mb-6" style={{ color: "#64748B" }}>Thank you for your payment. A receipt has been sent to your email.</p>
        <div className="rounded-2xl p-4" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-sm" style={{ color: "#64748B" }}>If you have any questions, please contact your contractor directly.</p>
        </div>
      </div>
    </div>
  );
}

export default function PaySuccessPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}><p>Loading...</p></div>}><PaySuccessContent /></Suspense>;
}
