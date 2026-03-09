"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createCrewMember } from "@/lib/api";
import { Plus, Trash2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

const ROLES = ["Electrician", "Plumber", "Carpenter", "Laborer", "Foreman", "Apprentice", "HVAC Tech", "Painter", "Mason", "Roofer", "Other"];
const CERT_TYPES = ["OSHA 10", "OSHA 30", "Driver's License", "Forklift Certification", "First Aid/CPR", "Electrical License", "Plumbing License", "CDL", "Other"];

export default function NewCrewMemberPage() {
  const [form, setForm] = useState({ name: "", phone: "", role: "", hourlyRate: "" });
  const [certifications, setCertifications] = useState([]);
  const [certsOpen, setCertsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const addCert = () => { setCertifications([...certifications, { name: "", expiryDate: "", notes: "" }]); setCertsOpen(true); };
  const removeCert = (i) => setCertifications(certifications.filter((_, idx) => idx !== i));
  const updateCert = (i, field, value) => { const u = [...certifications]; u[i] = { ...u[i], [field]: value }; setCertifications(u); };

  const submit = async (e) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      await createCrewMember({ ...form, hourlyRate: Number(form.hourlyRate) || 0, certifications: certifications.filter(c => c.name) });
      router.replace("/crew");
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <AppShell title="Add Crew Member" back="/crew">
      <form onSubmit={submit} className="mt-4 space-y-5">
        {error && <div className="rounded-2xl p-4 text-sm font-semibold" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>}

        <section>
          <h3 className="section-title">Person</h3>
          <div className="space-y-3">
            <div><label className="field-label">Name *</label><input value={form.name} onChange={up("name")} placeholder="Mike Johnson" className="field" required /></div>
            <div><label className="field-label">Phone</label><input type="tel" value={form.phone} onChange={up("phone")} placeholder="(555) 123-4567" className="field" /></div>
          </div>
        </section>

        <section>
          <h3 className="section-title">Role & Pay</h3>
          <div className="space-y-3">
            <div>
              <label className="field-label">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
                    className="card text-center py-3 transition-all text-sm"
                    style={{ borderColor: form.role === r ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                    <span className="font-bold" style={{ color: form.role === r ? "var(--brand)" : "var(--text2)" }}>{r}</span>
                  </button>
                ))}
              </div>
            </div>
            <div><label className="field-label">Hourly Rate ($)</label><input type="number" inputMode="decimal" value={form.hourlyRate} onChange={up("hourlyRate")} placeholder="25.00" className="field text-xl font-bold" /></div>
          </div>
        </section>

        <section>
          <button type="button" onClick={() => setCertsOpen(!certsOpen)}
            className="w-full flex items-center justify-between rounded-2xl p-4"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: "var(--brand)" }} />
              <span className="font-bold" style={{ color: "var(--text)" }}>Certifications & Compliance</span>
              {certifications.filter(c => c.name).length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-bg)", color: "var(--brand)" }}>
                  {certifications.filter(c => c.name).length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text2)" }}>Optional</span>
              {certsOpen ? <ChevronUp size={18} style={{ color: "var(--text2)" }} /> : <ChevronDown size={18} style={{ color: "var(--text2)" }} />}
            </div>
          </button>
          {certsOpen && (
            <div className="mt-3 space-y-3">
              {certifications.map((cert, i) => (
                <div key={i} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: "var(--text2)" }}>Certification {i + 1}</span>
                    <button type="button" onClick={() => removeCert(i)} className="p-1 rounded-lg" style={{ color: "var(--red)" }}><Trash2 size={16} /></button>
                  </div>
                  <div>
                    <label className="field-label">Type</label>
                    <select value={cert.name} onChange={(e) => updateCert(i, "name", e.target.value)} className="field">
                      <option value="">Select type...</option>
                      {CERT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {cert.name === "Other" && (
                      <input value={cert.customName || ""} onChange={(e) => updateCert(i, "customName", e.target.value)} placeholder="Enter certification name..." className="field mt-2" />
                    )}
                  </div>
                  <div>
                    <label className="field-label">Expiry Date</label>
                    <input type="date" value={cert.expiryDate} onChange={(e) => updateCert(i, "expiryDate", e.target.value)} className="field" />
                  </div>
                  <div>
                    <label className="field-label">Notes</label>
                    <input value={cert.notes} onChange={(e) => updateCert(i, "notes", e.target.value)} placeholder="License #, issuing body..." className="field" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCert}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold"
                style={{ border: "2px dashed var(--border)", color: "var(--brand)" }}>
                <Plus size={16} /> Add Certification
              </button>
            </div>
          )}
        </section>

        <button type="submit" disabled={saving} className="btn btn-brand w-full text-lg">
          {saving ? "Saving..." : "Add Crew Member"}
        </button>
      </form>
    </AppShell>
  );
}
