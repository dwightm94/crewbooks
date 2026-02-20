"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Hammer } from "lucide-react";
export default function SignupPage() {
  const [step, setStep] = useState("register");
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"" });
  const [code, setCode] = useState("");
  const { register, confirm, login, loading, error, clearError } = useAuth();
  const router = useRouter();
  const update = (f) => (e) => setForm({...form, [f]: e.target.value});
  const handleRegister = async (e) => { e.preventDefault(); clearError(); if (await register(form)) setStep("confirm"); };
  const handleConfirm = async (e) => { e.preventDefault(); clearError(); if (await confirm(form.email, code)) { if (await login(form.email, form.password)) router.replace("/dashboard"); } };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{backgroundColor: "var(--bg-primary)"}}>
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{backgroundColor: "var(--brand)"}}>
          <Hammer size={36} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-extrabold" style={{color: "var(--text-primary)"}}>{step === "register" ? "Create Account" : "Check Your Email"}</h1>
        <p className="mt-2" style={{color: "var(--text-secondary)"}}>{step === "register" ? "Start tracking in 60 seconds" : `Code sent to ${form.email}`}</p>
      </div>
      {error && <div className="w-full max-w-sm rounded-2xl p-4 text-sm text-center font-medium mb-4" style={{backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)"}}>{error}</div>}
      {step === "register" ? (
        <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4">
          <div><label className="block text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>Name</label><input type="text" value={form.name} onChange={update("name")} placeholder="Mike Johnson" className="input-field" required /></div>
          <div><label className="block text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>Email</label><input type="email" value={form.email} onChange={update("email")} placeholder="mike@company.com" className="input-field" required /></div>
          <div><label className="block text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>Phone (optional)</label><input type="tel" value={form.phone} onChange={update("phone")} placeholder="(555) 123-4567" className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>Password</label><input type="password" value={form.password} onChange={update("password")} placeholder="8+ characters" className="input-field" required minLength={8} /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-lg font-bold">{loading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Create Free Account"}</button>
          <p className="text-center text-sm" style={{color: "var(--text-muted)"}}>Have an account? <button type="button" onClick={() => router.push("/auth/login")} className="font-bold" style={{color: "var(--brand)"}}>Sign In</button></p>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="w-full max-w-sm space-y-4">
          <div><label className="block text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>Verification Code</label><input type="text" value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" className="input-field text-center text-2xl tracking-[0.3em] font-bold" required maxLength={6} autoFocus /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-lg font-bold">{loading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Verify & Continue"}</button>
          <button type="button" onClick={() => setStep("register")} className="text-sm w-full text-center font-medium" style={{color: "var(--text-muted)"}}>Back</button>
        </form>
      )}
    </div>
  );
}
