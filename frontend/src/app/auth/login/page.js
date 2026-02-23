"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Hammer, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { login, user, init } = useAuth();
  const { init: themeInit } = useTheme();

  useEffect(() => { themeInit(); }, []);
  // removed auto-redirect - always show login

  const doLogin = async () => {
    if (!email || !pw || busy) return;
    setBusy(true);
    setErr("");
    try {
      const ok = await login(email, pw);
      if (ok) window.location.href = "/dashboard";
      else setBusy(false);
    } catch (e) { setErr(e.message || "Login failed"); setBusy(false); }
  };

  const handleKey = (e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); doLogin(); } };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ background: "var(--brand)" }}>
          <Hammer size={38} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>CrewBooks</h1>
        <p className="mt-2 text-lg" style={{ color: "var(--text2)" }}>Track every dollar. Know who owes you.</p>
      </div>
      <div className="w-full max-w-sm space-y-4" onKeyDown={handleKey}>
        {err && <div className="rounded-2xl p-4 text-sm text-center font-semibold" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{err}</div>}
        <div>
          <label className="field-label">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="field" autoComplete="email" />
        </div>
        <div>
          <label className="field-label">Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" className="field pr-12" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <button type="button" onClick={() => window.location.href = "/auth/forgot-password"} className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Forgot password?</button>
        <button type="button" disabled={busy} onClick={doLogin} className="btn btn-brand w-full text-lg">
          {busy ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Sign In"}
        </button>
        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          No account? <button type="button" onClick={() => window.location.href = "/auth/signup"} className="font-bold" style={{ color: "var(--brand)" }}>Sign Up Free</button>
        </p>
      </div>
    </div>
  );
}
