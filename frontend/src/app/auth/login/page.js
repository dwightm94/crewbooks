"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const { init: themeInit } = useTheme();

  useEffect(() => { themeInit(); }, []);

  const doLogin = async () => {
    if (!email || !pw || busy) return;
    setBusy(true);
    setErr("");
    try {
      const ok = await login(email, pw);
      if (ok) window.location.href = "/dashboard";
      else { setErr("Incorrect email or password."); setBusy(false); }
    } catch (e) { setErr(e.message || "Login failed"); setBusy(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); doLogin(); }
  };

  const handleGoogle = () => {
    const domain = window.location.hostname;
    const redirectUri = `https://${domain}/auth/callback`;
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const url = `${cognitoDomain}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&identity_provider=Google&scope=email+openid+profile`;
    window.location.href = url;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 24px" }}>
        <div style={{ width: 30, height: 30, background: "#F59E0B", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 010-3L12 9"/>
            <path d="M17.64 15L22 10.64"/>
            <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1A2E", letterSpacing: "-0.02em" }}>CrewBooks</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem 3rem" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, background: "#F59E0B", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 32px rgba(245,158,11,0.28)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="44" height="44">
              <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 010-3L12 9"/>
              <path d="M17.64 15L22 10.64"/>
              <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 30, fontWeight: 700, color: "#1A1A2E", letterSpacing: "-0.03em", marginBottom: 6 }}>CrewBooks</h1>
          <p style={{ fontSize: 15, color: "#717190" }}>Jobs, invoices, and crew — all in one place.</p>
        </div>

        <div style={{ width: "100%", maxWidth: 360 }} onKeyDown={handleKey}>
          {err && (
            <div style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 16 }}>
              {err}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#3D3D5C", marginBottom: 6 }}>Email</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center", background: "#F5F2EE", border: "1.5px solid #E5E0D8", borderRadius: 12 }}>
              <span style={{ position: "absolute", left: 14, color: "#A3A3B8", display: "flex", pointerEvents: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
                </svg>
              </span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email"
                style={{ width: "100%", height: 50, padding: "0 14px 0 42px", background: "transparent", border: "none", outline: "none", fontSize: 15, fontWeight: 500, color: "#1A1A2E", fontFamily: "inherit" }} />
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#3D3D5C", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center", background: "#F5F2EE", border: "1.5px solid #E5E0D8", borderRadius: 12 }}>
              <span style={{ position: "absolute", left: 14, color: "#A3A3B8", display: "flex", pointerEvents: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </span>
              <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                style={{ width: "100%", height: 50, padding: "0 44px 0 42px", background: "transparent", border: "none", outline: "none", fontSize: 15, fontWeight: 500, color: "#1A1A2E", fontFamily: "inherit" }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, background: "none", border: "none", cursor: "pointer", color: "#A3A3B8", display: "flex", padding: 0 }}>
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <button type="button" onClick={() => window.location.href = "/auth/forgot-password"} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#D97706" }}>
              Forgot password?
            </button>
          </div>

          <button type="button" disabled={busy} onClick={doLogin}
            style={{ width: "100%", height: 52, background: "#F59E0B", color: "#1A1A2E", border: "none", borderRadius: 12, fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "0 4px 16px rgba(245,158,11,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {busy ? <span style={{ width: 20, height: 20, border: "2px solid #1A1A2E", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : "Sign In"}
          </button>

          <p style={{ textAlign: "center", fontSize: 14, color: "#717190", marginTop: 16 }}>
            No account?{" "}
            <button type="button" onClick={() => window.location.href = "/auth/signup"} style={{ background: "none", border: "none", cursor: "pointer", color: "#D97706", fontWeight: 700, fontSize: 14 }}>Sign Up Free</button>
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 16px" }}>
            <div style={{ flex: 1, height: 1, background: "#E5E0D8" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3B8", whiteSpace: "nowrap" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "#E5E0D8" }} />
          </div>

          <button type="button" onClick={handleGoogle}
            style={{ width: "100%", height: 50, background: "#FFFFFF", border: "1.5px solid #E5E0D8", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#3D3D5C", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "inherit" }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#A3A3B8", padding: "0 16px 24px", lineHeight: 1.5 }}>
        By signing in you agree to our{" "}
        <a href="/terms" style={{ color: "#717190", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms</a>{" "}
        &amp;{" "}
        <a href="/privacy" style={{ color: "#717190", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</a>.{" "}
        ©2026 CrewBooks.
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
