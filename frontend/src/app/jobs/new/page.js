"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createJob, getClients } from "@/lib/api";

const STATUSES = [
  { value: "bidding", label: "Bidding", desc: "Haven't won it yet" },
  { value: "active", label: "Active", desc: "Currently working" },
];

export default function NewJobPage() {
  const [form, setForm] = useState({
    jobName: "", clientName: "", clientPhone: "", clientEmail: "", clientId: "",
    address: "", bidAmount: "", status: "active", startDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientMode, setClientMode] = useState("pick"); // "pick" or "manual"

  useEffect(() => { getClients().then(setClients).catch(() => {}); }, []);
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
            {clients.length > 0 && (
              <div className="flex gap-2 mb-1">
                <button type="button" onClick={() => setClientMode("pick")}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: clientMode === "pick" ? "var(--brand)" : "var(--input)", color: clientMode === "pick" ? "#fff" : "var(--text2)" }}>
                  Pick Existing
                </button>
                <button type="button" onClick={() => { setClientMode("manual"); setForm({...form, clientName: "", clientPhone: "", clientEmail: "", clientId: ""}); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: clientMode === "manual" ? "var(--brand)" : "var(--input)", color: clientMode === "manual" ? "#fff" : "var(--text2)" }}>
                  New / Manual
                </button>
              </div>
            )}
            {clientMode === "pick" && clients.length > 0 ? (
              <div>
                <label className="field-label">Select Client</label>
                <select className="field" value={form.clientName}
                  onChange={e => {
                    const found = clients.find(cl => cl.name === e.target.value);
                    if (found) setForm({...form, clientName: found.name, clientPhone: found.phone || "", clientEmail: found.email || "", clientId: found.clientId || ""});
                    else setForm({...form, clientName: e.target.value});
                  }}>
                  <option value="">— Select a client —</option>
                  {clients.map(cl => <option key={cl.clientId} value={cl.name}>{cl.name}{cl.phone ? " · " + cl.phone : ""}</option>)}
                </select>
                {form.clientName && (
                  <div className="mt-2 p-3 rounded-xl text-sm space-y-1" style={{ background: "var(--input)" }}>
                    {form.clientPhone && <p style={{ color: "var(--text2)" }}>📞 {form.clientPhone}</p>}
                    {form.clientEmail && <p style={{ color: "var(--text2)" }}>✉️ {form.clientEmail}</p>}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div><label className="field-label">Client Name *</label><input value={form.clientName} onChange={up("clientName")} placeholder="John Smith" className="field" required /></div>
                <div><label className="field-label">Phone</label><input type="tel" value={form.clientPhone} onChange={up("clientPhone")} placeholder="(555) 123-4567" className="field" /></div>
                <div><label className="field-label">Email</label><input type="email" value={form.clientEmail} onChange={up("clientEmail")} placeholder="john@email.com" className="field" /></div>
              </>
            )}
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
