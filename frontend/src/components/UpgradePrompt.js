"use client";
import { useRouter } from "next/navigation";
import { Zap, X } from "lucide-react";

export function UpgradePrompt({ message, onClose }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 relative" style={{ background: "var(--card)" }}>
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-lg" style={{ color: "var(--muted)" }}>
            <X size={20} />
          </button>
        )}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
            <Zap size={28} color="white" />
          </div>
          <h3 className="text-xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Upgrade to Pro</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text2)" }}>{message || "Unlock this feature with CrewBooks Pro."}</p>
          <div className="rounded-xl p-3 mb-4" style={{ background: "var(--input)" }}>
            <p className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>$39<span className="text-sm font-normal" style={{ color: "var(--text2)" }}>/month</span></p>
            <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>Unlimited jobs • Unlimited invoices • Online payments</p>
          </div>
          <button onClick={() => router.push("/upgrade")} className="btn btn-brand w-full text-lg">
            <Zap size={18} />Upgrade Now
          </button>
          {onClose && (
            <button onClick={onClose} className="text-sm font-semibold mt-3 block mx-auto" style={{ color: "var(--text2)" }}>
              Maybe later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline upgrade banner (non-modal)
export function UpgradeBanner({ message, compact }) {
  const router = useRouter();

  if (compact) {
    return (
      <button onClick={() => router.push("/upgrade")}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold w-full"
        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
        <Zap size={14} />{message || "Upgrade to Pro"} →
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.08))", border: "1px solid rgba(245,158,11,0.15)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
          <Zap size={20} color="white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{message || "Upgrade to unlock this feature"}</p>
          <p className="text-xs" style={{ color: "var(--text2)" }}>$39/mo for unlimited everything</p>
        </div>
        <button onClick={() => router.push("/upgrade")} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
          Upgrade
        </button>
      </div>
    </div>
  );
}
