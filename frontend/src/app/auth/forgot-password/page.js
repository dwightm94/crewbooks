"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Hammer, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const { forgotPassword, resetPassword, loading, error, clearError } = useAuth();
  const { init } = useTheme();
  const router = useRouter();
  useEffect(() => { init(); }, []);

  const doSend = async (e) => { e.preventDefault(); clearError(); if (await forgotPassword(email)) setStep("reset"); };
  const doReset = async (e) => { e.preventDefault(); clearError(); if (await resetPassword(email, code, pw)) router.push("/auth/login"); };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ background: "var(--brand)" }}>
          <Hammer size={38} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          {step === "email" ? "Reset Password" : "Enter New Password"}
        </h1>
        <p className="mt-2" style={{ color: "var(--text2)" }}>
          {step === "email" ? "We'll send you a reset code" : `Code sent to ${email}`}
        </p>
      </div>
      {error && <div className="w-full max-w-sm rounded-2xl p-4 text-sm text-center font-semibold mb-4" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>}
      {step === "email" ? (
        <form onSubmit={doSend} className="w-full max-w-sm space-y-4">
          <div><label className="field-label">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="field" required /></div>
          <button type="submit" disabled={loading} className="btn btn-brand w-full">Send Reset Code</button>
          <button type="button" onClick={() => router.push("/auth/login")} className="flex items-center gap-1 text-sm font-semibold mx-auto" style={{ color: "var(--text2)" }}><ArrowLeft size={16} />Back to login</button>
        </form>
      ) : (
        <form onSubmit={doReset} className="w-full max-w-sm space-y-4">
          <div><label className="field-label">Reset Code</label><input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" className="field text-center text-2xl tracking-[0.3em] font-bold" maxLength={6} required /></div>
          <div><label className="field-label">New Password</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="8+ characters" className="field" required minLength={8} /></div>
          <button type="submit" disabled={loading} className="btn btn-brand w-full">Reset Password</button>
        </form>
      )}
    </div>
  );
}
