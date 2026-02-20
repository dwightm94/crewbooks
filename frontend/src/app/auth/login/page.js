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
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{backgroundColor: "var(--bg-primary)"}}>
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{backgroundColor: "var(--brand)"}}>
          <Hammer size={36} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight" style={{color: "var(--text-primary)"}}>CrewBooks</h1>
        <p className="mt-2 text-base" style={{color: "var(--text-secondary)"}}>Track every dollar. Know who owes you.</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && <div className="rounded-2xl p-4 text-sm text-center font-medium" style={{backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)"}}>{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{color: "var(--text-secondary)"}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="input-field" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full text-lg font-bold">
          {loading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Sign In"}
        </button>
        <p className="text-center text-sm" style={{color: "var(--text-muted)"}}>
          No account? <button type="button" onClick={() => router.push("/auth/signup")} className="font-bold" style={{color: "var(--brand)"}}>Sign Up Free</button>
        </p>
      </form>
    </div>
  );
}
