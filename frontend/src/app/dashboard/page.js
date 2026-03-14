"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const tokens = localStorage.getItem("crewbooks_tokens");
      if (tokens) { router.replace("/dashboard"); return; }
    } catch {}
    setReady(true);
  }, [router]);

  if (!ready) return null;

  const brand = "linear-gradient(135deg, #F59E0B, #EF4444)";

  return (
    <div style={{ background: "#FFFBF5", color: "#1A1A1A", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 100, background: "rgba(255,251,245,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: brand, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 18 }}>C</div>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>CrewBooks</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => router.push("/auth/login")} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #ddd", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#333" }}>Log In</button>
            <button onClick={() => router.push("/auth/signup")} style={{ padding: "8px 16px", background: brand, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "white" }}>Start Free</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 130, paddingBottom: 60, textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 13, fontWeight: 600, color: "#B45309", marginBottom: 20 }}>
            Built for construction subcontractors
          </div>
          <h1 style={{ fontSize: "clamp(36px, 7vw, 56px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
            Track every dollar.{" "}
            <span style={{ background: brand, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Know who owes you.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 32px" }}>
            Jobs, invoicing, crew scheduling, expenses, and payments — all in one app built for trades.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/auth/signup")} style={{ padding: "14px 32px", background: brand, border: "none", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: "pointer", color: "white", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
              Start Free — No Credit Card
            </button>
            <button onClick={() => { const el = document.getElementById("features"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} style={{ padding: "14px 24px", background: "white", border: "2px solid #E5E7EB", borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: "pointer", color: "#333" }}>
              See Features
            </button>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "#999" }}>Free plan includes 3 active jobs. Upgrade anytime.</p>
        </div>
      </section>

      {/* Trades */}
      <section style={{ padding: "20px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", opacity: 0.5 }}>
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
          {features.map((f) => (
            <div key={f.title} style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
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
            {steps.map(s => (
              <div key={s.step}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: brand, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 20, margin: "0 auto 12px" }}>{s.step}</div>
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
          <p style={{ color: "#666", fontSize: 16, marginTop: 8 }}>Start free. Upgrade when you are ready.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {/* Free */}
          <PricingCard title="Free" price="$0" sub="Great for getting started" cta="Get Started" ctaBg="#F3F4F6" ctaColor="#333" border="1px solid rgba(0,0,0,0.08)"
            features={["3 active jobs", "3 invoices/month", "Crew scheduling", "Photo documentation", "Daily logs", "Estimates & bidding", "Compliance tracking"]}
            onCta={() => router.push("/auth/signup")} />
          {/* Pro */}
          <PricingCard title="Pro" price="$39" priceSub="/mo" sub="For serious contractors" cta="Start Free Trial" ctaBg={brand} ctaColor="white" border="2px solid #F59E0B" badge="MOST POPULAR"
            features={["Everything in Free, plus:", "Unlimited jobs", "Unlimited invoicing", "Online payments (2.5% fee)", "Full reports & analytics", "Payment reminders", "Priority support"]}
            onCta={() => router.push("/auth/signup")} />
          {/* Team */}
          <PricingCard title="Team" price="$79" priceSub="/mo" sub="For growing companies" cta="Coming Soon" ctaBg="#F3F4F6" ctaColor="#999" border="1px solid rgba(0,0,0,0.08)" opacity={0.7} disabled
            features={["Everything in Pro, plus:", "Up to 10 users", "25GB photo storage", "QuickBooks sync", "Dedicated support"]} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg, #1A1A1A, #333)", borderRadius: 24, padding: "48px 32px" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 12 }}>Stop losing money on every job</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 24 }}>Join contractors who track every dollar and always know who owes them.</p>
          <button onClick={() => router.push("/auth/signup")} style={{ padding: "14px 32px", background: brand, border: "none", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: "pointer", color: "white" }}>
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 24px", borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: brand, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 14 }}>C</div>
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

function PricingCard({ title, price, priceSub, sub, cta, ctaBg, ctaColor, border, badge, features, onCta, opacity, disabled }) {
  return (
    <div style={{ background: "white", borderRadius: 20, padding: 28, border, position: "relative", opacity: opacity || 1, transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      {badge && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 14px", borderRadius: 20, background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "white", fontSize: 12, fontWeight: 800 }}>{badge}</div>}
      <p style={{ fontWeight: 800, fontSize: 18 }}>{title}</p>
      <p style={{ fontSize: 42, fontWeight: 900, margin: "8px 0 4px" }}>{price}{priceSub && <span style={{ fontSize: 16, fontWeight: 500, color: "#999" }}>{priceSub}</span>}</p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>{sub}</p>
      <button onClick={disabled ? undefined : onCta} disabled={disabled} style={{ width: "100%", padding: "12px", background: ctaBg, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: disabled ? "default" : "pointer", color: ctaColor }}>{cta}</button>
      <ul style={{ marginTop: 20, listStyle: "none", padding: 0 }}>
        {features.map((f, i) => {
          const isHeader = f.startsWith("Everything");
          return (
            <li key={f} style={{ padding: "6px 0", fontSize: 14, color: isHeader ? "#F59E0B" : "#555", fontWeight: isHeader ? 700 : 400, display: "flex", alignItems: "center", gap: 8 }}>
              {!isHeader && <span style={{ color: "#22C55E", fontWeight: 700 }}>&#10003;</span>}{f}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const features = [
  { icon: "\uD83D\uDCBC", title: "Job Tracking", desc: "Create jobs, track status from bid to paid. See margin on every project in real time." },
  { icon: "\uD83D\uDCC4", title: "Invoicing", desc: "Generate professional invoices in one tap. Send to clients, track payments, get paid faster." },
  { icon: "\uD83D\uDC77", title: "Crew Management", desc: "Add crew members, assign to jobs, schedule daily. Everyone knows where to be." },
  { icon: "\uD83D\uDCF8", title: "Photo Documentation", desc: "Snap job photos, organize by category. Before/after, progress, issues — all documented." },
  { icon: "\uD83D\uDCCA", title: "Reports & Analytics", desc: "Revenue charts, profitability rankings, expense breakdowns. Know your numbers." },
  { icon: "\uD83D\uDCB3", title: "Online Payments", desc: "Clients pay invoices by credit card. Funds go straight to your bank. 2.5% fee." },
  { icon: "\uD83D\uDCCB", title: "Estimates & Bidding", desc: "Create estimates, send to clients for approval. Convert accepted bids to jobs instantly." },
  { icon: "\uD83D\uDEE1\uFE0F", title: "Compliance Tracking", desc: "Track licenses, insurance, certifications. Get alerts before anything expires." },
  { icon: "\uD83D\uDCC5", title: "Daily Logs", desc: "Log work performed, weather, crew hours. Complete job documentation for disputes." },
];

const steps = [
  { step: "1", title: "Sign up free", desc: "Create your account. No credit card needed." },
  { step: "2", title: "Add your first job", desc: "Enter client, amount, address. Takes 30 seconds." },
  { step: "3", title: "Send an invoice", desc: "One tap to generate. Send via text or email." },
  { step: "4", title: "Get paid", desc: "Clients pay online. Money hits your bank." },
];
