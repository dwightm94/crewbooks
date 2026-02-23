"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getJob, updateJob } from "@/lib/api";

const STATUSES = [
  { value: "bidding", label: "Bidding", desc: "Haven't won it yet" },
  { value: "active", label: "Active", desc: "Currently working" },
  { value: "complete", label: "Complete", desc: "Work finished" },
  { value: "paid", label: "Paid", desc: "Payment received" },
];

export default function EditJobPage() {
  const { jobId } = useParams();
  const [form, setForm] = useState({
    jobName: "", clientName: "", clientPhone: "", clientEmail: "",
    address: "", bidAmount: "", status: "active", startDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await getJob(jobId);
        const j = res.data || res;
        setForm({
          jobName: j.jobName || "", clientName: j.clientName || "",
          clientPhone: j.clientPhone || "", clientEmail: j.clientEmail || "",
          address: j.address || "", bidAmount: j.bidAmount ? String(j.bidAmount) : "",
          status: j.status || "active", startDate: j.startDate || "", notes: j.notes || "",
        });
      } catch (e) { setError("Could not load job"); }
      setLoading(false);
    }
    load();
  }, [jobId]);

  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      await updateJob(jobId, { ...form, bidAmount: Number(form.bidAmount) || 0 });
      router.replace(`/jobs/${jobId}`);
    } catch (e) { setError(e.message); setSaving(false); }
  };

  if (loading) return <AppShell title="Edit Job" back={`/jobs/${jobId}`}><div className="mt-10 text-center" style={{ color: "var(--text2)" }}>Loading...</div></AppShell>;

  return (
    <AppShell title="Edit Job" back={`/jobs/${jobId}`}>
      <form onSubmit={submit} className="mt-4 space-y-5">
        {error && <div className="rounded-2xl p-4 text-sm font-semibold" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>}
        <section>
          <h3 className="section-title">Job Details</h3>
          <div className="space-y-3">
            <div><label className="field-label">Job Name *</label><input value={form.jobName} onChange={up("jobName")} placeholder="Kitchen Remodel" className="field" required /></div>
            <div><label className="field-label">Bid Amount ($)</label><input type="number" inputMode="decimal" value={form.bidAmount} onChange={up("bidAmount")} placeholder="8,500" className="field text-xl font-bold" /></div>
            <div><label className="field-label">Address</label><input value={form.address} onChange={up("address")} placeholder="123 Oak Street" className="field" /></div>
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
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </AppShell>
  );
}
