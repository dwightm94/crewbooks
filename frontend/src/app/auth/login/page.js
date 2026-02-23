"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Hammer, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [showPw, setShowPw] = useState(false);
  const { login, loading, error, clearError, user } = useAuth();
  const { init } = useTheme();
  const router = useRouter();
  useEffect(() => { init(); }, []);
  useEffect(() => { if (user) window.location.href = "/dashboard"; }, [user]);

  const submit = async (e) => { e.preventDefault(); clearError(); if (await login(email, pw)) window.location.href = "/dashboard"; };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ background: "var(--brand)" }}>
          <Hammer size={38} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>CrewBooks</h1>
        <p className="mt-2 text-lg" style={{ color: "var(--text2)" }}>Track every dollar. Know who owes you.</p>
      </div>
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        {error && <div className="rounded-2xl p-4 text-sm text-center font-semibold" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>}
        <div>
          <label className="field-label">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="field" required autoComplete="email" />
        </div>
        <div>
          <label className="field-label">Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" className="field pr-12" required autoComplete="current-password" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <button type="button" onClick={() => router.push("/auth/forgot-password")} className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Forgot password?</button>
        <button type="submit" disabled={loading} className="btn btn-brand w-full text-lg">
          {loading ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Sign In"}
        </button>
        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          No account? <button type="button" onClick={() => router.push("/auth/signup")} className="font-bold" style={{ color: "var(--brand)" }}>Sign Up Free</button>
        </p>
      </form>
    </div>
  );
}
