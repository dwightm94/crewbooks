"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCrewMember, updateCrewMember } from "@/lib/api";
import { Plus, Trash2, ChevronDown, ChevronUp, ShieldCheck, Upload, X, Share2, CheckCircle2 } from "lucide-react";

const ROLES = ["Electrician", "Plumber", "Carpenter", "Laborer", "Foreman", "Apprentice", "HVAC Tech", "Painter", "Mason", "Roofer", "Other"];
const CERT_TYPES = ["OSHA 10", "OSHA 30", "Driver's License", "Forklift Certification", "First Aid/CPR", "Electrical License", "Plumbing License", "CDL", "Other"];

export default function EditCrewMemberPage() {
  const { memberId } = useParams();
  const [form, setForm] = useState({ name: "", phone: "", role: "", hourlyRate: "" });
  const [certifications, setCertifications] = useState([]);
  const [certFiles, setCertFiles] = useState({});
  const certFileRefs = useRef({});
  const [certsOpen, setCertsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [memberToken, setMemberToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await getCrewMember(memberId);
        const m = res.data || res;
        setForm({ name: m.name || "", phone: m.phone || "", role: m.role || "", hourlyRate: m.hourlyRate ? String(m.hourlyRate) : "" });
        setCertifications(m.certifications || []);
        setMemberToken(m.token || null);
        if ((m.certifications || []).length > 0) setCertsOpen(true);
      } catch (e) { setError("Could not load crew member"); }
      setLoading(false);
    }
    load();
  }, [memberId]);

  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const addCert = () => { setCertifications([...certifications, { docType: "", name: "", issuer: "", licenseNumber: "", expiryDate: "", notes: "" }]); setCertsOpen(true); };
  const removeCert = (i) => setCertifications(certifications.filter((_, idx) => idx !== i));
  const updateCert = (i, field, value) => { const u = [...certifications]; u[i] = { ...u[i], [field]: value }; setCertifications(u); };

  const copyLink = () => {
    if (!memberToken) return;
    const link = "https://crewbooksapp.com/crew-view/" + memberToken;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const submit = async (e) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      // Upload any new cert files first
      const certsWithFiles = await Promise.all(certifications.filter(c => c.name).map(async (cert, i) => {
        const file = certFiles[i];
        if (!file) return cert;
        const certId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const result = await getCertUploadUrl(memberId, file.name, file.type, certId);
        if (result.uploadUrl) {
          await fetch(result.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        }
        return { ...cert, fileUrl: result.fileUrl, fileKey: result.fileKey };
      }));
      await updateCrewMember(memberId, { ...form, hourlyRate: Number(form.hourlyRate) || 0, certifications: certsWithFiles });
      router.replace("/crew");
    } catch (e) { setError(e.message); setSaving(false); }
  };

  if (loading) return <AppShell title="Edit Crew Member" back="/crew"><div className="mt-10 text-center" style={{ color: "var(--text2)" }}>Loading...</div></AppShell>;

  return (
    <AppShell title="Edit Crew Member" back="/crew">
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
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: "License", icon: "📄", desc: "Contractor, trade, or business license" },
                        { type: "Insurance", icon: "🛡️", desc: "General liability, workers comp, auto" },
                        { type: "Certification", icon: "🏅", desc: "OSHA, trade certs, safety training" },
                        { type: "Vehicle", icon: "🚛", desc: "Registration, inspection, DOT" },
                        { type: "Permit", icon: "📋", desc: "Building, electrical, plumbing permits" },
                        { type: "Other", icon: "📁", desc: "Other document" },
                      ].map(({ type, icon, desc }) => (
                        <button type="button" key={type} onClick={() => updateCert(i, "docType", type)}
                          className="card text-left p-3 transition-all"
                          style={{ borderColor: cert.docType === type ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                          <div className="text-lg">{icon}</div>
                          <div className="font-bold text-xs mt-1" style={{ color: cert.docType === type ? "var(--brand)" : "var(--text)" }}>{type}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Document Name *</label>
                    <input value={cert.name} onChange={(e) => updateCert(i, "name", e.target.value)} placeholder="e.g. OSHA 30, CDL License" className="field" />
                  </div>
                  <div>
                    <label className="field-label">Issuer</label>
                    <input value={cert.issuer || ""} onChange={(e) => updateCert(i, "issuer", e.target.value)} placeholder="e.g. State of New Jersey, OSHA" className="field" />
                  </div>
                  <div>
                    <label className="field-label">License / Certificate Number</label>
                    <input value={cert.licenseNumber || ""} onChange={(e) => updateCert(i, "licenseNumber", e.target.value)} placeholder="e.g. LC-123456" className="field" />
                  </div>
                  <div>
                    <label className="field-label">Expiry Date</label>
                    <input type="date" value={cert.expiryDate} onChange={(e) => updateCert(i, "expiryDate", e.target.value)} className="field" />
                  </div>
                  <div>
                    <label className="field-label">Notes</label>
                    <textarea value={cert.notes} onChange={(e) => updateCert(i, "notes", e.target.value)} placeholder="Any additional notes..." className="field" rows={2} />
                  </div>
                  <div>
                    <label className="field-label">Attach Document</label>
                    <input ref={el => certFileRefs.current[i] = el} type="file" accept="image/*,.pdf"
                      onChange={e => setCertFiles(prev => ({ ...prev, [i]: e.target.files?.[0] || null }))}
                      className="hidden" />
                    <button type="button" onClick={() => certFileRefs.current[i]?.click()}
                      className="card w-full text-center py-4 transition-all"
                      style={{ borderStyle: "dashed", borderWidth: "2px", borderColor: certFiles[i] || cert.fileUrl ? "var(--green)" : "var(--border)" }}>
                      <Upload size={20} className="mx-auto mb-1" style={{ color: certFiles[i] || cert.fileUrl ? "var(--green)" : "var(--muted)" }} />
                      <p className="text-sm font-bold" style={{ color: certFiles[i] || cert.fileUrl ? "var(--green)" : "var(--text2)" }}>
                        {certFiles[i] ? certFiles[i].name : cert.fileUrl ? "File attached ✓" : "Tap to upload photo or PDF"}
                      </p>
                      {certFiles[i] && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{(certFiles[i].size / 1024).toFixed(0)} KB</p>}
                    </button>
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

        {memberToken && (
          <section>
            <h3 className="section-title">Crew View Link</h3>
            <div className="card">
              <p className="text-xs mb-3" style={{ color: "var(--text2)" }}>Share this link with the crew member so they can view their schedule and clock in/out.</p>
              <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background: "var(--input)", wordBreak: "break-all" }}>
                <p className="text-xs font-mono flex-1" style={{ color: "var(--text2)" }}>crewbooksapp.com/crew-view/{memberToken}</p>
              </div>
              <button type="button" onClick={copyLink}
                className="btn w-full"
                style={{ background: copied ? "var(--green-bg, #d1fae5)" : "var(--input)", color: copied ? "var(--green)" : "var(--brand)" }}>
                {copied ? <><CheckCircle2 size={18} /> Copied!</> : <><Share2 size={18} /> Copy Link</>}
              </button>
            </div>
          </section>
        )}

        <button type="submit" disabled={saving} className="btn btn-brand w-full text-lg">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </AppShell>
  );
}
