"use client";
import { useRouter } from "next/navigation";
import { Lock, Zap } from "lucide-react";

export function ProGate({ feature, title, description }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(245,158,11,0.1)" }}>
        <Lock size={28} style={{ color: "#F59E0B" }} />
      </div>
      <h2 className="text-lg font-extrabold mb-1" style={{ color: "var(--text)" }}>{title || "Pro Feature"}</h2>
      <p className="text-sm mb-6" style={{ color: "var(--text2)", maxWidth: 280 }}>
        {description || `${feature} is available on the Pro plan. Upgrade to unlock.`}
      </p>
      <button onClick={() => router.push("/upgrade")}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold"
        style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
        <Zap size={18} /> Upgrade to Pro
      </button>
    </div>
  );
}
