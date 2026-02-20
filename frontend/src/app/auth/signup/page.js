"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Hammer, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const [step, setStep] = useState("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [code, setCode] = useState("");
  const { register, confirm, login, loading, error, clearError, resendCode } = useAuth();
  const { init } = useTheme();
  const router = useRouter();
  useEffect(() => { init(); }, []);
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const doRegister = async (e) => { e.preventDefault(); clearError(); if (await register(form)) setStep("verify"); };
  const doVerify = async (e) => {
    e.preventDefault(); clearError();
    if (await confirm(form.email, code)) { if (await login(form.email, form.password)) router.replace("/dashboard"); }
  };

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
          {step === "register" ? "Start tracking in 60 seconds" : `We sent a 6-digit code to ${form.email}`}
        </p>
      </div>

      {error && <div className="w-full max-w-sm rounded-2xl p-4 text-sm text-center font-semibold mb-4" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>}

      {step === "register" ? (
        <form onSubmit={doRegister} className="w-full max-w-sm space-y-4">
          <div><label className="field-label">Full Name</label><input type="text" value={form.name} onChange={up("name")} placeholder="Mike Johnson" className="field" required /></div>
          <div><label className="field-label">Email</label><input type="email" value={form.email} onChange={up("email")} placeholder="mike@company.com" className="field" required /></div>
          <div><label className="field-label">Password</label><input type="password" value={form.password} onChange={up("password")} placeholder="8+ characters" className="field" required minLength={8} /></div>
          <button type="submit" disabled={loading} className="btn btn-brand w-full text-lg">
            {loading ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Create Free Account"}
          </button>
          <p className="text-center text-sm" style={{ color: "var(--muted)" }}>Already have an account? <button type="button" onClick={() => router.push("/auth/login")} className="font-bold" style={{ color: "var(--brand)" }}>Sign In</button></p>
        </form>
      ) : (
        <form onSubmit={doVerify} className="w-full max-w-sm space-y-4">
          <div><label className="field-label">Verification Code</label><input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" className="field text-center text-2xl tracking-[0.3em] font-bold" maxLength={6} required autoFocus /></div>
          <button type="submit" disabled={loading} className="btn btn-brand w-full text-lg">
            {loading ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Verify & Continue"}
          </button>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setStep("register")} className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--text2)" }}><ArrowLeft size={16} />Back</button>
            <button type="button" onClick={() => resendCode(form.email)} className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Resend Code</button>
          </div>
        </form>
      )}
    </div>
  );
}
