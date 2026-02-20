"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Hammer } from "lucide-react";
export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const { login, loading, error, clearError } = useAuth(); const router = useRouter();
  const handleSubmit = async (e) => { e.preventDefault(); clearError(); const ok = await login(email, password); if (ok) router.replace("/dashboard"); };
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Hammer size={32} className="text-white" /></div>
        <h1 className="text-3xl font-extrabold text-white">CrewBooks</h1>
        <p className="text-navy-400 mt-1">Track every dollar. Know who owes you.</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>}
        <div><label className="block text-sm text-navy-300 mb-1.5">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="mike@example.com" className="input-field" required /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="input-field" required /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full text-lg">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sign In"}</button>
        <p className="text-center text-navy-400 text-sm">No account? <button type="button" onClick={() => router.push("/auth/signup")} className="text-brand-500 font-semibold">Sign Up Free</button></p>
      </form>
    </div>
  );
}
