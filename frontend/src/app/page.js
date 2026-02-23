"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // If logged in, redirect to dashboard
    const tokens = localStorage.getItem("crewbooks_tokens");
    if (tokens) { setIsLoggedIn(true); router.replace("/dashboard"); }
  }, [router]);

  if (isLoggedIn) return null;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#FFFBF5", color: "#1A1A1A" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .fade-in { opacity: 0; transform: translateY(20px); animation: fadeUp 0.6s ease forwards; }
        .fade-in-d1 { animation-delay: 0.1s; }
        .fade-in-d2 { animation-delay: 0.2s; }
        .fade-in-d3 { animation-delay: 0.3s; }
        .fade-in-d4 { animation-delay: 0.4s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 100, background: "rgba(255,251,245,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F59E0B, #EF4444)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 18 }}>C</div>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>CrewBooks</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="#features" style={{ color: "#666", textDecoration: "none", fontWeight: 500, fontSize: 14, display: "none" }}>Features</a>
            <a href="#pricing" style={{ color: "#666", textDecoration: "none", fontWeight: 500, fontSize: 14, display: "none" }}>Pricing</a>
            <button onClick={() => router.push("/auth/login")} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #ddd", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#333" }}>Log In</button>
            <button onClick={() => router.push("/auth/signup")} style={{ padding: "8px 16px", background: "linear-gradient(135deg, #F59E0B, #EF4444)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "white" }}>Start Free</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 60, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.06), transparent)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          <div className="fade-in" style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 13, fontWeight: 600, color: "#B45309", marginBottom: 20 }}>
            Built for construction subcontractors
          </div>
          <h1 className="fade-in fade-in-d1" style={{ fontSize: "clamp(36px, 7vw, 60px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 20 }}>
            Track every dollar.<br /><span style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Know who owes you.</span>
          </h1>
          <p className="fade-in fade-in-d2" style={{ fontSize: 18, color: "#666", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 32px" }}>
            Jobs, invoicing, crew scheduling, expenses, and payments — all in one app built specifically for trades.
          </p>
          <div className="fade-in fade-in-d3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/auth/signup")} style={{ padding: "14px 32px", background: "linear-gradient(135deg, #F59E0B, #EF4444)", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: "pointer", color: "white", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
              Start Free — No Credit Card
            </button>
            <a href="#features" style={{ padding: "14px 24px", background: "white", border: "2px solid #E5E7EB", borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: "pointer", color: "#333", textDecoration: "none", display: "inline-block" }}>
              See Features ↓
            </a>
          </div>
          <p className="fade-in fade-in-d4" style={{ marginTop: 16, fontSize: 13, color: "#999" }}>Free plan includes 3 active jobs • Upgrade anytime</p>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: "20px 24px 40px", textAlign: "center" }}>
        <div className="fade-in" style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", opacity: 0.5 }}>
          {["HVAC", "Plumbing", "Electrical", "Roofing", "Concrete", "Framing"].map(t => (
            <span key={t} style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#999" }}>{t}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "60px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.5 }}>Everything you need to run your crew</h2>
          <p style={{ color: "#666", fontSize: 16, marginTop: 8 }}>No spreadsheets. No guessing. No chasing money.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            { icon: "💼", title: "Job Tracking", desc: "Create jobs, track status from bid to paid. See margin on every project in real time." },
            { icon: "📄", title: "Invoicing", desc: "Generate professional invoices in one tap. Send to clients, track payments, get paid faster." },
            { icon: "👷", title: "Crew Management", desc: "Add crew members, assign to jobs, schedule daily. Everyone knows where to be." },
            { icon: "📸", title: "Photo Documentation", desc: "Snap job photos, organize by category. Before/after, progress, issues — all documented." },
            { icon: "📊", title: "Reports & Analytics", desc: "Revenue charts, profitability rankings, expense breakdowns. Know your numbers." },
            { icon: "💳", title: "Online Payments", desc: "Clients pay invoices by credit card. Funds go straight to your bank. 2.5% fee." },
            { icon: "📋", title: "Estimates & Bidding", desc: "Create estimates, send to clients for approval. Convert accepted bids to jobs instantly." },
            { icon: "🛡️", title: "Compliance Tracking", desc: "Track licenses, insurance, certifications. Get alerts before anything expires." },
            { icon: "📅", title: "Daily Logs", desc: "Log work performed, weather, crew hours. Complete job documentation for disputes." },
          ].map((f, i) => (
            <div key={f.title} className="hover-lift" style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ fontSize: 32 }}>{f.icon}</span>
              <h3 style={{ fontWeight: 800, fontSize: 17, marginTop: 12, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ color: "#666", fontSize: 14, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "60px 24px", background: "white" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.5, marginBottom: 48 }}>Get started in 60 seconds</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
            {[
              { step: "1", title: "Sign up free", desc: "Create your account. No credit card needed." },
              { step: "2", title: "Add your first job", desc: "Enter client, amount, address. Takes 30 seconds." },
              { step: "3", title: "Send an invoice", desc: "One tap to generate. Send via text or email." },
              { step: "4", title: "Get paid", desc: "Clients pay online. Money hits your bank." },
            ].map(s => (
              <div key={s.step}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #F59E0B, #EF4444)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 20, margin: "0 auto 12px" }}>{s.step}</div>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{s.title}</h3>
                <p style={{ color: "#666", fontSize: 14 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "60px 24px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.5 }}>Simple, honest pricing</h2>
          <p style={{ color: "#666", fontSize: 16, marginTop: 8 }}>Start free. Upgrade when you're ready.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {/* Free */}
          <div className="hover-lift" style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid rgba(0,0,0,0.08)" }}>
            <p style={{ fontWeight: 800, fontSize: 18 }}>Free</p>
            <p style={{ fontSize: 42, fontWeight: 900, margin: "8px 0 4px" }}>$0</p>
            <p style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>Great for getting started</p>
            <button onClick={() => router.push("/auth/signup")} style={{ width: "100%", padding: "12px", background: "#F3F4F6", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#333" }}>Get Started</button>
            <ul style={{ marginTop: 20, listStyle: "none", padding: 0 }}>
              {["3 active jobs", "3 invoices/month", "Crew scheduling", "Photo documentation", "Daily logs", "Estimates & bidding", "Compliance tracking"].map(f => (
                <li key={f} style={{ padding: "6px 0", fontSize: 14, color: "#555", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#22C55E", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="hover-lift" style={{ background: "white", borderRadius: 20, padding: 28, border: "2px solid #F59E0B", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 14px", borderRadius: 20, background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "white", fontSize: 12, fontWeight: 800 }}>MOST POPULAR</div>
            <p style={{ fontWeight: 800, fontSize: 18 }}>Pro</p>
            <p style={{ fontSize: 42, fontWeight: 900, margin: "8px 0 4px" }}>$39<span style={{ fontSize: 16, fontWeight: 500, color: "#999" }}>/mo</span></p>
            <p style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>For serious contractors</p>
            <button onClick={() => router.push("/auth/signup")} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #F59E0B, #EF4444)", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "white" }}>Start Free Trial</button>
            <ul style={{ marginTop: 20, listStyle: "none", padding: 0 }}>
              {["Everything in Free, plus:", "Unlimited jobs", "Unlimited invoicing", "Online payments (2.5% fee)", "Full reports & analytics", "Payment reminders", "Priority support"].map((f, i) => (
                <li key={f} style={{ padding: "6px 0", fontSize: 14, color: i === 0 ? "#F59E0B" : "#555", fontWeight: i === 0 ? 700 : 400, display: "flex", alignItems: "center", gap: 8 }}>
                  {i > 0 && <span style={{ color: "#22C55E", fontWeight: 700 }}>✓</span>}{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div className="hover-lift" style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid rgba(0,0,0,0.08)", opacity: 0.7 }}>
            <p style={{ fontWeight: 800, fontSize: 18 }}>Team</p>
            <p style={{ fontSize: 42, fontWeight: 900, margin: "8px 0 4px" }}>$79<span style={{ fontSize: 16, fontWeight: 500, color: "#999" }}>/mo</span></p>
            <p style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>For growing companies</p>
            <div style={{ width: "100%", padding: "12px", background: "#F3F4F6", borderRadius: 12, textAlign: "center", fontWeight: 700, fontSize: 14, color: "#999" }}>Coming Soon</div>
            <ul style={{ marginTop: 20, listStyle: "none", padding: 0 }}>
              {["Everything in Pro, plus:", "Up to 10 users", "25GB photo storage", "QuickBooks sync", "Dedicated support"].map((f, i) => (
                <li key={f} style={{ padding: "6px 0", fontSize: 14, color: i === 0 ? "#6366F1" : "#555", fontWeight: i === 0 ? 700 : 400, display: "flex", alignItems: "center", gap: 8 }}>
                  {i > 0 && <span style={{ color: "#22C55E", fontWeight: 700 }}>✓</span>}{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg, #1A1A1A, #333)", borderRadius: 24, padding: "48px 32px" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 12 }}>Stop losing money on every job</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 24 }}>Join contractors who track every dollar and always know who owes them.</p>
          <button onClick={() => router.push("/auth/signup")} style={{ padding: "14px 32px", background: "linear-gradient(135deg, #F59E0B, #EF4444)", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: "pointer", color: "white" }}>
            Get Started Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 24px", borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #F59E0B, #EF4444)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 14 }}>C</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>CrewBooks</span>
        </div>
        <p style={{ color: "#999", fontSize: 13 }}>© 2026 CrewBooks. Built for the trades.</p>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="mailto:support@crewbooks.app" style={{ color: "#999", fontSize: 13, textDecoration: "none" }}>Support</a>
          <a href="/auth/login" style={{ color: "#999", fontSize: 13, textDecoration: "none" }}>Login</a>
        </div>
      </footer>
    </div>
  );
}
