"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Hammer, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const [step, setStep] = useState("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { register, confirm, login, resendCode, init } = useAuth();
  const { init: themeInit } = useTheme();
  useEffect(() => { themeInit(); init(); }, []);
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const doRegister = async () => {
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const ok = await register(form);
      if (ok) setStep("verify");
      else setErr("Registration failed. Try again.");
    } catch (e) { setErr(e.message || "Registration failed"); }
    setBusy(false);
  };

  const doVerify = async () => {
    if (busy) return;
    setBusy(true); setErr("");
    try {
      if (await confirm(form.email, code)) {
        if (await login(form.email, form.password)) { window.location.href = "/dashboard"; return; }
      }
      setErr("Verification failed. Check code and try again.");
    } catch (e) { setErr(e.message || "Verification failed"); }
    setBusy(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); step === "register" ? doRegister() : doVerify(); } };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ background: "var(--brand)" }}>
          <Hammer size={38} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          {step === "register" ? "Create Account" : "Check Your Email"}
        </h1>
        <p className="mt-2" style={{ color: "var(--text2)" }}>
          {step === "register" ? "Start tracking in 60 seconds" : "We sent a 6-digit code to " + form.email}
        </p>
      </div>

      {err && <div className="w-full max-w-sm rounded-2xl p-4 text-sm text-center font-semibold mb-4" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{err}</div>}

      {step === "register" ? (
        <div className="w-full max-w-sm space-y-4" onKeyDown={handleKey}>
          <div><label className="field-label">Full Name</label><input type="text" value={form.name} onChange={up("name")} placeholder="Mike Johnson" className="field" /></div>
          <div><label className="field-label">Email</label><input type="email" value={form.email} onChange={up("email")} placeholder="mike@company.com" className="field" /></div>
          <div><label className="field-label">Password</label><input type="password" value={form.password} onChange={up("password")} placeholder="8+ characters" className="field" /></div>
          <button type="button" disabled={busy} onClick={doRegister} className="btn btn-brand w-full text-lg">
            {busy ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Create Free Account"}
          </button>
          <p className="text-center text-sm" style={{ color: "var(--muted)" }}>Already have an account? <button type="button" onClick={() => window.location.href = "/auth/login"} className="font-bold" style={{ color: "var(--brand)" }}>Sign In</button></p>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4" onKeyDown={handleKey}>
          <div><label className="field-label">Verification Code</label><input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" className="field text-center text-2xl tracking-[0.3em] font-bold" maxLength={6} autoFocus /></div>
          <button type="button" disabled={busy} onClick={doVerify} className="btn btn-brand w-full text-lg">
            {busy ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Verify & Continue"}
          </button>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setStep("register")} className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--text2)" }}><ArrowLeft size={16} />Back</button>
            <button type="button" onClick={() => resendCode(form.email)} className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Resend Code</button>
          </div>
        </div>
      )}
    </div>
  );
}
