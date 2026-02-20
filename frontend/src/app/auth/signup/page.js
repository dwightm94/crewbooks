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
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Hammer size={32} className="text-white" /></div>
        <h1 className="text-3xl font-extrabold text-white">{step === "register" ? "Create Account" : "Verify Email"}</h1>
        <p className="text-navy-400 mt-1">{step === "register" ? "Start tracking in 60 seconds" : `Code sent to ${form.email}`}</p>
      </div>
      {error && <div className="w-full max-w-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center mb-4">{error}</div>}
      {step === "register" ? (
        <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4">
          <div><label className="block text-sm text-navy-300 mb-1.5">Name</label><input type="text" value={form.name} onChange={update("name")} placeholder="Mike Johnson" className="input-field" required /></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Email</label><input type="email" value={form.email} onChange={update("email")} placeholder="mike@example.com" className="input-field" required /></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Phone (optional)</label><input type="tel" value={form.phone} onChange={update("phone")} placeholder="(555) 123-4567" className="input-field" /></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Password</label><input type="password" value={form.password} onChange={update("password")} placeholder="8+ characters" className="input-field" required minLength={8} /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-lg">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Free Account"}</button>
          <p className="text-center text-navy-400 text-sm">Have an account? <button type="button" onClick={() => router.push("/auth/login")} className="text-brand-500 font-semibold">Sign In</button></p>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="w-full max-w-sm space-y-4">
          <div><label className="block text-sm text-navy-300 mb-1.5">Verification Code</label><input type="text" value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" className="input-field text-center text-2xl tracking-widest" required maxLength={6} autoFocus /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-lg">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify & Continue"}</button>
          <button type="button" onClick={() => setStep("register")} className="text-navy-400 text-sm w-full text-center">Back</button>
        </form>
      )}
    </div>
  );
}
