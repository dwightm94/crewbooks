"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createComplianceDoc } from "@/lib/api";
import { Upload } from "lucide-react";

const DOC_TYPES = [
  { value: "license", label: "License", icon: "📋", desc: "Contractor, trade, or business license" },
  { value: "insurance", label: "Insurance", icon: "🛡️", desc: "General liability, workers comp, auto" },
  { value: "certification", label: "Certification", icon: "🎓", desc: "OSHA, trade certs, safety training" },
  { value: "vehicle", label: "Vehicle", icon: "🚛", desc: "Registration, inspection, DOT" },
  { value: "permit", label: "Permit", icon: "📄", desc: "Building, electrical, plumbing permits" },
];

export default function NewComplianceDocPage() {
  const [form, setForm] = useState({ docName: "", docType: "license", issuer: "", number: "", expirationDate: "", notes: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const router = useRouter();
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const payload = { ...form };
      if (file) { payload.fileName = file.name; payload.contentType = file.type; }
      const result = await createComplianceDoc(payload);
      // Upload file if presigned URL provided
      if (result.uploadUrl && file) {
        await fetch(result.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      }
      router.replace("/compliance");
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <AppShell title="Add Document" back="/compliance">
      <form onSubmit={submit} className="mt-4 space-y-5">
        {error && <div className="rounded-2xl p-4 text-sm font-semibold" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>}

        <section>
          <h3 className="section-title">Document Type</h3>
          <div className="space-y-2">
            {DOC_TYPES.map(dt => (
              <button type="button" key={dt.value} onClick={() => setForm({ ...form, docType: dt.value })}
                className="card w-full text-left transition-all"
                style={{ borderColor: form.docType === dt.value ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{dt.icon}</span>
                  <div>
                    <p className="font-bold" style={{ color: form.docType === dt.value ? "var(--brand)" : "var(--text)" }}>{dt.label}</p>
                    <p className="text-xs" style={{ color: "var(--text2)" }}>{dt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="section-title">Details</h3>
          <div className="space-y-3">
            <div><label className="field-label">Document Name *</label><input value={form.docName} onChange={up("docName")} placeholder="NJ Contractor License" className="field" required /></div>
            <div><label className="field-label">Issuer</label><input value={form.issuer} onChange={up("issuer")} placeholder="State of New Jersey" className="field" /></div>
            <div><label className="field-label">License/Policy Number</label><input value={form.number} onChange={up("number")} placeholder="LC-123456" className="field" /></div>
            <div><label className="field-label">Expiration Date</label><input type="date" value={form.expirationDate} onChange={up("expirationDate")} className="field" /></div>
          </div>
        </section>

        <section>
          <h3 className="section-title">Attach Document</h3>
          <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="card w-full text-center py-6 transition-all"
            style={{ borderStyle: "dashed", borderWidth: "2px", borderColor: file ? "var(--green)" : "var(--border)" }}>
            <Upload size={24} className="mx-auto mb-2" style={{ color: file ? "var(--green)" : "var(--muted)" }} />
            <p className="font-bold text-sm" style={{ color: file ? "var(--green)" : "var(--text2)" }}>
              {file ? file.name : "Tap to upload photo or PDF"}
            </p>
            {file && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{(file.size / 1024).toFixed(0)} KB</p>}
          </button>
        </section>

        <section>
          <h3 className="section-title">Notes</h3>
          <textarea value={form.notes} onChange={up("notes")} placeholder="Any additional notes..." className="field" rows={3} />
        </section>

        <button type="submit" disabled={saving} className="btn btn-brand w-full text-lg">
          {saving ? "Saving..." : "Add Document"}
        </button>
      </form>
    </AppShell>
  );
}
