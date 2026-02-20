"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createJob } from "@/lib/api";

const STATUSES = [
  { value: "bidding", label: "Bidding", desc: "Haven't won it yet" },
  { value: "active", label: "Active", desc: "Currently working" },
];

export default function NewJobPage() {
  const [form, setForm] = useState({
    jobName: "", clientName: "", clientPhone: "", clientEmail: "",
    address: "", bidAmount: "", status: "active", startDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const res = await createJob({ ...form, bidAmount: Number(form.bidAmount) || 0 });
      router.replace(`/jobs/${res.jobId || res.job?.jobId}`);
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <AppShell title="New Job" back="/jobs">
      <form onSubmit={submit} className="mt-4 space-y-5">
        {error && <div className="rounded-2xl p-4 text-sm font-semibold" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>}

        <section>
          <h3 className="section-title">Job Details</h3>
          <div className="space-y-3">
            <div><label className="field-label">Job Name *</label><input value={form.jobName} onChange={up("jobName")} placeholder="Kitchen Remodel — 123 Oak St" className="field" required /></div>
            <div><label className="field-label">Bid Amount ($)</label><input type="number" inputMode="decimal" value={form.bidAmount} onChange={up("bidAmount")} placeholder="8,500" className="field text-xl font-bold" /></div>
            <div><label className="field-label">Address</label><input value={form.address} onChange={up("address")} placeholder="123 Oak Street, Newark NJ" className="field" /></div>
          </div>
        </section>

        <section>
          <h3 className="section-title">Client Info</h3>
          <div className="space-y-3">
            <div><label className="field-label">Client Name *</label><input value={form.clientName} onChange={up("clientName")} placeholder="John Smith" className="field" required /></div>
            <div><label className="field-label">Phone</label><input type="tel" value={form.clientPhone} onChange={up("clientPhone")} placeholder="(555) 123-4567" className="field" /></div>
            <div><label className="field-label">Email</label><input type="email" value={form.clientEmail} onChange={up("clientEmail")} placeholder="john@email.com" className="field" /></div>
          </div>
        </section>

        <section>
          <h3 className="section-title">Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {STATUSES.map(s => (
              <button type="button" key={s.value} onClick={() => setForm({ ...form, status: s.value })}
                className="card text-center py-4 transition-all"
                style={{ borderColor: form.status === s.value ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                <p className="font-bold" style={{ color: form.status === s.value ? "var(--brand)" : "var(--text)" }}>{s.label}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>{s.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="section-title">Schedule</h3>
          <div><label className="field-label">Start Date</label><input type="date" value={form.startDate} onChange={up("startDate")} className="field" /></div>
        </section>

        <section>
          <h3 className="section-title">Notes</h3>
          <textarea value={form.notes} onChange={up("notes")} placeholder="Scope of work, special instructions..." className="field min-h-[120px]" rows={4} />
        </section>

        <button type="submit" disabled={saving} className="btn btn-brand w-full text-lg">
          {saving ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Create Job"}
        </button>
      </form>
    </AppShell>
  );
}
